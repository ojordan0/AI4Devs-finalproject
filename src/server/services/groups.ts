import { and, asc, eq, sql } from "drizzle-orm";

import type { Language } from "../../shared/languages";
import { fieldLimits } from "../../shared/limits";
import type { Clock } from "../clock";
import type { Database } from "../db/client";
import { groups, lists, memberships, users } from "../db/schema";
import { translator } from "../translate";
import { type MembershipType, requireMemberAccess } from "./access";
import { personName } from "./people";

// Groups and memberships (FR-05, FR-07, FR-08): getting started (BR-06), the
// user's groups, and who is in a group. Every read starts from the user's own
// active memberships, so nothing about another group is read (BR-12, BR-13).

export type GroupSummary = {
  id: string;
  name: string;
  type: MembershipType;
  isOwner: boolean;
};

export type GroupDetails = {
  id: string;
  name: string;
  members: { id: string; name: string; isOwner: boolean }[];
  buyers: { id: string; name: string }[];
};

/** The groups where the user has an active membership, by name. */
export async function listGroups(
  db: Database,
  userId: string,
): Promise<GroupSummary[]> {
  const rows = await db
    .select({
      id: groups.id,
      name: groups.name,
      type: memberships.type,
      ownerId: groups.ownerId,
    })
    .from(memberships)
    .innerJoin(groups, eq(groups.id, memberships.groupId))
    .where(
      and(eq(memberships.userId, userId), eq(memberships.status, "active")),
    )
    .orderBy(asc(groups.name), asc(groups.id));

  return rows.map(({ ownerId, ...group }) => ({
    ...group,
    isOwner: ownerId === userId,
  }));
}

/**
 * The group with its active members and buyers. Only members can view them
 * (BR-12): a buyer gets ForbiddenError, and anyone else NotAvailableError,
 * exactly as for a group that doesn't exist (BR-13).
 */
export async function getGroup(
  db: Database,
  userId: string,
  groupId: string,
  language: Language,
): Promise<GroupDetails> {
  await requireMemberAccess(db, userId, groupId);

  const [group] = await db
    .select({ id: groups.id, name: groups.name, ownerId: groups.ownerId })
    .from(groups)
    .where(eq(groups.id, groupId));
  if (!group) throw new Error(`Group ${groupId} has a member but no row.`);

  const people = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      deletedAt: users.deletedAt,
      type: memberships.type,
    })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(
      and(eq(memberships.groupId, groupId), eq(memberships.status, "active")),
    )
    .orderBy(asc(memberships.joinedAt), asc(users.id));

  const named = people.map((person) => ({
    id: person.id,
    type: person.type,
    name: personName(person, language),
  }));

  return {
    id: group.id,
    name: group.name,
    members: named
      .filter((person) => person.type === "member")
      .map(({ id, name }) => ({ id, name, isOwner: id === group.ownerId })),
    buyers: named
      .filter((person) => person.type === "buyer")
      .map(({ id, name }) => ({ id, name })),
  };
}

const characters = (text: string) => Array.from(text);

/**
 * The first word of the user's name, or the part of their email before the @
 * when the name is empty.
 */
export function firstNameOf(name: string | null, email: string | null) {
  const [first] = (name ?? "").trim().split(/\s+/u);
  if (first) return first;
  return (email ?? "").split("@")[0]?.trim() ?? "";
}

/**
 * "{First name}'s group" in the user's language, with the first name shortened
 * by whole characters until the name fits the group name limit (BR-32).
 */
export function startingGroupName(firstName: string, language: Language) {
  const t = translator(language, "groups");
  let letters = characters(firstName);
  let name = t("startingGroupName", { firstName: letters.join("") });
  while (characters(name).length > fieldLimits.name.max && letters.length) {
    letters = letters.slice(0, -1);
    name = t("startingGroupName", { firstName: letters.join("") });
  }
  return name;
}

export type StartedGroup = { groupId: string; listId: string };

/**
 * Getting started (BR-06): gives a user who has never had a membership a group
 * they own and a first list, named in their language. Does nothing, and
 * returns null, for a user who has or had a membership, so it can safely run
 * again. The user's row is locked first, so two calls run one after the other.
 */
export async function startWithoutInvitation(
  db: Database,
  clock: Clock,
  userId: string,
  language: Language,
): Promise<StartedGroup | null> {
  return db.transaction(async (tx) => {
    const [user] = await tx
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .for("update");
    if (!user) throw new Error(`User ${userId} doesn't exist.`);

    const [existing] = await tx
      .select({ one: sql`1` })
      .from(memberships)
      .where(eq(memberships.userId, userId))
      .limit(1);
    if (existing) return null;

    const now = clock();
    const [group] = await tx
      .insert(groups)
      .values({
        name: startingGroupName(firstNameOf(user.name, user.email), language),
        ownerId: userId,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: groups.id });
    if (!group) throw new Error("The group insert returned no row.");

    await tx.insert(memberships).values({
      groupId: group.id,
      userId,
      type: "member",
      joinedAt: now,
    });

    const [list] = await tx
      .insert(lists)
      .values({
        groupId: group.id,
        name: translator(language, "groups")("startingListName"),
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: lists.id });
    if (!list) throw new Error("The list insert returned no row.");

    return { groupId: group.id, listId: list.id };
  });
}

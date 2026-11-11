import { and, eq, inArray, type SQL } from "drizzle-orm";

import type { Language } from "../../shared/languages";
import type { Database } from "../db/client";
import { items, lists, memberships } from "../db/schema";
import { type ItemRow, type ItemView, selectItems, toView } from "./items";

// What a user can buy and what they bought, across all their groups (FR-21):
// To buy and My purchases. Each item comes with its list and group, which the
// screens filter and group by (design decision 4 of the T-11 change).

export type BuyerItemView = ItemView & {
  list: { id: string; name: string };
  group: { id: string; name: string };
};

export type ToBuyFilters = { groupId?: string; listId?: string };

function toBuyerView(row: ItemRow, language: Language): BuyerItemView {
  return {
    ...toView(row, language),
    list: { id: row.item.listId, name: row.listName },
    group: { id: row.groupId, name: row.groupName },
  };
}

/**
 * Pending items in every group where the user's membership is active, as a
 * member or a buyer (docs/02-UX-DESIGN.md §2.2), optionally of one group or
 * list. An ID the user can't see matches nothing (BR-13).
 */
export async function listToBuy(
  db: Database,
  userId: string,
  filters: ToBuyFilters,
  language: Language,
): Promise<BuyerItemView[]> {
  const myGroups = db
    .select({ groupId: memberships.groupId })
    .from(memberships)
    .where(
      and(eq(memberships.userId, userId), eq(memberships.status, "active")),
    );
  const conditions: SQL[] = [
    eq(items.status, "pending"),
    inArray(lists.groupId, myGroups),
  ];
  if (filters.groupId) conditions.push(eq(lists.groupId, filters.groupId));
  if (filters.listId) conditions.push(eq(items.listId, filters.listId));
  const rows = await selectItems(db, and(...conditions));
  return rows.map((row) => toBuyerView(row, language));
}

/**
 * The items the user reserved or purchased, the same ones that give them the
 * My purchases tab (FR-08). There is no membership condition, so purchased
 * items stay after the user left the group, until they ship them (BR-11).
 */
export async function listPurchases(
  db: Database,
  userId: string,
  language: Language,
): Promise<BuyerItemView[]> {
  const rows = await selectItems(
    db,
    and(
      eq(items.buyerId, userId),
      inArray(items.status, ["reserved", "purchased"]),
    ),
  );
  return rows.map((row) => toBuyerView(row, language));
}

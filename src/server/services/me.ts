import { and, eq, exists, inArray } from "drizzle-orm";

import type { Language } from "../../shared/languages";
import type { Database } from "../db/client";
import { items, users } from "../db/schema";
import { NotAvailableError } from "./errors";
import { listGroups } from "./groups";
import type { MembershipType } from "./access";

// The signed-in user, their memberships, and whether they have purchases, which
// together decide the screens they see (FR-08).

export type CurrentUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  language: Language | null;
  whatsappNumber: string | null;
  receiveEmails: boolean;
  onboarded: boolean;
  hasPurchases: boolean;
  memberships: {
    groupId: string;
    groupName: string;
    type: MembershipType;
    isOwner: boolean;
  }[];
};

export async function getCurrentUser(
  db: Database,
  userId: string,
): Promise<CurrentUser> {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      language: users.language,
      whatsappNumber: users.whatsappNumber,
      receiveEmails: users.receiveEmails,
      onboardedAt: users.onboardedAt,
      hasPurchases: exists(
        db
          .select({ id: items.id })
          .from(items)
          .where(
            and(
              eq(items.buyerId, users.id),
              inArray(items.status, ["reserved", "purchased"]),
            ),
          ),
      ),
    })
    .from(users)
    .where(eq(users.id, userId));
  // A session belongs to an existing user; a deleted account has no sessions.
  if (!user) throw new NotAvailableError();

  const groups = await listGroups(db, userId);
  const { onboardedAt, ...account } = user;
  return {
    ...account,
    hasPurchases: Boolean(account.hasPurchases),
    onboarded: onboardedAt !== null,
    memberships: groups.map((group) => ({
      groupId: group.id,
      groupName: group.name,
      type: group.type,
      isOwner: group.isOwner,
    })),
  };
}

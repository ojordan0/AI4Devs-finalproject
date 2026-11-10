// Which tabs a user sees (FR-08, docs/02-UX-DESIGN.md, section 2.2). The
// interface and the server decide it with this one function, from the same
// data that GET /me returns.

export const TABS = ["lists", "people", "group", "toBuy", "purchases"] as const;

export type Tab = (typeof TABS)[number];

export type TabInput = {
  memberships: readonly { type: "member" | "buyer" }[];
  /** The user is the buyer of a reserved or purchased item. */
  hasPurchases: boolean;
};

/**
 * The user's tabs in display order. Lists, People, and Group for a member of
 * any group; To buy for a buyer in any group; My purchases for a buyer, or for
 * anyone with purchases. No tabs means the user isn't in any group yet.
 */
export function visibleTabs({ memberships, hasPurchases }: TabInput): Tab[] {
  const isMember = memberships.some(({ type }) => type === "member");
  const isBuyer = memberships.some(({ type }) => type === "buyer");
  return TABS.filter((tab) => {
    switch (tab) {
      case "lists":
      case "people":
      case "group":
        return isMember;
      case "toBuy":
        return isBuyer;
      case "purchases":
        return isBuyer || hasPurchases;
    }
  });
}

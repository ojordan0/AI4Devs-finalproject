import { describe, expect, it } from "vitest";

import {
  chooseCurrentGroup,
  mainScreenPath,
  visibleTabs,
} from "../../src/shared/navigation";

// The tabs in docs/02-UX-DESIGN.md, section 2.2 (FR-08).

const member = { type: "member" } as const;
const buyer = { type: "buyer" } as const;

describe("visibleTabs", () => {
  it("AC-24 a user who is only a buyer gets only To buy and My purchases", () => {
    expect(
      visibleTabs({ memberships: [buyer, buyer], hasPurchases: false }),
    ).toEqual(["toBuy", "purchases"]);
    expect(visibleTabs({ memberships: [buyer], hasPurchases: true })).toEqual([
      "toBuy",
      "purchases",
    ]);
  });

  it("FR-08 a member who doesn't buy gets Lists, People, and Group", () => {
    expect(visibleTabs({ memberships: [member], hasPurchases: false })).toEqual(
      ["lists", "people", "group"],
    );
  });

  it("FR-08 a member who reserves gets My purchases too", () => {
    expect(visibleTabs({ memberships: [member], hasPurchases: true })).toEqual([
      "lists",
      "people",
      "group",
      "purchases",
    ]);
  });

  it("FR-08 a member in one group and buyer in another gets every tab", () => {
    expect(
      visibleTabs({ memberships: [buyer, member], hasPurchases: false }),
    ).toEqual(["lists", "people", "group", "toBuy", "purchases"]);
  });

  it("BR-11 a user with no group but purchases to ship gets only My purchases", () => {
    expect(visibleTabs({ memberships: [], hasPurchases: true })).toEqual([
      "purchases",
    ]);
  });

  it("FR-08 a user with no group gets no tabs", () => {
    expect(visibleTabs({ memberships: [], hasPurchases: false })).toEqual([]);
  });
});

describe("mainScreenPath", () => {
  it("FR-08 the main screen follows the tabs", () => {
    const tabsOf = (memberships: { type: "member" | "buyer" }[]) =>
      visibleTabs({ memberships, hasPurchases: false });
    expect(mainScreenPath(tabsOf([member]))).toBe("/lists");
    expect(mainScreenPath(tabsOf([buyer]))).toBe("/to-buy");
    expect(mainScreenPath(tabsOf([]))).toBe("/profile");
    expect(
      mainScreenPath(visibleTabs({ memberships: [], hasPurchases: true })),
    ).toBe("/purchases");
  });
});

describe("chooseCurrentGroup", () => {
  const garcia = { groupId: "b-garcia", groupName: "García Group" };
  const perez = { groupId: "a-perez", groupName: "Pérez Group" };

  it("BR-12 a remembered group the user no longer belongs to is ignored", () => {
    expect(chooseCurrentGroup([perez, garcia], "another-group")).toBe(garcia);
    expect(chooseCurrentGroup([], garcia.groupId)).toBeUndefined();
  });

  it("T-05 the remembered group is current while the user is a member", () => {
    expect(chooseCurrentGroup([garcia, perez], perez.groupId)).toBe(perez);
  });

  it("T-05 with nothing remembered, the first group by name is current", () => {
    expect(chooseCurrentGroup([perez, garcia], undefined)).toBe(garcia);
  });
});

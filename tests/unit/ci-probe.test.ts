import { expect, it } from "vitest";

it("deliberately fails to prove the check fails", () => {
  expect(1).toBe(2);
});

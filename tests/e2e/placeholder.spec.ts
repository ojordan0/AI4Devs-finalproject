import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import messages from "../../src/i18n/es.json";

test("the placeholder page shows its text from the message file", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page).toHaveTitle(messages.placeholder.title);
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    messages.placeholder.title,
  );
  await expect(page.getByText(messages.placeholder.message)).toBeVisible();
});

test("the placeholder page has no automated accessibility violations", async ({
  page,
}) => {
  await page.goto("/");

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  expect(results.violations).toEqual([]);
});

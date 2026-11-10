import { expect, test } from "@playwright/test";

import { expectNoAccessibilityViolations, messages } from "./support";

// Welcome (docs/02-UX-DESIGN.md, section 2.3, screen 1) and where a signed-out
// person is sent.

test.describe("Welcome in a browser that prefers English", () => {
  test.use({ locale: "en-US" });

  test("FR-37 Welcome follows the browser's language", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      messages.en.welcome.title,
    );
    await expect(page.getByText(messages.en.welcome.tagline)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: messages.en.devSignIn.title }),
    ).toBeVisible();
  });

  test("FR-37 choosing a language on Welcome switches the screen", async ({
    page,
  }) => {
    await page.goto("/");

    await page
      .getByText(messages.es.common.languageNames.es, { exact: true })
      .click();

    await expect(page.getByText(messages.es.welcome.tagline)).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(
      page.getByRole("radio", { name: messages.es.common.languageNames.es }),
    ).toBeChecked();

    // The choice is kept until onboarding.
    await page.reload();
    await expect(page.getByText(messages.es.welcome.tagline)).toBeVisible();
  });

  test("T-04 Welcome has no accessibility violations in English", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByText(messages.en.welcome.tagline)).toBeVisible();
    await expectNoAccessibilityViolations(page);
  });
});

test.describe("Welcome in a browser that prefers Spanish", () => {
  test.use({ locale: "es-ES" });

  test("Page text comes from the message files", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(messages.es.common.appName);
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      messages.es.welcome.title,
    );
    await expect(page.getByText(messages.es.welcome.tagline)).toBeVisible();
    await expect(page.getByLabel(messages.es.devSignIn.email)).toBeVisible();
  });

  test("T-04 Welcome has no accessibility violations in Spanish", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByText(messages.es.welcome.tagline)).toBeVisible();
    await expectNoAccessibilityViolations(page);
  });

  test("T-04 a signed-out person is sent to Welcome", async ({ page }) => {
    for (const path of ["/profile", "/lists", "/onboarding"]) {
      await page.goto(path);
      await expect(page).toHaveURL("/");
      await expect(page.getByText(messages.es.welcome.tagline)).toBeVisible();
    }
  });
});

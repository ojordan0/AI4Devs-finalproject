import { randomUUID } from "node:crypto";

import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

import en from "../../src/i18n/en.json";
import es from "../../src/i18n/es.json";

// Helpers for the browser tests. Each scenario signs up its own users through
// the development-only sign-in, so the seed users never change
// (docs/07-SECURITY-AND-TESTING.md, sections 2.3 and 2.4).

export const messages = { en, es } as const;

export type Language = keyof typeof messages;

/** An email no other scenario uses. */
export function newEmail(): string {
  return `e2e-${randomUUID()}@example.com`;
}

function appOrigin(): string {
  const baseURL = test.info().project.use.baseURL;
  if (!baseURL) throw new Error("playwright.config.ts sets no baseURL.");
  return new URL(baseURL).origin;
}

/** Changes carry the app's own origin, as the browser sends it (docs/07-SECURITY-AND-TESTING.md, section 1). */
function sameOrigin() {
  return { origin: appOrigin() };
}

/** The language chosen on Welcome, as its selector keeps it. */
export async function chooseLanguage(page: Page, language: Language) {
  await page
    .context()
    .addCookies([{ name: "language", value: language, url: appOrigin() }]);
}

/** Signs the page's browser in as a new or existing user, as the Welcome form does. */
export async function signInAs(page: Page, email = newEmail()) {
  const response = await page.request.post("/api/auth/dev/sign-in", {
    data: { email },
    headers: sameOrigin(),
  });
  expect(response.ok()).toBe(true);
  return email;
}

/** Signs up a new user and completes onboarding through the API. */
export async function signUpOnboarded(
  page: Page,
  { language = "es" as Language, whatsappNumber = "+12025550123" } = {},
) {
  const email = await signInAs(page);
  const response = await page.request.post("/api/v1/me/onboarding", {
    data: { language, whatsappNumber, acceptsTerms: true },
    headers: sameOrigin(),
  });
  expect(response.ok()).toBe(true);
  return email;
}

/** The signed-in user, as GET /me returns them. */
export async function readMe(page: Page) {
  const response = await page.request.get("/api/v1/me");
  expect(response.ok()).toBe(true);
  return response.json();
}

/** Fails with the list of violations when the automated WCAG 2.1 AA checks find any. */
export async function expectNoAccessibilityViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(
    results.violations.map(({ id, nodes }) => ({
      id,
      targets: nodes.map((node) => node.target),
    })),
  ).toEqual([]);
}

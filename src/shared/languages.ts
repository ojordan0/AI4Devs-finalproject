// The languages the product ships in (FR-37).

export const LANGUAGES = ["es", "en"] as const;

export type Language = (typeof LANGUAGES)[number];

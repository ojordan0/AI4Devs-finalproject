import type en from "./en.json";

// Lets TypeScript check message keys against the English file.
declare module "next-intl" {
  interface AppConfig {
    Messages: typeof en;
    Locale: "es" | "en";
  }
}

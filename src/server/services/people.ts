import type { Language } from "../../shared/languages";
import { translator } from "../translate";

// How people are named wherever the app shows them.

/** The user's name, or "Former user" when their account was deleted (BR-05). */
export function personName(name: string | null, language: Language): string {
  return name ?? translator(language, "people")("formerUser");
}

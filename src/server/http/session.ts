// How the route wrapper learns who is signed in. T-04 replaces the placeholder
// with a reader backed by Better Auth; tests pass their own reader.

export type Language = "es" | "en";

export type SessionUser = {
  id: string;
  /** Null until the user picks a language during onboarding. */
  language: Language | null;
  onboarded: boolean;
};

/** Returns the signed-in user for a request, or null when there is no valid session. */
export type SessionReader = (headers: Headers) => Promise<SessionUser | null>;

/** Until sign-in exists, no request has a session, so protected endpoints answer 401. */
export const noSessionReader: SessionReader = async () => null;

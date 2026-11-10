import { routeDefinition } from "@/server/http/route";
import { meSchema } from "@/server/http/schemas";
import { getCurrentUser } from "@/server/services/me";

// The current user (docs/05-API.md, section 2).

export const getMe = routeDefinition({
  method: "GET",
  path: "/me",
  summary:
    "Current user, memberships, and onboarding state. Also available before onboarding is complete.",
  response: meSchema,
  handler: async (_input, { db, user }) => getCurrentUser(db, user.id),
});

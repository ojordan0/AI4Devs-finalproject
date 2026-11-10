import { defineRoute } from "@/server/http/route";

import { getMe } from "./definitions";

export const GET = defineRoute(getMe);

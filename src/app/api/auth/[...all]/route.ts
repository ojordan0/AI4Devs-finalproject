import { getAuth } from "@/server/auth";

// Better Auth's endpoints under /api/auth (docs/05-API.md, section 2): Google
// sign-in and its callback, the session, sign-out, and, locally only, the
// development sign-in.

const handle = (request: Request) => getAuth().handler(request);

export const GET = handle;
export const POST = handle;

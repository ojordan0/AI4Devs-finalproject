import { type NextRequest, NextResponse } from "next/server";

import { pageContentSecurityPolicy } from "./server/http/security-headers";

// Gives each page request its own nonce and the Content Security Policy that
// allows only scripts carrying it (docs/07-SECURITY-AND-TESTING.md, section 1).
// Next.js reads the policy from the request headers and adds the nonce to its
// own scripts. API responses set their own policy in the route wrapper.

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const policy = pageContentSecurityPolicy(nonce, {
    development: process.env.NODE_ENV === "development",
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", policy);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", policy);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api/|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};

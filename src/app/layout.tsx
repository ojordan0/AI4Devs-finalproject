import type { Metadata } from "next";
import { connection } from "next/server";
import type { ReactNode } from "react";

import messages from "@/i18n/es.json";

export const metadata: Metadata = {
  title: messages.placeholder.title,
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Pages render per request, so Next.js can mark its scripts with the nonce
  // that src/proxy.ts puts in the Content Security Policy.
  await connection();
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

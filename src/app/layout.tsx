import type { Metadata } from "next";
import type { ReactNode } from "react";

import messages from "@/i18n/es.json";

export const metadata: Metadata = {
  title: messages.placeholder.title,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

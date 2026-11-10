import type { ReactNode } from "react";

import { requireOnboardedUser } from "./require-user";

// Screens for a signed-in user who has completed onboarding. Anyone else goes to
// Welcome or One last step (design decision 5 of the T-04 change). The header
// and navigation come with T-05.
export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireOnboardedUser();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[640px] flex-col gap-6 px-4 py-8 md:px-8">
      {children}
    </main>
  );
}

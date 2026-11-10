import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { getSessionUser } from "@/server/auth";
import type { Language } from "@/shared/languages";
import { browserRegion } from "@/shared/phone";

import { OnboardingForm } from "./onboarding-form";

// One last step (docs/02-UX-DESIGN.md, section 2.3, screen 2; FR-02, FR-03).
// Only for a signed-in user who hasn't completed onboarding.

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("onboarding");
  return { title: t("title") };
}

export default async function OnboardingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  if (user.onboarded) redirect("/lists");

  const t = await getTranslations("onboarding");
  // The language chosen on Welcome, or the browser's (AC-98).
  const language = (await getLocale()) as Language;
  const defaultCountry = browserRegion(
    (await headers()).get("accept-language"),
  );

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[640px] flex-col gap-6 px-4 py-8 md:px-8">
      <header className="flex flex-col gap-2 text-center">
        <h1 className="text-headline-xl-mobile md:text-headline-xl font-bold">
          {t("title")}
        </h1>
        <p className="text-body-xl text-muted-foreground">{t("intro")}</p>
      </header>
      <OnboardingForm language={language} defaultCountry={defaultCountry} />
    </main>
  );
}

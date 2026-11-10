import { ShoppingBagIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import {
  devSignInAvailable,
  getSessionUser,
  googleSignInAvailable,
} from "@/server/auth";

import { mainScreenOf } from "../main-screen";
import { WelcomeActions } from "./welcome-actions";
import { WelcomeLanguage } from "./welcome-language";

// Welcome (docs/02-UX-DESIGN.md, section 2.3, screen 1): the product name, a
// language selector, and Continue with Google. A signed-in user goes on to
// onboarding or to their main screen (design decision 4 of the T-05 change).

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getSessionUser();
  if (user) {
    redirect(user.onboarded ? await mainScreenOf(user.id) : "/onboarding");
  }

  const t = await getTranslations("welcome");
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[640px] flex-col justify-center gap-6 px-4 py-8 md:px-8">
      <WelcomeLanguage />
      <section className="border-border bg-card shadow-card flex flex-col items-center gap-6 rounded-xl border-[1.5px] p-6 text-center">
        <div className="bg-primary text-primary-foreground flex size-24 items-center justify-center rounded-xl">
          <ShoppingBagIcon className="size-12" aria-hidden />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-headline-xl-mobile md:text-headline-xl font-bold">
            {t("title")}
          </h1>
          <p className="text-body-xl text-muted-foreground">{t("tagline")}</p>
        </div>
        <WelcomeActions
          google={googleSignInAvailable()}
          devSignIn={devSignInAvailable()}
          signInError={Boolean(error)}
        />
      </section>
    </main>
  );
}

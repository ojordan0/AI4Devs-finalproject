import { ListChecksIcon, UserIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { db } from "@/server/db/client";
import { listLists } from "@/server/services/lists";
import { getCurrentUser } from "@/server/services/me";

import { requireOnboardedUser } from "../require-user";

// Where a user lands after onboarding until T-10 builds Lists (design decision
// 5 of the T-04 change): the first list of their first group.

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("lists");
  return { title: t("title") };
}

async function firstList(userId: string) {
  const me = await getCurrentUser(db, userId);
  const [membership] = me.memberships;
  if (!membership) return { group: undefined, list: undefined };
  const [list] = await listLists(db, userId, membership.groupId);
  return { group: membership.groupName, list };
}

export default async function ListsPage() {
  const t = await getTranslations("lists");
  const user = await requireOnboardedUser();
  const { group, list } = await firstList(user.id);

  return (
    <>
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-headline-lg font-bold">{t("title")}</h1>
        <Button asChild variant="secondary">
          <Link href="/profile">
            <UserIcon aria-hidden />
            {t("profile")}
          </Link>
        </Button>
      </header>
      <section className="border-border bg-card shadow-card flex flex-col gap-3 rounded-xl border-[1.5px] p-6">
        {group === undefined ? (
          <>
            <p className="text-body-xl font-medium">{t("notInGroup")}</p>
            <p className="text-body-lg text-muted-foreground">
              {t("askForInvitation")}
            </p>
          </>
        ) : list === undefined ? (
          <p className="text-body-xl">{t("noLists")}</p>
        ) : (
          <>
            <p className="text-body-md text-muted-foreground">{group}</p>
            <h2 className="text-headline-md flex items-center gap-2 font-semibold">
              <ListChecksIcon className="text-primary size-6" aria-hidden />
              {list.name}
            </h2>
            <p className="text-body-lg text-muted-foreground">
              {t("comingSoon")}
            </p>
          </>
        )}
      </section>
    </>
  );
}

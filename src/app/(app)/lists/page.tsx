import { ListChecksIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { db } from "@/server/db/client";
import { listLists } from "@/server/services/lists";

import { requireTab } from "../shell-data";

// Where a user lands after onboarding until T-10 builds Lists (design decision
// 5 of the T-04 change): the first list of the current group (design decision
// 6 of the T-05 change).

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("lists");
  return { title: t("title") };
}

export default async function ListsPage() {
  const t = await getTranslations("lists");
  const { user, currentGroup } = await requireTab("lists");
  // Members always have a current group: the Lists tab requires a member
  // group, and the current group is one of them.
  const [list] = currentGroup
    ? await listLists(db, user.id, currentGroup.groupId)
    : [];

  return (
    <>
      <h1 className="text-headline-xl-mobile md:text-headline-xl font-bold">
        {t("title")}
      </h1>
      <section className="border-border bg-card shadow-card flex flex-col gap-3 rounded-xl border-[1.5px] p-6">
        {list === undefined ? (
          <p className="text-body-xl">{t("noLists")}</p>
        ) : (
          <>
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

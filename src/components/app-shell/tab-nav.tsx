"use client";

import { ShoppingBagIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { cn } from "@/components/ui/utils";
import { type Tab, TAB_PATHS } from "@/shared/navigation";

import { TAB_ICONS } from "./tab-icons";

// The user's tabs (FR-08): one navigation element that is a bottom bar below
// 768px and a left sidebar from 768px (design decision 2 of the T-05 change).
// The current tab is marked with color, weight, an indicator bar, and
// aria-current, so color is never the only cue. With five tabs on a 360px
// screen, long names hyphenate onto two lines (text stays at 16px).

function isCurrent(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function TabNav({ tabs }: { tabs: readonly Tab[] }) {
  const pathname = usePathname();
  const tTabs = useTranslations("tabs");
  const tShell = useTranslations("shell");
  const tCommon = useTranslations("common");

  return (
    <nav
      aria-label={tShell("navigation")}
      className="border-border bg-card shadow-floating fixed inset-x-0 bottom-0 z-40 border-t-[1.5px] pb-[env(safe-area-inset-bottom)] md:inset-y-0 md:right-auto md:left-0 md:w-[272px] md:border-t-0 md:border-r-[1.5px] md:pb-0 md:shadow-none"
    >
      <p className="text-headline-md hidden items-center gap-2 px-6 pt-6 pb-4 font-bold md:flex">
        <ShoppingBagIcon className="text-primary size-7" aria-hidden />
        {tCommon("appName")}
      </p>
      <ul className="flex md:flex-col md:gap-1 md:px-3">
        {tabs.map((tab) => {
          const path = TAB_PATHS[tab];
          const current = isCurrent(pathname, path);
          const Icon = TAB_ICONS[tab];
          return (
            <li key={tab} className="min-w-0 flex-1 md:flex-none">
              <Link
                href={path}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "text-body-md focus-visible:ring-ring relative flex min-h-16 flex-col items-center justify-center gap-1 px-1 py-2 text-center leading-tight break-words hyphens-auto outline-none focus-visible:ring-2 focus-visible:ring-inset md:min-h-12 md:flex-row md:justify-start md:gap-3 md:rounded-lg md:px-4 md:text-left md:focus-visible:ring-offset-2",
                  current
                    ? "text-primary md:bg-accent font-bold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground font-medium",
                )}
              >
                {current && (
                  <span
                    aria-hidden
                    className="bg-primary absolute inset-x-3 top-0 h-1 rounded-b-sm md:inset-x-auto md:inset-y-2 md:left-0 md:h-auto md:w-1 md:rounded-r-sm md:rounded-bl-none"
                  />
                )}
                <Icon className="size-6 shrink-0" aria-hidden />
                <span>{tTabs(tab)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

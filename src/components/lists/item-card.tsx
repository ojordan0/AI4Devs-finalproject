import Link from "next/link";
import { useTranslations } from "next-intl";

import { cn } from "@/components/ui/utils";
import type { ItemView } from "@/server/services/items";

import { ItemStatusChip } from "./status-chip";

// One item on Lists (docs/02-UX-DESIGN.md, section 2.4): its name, who it is
// for, its quantity, and its status, opening its page. The open item, beside
// the list on desktop, has the selected border (DESIGN.md, Border Hierarchy).

export function ItemCard({
  item,
  userId,
  open,
}: {
  item: ItemView;
  userId: string;
  open: boolean;
}) {
  const t = useTranslations("item");
  return (
    <li>
      <Link
        href={`/items/${item.id}`}
        aria-current={open ? "page" : undefined}
        className={cn(
          "bg-card shadow-card hover:bg-muted focus-visible:ring-ring flex flex-col gap-2 rounded-lg p-4 outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          open ? "border-primary border-2" : "border-border border-[1.5px]",
        )}
      >
        <span className="text-body-xl font-semibold [overflow-wrap:anywhere]">
          {item.name}
        </span>
        <span className="text-body-md text-muted-foreground flex flex-wrap gap-x-3">
          {item.recipient && (
            <span className="[overflow-wrap:anywhere]">
              {t("for", { name: item.recipient.name })}
            </span>
          )}
          <span>{t("quantity", { count: item.quantity })}</span>
        </span>
        <ItemStatusChip item={item} userId={userId} className="self-start" />
      </Link>
    </li>
  );
}

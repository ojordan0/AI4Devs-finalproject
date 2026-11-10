"use client";

import { ChevronRightIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useId, useState } from "react";

import { cn } from "@/components/ui/utils";
import type { ItemView } from "@/server/services/items";
import {
  applyFilters,
  arrangeItems,
  filterChoices,
  type Filters,
  NO_FILTERS,
} from "@/shared/items";

import { ItemCard } from "./item-card";

// The list's items with the person and status filters (docs/02-UX-DESIGN.md,
// section 2.4; design decision 3). Filters are kept here, over the loaded
// list, and start over when the list changes, since the page keys this by
// list. Shipped items are in a collapsed section at the end.

function Chip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "text-label-lg focus-visible:ring-ring inline-flex min-h-12 shrink-0 items-center gap-1.5 rounded-full px-4 font-semibold whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        pressed
          ? "border-primary bg-accent text-accent-foreground border-2"
          : "border-border bg-card text-foreground hover:bg-muted border-[1.5px]",
      )}
    >
      {children}
    </button>
  );
}

function ChipRow({ label, children }: { label: string; children: ReactNode }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <span id={id} className="text-body-md text-muted-foreground font-medium">
        {label}
      </span>
      <div
        role="group"
        aria-labelledby={id}
        className="-mx-1 flex gap-2 overflow-x-auto px-1 py-1"
      >
        {children}
      </div>
    </div>
  );
}

export function FilteredItems({
  items,
  userId,
  openItemId,
}: {
  items: readonly ItemView[];
  userId: string;
  openItemId?: string;
}) {
  const t = useTranslations("lists");
  const tStatus = useTranslations("status");
  const locale = useLocale();
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [shippedOpen, setShippedOpen] = useState(false);
  const shippedId = useId();

  const choices = filterChoices(items, locale);
  const { open, shipped } = arrangeItems(applyFilters(items, filters));
  const showShipped = shippedOpen || filters.status === "shipped";

  function setFilter(next: Partial<Filters>) {
    setFilters((current) => ({ ...current, ...next }));
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <ChipRow label={t("byPerson")}>
          <Chip
            pressed={filters.person === "all"}
            onClick={() => setFilter({ person: "all" })}
          >
            {t("all")}
          </Chip>
          {choices.people.map(({ id, name }) => (
            <Chip
              key={id}
              pressed={filters.person === id}
              onClick={() => setFilter({ person: id })}
            >
              {name}
            </Chip>
          ))}
          {choices.hasNoPerson && (
            <Chip
              pressed={filters.person === "none"}
              onClick={() => setFilter({ person: "none" })}
            >
              {t("noPerson")}
            </Chip>
          )}
        </ChipRow>
        <ChipRow label={t("byStatus")}>
          <Chip
            pressed={filters.status === "all"}
            onClick={() => setFilter({ status: "all" })}
          >
            {t("all")}
          </Chip>
          {choices.statuses.map(({ status, count }) => (
            <Chip
              key={status}
              pressed={filters.status === status}
              onClick={() => setFilter({ status })}
            >
              {tStatus(status)}
              <span className="text-muted-foreground font-medium">
                ({count})
              </span>
            </Chip>
          ))}
        </ChipRow>
      </div>

      {open.length > 0 && (
        <ul className="flex flex-col gap-3">
          {open.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              userId={userId}
              open={item.id === openItemId}
            />
          ))}
        </ul>
      )}

      {shipped.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2>
            <button
              type="button"
              aria-expanded={showShipped}
              aria-controls={shippedId}
              onClick={() => setShippedOpen(!showShipped)}
              className="text-headline-md hover:bg-muted focus-visible:ring-ring -ml-2 flex min-h-12 items-center gap-2 rounded-lg px-2 font-semibold outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              <ChevronRightIcon
                className={cn(
                  "size-6 transition-transform motion-reduce:transition-none",
                  showShipped && "rotate-90",
                )}
                aria-hidden
              />
              {t("shipped", { count: shipped.length })}
            </button>
          </h2>
          <ul
            id={shippedId}
            hidden={!showShipped}
            className="flex flex-col gap-3"
          >
            {shipped.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                userId={userId}
                open={item.id === openItemId}
              />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

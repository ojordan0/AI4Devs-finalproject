import { useTranslations } from "next-intl";

import { Skeleton } from "@/components/ui/skeleton";

// Lists loading: the list menu, the quick field, and item-shaped placeholders,
// announced to screen readers (docs/02-UX-DESIGN.md, section 2.7).
export default function Loading() {
  const t = useTranslations("states");
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col gap-6 lg:max-w-[380px] xl:max-w-[420px]"
    >
      <span className="sr-only">{t("loading")}</span>
      <Skeleton className="h-16 w-56" />
      <Skeleton className="h-[50px] w-full rounded-md" />
      <Skeleton className="h-12 w-3/4 rounded-full" />
      {[0, 1, 2, 3].map((row) => (
        <Skeleton key={row} className="h-28 w-full rounded-lg" />
      ))}
    </div>
  );
}

import type { ComponentProps } from "react";

import { cn } from "./utils";

// Inputs from DESIGN.md: at least 50px tall, 17px text (which also stops iOS
// Safari from zooming), a 1.5px border that turns 2px on focus and on error.
export const fieldClassName =
  "min-h-[50px] w-full rounded-md border-[1.5px] border-input bg-card px-4 py-3 text-body-lg text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-2 focus-visible:border-primary aria-invalid:border-2 aria-invalid:border-destructive disabled:opacity-60";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      className={cn(fieldClassName, className)}
      {...props}
    />
  );
}

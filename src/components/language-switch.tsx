"use client";

import { CheckIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useId } from "react";

import { LANGUAGES, type Language } from "@/shared/languages";

import { cn } from "./ui/utils";

// Two side-by-side choices, Español and English, as radio buttons, so the
// current one is announced and the arrow keys move between them. Each language
// is named in its own language.

export function LanguageSwitch({
  value,
  onChange,
  disabled,
  className,
}: {
  value?: Language;
  onChange: (language: Language) => void;
  disabled?: boolean;
  className?: string;
}) {
  const t = useTranslations("common");
  const locale = useLocale() as Language;
  const current = value ?? locale;
  const name = useId();

  return (
    <fieldset className={cn("flex flex-col gap-2", className)}>
      <legend className="text-label-lg mb-2 font-semibold">
        {t("language")}
      </legend>
      <div className="bg-muted grid grid-cols-2 gap-2 rounded-lg p-1">
        {LANGUAGES.map((language) => (
          <label
            key={language}
            lang={language}
            className={cn(
              "text-label-lg has-[:focus-visible]:ring-ring flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-md px-4 font-semibold has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-offset-2",
              current === language
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-card",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            <input
              type="radio"
              name={name}
              value={language}
              checked={current === language}
              disabled={disabled}
              onChange={() => onChange(language)}
              className="sr-only"
            />
            {current === language && (
              <CheckIcon className="size-5" aria-hidden />
            )}
            {t(`languageNames.${language}`)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

"use client";

import { ChevronDownIcon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { NewListDialog } from "./new-list-dialog";

// The list menu, which is the list's heading (docs/02-UX-DESIGN.md, section
// 2.4; design decision 8): the current list's name, the group's lists to switch
// to, and New list. Switching keeps the list in the address, so Back returns
// to the previous one.

export function ListMenu({
  groupId,
  lists,
  currentListId,
}: {
  groupId: string;
  lists: readonly { id: string; name: string }[];
  currentListId: string;
}) {
  const t = useTranslations("lists");
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const current = lists.find(({ id }) => id === currentListId);

  return (
    <>
      <h2 className="min-w-0">
        {/* Not modal, like the group selector: a modal menu hides the page
            from screen readers while its controls stay focusable. */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger className="hover:bg-muted focus-visible:ring-ring -ml-2 flex min-h-12 max-w-full items-center gap-2 rounded-lg px-2 py-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-offset-2">
            <span className="flex min-w-0 flex-col">
              <span className="text-body-md text-muted-foreground font-medium">
                {t("listMenu")}
              </span>
              <span className="text-headline-xl-mobile md:text-headline-xl font-bold [overflow-wrap:anywhere]">
                {current?.name}
              </span>
            </span>
            <ChevronDownIcon className="size-6 shrink-0" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" collisionPadding={16}>
            <DropdownMenuRadioGroup
              value={currentListId}
              onValueChange={(listId) => {
                if (listId !== currentListId) {
                  router.push(`/lists?list=${listId}`);
                }
              }}
            >
              {lists.map(({ id, name }) => (
                <DropdownMenuRadioItem key={id} value={id}>
                  {name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setCreating(true)}>
              <PlusIcon aria-hidden />
              {t("newList")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </h2>
      <NewListDialog
        groupId={groupId}
        open={creating}
        onOpenChange={setCreating}
      />
    </>
  );
}

/** The "No lists yet" state's action, which opens New list. */
export function NewListButton({ groupId }: { groupId: string }) {
  const t = useTranslations("lists");
  const [creating, setCreating] = useState(false);
  return (
    <>
      <Button onClick={() => setCreating(true)}>
        <PlusIcon aria-hidden />
        {t("newList")}
      </Button>
      <NewListDialog
        groupId={groupId}
        open={creating}
        onOpenChange={setCreating}
      />
    </>
  );
}

import { z } from "zod";

import { fields } from "./fields";

// Request bodies and queries for lists and items, built from the BR-32 fields,
// so the browser and the server validate the same way (FR-39).

export const ITEM_STATUSES = [
  "pending",
  "reserved",
  "purchased",
  "shipped",
  "unavailable",
] as const;

export type ItemStatus = (typeof ITEM_STATUSES)[number];

/** Optional text: empty after trimming means no value. */
const optionalNote = fields.note
  .transform((value) => (value === "" ? null : value))
  .nullable()
  .optional();

export const createListRequestShape = { name: fields.name };

export const createListRequest = z.object(createListRequestShape);

export const createItemRequestShape = {
  name: fields.name,
  recipientId: z.uuid().nullable().optional(),
  url: fields.link.nullable().optional(),
  quantity: fields.quantity.default(1),
  notes: optionalNote,
};

export const createItemRequest = z.object(createItemRequestShape);

export const updateItemRequestShape = {
  /** The version the member last saw (BR-20). */
  version: z.number().int().min(1),
  name: fields.name.optional(),
  recipientId: z.uuid().nullable().optional(),
  url: fields.link.nullable().optional(),
  quantity: fields.quantity.optional(),
  notes: optionalNote,
  /** Another list of the same group (FR-16). */
  listId: z.uuid().optional(),
};

/** True when the edit changes something besides the version. */
export function changesSomething(body: Record<string, unknown>) {
  return Object.entries(body).some(
    ([key, value]) => key !== "version" && value !== undefined,
  );
}

export const updateItemRequest = z
  .object(updateItemRequestShape)
  .refine(changesSomething, { message: "nothing to change" });

export const itemFiltersShape = {
  /** A recipient's ID, or `none` for items with no recipient. */
  recipientId: z.union([z.uuid(), z.literal("none")]).optional(),
  status: z.enum(ITEM_STATUSES).optional(),
};

export const itemFilters = z.object(itemFiltersShape);

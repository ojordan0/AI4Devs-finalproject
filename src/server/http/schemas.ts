import "./zod-openapi";

import { z } from "zod";

import { LANGUAGES } from "../../shared/languages";
import { fieldLimits } from "../../shared/limits";
import {
  changesSomething,
  createItemRequestShape,
  createListRequestShape,
  ITEM_STATUSES,
  itemFiltersShape,
  updateItemRequestShape,
} from "../../shared/requests";
import { openApiRegistry } from "./openapi";

// Response schemas shared by several endpoints, registered by name so the
// OpenAPI document refers to them (docs/05-API.md, section 3).

export const membershipTypeSchema = openApiRegistry.register(
  "MembershipType",
  z.enum(["member", "buyer"]),
);

export const personRefSchema = openApiRegistry.register(
  "PersonRef",
  z.object({
    id: z.uuid(),
    name: z
      .string()
      .meta({ description: '"Former user" for deleted accounts' }),
  }),
);

export const membershipSchema = openApiRegistry.register(
  "Membership",
  z.object({
    groupId: z.uuid(),
    groupName: z.string(),
    type: membershipTypeSchema,
    isOwner: z.boolean(),
  }),
);

export const meSchema = openApiRegistry.register(
  "Me",
  z.object({
    id: z.uuid(),
    name: z.string().nullable(),
    email: z.string().nullable(),
    image: z.string().nullable(),
    language: z
      .enum(LANGUAGES)
      .nullable()
      .meta({ description: "Null until onboarding" }),
    whatsappNumber: z
      .string()
      .nullable()
      .meta({ description: "E.164; null until onboarding" }),
    receiveEmails: z.boolean(),
    onboarded: z.boolean(),
    hasPurchases: z.boolean().meta({
      description:
        "The user is the buyer of a reserved or purchased item, which gives a member the My purchases tab (FR-08)",
    }),
    memberships: z.array(membershipSchema),
  }),
);

export const groupSummarySchema = openApiRegistry.register(
  "GroupSummary",
  z.object({
    id: z.uuid(),
    name: z.string(),
    type: membershipTypeSchema,
    isOwner: z.boolean(),
  }),
);

export const groupListSchema = openApiRegistry.register(
  "GroupList",
  z.object({ groups: z.array(groupSummarySchema) }),
);

export const groupMemberSchema = openApiRegistry.register(
  "GroupMember",
  personRefSchema.extend({ isOwner: z.boolean() }),
);

export const groupSchema = openApiRegistry.register(
  "Group",
  z.object({
    id: z.uuid(),
    name: z.string(),
    members: z.array(groupMemberSchema),
    buyers: z.array(personRefSchema),
  }),
);

// Lists and items (docs/05-API.md, section 3). Request schemas are rebuilt here
// from the shared shapes, so they can be named in the document.

export const listSchema = openApiRegistry.register(
  "List",
  z.object({ id: z.uuid(), name: z.string() }),
);

export const listCollectionSchema = openApiRegistry.register(
  "ListCollection",
  z.object({ lists: z.array(listSchema) }),
);

export const createListRequestSchema = openApiRegistry.register(
  "CreateListRequest",
  z.object(createListRequestShape),
);

export const itemStatusSchema = openApiRegistry.register(
  "ItemStatus",
  z.enum(ITEM_STATUSES),
);

export const itemSchema = openApiRegistry.register(
  "Item",
  z.object({
    id: z.uuid(),
    listId: z.uuid(),
    name: z.string().max(fieldLimits.name.max),
    notes: z.string().max(fieldLimits.note.max).nullable(),
    url: z.url().max(fieldLimits.link.max).nullable(),
    storeName: z.string().nullable(),
    thumbnailUrl: z.url().nullable(),
    linkStatus: z.enum(["none", "pending", "done", "failed"]),
    quantity: z
      .number()
      .int()
      .min(fieldLimits.quantity.min)
      .max(fieldLimits.quantity.max),
    status: itemStatusSchema,
    recipient: personRefSchema.nullable(),
    buyer: personRefSchema.nullable(),
    buyerNote: z.string().nullable(),
    shipmentId: z.uuid().nullable(),
    updatedAfterReservation: z.boolean(),
    version: z.number().int(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  }),
);

export const itemCollectionSchema = openApiRegistry.register(
  "ItemCollection",
  z.object({ items: z.array(itemSchema) }),
);

export const createItemRequestSchema = openApiRegistry.register(
  "CreateItemRequest",
  z.object(createItemRequestShape),
);

export const updateItemRequestSchema = openApiRegistry.register(
  "UpdateItemRequest",
  z.object(updateItemRequestShape).refine(changesSomething, {
    message: "nothing to change",
  }),
);

export const itemFiltersSchema = z.object(itemFiltersShape);

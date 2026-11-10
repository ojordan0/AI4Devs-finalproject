import "./zod-openapi";

import { z } from "zod";

import { LANGUAGES } from "../../shared/languages";
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

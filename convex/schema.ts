import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  workspaces: defineTable({
    name: v.string(),
    plan: v.union(
      v.literal("starter"),
      v.literal("growth"),
      v.literal("agency")
    ),
    creditBalance: v.number(),
    polarSubscriptionId: v.optional(v.string()),
    autoApproveReview: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  users: defineTable({
    clerkId: v.string(),
    workspaceId: v.id("workspaces"),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("member")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_workspace_id", ["workspaceId"]),

  brands: defineTable({
    workspaceId: v.id("workspaces"),
    isPrimary: v.boolean(),
    name: v.string(),
    website: v.string(),
    tagline: v.optional(v.string()),
    elevatorPitch: v.optional(v.string()),
    missionStatement: v.optional(v.string()),
    products: v.array(
      v.object({
        name: v.string(),
        description: v.string(),
        differentiators: v.array(v.string()),
        useCases: v.array(v.string()),
        canonicalUrl: v.optional(v.string()),
      })
    ),
    icp: v.object({
      targetMarket: v.optional(v.string()),
      industries: v.array(v.string()),
      companySizes: v.array(v.string()),
      geographies: v.array(v.string()),
      jobsToBeDone: v.array(v.string()),
      personas: v.array(
        v.object({
          title: v.string(),
          painPoints: v.array(v.string()),
          desiredOutcomes: v.array(v.string()),
        })
      ),
    }),
    brandVoice: v.optional(v.string()),
    toneDefault: v.optional(v.string()),
    sayInstead: v.array(
      v.object({
        instead: v.string(),
        say: v.string(),
      })
    ),
    doNotSay: v.array(v.string()),
    competitors: v.array(
      v.object({
        name: v.string(),
        positioningNote: v.optional(v.string()),
      })
    ),
    visual: v.object({
      logoUrl: v.optional(v.string()),
      primaryColor: v.optional(v.string()),
      secondaryColors: v.array(v.string()),
      typography: v.optional(v.string()),
      imageStyleNotes: v.optional(v.string()),
    }),
    sourceUrls: v.array(v.string()),
    lastRefreshedAt: v.optional(v.number()),
    lastEditedAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace_id", ["workspaceId"])
    .index("by_workspace_primary", ["workspaceId", "isPrimary"]),

  briefs: defineTable({
    workspaceId: v.id("workspaces"),
    createdBy: v.id("users"),
    contentType: v.union(
      v.literal("blog_post"),
      v.literal("case_study"),
      v.literal("customer_story"),
      v.literal("guide"),
      v.literal("landing_page"),
      v.literal("web_page"),
      v.literal("email"),
      v.literal("sales_collateral")
    ),
    title: v.string(),
    topic: v.string(),
    keywords: v.array(v.string()),
    toneOfVoice: v.string(),
    formattingRules: v.optional(v.string()),
    sources: v.array(v.string()),
    customQuestions: v.array(v.string()),
    outline: v.optional(v.string()),
    interviewerLanguage: v.string(),
    outputLanguage: v.string(),
    phase: v.union(
      v.literal("brief"),
      v.literal("research"),
      v.literal("outline"),
      v.literal("interview"),
      v.literal("draft"),
      v.literal("edit"),
      v.literal("review"),
      v.literal("pushed")
    ),
    briefReadyAt: v.optional(v.number()),
    researchApprovedAt: v.optional(v.number()),
    outlineApprovedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace_id", ["workspaceId"])
    .index("by_workspace_phase", ["workspaceId", "phase"]),

  research: defineTable({
    workspaceId: v.id("workspaces"),
    briefId: v.id("briefs"),
    notes: v.string(),
    keywordAnalysis: v.optional(v.string()),
    status: v.union(
      v.literal("generating"),
      v.literal("ready"),
      v.literal("approved")
    ),
    creditsConsumed: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace_id", ["workspaceId"])
    .index("by_brief_id", ["briefId"]),

  outlines: defineTable({
    workspaceId: v.id("workspaces"),
    briefId: v.id("briefs"),
    structure: v.string(),
    status: v.union(
      v.literal("generating"),
      v.literal("ready"),
      v.literal("approved")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace_id", ["workspaceId"])
    .index("by_brief_id", ["briefId"]),

  interviews: defineTable({
    workspaceId: v.id("workspaces"),
    briefId: v.id("briefs"),
    guestTokenHash: v.string(),
    guestEmail: v.optional(v.string()),
    guestName: v.optional(v.string()),
    consentedAt: v.optional(v.number()),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("expired"),
      v.literal("failed")
    ),
    transcript: v.optional(v.string()),
    audioStorageKey: v.optional(v.string()),
    creditsConsumed: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    expiresAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace_id", ["workspaceId"])
    .index("by_brief_id", ["briefId"])
    .index("by_token_hash", ["guestTokenHash"]),

  drafts: defineTable({
    workspaceId: v.id("workspaces"),
    briefId: v.id("briefs"),
    interviewId: v.id("interviews"),
    title: v.string(),
    contentMarkdown: v.string(),
    outputLanguage: v.string(),
    metaDescription: v.optional(v.string()),
    slug: v.optional(v.string()),
    schemaMarkup: v.optional(v.string()),
    hubspotContentId: v.optional(v.string()),
    hubspotContentType: v.optional(v.string()),
    status: v.union(
      v.literal("generating"),
      v.literal("ready"),
      v.literal("edited"),
      v.literal("approved"),
      v.literal("push_pending"),
      v.literal("pushed"),
      v.literal("push_failed")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace_id", ["workspaceId"])
    .index("by_brief_id", ["briefId"])
    .index("by_status", ["status"]),

  creditTransactions: defineTable({
    workspaceId: v.id("workspaces"),
    type: v.union(
      v.literal("purchase"),
      v.literal("interview"),
      v.literal("generation"),
      v.literal("bulk_export"),
      v.literal("refund")
    ),
    amount: v.number(),
    referenceType: v.optional(v.string()),
    referenceId: v.optional(v.string()),
    description: v.string(),
    createdAt: v.number(),
  }).index("by_workspace_id", ["workspaceId"]),

  workspaceHubspotConnections: defineTable({
    workspaceId: v.id("workspaces"),
    portalId: v.string(),
    encryptedAccessToken: v.string(),
    encryptedRefreshToken: v.string(),
    tokenExpiresAt: v.number(),
    scopes: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_workspace_portal", ["workspaceId", "portalId"]),

  workspaceSubscriptions: defineTable({
    workspaceId: v.id("workspaces"),
    polarSubscriptionId: v.string(),
    polarCustomerId: v.string(),
    polarProductId: v.string(),
    status: v.union(v.literal("active"), v.literal("canceled")),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    updatedAt: v.number(),
  })
    .index("by_workspace_id", ["workspaceId"])
    .index("by_polar_subscription_id", ["polarSubscriptionId"]),
});

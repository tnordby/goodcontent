import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, loadOrCreateUserForAuth } from "./users";

const productValidator = v.object({
  name: v.string(),
  description: v.string(),
  differentiators: v.array(v.string()),
  useCases: v.array(v.string()),
  canonicalUrl: v.optional(v.string()),
});

const personaValidator = v.object({
  title: v.string(),
  painPoints: v.array(v.string()),
  desiredOutcomes: v.array(v.string()),
});

const brandInputValidator = {
  name: v.string(),
  website: v.string(),
  tagline: v.optional(v.string()),
  elevatorPitch: v.optional(v.string()),
  missionStatement: v.optional(v.string()),
  products: v.array(productValidator),
  icp: v.object({
    targetMarket: v.optional(v.string()),
    industries: v.array(v.string()),
    companySizes: v.array(v.string()),
    geographies: v.array(v.string()),
    jobsToBeDone: v.array(v.string()),
    personas: v.array(personaValidator),
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
};

export const listByCurrentWorkspace = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    return await ctx.db
      .query("brands")
      .withIndex("by_workspace_id", (q) => q.eq("workspaceId", user.workspaceId))
      .order("desc")
      .collect();
  },
});

export const getPrimaryByCurrentWorkspace = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    return await ctx.db
      .query("brands")
      .withIndex("by_workspace_primary", (q) =>
        q.eq("workspaceId", user.workspaceId).eq("isPrimary", true)
      )
      .first();
  },
});

export const create = mutation({
  args: {
    ...brandInputValidator,
    isPrimary: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await loadOrCreateUserForAuth(ctx);
    const now = Date.now();
    const existingCount = await ctx.db
      .query("brands")
      .withIndex("by_workspace_id", (q) => q.eq("workspaceId", user.workspaceId))
      .collect();
    const shouldBePrimary = args.isPrimary ?? existingCount.length === 0;

    if (shouldBePrimary) {
      for (const row of existingCount) {
        if (row.isPrimary) {
          await ctx.db.patch(row._id, { isPrimary: false, updatedAt: now });
        }
      }
    }

    return await ctx.db.insert("brands", {
      workspaceId: user.workspaceId,
      isPrimary: shouldBePrimary,
      name: args.name.trim(),
      website: args.website.trim(),
      tagline: args.tagline?.trim(),
      elevatorPitch: args.elevatorPitch?.trim(),
      missionStatement: args.missionStatement?.trim(),
      products: args.products,
      icp: args.icp,
      brandVoice: args.brandVoice?.trim(),
      toneDefault: args.toneDefault?.trim(),
      sayInstead: args.sayInstead,
      doNotSay: args.doNotSay,
      competitors: args.competitors,
      visual: args.visual,
      sourceUrls: args.sourceUrls,
      lastEditedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    brandId: v.id("brands"),
    ...brandInputValidator,
    isPrimary: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await loadOrCreateUserForAuth(ctx);
    const existing = await ctx.db.get(args.brandId);
    if (!existing || existing.workspaceId !== user.workspaceId) {
      throw new Error("Brand not found in this workspace");
    }
    const now = Date.now();

    if (args.isPrimary) {
      const all = await ctx.db
        .query("brands")
        .withIndex("by_workspace_id", (q) => q.eq("workspaceId", user.workspaceId))
        .collect();
      for (const row of all) {
        if (row._id !== args.brandId && row.isPrimary) {
          await ctx.db.patch(row._id, { isPrimary: false, updatedAt: now });
        }
      }
    }

    await ctx.db.patch(args.brandId, {
      isPrimary: args.isPrimary ?? existing.isPrimary,
      name: args.name.trim(),
      website: args.website.trim(),
      tagline: args.tagline?.trim(),
      elevatorPitch: args.elevatorPitch?.trim(),
      missionStatement: args.missionStatement?.trim(),
      products: args.products,
      icp: args.icp,
      brandVoice: args.brandVoice?.trim(),
      toneDefault: args.toneDefault?.trim(),
      sayInstead: args.sayInstead,
      doNotSay: args.doNotSay,
      competitors: args.competitors,
      visual: args.visual,
      sourceUrls: args.sourceUrls,
      lastEditedAt: now,
      updatedAt: now,
    });
  },
});

export const setPrimary = mutation({
  args: { brandId: v.id("brands") },
  handler: async (ctx, { brandId }) => {
    const user = await loadOrCreateUserForAuth(ctx);
    const brand = await ctx.db.get(brandId);
    if (!brand || brand.workspaceId !== user.workspaceId) {
      throw new Error("Brand not found in this workspace");
    }

    const now = Date.now();
    const all = await ctx.db
      .query("brands")
      .withIndex("by_workspace_id", (q) => q.eq("workspaceId", user.workspaceId))
      .collect();
    for (const row of all) {
      await ctx.db.patch(row._id, {
        isPrimary: row._id === brandId,
        updatedAt: now,
      });
    }
  },
});

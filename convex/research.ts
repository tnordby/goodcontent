import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, loadOrCreateUserForAuth } from "./users";

export const listByCurrentWorkspace = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const rows = await ctx.db
      .query("research")
      .withIndex("by_workspace_id", (q) => q.eq("workspaceId", user.workspaceId))
      .order("desc")
      .collect();

    return await Promise.all(
      rows.map(async (research) => {
        const brief = await ctx.db.get(research.briefId);
        return {
          research,
          brief: brief && brief.workspaceId === user.workspaceId ? brief : null,
        };
      }),
    );
  },
});

export const getForBrief = query({
  args: { briefId: v.id("briefs") },
  handler: async (ctx, { briefId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    const brief = await ctx.db.get(briefId);
    if (!brief || brief.workspaceId !== user.workspaceId) return null;
    return await ctx.db
      .query("research")
      .withIndex("by_brief_id", (q) => q.eq("briefId", briefId))
      .first();
  },
});

export const approve = mutation({
  args: { briefId: v.id("briefs") },
  handler: async (ctx, { briefId }) => {
    const user = await loadOrCreateUserForAuth(ctx);
    const brief = await ctx.db.get(briefId);
    if (!brief || brief.workspaceId !== user.workspaceId) {
      throw new Error("Brief not found");
    }
    if (brief.phase !== "research") {
      throw new Error("Brief must be in Research phase to approve research");
    }

    const research = await ctx.db
      .query("research")
      .withIndex("by_brief_id", (q) => q.eq("briefId", briefId))
      .first();
    if (!research) throw new Error("Research record not found");

    const now = Date.now();
    await ctx.db.patch(research._id, {
      status: "approved",
      updatedAt: now,
    });

    const outline = await ctx.db
      .query("outlines")
      .withIndex("by_brief_id", (q) => q.eq("briefId", briefId))
      .first();
    if (!outline) {
      await ctx.db.insert("outlines", {
        workspaceId: user.workspaceId,
        briefId,
        structure:
          brief.outline?.trim() ||
          "## Hook\n## Context\n## Core sections\n## Proof\n## CTA",
        status: "ready",
        createdAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.patch(briefId, {
      phase: "outline",
      researchApprovedAt: now,
      updatedAt: now,
    });
  },
});

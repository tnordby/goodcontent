import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, loadOrCreateUserForAuth } from "./users";

export const listByCurrentWorkspace = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const rows = await ctx.db
      .query("outlines")
      .withIndex("by_workspace_id", (q) => q.eq("workspaceId", user.workspaceId))
      .order("desc")
      .collect();

    return await Promise.all(
      rows.map(async (outline) => {
        const brief = await ctx.db.get(outline.briefId);
        return {
          outline,
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
      .query("outlines")
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
    if (brief.phase !== "outline") {
      throw new Error("Brief must be in Outline phase to approve outline");
    }

    const outline = await ctx.db
      .query("outlines")
      .withIndex("by_brief_id", (q) => q.eq("briefId", briefId))
      .first();
    if (!outline) throw new Error("Outline record not found");

    const now = Date.now();
    await ctx.db.patch(outline._id, {
      status: "approved",
      updatedAt: now,
    });
    await ctx.db.patch(briefId, {
      phase: "interview",
      outlineApprovedAt: now,
      updatedAt: now,
    });
  },
});

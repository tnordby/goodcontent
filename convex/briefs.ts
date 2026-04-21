import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, loadOrCreateUserForAuth } from "./users";

export const listByCurrentWorkspace = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }
    return await ctx.db
      .query("briefs")
      .withIndex("by_workspace_id", (q) => q.eq("workspaceId", user.workspaceId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { briefId: v.id("briefs") },
  handler: async (ctx, { briefId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }
    const brief = await ctx.db.get(briefId);
    if (!brief || brief.workspaceId !== user.workspaceId) {
      return null;
    }

    const draft = await ctx.db
      .query("drafts")
      .withIndex("by_brief_id", (q) => q.eq("briefId", briefId))
      .order("desc")
      .first();

    const interview = await ctx.db
      .query("interviews")
      .withIndex("by_brief_id", (q) => q.eq("briefId", briefId))
      .order("desc")
      .first();

    return {
      ...brief,
      draftId: draft?._id ?? null,
      draftStatus: draft?.status ?? null,
      interviewId: interview?._id ?? null,
      interviewStatus: interview?.status ?? null,
    };
  },
});

export const create = mutation({
  args: {
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
    toneOfVoice: v.string(),
    interviewerLanguage: v.string(),
    outputLanguage: v.string(),
    keywords: v.optional(v.array(v.string())),
    sources: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await loadOrCreateUserForAuth(ctx);
    const now = Date.now();

    return await ctx.db.insert("briefs", {
      workspaceId: user.workspaceId,
      createdBy: user._id,
      contentType: args.contentType,
      title: args.title.trim(),
      topic: args.topic.trim(),
      keywords: args.keywords ?? [],
      toneOfVoice: args.toneOfVoice.trim(),
      sources: args.sources ?? [],
      customQuestions: [],
      interviewerLanguage: args.interviewerLanguage.trim(),
      outputLanguage: args.outputLanguage.trim(),
      phase: "brief",
      createdAt: now,
      updatedAt: now,
    });
  },
});


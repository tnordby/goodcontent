import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserOrThrow } from "./users";

export const listByCurrentWorkspace = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    return await ctx.db
      .query("briefs")
      .withIndex("by_workspace_id", (q) => q.eq("workspaceId", user.workspaceId))
      .order("desc")
      .collect();
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
    const user = await getCurrentUserOrThrow(ctx);
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


import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserOrThrow } from "./users";

async function hashToken(rawToken: string): Promise<string> {
  const bytes = new TextEncoder().encode(rawToken);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export const listByCurrentWorkspace = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    const interviews = await ctx.db
      .query("interviews")
      .withIndex("by_workspace_id", (q) => q.eq("workspaceId", user.workspaceId))
      .order("desc")
      .collect();

    return await Promise.all(
      interviews.map(async (interview) => {
        const brief = await ctx.db.get(interview.briefId);
        return {
          ...interview,
          briefTitle: brief?.title ?? "Unknown brief",
        };
      }),
    );
  },
});

export const createLinkForBrief = mutation({
  args: {
    briefId: v.id("briefs"),
    expiresInDays: v.optional(v.number()),
  },
  handler: async (ctx, { briefId, expiresInDays }) => {
    const user = await getCurrentUserOrThrow(ctx);
    const brief = await ctx.db.get(briefId);
    if (!brief || brief.workspaceId !== user.workspaceId) {
      throw new Error("Brief not found");
    }

    const now = Date.now();
    const days = Math.max(1, Math.min(expiresInDays ?? 7, 30));
    const rawToken = crypto.randomUUID();
    const guestTokenHash = await hashToken(rawToken);

    const interviewId = await ctx.db.insert("interviews", {
      workspaceId: user.workspaceId,
      briefId: brief._id,
      guestTokenHash,
      status: "pending",
      creditsConsumed: 0,
      expiresAt: now + days * 24 * 60 * 60 * 1000,
      createdAt: now,
      updatedAt: now,
    });

    if (brief.phase === "brief" || brief.phase === "research" || brief.phase === "outline") {
      await ctx.db.patch(brief._id, { phase: "interview", updatedAt: now });
    }

    return {
      interviewId,
      token: rawToken,
      interviewUrl: `/interview/${rawToken}`,
      expiresAt: now + days * 24 * 60 * 60 * 1000,
    };
  },
});

export const getGuestSessionByToken = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const guestTokenHash = await hashToken(token);
    const interview = await ctx.db
      .query("interviews")
      .withIndex("by_token_hash", (q) => q.eq("guestTokenHash", guestTokenHash))
      .first();

    if (!interview) {
      return { state: "invalid" as const };
    }

    if (interview.expiresAt < Date.now() || interview.status === "expired") {
      return { state: "expired" as const, interviewId: interview._id };
    }

    if (interview.status !== "pending" && interview.status !== "in_progress") {
      return { state: "used" as const, interviewId: interview._id };
    }

    const brief = await ctx.db.get(interview.briefId);
    return {
      state: "valid" as const,
      interviewId: interview._id,
      briefTitle: brief?.title ?? "Untitled brief",
      briefTopic: brief?.topic ?? "",
      contentType: brief?.contentType ?? "blog_post",
      interviewerLanguage: brief?.interviewerLanguage ?? "en",
      outputLanguage: brief?.outputLanguage ?? "en",
      status: interview.status,
      expiresAt: interview.expiresAt,
    };
  },
});

export const startByToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const guestTokenHash = await hashToken(token);
    const interview = await ctx.db
      .query("interviews")
      .withIndex("by_token_hash", (q) => q.eq("guestTokenHash", guestTokenHash))
      .first();

    if (!interview) {
      throw new Error("Invalid interview token");
    }

    if (interview.expiresAt < Date.now() || interview.status === "expired") {
      throw new Error("Interview link has expired");
    }

    if (interview.status !== "pending") {
      throw new Error("Interview has already started or is no longer available");
    }

    const now = Date.now();
    await ctx.db.patch(interview._id, {
      status: "in_progress",
      startedAt: now,
      updatedAt: now,
    });

    return { ok: true };
  },
});


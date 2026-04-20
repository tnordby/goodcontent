import { internalMutation, query, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./users";

async function hashToken(rawToken: string): Promise<string> {
  const bytes = new TextEncoder().encode(rawToken);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function buildDraftMarkdown(args: {
  briefTitle: string;
  briefTopic: string;
  transcript: string;
  outputLanguage: string;
}) {
  const trimmedTranscript = args.transcript.trim();
  return [
    `# ${args.briefTitle}`,
    "",
    `> **Topic:** ${args.briefTopic}`,
    `> **Output language:** ${args.outputLanguage}`,
    "",
    "## Interview transcript (verbatim)",
    "",
    trimmedTranscript.length > 0 ? trimmedTranscript : "_No transcript provided._",
    "",
    "## Draft (MVP scaffold)",
    "",
    "This is an MVP placeholder draft generated from the transcript. Replace this section with your real model pipeline.",
    "",
    "### Key takeaways",
    "",
    "- ...",
    "- ...",
    "",
    "### Next steps",
    "",
    "- ...",
  ].join("\n");
}

async function completeGuestInterviewForToken(
  ctx: MutationCtx,
  args: {
    token: string;
    transcript: string;
    guestName?: string;
    guestEmail?: string;
  },
) {
  const guestTokenHash = await hashToken(args.token);
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

  if (interview.status !== "in_progress") {
    throw new Error("Interview is not in progress");
  }

  const brief = await ctx.db.get(interview.briefId);
  if (!brief) {
    throw new Error("Brief not found for interview");
  }

  const now = Date.now();
  const cleanedTranscript = args.transcript.trim();
  if (cleanedTranscript.length < 10) {
    throw new Error("Transcript is too short");
  }

  await ctx.db.patch(interview._id, {
    status: "completed",
    transcript: cleanedTranscript,
    guestName: args.guestName?.trim() || interview.guestName,
    guestEmail: args.guestEmail?.trim() || interview.guestEmail,
    completedAt: now,
    updatedAt: now,
  });

  const existingDraft = await ctx.db
    .query("drafts")
    .withIndex("by_brief_id", (q) => q.eq("briefId", brief._id))
    .filter((q) => q.eq(q.field("interviewId"), interview._id))
    .first();

  const markdown = buildDraftMarkdown({
    briefTitle: brief.title,
    briefTopic: brief.topic,
    transcript: cleanedTranscript,
    outputLanguage: brief.outputLanguage,
  });

  if (existingDraft) {
    await ctx.db.patch(existingDraft._id, {
      title: brief.title,
      contentMarkdown: markdown,
      outputLanguage: brief.outputLanguage,
      status: "ready",
      updatedAt: now,
    });
  } else {
    await ctx.db.insert("drafts", {
      workspaceId: interview.workspaceId,
      briefId: brief._id,
      interviewId: interview._id,
      title: brief.title,
      contentMarkdown: markdown,
      outputLanguage: brief.outputLanguage,
      status: "ready",
      createdAt: now,
      updatedAt: now,
    });
  }

  await ctx.db.patch(brief._id, {
    phase: "draft",
    updatedAt: now,
  });

  return { ok: true as const };
}

export const listByCurrentWorkspace = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }
    const drafts = await ctx.db
      .query("drafts")
      .withIndex("by_workspace_id", (q) => q.eq("workspaceId", user.workspaceId))
      .order("desc")
      .collect();

    return await Promise.all(
      drafts.map(async (draft) => {
        const brief = await ctx.db.get(draft.briefId);
        const interview = await ctx.db.get(draft.interviewId);
        return {
          ...draft,
          briefTitle: brief?.title ?? "Unknown brief",
          interviewStatus: interview?.status ?? "unknown",
        };
      }),
    );
  },
});

export const completeGuestInterviewFromHttp = internalMutation({
  args: {
    token: v.string(),
    transcript: v.string(),
    guestName: v.optional(v.string()),
    guestEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await completeGuestInterviewForToken(ctx, args);
  },
});

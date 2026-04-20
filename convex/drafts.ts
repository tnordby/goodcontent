import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, loadOrCreateUserForAuth } from "./users";

async function hashToken(rawToken: string): Promise<string> {
  const bytes = new TextEncoder().encode(rawToken);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

const GENERATING_PLACEHOLDER = [
  "_Your draft is being generated. This usually takes a few seconds._",
  "",
  "You can leave this page open — it will update automatically when ready.",
].join("\n");

function buildFallbackMarkdown(args: {
  briefTitle: string;
  briefTopic: string;
  outputLanguage: string;
  transcript: string;
  reason: string;
}) {
  const t = args.transcript.trim();
  return [
    `# ${args.briefTitle}`,
    "",
    `> **Topic:** ${args.briefTopic} · **Output language:** ${args.outputLanguage}`,
    "",
    `> **Draft generation note:** ${args.reason}`,
    "",
    "## Interview transcript (verbatim)",
    "",
    t.length > 0 ? t : "_No transcript._",
  ].join("\n");
}

type GenerationBundle = {
  draft: Doc<"drafts">;
  brief: Doc<"briefs">;
  interview: Doc<"interviews">;
};

async function generateDraftWithOpenAI(
  bundle: GenerationBundle,
  apiKey: string,
): Promise<string> {
  const model =
    process.env.OPENAI_DRAFT_MODEL?.trim().replace(/^["']|["']$/g, "") ||
    "gpt-4.1-mini";
  const transcript = (bundle.interview.transcript ?? "").slice(0, 60_000);
  const payload = {
    contentType: bundle.brief.contentType,
    title: bundle.brief.title,
    topic: bundle.brief.topic,
    toneOfVoice: bundle.brief.toneOfVoice,
    keywords: bundle.brief.keywords,
    sources: bundle.brief.sources,
    customQuestions: bundle.brief.customQuestions,
    outputLanguage: bundle.brief.outputLanguage,
    interviewerLanguage: bundle.brief.interviewerLanguage,
    transcript,
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.45,
      max_tokens: 8192,
      messages: [
        {
          role: "system",
          content: [
            "You are an expert B2B marketing writer and editor.",
            "Turn the structured brief and SME interview transcript into a strong first draft.",
            "",
            "Rules:",
            "- Output **only** valid Markdown (no surrounding code fences unless a fenced block is part of the article).",
            "- Match the requested **outputLanguage** (write the whole draft in that language).",
            "- Respect **contentType** (blog post vs case study vs email, etc.).",
            "- Ground claims in the transcript; do not invent customer metrics or quotes that are not implied.",
            "- Use clear headings, short paragraphs, and scannable lists where appropriate.",
            "- Include a short suggested **meta description** line as an HTML comment on its own line: <!-- meta: ... --> right after the H1.",
          ].join("\n"),
        },
        {
          role: "user",
          content: JSON.stringify(payload, null, 2),
        },
      ],
    }),
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`OpenAI HTTP ${response.status}: ${raw.slice(0, 800)}`);
  }

  const result = JSON.parse(raw) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = result.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("OpenAI returned empty content");
  }
  return content;
}

export const getGenerationContext = internalQuery({
  args: { draftId: v.id("drafts") },
  handler: async (ctx, { draftId }) => {
    const draft = await ctx.db.get(draftId);
    if (!draft) {
      return null;
    }
    const brief = await ctx.db.get(draft.briefId);
    const interview = await ctx.db.get(draft.interviewId);
    if (!brief || !interview) {
      return null;
    }
    return { draft, brief, interview };
  },
});

export const applyGeneratedDraft = internalMutation({
  args: {
    draftId: v.id("drafts"),
    contentMarkdown: v.string(),
  },
  handler: async (ctx, { draftId, contentMarkdown }) => {
    const draft = await ctx.db.get(draftId);
    if (!draft) {
      return;
    }
    await ctx.db.patch(draftId, {
      contentMarkdown,
      status: "ready",
      updatedAt: Date.now(),
    });
  },
});

export const generateDraftContent = internalAction({
  args: { draftId: v.id("drafts") },
  handler: async (ctx, { draftId }) => {
    const bundle = await ctx.runQuery(internal.drafts.getGenerationContext, {
      draftId,
    });
    if (!bundle) {
      return;
    }

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    const transcript = bundle.interview.transcript ?? "";

    let markdown: string;
    if (!apiKey) {
      markdown = buildFallbackMarkdown({
        briefTitle: bundle.brief.title,
        briefTopic: bundle.brief.topic,
        outputLanguage: bundle.brief.outputLanguage,
        transcript,
        reason:
          "OPENAI_API_KEY is not set on this Convex deployment. Set it in Convex → Settings → Environment variables, then re-submit or regenerate.",
      });
    } else {
      try {
        markdown = await generateDraftWithOpenAI(bundle, apiKey);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown generation error";
        markdown = buildFallbackMarkdown({
          briefTitle: bundle.brief.title,
          briefTopic: bundle.brief.topic,
          outputLanguage: bundle.brief.outputLanguage,
          transcript,
          reason: message,
        });
      }
    }

    await ctx.runMutation(internal.drafts.applyGeneratedDraft, {
      draftId,
      contentMarkdown: markdown,
    });
  },
});

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

  let draftId: Id<"drafts">;
  if (existingDraft) {
    draftId = existingDraft._id;
    await ctx.db.patch(existingDraft._id, {
      title: brief.title,
      contentMarkdown: GENERATING_PLACEHOLDER,
      outputLanguage: brief.outputLanguage,
      status: "generating",
      updatedAt: now,
    });
  } else {
    draftId = await ctx.db.insert("drafts", {
      workspaceId: interview.workspaceId,
      briefId: brief._id,
      interviewId: interview._id,
      title: brief.title,
      contentMarkdown: GENERATING_PLACEHOLDER,
      outputLanguage: brief.outputLanguage,
      status: "generating",
      createdAt: now,
      updatedAt: now,
    });
  }

  await ctx.db.patch(brief._id, {
    phase: "draft",
    updatedAt: now,
  });

  await ctx.scheduler.runAfter(0, internal.drafts.generateDraftContent, {
    draftId,
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
          briefPhase: brief?.phase ?? "unknown",
          interviewStatus: interview?.status ?? "unknown",
        };
      }),
    );
  },
});

export const saveDraftContent = mutation({
  args: {
    draftId: v.id("drafts"),
    contentMarkdown: v.string(),
  },
  handler: async (ctx, { draftId, contentMarkdown }) => {
    const user = await loadOrCreateUserForAuth(ctx);
    const draft = await ctx.db.get(draftId);
    if (!draft || draft.workspaceId !== user.workspaceId) {
      throw new Error("Draft not found");
    }
    if (draft.status === "generating") {
      throw new Error("Wait until generation finishes");
    }
    if (
      draft.status === "approved" ||
      draft.status === "pushed" ||
      draft.status === "push_pending" ||
      draft.status === "push_failed"
    ) {
      throw new Error("This draft cannot be edited in its current state");
    }
    const now = Date.now();
    await ctx.db.patch(draftId, {
      contentMarkdown: contentMarkdown.trim(),
      status: "edited",
      updatedAt: now,
    });
    const brief = await ctx.db.get(draft.briefId);
    if (brief) {
      await ctx.db.patch(brief._id, { phase: "edit", updatedAt: now });
    }
    return { ok: true as const };
  },
});

export const approveDraft = mutation({
  args: { draftId: v.id("drafts") },
  handler: async (ctx, { draftId }) => {
    const user = await loadOrCreateUserForAuth(ctx);
    const draft = await ctx.db.get(draftId);
    if (!draft || draft.workspaceId !== user.workspaceId) {
      throw new Error("Draft not found");
    }
    if (draft.status === "generating") {
      throw new Error("Wait until generation finishes");
    }
    if (draft.status === "approved") {
      return { ok: true as const };
    }
    if (draft.status !== "ready" && draft.status !== "edited") {
      throw new Error("Only ready or edited drafts can be approved");
    }
    const now = Date.now();
    await ctx.db.patch(draftId, { status: "approved", updatedAt: now });
    const brief = await ctx.db.get(draft.briefId);
    if (brief) {
      await ctx.db.patch(brief._id, { phase: "review", updatedAt: now });
    }
    return { ok: true as const };
  },
});

export const reopenDraftForEdits = mutation({
  args: { draftId: v.id("drafts") },
  handler: async (ctx, { draftId }) => {
    const user = await loadOrCreateUserForAuth(ctx);
    const draft = await ctx.db.get(draftId);
    if (!draft || draft.workspaceId !== user.workspaceId) {
      throw new Error("Draft not found");
    }
    if (draft.status !== "approved") {
      throw new Error("Only approved drafts can be sent back for edits");
    }
    const now = Date.now();
    await ctx.db.patch(draftId, { status: "ready", updatedAt: now });
    const brief = await ctx.db.get(draft.briefId);
    if (brief) {
      await ctx.db.patch(brief._id, { phase: "edit", updatedAt: now });
    }
    return { ok: true as const };
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

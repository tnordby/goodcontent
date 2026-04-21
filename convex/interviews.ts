import type { Doc } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, loadOrCreateUserForAuth } from "./users";

async function hashToken(rawToken: string): Promise<string> {
  const bytes = new TextEncoder().encode(rawToken);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function hasTranscript(interview: Doc<"interviews">): boolean {
  return !!(interview.transcript && interview.transcript.trim().length > 0);
}

/** Rows that are not terminal and can be merged or rotated into a single guest link. */
function isRegeneratableSlot(interview: Doc<"interviews">): boolean {
  if (interview.status === "in_progress" || interview.status === "completed") {
    return false;
  }
  if (interview.status === "failed" || interview.status === "expired") {
    return !hasTranscript(interview);
  }
  if (interview.status === "pending") {
    return !interview.startedAt && !hasTranscript(interview);
  }
  return false;
}

async function interviewHasDraft(
  ctx: MutationCtx,
  interview: Doc<"interviews">,
): Promise<boolean> {
  const draft = await ctx.db
    .query("drafts")
    .withIndex("by_brief_id", (q) => q.eq("briefId", interview.briefId))
    .filter((q) => q.eq(q.field("interviewId"), interview._id))
    .first();
  return draft !== null;
}

function listRank(interview: Doc<"interviews">): number {
  switch (interview.status) {
    case "in_progress":
      return 50;
    case "completed":
      return 40;
    case "pending":
      return 30;
    case "failed":
      return 20;
    case "expired":
      return 10;
    default:
      return 0;
  }
}

/** Prefer the interview that best represents this brief in the workspace list. */
function pickCanonicalInterview<T extends Doc<"interviews">>(rows: T[]): T {
  return [...rows].sort((a, b) => {
    const d = listRank(b) - listRank(a);
    if (d !== 0) return d;
    return b.updatedAt - a.updatedAt;
  })[0]!;
}

export const listByCurrentWorkspace = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }
    const interviews = await ctx.db
      .query("interviews")
      .withIndex("by_workspace_id", (q) => q.eq("workspaceId", user.workspaceId))
      .order("desc")
      .collect();

    const enriched = await Promise.all(
      interviews.map(async (interview) => {
        const brief = await ctx.db.get(interview.briefId);
        const draft = await ctx.db
          .query("drafts")
          .withIndex("by_brief_id", (q) => q.eq("briefId", interview.briefId))
          .filter((q) => q.eq(q.field("interviewId"), interview._id))
          .first();
        return {
          ...interview,
          briefTitle: brief?.title ?? "Unknown brief",
          draftId: draft?._id ?? null,
          draftStatus: draft?.status ?? null,
        };
      }),
    );

    const byBriefId = new Map<string, typeof enriched>();
    for (const row of enriched) {
      const key = row.briefId as string;
      const list = byBriefId.get(key) ?? [];
      list.push(row);
      byBriefId.set(key, list);
    }

    const deduped: typeof enriched = [];
    for (const group of byBriefId.values()) {
      deduped.push(pickCanonicalInterview(group));
    }

    deduped.sort((a, b) => b.updatedAt - a.updatedAt);
    return deduped;
  },
});

export const createLinkForBrief = mutation({
  args: {
    briefId: v.id("briefs"),
    expiresInDays: v.optional(v.number()),
  },
  handler: async (ctx, { briefId, expiresInDays }) => {
    const user = await loadOrCreateUserForAuth(ctx);
    const brief = await ctx.db.get(briefId);
    if (!brief || brief.workspaceId !== user.workspaceId) {
      throw new Error("Brief not found");
    }

    const now = Date.now();
    const days = Math.max(1, Math.min(expiresInDays ?? 7, 30));
    const expiresAt = now + days * 24 * 60 * 60 * 1000;

    const rows = await ctx.db
      .query("interviews")
      .withIndex("by_brief_id", (q) => q.eq("briefId", brief._id))
      .collect();

    if (rows.some((r) => r.workspaceId !== brief.workspaceId)) {
      throw new Error("Brief not found");
    }

    const patchBriefToInterviewPhase = async () => {
      if (
        brief.phase === "brief" ||
        brief.phase === "research" ||
        brief.phase === "outline"
      ) {
        await ctx.db.patch(brief._id, { phase: "interview", updatedAt: now });
      }
    };

    const returnForInterview = async (
      interviewId: (typeof rows)[number]["_id"],
      rawToken: string,
    ) => {
      await patchBriefToInterviewPhase();
      return {
        interviewId,
        token: rawToken,
        interviewUrl: `/interview/${rawToken}`,
        expiresAt,
      };
    };

    if (rows.length === 0) {
      const rawToken = crypto.randomUUID();
      const guestTokenHash = await hashToken(rawToken);
      const interviewId = await ctx.db.insert("interviews", {
        workspaceId: user.workspaceId,
        briefId: brief._id,
        guestTokenHash,
        status: "pending",
        creditsConsumed: 0,
        expiresAt,
        createdAt: now,
        updatedAt: now,
      });
      return returnForInterview(interviewId, rawToken);
    }

    if (rows.some((r) => r.status === "in_progress")) {
      throw new Error(
        "An interview is already in progress for this brief. Share the same link with your guest.",
      );
    }
    if (rows.some((r) => r.status === "completed")) {
      throw new Error(
        "This brief already has a completed interview. Open Drafts to continue working on the piece.",
      );
    }
    if (rows.some((r) => r.status === "pending" && r.startedAt)) {
      throw new Error(
        "An interview is already in progress for this brief. Share the same link with your guest.",
      );
    }

    const regeneratable = rows.filter((r) => isRegeneratableSlot(r));
    if (regeneratable.length === 0) {
      throw new Error(
        "Cannot create a new interview link for this brief in its current state.",
      );
    }

    regeneratable.sort((a, b) => b.updatedAt - a.updatedAt);
    const keeper = regeneratable[0]!;

    for (const r of rows) {
      if (r._id === keeper._id) continue;
      if (!isRegeneratableSlot(r)) continue;
      if (await interviewHasDraft(ctx, r)) continue;
      await ctx.db.delete(r._id);
    }

    const rawToken = crypto.randomUUID();
    const guestTokenHash = await hashToken(rawToken);
    await ctx.db.patch(keeper._id, {
      guestTokenHash,
      status: "pending",
      expiresAt,
      updatedAt: now,
    });

    return returnForInterview(keeper._id, rawToken);
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
      toneOfVoice: brief?.toneOfVoice ?? "",
      keywords: brief?.keywords ?? [],
      sources: brief?.sources ?? [],
      customQuestions: brief?.customQuestions ?? [],
      interviewerLanguage: brief?.interviewerLanguage ?? "en",
      outputLanguage: brief?.outputLanguage ?? "en",
      status: interview.status,
      expiresAt: interview.expiresAt,
    };
  },
});

export const startByToken = mutation({
  args: {
    token: v.string(),
    consentAcknowledged: v.boolean(),
  },
  handler: async (ctx, { token, consentAcknowledged }) => {
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

    if (!consentAcknowledged) {
      throw new Error("Please confirm consent before starting");
    }

    const now = Date.now();
    await ctx.db.patch(interview._id, {
      status: "in_progress",
      startedAt: now,
      consentedAt: now,
      updatedAt: now,
    });

    return { ok: true };
  },
});

export const contributorLeaderboardByCurrentWorkspace = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    const interviews = await ctx.db
      .query("interviews")
      .withIndex("by_workspace_id", (q) => q.eq("workspaceId", user.workspaceId))
      .collect();

    const completed = interviews.filter(
      (row) => row.status === "completed" && !!row.completedAt,
    );

    const byContributor = new Map<
      string,
      {
        displayName: string;
        email: string | null;
        completedInterviews: number;
        totalCharacters: number;
        lastContributionAt: number;
      }
    >();

    for (const row of completed) {
      const name = row.guestName?.trim() || "";
      const email = row.guestEmail?.trim().toLowerCase() || "";
      const key = email || name.toLowerCase() || `anon:${row._id}`;
      const transcriptLength = row.transcript?.trim().length ?? 0;
      const lastAt = row.completedAt ?? row.updatedAt;

      const existing = byContributor.get(key);
      if (!existing) {
        byContributor.set(key, {
          displayName: name || email || "Anonymous contributor",
          email: email || null,
          completedInterviews: 1,
          totalCharacters: transcriptLength,
          lastContributionAt: lastAt,
        });
        continue;
      }

      byContributor.set(key, {
        ...existing,
        completedInterviews: existing.completedInterviews + 1,
        totalCharacters: existing.totalCharacters + transcriptLength,
        lastContributionAt: Math.max(existing.lastContributionAt, lastAt),
      });
    }

    return [...byContributor.values()].sort((a, b) => {
      if (b.completedInterviews !== a.completedInterviews) {
        return b.completedInterviews - a.completedInterviews;
      }
      if (b.totalCharacters !== a.totalCharacters) {
        return b.totalCharacters - a.totalCharacters;
      }
      return b.lastContributionAt - a.lastContributionAt;
    });
  },
});


"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { briefPhaseLabel } from "@/lib/brief-phase";
import { interviewStatusLabel } from "@/lib/pipeline-labels";

export default function InterviewsPage() {
  const briefsQuery = useQuery(api.briefs.listByCurrentWorkspace);
  const interviewsQuery = useQuery(api.interviews.listByCurrentWorkspace);
  const briefs = briefsQuery ?? [];
  const createLink = useMutation(api.interviews.createLinkForBrief);
  const [creatingFor, setCreatingFor] = useState<Id<"briefs"> | null>(null);
  const [latestUrl, setLatestUrl] = useState<string>("");

  const latestInterviewUrl = useMemo(() => {
    if (!latestUrl) return "";
    if (latestUrl.startsWith("http://") || latestUrl.startsWith("https://")) {
      return latestUrl;
    }
    if (typeof window === "undefined") return latestUrl;
    return `${window.location.origin}${latestUrl}`;
  }, [latestUrl]);

  const interviewByBriefId = useMemo(() => {
    const map = new Map<
      Id<"briefs">,
      NonNullable<typeof interviewsQuery>[number]
    >();
    const rows = interviewsQuery ?? [];
    for (const row of rows) {
      map.set(row.briefId, row);
    }
    return map;
  }, [interviewsQuery]);

  const handleCreate = async (briefId: Id<"briefs">) => {
    setCreatingFor(briefId);
    try {
      const result = await createLink({ briefId });
      setLatestUrl(result.interviewUrl);
      toast.success("Interview link ready", {
        description:
          "Copy the URL and send it to your expert. Each brief has a single interview; refreshing creates a new URL and invalidates the old one.",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create link");
    } finally {
      setCreatingFor(null);
    }
  };

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Interviews</h1>
        <p className="mt-2 text-muted-foreground">
          Each brief has one interview workspace: one guest link at a time. Send it to
          your subject-matter expert, then follow progress here until a draft appears in{" "}
          <Link
            className="font-medium text-primary underline-offset-4 hover:underline"
            href="/drafts"
          >
            Drafts
          </Link>
          .
        </p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">How the flow fits together</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              <Link className="font-medium text-foreground underline-offset-4 hover:underline" href="/briefs">
                Briefs
              </Link>{" "}
              — define what you need from the interview.
            </li>
            <li>
              <span className="font-medium text-foreground">Interviews (this page)</span> —
              generate a private link and share it with your guest.
            </li>
            <li>
              Guest completes the interview in one sitting (consent + written answers).
            </li>
            <li>
              <Link className="font-medium text-foreground underline-offset-4 hover:underline" href="/drafts">
                Drafts
              </Link>{" "}
              — AI draft generates automatically; your team reviews and approves.
            </li>
          </ol>
        </CardContent>
      </Card>

      {latestUrl ? (
        <Card>
          <CardHeader>
            <CardTitle>Latest interview link</CardTitle>
            <p className="text-sm text-muted-foreground">
              Send this URL to your expert. It expires automatically. Use{" "}
              <span className="font-medium text-foreground">Refresh interview link</span>{" "}
              on the brief card if you need a new URL (the previous link stops working).
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <code className="break-all rounded bg-muted px-2 py-2 text-xs">
              {latestInterviewUrl || latestUrl}
            </code>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => copyText(latestInterviewUrl || latestUrl)}
                size="sm"
                type="button"
                variant="secondary"
              >
                Copy URL
              </Button>
              <Button asChild size="sm" type="button" variant="outline">
                <Link href="/drafts">Open drafts</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create or refresh link</CardTitle>
            <p className="text-sm text-muted-foreground">
              One interview per brief. If a link already exists and is still open, refresh
              to rotate the URL.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {briefsQuery === undefined ? (
              <p className="text-sm text-muted-foreground">Loading briefs…</p>
            ) : briefs.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Interview links are created from a{" "}
                  <span className="font-medium text-foreground">brief</span>. Add a
                  brief on the Briefs page, then come back here and use{" "}
                  <span className="font-medium text-foreground">Create link</span>{" "}
                  next to that brief.
                </p>
                <Button asChild type="button">
                  <Link href="/briefs">Go to Briefs</Link>
                </Button>
              </div>
            ) : (
              briefs.map((brief) => {
                const existing = interviewByBriefId.get(brief._id);
                const hasUnusedPending =
                  existing?.status === "pending" && !existing.startedAt;
                const canRefreshUnused =
                  !!existing &&
                  (hasUnusedPending ||
                    existing.status === "failed" ||
                    existing.status === "expired");
                const isBlocked =
                  !!existing &&
                  (existing.status === "in_progress" ||
                    existing.status === "completed" ||
                    (existing.status === "pending" && !!existing.startedAt));

                let actionLabel = "Create interview link";
                if (isBlocked) {
                  actionLabel =
                    existing!.status === "completed"
                      ? "Interview completed"
                      : "Interview in progress";
                } else if (canRefreshUnused) {
                  actionLabel = "Refresh interview link";
                }

                return (
                  <div
                    key={brief._id}
                    className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="font-medium">{brief.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {briefPhaseLabel(brief.phase)}
                      </p>
                      {existing && isBlocked ? (
                        <p className="text-xs text-muted-foreground">
                          {existing.status === "completed"
                            ? "Interview completed — continue in Drafts."
                            : "Interview in progress — share the link you already created."}
                        </p>
                      ) : existing && canRefreshUnused ? (
                        <p className="text-xs text-muted-foreground">
                          Refreshing issues a new URL; any previous link for this brief stops
                          working.
                        </p>
                      ) : null}
                    </div>
                    <Button
                      disabled={
                        creatingFor === brief._id || (!!existing && !!isBlocked)
                      }
                      onClick={() => handleCreate(brief._id)}
                      size="sm"
                      type="button"
                      className="shrink-0"
                    >
                      {creatingFor === brief._id
                        ? existing
                          ? "Refreshing…"
                          : "Creating…"
                        : actionLabel}
                    </Button>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workspace interviews</CardTitle>
            <p className="text-sm text-muted-foreground">
              One row per brief (your active interview). After the guest submits, check{" "}
              <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/drafts">
                Drafts
              </Link>{" "}
              for the generated markdown.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {interviewsQuery === undefined ? (
              <p className="text-sm text-muted-foreground">Loading interviews…</p>
            ) : (interviewsQuery ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No interviews yet. Create a link from a brief on the left, then refresh
                this list after your guest opens it.
              </p>
            ) : (
              (interviewsQuery ?? []).map((interview) => (
                <div
                  key={interview._id}
                  className="rounded-md border p-3 text-sm text-muted-foreground"
                >
                  <p className="font-medium text-foreground">{interview.briefTitle}</p>
                  <p className="mt-1 text-xs">
                    <span className="text-muted-foreground">Status:</span>{" "}
                    <span className="font-medium text-foreground">
                      {interviewStatusLabel(interview.status)}
                    </span>
                    {" · "}
                    <span className="text-muted-foreground">Link expires</span>{" "}
                    <span className="font-medium text-foreground">
                      {format(interview.expiresAt, "PP")}
                    </span>
                  </p>
                  {interview.draftStatus ? (
                    <p className="mt-2 text-xs">
                      <span className="text-muted-foreground">Draft:</span>{" "}
                      <span className="font-medium text-foreground">
                        {interview.draftStatus}
                      </span>
                      {interview.status === "completed" ? (
                        <>
                          {" "}
                          ·{" "}
                          <Link
                            className="font-medium text-primary underline-offset-4 hover:underline"
                            href="/drafts"
                          >
                            Open drafts
                          </Link>
                        </>
                      ) : null}
                    </p>
                  ) : interview.status === "completed" ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Draft record will appear in Drafts within a few seconds.
                    </p>
                  ) : null}
                  {interview.transcript ? (
                    <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-xs">
                      {interview.transcript}
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

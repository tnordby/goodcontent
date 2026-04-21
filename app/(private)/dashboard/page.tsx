"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CONTENT_PIPELINE_COLUMNS,
  PUBLISHED_PIPELINE_COLUMN_ID,
  briefPhaseToPipelineColumnId,
  pipelineColumnsForDashboard,
  type ContentPipelineColumnId,
} from "@/lib/content-pipeline";
import { contentTypeLabel } from "@/lib/pipeline-labels";
import { briefPhaseLabel } from "@/lib/brief-phase";

type BriefDoc = Doc<"briefs">;

function PipelineCard({ brief }: { brief: BriefDoc }) {
  return (
    <Link
      className="block rounded-md border bg-background p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/20"
      href={`/briefs/${brief._id}`}
    >
      <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-foreground">
        {brief.title}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="rounded bg-muted px-1.5 py-0.5 font-medium text-foreground">
          {contentTypeLabel(brief.contentType)}
        </span>
        <span className="text-muted-foreground">
          {briefPhaseLabel(brief.phase)}
        </span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">
          Updated{" "}
          {formatDistanceToNow(brief.updatedAt, { addSuffix: true })}
        </span>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const briefsQuery = useQuery(api.briefs.listByCurrentWorkspace);
  const interviewsQuery = useQuery(api.interviews.listByCurrentWorkspace);
  const [showPublished, setShowPublished] = useState(false);

  const visibleColumns = useMemo(
    () => pipelineColumnsForDashboard(showPublished),
    [showPublished],
  );

  const briefsByColumn = useMemo(() => {
    const map = new Map<ContentPipelineColumnId, BriefDoc[]>();
    for (const col of CONTENT_PIPELINE_COLUMNS) {
      map.set(col.id, []);
    }
    const list = briefsQuery ?? [];
    for (const brief of list) {
      const colId = briefPhaseToPipelineColumnId(brief.phase);
      map.get(colId)?.push(brief);
    }
    for (const col of CONTENT_PIPELINE_COLUMNS) {
      const arr = map.get(col.id)!;
      arr.sort((a, b) => b.updatedAt - a.updatedAt);
    }
    return map;
  }, [briefsQuery]);

  const publishedCount =
    briefsByColumn.get(PUBLISHED_PIPELINE_COLUMN_ID)?.length ?? 0;

  const totalBriefs = briefsQuery?.length ?? 0;
  const wipCount = useMemo(() => {
    if (!briefsQuery) return 0;
    return briefsQuery.filter((b) => b.phase !== "pushed").length;
  }, [briefsQuery]);

  const leaderboard = useMemo(() => {
    if (!interviewsQuery) return [];
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
    for (const row of interviewsQuery) {
      if (row.status !== "completed" || !row.completedAt) continue;
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
  }, [interviewsQuery]);

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Your <span className="font-medium text-foreground">content pipeline</span>{" "}
          lists every brief by stage. Open a card to see that piece of content in one
          place, then jump to interviews or drafts.
        </p>
        {briefsQuery !== undefined ? (
          <p className="mt-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{wipCount}</span> in progress
            {totalBriefs !== wipCount ? (
              <>
                {" "}
                ·{" "}
                <span className="font-medium text-foreground">
                  {totalBriefs - wipCount}
                </span>{" "}
                published
              </>
            ) : null}
          </p>
        ) : null}
      </div>

      <section aria-labelledby="pipeline-heading" className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="pipeline-heading"
              className="text-lg font-semibold tracking-tight"
            >
              Content pipeline
            </h2>
            <p className="text-sm text-muted-foreground">
              Same stages as your brief lifecycle — newest updates first in each column.
            </p>
            {!showPublished && publishedCount > 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{publishedCount}</span>{" "}
                published {publishedCount === 1 ? "item" : "items"} hidden — use{" "}
                <span className="font-medium text-foreground">Include published</span> to
                show that column.
              </p>
            ) : null}
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <div
              className="flex rounded-lg border bg-muted/30 p-0.5 text-xs font-medium"
              role="group"
              aria-label="Pipeline view"
            >
              <button
                type="button"
                className={`rounded-md px-3 py-1.5 transition-colors ${
                  !showPublished
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setShowPublished(false)}
              >
                In progress
              </button>
              <button
                type="button"
                className={`rounded-md px-3 py-1.5 transition-colors ${
                  showPublished
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setShowPublished(true)}
              >
                Include published
              </button>
            </div>
            <Button asChild size="sm" type="button" variant="outline">
              <Link href="/briefs">New brief</Link>
            </Button>
          </div>
        </div>

        {briefsQuery === undefined ? (
          <p className="text-sm text-muted-foreground">Loading pipeline…</p>
        ) : briefsQuery.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">No content yet</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
              <p>Create a brief to see it move across Planning → Interview → Drafting.</p>
              <Button asChild className="w-fit" type="button">
                <Link href="/briefs">Create your first brief</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 pt-1 [scrollbar-gutter:stable]">
            {visibleColumns.map((col) => {
              const items = briefsByColumn.get(col.id) ?? [];
              return (
                <div
                  key={col.id}
                  className="flex w-[min(100%,290px)] shrink-0 flex-col rounded-lg border bg-muted/25"
                >
                  <div className="flex items-center justify-between border-b bg-muted/45 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold uppercase tracking-wide text-foreground/90">
                        {col.title}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {col.description}
                      </p>
                    </div>
                    <span className="rounded-full border bg-background px-2 py-0.5 text-[11px] font-semibold tabular-nums text-foreground">
                      {items.length}
                    </span>
                  </div>
                  <div className="flex min-h-[180px] flex-1 flex-col gap-2 p-2">
                    {items.length === 0 ? (
                      <p className="px-1 py-6 text-center text-xs text-muted-foreground">
                        Nothing in this stage
                      </p>
                    ) : (
                      items.map((brief) => (
                        <PipelineCard brief={brief} key={brief._id} />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Contributor leaderboard</h2>
          <p className="text-sm text-muted-foreground">
            Top contributors by completed interviews in this workspace.
          </p>
        </div>
        {interviewsQuery === undefined ? (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              Loading leaderboard…
            </CardContent>
          </Card>
        ) : leaderboard.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              No completed interviews yet. Once guests submit interviews, top
              contributors will appear here.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {leaderboard.slice(0, 10).map((person, idx) => (
                  <div
                    className="flex items-center justify-between gap-4 px-4 py-3"
                    key={`${person.displayName}-${idx}`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {idx + 1}. {person.displayName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {person.email ?? "No email provided"}
                      </p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>
                        <span className="font-semibold text-foreground">
                          {person.completedInterviews}
                        </span>{" "}
                        interviews
                      </p>
                      <p>
                        {person.totalCharacters.toLocaleString()} chars · last{" "}
                        {formatDistanceToNow(person.lastContributionAt, {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Workspace</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Briefs</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild size="sm" variant="outline">
                <Link href="/briefs">Open briefs</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Interviews</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild size="sm" variant="outline">
                <Link href="/interviews">Open interviews</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Drafts</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild size="sm" variant="outline">
                <Link href="/drafts">Open drafts</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild size="sm" variant="outline">
                <Link href="/settings">Open settings</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

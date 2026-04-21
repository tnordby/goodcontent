"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { briefPhaseLabel } from "@/lib/brief-phase";
import {
  contentTypeLabel,
  interviewStatusLabel,
} from "@/lib/pipeline-labels";

export default function BriefHubPage() {
  const params = useParams();
  const raw = params.briefId;
  const briefId =
    typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : undefined;

  const brief = useQuery(
    api.briefs.get,
    briefId ? { briefId: briefId as Id<"briefs"> } : "skip",
  );

  if (!briefId) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <p className="text-sm text-muted-foreground">Invalid brief link.</p>
        <Button asChild className="mt-4" type="button" variant="outline">
          <Link href="/briefs">Back to Briefs</Link>
        </Button>
      </div>
    );
  }

  if (brief === undefined) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <p className="text-sm text-muted-foreground">Loading this content…</p>
      </div>
    );
  }

  if (brief === null) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <h1 className="text-xl font-semibold">Content not found</h1>
        <p className="text-sm text-muted-foreground">
          This brief does not exist or is not in your workspace.
        </p>
        <Button asChild type="button" variant="outline">
          <Link href="/briefs">Back to Briefs</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 md:p-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Content
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{brief.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
            {contentTypeLabel(brief.contentType)}
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">
            Stage:{" "}
            <span className="font-medium text-foreground">
              {briefPhaseLabel(brief.phase)}
            </span>
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Brief summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Topic
            </p>
            <p className="mt-1 text-foreground">{brief.topic}</p>
          </div>
          {brief.interviewStatus ? (
            <p>
              Interview:{" "}
              <span className="font-medium text-foreground">
                {interviewStatusLabel(brief.interviewStatus)}
              </span>
            </p>
          ) : null}
          {brief.draftStatus ? (
            <p>
              Draft:{" "}
              <span className="font-medium text-foreground">{brief.draftStatus}</span>
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button asChild type="button">
          <Link href="/briefs">All briefs</Link>
        </Button>
        <Button asChild type="button" variant="secondary">
          <Link href="/interviews">Interview links</Link>
        </Button>
        {brief.draftId ? (
          <>
            <Button asChild type="button">
              <Link href={`/drafts?draft=${brief.draftId}`}>Open this draft</Link>
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href="/drafts">All drafts</Link>
            </Button>
          </>
        ) : (
          <Button asChild type="button" variant="outline">
            <Link href="/drafts">Drafts</Link>
          </Button>
        )}
        <Button asChild type="button" variant="outline">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}

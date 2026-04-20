"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { briefPhaseLabel } from "@/lib/brief-phase";

export default function InterviewsPage() {
  const briefsQuery = useQuery(api.briefs.listByCurrentWorkspace);
  const interviewsQuery = useQuery(api.interviews.listByCurrentWorkspace);
  const briefs = briefsQuery ?? [];
  const interviews = interviewsQuery ?? [];
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

  const handleCreate = async (briefId: Id<"briefs">) => {
    setCreatingFor(briefId);
    try {
      const result = await createLink({ briefId });
      setLatestUrl(result.interviewUrl);
      toast.success("Interview link created");
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
          Track guest interview links, interview states, transcripts, and
          follow-up activity.
        </p>
      </div>

      {latestUrl ? (
        <Card>
          <CardHeader>
            <CardTitle>Latest interview link</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <code className="break-all rounded bg-muted px-2 py-1">
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
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create interview link from brief</CardTitle>
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
              briefs.map((brief) => (
                <div
                  key={brief._id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <p className="font-medium">{brief.title}</p>
                    <p className="text-xs uppercase text-muted-foreground">
                      {briefPhaseLabel(brief.phase)}
                    </p>
                  </div>
                  <Button
                    disabled={creatingFor === brief._id}
                    onClick={() => handleCreate(brief._id)}
                    size="sm"
                  >
                    {creatingFor === brief._id ? "Creating..." : "Create link"}
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workspace interviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {interviewsQuery === undefined ? (
              <p className="text-sm text-muted-foreground">Loading interviews…</p>
            ) : interviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No interviews yet. After you create a link from a brief, it will
                show up here.
              </p>
            ) : (
              interviews.map((interview) => (
                <div
                  key={interview._id}
                  className="rounded-md border p-3 text-sm text-muted-foreground"
                >
                  <p className="font-medium text-foreground">{interview.briefTitle}</p>
                  <p className="text-xs text-muted-foreground">Brief ID: {interview.briefId}</p>
                  <p className="mt-2">Status: {interview.status}</p>
                  {interview.transcript ? (
                    <p className="mt-2 line-clamp-4 whitespace-pre-wrap">{interview.transcript}</p>
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

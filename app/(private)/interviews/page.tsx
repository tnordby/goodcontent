"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api as rawApi } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const api = rawApi as any;

export default function InterviewsPage() {
  const briefs = useQuery(api.briefs.listByCurrentWorkspace) ?? [];
  const interviews = useQuery(api.interviews.listByCurrentWorkspace) ?? [];
  const createLink = useMutation(api.interviews.createLinkForBrief);
  const [creatingFor, setCreatingFor] = useState<string | null>(null);
  const [latestUrl, setLatestUrl] = useState<string>("");

  const handleCreate = async (briefId: string) => {
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
          <CardContent className="text-sm">
            <code className="rounded bg-muted px-2 py-1">{latestUrl}</code>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create interview link from brief</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {briefs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No briefs found. Create a brief first, then generate an interview
                link.
              </p>
            ) : (
              briefs.map((brief: any) => (
                <div
                  key={brief._id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <p className="font-medium">{brief.title}</p>
                    <p className="text-xs uppercase text-muted-foreground">
                      phase: {brief.phase}
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
            {interviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No interviews yet.
              </p>
            ) : (
              interviews.map((interview: any) => (
                <div
                  key={interview._id}
                  className="rounded-md border p-3 text-sm text-muted-foreground"
                >
                  <p className="font-medium text-foreground">
                    Brief ID: {interview.briefId}
                  </p>
                  <p>Status: {interview.status}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

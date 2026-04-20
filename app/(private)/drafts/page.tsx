"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export default function DraftsPage() {
  const drafts = useQuery(api.drafts.listByCurrentWorkspace);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Drafts</h1>
        <p className="mt-2 text-muted-foreground">
          Review generated drafts, apply edits, and prepare approved content for
          HubSpot push.
        </p>
      </div>

      {drafts === undefined ? (
        <Card>
          <CardHeader>
            <CardTitle>Loading</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Fetching drafts for your workspace...
          </CardContent>
        </Card>
      ) : drafts.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No drafts yet</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Complete a guest interview to generate the first draft (MVP: placeholder markdown
            scaffold + verbatim transcript).
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {drafts.map((draft) => (
            <Card key={draft._id}>
              <CardHeader>
                <CardTitle className="text-lg">{draft.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Status: <span className="text-foreground">{draft.status}</span>
                  {" · "}
                  Interview:{" "}
                  <span className="text-foreground">{draft.interviewStatus}</span>
                  {" · "}
                  Output language:{" "}
                  <span className="text-foreground">{draft.outputLanguage}</span>
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                <Textarea readOnly value={draft.contentMarkdown} rows={16} className="font-mono text-xs" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


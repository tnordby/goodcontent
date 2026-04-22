"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { briefPhaseLabel } from "@/lib/brief-phase";
import { formatDistanceToNow } from "date-fns";

export default function ResearchPage() {
  const rowsQuery = useQuery(api.research.listByCurrentWorkspace);
  const approve = useMutation(api.research.approve);
  const rows = useMemo(() => rowsQuery ?? [], [rowsQuery]);

  const handleApprove = async (briefId: Id<"briefs">) => {
    try {
      await approve({ briefId });
      toast.success("Research approved — brief moved to Outline");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not approve research");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Research</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Workspace research notes per brief. Approve when ready to move into Outline.
        </p>
      </div>

      {rowsQuery === undefined ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No research yet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Start a brief and open it, then click <strong>Start research</strong>.
            </p>
            <Button asChild type="button" variant="outline">
              <Link href="/briefs">Go to briefs</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map(({ research, brief }) => (
            <Card key={research._id}>
              <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
                <div>
                  <CardTitle className="text-base">{brief?.title ?? "Unknown brief"}</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Status: <span className="font-medium">{research.status}</span>
                    {brief ? (
                      <>
                        {" · "}Phase:{" "}
                        <span className="font-medium">{briefPhaseLabel(brief.phase)}</span>
                      </>
                    ) : null}
                    {" · "}Updated {formatDistanceToNow(research.updatedAt, { addSuffix: true })}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {brief ? (
                    <Button asChild size="sm" type="button" variant="outline">
                      <Link href={`/briefs/${brief._id}`}>Open brief</Link>
                    </Button>
                  ) : null}
                  {brief?.phase === "research" && research.status !== "approved" ? (
                    <Button size="sm" type="button" onClick={() => handleApprove(research.briefId)}>
                      Approve → Outline
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent>
                <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-md border bg-muted/40 p-3 text-xs text-foreground">
                  {research.notes}
                </pre>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

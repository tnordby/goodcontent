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

export default function OutlinesPage() {
  const rowsQuery = useQuery(api.outlines.listByCurrentWorkspace);
  const approve = useMutation(api.outlines.approve);
  const rows = useMemo(() => rowsQuery ?? [], [rowsQuery]);

  const handleApprove = async (briefId: Id<"briefs">) => {
    try {
      await approve({ briefId });
      toast.success("Outline approved — brief moved to Interview");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not approve outline");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Outline</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          H2/H3 structures per brief. Approve when ready to generate interview links.
        </p>
      </div>

      {rowsQuery === undefined ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No outlines yet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Approve research for a brief to generate an outline record.</p>
            <Button asChild type="button" variant="outline">
              <Link href="/research">Go to research</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map(({ outline, brief }) => (
            <Card key={outline._id}>
              <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
                <div>
                  <CardTitle className="text-base">{brief?.title ?? "Unknown brief"}</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Status: <span className="font-medium">{outline.status}</span>
                    {brief ? (
                      <>
                        {" · "}Phase:{" "}
                        <span className="font-medium">{briefPhaseLabel(brief.phase)}</span>
                      </>
                    ) : null}
                    {" · "}Updated {formatDistanceToNow(outline.updatedAt, { addSuffix: true })}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {brief ? (
                    <Button asChild size="sm" type="button" variant="outline">
                      <Link href={`/briefs/${brief._id}`}>Open brief</Link>
                    </Button>
                  ) : null}
                  {brief?.phase === "outline" && outline.status !== "approved" ? (
                    <Button size="sm" type="button" onClick={() => handleApprove(outline.briefId)}>
                      Approve → Interview
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent>
                <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-md border bg-muted/40 p-3 text-xs text-foreground">
                  {outline.structure}
                </pre>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

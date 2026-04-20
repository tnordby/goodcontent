"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function DraftsPage() {
  const drafts = useQuery(api.drafts.listByCurrentWorkspace);
  const saveDraft = useMutation(api.drafts.saveDraftContent);
  const approveDraft = useMutation(api.drafts.approveDraft);
  const reopenDraft = useMutation(api.drafts.reopenDraftForEdits);
  const [localBodies, setLocalBodies] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const bodyFor = useCallback(
    (draftId: string, serverMarkdown: string) =>
      localBodies[draftId] ?? serverMarkdown,
    [localBodies],
  );

  const clearLocal = (draftId: string) => {
    setLocalBodies((prev) => {
      const next = { ...prev };
      delete next[draftId];
      return next;
    });
  };

  const onSave = async (draftId: Id<"drafts">, contentMarkdown: string) => {
    const id = draftId as string;
    setBusyId(id);
    try {
      await saveDraft({
        draftId,
        contentMarkdown,
      });
      clearLocal(id);
      toast.success("Draft saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setBusyId(null);
    }
  };

  const onApprove = async (draftId: Id<"drafts">) => {
    const id = draftId as string;
    setBusyId(id);
    try {
      await approveDraft({ draftId });
      clearLocal(id);
      toast.success("Draft approved — brief moved to review");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Approve failed");
    } finally {
      setBusyId(null);
    }
  };

  const onReopen = async (draftId: Id<"drafts">) => {
    const id = draftId as string;
    setBusyId(id);
    try {
      await reopenDraft({ draftId });
      clearLocal(id);
      toast.success("Draft reopened for edits");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Reopen failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Drafts</h1>
        <p className="mt-2 text-muted-foreground">
          Review AI-generated drafts, edit in place, approve when ready for the next
          pipeline step, or send an approved draft back for more edits.
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
            Complete a guest interview to generate the first draft. Drafts are produced
            with Anthropic (Claude) from the brief and transcript (set{" "}
            <code className="rounded bg-muted px-1">ANTHROPIC_API_KEY</code> on your Convex
            deployment).
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {drafts.map((draft) => {
            const id = draft._id as string;
            const isBusy = busyId === id;
            const canEdit =
              draft.status !== "generating" &&
              draft.status !== "approved" &&
              draft.status !== "pushed" &&
              draft.status !== "push_pending" &&
              draft.status !== "push_failed";
            const canApprove =
              draft.status === "ready" || draft.status === "edited";
            const canReopen = draft.status === "approved";

            return (
              <Card key={draft._id}>
                <CardHeader>
                  <CardTitle className="text-lg">{draft.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Draft:{" "}
                    <span className="text-foreground">{draft.status}</span>
                    {" · "}
                    Brief phase:{" "}
                    <span className="text-foreground">{draft.briefPhase}</span>
                    {" · "}
                    Interview:{" "}
                    <span className="text-foreground">{draft.interviewStatus}</span>
                    {" · "}
                    Output language:{" "}
                    <span className="text-foreground">{draft.outputLanguage}</span>
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {draft.status === "generating" ? (
                    <p className="text-sm text-muted-foreground">
                      Draft is still generating… this page will update when ready.
                    </p>
                  ) : null}
                  <Textarea
                    readOnly={!canEdit}
                    value={bodyFor(id, draft.contentMarkdown)}
                    onChange={(event) =>
                      setLocalBodies((prev) => ({
                        ...prev,
                        [id]: event.target.value,
                      }))
                    }
                    rows={18}
                    className="font-mono text-xs"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      disabled={
                        !canEdit ||
                        isBusy ||
                        bodyFor(id, draft.contentMarkdown).trim() ===
                          draft.contentMarkdown.trim()
                      }
                      onClick={() =>
                        onSave(draft._id, bodyFor(id, draft.contentMarkdown))
                      }
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      {isBusy ? "…" : "Save changes"}
                    </Button>
                    <Button
                      disabled={!canApprove || isBusy}
                      onClick={() => onApprove(draft._id)}
                      size="sm"
                      type="button"
                    >
                      Approve
                    </Button>
                    <Button
                      disabled={!canReopen || isBusy}
                      onClick={() => onReopen(draft._id)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Reopen for edits
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

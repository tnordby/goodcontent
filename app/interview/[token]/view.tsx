"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

function resolveConvexSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_CONVEX_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const cloud = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  if (!cloud) return "";

  if (cloud.includes(".convex.cloud")) {
    return cloud.replace(".convex.cloud", ".convex.site").replace(/\/$/, "");
  }

  // Local dev default (see `.env.example`)
  if (cloud.includes(":3210")) {
    return cloud.replace(":3210", ":3211").replace(/\/$/, "");
  }

  return "";
}

export function GuestInterviewClient({ token }: { token: string }) {
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [didSubmit, setDidSubmit] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const session = useQuery(api.interviews.getGuestSessionByToken, { token });
  const startInterview = useMutation(api.interviews.startByToken);
  const convexSiteUrl = useMemo(() => resolveConvexSiteUrl(), []);

  const onStart = async () => {
    if (!token || isStarting) return;
    setIsStarting(true);
    try {
      await startInterview({ token });
      toast.success("Interview started");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start interview");
    } finally {
      setIsStarting(false);
    }
  };

  const onSubmit = async () => {
    if (!token || isSubmitting) return;
    if (!convexSiteUrl) {
      toast.error("Missing Convex site URL (set NEXT_PUBLIC_CONVEX_SITE_URL)");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${convexSiteUrl}/guest/interview/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          transcript,
          guestName: guestName.trim() || undefined,
          guestEmail: guestEmail.trim() || undefined,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to submit interview");
      }

      setDidSubmit(true);
      toast.success("Interview submitted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit interview");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Guest Interview</h1>

      {session === undefined ? (
        <div className="rounded-lg border p-5 text-sm text-muted-foreground">
          Loading interview session...
        </div>
      ) : session.state === "invalid" ? (
        <div className="rounded-lg border p-5 text-sm text-red-600">
          This interview link is invalid.
        </div>
      ) : session.state === "expired" ? (
        <div className="rounded-lg border p-5 text-sm text-amber-700">
          This interview link has expired.
        </div>
      ) : session.state === "used" || didSubmit ? (
        <div className="rounded-lg border p-5 text-sm text-muted-foreground">
          Thanks — this interview has been submitted. The team can now generate and review
          the draft in the workspace.
        </div>
      ) : (
        <div className="space-y-5 rounded-lg border p-5 text-sm text-muted-foreground">
          <div className="space-y-2">
            <p>
              <span className="font-medium text-foreground">Brief:</span> {session.briefTitle}
            </p>
            {session.briefTopic ? (
              <p>
                <span className="font-medium text-foreground">Topic:</span> {session.briefTopic}
              </p>
            ) : null}
            <p className="text-xs uppercase tracking-wide">
              Content type: {session.contentType}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="guestName">Your name (optional)</Label>
              <Input
                id="guestName"
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
                placeholder="Jane Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guestEmail">Your email (optional)</Label>
              <Input
                id="guestEmail"
                value={guestEmail}
                onChange={(event) => setGuestEmail(event.target.value)}
                placeholder="jane@company.com"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <p>
              <span className="font-medium text-foreground">Interview language:</span>{" "}
              {session.interviewerLanguage}
            </p>
            <p>
              <span className="font-medium text-foreground">Output language:</span>{" "}
              {session.outputLanguage}
            </p>
          </div>

          <p>
            <span className="font-medium text-foreground">Status:</span> {session.status}
          </p>

          {session.status === "pending" ? (
            <Button onClick={onStart} disabled={isStarting}>
              {isStarting ? "Starting..." : "Start interview"}
            </Button>
          ) : null}

          {session.status === "in_progress" ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="transcript">Interview transcript</Label>
                <Textarea
                  id="transcript"
                  value={transcript}
                  onChange={(event) => setTranscript(event.target.value)}
                  placeholder="Paste answers here (MVP: plain text). Minimum ~10 characters."
                  rows={10}
                />
                <p className="text-xs text-muted-foreground">
                  This MVP flow stores your transcript verbatim and generates a placeholder draft
                  for your team to edit.
                </p>
              </div>
              <Button
                onClick={onSubmit}
                disabled={isSubmitting || transcript.trim().length < 10 || !convexSiteUrl}
              >
                {isSubmitting ? "Submitting..." : "Submit interview"}
              </Button>
              {!convexSiteUrl ? (
                <p className="text-xs text-red-600">
                  This environment is missing `NEXT_PUBLIC_CONVEX_SITE_URL` (or a derivable Convex
                  cloud URL), so submission is disabled.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </main>
  );
}


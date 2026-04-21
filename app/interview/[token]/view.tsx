"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { contentTypeLabel } from "@/lib/pipeline-labels";
import { toast } from "sonner";

function resolveConvexSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_CONVEX_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const cloud = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  if (!cloud) return "";

  if (cloud.includes(".convex.cloud")) {
    return cloud.replace(".convex.cloud", ".convex.site").replace(/\/$/, "");
  }

  if (cloud.includes(":3210")) {
    return cloud.replace(":3210", ":3211").replace(/\/$/, "");
  }

  return "";
}

const MIN_TRANSCRIPT = 10;

export function GuestInterviewClient({ token }: { token: string }) {
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [didSubmit, setDidSubmit] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [consentToStart, setConsentToStart] = useState(false);
  const session = useQuery(api.interviews.getGuestSessionByToken, { token });
  const startInterview = useMutation(api.interviews.startByToken);
  const convexSiteUrl = useMemo(() => resolveConvexSiteUrl(), []);

  const expiresLabel = useMemo(() => {
    if (session?.state !== "valid") return null;
    try {
      return format(session.expiresAt, "PPP");
    } catch {
      return null;
    }
  }, [session]);

  const onStart = async () => {
    if (!token || isStarting) return;
    if (!consentToStart) {
      toast.error("Please confirm consent before starting");
      return;
    }
    setIsStarting(true);
    try {
      await startInterview({ token, consentAcknowledged: true });
      toast.success("You can now add your responses below");
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
      toast.success("Responses received — your team will see the draft shortly");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit interview");
    } finally {
      setIsSubmitting(false);
    }
  };

  const transcriptLen = transcript.trim().length;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Expert interview
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Share your perspective</h1>
        <p className="text-sm text-muted-foreground">
          Your host uses this link once. Add your answers in your own words — they feed
          directly into a first draft for the team to refine.
        </p>
      </header>

      <ol className="flex flex-wrap gap-4 text-xs text-muted-foreground sm:gap-8">
        <li className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-full border bg-background font-medium text-foreground">
            1
          </span>
          Review brief
        </li>
        <li className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-full border bg-background font-medium text-foreground">
            2
          </span>
          Answer questions
        </li>
        <li className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-full border bg-background font-medium text-foreground">
            3
          </span>
          Submit
        </li>
      </ol>

      {session === undefined ? (
        <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground shadow-sm">
          Loading this interview link…
        </div>
      ) : session.state === "invalid" ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          This link is not valid. Ask your host for a new interview link from their
          GoodContent workspace.
        </div>
      ) : session.state === "expired" ? (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-6 text-sm text-amber-950 dark:text-amber-100">
          This link has expired. Ask your host to open{" "}
          <span className="font-medium text-foreground">Interviews</span> in GoodContent
          and use <span className="font-medium text-foreground">Refresh interview link</span>{" "}
          for this brief to send you a new URL.
        </div>
      ) : session.state === "used" || didSubmit ? (
        <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground shadow-sm">
          <p className="font-medium text-foreground">Thank you — you&apos;re all set.</p>
          <p className="mt-2">
            Your responses were delivered. The team will see an AI-generated draft in
            their workspace (usually within a minute) and may follow up if anything is
            unclear.
          </p>
          <p className="mt-3 text-xs">You can close this tab.</p>
        </div>
      ) : (
        <div className="space-y-8 rounded-lg border bg-card p-6 shadow-sm">
          <section className="space-y-3 border-b pb-6 text-sm">
            <h2 className="text-base font-semibold text-foreground">What you&apos;re contributing to</h2>
            <dl className="grid gap-2 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Working title
                </dt>
                <dd className="font-medium text-foreground">{session.briefTitle}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Format
                </dt>
                <dd className="text-foreground">{contentTypeLabel(session.contentType)}</dd>
              </div>
              {session.briefTopic ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Topic
                  </dt>
                  <dd className="text-foreground">{session.briefTopic}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Answer in
                </dt>
                <dd className="text-foreground">{session.interviewerLanguage}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Draft language
                </dt>
                <dd className="text-foreground">{session.outputLanguage}</dd>
              </div>
              {session.toneOfVoice ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Tone
                  </dt>
                  <dd className="text-foreground">{session.toneOfVoice}</dd>
                </div>
              ) : null}
            </dl>
            {expiresLabel ? (
              <p className="text-xs text-muted-foreground">
                Link valid until <span className="font-medium text-foreground">{expiresLabel}</span>
              </p>
            ) : null}
          </section>

          <section className="space-y-4">
            <h2 className="text-base font-semibold text-foreground">About you (optional)</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="guestName">Name</Label>
                <Input
                  id="guestName"
                  value={guestName}
                  onChange={(event) => setGuestName(event.target.value)}
                  placeholder="Jane Doe"
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guestEmail">Work email</Label>
                <Input
                  id="guestEmail"
                  type="email"
                  value={guestEmail}
                  onChange={(event) => setGuestEmail(event.target.value)}
                  placeholder="jane@company.com"
                  autoComplete="email"
                />
              </div>
            </div>
          </section>

          {session.status === "pending" ? (
            <section className="space-y-4 rounded-md border bg-muted/30 p-4">
              <div className="flex items-start gap-3">
                <input
                  checked={consentToStart}
                  className="mt-1 size-4 shrink-0 rounded border border-input accent-primary"
                  id="consent"
                  onChange={(event) => setConsentToStart(event.target.checked)}
                  type="checkbox"
                />
                <Label className="cursor-pointer leading-snug" htmlFor="consent">
                  I agree to share my written responses with the team that invited me,
                  and I understand they will be used to generate and edit marketing
                  content. I confirm I have authority to speak on this topic for my
                  organization where applicable.
                </Label>
              </div>
              <Button disabled={isStarting || !consentToStart} onClick={onStart} type="button">
                {isStarting ? "Starting…" : "Start — I’m ready to answer"}
              </Button>
            </section>
          ) : null}

          {session.status === "in_progress" ? (
            <section className="space-y-4">
              <h2 className="text-base font-semibold text-foreground">Your responses</h2>
              {session.customQuestions.length > 0 ? (
                <div className="rounded-md border bg-muted/20 p-4 text-sm">
                  <p className="font-medium text-foreground">Suggested angles</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    You don&apos;t need to answer line-by-line — use them as a guide while
                    you write in the box below.
                  </p>
                  <ul className="mt-3 list-decimal space-y-2 pl-5 text-foreground">
                    {session.customQuestions.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="space-y-2">
                <div className="flex items-baseline justify-between gap-2">
                  <Label htmlFor="transcript">Write or paste your answers</Label>
                  <span
                    className={
                      transcriptLen < MIN_TRANSCRIPT
                        ? "text-xs text-muted-foreground"
                        : "text-xs text-emerald-600 dark:text-emerald-400"
                    }
                  >
                    {transcriptLen} / {MIN_TRANSCRIPT}+ characters
                  </span>
                </div>
                <Textarea
                  id="transcript"
                  value={transcript}
                  onChange={(event) => setTranscript(event.target.value)}
                  placeholder="Share context, examples, metrics you’re comfortable including, quotes, and anything else that will help the writer. Plain text is fine."
                  rows={14}
                  className="min-h-[200px] resize-y text-base leading-relaxed"
                />
                <p className="text-xs text-muted-foreground">
                  Your text is stored as you provide it and combined with the brief to
                  generate a draft (Claude). You can edit tone later with your host — the
                  goal here is substance and accuracy.
                </p>
              </div>
              <Button
                onClick={onSubmit}
                disabled={
                  isSubmitting || transcriptLen < MIN_TRANSCRIPT || !convexSiteUrl
                }
                type="button"
              >
                {isSubmitting ? "Submitting…" : "Submit responses"}
              </Button>
              {!convexSiteUrl ? (
                <p className="text-xs text-destructive">
                  This site is not configured for guest submissions yet (
                  <code className="rounded bg-muted px-1">NEXT_PUBLIC_CONVEX_SITE_URL</code>
                  ).
                </p>
              ) : null}
            </section>
          ) : null}
        </div>
      )}
    </main>
  );
}

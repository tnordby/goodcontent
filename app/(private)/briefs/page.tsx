"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { FormEvent, useMemo, useState } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { briefPhaseLabel } from "@/lib/brief-phase";

const CONTENT_TYPE_OPTIONS = [
  { value: "blog_post", label: "Blog post" },
  { value: "case_study", label: "Case study" },
  { value: "customer_story", label: "Customer story" },
  { value: "guide", label: "Guide" },
  { value: "landing_page", label: "Landing page" },
  { value: "web_page", label: "Web page" },
  { value: "email", label: "Email" },
  { value: "sales_collateral", label: "Sales collateral" },
] as const;

type ContentTypeValue = (typeof CONTENT_TYPE_OPTIONS)[number]["value"];

export default function BriefsPage() {
  const { isLoaded: clerkLoaded, isSignedIn } = useAuth();
  const { isLoading: convexAuthLoading, isAuthenticated } = useConvexAuth();
  const briefsQuery = useQuery(
    api.briefs.listByCurrentWorkspace,
    clerkLoaded && isSignedIn ? {} : "skip",
  );
  const createBrief = useMutation(api.briefs.create);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    topic: "",
    contentType: "blog_post" as ContentTypeValue,
    toneOfVoice: "conversational and direct",
    interviewerLanguage: "en",
    outputLanguage: "en",
    keywords: "",
    sources: "",
  });

  const canSubmit = useMemo(() => {
    return form.title.trim().length > 2 && form.topic.trim().length > 5;
  }, [form.title, form.topic]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || isSaving) return;
    if (!isSignedIn) {
      toast.error("Sign in to create a brief");
      return;
    }
    if (!isAuthenticated) {
      toast.error(
        "Convex does not have your Clerk session yet. In Clerk: JWT Templates → create a template named “convex” for Convex, then reload.",
      );
      return;
    }

    setIsSaving(true);
    try {
      await createBrief({
        contentType: form.contentType,
        title: form.title,
        topic: form.topic,
        toneOfVoice: form.toneOfVoice,
        interviewerLanguage: form.interviewerLanguage,
        outputLanguage: form.outputLanguage,
        keywords: form.keywords
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        sources: form.sources
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
      });

      setForm((prev) => ({
        ...prev,
        title: "",
        topic: "",
        keywords: "",
        sources: "",
      }));
      toast.success("Brief created — next, create an interview link", {
        description: "Open Interviews to invite your expert.",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create brief");
    } finally {
      setIsSaving(false);
    }
  };

  const briefs = briefsQuery ?? [];

  if (!clerkLoaded) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-8">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-8">
        <h1 className="text-3xl font-bold tracking-tight">Briefs</h1>
        <p className="text-muted-foreground">
          Sign in to create and view briefs.
        </p>
        <Button asChild type="button">
          <Link href="/sign-in">Sign in</Link>
        </Button>
      </div>
    );
  }

  const authBlocked =
    !convexAuthLoading && !isAuthenticated ? (
      <div
        className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100"
        role="status"
      >
        <p className="font-medium">Backend session not linked</p>
        <p className="mt-1 text-muted-foreground dark:text-amber-950/80">
          Clerk is signed in, but Convex is not receiving a JWT. In the Clerk
          dashboard, add a JWT template named{" "}
          <code className="rounded bg-background/60 px-1">convex</code> (see{" "}
          <a
            className="underline"
            href="https://clerk.com/docs/guides/development/integrations/databases/convex"
            rel="noreferrer"
            target="_blank"
          >
            Clerk → Convex
          </a>
          ), set the same issuer in your Convex deployment (
          <code className="rounded bg-background/60 px-1">CLERK_FRONTEND_API_URL</code>
          ), then reload this page.
        </p>
      </div>
    ) : null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Briefs</h1>
        <p className="mt-2 text-muted-foreground">
          Create and manage content briefs with language, tone, outline, and
          SME interview context.
        </p>
      </div>
      {authBlocked}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Pipeline:</span> brief → guest
            interview → AI draft → review
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" type="button" variant="secondary">
              <Link href="/interviews">Interview links</Link>
            </Button>
            <Button asChild size="sm" type="button" variant="outline">
              <Link href="/drafts">Drafts</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create brief</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder="e.g. How Beacon reduced onboarding time"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Textarea
                  id="topic"
                  value={form.topic}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, topic: event.target.value }))
                  }
                  placeholder="What is this content about?"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Title needs at least 3 characters and topic at least 6 before you can
                submit.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="contentType">Content type</Label>
                  <Select
                    value={form.contentType}
                    onValueChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        contentType: value as ContentTypeValue,
                      }))
                    }
                  >
                    <SelectTrigger id="contentType" className="w-full">
                      <SelectValue placeholder="Content type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTENT_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tone">Tone</Label>
                  <Input
                    id="tone"
                    value={form.toneOfVoice}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        toneOfVoice: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="interviewerLanguage">Interview language</Label>
                  <Input
                    id="interviewerLanguage"
                    value={form.interviewerLanguage}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        interviewerLanguage: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="outputLanguage">Output language</Label>
                  <Input
                    id="outputLanguage"
                    value={form.outputLanguage}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        outputLanguage: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                <Input
                  id="keywords"
                  value={form.keywords}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, keywords: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sources">Sources (one URL per line)</Label>
                <Textarea
                  id="sources"
                  value={form.sources}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, sources: event.target.value }))
                  }
                />
              </div>
              <Button
                disabled={
                  !canSubmit ||
                  isSaving ||
                  convexAuthLoading ||
                  !isAuthenticated
                }
                type="submit"
              >
                {isSaving ? "Creating..." : "Create brief"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workspace briefs</CardTitle>
            <p className="text-sm text-muted-foreground">
              When a brief is ready, open{" "}
              <Link
                className="font-medium text-primary underline-offset-4 hover:underline"
                href="/interviews"
              >
                Interviews
              </Link>{" "}
              to create a secure link for your expert.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {briefsQuery === undefined ? (
              <p className="text-sm text-muted-foreground">Loading briefs…</p>
            ) : briefs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No briefs yet. Create your first brief to start the interview
                pipeline.
              </p>
            ) : (
              briefs.map((brief) => (
                <div
                  key={brief._id}
                  className="rounded-md border p-3 text-sm text-muted-foreground"
                >
                  <p className="font-medium text-foreground">{brief.title}</p>
                  <p>{brief.topic}</p>
                  <p className="mt-2 text-xs uppercase tracking-wide">
                    {brief.contentType} · {briefPhaseLabel(brief.phase)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

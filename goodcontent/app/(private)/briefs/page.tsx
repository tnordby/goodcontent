"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { NewBriefModal, type NewBriefTypeOption } from "@/components/briefs/new-brief-modal";
import { toast } from "sonner";
import { briefPhaseLabel } from "@/lib/brief-phase";

const CONTENT_TYPE_OPTIONS = [
  {
    value: "blog_post",
    label: "Blog post",
    description: "Long-form article or thought leadership from an SME interview.",
    glyph: "¶",
  },
  {
    value: "case_study",
    label: "Case study",
    description: "Problem to solution to outcome sourced from a customer interview.",
    glyph: "◊",
  },
  {
    value: "customer_story",
    label: "Customer story",
    description: "Short narrative highlighting one customer quote and outcome.",
    glyph: "★",
  },
  {
    value: "guide",
    label: "Guide",
    description: "Step-by-step instructional content built from expert Q&A.",
    glyph: "✺",
  },
  {
    value: "landing_page",
    label: "Landing page",
    description: "High-converting page for a campaign, product, or announcement.",
    glyph: "◎",
  },
  {
    value: "web_page",
    label: "Web page",
    description: "Evergreen page for about, product, solution, or industry content.",
    glyph: "▢",
  },
  {
    value: "email",
    label: "Marketing email",
    description: "Broadcast or nurture email drafted from brand-voice examples.",
    glyph: "✉",
  },
  {
    value: "sales_collateral",
    label: "Sales collateral",
    description: "One-pager or deck from interview-backed proof points.",
    glyph: "↓",
  },
  {
    value: "press_release",
    label: "Press release",
    description: "News announcement for media, quote-led AP-style structure.",
    glyph: "▤",
    available: false,
  },
  {
    value: "product_update",
    label: "Product update",
    description: "Feature or release announcement sourced from PM or engineering interviews.",
    glyph: "◈",
    available: false,
  },
  {
    value: "glossary_entry",
    label: "Glossary entry",
    description: "Definitional SEO page with term, meaning, and related context.",
    glyph: "§",
    available: false,
  },
  {
    value: "opinion_piece",
    label: "Opinion piece",
    description: "POV-driven essay from a founder or executive with clear stance.",
    glyph: "❝",
    available: false,
  },
] as const satisfies readonly NewBriefTypeOption[];

const SUPPORTED_CONTENT_TYPES = [
  "blog_post",
  "case_study",
  "customer_story",
  "guide",
  "landing_page",
  "web_page",
  "email",
  "sales_collateral",
] as const;
type ContentTypeValue = (typeof SUPPORTED_CONTENT_TYPES)[number];
function isSupportedContentType(value: string): value is ContentTypeValue {
  return (SUPPORTED_CONTENT_TYPES as readonly string[]).includes(value);
}

const CONTENT_TYPE_PRESETS: Record<
  ContentTypeValue,
  { tone: string; topicStarter: string; keywords: string[] }
> = {
  blog_post: {
    tone: "helpful and conversational",
    topicStarter: "Explain the key challenge and practical takeaways for readers.",
    keywords: ["best practices", "how to", "framework"],
  },
  case_study: {
    tone: "clear and evidence-backed",
    topicStarter: "Capture the starting problem, implementation, and measurable outcomes.",
    keywords: ["before and after", "results", "implementation"],
  },
  customer_story: {
    tone: "human and narrative",
    topicStarter: "Tell the customer journey with specific moments and outcomes.",
    keywords: ["customer journey", "impact", "experience"],
  },
  guide: {
    tone: "instructional and direct",
    topicStarter: "Break down the process into actionable steps for the reader.",
    keywords: ["step-by-step", "checklist", "practical"],
  },
  landing_page: {
    tone: "confident and conversion-focused",
    topicStarter: "Frame the core problem, value proposition, and CTA for one audience.",
    keywords: ["solution", "benefits", "call to action"],
  },
  web_page: {
    tone: "clear and trustworthy",
    topicStarter: "Clarify what the company offers and who it is for.",
    keywords: ["overview", "services", "positioning"],
  },
  email: {
    tone: "concise and persuasive",
    topicStarter: "Focus on one message and one primary CTA.",
    keywords: ["campaign", "announcement", "follow-up"],
  },
  sales_collateral: {
    tone: "credible and objection-aware",
    topicStarter: "Highlight differentiators, proof, and common objections.",
    keywords: ["proof points", "objections", "ROI"],
  },
};

export default function BriefsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded: clerkLoaded, isSignedIn } = useAuth();
  const { isLoading: convexAuthLoading, isAuthenticated } = useConvexAuth();
  const briefsQuery = useQuery(
    api.briefs.listByCurrentWorkspace,
    clerkLoaded && isSignedIn ? {} : "skip",
  );
  const createBrief = useMutation(api.briefs.create);
  const [isSaving, setIsSaving] = useState(false);
  const [isTypePickerOpen, setIsTypePickerOpen] = useState(false);
  const [hasChosenType, setHasChosenType] = useState(false);
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
    return (
      hasChosenType && form.title.trim().length > 2 && form.topic.trim().length > 5
    );
  }, [form.title, form.topic, hasChosenType]);

  const selectedType = CONTENT_TYPE_OPTIONS.find(
    (option) => option.value === form.contentType,
  );

  useEffect(() => {
    const shouldOpen = searchParams.get("new") === "1";
    if (!shouldOpen) return;
    setIsTypePickerOpen(true);
  }, [searchParams]);

  const applyContentTypePreset = useCallback((contentType: ContentTypeValue) => {
    const preset = CONTENT_TYPE_PRESETS[contentType];
    setForm((prev) => ({
      ...prev,
      contentType,
      toneOfVoice: preset.tone,
      keywords: preset.keywords.join(", "),
      topic: prev.topic.trim().length > 5 ? prev.topic : preset.topicStarter,
    }));
  }, []);

  const onChooseContentType = useCallback(
    (contentType: ContentTypeValue) => {
      applyContentTypePreset(contentType);
      setHasChosenType(true);
      setIsTypePickerOpen(false);
      if (searchParams.get("new") === "1") {
        router.replace("/briefs");
      }
      const label =
        CONTENT_TYPE_OPTIONS.find((option) => option.value === contentType)?.label ??
        "Content type";
      toast.success(`${label} template selected`, {
        description: "Brief fields were adjusted to match this format.",
      });
    },
    [applyContentTypePreset, router, searchParams],
  );

  useEffect(() => {
    const type = searchParams.get("type");
    if (!type) return;
    const exists = CONTENT_TYPE_OPTIONS.some((option) => option.value === type);
    if (!exists) return;
    const title = searchParams.get("title") ?? "";
    const topic = searchParams.get("topic") ?? "";
    const keywords = searchParams.get("keywords") ?? "";
    const tone = searchParams.get("tone") ?? "";
    const sources = searchParams.get("sources") ?? "";
    applyContentTypePreset(type as ContentTypeValue);
    setForm((prev) => ({
      ...prev,
      title: title || prev.title,
      topic: topic || prev.topic,
      keywords: keywords || prev.keywords,
      toneOfVoice: tone || prev.toneOfVoice,
      sources: sources || prev.sources,
    }));
    setHasChosenType(true);
    router.replace("/briefs");
  }, [applyContentTypePreset, router, searchParams]);

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
      setHasChosenType(false);
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
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Create brief</CardTitle>
              <Button onClick={() => setIsTypePickerOpen(true)} type="button" variant="outline">
                New brief
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              {!hasChosenType ? (
                <div className="space-y-3 rounded-md border border-dashed p-4">
                  <p className="text-sm text-muted-foreground">
                    Step 1: pick a content type to start a new brief. We will prefill this
                    form based on your selection.
                  </p>
                  <Button onClick={() => setIsTypePickerOpen(true)} type="button">
                    Pick content type
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs">
                  <span className="text-muted-foreground">Template:</span>
                  <span className="rounded bg-background px-2 py-0.5 font-medium text-foreground">
                    {selectedType?.label ?? form.contentType}
                  </span>
                  <Button
                    onClick={() => setIsTypePickerOpen(true)}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    Change
                  </Button>
                </div>
              )}
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

      <NewBriefModal
        open={isTypePickerOpen}
        options={CONTENT_TYPE_OPTIONS}
        initialSelected={form.contentType}
        onClose={() => {
          setIsTypePickerOpen(false);
          if (searchParams.get("new") === "1") {
            router.replace("/briefs");
          }
        }}
        onContinue={(value) => {
          if (!isSupportedContentType(value.contentType)) {
            toast.message("This content type is coming soon");
            return;
          }
          onChooseContentType(value.contentType);
          setForm((prev) => ({
            ...prev,
            title: value.title || prev.title,
            topic: value.topic || prev.topic,
            keywords: value.keywords || prev.keywords,
            toneOfVoice: value.tone || prev.toneOfVoice,
            sources: value.sources || prev.sources,
          }));
        }}
      />
    </div>
  );
}

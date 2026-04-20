"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api as rawApi } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const api = rawApi as any;

export default function BriefsPage() {
  const briefs = useQuery(api.briefs.listByCurrentWorkspace) ?? [];
  const createBrief = useMutation(api.briefs.create);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    topic: "",
    contentType: "blog_post",
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
      toast.success("Brief created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create brief");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Briefs</h1>
        <p className="mt-2 text-muted-foreground">
          Create and manage content briefs with language, tone, outline, and
          SME interview context.
        </p>
      </div>
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="contentType">Content type</Label>
                  <Input
                    id="contentType"
                    value={form.contentType}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        contentType: event.target.value,
                      }))
                    }
                  />
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
              <Button disabled={!canSubmit || isSaving} type="submit">
                {isSaving ? "Creating..." : "Create brief"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workspace briefs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {briefs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No briefs yet. Create your first brief to start the interview
                pipeline.
              </p>
            ) : (
              briefs.map((brief: any) => (
                <div
                  key={brief._id}
                  className="rounded-md border p-3 text-sm text-muted-foreground"
                >
                  <p className="font-medium text-foreground">{brief.title}</p>
                  <p>{brief.topic}</p>
                  <p className="mt-2 text-xs uppercase tracking-wide">
                    {brief.contentType} · phase: {brief.phase}
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

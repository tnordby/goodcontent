"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState, type CSSProperties } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import styles from "./briefs.module.css";

type ContentType =
  | "blog_post"
  | "case_study"
  | "customer_story"
  | "guide"
  | "landing_page"
  | "web_page"
  | "email"
  | "sales_collateral";

const TYPE_META: Record<ContentType, { glyph: string; label: string }> = {
  blog_post: { glyph: "¶", label: "Blog post" },
  case_study: { glyph: "◊", label: "Case study" },
  customer_story: { glyph: "★", label: "Customer story" },
  guide: { glyph: "✺", label: "Guide" },
  landing_page: { glyph: "◎", label: "Landing page" },
  web_page: { glyph: "▢", label: "Web page" },
  email: { glyph: "✉", label: "Marketing email" },
  sales_collateral: { glyph: "↓", label: "Sales collateral" },
};

const STAGE_META: Record<
  "planning" | "interview" | "drafting" | "review" | "published",
  { label: string; color: string; progress: number }
> = {
  planning: { label: "Planning", color: "#8f8778", progress: 0.2 },
  interview: { label: "Interview", color: "#e24a43", progress: 0.52 },
  drafting: { label: "Drafting", color: "#d0a500", progress: 0.75 },
  review: { label: "Review", color: "#0f9f55", progress: 0.92 },
  published: { label: "Published", color: "#2873d8", progress: 1 },
};

type TabValue = "all" | "mine" | "in_progress" | "review" | "published";
type BriefDoc = Doc<"briefs">;
type StageKey = keyof typeof STAGE_META;
type BriefListRow = BriefDoc & {
  stage: StageKey;
  stageMeta: (typeof STAGE_META)[StageKey];
  typeMeta: { glyph: string; label: string };
};

function phaseToStage(phase: string): keyof typeof STAGE_META {
  if (phase === "pushed") return "published";
  if (phase === "review") return "review";
  if (phase === "draft" || phase === "edit") return "drafting";
  if (phase === "interview") return "interview";
  return "planning";
}

export default function BriefsPage() {
  const currentUser = useQuery(api.users.current);
  const briefsQuery = useQuery(api.briefs.listByCurrentWorkspace);
  const briefs = useMemo(() => briefsQuery ?? [], [briefsQuery]);
  const createBrief = useMutation(api.briefs.create);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [tab, setTab] = useState<TabValue>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState<{
    title: string;
    topic: string;
    contentType: ContentType;
    toneOfVoice: string;
    interviewerLanguage: string;
    outputLanguage: string;
    keywords: string;
    sources: string;
  }>({
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

  const counts = useMemo(() => {
    const mine = currentUser
      ? briefs.filter((brief) => brief.createdBy === currentUser._id).length
      : 0;
    const inProgress = briefs.filter((brief) => brief.phase !== "pushed").length;
    const review = briefs.filter((brief) => brief.phase === "review").length;
    const published = briefs.filter((brief) => brief.phase === "pushed").length;
    return {
      all: briefs.length,
      mine,
      inProgress,
      review,
      published,
    };
  }, [briefs, currentUser]);

  const rows = useMemo(() => {
    const normalized: BriefListRow[] = briefs.map((brief: BriefDoc) => {
      const stage = phaseToStage(brief.phase);
      const contentType = brief.contentType as ContentType;
      return {
        ...brief,
        stage,
        stageMeta: STAGE_META[stage],
        typeMeta: TYPE_META[contentType] ?? { glyph: "•", label: brief.contentType },
      };
    });

    return normalized
      .filter((brief) => {
        if (tab === "mine" && currentUser && brief.createdBy !== currentUser._id) return false;
        if (tab === "in_progress" && brief.stage === "published") return false;
        if (tab === "review" && brief.stage !== "review") return false;
        if (tab === "published" && brief.stage !== "published") return false;

        if (search.trim()) {
          const q = search.toLowerCase();
          return (
            brief.title.toLowerCase().includes(q) ||
            brief.topic.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [briefs, currentUser, search, tab]);

  const selectedCount = useMemo(
    () => Object.values(selected).filter(Boolean).length,
    [selected],
  );
  const allSelected = rows.length > 0 && rows.every((row) => selected[String(row._id)]);

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
      setIsCreateOpen(false);
      toast.success("Brief created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create brief");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-4 p-4 md:p-6">
      <div className={styles.head}>
        <div>
          <h1>Briefs</h1>
          <p>Every brief in this workspace — from planning to published.</p>
        </div>
        <div className={styles.headMeta}>
          <b>{counts.all}</b> total · <b>{counts.inProgress}</b> in progress ·{" "}
          <b>{counts.published}</b> published
        </div>
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Brief segments">
        <button className={tab === "all" ? styles.on : ""} onClick={() => setTab("all")}>
          All <span className={styles.cnt}>{counts.all}</span>
        </button>
        <button className={tab === "mine" ? styles.on : ""} onClick={() => setTab("mine")}>
          Mine <span className={styles.cnt}>{counts.mine}</span>
        </button>
        <button
          className={tab === "in_progress" ? styles.on : ""}
          onClick={() => setTab("in_progress")}
        >
          In progress <span className={styles.cnt}>{counts.inProgress}</span>
        </button>
        <button
          className={tab === "review" ? styles.on : ""}
          onClick={() => setTab("review")}
        >
          Review <span className={styles.cnt}>{counts.review}</span>
        </button>
        <button
          className={tab === "published" ? styles.on : ""}
          onClick={() => setTab("published")}
        >
          Published <span className={styles.cnt}>{counts.published}</span>
        </button>
      </div>

      <div className={styles.toolbar}>
        <label className={styles.search}>
          <span className={styles.ic}>⌕</span>
          <input
            placeholder="Search briefs, topics..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <kbd>/</kbd>
        </label>
        <button className={styles.filter} type="button">
          <span className={styles.lbl}>Type</span>
          <b>All</b>
          <span className={styles.caret}>▾</span>
        </button>
        <button className={styles.filter} type="button">
          <span className={styles.lbl}>Owner</span>
          <b>Any</b>
          <span className={styles.caret}>▾</span>
        </button>
        <button className={styles.filter} type="button">
          <span className={styles.lbl}>Language</span>
          <b>Any</b>
          <span className={styles.caret}>▾</span>
        </button>
        <div className={styles.toolbarRight}>
          <Button size="sm" type="button" variant="outline">
            Export
          </Button>
          <Button size="sm" type="button" variant="outline">
            View
          </Button>
          <Button size="sm" type="button" onClick={() => setIsCreateOpen((prev) => !prev)}>
            {isCreateOpen ? "Close" : "+ New brief"}
          </Button>
        </div>
      </div>

      {isCreateOpen ? (
        <Card>
          <CardHeader>
            <CardTitle>Create brief</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
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
              <div className="space-y-2 md:col-span-2">
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
              <div className="space-y-2">
                <Label htmlFor="contentType">Content type</Label>
                <select
                  id="contentType"
                  value={form.contentType}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      contentType: event.target.value as ContentType,
                    }))
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  {Object.entries(TYPE_META).map(([value, meta]) => (
                    <option key={value} value={value}>
                      {meta.glyph} {meta.label}
                    </option>
                  ))}
                </select>
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
              <div className="md:col-span-2">
                <Button disabled={!canSubmit || isSaving} type="submit">
                  {isSaving ? "Creating..." : "Create brief"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <div className={styles.tableWrap}>
        <div className={`${styles.row} ${styles.header}`}>
          <button
            className={`${styles.check} ${allSelected ? styles.checkOn : ""}`}
            aria-label="Select all"
            onClick={() => {
              if (allSelected) {
                setSelected({});
                return;
              }
              const next: Record<string, boolean> = {};
              rows.forEach((row) => {
                next[String(row._id)] = true;
              });
              setSelected(next);
            }}
          >
            ✓
          </button>
          <span>Title</span>
          <span>Type</span>
          <span>Stage</span>
          <span>Owner</span>
          <span>Lang</span>
          <span>Updated</span>
          <span />
        </div>

        <div className={styles.body}>
          {rows.length === 0 ? (
            <div className={styles.empty}>No briefs match your filters.</div>
          ) : (
            rows.map((brief) => (
              <div key={brief._id} className={styles.row}>
                <button
                  className={`${styles.check} ${selected[String(brief._id)] ? styles.checkOn : ""}`}
                  aria-label="Select row"
                  onClick={() =>
                    setSelected((prev) => ({
                      ...prev,
                      [String(brief._id)]: !prev[String(brief._id)],
                    }))
                  }
                >
                  ✓
                </button>
                <div className={styles.titleWrap}>
                  <Link className={styles.title} href={`/briefs/${brief._id}`}>
                    {brief.title}
                  </Link>
                  <div className={styles.subtitle}>
                    <span>{String(brief._id).slice(-5)}</span>
                    <span>·</span>
                    <span>{brief.topic.slice(0, 48)}{brief.topic.length > 48 ? "…" : ""}</span>
                  </div>
                </div>
                <div className={styles.type}>
                  <span className={styles.glyph}>{brief.typeMeta.glyph}</span>
                  <span className={styles.name}>{brief.typeMeta.label}</span>
                </div>
                <div
                  className={styles.stage}
                  style={{ "--stage-color": brief.stageMeta.color } as CSSProperties}
                >
                  <span className={styles.dot} />
                  <span>{brief.stageMeta.label}</span>
                  {brief.stage !== "published" ? (
                    <span className={styles.pb}>
                      <i style={{ width: `${Math.round(brief.stageMeta.progress * 100)}%` }} />
                    </span>
                  ) : null}
                </div>
                <div className={styles.owner}>
                  <span className={styles.av}>
                    {String(brief.createdBy).slice(2, 4).toUpperCase()}
                  </span>
                  <span className={styles.who}>Workspace</span>
                </div>
                <div className={styles.lang}>{String(brief.outputLanguage || "EN").toUpperCase()}</div>
                <div className={styles.updated}>
                  {formatDistanceToNow(brief.updatedAt, { addSuffix: true })}
                </div>
                <button className={styles.menuBtn} aria-label="Open menu" type="button">
                  ⋯
                </button>
              </div>
            ))
          )}
        </div>

        <div className={styles.tableFoot}>
          <span>
            {selectedCount > 0 ? (
              <>
                <b>{selectedCount}</b> selected · bulk actions available
              </>
            ) : (
              <>
                Showing <b>{rows.length}</b> of <b>{counts.all}</b> briefs
              </>
            )}
          </span>
          <div className={styles.pager}>
            <button type="button">‹</button>
            <span className={styles.here}>1 / 1</span>
            <button type="button">›</button>
          </div>
        </div>
      </div>
    </div>
  );
}

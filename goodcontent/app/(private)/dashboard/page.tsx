"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { format, formatDistanceToNow } from "date-fns";
import { CalendarDays, CircleUserRound, FileText, Mic, Sparkles } from "lucide-react";
import { NewBriefModal, type NewBriefTypeOption } from "@/components/briefs/new-brief-modal";
import {
  briefPhaseToPipelineColumnId,
  type ContentPipelineColumnId,
} from "@/lib/content-pipeline";
import { contentTypeLabel } from "@/lib/pipeline-labels";
import styles from "./dashboard.module.css";

type BriefDoc = Doc<"briefs">;
type InterviewDoc = Doc<"interviews">;

// ========== Types ==========
interface Stage {
  id: ContentPipelineColumnId;
  title: string;
  sub: string;
  color: string;
}

// ========== Data ==========
const STAGES: Stage[] = [
  {
    id: "planning",
    title: "PLANNING",
    sub: "Brief through outline",
    color: "oklch(0.7 0.05 60)",
  },
  {
    id: "interview",
    title: "INTERVIEW",
    sub: "Guest link & answers",
    color: "oklch(0.62 0.19 28)",
  },
  {
    id: "drafting",
    title: "DRAFTING",
    sub: "AI draft & edits",
    color: "oklch(0.7 0.15 85)",
  },
  {
    id: "review",
    title: "REVIEW",
    sub: "Approval & polish",
    color: "oklch(0.55 0.15 155)",
  },
  {
    id: "published",
    title: "PUBLISHED",
    sub: "Live & distributed",
    color: "oklch(0.5 0.12 250)",
  },
];

const AVATAR_COLORS = [
  "linear-gradient(135deg,#5b8dff,#d077ff)",
  "linear-gradient(135deg,#ff8f6b,#ffb26b)",
  "linear-gradient(135deg,#3aa36a,#6bc48e)",
  "linear-gradient(135deg,#b67cff,#ff7cb6)",
  "linear-gradient(135deg,#ffba5c,#ff7b5c)",
  "linear-gradient(135deg,#4bc2d1,#5b8dff)",
  "linear-gradient(135deg,#ff5a7a,#ff8f6b)",
];
const av = (i: number) => AVATAR_COLORS[i % AVATAR_COLORS.length];

const CONTENT_TYPE_OPTIONS: NewBriefTypeOption[] = [
  { value: "blog_post", label: "Blog post", description: "Long-form article or thought leadership from an SME interview.", glyph: "¶" },
  { value: "case_study", label: "Case study", description: "Problem to solution to outcome sourced from a customer interview.", glyph: "◊" },
  { value: "customer_story", label: "Customer story", description: "Short narrative highlighting one customer quote and outcome.", glyph: "★" },
  { value: "guide", label: "Guide", description: "Step-by-step instructional content built from expert Q&A.", glyph: "✺" },
  { value: "landing_page", label: "Landing page", description: "High-converting page for a campaign, product, or announcement.", glyph: "◎" },
  { value: "web_page", label: "Web page", description: "Evergreen page for about, product, solution, or industry content.", glyph: "▢" },
  { value: "email", label: "Marketing email", description: "Broadcast or nurture email drafted from brand-voice examples.", glyph: "✉" },
  { value: "sales_collateral", label: "Sales collateral", description: "One-pager or deck from interview-backed proof points.", glyph: "↓" },
  { value: "press_release", label: "Press release", description: "News announcement for media, quote-led AP-style structure.", glyph: "▤", available: false },
  { value: "product_update", label: "Product update", description: "Feature or release announcement sourced from PM or engineering interviews.", glyph: "◈", available: false },
  { value: "glossary_entry", label: "Glossary entry", description: "Definitional SEO page with term, meaning, and related context.", glyph: "§", available: false },
  { value: "opinion_piece", label: "Opinion piece", description: "POV-driven essay from a founder or executive with clear stance.", glyph: "❝", available: false },
];

// ========== Components ==========
function Sidebar({
  briefCount,
  interviewCount,
  draftCount,
  isCollapsed
}: {
  briefCount: number;
  interviewCount: number;
  draftCount: number;
  isCollapsed: boolean;
}) {
  const [wsOpen, setWsOpen] = useState(false);

  const navItems = [
    { icon: "▦", label: "Dashboard", href: "/dashboard", active: true },
    { icon: "▢", label: "Briefs", href: "/briefs", count: briefCount },
    { icon: "◉", label: "Interviews", href: "/interviews", count: interviewCount },
    { icon: "¶", label: "Drafts", href: "/drafts", count: draftCount },
    { icon: "⚙", label: "Settings", href: "/settings" },
    { icon: "✦", label: "Billing", href: "/billing" },
  ];

  const workspaces = [
    { name: "My Workspace", role: "Admin", initials: "M", active: true },
  ];

  if (isCollapsed) {
    return (
      <aside className={`${styles.side} ${styles.collapsed}`}>
        <div className={styles.sideLogo}>
          <div className="mark">G</div>
        </div>

        <nav className={styles.sideNav}>
          {navItems.map(item => (
            <Link
              key={item.label}
              href={item.href}
              className={item.active ? styles.active : ""}
              title={item.label}
            >
              <span className="icn">{item.icon}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.sideBottom}>
          <div className={styles.sideAvatar}>U</div>
        </div>
      </aside>
    );
  }

  return (
    <aside className={styles.side}>
      <div className={styles.sideLogo}>
        <div className="mark">G</div>
        <span>GoodContent</span>
      </div>

      <div className={styles.wsSwitcher}>
        <button
          className={styles.wsTrigger}
          onClick={() => setWsOpen(v => !v)}
          aria-expanded={wsOpen}
        >
          <span className={styles.wsMark}>M</span>
          <span className={styles.wsName}>My Workspace</span>
          <span className={styles.wsCaret}>{wsOpen ? "▴" : "▾"}</span>
        </button>
        {wsOpen && (
          <div className={styles.wsMenu} role="menu">
            {workspaces.map(w => (
              <button
                key={w.name}
                className={`${styles.wsItem} ${w.active ? styles.on : ""}`}
                role="menuitem"
              >
                <span className={`${styles.wsMark} ${styles.sm}`}>{w.initials}</span>
                <div className={styles.wsItemBody}>
                  <span className={styles.wsItemName}>{w.name}</span>
                  <span className={styles.wsItemRole}>{w.role}</span>
                </div>
                {w.active && <span className={styles.wsCheck}>✓</span>}
              </button>
            ))}
            <div className={styles.wsSep} />
            <button className={`${styles.wsItem}`} role="menuitem">
              <span className={`${styles.wsMark} ${styles.sm} ${styles.plus}`}>+</span>
              <div className={styles.wsItemBody}>
                <span className={styles.wsItemName}>New workspace</span>
              </div>
            </button>
          </div>
        )}
      </div>

      <nav className={styles.sideNav}>
        {navItems.map(item => (
          <Link
            key={item.label}
            href={item.href}
            className={item.active ? styles.active : ""}
          >
            <span className="icn">{item.icon}</span>
            <span>{item.label}</span>
            {item.count != null && <span className="count">{item.count}</span>}
          </Link>
        ))}
      </nav>

      <div className={styles.sideBottom}>
        <div className={styles.sideAvatar}>U</div>
        <div>
          <div className={styles.sideWhoName}>User</div>
        </div>
      </div>
    </aside>
  );
}

function Sparkline({ data, up = true }: { data: number[]; up?: boolean }) {
  const w = 70,
    h = 30;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / (max - min || 1)) * (h - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const col = up ? "oklch(0.55 0.15 155)" : "oklch(0.6 0.2 25)";
  return (
    <svg className={styles.kpiSpark} viewBox={`0 0 ${w} ${h}`} fill="none">
      <polyline
        points={pts}
        stroke={col}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Topbar({
  briefCount,
  onToggleSidebar,
  isSidebarCollapsed,
  onNewBrief
}: {
  briefCount: number;
  onToggleSidebar: () => void;
  isSidebarCollapsed: boolean;
  onNewBrief: () => void;
}) {
  return (
    <div className={styles.topbar}>
      <button
        className={styles.topbarCollapse}
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
      >
        {isSidebarCollapsed ? "⇥" : "⇤"}
      </button>
      <div className={styles.spacer} />
      <div className={styles.topbarRight}>
        <button
          onClick={onNewBrief}
          type="button"
          className={`${styles.btnDash} ${styles.primary}`}
        >
          + New brief
        </button>
        <span className={styles.creditPill}>
          <span className="creditDot" />
          <b>{briefCount}</b>
        </span>
      </div>
    </div>
  );
}

function KPIs({
  publishedCount,
  interviewCount,
  draftCount,
  totalCount,
}: {
  publishedCount: number;
  interviewCount: number;
  draftCount: number;
  totalCount: number;
}) {
  const items = [
    {
      label: "Total briefs",
      val: totalCount.toString(),
      unit: "",
      delta: "all time",
      up: true,
      spark: [3, 4, 3, 5, 6, 4, 7, 6, 8, 7, 9, totalCount],
    },
    {
      label: "Interviews",
      val: interviewCount.toString(),
      unit: "",
      delta: "completed",
      up: true,
      spark: [4, 5, 3, 6, 5, 7, 8, 6, 9, 8, 10, interviewCount],
    },
    {
      label: "Drafts ready",
      val: draftCount.toString(),
      unit: "",
      delta: "in review",
      up: true,
      spark: [2, 3, 2, 4, 3, 5, 6, 4, 7, 6, 8, draftCount],
    },
    {
      label: "Published",
      val: publishedCount.toString(),
      unit: "",
      delta: "all time",
      up: false,
      spark: [1, 2, 2, 3, 3, 4, 4, 5, 6, 7, 8, publishedCount],
    },
  ];
  return (
    <div className={styles.kpis}>
      {items.map((k) => (
        <div key={k.label} className={styles.kpi}>
          <div className={styles.kpiLabel}>{k.label}</div>
          <div className={styles.kpiVal}>
            {k.val}
            <span className="unit">{k.unit}</span>
          </div>
          <Sparkline data={k.spark} up={k.up} />
          <div className={`${styles.kpiDelta} ${k.up ? styles.up : ""}`}>
            <span>{k.up ? "↑" : "→"}</span>
            {k.delta}
          </div>
        </div>
      ))}
    </div>
  );
}

function BriefCard({ brief, index }: { brief: BriefDoc; index: number }) {
  const progressByPhase: Record<string, number> = {
    brief: 15,
    research: 25,
    outline: 35,
    interview: 55,
    draft: 70,
    edit: 82,
    review: 92,
    pushed: 100,
  };

  const ownerLabel = `Owner ${brief.createdBy.slice(-4).toUpperCase()}`;
  const dueAt = brief.createdAt + 14 * 24 * 60 * 60 * 1000;
  const dueLabel = format(dueAt, "MMM d");
  const likelyLate = brief.phase !== "pushed" && brief.updatedAt > dueAt;
  const progress = progressByPhase[brief.phase] ?? 50;

  const getInitials = (title: string) => {
    const words = title.split(" ");
    return words
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  };

  return (
    <article className={styles.briefCard}>
      <Link href={`/briefs/${brief._id}`} className={styles.briefTitleLink}>
        <h5>{brief.title}</h5>
      </Link>
      <div className={styles.briefTags}>
        <span
          className={`${styles.tag} ${styles.tagType} ${styles.tagAccent}`}
        >
          {contentTypeLabel(brief.contentType)}
        </span>
        <span className={styles.tag}>EN</span>
      </div>
      <div className={styles.briefDetailRow}>
        <span className={styles.briefDetailItem}>
          <CircleUserRound size={12} />
          {ownerLabel}
        </span>
        <span
          className={`${styles.briefDetailItem} ${likelyLate ? styles.late : ""}`}
        >
          <CalendarDays size={12} />
          Due {dueLabel}
        </span>
      </div>
      <div className={styles.briefProgress}>
        <i style={{ width: `${progress}%` }} />
      </div>
      <div className={styles.briefActions}>
        <Link
          href={`/briefs/${brief._id}`}
          title="Open brief details"
          aria-label="Open brief details"
        >
          <FileText size={12} />
        </Link>
        <Link
          href={`/interviews?brief=${brief._id}`}
          title="Open interviews"
          aria-label="Open interviews"
        >
          <Mic size={12} />
        </Link>
        <Link
          href={`/drafts?brief=${brief._id}`}
          title="Open drafts"
          aria-label="Open drafts"
        >
          <Sparkles size={12} />
        </Link>
      </div>
      <div className={styles.briefMeta}>
        <span className={styles.briefAssignee}>
          <span
            className={styles.miniAvatar}
            style={{ background: av(index) }}
          >
            {getInitials(brief.title)}
          </span>
          <span>{getInitials(brief.title)}</span>
        </span>
        <span>{formatDistanceToNow(brief.updatedAt, { addSuffix: true })}</span>
      </div>
    </article>
  );
}

function Pipeline({ briefs }: { briefs: BriefDoc[] | undefined }) {
  const briefsByColumn = useMemo(() => {
    const map = new Map<ContentPipelineColumnId, BriefDoc[]>();
    for (const stage of STAGES) {
      map.set(stage.id, []);
    }
    const list = briefs ?? [];
    for (const brief of list) {
      const colId = briefPhaseToPipelineColumnId(brief.phase);
      map.get(colId)?.push(brief);
    }
    for (const stage of STAGES) {
      const arr = map.get(stage.id)!;
      arr.sort((a, b) => b.updatedAt - a.updatedAt);
    }
    return map;
  }, [briefs]);

  return (
    <>
      <div className={styles.dashSectionHead}>
        <div>
          <h2>Content pipeline</h2>
        </div>
      </div>
      <div className={styles.pipeline}>
        {STAGES.map((s) => {
          const items = briefsByColumn.get(s.id) ?? [];
          return (
            <div
              key={s.id}
              className={styles.col}
              style={{ "--stage-color": s.color } as React.CSSProperties}
            >
              <div className={styles.colHead}>
                <div>
                  <div className={styles.colTitle}>
                    <span className="stageDot" />
                    {s.title}
                  </div>
                  <div className={styles.colSub}>{s.sub}</div>
                </div>
                <span className={styles.colCount}>{items.length}</span>
              </div>
              <div className={styles.colBody}>
                {items.length === 0 ? (
                  <div className={styles.colEmpty}>Nothing in this stage</div>
                ) : (
                  items.map((b, i) => <BriefCard key={b._id} brief={b} index={i} />)
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function Leaderboard({ interviews }: { interviews: InterviewDoc[] | undefined }) {
  const leaderboard = useMemo(() => {
    if (!interviews) return [];
    const byContributor = new Map<
      string,
      {
        displayName: string;
        email: string | null;
        completedInterviews: number;
        totalCharacters: number;
        lastContributionAt: number;
        index: number;
      }
    >();
    let index = 0;
    for (const row of interviews) {
      if (row.status !== "completed" || !row.completedAt) continue;
      const name = row.guestName?.trim() || "";
      const email = row.guestEmail?.trim().toLowerCase() || "";
      const key = email || name.toLowerCase() || `anon:${row._id}`;
      const transcriptLength = row.transcript?.trim().length ?? 0;
      const lastAt = row.completedAt ?? row.updatedAt;
      const existing = byContributor.get(key);
      if (!existing) {
        byContributor.set(key, {
          displayName: name || email || "Anonymous contributor",
          email: email || null,
          completedInterviews: 1,
          totalCharacters: transcriptLength,
          lastContributionAt: lastAt,
          index: index++,
        });
        continue;
      }
      byContributor.set(key, {
        ...existing,
        completedInterviews: existing.completedInterviews + 1,
        totalCharacters: existing.totalCharacters + transcriptLength,
        lastContributionAt: Math.max(existing.lastContributionAt, lastAt),
      });
    }
    return [...byContributor.values()].sort((a, b) => {
      if (b.completedInterviews !== a.completedInterviews) {
        return b.completedInterviews - a.completedInterviews;
      }
      if (b.totalCharacters !== a.totalCharacters) {
        return b.totalCharacters - a.totalCharacters;
      }
      return b.lastContributionAt - a.lastContributionAt;
    });
  }, [interviews]);

  const maxCredits = Math.max(
    ...leaderboard.map((c) => c.completedInterviews),
    1
  );

  const getInitials = (name: string) => {
    const words = name.split(" ");
    return words
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div>
      <div className={styles.dashSectionHead}>
        <div>
          <h2>Contributor leaderboard</h2>
          <p>Top contributors by completed interviews in this workspace.</p>
        </div>
        <div className={styles.seg}>
          <button className={styles.on}>All time</button>
          <button>This month</button>
        </div>
      </div>
      <div className={styles.dashGrid}>
        <div className={styles.leaderboard}>
          <div className={styles.leaderHead}>
            <div>#</div>
            <div>Contributor</div>
            <div>Interviews</div>
            <div>Characters</div>
            <div>Activity</div>
            <div style={{ textAlign: "right" }}>Last</div>
          </div>
          {leaderboard.length === 0 ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "var(--fg-muted)",
              }}
            >
              No completed interviews yet
            </div>
          ) : (
            leaderboard.slice(0, 10).map((c, i) => (
              <div key={`${c.email}-${i}`} className={styles.leaderRow}>
                <div
                  className={`${styles.leaderRank} ${i < 3 ? styles.top : ""}`}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className={styles.leaderPerson}>
                  <span
                    className={styles.leaderAvatar}
                    style={{ background: av(c.index) }}
                  >
                    {getInitials(c.displayName)}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div className={styles.leaderName}>{c.displayName}</div>
                    <div className={styles.leaderRole}>
                      {c.email || "No email"}
                    </div>
                  </div>
                </div>
                <div className={styles.leaderStat}>
                  {c.completedInterviews}
                  <span className="u"> done</span>
                </div>
                <div className={styles.leaderStat}>
                  {c.totalCharacters.toLocaleString()}
                  <span className="u"> chars</span>
                </div>
                <div
                  className={styles.leaderBar}
                  title={`${c.completedInterviews} interviews`}
                >
                  <i
                    style={{
                      transform: `scaleX(${c.completedInterviews / maxCredits})`,
                    }}
                  />
                </div>
                <div className={`${styles.leaderTrend} ${styles.up}`}>
                  {formatDistanceToNow(c.lastContributionAt, {
                    addSuffix: true,
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className={styles.sidecarStack}>
          <div className={styles.card}>
            <h3>Quick stats</h3>
            <div className={styles.statList}>
              <div className={styles.statRow}>
                <span className="label">Active contributors</span>
                <span className="val">{leaderboard.length}</span>
              </div>
              <div className={styles.statRow}>
                <span className="label">Total interviews</span>
                <span className="val">
                  {leaderboard.reduce(
                    (sum, c) => sum + c.completedInterviews,
                    0
                  )}
                </span>
              </div>
              <div className={styles.statRow}>
                <span className="label">Total characters</span>
                <span className="val">
                  {leaderboard
                    .reduce((sum, c) => sum + c.totalCharacters, 0)
                    .toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h3>Quick links</h3>
            <div className={styles.vstack}>
              <Link href="/briefs" className={styles.btnDash}>
                View all briefs
              </Link>
              <Link href="/interviews" className={styles.btnDash}>
                View all interviews
              </Link>
              <Link href="/drafts" className={styles.btnDash}>
                View all drafts
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== Main Page Component ==========
export default function DashboardPage() {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isBriefModalOpen, setIsBriefModalOpen] = useState(false);
  const briefsQuery = useQuery(api.briefs.listByCurrentWorkspace);
  const interviewsQuery = useQuery(api.interviews.listByCurrentWorkspace);

  const stats = useMemo(() => {
    const briefs = briefsQuery ?? [];
    const interviews = interviewsQuery ?? [];

    const publishedCount = briefs.filter(
      (b) => briefPhaseToPipelineColumnId(b.phase) === "published"
    ).length;

    const interviewCount = interviews.filter(
      (i) => i.status === "completed"
    ).length;

    const draftCount = briefs.filter(
      (b) =>
        briefPhaseToPipelineColumnId(b.phase) === "review" ||
        briefPhaseToPipelineColumnId(b.phase) === "drafting"
    ).length;

    return {
      publishedCount,
      interviewCount,
      draftCount,
      totalCount: briefs.length,
    };
  }, [briefsQuery, interviewsQuery]);

  return (
    <div className={`${styles.app} ${sidebarCollapsed ? styles.sidebarCollapsed : ""}`}>
      <Sidebar
        briefCount={stats.totalCount}
        interviewCount={stats.interviewCount}
        draftCount={stats.draftCount}
        isCollapsed={sidebarCollapsed}
      />
      <div className={styles.main}>
        <Topbar
          briefCount={stats.totalCount}
          onToggleSidebar={() => setSidebarCollapsed(prev => !prev)}
          isSidebarCollapsed={sidebarCollapsed}
          onNewBrief={() => setIsBriefModalOpen(true)}
        />
        <div className={styles.page}>
          <div className={styles.pageHead}>
            <h1>Dashboard</h1>
          </div>
          <KPIs
            publishedCount={stats.publishedCount}
            interviewCount={stats.interviewCount}
            draftCount={stats.draftCount}
            totalCount={stats.totalCount}
          />
          <Pipeline briefs={briefsQuery} />
          <Leaderboard interviews={interviewsQuery} />
        </div>
      </div>
      <NewBriefModal
        open={isBriefModalOpen}
        onClose={() => setIsBriefModalOpen(false)}
        options={CONTENT_TYPE_OPTIONS}
        initialSelected="blog_post"
        onContinue={(payload) => {
          setIsBriefModalOpen(false);
          const params = new URLSearchParams();
          params.set("type", payload.contentType);
          if (payload.title) params.set("title", payload.title);
          if (payload.topic) params.set("topic", payload.topic);
          if (payload.keywords) params.set("keywords", payload.keywords);
          if (payload.tone) params.set("tone", payload.tone);
          if (payload.sources) params.set("sources", payload.sources);
          router.push(`/briefs?${params.toString()}`);
        }}
      />
    </div>
  );
}

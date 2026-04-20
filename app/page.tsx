"use client";

import { FormEvent, Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import "./landing.global.css";
import styles from "./landing.module.css";
import demoStyles from "./demo.module.css";
import extraStyles from "./extras.module.css";

// ========== Logo Component ==========
function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Quote-like design representing content/conversation */}
      <path
        d="M7 8C7 6.89543 7.89543 6 9 6H10C11.1046 6 12 6.89543 12 8V12C12 13.1046 11.1046 14 10 14H9C7.89543 14 7 13.1046 7 12V8Z"
        fill="currentColor"
      />
      <path
        d="M14 8C14 6.89543 14.8954 6 16 6H17C18.1046 6 19 6.89543 19 8V12C19 13.1046 18.1046 14 17 14H16C14.8954 14 14 13.1046 14 12V8Z"
        fill="currentColor"
      />
      {/* Checkmark for "good" */}
      <path
        d="M9.5 16L8 17.5L9.5 19L13 15.5L9.5 16Z"
        fill="currentColor"
        opacity="0.7"
      />
      <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="1.5" opacity="0.15" />
    </svg>
  );
}

// ========== WaitlistForm Component ==========
function WaitlistForm({
  size = "md",
  placeholder = "you@company.com",
  cta = "Join waitlist",
}: {
  size?: "md" | "lg";
  placeholder?: string;
  cta?: string;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "err">(
    "idle"
  );
  const [err, setErr] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!ok) {
      setErr("Enter a valid work email.");
      setState("err");
      return;
    }
    setErr("");
    setState("loading");
    setTimeout(() => setState("done"), 900);
  };

  if (state === "done") {
    return (
      <div
        className={`${extraStyles.waitlistDone} ${size === "lg" ? extraStyles.waitlistLg : ""}`}
      >
        <div className={extraStyles.waitlistDoneDot}>✓</div>
        <div>
          <div className={extraStyles.waitlistDoneTitle}>
            You&apos;re on the list.
          </div>
          <div className={`${extraStyles.waitlistDoneSub} ${styles.mono}`}>
            We&apos;ll email <b style={{ color: "var(--fg)" }}>{email}</b> when
            your workspace is ready. Usually 1–2 weeks.
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      className={`${extraStyles.waitlist} ${size === "lg" ? extraStyles.waitlistLg : ""}`}
      onSubmit={submit}
      noValidate
    >
      <div className={extraStyles.waitlistInputWrap}>
        <input
          type="email"
          className={extraStyles.waitlistInput}
          placeholder={placeholder}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state === "err") setState("idle");
          }}
          required
        />
      </div>
      <button
        type="submit"
        className={`${styles.btn} ${styles.btnPrimary} ${size === "lg" ? styles.btnLg : ""}`}
        disabled={state === "loading"}
      >
        {state === "loading" ? (
          <>
            Joining
            <span className={extraStyles.dotElipsis}>
              <i />
              <i />
              <i />
            </span>
          </>
        ) : (
          <>
            {cta} <span className="arrow">→</span>
          </>
        )}
      </button>
      {state === "err" && (
        <div className={`${extraStyles.waitlistErr} ${styles.mono}`}>
          ↑ {err}
        </div>
      )}
    </form>
  );
}

// ========== Wave Component for Demo ==========
function Wave({ active }: { active: boolean }) {
  const bars = 28;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setTick((t) => t + 1), 80);
    return () => clearInterval(id);
  }, [active]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, height: 24 }}>
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 2,
            height: active
              ? `${20 + Math.sin(tick / 120 + i * 0.5) * 40 + Math.sin((tick + i * 13) / 33) * 15}%`
              : "8%",
            background: "var(--accent)",
            borderRadius: 1,
            transition: "height 0.08s",
            opacity: active ? 1 : 0.3,
          }}
        />
      ))}
    </div>
  );
}

// ========== InterviewDemo Component ==========
function InterviewDemo() {
  const DEMO_SCRIPT = [
    {
      q: "Let's start simple — what does Northwind actually do, in your own words?",
      a: "We help mid-market SaaS companies cut their onboarding time. Most of our customers go from signup to first value in under a day.",
      followups: [
        {
          q: '"Under a day" — do you have a specific number?',
          a: "Yeah, our P50 is about four hours. P90 is closer to eighteen.",
        },
      ],
    },
    {
      q: "What's the biggest mistake teams make when they try to shorten onboarding?",
      a: "They try to remove steps. But the real fix is usually removing decisions, not steps. You can have a twelve-step onboarding if none of them require the user to think.",
      followups: [],
    },
    {
      q: "Walk me through a specific customer who saw a big change.",
      a: "Beacon Logistics. They were at 31% activation after 30 days. We rebuilt their onboarding around three decisions instead of nine. Six weeks later, 68%.",
      followups: [
        {
          q: "Are Beacon okay being named in the piece?",
          a: "Yep, I'll get the CS team to confirm quotes.",
        },
      ],
    },
  ];

  const [state, setState] = useState<
    "idle" | "asking" | "listening" | "follow" | "done"
  >("idle");
  const [qIdx, setQIdx] = useState(0);
  const [transcript, setTranscript] = useState<
    Array<{ role: "ai" | "guest"; text: string; partial?: boolean }>
  >([]);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (state !== "idle" && state !== "done") {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [state]);

  const fmtTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const typeInto = async (
    role: "ai" | "guest",
    text: string,
    speed: number = 18
  ) => {
    return new Promise<void>((resolve) => {
      let i = 0;
      setTranscript((t) => [...t, { role, text: "", partial: true }]);
      const id = setInterval(() => {
        i++;
        setTranscript((t) => {
          const copy = [...t];
          copy[copy.length - 1] = {
            role,
            text: text.slice(0, i),
            partial: true,
          };
          return copy;
        });
        if (i >= text.length) {
          clearInterval(id);
          setTranscript((t) => {
            const copy = [...t];
            copy[copy.length - 1] = { role, text, partial: false };
            return copy;
          });
          resolve();
        }
      }, speed);
    });
  };

  const run = async () => {
    setTranscript([]);
    setQIdx(0);
    setElapsed(0);

    for (let qi = 0; qi < DEMO_SCRIPT.length; qi++) {
      setQIdx(qi);
      const item = DEMO_SCRIPT[qi];

      setState("asking");
      await typeInto("ai", item.q, 22);
      await new Promise((r) => setTimeout(r, 300));

      setState("listening");
      await new Promise((r) => setTimeout(r, 1200));
      await typeInto("guest", item.a, 14);
      await new Promise((r) => setTimeout(r, 400));

      for (let fi = 0; fi < item.followups.length; fi++) {
        setState("follow");
        await new Promise((r) => setTimeout(r, 500));
        await typeInto("ai", item.followups[fi].q, 22);
        setState("listening");
        await new Promise((r) => setTimeout(r, 900));
        await typeInto("guest", item.followups[fi].a, 14);
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    setState("done");
  };

  const reset = () => {
    setState("idle");
    setTranscript([]);
    setQIdx(0);
    setElapsed(0);
  };

  const statusLabel = {
    idle: "READY",
    asking: "AI SPEAKING",
    listening: "LISTENING",
    follow: "FOLLOW-UP",
    done: "COMPLETE",
  }[state];

  const statusColor =
    state === "listening"
      ? "var(--accent)"
      : state === "asking" || state === "follow"
        ? "#5b8dff"
        : state === "done"
          ? "var(--fg-muted)"
          : "var(--fg-muted)";

  return (
    <div className={demoStyles.demoShell}>
      <div className={demoStyles.demoChrome}>
        <div className={demoStyles.demoDots}>
          <span />
          <span />
          <span />
        </div>
        <div className={`${demoStyles.demoUrl} ${styles.mono}`}>
          <span style={{ opacity: 0.4 }}>goodcontent.ai/interview/</span>
          <span>t_4h2x9k</span>
        </div>
        <div style={{ width: 52 }} />
      </div>

      <div className={demoStyles.demoBody}>
        <div className={demoStyles.demoLeft}>
          <div className={demoStyles.demoOrbWrap}>
            <div
              className={`${demoStyles.demoOrb} ${
                state === "listening"
                  ? demoStyles.pulseListen
                  : state === "asking" || state === "follow"
                    ? demoStyles.pulseSpeak
                    : ""
              }`}
            >
              <div className={demoStyles.demoOrbInner}>
                <Wave
                  active={
                    state === "listening" ||
                    state === "asking" ||
                    state === "follow"
                  }
                />
              </div>
            </div>
          </div>
          <div className={demoStyles.demoStatus}>
            <div
              className={demoStyles.demoStatusDot}
              style={{ background: statusColor }}
            />
            <span
              className={styles.mono}
              style={{
                fontSize: 11,
                letterSpacing: "0.1em",
                color: statusColor,
              }}
            >
              {statusLabel}
            </span>
          </div>
          <div className={`${demoStyles.demoTimer} ${styles.mono}`}>
            {fmtTime(elapsed)}
          </div>
          <div className={demoStyles.demoBrief}>
            <div className={`${demoStyles.demoBriefLabel} ${styles.mono}`}>
              BRIEF
            </div>
            <div className={demoStyles.demoBriefTitle}>
              Case study: Beacon Logistics
            </div>
            <div className={`${demoStyles.demoBriefMeta} ${styles.mono}`}>
              <span>CASE_STUDY</span>
              <span>·</span>
              <span>EN</span>
              <span>·</span>
              <span>
                {qIdx + 1}/{DEMO_SCRIPT.length}
              </span>
            </div>
          </div>
        </div>

        <div className={demoStyles.demoRight}>
          <div
            className={demoStyles.demoTranscript}
            ref={(el) => {
              if (el) el.scrollTop = el.scrollHeight;
            }}
          >
            {transcript.length === 0 && state === "idle" && (
              <div className={demoStyles.demoEmpty}>
                <div
                  className={`${styles.mono} ${styles.u}`}
                  style={{
                    fontSize: 11,
                    color: "var(--fg-subtle)",
                    marginBottom: 10,
                  }}
                >
                  TRANSCRIPT
                </div>
                <div
                  style={{
                    color: "var(--fg-muted)",
                    fontSize: 14,
                    maxWidth: 360,
                  }}
                >
                  Press <b style={{ color: "var(--fg)" }}>Start interview</b>{" "}
                  to watch the AI conduct an async voice interview in real time.
                  This is a scripted demo of a real case-study brief.
                </div>
              </div>
            )}
            {transcript.map((line, i) => (
              <div
                key={i}
                className={`${demoStyles.demoLine} ${line.role === "ai" ? demoStyles.ai : demoStyles.guest}`}
              >
                <div className={`${demoStyles.demoWho} ${styles.mono}`}>
                  {line.role === "ai" ? "GOODCONTENT" : "GUEST · Jamie"}
                </div>
                <div className={demoStyles.demoText}>
                  {line.text}
                  {line.partial && <span className="cursor">▋</span>}
                </div>
              </div>
            ))}
            {state === "done" && (
              <div className={demoStyles.demoDone}>
                <div
                  className={styles.mono}
                  style={{
                    fontSize: 11,
                    color: "var(--accent)",
                    letterSpacing: "0.1em",
                  }}
                >
                  ✓ INTERVIEW COMPLETE
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: "var(--fg-muted)",
                    marginTop: 6,
                  }}
                >
                  Claude is now drafting your case study. Usually takes 30-60
                  seconds.
                </div>
              </div>
            )}
          </div>

          <div className={demoStyles.demoControls}>
            {state === "idle" && (
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={run}
                type="button"
              >
                ▶ Start interview{" "}
                <span
                  className={styles.mono}
                  style={{ opacity: 0.6, marginLeft: 4 }}
                >
                  2 min
                </span>
              </button>
            )}
            {state !== "idle" && state !== "done" && (
              <div className={`${demoStyles.demoRunning} ${styles.mono}`}>
                <span className={demoStyles.demoRec} /> Recording · interview in
                progress
              </div>
            )}
            {state === "done" && (
              <button
                className={`${styles.btn} ${styles.btnGhost}`}
                onClick={reset}
                type="button"
              >
                Replay demo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== HeroArt Component ==========
function HeroArt() {
  return (
    <div className={extraStyles.heroArt}>
      <div className={extraStyles.heroArtCard}>
        <div className={extraStyles.heroArtHead}>
          <div
            className={styles.mono}
            style={{
              fontSize: 10,
              color: "var(--fg-subtle)",
              letterSpacing: "0.12em",
            }}
          >
            BRIEF → INTERVIEW → DRAFT
          </div>
          <div
            className={styles.mono}
            style={{ fontSize: 10, color: "var(--accent)" }}
          >
            ● LIVE
          </div>
        </div>
        <div className={extraStyles.heroArtStack}>
          <div
            className={extraStyles.heroArtRow}
            style={{ "--d": "0s" } as React.CSSProperties}
          >
            <div
              className={`${extraStyles.heroArtTag} ${styles.mono}`}
              style={{ fontSize: 10 }}
            >
              01 · BRIEF
            </div>
            <div className={extraStyles.heroArtTxt}>
              Case study — Beacon Logistics
            </div>
            <div className={`${extraStyles.heroArtMeta} ${styles.mono}`}>
              03:42
            </div>
          </div>
          <div
            className={`${extraStyles.heroArtRow} ${extraStyles.heroArtActive}`}
            style={{ "--d": "0.1s" } as React.CSSProperties}
          >
            <div className={`${extraStyles.heroArtTag} ${styles.mono}`}>
              02 · INTERVIEW
            </div>
            <div className={extraStyles.heroArtTxt}>
              <span className={extraStyles.heroWave}>
                {Array.from({ length: 14 }).map((_, i) => (
                  <i
                    key={i}
                    style={{ animationDelay: `${i * 0.08}s` }}
                  />
                ))}
              </span>
              <span style={{ marginLeft: 10 }}>Recording · Jamie speaking</span>
            </div>
            <div
              className={`${extraStyles.heroArtMeta} ${styles.mono}`}
              style={{ color: "var(--accent)" }}
            >
              08:17
            </div>
          </div>
          <div
            className={`${extraStyles.heroArtRow} ${extraStyles.heroArtPending}`}
            style={{ "--d": "0.2s" } as React.CSSProperties}
          >
            <div className={`${extraStyles.heroArtTag} ${styles.mono}`}>
              03 · DRAFT
            </div>
            <div
              className={extraStyles.heroArtTxt}
              style={{ color: "var(--fg-subtle)" }}
            >
              Generating · pushed to HubSpot
            </div>
            <div
              className={`${extraStyles.heroArtMeta} ${styles.mono}`}
              style={{ color: "var(--fg-subtle)" }}
            >
              —:—
            </div>
          </div>
        </div>

        <div className={extraStyles.heroArtFooter}>
          <div className={extraStyles.heroArtFooterStat}>
            <div
              className={styles.mono}
              style={{
                fontSize: 10,
                color: "var(--fg-subtle)",
                letterSpacing: "0.1em",
              }}
            >
              AVG INTERVIEW
            </div>
            <div className={extraStyles.heroArtFooterVal}>11 min</div>
          </div>
          <div className={extraStyles.heroArtFooterStat}>
            <div
              className={styles.mono}
              style={{
                fontSize: 10,
                color: "var(--fg-subtle)",
                letterSpacing: "0.1em",
              }}
            >
              AVG DRAFT TIME
            </div>
            <div className={extraStyles.heroArtFooterVal}>54 sec</div>
          </div>
          <div className={extraStyles.heroArtFooterStat}>
            <div
              className={styles.mono}
              style={{
                fontSize: 10,
                color: "var(--fg-subtle)",
                letterSpacing: "0.1em",
              }}
            >
              VS AGENCY
            </div>
            <div
              className={extraStyles.heroArtFooterVal}
              style={{ color: "var(--accent)" }}
            >
              −96%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== Main Page Component ==========
export default function Home() {
  const [openFaq, setOpenFaq] = useState(0);

  const CONTENT_TYPES = [
    { icon: "¶", name: "Blog posts", map: "→ Blog Post API v3" },
    { icon: "◊", name: "Case studies", map: "→ Blog + tag:case" },
    { icon: "★", name: "Customer stories", map: "→ Blog + tag:story" },
    { icon: "⌘", name: "Guides", map: "→ Blog + tag:guide" },
    { icon: "◎", name: "Landing pages", map: "→ Landing Page API" },
    { icon: "▢", name: "Web pages", map: "→ Site Page API" },
    { icon: "✉", name: "Marketing emails", map: "→ Email API v3" },
    { icon: "⬇", name: "Sales collateral", map: "Downloadable PDF" },
  ];

  const PRICING_TIERS = [
    {
      name: "Starter",
      sub: "For solo marketers getting started",
      price: 199,
      credits: "2,000",
      features: [
        "~15 pieces of content / month",
        "1 HubSpot portal",
        "Unlimited seats",
        "All 8 content types",
        "Email support",
      ],
      feature: false,
    },
    {
      name: "Growth",
      sub: "For in-house marketing teams",
      price: 499,
      credits: "6,000",
      features: [
        "~50 pieces of content / month",
        "1 HubSpot portal",
        "Unlimited seats",
        "All 8 content types + multi-language",
        "Priority support · 4h response",
      ],
      feature: true,
    },
    {
      name: "Agency",
      sub: "For content agencies & multi-brand teams",
      price: 999,
      credits: "20,000",
      features: [
        "~170 pieces of content / month",
        "Unlimited HubSpot portals",
        "Unlimited seats",
        "All content types + cross-language interviews",
        "Dedicated Slack channel",
      ],
      feature: false,
    },
  ];

  const LANGUAGES = [
    { code: "EN", name: "English", native: "English" },
    { code: "NO", name: "Norwegian", native: "Norsk" },
    { code: "SV", name: "Swedish", native: "Svenska" },
    { code: "DA", name: "Danish", native: "Dansk" },
    { code: "FI", name: "Finnish", native: "Suomi" },
    { code: "DE", name: "German", native: "Deutsch" },
    { code: "FR", name: "French", native: "Français" },
    { code: "ES", name: "Spanish", native: "Español" },
    { code: "IT", name: "Italian", native: "Italiano" },
    { code: "PT", name: "Portuguese", native: "Português" },
    { code: "NL", name: "Dutch", native: "Nederlands" },
    { code: "PL", name: "Polish", native: "Polski" },
    { code: "CS", name: "Czech", native: "Čeština" },
    { code: "RO", name: "Romanian", native: "Română" },
    { code: "EL", name: "Greek", native: "Ελληνικά" },
    { code: "TR", name: "Turkish", native: "Türkçe" },
    { code: "UK", name: "Ukrainian", native: "Українська" },
    { code: "JA", name: "Japanese", native: "日本語" },
    { code: "KO", name: "Korean", native: "한국어" },
    { code: "ZH", name: "Chinese", native: "中文" },
    { code: "AR", name: "Arabic", native: "العربية" },
    { code: "HI", name: "Hindi", native: "हिन्दी" },
  ];

  const FAQS = [
    {
      q: "Does this replace our content team?",
      a: "No. It replaces the freelancer or agency they used to brief. Your team still owns strategy, the brief, the edit, and the final call to publish. GoodContent removes the slow, expensive middle.",
    },
    {
      q: "Will the drafts sound like generic AI slop?",
      a: "They shouldn't. The difference is that every draft is built from a real transcript of a real person who actually knows the topic. Claude is a synthesiser, not a guesser. That said — you'll edit. We assume 10-20 minutes of editing per piece.",
    },
    {
      q: "What happens to the audio?",
      a: "Audio is stored in Cloudflare R2 (EU region), transcripts in Convex. You can delete both from the dashboard at any time. Nothing is used for training.",
    },
    {
      q: "Does the guest need an account?",
      a: "No. The interview link is token-based and expires in 7 days. They just open it, press record, and talk.",
    },
    {
      q: "What if my expert goes off-topic?",
      a: "Claude watches the live transcript and steers back on-brief. It also caps follow-ups at three per question so the interview doesn't drag on.",
    },
    {
      q: "Can I connect multiple HubSpot portals?",
      a: "Yes, on the Agency plan. Each portal is OAuth'd separately. Perfect for agencies managing multiple clients.",
    },
    {
      q: "What counts as a credit?",
      a: "Interviews (10/min), drafts (50/piece), bulk export (10 per 5 pieces). Briefs, question generation, viewing drafts — free.",
    },
    {
      q: "Do credits roll over?",
      a: "One month. Use 'em or lose 'em after that. You can never go negative — actions are blocked, not back-charged.",
    },
  ];

  return (
    <main style={{ background: "var(--bg)", color: "var(--fg)" }}>
      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={`${styles.wrap} ${styles.navInner}`}>
          <Link href="/" className={styles.logo}>
            <Logo />
            <span>GoodContent</span>
          </Link>
          <div className={styles.navLinks}>
            <a href="#how">How it works</a>
            <a href="#demo">Demo</a>
            <a href="#types">Content types</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className={styles.navRight}>
            <Link className={`${styles.btn} ${styles.btnGhost}`} href="/dashboard">
              Open app
            </Link>
            <Link className={`${styles.btn} ${styles.btnGhost}`} href="/sign-in">
              Sign in
            </Link>
            <a
              className={`${styles.btn} ${styles.btnPrimary}`}
              href="#cta"
            >
              Join waitlist <span className="arrow">→</span>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.bgGrid} />
        <div className={styles.wrap}>
          <div className={styles.heroGrid}>
            <div>
              <h1 className={styles.heroTitle}>
                A content writer,
                <br />
                <em>as software.</em>
              </h1>
              <p className={styles.heroSub}>
                Skip the expensive writers. Hire an AI interviewer instead. It
                runs async voice interviews with your SMEs and clients — and
                publishes the draft straight to your CMS.
              </p>
              <WaitlistForm size="lg" cta="Join waitlist" />
              <div className={styles.heroMeta}>
                <span>Private beta this summer</span>
                <span>First 100 teams get 50% off year one</span>
              </div>
            </div>
            <HeroArt />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className={styles.section}>
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <div>
              <div className={`${styles.kicker} ${styles.mono}`}>
                01 — How it works
              </div>
              <h2>Three steps. Zero freelancers or retainers.</h2>
            </div>
          </div>

          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={`${styles.stepNum} ${styles.mono}`}>
                STEP 01 · 2 MIN
              </div>
              <h3>Fill a brief.</h3>
              <p>
                Content type, title, topic, tone, language. Claude generates
                tailored interview questions. Edit, reorder, replace, done.
              </p>
            </div>
            <div className={styles.step}>
              <div className={`${styles.stepNum} ${styles.mono}`}>
                STEP 02 · ASYNC
              </div>
              <h3>Send a link.</h3>
              <p>
                Expires in 7 days. No login. Your expert opens it on their
                phone, presses record, and talks. The AI probes for specifics
                and asks for proof.
              </p>
            </div>
            <div className={styles.step}>
              <div className={`${styles.stepNum} ${styles.mono}`}>
                STEP 03 · 60 SEC
              </div>
              <h3>Receive the content.</h3>
              <p>
                Claude synthesises transcript + brief into a polished draft.
                Review, regenerate sections, push to HubSpot individually or in
                bulk.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo */}
      <section id="demo" className={styles.section}>
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <div>
              <div className={`${styles.kicker} ${styles.mono}`}>
                02 — Live demo
              </div>
              <h2>
                An AI interviewer.
                <br />
                No expensive writers.
              </h2>
            </div>
          </div>
          <InterviewDemo />
        </div>
      </section>

      {/* Content Types */}
      <section id="types" className={styles.section}>
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <div>
              <div className={`${styles.kicker} ${styles.mono}`}>
                03 — Eight content types
              </div>
              <h2>One interview. The right output shape.</h2>
            </div>
          </div>
          <div className={styles.types}>
            {CONTENT_TYPES.map((t) => (
              <div key={t.name} className={styles.typeCard}>
                <div className={styles.typeIcon}>{t.icon}</div>
                <h4>{t.name}</h4>
                <div className={`${styles.map} ${styles.mono}`}>{t.map}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HubSpot Callout */}
      <section id="hubspot" className={styles.section}>
        <div className={styles.wrap}>
          <div
            className={styles.sectionHead}
            style={{ paddingBottom: 24 }}
          >
            <div>
              <div className={`${styles.kicker} ${styles.mono}`}>
                04 — HubSpot native
              </div>
              <h2>Built for teams already on HubSpot.</h2>
            </div>
            <p className={styles.sub}>
              No copy-paste. No Zapier duct tape. OAuth once, then every draft
              ships straight into the right tool.
            </p>
          </div>
          <div className={extraStyles.hubspotCall}>
            <div className={extraStyles.hubspotCheck}>
              <ul>
                <li>
                  <span className={extraStyles.chk}>✓</span> OAuth 2.0
                  connection — one click, per portal
                </li>
                <li>
                  <span className={extraStyles.chk}>✓</span> Direct push to
                  Blog, Landing Pages, Site Pages, Email
                </li>
                <li>
                  <span className={extraStyles.chk}>✓</span> Bulk export (up to
                  20 drafts at once)
                </li>
                <li>
                  <span className={extraStyles.chk}>✓</span> Auto-tagging + meta
                  description
                </li>
                <li>
                  <span className={extraStyles.chk}>✓</span> Agencies: connect
                  multiple portals, one per client
                </li>
                <li>
                  <span className={extraStyles.chk}>✓</span> SOC-2 in progress ·
                  GDPR ready · EU-hosted
                </li>
              </ul>
            </div>
            <div className={extraStyles.hubspotMock}>
              <div className={extraStyles.hubspotMockHead}>
                <div
                  className={styles.mono}
                  style={{
                    fontSize: 11,
                    color: "var(--fg-subtle)",
                    letterSpacing: "0.1em",
                  }}
                >
                  HUBSPOT EXPORT
                </div>
                <div
                  className={styles.mono}
                  style={{ fontSize: 11, color: "var(--accent)" }}
                >
                  ● Connected
                </div>
              </div>
              <div className={extraStyles.hubspotPortal}>
                <div className={extraStyles.hubspotPortalDot} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    Northwind HubSpot
                  </div>
                  <div
                    className={styles.mono}
                    style={{ fontSize: 11, color: "var(--fg-subtle)" }}
                  >
                    hub_id: 47829103 · admin
                  </div>
                </div>
                <button
                  className={`${styles.btn} ${styles.btnGhost}`}
                  style={{ height: 28, fontSize: 12 }}
                  type="button"
                >
                  Switch
                </button>
              </div>
              <div className={extraStyles.hubspotQueue}>
                <div className={extraStyles.hubspotQRow}>
                  <span className={extraStyles.hubspotQOk}>✓</span>
                  <span style={{ flex: 1 }}>
                    Beacon Logistics — case study
                  </span>
                  <span
                    className={styles.mono}
                    style={{ color: "var(--fg-subtle)", fontSize: 11 }}
                  >
                    Blog
                  </span>
                </div>
                <div className={extraStyles.hubspotQRow}>
                  <span className={extraStyles.hubspotQOk}>✓</span>
                  <span style={{ flex: 1 }}>
                    Activation playbook — guide
                  </span>
                  <span
                    className={styles.mono}
                    style={{ color: "var(--fg-subtle)", fontSize: 11 }}
                  >
                    Blog
                  </span>
                </div>
                <div className={extraStyles.hubspotQRow}>
                  <span className={extraStyles.hubspotQOk}>✓</span>
                  <span style={{ flex: 1 }}>
                    Spring campaign — landing
                  </span>
                  <span
                    className={styles.mono}
                    style={{ color: "var(--fg-subtle)", fontSize: 11 }}
                  >
                    LP
                  </span>
                </div>
                <div
                  className={`${extraStyles.hubspotQRow} ${extraStyles.hubspotQActive}`}
                >
                  <span className={extraStyles.hubspotQSpin} />
                  <span style={{ flex: 1 }}>
                    &quot;Why decisions beat steps&quot; — email
                  </span>
                  <span
                    className={styles.mono}
                    style={{ color: "var(--accent)", fontSize: 11 }}
                  >
                    Pushing…
                  </span>
                </div>
              </div>
              <div
                style={{
                  padding: "12px 16px",
                  borderTop: "1px solid var(--border)",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <div
                  className={styles.mono}
                  style={{ fontSize: 11, color: "var(--fg-muted)" }}
                >
                  4 drafts · 50 credits
                </div>
                <div
                  className={styles.mono}
                  style={{ fontSize: 11, color: "var(--fg-muted)" }}
                >
                  HS API v3
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className={styles.section}>
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <div>
              <div className={`${styles.kicker} ${styles.mono}`}>
                05 — Pricing
              </div>
              <h2>Priced on credits, not seats.</h2>
            </div>
            <p className={styles.sub}>
              Pay for what you use, not for headcount. All plans include
              unlimited team members. Scale up or down based on your content
              volume, not your team size.
            </p>
          </div>

          <div className={styles.pricing}>
            {PRICING_TIERS.map((t) => (
              <div
                key={t.name}
                className={`${styles.priceCard} ${t.feature ? styles.feature : ""}`}
              >
                <div>
                  <div className={styles.priceName}>{t.name}</div>
                  <div className={styles.priceSub}>{t.sub}</div>
                </div>
                <div className={styles.priceTag}>
                  <span className="num">€{t.price}</span>
                  <span className="per">/month</span>
                </div>
                <div className={`${styles.priceCredits} ${styles.mono}`}>
                  <span>{t.credits} credits / mo</span>
                  <span>incl. VAT</span>
                </div>
                <ul className={styles.priceFeatures}>
                  {t.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <a
                  className={`${styles.btn} ${t.feature ? styles.btnPrimary : styles.btnGhost} ${styles.btnLg}`}
                  href="#cta"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  Join waitlist <span className="arrow">→</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Languages */}
      <section id="languages" className={styles.section}>
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <div>
              <div className={`${styles.kicker} ${styles.mono}`}>
                06 — Multi-language
              </div>
              <h2>
                Interview and publish
                <br />
                in{" "}
                <span
                  style={{
                    fontStyle: "italic",
                    fontFamily: "'Instrument Serif', Georgia, serif",
                    fontWeight: 400,
                  }}
                >
                  any of 22 languages.
                </span>
              </h2>
            </div>
          </div>
          <div className={extraStyles.langGrid}>
            {LANGUAGES.map((l) => (
              <div key={l.code} className={extraStyles.langCard}>
                <div className={extraStyles.langCardBody}>
                  <div className={extraStyles.langCardName}>{l.name}</div>
                  <div
                    className={`${extraStyles.langCardNative} ${styles.mono}`}
                  >
                    {l.native}
                  </div>
                </div>
                <div
                  className={`${extraStyles.langCardCode} ${styles.mono}`}
                >
                  {l.code}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agency */}
      <section id="agency" className={styles.section}>
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <div>
              <div className={`${styles.kicker} ${styles.mono}`}>
                07 — For agencies
              </div>
              <h2>
                One workspace.
                <br />
                Every client portal.
              </h2>
            </div>
          </div>
          <div className={extraStyles.agency}>
            <div className={extraStyles.agencyChart}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 24,
                }}
              >
                <div
                  className={styles.mono}
                  style={{
                    fontSize: 11,
                    color: "var(--fg-subtle)",
                    letterSpacing: "0.1em",
                  }}
                >
                  PINE & CEDAR · AGENCY WORKSPACE
                </div>
                <div
                  className={styles.mono}
                  style={{ fontSize: 11, color: "var(--accent)" }}
                >
                  18,420 / 20,000 credits
                </div>
              </div>
              <div className={extraStyles.agencyClients}>
                {[
                  {
                    name: "Beacon Logistics",
                    credits: 4200,
                    drafts: 12,
                    color: "#5b8dff",
                  },
                  {
                    name: "Northwind SaaS",
                    credits: 3100,
                    drafts: 9,
                    color: "oklch(0.78 0.18 148)",
                  },
                  {
                    name: "Meridian Finance",
                    credits: 2800,
                    drafts: 7,
                    color: "oklch(0.82 0.16 85)",
                  },
                  {
                    name: "Helios Health",
                    credits: 1950,
                    drafts: 5,
                    color: "oklch(0.7 0.2 25)",
                  },
                  {
                    name: "Fernweh Travel",
                    credits: 1620,
                    drafts: 4,
                    color: "#d077ff",
                  },
                ].map((c) => (
                  <div key={c.name} className={extraStyles.agencyClient}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: c.color,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>
                        {c.name}
                      </div>
                      <div
                        className={styles.mono}
                        style={{ fontSize: 11, color: "var(--fg-subtle)" }}
                      >
                        portal · {c.drafts} drafts this month
                      </div>
                    </div>
                    <div className={extraStyles.agencyBar}>
                      <div
                        style={{ width: `${c.credits / 50}%`, background: c.color }}
                      />
                    </div>
                    <div
                      className={styles.mono}
                      style={{
                        fontSize: 12,
                        color: "var(--fg-muted)",
                        minWidth: 56,
                        textAlign: "right",
                      }}
                    >
                      {c.credits.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
              <button
                className={`${styles.btn} ${styles.btnGhost}`}
                style={{ width: "100%", justifyContent: "center", marginTop: 20 }}
                type="button"
              >
                + Connect another HubSpot portal
              </button>
            </div>
            <div>
              <ul className={extraStyles.agencyFeatures}>
                <li>
                  <div className={`${extraStyles.agencyFNum} ${styles.mono}`}>
                    01
                  </div>
                  <div>
                    <h4>Unlimited client portals</h4>
                    <p>
                      OAuth each client&apos;s HubSpot separately. No risk of a
                      draft landing in the wrong portal.
                    </p>
                  </div>
                </li>
                <li>
                  <div className={`${extraStyles.agencyFNum} ${styles.mono}`}>
                    02
                  </div>
                  <div>
                    <h4>Shared credit pool</h4>
                    <p>
                      Credits belong to the agency, not the portal. Allocate
                      where the work is.
                    </p>
                  </div>
                </li>
                <li>
                  <div className={`${extraStyles.agencyFNum} ${styles.mono}`}>
                    03
                  </div>
                  <div>
                    <h4>Unlimited seats</h4>
                    <p>
                      Give every strategist, editor, and AM their own login. No
                      per-seat tax.
                    </p>
                  </div>
                </li>
                <li>
                  <div className={`${extraStyles.agencyFNum} ${styles.mono}`}>
                    04
                  </div>
                  <div>
                    <h4>Per-portal permissions</h4>
                    <p>
                      Scope team members to specific clients. Audit log for
                      everything published.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section id="compare" className={styles.section}>
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <div>
              <div className={`${styles.kicker} ${styles.mono}`}>
                08 — The alternatives
              </div>
              <h2>Be honest about where the content comes from.</h2>
            </div>
            <p className={styles.sub}>
              AI is great at writing. It&apos;s terrible at knowing your
              customers, your product, or what your team actually did last
              quarter. The fix isn&apos;t a better writer — it&apos;s a better
              interviewer. Your SMEs hold the insight. GoodContent gets it out
              of them.
            </p>
          </div>
          <div className={styles.compare}>
            <div className="head" />
            <div className={`head ${styles.us}`}>GoodContent</div>
            <div className="head">Freelancer</div>
            <div className="head">Agency</div>
            <div className="head">In-house writer</div>
            {[
              [
                "Turnaround",
                "Minutes",
                "2–3 weeks",
                "3–6 weeks",
                "3–5 days",
              ],
              [
                "Cost",
                "€199–€999/mo",
                "€500–€2,000 per piece",
                "€2,000–€8,000 per piece",
                "€60,000+/year",
              ],
              [
                "Expert interview",
                "Async · no schedule",
                "You coordinate",
                "You coordinate",
                "You do it yourself",
              ],
              [
                "Push to CMS",
                "One click",
                "Copy-paste",
                "Copy-paste",
                "Copy-paste",
              ],
            ].map((r, i) => (
              <Fragment key={`compare-row-${i}`}>
                <div className={styles.rowLabel}>{r[0]}</div>
                <div className={styles.cellUs}>
                  <b>{r[1]}</b>
                </div>
                <div>{r[2]}</div>
                <div>{r[3]}</div>
                <div>{r[4]}</div>
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className={styles.section}>
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <div>
              <div className={`${styles.kicker} ${styles.mono}`}>09 — FAQ</div>
              <h2>Frequently asked questions.</h2>
            </div>
          </div>
          <div className={styles.faq}>
            {FAQS.map((f, i) => (
              <div
                key={i}
                className={`${styles.faqItem} ${openFaq === i ? styles.open : ""}`}
                onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
              >
                <div className={styles.q}>{f.q}</div>
                <div className={styles.faqToggle}>+</div>
                <div className={styles.a}>{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="cta" className={styles.finalCta}>
        <div className={styles.bgGrid} />
        <div className={styles.wrap} style={{ position: "relative" }}>
          <div
            className={styles.mono}
            style={{
              fontSize: 11,
              color: "var(--accent)",
              letterSpacing: "0.12em",
              marginBottom: 24,
              display: "flex",
              gap: 10,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <span className={styles.ctaLiveDot} /> 847 TEAMS ON THE WAITLIST
          </div>
          <h2>
            Be first to run a <br />
            <span
              style={{
                fontStyle: "italic",
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontWeight: 400,
              }}
            >
              ten-minute interview.
            </span>
          </h2>
          <p>
            Private beta opens this summer. Early-access members get 50% off
            year one and shape the roadmap with us.
          </p>
          <div style={{ maxWidth: 520, margin: "0 auto" }}>
            <WaitlistForm size="lg" cta="Join waitlist" />
          </div>
          <div
            className={styles.mono}
            style={{
              fontSize: 11,
              color: "var(--fg-subtle)",
              letterSpacing: "0.1em",
              marginTop: 20,
            }}
          >
            Work email only · No spam · Unsubscribe any time
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.wrap}>
          <div className={styles.footGrid}>
            <div className={styles.footCol}>
              <div className={styles.logo} style={{ marginBottom: 16 }}>
                <Logo />
                <span>GoodContent</span>
              </div>
              <p
                style={{
                  maxWidth: 320,
                  fontSize: 13,
                  color: "var(--fg-muted)",
                }}
              >
                AI interviews your experts. You get the draft. Built for
                HubSpot, made in Oslo, priced in euros.
              </p>
            </div>
            <div className={styles.footCol}>
              <h5>Product</h5>
              <ul>
                <li>
                  <a href="#how">How it works</a>
                </li>
                <li>
                  <a href="#demo">Live demo</a>
                </li>
                <li>
                  <a href="#types">Content types</a>
                </li>
                <li>
                  <a href="#pricing">Pricing</a>
                </li>
                <li>
                  <a href="#">Changelog</a>
                </li>
              </ul>
            </div>
            <div className={styles.footCol}>
              <h5>Company</h5>
              <ul>
                <li>
                  <a href="#">About</a>
                </li>
                <li>
                  <a href="#">Manifesto</a>
                </li>
                <li>
                  <a href="#">Careers</a>
                </li>
                <li>
                  <a href="#">Contact</a>
                </li>
              </ul>
            </div>
            <div className={styles.footCol}>
              <h5>Resources</h5>
              <ul>
                <li>
                  <a href="#">Docs</a>
                </li>
                <li>
                  <a href="#">HubSpot setup</a>
                </li>
                <li>
                  <a href="#">Security</a>
                </li>
                <li>
                  <a href="#">Privacy</a>
                </li>
                <li>
                  <a href="#">Terms</a>
                </li>
              </ul>
            </div>
          </div>
          <div className={styles.footBottom}>
            <div>© 2026 GoodContent AS · Oslo, Norway</div>
          </div>
        </div>
      </footer>
    </main>
  );
}

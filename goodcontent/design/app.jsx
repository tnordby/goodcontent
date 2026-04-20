const { useState, useEffect, useRef } = React;

// Reusable inline email waitlist form
function WaitlistForm({ size = 'md', placeholder = 'you@company.com', cta = 'Join waitlist', compact = false }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | loading | done | err
  const [err, setErr] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!ok) { setErr('Enter a valid work email.'); setState('err'); return; }
    setErr(''); setState('loading');
    setTimeout(() => setState('done'), 900);
  };

  if (state === 'done') {
    return (
      <div className={`waitlist-done ${size === 'lg' ? 'lg' : ''}`}>
        <div className="waitlist-done-dot">✓</div>
        <div>
          <div className="waitlist-done-title">You're on the list.</div>
          <div className="waitlist-done-sub mono">
            We'll email <b style={{color:'var(--fg)'}}>{email}</b> when your workspace is ready. Usually 1–2 weeks.
          </div>
        </div>
      </div>
    );
  }

  return (
    <form className={`waitlist ${size === 'lg' ? 'waitlist-lg' : ''}`} onSubmit={submit} noValidate>
      <div className="waitlist-input-wrap">
        <span className="waitlist-at mono">@</span>
        <input
          type="email"
          className="waitlist-input"
          placeholder={placeholder}
          value={email}
          onChange={e => { setEmail(e.target.value); if (state === 'err') setState('idle'); }}
          required
        />
      </div>
      <button type="submit" className={`btn btn-primary ${size === 'lg' ? 'btn-lg' : ''}`} disabled={state === 'loading'}>
        {state === 'loading' ? (
          <>Joining<span className="dot-elipsis"><i/><i/><i/></span></>
        ) : (
          <>{cta} <span className="arrow">→</span></>
        )}
      </button>
      {state === 'err' && !compact && (
        <div className="waitlist-err mono">↑ {err}</div>
      )}
    </form>
  );
}

function Nav() {
  return (
    <nav className="nav">
      <div className="wrap nav-inner">
        <a href="#" className="logo">
          <div className="logo-mark">G</div>
          <span>GoodContent</span>
        </a>
        <div className="nav-links">
          <a href="#how">How it works</a>
          <a href="#demo">Demo</a>
          <a href="#types">Content types</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </div>
        <div className="nav-right">
          <a className="btn btn-primary" href="#cta">Join waitlist <span className="arrow">→</span></a>
        </div>
      </div>
    </nav>
  );
}

const HERO_VARIANTS = {
  mechanism: {
    eyebrow: null,
    h1: (<>A content writer,<br /><em>as software.</em></>),
    sub: "Skip the expensive writers. Hire an AI interviewer instead. It runs async voice interviews with your SMEs and clients — and publishes the draft straight to your CMS.",
  },
  shock: {
    eyebrow: null,
    h1: (<>Agency-quality content.<br /><em>SaaS price.</em></>),
    sub: "Stop paying €2,500 and waiting four weeks. GoodContent turns a 10-minute expert interview into a polished draft in HubSpot — from €199/mo.",
  },
  speed: {
    eyebrow: null,
    h1: (<>Publish <span className="underline">expert-led</span> content<br /><em>in hours, not weeks.</em></>),
    sub: "Your expert speaks for 10 minutes. GoodContent drafts, formats, and ships to HubSpot — without chasing freelancers or rewriting AI slop.",
  },
};

function Hero({ variant }) {
  const v = HERO_VARIANTS[variant] || HERO_VARIANTS.mechanism;
  return (
    <section className="hero">
      <div className="bg-grid" />
      <div className="wrap">
        <div className="hero-grid">
          <div>
            {v.eyebrow && (
              <span className="hero-eyebrow">
                <span className="pill">{v.eyebrow.pill}</span>
                {v.eyebrow.text}
              </span>
            )}
            <h1 className="hero-title">{v.h1}</h1>
            <p className="hero-sub">{v.sub}</p>
            <WaitlistForm size="lg" cta="Join waitlist" />
            <div className="hero-meta">
              <span>Private beta this summer</span>
              <span>First 100 teams get 50% off year one</span>
            </div>
          </div>
          <HeroArt />
        </div>
      </div>
    </section>
  );
}

function HeroArt() {
  return (
    <div className="hero-art">
      <div className="hero-art-card">
        <div className="hero-art-head">
          <div className="mono" style={{fontSize:10, color:'var(--fg-subtle)', letterSpacing:'0.12em'}}>BRIEF → INTERVIEW → DRAFT</div>
          <div className="mono" style={{fontSize:10, color:'var(--accent)'}}>● LIVE</div>
        </div>
        <div className="hero-art-stack">
          <div className="hero-art-row" style={{'--d':'0s'}}>
            <div className="hero-art-tag">01 · BRIEF</div>
            <div className="hero-art-txt">Case study — Beacon Logistics</div>
            <div className="hero-art-meta mono">03:42</div>
          </div>
          <div className="hero-art-row hero-art-active" style={{'--d':'0.1s'}}>
            <div className="hero-art-tag">02 · INTERVIEW</div>
            <div className="hero-art-txt">
              <span className="hero-wave">
                {Array.from({length:14}).map((_,i)=>(<i key={i} style={{animationDelay:`${i*0.08}s`}}/>))}
              </span>
              <span style={{marginLeft:10}}>Recording · Jamie speaking</span>
            </div>
            <div className="hero-art-meta mono" style={{color:'var(--accent)'}}>08:17</div>
          </div>
          <div className="hero-art-row hero-art-pending" style={{'--d':'0.2s'}}>
            <div className="hero-art-tag">03 · DRAFT</div>
            <div className="hero-art-txt" style={{color:'var(--fg-subtle)'}}>Generating · pushed to HubSpot</div>
            <div className="hero-art-meta mono" style={{color:'var(--fg-subtle)'}}>—:—</div>
          </div>
        </div>

        <div className="hero-art-footer">
          <div className="hero-art-footer-stat">
            <div className="mono" style={{fontSize:10, color:'var(--fg-subtle)', letterSpacing:'0.1em'}}>AVG INTERVIEW</div>
            <div className="hero-art-footer-val">11 min</div>
          </div>
          <div className="hero-art-footer-stat">
            <div className="mono" style={{fontSize:10, color:'var(--fg-subtle)', letterSpacing:'0.1em'}}>AVG DRAFT TIME</div>
            <div className="hero-art-footer-val">54 sec</div>
          </div>
          <div className="hero-art-footer-stat">
            <div className="mono" style={{fontSize:10, color:'var(--fg-subtle)', letterSpacing:'0.1em'}}>VS AGENCY</div>
            <div className="hero-art-footer-val" style={{color:'var(--accent)'}}>−96%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Logos() {
  return (
    <section className="logos">
      <div className="wrap logos-inner">
        <div className="logos-label">Trusted by 120+ marketing teams</div>
        <div className="logos-row">
          <div className="logo-item">▲ Northwind</div>
          <div className="logo-item">◆ Beacon</div>
          <div className="logo-item">◉ Helios</div>
          <div className="logo-item">▣ Fernweh</div>
          <div className="logo-item">⬢ Meridian</div>
          <div className="logo-item">◎ Parabola</div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how">
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="kicker">01 — How it works</div>
            <h2>Three steps. Zero freelancers.</h2>
          </div>
        </div>

        <div className="steps">
          <div className="step">
            <div className="step-num">STEP 01 · 2 MIN</div>
            <h3>Fill a brief.</h3>
            <p>Content type, title, topic, tone, language. Claude generates tailored interview questions. Edit, reorder, replace, done.</p>
          </div>
          <div className="step">
            <div className="step-num">STEP 02 · ASYNC</div>
            <h3>Send a link.</h3>
            <p>Expires in 7 days. No login. Your expert opens it on their phone, presses record, and talks. The AI probes for specifics and asks for proof.</p>
          </div>
          <div className="step">
            <div className="step-num">STEP 03 · 60 SEC</div>
            <h3>Receive the content.</h3>
            <p>Claude synthesises transcript + brief into a polished draft. Review, regenerate sections, push to HubSpot individually or in bulk.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function DemoSection() {
  return (
    <section id="demo">
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="kicker">02 — Live demo</div>
            <h2>An AI interviewer.<br/>No expensive writers.</h2>
          </div>
        </div>
        <InterviewDemo />
      </div>
    </section>
  );
}

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

function ContentTypes() {
  return (
    <section id="types">
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="kicker">03 — Eight content types</div>
            <h2>One interview. The right output shape.</h2>
          </div>
        </div>
        <div className="types">
          {CONTENT_TYPES.map(t => (
            <div key={t.name} className="type-card">
              <div className="type-icon">{t.icon}</div>
              <h4>{t.name}</h4>
              <div className="map">{t.map}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HubspotCallout() {
  return (
    <section id="hubspot">
      <div className="wrap">
        <div className="section-head" style={{paddingBottom: 24}}>
          <div>
            <div className="kicker">04 — HubSpot native</div>
            <h2>Built for teams already on HubSpot.</h2>
          </div>
          <p className="sub">No copy-paste. No Zapier duct tape. OAuth once, then every draft ships straight into the right tool.</p>
        </div>
        <div className="hubspot-call">
          <div className="hubspot-check">
            <ul>
              <li><span className="chk">✓</span> OAuth 2.0 connection — one click, per portal</li>
              <li><span className="chk">✓</span> Direct push to Blog, Landing Pages, Site Pages, Email</li>
              <li><span className="chk">✓</span> Bulk export (up to 20 drafts at once)</li>
              <li><span className="chk">✓</span> Auto-tagging + meta description</li>
              <li><span className="chk">✓</span> Agencies: connect multiple portals, one per client</li>
              <li><span className="chk">✓</span> SOC-2 in progress · GDPR ready · EU-hosted</li>
            </ul>
          </div>
          <div className="hubspot-mock">
            <div className="hubspot-mock-head">
              <div className="mono" style={{fontSize:11, color:'var(--fg-subtle)', letterSpacing:'0.1em'}}>HUBSPOT EXPORT</div>
              <div className="mono" style={{fontSize:11, color:'var(--accent)'}}>● Connected</div>
            </div>
            <div className="hubspot-portal">
              <div className="hubspot-portal-dot" />
              <div style={{flex:1}}>
                <div style={{fontSize:14, fontWeight:500}}>Northwind HubSpot</div>
                <div className="mono" style={{fontSize:11, color:'var(--fg-subtle)'}}>hub_id: 47829103 · admin</div>
              </div>
              <button className="btn btn-ghost" style={{height:28, fontSize:12}}>Switch</button>
            </div>
            <div className="hubspot-queue">
              <div className="hubspot-q-row">
                <span className="hubspot-q-ok">✓</span>
                <span style={{flex:1}}>Beacon Logistics — case study</span>
                <span className="mono" style={{color:'var(--fg-subtle)', fontSize:11}}>Blog</span>
              </div>
              <div className="hubspot-q-row">
                <span className="hubspot-q-ok">✓</span>
                <span style={{flex:1}}>Activation playbook — guide</span>
                <span className="mono" style={{color:'var(--fg-subtle)', fontSize:11}}>Blog</span>
              </div>
              <div className="hubspot-q-row">
                <span className="hubspot-q-ok">✓</span>
                <span style={{flex:1}}>Spring campaign — landing</span>
                <span className="mono" style={{color:'var(--fg-subtle)', fontSize:11}}>LP</span>
              </div>
              <div className="hubspot-q-row hubspot-q-active">
                <span className="hubspot-q-spin" />
                <span style={{flex:1}}>"Why decisions beat steps" — email</span>
                <span className="mono" style={{color:'var(--accent)', fontSize:11}}>Pushing…</span>
              </div>
            </div>
            <div style={{padding:'12px 16px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between'}}>
              <div className="mono" style={{fontSize:11, color:'var(--fg-muted)'}}>4 drafts · 50 credits</div>
              <div className="mono" style={{fontSize:11, color:'var(--fg-muted)'}}>HS API v3</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const tiers = [
    {
      name: "Starter", sub: "For solo marketers getting started",
      price: 199, credits: "2,000",
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
      name: "Growth", sub: "For in-house marketing teams",
      price: 499, credits: "6,000",
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
      name: "Agency", sub: "For content agencies & multi-brand teams",
      price: 999, credits: "20,000",
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

  return (
    <section id="pricing">
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="kicker">05 — Pricing</div>
            <h2>Priced on credits, not seats.</h2>
          </div>

        </div>

        <div className="pricing">
          {tiers.map(t => (
            <div key={t.name} className={`price-card ${t.feature ? 'feature' : ''}`}>
              <div>
                <div className="price-name">{t.name}</div>
                <div className="price-sub">{t.sub}</div>
              </div>
              <div className="price-tag">
                <span className="num">€{t.price}</span>
                <span className="per">/month</span>
              </div>
              <div className="price-credits">
                <span>{t.credits} credits / mo</span>
                <span>incl. VAT</span>
              </div>
              <ul className="price-features">
                {t.features.map(f => <li key={f}>{f}</li>)}
              </ul>
              <a className={`btn ${t.feature ? 'btn-primary' : 'btn-ghost'} btn-lg`} href="#cta" style={{width:'100%', justifyContent:'center'}}>
                Join waitlist <span className="arrow">→</span>
              </a>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

function LanguageSection() {
  const LANGS = [
    { code: 'EN', name: 'English', native: 'English', flag: 'gb' },
    { code: 'NO', name: 'Norwegian', native: 'Norsk', flag: 'no' },
    { code: 'SV', name: 'Swedish', native: 'Svenska', flag: 'se' },
    { code: 'DA', name: 'Danish', native: 'Dansk', flag: 'dk' },
    { code: 'FI', name: 'Finnish', native: 'Suomi', flag: 'fi' },
    { code: 'DE', name: 'German', native: 'Deutsch', flag: 'de' },
    { code: 'FR', name: 'French', native: 'Français', flag: 'fr' },
    { code: 'ES', name: 'Spanish', native: 'Español', flag: 'es' },
    { code: 'IT', name: 'Italian', native: 'Italiano', flag: 'it' },
    { code: 'PT', name: 'Portuguese', native: 'Português', flag: 'pt' },
    { code: 'NL', name: 'Dutch', native: 'Nederlands', flag: 'nl' },
    { code: 'PL', name: 'Polish', native: 'Polski', flag: 'pl' },
    { code: 'CS', name: 'Czech', native: 'Čeština', flag: 'cz' },
    { code: 'RO', name: 'Romanian', native: 'Română', flag: 'ro' },
    { code: 'EL', name: 'Greek', native: 'Ελληνικά', flag: 'gr' },
    { code: 'TR', name: 'Turkish', native: 'Türkçe', flag: 'tr' },
    { code: 'UK', name: 'Ukrainian', native: 'Українська', flag: 'ua' },
    { code: 'JA', name: 'Japanese', native: '日本語', flag: 'jp' },
    { code: 'KO', name: 'Korean', native: '한국어', flag: 'kr' },
    { code: 'ZH', name: 'Chinese', native: '中文', flag: 'cn' },
    { code: 'AR', name: 'Arabic', native: 'العربية', flag: 'sa' },
    { code: 'HI', name: 'Hindi', native: 'हिन्दी', flag: 'in' },
  ];
  return (
    <section id="languages">
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="kicker">06 — Multi-language</div>
            <h2>Interview and publish<br/>in <span style={{fontStyle:'italic', fontFamily:"'Instrument Serif', Georgia, serif", fontWeight:400}}>any of 22 languages.</span></h2>
          </div>
          <p className="sub">Your expert speaks their native language. You pick the output language per brief. Mix and match — interview in Norwegian, publish in English, Spanish, and German from the same recording.</p>
        </div>
        <div className="lang-grid">
          {LANGS.map(l => (
            <div key={l.code} className="lang-card">
              <div className="lang-card-body">
                <div className="lang-card-name">{l.name}</div>
                <div className="lang-card-native mono">{l.native}</div>
              </div>
              <div className="lang-card-code mono">{l.code}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AgencySection() {
  return (
    <section id="agency">
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="kicker">07 — For agencies</div>
            <h2>One workspace.<br/>Every client portal.</h2>
          </div>
        </div>
        <div className="agency">
          <div className="agency-chart">
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:24}}>
              <div className="mono" style={{fontSize:11, color:'var(--fg-subtle)', letterSpacing:'0.1em'}}>PINE & CEDAR · AGENCY WORKSPACE</div>
              <div className="mono" style={{fontSize:11, color:'var(--accent)'}}>18,420 / 20,000 credits</div>
            </div>
            <div className="agency-clients">
              {[
                {name: 'Beacon Logistics', credits: 4200, drafts: 12, color: '#5b8dff'},
                {name: 'Northwind SaaS', credits: 3100, drafts: 9, color: 'oklch(0.78 0.18 148)'},
                {name: 'Meridian Finance', credits: 2800, drafts: 7, color: 'oklch(0.82 0.16 85)'},
                {name: 'Helios Health', credits: 1950, drafts: 5, color: 'oklch(0.7 0.2 25)'},
                {name: 'Fernweh Travel', credits: 1620, drafts: 4, color: '#d077ff'},
              ].map(c => (
                <div key={c.name} className="agency-client">
                  <div style={{width:8, height:8, borderRadius:'50%', background: c.color, flexShrink:0}}/>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize:14, fontWeight:500}}>{c.name}</div>
                    <div className="mono" style={{fontSize:11, color:'var(--fg-subtle)'}}>portal · {c.drafts} drafts this month</div>
                  </div>
                  <div className="agency-bar">
                    <div style={{width: `${c.credits/50}%`, background: c.color}}/>
                  </div>
                  <div className="mono" style={{fontSize:12, color:'var(--fg-muted)', minWidth:56, textAlign:'right'}}>
                    {c.credits.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-ghost" style={{width:'100%', justifyContent:'center', marginTop:20}}>
              + Connect another HubSpot portal
            </button>
          </div>
          <div>
            <ul className="agency-features">
              <li>
                <div className="agency-f-num mono">01</div>
                <div>
                  <h4>Unlimited client portals</h4>
                  <p>OAuth each client's HubSpot separately. No risk of a draft landing in the wrong portal.</p>
                </div>
              </li>
              <li>
                <div className="agency-f-num mono">02</div>
                <div>
                  <h4>Shared credit pool</h4>
                  <p>Credits belong to the agency, not the portal. Allocate where the work is.</p>
                </div>
              </li>
              <li>
                <div className="agency-f-num mono">03</div>
                <div>
                  <h4>Unlimited seats</h4>
                  <p>Give every strategist, editor, and AM their own login. No per-seat tax.</p>
                </div>
              </li>
              <li>
                <div className="agency-f-num mono">04</div>
                <div>
                  <h4>Per-portal permissions</h4>
                  <p>Scope team members to specific clients. Audit log for everything published.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Comparison() {
  const rows = [
    ['Turnaround', 'Minutes', '2–4 weeks', '1–2 weeks', 'Hours'],
    ['Cost per piece', '€199–€999/mo', '€500–€2,000', '€800–€5,000', '€0 (in-house)'],
    ['Expert interview', 'Async · no schedule', 'You schedule', 'You schedule', '—'],
    ['Push to CMS', 'One click', 'Copy-paste', 'Copy-paste', '—'],
  ];
  return (
    <section id="compare">
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="kicker">08 — The alternatives</div>
            <h2>Be honest about where the content comes from.</h2>
          </div>
          <p className="sub">AI is great at writing. It's terrible at knowing your customers, your product, or what your team actually did last quarter. The fix isn't a better writer — it's a better interviewer. Your SMEs hold the insight. GoodContent gets it out of them.</p>
        </div>
        <div className="compare">
          <div className="head"></div>
          <div className="head us">GoodContent</div>
          <div className="head">Freelancer</div>
          <div className="head">Agency</div>
          <div className="head">In-house writer</div>
          {rows.map((r, i) => (
            <React.Fragment key={i}>
              <div className="row-label">{r[0]}</div>
              <div className="cell-us"><b>{r[1]}</b></div>
              <div>{r[2]}</div>
              <div>{r[3]}</div>
              <div>{r[4]}</div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  { q: "Does this replace our content team?", a: "No. It replaces the freelancer or agency they used to brief. Your team still owns strategy, the brief, the edit, and the final call to publish. GoodContent removes the slow, expensive middle." },
  { q: "Will the drafts sound like generic AI slop?", a: "They shouldn't. The difference is that every draft is built from a real transcript of a real person who actually knows the topic. Claude is a synthesiser, not a guesser. That said — you'll edit. We assume 10-20 minutes of editing per piece." },
  { q: "What happens to the audio?", a: "Audio is stored in Cloudflare R2 (EU region), transcripts in Convex. You can delete both from the dashboard at any time. Nothing is used for training." },
  { q: "Does the guest need an account?", a: "No. The interview link is token-based and expires in 7 days. They just open it, press record, and talk." },
  { q: "What if my expert goes off-topic?", a: "Claude watches the live transcript and steers back on-brief. It also caps follow-ups at three per question so the interview doesn't drag on." },
  { q: "Can I connect multiple HubSpot portals?", a: "Yes, on the Agency plan. Each portal is OAuth'd separately. Perfect for agencies managing multiple clients." },
  { q: "What counts as a credit?", a: "Interviews (10/min), drafts (50/piece), bulk export (10 per 5 pieces). Briefs, question generation, viewing drafts — free." },
  { q: "Do credits roll over?", a: "One month. Use 'em or lose 'em after that. You can never go negative — actions are blocked, not back-charged." },
];

function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq">
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="kicker">09 — FAQ</div>
            <h2>Questions people actually ask.</h2>
          </div>
        </div>
        <div className="faq">
          {FAQS.map((f, i) => (
            <div key={i} className={`faq-item ${open === i ? 'open' : ''}`} onClick={() => setOpen(open === i ? -1 : i)}>
              <div className="q">{f.q}</div>
              <div className="faq-toggle">+</div>
              <div className="a">{f.a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  const [count, setCount] = useState(847);
  useEffect(() => {
    const id = setInterval(() => setCount(c => c + (Math.random() > 0.7 ? 1 : 0)), 3500);
    return () => clearInterval(id);
  }, []);
  return (
    <section id="cta" className="final-cta">
      <div className="bg-grid" />
      <div className="wrap" style={{position:'relative'}}>
        <div className="mono" style={{fontSize:11, color:'var(--accent)', letterSpacing:'0.12em', marginBottom:24, display:'flex', gap:10, justifyContent:'center', alignItems:'center'}}>
          <span className="cta-live-dot"/> {count.toLocaleString()} TEAMS ON THE WAITLIST
        </div>
        <h2>
          Be first to run a <br/>
          <span style={{fontStyle:'italic', fontFamily:"'Instrument Serif', Georgia, serif", fontWeight:400}}>ten-minute interview.</span>
        </h2>
        <p>Private beta opens this summer. Early-access members get 50% off year one and shape the roadmap with us.</p>
        <div style={{maxWidth:520, margin:'0 auto'}}>
          <WaitlistForm size="lg" cta="Join waitlist" />
        </div>
        <div className="mono" style={{fontSize:11, color:'var(--fg-subtle)', letterSpacing:'0.1em', marginTop:20}}>
          Work email only · No spam · Unsubscribe any time
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-col">
            <div className="logo" style={{marginBottom:16}}>
              <div className="logo-mark">G</div>
              <span>GoodContent</span>
            </div>
            <p style={{maxWidth:320, fontSize:13, color:'var(--fg-muted)'}}>
              AI interviews your experts. You get the draft. Built for HubSpot, made in Oslo, priced in euros.
            </p>
          </div>
          <div className="foot-col">
            <h5>Product</h5>
            <ul>
              <li><a href="#how">How it works</a></li>
              <li><a href="#demo">Live demo</a></li>
              <li><a href="#types">Content types</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#">Changelog</a></li>
            </ul>
          </div>
          <div className="foot-col">
            <h5>Company</h5>
            <ul>
              <li><a href="#">About</a></li>
              <li><a href="#">Manifesto</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>
          <div className="foot-col">
            <h5>Resources</h5>
            <ul>
              <li><a href="#">Docs</a></li>
              <li><a href="#">HubSpot setup</a></li>
              <li><a href="#">Security</a></li>
              <li><a href="#">Privacy</a></li>
              <li><a href="#">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="foot-bottom">
          <div>© 2026 GoodContent AS · Oslo, Norway</div>
        </div>
      </div>
    </footer>
  );
}

function TweaksPanel({ active, theme, setTheme, hero, setHero }) {
  if (!active) return null;
  return (
    <div className="tweaks-panel active">
      <h4>
        <span>⚙ TWEAKS</span>
        <span style={{color:'var(--fg-subtle)'}}>goodcontent</span>
      </h4>
      <div className="tweaks-row">
        <label>THEME</label>
        <div className="tweaks-opts">
          <button className={`tweak-opt ${theme==='carbon'?'active':''}`} onClick={()=>setTheme('carbon')}>Carbon</button>
          <button className={`tweak-opt ${theme==='signal'?'active':''}`} onClick={()=>setTheme('signal')}>Signal</button>
        </div>
      </div>
      <div className="tweaks-row">
        <label>HERO ANGLE</label>
        <div className="tweaks-opts">
          <button className={`tweak-opt ${hero==='mechanism'?'active':''}`} onClick={()=>setHero('mechanism')}>Mechanism</button>
          <button className={`tweak-opt ${hero==='shock'?'active':''}`} onClick={()=>setHero('shock')}>Price shock</button>
          <button className={`tweak-opt ${hero==='speed'?'active':''}`} onClick={()=>setHero('speed')}>Speed</button>
        </div>
      </div>
      <div style={{fontSize:11, color:'var(--fg-subtle)', fontFamily:'var(--font-mono)', marginTop:14, paddingTop:12, borderTop:'1px solid var(--border)'}}>
        Two full page directions. All copy variants are real.
      </div>
    </div>
  );
}

const DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "signal",
  "hero": "mechanism"
}/*EDITMODE-END*/;

function App() {
  const [theme, setTheme] = useState(DEFAULTS.theme);
  const [hero, setHero] = useState(DEFAULTS.hero);
  const [tweaksActive, setTweaksActive] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Tweaks protocol
  useEffect(() => {
    const handler = (e) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === '__activate_edit_mode') setTweaksActive(true);
      if (e.data.type === '__deactivate_edit_mode') setTweaksActive(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const persist = (k, v) => {
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [k]: v } }, '*');
  };

  const handleTheme = (t) => { setTheme(t); persist('theme', t); };
  const handleHero = (h) => { setHero(h); persist('hero', h); };

  return (
    <>
      <Nav />
      <Hero variant={hero} />
      <HowItWorks />
      <DemoSection />
      <ContentTypes />
      <HubspotCallout />
      <Pricing />
      <LanguageSection />
      <AgencySection />
      <Comparison />
      <FAQ />
      <FinalCTA />
      <Footer />
      <TweaksPanel
        active={tweaksActive}
        theme={theme} setTheme={handleTheme}
        hero={hero} setHero={handleHero}
      />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

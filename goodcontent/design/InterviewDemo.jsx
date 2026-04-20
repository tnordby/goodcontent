// Interactive AI interview demo widget
const { useState, useEffect, useRef } = React;

const DEMO_SCRIPT = [
  {
    q: "Let's start simple — what does Northwind actually do, in your own words?",
    a: "We help mid-market SaaS companies cut their onboarding time. Most of our customers go from signup to first value in under a day.",
    followups: [
      { q: "\"Under a day\" — do you have a specific number?", a: "Yeah, our P50 is about four hours. P90 is closer to eighteen." },
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
      { q: "Are Beacon okay being named in the piece?", a: "Yep, I'll get the CS team to confirm quotes." },
    ],
  },
];

const Wave = ({ active }) => {
  const bars = 28;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 24 }}>
      {Array.from({ length: bars }).map((_, i) => (
        <div key={i} style={{
          width: 2,
          height: active ? `${20 + Math.sin((Date.now() / 120) + i * 0.5) * 40 + Math.random() * 30}%` : '8%',
          background: 'var(--accent)',
          borderRadius: 1,
          transition: 'height 0.08s',
          opacity: active ? 1 : 0.3,
        }} />
      ))}
    </div>
  );
};

function InterviewDemo() {
  const [state, setState] = useState('idle'); // idle | asking | listening | follow | done
  const [qIdx, setQIdx] = useState(0);
  const [fIdx, setFIdx] = useState(-1); // -1 = main, 0+ = followup
  const [transcript, setTranscript] = useState([]); // {role, text, partial?}
  const [elapsed, setElapsed] = useState(0);
  const [tick, setTick] = useState(0);
  const timerRef = useRef(null);

  // force re-render for wave animation
  useEffect(() => {
    if (state === 'listening') {
      const id = setInterval(() => setTick(t => t + 1), 80);
      return () => clearInterval(id);
    }
  }, [state]);

  // elapsed timer
  useEffect(() => {
    if (state !== 'idle' && state !== 'done') {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [state]);

  const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;

  const typeInto = async (role, text, speed = 18) => {
    return new Promise(resolve => {
      let i = 0;
      setTranscript(t => [...t, { role, text: '', partial: true }]);
      const id = setInterval(() => {
        i++;
        setTranscript(t => {
          const copy = [...t];
          copy[copy.length - 1] = { role, text: text.slice(0, i), partial: true };
          return copy;
        });
        if (i >= text.length) {
          clearInterval(id);
          setTranscript(t => {
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
    setQIdx(0); setFIdx(-1); setElapsed(0);

    for (let qi = 0; qi < DEMO_SCRIPT.length; qi++) {
      setQIdx(qi); setFIdx(-1);
      const item = DEMO_SCRIPT[qi];

      setState('asking');
      await typeInto('ai', item.q, 22);
      await new Promise(r => setTimeout(r, 300));

      setState('listening');
      await new Promise(r => setTimeout(r, 1200));
      await typeInto('guest', item.a, 14);
      await new Promise(r => setTimeout(r, 400));

      for (let fi = 0; fi < item.followups.length; fi++) {
        setFIdx(fi);
        setState('follow');
        await new Promise(r => setTimeout(r, 500));
        await typeInto('ai', item.followups[fi].q, 22);
        setState('listening');
        await new Promise(r => setTimeout(r, 900));
        await typeInto('guest', item.followups[fi].a, 14);
        await new Promise(r => setTimeout(r, 400));
      }
    }

    setState('done');
  };

  const reset = () => {
    setState('idle');
    setTranscript([]);
    setQIdx(0); setFIdx(-1); setElapsed(0);
  };

  const statusLabel = {
    idle: 'READY',
    asking: 'AI SPEAKING',
    listening: 'LISTENING',
    follow: 'FOLLOW-UP',
    done: 'COMPLETE',
  }[state];

  const statusColor = state === 'listening' ? 'var(--accent)' :
                     state === 'asking' || state === 'follow' ? '#5b8dff' :
                     state === 'done' ? 'var(--fg-muted)' : 'var(--fg-muted)';

  return (
    <div className="demo-shell">
      {/* Browser chrome */}
      <div className="demo-chrome">
        <div className="demo-dots">
          <span /><span /><span />
        </div>
        <div className="demo-url mono">
          <span style={{opacity:0.4}}>goodcontent.ai/interview/</span>
          <span>t_4h2x9k</span>
        </div>
        <div style={{width:52}} />
      </div>

      <div className="demo-body">
        {/* Left: AI circle + status */}
        <div className="demo-left">
          <div className="demo-orb-wrap">
            <div className={`demo-orb ${state === 'listening' ? 'pulse-listen' : state === 'asking' || state === 'follow' ? 'pulse-speak' : ''}`}>
              <div className="demo-orb-inner">
                <Wave active={state === 'listening' || state === 'asking' || state === 'follow'} />
              </div>
            </div>
          </div>
          <div className="demo-status">
            <div className="demo-status-dot" style={{ background: statusColor }} />
            <span className="mono" style={{ fontSize: 11, letterSpacing: '0.1em', color: statusColor }}>{statusLabel}</span>
          </div>
          <div className="demo-timer mono">{fmtTime(elapsed)}</div>
          <div className="demo-brief">
            <div className="demo-brief-label mono">BRIEF</div>
            <div className="demo-brief-title">Case study: Beacon Logistics</div>
            <div className="demo-brief-meta mono">
              <span>CASE_STUDY</span>
              <span>·</span>
              <span>EN</span>
              <span>·</span>
              <span>{qIdx + 1}/{DEMO_SCRIPT.length}</span>
            </div>
          </div>
        </div>

        {/* Right: transcript */}
        <div className="demo-right">
          <div className="demo-transcript" ref={el => {
            if (el) el.scrollTop = el.scrollHeight;
          }}>
            {transcript.length === 0 && state === 'idle' && (
              <div className="demo-empty">
                <div className="mono u" style={{fontSize:11,color:'var(--fg-subtle)',marginBottom:10}}>TRANSCRIPT</div>
                <div style={{color:'var(--fg-muted)', fontSize:14, maxWidth:360}}>
                  Press <b style={{color:'var(--fg)'}}>Start interview</b> to watch the AI conduct an async voice interview in real time. This is a scripted demo of a real case-study brief.
                </div>
              </div>
            )}
            {transcript.map((line, i) => (
              <div key={i} className={`demo-line ${line.role}`}>
                <div className="demo-who mono">{line.role === 'ai' ? 'GOODCONTENT' : 'GUEST · Jamie'}</div>
                <div className="demo-text">
                  {line.text}
                  {line.partial && <span className="cursor">▋</span>}
                </div>
              </div>
            ))}
            {state === 'done' && (
              <div className="demo-done">
                <div className="mono" style={{fontSize:11,color:'var(--accent)',letterSpacing:'0.1em'}}>✓ INTERVIEW COMPLETE</div>
                <div style={{fontSize:14, color:'var(--fg-muted)', marginTop:6}}>Claude is now drafting your case study. Usually takes 30-60 seconds.</div>
              </div>
            )}
          </div>

          <div className="demo-controls">
            {state === 'idle' && (
              <button className="btn btn-primary" onClick={run}>
                ▶ Start interview <span className="mono" style={{opacity:0.6, marginLeft:4}}>2 min</span>
              </button>
            )}
            {state !== 'idle' && state !== 'done' && (
              <div className="demo-running mono">
                <span className="demo-rec" /> Recording · interview in progress
              </div>
            )}
            {state === 'done' && (
              <button className="btn btn-ghost" onClick={reset}>Replay demo</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

window.InterviewDemo = InterviewDemo;

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mic, MicOff, Volume2, MessageSquare, ChevronRight,
  Sparkles, Clock, BookOpen, Star, Zap,
} from "lucide-react";

/* ─── Tokens ─── */
const F    = "'Inter','Plus Jakarta Sans',sans-serif";
const OG   = "#FF6B00";
const NAVY = "#0B1220";
const T1   = "#111827";
const T2   = "#6B7280";
const T3   = "#9CA3AF";
const BDR  = "#E5E7EB";
const CARD = "#FFFFFF";
const OGL  = "#FFF7ED";
const OGLT = "#FFEDD5";
const SH   = "0 2px 8px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)";
const SHM  = "0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.05)";

/* ─── Types ─── */
type Screen = "landing" | "active";
type Mode   = "voice" | "text";
type Phase  = "ai-speaking" | "user-turn" | "user-speaking";

/* ─── Data ─── */
const WAVEFORM_H = [10,16,24,32,40,44,38,30,22,16,12,18,26,36,44,48,42,34,26,18,12,16,22,32,40,44,36,24];
const TOPICS = [
  { id:"t1", label:"React hooks & lifecycle"  },
  { id:"t2", label:"System design concepts"   },
  { id:"t3", label:"TypeScript fundamentals"  },
  { id:"t4", label:"Algorithms & DS"          },
];
const QUESTIONS = [
  "Tell me about yourself and your interest in frontend development.",
  "Can you explain the difference between controlled and uncontrolled components in React?",
  "How do you approach performance optimization in a React application?",
  "Walk me through how you'd design a scalable state management solution.",
];

/* ════════════════════════════════════════════════
   SHARED — Voice / Text mode toggle
════════════════════════════════════════════════ */
function ModeToggle({ mode, onChange }: { mode: Mode; onChange:(m:Mode)=>void }) {
  return (
    <div style={{
      display:"inline-flex", alignItems:"center",
      background:"#F3F4F6", borderRadius:"99px", padding:"3px",
    }}>
      {(["voice","text"] as Mode[]).map(m => (
        <button key={m} onClick={()=>onChange(m)}
          style={{
            display:"flex", alignItems:"center", gap:"5px",
            padding:"6px 14px", borderRadius:"99px",
            background: mode===m ? CARD : "transparent",
            border:"none", cursor:"pointer",
            fontFamily:F, fontWeight: mode===m ? 700 : 400,
            fontSize:"0.8rem",
            color: mode===m ? T1 : T3,
            boxShadow: mode===m ? SH : "none",
            transition:"all 0.18s",
          }}
        >
          {m==="voice" ? <Volume2 size={12} color={mode===m?OG:T3}/> : <MessageSquare size={12} color={mode===m?OG:T3}/>}
          {m==="voice" ? "Voice" : "Text"}
          {mode===m && m==="voice" && (
            <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:OG }}/>
          )}
        </button>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════
   SHARED — Animated Waveform Bars
════════════════════════════════════════════════ */
function Waveform({ active }: { active: boolean }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"3px", height:"54px" }}>
      {WAVEFORM_H.map((h, i) => (
        <motion.div key={i}
          style={{ width:"3.5px", borderRadius:"3px", background:OG, flexShrink:0 }}
          animate={active ? {
            height:[`${h*0.45}px`,`${h}px`,`${h*0.6}px`,`${h*1.08}px`,`${h*0.45}px`],
            opacity:[0.5, 1, 0.7, 1, 0.5],
          } : {
            height:"3px", opacity:0.3,
          }}
          transition={{ duration:1.1, repeat:Infinity, delay:i*0.038, ease:"easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════
   SHARED — Glowing AI Orb
════════════════════════════════════════════════ */
function AIOrb({ phase, size=88 }: { phase: Phase; size?: number }) {
  const active = phase === "ai-speaking";
  return (
    <div style={{
      position:"relative",
      width:`${size + 80}px`, height:`${size + 80}px`,
      display:"flex", alignItems:"center", justifyContent:"center",
    }}>
      {/* Concentric rings */}
      {[1,2,3].map(i => (
        <motion.div key={i}
          style={{
            position:"absolute",
            width:`${size + i*26}px`, height:`${size + i*26}px`,
            borderRadius:"50%",
            border:`1px solid rgba(255,107,0,${0.18-i*0.04})`,
            background:`rgba(255,107,0,${0.025-i*0.006})`,
            pointerEvents:"none",
          }}
          animate={active ? {
            scale:[1, 1.04+i*0.012, 1],
            opacity:[0.85, 0.3, 0.85],
          } : { opacity:0.28 }}
          transition={{ duration:1.8+i*0.3, repeat:Infinity, ease:"easeInOut", delay:i*0.18 }}
        />
      ))}
      {/* Main sphere */}
      <motion.div
        animate={active ? {
          boxShadow:[
            `0 0 24px rgba(255,107,0,0.38)`,
            `0 0 48px rgba(255,107,0,0.62)`,
            `0 0 24px rgba(255,107,0,0.38)`,
          ],
        } : { boxShadow:"0 0 20px rgba(255,107,0,0.28)" }}
        transition={{ duration:1.6, repeat:Infinity, ease:"easeInOut" }}
        style={{
          width:`${size}px`, height:`${size}px`, borderRadius:"50%", zIndex:1, flexShrink:0,
          background:"radial-gradient(circle at 38% 36%, #FFAD70, #FF6B00 50%, #E05000 100%)",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}
      >
        <Sparkles size={size*0.34} color="#fff" fill="#fff"/>
      </motion.div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   SCREEN 1 — Landing Setup
════════════════════════════════════════════════ */
function LandingScreen({
  mode, onModeChange, onStart,
}: {
  mode: Mode; onModeChange:(m:Mode)=>void; onStart:()=>void;
}) {
  const [selected, setSelected] = useState<string[]>(["t1","t2","t3"]);
  const toggle = (id:string) =>
    setSelected(p => p.includes(id) ? p.filter(x=>x!==id) : [...p,id]);

  return (
    <motion.div
      initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
      exit={{ opacity:0, y:-8 }}
      style={{ display:"flex", flexDirection:"column", alignItems:"center", fontFamily:F, padding:"20px 0 40px" }}
    >
      {/* ─ Studio pill tag ─ */}
      <motion.div
        initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}
        style={{
          display:"inline-flex", alignItems:"center", gap:"6px",
          padding:"5px 14px", borderRadius:"99px",
          background:OGL, border:`1px solid ${OGLT}`,
          marginBottom:"20px",
        }}
      >
        <Sparkles size={11} color={OG}/>
        <span style={{ fontSize:"0.78rem", color:OG, fontWeight:700, letterSpacing:"0.02em" }}>
          AI Interview Studio · Frontend Engineer
        </span>
      </motion.div>

      {/* ─ AI Icon ─ */}
      <motion.div
        initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }}
        transition={{ delay:0.08, type:"spring", stiffness:260, damping:22 }}
        style={{ marginBottom:"24px" }}
      >
        <div style={{ position:"relative", display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
          {/* Outer ring */}
          <div style={{
            width:"80px", height:"80px", borderRadius:"50%",
            border:"1px solid rgba(255,107,0,0.2)",
            background:"rgba(255,107,0,0.04)",
            display:"flex", alignItems:"center", justifyContent:"center",
            position:"absolute",
          }}/>
          {/* Inner orb */}
          <div style={{
            width:"60px", height:"60px", borderRadius:"50%",
            background:"radial-gradient(circle at 38% 36%, #FFAD70, #FF6B00 50%, #E05000 100%)",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 0 28px rgba(255,107,0,0.4)",
          }}>
            <Sparkles size={24} color="#fff" fill="#fff"/>
          </div>
        </div>
      </motion.div>

      {/* ─ Heading ─ */}
      <motion.div
        initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.12 }}
        style={{ textAlign:"center", marginBottom:"12px" }}
      >
        <h1 style={{
          fontWeight:900, lineHeight:1.15, letterSpacing:"-0.04em",
          fontSize:"clamp(1.8rem,3.5vw,2.4rem)",
          margin:0,
        }}>
          <span style={{ color:NAVY }}>Mock Interview: </span>
          <br/>
          <span style={{ color:OG }}>Frontend Developer</span>
        </h1>
      </motion.div>

      {/* ─ Subtitle ─ */}
      <motion.p
        initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.16 }}
        style={{
          textAlign:"center", color:T2, fontSize:"0.9rem", lineHeight:1.65,
          maxWidth:"420px", marginBottom:"24px",
        }}
      >
        Practice with your AI HR Manager. Get real-time scoring on clarity, technical depth, and confidence.
      </motion.p>

      {/* ─ Mode toggle ─ */}
      <motion.div
        initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.2 }}
        style={{ marginBottom:"20px" }}
      >
        <ModeToggle mode={mode} onChange={onModeChange}/>
      </motion.div>

      {/* ─ Topic pills (2×2 grid) ─ */}
      <motion.div
        initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.24 }}
        style={{
          display:"grid", gridTemplateColumns:"1fr 1fr",
          gap:"8px", marginBottom:"28px",
        }}
      >
        {TOPICS.map(t => {
          const active = selected.includes(t.id);
          return (
            <button key={t.id} onClick={()=>toggle(t.id)}
              style={{
                padding:"8px 18px", borderRadius:"99px",
                background: active ? OGL : CARD,
                border:`1.5px solid ${active ? OGLT : BDR}`,
                color: active ? OG : T2,
                fontFamily:F, fontWeight:600, fontSize:"0.82rem",
                cursor:"pointer", transition:"all 0.15s",
                whiteSpace:"nowrap",
              }}
              onMouseEnter={e=>{if(!active)(e.currentTarget as HTMLButtonElement).style.borderColor="#D1D5DB";}}
              onMouseLeave={e=>{if(!active)(e.currentTarget as HTMLButtonElement).style.borderColor=BDR;}}
            >
              {t.label}
            </button>
          );
        })}
      </motion.div>

      {/* ─ Start Interview CTA ─ */}
      <motion.div
        initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.28 }}
        style={{ textAlign:"center", marginBottom:"32px" }}
      >
        <motion.button
          whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
          onClick={onStart}
          style={{
            display:"inline-flex", alignItems:"center", gap:"9px",
            padding:"14px 36px", borderRadius:"99px",
            background:`linear-gradient(135deg, ${OG}, #FF8C3A)`,
            color:"#fff", border:"none", cursor:"pointer",
            fontFamily:F, fontWeight:700, fontSize:"1rem",
            boxShadow:"0 4px 20px rgba(255,107,0,0.42)",
            letterSpacing:"-0.01em",
          }}
        >
          <Mic size={17} fill="#fff" color="#fff"/>
          Start Interview
          <ChevronRight size={16} strokeWidth={2.5}/>
        </motion.button>
        <p style={{ fontSize:"0.75rem", color:T3, marginTop:"10px" }}>
          Tap the mic to speak. AI responds in real-time.
        </p>
      </motion.div>

      {/* ─ 3 Feature cards ─ */}
      <motion.div
        initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.32 }}
        style={{
          display:"grid", gridTemplateColumns:"repeat(3,1fr)",
          gap:"12px", width:"100%", maxWidth:"600px",
        }}
      >
        {[
          {
            icon: <Volume2 size={18} color={OG}/>,
            title:"Speak naturally",
            sub:"Just talk like a real interview",
          },
          {
            icon: <Star size={18} color="#8B5CF6"/>,
            title:"AI Feedback",
            sub:"Instant scoring on every answer",
          },
          {
            icon: <BookOpen size={18} color="#0EA5E9"/>,
            title:"Review later",
            sub:"Full session transcript saved",
          },
        ].map(c => (
          <motion.div key={c.title}
            whileHover={{ y:-2 }}
            style={{
              background:CARD, borderRadius:"12px",
              padding:"16px 14px",
              border:`1px solid ${BDR}`,
              boxShadow:SH,
              display:"flex", flexDirection:"column", gap:"6px",
            }}
          >
            <div style={{
              width:"34px", height:"34px", borderRadius:"9px",
              background:"#F9FAFB",
              display:"flex", alignItems:"center", justifyContent:"center",
              marginBottom:"4px",
            }}>
              {c.icon}
            </div>
            <p style={{ fontWeight:700, fontSize:"0.82rem", color:T1, fontFamily:F }}>{c.title}</p>
            <p style={{ fontSize:"0.72rem", color:T3, lineHeight:1.5, fontFamily:F }}>{c.sub}</p>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════
   SCREEN 2 — Active Session
════════════════════════════════════════════════ */
function ActiveSession({
  mode, onModeChange, onEnd,
}: {
  mode: Mode; onModeChange:(m:Mode)=>void; onEnd:()=>void;
}) {
  const [phase,    setPhase]   = useState<Phase>("ai-speaking");
  const [elapsed,  setElapsed] = useState(0);
  const [qIdx,     setQIdx]    = useState(0);
  const [muted,    setMuted]   = useState(false);
  const [typedQ,   setTypedQ]  = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const phaseRef = useRef<Phase>("ai-speaking");

  /* Sync ref */
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  /* Elapsed timer */
  useEffect(() => {
    const id = setInterval(() => setElapsed(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  /* AI "speaks" question then hands to user */
  useEffect(() => {
    if (phase !== "ai-speaking") return;
    const q = QUESTIONS[qIdx];
    setTypedQ("");
    let i = 0;
    const id = setInterval(() => {
      if (i <= q.length) setTypedQ(q.slice(0, ++i));
      else { clearInterval(id); timerRef.current = setTimeout(() => setPhase("user-turn"), 1000); }
    }, 28);
    return () => { clearInterval(id); clearTimeout(timerRef.current); };
  }, [phase, qIdx]);

  /* Mic tap */
  const handleMic = () => {
    if (phase === "user-turn") {
      setPhase("user-speaking");
    } else if (phase === "user-speaking") {
      setPhase("ai-speaking");
      const next = qIdx + 1;
      if (next < QUESTIONS.length) setQIdx(next);
    }
  };

  const fmt = (s:number) =>
    `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  const micLabel = phase === "user-speaking"
    ? "TAP TO STOP RECORDING"
    : "TAP TO SPEAK YOUR ANSWER";

  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }}
      exit={{ opacity:0 }}
      style={{
        display:"flex", flexDirection:"column", alignItems:"center",
        fontFamily:F, minHeight:"calc(100vh - 180px)",
        position:"relative",
      }}
    >
      {/* ── Top status bar ── */}
      <div style={{
        width:"100%", display:"grid",
        gridTemplateColumns:"1fr auto 1fr",
        alignItems:"center",
        marginBottom:"32px",
      }}>
        {/* Left placeholder */}
        <div/>

        {/* Center: mode toggle */}
        <ModeToggle mode={mode} onChange={onModeChange}/>

        {/* Right: timer + REC */}
        <div style={{ display:"flex", alignItems:"center", gap:"10px", justifyContent:"flex-end" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"5px", color:T2 }}>
            <Clock size={13} color={T3}/>
            <span style={{
              fontSize:"0.8rem", fontWeight:700, color:T2, fontFamily:F,
              fontVariantNumeric:"tabular-nums", letterSpacing:"0.03em",
            }}>
              {fmt(elapsed)}
            </span>
          </div>
          {/* REC pill */}
          <motion.div
            animate={{ opacity:[1, 0.5, 1] }}
            transition={{ duration:1.4, repeat:Infinity }}
            style={{
              display:"flex", alignItems:"center", gap:"5px",
              padding:"4px 10px", borderRadius:"99px",
              background:"#FEF2F2", border:"1px solid #FECACA",
            }}
          >
            <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:"#EF4444" }}/>
            <span style={{ fontSize:"0.7rem", fontWeight:800, color:"#EF4444", letterSpacing:"0.06em" }}>
              REC
            </span>
          </motion.div>
        </div>
      </div>

      {/* ── Waveform ── */}
      <motion.div
        initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
        style={{ marginBottom:"4px" }}
      >
        <Waveform active={phase === "ai-speaking" || phase === "user-speaking"}/>
      </motion.div>

      {/* ── AI Orb ── */}
      <motion.div
        initial={{ opacity:0, scale:0.85 }} animate={{ opacity:1, scale:1 }}
        transition={{ delay:0.15, type:"spring", stiffness:240, damping:22 }}
        style={{ marginBottom:"12px" }}
      >
        <AIOrb phase={phase} size={88}/>
      </motion.div>

      {/* ── Question card ── */}
      <motion.div
        initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
        transition={{ delay:0.2 }}
        style={{
          background:CARD, borderRadius:"14px",
          padding:"20px 28px",
          boxShadow:SHM,
          maxWidth:"460px", width:"100%",
          textAlign:"center",
          marginBottom:"auto",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.p key={qIdx}
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{
              fontSize:"0.95rem", color:T1, lineHeight:1.75,
              fontStyle:"italic", fontFamily:F,
            }}
          >
            "{typedQ}
            {phase === "ai-speaking" && (
              <motion.span
                animate={{ opacity:[1,0,1] }}
                transition={{ duration:0.65, repeat:Infinity }}
                style={{ color:OG, marginLeft:"1px", fontWeight:700 }}
              >|</motion.span>
            )}
            {phase !== "ai-speaking" && typedQ === QUESTIONS[qIdx] && '"'}
          </motion.p>
        </AnimatePresence>
      </motion.div>

      {/* ── Controls ── */}
      <div style={{
        display:"flex", flexDirection:"column", alignItems:"center",
        gap:"14px", paddingTop:"36px", paddingBottom:"16px",
      }}>
        {/* Buttons row */}
        <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
          {/* Mute button */}
          <motion.button
            whileHover={{ scale:1.08 }} whileTap={{ scale:0.92 }}
            onClick={()=>setMuted(v=>!v)}
            style={{
              width:"46px", height:"46px", borderRadius:"50%",
              background: muted ? OGL : "rgba(255,107,0,0.08)",
              border: muted ? `1.5px solid ${OGLT}` : "1.5px solid rgba(255,107,0,0.18)",
              display:"flex", alignItems:"center", justifyContent:"center",
              cursor:"pointer",
            }}
          >
            <MicOff size={18} color={OG} strokeWidth={muted ? 2.5 : 2}/>
          </motion.button>

          {/* Main mic button */}
          <div style={{ position:"relative" }}>
            {/* Pulse ring when recording */}
            {phase === "user-speaking" && [1,2].map(i => (
              <motion.div key={i}
                style={{
                  position:"absolute", inset:`${-(i*10+4)}px`, borderRadius:"50%",
                  border:`1px solid rgba(255,107,0,${0.3 - i*0.08})`,
                  pointerEvents:"none",
                }}
                animate={{ scale:[1, 1.2+i*0.05, 1], opacity:[0.7, 0, 0.7] }}
                transition={{ duration:1.4+i*0.2, repeat:Infinity, ease:"easeInOut", delay:i*0.15 }}
              />
            ))}

            {/* Idle ring (user-turn) */}
            {phase === "user-turn" && (
              <motion.div
                style={{ position:"absolute", inset:"-10px", borderRadius:"50%", border:`1.5px solid rgba(255,107,0,0.28)`, pointerEvents:"none" }}
                animate={{ scale:[1, 1.15, 1], opacity:[0.5, 0, 0.5] }}
                transition={{ duration:2, repeat:Infinity }}
              />
            )}

            <motion.button
              whileHover={{ scale:1.06 }} whileTap={{ scale:0.91 }}
              onClick={handleMic}
              disabled={phase === "ai-speaking"}
              style={{
                width:"66px", height:"66px", borderRadius:"50%",
                background: phase === "user-speaking"
                  ? "#E55000"
                  : phase === "user-turn"
                  ? OG
                  : "rgba(255,107,0,0.25)",
                border:"none", cursor: phase === "ai-speaking" ? "default" : "pointer",
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow: phase !== "ai-speaking"
                  ? "0 6px 24px rgba(255,107,0,0.45)"
                  : "none",
                transition:"all 0.2s ease",
              }}
            >
              <Mic
                size={26}
                color={phase === "ai-speaking" ? OG : "#fff"}
                fill={phase === "user-speaking" ? "#fff" : "none"}
                strokeWidth={2}
              />
            </motion.button>
          </div>
        </div>

        {/* Label */}
        <AnimatePresence mode="wait">
          <motion.p key={phase}
            initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            style={{
              fontSize:"0.67rem", fontWeight:700, letterSpacing:"0.12em",
              textTransform:"uppercase", color:T3, fontFamily:F,
            }}
          >
            {micLabel}
          </motion.p>
        </AnimatePresence>

        {/* End session link */}
        <button onClick={onEnd}
          style={{
            background:"none", border:"none", cursor:"pointer",
            fontSize:"0.72rem", color:T3, fontFamily:F,
            textDecoration:"underline", marginTop:"4px",
          }}
        >
          End session
        </button>
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════
   MAIN EXPORT
════════════════════════════════════════════════ */
export default function MockInterview() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [mode,   setMode]   = useState<Mode>("voice");

  return (
    <div style={{
      background: CARD,
      borderRadius:"16px",
      minHeight:"calc(100vh - 180px)",
      padding:"32px 28px",
      border:`1px solid ${BDR}`,
      boxShadow:SH,
      fontFamily:F,
      display:"flex",
      flexDirection:"column",
      alignItems:"center",
    }}>
      <AnimatePresence mode="wait">
        {screen === "landing" ? (
          <LandingScreen
            key="landing"
            mode={mode}
            onModeChange={setMode}
            onStart={() => setScreen("active")}
          />
        ) : (
          <ActiveSession
            key="active"
            mode={mode}
            onModeChange={setMode}
            onEnd={() => setScreen("landing")}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import {
  Check, Lock, ExternalLink, Clock, Star,
  Sparkles, ChevronRight, ArrowRight, BookOpen,
  Play, Zap, Target, Trophy, RotateCcw, X,
  FlaskConical, Award,
} from "lucide-react";

/* ─── Design Tokens ─── */
const F    = "'Plus Jakarta Sans', Inter, sans-serif";
const BG   = "#F9FAFB";
const CARD = "#FFFFFF";
const T1   = "#1F2937";
const T2   = "#6B7280";
const T3   = "#9CA3AF";
const OG   = "#FF6B00";
const OGL  = "#FFF7ED";
const OGLT = "#FFEDD5";
const BDR  = "#E5E7EB";
const SH   = "0 1px 3px rgba(0,0,0,0.03), 0 6px 20px rgba(0,0,0,0.05)";
const SHM  = "0 4px 16px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)";
const SHL  = "0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.05)";

/* ─── Path geometry ─── */
const PW = 480;   // path container width
const TH = 1840;  // total path height
const XL = 108, XC = 240, XR = 372; // node centre-x positions

/* ─── Types ─── */
type NS = "completed" | "active" | "locked";
interface Skill {
  id: string; title: string; sub: string;
  phase: number; status: NS; icon: string;
  xp: number; est: string; desc: string; skills: string[];
  res: { title: string; type: "Video"|"Article"|"Course"|"Practice"; source: string; dur: string; };
  tip: string;
  cx: number; cy: number;
}

/* ─── Node Data ─── */
const NODES: Skill[] = [
  { id:"n1",  title:"HTML & CSS",             sub:"Web foundations",      phase:1, status:"completed", icon:"🏗️", xp:200,  est:"1 week",    cx:XC, cy:140,
    desc:"Semantic HTML5, modern CSS3, Flexbox, Grid, and responsive design principles.",
    skills:["Semantic HTML","CSS Flexbox","CSS Grid","Responsive Design"],
    res:{ title:"The Odin Project — Foundations", type:"Course", source:"theodinproject.com", dur:"2 weeks" },
    tip:"Rebuild 3 real websites pixel-for-pixel to build muscle memory." },

  { id:"n2",  title:"JavaScript ES6+",        sub:"Core language",        phase:1, status:"completed", icon:"⚡", xp:400,  est:"2 weeks",   cx:XR, cy:290,
    desc:"Closures, async/await, destructuring, modules and the JavaScript event loop.",
    skills:["Arrow Functions","Async/Await","Destructuring","ES Modules"],
    res:{ title:"Modern JavaScript Tutorial", type:"Article", source:"javascript.info", dur:"15 hours" },
    tip:"Master the event loop — the most common frontend interview topic." },

  { id:"n3",  title:"Git & Version Control",  sub:"Collaboration",        phase:1, status:"completed", icon:"🌿", xp:150,  est:"3 days",    cx:XC, cy:440,
    desc:"Git workflows, branching, pull requests, merge conflicts and GitHub collaboration.",
    skills:["Git Branching","Pull Requests","Merge Conflicts","GitHub Flow"],
    res:{ title:"Learn Git Branching (Interactive)", type:"Practice", source:"learngitbranching.js.org", dur:"4 hours" },
    tip:"Commit early, commit often — and always write descriptive commit messages." },

  { id:"n4",  title:"React Fundamentals",     sub:"Component thinking",   phase:2, status:"completed", icon:"⚛️", xp:500,  est:"2 weeks",   cx:XL, cy:630,
    desc:"JSX, components, props, state, event handling and the React mental model.",
    skills:["JSX","Components","Props & State","Event Handling"],
    res:{ title:"React Official Tutorial", type:"Article", source:"react.dev", dur:"8 hours" },
    tip:"Build a Todo App, then rebuild it from scratch. Repetition is key." },

  { id:"n5",  title:"React Hooks & State",    sub:"Your current module ✦",phase:2, status:"active",    icon:"🎣", xp:600,  est:"2 weeks",   cx:XC, cy:780,
    desc:"Master the full Hooks API: useState, useEffect, useRef, useCallback, useMemo and custom hooks.",
    skills:["useState","useEffect","useRef","Custom Hooks","Context API"],
    res:{ title:"React Hooks In Depth — Jack Herrington", type:"Video", source:"YouTube", dur:"4 hours" },
    tip:"Every custom hook should solve exactly one problem — keep them small." },

  { id:"n6",  title:"Component Patterns",     sub:"Advanced React design", phase:2, status:"locked",    icon:"🧩", xp:550,  est:"1.5 weeks", cx:XR, cy:930,
    desc:"Compound components, render props, HOC pattern and modern composition strategies.",
    skills:["Compound Components","Render Props","HOC","Slot Pattern"],
    res:{ title:"Epic React — Advanced Patterns", type:"Course", source:"Kent C. Dodds", dur:"6 hours" },
    tip:"Study open-source UI libraries like Radix UI — they use all these patterns." },

  { id:"n7",  title:"TypeScript",             sub:"Type-safe React",      phase:3, status:"locked",    icon:"📘", xp:600,  est:"2 weeks",   cx:XC, cy:1120,
    desc:"Static typing, interfaces, generics, discriminated unions and TypeScript with React.",
    skills:["Interfaces","Generics","Union Types","TS + React"],
    res:{ title:"TypeScript Deep Dive (Free Book)", type:"Article", source:"basarat.gitbook.io", dur:"15 hours" },
    tip:"Always enable 'strict' mode from day one — no shortcuts." },

  { id:"n8",  title:"State Management",       sub:"Scale your app",       phase:3, status:"locked",    icon:"🗃️", xp:550,  est:"1.5 weeks", cx:XL, cy:1270,
    desc:"Redux Toolkit and Zustand for complex application-level state management.",
    skills:["Redux Toolkit","Zustand","Async Thunks","State Architecture"],
    res:{ title:"Redux Toolkit Official Tutorial", type:"Article", source:"redux.js.org", dur:"5 hours" },
    tip:"Prefer Zustand for new projects — simpler API and better developer experience." },

  { id:"n9",  title:"APIs & React Query",     sub:"Server state mastery", phase:3, status:"locked",    icon:"🔌", xp:600,  est:"2 weeks",   cx:XR, cy:1420,
    desc:"REST APIs, React Query for server state caching, loading states and optimistic updates.",
    skills:["Fetch / Axios","React Query","Error Boundaries","Optimistic UI"],
    res:{ title:"Practical React Query — TkDodo's Blog", type:"Article", source:"tkdodo.eu", dur:"3 hours" },
    tip:"Never store server state in Redux — React Query handles it perfectly." },

  { id:"n10", title:"Frontend System Design", sub:"Senior dev thinking",  phase:4, status:"locked",    icon:"🏛️", xp:700,  est:"3 weeks",   cx:XC, cy:1590,
    desc:"Performance, accessibility, code splitting, bundle optimization and architecture patterns.",
    skills:["Core Web Vitals","Accessibility","Code Splitting","Architecture"],
    res:{ title:"Frontend System Design Interview", type:"Course", source:"GreatFrontEnd", dur:"10 hours" },
    tip:"Document your architectural decisions — interviewers reward thoughtfulness." },

  { id:"n11", title:"AI Portfolio Project",   sub:"★ Final Boss",         phase:4, status:"locked",    icon:"🏆", xp:1000, est:"3 weeks",   cx:XC, cy:1730,
    desc:"Build and deploy a full-stack AI-powered project to showcase every skill you've gained.",
    skills:["Full-Stack React","AI Integration","CI/CD","Portfolio Ready"],
    res:{ title:"Build & Deploy a Full-Stack AI SaaS", type:"Course", source:"JS Mastery", dur:"20 hours" },
    tip:"★ Complete this node to unlock your first real mock interview session!" },
];

/* ─── Phase Banners ─── */
const BANNERS = [
  { phase:1, label:"Phase 1", title:"Foundation",        emoji:"🌱", color:"#059669", bg:"#ECFDF5", brd:"#A7F3D0", y:20,   pct:100 },
  { phase:2, label:"Phase 2", title:"Core React",        emoji:"⚛️", color:OG,        bg:OGL,       brd:OGLT,      y:530,  pct:67  },
  { phase:3, label:"Phase 3", title:"Advanced Frontend", emoji:"🚀", color:"#7C3AED", bg:"#F5F3FF", brd:"#DDD6FE", y:1020, pct:0   },
  { phase:4, label:"Phase 4", title:"Career Ready",      emoji:"🎯", color:"#D97706", bg:"#FFFBEB", brd:"#FDE68A", y:1490, pct:0   },
];

/* Phase meta */
const PHASE_META: Record<number, { color:string; bg:string }> = {
  1:{ color:"#059669", bg:"#ECFDF5" },
  2:{ color:OG,        bg:OGL       },
  3:{ color:"#7C3AED", bg:"#F5F3FF" },
  4:{ color:"#D97706", bg:"#FFFBEB" },
};

const RES_COLORS: Record<string,string> = {
  Video:"#EF4444", Article:"#0EA5E9", Course:"#7C3AED", Practice:"#059669",
};

/* ─── Bezier path between two nodes ─── */
function segPath(n1: Skill, n2: Skill): string {
  const mx = (n1.cy + n2.cy) / 2;
  return `M ${n1.cx} ${n1.cy} C ${n1.cx} ${mx} ${n2.cx} ${mx} ${n2.cx} ${n2.cy}`;
}

/* ══════════════════════════════════
   CHAPTER COMPLETE CARD
══════════════════════════════════ */
function ChapterCompleteCard({ node }: { node: Skill }) {
  const [testStarted, setTestStarted] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        borderRadius: 16, overflow: "hidden",
        border: "1.5px solid rgba(5,150,105,0.22)",
        boxShadow: "0 4px 6px rgba(0,0,0,0.03), 0 16px 40px rgba(5,150,105,0.10)",
        marginBottom: 14,
      }}
    >
      {/* ── Green gradient top banner ── */}
      <div style={{
        padding: "20px 20px 18px",
        background: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 60%, #A7F3D0 100%)",
        borderBottom: "1px solid rgba(5,150,105,0.15)",
      }}>
        {/* Confetti emoji row */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 12, fontSize: "1.4rem" }}>
          {"🎉 🏆 ✨".split(" ").map((e, i) => (
            <motion.span
              key={i}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
            >{e}</motion.span>
          ))}
        </div>

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <p style={{
            fontFamily: F, fontWeight: 900, fontSize: "1.05rem",
            color: "#065F46", letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 5,
          }}>
            Chapter Complete!
          </p>
          <p style={{ fontFamily: F, fontSize: "0.80rem", color: "#059669", fontWeight: 500 }}>
            You've mastered <strong>{node.title}</strong> 🚀
          </p>
        </div>

        {/* XP earned pill */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 14,
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "7px 18px", borderRadius: 99,
            background: "rgba(5,150,105,0.14)", border: "1.5px solid rgba(5,150,105,0.28)",
          }}>
            <Star size={14} color="#059669" fill="#059669"/>
            <span style={{ fontFamily: F, fontWeight: 800, fontSize: "0.9rem", color: "#059669" }}>
              +{node.xp} XP Earned
            </span>
          </div>
        </div>

        {/* Skills mastered */}
        <div>
          <p style={{
            fontFamily: F, fontSize: "0.62rem", fontWeight: 700, color: "#059669",
            letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 9, textAlign: "center",
          }}>
            Skills You Mastered
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
            {node.skills.map((skill, i) => (
              <motion.div
                key={skill}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.07, duration: 0.25 }}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "5px 12px", borderRadius: 99,
                  background: "#FFFFFF", border: "1.5px solid rgba(5,150,105,0.28)",
                  boxShadow: "0 1px 4px rgba(5,150,105,0.10)",
                }}
              >
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#059669", flexShrink: 0 }}/>
                <span style={{ fontFamily: F, fontSize: "0.75rem", fontWeight: 700, color: "#065F46" }}>
                  {skill}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Call to action bottom ── */}
      <div style={{
        padding: "18px 20px",
        background: CARD,
      }}>
        {/* Description text */}
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 9, marginBottom: 16,
          padding: "10px 13px", borderRadius: 10,
          background: "#FFFBEB", border: "1px solid #FDE68A",
        }}>
          <Award size={15} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }}/>
          <p style={{ fontFamily: F, fontSize: "0.76rem", color: "#92400E", lineHeight: 1.6 }}>
            <strong>Ready for the next level?</strong> Take a practice test to validate your skills and unlock the next chapter on your roadmap.
          </p>
        </div>

        {/* CTA Button */}
        <motion.button
          whileHover={!testStarted ? { scale: 1.025 } : {}}
          whileTap={!testStarted ? { scale: 0.975 } : {}}
          onClick={() => setTestStarted(true)}
          style={{
            width: "100%", padding: "15px 18px", borderRadius: 12,
            border: "none", cursor: testStarted ? "default" : "pointer",
            background: testStarted
              ? "linear-gradient(135deg, #059669, #047857)"
              : `linear-gradient(135deg, ${OG} 0%, #FF8C3A 100%)`,
            color: "#fff",
            fontFamily: F, fontWeight: 800, fontSize: "0.92rem",
            letterSpacing: "-0.02em",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            boxShadow: testStarted
              ? "0 4px 18px rgba(5,150,105,0.40)"
              : "0 6px 24px rgba(255,107,0,0.45), 0 2px 8px rgba(255,107,0,0.25)",
            transition: "all 0.3s ease",
            position: "relative", overflow: "hidden",
          }}
        >
          {/* Shimmer overlay */}
          {!testStarted && (
            <motion.div
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
              style={{
                position: "absolute", top: 0, bottom: 0, left: 0, width: "50%",
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
                pointerEvents: "none",
              }}
            />
          )}
          {testStarted ? (
            <>
              <Check size={17} strokeWidth={3}/> Practice Test Started!
            </>
          ) : (
            <>
              <FlaskConical size={17}/>
              Take Practice Test to Unlock Next Level
              <ArrowRight size={16}/>
            </>
          )}
        </motion.button>

        {/* Sub-text */}
        {!testStarted && (
          <p style={{
            fontFamily: F, fontSize: "0.66rem", color: T3,
            textAlign: "center", marginTop: 9, lineHeight: 1.5,
          }}>
            ⏱ ~15 min · 10 questions · Adaptive difficulty
          </p>
        )}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════
   PHASE BANNER
══════════════════════════════════ */
function PhaseBanner({ b }: { b: typeof BANNERS[0] }) {
  return (
    <div style={{
      position:"absolute", left:0, right:0, top:b.y, height:"68px",
      background:b.bg, border:`1px solid ${b.brd}`,
      borderRadius:"14px",
      display:"flex", alignItems:"center", padding:"0 18px", gap:"12px",
      zIndex:10,
    }}>
      <span style={{ fontSize:"20px", flexShrink:0 }}>{b.emoji}</span>
      <div style={{ flex:1 }}>
        <p style={{ fontSize:"9px", color:b.color, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.12em" }}>
          {b.label}
        </p>
        <p style={{ fontSize:"0.88rem", fontWeight:700, color:T1, fontFamily:F }}>{b.title}</p>
      </div>
      <div style={{ flexShrink:0, textAlign:"right" }}>
        <p style={{ fontSize:"0.8rem", fontWeight:800, color:b.color, fontFamily:F }}>{b.pct}%</p>
        <p style={{ fontSize:"9px", color:T3, fontFamily:F }}>complete</p>
      </div>
      {/* Progress pip row */}
      <div style={{ display:"flex", gap:"3px", flexShrink:0 }}>
        {Array.from({length: b.pct > 0 ? 3 : 3}, (_, i) => (
          <div key={i} style={{
            width:"5px", height:"5px", borderRadius:"50%",
            background: (i+1)*34 <= b.pct ? b.color : `${b.color}30`,
          }}/>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   PATH NODE BUTTON
══════════════════════════════════ */
function PathNode({
  node, selected, onClick,
}: { node: Skill; selected: boolean; onClick: () => void }) {
  const isDone   = node.status === "completed";
  const isActive = node.status === "active";
  const isLocked = node.status === "locked";
  const isBoss   = node.id === "n11";

  const SIZE = isActive ? 88 : isBoss ? 80 : 72;
  const R = SIZE / 2;

  return (
    <div style={{
      position:"absolute",
      left: node.cx - R,
      top:  node.cy - R,
      width: SIZE, height: SIZE,
      zIndex: 20,
    }}>
      {/* ── Pulse rings (active only) ── */}
      {isActive && [0,1,2].map(i => (
        <motion.div key={i} style={{
          position:"absolute",
          inset: -(10 + i * 11),
          borderRadius:"50%",
          border: `${1.8 - i*0.3}px solid rgba(255,107,0,${0.45 - i*0.12})`,
          pointerEvents:"none",
        }}
        animate={{ scale:[1, 1.18+i*0.08, 1], opacity:[0.75, 0, 0.75] }}
        transition={{ duration:2.2, repeat:Infinity, ease:"easeInOut", delay:i*0.28 }}/>
      ))}

      {/* ── Selection ring ── */}
      {selected && (
        <motion.div
          initial={{ opacity:0, scale:1.2 }} animate={{ opacity:1, scale:1 }}
          style={{
            position:"absolute", inset:"-5px", borderRadius:"50%",
            border:"2.5px solid #1F2937", pointerEvents:"none",
            boxShadow:"0 0 0 4px rgba(31,41,55,0.08)",
          }}/>
      )}

      {/* ── Main circle ── */}
      <motion.button
        onClick={onClick}
        whileHover={!isLocked ? { scale:1.1 } : { scale:1.03 }}
        whileTap={!isLocked ? { scale:0.92 } : {}}
        style={{
          width:SIZE, height:SIZE, borderRadius:"50%",
          background: isDone || isActive
            ? OG
            : isBoss ? "linear-gradient(135deg, #F59E0B, #D97706)"
            : "#F3F4F6",
          border: isDone || isActive
            ? "none"
            : `2px solid ${isLocked ? "#E5E7EB" : OG}`,
          boxShadow: isDone
            ? "0 4px 16px rgba(255,107,0,0.38)"
            : isActive
            ? "0 6px 28px rgba(255,107,0,0.52), 0 0 0 4px rgba(255,107,0,0.1)"
            : "none",
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", gap:"2px",
          cursor: isLocked ? "pointer" : "pointer",
          outline:"none", position:"relative",
          transition:"box-shadow 0.2s, background 0.2s",
        }}
      >
        {isDone  && <Check size={isBoss?26:22} color="#fff" strokeWidth={3}/>}
        {isActive && (
          <>
            <span style={{ fontSize:"22px", lineHeight:1 }}>{node.icon}</span>
          </>
        )}
        {isLocked && (
          isBoss
            ? <span style={{ fontSize:"24px" }}>🏆</span>
            : <Lock size={17} color="#9CA3AF" strokeWidth={2}/>
        )}
      </motion.button>

      {/* ── "Continue Here!" badge (active) ── */}
      {isActive && (
        <motion.div
          animate={{ y:[0,-5,0] }}
          transition={{ duration:2, repeat:Infinity, ease:"easeInOut" }}
          style={{
            position:"absolute", bottom: SIZE + 10,
            left:"50%", transform:"translateX(-50%)",
            background:OG, color:"#fff",
            borderRadius:"99px", padding:"5px 14px",
            fontSize:"11px", fontWeight:800, fontFamily:F,
            whiteSpace:"nowrap", zIndex:30,
            boxShadow:"0 4px 14px rgba(255,107,0,0.45)",
          }}>
          🚀 Continue Here!
          <div style={{
            position:"absolute", bottom:"-5px", left:"50%",
            transform:"translateX(-50%) rotate(45deg)",
            width:"8px", height:"8px", background:OG,
          }}/>
        </motion.div>
      )}

      {/* ── XP pill (completed + active) ── */}
      {(isDone || isActive) && (
        <div style={{
          position:"absolute", top:"-9px", right:"-18px",
          background: isDone ? "#ECFDF5" : OGL,
          border:`1px solid ${isDone?"#A7F3D0":OGLT}`,
          borderRadius:"99px", padding:"2px 8px",
          fontSize:"9px", color: isDone?"#059669":OG,
          fontWeight:800, fontFamily:F, whiteSpace:"nowrap",
        }}>
          +{node.xp} XP
        </div>
      )}

      {/* ── Node label (below circle) ── */}
      <div style={{
        position:"absolute", top: SIZE + 8,
        left:"50%", transform:"translateX(-50%)",
        textAlign:"center", width:"130px",
        pointerEvents:"none",
      }}>
        <p style={{
          fontSize:"0.78rem", fontWeight: isActive?700:selected?600:500,
          color: isLocked && !isBoss ? T3 : T1, fontFamily:F,
          lineHeight:1.3,
        }}>
          {node.title}
        </p>
        {(isDone || isActive) && (
          <p style={{ fontSize:"0.66rem", color:isActive?OG:T3, fontFamily:F, marginTop:"1px" }}>
            {node.sub}
          </p>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   OVERVIEW PANEL (no selection)
══════════════════════════════════ */
function OverviewPanel({ onSelect, onContinue }: { onSelect: (id:string) => void; onContinue: (id:string) => void }) {
  const completedCount = NODES.filter(n=>n.status==="completed").length;
  const totalXP = NODES.filter(n=>n.status==="completed").reduce((a,b)=>a+b.xp,0);
  const nextNodes = NODES.filter(n => n.status !== "completed").slice(0, 3);

  return (
    <motion.div
      key="overview"
      initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
      exit={{ opacity:0, y:-8 }}
      transition={{ duration:0.3 }}
      style={{ fontFamily:F }}
    >
      {/* Hero */}
      <div style={{
        padding:"22px", borderRadius:"16px",
        background:`linear-gradient(135deg, ${OGL}, #FFFBF5)`,
        border:`1px solid ${OGLT}`, marginBottom:"16px",
        backgroundImage:"radial-gradient(ellipse 80% 60% at 100% 0%, rgba(255,107,0,0.08), transparent)",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"14px" }}>
          <div style={{
            width:"38px", height:"38px", borderRadius:"10px",
            background:OG, display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 4px 12px rgba(255,107,0,0.3)",
          }}>
            <Target size={18} color="#fff"/>
          </div>
          <div>
            <p style={{ fontSize:"0.68rem", color:OG, fontWeight:800, letterSpacing:"0.1em", textTransform:"uppercase" }}>
              Your Journey
            </p>
            <p style={{ fontWeight:700, fontSize:"0.92rem", color:T1 }}>Frontend Developer Path</p>
          </div>
        </div>
        {/* Progress */}
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"8px" }}>
          <span style={{ fontSize:"0.75rem", color:T2 }}>{completedCount} of {NODES.length} nodes</span>
          <span style={{ fontSize:"0.75rem", color:OG, fontWeight:700 }}>
            {Math.round(completedCount/NODES.length*100)}% done
          </span>
        </div>
        <div style={{ height:"7px", borderRadius:"99px", background:"rgba(255,107,0,0.12)", overflow:"hidden" }}>
          <motion.div
            initial={{ width:0 }} animate={{ width:`${completedCount/NODES.length*100}%` }}
            transition={{ duration:1.2, ease:[0.22,1,0.36,1] }}
            style={{ height:"100%", background:`linear-gradient(90deg,${OG},#FBBF24)`, borderRadius:"99px" }}/>
        </div>
      </div>

      {/* Quick stats */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"16px" }}>
        {[
          { icon:"⚡", label:"Total XP",      val:`${totalXP.toLocaleString()}`, color:"#8B5CF6" },
          { icon:"🔥", label:"Day Streak",    val:"12 days",          color:OG        },
          { icon:"✅", label:"Completed",     val:`${completedCount} skills`,     color:"#059669" },
          { icon:"🎯", label:"Next Unlock",   val:"1 skill away",     color:"#0EA5E9" },
        ].map(s => (
          <div key={s.label} style={{
            padding:"14px", borderRadius:"12px",
            background:CARD, boxShadow:SH,
            display:"flex", flexDirection:"column", gap:"5px",
          }}>
            <span style={{ fontSize:"16px" }}>{s.icon}</span>
            <p style={{ fontWeight:800, fontSize:"0.95rem", color:s.color, fontFamily:F, lineHeight:1 }}>{s.val}</p>
            <p style={{ fontSize:"0.7rem", color:T3, fontFamily:F }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Phase progress */}
      <div style={{
        background:CARD, borderRadius:"14px",
        padding:"16px", boxShadow:SH, marginBottom:"16px",
      }}>
        <p style={{ fontSize:"0.72rem", color:T3, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"12px" }}>
          Phase Progress
        </p>
        {BANNERS.map(b => (
          <div key={b.phase} style={{ marginBottom:"10px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"5px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
                <span style={{ fontSize:"13px" }}>{b.emoji}</span>
                <span style={{ fontSize:"0.78rem", fontWeight:600, color:T1, fontFamily:F }}>{b.title}</span>
              </div>
              <span style={{ fontSize:"0.72rem", fontWeight:700, color:b.color, fontFamily:F }}>{b.pct}%</span>
            </div>
            <div style={{ height:"5px", borderRadius:"99px", background:"#F3F4F6", overflow:"hidden" }}>
              <motion.div
                initial={{ width:0 }} animate={{ width:`${b.pct}%` }}
                transition={{ duration:1, ease:[0.22,1,0.36,1], delay:b.phase * 0.1 }}
                style={{ height:"100%", background:b.color, borderRadius:"99px" }}/>
            </div>
          </div>
        ))}
      </div>

      {/* Next roadmap */}
      <div style={{
        background:CARD, borderRadius:"14px",
        padding:"16px", boxShadow:SH, marginBottom:"16px",
      }}>
        <p style={{ fontSize:"0.68rem", color:T3, fontWeight:800, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"10px" }}>
          Next on Roadmap
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
          {nextNodes.map((node, idx) => (
            <button
              key={node.id}
              onClick={() => onSelect(node.id)}
              style={{
                width:"100%", textAlign:"left",
                padding:"10px 12px", borderRadius:"10px",
                border:`1px solid ${idx === 0 ? OGLT : BDR}`,
                background: idx === 0 ? OGL : "#F9FAFB",
                cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"space-between", gap:"10px",
              }}
            >
              <div style={{ display:"flex", alignItems:"center", gap:"8px", minWidth:0 }}>
                <span style={{ fontSize:"1rem" }}>{node.icon}</span>
                <div style={{ minWidth:0 }}>
                  <p style={{ fontSize:"0.80rem", fontWeight:700, color:T1, lineHeight:1.3 }}>{node.title}</p>
                  <p style={{ fontSize:"0.68rem", color:idx === 0 ? OG : T3 }}>{idx === 0 ? "Up next" : node.sub}</p>
                </div>
              </div>
              <ArrowRight size={13} color={idx === 0 ? OG : T3} />
            </button>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={() => onContinue("n5")}
        style={{
          width:"100%", padding:"13px", borderRadius:"12px",
          background:OG, color:"#fff", border:"none", cursor:"pointer",
          fontFamily:F, fontWeight:700, fontSize:"0.9rem",
          display:"flex", alignItems:"center", justifyContent:"center", gap:"7px",
          boxShadow:"0 4px 16px rgba(255,107,0,0.38)",
        }}
      >
        <Play size={15} fill="#fff"/> Continue Learning <ArrowRight size={15}/>
      </button>
    </motion.div>
  );
}

/* ══════════════════════════════════
   DETAIL PANEL
══════════════════════════════════ */
function DetailPanel({ node, onClose, onContinue }: { node: Skill; onClose?: ()=>void; onContinue: (node: Skill) => void }) {
  const isDone   = node.status === "completed";
  const isActive = node.status === "active";
  const isLocked = node.status === "locked";
  const pm = PHASE_META[node.phase];
  const rc = RES_COLORS[node.res.type];
  const isBoss = node.id === "n11";
  const currentIndex = NODES.findIndex(n => n.id === node.id);
  const nextNodes = NODES.slice(currentIndex + 1, currentIndex + 4);

  return (
    <motion.div
      key={node.id}
      initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
      exit={{ opacity:0, y:-10 }}
      transition={{ duration:0.32, ease:[0.22,1,0.36,1] }}
      style={{ fontFamily:F }}
    >
      {/* Phase pill + close */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px" }}>
        <span style={{
          fontSize:"0.7rem", padding:"4px 12px", borderRadius:"99px",
          background:pm.bg, color:pm.color, fontWeight:800,
          letterSpacing:"0.08em", textTransform:"uppercase",
        }}>
          Phase {node.phase} · {BANNERS[node.phase-1].title}
        </span>
        {onClose && (
          <button onClick={onClose} style={{
            width:"26px", height:"26px", borderRadius:"7px",
            border:`1px solid ${BDR}`, background:"transparent",
            color:T3, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <X size={12}/>
          </button>
        )}
      </div>

      {/* Icon + Title */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:"12px", marginBottom:"16px" }}>
        <div style={{
          width:"52px", height:"52px", borderRadius:"14px", flexShrink:0,
          background: isDone||isActive ? OGL : "#F3F4F6",
          border:`2px solid ${isDone||isActive ? OGLT : BDR}`,
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px",
        }}>
          {node.icon}
        </div>
        <div style={{ flex:1 }}>
          <h2 style={{
            fontWeight:800, fontSize:"1.1rem", letterSpacing:"-0.03em",
            color:T1, lineHeight:1.2, marginBottom:"3px",
          }}>
            {node.title}
          </h2>
          <p style={{ color: isActive?OG:T2, fontSize:"0.78rem", fontWeight:isActive?700:400 }}>
            {node.sub}
          </p>
        </div>
      </div>

      {/* Status badge */}
      <div style={{ marginBottom:"14px" }}>
        {isDone && (
          <div style={{ display:"flex", alignItems:"center", gap:"7px", padding:"8px 12px", borderRadius:"9px", background:"#ECFDF5", border:"1px solid #A7F3D0" }}>
            <Check size={13} color="#059669" strokeWidth={3}/>
            <span style={{ color:"#059669", fontSize:"0.8rem", fontWeight:700 }}>Completed · Well done!</span>
          </div>
        )}
        {isActive && (
          <div style={{ padding:"10px 12px", borderRadius:"9px", background:OGL, border:`1px solid ${OGLT}` }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"6px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                <Zap size={12} color={OG} fill={OG}/>
                <span style={{ color:OG, fontSize:"0.8rem", fontWeight:700 }}>In Progress — 60% done</span>
              </div>
              <span style={{ color:OG, fontSize:"0.75rem" }}>3/5 sprints</span>
            </div>
            <div style={{ height:"5px", borderRadius:"99px", background:"rgba(255,107,0,0.15)", overflow:"hidden" }}>
              <motion.div
                initial={{ width:0 }} animate={{ width:"60%" }}
                transition={{ duration:0.8 }}
                style={{ height:"100%", background:OG, borderRadius:"99px" }}/>
            </div>
          </div>
        )}
        {isLocked && (
          <div style={{ display:"flex", alignItems:"center", gap:"7px", padding:"8px 12px", borderRadius:"9px", background:"#F9FAFB", border:`1px solid ${BDR}` }}>
            <Lock size={13} color={T3}/>
            <span style={{ color:T2, fontSize:"0.8rem" }}>
              {isBoss ? "Complete all Phase 4 modules to unlock" : "Complete previous module to unlock"}
            </span>
          </div>
        )}
      </div>

      {/* Description */}
      <p style={{ color:T2, fontSize:"0.875rem", lineHeight:1.7, marginBottom:"16px" }}>
        {node.desc}
      </p>

      {/* What you'll learn */}
      <div style={{
        background:"#F9FAFB", borderRadius:"12px", padding:"14px",
        marginBottom:"14px",
      }}>
        <p style={{
          fontSize:"0.68rem", color:T3, fontWeight:800, letterSpacing:"0.1em",
          textTransform:"uppercase", marginBottom:"10px",
        }}>
          What You'll Learn
        </p>
        <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
          {node.skills.map(s => (
            <div key={s} style={{ display:"flex", alignItems:"center", gap:"4px" }}>
              <Check size={11} color={isDone?"#059669":isActive?OG:T3} strokeWidth={3}/>
              <span style={{ fontSize:"0.8rem", color:T1, fontFamily:F }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Meta pills */}
      <div style={{ display:"flex", gap:"8px", marginBottom:"16px" }}>
        <div style={{
          display:"flex", alignItems:"center", gap:"5px",
          padding:"7px 12px", borderRadius:"8px",
          background:CARD, border:`1px solid ${BDR}`, boxShadow:SH, flex:1,
        }}>
          <Clock size={13} color={T3}/>
          <div>
            <p style={{ fontSize:"9px", color:T3 }}>Time to complete</p>
            <p style={{ fontSize:"0.82rem", fontWeight:700, color:T1 }}>{node.est}</p>
          </div>
        </div>
        <div style={{
          display:"flex", alignItems:"center", gap:"5px",
          padding:"7px 12px", borderRadius:"8px",
          background:CARD, border:`1px solid ${BDR}`, boxShadow:SH, flex:1,
        }}>
          <Star size={13} color="#D97706" fill="#D97706"/>
          <div>
            <p style={{ fontSize:"9px", color:T3 }}>XP Reward</p>
            <p style={{ fontSize:"0.82rem", fontWeight:700, color:"#D97706" }}>+{node.xp} XP</p>
          </div>
        </div>
      </div>

      {/* AI Recommended Resource */}
      <div style={{
        background:CARD, borderRadius:"14px", padding:"16px",
        boxShadow:SH, border:`1px solid ${BDR}`, marginBottom:"12px",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:"5px", marginBottom:"10px" }}>
          <Sparkles size={12} color="#7C3AED"/>
          <span style={{ fontSize:"0.68rem", color:"#7C3AED", fontWeight:800, letterSpacing:"0.1em", textTransform:"uppercase" }}>
            AI Recommended
          </span>
        </div>
        <div style={{ display:"flex", alignItems:"flex-start", gap:"10px", marginBottom:"10px" }}>
          <div style={{
            width:"36px", height:"36px", borderRadius:"9px", flexShrink:0,
            background:`${rc}15`, border:`1px solid ${rc}25`,
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            {node.res.type === "Video"    && <span style={{ fontSize:"16px" }}>🎬</span>}
            {node.res.type === "Article"  && <span style={{ fontSize:"16px" }}>📖</span>}
            {node.res.type === "Course"   && <span style={{ fontSize:"16px" }}>🎓</span>}
            {node.res.type === "Practice" && <span style={{ fontSize:"16px" }}>🎮</span>}
          </div>
          <div style={{ flex:1 }}>
            <p style={{ fontWeight:700, fontSize:"0.85rem", color:T1, lineHeight:1.3, marginBottom:"3px" }}>
              {node.res.title}
            </p>
            <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
              <span style={{
                fontSize:"9px", padding:"2px 7px", borderRadius:"5px",
                background:`${rc}12`, color:rc, fontWeight:700,
              }}>
                {node.res.type}
              </span>
              <span style={{ fontSize:"0.72rem", color:T3 }}>{node.res.source}</span>
              <span style={{ fontSize:"0.72rem", color:T3 }}>·</span>
              <span style={{ fontSize:"0.72rem", color:T3 }}>{node.res.dur}</span>
            </div>
          </div>
        </div>
        <a href="#" style={{ textDecoration:"none" }}
          onClick={e => e.preventDefault()}>
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"8px 12px", borderRadius:"9px",
            background:"#F5F3FF", border:"1px solid #DDD6FE",
            cursor:"pointer", transition:"background 0.12s",
          }}
          onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.background="#EDE9FE";}}
          onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.background="#F5F3FF";}}>
            <span style={{ fontSize:"0.78rem", fontWeight:700, color:"#7C3AED" }}>Open Resource</span>
            <ExternalLink size={12} color="#7C3AED"/>
          </div>
        </a>
      </div>

      {/* AI Tip */}
      <div style={{
        display:"flex", alignItems:"flex-start", gap:"8px",
        padding:"12px", borderRadius:"12px",
        background:"#FFFBEB", border:"1px solid #FDE68A",
        marginBottom:"16px",
      }}>
        <Sparkles size={13} color="#D97706" style={{ flexShrink:0, marginTop:"1px" }}/>
        <p style={{ fontSize:"0.78rem", color:"#92400E", lineHeight:1.6 }}>
          <span style={{ fontWeight:700 }}>AI Tip: </span>{node.tip}
        </p>
      </div>

      {/* Next milestones */}
      {nextNodes.length > 0 && (
        <div style={{
          background:CARD, borderRadius:"12px", padding:"14px",
          border:`1px solid ${BDR}`, boxShadow:SH,
          marginBottom:"16px",
        }}>
          <p style={{
            fontSize:"0.68rem", color:T3, fontWeight:800, letterSpacing:"0.1em",
            textTransform:"uppercase", marginBottom:"10px",
          }}>
            Next Roadmap Steps
          </p>
          <div style={{ display:"flex", flexDirection:"column", gap:"7px" }}>
            {nextNodes.map((nextNode, idx) => (
              <div
                key={nextNode.id}
                style={{
                  padding:"9px 10px", borderRadius:"9px",
                  background: idx === 0 ? OGL : "#F9FAFB",
                  border:`1px solid ${idx === 0 ? OGLT : BDR}`,
                  display:"flex", alignItems:"center", justifyContent:"space-between", gap:"8px",
                }}
              >
                <div style={{ display:"flex", alignItems:"center", gap:"8px", minWidth:0 }}>
                  <span style={{ fontSize:"0.95rem" }}>{nextNode.icon}</span>
                  <div style={{ minWidth:0 }}>
                    <p style={{ fontSize:"0.78rem", fontWeight:700, color:T1, lineHeight:1.25 }}>{nextNode.title}</p>
                    <p style={{ fontSize:"0.66rem", color:idx === 0 ? OG : T3 }}>{idx === 0 ? "Coming next" : nextNode.est}</p>
                  </div>
                </div>
                <ChevronRight size={12} color={idx === 0 ? OG : T3}/>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Chapter Complete Card (completed nodes only) ── */}
      {isDone && <ChapterCompleteCard node={node}/>}

      {/* CTA */}
      {!isLocked ? (
        <motion.button
          whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
          onClick={() => onContinue(node)}
          style={{
            width:"100%", padding:"13px", borderRadius:"12px",
            background: isDone ? BG : OG,
            color: isDone ? OG : "#fff",
            border: isDone ? `1.5px solid ${OGLT}` : "none",
            fontFamily:F, fontWeight:700, fontSize:"0.9rem", cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center", gap:"7px",
            boxShadow: isDone ? "none" : "0 4px 16px rgba(255,107,0,0.38)",
          }}
        >
          {isDone
            ? <><RotateCcw size={14}/> Review Module</>
            : <><Play size={14} fill="#fff"/> Continue Learning <ArrowRight size={14}/></>}
        </motion.button>
      ) : (
        <div style={{
          width:"100%", padding:"13px", borderRadius:"12px",
          background:"#F3F4F6", color:T3, textAlign:"center",
          fontFamily:F, fontWeight:600, fontSize:"0.875rem",
          display:"flex", alignItems:"center", justifyContent:"center", gap:"7px",
        }}>
          <Lock size={14}/> Complete previous module to unlock
        </div>
      )}
    </motion.div>
  );
}

/* ══════════════════════════════════
   MAIN ROADMAP PAGE
══════════════════════════════════ */
export default function Roadmap() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobilePanel, setMobilePanel] = useState(false);
  const navigate = useNavigate();

  const selected = NODES.find(n => n.id === selectedId) ?? null;
  const completedCount = NODES.filter(n => n.status === "completed").length;

  const handleNodeClick = (id: string) => {
    setSelectedId(id);
    setMobilePanel(true);
  };

  const handleContinueLearning = (target: string | Skill) => {
    const node = typeof target === "string" ? NODES.find(n => n.id === target) : target;
    if (!node) return;

    navigate("/app/learning", {
      state: {
        roadmap: {
          id: node.id,
          title: node.title,
          subtitle: node.sub,
          description: node.desc,
          phase: node.phase,
          tip: node.tip,
          resource: node.res,
          est: node.est,
          xp: node.xp,
        },
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }}
      transition={{ duration:0.3 }}
      style={{
        fontFamily:F,
        display:"flex", height:"calc(100vh - 48px)",
        overflow:"hidden", gap:"0",
      }}
    >
      <style>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 99px; }
        @keyframes node-drift { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
      `}</style>

      {/* ════════════════════════════
          LEFT — Winding Path
      ════════════════════════════ */}
      <div style={{
        flex:1, overflowY:"auto", overflowX:"hidden",
        padding:"0 0 60px",
      }}>
        {/* ── Page header ── */}
        <div style={{
          position:"sticky", top:0, zIndex:30,
          background:"rgba(249,250,251,0.92)", backdropFilter:"blur(16px)",
          borderBottom:`1px solid rgba(0,0,0,0.05)`,
          padding:"12px 24px",
          display:"flex", alignItems:"center", justifyContent:"space-between",
        }}>
          <div>
            <h1 style={{ fontWeight:900, fontSize:"1.15rem", letterSpacing:"-0.03em", color:T1, lineHeight:1 }}>
              Learning Roadmap
            </h1>
            <p style={{ color:T2, fontSize:"0.78rem", marginTop:"2px" }}>
              Frontend Developer · {completedCount}/{NODES.length} complete
            </p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            {/* Streak */}
            <div style={{
              display:"flex", alignItems:"center", gap:"5px",
              padding:"5px 12px", borderRadius:"99px",
              background:OGL, border:`1px solid ${OGLT}`,
            }}>
              <span style={{ fontSize:"13px" }}>🔥</span>
              <span style={{ fontSize:"0.75rem", color:OG, fontWeight:800 }}>12-Day Streak</span>
            </div>
            {/* XP */}
            <div style={{
              display:"flex", alignItems:"center", gap:"5px",
              padding:"5px 12px", borderRadius:"99px",
              background:"#F5F3FF", border:"1px solid #DDD6FE",
            }}>
              <span style={{ fontSize:"13px" }}>⚡</span>
              <span style={{ fontSize:"0.75rem", color:"#7C3AED", fontWeight:800 }}>1,250 XP</span>
            </div>
          </div>
        </div>

        {/* ── Path canvas ── */}
        <div style={{
          display:"flex", justifyContent:"center",
          padding:"32px 16px 80px",
        }}>
          <div style={{
            position:"relative",
            width:`${PW}px`, height:`${TH}px`,
            flexShrink:0,
          }}>

            {/* ── SVG paths between nodes ── */}
            <svg
              width={PW} height={TH}
              style={{ position:"absolute", top:0, left:0, pointerEvents:"none", zIndex:1 }}
            >
              <defs>
                <filter id="pathGlow">
                  <feGaussianBlur stdDeviation="3" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>
              {NODES.map((node, i) => {
                if (i === 0) return null;
                const prev = NODES[i - 1];
                const isSolid = prev.status !== "locked";
                const isGlowing = prev.status === "active" || (prev.status === "completed" && node.status === "active");
                return (
                  <path
                    key={`seg-${i}`}
                    d={segPath(prev, node)}
                    fill="none"
                    stroke={isSolid ? OG : "#E5E7EB"}
                    strokeWidth={isSolid ? 4 : 3}
                    strokeLinecap="round"
                    strokeDasharray={isSolid ? undefined : "9 7"}
                    filter={isGlowing ? "url(#pathGlow)" : undefined}
                    opacity={isSolid ? 1 : 0.8}
                  />
                );
              })}
            </svg>

            {/* ── Phase banners ── */}
            {BANNERS.map(b => (
              <PhaseBanner key={b.phase} b={b}/>
            ))}

            {/* ── Nodes ── */}
            {NODES.map(node => (
              <PathNode
                key={node.id}
                node={node}
                selected={selectedId === node.id}
                onClick={() => handleNodeClick(node.id)}
              />
            ))}

            {/* ── "Click a node" hint ── */}
            {!selectedId && (
              <motion.div
                initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1.2 }}
                style={{
                  position:"absolute", bottom:"20px", left:"50%",
                  transform:"translateX(-50%)",
                  display:"flex", alignItems:"center", gap:"6px",
                  padding:"7px 16px", borderRadius:"99px",
                  background:CARD, border:`1px solid ${BDR}`,
                  boxShadow:SH, whiteSpace:"nowrap",
                  color:T3, fontSize:"0.78rem", fontFamily:F,
                  pointerEvents:"none",
                }}
              >
                <BookOpen size={12}/> Tap any node to see details
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════
          RIGHT — Detail Panel (desktop)
      ════════════════════════════ */}
      <div
        className="hidden lg:flex"
        style={{
          width:"360px", flexShrink:0,
          flexDirection:"column",
          borderLeft:`1px solid rgba(0,0,0,0.06)`,
          background:BG,
          overflowY:"auto",
        }}
      >
        {/* Panel header */}
        <div style={{
          position:"sticky", top:0, zIndex:20,
          background:"rgba(249,250,251,0.95)", backdropFilter:"blur(16px)",
          borderBottom:`1px solid rgba(0,0,0,0.05)`,
          padding:"13px 20px",
          display:"flex", alignItems:"center", gap:"8px",
        }}>
          <div style={{
            width:"26px", height:"26px", borderRadius:"8px",
            background:OGL, display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <BookOpen size={13} color={OG}/>
          </div>
          <p style={{ fontWeight:700, fontSize:"0.875rem", color:T1 }}>
            {selected ? "Skill Details" : "Course Overview"}
          </p>
        </div>

        {/* Panel body */}
        <div style={{ padding:"20px" }}>
          <AnimatePresence mode="wait">
            {selected
              ? <DetailPanel key={selected.id} node={selected} onClose={() => setSelectedId(null)} onContinue={handleContinueLearning}/>
              : <OverviewPanel key="overview" onSelect={(id) => setSelectedId(id)} onContinue={handleContinueLearning}/>}
          </AnimatePresence>
        </div>
      </div>

      {/* ════════════════════════════
          MOBILE — Bottom Sheet
      ════════════════════════════ */}
      <AnimatePresence>
        {mobilePanel && selected && (
          <>
            <motion.div
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setMobilePanel(false)}
              className="lg:hidden"
              style={{
                position:"fixed", inset:0, zIndex:60,
                background:"rgba(0,0,0,0.3)", backdropFilter:"blur(4px)",
              }}
            />
            <motion.div
              initial={{ y:"100%" }} animate={{ y:0 }} exit={{ y:"100%" }}
              transition={{ type:"spring", stiffness:280, damping:30 }}
              className="lg:hidden"
              style={{
                position:"fixed", bottom:0, left:0, right:0, zIndex:70,
                background:BG, borderRadius:"20px 20px 0 0",
                maxHeight:"80vh", overflowY:"auto",
                padding:"20px",
                boxShadow:"0 -8px 32px rgba(0,0,0,0.12)",
              }}
            >
              {/* Handle */}
              <div style={{
                width:"36px", height:"4px", borderRadius:"99px",
                background:BDR, margin:"0 auto 16px",
              }}/>
              <DetailPanel node={selected} onClose={() => setMobilePanel(false)} onContinue={handleContinueLearning}/>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

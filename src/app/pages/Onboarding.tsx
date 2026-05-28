import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Zap, ArrowRight, ArrowLeft, Code2, Database, BarChart2,
  Layers, Palette, Server, Check, Target, Sparkles,
  AlertTriangle, BookOpen, Brain, Rocket,
} from "lucide-react";

/* ─── Design Tokens ─── */
const F    = "'Plus Jakarta Sans', Inter, sans-serif";
const BG   = "#FFFFFF";
const CARD  = "#FFFFFF";
const BG2   = "#F9FAFB";
const T1   = "#111827";
const T2   = "#6B7280";
const T3   = "#9CA3AF";
const OG   = "#FF6B00";
const OGL  = "#FFF7ED";
const OGLT = "#FFEDD5";
const BDR  = "#E5E7EB";
const NAV  = "#0F172A";

/* ─── Step Types ─── */
type StepType = "welcome" | "cards" | "cards-grid" | "commitment";

interface CardOption {
  id: string;
  label: string;
  sub?: string;
  icon: React.ReactNode;
  shortcut: string;
}

interface StepConfig {
  type: StepType;
  tag: string;
  tagEmoji?: string;
  heading: string;
  sub?: string;
  options?: CardOption[];
  multi?: boolean;
  maxSelect?: number;
}

const STEPS: StepConfig[] = [
  {
    type: "welcome",
    tag: "REGISTRATION SUCCESSFUL",
    tagEmoji: "🎉",
    heading: "Welcome! What subject are you studying?",
    sub: "Enter your course name so we can build your personalized roadmap.",
  },
  {
    type: "cards-grid",
    tag: "CAREER GOAL",
    heading: "What's your target role?",
    sub: "We'll build your entire learning path around this goal.",
    options: [
      { id: "fe",  label: "Frontend Dev",       sub: "React, TypeScript, CSS",       icon: <Code2 size={20}/>,    shortcut: "A" },
      { id: "be",  label: "Backend Dev",         sub: "Node.js, SQL, APIs",           icon: <Server size={20}/>,   shortcut: "B" },
      { id: "ds",  label: "Data Scientist",      sub: "Python, ML, Statistics",       icon: <BarChart2 size={20}/>,shortcut: "C" },
      { id: "pm",  label: "Product Manager",     sub: "Strategy, Roadmaps, Metrics",  icon: <Layers size={20}/>,   shortcut: "D" },
      { id: "ux",  label: "UI/UX Designer",      sub: "Figma, Research, Prototyping", icon: <Palette size={20}/>,  shortcut: "E" },
      { id: "de",  label: "DevOps / Cloud",      sub: "AWS, Docker, CI/CD",           icon: <Database size={20}/>, shortcut: "F" },
    ],
  },
  {
    type: "cards",
    tag: "CURRENT LEVEL",
    heading: "What's your experience level?",
    sub: "Be honest — this helps us set the right starting point.",
    options: [
      { id: "beg", label: "Complete Beginner",  sub: "Just starting from scratch",       icon: <span style={{ fontSize: "22px" }}>🌱</span>, shortcut: "A" },
      { id: "som", label: "Know the Basics",    sub: "Understand fundamentals",           icon: <span style={{ fontSize: "22px" }}>📖</span>, shortcut: "B" },
      { id: "int", label: "Intermediate",       sub: "Built a few personal projects",     icon: <span style={{ fontSize: "22px" }}>⚡</span>, shortcut: "C" },
      { id: "adv", label: "Advanced",           sub: "Ready to polish & go deep",         icon: <span style={{ fontSize: "22px" }}>🚀</span>, shortcut: "D" },
    ],
  },
  {
    type: "cards",
    tag: "TIMELINE",
    heading: "How long until your exam or deadline?",
    sub: "We'll calibrate the intensity of your sprint plan.",
    options: [
      { id: "w2",  label: "Under 2 weeks",   sub: "Hyper-intensive crunch mode",    icon: <span style={{ fontSize: "22px" }}>🔥</span>, shortcut: "A" },
      { id: "w4",  label: "2 – 4 weeks",     sub: "Focused, high-intensity sprints", icon: <span style={{ fontSize: "22px" }}>⏱️</span>, shortcut: "B" },
      { id: "m3",  label: "1 – 3 months",    sub: "Steady and balanced pace",       icon: <span style={{ fontSize: "22px" }}>📅</span>, shortcut: "C" },
      { id: "m6",  label: "Over 3 months",   sub: "Deep mastery with time to spare", icon: <span style={{ fontSize: "22px" }}>🌊</span>, shortcut: "D" },
    ],
  },
  {
    type: "cards",
    tag: "CHALLENGES",
    heading: "What's your biggest challenge?",
    sub: "Pick up to 2. We'll tackle these head-on.",
    multi: true,
    maxSelect: 2,
    options: [
      { id: "gap",  label: "Skill gaps",             sub: "Missing technical knowledge",    icon: <Brain size={20}/>,         shortcut: "A" },
      { id: "int2", label: "Interview prep",          sub: "Nervous in mock interviews",     icon: <Sparkles size={20}/>,      shortcut: "B" },
      { id: "port", label: "Portfolio / Projects",   sub: "Nothing impressive to show yet", icon: <Code2 size={20}/>,         shortcut: "C" },
      { id: "cv",   label: "Writing a strong CV",    sub: "Don't know what to highlight",   icon: <AlertTriangle size={20}/>, shortcut: "D" },
    ],
  },
  {
    type: "commitment",
    tag: "COMMITMENT",
    heading: "How much time can you study?",
    sub: "We'll plan your schedule around your availability.",
  },
];

const TOTAL = STEPS.length;

/* ════════════════════════════════════════════
   STEP 1 – Welcome & Subject Input
════════════════════════════════════════════ */
function WelcomeStep({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      style={{
        width: "100%", maxWidth: "580px",
        margin: "0 auto", padding: "0 20px",
        display: "flex", flexDirection: "column", alignItems: "center",
        textAlign: "center",
      }}
    >
      {/* Tag */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.4, type: "spring", stiffness: 200 }}
        style={{
          display: "inline-flex", alignItems: "center", gap: "7px",
          padding: "6px 16px", borderRadius: "99px", marginBottom: "28px",
          background: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)",
          border: `1.5px solid ${OGLT}`,
          boxShadow: "0 2px 12px rgba(255,107,0,0.12)",
        }}
      >
        <Sparkles size={13} color={OG} />
        <span style={{
          fontFamily: F, fontSize: "0.75rem", color: OG,
          fontWeight: 800, letterSpacing: "0.09em", textTransform: "uppercase",
        }}>
          Registration Successful 🎉
        </span>
      </motion.div>

      {/* Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        style={{
          fontFamily: F, fontWeight: 900,
          fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
          letterSpacing: "-0.04em", lineHeight: 1.12,
          color: T1, marginBottom: "12px",
        }}
      >
        Welcome!{" "}
        <span style={{ color: OG }}>What subject</span>
        <br />are you studying?
      </motion.h1>

      {/* Sub */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          fontFamily: F, fontSize: "1rem", color: T2,
          lineHeight: 1.65, marginBottom: "36px",
        }}
      >
        Enter your course name so we can personalise your AI roadmap.
      </motion.p>

      {/* Input */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.26 }}
        style={{ width: "100%", position: "relative" }}
      >
        <div style={{
          position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)",
          color: focused || value ? OG : T3,
          transition: "color 0.2s",
          pointerEvents: "none",
        }}>
          <BookOpen size={20} />
        </div>
        <input
          ref={inputRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="e.g. Data Structures, Machine Learning, React..."
          style={{
            width: "100%",
            padding: "17px 20px 17px 52px",
            borderRadius: "16px",
            border: `2px solid ${focused || value ? OG : BDR}`,
            fontFamily: F, fontSize: "1rem", color: T1,
            background: BG,
            outline: "none",
            boxShadow: focused
              ? `0 0 0 4px rgba(255,107,0,0.1), 0 4px 20px rgba(255,107,0,0.08)`
              : `0 2px 10px rgba(0,0,0,0.05)`,
            transition: "all 0.22s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
        {value && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              position: "absolute", right: "16px", top: "50%",
              transform: "translateY(-50%)",
              width: "24px", height: "24px", borderRadius: "50%",
              background: OG, display: "flex", alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Check size={13} color="#fff" strokeWidth={3} />
          </motion.div>
        )}
      </motion.div>

      {/* Hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{
          fontFamily: F, fontSize: "0.78rem", color: T3,
          marginTop: "12px",
        }}
      >
        Press <strong style={{ color: T2 }}>Enter</strong> to continue
      </motion.p>
    </motion.div>
  );
}

/* ════════════════════════════════════════════
   Card Option (shared between grid & list)
════════════════════════════════════════════ */
function OptionCard({
  opt, selected, onSelect, delay, compact = false,
}: {
  opt: CardOption;
  selected: boolean;
  onSelect: () => void;
  delay: number;
  compact?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const active = selected || hovered;

  return (
    <motion.button
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: compact ? "12px" : "14px",
        padding: compact ? "13px 16px" : "15px 18px",
        borderRadius: "14px",
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        background: selected ? OGL : CARD,
        border: `1.5px solid ${selected ? OG : hovered ? OG + "99" : BDR}`,
        boxShadow: active
          ? `0 0 0 3px rgba(255,107,0,0.09), 0 4px 18px rgba(255,107,0,0.1)`
          : `0 1px 4px rgba(0,0,0,0.04)`,
        transition: "all 0.18s cubic-bezier(0.22,1,0.36,1)",
        transform: active ? "translateY(-1px)" : "none",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {selected && (
        <motion.div
          initial={{ scaleX: 0, originX: 0 }}
          animate={{ scaleX: 1 }}
          style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(90deg, rgba(255,107,0,0.05) 0%, transparent 80%)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Shortcut badge */}
      <div style={{
        width: "26px", height: "26px", borderRadius: "7px", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: selected ? OG : hovered ? OGLT : BG2,
        border: `1px solid ${selected ? OG : BDR}`,
        color: selected ? "#fff" : hovered ? OG : T3,
        fontSize: "11px", fontWeight: 800, fontFamily: F,
        transition: "all 0.18s ease",
      }}>
        {selected ? <Check size={12} strokeWidth={3} /> : opt.shortcut}
      </div>

      {/* Icon */}
      <div style={{
        width: compact ? "34px" : "38px",
        height: compact ? "34px" : "38px",
        borderRadius: "10px", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: selected ? `rgba(255,107,0,0.12)` : hovered ? `rgba(255,107,0,0.06)` : BG2,
        color: selected || hovered ? OG : T2,
        transition: "all 0.18s ease",
      }}>
        {opt.icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: F, fontWeight: 700,
          fontSize: compact ? "0.875rem" : "0.9rem",
          color: T1, lineHeight: 1.25,
        }}>{opt.label}</p>
        {opt.sub && (
          <p style={{
            fontFamily: F, fontSize: "0.75rem",
            color: selected ? OG : T3,
            marginTop: "2px", transition: "color 0.18s",
          }}>{opt.sub}</p>
        )}
      </div>

      {/* Check on selected */}
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{
            flexShrink: 0, width: "20px", height: "20px", borderRadius: "50%",
            background: OG, display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Check size={11} color="#fff" strokeWidth={3} />
        </motion.div>
      )}
    </motion.button>
  );
}

/* ════════════════════════════════════════════
   Steps 2–5: Card-based steps
════════════════════════════════════════════ */
function CardStep({
  step, answers, onToggle,
}: {
  step: StepConfig;
  answers: string[];
  onToggle: (id: string) => void;
}) {
  const isGrid = step.type === "cards-grid";
  const isMulti = step.multi ?? false;
  const maxSelect = step.maxSelect ?? (isMulti ? 2 : 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      style={{
        width: "100%",
        maxWidth: isGrid ? "700px" : "560px",
        margin: "0 auto",
        padding: "0 20px",
      }}
    >
      {/* Tag */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          padding: "5px 13px", borderRadius: "99px", marginBottom: "18px",
          background: OGL, border: `1px solid ${OGLT}`,
        }}
      >
        <span style={{
          fontFamily: F, fontSize: "0.72rem", color: OG,
          fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase",
        }}>
          {step.tag}
        </span>
      </motion.div>

      {/* Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.09, duration: 0.44, ease: [0.22, 1, 0.36, 1] }}
        style={{
          fontFamily: F, fontWeight: 900,
          fontSize: "clamp(1.65rem, 3.2vw, 2.4rem)",
          letterSpacing: "-0.04em", lineHeight: 1.15,
          color: T1, marginBottom: "8px",
        }}
      >
        {step.heading}
      </motion.h1>

      {step.sub && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.13 }}
          style={{
            fontFamily: F, fontSize: "0.97rem", color: T2,
            lineHeight: 1.65, marginBottom: "26px",
          }}
        >
          {step.sub}
        </motion.p>
      )}

      {/* Options */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isGrid ? "repeat(2, 1fr)" : "1fr",
        gap: "9px",
      }}>
        {(step.options ?? []).map((opt, i) => (
          <OptionCard
            key={opt.id}
            opt={opt}
            selected={answers.includes(opt.id)}
            onSelect={() => {
              if (!isMulti) {
                onToggle(opt.id);
                return;
              }
              const has = answers.includes(opt.id);
              if (!has && answers.length >= maxSelect) return;
              onToggle(opt.id);
            }}
            delay={0.16 + i * 0.05}
            compact={isGrid}
          />
        ))}
      </div>

      {/* Multi-select hint */}
      {isMulti && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.48 }}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: "8px", marginTop: "14px",
          }}
        >
          {Array.from({ length: maxSelect }, (_, i) => (
            <div
              key={i}
              style={{
                width: "28px", height: "5px", borderRadius: "99px",
                background: i < answers.length ? OG : BDR,
                transition: "background 0.2s",
              }}
            />
          ))}
          <span style={{
            fontFamily: F, fontSize: "0.75rem", color: T3, marginLeft: "4px",
          }}>
            {answers.length}/{maxSelect} selected
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ════════════════════════════════════════════
   Step 6: Commitment
════════════════════════════════════════════ */
function CommitmentStep({
  days,
  hours,
  onDaysChange,
  onHoursChange,
}: {
  days: number | null;
  hours: string | null;
  onDaysChange: (d: number) => void;
  onHoursChange: (h: string) => void;
}) {
  const DAY_OPTIONS = [1, 2, 3, 4, 5, 6, 7];
  const HOUR_OPTIONS = [
    { id: "30m", label: "30 min" },
    { id: "1h",  label: "1 hour" },
    { id: "2h",  label: "2 hours" },
    { id: "2h+", label: "2h+" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      style={{
        width: "100%", maxWidth: "540px",
        margin: "0 auto", padding: "0 20px",
      }}
    >
      {/* Tag */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          padding: "5px 13px", borderRadius: "99px", marginBottom: "18px",
          background: OGL, border: `1px solid ${OGLT}`,
        }}
      >
        <span style={{
          fontFamily: F, fontSize: "0.72rem", color: OG,
          fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase",
        }}>
          Commitment
        </span>
      </motion.div>

      {/* Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.09, duration: 0.44, ease: [0.22, 1, 0.36, 1] }}
        style={{
          fontFamily: F, fontWeight: 900,
          fontSize: "clamp(1.65rem, 3.2vw, 2.4rem)",
          letterSpacing: "-0.04em", lineHeight: 1.15,
          color: T1, marginBottom: "8px",
        }}
      >
        How much time can you<br />
        <span style={{ color: OG }}>study each week?</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.13 }}
        style={{
          fontFamily: F, fontSize: "0.97rem", color: T2,
          lineHeight: 1.65, marginBottom: "36px",
        }}
      >
        We'll create a realistic study schedule around your availability.
      </motion.p>

      {/* Days/week */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        style={{ marginBottom: "32px" }}
      >
        <p style={{
          fontFamily: F, fontSize: "0.8rem", fontWeight: 700,
          color: T2, textTransform: "uppercase", letterSpacing: "0.08em",
          marginBottom: "14px",
        }}>
          Days per week
        </p>
        <div style={{
          display: "flex", gap: "10px", flexWrap: "wrap",
        }}>
          {DAY_OPTIONS.map((d, i) => {
            const sel = days === d;
            return (
              <motion.button
                key={d}
                onClick={() => onDaysChange(d)}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.22 + i * 0.04, type: "spring", stiffness: 280, damping: 18 }}
                style={{
                  width: "52px", height: "52px", borderRadius: "50%",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  background: sel ? OG : CARD,
                  border: `2px solid ${sel ? OG : BDR}`,
                  cursor: "pointer",
                  boxShadow: sel
                    ? `0 4px 16px rgba(255,107,0,0.35), 0 0 0 3px rgba(255,107,0,0.1)`
                    : `0 1px 4px rgba(0,0,0,0.06)`,
                  transition: "all 0.18s cubic-bezier(0.22,1,0.36,1)",
                  transform: sel ? "scale(1.12)" : "scale(1)",
                }}
              >
                <span style={{
                  fontFamily: F, fontWeight: 800,
                  fontSize: "1.1rem",
                  color: sel ? "#fff" : T1,
                  lineHeight: 1,
                }}>{d}</span>
                <span style={{
                  fontFamily: F, fontSize: "0.55rem",
                  color: sel ? "rgba(255,255,255,0.8)" : T3,
                  fontWeight: 600, marginTop: "1px",
                }}>
                  {d === 1 ? "day" : "days"}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Hours/day */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.34 }}
      >
        <p style={{
          fontFamily: F, fontSize: "0.8rem", fontWeight: 700,
          color: T2, textTransform: "uppercase", letterSpacing: "0.08em",
          marginBottom: "14px",
        }}>
          Hours per day
        </p>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {HOUR_OPTIONS.map((h, i) => {
            const sel = hours === h.id;
            return (
              <motion.button
                key={h.id}
                onClick={() => onHoursChange(h.id)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.38 + i * 0.06 }}
                style={{
                  padding: "11px 24px", borderRadius: "99px",
                  background: sel ? OG : CARD,
                  border: `2px solid ${sel ? OG : BDR}`,
                  cursor: "pointer",
                  fontFamily: F, fontWeight: 700,
                  fontSize: "0.88rem",
                  color: sel ? "#fff" : T1,
                  boxShadow: sel
                    ? `0 4px 16px rgba(255,107,0,0.3), 0 0 0 3px rgba(255,107,0,0.08)`
                    : `0 1px 4px rgba(0,0,0,0.05)`,
                  transition: "all 0.18s cubic-bezier(0.22,1,0.36,1)",
                  transform: sel ? "scale(1.05)" : "scale(1)",
                }}
              >
                {h.label}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Summary card */}
      {days !== null && hours !== null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{
            marginTop: "28px", padding: "16px 20px", borderRadius: "14px",
            background: OGL, border: `1.5px solid ${OGLT}`,
            display: "flex", alignItems: "center", gap: "12px",
          }}
        >
          <div style={{
            width: "38px", height: "38px", borderRadius: "10px", flexShrink: 0,
            background: OG, display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 3px 10px rgba(255,107,0,0.3)",
          }}>
            <Rocket size={18} color="#fff" />
          </div>
          <div>
            <p style={{ fontFamily: F, fontWeight: 700, fontSize: "0.88rem", color: T1 }}>
              Your weekly commitment
            </p>
            <p style={{ fontFamily: F, fontSize: "0.8rem", color: OG, fontWeight: 600, marginTop: "2px" }}>
              {days} day{days > 1 ? "s" : ""} ×{" "}
              {hours === "30m" ? "30 min" : hours === "1h" ? "1 hour" : hours === "2h" ? "2 hours" : "2+ hours"} per day
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ════════════════════════════════════════════
   Completion Screen
════════════════════════════════════════════ */
function CompletionScreen({ onFinish }: { onFinish: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        textAlign: "center", maxWidth: "500px", margin: "0 auto", padding: "0 24px",
      }}
    >
      {/* Animated check */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.1 }}
        style={{
          width: "100px", height: "100px", borderRadius: "50%",
          background: `linear-gradient(135deg, ${OG} 0%, #FF8C3A 100%)`,
          marginBottom: "28px",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 10px 40px rgba(255,107,0,0.38), 0 0 0 14px rgba(255,107,0,0.06)`,
          position: "relative",
        }}
      >
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              border: `2px solid rgba(255,107,0,${0.22 - i * 0.06})`,
            }}
            animate={{ scale: [1, 1.5 + i * 0.2, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.35 }}
          />
        ))}
        <Check size={44} color="#fff" strokeWidth={2.5} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          padding: "5px 14px", borderRadius: "99px", marginBottom: "16px",
          background: OGL, border: `1px solid ${OGLT}`,
        }}
      >
        <Sparkles size={12} color={OG} />
        <span style={{
          fontFamily: F, fontSize: "0.72rem", color: OG,
          fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em",
        }}>
          Setup Complete
        </span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        style={{
          fontFamily: F, fontWeight: 900,
          fontSize: "clamp(2rem, 4vw, 3rem)",
          letterSpacing: "-0.04em", lineHeight: 1.1, color: T1, marginBottom: "12px",
        }}
      >
        Your AI roadmap<br />
        <span style={{ color: OG }}>is ready. 🚀</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.34 }}
        style={{
          fontFamily: F, fontSize: "1rem", color: T2,
          lineHeight: 1.7, marginBottom: "32px",
        }}
      >
        Based on your answers, we've built a personalised skill roadmap,
        ATS CV template, and weekly study plan — all tailored just for you.
      </motion.p>

      {/* Perks */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{
          display: "flex", flexWrap: "wrap", gap: "8px",
          justifyContent: "center", marginBottom: "36px",
        }}
      >
        {[
          { emoji: "🎯", text: "Personalised Roadmap" },
          { emoji: "📋", text: "ATS CV Template" },
          { emoji: "🎤", text: "Mock Interview #1" },
          { emoji: "⚡", text: "Weekly Sprint Plan" },
        ].map(p => (
          <span key={p.text} style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "8px 14px", borderRadius: "99px",
            background: CARD, border: `1.5px solid ${BDR}`,
            fontFamily: F, fontSize: "0.82rem", color: T2,
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}>
            {p.emoji} {p.text}
          </span>
        ))}
      </motion.div>

      <motion.button
        onClick={onFinish}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.46 }}
        whileHover={{ scale: 1.04, boxShadow: `0 12px 36px rgba(255,107,0,0.5)` }}
        whileTap={{ scale: 0.97 }}
        style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "16px 48px", borderRadius: "14px",
          background: `linear-gradient(135deg, ${OG} 0%, #FF8C3A 100%)`,
          color: "#fff",
          fontFamily: F, fontWeight: 700, fontSize: "1.05rem",
          border: "none", cursor: "pointer",
          boxShadow: `0 6px 28px rgba(255,107,0,0.4)`,
        }}
      >
        <Zap size={18} fill="#fff" color="#fff" />
        Go to Dashboard
        <ArrowRight size={18} />
      </motion.button>
    </motion.div>
  );
}

/* ════════════════════════════════════════════
   Progress Dashes (bottom)
════════════════════════════════════════════ */
function ProgressDashes({ step }: { step: number }) {
  return (
    <div style={{
      display: "flex", gap: "6px", alignItems: "center",
    }}>
      {Array.from({ length: TOTAL }, (_, i) => {
        const done = i < step;
        const active = i === step - 1;
        return (
          <motion.div
            key={i}
            animate={{
              width: done ? (active ? "32px" : "28px") : "18px",
              background: done ? OG : BDR,
              opacity: done ? 1 : 0.5,
            }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{ height: "5px", borderRadius: "99px" }}
          />
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════
   Main Onboarding Component
════════════════════════════════════════════ */
export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0-indexed; TOTAL = done
  const isDone = step >= TOTAL;
  const currentStep = STEPS[step];

  /* Per-step answers */
  const [subject, setSubject]           = useState("");
  const [cardAnswers, setCardAnswers]   = useState<Record<number, string[]>>({});
  const [commitDays, setCommitDays]     = useState<number | null>(null);
  const [commitHours, setCommitHours]   = useState<string | null>(null);

  /* Can advance? */
  const canAdvance = (() => {
    if (isDone) return true;
    switch (currentStep.type) {
      case "welcome":     return subject.trim().length > 0;
      case "cards":
      case "cards-grid":  return (cardAnswers[step] ?? []).length > 0;
      case "commitment":  return commitDays !== null && commitHours !== null;
      default:            return false;
    }
  })();

  /* Toggle card answers */
  const toggleCard = useCallback((optId: string) => {
    const s = STEPS[step];
    const isMulti = s.multi ?? false;
    const max = s.maxSelect ?? 1;
    setCardAnswers(prev => {
      const cur = prev[step] ?? [];
      if (!isMulti) return { ...prev, [step]: [optId] };
      const has = cur.includes(optId);
      if (!has && cur.length >= max) return prev;
      return { ...prev, [step]: has ? cur.filter(x => x !== optId) : [...cur, optId] };
    });
  }, [step]);

  /* Auto-advance single-select card steps */
  useEffect(() => {
    const s = STEPS[step];
    if (!s || s.multi || s.type === "welcome" || s.type === "commitment") return;
    const sel = cardAnswers[step] ?? [];
    if (sel.length === 1) {
      const t = setTimeout(() => setStep(prev => prev + 1), 420);
      return () => clearTimeout(t);
    }
  }, [cardAnswers, step]);

  /* Keyboard navigation */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isDone) return;
      const s = STEPS[step];
      // Enter = advance
      if (e.key === "Enter" && canAdvance) { setStep(prev => prev + 1); return; }
      // Backspace = go back
      if (e.key === "Backspace" && step > 0) { setStep(prev => prev - 1); return; }
      // Shortcut keys for card steps
      if (s.type === "cards" || s.type === "cards-grid") {
        const key = e.key.toUpperCase();
        const opt = s.options?.find(o => o.shortcut === key);
        if (opt) toggleCard(opt.id);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [step, isDone, canAdvance, toggleCard]);

  const goNext = () => { if (canAdvance) setStep(prev => prev + 1); };
  const goBack = () => { if (step > 0) setStep(prev => prev - 1); };

  return (
    <div style={{
      minHeight: "100vh", background: BG, fontFamily: F,
      display: "flex", flexDirection: "column",
      position: "relative", overflowX: "hidden",
    }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${BG}; }
        ::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 99px; }
        input::placeholder { color: ${T3}; }
      `}</style>

      {/* ─── Top bar ─── */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 28px",
        background: "rgba(255,255,255,0.9)",
        backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${BDR}`,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
          <div style={{
            width: "30px", height: "30px", borderRadius: "9px",
            background: `linear-gradient(135deg, ${OG} 0%, #FF8C3A 100%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 3px 12px rgba(255,107,0,0.3)`,
          }}>
            <Zap size={14} fill="#fff" color="#fff" />
          </div>
          <span style={{
            fontWeight: 800, fontSize: "0.95rem", color: NAV,
            letterSpacing: "-0.025em",
          }}>
            SkillSprint
          </span>
        </div>

        {/* Skip */}
        {!isDone && (
          <button
            onClick={() => navigate("/app")}
            style={{
              fontFamily: F, fontSize: "0.82rem", color: T3, fontWeight: 500,
              background: "none", border: `1px solid ${BDR}`, cursor: "pointer",
              padding: "6px 14px", borderRadius: "8px",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = T1;
              (e.currentTarget as HTMLButtonElement).style.borderColor = T2;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = T3;
              (e.currentTarget as HTMLButtonElement).style.borderColor = BDR;
            }}
          >
            Skip setup →
          </button>
        )}
      </div>

      {/* ─── Main Content ─── */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        paddingTop: "96px",
        paddingBottom: isDone ? "40px" : "110px",
        minHeight: "100vh",
      }}>
        <AnimatePresence mode="wait">
          {isDone ? (
            <CompletionScreen key="done" onFinish={() => navigate("/app")} />
          ) : currentStep.type === "welcome" ? (
            <WelcomeStep
              key={`step-${step}`}
              value={subject}
              onChange={setSubject}
            />
          ) : currentStep.type === "commitment" ? (
            <CommitmentStep
              key={`step-${step}`}
              days={commitDays}
              hours={commitHours}
              onDaysChange={setCommitDays}
              onHoursChange={setCommitHours}
            />
          ) : (
            <CardStep
              key={`step-${step}`}
              step={currentStep}
              answers={cardAnswers[step] ?? []}
              onToggle={toggleCard}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ─── Bottom Bar ─── */}
      {!isDone && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(16px)",
          borderTop: `1px solid ${BDR}`,
          padding: "14px 24px",
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
        }}>
          {/* Progress dashes */}
          <ProgressDashes step={step + 1} />

          {/* Step counter */}
          <span style={{
            fontFamily: F, fontSize: "0.75rem",
            color: T3, fontWeight: 600,
            letterSpacing: "0.05em",
            position: "absolute", left: "50%", transform: "translateX(-50%)",
          }}>
            {step + 1} <span style={{ color: BDR }}>of</span> {TOTAL}
          </span>

          {/* Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
            {/* Back */}
            {step > 0 && (
              <motion.button
                onClick={goBack}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: "flex", alignItems: "center", gap: "5px",
                  padding: "10px 18px", borderRadius: "11px",
                  background: CARD, color: T2,
                  fontFamily: F, fontWeight: 600, fontSize: "0.875rem",
                  border: `1.5px solid ${BDR}`, cursor: "pointer",
                  boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
                  transition: "border-color 0.15s",
                }}
              >
                <ArrowLeft size={15} />
                Back
              </motion.button>
            )}

            {/* Next / Complete Setup */}
            <motion.button
              onClick={goNext}
              disabled={!canAdvance}
              whileHover={canAdvance ? { scale: 1.04, boxShadow: `0 8px 28px rgba(255,107,0,0.48)` } : {}}
              whileTap={canAdvance ? { scale: 0.97 } : {}}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: step === TOTAL - 1 ? "11px 28px" : "11px 24px",
                borderRadius: "11px",
                background: canAdvance
                  ? step === TOTAL - 1
                    ? `linear-gradient(135deg, ${OG} 0%, #FF8C3A 100%)`
                    : OG
                  : BDR,
                color: canAdvance ? "#fff" : T3,
                fontFamily: F, fontWeight: 700, fontSize: "0.9rem",
                border: "none", cursor: canAdvance ? "pointer" : "not-allowed",
                boxShadow: canAdvance
                  ? `0 4px 18px rgba(255,107,0,0.36)`
                  : "none",
                transition: "all 0.22s ease",
              }}
            >
              {step === TOTAL - 1 ? (
                <>
                  <Sparkles size={15} />
                  Complete Setup
                </>
              ) : (
                <>
                  Next
                  <ArrowRight size={15} />
                </>
              )}
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}

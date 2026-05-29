import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText, UploadCloud, Sparkles, CheckCircle2,
  Calendar, Tag, Info, ArrowRight, RotateCcw,
  ChevronRight, Clock, AlertCircle, ChevronDown,
} from "lucide-react";
import { Link } from "react-router";

/* ─── Match Dashboard tokens exactly ─── */
const F   = "'Inter','Plus Jakarta Sans',sans-serif";
const OG  = "#FF6B00";
const OGL = "rgba(255,107,0,0.09)";
const WH  = "#FFFFFF";
const BG  = "#F9FAFB";
const T1  = "#1F2937";
const T2  = "#6B7280";
const T3  = "#9CA3AF";
const BDR = "#E5E7EB";

/* ─── Shared card shell ─── */
const card: React.CSSProperties = {
  background: WH,
  borderRadius: 14,
  border: `1px solid ${BDR}`,
  boxShadow: "0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.05)",
  overflow: "hidden",
};

/* ─── Data ─── */
const EXAMS = [
  { name: "Quiz 1",     week: "W3", color: "#3B82F6", bg: "#EFF6FF", final: false },
  { name: "Midterm",    week: "W5", color: OG,        bg: OGL,       final: false },
  { name: "Quiz 2",     week: "W6", color: "#8B5CF6", bg: "#F5F3FF", final: false },
  { name: "Final Exam", week: "W8", color: "#DC2626", bg: "#FEF2F2", final: true  },
];

const TOPICS = [
  { n: 1, title: "Course Introduction & Overview",   week: "Week 1",   tag: "Foundation", tC: "#3B82F6", tB: "#EFF6FF" },
  { n: 2, title: "Core Data Types & Variables",      week: "Week 2",   tag: "Foundation", tC: "#3B82F6", tB: "#EFF6FF" },
  { n: 3, title: "Algorithm Basics & Complexity",    week: "Week 3",   tag: "Foundation", tC: "#3B82F6", tB: "#EFF6FF" },
  { n: 4, title: "Sorting & Searching Techniques",   week: "Week 4",   tag: "Core",       tC: OG,        tB: OGL       },
  { n: 5, title: "Graph Theory & Traversal Methods", week: "Week 5–6", tag: "Core",       tC: OG,        tB: OGL       },
];

/* ─── Subject options ─── */
const SUBJECTS = [
  "Data Structures & Algorithms (CS301)",
  "Web Development Fundamentals",
  "Software Engineering Principles",
  "Database Management Systems",
  "Operating Systems",
  "Computer Networks",
  "Artificial Intelligence",
  "Machine Learning Basics",
];

type SyllabusWorkspace = {
  workspaceId?: string;
  name?: string | null;
  subject?: string | null;
  onboardingConfig?: {
    targetGoal?: string | null;
    preferredDays?: string[] | null;
    preferredTimeSlots?: string[] | null;
    targetDeadline?: string | null;
  } | null;
};

type SyllabusInputProps = {
  workspaceId?: string | null;
  workspace?: SyllabusWorkspace | null;
};

/* ════════════════════════════════════════════
   SUBJECT + DATE ROW
════════════════════════════════════════════ */
function SubjectDeadlineRow({
  workspace,
  embedded,
}: {
  workspace?: SyllabusWorkspace | null;
  embedded?: boolean;
}) {
  const [subject, setSubject]   = useState("");
  const [date,    setDate]      = useState("");
  const [subOpen, setSubOpen]   = useState(false);

  const workspaceSubject = workspace?.subject || workspace?.name || "";

  useEffect(() => {
    if (embedded) {
      setSubject(workspaceSubject);
      setSubOpen(false);
    }
  }, [embedded, workspaceSubject]);

  return (
    <div style={{
      display: "flex", gap: 12, alignItems: "flex-end",
      padding: "16px 20px",
      background: WH,
      borderRadius: 14,
      border: `1px solid ${BDR}`,
      boxShadow: "0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.05)",
      flexWrap: "wrap",
    }}>

      {/* ── Subject / Workspace Context ── */}
      <div style={{ flex: "1 1 220px", minWidth: 200 }}>
        <label style={{
          display: "block", fontFamily: F, fontWeight: 700,
          fontSize: "0.72rem", color: "#374151", marginBottom: 7,
          letterSpacing: "0.02em",
        }}>
          {embedded ? "Workspace context" : "Select Subject"}
        </label>
        <div style={{ position: "relative" }}>
          {embedded ? (
            <div
              style={{
                width: "100%", padding: "10px 14px",
                borderRadius: 9, border: `1.5px solid ${BDR}`,
                background: OGL,
                fontFamily: F, fontSize: "0.875rem", color: T1,
                textAlign: "left",
                boxShadow: "none",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                minHeight: 42,
              }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {subject || workspaceSubject || "Workspace syllabus"}
              </span>
              <span style={{ fontSize: "0.72rem", color: OG, fontWeight: 700, flexShrink: 0 }}>
                Locked
              </span>
            </div>
          ) : (
            <>
              <button
                onClick={() => setSubOpen(p => !p)}
                style={{
                  width: "100%", padding: "10px 38px 10px 14px",
                  borderRadius: 9, border: `1.5px solid ${subOpen ? OG : BDR}`,
                  background: subOpen ? OGL : WH,
                  fontFamily: F, fontSize: "0.875rem", color: subject ? T1 : T3,
                  textAlign: "left", cursor: "pointer",
                  boxShadow: subOpen ? `0 0 0 3px rgba(255,107,0,0.10)` : "none",
                  transition: "all 0.15s ease",
                  display: "flex", alignItems: "center",
                }}
              >
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {subject || "Choose your course subject…"}
                </span>
                <ChevronDown
                  size={15} color={subOpen ? OG : T3}
                  style={{
                    position: "absolute", right: 12, top: "50%",
                    transform: `translateY(-50%) rotate(${subOpen ? 180 : 0}deg)`,
                    transition: "transform 0.2s", flexShrink: 0,
                  }}
                />
              </button>

              <AnimatePresence>
                {subOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.16 }}
                    style={{
                      position: "absolute", top: "calc(100% + 5px)", left: 0, right: 0,
                      background: WH, borderRadius: 10,
                      border: `1.5px solid ${BDR}`,
                      boxShadow: "0 4px 6px rgba(0,0,0,0.04), 0 12px 32px rgba(0,0,0,0.10)",
                      overflow: "hidden", zIndex: 50,
                    }}
                  >
                    {SUBJECTS.map(s => (
                      <div
                        key={s}
                        onClick={() => { setSubject(s); setSubOpen(false); }}
                        style={{
                          padding: "10px 14px", cursor: "pointer",
                          fontFamily: F, fontSize: "0.82rem",
                          color: subject === s ? OG : T1,
                          fontWeight: subject === s ? 700 : 400,
                          background: subject === s ? OGL : "transparent",
                          borderLeft: `3px solid ${subject === s ? OG : "transparent"}`,
                          transition: "all 0.1s",
                        }}
                        onMouseEnter={e => { if (subject !== s) (e.currentTarget as HTMLDivElement).style.background = "#F9FAFB"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = subject === s ? OGL : "transparent"; }}
                      >
                        {s}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ width: 1, height: 40, background: BDR, flexShrink: 0, alignSelf: "flex-end", marginBottom: 1 }} />

      {/* ── Exam Date / Deadline ── */}
      <div style={{ flex: "1 1 200px", minWidth: 180 }}>
        <label style={{
          display: "block", fontFamily: F, fontWeight: 700,
          fontSize: "0.72rem", color: "#374151", marginBottom: 7,
          letterSpacing: "0.02em",
        }}>
          Exam Date / Target Deadline
        </label>
        <div style={{ position: "relative" }}>
          {/* Calendar icon */}
          <div style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            pointerEvents: "none", zIndex: 1,
          }}>
            <Calendar size={15} color={date ? OG : T3} />
          </div>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            style={{
              width: "100%", padding: "10px 14px 10px 38px",
              borderRadius: 9, border: `1.5px solid ${date ? OG : BDR}`,
              background: date ? OGL : WH,
              fontFamily: F, fontSize: "0.875rem", color: date ? T1 : T3,
              outline: "none", cursor: "pointer",
              boxShadow: "none",
              transition: "all 0.15s ease",
              boxSizing: "border-box",
            }}
            onFocus={e => {
              e.target.style.borderColor = OG;
              e.target.style.boxShadow = "0 0 0 3px rgba(255,107,0,0.10)";
              e.target.style.background = OGL;
            }}
            onBlur={e => {
              if (!date) {
                e.target.style.borderColor = BDR;
                e.target.style.boxShadow = "none";
                e.target.style.background = WH;
              }
            }}
          />
        </div>
        {date && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ fontFamily: F, fontSize: "0.67rem", color: OG, fontWeight: 600, marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}
          >
            <CheckCircle2 size={11} color={OG} />
            Deadline set — AI will plan backwards from this date
          </motion.p>
        )}
      </div>

      {/* ── Apply button ── */}
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        style={{
          padding: "10px 20px", borderRadius: 9, border: "none",
          background: subject && date ? OG : "#E5E7EB",
          color: subject && date ? WH : T3,
          fontFamily: F, fontWeight: 700, fontSize: "0.82rem",
          cursor: subject && date ? "pointer" : "not-allowed",
          flexShrink: 0, alignSelf: "flex-end",
          boxShadow: subject && date ? "0 4px 14px rgba(255,107,0,0.30)" : "none",
          transition: "all 0.2s ease",
          display: "flex", alignItems: "center", gap: 6,
        }}
      >
        <Sparkles size={13} />
        Apply
      </motion.button>
    </div>
  );
}

/* ════════════════════════════════════════════
   LEFT COLUMN — Input Card
════════════════════════════════════════════ */
function InputCard({
  onAnalyse,
  analysed,
  workspaceLabel,
  workspaceId,
}: {
  onAnalyse: () => void;
  analysed: boolean;
  workspaceLabel?: string;
  workspaceId?: string | null;
}) {
  const [tab, setTab]       = useState<"paste" | "upload">("paste");
  const [text, setText]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleAnalyse = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); onAnalyse(); }, 2000);
  };

  return (
    <div style={card}>
      {/* ── Card header ── */}
      <div style={{
        padding: "18px 20px 0",
        borderBottom: `1px solid ${BDR}`,
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 14,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: OGL, border: `1px solid rgba(255,107,0,0.18)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <FileText size={15} color={OG} />
            </div>
            <div>
              <p style={{ fontFamily: F, fontWeight: 700, fontSize: "0.95rem", color: T1, lineHeight: 1 }}>
                Syllabus Content
              </p>
              <p style={{ fontFamily: F, fontSize: "0.72rem", color: T3, marginTop: 3 }}>
                {workspaceLabel
                  ? `Workspace: ${workspaceLabel}${workspaceId ? ` · ${workspaceId}` : ""}`
                  : "Paste or upload your university course syllabus"}
              </p>
            </div>
          </div>
          {analysed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "4px 10px", borderRadius: 99,
                background: "#ECFDF5", border: "1px solid #A7F3D0",
              }}
            >
              <CheckCircle2 size={11} color="#16A34A" />
              <span style={{ fontFamily: F, fontSize: "0.68rem", fontWeight: 700, color: "#16A34A" }}>
                Analysed
              </span>
            </motion.div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0 }}>
          {(["paste", "upload"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "9px 16px",
                border: "none",
                borderBottom: tab === t ? `2px solid ${OG}` : "2px solid transparent",
                background: "transparent",
                cursor: "pointer",
                fontFamily: F,
                fontWeight: tab === t ? 700 : 500,
                fontSize: "0.82rem",
                color: tab === t ? OG : T3,
                display: "flex", alignItems: "center", gap: 6,
                transition: "color 0.15s",
              }}
            >
              {t === "paste"
                ? <><FileText size={13} />Paste text</>
                : <><UploadCloud size={13} />Upload file</>
              }
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div style={{ padding: "18px 20px 0" }}>
        {tab === "paste" ? (
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste your syllabus content here…"
            style={{
              width: "100%",
              height: 260,
              padding: "14px 16px",
              borderRadius: 10,
              border: `1.5px solid ${BDR}`,
              background: BG,
              fontFamily: F,
              fontSize: "0.875rem",
              color: T1,
              lineHeight: 1.7,
              resize: "none",
              outline: "none",
              boxSizing: "border-box",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
            onFocus={e => {
              e.target.style.borderColor = OG;
              e.target.style.boxShadow = `0 0 0 3px rgba(255,107,0,0.10)`;
            }}
            onBlur={e => {
              e.target.style.borderColor = BDR;
              e.target.style.boxShadow = "none";
            }}
          />
        ) : (
          <div
            style={{
              height: 260,
              borderRadius: 10,
              border: `2px dashed ${BDR}`,
              background: BG,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              cursor: "pointer",
              transition: "border-color 0.15s, background 0.15s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = OG;
              (e.currentTarget as HTMLDivElement).style.background = OGL;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = BDR;
              (e.currentTarget as HTMLDivElement).style.background = BG;
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: OGL,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <UploadCloud size={22} color={OG} />
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontFamily: F, fontWeight: 700, fontSize: "0.9rem", color: T1 }}>
                Upload Syllabus PDF
              </p>
              <p style={{ fontFamily: F, fontSize: "0.75rem", color: T3, marginTop: 4 }}>
                Drag & drop or click to browse · PDF, DOCX
              </p>
            </div>
            <button style={{
              padding: "8px 18px", borderRadius: 8,
              border: `1.5px solid ${BDR}`,
              background: WH, cursor: "pointer",
              fontFamily: F, fontWeight: 600, fontSize: "0.82rem", color: T2,
            }}>
              Browse Files
            </button>
          </div>
        )}
      </div>

      {/* ── Footer row ── */}
      <div style={{
        padding: "12px 20px 18px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 12,
      }}>
        <span style={{ fontFamily: F, fontSize: "0.71rem", color: T3 }}>
          {text.length.toLocaleString()} / 50,000 chars
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          {analysed && (
            <button
              onClick={() => { setText(""); }}
              style={{
                padding: "9px 14px", borderRadius: 9,
                border: `1.5px solid ${BDR}`,
                background: WH, cursor: "pointer",
                fontFamily: F, fontWeight: 600, fontSize: "0.82rem", color: T2,
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <RotateCcw size={13} /> Reset
            </button>
          )}
          <motion.button
            whileHover={{ scale: 1.025 }}
            whileTap={{ scale: 0.975 }}
            onClick={handleAnalyse}
            disabled={loading || (!text && tab === "paste")}
            style={{
              padding: "9px 20px", borderRadius: 9,
              border: "none", cursor: loading ? "default" : "pointer",
              background: analysed
                ? "#22C55E"
                : loading || (!text && tab === "paste")
                  ? "#D1D5DB"
                  : OG,
              color: loading || (!text && tab === "paste") ? T3 : WH,
              fontFamily: F, fontWeight: 700, fontSize: "0.86rem",
              display: "flex", alignItems: "center", gap: 7,
              boxShadow: analysed
                ? "0 4px 12px rgba(34,197,94,0.28)"
                : loading || (!text && tab === "paste")
                  ? "none"
                  : "0 4px 14px rgba(255,107,0,0.30)",
              transition: "all 0.25s ease",
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: 13, height: 13,
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: WH, borderRadius: "50%",
                  animation: "syl-spin 0.7s linear infinite",
                }} />
                Analysing…
              </>
            ) : analysed ? (
              <><CheckCircle2 size={14} /> Analysis Complete</>
            ) : (
              <><Sparkles size={14} /> Analyse with AI</>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   RIGHT COLUMN — Card 1: Summary
════════════════════════════════════════════ */
function SummaryCard() {
  const metrics = [
    { num: "3", label: "Foundation", color: "#3B82F6", bg: "#EFF6FF" },
    { num: "3", label: "Core",       color: OG,        bg: OGL       },
    { num: "2", label: "Advanced",   color: "#8B5CF6", bg: "#F5F3FF" },
  ];
  return (
    <div style={card}>
      <div style={{ padding: "16px 18px" }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 14,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: "#ECFDF5", border: "1px solid #A7F3D0",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <CheckCircle2 size={16} color="#16A34A" />
            </div>
            <div>
              <p style={{ fontFamily: F, fontWeight: 700, fontSize: "0.88rem", color: T1, lineHeight: 1 }}>
                Analysis complete
              </p>
              <p style={{ fontFamily: F, fontSize: "0.68rem", color: T3, marginTop: 3 }}>
                8 topics · 4 exams detected
              </p>
            </div>
          </div>
          <div style={{
            padding: "2px 8px", borderRadius: 99,
            background: "#ECFDF5", border: "1px solid #A7F3D0",
          }}>
            <span style={{ fontFamily: F, fontSize: "0.62rem", fontWeight: 700, color: "#16A34A" }}>CS301</span>
          </div>
        </div>

        {/* 3 metric pills */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {metrics.map(m => (
            <div key={m.label} style={{
              flex: 1, padding: "10px 6px", borderRadius: 10,
              background: m.bg, border: `1px solid ${m.color}22`,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            }}>
              <span style={{
                fontFamily: F, fontWeight: 900, fontSize: "1.5rem",
                color: m.color, letterSpacing: "-0.04em", lineHeight: 1,
              }}>{m.num}</span>
              <span style={{
                fontFamily: F, fontSize: "0.66rem", fontWeight: 700,
                color: m.color,
              }}>{m.label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          style={{
            width: "100%", padding: "11px 14px",
            borderRadius: 10, border: "none", cursor: "pointer",
            background: OG, color: WH,
            fontFamily: F, fontWeight: 700, fontSize: "0.85rem",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            boxShadow: "0 4px 14px rgba(255,107,0,0.32)",
          }}
        >
          <CheckCircle2 size={14} />
          Save &amp; Create Roadmap
        </motion.button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   RIGHT COLUMN — Card 2: Exams
════════════════════════════════════════════ */
function ExamsCard() {
  return (
    <div style={card}>
      <div style={{ padding: "14px 18px" }}>
        {/* Label */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
          <Calendar size={12} color={T3} />
          <span style={{
            fontFamily: F, fontSize: "0.63rem", fontWeight: 700,
            color: T3, letterSpacing: "0.11em", textTransform: "uppercase",
          }}>
            Exams &amp; Assessments
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {EXAMS.map(e => (
            <div key={e.name} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "9px 11px", borderRadius: 9,
              background: e.final ? "#FEF2F2" : BG,
              border: e.final ? "1.5px solid #FCA5A5" : `1px solid ${BDR}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: e.color, flexShrink: 0,
                }} />
                <span style={{
                  fontFamily: F, fontWeight: e.final ? 700 : 500,
                  fontSize: "0.82rem",
                  color: e.final ? "#DC2626" : T1,
                }}>
                  {e.name}
                </span>
                {e.final && (
                  <span style={{
                    fontFamily: F, fontSize: "0.58rem", fontWeight: 800,
                    color: "#DC2626", background: "#FEE2E2",
                    padding: "1px 6px", borderRadius: 99,
                    border: "1px solid #FCA5A5",
                    letterSpacing: "0.06em",
                  }}>FINAL</span>
                )}
              </div>
              <span style={{
                fontFamily: F, fontSize: "0.70rem", fontWeight: 700,
                color: e.color, background: e.bg,
                padding: "3px 9px", borderRadius: 6,
                border: `1px solid ${e.color}22`,
              }}>{e.week}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   RIGHT COLUMN — Card 3: Topics
════════════════════════════════════════════ */
function TopicsCard() {
  return (
    <div style={card}>
      <div style={{ padding: "14px 18px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Tag size={12} color={T3} />
            <span style={{
              fontFamily: F, fontSize: "0.63rem", fontWeight: 700,
              color: T3, letterSpacing: "0.11em", textTransform: "uppercase",
            }}>
              Analysed Topics
            </span>
          </div>
          <button style={{
            fontFamily: F, fontSize: "0.70rem", fontWeight: 600,
            color: OG, background: "none", border: "none",
            cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
            textDecoration: "underline", textUnderlineOffset: 2,
          }}>
            <RotateCcw size={10} /> Clear &amp; Re-enter
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {TOPICS.map((t, i) => (
            <motion.div
              key={t.n}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.28 }}
              style={{
                display: "flex", alignItems: "flex-start", gap: 10,
                padding: "10px 11px", borderRadius: 9,
                background: BG, border: `1px solid ${BDR}`,
              }}
            >
              {/* Number */}
              <div style={{
                width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                background: t.tB, border: `1px solid ${t.tC}22`,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginTop: 1,
              }}>
                <span style={{ fontFamily: F, fontWeight: 800, fontSize: "0.7rem", color: t.tC }}>
                  {t.n}
                </span>
              </div>
              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontFamily: F, fontWeight: 600, fontSize: "0.81rem",
                  color: T1, lineHeight: 1.25, margin: 0, marginBottom: 5,
                }}>{t.title}</p>
                <div style={{ display: "flex", gap: 5 }}>
                  <span style={{
                    fontFamily: F, fontSize: "0.60rem", fontWeight: 600, color: T3,
                    background: "#F1F5F9", padding: "2px 7px", borderRadius: 99,
                    display: "flex", alignItems: "center", gap: 3,
                  }}>
                    <Clock size={8} />{t.week}
                  </span>
                  <span style={{
                    fontFamily: F, fontSize: "0.60rem", fontWeight: 700,
                    color: t.tC, background: t.tB,
                    padding: "2px 7px", borderRadius: 99,
                    border: `1px solid ${t.tC}22`,
                  }}>{t.tag}</span>
                </div>
              </div>
              <ChevronRight size={13} color={T3} style={{ marginTop: 3, flexShrink: 0 }} />
            </motion.div>
          ))}

          <div style={{
            padding: "7px 11px", borderRadius: 9,
            border: `1px dashed ${BDR}`, textAlign: "center",
          }}>
            <span style={{ fontFamily: F, fontSize: "0.70rem", color: T3, fontWeight: 500 }}>
              + 3 more topics — Core &amp; Advanced
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN PAGE (renders inside DashboardLayout)
════════════════════════════════════════════ */
export default function SyllabusInput({ workspaceId = null, workspace = null }: SyllabusInputProps) {
  const [analysed, setAnalysed] = useState(false);
  const isEmbedded = Boolean(workspaceId || workspace);
  const workspaceLabel = workspace?.name || workspace?.subject || workspaceId || undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{ fontFamily: F }}
    >
      <style>{`
        @keyframes syl-spin { to { transform: rotate(360deg); } }
        textarea { font-family: 'Inter', 'Plus Jakarta Sans', sans-serif; }
        textarea::placeholder { 
          color: #D1D5DB;
          opacity: 1;
          font-style: normal;
        }
        textarea::-webkit-input-placeholder { color: #D1D5DB; opacity: 1; }
        textarea::-moz-placeholder { color: #D1D5DB; opacity: 1; }
        textarea:-ms-input-placeholder { color: #D1D5DB; opacity: 1; }
        input[type="date"]::-webkit-calendar-picker-indicator { opacity: 0; position: absolute; width: 100%; height: 100%; cursor: pointer; }
        input[type="date"]::-webkit-inner-spin-button { display: none; }
      `}</style>

      {!isEmbedded && (
        <div style={{ marginBottom: 18 }}>
          <h1 style={{
            fontFamily: F, fontWeight: 800, fontSize: "1.55rem",
            color: T1, letterSpacing: "-0.035em", margin: 0, lineHeight: 1.2,
          }}>
            Syllabus Input 📑
          </h1>
          <p style={{
            fontFamily: F, fontSize: "0.86rem", color: T2,
            marginTop: 6, lineHeight: 1.6,
          }}>
            Subject: <strong style={{ color: T1 }}>PRJ301</strong> — Paste syllabus → AI will analyse and create your roadmap.
          </p>
        </div>
      )}

      {/* ── Subject + Deadline Row ── */}
      <div style={{ marginBottom: 16 }}>
        <SubjectDeadlineRow workspace={workspace} embedded={isEmbedded} />
      </div>

      {/* ── 2-column grid ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 300px",
        gap: 18,
        alignItems: "start",
      }}>

        {/* ── LEFT: Input + tip banner ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <InputCard
            onAnalyse={() => setAnalysed(true)}
            analysed={analysed}
            workspaceLabel={workspaceLabel}
            workspaceId={workspaceId}
          />

          {/* Light blue tip banner */}
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 12,
            padding: "13px 16px", borderRadius: 12,
            background: "#EFF6FF", border: "1px solid #BFDBFE",
          }}>
            <Info size={16} color="#3B82F6" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontFamily: F, fontWeight: 700, fontSize: "0.82rem", color: "#1D4ED8", marginBottom: 3 }}>
                Tip
              </p>
              <p style={{ fontFamily: F, fontSize: "0.78rem", color: "#3B82F6", lineHeight: 1.6 }}>
                For best results, paste the full course syllabus including topics, learning outcomes, and exam schedules.
                Include week-by-week breakdowns and assessment dates for maximum roadmap accuracy.
              </p>
            </div>
          </div>
        </div>

        {/* ── RIGHT: 3 stacked analysis cards ── */}
        <AnimatePresence>
          {analysed ? (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              <SummaryCard />
              <ExamsCard />
              <TopicsCard />
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                display: "flex", flexDirection: "column", gap: 14,
              }}
            >
              {/* Empty state placeholder cards */}
              {[
                { h: 140, label: "Analysis Summary" },
                { h: 172, label: "Exams & Assessments" },
                { h: 240, label: "Analysed Topics" },
              ].map(p => (
                <div key={p.label} style={{
                  ...card,
                  height: p.h,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  gap: 8,
                  background: "rgba(249,250,251,0.7)",
                  border: `1.5px dashed ${BDR}`,
                  boxShadow: "none",
                }}>
                  <AlertCircle size={18} color={T3} />
                  <p style={{ fontFamily: F, fontSize: "0.78rem", fontWeight: 600, color: T3 }}>
                    {p.label}
                  </p>
                  <p style={{ fontFamily: F, fontSize: "0.70rem", color: T3, opacity: 0.7 }}>
                    Appears after analysis
                  </p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Bottom sticky CTA ── */}
      <AnimatePresence>
        {analysed && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ delay: 0.3, duration: 0.4, ease: [0.22,1,0.36,1] }}
            style={{
              marginTop: 20,
              padding: isEmbedded ? 0 : "12px 0 4px",
              background: isEmbedded ? "transparent" : "linear-gradient(to bottom, transparent 0%, #F9FAFB 28%)",
            }}
          >
            <Link to="/app/roadmap" style={{ textDecoration: "none", display: "block" }}>
              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                style={{
                  width: "100%", padding: "14px 22px",
                  borderRadius: 12, border: "none", cursor: "pointer",
                  background: OG, color: WH,
                  fontFamily: F, fontWeight: 800, fontSize: "0.95rem",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                  boxShadow: "0 6px 22px rgba(255,107,0,0.36)",
                  letterSpacing: "-0.02em",
                }}
              >
                Create Roadmap from this Syllabus
                <ArrowRight size={17} />
              </motion.button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
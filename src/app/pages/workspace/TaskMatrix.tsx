import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { AlertTriangle, Circle, CheckCircle2, Plus, Sparkles } from "lucide-react";

const F = "'Plus Jakarta Sans', Inter, sans-serif";
const WH = "#FFFFFF";
const BG = "#F8FAFC";
const OG = "#FF6B00";
const T1 = "#111827";
const T2 = "#6B7280";
const T3 = "#9CA3AF";
const BDR = "#E5E7EB";

type MatrixTask = {
  id: number;
  text: string;
  done: boolean;
};

type MatrixState = Record<"doFirst" | "schedule" | "doLater" | "eliminate", MatrixTask[]>;

const INITIAL: MatrixState = {
  doFirst: [
    { id: 1, text: "Hoàn thành bài tập Data Structures", done: false },
    { id: 2, text: "Ôn tập cho kỳ thi giữa kỳ", done: false },
  ],
  schedule: [
    { id: 3, text: "Đọc chương 4 về Cây", done: false },
    { id: 4, text: "Luyện 3 bài LeetCode mức trung bình", done: false },
  ],
  doLater: [
    { id: 5, text: "Sắp xếp thư mục học tập", done: false },
    { id: 6, text: "Xem thêm tài liệu tham khảo", done: false },
  ],
  eliminate: [
    { id: 7, text: "Lướt mạng xã hội quá đà", done: false },
  ],
};

const QUADRANTS = [
  {
    id: "doFirst" as const,
    title: "Làm ngay",
    subtitle: "Khẩn cấp và quan trọng",
    accent: "#DC2626",
    bg: "#FEF2F2",
    border: "#FECACA",
  },
  {
    id: "schedule" as const,
    title: "Lên lịch",
    subtitle: "Quan trọng, chưa khẩn cấp",
    accent: "#EA580C",
    bg: "#FFF7ED",
    border: "#FDBA74",
  },
  {
    id: "doLater" as const,
    title: "Để sau",
    subtitle: "Không khẩn cấp, tác động thấp",
    accent: "#2563EB",
    bg: "#EFF6FF",
    border: "#BFDBFE",
  },
  {
    id: "eliminate" as const,
    title: "Loại bỏ",
    subtitle: "Không quan trọng",
    accent: "#6B7280",
    bg: "#F3F4F6",
    border: "#D1D5DB",
  },
];

export default function TaskMatrix() {
  const [matrix, setMatrix] = useState<MatrixState>(INITIAL);
  const [draft, setDraft] = useState<Record<keyof MatrixState, string>>({
    doFirst: "",
    schedule: "",
    doLater: "",
    eliminate: "",
  });

  const totals = useMemo(() => {
    const all = Object.values(matrix).flat();
    const done = all.filter(t => t.done).length;
    return { total: all.length, done };
  }, [matrix]);

  const toggleTask = (bucket: keyof MatrixState, id: number) => {
    setMatrix(prev => ({
      ...prev,
      [bucket]: prev[bucket].map(item => (item.id === id ? { ...item, done: !item.done } : item)),
    }));
  };

  const addTask = (bucket: keyof MatrixState) => {
    const text = draft[bucket].trim();
    if (!text) return;
    setMatrix(prev => ({
      ...prev,
      [bucket]: [...prev[bucket], { id: Date.now(), text, done: false }],
    }));
    setDraft(prev => ({ ...prev, [bucket]: "" }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{ fontFamily: F, maxWidth: "1280px", margin: "0 auto" }}
    >
      <div
        style={{
          background: WH,
          border: `1px solid ${BDR}`,
          borderRadius: "16px",
          padding: "16px 18px",
          marginBottom: "14px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "10px",
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AlertTriangle size={16} color="#DC2626" />
            </div>
            <div>
              <h1 style={{ fontSize: "1.06rem", fontWeight: 800, color: T1, lineHeight: 1.1 }}>Ma trận công việc</h1>
              <p style={{ fontSize: "0.74rem", color: T2, marginTop: "3px" }}>Sắp xếp ưu tiên theo độ khẩn cấp và mức độ ảnh hưởng</p>
            </div>
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 10px",
              borderRadius: "9px",
              background: "rgba(255,107,0,0.08)",
              border: "1px solid rgba(255,107,0,0.2)",
            }}
          >
            <Sparkles size={12} color={OG} />
            <span style={{ fontSize: "0.72rem", color: OG, fontWeight: 800 }}>{totals.done}/{totals.total} đã hoàn thành</span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "14px" }}>
        {QUADRANTS.map(q => (
          <div
            key={q.id}
            style={{
              background: WH,
              border: `1px solid ${BDR}`,
              borderRadius: "16px",
              padding: "14px",
              minHeight: "320px",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <div>
                <h3 style={{ fontSize: "0.92rem", fontWeight: 800, color: q.accent }}>{q.title}</h3>
                <p style={{ fontSize: "0.7rem", color: T3, marginTop: "2px" }}>{q.subtitle}</p>
              </div>
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: "999px",
                  fontSize: "0.66rem",
                  fontWeight: 800,
                  color: q.accent,
                  background: q.bg,
                  border: `1px solid ${q.border}`,
                }}
              >
                {matrix[q.id].length}
              </span>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px", overflowY: "auto", paddingRight: "2px" }}>
              {matrix[q.id].map(task => (
                <div
                  key={task.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                    padding: "9px 10px",
                    borderRadius: "10px",
                    border: `1px solid ${BDR}`,
                    background: task.done ? BG : WH,
                  }}
                >
                  <button
                    onClick={() => toggleTask(q.id, task.id)}
                    style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", marginTop: "1px" }}
                  >
                    {task.done ? <CheckCircle2 size={16} color="#22C55E" /> : <Circle size={16} color={T3} />}
                  </button>
                  <p
                    style={{
                      fontSize: "0.8rem",
                      color: task.done ? T3 : T1,
                      textDecoration: task.done ? "line-through" : "none",
                      lineHeight: 1.4,
                    }}
                  >
                    {task.text}
                  </p>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
              <input
                value={draft[q.id]}
                onChange={e => setDraft(prev => ({ ...prev, [q.id]: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && addTask(q.id)}
                placeholder="Thêm tác vụ mới..."
                style={{
                  flex: 1,
                  padding: "9px 10px",
                  borderRadius: "10px",
                  border: `1px solid ${BDR}`,
                  background: WH,
                  color: T1,
                  fontSize: "0.78rem",
                  outline: "none",
                }}
              />
              <button
                onClick={() => addTask(q.id)}
                style={{
                  width: "36px",
                  borderRadius: "10px",
                  border: "none",
                  background: `linear-gradient(135deg, ${OG}, #FF8C3A)`,
                  color: WH,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Plus size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

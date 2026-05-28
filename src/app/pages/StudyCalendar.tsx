import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, Plus, Sparkles, Clock, Check } from "lucide-react";

const F = "'Plus Jakarta Sans', Inter, sans-serif";
const WH = "#FFFFFF";
const BG = "#F8FAFC";
const OG = "#FF6B00";
const T1 = "#111827";
const T2 = "#6B7280";
const T3 = "#9CA3AF";
const BDR = "#E5E7EB";

type TaskLane = "deep" | "practice" | "review" | "project";
type DayTask = { id: number; title: string; time: string; duration: string; done: boolean; lane: TaskLane };
type TaskMap = Record<string, DayTask[]>;

const LANE_META: Record<TaskLane, { label: string; bg: string; text: string; border: string }> = {
  deep: { label: "Học sâu", bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  practice: { label: "Luyện tập", bg: "#ECFDF5", text: "#047857", border: "#A7F3D0" },
  review: { label: "Ôn tập", bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
  project: { label: "Dự án", bg: "#F5F3FF", text: "#6D28D9", border: "#DDD6FE" },
};

const seededTasks: TaskMap = {
  "2026-03-08": [
    { id: 1, title: "Học sâu React Hooks", time: "09:00", duration: "90p", done: true, lane: "deep" },
    { id: 2, title: "System Design chương 3", time: "14:00", duration: "60p", done: false, lane: "review" },
  ],
  "2026-03-10": [{ id: 3, title: "Luyện TypeScript generics", time: "19:00", duration: "75p", done: false, lane: "practice" }],
  "2026-03-14": [{ id: 4, title: "Ôn tập thuật toán bằng flashcard", time: "16:30", duration: "30p", done: false, lane: "review" }],
};

const fmtKey = (year: number, month: number, day: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

export default function StudyCalendar() {
  const [cursor, setCursor] = useState(new Date(2026, 2, 1));
  const [selectedDay, setSelectedDay] = useState(8);
  const [tasksByDay, setTasksByDay] = useState<TaskMap>(seededTasks);
  const [newTitle, setNewTitle] = useState("");
  const [newLane, setNewLane] = useState<TaskLane>("practice");
  const [planning, setPlanning] = useState(false);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = cursor.toLocaleString("vi-VN", { month: "long", year: "numeric" });

  const cells = useMemo(() => {
    const data: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
    while (data.length % 7 !== 0) data.push(null);
    return data;
  }, [first, daysInMonth]);

  const selectedKey = fmtKey(year, month, selectedDay);
  const selectedTasks = tasksByDay[selectedKey] ?? [];

  const shiftMonth = (offset: number) => {
    const next = new Date(year, month + offset, 1);
    setCursor(next);
    setSelectedDay(1);
  };

  const addTask = () => {
    const title = newTitle.trim();
    if (!title) return;
    setTasksByDay(prev => ({
      ...prev,
      [selectedKey]: [
        ...(prev[selectedKey] ?? []),
        { id: Date.now(), title, time: "18:00", duration: "45p", done: false, lane: newLane },
      ],
    }));
    setNewTitle("");
  };

  const weekday = new Date(year, month, selectedDay).getDay();

  const generateAiPlan = () => {
    setPlanning(true);
    const weekdayPlans: Record<number, Array<Omit<DayTask, "id" | "done">>> = {
      0: [
        { title: "Ôn nhanh tuần trước bằng flashcard", time: "08:30", duration: "30p", lane: "review" },
        { title: "Làm mini quiz tổng hợp", time: "10:00", duration: "45p", lane: "practice" },
      ],
      1: [
        { title: "Học sâu React State Management", time: "07:30", duration: "90p", lane: "deep" },
        { title: "Luyện bài tập hooks nâng cao", time: "19:00", duration: "60p", lane: "practice" },
      ],
      2: [
        { title: "Học hệ thống hóa TypeScript", time: "08:00", duration: "75p", lane: "deep" },
        { title: "Xây mini component theo đề", time: "20:00", duration: "50p", lane: "project" },
      ],
      3: [
        { title: "Ôn hệ điều hành kiến thức cốt lõi", time: "07:30", duration: "45p", lane: "review" },
        { title: "Làm bộ câu hỏi thực chiến", time: "19:30", duration: "60p", lane: "practice" },
      ],
      4: [
        { title: "Học sâu System Design chương mới", time: "08:00", duration: "80p", lane: "deep" },
        { title: "Tổng kết ghi chú tuần", time: "21:00", duration: "30p", lane: "review" },
      ],
      5: [
        { title: "Làm project mini theo roadmap", time: "09:00", duration: "120p", lane: "project" },
        { title: "Review code và tối ưu", time: "14:30", duration: "60p", lane: "review" },
      ],
      6: [
        { title: "Luyện đề mô phỏng phỏng vấn", time: "08:30", duration: "75p", lane: "practice" },
        { title: "Bổ sung portfolio cuối tuần", time: "16:00", duration: "50p", lane: "project" },
      ],
    };

    setTimeout(() => {
      const generated = (weekdayPlans[weekday] ?? weekdayPlans[1]).map((task, idx) => ({
        id: Date.now() + idx,
        done: false,
        ...task,
      }));

      setTasksByDay(prev => ({
        ...prev,
        [selectedKey]: generated,
      }));
      setPlanning(false);
    }, 650);
  };

  const toggleTask = (id: number) => {
    setTasksByDay(prev => ({
      ...prev,
      [selectedKey]: (prev[selectedKey] ?? []).map(t => (t.id === id ? { ...t, done: !t.done } : t)),
    }));
  };

  const doneCount = selectedTasks.filter(t => t.done).length;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} style={{ fontFamily: F }}>
      <div style={{ background: WH, border: `1px solid ${BDR}`, borderRadius: "16px", padding: "16px 18px", marginBottom: "14px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: "1.06rem", fontWeight: 800, color: T1, lineHeight: 1.1 }}>Lịch học tập</h1>
            <p style={{ fontSize: "0.74rem", color: T2, marginTop: "3px" }}>Lên kế hoạch buổi học theo giao diện chung của SkillSprint</p>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 10px", borderRadius: "9px", background: "rgba(255,107,0,0.08)", border: "1px solid rgba(255,107,0,0.2)" }}>
            <Sparkles size={12} color={OG} />
            <span style={{ fontSize: "0.72rem", color: OG, fontWeight: 800 }}>{doneCount}/{selectedTasks.length} đã xong</span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "14px", alignItems: "start" }}>
        <div style={{ background: WH, border: `1px solid ${BDR}`, borderRadius: "16px", padding: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button onClick={() => shiftMonth(-1)} style={{ width: "28px", height: "28px", borderRadius: "8px", border: `1px solid ${BDR}`, background: WH, cursor: "pointer", color: T2 }}><ChevronLeft size={14} /></button>
              <button onClick={() => shiftMonth(1)} style={{ width: "28px", height: "28px", borderRadius: "8px", border: `1px solid ${BDR}`, background: WH, cursor: "pointer", color: T2 }}><ChevronRight size={14} /></button>
              <span style={{ fontSize: "0.84rem", fontWeight: 700, color: T1 }}>{monthLabel}</span>
            </div>
            <button
              onClick={generateAiPlan}
              disabled={planning}
              style={{
                border: "none",
                background: `linear-gradient(135deg, ${OG}, #FF8C3A)`,
                color: WH,
                borderRadius: "10px",
                padding: "8px 12px",
                fontSize: "0.72rem",
                fontWeight: 800,
                cursor: planning ? "not-allowed" : "pointer",
                opacity: planning ? 0.72 : 1,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Sparkles size={12} />
              {planning ? "AI đang soạn..." : "AI soạn lịch ngày"}
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px", flexWrap: "wrap" }}>
            {(Object.keys(LANE_META) as TaskLane[]).map(lane => (
              <span
                key={lane}
                style={{
                  fontSize: "0.64rem",
                  fontWeight: 700,
                  color: LANE_META[lane].text,
                  background: LANE_META[lane].bg,
                  border: `1px solid ${LANE_META[lane].border}`,
                  borderRadius: "999px",
                  padding: "3px 8px",
                }}
              >
                {LANE_META[lane].label}
              </span>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "6px", marginBottom: "6px" }}>
            {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: "0.64rem", color: T3, fontWeight: 700 }}>{d}</div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "6px" }}>
            {cells.map((day, idx) => {
              if (!day) {
                return <div key={idx} style={{ height: "72px", borderRadius: "10px", background: BG, border: `1px solid ${BDR}` }} />;
              }
              const key = fmtKey(year, month, day);
              const count = tasksByDay[key]?.length ?? 0;
              const laneCounts = (tasksByDay[key] ?? []).reduce<Record<TaskLane, number>>(
                (acc, task) => {
                  acc[task.lane] += 1;
                  return acc;
                },
                { deep: 0, practice: 0, review: 0, project: 0 }
              );
              const selected = day === selectedDay;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDay(day)}
                  style={{
                    height: "72px",
                    borderRadius: "10px",
                    border: selected ? `1.5px solid ${OG}` : `1px solid ${BDR}`,
                    background: selected ? "#FFF7ED" : WH,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    padding: "8px",
                  }}
                >
                  <span style={{ fontSize: "0.76rem", fontWeight: 700, color: selected ? OG : T1 }}>{day}</span>
                  {count > 0 ? (
                    <div style={{ width: "100%" }}>
                      <span style={{ fontSize: "0.62rem", color: T2, display: "block", marginBottom: "2px" }}>{count} tác vụ</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "3px", flexWrap: "wrap" }}>
                        {(Object.keys(LANE_META) as TaskLane[]).map(lane => (
                          laneCounts[lane] > 0 ? (
                            <span
                              key={lane}
                              title={`${LANE_META[lane].label}: ${laneCounts[lane]}`}
                              style={{
                                width: "7px",
                                height: "7px",
                                borderRadius: "999px",
                                background: LANE_META[lane].text,
                                opacity: 0.9,
                              }}
                            />
                          ) : null
                        ))}
                      </div>
                    </div>
                  ) : <span style={{ fontSize: "0.62rem", color: T3 }}>Không có tác vụ</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ background: WH, border: `1px solid ${BDR}`, borderRadius: "16px", padding: "14px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", position: "sticky", top: "14px" }}>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 800, color: T1 }}>Kế hoạch trong ngày</h3>
          <p style={{ fontSize: "0.68rem", color: T3, marginTop: "3px", marginBottom: "10px" }}>{selectedKey}</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 104px 34px", gap: "8px", marginBottom: "10px" }}>
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addTask()}
              placeholder="Thêm tác vụ..."
              style={{ flex: 1, padding: "9px 10px", borderRadius: "9px", border: `1px solid ${BDR}`, fontSize: "0.78rem", color: T1, outline: "none" }}
            />
            <select
              value={newLane}
              onChange={e => setNewLane(e.target.value as TaskLane)}
              style={{
                padding: "9px 8px",
                borderRadius: "9px",
                border: `1px solid ${BDR}`,
                fontSize: "0.74rem",
                color: T1,
                outline: "none",
                background: WH,
              }}
            >
              {(Object.keys(LANE_META) as TaskLane[]).map(lane => (
                <option key={lane} value={lane}>{LANE_META[lane].label}</option>
              ))}
            </select>
            <button onClick={addTask} style={{ width: "34px", borderRadius: "9px", border: "none", background: `linear-gradient(135deg, ${OG}, #FF8C3A)`, color: WH, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Plus size={14} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "7px", maxHeight: "420px", overflowY: "auto" }}>
            {selectedTasks.length === 0 && (
              <div style={{ padding: "12px", borderRadius: "10px", border: `1px dashed ${BDR}`, color: T3, fontSize: "0.74rem", textAlign: "center" }}>Không có tác vụ cho ngày này</div>
            )}
            {selectedTasks.map(task => (
              <div key={task.id} style={{ padding: "9px 10px", borderRadius: "10px", border: `1px solid ${LANE_META[task.lane].border}`, background: task.done ? BG : LANE_META[task.lane].bg }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                  <button onClick={() => toggleTask(task.id)} style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0, marginTop: "1px" }}>
                    {task.done ? <Check size={14} color="#22C55E" /> : <div style={{ width: "14px", height: "14px", border: `2px solid ${T3}`, borderRadius: "50%" }} />}
                  </button>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "0.78rem", color: task.done ? T3 : T1, textDecoration: task.done ? "line-through" : "none", fontWeight: 600 }}>{task.title}</p>
                    <div style={{ marginTop: "4px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      <Clock size={10} color={T3} />
                      <span style={{ fontSize: "0.66rem", color: T3 }}>{task.time}</span>
                      <span style={{ fontSize: "0.66rem", color: OG, fontWeight: 700 }}>{task.duration}</span>
                      <span style={{ fontSize: "0.64rem", color: LANE_META[task.lane].text, background: WH, border: `1px solid ${LANE_META[task.lane].border}`, borderRadius: "999px", padding: "2px 6px", fontWeight: 700 }}>
                        {LANE_META[task.lane].label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

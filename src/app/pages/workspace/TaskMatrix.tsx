import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  CheckCircle2, ChevronDown, Circle,
  Loader2, Plus, Sparkles, LayoutGrid, X,
} from "lucide-react";
import { toast } from "sonner";

import {
  type EisenhowerTask,
  type EisenhowerBoardResponse,
  getEisenhowerTasks,
  createCalendarTask,
  updateCalendarTaskStatus,
} from "../../../api/utilities/calendarService";
import { getMyWorkspaces, type WorkspaceResponse } from "../../../api/utilities/workspaceService";

// ─── Types ────────────────────────────────────────────────────────────────────

type QuadrantKey = "DO_NOW" | "SCHEDULE" | "DELAY_OR_DELEGATE" | "ELIMINATE";

type UiTask = { id: string; text: string; done: boolean; fromApi: boolean };
type BoardState = Record<QuadrantKey, UiTask[]>;

// ─── Quadrant config ──────────────────────────────────────────────────────────

const QUADRANTS: Array<{
  key: QuadrantKey;
  numeral: string;
  title: string;
  subtitle: string;
  emptyText: string;
}> = [
  {
    key:          "DO_NOW",
    numeral:      "I",
    title:        "Làm ngay",
    subtitle:     "Quan trọng & Khẩn cấp",
    emptyText:    "Không có tác vụ khẩn cấp",
  },
  {
    key:          "SCHEDULE",
    numeral:      "II",
    title:        "Lên lịch",
    subtitle:     "Quan trọng, chưa khẩn cấp",
    emptyText:    "Chưa có mục tiêu dài hạn",
  },
  {
    key:          "DELAY_OR_DELEGATE",
    numeral:      "III",
    title:        "Ủy quyền",
    subtitle:     "Khẩn cấp, ít quan trọng",
    emptyText:    "Không có việc cần uỷ thác",
  },
  {
    key:          "ELIMINATE",
    numeral:      "IV",
    title:        "Loại bỏ",
    subtitle:     "Không khẩn cấp & Không quan trọng",
    emptyText:    "Danh sách trống — tốt lắm!",
  },
];

const QUADRANT_STYLES: Record<QuadrantKey, {
  bgGlow: string;
  badge: string;
  dot: string;
  circle: string;
  inputFocus: string;
  addButton: string;
  textHover: string;
}> = {
  DO_NOW: {
    bgGlow: "from-rose-50/15 via-white to-white hover:from-rose-50/25",
    badge: "bg-rose-50 text-rose-600 border-rose-100/60",
    dot: "bg-rose-500",
    circle: "border-rose-300 text-rose-600 group-hover:border-rose-400 group-hover:bg-rose-50/40",
    inputFocus: "focus-within:border-rose-400/50 focus-within:ring-rose-500/5",
    addButton: "bg-rose-500 hover:bg-rose-600 shadow-rose-500/10",
    textHover: "group-hover:text-rose-900",
  },
  SCHEDULE: {
    bgGlow: "from-amber-50/15 via-white to-white hover:from-amber-50/25",
    badge: "bg-amber-50 text-amber-600 border-amber-100/60",
    dot: "bg-amber-500",
    circle: "border-amber-300 text-amber-600 group-hover:border-amber-400 group-hover:bg-amber-50/40",
    inputFocus: "focus-within:border-amber-400/50 focus-within:ring-amber-500/5",
    addButton: "bg-amber-500 hover:bg-amber-600 shadow-amber-500/10",
    textHover: "group-hover:text-amber-900",
  },
  DELAY_OR_DELEGATE: {
    bgGlow: "from-blue-50/15 via-white to-white hover:from-blue-50/25",
    badge: "bg-blue-50 text-blue-600 border-blue-100/60",
    dot: "bg-blue-500",
    circle: "border-blue-300 text-blue-600 group-hover:border-blue-400 group-hover:bg-blue-50/40",
    inputFocus: "focus-within:border-blue-400/50 focus-within:ring-blue-500/5",
    addButton: "bg-blue-500 hover:bg-blue-600 shadow-blue-500/10",
    textHover: "group-hover:text-blue-900",
  },
  ELIMINATE: {
    bgGlow: "from-slate-50/30 via-white to-white hover:from-slate-100/20",
    badge: "bg-slate-50 text-slate-500 border-slate-200/65",
    dot: "bg-slate-400",
    circle: "border-slate-300 text-slate-500 group-hover:border-slate-400 group-hover:bg-slate-50/40",
    inputFocus: "focus-within:border-slate-400/50 focus-within:ring-slate-500/5",
    addButton: "bg-slate-500 hover:bg-slate-600 shadow-slate-500/10",
    textHover: "group-hover:text-slate-900",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function apiToUi(tasks: EisenhowerTask[]): UiTask[] {
  return tasks.map((t) => ({ id: t.taskId, text: t.title, done: t.status === "COMPLETED", fromApi: true }));
}
function emptyBoard(): BoardState {
  return { DO_NOW: [], SCHEDULE: [], DELAY_OR_DELEGATE: [], ELIMINATE: [] };
}
function boardFromResponse(data: EisenhowerBoardResponse): BoardState {
  return {
    DO_NOW:            apiToUi(data.DO_NOW            ?? []),
    SCHEDULE:          apiToUi(data.SCHEDULE          ?? []),
    DELAY_OR_DELEGATE: apiToUi(data.DELAY_OR_DELEGATE ?? []),
    ELIMINATE:         apiToUi(data.ELIMINATE         ?? []),
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TaskMatrix() {
  const [workspaces,          setWorkspaces]          = useState<WorkspaceResponse[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");
  const [workspacesLoading,   setWorkspacesLoading]   = useState(true);

  const [board,        setBoard]        = useState<BoardState>(emptyBoard());
  const [draft,        setDraft]        = useState<Record<QuadrantKey, string>>({ DO_NOW: "", SCHEDULE: "", DELAY_OR_DELEGATE: "", ELIMINATE: "" });
  const [boardLoading, setBoardLoading] = useState(false);
  const [refreshKey,   setRefreshKey]   = useState(0);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [activeMobileQuadrant, setActiveMobileQuadrant] = useState<QuadrantKey>("DO_NOW");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const list = await getMyWorkspaces();
        if (!mounted) return;
        setWorkspaces(list);
        if (list.length > 0) setSelectedWorkspaceId(list[0].workspaceId);
      } catch {
        if (mounted) toast.error("Không thể tải danh sách workspace.");
      } finally {
        if (mounted) setWorkspacesLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!selectedWorkspaceId) return;
    let mounted = true;
    const run = async () => {
      setBoardLoading(true);
      setBoard(emptyBoard());
      try {
        const data = await getEisenhowerTasks(selectedWorkspaceId, selectedDate || undefined);
        if (mounted) setBoard(boardFromResponse(data));
      } catch {
        if (mounted) { toast.error("Không thể tải ma trận công việc."); setBoard(emptyBoard()); }
      } finally {
        if (mounted) setBoardLoading(false);
      }
    };
    run();
    return () => { mounted = false; };
  }, [selectedWorkspaceId, refreshKey, selectedDate]);

  async function toggleTask(quadrant: QuadrantKey, id: string) {
    const task = board[quadrant]?.find((t) => t.id === id);
    if (!task || !selectedWorkspaceId) return;
    const newStatus = task.done ? "IN_PROGRESS" : "COMPLETED";
    setBoard((prev) => ({ ...prev, [quadrant]: prev[quadrant].map((t) => t.id === id ? { ...t, done: !t.done } : t) }));
    try {
      await updateCalendarTaskStatus(selectedWorkspaceId, id, { status: newStatus });
    } catch {
      setBoard((prev) => ({ ...prev, [quadrant]: prev[quadrant].map((t) => t.id === id ? { ...t, done: task.done } : t) }));
      toast.error("Không thể cập nhật trạng thái tác vụ.");
    }
  }

  async function addTask(quadrant: QuadrantKey) {
    const text = draft[quadrant].trim();
    if (!text || !selectedWorkspaceId) return;
    setDraft((prev) => ({ ...prev, [quadrant]: "" }));
    try {
      await createCalendarTask(selectedWorkspaceId, { title: text, quadrant, status: "IN_PROGRESS" });
      setRefreshKey((k) => k + 1);
    } catch {
      toast.error("Không thể thêm tác vụ mới.");
      setDraft((prev) => ({ ...prev, [quadrant]: text }));
    }
  }

  const selectedWorkspace = workspaces.find((w) => w.workspaceId === selectedWorkspaceId);
  const totals = useMemo(() => {
    const all = Object.values(board).flat();
    return { total: all.length, done: all.filter((t) => t.done).length };
  }, [board]);
  const isLoading = workspacesLoading || boardLoading;

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-[1280px] mx-auto space-y-4"
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-white rounded-2xl border border-slate-200/80 px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 border border-slate-200 shrink-0">
            <LayoutGrid className="h-4 w-4 text-slate-600" />
          </div>
          <div>
            <h1 className="text-[0.94rem] font-extrabold text-slate-900 leading-tight tracking-tight">
              Ma trận Eisenhower
            </h1>
            <p className="text-[0.71rem] text-slate-400 mt-0.5">
              Phân loại tác vụ theo độ quan trọng & khẩn cấp
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              disabled={boardLoading}
              title="Lọc task theo ngày"
              className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-[0.78rem] font-semibold cursor-pointer outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/15 transition disabled:opacity-50"
              style={{ colorScheme: "light" }}
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-100 text-slate-400 cursor-pointer"
                title="Bỏ lọc ngày"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {!workspacesLoading && workspaces.length > 0 && (
            <div className="relative">
              <select
                value={selectedWorkspaceId}
                onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                disabled={boardLoading}
                className="appearance-none pl-3 pr-7 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-[0.78rem] font-semibold cursor-pointer outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/15 transition min-w-[150px] max-w-[220px] disabled:opacity-50"
              >
                {workspaces.map((ws) => (
                  <option key={ws.workspaceId} value={ws.workspaceId}>{ws.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
          )}

          <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-50 border border-orange-100 shrink-0">
            <Sparkles className="h-3 w-3 text-[#FF6B00]" />
            <span className="text-[0.71rem] font-extrabold text-[#FF6B00]">
              {totals.done}/{totals.total} hoàn thành
            </span>
          </div>
        </div>
      </div>

      {/* ── Loading ── */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2.5 py-14">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          <span className="text-sm text-slate-400">Đang tải dữ liệu...</span>
        </div>
      )}

      {/* ── No workspaces ── */}
      {!workspacesLoading && workspaces.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl px-6 py-14 text-center">
          <p className="text-sm text-slate-400">
            Bạn chưa có workspace nào. Hãy tạo workspace để bắt đầu sắp xếp công việc.
          </p>
        </div>
      )}

      {/* ── 2×2 Matrix grid ── */}
      {!isLoading && selectedWorkspace && (
        <div className="space-y-3">
          {/* Mobile Tab Switcher */}
          <div className="flex md:hidden bg-slate-100 p-1 rounded-xl gap-1 mb-2">
            {QUADRANTS.map((q) => {
              const isActive = activeMobileQuadrant === q.key;
              return (
                <button
                  key={q.key}
                  type="button"
                  onClick={() => setActiveMobileQuadrant(q.key)}
                  className={`flex-1 text-[11px] font-bold py-2 px-1 text-center rounded-lg transition-all cursor-pointer ${
                    isActive 
                      ? "bg-white text-orange-600 shadow-xs border border-orange-100/50" 
                      : "text-slate-500 hover:text-slate-750"
                  }`}
                >
                  {q.title}
                </button>
              );
            })}
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-2">
            {QUADRANTS.map((q, idx) => {
              const styles = QUADRANT_STYLES[q.key];
              const tasks = board[q.key] ?? [];
              const doneCount = tasks.filter((t) => t.done).length;

              // Determine modern grid border alignment classes
              const borderClass = idx === 0 
                ? "md:border-r md:border-b border-b border-slate-100/80" 
                : idx === 1 
                  ? "md:border-b border-b border-slate-100/80" 
                  : idx === 2 
                    ? "md:border-r border-b md:border-b-0 border-slate-100/80" 
                    : "";

              return (
                <div
                  key={q.key}
                  className={`flex-col p-6 min-h-[300px] bg-gradient-to-br transition-all duration-300 ${styles.bgGlow} ${borderClass} ${
                    activeMobileQuadrant === q.key ? "flex" : "hidden md:flex"
                  }`}
                >
                {/* Quadrant Header */}
                <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-slate-50">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center justify-center text-[9px] font-black w-5 h-5 rounded border tracking-wider uppercase ${styles.badge}`}>
                        Q{q.numeral}
                      </span>
                      <h3 className="text-sm font-bold text-slate-800 leading-tight">
                        {q.title}
                      </h3>
                      <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                      {q.subtitle}
                    </p>
                  </div>

                  {/* Done Count Badge */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {doneCount > 0 && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
                        {doneCount}✓
                      </span>
                    )}
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 rounded-full text-[10px] font-black text-slate-400 border border-slate-100 bg-slate-50 px-1.5">
                      {tasks.length}
                    </span>
                  </div>
                </div>

                {/* Task List */}
                <div
                  className="flex-1 overflow-y-auto pr-1 py-1 space-y-1.5 custom-scrollbar"
                  style={{ minHeight: 160, maxHeight: 240 }}
                >
                  {tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                      <p className="text-[11px] text-slate-400/80 italic select-none">
                        {q.emptyText}
                      </p>
                    </div>
                  ) : (
                    tasks.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => void toggleTask(q.key, task.id)}
                        className="w-full flex items-start gap-2.5 rounded-xl px-2.5 py-2 hover:bg-slate-50/60 active:bg-slate-100/50 transition-all duration-150 group cursor-pointer border border-transparent hover:border-slate-100/50"
                      >
                        {task.done ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                        ) : (
                          <div className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200 ${styles.circle}`}>
                            <span className="opacity-0 group-hover:opacity-100 text-[8px] font-bold text-center">✓</span>
                          </div>
                        )}
                        <span
                          className={`text-[0.78rem] leading-snug flex-1 text-left transition-colors ${
                            task.done ? "text-slate-400 line-through" : "text-slate-700 " + styles.textHover
                          }`}
                        >
                          {task.text}
                        </span>
                      </button>
                    ))
                  )}
                </div>

                {/* Add task input row — Slim Quick Add */}
                <div className="pt-3 border-t border-slate-100/60 mt-auto">
                  <div className={`relative flex items-center gap-2 rounded-xl bg-slate-50/50 border border-slate-200/50 px-3 py-1.5 transition-all duration-200 ${styles.inputFocus}`}>
                    <Plus className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <input
                      type="text"
                      value={draft[q.key]}
                      onChange={(e) => setDraft((prev) => ({ ...prev, [q.key]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && void addTask(q.key)}
                      placeholder="Thêm tác vụ..."
                      className="flex-1 bg-transparent text-[0.76rem] text-slate-700 placeholder-slate-400 outline-none w-full"
                    />
                    {draft[q.key].trim() && (
                      <button
                        type="button"
                        onClick={() => void addTask(q.key)}
                        className={`shrink-0 flex h-[22px] w-[22px] items-center justify-center rounded-lg text-white transition-all duration-200 ${styles.addButton}`}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        </div>
      )}
    </motion.div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  AlertTriangle, CheckCircle2, ChevronDown, Circle,
  Loader2, Plus, Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import {
  type EisenhowerTask,
  type EisenhowerBoardResponse,
  getEisenhowerTasks,
  createCalendarTask,
  updateCalendarTaskStatus,
} from "../../../api/calendarService";
import { getMyWorkspaces, type WorkspaceResponse } from "../../../api/workspaceService";

// ─── Design tokens ────────────────────────────────────────────────────────────

const F   = "'Plus Jakarta Sans', Inter, sans-serif";
const WH  = "#FFFFFF";
const BG  = "#F8FAFC";
const OG  = "#FF6B00";
const T1  = "#111827";
const T2  = "#6B7280";
const T3  = "#9CA3AF";
const BDR = "#E5E7EB";

// ─── Types ────────────────────────────────────────────────────────────────────

type QuadrantKey = "DO_NOW" | "SCHEDULE" | "DELAY_OR_DELEGATE" | "ELIMINATE";

type UiTask = {
  id: string;
  text: string;
  done: boolean;
  fromApi: boolean;
};

type BoardState = Record<QuadrantKey, UiTask[]>;

// ─── Quadrant display config ──────────────────────────────────────────────────

const QUADRANTS: Array<{
  key: QuadrantKey;
  title: string;
  subtitle: string;
  accent: string;
  bg: string;
  border: string;
}> = [
  {
    key:      "DO_NOW",
    title:    "Làm ngay",
    subtitle: "Quan trọng & Khẩn cấp",
    accent:   "#DC2626",
    bg:       "#FEF2F2",
    border:   "#FECACA",
  },
  {
    key:      "SCHEDULE",
    title:    "Lên lịch",
    subtitle: "Quan trọng, chưa khẩn cấp",
    accent:   "#EA580C",
    bg:       "#FFF7ED",
    border:   "#FDBA74",
  },
  {
    key:      "DELAY_OR_DELEGATE",
    title:    "Để sau",
    subtitle: "Khẩn cấp nhưng ít quan trọng",
    accent:   "#2563EB",
    bg:       "#EFF6FF",
    border:   "#BFDBFE",
  },
  {
    key:      "ELIMINATE",
    title:    "Loại bỏ",
    subtitle: "Không quan trọng & Không khẩn cấp",
    accent:   "#6B7280",
    bg:       "#F3F4F6",
    border:   "#D1D5DB",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function apiToUi(tasks: EisenhowerTask[]): UiTask[] {
  return tasks.map((t) => ({
    id:      t.taskId,
    text:    t.title,
    done:    t.status === "COMPLETED",
    fromApi: true,
  }));
}

function emptyBoard(): BoardState {
  return { DO_NOW: [], SCHEDULE: [], DELAY_OR_DELEGATE: [], ELIMINATE: [] };
}

function boardFromResponse(data: EisenhowerBoardResponse): BoardState {
  return {
    DO_NOW:             apiToUi(data.DO_NOW             ?? []),
    SCHEDULE:           apiToUi(data.SCHEDULE           ?? []),
    DELAY_OR_DELEGATE:  apiToUi(data.DELAY_OR_DELEGATE  ?? []),
    ELIMINATE:          apiToUi(data.ELIMINATE          ?? []),
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TaskMatrix() {
  // ── Workspace selector state ────────────────────────────────────────────────
  const [workspaces,           setWorkspaces]           = useState<WorkspaceResponse[]>([]);
  const [selectedWorkspaceId,  setSelectedWorkspaceId]  = useState<string>("");
  const [workspacesLoading,    setWorkspacesLoading]    = useState(true);

  // ── Board state ─────────────────────────────────────────────────────────────
  const [board,        setBoard]        = useState<BoardState>(emptyBoard());
  const [draft,        setDraft]        = useState<Record<QuadrantKey, string>>({
    DO_NOW: "", SCHEDULE: "", DELAY_OR_DELEGATE: "", ELIMINATE: "",
  });
  const [boardLoading, setBoardLoading] = useState(false);
  const [refreshKey,   setRefreshKey]   = useState(0);

  // ── Effect 1: load workspace list once on mount ─────────────────────────────

  useEffect(() => {
    let mounted = true;

    const loadWorkspaces = async () => {
      try {
        const list = await getMyWorkspaces();
        if (!mounted) return;

        setWorkspaces(list);
        // Initialise selector with the first workspace
        if (list.length > 0) {
          setSelectedWorkspaceId(list[0].workspaceId);
        }
      } catch (err) {
        if (!mounted) return;
        console.warn("[TaskMatrix] failed to load workspaces:", err);
        toast.error("Không thể tải danh sách workspace.");
      } finally {
        if (mounted) setWorkspacesLoading(false);
      }
    };

    loadWorkspaces();
    return () => { mounted = false; };
  }, []);

  // ── Effect 2: fetch board when workspace or refreshKey changes ─────────────

  useEffect(() => {
    if (!selectedWorkspaceId) return;

    console.log(
      "[TaskMatrix] dispatching workspace ID:",
      selectedWorkspaceId,
      "| length:", selectedWorkspaceId.length,
      "| valid UUID:", /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedWorkspaceId),
    );

    let mounted = true;

    const run = async () => {
      setBoardLoading(true);
      setBoard(emptyBoard());
      try {
        const data = await getEisenhowerTasks(selectedWorkspaceId);
        if (mounted) setBoard(boardFromResponse(data));
      } catch (err) {
        if (!mounted) return;
        console.error("[TaskMatrix] failed to fetch Eisenhower tasks:", err);
        toast.error("Không thể tải dữ liệu ma trận công việc.");
        setBoard(emptyBoard());
      } finally {
        if (mounted) setBoardLoading(false);
      }
    };

    run();
    return () => { mounted = false; };
  }, [selectedWorkspaceId, refreshKey]);

  // ── Live interactions ────────────────────────────────────────────────────────

  async function toggleTask(quadrant: QuadrantKey, id: string) {
    const task = board[quadrant]?.find((t) => t.id === id);
    if (!task || !selectedWorkspaceId) return;

    const newStatus = task.done ? "IN_PROGRESS" : "COMPLETED";

    // Optimistic update so the UI feels instant
    setBoard((prev) => ({
      ...prev,
      [quadrant]: prev[quadrant].map((t) =>
        t.id === id ? { ...t, done: !t.done } : t,
      ),
    }));

    try {
      await updateCalendarTaskStatus(selectedWorkspaceId, id, { status: newStatus });
    } catch (err) {
      // Revert on failure
      setBoard((prev) => ({
        ...prev,
        [quadrant]: prev[quadrant].map((t) =>
          t.id === id ? { ...t, done: task.done } : t,
        ),
      }));
      console.error("[TaskMatrix] toggleTask failed:", err);
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
    } catch (err) {
      console.error("[TaskMatrix] addTask failed:", err);
      toast.error("Không thể thêm tác vụ mới.");
      setDraft((prev) => ({ ...prev, [quadrant]: text })); // restore draft on failure
    }
  }

  // ── Derived values ────────────────────────────────────────────────────────────

  const selectedWorkspace = workspaces.find((w) => w.workspaceId === selectedWorkspaceId);

  const totals = useMemo(() => {
    const all  = Object.values(board).flat();
    const done = all.filter((t) => t.done).length;
    return { total: all.length, done };
  }, [board]);

  const isLoading = workspacesLoading || boardLoading;

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{ fontFamily: F, maxWidth: "1280px", margin: "0 auto" }}
    >
      {/* ── Header bar ── */}
      <div style={{
        background: WH, border: `1px solid ${BDR}`,
        borderRadius: "16px", padding: "16px 18px",
        marginBottom: "14px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"12px", flexWrap:"wrap" }}>

          {/* Title + icon */}
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <div style={{
              width:"34px", height:"34px", borderRadius:"10px",
              background:"#FEF2F2", border:"1px solid #FECACA",
              display:"flex", alignItems:"center", justifyContent:"center",
              flexShrink:0,
            }}>
              <AlertTriangle size={16} color="#DC2626" />
            </div>
            <div>
              <h1 style={{ fontSize:"1.06rem", fontWeight:800, color:T1, lineHeight:1.1 }}>
                Ma trận công việc
              </h1>
              <p style={{ fontSize:"0.74rem", color:T2, marginTop:"3px" }}>
                Sắp xếp ưu tiên theo độ khẩn cấp và mức độ ảnh hưởng
              </p>
            </div>
          </div>

          {/* Right side: workspace selector + totals badge */}
          <div style={{ display:"flex", alignItems:"center", gap:"10px", flexWrap:"wrap" }}>

            {/* ── Workspace dropdown ── */}
            {!workspacesLoading && workspaces.length > 0 && (
              <div style={{ position:"relative" }}>
                <select
                  value={selectedWorkspaceId}
                  onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                  disabled={boardLoading}
                  style={{
                    appearance:"none",
                    paddingLeft:"12px",
                    paddingRight:"32px",
                    paddingTop:"8px",
                    paddingBottom:"8px",
                    borderRadius:"10px",
                    border:`1.5px solid ${BDR}`,
                    background: boardLoading ? "#F9FAFB" : WH,
                    color: T1,
                    fontSize:"0.8rem",
                    fontFamily: F,
                    fontWeight:600,
                    cursor: boardLoading ? "not-allowed" : "pointer",
                    outline:"none",
                    transition:"border-color 0.15s",
                    minWidth:"180px",
                    maxWidth:"260px",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = OG; }}
                  onBlur={(e)  => { e.target.style.borderColor = BDR; }}
                >
                  {workspaces.map((ws) => (
                    <option key={ws.workspaceId} value={ws.workspaceId}>
                      {ws.name}
                    </option>
                  ))}
                </select>
                {/* Custom chevron overlay */}
                <ChevronDown
                  size={14}
                  color={T3}
                  style={{
                    position:"absolute", right:"10px", top:"50%",
                    transform:"translateY(-50%)", pointerEvents:"none",
                  }}
                />
              </div>
            )}

            {/* Totals badge */}
            <div style={{
              display:"inline-flex", alignItems:"center", gap:"6px",
              padding:"7px 11px", borderRadius:"9px",
              background:"rgba(255,107,0,0.08)", border:"1px solid rgba(255,107,0,0.2)",
              flexShrink:0,
            }}>
              <Sparkles size={12} color={OG}/>
              <span style={{ fontSize:"0.72rem", color:OG, fontWeight:800 }}>
                {totals.done}/{totals.total} đã hoàn thành
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Loading state ── */}
      {isLoading && (
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"center",
          gap:"10px", padding:"48px 0", color:T3,
        }}>
          <Loader2 size={20} className="animate-spin" />
          <span style={{ fontSize:"0.875rem", fontFamily:F }}>Đang tải dữ liệu...</span>
        </div>
      )}

      {/* ── No workspaces ── */}
      {!workspacesLoading && workspaces.length === 0 && (
        <div style={{
          background:WH, border:`1px solid ${BDR}`, borderRadius:"16px",
          padding:"48px 24px", textAlign:"center",
        }}>
          <p style={{ fontSize:"0.9rem", color:T2, fontFamily:F }}>
            Bạn chưa có workspace nào. Hãy tạo workspace để bắt đầu sắp xếp công việc.
          </p>
        </div>
      )}

      {/* ── 2×2 Quadrant grid ── */}
      {!isLoading && selectedWorkspace && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {QUADRANTS.map((q) => (
            <div
              key={q.key}
              style={{
                background: WH,
                border: `1px solid ${BDR}`,
                borderRadius: "16px",
                padding: "14px",
                minHeight: "300px",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}
            >
              {/* Quadrant header */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"10px" }}>
                <div>
                  <h3 style={{ fontSize:"0.92rem", fontWeight:800, color:q.accent }}>{q.title}</h3>
                  <p style={{ fontSize:"0.7rem", color:T3, marginTop:"2px" }}>{q.subtitle}</p>
                </div>
                <span style={{
                  padding:"2px 8px", borderRadius:"999px",
                  fontSize:"0.66rem", fontWeight:800,
                  color:q.accent, background:q.bg, border:`1px solid ${q.border}`,
                }}>
                  {board[q.key]?.length ?? 0}
                </span>
              </div>

              {/* Task list */}
              <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"8px", overflowY:"auto", paddingRight:"2px" }}>
                {(board[q.key]?.length ?? 0) === 0 && (
                  <p style={{ fontSize:"0.78rem", color:T3, fontFamily:F, textAlign:"center", paddingTop:"24px" }}>
                    Không có tác vụ
                  </p>
                )}
                {board[q.key]?.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      display:"flex", alignItems:"flex-start", gap:"8px",
                      padding:"9px 10px", borderRadius:"10px",
                      border:`1px solid ${BDR}`,
                      background: task.done ? BG : WH,
                    }}
                  >
                    <button
                      onClick={() => toggleTask(q.key, task.id)}
                      style={{ background:"transparent", border:"none", padding:0, cursor:"pointer", marginTop:"1px", flexShrink:0 }}
                    >
                      {task.done
                        ? <CheckCircle2 size={16} color="#22C55E" />
                        : <Circle size={16} color={T3} />}
                    </button>
                    <p style={{
                      fontSize:"0.8rem", color: task.done ? T3 : T1,
                      textDecoration: task.done ? "line-through" : "none",
                      lineHeight:1.4,
                    }}>
                      {task.text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Add-task row */}
              <div style={{ marginTop:"10px", display:"flex", gap:"8px" }}>
                <input
                  value={draft[q.key]}
                  onChange={(e) => setDraft((prev) => ({ ...prev, [q.key]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addTask(q.key)}
                  placeholder="Thêm tác vụ mới..."
                  style={{
                    flex:1, padding:"9px 10px", borderRadius:"10px",
                    border:`1px solid ${BDR}`, background:WH,
                    color:T1, fontSize:"0.78rem", outline:"none",
                    fontFamily:F,
                  }}
                />
                <button
                  onClick={() => addTask(q.key)}
                  style={{
                    width:"36px", borderRadius:"10px", border:"none",
                    background:`linear-gradient(135deg, ${OG}, #FF8C3A)`,
                    color:WH, cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    flexShrink:0,
                  }}
                >
                  <Plus size={15}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

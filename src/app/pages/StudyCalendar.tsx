import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { CalendarDays, ChevronLeft, ChevronRight, ClipboardList, Clock, LoaderCircle, RefreshCw, Sparkles, Check } from "lucide-react";
import AIScheduleModal from "../components/AIScheduleModal";
import workspaceService, { type WorkspaceResponse } from "../../api/workspaceService";
import calendarService, { type CalendarTaskResponse, type GenerateCalendarRequest, type WeekDay } from "../../api/calendarService";
import { useRoadmap } from "../hooks/useRoadmap";
import { useCurrentDate } from "../hooks/useCurrentDate";
import { useNavigate } from "react-router";

const F = "'Plus Jakarta Sans', Inter, sans-serif";
const WH = "#FFFFFF";
const BG = "#F8FAFC";
const OG = "#FF6B00";
const T1 = "#111827";
const T2 = "#6B7280";
const T3 = "#9CA3AF";
const BDR = "#E5E7EB";

type CalendarTaskMap = Record<string, CalendarTaskResponse[]>;

const DAY_LABELS: Record<string, WeekDay> = {
  mon: "MONDAY",
  tue: "TUESDAY",
  wed: "WEDNESDAY",
  thu: "THURSDAY",
  fri: "FRIDAY",
  sat: "SATURDAY",
  sun: "SUNDAY",
};

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isFutureTaskDate(taskDate: string | null | undefined, todayKey: string) {
  if (!taskDate) {
    return false;
  }

  return taskDate.slice(0, 10) > todayKey;
}

function toReadableTime(value?: string | null) {
  if (!value) return "--:--";
  return value.slice(0, 5);
}

function parseSlotHour(slot: { start?: string; end?: string } | undefined): string | null {
  if (!slot?.start) {
    return null;
  }

  const raw = slot.start.trim().toLowerCase();
  const parsed = Number(raw.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(parsed)) {
    return null;
  }

  const suffix = raw.includes("pm") && parsed < 12 ? 12 : 0;
  const hour = Math.max(0, Math.min(23, Math.floor(parsed) + suffix));
  return `${String(hour).padStart(2, "0")}:00`;
}

function mapWorkspace(workspace: WorkspaceResponse): WorkspaceResponse {
  return workspace;
}

export default function StudyCalendar() {
  const navigate = useNavigate();
  const { currentDate, day } = useCurrentDate();
  const [cursor, setCursor] = useState(() => currentDate);
  const [selectedDay, setSelectedDay] = useState(() => day);
  const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [calendarTasks, setCalendarTasks] = useState<CalendarTaskResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const { roadmapData, isLoading: roadmapLoading, error: roadmapError } = useRoadmap(selectedWorkspaceId);

  const reloadCalendarTasks = async () => {
    if (!selectedWorkspaceId) {
      setCalendarTasks([]);
      return;
    }

    setLoadingTasks(true);
    setError(null);

    try {
      const tasks = await calendarService.getCalendarTasks(selectedWorkspaceId);
      setCalendarTasks(tasks);
    } catch (err: any) {
      setCalendarTasks([]);
      setError(err?.message || "Không thể tải lịch học");
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadWorkspaces = async () => {
      setLoadingWorkspaces(true);
      try {
        const response = await workspaceService.getMyWorkspaces();
        if (!mounted) return;

        const mapped = response.map(mapWorkspace);
        setWorkspaces(mapped);
        setSelectedWorkspaceId(current => current || mapped[0]?.workspaceId || "");
      } catch (err: any) {
        if (!mounted) return;
        setWorkspaces([]);
        setError(err?.message || "Không thể tải danh sách workspace");
      } finally {
        if (mounted) {
          setLoadingWorkspaces(false);
        }
      }
    };

    void loadWorkspaces();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadTasks = async () => {
      if (!selectedWorkspaceId) {
        if (mounted) {
          setCalendarTasks([]);
        }
        return;
      }

      await reloadCalendarTasks();
    };

    void loadTasks();
    return () => {
      mounted = false;
    };
  }, [selectedWorkspaceId]);

  const cursorYear = cursor.getFullYear();
  const cursorMonth = cursor.getMonth();
  const firstWeekDay = new Date(cursorYear, cursorMonth, 1).getDay();
  const daysInMonth = new Date(cursorYear, cursorMonth + 1, 0).getDate();
  const monthLabel = cursor.toLocaleString("vi-VN", { month: "long", year: "numeric" });

  const cells = useMemo(() => {
    const data: (number | null)[] = [...Array(firstWeekDay).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
    while (data.length % 7 !== 0) data.push(null);
    return data;
  }, [daysInMonth, firstWeekDay]);

  const tasksByDay = useMemo<CalendarTaskMap>(() => {
    return calendarTasks.reduce<CalendarTaskMap>((accumulator, task) => {
      const key = task.taskDate ? String(task.taskDate).slice(0, 10) : "unknown";
      accumulator[key] = accumulator[key] || [];
      accumulator[key].push(task);
      return accumulator;
    }, {});
  }, [calendarTasks]);

  const selectedKey = toDateKey(new Date(cursorYear, cursorMonth, selectedDay));
  const selectedTasks = tasksByDay[selectedKey] ?? [];
  const selectedWorkspace = workspaces.find(item => item.workspaceId === selectedWorkspaceId) ?? null;
  const hasRoadmap = Boolean(roadmapData?.steps?.length);
  const canGenerateCalendar = Boolean(selectedWorkspaceId) && hasRoadmap && !roadmapLoading;
  const todayKey = toDateKey(new Date());

  const totalCompleted = calendarTasks.filter(task => String(task.status || "").toUpperCase() === "COMPLETED").length;

  const handleCompleteTask = async (taskId: string) => {
    if (!selectedWorkspaceId || !taskId || completingTaskId) {
      return;
    }

    setCompletingTaskId(taskId);
    setError(null);

    try {
      await calendarService.completeCalendarTask(taskId);
      await reloadCalendarTasks();
    } catch (err: any) {
      setError(err?.message || "Không thể đánh dấu task đã hoàn thành");
    } finally {
      setCompletingTaskId(null);
    }
  };

  const shiftMonth = (offset: number) => {
    const next = new Date(cursorYear, cursorMonth + offset, 1);
    setCursor(next);
    setSelectedDay(1);
  };

  const handleGenerateSchedule = async (config: any) => {
    if (!selectedWorkspaceId) {
      setError("Chưa chọn workspace");
      return;
    }

    if (!hasRoadmap) {
      setError("Cần tạo roadmap trước khi sinh lịch học");
      return;
    }

    const request: GenerateCalendarRequest = {
      startDate: config?.dateRange?.start || selectedKey,
      studyDays: Array.isArray(config?.availableDays)
        ? config.availableDays.map((dayId: string) => DAY_LABELS[dayId]).filter(Boolean)
        : undefined,
      dailyStartTime: parseSlotHour(config?.timeSlots?.[0]) || "09:00",
      sessionMinutes: config?.duration || 60,
      sessionsPerDay: Math.max(1, config?.timeSlots?.length || 1),
      includeReviewSessions: config?.goal === "full-roadmap",
    };

    setSavingSchedule(true);
    setError(null);

    try {
      const response = await calendarService.generateCalendarSchedule(selectedWorkspaceId, request);
      setCalendarTasks(response.tasks || []);
      setScheduleModalOpen(false);
    } catch (err: any) {
      setError(err?.message || "Không thể tạo lịch học");
    } finally {
      setSavingSchedule(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} style={{ fontFamily: F }}>
      <div style={{ background: WH, border: `1px solid ${BDR}`, borderRadius: "16px", padding: "16px 18px", marginBottom: "14px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: "1.06rem", fontWeight: 800, color: T1, lineHeight: 1.1 }}>Lịch học tập</h1>
            <p style={{ fontSize: "0.74rem", color: T2, marginTop: "3px" }}>Theo dõi lịch học của bạn theo từng workspace</p>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <select
              value={selectedWorkspaceId}
              onChange={e => setSelectedWorkspaceId(e.target.value)}
              style={{ padding: "7px 10px", borderRadius: "9px", border: `1px solid ${BDR}`, background: WH, color: T1, fontSize: "0.76rem", minWidth: "220px" }}
            >
              {workspaces.length === 0 && <option value="">Chưa có workspace</option>}
              {workspaces.map(workspace => (
                <option key={workspace.workspaceId} value={workspace.workspaceId}>{workspace.name}</option>
              ))}
            </select>

            <button
              onClick={() => setScheduleModalOpen(true)}
              disabled={!canGenerateCalendar || savingSchedule}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 12px",
                borderRadius: "9px",
                border: "none",
                background: `linear-gradient(135deg, ${OG}, #FF8C3A)`,
                color: "#fff",
                cursor: canGenerateCalendar ? "pointer" : "not-allowed",
                opacity: canGenerateCalendar ? 1 : 0.6,
                fontWeight: 700,
                fontSize: "0.75rem",
                boxShadow: "0 2px 8px rgba(255, 107, 0, 0.3)",
              }}
            >
              {savingSchedule ? <LoaderCircle size={12} className="animate-spin" /> : <Sparkles size={12} />}
              AI soạn lịch
            </button>

            <button
              onClick={() => void reloadCalendarTasks()}
              disabled={!selectedWorkspaceId}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 12px",
                borderRadius: "9px",
                border: `1px solid ${BDR}`,
                background: WH,
                color: T1,
                cursor: selectedWorkspaceId ? "pointer" : "not-allowed",
                fontWeight: 700,
                fontSize: "0.75rem",
              }}
            >
              <RefreshCw size={12} />
              Làm mới
            </button>
          </div>
        </div>

        {!roadmapLoading && selectedWorkspaceId && !hasRoadmap && (
          <div style={{ marginTop: "12px", padding: "12px 14px", borderRadius: "12px", border: "1px solid #FED7AA", background: "#FFF7ED", color: "#9A3412", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
            <div>
              <p style={{ fontSize: "0.8rem", fontWeight: 800 }}>Bạn cần tạo roadmap trước khi lên lịch học</p>
              <p style={{ fontSize: "0.72rem", marginTop: "3px", color: "#B45309" }}>Hãy mở roadmap để hoàn tất lộ trình, rồi quay lại bấm AI soạn lịch.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/app/workspaces/${selectedWorkspaceId}/roadmap`)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 12px",
                borderRadius: "10px",
                background: "#FFFFFF",
                border: "1px solid #FDBA74",
                color: "#9A3412",
                fontSize: "0.76rem",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Mở roadmap
            </button>
          </div>
        )}

        {roadmapError && hasRoadmap === false && (
          <div style={{ marginTop: "12px", padding: "12px 14px", borderRadius: "12px", border: "1px solid #FECACA", background: "#FEF2F2", color: "#B91C1C", fontSize: "0.8rem" }}>
            Không tải được roadmap hiện tại: {roadmapError}
          </div>
        )}

        {selectedWorkspace && (
          <div style={{ marginTop: "10px", display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.72rem", color: T3 }}>Workspace hiện tại:</span>
            <span style={{ fontSize: "0.74rem", fontWeight: 700, color: OG }}>{selectedWorkspace.name}</span>
            <span style={{ fontSize: "0.72rem", color: T3 }}>•</span>
            <span style={{ fontSize: "0.72rem", color: T3 }}>{calendarTasks.length} task</span>
            <span style={{ fontSize: "0.72rem", color: T3 }}>•</span>
            <span style={{ fontSize: "0.72rem", color: T3 }}>{totalCompleted} hoàn thành</span>
            <span style={{ fontSize: "0.72rem", color: T3 }}>•</span>
            <span style={{ fontSize: "0.72rem", color: hasRoadmap ? "#059669" : "#B91C1C", fontWeight: 700 }}>{hasRoadmap ? "Roadmap sẵn sàng" : "Chưa có roadmap"}</span>
          </div>
        )}
      </div>

      {error && (
        <div style={{ marginBottom: "14px", padding: "12px 14px", borderRadius: "12px", border: "1px solid #FECACA", background: "#FEF2F2", color: "#B91C1C", fontSize: "0.8rem" }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "14px", alignItems: "start" }}>
        <div style={{ background: WH, border: `1px solid ${BDR}`, borderRadius: "16px", padding: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button onClick={() => shiftMonth(-1)} style={{ width: "28px", height: "28px", borderRadius: "8px", border: `1px solid ${BDR}`, background: WH, cursor: "pointer", color: T2 }}><ChevronLeft size={14} /></button>
              <button onClick={() => shiftMonth(1)} style={{ width: "28px", height: "28px", borderRadius: "8px", border: `1px solid ${BDR}`, background: WH, cursor: "pointer", color: T2 }}><ChevronRight size={14} /></button>
              <span style={{ fontSize: "0.84rem", fontWeight: 700, color: T1 }}>{monthLabel}</span>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 10px", borderRadius: "9px", background: "rgba(255,107,0,0.08)", border: "1px solid rgba(255,107,0,0.2)" }}>
              <CalendarDays size={12} color={OG} />
              <span style={{ fontSize: "0.72rem", color: OG, fontWeight: 800 }}>{loadingTasks ? "Đang tải" : `${calendarTasks.length} task`}</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "6px", marginBottom: "6px" }}>
            {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map(label => (
              <div key={label} style={{ textAlign: "center", fontSize: "0.64rem", color: T3, fontWeight: 700 }}>{label}</div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "6px" }}>
            {cells.map((dayCell, index) => {
              if (!dayCell) {
                return <div key={index} style={{ height: "72px", borderRadius: "10px", background: BG, border: `1px solid ${BDR}` }} />;
              }

              const key = toDateKey(new Date(cursorYear, cursorMonth, dayCell));
              const dayTasks = tasksByDay[key] ?? [];
              const count = dayTasks.length;
              const selected = dayCell === selectedDay;

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDay(dayCell)}
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
                  <span style={{ fontSize: "0.76rem", fontWeight: 700, color: selected ? OG : T1 }}>{dayCell}</span>
                  {count > 0 ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "center", width: "100%", marginTop: "2px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "22px", height: "22px", borderRadius: "8px", background: selected ? "rgba(255,107,0,0.14)" : "#FFF3E8", border: `1px solid ${selected ? "rgba(255,107,0,0.28)" : "#FDBA74"}`, color: OG, boxShadow: selected ? "0 2px 6px rgba(255,107,0,0.14)" : "none" }}>
                        <ClipboardList size={12} strokeWidth={2.5} />
                      </span>
                    </div>
                  ) : (
                    <span style={{ fontSize: "0.62rem", color: T3 }}>Không có task</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ background: WH, border: `1px solid ${BDR}`, borderRadius: "16px", padding: "14px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", position: "sticky", top: "14px" }}>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 800, color: T1 }}>Kế hoạch trong ngày</h3>
          <p style={{ fontSize: "0.68rem", color: T3, marginTop: "3px", marginBottom: "10px" }}>{selectedKey}</p>

          <div style={{ display: "flex", flexDirection: "column", gap: "7px", maxHeight: "420px", overflowY: "auto" }}>
            {loadingTasks && (
              <div style={{ padding: "12px", borderRadius: "10px", border: `1px solid ${BDR}`, color: T2, fontSize: "0.74rem", textAlign: "center" }}>
                Đang tải lịch học...
              </div>
            )}

            {!loadingTasks && selectedTasks.length === 0 && (
              <div style={{ padding: "12px", borderRadius: "10px", border: `1px dashed ${BDR}`, color: T3, fontSize: "0.74rem", textAlign: "center" }}>
                Chưa có task cho ngày này
              </div>
            )}

            {selectedTasks.map(task => {
              const done = String(task.status || "").toUpperCase() === "COMPLETED";
              const futureTask = isFutureTaskDate(task.taskDate, todayKey);

              return (
                <div key={task.taskId} style={{ padding: "9px 10px", borderRadius: "10px", border: `1px solid ${BDR}`, background: done ? BG : WH }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                    <div style={{ marginTop: "1px" }}>
                      {done ? <Check size={14} color="#22C55E" /> : <div style={{ width: "14px", height: "14px", border: `2px solid ${T3}`, borderRadius: "50%" }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.78rem", color: done ? T3 : T1, fontWeight: 600, textDecoration: done ? "line-through" : "none" }}>{task.title}</p>
                      <div style={{ marginTop: "4px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                        <Clock size={10} color={T3} />
                        <span style={{ fontSize: "0.66rem", color: T3 }}>{toReadableTime(task.startTime)} - {toReadableTime(task.endTime)}</span>
                        <span style={{ fontSize: "0.66rem", color: OG, fontWeight: 700 }}>{task.durationMinutes || 0}p</span>
                        <span style={{ fontSize: "0.66rem", color: done ? "#059669" : T2, fontWeight: 700 }}>{done ? "COMPLETED" : (task.status || "PENDING")}</span>
                        {!done && (
                          <button
                            type="button"
                            onClick={() => void handleCompleteTask(task.taskId)}
                            disabled={completingTaskId === task.taskId || futureTask}
                            title={futureTask ? "Chưa đến ngày học" : undefined}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "6px 10px",
                              borderRadius: "999px",
                              border: "1px solid #BBF7D0",
                              background: completingTaskId === task.taskId ? "#DCFCE7" : "#ECFDF5",
                              color: "#047857",
                              cursor: completingTaskId === task.taskId ? "not-allowed" : "pointer",
                              fontSize: "0.66rem",
                              fontWeight: 800,
                            }}
                            className={futureTask ? "opacity-50 cursor-not-allowed" : "transition hover:brightness-95"}
                          >
                            {completingTaskId === task.taskId ? <LoaderCircle size={10} className="animate-spin" /> : <Check size={10} />}
                            Hoàn thành
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <AIScheduleModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        onConfirm={handleGenerateSchedule}
        subjectTitle={selectedWorkspace?.name || "Kế hoạch học tập"}
        currentPhase={1}
      />
    </motion.div>
  );
}
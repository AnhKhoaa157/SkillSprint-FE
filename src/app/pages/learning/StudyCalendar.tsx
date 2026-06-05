import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { CalendarDays, ChevronLeft, ChevronRight, ClipboardList, Clock, LoaderCircle, RefreshCw, Sparkles, Check, PlayCircle } from "lucide-react";
import AIScheduleModal from "../../components/modals/AIScheduleModal";
import useOnboardingProfile from "../../hooks/useOnboardingProfile";
import workspaceService, { type WorkspaceResponse } from "../../../api/workspaceService";
import calendarService, { type CalendarTaskResponse, type GenerateCalendarRequest, type WeekDay } from "../../../api/calendarService";
import { useRoadmap } from "../../hooks/useRoadmap";
import { useCurrentDate } from "../../hooks/useCurrentDate";
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

type ScheduleSeedConfig = {
  dateRange: { start: string; end: string };
  availableDays: string[];
  timeSlots: { start: string; end: string }[];
  duration: number | null;
  goal: "current-step" | "full-roadmap" | null;
};

type OnboardingScheduleProfile = {
  targetDeadline?: string | null;
  preferredDays?: string[] | null;
  preferredTimeSlots?: string[] | null;
  studyHoursPerWeek?: number | null;
};

type ScheduleModalConfig = {
  dateRange: { start: string; end: string } | null;
  availableDays: string[];
  timeSlots: { start: string; end: string }[];
  duration: number | null;
  goal: "current-step" | "full-roadmap" | null;
};

const DAY_LABELS: Record<string, WeekDay> = {
  mon: "MONDAY",
  tue: "TUESDAY",
  wed: "WEDNESDAY",
  thu: "THURSDAY",
  fri: "FRIDAY",
  sat: "SATURDAY",
  sun: "SUNDAY",
};

const WEEKDAY_TO_DAY_ID = Object.entries(DAY_LABELS).reduce<Record<WeekDay, string>>((accumulator, [dayId, weekday]) => {
  accumulator[weekday] = dayId;
  return accumulator;
}, {} as Record<WeekDay, string>);

const DEFAULT_DAY_IDS = ["mon", "tue", "wed", "thu", "fri"];

function normalizeDayId(value: string) {
  const normalized = value.trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(DAY_LABELS, normalized) ? normalized : null;
}

function normalizeTimeToken(token: string) {
  const trimmed = token.trim().toLowerCase();
  const match = trimmed.match(/^(\d{1,2})(?::\d{2})?\s*(am|pm)?$/i);

  if (!match) {
    return trimmed;
  }

  const hour = Number(match[1]);
  const suffix = match[2]?.toLowerCase() ?? "";

  if (!Number.isFinite(hour)) {
    return trimmed;
  }

  return `${hour}${suffix}`;
}

function parsePreferredTimeSlot(value: string) {
  const [start, end] = value.split("-").map(part => part.trim());

  if (!start || !end) {
    return null;
  }

  return {
    start: normalizeTimeToken(start),
    end: normalizeTimeToken(end),
  };
}

function createFallbackScheduleSeed(): ScheduleSeedConfig {
  const today = toDateKey(new Date());
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);

  return {
    dateRange: {
      start: today,
      end: toDateKey(endDate),
    },
    availableDays: DEFAULT_DAY_IDS,
    timeSlots: [{ start: "9", end: "10" }],
    duration: 60,
    goal: "full-roadmap",
  };
}

function createScheduleSeedFromProfile(profile?: OnboardingScheduleProfile | null): ScheduleSeedConfig {
  const fallback = createFallbackScheduleSeed();
  const today = fallback.dateRange.start;
  const targetDeadlineDate = profile?.targetDeadline ? new Date(profile.targetDeadline) : null;
  const endDate = targetDeadlineDate && !Number.isNaN(targetDeadlineDate.getTime()) ? toDateKey(targetDeadlineDate) : fallback.dateRange.end;
  const preferredDays = profile?.preferredDays?.length
    ? profile.preferredDays
        .map(day => WEEKDAY_TO_DAY_ID[day.toUpperCase() as WeekDay] ?? normalizeDayId(day))
        .filter((dayId): dayId is string => Boolean(dayId))
    : fallback.availableDays;
  const preferredTimeSlots = profile?.preferredTimeSlots?.length
    ? profile.preferredTimeSlots
        .map(parsePreferredTimeSlot)
        .filter((slot): slot is { start: string; end: string } => Boolean(slot))
    : fallback.timeSlots;

  return {
    dateRange: {
      start: today,
      end: endDate,
    },
    availableDays: preferredDays.length > 0 ? preferredDays : fallback.availableDays,
    timeSlots: preferredTimeSlots.length > 0 ? preferredTimeSlots : fallback.timeSlots,
    duration: profile?.studyHoursPerWeek ? Math.max(30, Math.min(120, Math.round((profile.studyHoursPerWeek * 60) / Math.max(1, preferredDays.length || 1)))) : fallback.duration,
    goal: "full-roadmap",
  };
}

function buildCalendarRequest(seed: ScheduleSeedConfig): GenerateCalendarRequest {
  const studyDays = seed.availableDays
    .map(dayId => DAY_LABELS[dayId])
    .filter((day): day is WeekDay => Boolean(day));

  return {
    startDate: seed.dateRange.start,
    endDate: seed.dateRange.end,
    studyDays: studyDays.length > 0 ? studyDays : ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
    dailyStartTime: parseSlotHour(seed.timeSlots[0]) || "09:00",
    sessionMinutes: seed.duration || 60,
    sessionsPerDay: Math.max(1, seed.timeSlots.length || 1),
    includeReviewSessions: seed.goal === "full-roadmap",
  };
}

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
  const [calendarTasks, setCalendarTasks] = useState<CalendarTaskResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [lastScheduleSeed, setLastScheduleSeed] = useState<ScheduleSeedConfig | null>(null);
  const { profile: onboardingProfile, fetchOnboardingProfile } = useOnboardingProfile(selectedWorkspaceId);
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

  useEffect(() => {
    if (!selectedWorkspaceId) {
      return;
    }

    void fetchOnboardingProfile();
  }, [fetchOnboardingProfile, selectedWorkspaceId]);

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

  const hasExistingCalendar = Boolean(calendarTasks && calendarTasks.length > 0);
  const selectedKey = toDateKey(new Date(cursorYear, cursorMonth, selectedDay));
  const selectedTasks = tasksByDay[selectedKey] ?? [];
  const selectedWorkspace = workspaces.find(item => item.workspaceId === selectedWorkspaceId) ?? null;
  const hasRoadmap = Boolean(roadmapData?.steps?.length);
  const canGenerateCalendar = Boolean(selectedWorkspaceId) && hasRoadmap && !roadmapLoading;
  const todayKey = toDateKey(new Date());
  const scheduleSeed = useMemo(
    () => lastScheduleSeed ?? createScheduleSeedFromProfile(onboardingProfile as OnboardingScheduleProfile | null),
    [lastScheduleSeed, onboardingProfile],
  );

  const totalCompleted = calendarTasks.filter(task => String(task.status || "").toUpperCase() === "COMPLETED").length;

  const openStudySession = (taskId: string) => {
    if (!taskId) {
      return;
    }

    navigate("/app/learning/course", {
      state: { taskId },
    });
  };

  const shiftMonth = (offset: number) => {
    const next = new Date(cursorYear, cursorMonth + offset, 1);
    setCursor(next);
    setSelectedDay(1);
  };

  const executeCalendarGeneration = async (seed: ScheduleSeedConfig) => {
    if (!selectedWorkspaceId) {
      setError("Chưa chọn workspace");
      return;
    }

    if (!hasRoadmap) {
      setError("Cần tạo roadmap trước khi sinh lịch học");
      return;
    }

    const request = buildCalendarRequest(seed);

    setSavingSchedule(true);
    setError(null);
    setLastScheduleSeed(seed);

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

  const handleGenerateSchedule = async (config: ScheduleModalConfig) => {
    const normalizedSeed: ScheduleSeedConfig = {
      dateRange: config.dateRange ?? scheduleSeed.dateRange,
      availableDays: config.availableDays.length > 0 ? config.availableDays : scheduleSeed.availableDays,
      timeSlots: config.timeSlots.length > 0 ? config.timeSlots : scheduleSeed.timeSlots,
      duration: config.duration ?? scheduleSeed.duration,
      goal: config.goal ?? scheduleSeed.goal,
    };

    await executeCalendarGeneration(normalizedSeed);
  };

  const handleAutoGenerate = async () => {
    await executeCalendarGeneration(createScheduleSeedFromProfile(onboardingProfile as OnboardingScheduleProfile | null));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="relative min-h-[calc(100vh-2rem)] overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute left-[-10%] top-[-10%] -z-10 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-[#FF7E21]/5 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute right-[-10%] bottom-[-10%] -z-10 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-amber-400/5 to-transparent blur-[130px] pointer-events-none" />

      {/* Premium Light Header Banner */}
      <div className="relative mb-6 flex flex-col justify-between gap-6 overflow-hidden rounded-[2rem] border border-amber-200/40 bg-gradient-to-br from-white via-[#FCFAF5] to-[#F8F5EE] p-6 shadow-[0_4px_24px_-4px_rgba(255,126,33,0.04),0_1px_4px_rgba(0,0,0,0.02)] sm:flex-row sm:items-center sm:p-8">
        <div className="absolute -left-20 -top-20 h-48 w-48 rounded-full bg-[#FF7E21]/5 blur-[80px]" />
        
        <div className="relative space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#FF7E21]/10 to-[#FFD29D]/10 border border-[#FF7E21]/20 px-3.5 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-[#FF7E21]">
            <CalendarDays className="h-3.5 w-3.5" />
            Lịch học tập
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800">Lịch học cá nhân</h2>
          <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-500/90 font-medium">
            Theo dõi, tự động hóa và sắp xếp thời gian biểu học tập thông minh dựa trên lộ trình AI.
          </p>
        </div>

        <div className="relative flex flex-wrap items-center gap-3">
          <select
            value={selectedWorkspaceId}
            onChange={e => setSelectedWorkspaceId(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#FF7E21]/60 focus:ring-4 focus:ring-[#FF7E21]/5 min-w-[220px] shadow-sm cursor-pointer"
          >
            {workspaces.length === 0 && <option value="" className="bg-white text-slate-700">Chưa có workspace</option>}
            {workspaces.map(workspace => (
              <option key={workspace.workspaceId} value={workspace.workspaceId} className="bg-white text-slate-700">{workspace.name}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              if (hasExistingCalendar) {
                setScheduleModalOpen(true);
                return;
              }
              void handleAutoGenerate();
            }}
            disabled={savingSchedule || !canGenerateCalendar}
            className={`inline-flex items-center gap-1.5 rounded-2xl px-5 py-3 text-xs font-bold transition-all duration-300 active:scale-[0.98] ${
              hasExistingCalendar
                ? "border border-[#FF7E21]/30 bg-slate-900 text-[#FF8C37] hover:bg-slate-800 hover:shadow-md hover:shadow-[#FF7E21]/5"
                : "bg-gradient-to-r from-[#FF7E21] to-[#FF5E00] text-white shadow-md shadow-orange-500/10 hover:shadow-lg hover:shadow-orange-500/20"
            } ${savingSchedule || (!hasExistingCalendar && !canGenerateCalendar) ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {savingSchedule && !hasExistingCalendar ? <LoaderCircle size={14} className="animate-spin" /> : hasExistingCalendar ? <Check size={14} /> : <Sparkles size={14} />}
            {savingSchedule && !hasExistingCalendar ? "Đang tạo lịch..." : hasExistingCalendar ? "Tùy chỉnh lịch" : "Tạo lịch AI"}
          </button>

          <button
            onClick={() => void reloadCalendarTasks()}
            disabled={!selectedWorkspaceId}
            className={`inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98] ${!selectedWorkspaceId ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <RefreshCw size={14} />
            Làm mới
          </button>
        </div>
      </div>

      {!roadmapLoading && selectedWorkspaceId && !hasRoadmap && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-orange-200 bg-orange-50/60 px-4 py-3.5 text-[#9A3412] backdrop-blur-sm">
          <div>
            <p className="text-sm font-bold">Bạn cần tạo roadmap trước khi lên lịch học</p>
            <p className="text-xs mt-1 text-[#B45309]">Hãy mở roadmap để hoàn tất lộ trình, rồi quay lại bấm AI soạn lịch.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/app/workspaces/${selectedWorkspaceId}/roadmap`)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-orange-300 bg-white px-4 py-2 text-xs font-bold text-[#9A3412] hover:bg-orange-50/55 transition duration-200 cursor-pointer"
          >
            Mở roadmap
          </button>
        </div>
      )}

      {roadmapError && hasRoadmap === false && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
          Không tải được roadmap hiện tại: {roadmapError}
        </div>
      )}

      {selectedWorkspace && (
        <div className="mb-6 flex flex-wrap items-center gap-4 bg-white/70 backdrop-blur-sm border border-slate-200/50 p-4 rounded-2xl shadow-[0_2px_8px_-3px_rgba(15,23,42,0.03)]">
          <div className="flex items-center gap-1.5 rounded-xl border border-orange-100 bg-orange-50/40 px-3 py-1.5 text-xs font-bold text-[#FF7E21]">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">Workspace:</span>
            <span>{selectedWorkspace.name}</span>
          </div>
          
          <div className="flex items-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50/40 px-3 py-1.5 text-xs font-bold text-blue-700">
            <span>{calendarTasks.length} công việc</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-[#E9D5FF] bg-[#FAF5FF] px-3 py-1.5 text-xs font-bold text-purple-700">
            <span>{totalCompleted} hoàn thành</span>
          </div>

          <div className="flex-1" />

          <span className={`font-bold px-3 py-1.5 rounded-xl text-xs border ${hasRoadmap ? "bg-emerald-50/80 border-emerald-200 text-emerald-700" : "bg-rose-50/80 border-rose-200 text-rose-700"}`}>
            {hasRoadmap ? "✓ Lộ trình hoàn chỉnh" : "⚠ Chưa lập lộ trình"}
          </span>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px] items-start">
        {/* Calendar Box */}
        <div className="rounded-[2.5rem] border border-slate-200/80 bg-white/80 backdrop-blur-sm p-6 shadow-[0_20px_50px_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <button onClick={() => shiftMonth(-1)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:text-[#FF7E21] hover:border-[#FF7E21]/20 active:scale-95"><ChevronLeft size={16} /></button>
              <button onClick={() => shiftMonth(1)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:text-[#FF7E21] hover:border-[#FF7E21]/20 active:scale-95"><ChevronRight size={16} /></button>
              <span className="ml-2 text-lg font-black text-slate-800">{monthLabel}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF7ED] border border-[#FFD29D]/60 px-3.5 py-1 text-xs font-bold text-[#FF7E21]">
              <CalendarDays size={14} />
              <span>{loadingTasks ? "Đang tải" : `${calendarTasks.length} nhiệm vụ`}</span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-4">
            {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map(label => (
              <div key={label} className="text-center text-xs font-black uppercase tracking-wider text-slate-400 py-1">{label}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {cells.map((dayCell, index) => {
              if (!dayCell) {
                return <div key={index} className="h-20 rounded-2xl bg-slate-50/30 border border-slate-100/50" />;
              }

              const key = toDateKey(new Date(cursorYear, cursorMonth, dayCell));
              const dayTasks = tasksByDay[key] ?? [];
              const count = dayTasks.length;
              const selected = dayCell === selectedDay;

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDay(dayCell)}
                  className={`relative h-20 rounded-2xl p-3 flex flex-col justify-between items-start transition-all duration-300 border cursor-pointer bg-gradient-to-b from-white to-[#FAF9F6]/50 shadow-sm ${
                    selected 
                      ? "border-2 border-[#FF7E21] bg-gradient-to-br from-[#FFF9F3] to-[#FFEFE0] shadow-md shadow-orange-500/10 scale-102 ring-4 ring-[#FF7E21]/5" 
                      : "border-slate-100 hover:border-slate-300/80 hover:shadow-md hover:bg-slate-50/50"
                  }`}
                >
                  <span className={`text-xs font-black ${selected ? "text-[#FF7E21]" : "text-slate-800"}`}>{dayCell}</span>
                  {count > 0 ? (
                    <div className="flex items-center justify-center w-full">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-lg border text-xs font-black shadow-sm transition-all duration-300 ${
                        selected 
                          ? "bg-[#FF7E21] text-white border-transparent" 
                          : "bg-[#FFF4EB] text-[#FF7E21] border-[#FFD29D]/40"
                      }`}>
                        {count}
                      </span>
                    </div>
                  ) : (
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-200/80 mx-auto mt-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Side Panel: Daily Tasks */}
        <div className="rounded-[2.5rem] border border-slate-200/80 bg-white/90 backdrop-blur-sm p-6 shadow-[0_20px_50px_rgba(15,23,42,0.04)] lg:sticky lg:top-6">
          <h3 className="text-base font-black text-slate-800">Kế hoạch trong ngày</h3>
          <p className="text-[10px] font-bold text-[#FF7E21] mt-1 mb-4 uppercase tracking-wider bg-orange-50 border border-orange-100/40 rounded-lg px-2 py-0.5 inline-block">{selectedKey}</p>

          <div className="flex flex-col gap-3 max-h-[460px] overflow-y-auto pr-1">
            {loadingTasks && (
              <div className="flex items-center justify-center p-8 rounded-2xl border border-slate-150 bg-slate-50/50 text-xs font-semibold text-slate-400">
                <LoaderCircle size={14} className="animate-spin text-[#FF7E21] mr-2" />
                Đang tải lịch học...
              </div>
            )}

            {!loadingTasks && selectedTasks.length === 0 && (
              <div className="p-8 rounded-2xl border border-dashed border-slate-200 text-center text-xs font-semibold text-slate-400 bg-slate-50/20">
                Chưa có nhiệm vụ nào trong ngày.
              </div>
            )}

            {selectedTasks.map(task => {
              const done = String(task.status || "").toUpperCase() === "COMPLETED";
              const actionableLabel = String(task.status || "").toUpperCase() === "IN_PROGRESS" || String(task.status || "").toUpperCase() === "PROCESSING"
                ? "Tiếp tục"
                : "Vào học";
              const futureTask = isFutureTaskDate(task.taskDate, todayKey);

              return (
                <div key={task.taskId} className={`p-4 rounded-2xl border transition-all duration-300 ${done ? "border-slate-200/40 bg-[#F8F9FA]/40 shadow-none" : "border-slate-200 bg-white hover:border-[#FF7E21]/30 hover:shadow-md hover:shadow-orange-500/5 border-l-4 border-l-[#FF7E21]"}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {done ? (
                        <div className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="w-4.5 h-4.5 border-2 border-slate-300 rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold leading-snug ${done ? "text-slate-400 line-through" : "text-slate-800"}`}>{task.title}</p>
                      
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 bg-blue-50 border border-blue-100 text-blue-700 px-2.5 py-0.5 rounded-lg font-bold text-[10px]">
                          <Clock size={11} className="text-blue-500" />
                          {toReadableTime(task.startTime)} - {toReadableTime(task.endTime)}
                        </span>
                        
                        <span className="inline-flex items-center gap-1 bg-orange-50 border border-orange-100 text-[#FF7E21] px-2 py-0.5 rounded-lg font-bold text-[10px]">
                          {task.durationMinutes || 0}m
                        </span>
                        
                        <div className="ml-auto">
                          {done ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 font-extrabold text-[10px]">
                              Đã xong
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openStudySession(task.taskId)}
                              disabled={futureTask}
                              title={futureTask ? "Chưa đến ngày học" : undefined}
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border border-orange-200 bg-orange-50/50 text-[#FF7E21] font-bold transition-all hover:bg-[#FF7E21] hover:text-white hover:border-transparent text-[10px] ${futureTask ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              <PlayCircle size={11} />
                              <span>{actionableLabel}</span>
                            </button>
                          )}
                        </div>
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
        isOpen={scheduleModalOpen && hasExistingCalendar}
        onClose={() => setScheduleModalOpen(false)}
        onConfirm={handleGenerateSchedule}
        subjectTitle={selectedWorkspace?.name || "Kế hoạch học tập"}
        currentPhase={1}
        initialConfig={scheduleSeed}
      />
    </motion.div>
  );
}
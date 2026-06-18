import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  LoaderCircle,
  RefreshCcw,
  Target,
  TrendingUp,
  BookOpen,
  CircleDashed,
  Sparkles,
  PlayCircle,
  BarChart3,
} from "lucide-react";
import workspaceService, { type WorkspaceResponse } from "../../../api/workspaceService";
import progressService, {
  type ProgressCalendarTaskResponse,
  type ProgressCurrentStepResponse,
  type ProgressDashboardResponse,
  type RoadmapStatus,
  type RoadmapStepStatus,
} from "../../../api/progressService";

type WorkspaceProgressProps = {
  workspaceId?: string;
  className?: string;
};

const ROADMAP_STATUS_TONES: Record<RoadmapStatus, { label: string; dot: string }> = {
  DRAFT:     { label: "Nháp",        dot: "bg-slate-400" },
  ACTIVE:    { label: "Đang học",    dot: "bg-emerald-500" },
  COMPLETED: { label: "Hoàn thành", dot: "bg-violet-500" },
};

const STEP_STATUS_TONES: Record<RoadmapStepStatus, { label: string; className: string }> = {
  UPCOMING:  { label: "Sắp tới",  className: "bg-slate-100 text-slate-600 border-slate-200" },
  CURRENT:   { label: "Đang học", className: "bg-orange-50 text-orange-700 border-orange-200" },
  COMPLETED: { label: "Đã xong",  className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

function formatPercent(value: number): string {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(Math.max(0, Math.min(100, value)));
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "Hôm nay";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(parsed);
}

function formatTimeRange(task: ProgressCalendarTaskResponse): string {
  const start = task.startTime?.slice(0, 5);
  const end = task.endTime?.slice(0, 5);
  if (start && end) return `${start} – ${end}`;
  if (start) return start;
  if (task.taskDate) return formatDate(task.taskDate);
  return "Chưa có giờ";
}

function getTaskStatusLabel(status: string | null): string {
  const n = (status || "").toUpperCase();
  if (n === "COMPLETED" || n === "DONE") return "Hoàn thành";
  if (n === "IN_PROGRESS" || n === "PROCESSING") return "Đang làm";
  return "Chờ làm";
}

function getPriorityLabel(priority: string | null): { label: string; className: string } {
  const n = (priority || "").toUpperCase();
  if (n === "HIGH")   return { label: "Cao",  className: "bg-rose-50 text-rose-700 border-rose-100" };
  if (n === "MEDIUM") return { label: "Vừa",  className: "bg-amber-50 text-amber-700 border-amber-100" };
  if (n === "LOW")    return { label: "Thấp", className: "bg-emerald-50 text-emerald-700 border-emerald-100" };
  return { label: priority || "Normal", className: "bg-slate-100 text-slate-600 border-slate-200" };
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isFutureTaskDate(taskDate: string | null | undefined): boolean {
  if (!taskDate) return false;
  return taskDate.slice(0, 10) > toDateKey(new Date());
}

function isTaskDone(task: ProgressCalendarTaskResponse): boolean {
  return (task.status || "").toUpperCase() === "COMPLETED";
}

function getStudyActionLabel(task: ProgressCalendarTaskResponse): string {
  const n = (task.status || "").toUpperCase();
  if (n === "IN_PROGRESS" || n === "PROCESSING") return "Tiếp tục";
  return "Vào học";
}

/* ── Progress Ring ── */
function ProgressRing({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = 52;
  const stroke = 9;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      <svg className="h-32 w-32 -rotate-90" viewBox="0 0 124 124" aria-hidden="true">
        <circle cx="62" cy="62" r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-slate-100" />
        <circle
          cx="62" cy="62" r={radius} fill="none"
          stroke="url(#pg)" strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-700"
        />
        <defs>
          <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FB923C" />
            <stop offset="100%" stopColor="#F97316" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-slate-800">{formatPercent(clamped)}%</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tiến độ</span>
      </div>
    </div>
  );
}

/* ── Stat Row ── */
function StatRow({ 
  icon, 
  label, 
  value, 
  themeClass = "bg-slate-50 border-slate-100 text-slate-600",
  valueClass = "text-slate-800",
  iconBgClass = "bg-slate-100 text-slate-400"
}: { 
  icon: ReactNode; 
  label: string; 
  value: string; 
  themeClass?: string;
  valueClass?: string;
  iconBgClass?: string;
}) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-150 ${themeClass}`}>
      <div className="flex items-center gap-2.5">
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${iconBgClass}`}>
          {icon}
        </div>
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <span className={`text-sm font-black ${valueClass}`}>{value}</span>
    </div>
  );
}

/* ── Task Card ── */
function TaskCard({ task, onOpenTask, isOverdue }: { task: ProgressCalendarTaskResponse; onOpenTask: (id: string) => void; isOverdue?: boolean }) {
  const done = isTaskDone(task);
  const priority = getPriorityLabel(task.priority);

  return (
    <article className={`rounded-xl border-y border-r p-4 transition-all duration-150 ${
      done 
        ? "border-l-4 border-l-emerald-500 border-emerald-100 bg-emerald-50/10" 
        : isOverdue 
          ? "border-l-4 border-l-rose-500 border-rose-100 bg-rose-50/10 hover:bg-rose-50/20" 
          : "border-l-4 border-l-[#FF6B00] border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
    }`}>
      <div className="flex items-start gap-3">
        {/* Status icon */}
        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${done ? "bg-emerald-50 text-emerald-600" : isOverdue ? "bg-rose-50 text-rose-500" : "bg-orange-50 text-[#FF6B00]"}`}>
          {done ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <h4 className="text-sm font-bold text-slate-800 truncate">{task.title}</h4>
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${priority.className}`}>{priority.label}</span>
          </div>

          {task.description && (
            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-2">{task.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 border border-slate-100 px-2 py-0.5">
              <CalendarDays className="h-3 w-3" />{formatDate(task.taskDate)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 border border-slate-100 px-2 py-0.5">
              <Clock3 className="h-3 w-3" />{formatTimeRange(task)}
            </span>
            {task.category && (
              <span className="inline-flex items-center rounded-lg bg-violet-50 border border-violet-100 px-2 py-0.5 text-violet-700">{task.category}</span>
            )}
          </div>
        </div>

        {/* Action */}
        <div className="shrink-0">
          {done ? (
            <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
              <CheckCircle2 className="h-3 w-3" />Xong
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onOpenTask(task.taskId)}
              disabled={isFutureTaskDate(task.taskDate)}
              className="inline-flex items-center gap-1 rounded-xl bg-[#FF6B00] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#E05E00] disabled:cursor-not-allowed disabled:opacity-40 transition animate-pulse"
            >
              <PlayCircle className="h-3 w-3" />{getStudyActionLabel(task)}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

/* ── Task Section ── */
function TaskSection({ title, subtitle, count, tasks, emptyTitle, emptyHint, accent, onOpenTask }: {
  title: string; subtitle: string; count: number; tasks: ProgressCalendarTaskResponse[];
  emptyTitle: string; emptyHint: string; accent?: boolean;
  onOpenTask: (taskId: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
            accent 
              ? "bg-rose-50 border-rose-100 text-rose-500" 
              : "bg-violet-50 border-violet-100 text-violet-500"
          }`}>
            {accent ? <AlertTriangle className="h-4.5 w-4.5" /> : <CalendarDays className="h-4.5 w-4.5" />}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-extrabold text-slate-800">{title}</div>
            <div className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</div>
          </div>
        </div>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border shrink-0 ${accent && count > 0 ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-orange-50 text-orange-600 border-orange-100"}`}>
          {count}
        </span>
      </div>
      <div className="p-4 space-y-3">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <CircleDashed className="h-8 w-8 text-slate-200 mb-2" />
            <p className="text-sm font-semibold text-slate-500">{emptyTitle}</p>
            <p className="text-xs text-slate-400 mt-0.5">{emptyHint}</p>
          </div>
        ) : tasks.map(task => (
          <TaskCard key={task.taskId} task={task} onOpenTask={onOpenTask} isOverdue={accent} />
        ))}
      </div>
    </div>
  );
}

/* ── Main Export ── */
export default function WorkspaceProgress({ workspaceId, className }: WorkspaceProgressProps) {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(workspaceId ?? "");
  const [dashboard, setDashboard] = useState<ProgressDashboardResponse | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => { setSelectedWorkspaceId(workspaceId ?? ""); }, [workspaceId]);

  useEffect(() => {
    let mounted = true;
    const loadWorkspaces = async () => {
      try {
        const response = await workspaceService.getMyWorkspaces();
        if (!mounted) return;
        setWorkspaces(response);
        setSelectedWorkspaceId(current => current || response[0]?.workspaceId || "");
      } catch {}
    };
    void loadWorkspaces();
    return () => { mounted = false; };
  }, [workspaceId]);

  useEffect(() => {
    let mounted = true;
    const loadDashboard = async () => {
      if (!selectedWorkspaceId) { setDashboard(null); return; }
      setLoadingDashboard(true);
      setError(null);
      try {
        const response = await progressService.getProgressDashboard(selectedWorkspaceId);
        if (!mounted) return;
        setDashboard(response);
      } catch (err: any) {
        if (!mounted) return;
        setDashboard(null);
        setError(err?.message || "Không thể tải dashboard tiến độ");
      } finally {
        if (mounted) setLoadingDashboard(false);
      }
    };
    void loadDashboard();
    return () => { mounted = false; };
  }, [selectedWorkspaceId, refreshToken]);

  const roadmapStatus = dashboard?.roadmapStatus ?? "DRAFT";
  const rawProgress = dashboard?.progressPercent;
  const progressPercent = (typeof rawProgress === 'number' && !isNaN(rawProgress)) ? rawProgress : 0;
  const currentStep = dashboard?.currentStep ?? null;
  const isRoadmapMissing = Boolean(error && /roadmap/i.test(error));
  const roadmapTarget = selectedWorkspaceId ? `/app/workspaces/${selectedWorkspaceId}/roadmap` : "/app/workspaces";

  const openStudySession = (taskId: string) => {
    if (!selectedWorkspaceId || !taskId) return;
    navigate("/app/learning/course", { state: { taskId } });
  };

  return (
    <div className={className}>
      <div className="space-y-5">

        {/* Error banner */}
        {error && (
          <div className={`rounded-xl border px-4 py-3 text-xs ${isRoadmapMissing ? "border-amber-200 bg-amber-50 text-amber-800" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">{isRoadmapMissing ? "Chưa có lộ trình học" : "Lỗi tải tiến độ"}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed opacity-80">{error}</p>
                {isRoadmapMissing && (
                  <button type="button" onClick={() => navigate(roadmapTarget)}
                    className="mt-2 inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-bold border border-amber-200 text-amber-800 hover:bg-amber-50 transition">
                    Tạo lộ trình học <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>
              <button type="button" onClick={() => setRefreshToken(v => v + 1)}
                className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:border-orange-200 hover:text-orange-600 transition">
                <RefreshCcw className={`h-3 w-3 ${loadingDashboard ? "animate-spin text-orange-500" : ""}`} />
                Thử lại
              </button>
            </div>
          </div>
        )}

        {/* Top cards row */}
        <div className="grid gap-4 sm:grid-cols-3">

          {/* Progress Ring Card */}
          <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 border border-orange-100 text-[#FF6B00]">
                <BarChart3 className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">Tổng tiến độ</span>
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Mức độ hoàn thành lộ trình</span>
              </div>
            </div>
            <div className="p-5 flex flex-col items-center gap-3">
              {loadingDashboard ? (
                <div className="flex h-32 w-32 items-center justify-center">
                  <LoaderCircle className="h-8 w-8 animate-spin text-orange-400" />
                </div>
              ) : (
                <ProgressRing value={progressPercent} />
              )}
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${ROADMAP_STATUS_TONES[roadmapStatus].dot}`} />
                <span className="text-xs font-semibold text-slate-500">{ROADMAP_STATUS_TONES[roadmapStatus].label}</span>
              </div>
              {dashboard && (
                <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                  {dashboard.completedSteps}/{dashboard.totalSteps} bước · {dashboard.completedTasks}/{dashboard.totalTasks} nhiệm vụ
                </p>
              )}
            </div>
          </div>

          {/* Stats Card */}
          <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-500">
                <Target className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">Thống kê học tập</span>
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Chi tiết số liệu tích lũy</span>
              </div>
            </div>
            <div className="p-4 space-y-2">
              <StatRow 
                icon={<Target className="h-3.5 w-3.5" />} 
                label="Lộ trình học"
                value={dashboard ? `${dashboard.completedSteps}/${dashboard.totalSteps}` : "0/0"} 
                themeClass="bg-orange-50/30 border-orange-100/50 text-orange-950"
                iconBgClass="bg-orange-50 border border-orange-100/50 text-[#FF6B00]"
                valueClass="text-[#FF6B00]"
              />
              <StatRow 
                icon={<BookOpen className="h-3.5 w-3.5" />} 
                label="Nhiệm vụ xong"
                value={dashboard ? `${dashboard.completedTasks}/${dashboard.totalTasks}` : "0/0"} 
                themeClass="bg-emerald-50/20 border-emerald-100/50 text-emerald-950"
                iconBgClass="bg-emerald-50 border border-emerald-100/50 text-emerald-600"
                valueClass="text-emerald-600"
              />
              <StatRow 
                icon={<TrendingUp className="h-3.5 w-3.5" />} 
                label="Quá hạn"
                value={String(dashboard?.overdueTaskCount ?? 0)}
                themeClass={(dashboard?.overdueTaskCount ?? 0) > 0 
                  ? "bg-rose-50/30 border-rose-100/50 text-rose-950" 
                  : "bg-slate-50 border-slate-100 text-slate-600"}
                iconBgClass={(dashboard?.overdueTaskCount ?? 0) > 0
                  ? "bg-rose-50 border border-rose-100/50 text-rose-600"
                  : "bg-slate-100 text-slate-400"}
                valueClass={(dashboard?.overdueTaskCount ?? 0) > 0 ? "text-rose-600" : "text-slate-800"}
              />
            </div>
          </div>

          {/* Focus Card */}
          <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 border border-amber-100 text-amber-500 shrink-0">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">Tiêu điểm</span>
                  <span className="text-[10px] text-slate-400 font-medium truncate block mt-0.5">Nhiệm vụ AI đề xuất</span>
                </div>
              </div>
              {currentStep && (
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold shrink-0 ${STEP_STATUS_TONES[currentStep.status].className}`}>
                  {STEP_STATUS_TONES[currentStep.status].label}
                </span>
              )}
            </div>
            <div className="p-5">
              {currentStep ? (
                <div className="p-3.5 rounded-xl border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50/10 to-white border-y border-r border-amber-100/30 shadow-sm space-y-3">
                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                    <Sparkles className="h-3 w-3" />Bước #{currentStep.sequenceNo}
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-800 leading-snug line-clamp-2 hover:text-[#FF6B00] transition cursor-pointer">{currentStep.title}</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Hãy tập trung nghiên cứu nội dung này tiếp theo.</p>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-[#FF6B00] transition-all duration-500"
                      style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <CircleDashed className="h-8 w-8 text-slate-200 mb-2" />
                  <p className="text-xs font-bold text-slate-500">Chưa có tiêu điểm</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Cần có lộ trình để hiển thị.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Task sections */}
        <div className="grid gap-4 md:grid-cols-2">
          <TaskSection
            title="Nhiệm vụ hôm nay"
            subtitle="Danh sách cần làm hôm nay"
            count={dashboard?.todayTaskCount ?? 0}
            tasks={dashboard?.todayTasks ?? []}
            emptyTitle="Không có nhiệm vụ hôm nay"
            emptyHint="Tuyệt! Bạn đã hoàn thành đúng kế hoạch."
            onOpenTask={openStudySession}
          />
          <TaskSection
            title="Nhiệm vụ quá hạn"
            subtitle="Cần xử lý sớm"
            count={dashboard?.overdueTaskCount ?? 0}
            tasks={dashboard?.overdueTasks ?? []}
            emptyTitle="Không có nhiệm vụ quá hạn"
            emptyHint="Rất tốt! Giữ vững tiến độ học tập nhé."
            accent
            onOpenTask={openStudySession}
          />
        </div>

        {/* Refresh row */}
        {!error && (
          <div className="flex justify-end">
            <button type="button" onClick={() => setRefreshToken(v => v + 1)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-500 hover:border-orange-200 hover:text-orange-600 transition shadow-sm">
              <RefreshCcw className={`h-3.5 w-3.5 ${loadingDashboard ? "animate-spin text-orange-500" : ""}`} />
              Làm mới dữ liệu
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
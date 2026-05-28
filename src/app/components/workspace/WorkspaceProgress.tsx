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

const F = "'Plus Jakarta Sans', Inter, sans-serif";

const ROADMAP_STATUS_TONES: Record<RoadmapStatus, { label: string; className: string }> = {
  DRAFT: { label: "Nháp", className: "bg-slate-100 text-slate-700 ring-slate-200" },
  ACTIVE: { label: "Đang học", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  COMPLETED: { label: "Hoàn thành", className: "bg-violet-50 text-violet-700 ring-violet-200" },
};

const STEP_STATUS_TONES: Record<RoadmapStepStatus, { label: string; className: string }> = {
  UPCOMING: { label: "Sắp tới", className: "bg-slate-100 text-slate-700 ring-slate-200" },
  CURRENT: { label: "Đang học", className: "bg-orange-50 text-orange-700 ring-orange-200" },
  COMPLETED: { label: "Đã xong", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
};

function formatPercent(value: number): string {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(Math.max(0, Math.min(100, value)));
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "Hôm nay";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

function formatTimeRange(task: ProgressCalendarTaskResponse): string {
  const start = task.startTime?.slice(0, 5);
  const end = task.endTime?.slice(0, 5);

  if (start && end) return `${start} - ${end}`;
  if (start) return start;
  if (task.taskDate) return formatDate(task.taskDate);
  return "Chưa có giờ học";
}

function getTaskStatusLabel(status: string | null): string {
  const normalized = (status || "").toUpperCase();
  if (normalized === "COMPLETED") return "Hoàn thành";
  if (normalized === "DONE") return "Đã xong";
  if (normalized === "IN_PROGRESS" || normalized === "PROCESSING") return "Đang làm";
  return "Chờ làm";
}

function getPriorityClass(priority: string | null): string {
  const normalized = (priority || "").toUpperCase();

  if (normalized === "HIGH") return "bg-rose-50 text-rose-700 ring-rose-200";
  if (normalized === "MEDIUM") return "bg-amber-50 text-amber-700 ring-amber-200";
  if (normalized === "LOW") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isFutureTaskDate(taskDate: string | null | undefined): boolean {
  if (!taskDate) {
    return false;
  }

  return taskDate.slice(0, 10) > toDateKey(new Date());
}

function isTaskDone(task: ProgressCalendarTaskResponse): boolean {
  return (task.status || "").toUpperCase() === "COMPLETED";
}

function getStudyActionLabel(task: ProgressCalendarTaskResponse): string {
  const normalized = (task.status || "").toUpperCase();
  if (normalized === "IN_PROGRESS" || normalized === "PROCESSING") {
    return "Tiếp tục";
  }

  return "Vào học";
}

function ProgressRing({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = 54;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative flex h-36 w-36 items-center justify-center">
      <svg className="h-36 w-36 -rotate-90" viewBox="0 0 128 128" aria-hidden="true">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-slate-200" />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-500"
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF8A3D" />
            <stop offset="100%" stopColor="#F97316" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-black tracking-tight text-slate-900">{formatPercent(clamped)}%</span>
        <span className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Tiến độ</span>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, hint }: { icon: ReactNode; label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500 ring-1 ring-orange-100">
        {icon}
      </div>
      <div className="text-sm font-semibold text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-black tracking-tight text-slate-900">{value}</div>
      <div className="mt-1 text-xs font-medium text-slate-500">{hint}</div>
    </div>
  );
}

function TaskList({ title, count, tasks, emptyTitle, emptyHint, onOpenTask }: {
  title: string;
  count: number;
  tasks: ProgressCalendarTaskResponse[];
  emptyTitle: string;
  emptyHint: string;
  onOpenTask: (taskId: string) => void;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold tracking-tight text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">Danh sách được lấy trực tiếp từ API progress.</p>
        </div>
        <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700 ring-1 ring-orange-100">
          {count}
        </span>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
            <CircleDashed className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-700">{emptyTitle}</p>
            <p className="mt-1 text-sm text-slate-500">{emptyHint}</p>
          </div>
        ) : (
          tasks.map(task => {
            const done = isTaskDone(task);

            return (
              <article
                key={task.taskId}
                className={`rounded-2xl border p-4 transition ${done ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200 bg-white hover:border-orange-200 hover:shadow-[0_10px_28px_rgba(15,23,42,0.06)]"}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${done ? "bg-emerald-100 text-emerald-600 ring-emerald-200" : "bg-orange-50 text-orange-500 ring-orange-100"}`}>
                    {done ? <CheckCircle2 className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="truncate text-sm font-bold text-slate-900">{task.title}</h4>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${getPriorityClass(task.priority)}`}>
                        {task.priority || "NORMAL"}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${done ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-700 ring-slate-200"}`}>
                        {getTaskStatusLabel(task.status)}
                      </span>
                    </div>

                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
                      {task.description || "Chưa có mô tả cho task này."}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDate(task.taskDate)}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
                        <Clock3 className="h-3.5 w-3.5" />
                        {formatTimeRange(task)}
                      </span>
                      {task.category && (
                        <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-1 font-semibold text-orange-700 ring-1 ring-orange-100">
                          {task.category}
                        </span>
                      )}

                      {done ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700 ring-1 ring-emerald-200">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Đã hoàn thành
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onOpenTask(task.taskId)}
                          disabled={isFutureTaskDate(task.taskDate)}
                          title={isFutureTaskDate(task.taskDate) ? "Chưa đến ngày học" : undefined}
                          className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 font-semibold text-orange-700 ring-1 ring-orange-200 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <PlayCircle className="h-3.5 w-3.5" />
                          {getStudyActionLabel(task)}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

export default function WorkspaceProgress({ workspaceId, className }: WorkspaceProgressProps) {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(workspaceId ?? "");
  const [dashboard, setDashboard] = useState<ProgressDashboardResponse | null>(null);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    setSelectedWorkspaceId(workspaceId ?? "");
  }, [workspaceId]);

  useEffect(() => {
    let mounted = true;

    const loadWorkspaces = async () => {
      setLoadingWorkspaces(true);

      try {
        const response = await workspaceService.getMyWorkspaces();
        if (!mounted) return;

        setWorkspaces(response);
        setSelectedWorkspaceId(current => current || response[0]?.workspaceId || "");
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || "Không thể tải danh sách workspace");
        setWorkspaces([]);
      } finally {
        if (mounted) setLoadingWorkspaces(false);
      }
    };

    void loadWorkspaces();

    return () => {
      mounted = false;
    };
  }, [workspaceId]);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      if (!selectedWorkspaceId) {
        setDashboard(null);
        return;
      }

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

    return () => {
      mounted = false;
    };
  }, [selectedWorkspaceId, refreshToken]);

  const workspaceName = useMemo(() => {
    return workspaces.find(item => item.workspaceId === selectedWorkspaceId)?.name || "Chưa chọn workspace";
  }, [selectedWorkspaceId, workspaces]);

  const roadmapStatus = dashboard?.roadmapStatus ?? "DRAFT";
  const progressPercent = dashboard?.progressPercent ?? 0;
  const currentStep = dashboard?.currentStep ?? null;

  const openStudySession = (taskId: string) => {
    if (!selectedWorkspaceId || !taskId) {
      return;
    }

    navigate("/app/learning/course", {
      state: { taskId },
    });
  };

  const isRoadmapMissing = Boolean(error && /roadmap/i.test(error));
  const roadmapTarget = selectedWorkspaceId ? `/app/workspaces/${selectedWorkspaceId}/roadmap` : "/app/workspaces";

  return (
    <div className={className} style={{ fontFamily: F }}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <header className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700 ring-1 ring-orange-100">
                <Sparkles className="h-4 w-4" />
                Progress Dashboard
              </div>
              <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Theo dõi tiến độ học tập của bạn</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Xem nhanh tiến độ roadmap, số task hoàn thành và các task cần xử lý ngay hôm nay.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:min-w-[320px]">
              {!workspaceId && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2">
                  <label className="mb-2 block px-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Workspace</label>
                  <select
                    value={selectedWorkspaceId}
                    onChange={e => setSelectedWorkspaceId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none ring-0 transition focus:border-orange-300"
                  >
                    {loadingWorkspaces && <option value="">Đang tải workspace...</option>}
                    {!loadingWorkspaces && workspaces.length === 0 && <option value="">Chưa có workspace</option>}
                    {workspaces.map(item => (
                      <option key={item.workspaceId} value={item.workspaceId}>{item.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Workspace đang xem</p>
                  <p className="mt-1 text-sm font-extrabold text-slate-900">{workspaceName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setRefreshToken(value => value + 1)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-orange-200 hover:text-orange-600"
                >
                  <RefreshCcw className={`h-3.5 w-3.5 ${loadingDashboard ? "animate-spin" : ""}`} />
                  Làm mới
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${isRoadmapMissing ? "border-amber-200 bg-amber-50 text-amber-800" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <div className="flex-1">
                  <p className="font-bold">{isRoadmapMissing ? "Chưa có roadmap để hiển thị tiến độ" : "Không tải được tiến độ"}</p>
                  <p className="mt-1 leading-6">{error}</p>
                  {isRoadmapMissing && (
                    <button
                      type="button"
                      onClick={() => navigate(roadmapTarget)}
                      className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-amber-800 ring-1 ring-amber-200 transition hover:bg-amber-50"
                    >
                      Mở roadmap
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </header>

        <section className="grid gap-5 xl:grid-cols-[320px_1fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
            <div className="flex flex-col items-center gap-4 text-center">
              <ProgressRing value={progressPercent} />
              <div className="space-y-2">
                <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ${ROADMAP_STATUS_TONES[roadmapStatus].className}`}>
                  {ROADMAP_STATUS_TONES[roadmapStatus].label}
                </div>
                <h2 className="text-xl font-black tracking-tight text-slate-900">Tổng quan tiến độ</h2>
                <p className="max-w-sm text-sm leading-6 text-slate-500">
                  {dashboard ? `Bạn đã hoàn thành ${dashboard.completedSteps}/${dashboard.totalSteps} bước và ${dashboard.completedTasks}/${dashboard.totalTasks} task.` : "Chưa có dữ liệu tiến độ cho workspace này."}
                </p>
              </div>

              <div className="w-full rounded-2xl bg-slate-50 px-4 py-3 text-left ring-1 ring-slate-200">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  <span>Hôm nay</span>
                  <span>{dashboard ? formatDate(dashboard.today) : "--"}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm font-semibold text-slate-700">
                  <span>Task hôm nay</span>
                  <span>{dashboard?.todayTaskCount ?? 0}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm font-semibold text-slate-700">
                  <span>Task quá hạn</span>
                  <span className="text-rose-600">{dashboard?.overdueTaskCount ?? 0}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <StatCard
              icon={<Target className="h-5 w-5" />}
              label="Steps completed"
              value={dashboard ? `${dashboard.completedSteps}/${dashboard.totalSteps}` : "0/0"}
              hint="Số bước đã hoàn thành trong roadmap"
            />
            <StatCard
              icon={<BookOpen className="h-5 w-5" />}
              label="Tasks completed"
              value={dashboard ? `${dashboard.completedTasks}/${dashboard.totalTasks}` : "0/0"}
              hint="Task đã hoàn thành trên tổng task"
            />
            <StatCard
              icon={<TrendingUp className="h-5 w-5" />}
              label="Overdue alerts"
              value={String(dashboard?.overdueTaskCount ?? 0)}
              hint="Task đang quá hạn cần xử lý"
            />

            <div className="lg:col-span-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-extrabold tracking-tight text-slate-900">Current Learning Focus</h3>
                  <p className="mt-1 text-sm text-slate-500">Bước hiện tại lấy từ roadmap đã xác nhận.</p>
                </div>
                {currentStep && (
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ${STEP_STATUS_TONES[currentStep.status].className}`}>
                    {STEP_STATUS_TONES[currentStep.status].label}
                  </span>
                )}
              </div>

              {currentStep ? (
                <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 p-5 ring-1 ring-orange-100">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                      <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-orange-700 ring-1 ring-orange-100">
                        <Sparkles className="h-3.5 w-3.5" />
                        Step #{currentStep.sequenceNo}
                      </div>
                      <h4 className="mt-3 text-2xl font-black tracking-tight text-slate-900">{currentStep.title}</h4>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Đây là nội dung bạn nên ưu tiên ngay bây giờ để tiếp tục tiến độ roadmap.
                      </p>
                    </div>

                    <div className="min-w-[180px] rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                        <span>Trạng thái</span>
                        <span>{currentStep.sequenceNo}</span>
                      </div>
                      <div className="mt-3 text-sm font-semibold text-slate-700">{currentStep.title}</div>
                    </div>
                  </div>

                  <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/70 ring-1 ring-orange-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                  <CircleDashed className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-3 text-sm font-semibold text-slate-700">Chưa có current learning focus</p>
                  <p className="mt-1 text-sm text-slate-500">Hãy tạo roadmap để hệ thống xác định bước học hiện tại.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <TaskList
            title="Tasks for Today"
            count={dashboard?.todayTaskCount ?? 0}
            tasks={dashboard?.todayTasks ?? []}
            emptyTitle="Không có task nào cho hôm nay"
            emptyHint="Bạn đang theo đúng kế hoạch. Hãy giữ nhịp học đều đặn nhé."
            onOpenTask={openStudySession}
          />
          <TaskList
            title="Overdue Tasks"
            count={dashboard?.overdueTaskCount ?? 0}
            tasks={dashboard?.overdueTasks ?? []}
            emptyTitle="Không có task quá hạn"
            emptyHint="Rất tốt. Không có task nào cần xử lý gấp ở thời điểm này."
            onOpenTask={openStudySession}
          />
        </section>
      </div>
    </div>
  );
}
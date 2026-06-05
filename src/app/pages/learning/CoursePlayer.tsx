import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  LoaderCircle,
  PlayCircle,
  Sparkles,
  Target,
  Timer,
  WandSparkles,
  PauseCircle,
  Play,
  SkipForward,
  Star,
  X,
} from "lucide-react";
import studySessionService from "../../../api/studySessionService";
import type { StudySessionDetailResponse } from "../../../api/studySessionService";

type StudySessionRouteState = {
  taskId?: string;
  sessionId?: string;
  title?: string;
  subject?: string;
  channel?: string;
  duration?: string;
};

const SESSION_STORAGE_PREFIX = "skillSprint.studySession";

function readStoredSessionId(taskId: string): string | null {
  try {
    return localStorage.getItem(`${SESSION_STORAGE_PREFIX}:${taskId}`);
  } catch {
    return null;
  }
}

function storeSessionId(taskId: string, sessionId: string): void {
  try {
    localStorage.setItem(`${SESSION_STORAGE_PREFIX}:${taskId}`, sessionId);
  } catch {
    // ignore
  }
}

function clearStoredSessionId(taskId: string): void {
  try {
    localStorage.removeItem(`${SESSION_STORAGE_PREFIX}:${taskId}`);
  } catch {
    // ignore
  }
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "Chưa có";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function formatStatusLabel(status: string | null | undefined): string {
  if (!status) return "Chưa xác định";
  const n = status.toUpperCase();
  if (n === "IN_PROGRESS") return "Đang học";
  if (n === "COMPLETED") return "Đã hoàn thành";
  if (n === "CURRENT") return "Đang học";
  if (n === "UPCOMING") return "Sắp tới";
  if (n === "SKIPPED") return "Đã bỏ qua";
  return n;
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function computeMinimumRequiredMinutes(taskDurationMinutes: number | null | undefined): number {
  if (!taskDurationMinutes || taskDurationMinutes <= 0) return 0;
  return Math.min(15, Math.ceil(taskDurationMinutes * 0.3));
}

function normalizeList(values: string[] | null | undefined): string[] {
  if (!Array.isArray(values)) return [];
  return values.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
}


export default function CoursePlayer() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as StudySessionRouteState | null) ?? {};

  const taskId = searchParams.get("taskId")?.trim() ?? state.taskId?.trim() ?? null;

  const [detail, setDetail] = useState<StudySessionDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [toastNotification, setToastNotification] = useState<{ type: "success" | "warning"; message: string } | null>(null);

  const showToast = useCallback((type: "success" | "warning", message: string) => {
    setToastNotification({ type, message });
    setTimeout(() => setToastNotification(null), 5000);
  }, []);

  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    return taskId ? readStoredSessionId(taskId) : null;
  });
  const [timeLeft, setTimeLeft] = useState(1500); 
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [actualStudySeconds, setActualStudySeconds] = useState(0);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewFocusScore, setReviewFocusScore] = useState(5); 

  const [isSubActionLoading, setIsSubActionLoading] = useState(false);

  const [pomodoroPhase, setPomodoroPhase] = useState<"FOCUS" | "SHORT_BREAK" | "LONG_BREAK">("FOCUS");
  const pomodoroPhaseRef = useRef<"FOCUS" | "SHORT_BREAK" | "LONG_BREAK">("FOCUS");
  pomodoroPhaseRef.current = pomodoroPhase;
  const activeSessionIdRef = useRef<string | null>(activeSessionId);
  activeSessionIdRef.current = activeSessionId;

  const task = detail?.task ?? null;
  const roadmapStep = detail?.roadmapStep ?? null;
  const practice = detail?.practice ?? null;
  const resources = detail?.resources ?? [];
  const actions = detail?.actions ?? null;

  const isSessionCompleted =
    task?.status?.toUpperCase() === "COMPLETED" ||
    roadmapStep?.status?.toUpperCase() === "COMPLETED";

  const hasStartedSession = Boolean(activeSessionId) && !isSessionCompleted;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const scheduledDate = new Date(task?.taskDate ?? "");
  scheduledDate.setHours(0, 0, 0, 0);
  const canStartByDate = Number.isNaN(scheduledDate.getTime()) ? true : today.getTime() >= scheduledDate.getTime();

  const canStart = canStartByDate && Boolean(taskId) && (actions?.canStart ?? true) && !hasStartedSession && !isStarting && !isFinishing;
  const canFinish = Boolean(activeSessionId) && !isSessionCompleted && !isStarting && !isFinishing;

  const taskDuration = task?.durationMinutes ?? 0;
  const minimumRequiredMinutes = useMemo(() => computeMinimumRequiredMinutes(taskDuration), [taskDuration]);
  const elapsedStudyMinutes = Math.floor(actualStudySeconds / 60);
  const hasMetMinimum = elapsedStudyMinutes >= minimumRequiredMinutes;

  const handlePhaseExpire = async (
    phase: "FOCUS" | "SHORT_BREAK" | "LONG_BREAK",
    sid: string | null,
  ) => {
    if (!sid) return;
    try {
      await studySessionService.nextPomodoroPhase(sid);
    } catch { /* fire-and-forget */ }

    if (phase === "FOCUS") {
      setPomodoroPhase("SHORT_BREAK");
      setTimeLeft(300);
      setIsTimerRunning(true);
      showToast("success", "🎉 Tập trung xong! Bắt đầu 5 phút nghỉ giải lao.");
    } else {
      setPomodoroPhase("FOCUS");
      setTimeLeft(1500);
      setIsTimerRunning(false);
      showToast("success", "☕ Hết giờ nghỉ! Nhấn Bắt đầu để tiếp tục chu kỳ mới.");
    }
  };

  useEffect(() => {
    if (!isTimerRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          void handlePhaseExpire(pomodoroPhaseRef.current, activeSessionIdRef.current);
          return 0;
        }
        return prev - 1;
      });
      // Only accumulate study time during the focus phase
      if (pomodoroPhaseRef.current === "FOCUS") {
        setActualStudySeconds((prev) => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning]);

  useEffect(() => {
    if (!taskId) {
      setDetail(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    studySessionService
      .getStudySessionDetail(taskId)
      .then((response) => {
        if (cancelled) return;
        setDetail(response);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Không thể tải dữ liệu phiên học.");
        setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [taskId]);

  const fetchUpdatedDetail = async () => {
    if (!taskId) return;
    try {
      const freshDetail = await studySessionService.getStudySessionDetail(taskId);
      setDetail(freshDetail);
      return freshDetail;
    } catch (err) {
      console.error("Failed to refetch detail", err);
      return null;
    }
  };

  const handleStartSession = async () => {
    if (!taskId || isStarting) return;
    setIsStarting(true);
    setError(null);

    try {
      const response = await studySessionService.startStudySession(taskId, {
        usePomodoro: true,
        focusMinutes: 25,
        shortBreakMinutes: 5,
        longBreakMinutes: 15,
        totalCycles: 4,
      });

      setActiveSessionId(response.sessionId);
      setPomodoroPhase("FOCUS");
      setTimeLeft(1500);
      setActualStudySeconds(0);
      setIsTimerRunning(true);
      storeSessionId(taskId, response.sessionId);
      await fetchUpdatedDetail();
      showToast("success", "🍅 Đã khởi tạo chu kỳ Pomodoro, bắt đầu tập trung học!");
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Không thể bắt đầu phiên học.";
      showToast("warning", msg);
      setError(msg);
    } finally {
      setIsStarting(false);
    }
  };

  // 2. FULL POMODORO CONTROL INTEGRATION
  const handlePausePomodoro = async () => {
    if (!activeSessionId || isSubActionLoading) return;
    setIsSubActionLoading(true);
    try {
      await studySessionService.pausePomodoro(activeSessionId);
      setIsTimerRunning(false);
      await fetchUpdatedDetail();
      showToast("success", "⏸️ Đã tạm dừng đồng hồ Pomodoro.");
    } catch (err: any) {
      showToast("warning", err?.message || "Không thể tạm dừng.");
    } finally {
      setIsSubActionLoading(false);
    }
  };

  const handleResumePomodoro = async () => {
    if (!activeSessionId || isSubActionLoading) return;
    setIsSubActionLoading(true);
    try {
      await studySessionService.resumePomodoro(activeSessionId);
      setIsTimerRunning(true);
      await fetchUpdatedDetail();
      showToast("success", "▶️ Tiếp tục chu kỳ tập trung.");
    } catch (err: any) {
      showToast("warning", err?.message || "Không thể tiếp tục.");
    } finally {
      setIsSubActionLoading(false);
    }
  };

  const handleNextPhase = async () => {
    if (!activeSessionId || isSubActionLoading || !taskId) return;
    setIsSubActionLoading(true);
    try {
      await studySessionService.nextPomodoroPhase(activeSessionId);

      const freshDetail = await fetchUpdatedDetail();
      const backendPhase = (freshDetail as any)?.pomodoro?.currentPhase?.toUpperCase();

      // Use backend phase if valid, otherwise toggle locally
      const nextLocalPhase: "FOCUS" | "SHORT_BREAK" | "LONG_BREAK" =
        backendPhase === "SHORT_BREAK" ? "SHORT_BREAK"
        : backendPhase === "LONG_BREAK" ? "LONG_BREAK"
        : backendPhase === "FOCUS" ? "FOCUS"
        : pomodoroPhase === "FOCUS" ? "SHORT_BREAK" : "FOCUS";

      setPomodoroPhase(nextLocalPhase);
      if (nextLocalPhase === "SHORT_BREAK") setTimeLeft(300);
      else if (nextLocalPhase === "LONG_BREAK") setTimeLeft(900);
      else setTimeLeft(1500);

      setIsTimerRunning(true);
      showToast("success", "⏭️ Đã chuyển sang chu kỳ tiếp theo.");
    } catch (err: any) {
      showToast("warning", err?.message || "Không thể bỏ qua phase.");
    } finally {
      setIsSubActionLoading(false);
    }
  };

  const handleAutoExpireSession = async () => {
    if (!activeSessionId) return;
    try {
      await studySessionService.finishPomodoro(activeSessionId);
      await studySessionService.finishStudySession(activeSessionId, {
        notes: "Phiên học tự động kết thúc khi hết thời gian Pomodoro.",
        focusScore: 5,
      });
      showToast("success", "⏰ Hết giờ! Hệ thống đã tự động đóng phiên học và cập nhật tiến độ.");
      await fetchUpdatedDetail();
      setActiveSessionId(null);
      setActualStudySeconds(0);
      if (taskId) clearStoredSessionId(taskId);
    } catch (err: any) {
      console.error("Auto expire failed:", err?.message);
    }
  };

  const handleTriggerReviewModal = () => {
    if (!activeSessionId) return;
    setIsTimerRunning(false); 
    setShowReviewModal(true);
  };

  // 3. INTEGRATION WITH REVIEW MODAL & 4. PROGRESS VALIDATION
  const handleConfirmFinishSession = async () => {
    if (!activeSessionId || isFinishing) return;
    setIsFinishing(true);
    setError(null);

    try {
      await studySessionService.finishPomodoro(activeSessionId);
      await studySessionService.finishStudySession(activeSessionId, {
        notes: reviewNotes.trim() || "Hoàn thành phiên học thực tế",
        focusScore: reviewFocusScore,
      });

      const requiredMinutes = computeMinimumRequiredMinutes(task?.durationMinutes);
      const requiredSeconds = requiredMinutes * 60;

      if (actualStudySeconds >= requiredSeconds) {
        showToast(
          "success",
          `🎉 Chúc mừng! Bạn đã học đủ thời gian tối thiểu (${elapsedStudyMinutes}/${requiredMinutes} phút) và được hệ thống ghi nhận trạng thái COMPLETED!`,
        );
      } else {
        showToast(
          "warning",
          `⚠️ Phiên học đã đóng. Tuy nhiên bạn mới học ${elapsedStudyMinutes} phút, chưa đủ điều kiện tối thiểu (${requiredMinutes} phút) để chuyển trạng thái COMPLETED.`,
        );
      }

      setIsTimerRunning(false);
      setTimeLeft(1500);
      setActualStudySeconds(0);
      setShowReviewModal(false);
      setActiveSessionId(null);
      if (taskId) clearStoredSessionId(taskId);

      await fetchUpdatedDetail();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Không thể kết thúc phiên học.";
      showToast("warning", msg);
      setError(msg);
    } finally {
      setIsFinishing(false);
    }
  };

  const goBack = () => navigate(-1);

  if (!taskId) {
    return (
      <div className="min-h-screen bg-[#F4F6FB] text-slate-900">
        <div className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="w-full rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <button type="button" onClick={goBack} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
              <ArrowLeft size={16} /> Quay lại
            </button>
            <div className="mt-6 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                <Target size={22} />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Mở Study Session từ một calendar task</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  Trang này đã được nối với backend study session thật. Hãy mở nó từ một task học tập để load được chi tiết bài học, tài nguyên và các nút Start / Finish đúng MVP.
                </p>
              </div>
            </div>
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Hiện tại chưa có <strong>taskId</strong> trong route state hoặc query string.
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={goBack} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800">
                <ArrowLeft size={16} /> Quay lại nơi trước đó
              </button>
              <Link to="/app/calendar" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
                <BookOpen size={16} /> Mở Study Calendar
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 relative overflow-hidden">
      {/* Custom subtle background glow circles */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute top-[20%] left-0 w-[300px] h-[300px] bg-orange-500/5 rounded-full blur-[60px] pointer-events-none" />

      {/* ── Toast notification ─────────────────── */}
      {toastNotification && (
        <div
          className={`fixed top-4 right-4 z-50 max-w-sm rounded-2xl border px-5 py-4 shadow-2xl transition-all duration-300 ${
            toastNotification.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">
              {toastNotification.type === "success" ? "✅" : "⚠️"}
            </span>
            <p className="text-sm font-semibold">{toastNotification.message}</p>
          </div>
        </div>
      )}

      {/* ── Header ────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-xl shadow-sm shadow-slate-100/40">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-400 font-semibold">
              <button type="button" onClick={goBack} className="inline-flex items-center gap-1 hover:text-orange-600 transition-colors">
                <ArrowLeft size={13} className="stroke-[2.5]" /> Quay lại
              </button>
              <span>/</span>
              <Link to="/app/calendar" className="hover:text-orange-600 transition-colors">
                Study Calendar
              </Link>
              <span>/</span>
              <span className="truncate font-bold text-orange-600">Phiên học</span>
            </div>
            <h1 className="truncate text-base font-extrabold tracking-tight sm:text-lg text-slate-800">
               {task?.title ?? state.title ?? "Study Session"}
            </h1>
            <p className="mt-0.5 truncate text-xs font-semibold text-slate-400">{roadmapStep?.title ?? state.subject ?? "Bài học hiện tại"}</p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ring-1 ${
                isSessionCompleted
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : "bg-orange-50 text-orange-700 ring-orange-200"
              }`}
            >
              <Sparkles size={13} />
              {formatStatusLabel(task?.status)}
            </span>
          </div>
        </div>
      </header>

      {/* ── Main Layout ───────────────────────────── */}
      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
          {/* ── Left column: content ────────────────── */}
          <section className="space-y-6 lg:col-span-2">
            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold">Không thể tải hoặc cập nhật phiên học</p>
                    <p className="mt-1 leading-6">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 w-2/5 rounded bg-slate-200" />
                  <div className="h-4 w-1/3 rounded bg-slate-200" />
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="h-48 rounded-2xl bg-slate-100" />
                    <div className="h-48 rounded-2xl bg-slate-100" />
                  </div>
                  <div className="h-64 rounded-2xl bg-slate-100" />
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-8 rounded-[24px] border border-slate-100 bg-white p-6 md:p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)]">
                  {/* Info badges */}
                  <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-[0.15em]">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-orange-600 border border-orange-100/60 shadow-sm shadow-orange-50/50">
                      <Target size={12} className="stroke-[2.5]" /> Study focus
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-indigo-600 border border-indigo-100/60 shadow-sm shadow-indigo-50/50">
                      <Clock3 size={12} className="stroke-[2.5]" /> {formatDate(task?.taskDate)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-slate-600 border border-slate-100 shadow-sm shadow-slate-50/50">
                      <BookOpen size={12} className="stroke-[2.5]" /> {task?.category ?? "Study"}
                    </span>
                  </div>

                  {/* Title row */}
                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
                    <div>
                      <h2 className="text-xl font-extrabold tracking-tight text-slate-800 lg:text-2xl">{task?.title ?? "Study Session"}</h2>
                      <p className="mt-2.5 text-sm leading-6 text-slate-500 font-semibold">
                        {roadmapStep?.subtitle ?? task?.description ?? "Hoàn thành bài học theo luồng Study Session."}
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                      <MetricCard label="Trạng thái task" value={formatStatusLabel(task?.status)} />
                      <MetricCard label="Mức ưu tiên" value={task?.priority ?? "NORMAL"} />
                      <MetricCard label="Phiên hiện tại" value={hasStartedSession ? "Đang mở" : "Chưa bắt đầu"} />
                    </div>
                  </div>

                  {/* Study summary */}
                  <section className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50/30 to-amber-50/20 p-6 relative overflow-hidden shadow-sm shadow-orange-100/10">
                    {/* Decorative bubble */}
                    <div className="absolute -right-10 -top-10 w-24 h-24 bg-orange-200/20 rounded-full blur-xl pointer-events-none" />
                    <div className="flex items-start gap-4 relative z-10">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-[0_8px_20px_-6px_rgba(249,115,22,0.4)]">
                        <Sparkles size={20} className="animate-pulse" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-600">Study summary</p>
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-100 px-2 py-0.5 text-[8px] font-bold text-orange-700">
                            AI Suggested
                          </span>
                        </div>
                        <h3 className="mt-1 text-base font-extrabold tracking-tight text-slate-800">
                          {roadmapStep?.title ?? task?.title ?? "Study Session"}
                        </h3>
                        <p className="mt-3 text-xs leading-6 text-slate-600 font-semibold line-clamp-3" title={roadmapStep?.summary ?? task?.description ?? ""}>
                          {roadmapStep?.summary ?? task?.description ?? "Backend chưa trả summary cho bước học này."}
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-3 relative z-10">
                      <PillStat label="Estimated" value={roadmapStep?.estimatedMinutes ? `${roadmapStep.estimatedMinutes} phút` : task?.durationMinutes ? `${task.durationMinutes} phút` : "--"} />
                      <PillStat label="Roadmap" value={formatStatusLabel(roadmapStep?.status)} />
                      <PillStat label="Session" value={hasStartedSession ? "Đang mở" : "Chưa bắt đầu"} />
                    </div>
                  </section>

                  {/* Subtitle + Practice */}
                  <section className="grid gap-5 sm:grid-cols-2">
                    <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.01)] transition hover:-translate-y-0.5 hover:shadow-md">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm shadow-slate-900/10">
                          <FileText size={18} />
                        </div>
                        <div>
                          <h3 className="text-xs font-extrabold tracking-tight text-slate-800">Roadmap subtitle</h3>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tóm tắt nội dung</p>
                        </div>
                      </div>
                      <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                        <p className="text-xs leading-6 text-slate-600 font-medium line-clamp-2" title={roadmapStep?.subtitle ?? ""}>
                          {roadmapStep?.subtitle ?? "Chưa có subtitle cho roadmap step này."}
                        </p>
                      </div>
                    </article>

                    <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.01)] transition hover:-translate-y-0.5 hover:shadow-md">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 border border-orange-100/60 shadow-sm shadow-orange-50/50">
                          <BookOpen size={18} />
                        </div>
                        <div>
                          <h3 className="text-xs font-extrabold tracking-tight text-slate-800">Practice prompt</h3>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Luyện tập nhanh</p>
                        </div>
                      </div>
                      {practice ? (
                        <div className="mt-4 space-y-3">
                          <div className="rounded-xl border border-orange-100/60 bg-orange-50/30 p-3.5">
                            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-600">Prompt</p>
                            <p className="mt-1 text-xs leading-5 text-slate-700 font-medium line-clamp-3" title={practice.prompt}>
                              {practice.prompt}
                            </p>
                          </div>
                          <div className="rounded-xl border border-emerald-100/60 bg-emerald-50/30 p-3.5">
                            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-600">Expected output</p>
                            <p className="mt-1 text-xs leading-5 text-emerald-900/90 font-medium line-clamp-3" title={practice.expectedOutput}>
                              {practice.expectedOutput}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-xs leading-6 text-slate-400 italic">
                          Chưa có bài luyện tập cho task này.
                        </div>
                      )}
                    </article>
                  </section>

                  {/* Lists */}
                  <section className="grid gap-4 sm:grid-cols-2">
                    <SectionCard title="What to learn" items={normalizeList(roadmapStep?.whatToLearn)} emptyText="Chưa có mục tiêu học." accent="orange" />
                    <SectionCard title="Key concepts" items={normalizeList(roadmapStep?.keyConcepts)} emptyText="Chưa có khái niệm cốt lõi." accent="slate" />
                    <SectionCard title="Learning outcomes" items={normalizeList(roadmapStep?.learningOutcomes)} emptyText="Chưa có kết quả học mong muốn." accent="emerald" />
                    <SectionCard title="Recommended focus" items={normalizeList(roadmapStep?.recommendedFocus)} emptyText="Chưa có phần tập trung khuyến nghị." accent="amber" />
                  </section>

                  {/* Resources */}
                  <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.01)] lg:p-6 transition hover:shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 border border-orange-100/60 shadow-sm shadow-orange-50/50">
                        <WandSparkles size={18} />
                      </div>
                      <div>
                        <h3 className="text-xs font-extrabold tracking-tight text-slate-800">Resources</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tài nguyên gợi ý từ AI</p>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {resources.length > 0 ? (
                        resources.map((resource, index) => (
                          <a
                            key={`${resource.resourceId ?? resource.title ?? index}`}
                            href={resource.url ?? "#"}
                            target={resource.url ? "_blank" : undefined}
                            rel={resource.url ? "noreferrer" : undefined}
                            className="group relative rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:bg-orange-50/20 hover:shadow-lg hover:shadow-orange-500/5"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-xs font-extrabold text-slate-800 group-hover:text-orange-600 transition-colors">{resource.title ?? "Untitled resource"}</p>
                                <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                  {resource.platform ?? resource.resourceType ?? "Resource"}
                                </span>
                              </div>
                              {resource.aiRecommended ? (
                                <span className="flex h-5 items-center gap-0.5 rounded-full bg-orange-100 px-1.5 py-0.5 text-[8px] font-black text-orange-600 uppercase tracking-widest animate-pulse">
                                  <Sparkles size={8} /> AI
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-3 text-[11px] leading-5 text-slate-500 font-medium line-clamp-2">{resource.reason ?? resource.content ?? "Tài liệu học tập bổ trợ."}</p>
                          </a>
                        ))
                      ) : (
                        <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-4 text-xs text-slate-400 italic md:col-span-2 xl:col-span-3">
                          Chưa có tài nguyên bổ trợ cho phiên học này.
                        </div>
                      )}
                    </div>
                  </article>
                </div>
              </>
            )}
          </section>

          {/* ── Right sidebar: Interactive Control Center ────── */}
          <aside className="lg:sticky lg:top-24 self-start">
            <div className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-[0_8px_20px_-6px_rgba(249,115,22,0.4)]">
                  <Timer size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold tracking-tight text-slate-800">Session controls</h3>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Điều phối Pomodoro</p>
                </div>
              </div>

              {/* ── Premium Pomodoro Timer Widget ── */}
              {hasStartedSession && !isSessionCompleted && (
                <div className="mt-5 space-y-4">
                  {/* Phase-aware timer card */}
                  <div className={`relative rounded-3xl border-2 p-6 text-center transition-all duration-500 shadow-md ${
                    pomodoroPhase !== "FOCUS"
                      ? "border-emerald-100 bg-gradient-to-br from-emerald-50/40 to-teal-50/20 shadow-emerald-500/5"
                      : "border-orange-100 bg-gradient-to-br from-orange-50/40 to-amber-50/20 shadow-orange-500/5"
                  }`}>
                    {/* Floating accent dot */}
                    <div className={`absolute top-4 right-4 h-2.5 w-2.5 rounded-full ${
                      isTimerRunning ? "animate-ping" : ""
                    } ${pomodoroPhase !== "FOCUS" ? "bg-emerald-500" : "bg-orange-500"}`} />

                    {/* Phase title */}
                    <p className={`text-[9px] font-black uppercase tracking-[0.25em] ${
                      pomodoroPhase !== "FOCUS" ? "text-emerald-600" : "text-orange-600"
                    }`}>
                      {pomodoroPhase === "SHORT_BREAK"
                        ? "☕ Nghỉ giải lao (5 phút)"
                        : pomodoroPhase === "LONG_BREAK"
                        ? "🌿 Nghỉ dài (15 phút)"
                        : "🎯 Thời gian tập trung"}
                    </p>

                    {/* Running status text */}
                    <p className="mt-1 text-[8px] font-extrabold uppercase tracking-widest text-slate-400">
                      {isTimerRunning ? "ĐANG TẬP TRUNG" : "ĐÃ TẠM DỪNG"}
                    </p>

                    {/* Giant countdown */}
                    <div className={`mt-3 font-mono text-[3.8rem] font-black tracking-tight tabular-nums leading-none transition-colors duration-500 ${
                      pomodoroPhase !== "FOCUS" ? "text-emerald-600" : "text-orange-600"
                    } ${isTimerRunning && timeLeft <= 10 ? "animate-pulse text-red-500" : ""}`}>
                      {formatTimer(timeLeft)}
                    </div>

                    {/* Progress stats */}
                    <div className="mt-4 flex items-center justify-center gap-2.5 text-[11px] font-semibold">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock3 size={11} />{" "}
                        <span className="font-extrabold text-slate-600">{elapsedStudyMinutes} phút</span>
                        {" đã học"}
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className={`font-extrabold ${hasMetMinimum ? "text-emerald-600" : "text-orange-500"}`}>
                        {hasMetMinimum ? "✓ Đạt chỉ tiêu" : `Cần tối thiểu ${minimumRequiredMinutes}m`}
                      </span>
                    </div>
                  </div>

                  {/* Control buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    {isTimerRunning ? (
                      <button
                        type="button"
                        onClick={handlePausePomodoro}
                        disabled={isSubActionLoading}
                        className="col-span-2 flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/80 py-3 text-xs font-bold text-amber-800 shadow-sm transition hover:bg-amber-100 active:scale-95 disabled:opacity-50"
                      >
                        <PauseCircle size={14} className="stroke-[2.5]" /> Tạm dừng
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResumePomodoro}
                        disabled={isSubActionLoading}
                        className={`col-span-2 flex items-center justify-center gap-1.5 rounded-xl border py-3 text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-50 ${
                          pomodoroPhase !== "FOCUS"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                            : "border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100"
                        }`}
                      >
                        {isSubActionLoading
                          ? <LoaderCircle size={14} className="animate-spin" />
                          : <Play size={14} className="stroke-[2.5]" />}
                        {" "}Bắt đầu
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleNextPhase}
                      disabled={isSubActionLoading}
                      className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-bold text-slate-500 shadow-sm transition hover:bg-slate-100 active:scale-95 disabled:opacity-50"
                      title="Bỏ qua phase"
                    >
                      <SkipForward size={14} /> Bỏ qua
                    </button>
                  </div>
                </div>
              )}

              {/* ── Metadata Metrics ────────────────── */}
              <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/50 p-4.5 space-y-3 text-xs font-semibold">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Trạng thái phiên</span>
                  <span className={`font-black ${isSessionCompleted ? "text-emerald-600" : hasStartedSession ? "text-orange-600" : "text-slate-500"}`}>
                    {isSessionCompleted ? "Đã hoàn thành" : hasStartedSession ? "Đang diễn ra" : "Chưa bắt đầu"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Yêu cầu tối thiểu</span>
                  <span className="font-extrabold text-slate-700">
                    {minimumRequiredMinutes} phút
                  </span>
                </div>
                {elapsedStudyMinutes > 0 && (
                   <div className="flex items-center justify-between gap-3">
                     <span className="text-slate-400">Đã tích lũy</span>
                     <span className={`font-black ${hasMetMinimum ? "text-emerald-600" : "text-slate-700"}`}>
                       {elapsedStudyMinutes} phút
                     </span>
                   </div>
                )}
              </div>

              {/* ── Action Triggers ──────────────────── */}
              {isSessionCompleted ? (
                <div className="mt-5 rounded-2xl border border-emerald-100/60 bg-emerald-50/40 p-5 text-center shadow-sm">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-sm shadow-emerald-100/20 mb-3">
                    <CheckCircle2 size={20} className="stroke-[2.5]" />
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-800">🎉 Đã hoàn thành mục học</h4>
                  <p className="mt-1 text-[11px] leading-5 text-slate-500">Tiến độ đã được đồng bộ lên lộ trình cá nhân của bạn.</p>
                </div>
              ) : !hasStartedSession ? (
                <div className="mt-5 space-y-4">
                  <div className="rounded-xl border border-orange-100/60 bg-orange-50/20 p-4 text-[11px] leading-5 text-slate-500">
                    {canStartByDate
                      ? "Nhấn nút dưới để bắt đầu chu kỳ tập trung học 25 phút bằng đồng hồ Pomodoro."
                      : "Mục học này chưa đến hạn. Bạn vẫn có thể mở học trước nếu muốn."}
                  </div>
                  <button
                    type="button"
                    onClick={handleStartSession}
                    disabled={!canStart}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-4 text-sm font-extrabold text-white shadow-lg shadow-orange-500/20 transition hover:from-orange-600 hover:to-amber-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isStarting ? <LoaderCircle size={15} className="animate-spin" /> : <PlayCircle size={15} />}
                    {canStartByDate ? "🚀 Bắt đầu tập trung (Pomodoro)" : "⏳ Vẫn mở học trước hạn"}
                  </button>
                </div>
              ) : (
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={handleTriggerReviewModal}
                    disabled={isFinishing}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/20 transition hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] disabled:opacity-50"
                  >
                    {isFinishing ? <LoaderCircle size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                    🏆 Kết thúc phiên học
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* ── 🌟 REVIEW FORM OVERLAY MODAL (NOTES & FOCUS SCORE INPUT) ── */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md transition-all duration-300">
          <div className="w-full max-w-md rounded-[28px] border border-slate-100/80 bg-white/95 p-6 shadow-[0_30px_70px_rgba(0,0,0,0.1)] relative">
            <button
              type="button"
              onClick={() => {
                setShowReviewModal(false);
                if (activeSessionId) setIsTimerRunning(true); 
              }}
              className="absolute top-5 right-5 h-8 w-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100/60 shadow-sm shadow-emerald-50/50">
                <BookOpen size={18} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-800">Đánh giá phiên học</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Báo cáo tiến độ học tập AI</p>
              </div>
            </div>

            <div className="mt-5 space-y-5">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Mức độ tập trung (Focus Score)</label>
                <div className="mt-2.5 flex items-center gap-2 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={`star-${star}`}
                      type="button"
                      onClick={() => setReviewFocusScore(star)}
                      className="transition-transform active:scale-90 hover:scale-110"
                    >
                      <Star
                        size={28}
                        className={star <= reviewFocusScore ? "fill-amber-400 text-amber-400" : "text-slate-200"}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-extrabold text-slate-500 ml-2">({reviewFocusScore}/5 sao)</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Nhật ký / Ghi chú buổi học (Notes)</label>
                <textarea
                  rows={4}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Hôm nay bạn học được những gì? Ghi chú lại lỗi sai hoặc kiến thức trọng tâm để AI theo dõi..."
                  className="mt-2.5 w-full rounded-2xl border border-slate-200 p-3.5 text-xs text-slate-600 placeholder-slate-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:outline-none custom-scrollbar transition-all"
                />
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 text-[11px] text-slate-400 leading-relaxed font-semibold">
                💡 <strong className="text-slate-600">Quy chế tính tiến độ:</strong> Thời gian học thực tế hiện tại là <span className="font-extrabold text-slate-700">{elapsedStudyMinutes} phút</span>. Bạn cần học đủ <span className="font-extrabold text-orange-600">{minimumRequiredMinutes} phút</span> để hệ thống chuyển trạng thái sang <strong className="text-emerald-600">COMPLETED</strong>.
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowReviewModal(false);
                  if (activeSessionId) setIsTimerRunning(true);
                }}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition active:scale-95"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmFinishSession}
                disabled={isFinishing}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-xs font-bold text-white hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-500/10 transition active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isFinishing && <LoaderCircle size={13} className="animate-spin" />}
                💾 Xác nhận đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ✅ COMPONENTS CON
function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4 transition-all hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.05)]">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-black text-slate-800 tracking-tight">{value}</p>
    </div>
  );
}

function PillStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3.5 text-slate-900 shadow-sm transition hover:shadow-md">
      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1.5 text-xs font-extrabold text-slate-800">{value}</p>
    </div>
  );
}

function SectionCard({
  title,
  items,
  emptyText,
  accent,
}: {
  title: string;
  items: string[];
  emptyText: string;
  accent: "orange" | "slate" | "emerald" | "amber";
}) {
  const accentClasses: Record<string, string> = {
    orange: "border-orange-100/70 bg-gradient-to-br from-orange-50/45 to-amber-50/15 shadow-sm",
    slate: "border-slate-200 bg-slate-50/50",
    emerald: "border-emerald-100/70 bg-gradient-to-br from-emerald-50/45 to-teal-50/15 shadow-sm",
    amber: "border-amber-100/70 bg-gradient-to-br from-amber-50/45 to-yellow-50/15 shadow-sm",
  };

  const bulletColors: Record<string, string> = {
    orange: "bg-orange-500 shadow-orange-200",
    slate: "bg-slate-400 shadow-slate-200",
    emerald: "bg-emerald-500 shadow-emerald-200",
    amber: "bg-amber-500 shadow-amber-200",
  };

  return (
    <div className={`rounded-2xl border p-5 transition-all hover:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.02)] ${accentClasses[accent]}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-3.5 space-y-2.5">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="flex gap-2.5 text-xs leading-5 text-slate-600 font-semibold">
              <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full shadow-sm ${bulletColors[accent]}`} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs leading-5 text-slate-400 italic">{emptyText}</p>
      )}
    </div>
  );
}
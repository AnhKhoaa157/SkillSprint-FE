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
    <div className="min-h-screen bg-slate-50 text-slate-900">
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
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <button type="button" onClick={goBack} className="inline-flex items-center gap-1 hover:text-orange-600">
                <ArrowLeft size={14} /> Quay lại
              </button>
              <span>/</span>
              <Link to="/app/calendar" className="hover:text-orange-600">
                Study Calendar
              </Link>
              <span>/</span>
              <span className="truncate font-semibold text-orange-600">Phiên học</span>
            </div>
            <h1 className="truncate text-lg font-black tracking-tight sm:text-xl">
              {task?.title ?? state.title ?? "Study Session"}
            </h1>
            <p className="mt-1 truncate text-sm text-slate-500">{roadmapStep?.title ?? state.subject ?? "Bài học hiện tại"}</p>
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
                <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  {/* Info badges */}
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-orange-700 ring-1 ring-orange-100">
                      <Target size={13} /> Study focus
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-orange-700 ring-1 ring-orange-100">
                      <Clock3 size={13} /> {formatDate(task?.taskDate)}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-slate-600 ring-1 ring-slate-200">
                      <BookOpen size={13} /> {task?.category ?? "Study"}
                    </span>
                  </div>

                  {/* Title row */}
                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-slate-800 lg:text-3xl">{task?.title ?? "Study Session"}</h2>
                      <p className="mt-3 text-base leading-7 text-slate-600">
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
                  <section className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-sm">
                        <Sparkles size={22} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-700">Study summary</p>
                        <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-800">
                          {roadmapStep?.title ?? task?.title ?? "Study Session"}
                        </h3>
                        <p className="mt-3 text-base leading-7 text-slate-600 line-clamp-3" title={roadmapStep?.summary ?? task?.description ?? ""}>
                          {roadmapStep?.summary ?? task?.description ?? "Backend chưa trả summary cho bước học này."}
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <PillStat label="Estimated" value={roadmapStep?.estimatedMinutes ? `${roadmapStep.estimatedMinutes} phút` : task?.durationMinutes ? `${task.durationMinutes} phút` : "--"} />
                      <PillStat label="Roadmap" value={formatStatusLabel(roadmapStep?.status)} />
                      <PillStat label="Session" value={hasStartedSession ? "Đang mở" : "Chưa bắt đầu"} />
                    </div>
                  </section>

                  {/* Subtitle + Practice */}
                  <section className="grid gap-4 sm:grid-cols-2">
                    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                          <FileText size={18} />
                        </div>
                        <div>
                          <h3 className="text-base font-black tracking-tight">Roadmap subtitle</h3>
                          <p className="text-sm text-slate-500">Tóm tắt phần học hiện tại</p>
                        </div>
                      </div>
                      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm leading-7 text-slate-700 line-clamp-2" title={roadmapStep?.subtitle ?? ""}>
                          {roadmapStep?.subtitle ?? "Chưa có subtitle cho roadmap step này."}
                        </p>
                      </div>
                    </article>

                    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                          <BookOpen size={18} />
                        </div>
                        <div>
                          <h3 className="text-base font-black tracking-tight">Practice prompt</h3>
                          <p className="text-sm text-slate-500">Bài luyện tập ngắn theo đúng MVP</p>
                        </div>
                      </div>
                      {practice ? (
                        <div className="mt-5 space-y-3">
                          <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">Prompt</p>
                            <p className="mt-2 text-sm leading-7 text-slate-800 line-clamp-3" title={practice.prompt}>
                              {practice.prompt}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Expected output</p>
                            <p className="mt-2 text-sm leading-7 text-emerald-950/90 line-clamp-3" title={practice.expectedOutput}>
                              {practice.expectedOutput}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                          Chưa có practice prompt cho task này.
                        </div>
                      )}
                    </article>
                  </section>

                  {/* Lists */}
                  <section className="grid gap-4 sm:grid-cols-2">
                    <SectionCard title="What to learn" items={normalizeList(roadmapStep?.whatToLearn)} emptyText="Backend chưa trả danh sách mục tiêu học." accent="orange" />
                    <SectionCard title="Key concepts" items={normalizeList(roadmapStep?.keyConcepts)} emptyText="Backend chưa trả key concepts." accent="slate" />
                    <SectionCard title="Learning outcomes" items={normalizeList(roadmapStep?.learningOutcomes)} emptyText="Backend chưa trả learning outcomes." accent="emerald" />
                    <SectionCard title="Recommended focus" items={normalizeList(roadmapStep?.recommendedFocus)} emptyText="Backend chưa trả recommended focus." accent="amber" />
                  </section>

                  {/* Resources */}
                  <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                        <WandSparkles size={18} />
                      </div>
                      <div>
                        <h3 className="text-base font-black tracking-tight">Resources</h3>
                        <p className="text-sm text-slate-500">Tài nguyên gợi ý từ backend cho phiên học này</p>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {resources.length > 0 ? (
                        resources.map((resource, index) => (
                          <a
                            key={`${resource.resourceId ?? resource.title ?? index}`}
                            href={resource.url ?? "#"}
                            target={resource.url ? "_blank" : undefined}
                            rel={resource.url ? "noreferrer" : undefined}
                            className="group rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50/50"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-slate-900">{resource.title ?? "Untitled resource"}</p>
                                <p className="mt-1 text-xs text-slate-500">{resource.platform ?? resource.resourceType ?? "Resource"}</p>
                              </div>
                              {resource.aiRecommended ? <Sparkles size={15} className="text-orange-500" /> : null}
                            </div>
                            <p className="mt-3 text-sm leading-6 text-slate-600">{resource.reason ?? resource.content ?? "Backend resource."}</p>
                          </a>
                        ))
                      ) : (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 md:col-span-2 xl:col-span-3">
                          Chưa có tài nguyên cho phiên học này.
                        </div>
                      )}
                    </div>
                  </article>
                </div>
              </>
            )}
          </section>

          {/* ── Right sidebar: Interactive Control Center ────── */}
          <aside className="lg:sticky lg:top-6 self-start">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-sm">
                  <Timer size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">Session controls</h3>
                  <p className="text-sm text-slate-500">Điều phối chu kỳ Pomodoro</p>
                </div>
              </div>

              {/* ── Premium Pomodoro Timer Widget ── */}
              {hasStartedSession && !isSessionCompleted && (
                <div className="mt-5 space-y-3">
                  {/* Phase-aware timer card */}
                  <div className={`relative rounded-2xl border-2 p-5 text-center transition-colors duration-500 ${
                    pomodoroPhase !== "FOCUS"
                      ? "border-green-200 bg-gradient-to-br from-green-50 to-emerald-50/80"
                      : "border-red-200 bg-gradient-to-br from-red-50/80 to-orange-50/60"
                  }`}>
                    {/* Phase title */}
                    <p className={`text-[10px] font-black uppercase tracking-[0.22em] ${
                      pomodoroPhase !== "FOCUS" ? "text-green-600" : "text-red-500"
                    }`}>
                      {pomodoroPhase === "SHORT_BREAK"
                        ? "☕ Nghỉ giải lao (5 phút)"
                        : pomodoroPhase === "LONG_BREAK"
                        ? "🌿 Nghỉ dài (15 phút)"
                        : "🎯 Thời gian tập trung"}
                    </p>

                    {/* Running indicator */}
                    <div className="mt-1.5 flex items-center justify-center gap-1.5">
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                        isTimerRunning
                          ? pomodoroPhase !== "FOCUS"
                            ? "bg-green-500 animate-pulse"
                            : "bg-red-500 animate-pulse"
                          : "bg-amber-400"
                      }`} />
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                        {isTimerRunning ? "ĐANG CHẠY" : "ĐÃ TẠM DỪNG"}
                      </span>
                    </div>

                    {/* Giant countdown */}
                    <div className={`mt-3 font-mono text-[3.5rem] font-black tabular-nums leading-none transition-colors duration-500 ${
                      pomodoroPhase !== "FOCUS" ? "text-green-500" : "text-red-500"
                    } ${isTimerRunning && timeLeft <= 10 ? "animate-pulse" : ""}`}>
                      {formatTimer(timeLeft)}
                    </div>

                    {/* Progress stats */}
                    <div className="mt-3 flex items-center justify-center gap-3 text-xs">
                      <span className="text-slate-400">
                        ⏱{" "}
                        <span className="font-bold text-slate-600">{elapsedStudyMinutes} phút</span>
                        {" học"}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className={`font-bold ${hasMetMinimum ? "text-green-600" : "text-orange-500"}`}>
                        {hasMetMinimum ? "✓ Đủ điều kiện" : `Cần ${minimumRequiredMinutes} phút`}
                      </span>
                    </div>
                  </div>

                  {/* Control buttons: [Tạm dừng/Bắt đầu ×2] [Bỏ qua ×1] */}
                  <div className="grid grid-cols-3 gap-2">
                    {isTimerRunning ? (
                      <button
                        type="button"
                        onClick={handlePausePomodoro}
                        disabled={isSubActionLoading}
                        className="col-span-2 flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 py-2.5 text-xs font-bold text-amber-800 shadow-sm transition hover:bg-amber-100 active:scale-95 disabled:opacity-50"
                      >
                        <PauseCircle size={13} /> Tạm dừng
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResumePomodoro}
                        disabled={isSubActionLoading}
                        className={`col-span-2 flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-50 ${
                          pomodoroPhase !== "FOCUS"
                            ? "border-green-200 bg-green-50 text-green-800 hover:bg-green-100"
                            : "border-red-200 bg-red-50 text-red-800 hover:bg-red-100"
                        }`}
                      >
                        {isSubActionLoading
                          ? <LoaderCircle size={13} className="animate-spin" />
                          : <Play size={13} />}
                        {" "}Bắt đầu
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleNextPhase}
                      disabled={isSubActionLoading}
                      className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-100 active:scale-95 disabled:opacity-50"
                      title="Bỏ qua / chuyển phase"
                    >
                      <SkipForward size={13} /> Bỏ qua
                    </button>
                  </div>
                </div>
              )}

              {/* ── Metadata Metrics ────────────────── */}
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">Session state</span>
                  <span className={`font-bold ${isSessionCompleted ? "text-emerald-600" : hasStartedSession ? "text-orange-600" : "text-slate-700"}`}>
                    {isSessionCompleted ? "Completed" : hasStartedSession ? "In progress" : "Not started"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">Học tối thiểu</span>
                  <span className={`font-bold ${hasMetMinimum ? "text-emerald-600" : "text-amber-600"}`}>
                    {minimumRequiredMinutes} phút
                  </span>
                </div>
                {elapsedStudyMinutes > 0 && (
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-500">Thời gian tích lũy</span>
                    <span className={`font-bold ${hasMetMinimum ? "text-emerald-600" : "text-slate-700"}`}>
                      {elapsedStudyMinutes} phút
                    </span>
                  </div>
                )}
              </div>

              {/* ── Action Triggers ──────────────────── */}
              {isSessionCompleted ? (
                <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-sm mb-3">
                    <CheckCircle2 size={24} />
                  </div>
                  <h4 className="text-lg font-black text-slate-900">🎉 Bài học đã hoàn thành!</h4>
                  <p className="mt-1 text-xs text-slate-600">Hệ thống đã đồng bộ trạng thái COMPLETED lên lộ trình.</p>
                </div>
              ) : !hasStartedSession ? (
                <div className="mt-5 space-y-4">
                  <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-4 text-xs leading-5 text-slate-600">
                    {canStartByDate
                      ? "Bấm bắt đầu để tạo Study Session thực tế, đồng thời kích hoạt chu trình Pomodoro 25 phút."
                      : "Mục học này chưa đến ngày thực hiện trên lịch trình. Bạn có thể mở trước nếu muốn."}
                  </div>
                  <button
                    type="button"
                    onClick={handleStartSession}
                    disabled={!canStart}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-4 text-sm font-bold text-white shadow-lg transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isStarting ? <LoaderCircle size={16} className="animate-spin" /> : <PlayCircle size={16} />}
                    {canStartByDate ? "🚀 Bắt đầu tập trung (Pomodoro)" : "⏳ Vẫn mở học trước hạn"}
                  </button>
                </div>
              ) : (
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={handleTriggerReviewModal}
                    disabled={isFinishing}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-4 text-sm font-bold text-white shadow-lg transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {isFinishing ? <LoaderCircle size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-[24px] border border-slate-100 bg-white p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => {
                setShowReviewModal(false);
                if (activeSessionId) setIsTimerRunning(true); 
              }}
              className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <BookOpen size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Đánh giá phiên học</h3>
                <p className="text-xs text-slate-500">Đồng bộ báo cáo tiến độ học tập AI</p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Mức độ tập trung (Focus Score)</label>
                <div className="mt-2 flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={`star-${star}`}
                      type="button"
                      onClick={() => setReviewFocusScore(star)}
                      className="transition-transform active:scale-95"
                    >
                      <Star
                        size={28}
                        className={star <= reviewFocusScore ? "fill-amber-400 text-amber-400" : "text-slate-300"}
                      />
                    </button>
                  ))}
                  <span className="text-sm font-bold text-slate-600 ml-2">({reviewFocusScore}/5 sao)</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nhật ký / Ghi chú buổi học (Notes)</label>
                <textarea
                  rows={4}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Hôm nay bạn học được những gì? Ghi chú lại lỗi sai hoặc kiến thức trọng tâm để AI theo dõi..."
                  className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-orange-500 focus:outline-none custom-scrollbar"
                />
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-500 leading-relaxed">
                💡 <strong>Quy chế tính tiến độ:</strong> Thời gian học thực tế hiện tại là <span className="font-bold text-slate-800">{elapsedStudyMinutes} phút</span>. Bạn cần học đủ <span className="font-bold text-orange-600">{minimumRequiredMinutes} phút</span> để hệ thống chuyển trạng thái sang <strong>COMPLETED</strong>.
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowReviewModal(false);
                  if (activeSessionId) setIsTimerRunning(true);
                }}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmFinishSession}
                disabled={isFinishing}
                className="flex-1 py-3 rounded-xl bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700 shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isFinishing && <LoaderCircle size={14} className="animate-spin" />}
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
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-bold text-slate-800">{value}</p>
    </div>
  );
}

function PillStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-bold text-slate-800">{value}</p>
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
    orange: "border-orange-100 bg-orange-50/70",
    slate: "border-slate-200 bg-slate-50",
    emerald: "border-emerald-100 bg-emerald-50/70",
    amber: "border-amber-100 bg-amber-50/70",
  };

  return (
    <div className={`rounded-xl border p-5 shadow-sm ${accentClasses[accent]}`}>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="flex gap-2 text-sm leading-6 text-slate-700">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm leading-6 text-slate-500">{emptyText}</p>
      )}
    </div>
  );
}
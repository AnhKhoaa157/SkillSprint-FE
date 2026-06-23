import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Brain,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Clock3,
  Coffee,
  Dices,
  ExternalLink,
  FileText,
  Gamepad2,
  Leaf,
  Lightbulb,
  LoaderCircle,
  Lock,
  PlayCircle,
  RefreshCw,
  Rocket,
  Save,
  Sparkles,
  Target,
  Timer,
  WandSparkles,
  PauseCircle,
  Play,
  SkipForward,
  Star,
  Trophy,
  PartyPopper,
  X,
  CalendarDays,
} from "lucide-react";
import studySessionService from "../../../api/learning/studySessionService";
import type { StudySessionDetailResponse } from "../../../api/learning/studySessionService";
import materialService, { type UploadedMaterialResponse } from "../../../api/learning/materialService";
import quizService from "../../../api/learning/quizService";
import roadmapService from "../../../api/learning/roadmapService";
import type { QuizAttemptResponse } from "../../../api/learning/quizService";
import { usePomodoro, type PomodoroPhase } from "../../contexts/PomodoroContext";
import { toast } from "sonner";
import { useSubscription } from "../../../hooks/useSubscription";
import { PricingModal } from "../../components/modals/PricingModal";
import calendarService from "../../../api/utilities/calendarService";
import { getMyPointEvents } from "../../../api/learning/pointService";
import type { MyPointEvent } from "../../../api/core/skillSprintModels";
import QuizContainer from "../../components/tools/QuizContainer";

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

// Backend CalendarService gates the ROADMAP_STEP_COMPLETED point event behind a
// hardcoded MIN_STEP_POINT_STUDY_MINUTES = 20 studied-minutes threshold. If the FE
// requires anything less, the user can hit 100% / trigger the celebration modal
// while the backend silently refuses to award points. Clamp the requirement so the
// UI never promises completion the backend won't reward.
const MIN_STEP_POINT_STUDY_MINUTES = 20;

function computeMinimumRequiredMinutes(taskDurationMinutes: number | null | undefined): number {
  if (!taskDurationMinutes || taskDurationMinutes <= 0) return MIN_STEP_POINT_STUDY_MINUTES;
  const calculated = Math.ceil(taskDurationMinutes * 0.3);
  return Math.max(calculated, MIN_STEP_POINT_STUDY_MINUTES);
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

  // Tracks the last time each (type + message) toast fired so the same event
  // trigger can never stack duplicate notifications inside the player view.
  const recentToastRef = useRef<Map<string, number>>(new Map());
  const showToast = useCallback((type: "success" | "warning" | "error", message: string) => {
    const key = `${type}:${message}`;
    const now = Date.now();
    const last = recentToastRef.current.get(key) ?? 0;
    // Collapse identical notifications fired within a short window (re-renders,
    // double event handlers, rapid retries) into a single toast.
    if (now - last < 4000) return;
    recentToastRef.current.set(key, now);
    // Reuse a stable sonner id keyed by content: even if two calls slip through
    // concurrently, sonner replaces the existing toast instead of stacking.
    const options = { id: key };
    if (type === "success") {
      toast.success(message, options);
    } else if (type === "error") {
      toast.error(message, options);
    } else {
      toast.warning(message, options);
    }
  }, []);

  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    return taskId ? readStoredSessionId(taskId) : null;
  });

  const {
    timeLeft,
    isTimerRunning,
    pomodoroPhase,
    actualStudySeconds,
    activeStepId,
    startTimer,
    pauseTimer,
    skipToNextPhase,
    clearTimerContext,
    hydrateTimer,
    isNavigationBlocked,
    proceedNavigation,
    resetNavigation,
    formattedStudyTime,
    fastForwardTime,
  } = usePomodoro();

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewFocusScore, setReviewFocusScore] = useState(5);
  const [pricingOpen, setPricingOpen] = useState(false);

  const [latestAttempt, setLatestAttempt] = useState<QuizAttemptResponse | null>(null);
  const [hasQuizCreated, setHasQuizCreated] = useState(false); // NÂNG CẤP CHÍ MẠCH: Ghim giữ trạng thái nhận diện bộ đề
  const [loadingQuizMeta, setLoadingQuizMeta] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizStatus, setQuizStatus] = useState<"idle" | "passed" | "failed">("idle");

  const [materials, setMaterials] = useState<UploadedMaterialResponse[]>([]);
  const [viewingMaterialId, setViewingMaterialId] = useState<string | null>(null);

  const [isSubActionLoading, setIsSubActionLoading] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleTaskInfo, setRescheduleTaskInfo] = useState<{
    taskId: string;
    title: string;
    originalDate: string;
    newDate: string;
  } | null>(null);
  // ── "Study ahead" (current task scheduled in the future) ──
  // Distinct from the next-step reschedule flow above: this reschedules / opens the
  // task currently loaded in the player, without navigating away.
  const [showStudyAheadModal, setShowStudyAheadModal] = useState(false);
  const [studyAheadDate, setStudyAheadDate] = useState<string>(() => new Date().toLocaleDateString("sv-SE"));
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [sideTab, setSideTab] = useState<"pomodoro" | "quiz">("pomodoro");
  const { planId, rawPlanType, refresh: refreshSubscription } = useSubscription();
  const isPremiumMember = planId === "PREMIUM";
  // PricingModal speaks plan *slugs*; map our NormalizedPlanId to its vocabulary.
  const pricingCurrentPlan =
    planId === "PREMIUM" ? "career_premium" : planId === "SKILL_BUILDER" ? "skill_builder" : "starter";

  const openPricingModal = useCallback(() => {
    setPricingOpen(true);
  }, []);

  const showPremiumQuizToast = useCallback(() => {
    toast.warning("Vui lòng nâng cấp Premium để sử dụng tính năng này", {
      action: {
        label: "Nâng cấp ngay",
        onClick: () => openPricingModal(),
      },
    });
  }, [openPricingModal]);

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

  const canStart = canStartByDate && Boolean(taskId) && !hasStartedSession && !isStarting && !isFinishing && !isSessionCompleted;
  const canFinish = Boolean(activeSessionId) && !isSessionCompleted && !isStarting && !isFinishing;

  // "07:00 24/06/2026" style label of the task's current schedule, for the modal.
  const scheduledTimeLabel = useMemo(() => {
    const datePart = task?.taskDate
      ? new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(task.taskDate))
      : "";
    const timePart = task?.startTime ? task.startTime.slice(0, 5) : "";
    return [timePart, datePart].filter(Boolean).join(" ");
  }, [task?.taskDate, task?.startTime]);

  const taskDuration = task?.durationMinutes ?? 0;
  const minimumRequiredMinutes = useMemo(() => computeMinimumRequiredMinutes(taskDuration), [taskDuration]);
  const elapsedStudyMinutes = Math.floor(actualStudySeconds / 60);
  const hasMetMinimum = elapsedStudyMinutes >= minimumRequiredMinutes;

  useEffect(() => {
    setQuizStatus("idle");
    setLatestAttempt(null);
    setHasQuizCreated(false);
    setShowQuiz(false);

    if (!taskId) {
      setDetail(null);
      setIsLoading(false);
      setError(null);
      setMaterials([]);
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
        if (response.task?.workspaceId) {
          materialService.getWorkspaceMaterials(response.task.workspaceId)
            .then(mats => {
              if (!cancelled) setMaterials(mats);
            })
            .catch(console.error);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Không thể tải dữ liệu phiên học.");
        setDetail(null);
        setMaterials([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [taskId]);

  // ── F5 RESILIENCY: re-hydrate the live Pomodoro from the backend on mount ──
  // A hard refresh wipes the in-memory PomodoroContext (timer resets to 25:00),
  // but the BE session keeps ticking. On a cold load we fetch the authoritative
  // session state and recompute the TRUE remaining time against the backend
  // timestamp, then re-seed the timer so the countdown UI continues seamlessly.
  const didHydrateRef = useRef(false);
  useEffect(() => {
    if (didHydrateRef.current) return;
    if (!activeSessionId) return;
    // If the in-memory timer is already tracking a step, this is a normal
    // navigation (not a cold reload) — never clobber a running session.
    if (activeStepId) return;

    let cancelled = false;
    didHydrateRef.current = true;

    studySessionService
      .getStudySessionState(activeSessionId)
      .then((session) => {
        if (cancelled) return;
        const pomodoro = session?.pomodoro;
        if (!pomodoro) return;

        const status = String(pomodoro.status ?? "").toUpperCase();
        // A finished/closed session must never resurrect a timer — clean up the
        // stale pointer instead so the page falls back to its "start" state.
        if (status === "COMPLETED") {
          if (taskId) clearStoredSessionId(taskId);
          setActiveSessionId(null);
          return;
        }

        const isRunning = status === "IN_PROGRESS";
        const phase = (String(pomodoro.currentPhase ?? "FOCUS").toUpperCase() as PomodoroPhase);
        const stepId =
          session.roadmapStepId ?? roadmapStep?.stepId ?? taskId ?? activeSessionId;

        // True remaining seconds: while running, derive from phaseEndAt vs. the
        // wall clock so the F5 doesn't rewind time; otherwise (paused) trust the
        // stored remainingSeconds snapshot.
        let remaining = Math.max(0, Math.floor(pomodoro.remainingSeconds ?? 0));
        if (isRunning && pomodoro.phaseEndAt) {
          const endMs = new Date(pomodoro.phaseEndAt).getTime();
          if (!Number.isNaN(endMs)) {
            remaining = Math.max(0, Math.round((endMs - Date.now()) / 1000));
          }
        }

        // Re-derive accumulated study time: completed focus minutes + the time
        // already elapsed inside the current focus phase (only while ticking).
        let studySeconds = Math.max(0, Math.floor((pomodoro.completedFocusMinutes ?? 0) * 60));
        if (phase === "FOCUS" && isRunning && pomodoro.phaseStartedAt) {
          const startedMs = new Date(pomodoro.phaseStartedAt).getTime();
          if (!Number.isNaN(startedMs)) {
            studySeconds += Math.max(0, Math.round((Date.now() - startedMs) / 1000));
          }
        }

        hydrateTimer({ stepId, phase, timeLeft: remaining, isRunning, studySeconds });
      })
      .catch((err: unknown) => {
        // Soft-fail: a rehydration miss must never brick the page. Allow a retry
        // on a later mount by releasing the guard.
        console.error("Failed to rehydrate Pomodoro session", err);
        didHydrateRef.current = false;
      });

    return () => {
      cancelled = true;
    };
  }, [activeSessionId, activeStepId, hydrateTimer, roadmapStep?.stepId, taskId]);

  // Surface the XP a roadmap-step completion actually earned. We never assume the
  // amount client-side: the backend gates the 120 XP step reward behind a per-step
  // study-time threshold and the 700 XP roadmap reward behind every step earning
  // its points, so we read the real ledger and only toast events the server just
  // wrote (recency-gated to avoid replaying historical awards). showToast dedupes,
  // so calling this on every completion is safe.
  const notifyRoadmapXpAwards = useCallback(
    async (stepId: string | null) => {
      try {
        const events = await getMyPointEvents();
        const isRecent = (event: MyPointEvent) => {
          const ts = Date.parse(event.createdAt);
          return Number.isFinite(ts) && Date.now() - ts < 60_000;
        };

        const stepAward = stepId
          ? events.find(
              (event) =>
                event.eventType === "ROADMAP_STEP_COMPLETED" &&
                event.sourceId === stepId &&
                isRecent(event),
            )
          : undefined;
        if (stepAward) {
          showToast("success", `+${stepAward.points} XP (Roadmap Step Completed)`);
        }

        const roadmapAward = events.find(
          (event) => event.eventType === "ROADMAP_COMPLETED" && isRecent(event),
        );
        if (roadmapAward) {
          showToast("success", `+${roadmapAward.points} XP (SkillSprint Roadmap Completed)`);
        }
      } catch (err) {
        // A toast is non-critical — never let a ledger read failure break the flow.
        console.warn("Failed to load XP awards for toast", err);
      }
    },
    [showToast],
  );

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

  // NÂNG CẤP BỘ ĐỆM: Đồng bộ chuẩn chỉ hasQuizCreated kể cả khi Backend bắn 404 attempts
  useEffect(() => {
    const stepId = roadmapStep?.stepId;
    if (!stepId) {
      setLatestAttempt(null);
      setHasQuizCreated(false);
      return;
    }

    let cancelled = false;
    setLoadingQuizMeta(true);
    setLatestAttempt(null);
    setHasQuizCreated(false);

    quizService
      .getCurrent(stepId)
      .then(async (quiz) => {
        if (cancelled) return;
        if (quiz) {
          setHasQuizCreated(true); // Tìm thấy thực thể Quiz -> Ép UI mở State B
          try {
            const attempt = await quizService.getLatestAttempt(quiz.quizId);
            if (!cancelled && attempt) setLatestAttempt(attempt);
          } catch {
            // Có đề nhưng chưa có lượt submit nào -> latestAttempt giữ null là đúng
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLatestAttempt(null);
          setHasQuizCreated(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingQuizMeta(false);
      });

    return () => {
      cancelled = true;
    };
  }, [roadmapStep?.stepId]);

  const handleQuizCompletion = async (result: { isPassed: boolean; score: number }) => {
    setShowQuiz(false);
    if (result.isPassed) {
      setQuizStatus("passed");
      // Single source of truth for the toast — showToast dedupes internally.
      showToast("success", "Chúc mừng! Bạn đã PASS bài quiz.");
      
      // Stop and clear the Pomodoro timer so it doesn't block navigation
      pauseTimer();
      clearTimerContext();

      // Auto-complete active study session on backend if running
      if (activeSessionId) {
        try {
          await studySessionService.finishPomodoro(activeSessionId);
          await studySessionService.finishStudySession(activeSessionId, {
            notes: "Hoàn thành phiên học qua Quiz",
            focusScore: 5,
          });
        } catch (e) {
          console.warn("Failed to auto-close study session after passing quiz", e);
        }
        setActiveSessionId(null);
        if (taskId) clearStoredSessionId(taskId);
      }

      if (taskId) {
        try {
          await calendarService.completeCalendarTask(taskId);
          window.dispatchEvent(new Event("skillSprint:points-updated"));
          // Backend has now run step/roadmap point gates — reflect the real awards.
          await notifyRoadmapXpAwards(roadmapStep?.stepId ?? null);
        } catch (err) {
          console.error("Failed to mark task as complete on backend", err);
        }
      }
    } else {
      setQuizStatus("failed");
      // Single source of truth for the toast — showToast dedupes internally.
      showToast("error", "Rất tiếc! Bạn NOT PASS bài quiz, hãy thử lại.");
    }

    await fetchUpdatedDetail();

    const stepId = roadmapStep?.stepId;
    if (stepId) {
      try {
        const quiz = await quizService.getCurrent(stepId);
        if (quiz) {
          const attempt = await quizService.getLatestAttempt(quiz.quizId);
          if (attempt) setLatestAttempt(attempt);
        }
      } catch (e) {
        console.error("Failed to fetch latest attempt", e);
      }
    }
  };

  const handleGenerateAndOpenQuiz = async () => {
    if (!isPremiumMember) {
      showPremiumQuizToast();
      return;
    }

    const stepId = roadmapStep?.stepId;
    if (isGeneratingQuiz) return;
    
    if (!stepId) {
      showToast("warning", "Tính năng tạo đề kiểm tra AI hiện chỉ hỗ trợ cho các bài học thuộc lộ trình (Roadmap).");
      return;
    }

    setIsGeneratingQuiz(true);
    try {
      const quiz = await quizService.generate(stepId);
      setHasQuizCreated(true); // Đổi state lạc quan để khóa UI
      
      if (isSessionCompleted || hasMetMinimum) {
        setShowQuiz(true);
        setQuizStatus("idle");
      } else {
        showToast("success", "Đã thiết kế đề thành công! Hãy tiếp tục học để mở khóa bài kiểm tra.");
      }
    } catch (err: any) {
      showToast("warning", err?.message || "Không thể tạo đề kiểm tra AI.");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleRegenerateQuiz = async () => {
    if (!isSessionCompleted && !hasMetMinimum) {
      showToast("warning", `Vui lòng tập trung học tối thiểu ${minimumRequiredMinutes} phút trước khi đổi đề!`);
      return;
    }

    const stepId = roadmapStep?.stepId;
    if (!stepId || isGeneratingQuiz) return;
    setIsGeneratingQuiz(true);
    try {
      const quiz = await quizService.generate(stepId);
      setLatestAttempt(null);
      setHasQuizCreated(true);
      setShowQuiz(true);
      setQuizStatus("idle");
    } catch (err: any) {
      showToast("warning", err?.message || "Không thể đổi bộ câu hỏi.");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleNextStep = async () => {
    if (!task?.workspaceId || !roadmapStep?.stepId) {
      navigate("/app/calendar");
      return;
    }
    setIsSubActionLoading(true);
    try {
      const roadmap = await roadmapService.getRoadmap(task.workspaceId);
      if (!roadmap || !roadmap.steps) {
        navigate("/app/calendar");
        return;
      }

      const currentIndex = roadmap.steps.findIndex((s) => s.stepId === roadmapStep.stepId);
      if (currentIndex === -1 || currentIndex >= roadmap.steps.length - 1) {
        showToast("success", "Chúc mừng! Bạn đã hoàn thành bước học cuối cùng của lộ trình.");
        navigate("/app/calendar");
        return;
      }

      const nextStep = roadmap.steps[currentIndex + 1];
      const tasks = await calendarService.getCalendarTasks(task.workspaceId);
      const nextTask = tasks.find((t) => t.roadmapStepId === nextStep.stepId);

      if (!nextTask) {
        navigate("/app/calendar");
        return;
      }

      const todayStr = new Date().toLocaleDateString("sv-SE");
      const taskDateStr = nextTask.taskDate || "";

      if (taskDateStr && taskDateStr > todayStr) {
        setRescheduleTaskInfo({
          taskId: nextTask.taskId,
          title: nextTask.title,
          originalDate: taskDateStr,
          newDate: todayStr,
        });
        setShowRescheduleModal(true);
      } else {
        navigate(`/app/learning/course?taskId=${nextTask.taskId}`);
      }
    } catch (err) {
      console.error("Failed to transition to next step", err);
      navigate("/app/calendar");
    } finally {
      setIsSubActionLoading(false);
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
      startTimer(roadmapStep?.stepId ?? taskId);
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

  const handleOpenStudyAhead = () => {
    setStudyAheadDate(new Date().toLocaleDateString("sv-SE"));
    setShowStudyAheadModal(true);
  };

  // Primary modal action: move the task to the chosen date on the backend, then
  // start the session on the refreshed (now-due) task.
  const handleRescheduleAndStudy = async () => {
    if (!taskId || isRescheduling) return;
    setIsRescheduling(true);
    try {
      await calendarService.updateCalendarTask(taskId, {
        taskDate: studyAheadDate,
        startTime: "08:00",
        endTime: "09:00",
      });
      await fetchUpdatedDetail();
      setShowStudyAheadModal(false);
      showToast("success", "Đã dời lịch học thành công!");
      await handleStartSession();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Không thể dời lịch học. Vui lòng thử lại.";
      toast.error(msg);
    } finally {
      setIsRescheduling(false);
    }
  };

  // Secondary modal action: leave the future date untouched and study ahead now.
  const handleKeepAndStudy = async () => {
    setShowStudyAheadModal(false);
    await handleStartSession();
  };

  const handlePausePomodoro = async () => {
    if (!activeSessionId || isSubActionLoading) return;
    setIsSubActionLoading(true);
    try {
      await studySessionService.pausePomodoro(activeSessionId);
      pauseTimer();
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
      startTimer(activeStepId ?? roadmapStep?.stepId ?? taskId ?? "");
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
      await fetchUpdatedDetail();
      skipToNextPhase();
      showToast("success", "⏭️ Đã chuyển sang chu kỳ tiếp theo.");
    } catch (err: any) {
      showToast("warning", err?.message || "Không thể bỏ qua phase.");
    } finally {
      setIsSubActionLoading(false);
    }
  };

  const handleTriggerReviewModal = () => {
    if (!activeSessionId) return;
    pauseTimer(); 
    setShowReviewModal(true);
  };

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

      setShowReviewModal(false);
      setActiveSessionId(null);
      if (taskId) clearStoredSessionId(taskId);

      clearTimerContext(); 
      await fetchUpdatedDetail();
      window.dispatchEvent(new Event("skillSprint:points-updated"));
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
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute top-[20%] left-0 w-[300px] h-[300px] bg-orange-500/5 rounded-full blur-[60px] pointer-events-none" />



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

      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
          <section className="space-y-6 flex-1 min-w-0 lg:max-w-[calc(100%-320px)]">
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
            ) : showQuiz ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowQuiz(false)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
                  >
                    <ArrowLeft size={14} /> Quay lại buổi học
                  </button>
                </div>
                <QuizContainer
                  stepId={roadmapStep?.stepId ?? undefined}
                  quizId={roadmapStep?.stepId ?? undefined}
                  currentPlan={rawPlanType}
                  onComplete={handleQuizCompletion}
                />
              </div>
            ) : (
              <>
                {quizStatus !== "idle" && (
                  <div
                    className={`rounded-2xl border p-4.5 mb-6 flex items-start gap-3.5 relative overflow-hidden transition-all duration-300 ${
                      quizStatus === "passed"
                        ? "border-orange-200 bg-orange-50 text-orange-900 shadow-sm animate-in slide-in-from-top-4 duration-300"
                        : "border-amber-200 bg-amber-50 text-amber-900 shadow-sm animate-in slide-in-from-top-4 duration-300"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white ${
                        quizStatus === "passed"
                          ? "bg-orange-500"
                          : "bg-amber-500"
                      }`}
                    >
                      {quizStatus === "passed" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-black uppercase tracking-wider">
                        {quizStatus === "passed" ? "Kết quả: ĐÃ VƯỢT QUA (PASSED)" : "Kết quả: CHƯA ĐẠT (NOT PASSED)"}
                      </h4>
                      <p className="mt-1 text-xs leading-5 text-slate-500 font-semibold">
                        {quizStatus === "passed"
                          ? "Chúc mừng! Bạn đã hoàn thành xuất sắc bài kiểm tra AI với tỷ lệ trên 80% câu trả lời chính xác."
                          : "Rất tiếc! Bạn chưa đạt ngưỡng 80% câu trả lời chính xác. Hãy ôn tập lại tài nguyên bài học và thử lại."}
                      </p>
                      <div className="mt-3">
                        {quizStatus === "passed" ? (
                          <button
                            type="button"
                            onClick={handleNextStep}
                            className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-medium rounded-lg text-sm px-4 py-2 transition-all shadow-sm inline-flex items-center gap-1.5"
                          >
                            Bài tiếp theo
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleRegenerateQuiz}
                            className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-medium rounded-lg text-sm px-4 py-2 transition-all shadow-sm inline-flex items-center gap-1.5"
                          >
                            Làm lại Quiz
                          </button>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setQuizStatus("idle")}
                      className="text-slate-400 hover:text-slate-600 transition"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                <div className="space-y-8 rounded-[24px] border border-slate-100 bg-white p-6 md:p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)]">
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

                  <section className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50/30 to-amber-50/20 p-6 relative overflow-hidden shadow-sm shadow-orange-100/10">
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
                      <div className="rounded-xl border border-slate-100 bg-white p-3.5 text-slate-900 shadow-sm transition hover:shadow-md">
                        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">Estimated</p>
                        <p className="mt-1.5 text-xs font-extrabold text-slate-800">
                          {roadmapStep?.estimatedMinutes ? `${roadmapStep.estimatedMinutes} phút` : task?.durationMinutes ? `${task.durationMinutes} phút` : "--"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-white p-3.5 text-slate-900 shadow-sm transition hover:shadow-md">
                        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">Roadmap</p>
                        <p className="mt-1.5 text-xs font-extrabold text-slate-800">{formatStatusLabel(roadmapStep?.status)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-white p-3.5 text-slate-900 shadow-sm transition hover:shadow-md">
                        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">Session</p>
                        <p className="mt-1.5 text-xs font-extrabold text-slate-800">{hasStartedSession ? "Đang mở" : "Chưa bắt đầu"}</p>
                      </div>
                    </div>
                  </section>

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

                  <section className="grid gap-4 sm:grid-cols-2">
                    <SectionCard title="What to learn" items={normalizeList(roadmapStep?.whatToLearn)} emptyText="Chưa có mục tiêu học." accent="orange" />
                    <SectionCard title="Key concepts" items={normalizeList(roadmapStep?.keyConcepts)} emptyText="Chưa có khái niệm cốt lõi." accent="slate" />
                    <SectionCard title="Learning outcomes" items={normalizeList(roadmapStep?.learningOutcomes)} emptyText="Chưa có kết quả học mong muốn." accent="emerald" />
                    <SectionCard title="Recommended focus" items={normalizeList(roadmapStep?.recommendedFocus)} emptyText="Chưa có phần tập trung khuyến nghị." accent="amber" />
                  </section>

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
                        resources.map((resource, index) => {
                          const isQuizResource = resource.platform === "SKILLSPRINT" && resource.title?.includes("Bài tập thực hành");
                          return (
                            <a
                              key={`${resource.resourceId ?? resource.title ?? index}`}
                              href={isQuizResource ? undefined : (resource.url ?? "#")}
                              target={isQuizResource ? undefined : (resource.url ? "_blank" : undefined)}
                              rel={isQuizResource ? undefined : (resource.url ? "noreferrer" : undefined)}
                              onClick={(e) => {
                                if (isQuizResource) {
                                  e.preventDefault();
                                  setSideTab("quiz");
                                  window.scrollTo({ top: 0, behavior: "smooth" });
                                }
                              }}
                              className={`group relative rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:bg-orange-50/20 hover:shadow-lg hover:shadow-orange-500/5 ${isQuizResource ? "cursor-pointer" : ""}`}
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
                          );
                        })
                      ) : (
                        <div className="col-span-full rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center">
                          <p className="text-xs font-semibold text-slate-400">Không có tài nguyên đính kèm</p>
                        </div>
                      )}
                    </div>

                    {/* Workspace Materials */}
                    {materials.length > 0 && (
                      <div className="mt-8 border-t border-slate-100 pt-6">
                        <div className="flex items-center gap-2 mb-4">
                          <FileText size={16} className="text-indigo-500" />
                          <div>
                            <h3 className="text-xs font-extrabold tracking-tight text-slate-800">Tài liệu tham khảo</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Từ Workspace của bạn</p>
                          </div>
                        </div>
                        <div className="grid gap-3">
                          {materials.map((m) => {
                            const jobStatus = m.processingJob?.status ?? m.processingStatus ?? m.uploadStatus ?? null;
                            const isDone = String(jobStatus || "").toUpperCase() === "COMPLETED";
                            return (
                              <div key={m.materialId} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white hover:border-indigo-200 hover:shadow-sm transition-all">
                                <div className="shrink-0 h-9 w-9 rounded-lg bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-indigo-500">
                                  <FileText className="h-4.5 w-4.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-bold text-slate-800">{m.fileName || m.originalFileName || "Tài liệu"}</p>
                                </div>
                                {isDone && m.fileUrl && (
                                  <button 
                                    type="button" 
                                    onClick={async () => {
                                      const wsId = task?.workspaceId;
                                      if (!wsId || !m.materialId) return;
                                      try {
                                        setViewingMaterialId(m.materialId);
                                        const det = await materialService.getMaterialDetail(wsId, m.materialId);
                                        if (det.viewUrl) {
                                          window.open(det.viewUrl, '_blank', 'noopener,noreferrer');
                                        } else {
                                          toast.error('Không thể lấy đường dẫn tài liệu');
                                        }
                                      } catch {
                                        toast.error('Lỗi khi mở tài liệu');
                                      } finally {
                                        setViewingMaterialId(null);
                                      }
                                    }} 
                                    disabled={viewingMaterialId === m.materialId} 
                                    title="Xem tài liệu" 
                                    className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 disabled:opacity-50 transition"
                                  >
                                    {viewingMaterialId === m.materialId ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </article>
                </div>
              </>
            )}
          </section>

          <aside className="lg:sticky lg:top-24 self-start w-full lg:w-[300px] shrink-0">
            <div className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)]">
              {/* Tab switcher */}
              <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setSideTab("pomodoro")}
                  className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                    sideTab === "pomodoro"
                      ? "bg-white text-slate-800 shadow-sm"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200/70"
                  }`}
                >
                  <Clock size={12} className="shrink-0 stroke-[2.4]" /> Pomodoro
                </button>
                <button
                  type="button"
                  onClick={() => setSideTab("quiz")}
                  className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                    sideTab === "quiz"
                      ? "text-white shadow-sm"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200/70"
                  }`}
                  style={sideTab === "quiz" ? { background: "linear-gradient(135deg, #FF6B00, #EA580C)" } : undefined}
                >
                  <BrainCircuit size={12} className="shrink-0 stroke-[2.4]" /> AI Quiz
                </button>
              </div>

              {sideTab === "pomodoro" && (
              <>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-[0_8px_20px_-6px_rgba(249,115,22,0.4)]">
                  <Timer size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold tracking-tight text-slate-800">Session controls</h3>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Điều phối Pomodoro</p>
                </div>
              </div>

              {hasStartedSession && !isSessionCompleted && (
                <div className="mt-5 space-y-4">
                  <div className={`relative rounded-3xl border-2 p-6 text-center transition-all duration-500 shadow-md ${
                    pomodoroPhase !== "FOCUS"
                      ? "border-emerald-100 bg-gradient-to-br from-emerald-50/40 to-teal-50/20 shadow-emerald-500/5"
                      : "border-orange-100 bg-gradient-to-br from-orange-50/40 to-amber-50/20 shadow-orange-500/5"
                  }`}>
                    <div className={`absolute top-4 right-4 h-2.5 w-2.5 rounded-full ${
                      isTimerRunning ? "animate-ping" : ""
                    } ${pomodoroPhase !== "FOCUS" ? "bg-emerald-500" : "bg-orange-500"}`} />

                    <p className={`text-[9px] font-black uppercase tracking-[0.25em] ${
                      pomodoroPhase !== "FOCUS" ? "text-emerald-600" : "text-orange-600"
                    }`}>
                      {pomodoroPhase === "SHORT_BREAK" ? (
                        <span className="inline-flex items-center gap-1.5"><Coffee size={14} className="mb-0.5" /> Nghỉ giải lao (5 phút)</span>
                      ) : pomodoroPhase === "LONG_BREAK" ? (
                        <span className="inline-flex items-center gap-1.5"><Leaf size={14} className="mb-0.5" /> Nghỉ dài (15 phút)</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5"><Target size={14} className="mb-0.5" /> Thời gian tập trung</span>
                      )}
                    </p>

                    <p className="mt-1 text-[8px] font-extrabold uppercase tracking-widest text-slate-400">
                      {isTimerRunning ? "ĐANG TẬP TRUNG" : "ĐÃ TẠM DỪNG"}
                    </p>

                    <div className={`mt-3 font-mono text-[3.8rem] font-black tracking-tight tabular-nums leading-none transition-colors duration-500 ${
                      pomodoroPhase !== "FOCUS" ? "text-emerald-600" : "text-orange-600"
                    } ${isTimerRunning && timeLeft <= 10 ? "animate-pulse text-red-500" : ""}`}>
                      {formatTimer(timeLeft)}
                    </div>

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
              </>
              )}

              {/* ── AI QUIZ TAB ── */}
              {sideTab === "quiz" && roadmapStep?.stepId && (
                <div className="mt-4 rounded-[20px] border border-slate-100 bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-orange-100/60 bg-orange-50 text-orange-600 shadow-sm shadow-orange-50/50">
                        <Brain size={14} className="stroke-[2.5]" />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold tracking-tight text-slate-700">AI Quiz</p>
                        <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">Kiểm tra kiến thức</p>
                      </div>
                    </div>
                    {loadingQuizMeta && (
                      <LoaderCircle size={13} className="animate-spin text-slate-400" />
                    )}
                  </div>

                  {/* FIX TRIỆT ĐỂ BUG QUAY LẠI NÚT TẠO ĐỀ: Chốt chặn State A dựa trên biến hasQuizCreated */}
                  {!hasQuizCreated && !loadingQuizMeta && (
                    <div className="rounded-xl border border-dashed border-orange-200/80 bg-orange-50/30 p-3.5">
                      {!isPremiumMember ? (
                        <>
                          <div className="flex items-start gap-2.5 mb-2">
                            <Lock size={16} className="text-orange-500 mt-0.5 shrink-0" />
                            <p className="text-[11px] leading-[1.6] font-medium text-orange-700">
                              Tính năng thiết kế đề kiểm tra AI là tính năng độc quyền của gói Premium.
                            </p>
                          </div>
                          <Link
                            to="/app/pricing"
                            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold text-white transition-all hover:opacity-95 active:scale-[0.98]"
                            style={{
                              background: "linear-gradient(135deg, #FF6B00, #EA580C)",
                            }}
                          >
                            <Sparkles size={14} /> Nâng cấp Premium
                          </Link>
                        </>
                      ) : (
                        <>
                          <p className="text-[11px] leading-[1.6] font-medium text-slate-500">
                            Bài kiểm tra chưa được kích hoạt. Hãy để AI quét nội dung bài học và thiết kế đề bài cho riêng bạn.
                          </p>
                          <button
                            type="button"
                            onClick={handleGenerateAndOpenQuiz}
                            disabled={isGeneratingQuiz}
                            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold text-white transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
                            style={{
                              background: "linear-gradient(135deg, #FF6B00, #EA580C)",
                              boxShadow: "0 10px 24px rgba(255, 107, 0, 0.22)",
                            }}
                          >
                            {isGeneratingQuiz ? (
                              <><LoaderCircle size={16} className="animate-spin" /> Đang thiết kế đề...</>
                            ) : (
                              <><WandSparkles size={16} /> Thiết kế bài kiểm tra bằng AI</>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* State B: ĐÃ CÓ ĐỀ TRÊN DB */}
                  {hasQuizCreated && !loadingQuizMeta && (
                    <div className="space-y-3">
                      {!isSessionCompleted && !hasMetMinimum && (
                        <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-3.5 flex items-start gap-2.5">
                          <Lock size={16} className="text-amber-500 mt-0.5 shrink-0" />
                          <p className="text-[11px] leading-[1.6] text-amber-700 font-medium">
                            Bài kiểm tra đang bị khóa. Bạn cần tập trung học thêm <strong className="font-extrabold">{minimumRequiredMinutes - elapsedStudyMinutes} phút</strong> để mở khóa!
                          </p>
                        </div>
                      )}

                      {latestAttempt ? (
                        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Kết quả lần cuối</p>
                              <p className="mt-1 text-sm font-extrabold text-slate-800">
                                {Math.round((latestAttempt.correctAnswers / latestAttempt.totalQuestions) * 100)}%{" "}
                                <span className="text-xs font-semibold text-slate-500">
                                  ({latestAttempt.correctAnswers}/{latestAttempt.totalQuestions} câu đúng)
                                </span>
                              </p>
                              <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                                {formatDate(latestAttempt.submittedAt)}
                              </p>
                            </div>
                            <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[9px] font-extrabold ring-1 ${
                              latestAttempt.passed ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-rose-50 text-rose-700 ring-rose-200"
                            }`}>
                              {latestAttempt.passed ? "✓ PASSED" : "✗ FAILED"}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 text-[11px] text-slate-500 font-semibold leading-relaxed flex items-start gap-2">
                          <Target size={14} className="text-[#FF6B00] shrink-0 mt-0.5" />
                          <span>Đề kiểm tra AI đã sẵn sàng! Vào làm ngay để kiểm tra mức độ hiểu bài của bạn.</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (!isSessionCompleted && !hasMetMinimum) {
                            showToast("warning", `Vui lòng tập trung học tối thiểu ${minimumRequiredMinutes} phút trước khi làm bài kiểm tra!`);
                            return;
                          }
                          setShowQuiz(true);
                          setQuizStatus("idle");
                        }}
                        disabled={isGeneratingQuiz || (!isSessionCompleted && !hasMetMinimum)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-[#FF6B00] px-4 py-3 text-xs font-extrabold text-white shadow-md shadow-orange-500/20 transition hover:from-amber-600 hover:to-[#E05E00] active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Gamepad2 size={16} /> Vào làm bài kiểm tra
                      </button>

                      {latestAttempt && (
                        <button
                          type="button"
                          onClick={handleRegenerateQuiz}
                          disabled={isGeneratingQuiz}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                        >
                          {isGeneratingQuiz ? (
                            <><LoaderCircle size={16} className="animate-spin" /> Đang đổi đề...</>
                          ) : (
                            <><Dices size={16} /> Đổi bộ câu hỏi mới</>
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {loadingQuizMeta && (
                    <div className="animate-pulse space-y-2.5 pt-1">
                      <div className="h-3.5 w-3/4 rounded-lg bg-slate-200" />
                      <div className="h-3.5 w-1/2 rounded-lg bg-slate-200" />
                      <div className="mt-3 h-10 rounded-xl bg-slate-200" />
                    </div>
                  )}
                </div>
              )}

              {isSessionCompleted ? (
                <div className="mt-5 rounded-2xl border border-emerald-100/60 bg-emerald-50/40 p-5 text-center shadow-sm">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-sm shadow-emerald-100/20 mb-3">
                    <PartyPopper size={20} className="stroke-[2.5]" />
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-800">🎉 Đã hoàn thành mục học</h4>
                  <p className="mt-1 text-[11px] leading-5 text-slate-500">Tiến độ đã được đồng bộ lên lộ trình cá nhân của bạn.</p>
                </div>
              ) : !hasStartedSession ? (
                <div className="mt-5 space-y-4">
                  <div
                    className={
                      canStartByDate
                        ? "rounded-xl border border-orange-100/60 bg-orange-50/20 p-4 text-[11px] leading-5 text-slate-500"
                        : "rounded-2xl border border-amber-100 bg-amber-50/10 p-4 text-[11px] leading-5 text-amber-700"
                    }
                  >
                    {canStartByDate
                      ? "Nhấn nút dưới để bắt đầu chu kỳ tập trung học 25 phút bằng đồng hồ Pomodoro."
                      : "Mục học này chưa đến hạn. Bạn vẫn có thể mở học trước nếu muốn."}
                  </div>
                  <button
                    type="button"
                    onClick={canStartByDate ? handleStartSession : handleOpenStudyAhead}
                    disabled={canStartByDate ? !canStart : isStarting || isFinishing || !taskId}
                    className={
                      canStartByDate
                        ? "inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-4 text-sm font-extrabold text-white shadow-lg shadow-orange-500/20 transition hover:from-orange-600 hover:to-amber-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                        : "inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#FF7E21] to-[#FF6B00] px-5 py-4 text-sm font-extrabold text-white shadow-lg shadow-orange-500/20 transition duration-200 hover:scale-[1.02] active:scale-98 disabled:cursor-not-allowed disabled:opacity-50"
                    }
                  >
                    {isStarting ? <LoaderCircle size={18} className="animate-spin" /> : <Rocket size={18} />}
                    {canStartByDate ? "Bắt đầu tập trung (Pomodoro)" : "Vẫn mở học trước hạn"}
                  </button>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  <button
                    type="button"
                    onClick={handleTriggerReviewModal}
                    disabled={isFinishing}
                    className="inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/20 transition hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] disabled:opacity-50"
                  >
                    {isFinishing ? <LoaderCircle size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                    Kết thúc phiên học
                  </button>
                  
                  {rawPlanType === "ADMIN_DEFAULT" && (
                    <button
                      type="button"
                      onClick={() => fastForwardTime(Math.max(15, minimumRequiredMinutes) * 60)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 text-[#FF6B00] px-5 py-3 text-sm font-bold transition hover:bg-orange-100 active:scale-[0.98] cursor-pointer"
                    >
                      <WandSparkles size={16} />
                      [DEV] Tua nhanh đủ điều kiện
                    </button>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* ── 🌟 REVIEW FORM OVERLAY MODAL ── */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md transition-all duration-300">
          <div className="w-full max-w-md rounded-[28px] border border-slate-100/80 bg-white/95 p-6 shadow-[0_30px_70px_rgba(0,0,0,0.1)] relative">
            <button
              type="button"
              onClick={() => {
                setShowReviewModal(false);
                if (activeSessionId) startTimer(activeStepId ?? roadmapStep?.stepId ?? taskId ?? ""); 
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

              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 text-[11px] text-slate-400 leading-relaxed font-semibold flex items-start gap-2.5">
                <Lightbulb size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-slate-600">Quy chế tính tiến độ:</strong> Thời gian học thực tế hiện tại là <span className="font-extrabold text-slate-700">{elapsedStudyMinutes} phút</span>. Bạn cần học đủ <span className="font-extrabold text-orange-600">{minimumRequiredMinutes} phút</span> để hệ thống chuyển trạng thái sang <strong className="text-emerald-600">COMPLETED</strong>.
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowReviewModal(false);
                  if (activeSessionId) startTimer(activeStepId ?? roadmapStep?.stepId ?? taskId ?? "");
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
                {isFinishing ? <LoaderCircle size={14} className="animate-spin" /> : <Save size={14} />}
                Xác nhận đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <PricingModal
        isOpen={pricingOpen}
        onClose={() => setPricingOpen(false)}
        onSuccess={() => {
          void refreshSubscription();
        }}
        initialPlan="premium"
        currentPlan={pricingCurrentPlan}
        currentPlanId={rawPlanType}
      />

      {isNavigationBlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md transition-all">
          <div className="w-full max-w-sm rounded-[28px] border border-orange-100 bg-white p-6 shadow-2xl text-center relative animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 mb-4 border border-orange-100/60">
              <AlertTriangle size={28} className="stroke-[2.5]" />
            </div>
            <h3 className="text-base font-black text-slate-800">Bạn đang trong phiên tập trung!</h3>
            <p className="mt-2 text-xs leading-5 text-slate-500 font-medium">
              Bạn đã học được <span className="font-black text-slate-700">{formattedStudyTime || "0 giây"}</span>. 
              Nếu rời khỏi vùng học tập bây giờ, chu kỳ Pomodoro hiện tại sẽ bị <span className="text-red-500 font-bold">HỦY BỎ</span> và không được lưu tiến trình!
            </p>

            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={resetNavigation}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-xs font-bold text-white shadow-md shadow-orange-500/10 transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Target size={16} /> Tiếp tục học tập (Giữ kỉ luật)
              </button>
              <button
                type="button"
                onClick={() => {
                  if (taskId) clearStoredSessionId(taskId);
                  setActiveSessionId(null);
                  proceedNavigation();
                }}
                className="w-full py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-400 hover:bg-slate-50 hover:text-red-500 transition active:scale-95"
              >
                Hủy phiên & Rời đi
              </button>
            </div>
          </div>
        </div>
      )}

      {showRescheduleModal && rescheduleTaskInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md transition-all">
          <div className="w-full max-w-sm rounded-[28px] border border-orange-100 bg-white p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setShowRescheduleModal(false)}
              className="absolute top-5 right-5 h-8 w-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-[#FF6B00] border border-orange-100/60 shadow-sm shadow-orange-50/50">
                <CalendarDays size={18} />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-extrabold text-slate-800">Dời lịch học trước</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Học tập thông minh</p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <p className="text-xs leading-5 text-slate-500 font-semibold text-left">
                Bài tiếp theo <span className="font-extrabold text-slate-800">"{rescheduleTaskInfo.title}"</span> đang được lên lịch vào ngày <span className="font-bold text-slate-700">{rescheduleTaskInfo.originalDate}</span>. Bạn muốn dời lịch để học ngay hôm nay không?
              </p>
              
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chọn ngày học mới</label>
                <input
                  type="date"
                  value={rescheduleTaskInfo.newDate}
                  onChange={(e) => setRescheduleTaskInfo(prev => prev ? { ...prev, newDate: e.target.value } : null)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowRescheduleModal(false);
                  navigate(`/app/learning/course?taskId=${rescheduleTaskInfo.taskId}`);
                }}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition active:scale-95"
              >
                Giữ lịch & Học
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await calendarService.updateCalendarTask(rescheduleTaskInfo.taskId, {
                      taskDate: rescheduleTaskInfo.newDate,
                      startTime: "08:00",
                      endTime: "09:00",
                    });
                    showToast("success", "Đã dời lịch học thành công!");
                    setShowRescheduleModal(false);
                    navigate(`/app/learning/course?taskId=${rescheduleTaskInfo.taskId}`);
                  } catch (e) {
                    showToast("error", "Không thể dời lịch học.");
                  }
                }}
                className="flex-1 py-3 rounded-xl bg-[#FF6B00] text-xs font-bold text-white hover:bg-orange-600 transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Dời lịch & Học
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STUDY-AHEAD RESCHEDULE MODAL (current task scheduled in the future) */}
      {showStudyAheadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md transition-all">
          <div className="w-full max-w-sm rounded-3xl border border-orange-100 bg-white p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] relative animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setShowStudyAheadModal(false)}
              disabled={isRescheduling}
              className="absolute top-5 right-5 h-8 w-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition disabled:opacity-40"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-[#FF6B00] border border-orange-100/60 shadow-sm shadow-orange-50/50">
                <CalendarDays size={18} />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-extrabold text-slate-800">Dời lịch học trước hạn</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Học tập thông minh</p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-amber-100 bg-amber-50/10 p-3.5 text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lịch học hiện tại</p>
                <p className="mt-1 text-sm font-extrabold text-slate-700">{scheduledTimeLabel || "Chưa xác định"}</p>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chọn ngày học mới</label>
                <input
                  type="date"
                  value={studyAheadDate}
                  min={new Date().toLocaleDateString("sv-SE")}
                  onChange={(e) => setStudyAheadDate(e.target.value)}
                  disabled={isRescheduling}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 focus:border-orange-500 focus:outline-none disabled:opacity-60"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleKeepAndStudy}
                disabled={isRescheduling}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition active:scale-95 disabled:opacity-50"
              >
                Giữ lịch & Học
              </button>
              <button
                type="button"
                onClick={handleRescheduleAndStudy}
                disabled={isRescheduling}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#FF7E21] to-[#FF6B00] text-xs font-bold text-white transition duration-200 hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isRescheduling ? <LoaderCircle size={14} className="animate-spin" /> : null}
                Dời lịch & Học
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4 transition-all hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.05)]">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-black text-slate-800 tracking-tight">{value}</p>
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

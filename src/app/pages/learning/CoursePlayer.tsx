import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
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
  WandSparkles,
  ChevronDown,
} from "lucide-react";
import studySessionService, {
  type FinishStudySessionRequest,
  type StudySessionDetailResponse,
  type StudySessionResponse,
} from "../../../api/studySessionService";

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
    // Ignore storage failures; React state still keeps the session live.
  }
}

function clearStoredSessionId(taskId: string): void {
  try {
    localStorage.removeItem(`${SESSION_STORAGE_PREFIX}:${taskId}`);
  } catch {
    // Ignore storage failures.
  }
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "Chưa có";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function normalizeList(values: string[] | null | undefined): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.filter((value): value is string => typeof value === "string" && value.trim().length > 0);
}

function formatStatusLabel(status: string | null | undefined): string {
  if (!status) {
    return "Chưa xác định";
  }

  const normalized = status.toUpperCase();
  if (normalized === "IN_PROGRESS") return "Đang học";
  if (normalized === "COMPLETED") return "Đã hoàn thành";
  if (normalized === "CURRENT") return "Đang học";
  if (normalized === "UPCOMING") return "Sắp tới";
  if (normalized === "SKIPPED") return "Đã bỏ qua";
  return normalized;
}

function getTaskIdFromLocation(locationSearch: string, state: StudySessionRouteState): string | null {
  if (state.taskId && state.taskId.trim()) {
    return state.taskId.trim();
  }

  const params = new URLSearchParams(locationSearch);
  const taskId = params.get("taskId")?.trim();
  return taskId || null;
}

function getSessionIdFromLocation(locationSearch: string, state: StudySessionRouteState): string | null {
  if (state.sessionId && state.sessionId.trim()) {
    return state.sessionId.trim();
  }

  const params = new URLSearchParams(locationSearch);
  const sessionId = params.get("sessionId")?.trim();
  return sessionId || null;
}

export default function CoursePlayer() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as StudySessionRouteState | null) ?? {};

  const taskId = useMemo(() => getTaskIdFromLocation(location.search, state), [location.search, state]);
  const routeSessionId = useMemo(() => getSessionIdFromLocation(location.search, state), [location.search, state]);

  const [detail, setDetail] = useState<StudySessionDetailResponse | null>(null);
  const [currentSession, setCurrentSession] = useState<StudySessionResponse | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(routeSessionId);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [focusScore, setFocusScore] = useState("4");

  const task = detail?.task ?? null;
  const roadmapStep = detail?.roadmapStep ?? null;
  const practice = detail?.practice ?? null;
  const resources = detail?.resources ?? [];
  const actions = detail?.actions ?? null;
  const activeSessionId = currentSession?.sessionId ?? sessionId ?? null;
  const isCompleted =
    currentSession?.status === "COMPLETED" ||
    task?.status?.toUpperCase() === "COMPLETED" ||
    roadmapStep?.status?.toUpperCase() === "COMPLETED";
  const hasStartedSession = Boolean(activeSessionId) && !isCompleted;

  // Date bouncer: disable "Bắt đầu học" if today is strictly before the scheduled date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const scheduledDate = new Date(task?.taskDate ?? "");
  scheduledDate.setHours(0, 0, 0, 0);
  const canStartByDate = Number.isNaN(scheduledDate.getTime()) ? true : today.getTime() >= scheduledDate.getTime();

  const canStart = canStartByDate && Boolean(taskId) && (actions?.canStart ?? true) && !hasStartedSession && !isStarting && !isFinishing;
  const canFinish = Boolean(activeSessionId) && !isCompleted && (actions?.canFinish ?? true) && !isStarting && !isFinishing;

  useEffect(() => {
    if (!taskId) {
      setDetail(null);
      setCurrentSession(null);
      setSessionId(routeSessionId);
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
        if (cancelled) {
          return;
        }

        setDetail(response);
        const persistedSessionId = routeSessionId ?? readStoredSessionId(taskId);
        setSessionId(persistedSessionId);
        if (!persistedSessionId) {
          setCurrentSession(null);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }

        const message = err instanceof Error ? err.message : "Không thể tải dữ liệu phiên học.";
        setError(message);
        setDetail(null);
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [routeSessionId, taskId]);

  useEffect(() => {
    if (!taskId || !sessionId) {
      return;
    }

    storeSessionId(taskId, sessionId);
  }, [sessionId, taskId]);

  const handleStartSession = async () => {
    if (!taskId || isStarting) {
      return;
    }

    setIsStarting(true);
    setError(null);

    try {
      const response = await studySessionService.startStudySession(taskId);
      setCurrentSession(response);
      setSessionId(response.sessionId);
      storeSessionId(taskId, response.sessionId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể bắt đầu phiên học.");
    } finally {
      setIsStarting(false);
    }
  };

  const handleFinishSession = async () => {
    if (!sessionId || isFinishing) {
      return;
    }

    setIsFinishing(true);
    setError(null);

    const payload: FinishStudySessionRequest = {};
    const trimmedNotes = notes.trim();
    if (trimmedNotes) {
      payload.notes = trimmedNotes;
    }

    const parsedFocusScore = Number.parseInt(focusScore, 10);
    if (Number.isFinite(parsedFocusScore) && parsedFocusScore >= 1 && parsedFocusScore <= 5) {
      payload.focusScore = parsedFocusScore;
    }

    try {
      const response = await studySessionService.finishStudySession(sessionId, payload);
      setCurrentSession(response);
      if (taskId) {
        clearStoredSessionId(taskId);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể kết thúc phiên học.");
    } finally {
      setIsFinishing(false);
    }
  };

  const goBack = () => {
    navigate(-1);
  };

  if (!taskId) {
    return (
      <div className="min-h-screen bg-[#F4F6FB] text-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#FFF7ED] text-[#FF6B00] border border-[#FFEDD5] shadow-lg shadow-[#FF6B00]/5">
            <Target size={32} />
          </div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Mở Study Session từ Calendar Task</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-500 max-w-md mx-auto">
            Trang này đã được kết nối với backend study session thật. Hãy mở nó từ một task học tập để hiển thị được chi tiết bài học, tài nguyên và các nút bắt đầu/hoàn thành.
          </p>
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-900 max-w-sm mx-auto">
            Hiện tại chưa có thông tin task trong trạng thái định tuyến.
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={goBack} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-xs font-bold text-white hover:bg-slate-800">
              <ArrowLeft size={14} /> Quay lại
            </button>
            <Link to="/app/calendar" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50">
              <BookOpen size={14} /> Mở Lịch học
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#F9FAFB] text-slate-900 pb-16 overflow-hidden">
      {/* Premium background decorative glows */}
      <div className="absolute left-[-10%] top-[-10%] -z-10 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#FF6B00]/5 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute right-[-10%] bottom-[-10%] -z-10 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-[#6366F1]/5 to-transparent blur-[150px] pointer-events-none" />

      {/* Header Banner */}
      <header className="mx-auto max-w-[1600px] px-4 pt-6 sm:px-6 lg:px-8">
        <div className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-[2rem] border border-orange-100 bg-gradient-to-br from-[#FFF8F5] via-[#FFF1EB] to-[#FFFFFF] p-6 shadow-[0_16px_40px_-12px_rgba(255,107,0,0.08)] sm:flex-row sm:items-center sm:p-8">
          <div className="absolute -left-20 -top-20 h-48 w-48 rounded-full bg-[#FF6B00]/5 blur-[80px]" />
          
          <div className="relative min-w-0 space-y-2">
            <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <button type="button" onClick={goBack} className="inline-flex items-center gap-1 hover:text-[#FF6B00] font-medium">
                <ArrowLeft size={14} /> Quay lại
              </button>
              <span>/</span>
              <Link to="/app/calendar" className="hover:text-[#FF6B00] font-medium">
                Study Calendar
              </Link>
              <span>/</span>
              <span className="truncate font-bold text-[#FF6B00]">Phiên học</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              {task?.title ?? state.title ?? "Study Session"}
            </h1>
            <p className="text-sm font-semibold text-slate-600">{roadmapStep?.title ?? state.subject ?? "Bài học hiện tại"}</p>
          </div>

          <div className="relative flex flex-wrap items-center justify-end gap-2 self-start sm:self-center">
            <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold ring-1 ${
              isCompleted 
                ? "bg-emerald-50 text-emerald-700 ring-emerald-200" 
                : "bg-orange-50 text-orange-700 ring-orange-200"
            }`}>
              <Sparkles size={13} className="text-amber-500" />
              {formatStatusLabel(currentSession?.status ?? task?.status)}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
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
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
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
                <div className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_2px_8px_-3px_rgba(15,23,42,0.05),0_12px_24px_-4px_rgba(15,23,42,0.04)] sm:p-8">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#FF6B00]">
                      <Target size={13} /> Study focus
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-[10px] font-bold text-slate-600">
                      <Clock3 size={13} /> {formatDate(task?.taskDate)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-[10px] font-bold text-slate-600">
                      <BookOpen size={13} /> {task?.category ?? "Study"}
                    </span>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
                    <div>
                      <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 lg:text-3xl">{task?.title ?? "Study Session"}</h2>
                      <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">
                         {roadmapStep?.subtitle ?? task?.description ?? "Hoàn thành bài học theo luồng Study Session, ghi chú ngắn gọn, và chấm mức độ tập trung để đóng phiên."}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                      <MetricCard label="Trạng thái task" value={formatStatusLabel(task?.status)} />
                      <MetricCard label="Mức ưu tiên" value={task?.priority ?? "NORMAL"} />
                      <MetricCard label="Phiên hiện tại" value={hasStartedSession ? "Đang mở" : "Chưa bắt đầu"} />
                    </div>
                  </div>

                  <section className="rounded-3xl border border-orange-100 bg-[#FFF7ED]/30 p-5 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/20">
                        <Sparkles size={22} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#FF6B00]">Study summary</p>
                        <h3 className="mt-0.5 text-lg font-bold tracking-tight text-slate-800">
                          {roadmapStep?.title ?? task?.title ?? "Study Session"}
                        </h3>
                        <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-500 line-clamp-3" title={roadmapStep?.summary ?? task?.description ?? ""}>
                          {roadmapStep?.summary ?? task?.description ?? "Backend chưa trả summary cho bước học này. Dùng sidebar bên phải để bắt đầu và hoàn thành bài học theo MVP."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <PillStat label="Estimated" value={roadmapStep?.estimatedMinutes ? `${roadmapStep.estimatedMinutes} phút` : task?.durationMinutes ? `${task.durationMinutes} phút` : "--"} />
                      <PillStat label="Roadmap" value={formatStatusLabel(roadmapStep?.status)} />
                      <PillStat label="Session" value={hasStartedSession ? "Đang mở" : "Chưa bắt đầu"} />
                    </div>
                  </section>

                  <section className="grid gap-4 sm:grid-cols-2">
                    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                          <FileText size={18} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold tracking-tight text-slate-800">Roadmap subtitle</h3>
                          <p className="text-[11px] text-slate-400">Tóm tắt phần học hiện tại</p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-xs font-semibold leading-relaxed text-slate-500 line-clamp-2" title={roadmapStep?.subtitle ?? ""}>
                          {roadmapStep?.subtitle ?? "Chưa có subtitle cho roadmap step này."}
                        </p>
                      </div>
                    </article>

                    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#FF6B00] border border-orange-100">
                          <BookOpen size={18} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold tracking-tight text-slate-800">Practice prompt</h3>
                          <p className="text-[11px] text-slate-400">Bài luyện tập ngắn</p>
                        </div>
                      </div>

                      {practice ? (
                        <div className="mt-4 space-y-2">
                          <div className="rounded-2xl border border-orange-100 bg-[#FFF7ED]/30 p-3">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-[#FF6B00]">Prompt</p>
                            <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600 line-clamp-3" title={practice.prompt}>
                              {practice.prompt}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-700">Expected output</p>
                            <p className="mt-1 text-xs font-semibold leading-relaxed text-emerald-800 line-clamp-3" title={practice.expectedOutput}>
                              {practice.expectedOutput}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs leading-relaxed text-slate-500 font-semibold">
                          Chưa có practice prompt cho task này.
                        </div>
                      )}
                    </article>
                  </section>

                  <section className="grid gap-4 sm:grid-cols-2">
                    <SectionCard title="What to learn" items={normalizeList(roadmapStep?.whatToLearn)} emptyText="Backend chưa trả danh sách mục tiêu học." accent="orange" />
                    <SectionCard title="Key concepts" items={normalizeList(roadmapStep?.keyConcepts)} emptyText="Backend chưa trả key concepts." accent="slate" />
                    <SectionCard title="Learning outcomes" items={normalizeList(roadmapStep?.learningOutcomes)} emptyText="Backend chưa trả learning outcomes." accent="emerald" />
                    <SectionCard title="Recommended focus" items={normalizeList(roadmapStep?.recommendedFocus)} emptyText="Backend chưa trả recommended focus." accent="amber" />
                  </section>

                  <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#FF6B00] border border-orange-100">
                        <WandSparkles size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold tracking-tight text-slate-800">Resources</h3>
                        <p className="text-[11px] text-slate-400">Tài nguyên gợi ý từ backend cho phiên học này</p>
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
                            className="group rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:bg-[#FFF7ED]/35"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-xs font-bold text-slate-800 group-hover:text-[#FF6B00] transition-colors">{resource.title ?? "Untitled resource"}</p>
                                <p className="mt-0.5 text-[10px] font-bold text-slate-400">{resource.platform ?? resource.resourceType ?? "Resource"}</p>
                              </div>
                              {resource.aiRecommended ? <Sparkles size={13} className="text-[#FF6B00] shrink-0" /> : null}
                            </div>
                            <p className="mt-2 text-xs font-medium leading-relaxed text-slate-500">{resource.reason ?? resource.content ?? "Backend resource."}</p>
                          </a>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-xs font-semibold text-slate-400 md:col-span-2 xl:col-span-3">
                          Chưa có tài nguyên cho phiên học này.
                        </div>
                      )}
                    </div>
                  </article>

                </div>
              </>
            )}
          </section>

          <aside className="lg:sticky lg:top-6 self-start">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_2px_8px_-3px_rgba(15,23,42,0.05),0_12px_24px_-4px_rgba(15,23,42,0.04)]">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 border border-orange-100 text-[#FF6B00]">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight text-slate-800">Session controls</h3>
                  <p className="text-[11px] text-slate-400">Điều khiển phiên học</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 mb-5">
                <div className="flex items-center justify-between gap-3 text-xs font-semibold py-1">
                  <span className="text-slate-400">Session state</span>
                  <span className={`font-bold ${isCompleted ? "text-emerald-600" : hasStartedSession ? "text-[#FF6B00]" : "text-slate-700"}`}>
                    {isCompleted ? "Completed" : hasStartedSession ? "In progress" : "Not started"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-xs font-semibold py-1 mt-1">
                  <span className="text-slate-400">Can start</span>
                  <span className={`font-bold ${actions?.canStart ? "text-emerald-600" : "text-slate-400"}`}>{actions?.canStart ? "Yes" : "No"}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-xs font-semibold py-1 mt-1">
                  <span className="text-slate-400">Can finish</span>
                  <span className={`font-bold ${actions?.canFinish ? "text-emerald-600" : "text-slate-400"}`}>{actions?.canFinish ? "Yes" : "No"}</span>
                </div>
              </div>

              {isCompleted ? (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 shadow-sm">
                      <CheckCircle2 size={22} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-700">Completed</p>
                      <h4 className="mt-1 text-base font-extrabold text-slate-900">🎉 Bài học hoàn thành!</h4>
                      <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-500">Bạn đã hoàn thành xuất sắc mục tiêu của phiên học này.</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-emerald-100 bg-white/70 p-3.5 text-xs text-slate-500 font-semibold space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span>Trạng thái</span>
                      <span className="font-bold text-emerald-700">Đã hoàn thành</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Session</span>
                      <span className="font-bold text-slate-700">{activeSessionId ? "Đã ghi nhận" : "Không còn phiên mở"}</span>
                    </div>
                  </div>
                </div>
              ) : !hasStartedSession ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-orange-100 bg-[#FFF7ED]/30 p-4 text-xs font-medium text-slate-500 leading-relaxed">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#FF6B00] mb-1">Ready to begin</p>
                    {canStartByDate
                      ? "Hệ thống sẽ tạo phiên học mới và giữ lại session đang mở để bạn quay lại tiếp tục."
                      : "Bài học này chưa đến ngày học theo lịch trình. Bạn sẽ mở được khi đến hạn."}
                  </div>

                  <button
                    type="button"
                    onClick={handleStartSession}
                    disabled={!canStart}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF6B00] to-amber-500 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-[#FF6B00]/25 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isStarting ? <LoaderCircle size={16} className="animate-spin text-white" /> : <PlayCircle size={16} />}
                    {canStartByDate ? "🚀 Bắt đầu học" : "⏳ Chưa đến ngày học"}
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3.5 mb-3.5">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Session in progress</p>
                      <h4 className="text-sm font-extrabold text-slate-800">Ghi chú & chấm điểm</h4>
                    </div>
                    <span className="rounded-full bg-white border border-slate-100 px-2.5 py-1 text-[10px] font-bold text-[#FF6B00] shadow-sm">
                      Active
                    </span>
                  </div>

                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="study-notes">
                        Ghi chú
                      </label>
                      <textarea
                        id="study-notes"
                        rows={4}
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        placeholder="Ghi ngắn các điểm đã học, vấn đề gặp phải, hoặc việc cần ôn lại..."
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs outline-none transition focus:border-[#FF6B00]/40 focus:ring-4 focus:ring-[#FFF7ED] placeholder:text-slate-400 font-medium"
                      />
                    </div>

                    <div>
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <label className="block text-xs font-bold text-slate-700" htmlFor="focus-score">
                          Độ tập trung
                        </label>
                        <span className="text-xs font-bold text-[#FF6B00]">{focusScore}/5</span>
                      </div>
                      <input
                        id="focus-score"
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={focusScore}
                        onChange={(event) => setFocusScore(event.target.value)}
                        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-[#FF6B00]"
                      />
                      <div className="mt-1 flex justify-between text-[9px] font-bold text-slate-400">
                        <span>Low</span>
                        <span>High</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleFinishSession}
                    disabled={!canFinish}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF6B00] to-amber-500 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-[#FF6B00]/25 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isFinishing ? <LoaderCircle size={16} className="animate-spin text-white" /> : <CheckCircle2 size={16} />}
                    ✅ Hoàn thành bài học
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_2px_6px_rgba(15,23,42,0.02)] transition duration-200 hover:border-slate-300">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-1.5 text-sm font-extrabold text-slate-800">{value}</p>
    </div>
  );
}

function PillStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-[#FF6B00] shadow-[0_2px_6px_rgba(15,23,42,0.02)] transition duration-200 hover:border-slate-300">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-1.5 text-sm font-extrabold text-[#FF6B00]">{value}</p>
    </div>
  );
}

function SectionCard({ title, items, emptyText, accent }: { title: string; items: string[]; emptyText: string; accent: "orange" | "slate" | "emerald" | "amber" }) {
  const accentClasses: Record<string, string> = {
    orange: "border-orange-100 bg-[#FFF7ED]/35 hover:border-orange-200",
    slate: "border-slate-200 bg-slate-50/50 hover:border-slate-300",
    emerald: "border-emerald-100 bg-[#EFFDF5]/50 hover:border-[#A7F3D0]",
    amber: "border-amber-100 bg-[#FFFBEB]/50 hover:border-amber-200",
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:shadow-md ${accentClasses[accent]}`}>
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-3.5 space-y-2">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="flex gap-2 text-xs font-semibold leading-relaxed text-slate-600">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6B00]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs leading-relaxed text-slate-400 font-medium">{emptyText}</p>
      )}
    </div>
  );
}
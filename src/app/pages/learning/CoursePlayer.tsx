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
  const canStart = Boolean(taskId) && (actions?.canStart ?? true) && !hasStartedSession && !isStarting && !isFinishing;
  const canFinish = Boolean(activeSessionId) && !isCompleted && (actions?.canFinish ?? true) && !isStarting && !isFinishing;
  const startButtonLabel = isStarting ? "Đang khởi tạo..." : hasStartedSession ? "Đã mở phiên học" : "Bắt đầu học";
  const finishButtonLabel = isFinishing ? "Đang hoàn thành..." : "Hoàn thành bài học";

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
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ring-1 ${isCompleted ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-orange-50 text-orange-700 ring-orange-200"}`}>
              <Sparkles size={13} />
              {formatStatusLabel(currentSession?.status ?? task?.status)}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
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

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-800 lg:text-3xl">{task?.title ?? "Study Session"}</h2>
                    <p className="mt-3 text-base leading-7 text-slate-600">
                      {roadmapStep?.subtitle ?? task?.description ?? "Hoàn thành bài học theo luồng Study Session, ghi chú ngắn gọn, và chấm mức độ tập trung để đóng phiên."}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                    <MetricCard label="Trạng thái task" value={formatStatusLabel(task?.status)} />
                    <MetricCard label="Mức ưu tiên" value={task?.priority ?? "NORMAL"} />
                    <MetricCard label="Phiên hiện tại" value={hasStartedSession ? "Đang mở" : "Chưa bắt đầu"} />
                  </div>
                </div>

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

                <section className="grid gap-4 sm:grid-cols-2">
                  <SectionCard title="What to learn" items={normalizeList(roadmapStep?.whatToLearn)} emptyText="Backend chưa trả danh sách mục tiêu học." accent="orange" />
                  <SectionCard title="Key concepts" items={normalizeList(roadmapStep?.keyConcepts)} emptyText="Backend chưa trả key concepts." accent="slate" />
                  <SectionCard title="Learning outcomes" items={normalizeList(roadmapStep?.learningOutcomes)} emptyText="Backend chưa trả learning outcomes." accent="emerald" />
                  <SectionCard title="Recommended focus" items={normalizeList(roadmapStep?.recommendedFocus)} emptyText="Backend chưa trả recommended focus." accent="amber" />
                </section>

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

        <aside className="lg:sticky lg:top-6 self-start">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-sm">
                          <Sparkles size={18} />
                        </div>
                        <div>
                          <h3 className="text-base font-black tracking-tight">Session controls</h3>
                          <p className="text-sm text-slate-500">Command center của phiên học</p>
                        </div>
                      </div>

                      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-slate-500">Session state</span>
                          <span className={`font-bold ${isCompleted ? "text-emerald-600" : hasStartedSession ? "text-orange-600" : "text-slate-700"}`}>
                            {isCompleted ? "Completed" : hasStartedSession ? "In progress" : "Not started"}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                          <span className="text-slate-500">Can start</span>
                          <span className={`font-bold ${actions?.canStart ? "text-emerald-600" : "text-slate-400"}`}>{actions?.canStart ? "Yes" : "No"}</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                          <span className="text-slate-500">Can finish</span>
                          <span className={`font-bold ${actions?.canFinish ? "text-emerald-600" : "text-slate-400"}`}>{actions?.canFinish ? "Yes" : "No"}</span>
                        </div>
                      </div>

                      {isCompleted ? (
                        <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
                          <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-sm">
                              <CheckCircle2 size={24} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Completed</p>
                              <h4 className="mt-2 text-xl font-black tracking-tight text-slate-900">🎉 Bài học đã hoàn thành!</h4>
                              <p className="mt-2 text-sm leading-6 text-slate-600">Bạn đã hoàn thành xuất sắc mục tiêu của phiên học này.</p>
                            </div>
                          </div>

                          <div className="mt-5 rounded-2xl border border-emerald-100 bg-white/80 p-4 text-sm text-slate-600">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-slate-500">Trạng thái</span>
                              <span className="font-bold text-emerald-700">Đã hoàn thành</span>
                            </div>
                            <div className="mt-3 flex items-center justify-between gap-3">
                              <span className="text-slate-500">Session</span>
                              <span className="font-bold text-slate-800">{activeSessionId ? "Đã ghi nhận" : "Không còn phiên mở"}</span>
                            </div>
                          </div>
                        </div>
                      ) : !hasStartedSession ? (
                        <div className="mt-5 space-y-4">
                          <div className="rounded-xl border border-orange-100 bg-orange-50 p-5">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-700">Ready to begin</p>
                            <h4 className="mt-2 text-xl font-black tracking-tight text-slate-900">Bắt đầu học khi bạn sẵn sàng</h4>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              Hệ thống sẽ tạo phiên học mới và giữ lại session đang mở để bạn quay lại tiếp tục.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={handleStartSession}
                            disabled={!canStart}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isStarting ? <LoaderCircle size={16} className="animate-spin" /> : <PlayCircle size={16} />}
                            🚀 Bắt đầu học
                          </button>
                        </div>
                      ) : (
                        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Session in progress</p>
                              <h4 className="mt-1 text-lg font-black tracking-tight text-slate-900">Ghi chú và chấm mức tập trung</h4>
                            </div>
                            <div className="rounded-2xl bg-white px-3 py-2 text-xs font-bold text-slate-500 shadow-sm">
                              {activeSessionId ? "Session active" : "Session pending"}
                            </div>
                          </div>

                          <div className="mt-4 space-y-3">
                            <label className="block text-sm font-semibold text-slate-700" htmlFor="study-notes">
                              Notes
                            </label>
                            <textarea
                              id="study-notes"
                              rows={5}
                              value={notes}
                              onChange={(event) => setNotes(event.target.value)}
                              placeholder="Ghi ngắn các điểm đã học, vấn đề gặp phải, hoặc việc cần ôn lại..."
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                            />

                            <div>
                              <div className="mb-2 flex items-center justify-between gap-3">
                                <label className="block text-sm font-semibold text-slate-700" htmlFor="focus-score">
                                  Focus score
                                </label>
                                  <span className="text-sm font-bold text-orange-600">{focusScore}/5</span>
                              </div>
                              <input
                                id="focus-score"
                                type="range"
                                min="1"
                                max="5"
                                step="1"
                                value={focusScore}
                                onChange={(event) => setFocusScore(event.target.value)}
                                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-orange-600"
                              />
                              <div className="mt-2 flex justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                <span>Low</span>
                                <span>High</span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleFinishSession}
                            disabled={!canFinish}
                            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isFinishing ? <LoaderCircle size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
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

function SectionCard({ title, items, emptyText, accent }: { title: string; items: string[]; emptyText: string; accent: "orange" | "slate" | "emerald" | "amber" }) {
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
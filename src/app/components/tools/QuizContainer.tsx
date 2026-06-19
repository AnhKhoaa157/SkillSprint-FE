import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  LoaderCircle,
  Lock,
  RotateCcw,
  Sparkles,
  Trophy,
  WandSparkles,
  XCircle,
  Zap,
  Target,
  BrainCircuit,
} from "lucide-react";
import quizService, {
  type QuizAttemptResponse,
  type QuizQuestionResponse,
  type QuizResponse,
} from "../../../api/learning/quizService";

// ── Types ──────────────────────────────────────────────────────────────────────

type QuizPhase = "start" | "active" | "result";
type Difficulty = "EASY" | "MEDIUM" | "HARD";

interface QuizContainerProps {
  stepId?: string;
  quizId?: string;
  currentPlan: string | null | undefined;
  onComplete: (result: { isPassed: boolean; score: number }) => void;
  onCompleteSession?: (result: QuizAttemptResponse) => void;
}

interface QuizConfig {
  difficulty: Difficulty;
  questionCount: number;
}

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string; desc: string; color: string }[] = [
  { value: "EASY", label: "Dễ", desc: "Khái niệm cơ bản", color: "emerald" },
  { value: "MEDIUM", label: "Trung bình", desc: "Ứng dụng thực tế", color: "orange" },
  { value: "HARD", label: "Khó", desc: "Phân tích chuyên sâu", color: "rose" },
];

const COUNT_OPTIONS = [5, 10, 15];

const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  EASY: "border-emerald-200 bg-emerald-50 text-emerald-700 ring-emerald-500/20",
  MEDIUM: "border-orange-200 bg-orange-50 text-orange-700 ring-orange-500/20",
  HARD: "border-rose-200 bg-rose-50 text-rose-700 ring-rose-500/20",
};

function hasPremiumAccess(plan: string | null | undefined): boolean {
  if (!plan) return false;
  const upper = plan.toUpperCase();
  return upper === "PREMIUM" || upper.includes("PREMIUM") || upper === "ADMIN" || upper === "ADMIN_DEFAULT";
}

function isAdminDefault(plan: string | null | undefined): boolean {
  if (!plan) return false;
  const upper = plan.toUpperCase().trim();
  return upper === "ADMIN" || upper === "ADMIN_DEFAULT";
}

function safeArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function normaliseQuiz(raw: QuizResponse | null): QuizResponse | null {
  if (!raw) return null;
  return {
    ...raw,
    questions: safeArray(raw.questions).map((q) => ({
      ...q,
      options: safeArray(q.options),
    })),
  };
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function QuizContainer({
  stepId,
  quizId,
  currentPlan,
  onComplete,
  onCompleteSession,
}: QuizContainerProps) {
  const [quiz, setQuiz] = useState<QuizResponse | null>(null);
  const [phase, setPhase] = useState<QuizPhase>("start");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizAttemptResponse | null>(null);
  const [quizConfig, setQuizConfig] = useState<QuizConfig>({ difficulty: "MEDIUM", questionCount: 10 });

  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Derived state ────────────────────────────────────────────────────────────

  const isPremiumLocked = !hasPremiumAccess(currentPlan);

  const questions: QuizQuestionResponse[] = safeArray(quiz?.questions);
  const totalQuestions = questions.length;
  const safeIndex = totalQuestions > 0 ? Math.min(currentIndex, totalQuestions - 1) : 0;
  const currentQuestion: QuizQuestionResponse | null = questions[safeIndex] ?? null;
  const currentOptions = safeArray(currentQuestion?.options);

  const selectedOptionId = currentQuestion
    ? (answers[currentQuestion.questionId] ?? null)
    : null;
  const progressPercent =
    totalQuestions > 0 ? ((safeIndex + 1) / totalQuestions) * 100 : 0;
  const isLastQuestion = totalQuestions > 0 && safeIndex === totalQuestions - 1;
  const answeredCount = Object.keys(answers).length;

  // Admin fast-submit tool — same gate as the DEV "Tua nhanh" button: only check
  // plan type client-side. When backend ships `correct` flags, it picks those;
  // otherwise it pre-fills every question and jumps straight to submit so the
  // admin can hit "Nộp bài" immediately without clicking through each question.
  const adminCanAutofill = isAdminDefault(currentPlan) && phase === "active" && totalQuestions > 0;

  // ── Effects ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!hasPremiumAccess(currentPlan)) {
      setIsLoading(false);
      return;
    }

    const targetId = stepId || quizId;
    if (!targetId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setQuiz(null);
    setPhase("start");
    setCurrentIndex(0);
    setAnswers({});
    setResult(null);

    quizService
      .getCurrent(targetId)
      .then((data) => {
        if (cancelled) return;
        setQuiz(normaliseQuiz(data));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const status = (err as { status?: number }).status;
        if (status !== 404) {
          setError(err instanceof Error ? err.message : "Không thể tải quiz.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [stepId, quizId, currentPlan]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  async function handleGenerate() {
    const targetId = stepId || quizId;
    if (!targetId) return;
    setIsGenerating(true);
    setError(null);
    try {
      const data = await quizService.generate(targetId);
      setQuiz(normaliseQuiz(data));
      setPhase("start");
      setCurrentIndex(0);
      setAnswers({});
      setResult(null);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Không thể tạo quiz. Thử lại sau.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function handleSelectOption(optionId: string) {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.questionId]: optionId }));
  }

  // [Admin tool] Pre-fill every question then jump to last question so the
  // "Nộp bài" button is exposed. Picks the correct-flagged option when the
  // backend exposes it (admin subscription active); if not available, still
  // fills with opts[0] so the admin can at least fast-navigate and submit.
  // Score accuracy depends on whether the backend shipped correct flags.
  function handleAdminAutoFill() {
    const qs = safeArray(quiz?.questions);
    const hasCorrectFlags = qs.some((q) =>
      safeArray(q.options).some((o) => o.correct === true)
    );
    const filled: Record<string, string> = {};
    for (const q of qs) {
      const opts = safeArray(q.options);
      const pick = hasCorrectFlags
        ? opts.find((o) => o.correct === true) ?? opts[0]
        : opts[0];
      if (pick) filled[q.questionId] = pick.optionId;
    }
    setAnswers(filled);
    if (qs.length > 0) setCurrentIndex(qs.length - 1);
  }

  function handleNext() {
    if (!selectedOptionId) return;
    setCurrentIndex((prev) => prev + 1);
  }

  async function handleSubmit() {
    if (!quiz || isSubmitting) return;
    const payload = safeArray(quiz.questions).map((q) => ({
      questionId: q.questionId,
      selectedOptionId: answers[q.questionId] ?? "",
    }));
    setIsSubmitting(true);
    setError(null);
    try {
      const attempt = await quizService.submit(quiz.quizId, { answers: payload });
      setResult(attempt);
      setPhase("result");
      window.dispatchEvent(new Event("skillSprint:points-updated"));
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Nộp quiz thất bại. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleRetry() {
    setAnswers({});
    setCurrentIndex(0);
    setResult(null);
    setPhase("start");
  }

  const handleFinishQuiz = () => {
    if (!result) return;
    const correctCount = result.correctAnswers ?? 0;
    const totalCount = result.totalQuestions ?? 1;
    const isPassed = totalCount > 0 ? (correctCount / totalCount >= 0.8) : false;
    onComplete({ isPassed, score: correctCount });
    onCompleteSession?.(result);
  };

  // ── Premium locked overlay ───────────────────────────────────────────────────

  if (isPremiumLocked) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="pointer-events-none select-none blur-[2px] opacity-30 p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
            <div className="h-11 w-11 shrink-0 rounded-2xl bg-orange-100" />
            <div className="flex-1 space-y-2">
              <div className="h-2.5 w-20 rounded bg-slate-200" />
              <div className="h-4 w-44 rounded bg-slate-300" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-3.5 w-52 rounded bg-slate-200" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-14 rounded-xl bg-slate-100" />
              <div className="h-14 rounded-xl bg-slate-100" />
            </div>
          </div>
          <div className="space-y-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 w-full rounded-xl bg-slate-100" />
            ))}
          </div>
          <div className="h-12 rounded-2xl bg-orange-50" />
        </div>

        <div className="absolute inset-0 flex items-center justify-center bg-white/60 p-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-orange-100 bg-white p-8 text-center shadow-xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF6B00] to-orange-600 text-white shadow-lg shadow-orange-500/30">
              <Lock size={22} />
            </div>
            <h3 className="text-base font-extrabold tracking-tight text-slate-800">
              Unlock Premium Quiz Feature
            </h3>
            <p className="mt-2.5 text-xs leading-6 text-slate-500">
              AI-powered quizzes are a Premium feature. Upgrade your plan to
              test your knowledge with instant feedback on every answer.
            </p>
            <Link
              to="/app/pricing"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF6B00] to-orange-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-orange-500/20 transition hover:from-orange-600 hover:to-orange-700 active:scale-[0.98]"
            >
              <Sparkles size={14} /> Upgrade to Premium
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
        <LoaderCircle size={20} className="animate-spin text-[#FF6B00]" />
        <p className="text-sm font-semibold text-slate-400">Đang tải câu hỏi quiz...</p>
      </div>
    );
  }

  // ── Fatal error ──────────────────────────────────────────────────────────────

  if (error && !quiz) {
    return (
      <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-500" />
          <div>
            <p className="text-sm font-bold text-rose-800">Không thể tải quiz</p>
            <p className="mt-1 text-xs leading-5 text-rose-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // ── No quiz yet — generate config screen ─────────────────────────────────────

  if (!quiz) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 bg-gradient-to-br from-orange-50/80 via-amber-50/30 to-transparent border-b border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B00] to-orange-500 text-white shadow-md shadow-orange-500/25">
              <WandSparkles size={18} />
            </div>
            <div>
              <span className="block text-[9px] font-black uppercase tracking-[0.22em] text-[#FF6B00]">
                AI Quiz Generator
              </span>
              <h3 className="text-sm font-extrabold text-slate-800 leading-tight">
                Tạo bộ câu hỏi thông minh
              </h3>
            </div>
          </div>
          <p className="text-[11px] leading-5 text-slate-500 font-medium">
            AI phân tích nội dung bài học và tự động tạo câu hỏi phù hợp với mức độ bạn chọn.
          </p>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-2 px-5 pt-4 pb-3">
          {[
            { icon: <BrainCircuit size={13} />, label: "Phân tích nội dung", color: "text-orange-600 bg-orange-50 border-orange-100" },
            { icon: <Target size={13} />, label: "Câu hỏi sát đề", color: "text-amber-600 bg-amber-50 border-amber-100" },
            { icon: <Zap size={13} />, label: "Phản hồi tức thì", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
          ].map((f, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-center">
              <span className={`flex h-7 w-7 items-center justify-center rounded-lg border ${f.color}`}>
                {f.icon}
              </span>
              <span className="text-[9px] font-bold text-slate-600 leading-tight">{f.label}</span>
            </div>
          ))}
        </div>

        {/* Config panel */}
        <div className="px-5 pb-5 space-y-4">
          {/* Difficulty */}
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 mb-2">
              Độ khó
            </p>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTY_OPTIONS.map((opt) => {
                const active = quizConfig.difficulty === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setQuizConfig((c) => ({ ...c, difficulty: opt.value }))}
                    className={`rounded-xl border p-2.5 text-center transition-all duration-150 ${
                      active
                        ? `${DIFFICULTY_COLOR[opt.value]} ring-2 shadow-sm`
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <p className="text-[11px] font-extrabold">{opt.label}</p>
                    <p className="text-[9px] font-medium leading-tight mt-0.5 opacity-80">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question count */}
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 mb-2">
              Số câu hỏi
            </p>
            <div className="flex gap-2">
              {COUNT_OPTIONS.map((n) => {
                const active = quizConfig.questionCount === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setQuizConfig((c) => ({ ...c, questionCount: n }))}
                    className={`flex-1 rounded-xl border py-2.5 text-sm font-extrabold transition-all duration-150 ${
                      active
                        ? "border-orange-300 bg-orange-50 text-orange-700 ring-2 ring-orange-500/20 shadow-sm"
                        : "border-slate-200 bg-white text-slate-500 hover:border-orange-200 hover:bg-orange-50/40"
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-orange-500 px-5 py-3.5 text-sm font-extrabold text-white shadow-md shadow-orange-500/20 transition hover:from-orange-600 hover:to-orange-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGenerating ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : (
              <Sparkles size={15} />
            )}
            {isGenerating ? "AI đang tạo câu hỏi..." : "Tạo Quiz bằng AI"}
          </button>

          {isGenerating && (
            <p className="text-center text-[10px] text-slate-400">
              AI đang phân tích nội dung bài học, vui lòng đợi...
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── START screen ─────────────────────────────────────────────────────────────

  if (phase === "start") {
    return (
      <div className="relative rounded-3xl border border-orange-100 bg-white overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-32 w-32 rounded-full bg-orange-400/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-32 w-32 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
        
        {/* Header */}
        <div className="relative flex items-center gap-4 px-6 py-5 bg-gradient-to-br from-orange-50/80 via-white to-amber-50/30 border-b border-orange-100/50">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF6B00] to-orange-500 text-white shadow-lg shadow-orange-500/25 ring-4 ring-orange-50">
            <Sparkles size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF6B00] mb-0.5">
              Kiểm tra kiến thức
            </p>
            <h3 className="text-base font-extrabold text-slate-800 truncate">{quiz.title}</h3>
          </div>
        </div>

        <div className="relative p-6 space-y-6">
          {quiz.description && (
            <p className="text-xs leading-5 text-slate-600 font-medium bg-slate-50/80 rounded-2xl px-4 py-3.5 border border-slate-100">
              {quiz.description}
            </p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatPill label="Số câu" value={`${quiz.questionCount}`} unit="câu" accent="orange" />
            <StatPill
              label="Thời gian"
              value={quiz.durationSeconds ? `${Math.round(quiz.durationSeconds / 60)}` : "∞"}
              unit={quiz.durationSeconds ? "phút" : ""}
              accent="amber"
            />
            <StatPill label="Ngưỡng pass" value={`${quiz.passingScore}`} unit="%" accent="emerald" />
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-orange-200/60 bg-gradient-to-br from-orange-50/80 to-amber-50/40 p-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border border-orange-100 text-[#FF6B00] relative z-10">
              <Sparkles size={16} />
            </div>
            <p className="text-xs leading-5 text-slate-600 font-medium relative z-10 pt-1.5">
              Trả lời lần lượt từng câu, chọn một đáp án đúng nhất. Bạn cần đạt{" "}
              <strong className="text-[#FF6B00] font-extrabold">≥ {quiz.passingScore}%</strong> để pass bước này.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              title="Tạo bộ câu hỏi mới bằng AI"
              className="flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-600 shadow-sm transition-all duration-200 hover:border-orange-200 hover:bg-orange-50 hover:text-[#FF6B00] active:scale-[0.98] disabled:opacity-50"
            >
              {isGenerating ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <RotateCcw size={16} />
              )}
              Tạo lại
            </button>
            <button
              type="button"
              onClick={() => setPhase("active")}
              disabled={totalQuestions === 0}
              className="inline-flex flex-1 items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#FF6B00] to-orange-500 px-6 py-3.5 text-base font-black text-white shadow-lg shadow-orange-500/25 ring-2 ring-orange-500/20 ring-offset-2 transition-all duration-200 hover:scale-[1.01] hover:shadow-orange-500/40 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <WandSparkles size={18} /> Bắt đầu Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── ACTIVE quiz screen ───────────────────────────────────────────────────────

  if (phase === "active") {
    if (!quiz || totalQuestions === 0 || !currentQuestion) {
      return (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
          <LoaderCircle size={20} className="animate-spin text-[#FF6B00]" />
          <p className="text-sm font-semibold text-slate-400">Đang tải câu hỏi...</p>
        </div>
      );
    }

    const optionLetters = ["A", "B", "C", "D", "E"];

    return (
      <div className="relative rounded-3xl border border-orange-100 bg-white overflow-hidden shadow-[0_12px_40px_rgb(0,0,0,0.06)]">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-orange-400/5 blur-3xl pointer-events-none" />
        
        {/* Progress header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-white relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B00] to-orange-500 text-white text-sm font-black shadow-lg shadow-orange-500/30 ring-2 ring-orange-50">
                {safeIndex + 1}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none mb-1">
                  Câu hỏi
                </p>
                <p className="text-sm font-extrabold text-slate-800 leading-tight">
                  {safeIndex + 1} <span className="text-slate-400 font-medium">/ {totalQuestions}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                Đã trả lời: <span className="text-slate-700">{answeredCount}/{totalQuestions}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1 text-[10px] font-bold text-[#FF6B00] shadow-sm">
                <Sparkles size={12} /> AI Quiz
              </span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full overflow-hidden rounded-full bg-slate-100" style={{ height: 6 }}>
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-[#FF6B00] to-orange-500 transition-all duration-700 ease-out relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] animate-[shimmer_1s_infinite_linear]" />
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="px-6 pt-6 pb-4 relative z-10">
          <h2 className="text-base sm:text-lg font-bold leading-relaxed text-slate-800">
            {currentQuestion.question}
          </h2>
        </div>

        {/* Options */}
        <div className="px-6 pb-6 space-y-3 relative z-10">
          {currentOptions.length > 0 ? (
            currentOptions.map((opt, optIdx) => {
              const isSelected = selectedOptionId === opt.optionId;
              return (
                <button
                  key={opt.optionId}
                  type="button"
                  onClick={() => handleSelectOption(opt.optionId)}
                  className={`group w-full flex items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left transition-all duration-200 ${
                    isSelected
                      ? "border-[#FF6B00] bg-orange-50/50 shadow-md shadow-orange-500/10 scale-[1.01]"
                      : "border-slate-100 bg-white hover:border-orange-200 hover:bg-orange-50/30 hover:shadow-sm"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black transition-all duration-300 ${
                      isSelected
                        ? "bg-[#FF6B00] text-white shadow-sm"
                        : "bg-slate-100 text-slate-500 group-hover:bg-orange-100 group-hover:text-[#FF6B00]"
                    }`}
                  >
                    {optionLetters[optIdx] ?? optIdx + 1}
                  </span>
                  <span className={`flex-1 text-sm font-semibold leading-relaxed ${isSelected ? "text-orange-900" : "text-slate-700"}`}>
                    {opt.text}
                  </span>
                  <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                    isSelected ? "border-[#FF6B00] bg-[#FF6B00] text-white" : "border-slate-200 bg-white group-hover:border-orange-300"
                  }`}>
                    {isSelected && <CheckCircle2 size={12} strokeWidth={4} />}
                  </div>
                </button>
              );
            })
          ) : (
            <p className="py-2 text-xs italic text-slate-400">Đang tải đáp án...</p>
          )}
        </div>

        {/* Submit error */}
        {error && (
          <div className="mx-6 mb-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 relative z-10">
            {error}
          </div>
        )}

        {/* Navigation footer */}
        <div className="px-6 pb-6 pt-5 border-t border-slate-100 bg-slate-50/50 relative z-10">
          {adminCanAutofill && (
            <button
              type="button"
              onClick={handleAdminAutoFill}
              title={`Test tool: điền nhanh tất cả câu hỏi${
                questions.some((q) => safeArray(q.options).some((o) => o.correct === true))
                  ? " với đáp án đúng (backend đã xác thực)"
                  : " với option đầu tiên (backend chưa trả correct flags)"
              }`}
              className="mb-3 w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-xs font-bold text-[#FF6B00] transition hover:bg-orange-100 active:scale-[0.98]"
            >
              <Zap size={14} />
              {questions.some((q) => safeArray(q.options).some((o) => o.correct === true))
                ? "[Admin] Auto-Fill Correct Answers"
                : "[Admin] Fast-Fill & Jump to Submit"}
            </button>

          )}
          {isLastQuestion ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!selectedOptionId || isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 text-base font-black text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-600 hover:to-teal-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <CheckCircle2 size={18} />
              )}
              {isSubmitting ? "Đang nộp bài..." : "Nộp bài"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              disabled={!selectedOptionId}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF6B00] to-orange-500 px-6 py-4 text-base font-black text-white shadow-lg shadow-orange-500/20 transition hover:from-orange-600 hover:to-orange-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Câu tiếp theo <ChevronRight size={18} />
            </button>
          )}
          {!selectedOptionId && (
            <p className="mt-3 text-center text-xs font-medium text-slate-400">
              Chọn một đáp án để tiếp tục
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── RESULT screen ────────────────────────────────────────────────────────────

  if (phase === "result" && result) {
    const passed = result.passed;
    const score = result.score ?? 0;
    const incorrectAnswers = (result.totalQuestions ?? 0) - (result.correctAnswers ?? 0);
    const finalResults = Array.isArray(result?.results) ? result.results : [];
    const quizQuestions = safeArray(quiz?.questions);

    return (
      <div className="relative rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-[0_12px_40px_rgb(0,0,0,0.06)]">
        {/* Background glow */}
        <div className={`absolute top-0 right-0 -mt-16 -mr-16 h-48 w-48 rounded-full blur-3xl pointer-events-none ${
          passed ? "bg-emerald-400/10" : "bg-rose-400/10"
        }`} />
        
        {/* Hero score */}
        <div
          className={`relative px-6 py-8 text-center border-b border-slate-100 z-10 ${
            passed
              ? "bg-gradient-to-b from-emerald-50/90 to-transparent"
              : "bg-gradient-to-b from-rose-50/80 to-transparent"
          }`}
        >
          <div
            className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg ring-4 ${
              passed
                ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-emerald-500/30 ring-emerald-50"
                : "bg-gradient-to-br from-[#FF6B00] to-orange-500 text-white shadow-orange-500/30 ring-rose-50"
            }`}
          >
            {passed ? <Trophy size={28} /> : <XCircle size={28} />}
          </div>
          <p
            className={`text-[10px] font-black uppercase tracking-[0.2em] ${
              passed ? "text-emerald-600" : "text-rose-500"
            }`}
          >
            {passed ? "Xuất sắc! Đã pass ✓" : "Chưa đạt yêu cầu"}
          </p>
          <p className="mt-3 text-6xl font-black tracking-tight text-slate-900 drop-shadow-sm">{score}%</p>
          <p className="mt-2 text-xs font-semibold text-slate-500">
            Đúng {result.correctAnswers}/{result.totalQuestions} câu
          </p>

          <div className="mx-auto mt-5 max-w-[200px] w-full overflow-hidden rounded-full bg-slate-200/80 shadow-inner" style={{ height: 8 }}>
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out relative ${
                passed
                  ? "bg-gradient-to-r from-emerald-400 to-teal-500"
                  : "bg-gradient-to-r from-amber-400 via-[#FF6B00] to-orange-500"
              }`}
              style={{ width: `${score}%` }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] animate-[shimmer_1s_infinite_linear]" />
            </div>
          </div>
          <p className="mt-2 text-[10px] font-bold text-slate-400">
            Ngưỡng pass: {quiz?.passingScore ?? "—"}%
          </p>

          {result.feedback && (
            <p className="mt-4 text-xs leading-relaxed text-slate-600 font-medium italic max-w-sm mx-auto bg-white/60 p-3 rounded-xl border border-slate-100/50 backdrop-blur-sm">
              "{result.feedback}"
            </p>
          )}
        </div>

        <div className="relative p-6 space-y-6 z-10">
          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            <ResultStat label="Tổng câu" value={String(result.totalQuestions)} accent="slate" />
            <ResultStat label="Đúng" value={String(result.correctAnswers)} accent="emerald" />
            <ResultStat label="Sai" value={String(incorrectAnswers)} accent="rose" />
          </div>

          {/* Per-question breakdown */}
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              Chi tiết từng câu
            </p>
            <div className="space-y-3">
              {finalResults.length > 0 ? (
                finalResults.map((item, idx) => {
                  const question = quizQuestions.find(
                    (q) => q.questionId === item.questionId,
                  );
                  const opts = safeArray(question?.options);
                  const selectedOpt = opts.find((o) => o.optionId === item.selectedOptionId);
                  return (
                    <div
                      key={item.questionId}
                      className={`relative overflow-hidden rounded-2xl border-2 p-4 text-sm transition-all duration-200 hover:shadow-sm ${
                        item.correct
                          ? "border-emerald-100 bg-emerald-50/40"
                          : "border-rose-100 bg-rose-50/40"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                          item.correct ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-500"
                        }`}>
                          {item.correct ? (
                            <CheckCircle2 size={14} strokeWidth={3} />
                          ) : (
                            <XCircle size={14} strokeWidth={3} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-800 leading-snug">
                            <span className="text-slate-400 mr-1 font-extrabold">Q{idx + 1}.</span> {question?.question ?? "—"}
                          </p>
                          {!item.correct && (
                            <div className="mt-2.5 rounded-xl bg-white/60 p-2.5 border border-rose-100">
                              <p className="text-xs text-slate-500 font-medium">
                                Bạn chọn:{" "}
                                <span className="font-semibold text-rose-600">
                                  {selectedOpt?.text ?? "—"}
                                </span>
                              </p>
                            </div>
                          )}
                          {item.explanation && (
                            <div className={`mt-2.5 rounded-xl p-3 border ${
                              item.correct ? "bg-emerald-50/80 border-emerald-100" : "bg-white/60 border-rose-100"
                            }`}>
                              <p className={`text-xs leading-5 font-medium italic ${
                                item.correct ? "text-emerald-700" : "text-slate-600"
                              }`}>
                                💡 {item.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="py-2 text-xs italic text-slate-400">
                  Không có dữ liệu chi tiết câu hỏi.
                </p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98]"
            >
              <RotateCcw size={16} /> Làm lại
            </button>
            <button
              type="button"
              onClick={handleFinishQuiz}
              className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-4 text-base font-black text-white shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-500/20 ring-offset-2 transition-all hover:scale-[1.01] hover:shadow-emerald-500/40 active:scale-95"
            >
              <CheckCircle2 size={18} /> Hoàn thành
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ── Sub-components ──────────────────────────────────────────────────────────────

function StatPill({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: string;
  unit: string;
  accent: "orange" | "amber" | "emerald";
}) {
  const accentMap: Record<typeof accent, { text: string, bg: string, border: string, glow: string }> = {
    orange: { text: "text-orange-600", bg: "bg-orange-50/80", border: "border-orange-200/60", glow: "via-orange-400" },
    amber: { text: "text-amber-600", bg: "bg-amber-50/80", border: "border-amber-200/60", glow: "via-amber-400" },
    emerald: { text: "text-emerald-700", bg: "bg-emerald-50/80", border: "border-emerald-200/60", glow: "via-emerald-400" },
  };
  const theme = accentMap[accent];
  return (
    <div className={`rounded-2xl border ${theme.border} ${theme.bg} p-3.5 text-center shadow-sm relative overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:shadow-md group`}>
      <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent ${theme.glow} to-transparent opacity-40 group-hover:opacity-100 transition-opacity`} />
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className={`mt-1.5 text-xl font-black ${theme.text}`}>
        {value}<span className="text-xs font-semibold opacity-70 ml-1">{unit}</span>
      </p>
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
function ResultStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "slate" | "emerald" | "rose";
}) {
  const colorMap: Record<typeof accent, { text: string, bg: string, border: string, glow: string }> = {
    slate: { text: "text-slate-700", bg: "bg-slate-50/80", border: "border-slate-200/60", glow: "via-slate-400" },
    emerald: { text: "text-emerald-600", bg: "bg-emerald-50/80", border: "border-emerald-200/60", glow: "via-emerald-400" },
    rose: { text: "text-rose-600", bg: "bg-rose-50/80", border: "border-rose-200/60", glow: "via-rose-400" },
  };
  const theme = colorMap[accent];
  return (
    <div className={`rounded-2xl border ${theme.border} ${theme.bg} p-4 text-center shadow-sm relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-md group`}>
      <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent ${theme.glow} to-transparent opacity-50 group-hover:opacity-100 transition-opacity`} />
      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-black ${theme.text}`}>{value}</p>
    </div>
  );
}
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
} from "../../../api/quizService";

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
  return plan === "PREMIUM" || plan.includes("PREMIUM");
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
      <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-orange-50/80 to-amber-50/30 border-b border-slate-100">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B00] to-orange-500 text-white shadow-md shadow-orange-500/25">
            <Sparkles size={17} />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#FF6B00]">
              Kiểm tra kiến thức
            </p>
            <h3 className="text-sm font-extrabold text-slate-800 truncate">{quiz.title}</h3>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {quiz.description && (
            <p className="text-xs leading-5 text-slate-500 font-medium bg-slate-50 rounded-xl px-3.5 py-3 border border-slate-100">
              {quiz.description}
            </p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <StatPill label="Số câu" value={`${quiz.questionCount}`} unit="câu" accent="orange" />
            <StatPill
              label="Thời gian"
              value={quiz.durationSeconds ? `${Math.round(quiz.durationSeconds / 60)}` : "∞"}
              unit={quiz.durationSeconds ? "phút" : ""}
              accent="amber"
              // Dùng tạm type map trong StatPill
            />
            <StatPill label="Ngưỡng pass" value={`${quiz.passingScore}`} unit="%" accent="emerald" />
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-orange-100/60 bg-orange-50/40 p-3.5">
            <span className="text-base leading-none mt-0.5">💡</span>
            <p className="text-[11px] leading-5 text-slate-600 font-medium">
              Trả lời lần lượt từng câu, chọn một đáp án đúng nhất. Bạn cần đạt{" "}
              <strong className="text-orange-700">≥ {quiz.passingScore}%</strong> để pass bước này.
            </p>
          </div>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              title="Tạo bộ câu hỏi mới bằng AI"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-xs font-bold text-slate-500 transition hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] disabled:opacity-50"
            >
              {isGenerating ? (
                <LoaderCircle size={13} className="animate-spin" />
              ) : (
                <WandSparkles size={13} />
              )}
              Tạo lại
            </button>
            <button
              type="button"
              onClick={() => setPhase("active")}
              disabled={totalQuestions === 0}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B00] to-orange-500 px-5 py-3 text-sm font-extrabold text-white shadow-md shadow-orange-500/20 transition hover:from-orange-600 hover:to-orange-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles size={14} /> Bắt đầu Quiz
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
      <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm">
        {/* Progress header */}
        <div className="px-5 pt-4 pb-3.5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF6B00] to-orange-500 text-white text-[11px] font-black shadow-md shadow-orange-500/30">
                {safeIndex + 1}
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 leading-none">
                  Câu hỏi
                </p>
                <p className="text-xs font-extrabold text-slate-700 leading-tight mt-0.5">
                  {safeIndex + 1} / {totalQuestions}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-slate-400">
                Đã trả lời: {answeredCount}/{totalQuestions}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-orange-100 bg-orange-50 px-2 py-0.5 text-[9px] font-bold text-orange-600">
                <Sparkles size={8} /> AI Quiz
              </span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full overflow-hidden rounded-full bg-slate-200/80" style={{ height: 5 }}>
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FF6B00] to-orange-400 transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="px-5 pt-4 pb-3">
          <p className="text-sm font-bold leading-6 text-slate-800">
            {currentQuestion.question}
          </p>
        </div>

        {/* Options */}
        <div className="px-5 pb-4 space-y-2">
          {currentOptions.length > 0 ? (
            currentOptions.map((opt, optIdx) => {
              const isSelected = selectedOptionId === opt.optionId;
              return (
                <button
                  key={opt.optionId}
                  type="button"
                  onClick={() => handleSelectOption(opt.optionId)}
                  className={`group w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-all duration-150 active:scale-[0.99] ${
                    isSelected
                      ? "border-orange-300 bg-orange-50 text-orange-800 shadow-sm shadow-orange-500/10"
                      : "border-slate-200 bg-white text-slate-700 hover:border-orange-200 hover:bg-orange-50/40"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-black transition-colors ${
                      isSelected
                        ? "bg-[#FF6B00] text-white"
                        : "bg-slate-100 text-slate-500 group-hover:bg-orange-100 group-hover:text-[#FF6B00]"
                    }`}
                  >
                    {optionLetters[optIdx] ?? optIdx + 1}
                  </span>
                  <span className="flex-1 leading-snug">{opt.text}</span>
                  {isSelected && (
                    <CheckCircle2 size={14} className="shrink-0 text-[#FF6B00]" />
                  )}
                </button>
              );
            })
          ) : (
            <p className="py-2 text-xs italic text-slate-400">Đang tải đáp án...</p>
          )}
        </div>

        {/* Submit error */}
        {error && (
          <div className="mx-5 mb-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}

        {/* Navigation footer */}
        <div className="px-5 pb-5 pt-3 border-t border-slate-100 bg-slate-50/40">
          {isLastQuestion ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!selectedOptionId || isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-md shadow-emerald-600/20 transition hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <LoaderCircle size={14} className="animate-spin" />
              ) : (
                <CheckCircle2 size={14} />
              )}
              {isSubmitting ? "Đang nộp bài..." : "Nộp bài"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              disabled={!selectedOptionId}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B00] to-orange-500 px-6 py-3.5 text-sm font-extrabold text-white shadow-md shadow-orange-500/20 transition hover:from-orange-600 hover:to-orange-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Câu tiếp theo <ChevronRight size={14} />
            </button>
          )}
          {!selectedOptionId && (
            <p className="mt-2 text-center text-[10px] text-slate-400">
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
      <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm">
        {/* Hero score */}
        <div
          className={`px-5 py-6 text-center border-b border-slate-100 ${
            passed
              ? "bg-gradient-to-b from-emerald-50/80 to-transparent"
              : "bg-gradient-to-b from-rose-50/60 to-transparent"
          }`}
        >
          <div
            className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm ${
              passed
                ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-emerald-500/25"
                : "bg-gradient-to-br from-[#FF6B00] to-orange-400 text-white shadow-orange-400/25"
            }`}
          >
            {passed ? <Trophy size={24} /> : <XCircle size={24} />}
          </div>
          <p
            className={`text-[10px] font-black uppercase tracking-[0.2em] ${
              passed ? "text-emerald-600" : "text-rose-500"
            }`}
          >
            {passed ? "Xuất sắc! Đã pass ✓" : "Chưa đạt yêu cầu"}
          </p>
          <p className="mt-2 text-5xl font-black tracking-tight text-slate-900">{score}%</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Đúng {result.correctAnswers}/{result.totalQuestions} câu
          </p>

          <div className="mt-4 w-full overflow-hidden rounded-full bg-slate-200" style={{ height: 7 }}>
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                passed
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                  : "bg-gradient-to-r from-[#FF6B00] to-orange-400"
              }`}
              style={{ width: `${score}%` }}
            />
          </div>
          <p className="mt-1.5 text-[10px] font-semibold text-slate-400">
            Ngưỡng pass: {quiz?.passingScore ?? "—"}%
          </p>

          {result.feedback && (
            <p className="mt-3 text-[11px] leading-5 text-slate-500 font-medium italic max-w-xs mx-auto">
              "{result.feedback}"
            </p>
          )}
        </div>

        <div className="p-5 space-y-4">
          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2">
            <ResultStat label="Tổng câu" value={String(result.totalQuestions)} accent="slate" />
            <ResultStat label="Đúng" value={String(result.correctAnswers)} accent="emerald" />
            <ResultStat label="Sai" value={String(incorrectAnswers)} accent="rose" />
          </div>

          {/* Per-question breakdown */}
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              Chi tiết từng câu
            </p>
            <div className="space-y-2">
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
                      className={`rounded-xl border p-3.5 text-xs ${
                        item.correct
                          ? "border-emerald-100 bg-emerald-50/50"
                          : "border-rose-100 bg-rose-50/50"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {item.correct ? (
                          <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-500" />
                        ) : (
                          <XCircle size={13} className="mt-0.5 shrink-0 text-rose-400" />
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-slate-700">
                            Câu {idx + 1}: {question?.question ?? "—"}
                          </p>
                          {!item.correct && (
                            <p className="mt-1 text-slate-500">
                              Bạn chọn:{" "}
                              <span className="font-semibold text-rose-600">
                                {selectedOpt?.text ?? "—"}
                              </span>
                            </p>
                          )}
                          {item.explanation && (
                            <p className="mt-1.5 italic leading-4 text-slate-400">
                              {item.explanation}
                            </p>
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
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 active:scale-[0.98]"
            >
              <RotateCcw size={14} /> Làm lại
            </button>
            <button
              type="button"
              onClick={handleFinishQuiz}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm font-extrabold text-white shadow-md shadow-emerald-600/20 transition hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98]"
            >
              <CheckCircle2 size={14} /> Hoàn thành
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
  const accentMap: Record<typeof accent, string> = {
    orange: "text-orange-600",
    amber: "text-amber-600",
    emerald: "text-emerald-700",
  };
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-center">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className={`mt-1 text-lg font-extrabold ${accentMap[accent]}`}>
        {value}<span className="text-xs font-semibold text-slate-400 ml-0.5">{unit}</span>
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
  const colorMap: Record<typeof accent, string> = {
    slate: "text-slate-700",
    emerald: "text-emerald-600",
    rose: "text-rose-500",
  };
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 text-center">
      <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
        {label}
      </p>
      <p className={`mt-1 text-xl font-black ${colorMap[accent]}`}>{value}</p>
    </div>
  );
}
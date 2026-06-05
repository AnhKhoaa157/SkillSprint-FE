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
} from "lucide-react";
import quizService, {
  type QuizAttemptResponse,
  type QuizQuestionResponse,
  type QuizResponse,
} from "../../../api/quizService";

// ── Types ──────────────────────────────────────────────────────────────────────

type QuizPhase = "start" | "active" | "result";

interface QuizContainerProps {
  stepId: string;
  currentPlan: string | null | undefined; // Cho phép nhận null hoặc undefined một cách an toàn
  onCompleteSession?: (result: QuizAttemptResponse) => void;
}

// Hàm kiểm tra quyền Premium có fallback an toàn, chấp nhận mọi gói chứa chữ "PREMIUM"
function hasPremiumAccess(plan: string | null | undefined): boolean {
  if (!plan) return false; 
  return plan === "PREMIUM" || plan.includes("PREMIUM");
}

// Guarantees an array regardless of null / undefined / non-array input.
function safeArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

// Normalises a raw quiz payload so every array field is always a real array.
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
  currentPlan,
  onCompleteSession,
}: QuizContainerProps) {
  const [quiz, setQuiz] = useState<QuizResponse | null>(null);
  const [phase, setPhase] = useState<QuizPhase>("start");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizAttemptResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Derived state ────────────────────────────────────────────────────────────

  // Tự động tính toán trạng thái khóa trực tiếp từ prop currentPlan trong mỗi lần render
  const isPremiumLocked = !hasPremiumAccess(currentPlan);

  // Always a real array — never null, never undefined.
  const questions: QuizQuestionResponse[] = safeArray(quiz?.questions);
  const totalQuestions = questions.length;
  // Clamp so a stale index never exceeds the array after a re-generate.
  const safeIndex = totalQuestions > 0 ? Math.min(currentIndex, totalQuestions - 1) : 0;
  const currentQuestion: QuizQuestionResponse | null = questions[safeIndex] ?? null;
  const currentOptions = safeArray(currentQuestion?.options);

  const selectedOptionId = currentQuestion
    ? (answers[currentQuestion.questionId] ?? null)
    : null;
  const progressPercent =
    totalQuestions > 0 ? ((safeIndex + 1) / totalQuestions) * 100 : 0;
  const isLastQuestion = totalQuestions > 0 && safeIndex === totalQuestions - 1;

  // ── Effects ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    // Nếu không có quyền premium, tắt trạng thái tải và dừng fetch API câu hỏi
    if (!hasPremiumAccess(currentPlan)) {
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
      .getCurrent(stepId)
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
  }, [stepId, currentPlan]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);
    try {
      const data = await quizService.generate(stepId);
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

  // ── Premium locked overlay ───────────────────────────────────────────────────

  if (isPremiumLocked) {
    return (
      <div className="relative overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)]">
        {/* Blurred quiz skeleton background */}
        <div className="pointer-events-none select-none blur-[2px] opacity-30 p-6 md:p-8 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
            <div className="h-11 w-11 shrink-0 rounded-2xl bg-orange-200" />
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
          <div className="h-12 rounded-2xl bg-orange-100" />
        </div>

        {/* Lock overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 p-6 backdrop-blur-[2px]">
          <div className="w-full max-w-sm rounded-2xl border border-orange-100 bg-white p-8 text-center shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)]">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-[0_8px_20px_-6px_rgba(249,115,22,0.5)]">
              <Lock size={22} />
            </div>
            <h3 className="text-base font-extrabold tracking-tight text-slate-800">
              Unlock Premium Quiz Feature
            </h3>
            <p className="mt-2.5 text-xs leading-6 text-slate-500">
              AI-powered quizzes are a Premium feature. Upgrade your plan to
              test your knowledge and accelerate your learning with instant
              feedback on every answer.
            </p>
            <Link
              to="/app/pricing"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-orange-500/20 transition hover:from-orange-600 hover:to-amber-600 active:scale-[0.98]"
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
      <div className="flex items-center justify-center gap-3 rounded-[24px] border border-slate-100 bg-white p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)]">
        <LoaderCircle size={20} className="animate-spin text-orange-500" />
        <p className="text-sm font-semibold text-slate-400">
          Đang tải câu hỏi quiz...
        </p>
      </div>
    );
  }

  // ── Fatal error ──────────────────────────────────────────────────────────────

  if (error && !quiz) {
    return (
      <div className="rounded-[24px] border border-rose-100 bg-rose-50 p-6">
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

  // ── No quiz yet — prompt to generate ────────────────────────────────────────

  if (!quiz) {
    return (
      <div className="rounded-[24px] border border-slate-100 bg-white p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] md:p-8">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-[0_8px_20px_-6px_rgba(249,115,22,0.4)]">
            <WandSparkles size={18} />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-600">
              AI Quiz
            </p>
            <h3 className="text-sm font-extrabold text-slate-800">
              Chưa có quiz cho bước học này
            </h3>
          </div>
        </div>
        <div className="mt-5 space-y-4">
          <p className="text-xs leading-6 text-slate-500">
            Hệ thống chưa tạo quiz cho bước học này. Nhấn nút bên dưới để AI
            tự động sinh bộ câu hỏi dựa trên nội dung bài học.
          </p>
          {error && (
            <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-4 text-sm font-extrabold text-white shadow-lg shadow-orange-500/20 transition hover:from-orange-600 hover:to-amber-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGenerating ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : (
              <Sparkles size={15} />
            )}
            {isGenerating ? "Đang tạo quiz..." : "✨ Tạo Quiz bằng AI"}
          </button>
        </div>
      </div>
    );
  }

  // ── START screen ─────────────────────────────────────────────────────────────

  if (phase === "start") {
    return (
      <div className="rounded-[24px] border border-slate-100 bg-white p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] md:p-8">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-[0_8px_20px_-6px_rgba(249,115,22,0.4)]">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-600">
              Kiểm tra kiến thức
            </p>
            <h3 className="text-sm font-extrabold text-slate-800">{quiz.title}</h3>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {quiz.description && (
            <p className="text-xs leading-5 text-slate-500 font-medium">
              {quiz.description}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <StatPill label="Số câu hỏi" value={`${quiz.questionCount} câu`} />
            <StatPill
              label="Thời gian"
              value={
                quiz.durationSeconds
                  ? `${Math.round(quiz.durationSeconds / 60)} phút`
                  : "Không giới hạn"
              }
            />
          </div>

          <div className="rounded-xl border border-orange-100/60 bg-orange-50/40 p-3.5 text-[11px] leading-5 text-slate-500 font-medium">
            💡 Trả lời lần lượt từng câu, chọn một đáp án đúng nhất cho mỗi
            câu hỏi. Bạn cần đạt{" "}
            <strong className="text-orange-600">≥ {quiz.passingScore}%</strong> để pass.
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-xs font-bold text-slate-500 transition hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50"
              title="Tạo bộ câu hỏi mới bằng AI"
            >
              {isGenerating ? (
                <LoaderCircle size={13} className="animate-spin" />
              ) : (
                <WandSparkles size={13} />
              )}
              Tạo mới
            </button>
            <button
              type="button"
              onClick={() => setPhase("active")}
              disabled={totalQuestions === 0}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-orange-500/20 transition hover:from-orange-600 hover:to-amber-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles size={15} /> Bắt đầu Quiz
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
        <div className="flex items-center justify-center gap-3 rounded-[24px] border border-slate-100 bg-white p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)]">
          <LoaderCircle size={20} className="animate-spin text-orange-500" />
          <p className="text-sm font-semibold text-slate-400">Đang tải câu hỏi...</p>
        </div>
      );
    }

    return (
      <div className="space-y-5 rounded-[24px] border border-slate-100 bg-white p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-600">
              Câu hỏi
            </p>
            <p className="mt-0.5 text-xs font-extrabold text-slate-600">
              {safeIndex + 1} / {totalQuestions}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-[10px] font-bold text-orange-600">
            <Sparkles size={11} /> AI Quiz
          </span>
        </div>

        {/* Animated progress bar */}
        <div className="w-full overflow-hidden rounded-full bg-slate-100" style={{ height: 6 }}>
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Question text */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
          <p className="text-sm font-bold leading-6 text-slate-800">
            {currentQuestion.question}
          </p>
        </div>

        {/* Single-choice options */}
        <div className="space-y-2.5">
          {currentOptions.length > 0 ? (
            currentOptions.map((opt) => {
              const isSelected = selectedOptionId === opt.optionId;
              return (
                <button
                  key={opt.optionId}
                  type="button"
                  onClick={() => handleSelectOption(opt.optionId)}
                  className={`group w-full rounded-xl border px-4 py-3.5 text-left text-sm font-semibold transition-all duration-150 active:scale-[0.99] ${
                    isSelected
                      ? "border-orange-300 bg-orange-50 text-orange-800 shadow-sm shadow-orange-500/10"
                      : "border-slate-200 bg-white text-slate-700 hover:border-orange-200 hover:bg-orange-50/40"
                  }`}
                >
                  <span className="inline-flex items-center gap-3">
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                        isSelected
                          ? "border-orange-500 bg-orange-500"
                          : "border-slate-300 bg-white group-hover:border-orange-300"
                      }`}
                      aria-hidden="true"
                    >
                      {isSelected && (
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </span>
                    {opt.text}
                  </span>
                </button>
              );
            })
          ) : (
            <p className="py-2 text-xs italic text-slate-400">Đang tải đáp án...</p>
          )}
        </div>

        {/* Submit error banner */}
        {error && (
          <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}

        {/* Navigation CTA */}
        <div className="flex justify-end pt-1">
          {isLastQuestion ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!selectedOptionId || isSubmitting}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/20 transition hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <LoaderCircle size={14} className="animate-spin" />
              ) : (
                <CheckCircle2 size={14} />
              )}
              {isSubmitting ? "Đang nộp..." : "Nộp bài"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              disabled={!selectedOptionId}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-orange-500/20 transition hover:from-orange-600 hover:to-amber-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Câu tiếp theo <ChevronRight size={14} />
            </button>
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
      <div className="space-y-5 rounded-[24px] border border-slate-100 bg-white p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] md:p-8">
        {/* Hero score card */}
        <div
          className={`rounded-2xl border p-6 text-center ${
            passed
              ? "border-emerald-100 bg-gradient-to-br from-emerald-50/60 to-teal-50/20"
              : "border-rose-100 bg-gradient-to-br from-rose-50/60 to-orange-50/20"
          }`}
        >
          <div
            className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl ${
              passed ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-500"
            }`}
          >
            {passed ? <Trophy size={24} /> : <XCircle size={24} />}
          </div>
          <p
            className={`text-[10px] font-black uppercase tracking-[0.2em] ${
              passed ? "text-emerald-600" : "text-rose-500"
            }`}
          >
            {passed ? "Xuất sắc! Đã pass" : "Chưa đạt yêu cầu"}
          </p>
          <p className="mt-2 text-4xl font-black tracking-tight text-slate-900">
            {score}%
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Đúng {result.correctAnswers}/{result.totalQuestions} câu
          </p>

          <div
            className="mt-4 w-full overflow-hidden rounded-full bg-slate-100"
            style={{ height: 8 }}
          >
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                passed
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                  : "bg-gradient-to-r from-rose-400 to-orange-400"
              }`}
              style={{ width: `${score}%` }}
            />
          </div>
          <p className="mt-1.5 text-[10px] font-semibold text-slate-400">
            Ngưỡng pass: {quiz?.passingScore ?? "—"}%
          </p>

          {result.feedback && (
            <p className="mt-3 text-[11px] leading-5 text-slate-500 font-medium italic">
              {result.feedback}
            </p>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
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
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 active:scale-[0.98]"
          >
            <RotateCcw size={14} /> Làm lại
          </button>
          <button
            type="button"
            onClick={() => onCompleteSession?.(result)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/20 transition hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98]"
          >
            <CheckCircle2 size={14} /> Hoàn thành
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// ── Sub-components ──────────────────────────────────────────────────────────────

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-extrabold text-slate-800">{value}</p>
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
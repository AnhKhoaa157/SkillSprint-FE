import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Circle,
  History,
  LoaderCircle,
  RotateCcw,
  Send,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { marketplaceService } from "../../../api/marketplace";
import type {
  MarketplaceChapterProgress,
  MarketplacePracticeAttempt,
  MarketplacePracticeAttemptHistory,
  MarketplacePracticeAttemptResult,
  MarketplaceReviewContext,
  MarketplaceReviewUpsertRequest,
  MarketplaceVersionProgress,
  PurchasedMarketplacePack,
} from "../../../api/marketplace";
import { MarketplaceReviewEditor } from "../../components/marketplace/MarketplaceReviews";
import RankedQuizExperience from "./RankedQuizExperience";

type LearningMode = "practice" | "ranked";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" });

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Đã có lỗi xảy ra. Vui lòng thử lại.";
}

function formatScore(value: number | null) {
  return value == null ? "—" : `${Math.round(value)} điểm`;
}

interface PracticeChapterCardProps {
  chapter: MarketplaceChapterProgress;
  isNext: boolean;
  isBusy: boolean;
  isDisabled: boolean;
  onStart: (chapterSequenceNo: number) => void;
}

function PracticeChapterCard({ chapter, isNext, isBusy, isDisabled, onStart }: PracticeChapterCardProps) {
  const statusLabel = chapter.completed ? "Đã hoàn thành" : isNext ? "Học tiếp theo" : "Sẵn sàng";
  const helperText = chapter.completed
    ? "Bạn đã ghi nhận tiến độ. Có thể luyện lại để cải thiện điểm số."
    : isNext
      ? "Chương được đề xuất để tiếp tục hành trình học của bạn."
      : "Luyện bất cứ lúc nào, không giới hạn số lượt làm.";

  return <article
    aria-busy={isBusy}
    className={`group relative flex min-h-[17rem] flex-col overflow-hidden rounded-[1.75rem] border p-5 transition duration-200 motion-reduce:transition-none sm:p-6 ${
      chapter.completed
        ? "border-emerald-200 bg-[linear-gradient(145deg,#FFFFFF_0%,#F0FDF4_100%)] shadow-[0_12px_30px_rgba(5,150,105,0.07)]"
        : isNext
          ? "border-orange-300 bg-[radial-gradient(circle_at_88%_8%,rgba(251,191,36,0.2),transparent_28%),linear-gradient(145deg,#FFFFFF_0%,#FFF7ED_100%)] shadow-[0_18px_44px_rgba(234,88,12,0.13)] xl:col-span-2"
          : "border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.05)] hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)] motion-reduce:hover:translate-y-0"
    }`}
  >
    {isNext && <div aria-hidden="true" className="absolute right-0 top-0 h-24 w-24 rounded-bl-[4rem] bg-gradient-to-bl from-orange-100/90 to-transparent" />}

    <div className="relative flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border text-sm font-black ${
          chapter.completed
            ? "border-emerald-200 bg-emerald-100 text-emerald-700"
            : isNext
              ? "border-orange-200 bg-[#FF6B00] text-white shadow-[0_8px_18px_rgba(255,107,0,0.2)]"
              : "border-orange-100 bg-orange-50 text-[#C2410C]"
        }`}>{chapter.completed ? <CheckCircle2 className="h-5 w-5" /> : chapter.chapterSequenceNo}</span>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Chương {String(chapter.chapterSequenceNo).padStart(2, "0")}</p>
          <p className="mt-1 truncate text-xs font-bold text-slate-500">Practice Quiz</p>
        </div>
      </div>
      <span className={`relative shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wide ${
        chapter.completed
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : isNext
            ? "border-orange-200 bg-orange-50 text-[#C2410C]"
            : "border-slate-200 bg-slate-50 text-slate-500"
      }`}>{statusLabel}</span>
    </div>

    <div className={`relative flex flex-1 flex-col ${isNext ? "xl:grid xl:grid-cols-[minmax(0,1fr)_17rem] xl:gap-7" : ""}`}>
      <div className="flex flex-col">
        <h3 className="mt-5 text-lg font-black leading-7 tracking-[-0.02em] text-slate-950">{chapter.chapterTitle}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">{helperText}</p>
      </div>

      <div className={`mt-auto pt-5 ${isNext ? "xl:mt-5 xl:rounded-2xl xl:border xl:border-orange-100 xl:bg-white/80 xl:p-4 xl:pt-4" : ""}`}>
        <dl className={`grid grid-cols-2 gap-3 text-xs ${isNext ? "border-t border-slate-200/80 pt-4 xl:border-t-0 xl:pt-0" : "border-t border-slate-200/80 pt-4"}`}>
          <div>
            <dt className="flex items-center gap-1.5 text-slate-500"><Target className="h-3.5 w-3.5" />Điểm tốt nhất</dt>
            <dd className="mt-1.5 text-sm font-black text-slate-900">{formatScore(chapter.bestScore)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Số lần làm</dt>
            <dd className="mt-1.5 text-sm font-black text-slate-900">{chapter.attemptCount}</dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={() => onStart(chapter.chapterSequenceNo)}
          disabled={isDisabled}
          className={`mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none ${
            chapter.completed
              ? "border border-emerald-200 bg-white text-emerald-800 hover:border-emerald-300 hover:bg-emerald-50"
              : "bg-[#FF6B00] text-white shadow-[0_10px_20px_rgba(255,107,0,0.18)] hover:bg-[#E85F00]"
          }`}
        >
          {isBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : chapter.completed ? <RotateCcw className="h-4 w-4" /> : isNext ? <ArrowRight className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          {isBusy ? "Đang mở..." : chapter.completed ? "Luyện lại" : "Bắt đầu"}
        </button>
      </div>
    </div>
  </article>;
}

function LearningSkeleton() {
  return <div className="mx-auto max-w-6xl space-y-5">
    <div className="h-48 animate-pulse rounded-[2rem] bg-slate-200" />
    <div className="grid gap-5 lg:grid-cols-3">
      {[1, 2, 3].map(item => <div key={item} className="h-52 animate-pulse rounded-[1.5rem] bg-slate-200" />)}
    </div>
  </div>;
}

export default function MarketplaceLearningHub() {
  const { itemId = "" } = useParams<{ itemId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedVersionId = searchParams.get("versionId");
  const mode: LearningMode = searchParams.get("mode") === "ranked" ? "ranked" : "practice";
  const [pack, setPack] = useState<PurchasedMarketplacePack | null>(null);
  const [progress, setProgress] = useState<MarketplaceVersionProgress | null>(null);
  const [history, setHistory] = useState<MarketplacePracticeAttemptHistory[]>([]);
  const [attempt, setAttempt] = useState<MarketplacePracticeAttempt | null>(null);
  const [result, setResult] = useState<MarketplacePracticeAttemptResult | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [startingChapter, setStartingChapter] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [reviewContext, setReviewContext] = useState<MarketplaceReviewContext | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSaving, setReviewSaving] = useState(false);
  const submitKey = useRef<string | null>(null);
  const reviewRequestId = useRef(0);
  const activeVersionId = useRef<string | null>(requestedVersionId);
  const loadRequestId = useRef(0);

  const loadLearningData = useCallback(async (versionId: string) => {
    const [nextProgress, nextHistory] = await Promise.all([
      marketplaceService.getVersionProgress(versionId),
      marketplaceService.getPracticeAttemptHistory(versionId),
    ]);
    if (activeVersionId.current !== versionId) return;
    setProgress(nextProgress);
    setHistory(nextHistory);
  }, []);

  const loadReviewContext = useCallback(async (versionId: string) => {
    const requestId = ++reviewRequestId.current;
    setReviewLoading(true);
    setReviewError(null);
    try {
      const nextContext = await marketplaceService.getVersionReviewContext(versionId);
      if (requestId === reviewRequestId.current && activeVersionId.current === versionId) setReviewContext(nextContext);
    } catch (error) {
      if (requestId === reviewRequestId.current && activeVersionId.current === versionId) {
        setReviewContext(null);
        setReviewError(errorMessage(error));
      }
    } finally {
      if (requestId === reviewRequestId.current && activeVersionId.current === versionId) setReviewLoading(false);
    }
  }, []);

  const load = useCallback(async () => {
    const requestId = ++loadRequestId.current;
    activeVersionId.current = requestedVersionId;
    reviewRequestId.current += 1;
    setLoading(true);
    setFailed(false);
    setReviewContext(null);
    setReviewError(null);
    setReviewSaving(false);
    try {
      const ownedPacks = await marketplaceService.getMyPacks();
      const nextPack = requestedVersionId
        ? ownedPacks.find(candidate => candidate.versionId === requestedVersionId)
        : ownedPacks.find(candidate => candidate.itemId === itemId);
      if (requestId !== loadRequestId.current) return;
      if (!nextPack?.versionId) throw new Error("Không tìm thấy phiên bản Quiz Pack bạn đang sở hữu.");
      activeVersionId.current = nextPack.versionId;
      setPack(nextPack);
      void loadReviewContext(nextPack.versionId);
      await loadLearningData(nextPack.versionId);
    } catch (error) {
      if (requestId !== loadRequestId.current) return;
      setFailed(true);
      toast.error(errorMessage(error));
    } finally {
      if (requestId === loadRequestId.current) setLoading(false);
    }
  }, [itemId, loadLearningData, loadReviewContext, requestedVersionId]);

  useEffect(() => { void load(); }, [load]);

  const selectMode = (nextMode: LearningMode) => {
    const next = new URLSearchParams(searchParams);
    if (nextMode === "practice") next.delete("mode");
    else next.set("mode", nextMode);
    setSearchParams(next, { replace: true });
  };

  const startPractice = async (chapterSequenceNo: number) => {
    if (!pack?.versionId) return;
    setStartingChapter(chapterSequenceNo);
    try {
      const nextAttempt = await marketplaceService.startOrResumePracticeAttempt(pack.versionId, chapterSequenceNo);
      setAttempt(nextAttempt);
      setAnswers({});
      setResult(null);
      submitKey.current = null;
      toast.success("Đã mở bài luyện tập.");
      window.requestAnimationFrame(() => document.getElementById("practice-attempt")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setStartingChapter(null);
    }
  };

  const submitPractice = async () => {
    if (!attempt || !pack?.versionId) return;
    const idempotencyKey = submitKey.current ?? crypto.randomUUID();
    submitKey.current = idempotencyKey;
    setSubmitting(true);
    try {
      const nextResult = await marketplaceService.submitPracticeAttempt(pack.versionId, attempt.attemptId, {
        idempotencyKey,
        answers: attempt.questions.map(question => ({
          questionId: question.questionId,
          optionId: answers[question.questionId],
        })),
      });
      setResult(nextResult);
      setAttempt(null);
      setConfirmSubmit(false);
      setAnswers({});
      submitKey.current = null;
      await Promise.all([loadLearningData(pack.versionId), loadReviewContext(pack.versionId)]);
      toast.success("Đã hoàn thành bài luyện tập.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const saveReview = async (request: MarketplaceReviewUpsertRequest) => {
    if (!pack?.versionId) return;
    const versionId = pack.versionId;
    setReviewSaving(true);
    try {
      await marketplaceService.upsertVersionReview(versionId, request);
      if (activeVersionId.current !== versionId) return;
      toast.success(reviewContext?.currentUserReview ? "Đã cập nhật đánh giá." : "Đã gửi đánh giá.");
      await loadReviewContext(versionId);
    } catch (error) {
      if (activeVersionId.current !== versionId) return;
      toast.error(errorMessage(error));
      await loadReviewContext(versionId);
    } finally {
      if (activeVersionId.current === versionId) setReviewSaving(false);
    }
  };

  const allAnswered = attempt?.questions.every(question => Boolean(answers[question.questionId])) ?? false;
  const completedPercent = Math.min(100, Math.max(0, progress?.completionPercent ?? 0));
  const nextChapterSequenceNo = progress?.chapters.find(chapter => !chapter.completed)?.chapterSequenceNo ?? null;

  if (loading) return <LearningSkeleton />;
  if (failed || !pack?.versionId || !progress) return <section className="mx-auto max-w-3xl rounded-[2rem] border border-rose-200 bg-rose-50 p-8 text-center">
    <AlertTriangle className="mx-auto h-9 w-9 text-rose-600" />
    <h1 className="mt-4 text-xl font-black text-rose-950">Không thể tải không gian học tập</h1>
    <p className="mt-2 text-sm text-rose-800">Kiểm tra kết nối hoặc quyền sở hữu Quiz Pack rồi thử lại.</p>
    <button type="button" onClick={() => void load()} className="mt-5 min-h-11 rounded-xl bg-rose-600 px-5 text-sm font-bold text-white">Thử lại</button>
  </section>;

  return <div className="mx-auto max-w-6xl">
    <Link to="/my-packs" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-[#FF6B00] transition hover:text-[#C2410C]"><ArrowLeft className="h-4 w-4" />Gói của tôi</Link>

    <section className="relative mt-3 overflow-hidden rounded-[2rem] border border-orange-100 bg-[radial-gradient(circle_at_86%_8%,rgba(255,187,118,0.32),transparent_26%),linear-gradient(125deg,#FFF8F1_0%,#FFFFFF_64%,#FFF1E2_100%)] p-6 shadow-[0_16px_44px_rgba(194,65,12,0.08)] sm:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full border-[22px] border-orange-200/45" />
      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
        <div>
          <span className="inline-flex rounded-xl border border-orange-100 bg-white/85 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#FF6B00]">Phiên bản {progress.versionNo} · Learning Hub</span>
          <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">{pack.title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Luyện tập theo từng chương hoặc thử sức với Quiz xếp hạng của đúng phiên bản bạn sở hữu.</p>
        </div>
        <div className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm backdrop-blur">
          <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-bold text-slate-500">Tiến độ Practice</p><p className="mt-1 text-2xl font-black text-slate-950">{completedPercent.toFixed(0)}%</p></div><p className="text-right text-xs font-bold text-[#C2410C]">{progress.completedChapterCount}/{progress.totalChapterCount} chương</p></div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-orange-100"><div className="h-full rounded-full bg-gradient-to-r from-[#FF6B00] to-amber-400 transition-[width] duration-500" style={{ width: `${completedPercent}%` }} /></div>
          <p className={`mt-3 inline-flex items-center gap-1.5 text-xs font-bold ${progress.reviewEligible ? "text-emerald-700" : "text-slate-500"}`}>{progress.reviewEligible ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}{progress.reviewEligible ? "Đã đủ điều kiện đánh giá Pack" : "Hoàn thành một Quiz để mở đánh giá"}</p>
        </div>
      </div>
    </section>

    <div className="mt-6 grid grid-cols-2 rounded-2xl border border-slate-200 bg-slate-100 p-1.5" role="tablist" aria-label="Chế độ học Quiz Pack">
      <button type="button" role="tab" aria-selected={mode === "practice"} onClick={() => selectMode("practice")} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black transition ${mode === "practice" ? "bg-white text-[#C2410C] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}><BookOpenCheck className="h-4 w-4" />Practice</button>
      <button type="button" role="tab" aria-selected={mode === "ranked"} onClick={() => selectMode("ranked")} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black transition ${mode === "ranked" ? "bg-white text-[#C2410C] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}><Trophy className="h-4 w-4" />Ranked</button>
    </div>

    {mode === "ranked" ? <div className="mt-6"><RankedQuizExperience embedded onCompleted={() => pack.versionId ? loadReviewContext(pack.versionId) : undefined} /></div> : <div className="mt-6 space-y-6">
      {result && <section className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50/80 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4"><div className="flex gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-white"><CheckCircle2 className="h-5 w-5" /></span><div><p className="font-black text-emerald-950">Đã hoàn thành chương {result.chapterSequenceNo}</p><p className="mt-1 text-sm text-emerald-800">{result.correctCount}/{result.questionCount} câu đúng · {Math.round(result.score)} điểm</p></div></div><button type="button" onClick={() => { setResult(null); void startPractice(result.chapterSequenceNo); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 text-sm font-bold text-emerald-800"><RotateCcw className="h-4 w-4" />Luyện lại</button></div>
      </section>}

      <section aria-labelledby="practice-chapters-title" className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50/65 p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#FF6B00]">Practice Quiz</p>
            <h2 id="practice-chapters-title" className="mt-1 text-2xl font-black tracking-[-0.03em] text-slate-950">Luyện tập theo chương</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Chọn chương bạn muốn ôn tập. Kết quả tốt nhất được lưu lại, còn tiến độ mỗi chương chỉ được ghi nhận một lần.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex min-h-8 items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700">{progress.completedChapterCount}/{progress.totalChapterCount} chương hoàn thành</span>
              <span className="inline-flex min-h-8 items-center rounded-full border border-orange-200 bg-orange-50 px-3 text-xs font-bold text-[#C2410C]">Không giới hạn lượt luyện</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void Promise.all([loadLearningData(progress.versionId), loadReviewContext(progress.versionId)])}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-orange-200 bg-white px-4 text-sm font-bold text-[#C2410C] transition hover:border-orange-300 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 motion-reduce:transition-none"
          ><RotateCcw className="h-4 w-4" />Làm mới</button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {progress.chapters.map(chapter => <PracticeChapterCard
            key={chapter.chapterSequenceNo}
            chapter={chapter}
            isNext={chapter.chapterSequenceNo === nextChapterSequenceNo}
            isBusy={startingChapter === chapter.chapterSequenceNo}
            isDisabled={startingChapter !== null || submitting}
            onStart={chapterSequenceNo => void startPractice(chapterSequenceNo)}
          />)}
        </div>
      </section>

      {attempt && <section id="practice-attempt" className="scroll-mt-24 rounded-[1.75rem] border border-orange-200 bg-white p-5 shadow-[0_16px_40px_rgba(194,65,12,0.08)] sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#FF6B00]">Chương {attempt.chapterSequenceNo} · Practice</p><h2 className="mt-1 text-2xl font-black text-slate-950">{attempt.quizTitle || attempt.chapterTitle}</h2><p className="mt-2 text-sm text-slate-500">{attempt.questionCount} câu hỏi · có thể làm lại không giới hạn</p></div><span className="rounded-xl bg-orange-50 px-3 py-2 text-xs font-black text-[#C2410C]">{Object.keys(answers).length}/{attempt.questions.length} đã trả lời</span></div>
        <div className="mt-6 space-y-4">{attempt.questions.map((question, index) => <article key={question.questionId} className="rounded-2xl border border-slate-200 bg-slate-50/45 p-4 sm:p-5">
          <p className="text-xs font-black uppercase tracking-[0.13em] text-[#FF6B00]">Câu {index + 1}</p><h3 className="mt-2 text-base font-black leading-6 text-slate-950">{question.text}</h3>
          <div className="mt-4 grid gap-2">{question.options.map(option => { const selected = answers[question.questionId] === option.optionId; return <button key={option.optionId} type="button" aria-pressed={selected} onClick={() => setAnswers(current => ({ ...current, [question.questionId]: option.optionId }))} className={`flex min-h-12 items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${selected ? "border-[#FF6B00] bg-orange-50 text-slate-950" : "border-slate-200 bg-white text-slate-700 hover:border-orange-200 hover:bg-orange-50/40"}`}><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-black ${selected ? "border-[#FF6B00] bg-[#FF6B00] text-white" : "border-slate-300 text-slate-500"}`}>{option.label}</span>{option.text}</button>; })}</div>
        </article>)}</div>
        <button type="button" onClick={() => setConfirmSubmit(true)} disabled={!allAnswered || submitting} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6B00] px-5 text-sm font-black text-white shadow-[0_10px_20px_rgba(255,107,0,0.2)] transition hover:-translate-y-0.5 hover:bg-[#E85F00] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"><Send className="h-4 w-4" />Nộp Practice ({Object.keys(answers).length}/{attempt.questions.length})</button>
      </section>}

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.05)] sm:p-6">
        <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600"><History className="h-5 w-5" /></span><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#FF6B00]">Lịch sử Practice</p><h2 className="mt-1 text-xl font-black text-slate-950">Các lượt gần đây</h2></div></div>
        <div className="mt-5 space-y-3">{history.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-7 text-center text-sm text-slate-500">Bạn chưa có lượt Practice nào ở phiên bản này.</p> : history.map(entry => <article key={entry.attemptId} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4"><div><p className="font-bold text-slate-900">Chương {entry.chapterSequenceNo} · {entry.status === "COMPLETED" ? "Đã hoàn thành" : entry.status === "IN_PROGRESS" ? "Đang làm" : "Đã bỏ"}</p><p className="mt-1 text-xs text-slate-500">{dateFormatter.format(new Date(entry.startedAt))}</p></div><div className="text-right"><p className="font-black text-slate-950">{formatScore(entry.score)}</p><p className="mt-1 text-xs text-slate-500">{entry.correctCount == null ? "Chưa chấm" : `${entry.correctCount}/${entry.questionCount} câu đúng`}</p></div></article>)}</div>
      </section>
    </div>}

    <div className="mt-6">
      <MarketplaceReviewEditor
        context={reviewContext}
        loading={reviewLoading}
        error={reviewError}
        saving={reviewSaving}
        onRetry={() => { if (pack.versionId) void loadReviewContext(pack.versionId); }}
        onSave={saveReview}
      />
    </div>

    {confirmSubmit && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4" role="dialog" aria-modal="true" aria-labelledby="practice-submit-title">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><h2 id="practice-submit-title" className="text-xl font-black text-slate-950">Xác nhận nộp Practice</h2><p className="mt-2 text-sm leading-6 text-slate-600">Hệ thống sẽ chấm đáp án trên máy chủ và cập nhật tiến độ của chương này.</p><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setConfirmSubmit(false)} disabled={submitting} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700">Hủy</button><button type="button" onClick={() => void submitPractice()} disabled={submitting} className="inline-flex min-h-11 min-w-32 items-center justify-center gap-2 rounded-xl bg-[#FF6B00] px-4 text-sm font-bold text-white disabled:opacity-60">{submitting && <LoaderCircle className="h-4 w-4 animate-spin" />}{submitting ? "Đang nộp..." : "Nộp bài"}</button></div></div>
    </div>}
  </div>;
}

import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  Circle,
  History,
  LoaderCircle,
  RotateCcw,
  Send,
  Sparkles,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { marketplaceService } from "../../../api/marketplace";
import type {
  MarketplacePracticeAttempt,
  MarketplacePracticeAttemptHistory,
  MarketplacePracticeAttemptResult,
  MarketplaceVersionProgress,
  PurchasedMarketplacePack,
} from "../../../api/marketplace";
import RankedQuizExperience from "./RankedQuizExperience";

type LearningMode = "practice" | "ranked";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" });

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Đã có lỗi xảy ra. Vui lòng thử lại.";
}

function formatScore(value: number | null) {
  return value == null ? "—" : `${Math.round(value)} điểm`;
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
  const submitKey = useRef<string | null>(null);

  const loadLearningData = useCallback(async (versionId: string) => {
    const [nextProgress, nextHistory] = await Promise.all([
      marketplaceService.getVersionProgress(versionId),
      marketplaceService.getPracticeAttemptHistory(versionId),
    ]);
    setProgress(nextProgress);
    setHistory(nextHistory);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const ownedPacks = await marketplaceService.getMyPacks();
      const nextPack = requestedVersionId
        ? ownedPacks.find(candidate => candidate.versionId === requestedVersionId)
        : ownedPacks.find(candidate => candidate.itemId === itemId);
      if (!nextPack?.versionId) throw new Error("Không tìm thấy phiên bản Quiz Pack bạn đang sở hữu.");
      setPack(nextPack);
      await loadLearningData(nextPack.versionId);
    } catch (error) {
      setFailed(true);
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [itemId, loadLearningData, requestedVersionId]);

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
      await loadLearningData(pack.versionId);
      toast.success("Đã hoàn thành bài luyện tập.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const allAnswered = attempt?.questions.every(question => Boolean(answers[question.questionId])) ?? false;
  const completedPercent = Math.min(100, Math.max(0, progress?.completionPercent ?? 0));

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

    {mode === "ranked" ? <div className="mt-6"><RankedQuizExperience embedded /></div> : <div className="mt-6 space-y-6">
      {result && <section className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50/80 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4"><div className="flex gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-white"><CheckCircle2 className="h-5 w-5" /></span><div><p className="font-black text-emerald-950">Đã hoàn thành chương {result.chapterSequenceNo}</p><p className="mt-1 text-sm text-emerald-800">{result.correctCount}/{result.questionCount} câu đúng · {Math.round(result.score)} điểm</p></div></div><button type="button" onClick={() => { setResult(null); void startPractice(result.chapterSequenceNo); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 text-sm font-bold text-emerald-800"><RotateCcw className="h-4 w-4" />Luyện lại</button></div>
      </section>}

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#FF6B00]">Practice Quiz</p><h2 className="mt-1 text-2xl font-black tracking-[-0.03em] text-slate-950">Luyện tập theo chương</h2><p className="mt-2 text-sm leading-6 text-slate-500">Không giới hạn số lần làm. Mỗi chương hoàn thành chỉ được tính một lần vào tiến độ.</p></div><button type="button" onClick={() => void loadLearningData(progress.versionId)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-orange-200 bg-white px-4 text-sm font-bold text-[#C2410C]"><RotateCcw className="h-4 w-4" />Làm mới</button></div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {progress.chapters.map(chapter => <article key={chapter.chapterSequenceNo} className={`rounded-[1.5rem] border bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)] ${chapter.completed ? "border-emerald-200" : "border-slate-200"}`}>
            <div className="flex items-start justify-between gap-3"><span className={`grid h-10 w-10 place-items-center rounded-xl text-sm font-black ${chapter.completed ? "bg-emerald-100 text-emerald-700" : "bg-orange-50 text-[#C2410C]"}`}>{chapter.completed ? <CheckCircle2 className="h-5 w-5" /> : chapter.chapterSequenceNo}</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${chapter.completed ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{chapter.completed ? "Đã xong" : "Chưa học"}</span></div>
            <h3 className="mt-4 line-clamp-2 min-h-12 text-base font-black leading-6 text-slate-950">{chapter.chapterTitle}</h3>
            <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-xs"><div><dt className="text-slate-500">Điểm tốt nhất</dt><dd className="mt-1 font-black text-slate-900">{formatScore(chapter.bestScore)}</dd></div><div><dt className="text-slate-500">Số lần làm</dt><dd className="mt-1 font-black text-slate-900">{chapter.attemptCount}</dd></div></dl>
            <button type="button" onClick={() => void startPractice(chapter.chapterSequenceNo)} disabled={startingChapter !== null || submitting} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B00] px-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#E85F00] disabled:cursor-not-allowed disabled:opacity-60">{startingChapter === chapter.chapterSequenceNo ? <LoaderCircle className="h-4 w-4 animate-spin" /> : chapter.completed ? <RotateCcw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}{startingChapter === chapter.chapterSequenceNo ? "Đang mở..." : chapter.completed ? "Luyện lại" : "Bắt đầu"}</button>
          </article>)}
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

    {confirmSubmit && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4" role="dialog" aria-modal="true" aria-labelledby="practice-submit-title">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><h2 id="practice-submit-title" className="text-xl font-black text-slate-950">Xác nhận nộp Practice</h2><p className="mt-2 text-sm leading-6 text-slate-600">Hệ thống sẽ chấm đáp án trên máy chủ và cập nhật tiến độ của chương này.</p><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setConfirmSubmit(false)} disabled={submitting} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700">Hủy</button><button type="button" onClick={() => void submitPractice()} disabled={submitting} className="inline-flex min-h-11 min-w-32 items-center justify-center gap-2 rounded-xl bg-[#FF6B00] px-4 text-sm font-bold text-white disabled:opacity-60">{submitting && <LoaderCircle className="h-4 w-4 animate-spin" />}{submitting ? "Đang nộp..." : "Nộp bài"}</button></div></div>
    </div>}
  </div>;
}

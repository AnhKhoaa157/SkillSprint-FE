import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock3, FileQuestion, LoaderCircle, Send, Trophy } from "lucide-react";
import { toast } from "sonner";
import { marketplaceService } from "../../../api/marketplace";
import type {
  MarketplaceRankedAttempt,
  MarketplaceRankedAttemptHistory,
  MarketplaceRankedAttemptResult,
  PurchasedMarketplacePack,
} from "../../../api/marketplace";
import MarketplaceLeaderboardCard from "../../components/marketplace/MarketplaceLeaderboardCard";
import { MarketplaceReportButton } from "../../components/marketplace/MarketplaceReportDialog";
import { refreshMarketplaceLeaderboard } from "../../../api/marketplace/useMarketplaceLeaderboard";

const RANKED_TIMER_NOTE = "Mở hộp thoại báo cáo không làm dừng đồng hồ đếm ngược của lượt làm bài.";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" });

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Đã có lỗi xảy ra. Vui lòng thử lại.";
}

function formatDuration(seconds: number | null) {
  if (seconds == null) return "—";
  if (seconds < 60) return `${seconds} giây`;
  return `${Math.floor(seconds / 60)} phút ${String(seconds % 60).padStart(2, "0")} giây`;
}

function Countdown({ expiresAt, onExpire }: { expiresAt: string; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, new Date(expiresAt).getTime() - Date.now()));
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const next = Math.max(0, new Date(expiresAt).getTime() - Date.now());
      setRemaining(next);
      if (next === 0) {
        window.clearInterval(intervalId);
        onExpire();
      }
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [expiresAt, onExpire]);
  return <span className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-black tabular-nums text-amber-900"><Clock3 className="h-4 w-4" />{String(Math.floor(remaining / 60000)).padStart(2, "0")}:{String(Math.floor(remaining / 1000) % 60).padStart(2, "0")}</span>;
}

function AttemptHistory({ attempts, loading }: { attempts: MarketplaceRankedAttemptHistory[]; loading: boolean }) {
  return <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.05)] sm:p-6">
    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#FF6B00]">Lịch sử của bạn</p><h2 className="mt-1 text-xl font-black text-slate-950">Các lượt Quiz gần đây</h2>
    <div className="mt-5 space-y-3">
      {loading ? [1, 2, 3].map(item => <div key={item} className="h-16 animate-pulse rounded-2xl bg-slate-100" />) : attempts.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-7 text-center text-sm leading-6 text-slate-500">Bạn chưa có lượt Quiz xếp hạng nào cho phiên bản này.</p> : attempts.map(attempt => <article key={attempt.attemptId} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4"><div><p className="font-bold text-slate-900">Lượt #{attempt.attemptNumber} · {attempt.status === "COMPLETED" ? "Đã hoàn thành" : attempt.status === "IN_PROGRESS" ? "Đang làm" : "Đã hết hạn"}</p><p className="mt-1 text-xs text-slate-500">{dateFormatter.format(new Date(attempt.startedAt))}</p></div><div className="flex gap-5 text-right text-sm"><span><b className="block text-slate-950">{attempt.score ?? "—"}</b><small className="text-slate-500">điểm</small></span><span><b className="block text-slate-950">{attempt.correctCount == null ? "—" : `${attempt.correctCount}/${attempt.questionCount}`}</b><small className="text-slate-500">đúng</small></span><span><b className="block text-slate-950">{formatDuration(attempt.durationSeconds)}</b><small className="text-slate-500">thời gian</small></span></div></article>)}
    </div>
  </section>;
}

interface RankedQuizExperienceProps {
  embedded?: boolean;
  onCompleted?: () => void | Promise<void>;
}

export default function RankedQuizExperience({ embedded = false, onCompleted }: RankedQuizExperienceProps) {
  const { itemId = "" } = useParams<{ itemId: string }>();
  const [searchParams] = useSearchParams();
  const requestedVersionId = searchParams.get("versionId");
  const [ownedPack, setOwnedPack] = useState<PurchasedMarketplacePack | null>(null);
  const [attempt, setAttempt] = useState<MarketplaceRankedAttempt | null>(null);
  const [attempts, setAttempts] = useState<MarketplaceRankedAttemptHistory[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<MarketplaceRankedAttemptResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expired, setExpired] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const submitKey = useRef<string | null>(null);
  const versionId = ownedPack?.versionId ?? null;

  const loadHistory = useCallback(async (nextVersionId: string) => {
    setHistoryLoading(true);
    try { setAttempts(await marketplaceService.getRankedAttemptHistory(nextVersionId)); }
    catch { setAttempts([]); }
    finally { setHistoryLoading(false); }
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setFailed(false);
    try {
      const ownedPacks = await marketplaceService.getMyPacks();
      const nextOwnedPack = requestedVersionId
        ? ownedPacks.find(candidate => candidate.versionId === requestedVersionId)
        : ownedPacks.find(candidate => candidate.itemId === itemId);
      if (!nextOwnedPack?.versionId) throw new Error("Không tìm thấy phiên bản Quiz Pack bạn đang sở hữu.");
      setOwnedPack(nextOwnedPack);
      await loadHistory(nextOwnedPack.versionId);
    } catch (error) { setFailed(true); toast.error(errorMessage(error)); }
    finally { setLoading(false); }
  }, [itemId, loadHistory, requestedVersionId]);

  useEffect(() => { void load(); }, [load]);

  const start = async () => {
    if (!versionId) return;
    setStarting(true);
    try {
      const nextAttempt = await marketplaceService.startOrResumeRankedAttempt(versionId);
      setAttempt(nextAttempt); setAnswers({}); setResult(null); setExpired(false); submitKey.current = null;
      toast.success("Đã mở Quiz xếp hạng.");
    } catch (error) { toast.error(errorMessage(error)); }
    finally { setStarting(false); }
  };

  const submit = async () => {
    if (!attempt || !versionId) return;
    const idempotencyKey = submitKey.current ?? crypto.randomUUID();
    submitKey.current = idempotencyKey;
    setSubmitting(true);
    try {
      const nextResult = await marketplaceService.submitRankedAttempt(versionId, attempt.attemptId, {
        idempotencyKey,
        answers: attempt.questions.map(question => ({ questionId: question.questionId, optionId: answers[question.questionId] })),
      });
      setResult(nextResult); setAttempt(null); setConfirmSubmit(false);
      refreshMarketplaceLeaderboard(versionId, "version");
      await loadHistory(versionId);
      void Promise.resolve().then(() => onCompleted?.()).catch(() => undefined);
      toast.success("Đã nộp Quiz xếp hạng.");
    } catch (error) { toast.error(errorMessage(error)); }
    finally { setSubmitting(false); }
  };

  const allAnswered = attempt?.questions.every(question => Boolean(answers[question.questionId])) ?? false;
  const onExpire = useCallback(() => setExpired(true), []);
  const packVersionNo = ownedPack?.versionNo ?? 1;
  const canStart = !attempt || expired;

  if (loading) return <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]"><div className="h-80 animate-pulse rounded-[2rem] bg-slate-200" /><div className="h-80 animate-pulse rounded-[2rem] bg-slate-200" /></div>;
  if (failed || !ownedPack || !versionId) return <section className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8 text-center"><AlertTriangle className="mx-auto h-8 w-8 text-rose-600" /><h1 className="mt-4 text-xl font-black text-rose-950">Không thể mở Quiz Pack</h1><button type="button" onClick={() => void load()} className="mt-5 min-h-11 rounded-xl bg-rose-600 px-4 text-sm font-bold text-white">Thử lại</button></section>;

  return <div className="mx-auto max-w-6xl">
    {!embedded && <Link to="/my-packs" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-[#FF6B00] transition hover:text-[#C2410C]"><ArrowLeft className="h-4 w-4" />Gói của tôi</Link>}
    {!embedded && <section className="relative mt-3 overflow-hidden rounded-[2rem] border border-orange-100 bg-[radial-gradient(circle_at_84%_10%,rgba(255,187,118,0.3),transparent_25%),linear-gradient(125deg,#FFF8F1_0%,#FFFFFF_64%,#FFF1E2_100%)] p-6 shadow-[0_16px_44px_rgba(194,65,12,0.08)] sm:p-8"><div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full border-[22px] border-orange-200/45" /><div className="relative"><span className="inline-flex rounded-xl border border-orange-100 bg-white/85 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#FF6B00]">Phiên bản {packVersionNo} · Quiz xếp hạng</span><h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">{ownedPack.title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Bộ câu hỏi được xáo trộn riêng cho bạn. Đáp án đúng chỉ được chấm trên máy chủ.</p></div></section>}
    <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.05)] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#FF6B00]">Ranked Quiz</p><h2 className="mt-1 text-2xl font-black tracking-[-0.03em] text-slate-950">Thử thách kiến thức</h2><p className="mt-2 text-sm leading-6 text-slate-500">Kết quả hợp lệ đầu tiên có thể vào bảng xếp hạng của phiên bản này.</p></div>{attempt && !expired && <Countdown expiresAt={attempt.expiresAt} onExpire={onExpire} />}</div>
        {result && <section className="mt-6 rounded-[1.5rem] border border-emerald-200 bg-emerald-50/80 p-5"><div className="flex gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-white"><CheckCircle2 className="h-5 w-5" /></span><div><p className="font-black text-emerald-950">Đã nộp Quiz thành công</p><p className="mt-1 text-sm text-emerald-800">Hoàn thành {dateFormatter.format(new Date(result.completedAt))}</p></div></div><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Điểm", result.score], ["Đúng", `${result.correctCount}/${result.questionCount}`], ["Câu hỏi", result.questionCount], ["Thời gian", formatDuration(result.durationSeconds)]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-white bg-white/85 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-black text-emerald-700">{value}</p></div>)}</div></section>}
        {canStart && <div className="mt-7 rounded-2xl border border-orange-100 bg-orange-50/70 p-5"><div className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#FF6B00] shadow-sm"><FileQuestion className="h-5 w-5" /></span><div><p className="font-black text-slate-950">Sẵn sàng bắt đầu</p><p className="mt-1 text-sm leading-6 text-slate-600">Số câu hỏi và thời gian sẽ do hệ thống cung cấp khi bắt đầu.</p></div></div><button type="button" onClick={() => void start()} disabled={starting} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6B00] px-5 text-sm font-black text-white shadow-[0_10px_20px_rgba(255,107,0,0.2)] transition hover:-translate-y-0.5 hover:bg-[#E85F00] disabled:cursor-not-allowed disabled:opacity-60">{starting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />}{starting ? "Đang chuẩn bị..." : expired ? "Tạo lượt Quiz mới" : "Bắt đầu Quiz xếp hạng"}</button></div>}
        {attempt && !expired && <div className="mt-7"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#FF6B00]">Đang làm bài</p><h3 className="mt-1 text-xl font-black text-slate-950">{attempt.totalQuestionCount} câu hỏi</h3></div><span className="rounded-xl bg-orange-50 px-3 py-2 text-xs font-black text-[#C2410C]">{Object.keys(answers).length}/{attempt.questions.length} đã trả lời · còn {attempt.attemptsRemaining} lượt</span></div><div className="mt-5 space-y-4">{attempt.questions.map((question, index) => <article key={question.questionId} className="rounded-2xl border border-slate-200 bg-slate-50/45 p-4 sm:p-5"><div className="flex items-start justify-between gap-2"><p className="text-xs font-black uppercase tracking-[0.13em] text-[#FF6B00]">Câu {index + 1}</p>{versionId && <MarketplaceReportButton target={{ packVersionId: versionId, targetType: "QUESTION", targetRef: question.questionId, label: `Câu ${index + 1}` }} timerNote={RANKED_TIMER_NOTE} label="Báo cáo câu hỏi" />}</div><h4 className="mt-2 text-base font-black leading-6 text-slate-950">{question.text}</h4><div className="mt-4 grid gap-2">{question.options.map(option => { const selected = answers[question.questionId] === option.optionId; return <button key={option.optionId} type="button" aria-pressed={selected} onClick={() => setAnswers(current => ({ ...current, [question.questionId]: option.optionId }))} className={`flex min-h-12 items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${selected ? "border-[#FF6B00] bg-orange-50 text-slate-950" : "border-slate-200 bg-white text-slate-700 hover:border-orange-200 hover:bg-orange-50/40"}`}><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-black ${selected ? "border-[#FF6B00] bg-[#FF6B00] text-white" : "border-slate-300 text-slate-500"}`}>{option.label}</span>{option.text}</button>; })}</div></article>)}</div><button type="button" onClick={() => setConfirmSubmit(true)} disabled={!allAnswered || submitting} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6B00] px-5 text-sm font-black text-white shadow-[0_10px_20px_rgba(255,107,0,0.2)] transition hover:-translate-y-0.5 hover:bg-[#E85F00] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"><Send className="h-4 w-4" />Nộp bài ({Object.keys(answers).length}/{attempt.questions.length})</button>{!allAnswered && <p className="mt-2 text-xs text-slate-500">Trả lời tất cả câu hỏi trước khi nộp.</p>}</div>}
        {expired && <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><b>Phiên Quiz đã hết hạn.</b> Tạo lượt mới nếu bạn còn lượt trong ngày.</p>}
      </section>
      <aside className="space-y-6 xl:sticky xl:top-20 xl:h-fit"><MarketplaceLeaderboardCard versionId={versionId} /><div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm font-black text-slate-900">Phiên bản {packVersionNo}</p><p className="mt-1 text-sm leading-6 text-slate-500">Bảng xếp hạng và lịch sử chỉ áp dụng cho phiên bản Pack bạn đang sở hữu.</p></div></aside>
    </div>
    <div className="mt-6"><AttemptHistory attempts={attempts} loading={historyLoading} /></div>
    {confirmSubmit && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4" role="dialog" aria-modal="true" aria-labelledby="ranked-submit-title"><div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><h2 id="ranked-submit-title" className="text-xl font-black text-slate-950">Xác nhận nộp Quiz</h2><p className="mt-2 text-sm leading-6 text-slate-600">Bạn đã trả lời đủ câu hỏi. Hệ thống sẽ chấm điểm trên máy chủ.</p><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setConfirmSubmit(false)} disabled={submitting} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700">Hủy</button><button type="button" onClick={() => void submit()} disabled={submitting} className="inline-flex min-h-11 min-w-32 items-center justify-center gap-2 rounded-xl bg-[#FF6B00] px-4 text-sm font-bold text-white disabled:opacity-60">{submitting && <LoaderCircle className="h-4 w-4 animate-spin" />}{submitting ? "Đang nộp..." : "Nộp bài"}</button></div></div></div>}
  </div>;
}

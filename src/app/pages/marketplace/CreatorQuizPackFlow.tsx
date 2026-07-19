import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { AlertTriangle, ArrowLeft, ArrowRight, BanknoteArrowDown, BookOpen, CheckCircle2, ChevronDown, ChevronLeft, CircleAlert, ClipboardCheck, Clock3, Coins, FileQuestion, Layers3, LoaderCircle, PackagePlus, RefreshCw, Send, Sparkles, Trophy, Zap } from "lucide-react";
import { toast } from "sonner";
import { marketplaceService, useMarketplaceQualityJob, type CreatorMarketplaceItem, type CreatorValidationPackResponse, type CreatorValidationResult } from "../../../api/marketplace";
import { getCurrentSubscription } from "../../../api/billing/subscriptionsService";
import workspaceService, { type WorkspaceResponse } from "../../../api/utilities/workspaceService";
import { CreatorQualityPanel, isCreatorReviewReady, QualityStatusBadge } from "../../components/marketplace/CreatorQualityPanel";
import { buildCreatorValidationCorrectAnswers } from "./creatorValidationAdminTool";

type ValidationQuestion = {
  questionId: string;
  text: string;
  options: Array<{ optionId: string; text: string; correct?: boolean | null }>;
};

const scoreOf = (item: CreatorMarketplaceItem) => item.creatorValidationScore ?? item.validationScore ?? 0;
const errorText = (error: unknown) => error instanceof Error ? error.message : "Đã có lỗi xảy ra. Vui lòng thử lại.";
const date = (value?: string | null) => value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";

function CreatorShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [exitConfirmationOpen, setExitConfirmationOpen] = useState(false);

  useEffect(() => {
    const requestExit = () => setExitConfirmationOpen(true);
    window.addEventListener("skillsprint:creator-validation-exit-confirm", requestExit);
    return () => window.removeEventListener("skillsprint:creator-validation-exit-confirm", requestExit);
  }, []);

  return <main className="relative isolate min-h-0 overflow-hidden bg-[#F8FAFC] px-4 py-6 text-slate-900 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
    <style>{`@keyframes creatorFloat{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(0,18px,0) scale(1.04)}}@media(prefers-reduced-motion:no-preference){.creator-float{animation:creatorFloat 14s ease-in-out infinite}.creator-float-delayed{animation:creatorFloat 18s ease-in-out 2s infinite reverse}}`}</style>
    <div className="pointer-events-none absolute inset-0 -z-30 bg-[linear-gradient(145deg,#F8FAFC_0%,#FFFDF9_42%,#FFF7ED_100%)]" />
    <div className="pointer-events-none absolute inset-0 -z-20 opacity-35 [background-image:radial-gradient(rgba(255,107,0,0.18)_1px,transparent_1px)] [background-size:26px_26px] [mask-image:linear-gradient(to_bottom,black,transparent_78%)]" />
    <div className="creator-float pointer-events-none absolute -right-36 top-16 -z-10 h-96 w-96 rounded-full bg-orange-200/25 blur-3xl" />
    <div className="creator-float-delayed pointer-events-none absolute -left-44 top-[36rem] -z-10 h-80 w-80 rounded-full bg-amber-200/25 blur-3xl" />
    <div className="relative mx-auto max-w-7xl">{children}</div>
    {exitConfirmationOpen && <Confirm title="Thoát Full Pack Validation?" text="Câu trả lời hiện tại sẽ chưa được nộp. Bạn vẫn có thể quay lại làm tiếp sau." onClose={() => setExitConfirmationOpen(false)} onConfirm={() => navigate("/app/creator/marketplace")} />}
  </main>;
}

function Skeleton() { return <div className="grid gap-4 md:grid-cols-2">{[1, 2, 3, 4].map(key => <div key={key} className="h-52 animate-pulse rounded-3xl bg-slate-200" />)}</div>; }
function Empty({ children }: { children: React.ReactNode }) { return <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-sm text-slate-500">{children}</div>; }
function Button({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) { return <button {...props} className={`inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF6B00] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(255,107,0,0.22)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#e85f00] hover:shadow-[0_12px_28px_rgba(255,107,0,0.3)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none ${className}`}>{children}</button>; }
function Confirm({ title, text, onClose, onConfirm, busy }: { title: string; text: string; onClose: () => void; onConfirm: () => void; busy?: boolean }) { return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><h2 className="text-lg font-black">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p><div className="mt-6 flex justify-end gap-3"><button onClick={onClose} disabled={busy} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold">Hủy</button><Button onClick={onConfirm} disabled={busy}>{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Xác nhận"}</Button></div></div></div>; }

function statusMeta(status: string) {
  if (status === "PUBLISHED") return { label: "Đã xuất bản", className: "bg-emerald-50 text-emerald-700" };
  if (status === "PENDING_REVIEW") return { label: "Đang chờ Admin duyệt", className: "bg-amber-50 text-amber-800" };
  if (status === "SUSPENDED") return { label: "Đã tạm ngừng", className: "bg-slate-200 text-slate-700" };
  return { label: "Bản nháp", className: "bg-orange-50 text-[#FF6B00]" };
}

function CreatorPackCard({ item, onSendReview, onRefreshSnapshot }: { item: CreatorMarketplaceItem; onSendReview: (item: CreatorMarketplaceItem) => void; onRefreshSnapshot: (item: CreatorMarketplaceItem) => void }) {
  const score = scoreOf(item);
  const reviewReady = isCreatorReviewReady(score, item.qualityStatus, item.qualityCurrent);
  const status = statusMeta(item.status);
  const needsRevision = item.status === "DRAFT" && Boolean(item.reviewNote);

  return <article className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6">
    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#FF6B00] via-orange-400 to-amber-300" />
    <div className="flex items-start justify-between gap-4"><div className="min-w-0"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${status.className}`}>{needsRevision ? "Bản nháp — cần chỉnh sửa" : status.label}</span><p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{item.subject}</p><h2 className="mt-1 line-clamp-2 text-xl font-black leading-7 text-slate-900">{item.title}</h2></div><span className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-orange-50 px-3 py-2 text-sm font-black text-[#FF6B00]"><Coins className="h-4 w-4" />{item.priceCoins}</span></div>
    <p className="mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{item.description || "Chưa có mô tả cho Quiz Pack này."}</p>
    <div className="mt-5 grid grid-cols-3 divide-x divide-slate-200 rounded-2xl border border-slate-100 bg-slate-50 px-2 py-3 text-center"><div><p className="text-lg font-black text-slate-900">{item.chapterCount}</p><p className="text-xs text-slate-500">chương</p></div><div><p className="text-lg font-black text-slate-900">{item.quizCount}</p><p className="text-xs text-slate-500">quiz</p></div><div><p className="text-lg font-black text-slate-900">{item.questionCount}</p><p className="text-xs text-slate-500">câu hỏi</p></div></div>
    <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm"><div><p className="text-xs font-medium text-slate-500">Creator Validation</p><p className="mt-1 inline-flex items-center gap-1 font-black text-slate-800"><ClipboardCheck className="h-4 w-4 text-[#FF6B00]" />{score ? `${score}/100` : "Chưa đạt"}</p></div><div><p className="text-xs font-medium text-slate-500">Quality gate</p><div className="mt-1"><QualityStatusBadge status={item.qualityStatus} currentSnapshot={item.qualityCurrent} /></div></div></div>
    {needsRevision && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-950"><AlertTriangle className="mr-2 inline h-4 w-4" /><b>Admin yêu cầu chỉnh sửa:</b> {item.reviewNote}</div>}
    {item.status === "SUSPENDED" && item.reviewNote && <div className="mt-4 rounded-2xl bg-slate-100 p-3 text-sm text-slate-700">{item.reviewNote}</div>}
    {item.status === "DRAFT" && <><div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={() => onRefreshSnapshot(item)} className="inline-flex items-center gap-2 rounded-xl border border-orange-200 px-4 py-2.5 text-sm font-bold text-[#FF6B00] hover:bg-orange-50"><RefreshCw className="h-4 w-4" />Làm mới snapshot</button>{!needsRevision && <Link to={`/app/creator/marketplace/${item.itemId}/validation`} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"><ClipboardCheck className="h-4 w-4" />Kiểm tra điều kiện</Link>}<Button disabled={!reviewReady} onClick={() => onSendReview(item)}><Send className="h-4 w-4" />Gửi duyệt</Button></div>{!reviewReady && <p className="mt-2 text-xs leading-5 text-slate-500">Cần Creator Validation ≥ 90 và quality gate đạt trên snapshot hiện tại.</p>}</>}
    {item.status === "PENDING_REVIEW" && <p className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">Admin đang kiểm tra Quiz Pack này.</p>}
    {item.status === "PUBLISHED" && <div className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-emerald-700"><BookOpen className="h-4 w-4" />Đang hiển thị trên Marketplace</div>}
  </article>;
}

export function CreatorQuizPackDashboard() {
  const navigate = useNavigate();
  const [items, setItems] = useState<CreatorMarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reviewItem, setReviewItem] = useState<CreatorMarketplaceItem | null>(null);
  const [refreshItem, setRefreshItem] = useState<CreatorMarketplaceItem | null>(null);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => { setLoading(true); setFailed(false); try { setItems(await marketplaceService.getMine()); } catch { setFailed(true); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const submitReview = async () => { if (!reviewItem) return; if (!isCreatorReviewReady(scoreOf(reviewItem), reviewItem.qualityStatus, reviewItem.qualityCurrent)) { toast.error("Quiz Pack chưa đạt đủ Creator Validation và quality gate."); return; } setSending(true); try { await marketplaceService.submitForReview(reviewItem.itemId); toast.success("Đã gửi Quiz Pack chờ duyệt."); setReviewItem(null); await load(); } catch (error) { toast.error(errorText(error)); } finally { setSending(false); } };
  const refreshSnapshot = async () => { if (!refreshItem) return; setRefreshing(true); try { const item = await marketplaceService.refreshCreatorSnapshot(refreshItem.itemId); toast.success("Đã làm mới snapshot. Hãy thực hiện Validation lại."); setRefreshItem(null); navigate(`/app/creator/marketplace/${item.itemId}/validation`); } catch (error) { toast.error(errorText(error)); } finally { setRefreshing(false); } };
  const processSteps = [
    { number: "01", icon: PackagePlus, title: "Chọn workspace", text: "Một workspace cho mỗi pack" },
    { number: "02", icon: Layers3, title: "Hệ thống đóng gói", text: "Roadmap và quiz active" },
    { number: "03", icon: ClipboardCheck, title: "Hoàn tất Validation", text: "Đạt từ 90 điểm để gửi duyệt" },
  ];

  return <CreatorShell>
    <section className="relative isolate overflow-hidden rounded-[2rem] border border-[#FFE1C7] bg-white shadow-[0_24px_70px_rgba(255,107,0,0.08)]">
      <div className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-[#FF8A32]/60 to-transparent" />
      <div className="pointer-events-none absolute -right-24 -top-28 -z-10 h-80 w-80 rounded-full bg-orange-100/65 blur-3xl" />
      <div className="pointer-events-none absolute bottom-4 left-1/3 -z-10 h-44 w-44 rounded-full bg-amber-50 blur-3xl" />
      <div className="grid gap-7 px-6 py-7 sm:px-9 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)] lg:items-center lg:px-11 lg:py-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50/80 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#FF6B00]">
            <Sparkles className="h-3.5 w-3.5" />Creator studio
          </div>
          <h1 className="mt-4 max-w-3xl text-3xl font-black leading-[1.04] tracking-[-0.04em] text-slate-950 sm:text-4xl lg:text-[3.15rem]">Từ workspace<br className="hidden sm:block" /> đến Quiz Pack.</h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-slate-600 sm:text-[15px]">Roadmap và quiz active được đóng gói tự động. Hoàn tất Validation để gửi duyệt.</p>
        </div>
        <div className="relative mx-auto w-full max-w-sm lg:mx-0 lg:justify-self-end">
          <div className="absolute -inset-2 rounded-[1.8rem] border border-dashed border-orange-200/70" />
          <div className="relative overflow-hidden rounded-[1.55rem] border border-[#FFE0C2] bg-[radial-gradient(circle_at_100%_0%,#FFE2C5_0%,transparent_42%),linear-gradient(145deg,#FFFEFC_0%,#FFF6ED_100%)] p-5 shadow-[0_18px_46px_rgba(255,107,0,0.11)]">
            <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full border-[22px] border-orange-200/20" />
            <div className="relative flex items-center justify-between gap-3">
              <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#E85F00]">Đóng gói tự động</p><p className="mt-1 text-xs font-medium text-slate-500">Nội dung đang active</p></div>
              <Zap className="h-4 w-4 fill-orange-100 text-[#FF6B00]" />
            </div>
            <div className="relative mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="rounded-2xl border border-slate-100 bg-white/90 px-3 py-4 text-center shadow-sm"><Layers3 className="mx-auto h-5 w-5 text-slate-500" /><b className="mt-2 block text-sm text-slate-900">Workspace</b><span className="mt-0.5 block text-[10px] text-slate-400">Roadmap + quiz</span></div>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#FF6B00] text-white shadow-[0_7px_16px_rgba(255,107,0,0.2)]"><ArrowRight className="h-4 w-4" /></span>
              <div className="rounded-2xl border border-orange-100 bg-white/90 px-3 py-4 text-center shadow-sm"><PackagePlus className="mx-auto h-5 w-5 text-[#FF6B00]" /><b className="mt-2 block text-sm text-slate-900">Quiz Pack</b><span className="mt-0.5 block text-[10px] text-slate-400">Sẵn sàng validate</span></div>
            </div>
            <div className="relative mt-4 flex items-center justify-between gap-3 border-t border-orange-100 pt-3 text-[11px] font-semibold text-slate-500"><span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />Đã đồng bộ</span><span className="rounded-lg bg-orange-100/80 px-2 py-1 font-black text-[#E85F00]">Validation ≥ 90</span></div>
          </div>
        </div>
      </div>
      <div className="grid border-t border-[#FFE1C7] bg-[#FFF9F3] sm:grid-cols-3">
        {processSteps.map(({ number, icon: Icon, title, text }, index) => <div key={number} className={`group relative flex items-center gap-3 px-5 py-4 transition-colors duration-200 hover:bg-white/80 sm:px-6 ${index < processSteps.length - 1 ? "border-b border-orange-100 sm:border-b-0 sm:border-r" : ""}`}>
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white text-[10px] font-black tracking-[0.08em] text-[#FF6B00] shadow-sm ring-1 ring-orange-100">{number}</span>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-orange-50 text-[#FF6B00] transition duration-200 group-hover:-translate-y-0.5 group-hover:bg-white group-hover:shadow-sm"><Icon className="h-4 w-4" /></span>
          <p className="min-w-0 text-xs leading-5 text-slate-500"><b className="block text-[13px] text-slate-900">{title}</b>{text}</p>
          {index < processSteps.length - 1 && <ArrowRight className="absolute right-[-9px] top-1/2 z-10 hidden h-4 w-4 -translate-y-1/2 rounded-full bg-white text-orange-300 sm:block" />}
        </div>)}
      </div>
    </section>

    <section className="mt-10 sm:mt-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#FF6B00]">Thư viện Creator</p><h2 className="mt-2 text-2xl font-black tracking-[-0.025em] text-slate-950 sm:text-3xl">Quiz Pack của bạn</h2><p className="mt-2 text-sm text-slate-500">Quản lý nội dung, Validation và trạng thái xét duyệt tại một nơi.</p></div>
        {!loading && !failed && <div className="flex w-fit flex-wrap items-center gap-2.5">
          <span className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-600 shadow-sm">{items.length} Quiz Pack</span>
          <Link to="/app/creator/earnings" className="inline-flex h-10 items-center gap-2 rounded-xl border border-orange-200 bg-white px-4 text-sm font-bold text-[#FF6B00] shadow-sm transition hover:bg-orange-50"><BanknoteArrowDown className="h-4 w-4" />Thu nhập</Link>
          {items.length > 0 && <Link to="/app/creator/marketplace/create"><Button className="h-10 px-4"><PackagePlus className="h-4 w-4" />Tạo Quiz Pack</Button></Link>}
        </div>}
      </div>
      <div className="mt-6">{loading ? <Skeleton /> : failed ? <Empty><CircleAlert className="mx-auto h-8 w-8 text-rose-500" /><p className="mt-4 font-bold text-slate-800">Không thể tải Quiz Pack.</p><button onClick={load} className="mt-4 font-bold text-[#FF6B00] hover:underline">Thử lại</button></Empty> : items.length === 0 ? <div className="relative overflow-hidden rounded-[2rem] border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-[0_18px_50px_rgba(15,23,42,0.04)] sm:py-16">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-orange-50/80 to-transparent" />
        <div className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-orange-100 bg-orange-50 text-[#FF6B00] shadow-sm"><PackagePlus className="h-7 w-7" /></div>
        <h3 className="relative mt-5 text-xl font-black tracking-tight text-slate-950">Bắt đầu Quiz Pack đầu tiên</h3>
        <p className="relative mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Chọn một workspace đã có roadmap và quiz active. SkillSprint sẽ đóng gói phần còn lại cho bạn.</p>
        <div className="relative mx-auto mt-5 flex max-w-lg flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-500"><span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-[#FF6B00]" />Có roadmap</span><span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-[#FF6B00]" />Có quiz active</span><span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-[#FF6B00]" />Sẵn sàng Validation</span></div>
        <Link to="/app/creator/marketplace/create" className="relative mt-7 inline-flex"><Button className="h-12 px-5"><PackagePlus className="h-4 w-4" />Tạo Quiz Pack<ArrowRight className="h-4 w-4" /></Button></Link>
      </div> : <div className="grid gap-5 xl:grid-cols-2">{items.map(item => <CreatorPackCard key={item.itemId} item={item} onSendReview={setReviewItem} onRefreshSnapshot={setRefreshItem} />)}</div>}</div>
    </section>
    {reviewItem && <Confirm title="Gửi Admin duyệt" text="Creator Validation và quality gate đều đã đạt. Sau khi xác nhận, Quiz Pack sẽ chuyển sang trạng thái chờ Admin kiểm tra." busy={sending} onClose={() => setReviewItem(null)} onConfirm={submitReview} />}
    {refreshItem && <Confirm title="Làm mới snapshot?" text="Nội dung Quiz Pack sẽ được đóng gói lại từ Workspace hiện tại. Bạn cần thực hiện Validation lại trước khi gửi duyệt." busy={refreshing} onClose={() => setRefreshItem(null)} onConfirm={refreshSnapshot} />}
  </CreatorShell>;
}

function Field({ label, error, children, hint }: { label: string; error?: string; children: React.ReactNode; hint?: string }) {
  return <label className="block text-sm font-bold text-slate-800">
    <span>{label}</span>
    {children}
    {error ? <span className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-rose-600"><CircleAlert className="h-3.5 w-3.5" />{error}</span> : hint ? <span className="mt-2 block text-xs font-medium leading-5 text-slate-400">{hint}</span> : null}
  </label>;
}

export function CreatorQuizPackCreate() {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ workspaceId: "", title: "", description: "", subject: "", priceCoins: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { workspaceService.getMyWorkspaces().then(setWorkspaces).catch(error => toast.error(errorText(error))).finally(() => setLoading(false)); }, []);
  const create = async (event: React.FormEvent) => { event.preventDefault(); const nextErrors: Record<string, string> = {}; const price = Number(form.priceCoins); if (!form.workspaceId) nextErrors.workspaceId = "Hãy chọn workspace."; if (!form.title.trim()) nextErrors.title = "Tiêu đề là bắt buộc."; else if (form.title.length > 500) nextErrors.title = "Tối đa 500 ký tự."; if (form.description.length > 5000) nextErrors.description = "Tối đa 5000 ký tự."; if (!form.subject.trim()) nextErrors.subject = "Môn học là bắt buộc."; else if (form.subject.length > 100) nextErrors.subject = "Tối đa 100 ký tự."; if (!Number.isInteger(price) || price < 0) nextErrors.priceCoins = "Nhập số nguyên lớn hơn hoặc bằng 0."; setErrors(nextErrors); if (Object.keys(nextErrors).length) return; setSaving(true); try { const item = await marketplaceService.createItem({ ...form, title: form.title.trim(), subject: form.subject.trim(), description: form.description.trim() || null, priceCoins: price }); toast.success(`Đã tạo DRAFT: ${item.chapterCount} chương, ${item.quizCount} quiz, ${item.questionCount} câu hỏi.`); navigate(`/app/creator/marketplace/${item.itemId}/validation`); } catch (error) { toast.error(errorText(error)); } finally { setSaving(false); } };
  const input = "mt-2 h-12 w-full rounded-xl border border-[#E8E2DC] bg-[#FCFCFB] px-4 text-sm font-semibold text-slate-800 outline-none transition duration-200 placeholder:font-normal placeholder:text-slate-400 hover:border-orange-200 hover:bg-white focus:border-[#FF6B00] focus:bg-white focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";
  const selectedWorkspace = workspaces.find(workspace => workspace.workspaceId === form.workspaceId);
  const displayPrice = form.priceCoins && Number.isFinite(Number(form.priceCoins)) ? `${Number(form.priceCoins).toLocaleString("vi-VN")} Coin` : "Chưa đặt giá";

  return <CreatorShell>
    <Link to="/app/creator/marketplace" className="group inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-3.5 py-2 text-sm font-bold text-[#FF6B00] shadow-sm transition hover:-translate-x-0.5 hover:border-orange-200 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100">
      <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" />Quiz Pack của tôi
    </Link>

    <header className="mt-7 max-w-2xl">
      <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.17em] text-[#FF6B00]"><Sparkles className="h-3.5 w-3.5" />Creator studio</div>
      <h1 className="mt-3 text-3xl font-black leading-tight tracking-[-0.035em] text-slate-950 sm:text-4xl">Tạo Quiz Pack mới</h1>
      <p className="mt-3 text-sm text-slate-500 sm:text-base">Chọn workspace, thêm thông tin và bắt đầu Validation.</p>
    </header>

    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <form onSubmit={create} className="overflow-hidden rounded-[2rem] border border-white/80 bg-[#FFFEFC]/95 shadow-[0_24px_70px_rgba(15,23,42,0.09)] backdrop-blur-sm transition duration-300 hover:shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
        <section className="border-b border-[#F5EDE6] bg-gradient-to-br from-[#FFF8F2] via-[#FFFBF7] to-[#FFFEFC] px-5 py-6 sm:px-7">
          <div className="flex items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-orange-50 text-[#FF6B00]"><Layers3 className="h-4 w-4" /></span><h2 className="text-base font-black text-slate-950">Nguồn nội dung</h2></div>
          <div className="relative mt-4">
            <Field label="Workspace" error={errors.workspaceId}>
              <select value={form.workspaceId} onChange={event => setForm(current => ({ ...current, workspaceId: event.target.value }))} disabled={loading} className={`${input} appearance-none pr-11`} required>
                <option value="">{loading ? "Đang tải workspace..." : "Chọn workspace"}</option>
                {workspaces.map(workspace => <option key={workspace.workspaceId} value={workspace.workspaceId}>{workspace.name}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-[43px] h-4 w-4 text-slate-400" />
            </Field>
          </div>
        </section>

        <section className="bg-white/80 px-5 py-6 sm:px-7">
          <div className="flex items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-orange-50 text-[#FF6B00]"><FileQuestion className="h-4 w-4" /></span><h2 className="text-base font-black text-slate-950">Thông tin Quiz Pack</h2></div>
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            <Field label="Tiêu đề" error={errors.title}><input value={form.title} maxLength={500} placeholder="Chinh phục React cơ bản" onChange={event => setForm(current => ({ ...current, title: event.target.value }))} className={input} required /></Field>
            <Field label="Môn học" error={errors.subject}><input value={form.subject} maxLength={100} placeholder="Lập trình Web" onChange={event => setForm(current => ({ ...current, subject: event.target.value }))} className={input} required /></Field>
            <div className="md:col-span-2"><Field label="Giá Coin" error={errors.priceCoins}><div className="relative"><Coins className="pointer-events-none absolute left-4 top-6 h-4 w-4 text-[#FF6B00]" /><input type="number" min="0" step="1" inputMode="numeric" value={form.priceCoins} placeholder="0" onChange={event => setForm(current => ({ ...current, priceCoins: event.target.value }))} className={`${input} pl-11 pr-16`} required /><span className="pointer-events-none absolute right-4 top-[21px] text-xs font-bold text-slate-400">COIN</span></div></Field></div>
            <div className="md:col-span-2"><Field label="Mô tả" error={errors.description} hint={form.description ? `${form.description.length}/5000` : "Không bắt buộc"}><textarea value={form.description} maxLength={5000} placeholder="Mô tả ngắn về Quiz Pack..." onChange={event => setForm(current => ({ ...current, description: event.target.value }))} className="mt-2 min-h-28 w-full resize-y rounded-xl border border-[#E8E2DC] bg-[#FCFCFB] p-4 text-sm font-normal leading-6 text-slate-800 outline-none transition duration-200 placeholder:text-slate-400 hover:border-orange-200 hover:bg-white focus:border-[#FF6B00] focus:bg-white focus:ring-4 focus:ring-orange-100 sm:min-h-32" /></Field></div>
          </div>
        </section>

        <footer className="flex justify-end border-t border-[#F5EDE6] bg-gradient-to-r from-[#FFFDFB] to-[#FFF7ED] px-5 py-5 sm:px-7">
          <Button type="submit" disabled={saving} className="h-12 w-full px-5 sm:w-auto">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />}Tạo Quiz Pack<ArrowRight className="h-4 w-4" /></Button>
        </footer>
      </form>

      <aside className="space-y-4 lg:sticky lg:top-6">
        <section className="group relative overflow-hidden rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-5 shadow-[0_16px_42px_rgba(255,107,0,0.1)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_52px_rgba(255,107,0,0.16)] sm:p-6">
          <div className="pointer-events-none absolute -right-16 -top-20 h-40 w-40 rounded-full bg-orange-200/35 blur-2xl transition duration-500 group-hover:scale-125" />
          <div className="relative flex items-center justify-between gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#FF6B00] text-white shadow-lg shadow-orange-200 transition duration-300 group-hover:-rotate-3 group-hover:scale-105"><PackagePlus className="h-5 w-5" /></span><span className="rounded-full border border-orange-100 bg-white/90 px-3 py-1 text-[11px] font-bold text-[#FF6B00] backdrop-blur">Bản nháp mới</span></div>
          <p className="relative mt-5 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Tóm tắt Quiz Pack</p>
          <h2 className="relative mt-2 line-clamp-2 text-xl font-black leading-7 text-slate-950">{form.title.trim() || "Quiz Pack chưa có tiêu đề"}</h2>
          <dl className="relative mt-5 space-y-3 text-sm"><div className="flex justify-between gap-4 border-b border-orange-100 pb-3"><dt className="text-slate-500">Workspace</dt><dd className="max-w-[170px] truncate text-right font-bold text-slate-800">{selectedWorkspace?.name || "Chưa chọn"}</dd></div><div className="flex justify-between gap-4 border-b border-orange-100 pb-3"><dt className="text-slate-500">Môn học</dt><dd className="max-w-[170px] truncate text-right font-bold text-slate-800">{form.subject.trim() || "Chưa nhập"}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Giá bán</dt><dd className="font-black text-[#FF6B00]">{displayPrice}</dd></div></dl>
        </section>
        <section className="rounded-3xl border border-white/90 bg-white/90 p-5 shadow-[0_14px_38px_rgba(15,23,42,0.07)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(15,23,42,0.11)] sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Sau khi tạo</p><div className="mt-4 space-y-4">{[{ icon: Layers3, title: "Đóng gói nội dung", text: "Roadmap và quiz active được tạo snapshot." }, { icon: ClipboardCheck, title: "Làm Validation", text: "Hoàn thành bài kiểm tra với tối thiểu 90 điểm." }, { icon: Send, title: "Gửi Admin duyệt", text: "Pack đạt yêu cầu mới có thể gửi xét duyệt." }].map(({ icon: Icon, title, text }, index) => <div key={title} className="group/step flex gap-3"><span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-orange-50 text-[#FF6B00] transition duration-200 group-hover/step:bg-[#FF6B00] group-hover/step:text-white"><Icon className="h-4 w-4" />{index < 2 && <span className="absolute left-1/2 top-9 h-4 w-px bg-orange-100" />}</span><div><p className="text-sm font-bold text-slate-800">{title}</p><p className="mt-0.5 text-xs leading-5 text-slate-500">{text}</p></div></div>)}</div></section>
      </aside>
    </div>
  </CreatorShell>;
}

function flattenSnapshot(snapshot: CreatorValidationPackResponse): ValidationQuestion[] {
  return snapshot.chapters.flatMap(chapter => chapter.questions.map(question => ({ questionId: question.questionId, text: question.text, options: question.options.map(option => ({ optionId: option.optionId, text: option.text, correct: option.correct })) })));
}

export function CreatorQuizPackValidation() {
  const { itemId = "" } = useParams();
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState<CreatorValidationPackResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CreatorValidationResult | null>(null);
  const [reviewConfirm, setReviewConfirm] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [isAdminDefault, setIsAdminDefault] = useState(false);
  const quality = useMarketplaceQualityJob(snapshot?.versionId);

  const loadSnapshot = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      setSnapshot(await marketplaceService.getCreatorValidationSnapshot(itemId));
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    void loadSnapshot();
  }, [loadSnapshot]);

  useEffect(() => {
    let cancelled = false;

    getCurrentSubscription()
      .then(subscription => {
        if (!cancelled) {
          setIsAdminDefault(subscription.plan?.planType === "ADMIN_DEFAULT");
        }
      })
      .catch(() => {
        if (!cancelled) setIsAdminDefault(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const questions = useMemo(() => snapshot ? flattenSnapshot(snapshot) : [], [snapshot]);
  const current = questions[index];
  const complete = questions.length > 0 && questions.every(question => answers[question.questionId]);
  const adminCanAutofill = isAdminDefault && questions.length > 0;

  useEffect(() => {
    if (result) return;
    const timer = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [result, startedAt]);

  useEffect(() => {
    const confirmExit = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest('a[href="/app/creator/marketplace"]');
      if (!link) return;
      event.preventDefault();
      event.stopPropagation();
      window.dispatchEvent(new Event("skillsprint:creator-validation-exit-confirm"));
    };
    document.addEventListener("click", confirmExit, true);
    return () => document.removeEventListener("click", confirmExit, true);
  }, []);

  const handleAdminAutoFill = () => {
    const correctAnswers = buildCreatorValidationCorrectAnswers(questions);
    if (!correctAnswers) {
      toast.error("Chưa thể điền đáp án đúng vì máy chủ chưa trả về đáp án cho tài khoản admin.");
      return;
    }

    setAnswers(correctAnswers);
    setIndex(questions.length - 1);
  };

  const submit = async () => {
    if (!complete) return;
    setSubmitting(true);
    try {
      const next = await marketplaceService.validateCreator(itemId, {
        answers: questions.map(question => ({
          questionId: question.questionId,
          selectedOptionId: answers[question.questionId],
        })),
        durationSeconds: elapsed,
      });
      setResult(next);
      setConfirm(false);
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setSubmitting(false);
    }
  };

  const retry = () => {
    setAnswers({});
    setIndex(0);
    setElapsed(0);
    setStartedAt(Date.now());
    setResult(null);
  };

  const sendReview = async () => {
    if (!quality.passed) {
      toast.error("Quality gate chưa đạt trên snapshot hiện tại.");
      return;
    }
    setReviewing(true);
    try {
      await marketplaceService.submitForReview(itemId);
      toast.success("Đã gửi Quiz Pack chờ duyệt.");
      navigate("/app/creator/marketplace");
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setReviewing(false);
    }
  };

  if (loading) {
    return <CreatorShell><Skeleton /></CreatorShell>;
  }

  if (loadFailed || !snapshot) {
    return (
      <CreatorShell>
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-7">
          <CircleAlert className="h-7 w-7 text-amber-700" />
          <h1 className="mt-3 text-xl font-black">Không thể tải snapshot Validation</h1>
          <p className="mt-2 text-sm leading-6 text-amber-950">
            Validation chỉ khả dụng với Quiz Pack bản nháp của bạn.
          </p>
          <div className="mt-5 flex flex-wrap gap-4">
            <button onClick={loadSnapshot} className="font-bold text-[#FF6B00]">Thử lại</button>
            <Link to="/app/creator/marketplace" className="font-bold text-[#FF6B00]">
              Quay lại Quiz Pack của tôi
            </Link>
          </div>
        </div>
      </CreatorShell>
    );
  }

  if (result) {
    const passed = result.score >= 90;
    return (
      <CreatorShell>
        <div className="mx-auto max-w-3xl space-y-5">
        <div className={`rounded-3xl border p-7 text-center ${passed ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
          <CheckCircle2 className={`mx-auto h-10 w-10 ${passed ? "text-emerald-600" : "text-rose-600"}`} />
          <h1 className="mt-4 text-2xl font-black">{passed ? "Validation đạt yêu cầu" : "Validation chưa đạt"}</h1>
          <p className="mt-2 text-sm text-slate-600">Hoàn thành {date(result.completedAt)}</p>
          <div className="mt-6 grid grid-cols-2 gap-3 text-left sm:grid-cols-4">
            {[
              ["Điểm", result.score],
              ["Đúng", `${result.correctCount}/${result.questionCount}`],
              ["Câu hỏi", result.questionCount],
              ["Thời gian", `${result.durationSeconds}s`],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl bg-white p-3">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="font-black">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {passed ? (
              <Button disabled={!quality.passed} onClick={() => setReviewConfirm(true)}>
                <Send className="h-4 w-4" />{quality.passed ? "Gửi Admin duyệt" : "Chờ quality gate"}
              </Button>
            ) : (
              <Button onClick={retry}>Làm lại Validation</Button>
            )}
          </div>
        </div>
        {passed && <CreatorQualityPanel job={quality.job} loading={quality.loading} starting={quality.starting} active={quality.active} error={quality.error} onStart={() => void quality.start()} onRetry={() => void quality.refetch()} />}
        </div>
        {reviewConfirm && (
          <Confirm
            title="Gửi Admin duyệt"
            text="Sau khi gửi duyệt, Quiz Pack sẽ ở trạng thái chờ Admin kiểm tra."
            busy={reviewing}
            onClose={() => setReviewConfirm(false)}
            onConfirm={sendReview}
          />
        )}
      </CreatorShell>
    );
  }

  return (
    <CreatorShell>
      <Link to="/app/creator/marketplace" className="inline-flex items-center gap-1 text-sm font-bold text-[#FF6B00]">
        <ChevronLeft className="h-4 w-4" />Quiz Pack của tôi
      </Link>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Full Pack Validation</h1>
          <p className="mt-1 text-sm text-slate-500">
            Tiến độ {Object.keys(answers).length}/{questions.length} câu trả lời
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-2 text-sm font-black text-[#FF6B00]">
          <Clock3 className="h-4 w-4" />
          {String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}
        </span>
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6">
          <p className="text-sm font-bold text-[#FF6B00]">Câu {index + 1}/{questions.length}</p>
          <h2 className="mt-3 text-xl font-black leading-8">{current?.text}</h2>

          <div className="mt-6 grid gap-3">
            {current?.options.map(option => (
              <label
                key={option.optionId}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm font-medium ${answers[current.questionId] === option.optionId ? "border-[#FF6B00] bg-orange-50" : "border-slate-200 hover:border-orange-200"}`}
              >
                <input
                  type="radio"
                  name={current.questionId}
                  checked={answers[current.questionId] === option.optionId}
                  onChange={() => setAnswers(currentAnswers => ({ ...currentAnswers, [current.questionId]: option.optionId }))}
                  className="accent-[#FF6B00]"
                />
                {option.text}
              </label>
            ))}
          </div>

          {adminCanAutofill && (
            <button
              type="button"
              onClick={handleAdminAutoFill}
              title="Test tool: điền toàn bộ đáp án đúng từ dữ liệu backend"
              className="mt-7 w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-xs font-bold text-[#FF6B00] transition hover:bg-orange-100 active:scale-[0.98]"
            >
              <Zap className="h-4 w-4" />
              [Admin] Auto-Fill Correct Answers
            </button>
          )}

          <div className="mt-7 flex justify-between">
            <button
              onClick={() => setIndex(value => Math.max(0, value - 1))}
              disabled={index === 0}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold disabled:opacity-40"
            >
              Câu trước
            </button>
            {index < questions.length - 1 ? (
              <button
                onClick={() => setIndex(value => Math.min(questions.length - 1, value + 1))}
                className="rounded-xl border border-orange-200 px-4 py-2 text-sm font-bold text-[#FF6B00]"
              >
                Câu tiếp
              </button>
            ) : (
              <Button onClick={() => setConfirm(true)} disabled={!complete}>
                <Trophy className="h-4 w-4" />Nộp Validation
              </Button>
            )}
          </div>
        </section>

        <aside className="rounded-3xl border border-slate-200 bg-white p-5">
          <h2 className="font-black">Câu hỏi</h2>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {questions.map((question, questionIndex) => (
              <button
                key={question.questionId}
                onClick={() => setIndex(questionIndex)}
                className={`h-9 rounded-lg text-xs font-bold ${index === questionIndex ? "bg-[#FF6B00] text-white" : answers[question.questionId] ? "bg-orange-50 text-[#FF6B00]" : "bg-slate-100 text-slate-600"}`}
              >
                {questionIndex + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() => setConfirm(true)}
            disabled={!complete}
            className="mt-6 w-full rounded-xl bg-[#FF6B00] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
          >
            Nộp Validation
          </button>
        </aside>
      </div>

      {confirm && (
        <Confirm
          title="Nộp Full Pack Validation"
          text="Bạn đã trả lời tất cả câu hỏi. Xác nhận gửi bài Validation?"
          busy={submitting}
          onClose={() => setConfirm(false)}
          onConfirm={submit}
        />
      )}
    </CreatorShell>
  );
}

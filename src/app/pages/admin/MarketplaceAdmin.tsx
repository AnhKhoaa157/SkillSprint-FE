import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, CircleAlert, Coins, Eye, LoaderCircle, PackageCheck, RefreshCw, ShieldCheck, Sparkles, XCircle } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { getMarketplaceItems, getMarketplaceReviewDetail, queueAdminMarketplaceQuality, updateMarketplaceReviewStatus } from "../../../api/admin/marketplaceAdminService";
import type { AdminMarketplaceChapter, AdminMarketplaceDetail, AdminMarketplaceListItem, AdminMarketplaceStatus } from "../../../api/admin/marketplaceAdminTypes";
import { AdminQualityReviewPanel } from "../../components/marketplace/AdminQualityReviewPanel";
import { isQualityReady, QualityStatusBadge } from "../../components/marketplace/MarketplaceQualityStatus";

const date = (value?: string | null) => value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";
const score = (item: { creatorValidationScore?: number | null; validationScore?: number | null }) => item.creatorValidationScore ?? item.validationScore ?? "—";
const errorText = (error: unknown) => error instanceof Error ? error.message : "Đã có lỗi xảy ra.";

function StatusBadge({ status }: { status: AdminMarketplaceStatus }) { const style: Record<string, string> = { PENDING_REVIEW: "border-amber-200 bg-amber-50 text-amber-800 before:bg-amber-500", PUBLISHED: "border-emerald-200 bg-emerald-50 text-emerald-700 before:bg-emerald-500", REJECTED: "border-rose-200 bg-rose-50 text-rose-700 before:bg-rose-500", SUSPENDED: "border-slate-200 bg-slate-100 text-slate-700 before:bg-slate-500", DRAFT: "border-slate-200 bg-white text-slate-600 before:bg-slate-400" }; const label: Record<string, string> = { PENDING_REVIEW: "Chờ duyệt", PUBLISHED: "Đã xuất bản", REJECTED: "Từ chối", SUSPENDED: "Tạm ngưng", DRAFT: "Bản nháp" }; return <span className={`inline-flex whitespace-nowrap items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold before:h-1.5 before:w-1.5 before:rounded-full ${style[status] || style.DRAFT}`}>{label[status] || status}</span>; }
function SkeletonRows() { return <div className="space-y-3 rounded-[1.75rem] border border-white bg-white/75 p-4 shadow-[0_18px_50px_rgba(71,50,35,0.05)]">{[1, 2, 3, 4].map(i => <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100/80" />)}</div>; }
function ErrorState({ retry }: { retry: () => void }) { return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center"><CircleAlert className="mx-auto h-6 w-6 text-rose-600" /><p className="mt-2 text-sm font-bold text-rose-900">Không thể tải dữ liệu</p><button onClick={retry} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#FF6B00] px-4 py-2 text-sm font-bold text-white"><RefreshCw className="h-4 w-4" />Thử lại</button></div>; }

function ReviewDialog({ action, note, setNote, busy, close, confirm }: { action: "PUBLISHED" | "REJECTED" | "SUSPENDED"; note: string; setNote: (value: string) => void; busy: boolean; close: () => void; confirm: () => void }) { const content = action === "PUBLISHED" ? ["Xuất bản Quiz Pack?", "Pack sẽ hiển thị và có thể mua trong Marketplace."] : action === "REJECTED" ? ["Từ chối Quiz Pack?", "Creator sẽ nhìn thấy ghi chú duyệt của bạn."] : ["Tạm ngừng bán Quiz Pack?", "Các lượt mua mới sẽ dừng ngay lập tức."]; const label = action === "PUBLISHED" ? "Xuất bản" : action === "REJECTED" ? "Từ chối" : "Tạm ngừng"; return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><h2 className="text-lg font-black">{content[0]}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{content[1]}</p><label className="mt-5 block text-sm font-bold text-slate-700">Ghi chú duyệt {action === "REJECTED" && <span className="text-rose-600">*</span>}<textarea value={note} maxLength={5000} onChange={event => setNote(event.target.value)} placeholder={action === "REJECTED" ? "Nêu rõ lý do từ chối" : "Không bắt buộc"} className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal outline-none focus:border-[#FF6B00]" /><span className="mt-1 block text-right text-xs font-normal text-slate-400">{note.length}/5000</span></label><div className="mt-5 flex justify-end gap-3"><button onClick={close} disabled={busy} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold">Hủy</button><button onClick={confirm} disabled={busy || (action === "REJECTED" && !note.trim())} className={`inline-flex min-w-28 justify-center rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 ${action === "PUBLISHED" ? "bg-emerald-600" : action === "REJECTED" ? "bg-rose-600" : "bg-slate-700"}`}>{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : label}</button></div></div></div>; }

export default function MarketplaceAdmin() {
  const { itemId: routeItemId } = useParams();
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>();

  // When this page is rendered as an Admin Dashboard tab, keep review navigation
  // inside that tab instead of replacing the dashboard shell with a route change.
  useEffect(() => {
    if (routeItemId) return;
    const interceptDashboardNavigation = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const reviewLink = target?.closest<HTMLAnchorElement>('a[href^="/admin/marketplace/"]');
      const itemId = reviewLink?.getAttribute("href")?.split("/").pop();
      if (itemId) {
        event.preventDefault();
        event.stopPropagation();
        setSelectedItemId(itemId);
        return;
      }
      const backButton = target?.closest("button");
      if (backButton?.textContent?.trim() === "Duyệt Quiz Pack") {
        event.preventDefault();
        event.stopPropagation();
        setSelectedItemId(undefined);
      }
    };
    document.addEventListener("click", interceptDashboardNavigation, true);
    return () => document.removeEventListener("click", interceptDashboardNavigation, true);
  }, [routeItemId]);

  const activeItemId = routeItemId ?? selectedItemId;
  return activeItemId ? <MarketplaceReviewDetail itemId={activeItemId} /> : <MarketplaceReviewList />;
}

function MarketplaceReviewListLegacy() { const [items, setItems] = useState<AdminMarketplaceListItem[]>([]); const [loading, setLoading] = useState(true); const [failed, setFailed] = useState(false); const load = useCallback(async () => { setLoading(true); setFailed(false); try { setItems(await getMarketplaceItems()); } catch { setFailed(true); } finally { setLoading(false); } }, []); useEffect(() => { void load(); }, [load]); return <div className="p-4 sm:p-7"><div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#FF6B00]">Marketplace moderation</p><h1 className="mt-1 text-2xl font-black text-slate-900">Duyệt Quiz Pack</h1><p className="mt-2 text-sm text-slate-500">Kiểm tra nội dung, kết quả validation và quyết định xuất bản.</p></div><button onClick={load} disabled={loading} className="inline-flex w-fit items-center gap-2 rounded-xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-bold text-[#FF6B00] hover:bg-orange-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Làm mới</button></div><div className="mt-6 flex items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3"><ShieldCheck className="h-5 w-5 text-[#FF6B00]" /><span className="text-sm font-semibold text-orange-950">{items.length} Quiz Pack đang chờ duyệt</span></div><section className="mt-5">{loading ? <SkeletonRows /> : failed ? <ErrorState retry={load} /> : items.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">Hiện không có Quiz Pack nào chờ duyệt.</div> : <><div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white lg:block"><table className="w-full min-w-[1000px] text-left text-sm"><thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500"><tr>{["Quiz Pack", "Môn học", "Coin", "Chương / Quiz / Câu", "Validation", "Ngày tạo", "Trạng thái", ""].map(label => <th key={label} className="px-4 py-3">{label}</th>)}</tr></thead><tbody>{items.map(item => <tr key={item.itemId} className="border-t border-slate-100"><td className="px-4 py-4"><p className="font-bold text-slate-900">{item.title}</p><p className="mt-1 text-xs text-slate-500">{item.creatorName || "—"}{item.sourceWorkspaceName ? ` · ${item.sourceWorkspaceName}` : ""}</p></td><td className="px-4 py-4">{item.subject}</td><td className="px-4 py-4 font-semibold">{item.priceCoins}</td><td className="px-4 py-4">{item.chapterCount} / {item.quizCount} / {item.questionCount}</td><td className="px-4 py-4 font-bold">{score(item)}</td><td className="px-4 py-4 text-slate-500">{date(item.createdAt)}</td><td className="px-4 py-4"><StatusBadge status={item.status} /></td><td className="px-4 py-4"><Link to={`/admin/marketplace/${item.itemId}`} className="inline-flex items-center gap-1 font-bold text-[#FF6B00]">Xem duyệt <ChevronRight className="h-4 w-4" /></Link></td></tr>)}</tbody></table></div><div className="grid gap-3 lg:hidden">{items.map(item => <article key={item.itemId} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="font-black">{item.title}</h2><p className="mt-1 text-sm text-slate-500">{item.creatorName || "—"}</p></div><StatusBadge status={item.status} /></div><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-slate-500">Môn học</dt><dd>{item.subject}</dd></div><div><dt className="text-slate-500">Giá Coin</dt><dd>{item.priceCoins}</dd></div><div><dt className="text-slate-500">Validation</dt><dd className="font-bold">{score(item)}</dd></div><div><dt className="text-slate-500">Nội dung</dt><dd>{item.chapterCount}/{item.quizCount}/{item.questionCount}</dd></div></dl><Link to={`/admin/marketplace/${item.itemId}`} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-orange-200 py-2.5 text-sm font-bold text-[#FF6B00]">Xem duyệt <Eye className="h-4 w-4" /></Link></article>)}</div></>}</section></div></div>; }

const ADMIN_STATUS_TABS: Array<{ status: AdminMarketplaceStatus; label: string; empty: string }> = [
  { status: "PENDING_REVIEW", label: "Chờ duyệt", empty: "Hiện không có Quiz Pack nào chờ duyệt." },
  { status: "PUBLISHED", label: "Đã xuất bản", empty: "Hiện không có Quiz Pack đã xuất bản." },
  { status: "SUSPENDED", label: "Tạm ngừng", empty: "Hiện không có Quiz Pack tạm ngừng." },
  { status: "DRAFT", label: "Bản nháp", empty: "Hiện không có Quiz Pack bản nháp." },
];

function MarketplaceReviewList() {
  const [status, setStatus] = useState<AdminMarketplaceStatus>("PENDING_REVIEW");
  const [items, setItems] = useState<AdminMarketplaceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const activeTab = ADMIN_STATUS_TABS.find(tab => tab.status === status) ?? ADMIN_STATUS_TABS[0];
  const load = useCallback(async () => { setLoading(true); setFailed(false); try { setItems(await getMarketplaceItems(status)); } catch { setFailed(true); } finally { setLoading(false); } }, [status]);
  useEffect(() => { void load(); }, [load]);

  return <div className="relative isolate min-h-full overflow-hidden bg-[#F7F8FA] p-4 sm:p-7" data-marketplace-review-list>
    <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_12%_5%,rgba(255,237,223,0.78),transparent_28%),radial-gradient(circle_at_92%_18%,rgba(255,246,234,0.75),transparent_25%)]" />
    <div className="pointer-events-none absolute inset-0 -z-10 opacity-20 [background-image:radial-gradient(rgba(255,107,0,0.18)_1px,transparent_1px)] [background-size:30px_30px] [mask-image:linear-gradient(to_bottom,black,transparent_48%)]" />
    <style>{`
      @media (min-width: 1024px) {
        [data-marketplace-review-list] table { min-width: 1280px; }
        [data-marketplace-review-list] table th,
        [data-marketplace-review-list] table td { white-space: nowrap; }
      }
    `}</style>
    <div className="mx-auto max-w-7xl">
      <section className="relative overflow-hidden rounded-[2rem] border border-white bg-white/85 p-6 shadow-[0_22px_65px_rgba(71,50,35,0.07)] backdrop-blur-xl sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-orange-100/60 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-start gap-4">
            <span className="hidden h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-50 text-[#FF6B00] ring-1 ring-orange-100 sm:grid"><ShieldCheck className="h-6 w-6" /></span>
            <div><div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#FF6B00]"><Sparkles className="h-3 w-3" />Marketplace moderation</div><h1 className="mt-2 text-2xl font-black tracking-[-0.025em] text-slate-950 sm:text-3xl">Duyệt Quiz Pack</h1><p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Kiểm tra nội dung, điểm Validation và trạng thái xuất bản tại một nơi.</p></div>
          </div>
          <button onClick={load} disabled={loading} className="inline-flex h-11 w-fit items-center gap-2 rounded-xl border border-orange-200 bg-white px-4 text-sm font-bold text-[#FF6B00] shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-50 hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Làm mới</button>
        </div>
        <div className="relative mt-7 flex gap-2 overflow-x-auto rounded-2xl bg-slate-100/75 p-1.5">{ADMIN_STATUS_TABS.map(tab => <button key={tab.status} type="button" onClick={() => setStatus(tab.status)} className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${status === tab.status ? "bg-white text-[#FF6B00] shadow-sm ring-1 ring-slate-200/70" : "text-slate-500 hover:bg-white/60 hover:text-slate-800"}`}>{tab.label}</button>)}</div>
      </section>

      <section className="mt-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-bold text-slate-400">TRẠNG THÁI HIỆN TẠI</p><h2 className="mt-1 text-lg font-black text-slate-900">{activeTab.label}</h2></div>
          {!loading && !failed && <div className="inline-flex w-fit items-center gap-2 rounded-full border border-orange-100 bg-orange-50/80 px-3.5 py-2 text-xs font-bold text-orange-950"><span className="tabular-nums text-[#FF6B00]">{items.length}</span> Quiz Pack</div>}
        </div>

        {loading ? <SkeletonRows /> : failed ? <ErrorState retry={load} /> : items.length === 0 ? <div className="relative overflow-hidden rounded-[2rem] border border-orange-100 bg-white/80 px-6 py-14 text-center shadow-[0_20px_55px_rgba(71,50,35,0.06)] backdrop-blur sm:py-16"><div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-orange-50/85 to-transparent" /><div className="pointer-events-none absolute left-1/2 top-4 h-40 w-40 -translate-x-1/2 rounded-full bg-orange-100/70 blur-3xl" /><div className="relative mx-auto grid h-16 w-16 place-items-center rounded-[1.35rem] border border-orange-200/70 bg-white text-[#FF6B00] shadow-[0_10px_28px_rgba(255,107,0,0.12)]"><PackageCheck className="h-7 w-7" /></div><h3 className="relative mt-5 text-xl font-black tracking-[-0.02em] text-slate-950">Danh sách đã được xử lý</h3><p className="relative mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{activeTab.empty} Khi có thay đổi mới, danh sách sẽ được cập nhật tại đây.</p><button onClick={load} className="relative mt-6 inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm transition hover:border-orange-200 hover:text-[#FF6B00]"><RefreshCw className="h-3.5 w-3.5" />Kiểm tra lại</button></div> : <>
          <div className="hidden overflow-hidden rounded-[1.75rem] border border-white bg-white/90 shadow-[0_18px_55px_rgba(71,50,35,0.07)] lg:block"><div className="overflow-x-auto"><table className="w-full min-w-[1120px] text-left text-sm"><thead className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400"><tr>{["Quiz Pack", "Môn học", "Giá", "Nội dung", "Validation", "Quality", "Ngày tạo", "Trạng thái", ""].map(label => <th key={label} className="px-5 py-4">{label}</th>)}</tr></thead><tbody>{items.map(item => <tr key={item.itemId} className="border-b border-slate-100 last:border-0 transition hover:bg-orange-50/30"><td className="px-5 py-5"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-50 text-[#FF6B00]"><PackageCheck className="h-4 w-4" /></span><div><p className="font-black text-slate-950">{item.title}</p><p className="mt-1 text-xs text-slate-500">{item.creatorName || "—"}{item.sourceWorkspaceName ? ` · ${item.sourceWorkspaceName}` : ""}</p>{item.status === "DRAFT" && item.reviewNote && <p className="mt-2 max-w-sm text-xs font-semibold leading-5 text-amber-800">Admin yêu cầu chỉnh sửa: {item.reviewNote}</p>}</div></div></td><td className="px-5 py-5 font-semibold text-slate-700">{item.subject}</td><td className="px-5 py-5"><span className="inline-flex items-center gap-1 font-bold text-amber-700"><Coins className="h-3.5 w-3.5" />{item.priceCoins}</span></td><td className="px-5 py-5 text-xs font-semibold text-slate-600">{item.chapterCount} chương · {item.quizCount} quiz · {item.questionCount} câu</td><td className="px-5 py-5"><span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-black text-slate-800">{score(item)}</span></td><td className="px-5 py-5"><QualityStatusBadge status={item.qualityStatus} currentSnapshot={item.qualityCurrent} /></td><td className="px-5 py-5 text-xs text-slate-500">{date(item.createdAt)}</td><td className="px-5 py-5"><StatusBadge status={item.status} /></td><td className="px-5 py-5"><Link to={`/admin/marketplace/${item.itemId}`} className="inline-flex h-9 items-center gap-1 rounded-xl border border-orange-200 bg-white px-3 text-xs font-bold text-[#FF6B00] transition hover:bg-orange-50">Xem duyệt <ChevronRight className="h-3.5 w-3.5" /></Link></td></tr>)}</tbody></table></div></div>
          <div className="grid gap-4 lg:hidden">{items.map(item => <article key={item.itemId} className="rounded-[1.5rem] border border-white bg-white/90 p-5 shadow-[0_14px_40px_rgba(71,50,35,0.06)]"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-50 text-[#FF6B00]"><PackageCheck className="h-4 w-4" /></span><div className="min-w-0"><h2 className="truncate font-black text-slate-950">{item.title}</h2><p className="mt-1 truncate text-xs text-slate-500">{item.creatorName || "—"}</p></div></div><StatusBadge status={item.status} /></div><div className="mt-4"><QualityStatusBadge status={item.qualityStatus} currentSnapshot={item.qualityCurrent} /></div>{item.status === "DRAFT" && item.reviewNote && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm leading-5 text-amber-950"><b>Admin yêu cầu chỉnh sửa:</b> {item.reviewNote}</p>}<dl className="mt-5 grid grid-cols-2 gap-3 text-xs"><div className="rounded-xl bg-slate-50 p-3"><dt className="text-slate-400">Môn học</dt><dd className="mt-1 font-bold text-slate-800">{item.subject}</dd></div><div className="rounded-xl bg-slate-50 p-3"><dt className="text-slate-400">Giá Coin</dt><dd className="mt-1 font-bold text-slate-800">{item.priceCoins}</dd></div><div className="rounded-xl bg-slate-50 p-3"><dt className="text-slate-400">Validation</dt><dd className="mt-1 font-black text-slate-800">{score(item)}</dd></div><div className="rounded-xl bg-slate-50 p-3"><dt className="text-slate-400">Nội dung</dt><dd className="mt-1 font-bold text-slate-800">{item.chapterCount}/{item.quizCount}/{item.questionCount}</dd></div></dl><Link to={`/admin/marketplace/${item.itemId}`} className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-xs font-bold text-white transition hover:bg-[#FF6B00]">Xem nội dung <Eye className="h-4 w-4" /></Link></article>)}</div>
        </>}
      </section>
    </div>
  </div>;
}

function ReviewMetric({ label, value, tone = "slate" }: { label: string; value: string | number; tone?: "orange" | "emerald" | "slate" }) {
  const toneClass = tone === "orange" ? "bg-orange-50 text-[#D85B00] ring-orange-100" : tone === "emerald" ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : "bg-slate-50 text-slate-700 ring-slate-100";
  return <div className={`rounded-2xl p-4 ring-1 ${toneClass}`}><p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-65">{label}</p><p className="mt-2 text-sm font-black leading-5">{value}</p></div>;
}

function ChapterPanel({ chapter, index }: { chapter: AdminMarketplaceChapter; index: number }) {
  const quizzes = chapter.quizzes?.length ? chapter.quizzes : [{ quizId: chapter.chapterId, title: `Quiz chương ${index + 1}`, questions: chapter.questions ?? [] }];
  const questionCount = quizzes.reduce((total, quiz) => total + quiz.questions.length, 0);

  return <details className="group overflow-hidden rounded-[1.5rem] border border-white bg-white/90 shadow-[0_12px_36px_rgba(71,50,35,0.05)] transition hover:shadow-[0_16px_40px_rgba(71,50,35,0.08)]">
    <summary className="flex cursor-pointer list-none items-center gap-4 p-4 sm:p-5">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-orange-50 text-sm font-black text-[#FF6B00] ring-1 ring-orange-100">{String(chapter.sequenceNo ?? index + 1).padStart(2, "0")}</span>
      <div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#FF6B00]">Chương {chapter.sequenceNo ?? index + 1}</p><h3 className="mt-1 truncate text-sm font-black text-slate-950 sm:text-base">{chapter.title}</h3></div>
      <span className="hidden rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 sm:inline">{quizzes.length} quiz · {questionCount} câu</span>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-400 transition group-open:rotate-90 group-open:bg-orange-50 group-open:text-[#FF6B00]"><ChevronRight className="h-4 w-4" /></span>
    </summary>
    <div className="border-t border-slate-100 px-4 pb-5 pt-4 sm:px-5">
      {chapter.summary && <p className="rounded-xl border border-orange-100 bg-orange-50/60 px-4 py-3 text-sm leading-6 text-slate-600">{chapter.summary}</p>}
      <div className="mt-4 space-y-4">{quizzes.map(quiz => <section key={quiz.quizId} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 sm:p-4"><div className="flex items-center justify-between gap-3"><h4 className="font-bold text-slate-900">{quiz.title}</h4><span className="shrink-0 text-xs font-bold text-slate-400">{quiz.questions.length} câu</span></div><div className="mt-3 space-y-3">{quiz.questions.map((question, questionIndex) => <article key={question.questionId} className="rounded-xl border border-slate-100 bg-white p-4"><div className="flex items-start gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-slate-100 text-[10px] font-black text-slate-500">{questionIndex + 1}</span><div className="min-w-0 flex-1"><p className="font-semibold leading-6 text-slate-900">{question.question}</p>{question.type && <span className="mt-2 inline-flex rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">{question.type}</span>}</div></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{question.options.map(option => <div key={option.optionId} className={`rounded-xl border px-3 py-2 text-sm ${option.correct ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-slate-100 bg-slate-50/70 text-slate-600"}`}><span>{option.label && <b className="mr-2">{option.label}.</b>}{option.text}</span>{option.correct && <span className="mt-1 block text-[10px] font-black uppercase tracking-wide text-emerald-700">Đáp án đúng</span>}</div>)}</div>{question.explanation && <p className="mt-3 border-l-2 border-orange-200 pl-3 text-sm leading-6 text-slate-600"><b className="text-slate-800">Giải thích:</b> {question.explanation}</p>}{question.evidence && <details className="mt-3 rounded-xl border border-sky-100 bg-sky-50/60"><summary className="cursor-pointer px-3 py-2 text-xs font-black text-sky-800">Bằng chứng nguồn</summary><div className="border-t border-sky-100 px-3 py-3 text-xs leading-5 text-slate-600">{question.evidence.sourceStepId && <p><b>Step:</b> <span className="break-all">{question.evidence.sourceStepId}</span></p>}{question.evidence.sourceChunkIds.length > 0 && <p className="mt-1"><b>Chunks:</b> {question.evidence.sourceChunkIds.join(", ")}</p>}{question.evidence.explanation && <p className="mt-1"><b>Đối chiếu:</b> {question.evidence.explanation}</p>}</div></details>}</article>)}</div></section>)}</div>
    </div>
  </details>;
}

function MarketplaceReviewDetail({ itemId }: { itemId: string }) {
  const navigate = useNavigate();
  const [item, setItem] = useState<AdminMarketplaceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [action, setAction] = useState<"PUBLISHED" | "REJECTED" | "SUSPENDED" | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [queuingQuality, setQueuingQuality] = useState(false);
  const load = useCallback(async () => { setLoading(true); setFailed(false); try { const detail = await getMarketplaceReviewDetail(itemId); setItem(detail); setNote(detail.reviewNote || ""); } catch { setFailed(true); } finally { setLoading(false); } }, [itemId]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (item?.qualityJob?.status !== "QUEUED" && item?.qualityJob?.status !== "RUNNING") return;
    const timer = window.setTimeout(() => void load(), 3000);
    return () => window.clearTimeout(timer);
  }, [item?.qualityJob?.status, item?.qualityJob?.jobId, load]);
  const publishReady = isQualityReady(item?.qualityJob?.status, item?.qualityJob?.currentSnapshot);
  const queueQuality = async () => { if (!item) return; setQueuingQuality(true); try { await queueAdminMarketplaceQuality(item.itemId); toast.success("Đã xếp lịch kiểm định chất lượng."); await load(); } catch (error) { toast.error(errorText(error)); await load(); } finally { setQueuingQuality(false); } };
  const decide = async () => { if (!action || !item) return; if (action === "PUBLISHED" && !publishReady) { toast.error("Quiz Pack chưa đạt kiểm định chất lượng hiện hành."); setAction(null); await load(); return; } setSaving(true); try { await updateMarketplaceReviewStatus(item.itemId, { status: action, reviewNote: note.trim() || undefined }); toast.success(action === "PUBLISHED" ? "Đã xuất bản Quiz Pack." : action === "REJECTED" ? "Đã từ chối Quiz Pack." : "Đã tạm ngừng bán Quiz Pack."); setAction(null); await load(); } catch (error) { toast.error(errorText(error)); setAction(null); await load(); } finally { setSaving(false); } };

  if (loading) return <div className="p-7"><SkeletonRows /></div>;
  if (failed || !item) return <div className="p-7"><ErrorState retry={load} /></div>;

  const actions = item.status === "PENDING_REVIEW" ? <><button onClick={() => setAction("PUBLISHED")} disabled={!publishReady} title={publishReady ? undefined : "Cần kết quả kiểm định PASSED trên snapshot hiện tại"} className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"><CheckCircle2 className="mr-2 h-4 w-4" />Phê duyệt & xuất bản</button>{!publishReady && <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-900">Cần kết quả kiểm định đạt trên snapshot hiện tại trước khi xuất bản.</p>}<button onClick={() => setAction("REJECTED")} className="inline-flex h-11 items-center justify-center rounded-xl border border-rose-200 bg-white px-4 text-sm font-bold text-rose-700 transition hover:border-rose-300 hover:bg-rose-50"><XCircle className="mr-2 h-4 w-4" />Từ chối</button></> : item.status === "PUBLISHED" ? <button onClick={() => setAction("SUSPENDED")} className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-700 hover:shadow-md active:translate-y-0"><AlertTriangle className="mr-2 h-4 w-4" />Tạm ngừng bán</button> : null;

  return <div className="relative isolate min-h-full overflow-hidden bg-[#F7F8FA] p-4 sm:p-7">
    <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_8%_6%,rgba(255,237,223,0.9),transparent_29%),radial-gradient(circle_at_95%_13%,rgba(255,246,234,0.85),transparent_24%)]" />
    <div className="pointer-events-none absolute inset-0 -z-10 opacity-20 [background-image:radial-gradient(rgba(255,107,0,0.18)_1px,transparent_1px)] [background-size:30px_30px] [mask-image:linear-gradient(to_bottom,black,transparent_42%)]" />
    <div className="mx-auto max-w-7xl">
      <button onClick={() => navigate("/admin/marketplace")} className="inline-flex h-9 items-center gap-1 rounded-lg px-1 text-sm font-bold text-[#FF6B00] transition hover:bg-orange-50 hover:px-2"><ChevronLeft className="h-4 w-4" />Duyệt Quiz Pack</button>

      <section className="relative mt-3 overflow-hidden rounded-[2rem] border border-white bg-white/90 p-6 shadow-[0_22px_65px_rgba(71,50,35,0.07)] backdrop-blur-xl sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-orange-100/70 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl"><div className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#FF6B00]"><PackageCheck className="h-3.5 w-3.5" />Quiz Pack review</div><div className="mt-4 flex flex-wrap items-center gap-3"><h1 className="text-2xl font-black tracking-[-0.03em] text-slate-950 sm:text-3xl">{item.title}</h1><StatusBadge status={item.status} /></div><p className="mt-3 text-sm leading-6 text-slate-500">Tạo bởi <span className="font-bold text-slate-700">{item.creatorName || "—"}</span> · {date(item.createdAt)}</p></div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white/80 px-4 py-3 shadow-sm"><span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-[#FF6B00]"><ShieldCheck className="h-5 w-5" /></span><div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Validation score</p><p className="mt-1 text-lg font-black text-slate-950">{score(item)}</p></div></div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <main className="min-w-0 space-y-6">
          <section className="rounded-[1.75rem] border border-white bg-white/90 p-5 shadow-[0_16px_45px_rgba(71,50,35,0.06)] sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#FF6B00]">Tổng quan</p><h2 className="mt-1 text-xl font-black tracking-[-0.02em] text-slate-950">Thông tin Quiz Pack</h2></div><span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600"><PackageCheck className="h-3.5 w-3.5" />{item.subject}</span></div><p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-600">{item.description || "Chưa có mô tả cho Quiz Pack này."}</p><div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><ReviewMetric label="Giá bán" value={`${item.priceCoins} Coin`} tone="orange" /><ReviewMetric label="Nội dung" value={`${item.chapterCount} chương · ${item.quizCount} quiz`} /><ReviewMetric label="Câu hỏi" value={`${item.questionCount} câu`} /><ReviewMetric label="Creator" value={item.creatorName || "—"} tone="emerald" /></div>{item.creatorId && <p className="mt-4 text-xs text-slate-400">Creator ID: <span className="break-all font-semibold text-slate-500">{item.creatorId}</span></p>}{item.reviewNote && <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50/80 p-4 text-sm leading-6 text-amber-950"><p className="font-black">Ghi chú duyệt trước đó</p><p className="mt-1">{item.reviewNote}</p></div>}</section>

          <AdminQualityReviewPanel latest={item.qualityJob} history={item.qualityJobHistory} canQueue={item.status === "PENDING_REVIEW"} queuing={queuingQuality} onQueue={() => void queueQuality()} />

          <section><div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#FF6B00]">Nội dung</p><h2 className="mt-1 text-xl font-black tracking-[-0.02em] text-slate-950">Nội dung cần duyệt</h2></div><span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-500">{item.chapters.length} chương</span></div><p className="mt-2 text-sm leading-6 text-slate-500">Mở từng chương để kiểm tra quiz, câu hỏi, đáp án và phần giải thích.</p><div className="mt-4 space-y-3">{item.chapters.map((chapter, index) => <ChapterPanel key={chapter.chapterId} chapter={chapter} index={index} />)}</div></section>
        </main>

        <aside className="h-fit lg:sticky lg:top-6"><section className="overflow-hidden rounded-[1.75rem] border border-white bg-white/95 shadow-[0_18px_52px_rgba(71,50,35,0.08)]"><div className="bg-slate-950 px-5 py-5 text-white"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-orange-300">Moderation desk</p><h2 className="mt-1 text-lg font-black">Quyết định duyệt</h2><p className="mt-2 text-sm leading-6 text-slate-300">Chỉ hiển thị các chuyển trạng thái được backend cho phép.</p></div><div className="p-5"><div className="rounded-2xl bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Trạng thái hiện tại</p><div className="mt-2"><StatusBadge status={item.status} /></div></div><div className="mt-4 flex flex-col gap-2">{actions || <p className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-500">Không có hành động duyệt khả dụng cho trạng thái này.</p>}</div></div></section></aside>
      </div>
    </div>
    {action && <ReviewDialog action={action} note={note} setNote={setNote} busy={saving} close={() => setAction(null)} confirm={decide} />}
  </div>;
}

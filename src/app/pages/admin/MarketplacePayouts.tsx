import { useCallback, useEffect, useState, type FormEvent } from "react";
import { BanknoteArrowDown, CheckCircle2, CircleAlert, Clock3, LoaderCircle, RefreshCw, Send, XCircle } from "lucide-react";
import { toast } from "sonner";
import { approveMarketplacePayout, completeMarketplacePayout, getAdminMarketplacePayouts, rejectMarketplacePayout, startMarketplacePayoutProcessing } from "../../../api/admin";
import type { CreatorPayout, CreatorPayoutStatus } from "../../../api/marketplace";

const money = new Intl.NumberFormat("vi-VN");
const TABS: Array<{ value: CreatorPayoutStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "Tất cả" },
  { value: "REQUESTED", label: "Chờ duyệt" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "PROCESSING", label: "Đang chuyển" },
  { value: "COMPLETED", label: "Hoàn tất" },
  { value: "REJECTED", label: "Từ chối" },
  { value: "FAILED", label: "Lỗi" },
];
const STATUS: Record<CreatorPayoutStatus, { label: string; className: string }> = {
  REQUESTED: { label: "Chờ duyệt", className: "bg-amber-50 text-amber-800 ring-amber-200" },
  APPROVED: { label: "Đã duyệt", className: "bg-sky-50 text-sky-800 ring-sky-200" },
  PROCESSING: { label: "Đang chuyển khoản", className: "bg-violet-50 text-violet-800 ring-violet-200" },
  COMPLETED: { label: "Hoàn tất", className: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  REJECTED: { label: "Đã từ chối", className: "bg-rose-50 text-rose-800 ring-rose-200" },
  FAILED: { label: "Chuyển khoản lỗi", className: "bg-rose-50 text-rose-800 ring-rose-200" },
};

type Action = "complete" | "reject" | "fail" | null;

function date(value: string | null) {
  return value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Đã có lỗi xảy ra. Vui lòng thử lại.";
}

function ActionDialog({ action, payout, busy, close, submit }: { action: Exclude<Action, null>; payout: CreatorPayout; busy: boolean; close: () => void; submit: (primary: string, notes: string) => void }) {
  const [primary, setPrimary] = useState("");
  const [notes, setNotes] = useState("");
  const isComplete = action === "complete";
  const title = isComplete ? "Xác nhận đã chuyển khoản" : action === "reject" ? "Từ chối yêu cầu rút" : "Ghi nhận lỗi chuyển khoản";
  const primaryLabel = isComplete ? "Mã giao dịch ngân hàng" : "Lý do";

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!primary.trim()) return;
    submit(primary.trim(), notes.trim());
  };

  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4" role="dialog" aria-modal="true" aria-labelledby="payout-action-title"><form onSubmit={onSubmit} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><h2 id="payout-action-title" className="text-xl font-black text-slate-950">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{payout.creatorName} · {money.format(payout.requestedAmount)} Coin</p><label className="mt-5 block text-sm font-bold text-slate-700">{primaryLabel}<input autoFocus value={primary} onChange={event => setPrimary(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100" placeholder={isComplete ? "VD: FT260717001" : "Nêu rõ lý do để Creator biết"} /></label>{isComplete && <label className="mt-4 block text-sm font-bold text-slate-700">Ghi chú <span className="font-normal text-slate-400">(không bắt buộc)</span><textarea value={notes} onChange={event => setNotes(event.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 p-3 font-normal outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100" placeholder="Thông tin đối soát nội bộ" /></label>}<div className="mt-6 flex justify-end gap-3"><button type="button" disabled={busy} onClick={close} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700">Hủy</button><button type="submit" disabled={busy || !primary.trim()} className={`inline-flex min-w-28 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 ${isComplete ? "bg-emerald-600" : "bg-rose-600"}`}>{busy && <LoaderCircle className="h-4 w-4 animate-spin" />}{isComplete ? "Hoàn tất" : action === "reject" ? "Từ chối" : "Ghi nhận lỗi"}</button></div></form></div>;
}

export default function MarketplacePayouts() {
  const [status, setStatus] = useState<CreatorPayoutStatus | "ALL">("REQUESTED");
  const [payouts, setPayouts] = useState<CreatorPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ action: Exclude<Action, null>; payout: CreatorPayout } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      setPayouts(await getAdminMarketplacePayouts(status === "ALL" ? undefined : status));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { void load(); }, [load]);

  const transition = async (payout: CreatorPayout, operation: "approve" | "processing") => {
    setBusyId(payout.payoutId);
    try {
      if (operation === "approve") await approveMarketplacePayout(payout.payoutId);
      else await startMarketplacePayoutProcessing(payout.payoutId);
      toast.success(operation === "approve" ? "Đã duyệt yêu cầu rút tiền." : "Đã chuyển yêu cầu sang trạng thái đang chuyển khoản.");
      await load();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  const submitDialog = async (primary: string, notes: string) => {
    if (!dialog) return;
    const { action, payout } = dialog;
    setBusyId(payout.payoutId);
    try {
      if (action === "complete") await completeMarketplacePayout(payout.payoutId, primary, notes || undefined);
      else await rejectMarketplacePayout(payout.payoutId, primary, action === "fail");
      toast.success(action === "complete" ? "Đã hoàn tất yêu cầu rút tiền." : action === "reject" ? "Đã từ chối yêu cầu rút tiền." : "Đã ghi nhận lỗi chuyển khoản.");
      setDialog(null);
      await load();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  return <main className="min-h-full bg-[#F7F8FA] p-4 sm:p-7"><div className="mx-auto max-w-7xl"><section className="relative overflow-hidden rounded-[2rem] border border-orange-100 bg-white p-6 shadow-[0_18px_60px_rgba(255,107,0,0.07)] sm:p-8"><div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-orange-100/70 blur-3xl" /><div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#FF6B00]"><BanknoteArrowDown className="h-3.5 w-3.5" />Marketplace operations</span><h1 className="mt-4 text-3xl font-black tracking-[-0.035em] text-slate-950">Yêu cầu rút tiền</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Duyệt yêu cầu của Creator, đối chiếu QR nhận tiền và cập nhật trạng thái sau khi chuyển khoản.</p></div><button type="button" onClick={load} disabled={loading} className="inline-flex h-10 w-fit items-center gap-2 rounded-xl border border-orange-200 bg-white px-4 text-sm font-bold text-[#FF6B00] transition hover:bg-orange-50 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Làm mới</button></div><div className="relative mt-7 flex gap-2 overflow-x-auto rounded-2xl bg-slate-100 p-1.5">{TABS.map(tab => <button key={tab.value} type="button" onClick={() => setStatus(tab.value)} className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold transition ${status === tab.value ? "bg-white text-[#FF6B00] shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:bg-white/70 hover:text-slate-800"}`}>{tab.label}</button>)}</div></section>
    <section className="mt-6">{loading ? <div className="h-64 animate-pulse rounded-3xl bg-slate-200" /> : failed ? <div className="rounded-3xl border border-rose-100 bg-white p-10 text-center"><CircleAlert className="mx-auto h-9 w-9 text-rose-500" /><h2 className="mt-4 text-xl font-black">Không thể tải yêu cầu rút tiền</h2><button type="button" onClick={load} className="mt-5 rounded-xl bg-[#FF6B00] px-4 py-2.5 text-sm font-bold text-white">Thử lại</button></div> : payouts.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center"><Clock3 className="mx-auto h-10 w-10 text-slate-300" /><h2 className="mt-4 text-xl font-black text-slate-900">Chưa có yêu cầu phù hợp</h2><p className="mt-2 text-sm text-slate-500">Yêu cầu rút tiền của Creator sẽ xuất hiện ở đây.</p></div> : <div className="grid gap-4">{payouts.map(payout => { const statusMeta = STATUS[payout.status]; const busy = busyId === payout.payoutId; return <article key={payout.payoutId} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-black text-slate-950">{payout.creatorName}</h2><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${statusMeta.className}`}>{statusMeta.label}</span></div><p className="mt-1 truncate text-sm text-slate-500">{payout.creatorEmail}</p><div className="mt-4 grid gap-3 text-sm sm:grid-cols-3"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Yêu cầu</p><p className="mt-1 text-lg font-black text-[#D94E00]">{money.format(payout.requestedAmount)} Coin</p></div><div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Nhận tại</p><p className="mt-1 font-bold text-slate-800">{payout.bankName} · {payout.accountNumberMasked ?? "—"}</p><p className="mt-1 text-xs text-slate-500">{payout.accountHolder}</p></div><div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Tạo lúc</p><p className="mt-1 font-bold text-slate-800">{date(payout.createdAt)}</p></div></div>{payout.rejectionReason && <p className="mt-4 text-sm font-semibold text-rose-700">Lý do: {payout.rejectionReason}</p>}{payout.externalTransferReference && <p className="mt-4 text-sm text-slate-600">Mã giao dịch: <b>{payout.externalTransferReference}</b></p>}</div><div className="flex shrink-0 flex-wrap gap-2 lg:max-w-64 lg:justify-end">{payout.qrViewUrl && <a href={payout.qrViewUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:border-orange-200 hover:text-[#FF6B00]">Xem QR</a>}{payout.status === "REQUESTED" && <><button type="button" disabled={busy} onClick={() => transition(payout, "approve")} className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white disabled:opacity-50"><CheckCircle2 className="h-3.5 w-3.5" />Duyệt</button><button type="button" disabled={busy} onClick={() => setDialog({ action: "reject", payout })} className="inline-flex h-10 items-center gap-2 rounded-xl border border-rose-200 px-3 text-xs font-bold text-rose-700 disabled:opacity-50"><XCircle className="h-3.5 w-3.5" />Từ chối</button></>}{payout.status === "APPROVED" && <button type="button" disabled={busy} onClick={() => transition(payout, "processing")} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#FF6B00] px-3 text-xs font-bold text-white disabled:opacity-50"><Send className="h-3.5 w-3.5" />Bắt đầu chuyển</button>}{payout.status === "PROCESSING" && <><button type="button" disabled={busy} onClick={() => setDialog({ action: "complete", payout })} className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white disabled:opacity-50"><CheckCircle2 className="h-3.5 w-3.5" />Hoàn tất</button><button type="button" disabled={busy} onClick={() => setDialog({ action: "fail", payout })} className="inline-flex h-10 items-center gap-2 rounded-xl border border-rose-200 px-3 text-xs font-bold text-rose-700 disabled:opacity-50"><XCircle className="h-3.5 w-3.5" />Báo lỗi</button></>}</div></div></article>; })}</div>}</section></div>{dialog && <ActionDialog action={dialog.action} payout={dialog.payout} busy={busyId === dialog.payout.payoutId} close={() => setDialog(null)} submit={submitDialog} />}</main>;
}

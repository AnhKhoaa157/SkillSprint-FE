import { useCallback, useEffect, useMemo, useState } from "react";
import { Coins, History, LoaderCircle, Minus, Plus, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { adjustAdminWallet, getAdminWallet, type AdminWallet } from "../../../../api/admin/adminWalletService";

const numberFormat = new Intl.NumberFormat("vi-VN");

function transactionLabel(referenceType: string) {
  if (referenceType === "ADMIN_ADJUSTMENT") return "Điều chỉnh thủ công";
  if (referenceType === "COIN_TOP_UP") return "Nạp Coin qua SePay";
  if (referenceType === "MARKETPLACE_PURCHASE") return "Mua Quiz Pack";
  return referenceType;
}

export function CoinWalletAuditSection({ userId }: { userId: string }) {
  const [wallet, setWallet] = useState<AdminWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setWallet(await getAdminWallet(userId));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải ví Coin.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { void load(); }, [load]);

  const signedAmount = useMemo(() => Number(amount), [amount]);
  const canSubmit = Number.isInteger(signedAmount) && signedAmount !== 0 && reason.trim().length > 0 && reason.trim().length <= 500;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await adjustAdminWallet(userId, { amount: signedAmount, reason: reason.trim() });
      toast.success("Đã điều chỉnh ví Coin và lưu audit.");
      setModalOpen(false);
      setAmount("");
      setReason("");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể điều chỉnh ví Coin.");
    } finally {
      setSubmitting(false);
    }
  };

  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
      <div className="flex items-center gap-2"><Coins size={16} className="text-orange-500" /><div><h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Ví Coin</h3><p className="mt-1 text-xs text-slate-500">Điều chỉnh thủ công luôn yêu cầu lý do và được lưu audit.</p></div></div>
      <div className="flex items-center gap-2"><button type="button" onClick={() => void load()} disabled={loading} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50" aria-label="Làm mới ví Coin"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button><button type="button" onClick={() => setModalOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#FF6B00] px-3 text-xs font-bold text-white hover:bg-[#e85f00]"><Plus className="h-4 w-4" />Điều chỉnh Coin</button></div>
    </div>
    {loading ? <div className="grid min-h-28 place-items-center"><LoaderCircle className="h-5 w-5 animate-spin text-orange-500" /></div> : <><div className="mt-4 rounded-2xl bg-gradient-to-br from-violet-700 to-blue-600 p-5 text-white"><p className="text-[11px] font-bold tracking-wider text-violet-100">SỐ DƯ HIỆN TẠI</p><p className="mt-2 text-3xl font-black">{numberFormat.format(wallet?.balance ?? 0)} Coin</p></div><div className="mt-5"><div className="flex items-center gap-2"><History className="h-4 w-4 text-slate-400" /><h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">20 giao dịch gần nhất</h4></div><div className="mt-3 space-y-2">{wallet?.recentTransactions.length ? wallet.recentTransactions.map(entry => <div key={entry.transactionId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs"><div><p className="font-bold text-slate-800">{transactionLabel(entry.referenceType)}</p>{entry.adjustmentReason && <p className="mt-1 text-slate-500">{entry.adjustmentReason}</p>}{entry.adjustedByName && <p className="mt-1 text-[11px] text-slate-400">Thực hiện bởi {entry.adjustedByName}</p>}</div><div className="text-right"><p className={entry.direction === "CREDIT" ? "font-black text-emerald-700" : "font-black text-rose-700"}>{entry.direction === "CREDIT" ? "+" : "−"}{numberFormat.format(entry.amount)} Coin</p><p className="mt-1 text-[11px] text-slate-400">Số dư: {numberFormat.format(entry.balanceAfter)}</p></div></div>) : <p className="rounded-xl border border-dashed border-slate-200 px-4 py-5 text-center text-xs text-slate-500">Chưa có giao dịch Coin.</p>}</div></div></>}
    {modalOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4" role="dialog" aria-modal="true" aria-labelledby="wallet-adjustment-title"><div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h3 id="wallet-adjustment-title" className="text-lg font-black text-slate-900">Điều chỉnh Coin</h3><p className="mt-1 text-sm text-slate-500">Nhập số dương để cộng, số âm để trừ.</p></div><button type="button" onClick={() => setModalOpen(false)} disabled={submitting} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button></div><label className="mt-5 block text-sm font-bold text-slate-700">Số Coin<input type="number" step="1" value={amount} onChange={event => setAmount(event.target.value)} placeholder="Ví dụ: 100 hoặc -100" className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-orange-400" /></label><label className="mt-4 block text-sm font-bold text-slate-700">Lý do<textarea value={reason} onChange={event => setReason(event.target.value)} maxLength={500} rows={3} placeholder="Ví dụ: Hỗ trợ do lỗi thanh toán" className="mt-2 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-orange-400" /></label><p className="mt-2 text-xs text-slate-400">{reason.trim().length}/500 ký tự</p><button type="button" onClick={() => void submit()} disabled={!canSubmit || submitting} className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B00] text-sm font-black text-white hover:bg-[#e85f00] disabled:cursor-not-allowed disabled:opacity-50">{submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : signedAmount > 0 ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}{submitting ? "Đang lưu..." : "Xác nhận điều chỉnh"}</button></div></div>}
  </section>;
}

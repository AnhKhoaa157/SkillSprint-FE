import { useCallback, useEffect, useMemo, useState } from "react";
import { Coins, History, LoaderCircle, Minus, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { adjustAdminWallet, getAdminWallet, type AdminWallet } from "../../../../api/admin/adminWalletService";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../components/ui/dialog";

const numberFormat = new Intl.NumberFormat("vi-VN");

function transactionLabel(referenceType: string) {
  if (referenceType === "ADMIN_ADJUSTMENT") return "Điều chỉnh thủ công";
  if (referenceType === "COIN_TOP_UP") return "Nạp Coin qua SePay";
  if (referenceType === "MARKETPLACE_PURCHASE") return "Mua Quiz Pack";
  return referenceType;
}

export function CoinWalletAuditSection({ userId, canAdjust = false }: { userId: string; canAdjust?: boolean }) {
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

  useEffect(() => {
    void load();
  }, [load]);

  const signedAmount = useMemo(() => Number(amount), [amount]);
  const canSubmit = Number.isInteger(signedAmount) && signedAmount !== 0 && reason.trim().length > 0 && reason.trim().length <= 500;
  const projectedBalance = (wallet?.balance ?? 0) + (Number.isFinite(signedAmount) ? signedAmount : 0);
  const isCreditAdjustment = signedAmount > 0;

  const closeAdjustment = () => {
    if (submitting) return;
    setModalOpen(false);
  };

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

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <Coins size={16} className="text-orange-500" />
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Ví Coin</h3>
            <p className="mt-1 text-xs text-slate-500">
              {canAdjust ? "Điều chỉnh thủ công luôn yêu cầu lý do và được lưu audit." : "Theo dõi số dư và lịch sử giao dịch Coin."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => void load()} disabled={loading} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50" aria-label="Làm mới ví Coin">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          {canAdjust && <button type="button" onClick={() => setModalOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#FF6B00] px-3 text-xs font-bold text-white hover:bg-[#e85f00]"><Plus className="h-4 w-4" />Điều chỉnh Coin</button>}
        </div>
      </div>

      {loading ? (
        <div className="grid min-h-28 place-items-center"><LoaderCircle className="h-5 w-5 animate-spin text-orange-500" /></div>
      ) : (
        <>
          <div className="relative mt-4 overflow-hidden rounded-[1.5rem] border border-[#FFB77A] bg-[radial-gradient(circle_at_86%_12%,rgba(255,235,211,0.34),transparent_20%),radial-gradient(circle_at_28%_120%,rgba(255,200,126,0.24),transparent_40%),linear-gradient(110deg,#FF6B00_0%,#FF7C16_48%,#FF9A3C_100%)] p-5 text-white shadow-[0_16px_32px_rgba(255,107,0,0.2)]">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:30px_30px] [mask-image:linear-gradient(90deg,transparent,black_50%,transparent)]" />
            <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full border-[22px] border-white/15" />
            <div className="relative"><p className="text-[11px] font-bold tracking-[0.13em] text-white/75">SỐ DƯ HIỆN TẠI</p><p className="mt-2 text-3xl font-black tracking-[-0.04em] tabular-nums">{numberFormat.format(wallet?.balance ?? 0)} <span className="text-xl text-white/80">Coin</span></p></div>
          </div>
          <div className="mt-5">
            <div className="flex items-center gap-2"><History className="h-4 w-4 text-slate-400" /><h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">20 giao dịch gần nhất</h4></div>
            <div className="mt-3 space-y-2">
              {wallet?.recentTransactions.length ? wallet.recentTransactions.map(entry => <div key={entry.transactionId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs"><div><p className="font-bold text-slate-800">{transactionLabel(entry.referenceType)}</p>{entry.adjustmentReason && <p className="mt-1 text-slate-500">{entry.adjustmentReason}</p>}{entry.adjustedByName && <p className="mt-1 text-[11px] text-slate-400">Thực hiện bởi {entry.adjustedByName}</p>}</div><div className="text-right"><p className={entry.direction === "CREDIT" ? "font-black text-emerald-700" : "font-black text-rose-700"}>{entry.direction === "CREDIT" ? "+" : "−"}{numberFormat.format(entry.amount)} Coin</p><p className="mt-1 text-[11px] text-slate-400">Số dư: {numberFormat.format(entry.balanceAfter)}</p></div></div>) : <p className="rounded-xl border border-dashed border-slate-200 px-4 py-5 text-center text-xs text-slate-500">Chưa có giao dịch Coin.</p>}
            </div>
          </div>
        </>
      )}

      {canAdjust && modalOpen && (
        <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) closeAdjustment(); }}>
          <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-lg gap-0 overflow-y-auto rounded-[2rem] border-white/80 bg-white p-0 shadow-[0_28px_80px_rgba(15,23,42,0.32)] [&>button]:right-5 [&>button]:top-5 [&>button]:h-10 [&>button]:w-10 [&>button]:rounded-xl [&>button]:border [&>button]:border-slate-200 [&>button]:bg-white [&>button]:p-2 [&>button]:opacity-100 [&>button]:shadow-sm">
            <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,#FF6B00,#FF9A3C)]" />
            <div className="relative p-5 sm:p-7">
              <DialogHeader className="pr-12 text-left"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[linear-gradient(135deg,#FFF3E7,#FFE2C5)] text-[#FF6B00] shadow-[0_8px_18px_rgba(255,107,0,0.12)]"><Coins className="h-5 w-5" /></span><div><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-orange-600">Điều chỉnh có kiểm soát</p><DialogTitle className="mt-0.5 text-xl font-black tracking-[-0.03em] text-slate-950">Thay đổi số dư Coin</DialogTitle></div></div><DialogDescription className="sr-only">Cập nhật số dư Coin và lưu lý do điều chỉnh vào audit.</DialogDescription></DialogHeader>

              <div className="mt-5 grid gap-3 rounded-2xl border border-orange-100 bg-[linear-gradient(135deg,#FFF8F1,#FFFFFF)] p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div><p className="text-[10px] font-black uppercase tracking-[0.13em] text-orange-600">Số dư hiện tại</p><p className="mt-1 text-xl font-black tabular-nums text-slate-950">{numberFormat.format(wallet?.balance ?? 0)} <span className="text-sm text-slate-500">Coin</span></p></div>
                <p className="max-w-52 text-xs leading-5 text-slate-500">Nhập số dương để cộng, số âm để trừ. Mọi thay đổi đều được lưu audit.</p>
              </div>

              <div className="mt-5 space-y-4">
                <label className="block text-sm font-bold text-slate-700">Số Coin<input type="number" step="1" value={amount} onChange={event => setAmount(event.target.value)} placeholder="Ví dụ: 100 hoặc -100" className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 font-semibold tabular-nums text-slate-800 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100" /></label>
                <div className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 ${signedAmount === 0 ? "border-slate-200 bg-slate-50 text-slate-500" : isCreditAdjustment ? "border-emerald-100 bg-emerald-50 text-emerald-800" : "border-rose-100 bg-rose-50 text-rose-800"}`}>
                  <div className="flex items-center gap-2"><span className={`grid h-8 w-8 place-items-center rounded-xl ${signedAmount === 0 ? "bg-white text-slate-400" : isCreditAdjustment ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{isCreditAdjustment ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}</span><p className="text-xs font-bold">{signedAmount === 0 ? "Nhập số Coin để xem trước" : isCreditAdjustment ? "Cộng vào số dư" : "Trừ khỏi số dư"}</p></div>
                  <p className="text-right text-xs font-bold tabular-nums">{signedAmount === 0 ? "—" : `${isCreditAdjustment ? "+" : "−"}${numberFormat.format(Math.abs(signedAmount))} Coin`}<span className="mt-0.5 block text-[11px] font-medium opacity-70">Sau điều chỉnh: {numberFormat.format(projectedBalance)}</span></p>
                </div>
                <label className="block text-sm font-bold text-slate-700">Lý do<textarea value={reason} onChange={event => setReason(event.target.value)} maxLength={500} rows={3} placeholder="Ví dụ: Hỗ trợ do lỗi thanh toán" className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/60 p-4 font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100" /></label>
                <p className="text-right text-xs font-medium tabular-nums text-slate-400">{reason.trim().length}/500 ký tự</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:px-7">
              <button type="button" onClick={closeAdjustment} disabled={submitting} className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50">Hủy</button>
              <button type="button" onClick={() => void submit()} disabled={!canSubmit || submitting} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(105deg,#FF6B00_0%,#FF7C16_48%,#FF9A3C_100%)] px-4 text-sm font-black text-white shadow-[0_10px_20px_rgba(255,107,0,0.2)] transition hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none">{submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : signedAmount > 0 ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}{submitting ? "Đang lưu..." : "Xác nhận"}</button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}

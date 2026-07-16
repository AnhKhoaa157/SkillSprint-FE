import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { DollarSign, RefreshCw, X, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { getAdminPayments, reconcilePayment, type PaymentTransactionResponse } from "../../../../../api/admin/adminDashboardService";
import { AnimatePresence } from "motion/react";

/* ─────────────────────────────────────────────────────────
   ── PAYMENTS view ──
───────────────────────────────────────────────────────── */
const PAYMENT_STATUS_BADGE: Record<string, { bg: string; text: string; border: string; label: string }> = {
  PAID: { bg: "rgba(34,197,94,0.08)", text: "#15803D", border: "rgba(34,197,94,0.28)", label: "Thành công" },
  COMPLETED: { bg: "rgba(34,197,94,0.08)", text: "#15803D", border: "rgba(34,197,94,0.28)", label: "Hoàn thành" },
  PENDING: { bg: "rgba(245,158,11,0.10)", text: "#B45309", border: "rgba(245,158,11,0.28)", label: "Đang chờ" },
  FAILED: { bg: "rgba(239,68,68,0.10)", text: "#B91C1C", border: "rgba(239,68,68,0.28)", label: "Thất bại" },
  CANCELED: { bg: "#F3F4F6", text: "#6B7280", border: "#E5E7EB", label: "Đã hủy" },
  EXPIRED: { bg: "#F3F4F6", text: "#9CA3AF", border: "#E5E7EB", label: "Hết hạn" },
};

function paymentBadge(status: string) {
  return (
    PAYMENT_STATUS_BADGE[status.toUpperCase()] ?? {
      bg: "#F3F4F6", text: "#6B7280", border: "#E5E7EB", label: status,
    }
  );
}

const PLAN_LABEL: Record<string, string> = {
  FREE: "Free",
  SKILL_BUILDER: "Skill Builder",
  PREMIUM: "Premium",
};

const PAYMENTS_COLS = "2fr 1.2fr 1.2fr 1.4fr 1.3fr 1.5fr 1fr";

export function PaymentsView() {
  const [payments, setPayments] = useState<PaymentTransactionResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reconcilingId, setReconcilingId] = useState<string | null>(null);
  const [reconcileModalOpen, setReconcileModalOpen] = useState<PaymentTransactionResponse | null>(null);
  const [providerTransactionId, setProviderTransactionId] = useState("");
  const [providerReferenceCode, setProviderReferenceCode] = useState("");
  const [reconcileNote, setReconcileNote] = useState("");
  const PAGE_SIZE = 10;

  async function handleReconcile() {
    if (!reconcileModalOpen) return;
    if (!providerTransactionId.trim()) {
      toast.error("Cần nhập mã giao dịch SePay.");
      return;
    }
    setReconcilingId(reconcileModalOpen.paymentId);
    try {
      await reconcilePayment(reconcileModalOpen.paymentId, {
        providerTransactionId: providerTransactionId.trim(),
        providerReferenceCode: providerReferenceCode.trim() || undefined,
        note: reconcileNote.trim() || undefined,
      });
      toast.success("Đối soát giao dịch thành công");
      setReconcileModalOpen(null);
      setProviderTransactionId("");
      setProviderReferenceCode("");
      setReconcileNote("");
      void load(page);
    } catch (err: any) {
      toast.error(err?.message || "Đối soát thất bại");
    } finally {
      setReconcilingId(null);
    }
  }

  async function load(p: number) {
    setLoading(true);
    try {
      const result = await getAdminPayments(p, PAGE_SIZE);
      const items = result.items ?? (result as any).content ?? [];
      const total = result.totalItems ?? (result as any).totalElements ?? 0;
      const pages = result.totalPages ?? Math.ceil(total / PAGE_SIZE);
      setPayments(items);
      setTotalItems(total);
      setTotalPages(pages);
      setPage(p);
    } catch (err) {
      toast.error((err as Error).message || "Không tải được danh sách thanh toán");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(0); }, []);

  const formatVnd = (amount: number) =>
    amount >= 1_000_000
      ? `${(amount / 1_000_000).toFixed(1)}M ₫`
      : `${(amount / 1_000).toFixed(0)}K ₫`;

  const formatDate = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })
      : "—";

  const paymentLabel = (transaction: PaymentTransactionResponse) => transaction.purpose === "COIN_TOP_UP"
    ? `Nạp ${Number(transaction.coinAmount ?? 0).toLocaleString("vi-VN")} Coin`
    : PLAN_LABEL[transaction.plan ?? ""] ?? transaction.planName ?? "Gói dịch vụ";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

      {/* Header banner */}
      <div className="relative overflow-hidden rounded-[28px] border border-orange-100 bg-[linear-gradient(120deg,#ffffff_0%,#fffaf4_62%,#fff1df_100%)] p-5 shadow-[0_16px_36px_rgba(148,86,24,0.07)] sm:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-20 h-52 w-52 rounded-full border-[28px] border-orange-100/70" />
        <div aria-hidden="true" className="pointer-events-none absolute right-36 top-0 h-full w-px bg-gradient-to-b from-transparent via-orange-100 to-transparent" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-3.5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,#FF7A18,#F05A00)] text-white shadow-[0_10px_22px_rgba(255,107,0,0.23)]"><DollarSign size={21} /></span>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-orange-600">Payment control</p>
              <h2 className="mt-1 text-xl font-extrabold tracking-[-0.03em] text-slate-950">Quản lý thanh toán</h2>
              <p className="mt-1 text-sm text-slate-500">Theo dõi giao dịch và đối soát các thanh toán cần xử lý.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:min-w-[250px]">
            <div className="rounded-2xl border border-white/80 bg-white/75 px-3.5 py-3 shadow-[0_6px_16px_rgba(148,86,24,0.05)] backdrop-blur-sm"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Giao dịch</p><p className="mt-1 text-lg font-extrabold tabular-nums text-slate-900">{totalItems.toLocaleString()}</p></div>
            <div className="rounded-2xl border border-white/80 bg-white/75 px-3.5 py-3 shadow-[0_6px_16px_rgba(148,86,24,0.05)] backdrop-blur-sm"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Trang hiện tại</p><p className="mt-1 text-lg font-extrabold tabular-nums text-slate-900">{page + 1}<span className="text-sm text-slate-400"> / {totalPages || 1}</span></p></div>
          </div>
        </div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="overflow-x-auto rounded-[28px] border border-slate-200/80 bg-white shadow-[0_16px_36px_rgba(15,23,42,0.06)]">

        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-orange-600">Danh sách giao dịch</p><h3 className="mt-0.5 text-sm font-extrabold tracking-tight text-slate-900">Lịch sử thanh toán</h3></div>
          <span className="rounded-lg bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-700">{totalItems.toLocaleString()} bản ghi</span>
        </div>

        {/* Column headers */}
        <div className="grid min-w-[980px] border-b border-slate-100 bg-slate-50/80 px-6 py-3"
          style={{ gridTemplateColumns: PAYMENTS_COLS }}>
          {["Mã giao dịch", "Gói", "Số tiền", "Trạng thái", "Thanh toán lúc", "Tạo lúc", "Hành động"].map(col => (
            <span key={col}
              className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
              {col}
            </span>
          ))}
        </div>

        {/* Loading skeleton rows */}
        {loading && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="grid min-w-[980px] animate-pulse border-b border-slate-50 px-6 py-4"
            style={{ gridTemplateColumns: PAYMENTS_COLS, alignItems: "center" }}>
            {[0.8, 0.6, 0.5, 0.55, 0.6, 0.7].map((w, j) => (
              <div key={j} className="h-3 rounded" style={{ background: "#F3F4F6", width: `${w * 100}%` }} />
            ))}
          </div>
        ))}

        {/* Empty state */}
        {!loading && payments.length === 0 && (
          <div className="py-16 text-center">
            <DollarSign size={32} style={{ color: "#E5E7EB", margin: "0 auto 8px" }} />
            <p style={{ color: "#9CA3AF", fontSize: "0.85rem" }}>Không có giao dịch nào</p>
          </div>
        )}

        {/* Data rows */}
        {!loading && payments.map((tx, i) => {
          const badge = paymentBadge(tx.status);
          return (
            <motion.div key={tx.paymentId}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.025 }}
              className="grid min-w-[980px] border-b border-slate-50 px-6 py-4 transition-colors hover:bg-orange-50/35"
              style={{ gridTemplateColumns: PAYMENTS_COLS, alignItems: "center" }}>

              {/* Transaction ID */}
              <div>
                <p className="font-mono text-xs font-bold text-slate-800">
                  {tx.paymentId.slice(0, 8).toUpperCase()}…
                </p>
                {tx.paymentCode && (
                  <p className="mt-0.5 text-[10px] font-medium text-slate-400">{tx.paymentCode}</p>
                )}
              </div>

              {/* Plan */}
              <span className="text-xs font-semibold text-slate-700">
                {paymentLabel(tx)}
              </span>

              {/* Amount */}
              <span className="text-sm font-extrabold tabular-nums text-orange-600">
                {formatVnd(tx.amount)}
              </span>

              {/* Status badge */}
              <span className="inline-flex items-center px-2 py-0.5 rounded-full font-semibold"
                style={{ background: badge.bg, color: badge.text, border: `1px solid ${badge.border}`, fontSize: "10px", width: "fit-content" }}>
                {badge.label}
              </span>

              {/* Paid at */}
              <span className="text-[11px] font-medium tabular-nums text-slate-500">{formatDate(tx.paidAt)}</span>

              {/* Created at */}
              <span className="text-[11px] font-medium tabular-nums text-slate-400">{formatDate(tx.createdAt)}</span>

              {/* Action */}
              <div>
                {(tx.status === "FAILED" || tx.status === "PENDING") && (
                  <button
                    onClick={() => {
                      setReconcileModalOpen(tx);
                      setProviderTransactionId("");
                      setProviderReferenceCode("");
                      setReconcileNote("");
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-[0.98] bg-orange-50 text-[#FF6B00] border border-orange-200 hover:bg-orange-100 cursor-pointer"
                  >
                    <RefreshCw size={12} />
                    Đối soát
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Pagination footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-3.5">
          <span className="text-xs font-medium text-slate-500">
            Trang {page + 1} · {totalItems.toLocaleString()} giao dịch
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => load(Math.max(0, page - 1))}
              disabled={page === 0 || loading}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-orange-200 hover:text-orange-600 disabled:cursor-not-allowed"
              style={{
                opacity: page === 0 || loading ? 0.4 : 1,
              }}>
              ← Trước
            </button>
            <button
              onClick={() => load(page + 1)}
              disabled={page + 1 >= totalPages || loading}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-orange-200 hover:text-orange-600 disabled:cursor-not-allowed"
              style={{
                opacity: page + 1 >= totalPages || loading ? 0.4 : 1,
              }}>
              Tiếp →
            </button>
          </div>
        </div>
      </motion.div>

      {/* Reconcile Modal */}
      <AnimatePresence>
        {reconcileModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)" }}
            onClick={() => setReconcileModalOpen(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 6 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <RefreshCw size={18} className="text-[#FF6B00]" />
                  <h3 className="text-base font-black text-slate-800">Đối soát thanh toán</h3>
                </div>
                <button onClick={() => setReconcileModalOpen(null)} className="p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer">
                  <X size={16} className="text-slate-500" />
                </button>
              </div>

              <p className="text-sm text-slate-600 mb-6">
                Xác nhận giao dịch <strong>{reconcileModalOpen.paymentId.slice(0, 8).toUpperCase()}…</strong> sau khi đã kiểm tra sao kê ngân hàng.
              </p>

              <label className="block text-xs font-bold text-slate-700">Mã giao dịch SePay<input value={providerTransactionId} onChange={event => setProviderTransactionId(event.target.value)} className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-orange-400" placeholder="Bắt buộc" /></label>
              <label className="mt-3 block text-xs font-bold text-slate-700">Mã tham chiếu ngân hàng (tuỳ chọn)<input value={providerReferenceCode} onChange={event => setProviderReferenceCode(event.target.value)} className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-orange-400" /></label>
              <label className="mt-3 block text-xs font-bold text-slate-700">Ghi chú (tuỳ chọn)<textarea value={reconcileNote} onChange={event => setReconcileNote(event.target.value)} rows={2} className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-orange-400" /></label>

              <div className="flex gap-2">
                <button
                  onClick={() => setReconcileModalOpen(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={handleReconcile}
                  disabled={reconcilingId !== null}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition ${reconcilingId !== null ? "bg-orange-300 cursor-not-allowed" : "bg-[#FF6B00] hover:bg-[#E05E00] cursor-pointer"}`}
                >
                  {reconcilingId !== null ? <span className="flex items-center justify-center gap-1"><LoaderCircle size={14} className="animate-spin" /> Đang xử lý...</span> : "Đồng ý đối soát"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default PaymentsView;

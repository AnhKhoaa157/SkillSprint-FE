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
      <div className="rounded-2xl p-5"
        style={{ background: "linear-gradient(135deg,#FFFFFF 0%,#F8FAFC 100%)", border: "1px solid #E2E8F0" }}>
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#0F172A" }}>Quản lý thanh toán</h2>
            <p style={{ margin: "4px 0 0", color: "#64748B", fontSize: "0.88rem" }}>Lịch sử giao dịch · Phân tích thanh toán</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs"
              style={{ background: "#fff", border: "1px solid #E5E7EB", color: "#334155" }}>
              Tổng: {totalItems.toLocaleString()}
            </span>
            <span className="px-3 py-1 rounded-full text-xs"
              style={{ background: "#fff", border: "1px solid #E5E7EB", color: "#334155" }}>
              Trang: {page + 1} / {totalPages || 1}
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>

        {/* Column headers */}
        <div className="grid px-6 py-2.5"
          style={{ gridTemplateColumns: PAYMENTS_COLS, borderBottom: "1px solid #F3F4F6", background: "#FAFAFA" }}>
          {["Mã giao dịch", "Gói", "Số tiền", "Trạng thái", "Thanh toán lúc", "Tạo lúc", "Hành động"].map(col => (
            <span key={col}
              style={{ color: "#9CA3AF", fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {col}
            </span>
          ))}
        </div>

        {/* Loading skeleton rows */}
        {loading && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="grid px-6 py-4 animate-pulse"
            style={{ gridTemplateColumns: PAYMENTS_COLS, borderBottom: "1px solid #F9FAFB", alignItems: "center" }}>
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
              className="grid px-6 py-3.5"
              style={{ gridTemplateColumns: PAYMENTS_COLS, borderBottom: "1px solid #F9FAFB", alignItems: "center" }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "#F9FAFB"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}>

              {/* Transaction ID */}
              <div>
                <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "#111827", fontFamily: "monospace" }}>
                  {tx.paymentId.slice(0, 8).toUpperCase()}…
                </p>
                {tx.paymentCode && (
                  <p style={{ fontSize: "0.68rem", color: "#9CA3AF" }}>{tx.paymentCode}</p>
                )}
              </div>

              {/* Plan */}
              <span style={{ fontSize: "0.78rem", color: "#374151", fontWeight: 500 }}>
                {paymentLabel(tx)}
              </span>

              {/* Amount */}
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#16a34a" }}>
                {formatVnd(tx.amount)}
              </span>

              {/* Status badge */}
              <span className="inline-flex items-center px-2 py-0.5 rounded-full font-semibold"
                style={{ background: badge.bg, color: badge.text, border: `1px solid ${badge.border}`, fontSize: "10px", width: "fit-content" }}>
                {badge.label}
              </span>

              {/* Paid at */}
              <span style={{ fontSize: "0.72rem", color: "#6B7280" }}>{formatDate(tx.paidAt)}</span>

              {/* Created at */}
              <span style={{ fontSize: "0.72rem", color: "#9CA3AF" }}>{formatDate(tx.createdAt)}</span>

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
        <div className="px-6 py-3 flex items-center justify-between"
          style={{ borderTop: "1px solid #F3F4F6", background: "#FAFAFA" }}>
          <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
            Trang {page + 1} · {totalItems.toLocaleString()} giao dịch
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => load(Math.max(0, page - 1))}
              disabled={page === 0 || loading}
              className="px-3 py-1.5 rounded-lg text-xs"
              style={{
                border: "1px solid #E2E8F0", background: "#fff", color: "#334155",
                opacity: page === 0 || loading ? 0.4 : 1,
                cursor: page === 0 || loading ? "not-allowed" : "pointer",
              }}>
              ← Trước
            </button>
            <button
              onClick={() => load(page + 1)}
              disabled={page + 1 >= totalPages || loading}
              className="px-3 py-1.5 rounded-lg text-xs"
              style={{
                border: "1px solid #E2E8F0", background: "#fff", color: "#334155",
                opacity: page + 1 >= totalPages || loading ? 0.4 : 1,
                cursor: page + 1 >= totalPages || loading ? "not-allowed" : "pointer",
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

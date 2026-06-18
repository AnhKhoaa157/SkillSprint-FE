import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { X, Plus, Minus, Sparkles, Loader2 } from "lucide-react";

export type AdjustPointsModalProps = {
  isOpen: boolean;
  userName: string;
  onClose: () => void;
  /** Resolve to commit; reject to surface an error (caller shows the toast). */
  onSubmit: (scoreDelta: number, reason: string) => Promise<void>;
};

/**
 * Admin modal to add/deduct points. Enforces a non-zero delta and a mandatory
 * reason before enabling submit. Entrance animation is disabled under
 * prefers-reduced-motion.
 */
export function AdjustPointsModal({ isOpen, userName, onClose, onSubmit }: AdjustPointsModalProps) {
  const reduce = useReducedMotion() ?? false;
  const [sign, setSign] = useState<1 | -1>(1);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  // Reset the form each time the modal (re)opens.
  useEffect(() => {
    if (isOpen) {
      setSign(1);
      setAmount("");
      setReason("");
      setBusy(false);
    }
  }, [isOpen]);

  const parsedAmount = Number.parseInt(amount, 10);
  const validAmount = Number.isFinite(parsedAmount) && parsedAmount > 0;
  const validReason = reason.trim().length > 0;
  const canSubmit = validAmount && validReason && !busy;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    // Digits only — sign is controlled by the +/- toggle.
    setAmount(e.target.value.replace(/[^\d]/g, ""));
  };

  const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setReason(e.target.value);
  };

  const handleSubmit = async (): Promise<void> => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      await onSubmit(sign * parsedAmount, reason.trim());
      onClose();
    } catch {
      // Caller is responsible for the error toast; keep the modal open to retry.
      setBusy(false);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(2px)" }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Điều chỉnh điểm"
            initial={reduce ? false : { opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
            style={{ fontFamily: "'Inter',sans-serif" }}
            onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                  <Sparkles size={18} className="text-[#FF6B00]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Điều chỉnh điểm</h3>
                  <p className="text-xs text-slate-500 truncate max-w-[220px]">{userName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sign toggle + amount */}
            <div className="mt-5 flex items-stretch gap-2">
              <div className="flex rounded-2xl border border-slate-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setSign(1)}
                  className="px-3 flex items-center justify-center cursor-pointer transition-colors"
                  style={{ background: sign === 1 ? "rgba(34,197,94,0.12)" : "#FFFFFF", color: sign === 1 ? "#16A34A" : "#94A3B8" }}
                  aria-pressed={sign === 1}
                  aria-label="Cộng điểm"
                >
                  <Plus size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setSign(-1)}
                  className="px-3 flex items-center justify-center cursor-pointer transition-colors border-l border-slate-200"
                  style={{ background: sign === -1 ? "rgba(239,68,68,0.12)" : "#FFFFFF", color: sign === -1 ? "#DC2626" : "#94A3B8" }}
                  aria-pressed={sign === -1}
                  aria-label="Trừ điểm"
                >
                  <Minus size={16} />
                </button>
              </div>
              <input
                value={amount}
                onChange={handleAmountChange}
                inputMode="numeric"
                placeholder="Số điểm"
                className="flex-1 h-11 px-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-800 outline-none focus:border-[#FF6B00]/50"
              />
            </div>

            {/* Live preview */}
            <p className="mt-2 text-xs font-semibold" style={{ color: sign === 1 ? "#16A34A" : "#DC2626" }}>
              {validAmount ? `${sign === 1 ? "+" : "−"}${parsedAmount.toLocaleString("vi-VN")} XP` : "Nhập số điểm cần điều chỉnh"}
            </p>

            {/* Reason (mandatory) */}
            <div className="mt-4">
              <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Lý do <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={handleReasonChange}
                rows={3}
                placeholder="Mô tả lý do điều chỉnh (bắt buộc)…"
                className="mt-1.5 w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-800 outline-none resize-none focus:border-[#FF6B00]/50"
              />
            </div>

            {/* Actions */}
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-2xl text-sm font-semibold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                style={{ background: "linear-gradient(135deg,#FF6B00,#EA580C)" }}
              >
                {busy && <Loader2 size={15} className="animate-spin motion-reduce:animate-none" />}
                Xác nhận
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export default AdjustPointsModal;

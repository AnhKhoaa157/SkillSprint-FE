import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ShieldAlert, ShieldCheck, Loader2 } from "lucide-react";

export type LeaderboardBanModalProps = {
  isOpen: boolean;
  userName: string;
  /** true → the action will BAN (destructive); false → it will UNBAN. */
  isBanning: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

/**
 * Confirmation modal for banning / unbanning a user from the leaderboard.
 * Banning uses the destructive red scheme; unbanning uses a neutral/green scheme.
 */
export function LeaderboardBanModal({
  isOpen,
  userName,
  isBanning,
  onClose,
  onConfirm,
}: LeaderboardBanModalProps) {
  const reduce = useReducedMotion() ?? false;
  const [busy, setBusy] = useState(false);

  const handleConfirm = async (): Promise<void> => {
    if (busy) return;
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      setBusy(false);
    }
  };

  const accent = isBanning ? "#DC2626" : "#16A34A";
  const accentBg = isBanning ? "rgba(239,68,68,0.10)" : "rgba(34,197,94,0.10)";

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
            role="alertdialog"
            aria-modal="true"
            aria-label={isBanning ? "Cấm khỏi bảng xếp hạng" : "Gỡ cấm bảng xếp hạng"}
            initial={reduce ? false : { opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center"
            style={{ fontFamily: "'Inter',sans-serif" }}
            onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          >
            <div
              className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center"
              style={{ background: accentBg }}
            >
              {isBanning ? (
                <ShieldAlert size={26} style={{ color: accent }} />
              ) : (
                <ShieldCheck size={26} style={{ color: accent }} />
              )}
            </div>

            <h3 className="mt-4 text-base font-extrabold text-slate-900">
              {isBanning ? "Cấm khỏi bảng xếp hạng?" : "Gỡ cấm bảng xếp hạng?"}
            </h3>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              {isBanning ? (
                <>
                  <strong className="text-slate-700">{userName}</strong> sẽ bị xóa khỏi mọi bảng xếp hạng
                  và không thể xuất hiện lại cho đến khi được gỡ cấm.
                </>
              ) : (
                <>
                  <strong className="text-slate-700">{userName}</strong> sẽ được phép tham gia bảng xếp hạng
                  trở lại ở các lần ghi điểm tiếp theo.
                </>
              )}
            </p>

            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-2xl text-sm font-semibold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={busy}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold text-white shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                style={{ background: accent }}
              >
                {busy && <Loader2 size={15} className="animate-spin motion-reduce:animate-none" />}
                {isBanning ? "Cấm" : "Gỡ cấm"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export default LeaderboardBanModal;

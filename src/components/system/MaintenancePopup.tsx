import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Wrench, Clock, X } from "lucide-react";
import { useMaintenance } from "./MaintenanceGate";

const DEFAULT_MESSAGE =
  "SkillSprint đang được nâng cấp để phục vụ bạn tốt hơn. Vui lòng quay lại sau ít phút.";

/** ISO-8601 → "dd thg M, yyyy HH:mm" in Vietnamese, or null when missing/invalid. */
function formatEndAt(endAt: string | null | undefined): string | null {
  if (!endAt) return null;
  const date = new Date(endAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" });
}

/**
 * Reusable maintenance interceptor modal. It reads the live maintenance state from the central
 * <MaintenanceGate> context (via useMaintenance) — so the message and estimated restoration time
 * always mirror whatever the admin configured — and surfaces it as a polished blocking popup.
 *
 * Rendered on the login page and toggled open when a non-admin tries to sign in during maintenance.
 */
export function MaintenancePopup({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { status } = useMaintenance();

  // Close on Escape for accessibility / quick dismissal.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const message = status?.message?.trim() || DEFAULT_MESSAGE;
  const estimatedEnd = formatEndAt(status?.endAt);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="maintenance-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm"
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            key="maintenance-panel"
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="maintenance-title"
            className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-2xl shadow-slate-900/10"
          >
            {/* Close control */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng thông báo bảo trì"
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={18} />
            </button>

            {/* Icon */}
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/30">
              <Wrench size={36} className="text-white" strokeWidth={2.2} />
            </div>

            <h2 id="maintenance-title" className="text-2xl font-extrabold text-slate-900">
              Hệ thống đang bảo trì
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-slate-500">{message}</p>

            {estimatedEnd && (
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-600">
                <Clock size={15} />
                Dự kiến hoàn tất: {estimatedEnd}
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="mt-8 w-full rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
            >
              Đã hiểu
            </button>

            <p className="mt-4 text-xs text-slate-400">
              Tài khoản quản trị vẫn có thể đăng nhập để xử lý hệ thống.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default MaintenancePopup;

import { useEffect } from "react";
import { motion } from "motion/react";
import { Wrench, Clock } from "lucide-react";
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
 * Full-screen maintenance lockdown. Reads the live message / ETA from the gate's context so the
 * copy always mirrors whatever the admin configured.
 *
 * No public admin link is shown here on purpose: it tempted normal users back to the login form,
 * where they'd just re-trigger the 503. Admins reach the portal directly via /admin-login (or
 * /admin/*), which <MaintenanceGate> allowlists past this screen regardless.
 *
 * Two modes, driven by `onClose`:
 *   - omitted (default) → NON-dismissable. Rendered by <MaintenanceGate> *in place of* the whole
 *     app when maintenance is active; there is nothing behind it to interact with.
 *   - provided → adds a dismiss button + Escape-to-close. Used by the Auth page as a soft popup
 *     when a sign-in attempt is rejected with a 503 (the defense-in-depth race where the gate's
 *     cached status was still stale).
 */
export function MaintenanceScreen({ onClose, onBack }: { onClose?: () => void; onBack?: () => void } = {}) {
  const { status } = useMaintenance();

  // Escape-to-close, but only when dismissable.
  useEffect(() => {
    if (!onClose) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const message = status?.message?.trim() || DEFAULT_MESSAGE;
  const estimatedEnd = formatEndAt(status?.endAt);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="maintenance-screen-title"
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-auto p-4 bg-gradient-to-br from-slate-50 to-orange-50/40"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
        className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-2xl shadow-slate-900/10"
      >
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/30">
          <Wrench size={36} className="text-white" strokeWidth={2.2} />
        </div>

        <h2 id="maintenance-screen-title" className="text-2xl font-extrabold text-slate-900">
          Hệ thống đang bảo trì
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-slate-500">{message}</p>

        {estimatedEnd && (
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-600">
            <Clock size={15} />
            Dự kiến hoàn tất: {estimatedEnd}
          </div>
        )}

        {/* Dismiss control — only in soft-popup mode (Auth page). */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="mt-8 w-full rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
          >
            Đã hiểu
          </button>
        )}

        {/* Soft back-to-login control — only when onBack is supplied (Learner Auth override). */}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-xs font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-100 hover:text-slate-800 cursor-pointer active:scale-[0.98]"
          >
            ← Quay lại trang Đăng nhập
          </button>
        )}
      </motion.div>
    </div>
  );
}

export default MaintenanceScreen;

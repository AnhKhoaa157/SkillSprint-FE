import { motion } from "motion/react";
import { MessageSquare, RefreshCw } from "lucide-react";
import type { AdminFeedbackProps } from "./config";
import { useFeedback } from "./useFeedback";
import { ConfirmModal, FeedbackToolbar, FeedbackTable, FeedbackDetailPanel } from "./components";

export default function AdminFeedback({ isDashboard = false }: AdminFeedbackProps) {
  const fb = useFeedback(isDashboard);
  const {
    confirmAction, handleConfirmAction, actionLoading, setConfirmAction,
    isFetching, feedbacks, load, page, statusFilter, typeFilter, searchInput, dateFrom, dateTo,
  } = fb;

  return (
    <>
      {confirmAction && (
        <ConfirmModal
          action={confirmAction}
          onConfirm={handleConfirmAction}
          onCancel={() => !actionLoading && setConfirmAction(null)}
          loading={actionLoading}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`max-w-7xl mx-auto font-sans space-y-6 ${isDashboard ? "p-0" : "py-8 px-4"}`}
      >
        {/* Page header */}
        {!isDashboard && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center shadow-sm">
                <MessageSquare size={20} className="text-violet-600" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Feedback người dùng</h1>
                <p className="text-slate-500 text-sm mt-0.5">Quản lý và xử lý phản hồi từ người dùng hệ thống</p>
              </div>
            </div>
            <button
              onClick={() => load(page, statusFilter, typeFilter, searchInput, dateFrom, dateTo, { silent: feedbacks.length > 0 })}
              disabled={isFetching}
              className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition flex items-center gap-1.5 text-sm font-semibold cursor-pointer disabled:opacity-50 self-start sm:self-auto"
            >
              <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
              Làm mới
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* ── Table Card ── */}
          <div className="xl:col-span-2 rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm">
            <FeedbackToolbar fb={fb} />
            <FeedbackTable fb={fb} />
          </div>

          {/* ── Detail Panel ── */}
          <FeedbackDetailPanel fb={fb} />
        </div>
      </motion.div>
    </>
  );
}

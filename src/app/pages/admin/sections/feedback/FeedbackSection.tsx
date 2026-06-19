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
    totalItems, hasFilters, selected,
  } = fb;
  const openOnPage = feedbacks.filter((item) => (item.status ?? "").toUpperCase() !== "CLOSED").length;

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
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-50 to-white border border-violet-100 flex items-center justify-center shadow-[0_12px_30px_-18px_rgba(124,58,237,0.55)]">
                <MessageSquare size={21} className="text-violet-600" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Feedback người dùng</h1>
                <p className="text-slate-500 text-sm mt-0.5">Theo dõi, phân loại và phản hồi các tín hiệu từ người dùng hệ thống.</p>
              </div>
            </div>
            <button
              onClick={() => load(page, statusFilter, typeFilter, searchInput, dateFrom, dateTo, { silent: feedbacks.length > 0 })}
              disabled={isFetching}
              className="h-10 px-4 rounded-2xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:shadow-sm active:scale-[0.98] transition flex items-center gap-1.5 text-sm font-semibold cursor-pointer disabled:opacity-50 self-start sm:self-auto"
            >
              <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
              Làm mới
            </button>
          </div>
        )}

        {!isDashboard && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-3xl border border-white/80 bg-white/85 p-4 shadow-[0_14px_36px_-28px_rgba(15,23,42,0.3)]">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tổng phản hồi</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{totalItems.toLocaleString("vi-VN")}</p>
            </div>
            <div className="rounded-3xl border border-white/80 bg-white/85 p-4 shadow-[0_14px_36px_-28px_rgba(15,23,42,0.3)]">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đang mở trên trang</p>
              <p className="mt-1 text-2xl font-black text-violet-600">{openOnPage.toLocaleString("vi-VN")}</p>
            </div>
            <div className="rounded-3xl border border-white/80 bg-white/85 p-4 shadow-[0_14px_36px_-28px_rgba(15,23,42,0.3)]">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ngữ cảnh xử lý</p>
              <p className="mt-1 text-sm font-extrabold text-slate-800">
                {selected ? "Đã chọn 1 phản hồi" : hasFilters ? "Đang lọc danh sách" : "Toàn bộ danh sách"}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_390px] gap-6 items-start">
          {/* ── Table Card ── */}
          <div className="min-w-0 rounded-3xl overflow-hidden bg-white/95 border border-white/80 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.35)] ring-1 ring-slate-200/70">
            <FeedbackToolbar fb={fb} />
            <FeedbackTable fb={fb} />
          </div>

          {/* ── Detail Panel ── */}
          <div className="min-w-0 xl:sticky xl:top-6">
            <FeedbackDetailPanel fb={fb} />
          </div>
        </div>
      </motion.div>
    </>
  );
}

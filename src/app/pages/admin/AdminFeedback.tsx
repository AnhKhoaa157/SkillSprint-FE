import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { MessageSquare, Search, RefreshCw, LoaderCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  getAdminFeedbacks,
  getFeedbackDetail,
  updateFeedbackStatus,
  type FeedbackResponse,
} from "../../../api/feedbackService";

const FEEDBACK_TYPE_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  BUG:         { label: "Bug",       color: "#DC2626", bg: "rgba(220,38,38,0.08)" },
  IMPROVEMENT: { label: "Cải tiến", color: "#7C3AED", bg: "rgba(124,58,237,0.08)" },
  QUESTION:    { label: "Câu hỏi",  color: "#0284C7", bg: "rgba(2,132,199,0.08)" },
  OTHER:       { label: "Khác",     color: "#64748B", bg: "rgba(100,116,139,0.08)" },
};

const FEEDBACK_STATUS_LABEL: Record<string, { label: string; color: string; bg: string; border: string }> = {
  OPEN:        { label: "Chờ xử lý",      color: "#B45309", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.28)" },
  IN_PROGRESS: { label: "Đang xử lý",     color: "#0284C7", bg: "rgba(2,132,199,0.08)",   border: "rgba(2,132,199,0.28)"  },
  RESOLVED:    { label: "Đã giải quyết",  color: "#15803D", bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.28)"  },
  CLOSED:      { label: "Đã đóng",        color: "#64748B", bg: "rgba(100,116,139,0.08)", border: "rgba(100,116,139,0.28)" },
};

// Defensive status fallback transformer to handle old legacy database values
const sanitizeStatus = (status: string | undefined | null): string => {
  if (!status) return "OPEN";
  const upperStatus = status.toUpperCase();
  if (upperStatus === "PENDING") return "OPEN";
  if (upperStatus === "REVIEWED") return "IN_PROGRESS"; // Safe fallback to your new "Đang xử lý" status
  return upperStatus;
};

const PAGE_SIZE = 15;

export default function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState<FeedbackResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [selected, setSelected] = useState<FeedbackResponse | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [updating, setUpdating] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [statusDraft, setStatusDraft] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const load = async (p: number, status = statusFilter) => {
    setLoading(true);
    try {
      const res = await getAdminFeedbacks(p, PAGE_SIZE, status || undefined);
      setFeedbacks(res.content ?? []);
      setTotalItems(res.totalElements ?? 0);
      setTotalPages(res.totalPages ?? 0);
      setPage(p);
    } catch (err) {
      toast.error((err as Error).message || "Không tải được danh sách feedback");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(0); }, []);

  const fetchDetail = async (fb: FeedbackResponse) => {
    if (!fb.feedbackId || typeof fb.feedbackId !== "string" || !fb.feedbackId.trim()) {
      const msg = "ID phản hồi không hợp lệ — không thể tải chi tiết";
      setDetailError(msg);
      toast.error(msg);
      return;
    }
    setDetailLoading(true);
    setDetailError(null);
    try {
      const fresh = await getFeedbackDetail(fb.feedbackId);
      setSelected(fresh);
      setStatusDraft(sanitizeStatus(fresh.status));
      setAdminNote(fresh.adminNote || "");
    } catch (err: any) {
      const status: number | undefined = err?.status;
      const msg: string = err?.message || "Không thể tải chi tiết phản hồi";
      setDetailError(msg);
      toast.error(status ? `[${status}] ${msg}` : msg, { duration: 6000 });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSelect = (fb: FeedbackResponse) => {
    setSelected(fb);
    setStatusDraft(sanitizeStatus(fb.status));
    setAdminNote(fb.adminNote || "");
    fetchDetail(fb);
  };

  const handleRetryDetail = () => {
    if (selected) fetchDetail(selected);
  };

  const handleUpdate = async () => {
    if (!selected) return;
    const validStatuses = Object.keys(FEEDBACK_STATUS_LABEL);
    if (!statusDraft || !validStatuses.includes(statusDraft)) {
      toast.error(`Trạng thái không hợp lệ: "${statusDraft}". Vui lòng chọn lại.`);
      return;
    }
    setUpdating(true);
    try {
      const updated = await updateFeedbackStatus(selected.feedbackId, statusDraft, adminNote.trim() || undefined);
      setSelected(updated);
      setFeedbacks(prev => prev.map(fb => fb.feedbackId === updated.feedbackId ? updated : fb));
      toast.success("Cập nhật thành công");
    } catch (err: any) {
      const code = err?.status ? `[${err.status}] ` : "";
      toast.error(`${code}${err?.message || "Lỗi cập nhật"}`);
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto py-8 px-4 font-sans space-y-6"
    >
      {/* Page header */}
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

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); load(0, e.target.value); }}
            className="h-9 px-3 rounded-xl border border-slate-200 text-sm text-slate-700 font-semibold outline-none focus:border-violet-400"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(FEEDBACK_STATUS_LABEL).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <button
            onClick={() => load(page)}
            disabled={loading}
            className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition flex items-center gap-1.5 text-sm font-semibold cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-100">
          {totalItems} phản hồi
        </span>
        <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
          {feedbacks.filter(f => sanitizeStatus(f.status) === "OPEN").length} chờ xử lý trang này
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Table */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Column headers */}
          <div className="grid px-5 py-3"
            style={{ gridTemplateColumns: "2fr 1fr 1.2fr 1.2fr", borderBottom: "1px solid #F1F5F9", background: "#FAFAFA" }}>
            {["Tiêu đề / Người dùng", "Loại", "Trạng thái", "Thời gian"].map(col => (
              <span key={col} className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{col}</span>
            ))}
          </div>

          {/* Skeleton rows */}
          {loading && Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="grid px-5 py-3.5 animate-pulse border-b border-slate-50"
              style={{ gridTemplateColumns: "2fr 1fr 1.2fr 1.2fr", alignItems: "center" }}>
              {[0.65, 0.35, 0.45, 0.5].map((w, j) => (
                <div key={j} className="h-3 rounded-full bg-slate-100" style={{ width: `${w * 100}%` }} />
              ))}
            </div>
          ))}

          {/* Empty state */}
          {!loading && feedbacks.length === 0 && (
            <div className="py-20 text-center">
              <Search size={28} className="mx-auto mb-3 text-slate-300" />
              <p className="text-slate-400 text-sm font-semibold">Không có feedback nào</p>
            </div>
          )}

          {/* Data rows */}
          {!loading && feedbacks.map((fb, i) => {
            const typeInfo = FEEDBACK_TYPE_LABEL[fb.type] ?? FEEDBACK_TYPE_LABEL.OTHER;
            const currentSanitizedStatus = sanitizeStatus(fb.status);
            const statusInfo = FEEDBACK_STATUS_LABEL[currentSanitizedStatus] ?? FEEDBACK_STATUS_LABEL.OPEN;
            const isActive = selected?.feedbackId === fb.feedbackId;

            return (
              <motion.div key={fb.feedbackId}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                onClick={() => handleSelect(fb)}
                className="grid px-5 py-3.5 cursor-pointer border-b border-slate-50 transition-colors"
                style={{
                  gridTemplateColumns: "2fr 1fr 1.2fr 1.2fr",
                  alignItems: "center",
                  background: isActive ? "#F5F3FF" : undefined,
                  borderLeft: isActive ? "3px solid #7C3AED" : "3px solid transparent",
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "#F8FAFC"; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = ""; }}
              >
                <div className="min-w-0 pr-3">
                  <p className="text-sm font-bold text-slate-800 truncate">{fb.title}</p>
                  <p className="text-[11px] text-slate-400 truncate">{fb.userFullName || fb.userEmail}</p>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold w-fit"
                  style={{ background: typeInfo.bg, color: typeInfo.color }}>
                  {typeInfo.label}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border w-fit"
                  style={{ background: statusInfo.bg, color: statusInfo.color, border: `1px solid ${statusInfo.border}` }}>
                  {statusInfo.label}
                </span>
                <span className="text-[11px] text-slate-400">{formatDate(fb.createdAt)}</span>
              </motion.div>
            );
          })}

          {/* Pagination footer */}
          <div className="px-5 py-3 flex items-center justify-between bg-slate-50/60 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-500">
              Trang {page + 1} · {totalItems} phản hồi
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => load(Math.max(0, page - 1))}
                disabled={page === 0 || loading}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                ← Trước
              </button>
              <button
                onClick={() => load(page + 1)}
                disabled={page + 1 >= totalPages || loading}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Tiếp →
              </button>
            </div>
          </div>
        </div>

        {/* Detail panel */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-base font-extrabold text-slate-900 mb-4">Chi tiết phản hồi</h3>

          {!selected ? (
            <div className="py-16 text-center">
              <MessageSquare size={28} className="mx-auto mb-3 text-slate-200" />
              <p className="text-sm text-slate-400 font-medium">Chọn một dòng để xem chi tiết</p>
            </div>
          ) : detailLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-2">
                <div className="h-4 bg-slate-200 rounded-full w-3/4" />
                <div className="h-3 bg-slate-100 rounded-full w-1/2" />
                <div className="h-3 bg-slate-100 rounded-full w-1/3" />
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-slate-200 rounded-full w-1/4" />
                <div className="h-24 bg-slate-100 rounded-xl" />
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-slate-200 rounded-full w-1/3" />
                <div className="h-9 bg-slate-100 rounded-xl" />
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-slate-200 rounded-full w-1/4" />
                <div className="h-20 bg-slate-100 rounded-xl" />
              </div>
              <div className="h-10 bg-slate-100 rounded-xl" />
            </div>
          ) : detailError ? (
            <div className="py-10 flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
                <AlertCircle size={24} className="text-red-500" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-800">Không thể tải chi tiết phản hồi</p>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-[220px]">
                  {detailError}
                </p>
                <p className="text-xs text-slate-400 mt-1">Vui lòng thử lại sau hoặc liên hệ quản trị viên hệ thống.</p>
              </div>
              <button
                onClick={handleRetryDetail}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition cursor-pointer"
              >
                <RefreshCw size={13} />
                Thử lại
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* User info */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                <p className="text-sm font-extrabold text-slate-800">{selected.title}</p>
                <p className="text-xs text-slate-500 mt-1">{selected.userFullName} · {selected.userEmail}</p>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">ID: {selected.feedbackId.slice(0, 14)}…</p>
              </div>

              {/* Content */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Nội dung</p>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50/50 border border-slate-100 rounded-xl px-3.5 py-3">
                  {selected.content}
                </p>
              </div>

              {selected.relatedUrl && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">URL liên quan</p>
                  <p className="text-xs text-violet-600 break-all font-mono">{selected.relatedUrl}</p>
                </div>
              )}

              {/* Status update */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Cập nhật trạng thái</label>
                <select
                  value={statusDraft}
                  onChange={e => setStatusDraft(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-sm text-slate-700 font-semibold outline-none focus:border-violet-400"
                >
                  {Object.entries(FEEDBACK_STATUS_LABEL).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Admin note */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Ghi chú Admin</label>
                <textarea
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  rows={4}
                  placeholder="Thêm ghi chú phản hồi cho người dùng..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700 resize-none outline-none focus:border-violet-400 transition"
                />
              </div>

              <button
                onClick={handleUpdate}
                disabled={updating}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition cursor-pointer disabled:cursor-not-allowed"
                style={{ background: updating ? "#A78BFA" : "#7C3AED" }}
              >
                {updating ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoaderCircle size={14} className="animate-spin" /> Đang lưu...
                  </span>
                ) : "Lưu cập nhật"}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  MessageSquare, Search, RefreshCw, LoaderCircle,
  Link as LinkIcon, Trash2, Archive, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  deleteFeedback,
  FeedbackStatus,
  getAdminFeedbacks,
  getFeedbackDetail,
  updateFeedbackStatus,
  type FeedbackAdminResponse,
} from "../../../api/feedbackService";

interface AdminFeedbackProps {
  isDashboard?: boolean;
}

interface ConfirmAction {
  type: "delete" | "close";
  feedbackId: string;
  title: string;
}

/* ─────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────── */
const FEEDBACK_TYPE_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  BUG:         { label: "Bug",      color: "#DC2626", bg: "rgba(220,38,38,0.08)" },
  IMPROVEMENT: { label: "Cải tiến", color: "#7C3AED", bg: "rgba(124,58,237,0.08)" },
  QUESTION:    { label: "Câu hỏi",  color: "#0284C7", bg: "rgba(2,132,199,0.08)" },
  OTHER:       { label: "Khác",     color: "#64748B", bg: "rgba(100,116,139,0.08)" },
};

const FEEDBACK_STATUS_LABEL: Record<string, { label: string; color: string; bg: string; border: string }> = {
  OPEN:        { label: "Chờ xử lý",     color: "#B45309", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.28)"  },
  IN_PROGRESS: { label: "Đang xử lý",    color: "#0284C7", bg: "rgba(2,132,199,0.08)",   border: "rgba(2,132,199,0.28)"   },
  RESOLVED:    { label: "Đã giải quyết", color: "#15803D", bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.28)"   },
  CLOSED:      { label: "Đã đóng",       color: "#64748B", bg: "rgba(100,116,139,0.08)", border: "rgba(100,116,139,0.28)" },
};

const sanitizeFeedbackStatus = (status: string | undefined | null): FeedbackStatus => {
  if (!status) return "OPEN" as FeedbackStatus;
  const upper = status.toUpperCase();
  if (upper === "PENDING") return "OPEN" as FeedbackStatus;
  if (upper === "REVIEWED") return "IN_PROGRESS" as FeedbackStatus;
  if (["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].includes(upper)) return upper as FeedbackStatus;
  return "OPEN" as FeedbackStatus;
};

// Tolerant image-link detector — handles CDN URLs and missing extensions
function isImageLink(url: string): boolean {
  if (!url) return false;
  const clean = url.trim().toLowerCase();
  const isCdn =
    clean.includes("bing.com/th/") ||
    clean.includes("th.bing.com/th/") ||
    clean.includes("image") ||
    clean.includes("?w=");
  const hasExt = /\.(png|jpg|jpeg|webp|gif|avif|bmp|svg)$/i.test(clean.split(/[?#]/)[0]);
  return hasExt || isCdn;
}

/* ─────────────────────────────────────────────────────────
   CONFIRM MODAL
───────────────────────────────────────────────────────── */
interface ConfirmModalProps {
  action: ConfirmAction;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

function ConfirmModal({ action, onConfirm, onCancel, loading }: ConfirmModalProps) {
  const isDanger = action.type === "delete";
  const truncTitle = action.title.length > 52 ? action.title.slice(0, 52) + "…" : action.title;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.58)", backdropFilter: "blur(3px)" }}
      onClick={() => !loading && onCancel()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.14, ease: "easeOut" }}
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 mb-5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: isDanger ? "rgba(220,38,38,0.09)" : "rgba(245,158,11,0.09)" }}
          >
            {isDanger
              ? <Trash2 size={19} style={{ color: "#DC2626" }} />
              : <Archive size={19} style={{ color: "#B45309" }} />
            }
          </div>
          <div>
            <h3 className="font-bold text-slate-900" style={{ fontSize: "0.95rem" }}>
              {isDanger ? "Xóa vĩnh viễn phản hồi?" : "Đóng phản hồi này?"}
            </h3>
            <p className="text-slate-500 mt-1.5 leading-relaxed" style={{ fontSize: "0.82rem" }}>
              {isDanger ? (
                <>Phản hồi <strong className="text-slate-700">"{truncTitle}"</strong> sẽ bị xóa hoàn toàn và <em>không thể khôi phục</em>.</>
              ) : (
                <>Phản hồi <strong className="text-slate-700">"{truncTitle}"</strong> sẽ chuyển sang trạng thái <em>Đã đóng</em>. Bạn có thể mở lại sau.</>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => !loading && onCancel()}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white transition cursor-pointer disabled:opacity-50 active:scale-[0.98] flex items-center gap-1.5 shadow-sm"
            style={{ background: isDanger ? "#DC2626" : "#B45309" }}
          >
            {loading ? (
              <>
                <LoaderCircle size={13} className="animate-spin" />
                {isDanger ? "Đang xóa..." : "Đang đóng..."}
              </>
            ) : (
              isDanger ? "Xóa vĩnh viễn" : "Đóng phản hồi"
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────── */
export default function AdminFeedback({ isDashboard = false }: AdminFeedbackProps) {
  const [feedbacks, setFeedbacks]       = useState<FeedbackAdminResponse[]>([]);
  const [loading, setLoading]           = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage]                 = useState(0);
  const [totalPages, setTotalPages]     = useState(0);
  const [totalItems, setTotalItems]     = useState(0);
  const [selected, setSelected]         = useState<FeedbackAdminResponse | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter]     = useState("");
  const [searchInput, setSearchInput]   = useState("");
  const [updating, setUpdating]         = useState(false);
  const [adminNote, setAdminNote]       = useState("");
  const [statusDraft, setStatusDraft]   = useState(FeedbackStatus.OPEN);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError]   = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const accent = isDashboard ? "#FF6B00" : "#7C3AED";
  const hasFilters = searchInput || typeFilter || statusFilter;
  const isFetching = loading || isRefreshing;
  const showInitialSkeleton = loading && feedbacks.length === 0;

  /* ── Data Fetching ── */
  const load = useCallback(async (
    p: number,
    status = statusFilter,
    type   = typeFilter,
    search = searchInput,
    options?: { silent?: boolean },
  ) => {
    const setBusy = options?.silent ? setIsRefreshing : setLoading;
    setBusy(true);
    try {
      const res = await getAdminFeedbacks(p, 15, status || undefined, type || undefined, search || undefined);
      setFeedbacks(res.content ?? res.items ?? []);
      setTotalItems(res.totalElements ?? res.totalItems ?? 0);
      setTotalPages(res.totalPages ?? 0);
      setPage(p);
    } catch (err) {
      toast.error((err as Error).message || "Không tải được danh sách feedback");
    } finally {
      setBusy(false);
    }
  }, [searchInput, statusFilter, typeFilter]);

  useEffect(() => {
    load(0);
    // Initial fetch only; filter/search handlers call load explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      load(page, statusFilter, typeFilter, searchInput, { silent: true });
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [load, page, searchInput, statusFilter, typeFilter]);

  const clearFilters = () => {
    setSearchInput("");
    setTypeFilter("");
    setStatusFilter("");
    load(0, "", "", "");
  };

  /* ── Detail Panel ── */
  const fetchDetail = async (fb: FeedbackAdminResponse) => {
    if (!fb.feedbackId?.trim()) {
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
      setStatusDraft(sanitizeFeedbackStatus(fresh.status));
      setAdminNote(fresh.adminNote || "");
    } catch (err: any) {
      const msg = err?.message || "Không thể tải chi tiết phản hồi";
      setDetailError(msg);
      toast.error(msg);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSelect = (fb: FeedbackAdminResponse) => {
    setSelected(fb);
    setStatusDraft(sanitizeFeedbackStatus(fb.status));
    setAdminNote(fb.adminNote || "");
    fetchDetail(fb);
  };

  const handleUpdate = async () => {
    if (!selected) return;
    setUpdating(true);
    try {
      const updated = await updateFeedbackStatus(selected.feedbackId, statusDraft, adminNote.trim() || undefined);
      setSelected(updated);
      setFeedbacks(prev => prev.map(fb => fb.feedbackId === updated.feedbackId ? updated : fb));
      toast.success("Cập nhật feedback thành công");
    } catch (err: any) {
      toast.error(err?.message || "Lỗi cập nhật");
    } finally {
      setUpdating(false);
    }
  };

  /* ── Delete / Close Actions ── */
  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      if (confirmAction.type === "delete") {
        await deleteFeedback(confirmAction.feedbackId);
        setFeedbacks(prev => prev.filter(fb => fb.feedbackId !== confirmAction.feedbackId));
        if (selected?.feedbackId === confirmAction.feedbackId) setSelected(null);
        toast.success("Đã xóa phản hồi vĩnh viễn");
      } else {
        const updated = await updateFeedbackStatus(confirmAction.feedbackId, "CLOSED");
        setFeedbacks(prev => prev.map(fb => fb.feedbackId === confirmAction.feedbackId ? updated : fb));
        if (selected?.feedbackId === confirmAction.feedbackId) {
          setSelected(updated);
          setStatusDraft(FeedbackStatus.CLOSED);
        }
        toast.success("Đã đóng phản hồi");
      }
      setConfirmAction(null);
    } catch (err: any) {
      toast.error(err?.message || "Lỗi thực hiện hành động");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });

  /* ── Render ── */
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
              onClick={() => load(page, statusFilter, typeFilter, searchInput, { silent: feedbacks.length > 0 })}
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

            {/* Toolbar */}
            <div
              className="p-3 flex flex-wrap gap-2 items-center"
              style={{ borderBottom: "1px solid #F3F4F6", background: "#FAFAFA" }}
            >
              {/* Search */}
              <div className="relative flex-1 min-w-[180px]">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && load(0)}
                  placeholder="Tìm tiêu đề, email, nội dung..."
                  className="w-full h-9 pl-8 pr-3 rounded-xl outline-none transition"
                  style={{
                    border: "1px solid #E2E8F0",
                    background: "#FFFFFF",
                    color: "#0F172A",
                    fontSize: "0.8rem",
                  }}
                />
              </div>

              {/* Manual reload */}
              <button
                type="button"
                title="Refresh list"
                aria-label="Refresh list"
                onClick={() => load(page, statusFilter, typeFilter, searchInput, { silent: feedbacks.length > 0 })}
                disabled={isFetching}
                className="h-9 w-9 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
              </button>

              {/* Type filter */}
              <select
                value={typeFilter}
                onChange={e => { setTypeFilter(e.target.value); load(0, statusFilter, e.target.value); }}
                className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold outline-none"
                style={{ fontSize: "0.8rem" }}
              >
                <option value="">Tất cả loại</option>
                {Object.entries(FEEDBACK_TYPE_LABEL).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); load(0, e.target.value, typeFilter); }}
                className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold outline-none"
                style={{ fontSize: "0.8rem" }}
              >
                <option value="">Tất cả trạng thái</option>
                {Object.entries(FEEDBACK_STATUS_LABEL).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>

              {/* Search button */}
              <button
                onClick={() => load(0)}
                className="h-9 px-3.5 rounded-xl text-xs font-bold text-white cursor-pointer shadow-sm shrink-0 transition active:scale-[0.97]"
                style={{ background: `linear-gradient(135deg,${accent},${accent}cc)` }}
              >
                Tìm
              </button>

              {/* Clear filters */}
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="h-9 px-3 rounded-xl text-xs font-semibold border border-slate-200 text-slate-500 hover:bg-slate-100 transition cursor-pointer shrink-0"
                >
                  Xóa lọc
                </button>
              )}
            </div>

            {/* Table header */}
            <div
              className="grid px-5 py-2.5"
              style={{
                gridTemplateColumns: "2fr 1fr 1.2fr 1.2fr 72px",
                borderBottom: "1px solid #F3F4F6",
                background: "#FAFAFA",
              }}
            >
              {["Người dùng / Tiêu đề", "Loại", "Trạng thái", "Thời gian", ""].map(col => (
                <span
                  key={col}
                  style={{ color: "#9CA3AF", fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}
                >
                  {col}
                </span>
              ))}
            </div>

            {/* Loading skeletons */}
            {showInitialSkeleton && Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="grid px-5 py-3.5 animate-pulse border-b border-slate-50"
                style={{ gridTemplateColumns: "2fr 1fr 1.2fr 1.2fr 72px", alignItems: "center" }}
              >
                {[0.65, 0.35, 0.45, 0.5, 0.3].map((w, j) => (
                  <div key={j} className="h-3 rounded-full bg-slate-100" style={{ width: `${w * 100}%` }} />
                ))}
              </div>
            ))}

            {/* Empty state */}
            {!isFetching && feedbacks.length === 0 && (
              <div className="py-16 text-center">
                <MessageSquare size={32} style={{ color: "#E5E7EB", margin: "0 auto 8px" }} />
                <p style={{ color: "#9CA3AF", fontSize: "0.85rem" }}>
                  {hasFilters ? "Không có kết quả phù hợp" : "Không có feedback nào"}
                </p>
              </div>
            )}

            {/* Rows */}
            {!showInitialSkeleton && feedbacks.map(fb => {
              const typeInfo   = FEEDBACK_TYPE_LABEL[fb.type] ?? FEEDBACK_TYPE_LABEL.OTHER;
              const curStatus  = sanitizeFeedbackStatus(fb.status);
              const statusInfo = FEEDBACK_STATUS_LABEL[curStatus] ?? FEEDBACK_STATUS_LABEL.OPEN;
              const isActive   = selected?.feedbackId === fb.feedbackId;
              const isClosed   = curStatus === "CLOSED";

              return (
                <div
                  key={fb.feedbackId}
                  onClick={() => handleSelect(fb)}
                  className="grid px-5 py-3 cursor-pointer transition-colors"
                  style={{
                    gridTemplateColumns: "2fr 1fr 1.2fr 1.2fr 72px",
                    borderBottom: "1px solid #F9FAFB",
                    alignItems: "center",
                    background: isActive ? (isDashboard ? "#FFF7ED" : "#F5F3FF") : undefined,
                    borderLeft: isActive ? `3px solid ${accent}` : "3px solid transparent",
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "#F8FAFC"; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  {/* User / Title */}
                  <div className="min-w-0 pr-2">
                    <p style={{ fontWeight: 600, fontSize: "0.8rem", color: "#111827" }} className="truncate">{fb.title}</p>
                    <p style={{ fontSize: "0.7rem", color: "#9CA3AF" }} className="truncate">
                      {fb.userFullName || fb.userEmail || "Unknown user"}
                    </p>
                  </div>

                  {/* Type badge */}
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold w-fit"
                    style={{ background: typeInfo.bg, color: typeInfo.color }}
                  >
                    {typeInfo.label}
                  </span>

                  {/* Status badge */}
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold w-fit"
                    style={{ background: statusInfo.bg, color: statusInfo.color, border: `1px solid ${statusInfo.border}` }}
                  >
                    {statusInfo.label}
                  </span>

                  {/* Date */}
                  <span style={{ fontSize: "0.72rem", color: "#6B7280" }}>{formatDate(fb.createdAt)}</span>

                  {/* Row actions — stop propagation so clicking buttons doesn't open the detail panel */}
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    {/* Soft close */}
                    <button
                      title={isClosed ? "Phản hồi đã đóng" : "Đóng phản hồi"}
                      disabled={isClosed}
                      onClick={() => setConfirmAction({ type: "close", feedbackId: fb.feedbackId, title: fb.title })}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{ background: "rgba(100,116,139,0.07)", color: "#64748B" }}
                      onMouseEnter={e => { if (!isClosed) e.currentTarget.style.background = "rgba(100,116,139,0.16)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(100,116,139,0.07)"; }}
                    >
                      <Archive size={12} />
                    </button>

                    {/* Hard delete */}
                    <button
                      title="Xóa vĩnh viễn"
                      onClick={() => setConfirmAction({ type: "delete", feedbackId: fb.feedbackId, title: fb.title })}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition cursor-pointer"
                      style={{ background: "rgba(220,38,38,0.06)", color: "#DC2626" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(220,38,38,0.15)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(220,38,38,0.06)"; }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            <div
              className="px-5 py-3 flex items-center justify-between"
              style={{ borderTop: "1px solid #F3F4F6", background: "#FAFAFA" }}
            >
              <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
                Trang {page + 1} · {totalItems} phản hồi
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => load(Math.max(0, page - 1))}
                  disabled={page === 0 || isFetching}
                  className="px-3 py-1.5 rounded-lg text-xs border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition disabled:opacity-40 cursor-pointer"
                >
                  ← Trước
                </button>
                <button
                  onClick={() => load(page + 1)}
                  disabled={page + 1 >= totalPages || isFetching}
                  className="px-3 py-1.5 rounded-lg text-xs border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition disabled:opacity-40 cursor-pointer"
                >
                  Tiếp →
                </button>
              </div>
            </div>
          </div>

          {/* ── Detail Panel ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 h-fit">
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
                </div>
                <div className="h-24 bg-slate-50 rounded-xl" />
                <div className="h-9 bg-slate-50 rounded-xl" />
                <div className="h-24 bg-slate-50 rounded-xl" />
              </div>

            ) : detailError ? (
              <div className="py-10 text-center">
                <AlertCircle size={28} className="mx-auto mb-3" style={{ color: "#FCA5A5" }} />
                <p className="text-sm text-slate-500 mb-3">{detailError}</p>
                <button
                  onClick={() => selected && fetchDetail(selected)}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Thử lại
                </button>
              </div>

            ) : (
              <div className="space-y-4">
                {/* Header info */}
                <div className="rounded-xl p-3" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                  <p style={{ fontWeight: 700, fontSize: "0.88rem", color: "#0F172A" }}>{selected.title}</p>
                  <p style={{ fontSize: "0.75rem", color: "#64748B", marginTop: 2 }}>
                    {selected.userFullName || selected.userEmail || "Unknown user"} · {selected.userEmail || "No email"}
                  </p>
                  <p style={{ fontSize: "0.72rem", color: "#9CA3AF", marginTop: 2 }}>ID: {selected.feedbackId.slice(0, 12)}…</p>
                </div>

                {/* Content + related URL */}
                {(() => {
                  let targetUrl = selected.relatedUrl?.trim();
                  if (!targetUrl && selected.content) {
                    const match = selected.content.match(/([^\s]+(?:bing\.com\/th\/|[^\s]+\.(?:png|jpg|jpeg|webp|gif))[^\s]*)/i);
                    if (match) targetUrl = match[0];
                  }

                  const contentBlock = (
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Nội dung</p>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50/50 border border-slate-100 rounded-xl px-3.5 py-3">
                        {selected.content}
                      </p>
                    </div>
                  );

                  if (!targetUrl) return contentBlock;

                  const isImg     = isImageLink(targetUrl);
                  const validHref = targetUrl.startsWith("ttps://") ? "h" + targetUrl : targetUrl;

                  return (
                    <>
                      {contentBlock}
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">
                          {isImg ? "Ảnh đính kèm phát hiện được" : "URL liên quan"}
                        </p>
                        {isImg ? (
                          <a href={validHref} target="_blank" rel="noreferrer"
                            className="block rounded-xl border border-slate-200 bg-slate-50 p-1.5 transition hover:opacity-95 shadow-sm group"
                          >
                            <img
                              src={validHref}
                              alt="Ảnh đính kèm phản hồi"
                              className="max-h-48 w-full rounded-lg object-contain bg-white"
                              onError={e => { e.currentTarget.style.display = "none"; }}
                            />
                            <span className="block text-[10px] text-slate-400 text-center mt-1 font-semibold group-hover:text-slate-600">
                              Mở ảnh trong tab mới ↗
                            </span>
                          </a>
                        ) : (
                          <a href={validHref} target="_blank" rel="noreferrer"
                            className="text-xs font-bold inline-flex items-center gap-1 break-all underline hover:opacity-80 transition"
                            style={{ color: accent }}
                          >
                            <LinkIcon size={11} className="shrink-0" /> {targetUrl}
                          </a>
                        )}
                      </div>
                    </>
                  );
                })()}

                {/* Status update */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                    Cập nhật trạng thái
                  </label>
                  <select
                    value={statusDraft}
                    onChange={e => setStatusDraft(e.target.value as FeedbackStatus)}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white font-semibold outline-none focus:border-violet-400"
                  >
                    {Object.entries(FEEDBACK_STATUS_LABEL).map(([key, { label }]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Admin note */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                    Ghi chú Admin
                  </label>
                  <textarea
                    value={adminNote}
                    onChange={e => setAdminNote(e.target.value)}
                    rows={4}
                    placeholder="Thêm ghi chú phản hồi cho người dùng..."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700 bg-white resize-none outline-none focus:border-violet-400 transition"
                  />
                </div>

                {/* Save */}
                <button
                  onClick={handleUpdate}
                  disabled={updating}
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition cursor-pointer disabled:cursor-not-allowed shadow-md active:scale-[0.99]"
                  style={{ background: accent }}
                >
                  {updating ? (
                    <span className="flex items-center justify-center gap-2">
                      <LoaderCircle size={14} className="animate-spin" /> Đang lưu...
                    </span>
                  ) : "Lưu cập nhật"}
                </button>

                {/* Destructive action row */}
                <div className="pt-1 border-t border-slate-100 flex gap-2">
                  {/* Soft close */}
                  <button
                    title={selected.status === "CLOSED" ? "Phản hồi đã đóng" : "Đóng phản hồi"}
                    disabled={updating || selected.status === "CLOSED"}
                    onClick={() => setConfirmAction({ type: "close", feedbackId: selected.feedbackId, title: selected.title })}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    <Archive size={13} /> Đóng
                  </button>

                  {/* Hard delete */}
                  <button
                    disabled={updating}
                    onClick={() => setConfirmAction({ type: "delete", feedbackId: selected.feedbackId, title: selected.title })}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold border transition cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5"
                    style={{ borderColor: "rgba(220,38,38,0.3)", color: "#DC2626", background: "rgba(220,38,38,0.04)" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(220,38,38,0.09)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(220,38,38,0.04)"; }}
                  >
                    <Trash2 size={13} /> Xóa vĩnh viễn
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}


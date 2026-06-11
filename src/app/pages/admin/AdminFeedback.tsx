import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { MessageSquare, Search, RefreshCw, LoaderCircle, AlertCircle, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import {
  getAdminFeedbacks,
  getFeedbackDetail,
  updateFeedbackStatus,
  type FeedbackAdminResponse,
  type FeedbackStatus,
} from "../../../api/feedbackService";

interface AdminFeedbackProps {
  isDashboard?: boolean;
}

/* ─────────────────────────────────────────────────────────
   ── FEEDBACK VIEW CONSTANTS ──
───────────────────────────────────────────────────────── */
const FEEDBACK_TYPE_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  BUG:         { label: "Bug",      color: "#DC2626", bg: "rgba(220,38,38,0.08)" },
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

// Hàm chuẩn hóa đồng bộ chặt chẽ kiểu dữ liệu FeedbackStatus
const sanitizeFeedbackStatus = (status: string | undefined | null): FeedbackStatus => {
  if (!status) return "OPEN" as FeedbackStatus;
  const upperStatus = status.toUpperCase();
  if (upperStatus === "PENDING") return "OPEN" as FeedbackStatus;
  if (upperStatus === "REVIEWED") return "IN_PROGRESS" as FeedbackStatus;
  
  if (["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].includes(upperStatus)) {
    return upperStatus as FeedbackStatus;
  }
  return "OPEN" as FeedbackStatus;
};

// Hàm nhận diện link ảnh bao dung - Tha thứ mọi loại mất chữ đầu h do lỗi DB
function isImageLink(url: string): boolean {
  if (!url) return false;
  const cleanUrl = url.trim().toLowerCase();
  
  const isCdnImage =
    cleanUrl.includes("bing.com/th/") ||
    cleanUrl.includes("th.bing.com/th/") ||
    cleanUrl.includes("image") ||
    cleanUrl.includes("?w=");

  const pathWithoutQuery = cleanUrl.split(/[?#]/)[0];
  const hasImageExtension = /\.(png|jpg|jpeg|webp|gif|avif|bmp|svg)$/i.test(pathWithoutQuery);

  return hasImageExtension || isCdnImage;
}

export default function AdminFeedback({ isDashboard = false }: AdminFeedbackProps) {
  const [feedbacks, setFeedbacks] = useState<FeedbackAdminResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [selected, setSelected] = useState<FeedbackAdminResponse | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [updating, setUpdating] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [statusDraft, setStatusDraft] = useState<FeedbackStatus>("OPEN");
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const currentAccent = isDashboard ? "#FF6B00" : "#7C3AED";

const load = async (p: number, status = statusFilter) => {
    setLoading(true);
    try {
      // Thay đổi PAGE_SIZE thành số 15 ở đây
      const res = await getAdminFeedbacks(p, 15, status || undefined);
      setFeedbacks(res.content ?? res.items ?? []);
      setTotalItems(res.totalElements ?? res.totalItems ?? 0);
      setTotalPages(res.totalPages ?? 0);
      setPage(p);
    } catch (err) {
      toast.error((err as Error).message || "Không tải được danh sách feedback");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(0); }, []);

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

  const handleRetryDetail = () => {
    if (selected) fetchDetail(selected);
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

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });

  return (
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
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Table View */}
        <div className="xl:col-span-2 rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm">
          <div className="grid px-5 py-2.5" style={{ gridTemplateColumns: "2fr 1fr 1.2fr 1.2fr", borderBottom: "1px solid #F3F4F6", background: "#FAFAFA" }}>
            {["Người dùng / Tiêu đề", "Loại", "Trạng thái", "Thời gian"].map(col => (
              <span key={col} style={{ color: "#9CA3AF", fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{col}</span>
            ))}
          </div>

          {loading && Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="grid px-5 py-3.5 animate-pulse border-b border-slate-50" style={{ gridTemplateColumns: "2fr 1fr 1.2fr 1.2fr", alignItems: "center" }}>
              {[0.65, 0.35, 0.45, 0.5].map((w, j) => (
                <div key={j} className="h-3 rounded-full bg-slate-100" style={{ width: `${w * 100}%` }} />
              ))}
            </div>
          ))}

          {!loading && feedbacks.length === 0 && (
            <div className="py-16 text-center">
              <MessageSquare size={32} style={{ color: "#E5E7EB", margin: "0 auto 8px" }} />
              <p style={{ color: "#9CA3AF", fontSize: "0.85rem" }}>Không có feedback nào</p>
            </div>
          )}

          {!loading && feedbacks.map((fb, i) => {
            const typeInfo = FEEDBACK_TYPE_LABEL[fb.type] ?? FEEDBACK_TYPE_LABEL.OTHER;
            const currentStatus = sanitizeFeedbackStatus(fb.status);
            const statusInfo = FEEDBACK_STATUS_LABEL[currentStatus] ?? FEEDBACK_STATUS_LABEL.OPEN;
            const isActive = selected?.feedbackId === fb.feedbackId;
            return (
              <div key={fb.feedbackId}
                onClick={() => handleSelect(fb)}
                className="grid px-5 py-3 cursor-pointer transition-colors"
                style={{
                  gridTemplateColumns: "2fr 1fr 1.2fr 1.2fr",
                  borderBottom: "1px solid #F9FAFB",
                  alignItems: "center",
                  background: isActive ? (isDashboard ? "#FFF7ED" : "#F5F3FF") : undefined,
                  borderLeft: isActive ? `3px solid ${currentAccent}` : "3px solid transparent",
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "#F8FAFC"; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "#FFFFFF"; }}
              >
                <div className="min-w-0 pr-2">
                  <p style={{ fontWeight: 600, fontSize: "0.8rem", color: "#111827" }} className="truncate">{fb.title}</p>
                  <p style={{ fontSize: "0.7rem", color: "#9CA3AF" }} className="truncate">{fb.userFullName || fb.userEmail || "Unknown user"}</p>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold w-fit" style={{ background: typeInfo.bg, color: typeInfo.color }}>
                  {typeInfo.label}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border w-fit" style={{ background: statusInfo.bg, color: statusInfo.color, border: `1px solid ${statusInfo.border}` }}>
                  {statusInfo.label}
                </span>
                <span style={{ fontSize: "0.72rem", color: "#6B7280" }}>{formatDate(fb.createdAt)}</span>
              </div>
            );
          })}

          {/* Pagination */}
          <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: "1px solid #F3F4F6", background: "#FAFAFA" }}>
            <span style={{ fontSize: "0.8rem", color: "#64748B" }}>Trang {page + 1} · {totalItems} phản hồi</span>
            <div className="flex items-center gap-2">
              <button onClick={() => load(Math.max(0, page - 1))} disabled={page === 0 || loading} className="px-3 py-1.5 rounded-lg text-xs border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition disabled:opacity-40 cursor-pointer">← Trước</button>
              <button onClick={() => load(page + 1)} disabled={page + 1 >= totalPages || loading} className="px-3 py-1.5 rounded-lg text-xs border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition disabled:opacity-40 cursor-pointer">Tiếp →</button>
            </div>
          </div>
        </div>

        {/* Detail Panel */}
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
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl p-3" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                <p style={{ fontWeight: 700, fontSize: "0.88rem", color: "#0F172A" }}>{selected.title}</p>
                <p style={{ fontSize: "0.75rem", color: "#64748B", marginTop: 2 }}>
                  {selected.userFullName || selected.userEmail || "Unknown user"} · {selected.userEmail || "No email"}
                </p>
                <p style={{ fontSize: "0.72rem", color: "#9CA3AF", marginTop: 2 }}>ID: {selected.feedbackId.slice(0, 12)}…</p>
              </div>

              {(() => {
                let targetUrl = selected.relatedUrl?.trim();

                // Quét link ảnh dự phòng từ content nếu relatedUrl trống
                if (!targetUrl && selected.content) {
                  const urlRegex = /([^\s]+(?:bing\.com\/th\/|[^\s]+\.(?:png|jpg|jpeg|webp|gif))[^\s]*)/i;
                  const match = selected.content.match(urlRegex);
                  if (match) targetUrl = match[0];
                }

                if (!targetUrl) {
                  return (
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Nội dung</p>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50/50 border border-slate-100 rounded-xl px-3.5 py-3">
                        {selected.content}
                      </p>
                    </div>
                  );
                }

                const isImg = isImageLink(targetUrl);
                
                // Tự động sửa đầu link lỗi nếu DB lưu thiếu chữ 'h' (ttps:// -> https://)
                const validHref = targetUrl.startsWith("ttps://") ? "h" + targetUrl : targetUrl;

                return (
                  <>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Nội dung</p>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50/50 border border-slate-100 rounded-xl px-3.5 py-3">
                        {selected.content}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">
                        {isImg ? "Ảnh đính kèm phát hiện được" : "URL liên quan"}
                      </p>
                      {isImg ? (
                        <a
                          href={validHref}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-xl border border-slate-200 bg-slate-50 p-1.5 transition hover:opacity-95 shadow-sm max-w-full group"
                        >
                          <img
                            src={validHref}
                            alt="Ảnh đính kèm phản hồi"
                            className="max-h-48 w-full rounded-lg object-contain bg-white"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                              const fallbackText = event.currentTarget.nextElementSibling as HTMLElement;
                              if (fallbackText) fallbackText.style.display = "block";
                            }}
                          />
                          <span className="block text-[10px] text-slate-400 text-center mt-1 font-semibold group-hover:text-slate-600">
                            Mở ảnh trong tab mới ↗
                          </span>
                        </a>
                      ) : (
                        <a
                          href={validHref}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold inline-flex items-center gap-1 break-all underline hover:opacity-80 transition"
                          style={{ color: currentAccent }}
                        >
                          <LinkIcon size={11} className="shrink-0" /> {targetUrl}
                        </a>
                      )}
                    </div>
                  </>
                );
              })()}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Cập nhật trạng thái</label>
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

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Ghi chú Admin</label>
                <textarea
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  rows={4}
                  placeholder="Thêm ghi chú phản hồi cho người dùng..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700 bg-white resize-none outline-none focus:border-violet-400 transition"
                />
              </div>

              <button
                onClick={handleUpdate}
                disabled={updating}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition cursor-pointer disabled:cursor-not-allowed shadow-md active:scale-[0.99]"
                style={{ background: currentAccent }}
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
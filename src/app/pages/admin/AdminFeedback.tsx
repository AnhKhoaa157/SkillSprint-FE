import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";
import {
  getAdminFeedbacks,
  updateFeedbackStatus,
  type FeedbackAdminResponse,
  type FeedbackStatus,
} from "../../../api/feedbackService";

interface AdminFeedbackProps {
  isDashboard?: boolean;
}

/* ─────────────────────────────────────────────────────────
   ── FEEDBACK VIEW ──
───────────────────────────────────────────────────────── */
const FEEDBACK_TYPE_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  BUG:         { label: "Bug",         color: "#DC2626", bg: "rgba(220,38,38,0.08)" },
  IMPROVEMENT: { label: "Cải tiến",    color: "#C2410C", bg: "rgba(255,107,0,0.08)" },
  QUESTION:    { label: "Câu hỏi",     color: "#0284C7", bg: "rgba(2,132,199,0.08)" },
  OTHER:       { label: "Khác",        color: "#64748B", bg: "rgba(100,116,139,0.08)" },
};

const FEEDBACK_STATUS_LABEL: Record<string, { label: string; color: string; bg: string; border: string }> = {
  OPEN:        { label: "Chờ xử lý",      color: "#B45309", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.28)" },
  IN_PROGRESS: { label: "Đang xử lý",     color: "#0284C7", bg: "rgba(2,132,199,0.08)",   border: "rgba(2,132,199,0.28)"  },
  RESOLVED:    { label: "Đã giải quyết",  color: "#15803D", bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.28)"  },
  CLOSED:      { label: "Đã đóng",        color: "#64748B", bg: "rgba(100,116,139,0.08)", border: "rgba(100,116,139,0.28)" },
};

function sanitizeFeedbackStatus(status: string | undefined | null): FeedbackStatus {
  if (!status) return "OPEN" as FeedbackStatus;

  const value = status.toUpperCase();
  if (value === "PENDING") return "OPEN" as FeedbackStatus;
  if (value === "REVIEWED") return "IN_PROGRESS" as FeedbackStatus;

  if (
    value === "OPEN" ||
    value === "IN_PROGRESS" ||
    value === "RESOLVED" ||
    value === "CLOSED"
  ) {
    return value as FeedbackStatus;
  }

  return "OPEN" as FeedbackStatus;
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
  const PAGE_SIZE = 15;

  const load = async (p: number, status = statusFilter) => {
    setLoading(true);
    try {
      const res = await getAdminFeedbacks(p, PAGE_SIZE, status || undefined);
      setFeedbacks(res.items ?? []);
      setTotalItems(res.totalItems ?? 0);
      setTotalPages(res.totalPages ?? 0);
      setPage(p);
    } catch (err) {
      toast.error((err as Error).message || "Không tải được danh sách feedback");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(0); }, []);

  const handleSelect = (fb: FeedbackAdminResponse) => {
    setSelected(fb);
    setStatusDraft(sanitizeFeedbackStatus(fb.status));
    setAdminNote(fb.adminNote || "");
  };

  const handleUpdate = async () => {
    if (!selected) return;
    setUpdating(true);
    try {
      const updated = await updateFeedbackStatus(selected.feedbackId, statusDraft, adminNote || undefined);
      setSelected(updated);
      setFeedbacks(prev => prev.map(fb => fb.feedbackId === updated.feedbackId ? updated : fb));
      toast.success("Cập nhật feedback thành công");
    } catch (err) {
      toast.error((err as Error).message || "Lỗi cập nhật");
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Header banner */}
      <div className="rounded-2xl p-5"
        style={{ background: "linear-gradient(135deg,#FFFFFF 0%,#FFF7ED 100%)", border: "1px solid #FFEDD5" }}>
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#0F172A" }}>Feedback người dùng</h2>
            <p style={{ margin: "4px 0 0", color: "#64748B", fontSize: "0.88rem" }}>Xem và xử lý phản hồi, báo lỗi từ người dùng</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs" style={{ background: "#fff", border: "1px solid #E5E7EB", color: "#334155" }}>
              Tổng: {totalItems}
            </span>
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); load(0, e.target.value); }}
              style={{ height: 32, padding: "0 10px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: "0.82rem", color: "#334155" }}
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(FEEDBACK_STATUS_LABEL).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Table */}
        <div className="xl:col-span-2 rounded-2xl overflow-hidden"
          style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div className="grid px-5 py-2.5"
            style={{ gridTemplateColumns: "2fr 1fr 1.2fr 1.2fr", borderBottom: "1px solid #F3F4F6", background: "#FAFAFA" }}>
            {["Người dùng / Tiêu đề", "Loại", "Trạng thái", "Thời gian"].map(col => (
              <span key={col} style={{ color: "#9CA3AF", fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {col}
              </span>
            ))}
          </div>

          {loading && Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="grid px-5 py-3.5 animate-pulse"
              style={{ gridTemplateColumns: "2fr 1fr 1.2fr 1.2fr", borderBottom: "1px solid #F9FAFB", alignItems: "center" }}>
              {[0.7, 0.4, 0.5, 0.55].map((w, j) => (
                <div key={j} className="h-3 rounded" style={{ background: "#F3F4F6", width: `${w * 100}%` }} />
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
              <motion.div key={fb.feedbackId}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                onClick={() => handleSelect(fb)}
                className="grid px-5 py-3 cursor-pointer"
                style={{
                  gridTemplateColumns: "2fr 1fr 1.2fr 1.2fr",
                  borderBottom: "1px solid #F9FAFB",
                  alignItems: "center",
                  background: isActive ? "#FFF7ED" : "#FFFFFF",
                  borderLeft: isActive ? "3px solid #FF6B00" : "3px solid transparent",
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "#F8FAFC"; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "#FFFFFF"; }}
              >
                <div className="min-w-0 pr-2">
                  <p style={{ fontWeight: 600, fontSize: "0.8rem", color: "#111827" }} className="truncate">{fb.title}</p>
                  <p style={{ fontSize: "0.7rem", color: "#9CA3AF" }} className="truncate">{fb.userFullName || fb.userEmail || "Unknown user"}</p>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold w-fit"
                  style={{ background: typeInfo.bg, color: typeInfo.color }}>
                  {typeInfo.label}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border w-fit"
                  style={{ background: statusInfo.bg, color: statusInfo.color, border: `1px solid ${statusInfo.border}` }}>
                  {statusInfo.label}
                </span>
                <span style={{ fontSize: "0.72rem", color: "#6B7280" }}>{formatDate(fb.createdAt)}</span>
              </motion.div>
            );
          })}

          {/* Pagination */}
          <div className="px-5 py-3 flex items-center justify-between"
            style={{ borderTop: "1px solid #F3F4F6", background: "#FAFAFA" }}>
            <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
              Trang {page + 1} · {totalItems} phản hồi
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => load(Math.max(0, page - 1))} disabled={page === 0 || loading}
                className="px-3 py-1.5 rounded-lg text-xs"
                style={{ border: "1px solid #E2E8F0", background: "#fff", color: "#334155", opacity: page === 0 || loading ? 0.4 : 1, cursor: page === 0 ? "not-allowed" : "pointer" }}>
                ← Trước
              </button>
              <button onClick={() => load(page + 1)} disabled={page + 1 >= totalPages || loading}
                className="px-3 py-1.5 rounded-lg text-xs"
                style={{ border: "1px solid #E2E8F0", background: "#fff", color: "#334155", opacity: page + 1 >= totalPages || loading ? 0.4 : 1, cursor: page + 1 >= totalPages ? "not-allowed" : "pointer" }}>
                Tiếp →
              </button>
            </div>
          </div>
        </div>

        {/* Detail panel */}
        <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: "0.95rem", fontWeight: 800, color: "#0F172A" }}>Chi tiết phản hồi</h3>
          {!selected ? (
            <p style={{ fontSize: "0.82rem", color: "#94A3B8" }}>Chọn một dòng để xem chi tiết và cập nhật.</p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl p-3" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                <p style={{ fontWeight: 700, fontSize: "0.88rem", color: "#0F172A" }}>{selected.title}</p>
                <p style={{ fontSize: "0.75rem", color: "#64748B", marginTop: 2 }}>
                  {selected.userFullName || selected.userEmail || "Unknown user"} · {selected.userEmail || "No email"}
                </p>
                <p style={{ fontSize: "0.72rem", color: "#9CA3AF", marginTop: 2 }}>ID: {selected.feedbackId.slice(0, 12)}…</p>
              </div>

              <div>
                <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B", marginBottom: 4 }}>Nội dung</p>
                <p style={{ fontSize: "0.82rem", color: "#374151", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{selected.content}</p>
              </div>

              {selected.relatedUrl && (
                <div>
                  <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B", marginBottom: 2 }}>URL liên quan</p>
                  <p style={{ fontSize: "0.75rem", color: "#FF6B00", wordBreak: "break-all" }}>{selected.relatedUrl}</p>
                </div>
              )}

              <div>
                <label style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 700, display: "block", marginBottom: 4 }}>Cập nhật trạng thái</label>
                <select value={statusDraft} onChange={e => setStatusDraft(e.target.value as FeedbackStatus)}
                  style={{ width: "100%", height: 36, borderRadius: 8, border: "1px solid #E2E8F0", padding: "0 10px", fontSize: "0.82rem" }}>
                  <option value="OPEN">Chờ xử lý</option>
                  <option value="IN_PROGRESS">Đang xử lý</option>
                  <option value="RESOLVED">Đã giải quyết</option>
                  <option value="CLOSED">Đã đóng</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 700, display: "block", marginBottom: 4 }}>Ghi chú Admin</label>
                <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={3}
                  placeholder="Thêm ghi chú phản hồi..."
                  style={{ width: "100%", borderRadius: 8, border: "1px solid #E2E8F0", padding: "8px 10px", fontSize: "0.82rem", resize: "vertical" }} />
              </div>

              <button onClick={handleUpdate} disabled={updating}
                className="w-full py-2 rounded-xl text-sm font-semibold"
                style={{ background: "#FF6B00", color: "#fff", opacity: updating ? 0.6 : 1, cursor: updating ? "not-allowed" : "pointer" }}>
                {updating ? "Đang lưu..." : "Lưu cập nhật"}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

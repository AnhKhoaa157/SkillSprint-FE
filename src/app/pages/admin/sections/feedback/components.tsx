import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  MessageSquare, Search, RefreshCw, LoaderCircle,
  Link as LinkIcon, Trash2, Archive, AlertCircle,
} from "lucide-react";
import type { FeedbackStatus } from "../../../../../api/feedbackService";
import {
  FEEDBACK_TYPE_LABEL,
  FEEDBACK_STATUS_LABEL,
  sanitizeFeedbackStatus,
  isImageLink,
  formatDate,
  type ConfirmAction,
} from "./config";
import type { FeedbackManager } from "./useFeedback";

/* ─────────────────────────────────────────────────────────
   CONFIRM MODAL
───────────────────────────────────────────────────────── */
interface ConfirmModalProps {
  action: ConfirmAction;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

export function ConfirmModal({ action, onConfirm, onCancel, loading }: ConfirmModalProps) {
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
   TOOLBAR (search + filters)
───────────────────────────────────────────────────────── */
export function FeedbackToolbar({ fb }: { fb: FeedbackManager }) {
  const {
    load, isFetching, feedbacks, applyFilters,
    typeFilter, statusFilter, searchInput, dateFrom, dateTo,
    accent, hasFilters, clearFilters, page,
  } = fb;

  // Consolidated, uncommitted filter draft. Nothing is sent to the API until the
  // user clicks "Áp dụng" — individual select/date changes only mutate this object.
  const [draft, setDraft] = useState({
    status: statusFilter, type: typeFilter, search: searchInput, dateFrom, dateTo,
  });

  // Re-sync the draft whenever the applied filters change from the outside
  // (e.g. "Xóa lọc"), so the inputs reflect the live state.
  useEffect(() => {
    setDraft({ status: statusFilter, type: typeFilter, search: searchInput, dateFrom, dateTo });
  }, [statusFilter, typeFilter, searchInput, dateFrom, dateTo]);

  const apply = () => applyFilters(draft);

  // Uniform primitive styling shared across every input/select in the bar.
  const fieldCls = "text-sm px-3 py-2 rounded-md border border-slate-200 bg-white text-slate-700 outline-none transition focus:border-violet-400";

  return (
    <div
      className="p-3 flex flex-col gap-3"
      style={{ borderBottom: "1px solid #F3F4F6", background: "#FAFAFA" }}
    >
      {/* Top Row: Search & Refresh Group */}
      <div className="flex items-center gap-2 w-full">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={draft.search}
            onChange={e => setDraft(d => ({ ...d, search: e.target.value }))}
            onKeyDown={e => e.key === "Enter" && apply()}
            placeholder="Tìm tiêu đề, email, nội dung..."
            className={`${fieldCls} w-full pl-8`}
          />
        </div>
        <button
          type="button"
          title="Refresh list"
          aria-label="Refresh list"
          onClick={() => load(page, statusFilter, typeFilter, searchInput, dateFrom, dateTo, { silent: feedbacks.length > 0 })}
          disabled={isFetching}
          className="h-9 w-9 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Bottom Row: Filters & Actions Group */}
      <div className="flex items-center gap-2 flex-wrap w-full">
        <div className="relative flex-1 min-w-[130px]">
          <select
            value={draft.type}
            onChange={e => setDraft(d => ({ ...d, type: e.target.value }))}
            className={`${fieldCls} w-full appearance-none pr-8 font-semibold cursor-pointer`}
          >
            <option value="">Tất cả loại</option>
            {Object.entries(FEEDBACK_TYPE_LABEL).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>

        <div className="relative flex-1 min-w-[130px]">
          <select
            value={draft.status}
            onChange={e => setDraft(d => ({ ...d, status: e.target.value }))}
            className={`${fieldCls} w-full appearance-none pr-8 font-semibold cursor-pointer`}
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(FEEDBACK_STATUS_LABEL).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>

        <input
          type="date"
          aria-label="Từ ngày"
          title="Từ ngày"
          value={draft.dateFrom}
          max={draft.dateTo || undefined}
          onChange={e => setDraft(d => ({ ...d, dateFrom: e.target.value }))}
          className={`${fieldCls} flex-1 min-w-[130px]`}
        />
        <input
          type="date"
          aria-label="Đến ngày"
          title="Đến ngày"
          value={draft.dateTo}
          min={draft.dateFrom || undefined}
          onChange={e => setDraft(d => ({ ...d, dateTo: e.target.value }))}
          className={`${fieldCls} flex-1 min-w-[130px]`}
        />

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={apply}
            disabled={isFetching}
            className="px-6 py-2 rounded-md text-sm font-bold text-white cursor-pointer shadow-sm shrink-0 transition active:scale-[0.97] disabled:opacity-50"
            style={{ background: `linear-gradient(135deg,${accent},${accent}cc)` }}
          >
            Áp dụng
          </button>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded-md text-sm font-semibold border border-slate-200 text-slate-500 hover:bg-slate-100 transition cursor-pointer shrink-0"
            >
              Xóa lọc
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   TABLE (header + skeleton + rows + pagination)
───────────────────────────────────────────────────────── */
export function FeedbackTable({ fb }: { fb: FeedbackManager }) {
  const {
    showInitialSkeleton, isFetching, feedbacks, hasFilters, selected,
    isDashboard, accent, handleSelect, setConfirmAction,
    page, totalItems, totalPages, load,
  } = fb;

  return (
    <>
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
      {!showInitialSkeleton && feedbacks.map(fbItem => {
        const typeInfo   = FEEDBACK_TYPE_LABEL[fbItem.type] ?? FEEDBACK_TYPE_LABEL.OTHER;
        const curStatus  = sanitizeFeedbackStatus(fbItem.status);
        const statusInfo = FEEDBACK_STATUS_LABEL[curStatus] ?? FEEDBACK_STATUS_LABEL.OPEN;
        const isActive   = selected?.feedbackId === fbItem.feedbackId;
        const isClosed   = curStatus === "CLOSED";

        return (
          <div
            key={fbItem.feedbackId}
            onClick={() => handleSelect(fbItem)}
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
              <p style={{ fontWeight: 600, fontSize: "0.8rem", color: "#111827" }} className="truncate">{fbItem.title}</p>
              <p style={{ fontSize: "0.7rem", color: "#9CA3AF" }} className="truncate">
                {fbItem.userFullName || fbItem.userEmail || "Unknown user"}
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
            <span style={{ fontSize: "0.72rem", color: "#6B7280" }}>{formatDate(fbItem.createdAt)}</span>

            {/* Row actions — stop propagation so clicking buttons doesn't open the detail panel */}
            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
              {/* Soft close */}
              <button
                title={isClosed ? "Phản hồi đã đóng" : "Đóng phản hồi"}
                disabled={isClosed}
                onClick={() => setConfirmAction({ type: "close", feedbackId: fbItem.feedbackId, title: fbItem.title })}
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
                onClick={() => setConfirmAction({ type: "delete", feedbackId: fbItem.feedbackId, title: fbItem.title })}
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
    </>
  );
}

/* ─────────────────────────────────────────────────────────
   DETAIL PANEL
───────────────────────────────────────────────────────── */
export function FeedbackDetailPanel({ fb }: { fb: FeedbackManager }) {
  const {
    selected, detailLoading, detailError, fetchDetail,
    statusDraft, setStatusDraft, adminNote, setAdminNote,
    updating, handleUpdate, accent, setConfirmAction,
  } = fb;

  return (
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
  );
}

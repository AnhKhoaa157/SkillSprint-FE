import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  deleteFeedback,
  FeedbackStatus,
  getAdminFeedbacks,
  getFeedbackDetail,
  updateFeedbackStatus,
  type FeedbackAdminResponse,
} from "../../../../../api/feedbackService";
import { sanitizeFeedbackStatus, type ConfirmAction } from "./config";

/**
 * Owns all feedback list/detail state and side-effects: paginated fetching,
 * polling, filters, detail loading, status updates, and delete/close actions.
 * The presentational components consume the returned object.
 */
export function useFeedback(isDashboard: boolean) {
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

  return {
    isDashboard,
    feedbacks,
    page,
    totalPages,
    totalItems,
    selected,
    statusFilter, setStatusFilter,
    typeFilter, setTypeFilter,
    searchInput, setSearchInput,
    updating,
    adminNote, setAdminNote,
    statusDraft, setStatusDraft,
    detailLoading,
    detailError,
    confirmAction, setConfirmAction,
    actionLoading,
    accent,
    hasFilters,
    isFetching,
    showInitialSkeleton,
    load,
    clearFilters,
    fetchDetail,
    handleSelect,
    handleUpdate,
    handleConfirmAction,
  };
}

export type FeedbackManager = ReturnType<typeof useFeedback>;

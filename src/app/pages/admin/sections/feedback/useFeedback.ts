import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  deleteFeedback,
  FeedbackStatus,
  getAdminFeedbacks,
  getFeedbackDetail,
  updateFeedbackStatus,
  type FeedbackAdminResponse,
} from "../../../../../api/utilities/feedbackService";
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
  const [dateFrom, setDateFrom]         = useState("");
  const [dateTo, setDateTo]             = useState("");
  const [updating, setUpdating]         = useState(false);
  const [adminNote, setAdminNote]       = useState("");
  const [adminReply, setAdminReply]     = useState("");
  const [statusDraft, setStatusDraft]   = useState(FeedbackStatus.OPEN);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError]   = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const accent = isDashboard ? "#FF6B00" : "#7C3AED";
  const hasFilters = searchInput || typeFilter || statusFilter || dateFrom || dateTo;
  const isFetching = loading || isRefreshing;
  const showInitialSkeleton = loading && feedbacks.length === 0;

  /* ── Data Fetching ── */
  const load = useCallback(async (
    p: number,
    status = statusFilter,
    type   = typeFilter,
    search = searchInput,
    from   = dateFrom,
    to     = dateTo,
    options?: { silent?: boolean },
  ) => {
    const setBusy = options?.silent ? setIsRefreshing : setLoading;
    setBusy(true);
    try {
      const res = await getAdminFeedbacks(
        p, 15,
        status || undefined,
        type || undefined,
        search || undefined,
        from || undefined,
        to || undefined,
      );
      setFeedbacks(res.content ?? res.items ?? []);
      setTotalItems(res.totalElements ?? res.totalItems ?? 0);
      setTotalPages(res.totalPages ?? 0);
      setPage(p);
    } catch (err) {
      toast.error((err as Error).message || "Không tải được danh sách feedback");
    } finally {
      setBusy(false);
    }
  }, [searchInput, statusFilter, typeFilter, dateFrom, dateTo]);

  useEffect(() => {
    load(0);
    // Initial fetch only; filter/search handlers call load explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      load(page, statusFilter, typeFilter, searchInput, dateFrom, dateTo, { silent: true });
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [load, page, searchInput, statusFilter, typeFilter, dateFrom, dateTo]);

  /**
   * Apply the consolidated filter object in a single, explicit API request.
   * Selects/date inputs only mutate a local draft in the toolbar; nothing hits
   * the server until the user clicks "Áp dụng" (this), keeping individual filter
   * changes from firing redundant requests.
   */
  const applyFilters = useCallback((next: {
    status: string; type: string; search: string; dateFrom: string; dateTo: string;
  }) => {
    setStatusFilter(next.status);
    setTypeFilter(next.type);
    setSearchInput(next.search);
    setDateFrom(next.dateFrom);
    setDateTo(next.dateTo);
    load(0, next.status, next.type, next.search, next.dateFrom, next.dateTo);
  }, [load]);

  const clearFilters = () => {
    setSearchInput("");
    setTypeFilter("");
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
    load(0, "", "", "", "", "");
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
      setAdminReply(fresh.adminReply || "");
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
    setAdminReply(fb.adminReply || "");
    fetchDetail(fb);
  };

  const handleUpdate = async () => {
    if (!selected) return;
    setUpdating(true);
    try {
      const updated = await updateFeedbackStatus(selected.feedbackId, statusDraft, adminNote.trim() || undefined, adminReply.trim() || undefined);
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
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    applyFilters,
    updating,
    adminNote, setAdminNote,
    adminReply, setAdminReply,
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

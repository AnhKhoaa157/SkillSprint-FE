import { requestJson } from "./apiClient";

export type FeedbackType = "BUG" | "IMPROVEMENT" | "QUESTION" | "OTHER";
export type FeedbackStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export type CreateFeedbackRequest = {
  type: FeedbackType;
  title: string;
  content: string;
  relatedUrl?: string | null;
};

export type FeedbackAdminResponse = {
  feedbackId: string;
  userId: string | null;
  userEmail: string | null;
  userFullName: string | null;
  type: FeedbackType;
  title: string;
  content: string;
  relatedUrl: string | null;
  status: FeedbackStatus;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string | null;
};

export type FeedbackSubmitResponse = {
  feedbackId: string;
  type: FeedbackType;
  title: string;
  status: FeedbackStatus;
  createdAt: string;
};

export type FeedbackResponse = FeedbackAdminResponse;

export type FeedbackListResponse = {
  items: FeedbackAdminResponse[];
  content: FeedbackAdminResponse[];
  totalItems: number;
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  first?: boolean;
  last?: boolean;
};

function normalizeStatus(status: unknown): FeedbackStatus {
  const value = typeof status === "string" ? status.toUpperCase() : "OPEN";
  if (value === "PENDING") return "OPEN";
  if (value === "REVIEWED") return "IN_PROGRESS";
  if (value === "OPEN" || value === "IN_PROGRESS" || value === "RESOLVED" || value === "CLOSED") {
    return value;
  }
  return "OPEN";
}

function normalizeFeedback(raw: any): FeedbackAdminResponse {
  return {
    feedbackId: String(raw?.feedbackId ?? raw?.id ?? ""),
    userId: raw?.userId ?? null,
    userEmail: raw?.userEmail ?? null,
    userFullName: raw?.userFullName ?? null,
    type: (raw?.type ?? "OTHER") as FeedbackType,
    title: String(raw?.title ?? ""),
    content: String(raw?.content ?? raw?.message ?? ""),
    relatedUrl: raw?.relatedUrl ?? null,
    status: normalizeStatus(raw?.status),
    adminNote: raw?.adminNote ?? null,
    createdAt: String(raw?.createdAt ?? ""),
    updatedAt: raw?.updatedAt ?? null,
  };
}

function normalizeSubmitFeedback(raw: any): FeedbackSubmitResponse {
  return {
    feedbackId: String(raw?.feedbackId ?? raw?.id ?? ""),
    type: (raw?.type ?? "OTHER") as FeedbackType,
    title: String(raw?.title ?? ""),
    status: normalizeStatus(raw?.status),
    createdAt: String(raw?.createdAt ?? ""),
  };
}

function normalizeFeedbackList(raw: any): FeedbackListResponse {
  const rawItems = Array.isArray(raw?.items)
    ? raw.items
    : Array.isArray(raw?.content)
      ? raw.content
      : [];
  const items = rawItems.map(normalizeFeedback);
  const totalItems = Number(raw?.totalItems ?? raw?.totalElements ?? items.length);

  return {
    items,
    content: items,
    totalItems,
    totalElements: totalItems,
    totalPages: Number(raw?.totalPages ?? 0),
    page: Number(raw?.page ?? raw?.number ?? 0),
    size: Number(raw?.size ?? items.length),
    first: raw?.first,
    last: raw?.last,
  };
}

export async function createFeedback(req: CreateFeedbackRequest): Promise<FeedbackSubmitResponse> {
  const res = await requestJson<unknown>("/api/feedback", {
    method: "POST",
    body: JSON.stringify(req),
  });
  if (!res.data) throw new Error(res.message || "Gửi feedback thất bại");
  return normalizeSubmitFeedback(res.data);
}

export async function getAdminFeedbacks(page = 0, size = 15, status?: string): Promise<FeedbackListResponse> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (status) params.set("status", status);
  const res = await requestJson<unknown>(`/api/admin/feedback?${params.toString()}`);
  if (!res.data) throw new Error(res.message || "Không tải được danh sách feedback");
  return normalizeFeedbackList(res.data);
}

export async function getFeedbackDetail(feedbackId: string): Promise<FeedbackAdminResponse> {
  if (!feedbackId || typeof feedbackId !== "string" || !feedbackId.trim()) {
    throw new Error("Feedback ID không hợp lệ");
  }
  const res = await requestJson<unknown>(`/api/admin/feedback/${encodeURIComponent(feedbackId.trim())}`);
  if (!res.data) throw new Error(res.message || "Không tải được chi tiết feedback");
  return normalizeFeedback(res.data);
}

export async function updateFeedbackStatus(feedbackId: string, status: FeedbackStatus, adminNote?: string): Promise<FeedbackAdminResponse> {
  const res = await requestJson<unknown>(`/api/admin/feedback/${encodeURIComponent(feedbackId)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, adminNote: adminNote ?? null }),
  });
  if (!res.data) throw new Error(res.message || "Cập nhật feedback thất bại");
  return normalizeFeedback(res.data);
}

export default { createFeedback, getAdminFeedbacks, getFeedbackDetail, updateFeedbackStatus };

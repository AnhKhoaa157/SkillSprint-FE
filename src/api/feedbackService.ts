import { getAuthHeaders, requestJson, type ApiResponse } from "./apiClient";
import { API_BASE } from "./config";

export enum FeedbackType {
  BUG = "BUG",
  IMPROVEMENT = "IMPROVEMENT",
  QUESTION = "QUESTION",
  OTHER = "OTHER",
}

export enum FeedbackStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
}

export interface FeedbackResponse {
  feedbackId: string;
  userId?: string | null;
  userEmail?: string | null;
  userFullName?: string | null;
  type: FeedbackType;
  title: string;
  content: string;
  relatedUrl: string | null;
  imageUrl: string | null;
  status: FeedbackStatus;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface FeedbackAdminResponse extends FeedbackResponse {
  userId: string | null;
  userEmail: string | null;
  userFullName: string | null;
}

export interface FeedbackSubmitResponse extends FeedbackResponse {}

export interface FeedbackPageResponse<T = FeedbackResponse> {
  items: T[];
  content: T[];
  totalItems: number;
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  first: boolean;
  last: boolean;
}

// Payload gửi lên loại bỏ hoàn toàn trường File máy "image"
export interface CreateFeedbackPayload {
  type: FeedbackType;
  title: string;
  content: string;
  relatedUrl?: string | null;
  imageUrl?: string | null;
}

function normalizeStatus(status: unknown): FeedbackStatus {
  const value = typeof status === "string" ? status.toUpperCase() : FeedbackStatus.OPEN;
  if (value === "PENDING") return FeedbackStatus.OPEN;
  if (value === "REVIEWED") return FeedbackStatus.IN_PROGRESS;
  if (
    value === FeedbackStatus.OPEN ||
    value === FeedbackStatus.IN_PROGRESS ||
    value === FeedbackStatus.RESOLVED ||
    value === FeedbackStatus.CLOSED
  ) {
    return value;
  }
  return FeedbackStatus.OPEN;
}

function normalizeType(type: unknown): FeedbackType {
  const value = typeof type === "string" ? type.toUpperCase() : FeedbackType.OTHER;
  if (value === "SUGGESTION") return FeedbackType.IMPROVEMENT;
  if (
    value === FeedbackType.BUG ||
    value === FeedbackType.IMPROVEMENT ||
    value === FeedbackType.QUESTION ||
    value === FeedbackType.OTHER
  ) {
    return value;
  }
  return FeedbackType.OTHER;
}

function normalizeFeedback(raw: any): FeedbackResponse {
  return {
    feedbackId: String(raw?.feedbackId ?? raw?.id ?? ""),
    type: normalizeType(raw?.type),
    title: String(raw?.title ?? ""),
    content: String(raw?.content ?? raw?.message ?? ""),
    relatedUrl: raw?.relatedUrl ?? null,
    imageUrl: raw?.imageUrl ?? null,
    status: normalizeStatus(raw?.status),
    adminNote: raw?.adminNote ?? null,
    createdAt: String(raw?.createdAt ?? ""),
    updatedAt: raw?.updatedAt ?? null,
  };
}

function normalizeAdminFeedback(raw: any): FeedbackAdminResponse {
  return {
    ...normalizeFeedback(raw),
    userId: raw?.userId ?? null,
    userEmail: raw?.userEmail ?? null,
    userFullName: raw?.userFullName ?? null,
  };
}

function normalizePage<T>(raw: any, mapper: (item: any) => T): FeedbackPageResponse<T> {
  const rawItems = Array.isArray(raw?.items)
    ? raw.items
    : Array.isArray(raw?.content)
      ? raw.content
      : [];
  const items = rawItems.map(mapper);
  const totalItems = Number(raw?.totalItems ?? raw?.totalElements ?? items.length);
  const page = Number(raw?.page ?? raw?.number ?? 0);
  const size = Number(raw?.size ?? items.length);
  const totalPages = Number(raw?.totalPages ?? (size > 0 ? Math.ceil(totalItems / size) : 0));

  return {
    items,
    content: items,
    totalItems,
    totalElements: totalItems,
    totalPages,
    page,
    size,
    first: Boolean(raw?.first ?? (page <= 0)),
    last: Boolean(raw?.last ?? (totalPages === 0 || page + 1 >= totalPages)),
  };
}

function cleanText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function parseApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new Event("session-kickout-triggered"));
    }
    throw new Error(payload?.message || `Server error: ${response.status}`);
  }

  if (!payload) {
    throw new Error("Invalid response from server");
  }

  return payload;
}

export async function getMyFeedbacks(page = 0, size = 10): Promise<FeedbackPageResponse<FeedbackResponse>> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  const response = await fetch(`${API_BASE}/api/feedback/my?${params.toString()}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  const payload = await parseApiResponse<unknown>(response);

  if (!payload.data) {
    throw new Error(payload.message || "Could not load your feedback history");
  }

  return normalizePage(payload.data, normalizeFeedback);
}

// Hàm gửi Feedback đã được xóa sạch FormData, chỉ gửi JSON thuần túy qua requestJson
export async function createFeedback(payload: CreateFeedbackPayload): Promise<FeedbackResponse> {
  const body = {
    type: payload.type,
    title: payload.title.trim(),
    content: payload.content.trim(),
    ...(cleanText(payload.relatedUrl) ? { relatedUrl: cleanText(payload.relatedUrl) } : {}),
    ...(cleanText(payload.imageUrl) ? { imageUrl: cleanText(payload.imageUrl) } : {}),
  };

  const result = await requestJson<unknown>("/api/feedback", {
    method: "POST",
    body: JSON.stringify(body),
  });
  
  if (!result.data) throw new Error(result.message || "Could not submit feedback");
  return normalizeFeedback(result.data);
}

export async function getAdminFeedbacks(
  page = 0,
  size = 15,
  status?: string,
  type?: string,
  search?: string,
): Promise<FeedbackPageResponse<FeedbackAdminResponse>> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (status) params.set("status", status);
  if (type) params.set("type", type);
  if (search?.trim()) params.set("search", search.trim());
  const result = await requestJson<unknown>(`/api/admin/feedback?${params.toString()}`);
  if (!result.data) throw new Error(result.message || "Could not load feedback list");
  return normalizePage(result.data, normalizeAdminFeedback);
}

export async function deleteFeedback(feedbackId: string): Promise<void> {
  const id = feedbackId.trim();
  if (!id) throw new Error("Invalid feedback ID");
  await requestJson<null>(`/api/admin/feedback/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function getFeedbackDetail(feedbackId: string): Promise<FeedbackAdminResponse> {
  const id = feedbackId.trim();
  if (!id) throw new Error("Invalid feedback ID");

  const result = await requestJson<unknown>(`/api/admin/feedback/${encodeURIComponent(id)}`);
  if (!result.data) throw new Error(result.message || "Could not load feedback detail");
  return normalizeAdminFeedback(result.data);
}

export async function updateFeedbackStatus(
  feedbackId: string,
  status: FeedbackStatus | string,
  adminNote?: string,
): Promise<FeedbackAdminResponse> {
  const result = await requestJson<unknown>(`/api/admin/feedback/${encodeURIComponent(feedbackId)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, adminNote: cleanText(adminNote) }),
  });
  if (!result.data) throw new Error(result.message || "Could not update feedback");
  return normalizeAdminFeedback(result.data);
}

export default {
  createFeedback,
  getMyFeedbacks,
  getAdminFeedbacks,
  getFeedbackDetail,
  updateFeedbackStatus,
  deleteFeedback,
};
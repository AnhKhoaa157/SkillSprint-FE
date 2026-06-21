import { getAuthHeaders, requestJson, type ApiResponse } from "../core/apiClient";
import { triggerSessionExpiry, extractAuthCode } from "../auth/sessionExpiry";
import { API_BASE } from "../core/config";

export enum FeedbackType {
  BUG = "BUG",
  IMPROVEMENT = "IMPROVEMENT",
  QUESTION = "QUESTION",
  OTHER = "OTHER",
}

export enum FeedbackStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
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
  adminReply?: string | null;
  repliedAt?: string | null;
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

// Payload gửi lên: ảnh được upload trực tiếp lên S3, BE chỉ nhận imageObjectKey
export interface CreateFeedbackPayload {
  type: FeedbackType;
  title: string;
  content: string;
  relatedUrl?: string | null;
  imageObjectKey?: string | null;
}

// Phản hồi của BE khi xin presigned URL để upload ảnh feedback lên S3
export interface FeedbackUploadUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  objectKey: string;
  expiresAt: string;
}

// Loại file ảnh được phép upload (đồng bộ với allow-list ở BE)
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

function normalizeStatus(status: unknown): FeedbackStatus {
  const value = typeof status === "string" ? status.toUpperCase() : FeedbackStatus.OPEN;
  if (value === "PENDING") return FeedbackStatus.OPEN;
  if (value === "REVIEWED") return FeedbackStatus.IN_PROGRESS;
  if (
    value === FeedbackStatus.OPEN ||
    value === FeedbackStatus.IN_PROGRESS ||
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
    relatedUrl: raw?.relatedUrl ?? raw?.relatedURL ?? raw?.related_url ?? null,
    imageUrl: raw?.imageUrl ?? raw?.imageURL ?? raw?.image_url ?? raw?.screenshotUrl ?? raw?.attachmentUrl ?? null,
    status: normalizeStatus(raw?.status),
    adminNote: raw?.adminNote ?? null,
    adminReply: raw?.adminReply ?? null,
    repliedAt: raw?.repliedAt ?? null,
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
  const rawItems = Array.isArray(raw) 
    ? raw 
    : Array.isArray(raw?.items)
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
      triggerSessionExpiry({ status: 401, code: extractAuthCode(payload) });
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
  const response = await fetch(`${API_BASE}/api/feedback?${params.toString()}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  const payload = await parseApiResponse<unknown>(response);

  if (!payload.data) {
    throw new Error(payload.message || "Could not load your feedback history");
  }

  return normalizePage(payload.data, normalizeFeedback);
}

/**
 * GET /api/feedback/{feedbackId}
 * Fetch the detail of one of the logged-in user's own feedback entries.
 */
export async function getMyFeedbackDetail(feedbackId: string): Promise<FeedbackResponse> {
  const id = feedbackId.trim();
  if (!id) throw new Error("Invalid feedback ID");

  const result = await requestJson<unknown>(`/api/feedback/${encodeURIComponent(id)}`);
  if (!result.data) throw new Error(result.message || "Could not load feedback detail");
  return normalizeFeedback(result.data);
}

// Hàm gửi Feedback: chỉ gửi JSON thuần (ảnh đã nằm trên S3, tham chiếu qua imageObjectKey)
export async function createFeedback(payload: CreateFeedbackPayload): Promise<FeedbackResponse> {
  const body = {
    type: payload.type,
    title: payload.title.trim(),
    content: payload.content.trim(),
    ...(cleanText(payload.relatedUrl) ? { relatedUrl: cleanText(payload.relatedUrl) } : {}),
    ...(cleanText(payload.imageObjectKey) ? { imageObjectKey: cleanText(payload.imageObjectKey) } : {}),
  };

  const result = await requestJson<unknown>("/api/feedback", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!result.data) throw new Error(result.message || "Could not submit feedback");
  return normalizeFeedback(result.data);
}

/**
 * Xin presigned PUT URL từ BE để upload 1 ảnh feedback lên S3.
 */
export async function getFeedbackImageUploadUrl(
  fileName: string,
  contentType: string,
): Promise<FeedbackUploadUrlResponse> {
  const result = await requestJson<FeedbackUploadUrlResponse>("/api/feedback/upload-url", {
    method: "POST",
    body: JSON.stringify({ fileName, contentType }),
  });
  if (!result.data) throw new Error(result.message || "Could not create upload URL");
  return result.data;
}

/**
 * Quy trình upload ảnh feedback 2 bước:
 *  1. Xin presigned URL + objectKey từ BE.
 *  2. PUT trực tiếp file bytes lên S3 (KHÔNG đi qua API server, KHÔNG gắn token).
 * Trả về objectKey để đính kèm vào payload createFeedback.
 */
export async function uploadFeedbackImage(file: File): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Ảnh chỉ hỗ trợ định dạng JPG, PNG, WEBP hoặc GIF.");
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("Ảnh vượt quá dung lượng cho phép (tối đa 5MB).");
  }

  const { uploadUrl, objectKey } = await getFeedbackImageUploadUrl(file.name, file.type);

  // PUT thẳng lên S3. Content-Type phải khớp với lúc ký presigned URL.
  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error(`Tải ảnh lên S3 thất bại (mã ${uploadResponse.status}). Vui lòng thử lại.`);
  }

  return objectKey;
}

export async function getAdminFeedbacks(
  page = 0,
  size = 15,
  status?: string,
  type?: string,
  search?: string,
  dateFrom?: string,
  dateTo?: string,
): Promise<FeedbackPageResponse<FeedbackAdminResponse>> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (status) params.set("status", status);
  if (type) params.set("type", type);
  if (search?.trim()) params.set("search", search.trim());
  if (dateFrom?.trim()) params.set("dateFrom", dateFrom.trim());
  if (dateTo?.trim()) params.set("dateTo", dateTo.trim());
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
  adminReply?: string,
): Promise<FeedbackAdminResponse> {
  const statusResult = await requestJson<unknown>(`/api/admin/feedback/${encodeURIComponent(feedbackId)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, adminNote: cleanText(adminNote) }),
  });
  
  if (!statusResult.data) throw new Error(statusResult.message || "Could not update feedback status");
  
  let finalData = statusResult.data;
  const cleanedReply = cleanText(adminReply);
  
  if (cleanedReply) {
    const replyResult = await requestJson<unknown>(`/api/admin/feedback/${encodeURIComponent(feedbackId)}/reply`, {
      method: "PATCH",
      body: JSON.stringify({ message: cleanedReply }),
    });
    if (!replyResult.data) throw new Error(replyResult.message || "Could not save admin reply");
    finalData = replyResult.data;
  }
  
  return normalizeAdminFeedback(finalData);
}

export default {
  createFeedback,
  getFeedbackImageUploadUrl,
  uploadFeedbackImage,
  getMyFeedbacks,
  getMyFeedbackDetail,
  getAdminFeedbacks,
  getFeedbackDetail,
  updateFeedbackStatus,
  deleteFeedback,
};

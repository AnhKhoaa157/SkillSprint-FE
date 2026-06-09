import { requestJson } from "./apiClient";

export type FeedbackType = "BUG" | "IMPROVEMENT" | "QUESTION" | "OTHER";

export type CreateFeedbackRequest = {
  type: FeedbackType;
  title: string;
  content: string;
  relatedUrl?: string | null;
};

export type FeedbackResponse = {
  feedbackId: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  type: FeedbackType;
  title: string;
  content: string;
  relatedUrl: string | null;
  status: string;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FeedbackListResponse = {
  items: FeedbackResponse[];
  totalItems: number;
  totalPages: number;
  page: number;
  size: number;
};

export async function createFeedback(req: CreateFeedbackRequest): Promise<FeedbackResponse> {
  const res = await requestJson<FeedbackResponse>("/api/feedback", {
    method: "POST",
    body: JSON.stringify(req),
  });
  if (!res.data) throw new Error(res.message || "Gửi feedback thất bại");
  return res.data;
}

export async function getAdminFeedbacks(page = 0, size = 15, status?: string): Promise<FeedbackListResponse> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (status) params.set("status", status);
  const res = await requestJson<FeedbackListResponse>(`/api/admin/feedback?${params.toString()}`);
  if (!res.data) throw new Error(res.message || "Không tải được danh sách feedback");
  return res.data;
}

export async function updateFeedbackStatus(feedbackId: string, status: string, adminNote?: string): Promise<FeedbackResponse> {
  const res = await requestJson<FeedbackResponse>(`/api/admin/feedback/${feedbackId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, adminNote: adminNote ?? null }),
  });
  if (!res.data) throw new Error(res.message || "Cập nhật feedback thất bại");
  return res.data;
}

export default { createFeedback, getAdminFeedbacks, updateFeedbackStatus };

import { requestJson } from "../core/apiClient";
import type {
  AdminCommunityListParams,
  AdminCommunityReportParams,
  BlacklistKeywordResponse,
  CommunityPostResponse,
  CommunityPostStatus,
  ContentReportResponse,
  AdminCommunityPageResponse,
  PostCommentResponse,
  PostCommentStatus,
  UpdateCommunityPostStatusRequest,
  UpdateContentReportStatusRequest,
  UpdatePostCommentStatusRequest,
  CreateBlacklistKeywordRequest,
} from "./adminCommunityTypes";

const BASE_URL = "/api/admin/community";

function appendPageParams(params: URLSearchParams, page = 0, size = 10): void {
  params.set("page", String(page));
  params.set("size", String(size));
}

function requireData<T>(response: { data: T | null; message?: string }): T {
  if (!response.data) {
    throw new Error(response.message || "Empty response");
  }
  return response.data;
}

export async function getAdminCommunityPosts(
  params: AdminCommunityListParams<CommunityPostStatus> = {},
): Promise<AdminCommunityPageResponse<CommunityPostResponse>> {
  const query = new URLSearchParams();
  appendPageParams(query, params.page, params.size);
  if (params.status) query.set("status", params.status);
  if (params.search?.trim()) query.set("search", params.search.trim());

  return requireData(
    await requestJson<AdminCommunityPageResponse<CommunityPostResponse>>(`${BASE_URL}/moderation/posts?${query.toString()}`),
  );
}

export async function getAdminCommunityComments(
  params: AdminCommunityListParams<PostCommentStatus> = {},
): Promise<AdminCommunityPageResponse<PostCommentResponse>> {
  const query = new URLSearchParams();
  appendPageParams(query, params.page, params.size);
  if (params.status) query.set("status", params.status);
  if (params.search?.trim()) query.set("search", params.search.trim());

  return requireData(
    await requestJson<AdminCommunityPageResponse<PostCommentResponse>>(`${BASE_URL}/moderation/comments?${query.toString()}`),
  );
}

export async function getAdminCommunityReports(
  params: AdminCommunityReportParams = {},
): Promise<AdminCommunityPageResponse<ContentReportResponse>> {
  const query = new URLSearchParams();
  appendPageParams(query, params.page, params.size);
  if (params.targetType) query.set("targetType", params.targetType);
  if (params.status) query.set("status", params.status);

  return requireData(
    await requestJson<AdminCommunityPageResponse<ContentReportResponse>>(`${BASE_URL}/reports?${query.toString()}`),
  );
}

export async function updateAdminCommunityPostStatus(
  postId: string,
  body: UpdateCommunityPostStatusRequest,
): Promise<CommunityPostResponse> {
  return requireData(
    await requestJson<CommunityPostResponse>(`${BASE_URL}/posts/${encodeURIComponent(postId)}/status`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  );
}

export async function updateAdminCommunityCommentStatus(
  commentId: string,
  body: UpdatePostCommentStatusRequest,
): Promise<PostCommentResponse> {
  return requireData(
    await requestJson<PostCommentResponse>(`${BASE_URL}/comments/${encodeURIComponent(commentId)}/status`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  );
}

export async function updateAdminCommunityReportStatus(
  reportId: string,
  body: UpdateContentReportStatusRequest,
): Promise<ContentReportResponse> {
  return requireData(
    await requestJson<ContentReportResponse>(`${BASE_URL}/reports/${encodeURIComponent(reportId)}/status`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  );
}

export async function getAdminCommunityBlacklist(): Promise<BlacklistKeywordResponse[]> {
  return requireData(await requestJson<BlacklistKeywordResponse[]>(`${BASE_URL}/blacklist`));
}

export async function addAdminCommunityBlacklistKeyword(
  body: CreateBlacklistKeywordRequest,
): Promise<BlacklistKeywordResponse> {
  return requireData(
    await requestJson<BlacklistKeywordResponse>(`${BASE_URL}/blacklist`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );
}

export async function deleteAdminCommunityBlacklistKeyword(wordId: number): Promise<void> {
  await requestJson<void>(`${BASE_URL}/blacklist/${wordId}`, { method: "DELETE" });
}

export const adminCommunityService = {
  getAdminCommunityPosts,
  getAdminCommunityComments,
  getAdminCommunityReports,
  updateAdminCommunityPostStatus,
  updateAdminCommunityCommentStatus,
  updateAdminCommunityReportStatus,
  getAdminCommunityBlacklist,
  addAdminCommunityBlacklistKeyword,
  deleteAdminCommunityBlacklistKeyword,
};

export default adminCommunityService;

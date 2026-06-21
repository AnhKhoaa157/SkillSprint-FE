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
  AdminCommunityRoomParams,
  CommunityRoomResponse,
  CommunityChatMessageResponse,
  UpdateCommunityRoomStatusRequest,
  HideCommunityChatMessageRequest,
  CommunityPinResponse,
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

export async function getAdminCommunityRooms(
  params: AdminCommunityRoomParams = {},
): Promise<AdminCommunityPageResponse<CommunityRoomResponse>> {
  const query = new URLSearchParams();
  appendPageParams(query, params.page, params.size);
  if (params.status) query.set("status", params.status);
  if (params.mode) query.set("mode", params.mode);
  if (params.search?.trim()) query.set("search", params.search.trim());

  return requireData(
    await requestJson<AdminCommunityPageResponse<CommunityRoomResponse>>(`${BASE_URL}/rooms?${query.toString()}`),
  );
}

export async function updateAdminCommunityRoomStatus(
  roomId: string,
  body: UpdateCommunityRoomStatusRequest,
): Promise<CommunityRoomResponse> {
  return requireData(
    await requestJson<CommunityRoomResponse>(`${BASE_URL}/rooms/${encodeURIComponent(roomId)}/status`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  );
}

export async function getAdminCommunityRoomMessages(
  roomId: string,
  page: number = 0,
  size: number = 30,
): Promise<AdminCommunityPageResponse<CommunityChatMessageResponse>> {
  const query = new URLSearchParams();
  appendPageParams(query, page, size);

  return requireData(
    await requestJson<AdminCommunityPageResponse<CommunityChatMessageResponse>>(
      `${BASE_URL}/rooms/${encodeURIComponent(roomId)}/messages?${query.toString()}`,
    ),
  );
}

export async function hideAdminCommunityRoomMessage(
  roomId: string,
  messageId: string,
  body: HideCommunityChatMessageRequest,
): Promise<CommunityChatMessageResponse> {
  return requireData(
    await requestJson<CommunityChatMessageResponse>(
      `${BASE_URL}/rooms/${encodeURIComponent(roomId)}/messages/${encodeURIComponent(messageId)}/hide`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      },
    ),
  );
}

export async function getAdminCommunityRoomPins(roomId: string): Promise<CommunityPinResponse[]> {
  return requireData(
    await requestJson<CommunityPinResponse[]>(`${BASE_URL}/rooms/${encodeURIComponent(roomId)}/pins`),
  );
}

export async function deleteAdminCommunityRoomPin(roomId: string, pinId: string): Promise<void> {
  await requestJson<void>(
    `${BASE_URL}/rooms/${encodeURIComponent(roomId)}/pins/${encodeURIComponent(pinId)}`,
    { method: "DELETE" },
  );
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
  getAdminCommunityRooms,
  updateAdminCommunityRoomStatus,
  getAdminCommunityRoomMessages,
  hideAdminCommunityRoomMessage,
  getAdminCommunityRoomPins,
  deleteAdminCommunityRoomPin,
};

export default adminCommunityService;

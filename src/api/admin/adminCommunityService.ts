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
import {
  MOCK_ADMIN_POSTS,
  MOCK_ADMIN_COMMENTS,
  MOCK_ADMIN_REPORTS,
  MOCK_BLACKLIST_KEYWORDS,
  MOCK_ROOMS,
  MOCK_ROOM_MESSAGES,
  MOCK_ROOM_PINS,
  MOCK_USERS,
  paginate
} from "../community/mockCommunityData";

const BASE_URL = "/api/admin/community";

// Local mutable state for mock fallback
let localAdminPosts = [...MOCK_ADMIN_POSTS];
let localAdminComments = [...MOCK_ADMIN_COMMENTS];
let localAdminReports = [...MOCK_ADMIN_REPORTS];
let localBlacklist = [...MOCK_BLACKLIST_KEYWORDS];
let localRooms = [...MOCK_ROOMS];
const localRoomMessages = { ...MOCK_ROOM_MESSAGES };
const localRoomPins = { ...MOCK_ROOM_PINS };

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
  try {
    const query = new URLSearchParams();
    appendPageParams(query, params.page, params.size);
    if (params.status) query.set("status", params.status);
    if (params.search?.trim()) query.set("search", params.search.trim());

    const res = requireData(
      await requestJson<AdminCommunityPageResponse<CommunityPostResponse>>(`${BASE_URL}/moderation/posts?${query.toString()}`),
    );
    if (!res || !res.items || res.items.length === 0) {
      throw new Error("EMPTY_RESPONSE");
    }
    return res;
  } catch (error) {
    console.warn("getAdminCommunityPosts API failed or empty, using mock data", error);
    let filtered = [...localAdminPosts];
    if (params.status) {
      filtered = filtered.filter(p => p.status === params.status);
    }
    if (params.search?.trim()) {
      const q = params.search.trim().toLowerCase();
      filtered = filtered.filter(p => p.content.toLowerCase().includes(q) || p.author?.fullName?.toLowerCase().includes(q));
    }
    return paginate(filtered, params.page || 0, params.size || 10);
  }
}

export async function getAdminCommunityComments(
  params: AdminCommunityListParams<PostCommentStatus> = {},
): Promise<AdminCommunityPageResponse<PostCommentResponse>> {
  try {
    const query = new URLSearchParams();
    appendPageParams(query, params.page, params.size);
    if (params.status) query.set("status", params.status);
    if (params.search?.trim()) query.set("search", params.search.trim());

    const res = requireData(
      await requestJson<AdminCommunityPageResponse<PostCommentResponse>>(`${BASE_URL}/moderation/comments?${query.toString()}`),
    );
    if (!res || !res.items || res.items.length === 0) {
      throw new Error("EMPTY_RESPONSE");
    }
    return res;
  } catch (error) {
    console.warn("getAdminCommunityComments API failed or empty, using mock data", error);
    let filtered = [...localAdminComments];
    if (params.status) {
      filtered = filtered.filter(c => c.status === params.status);
    }
    if (params.search?.trim()) {
      const q = params.search.trim().toLowerCase();
      filtered = filtered.filter(c => c.content.toLowerCase().includes(q) || c.author?.fullName?.toLowerCase().includes(q));
    }
    return paginate(filtered, params.page || 0, params.size || 10);
  }
}

export async function getAdminCommunityReports(
  params: AdminCommunityReportParams = {},
): Promise<AdminCommunityPageResponse<ContentReportResponse>> {
  try {
    const query = new URLSearchParams();
    appendPageParams(query, params.page, params.size);
    if (params.targetType) query.set("targetType", params.targetType);
    if (params.status) query.set("status", params.status);

    const res = requireData(
      await requestJson<AdminCommunityPageResponse<ContentReportResponse>>(`${BASE_URL}/reports?${query.toString()}`),
    );
    if (!res || !res.items || res.items.length === 0) {
      throw new Error("EMPTY_RESPONSE");
    }
    return res;
  } catch (error) {
    console.warn("getAdminCommunityReports API failed or empty, using mock data", error);
    let filtered = [...localAdminReports];
    if (params.targetType) {
      filtered = filtered.filter(r => r.targetType === params.targetType);
    }
    if (params.status) {
      filtered = filtered.filter(r => r.status === params.status);
    }
    return paginate(filtered, params.page || 0, params.size || 10);
  }
}

export async function updateAdminCommunityPostStatus(
  postId: string,
  body: UpdateCommunityPostStatusRequest,
): Promise<CommunityPostResponse> {
  try {
    return requireData(
      await requestJson<CommunityPostResponse>(`${BASE_URL}/posts/${encodeURIComponent(postId)}/status`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    );
  } catch (error) {
    console.warn("updateAdminCommunityPostStatus API failed, using mock data", error);
    const postIdx = localAdminPosts.findIndex(p => p.postId === postId);
    if (postIdx === -1) throw new Error("Post not found");
    const updated = {
      ...localAdminPosts[postIdx],
      status: body.status,
      adminNote: body.adminNote || null,
      updatedAt: new Date().toISOString()
    };
    localAdminPosts[postIdx] = updated;
    return updated;
  }
}

export async function updateAdminCommunityCommentStatus(
  commentId: string,
  body: UpdatePostCommentStatusRequest,
): Promise<PostCommentResponse> {
  try {
    return requireData(
      await requestJson<PostCommentResponse>(`${BASE_URL}/comments/${encodeURIComponent(commentId)}/status`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    );
  } catch (error) {
    console.warn("updateAdminCommunityCommentStatus API failed, using mock data", error);
    const cmtIdx = localAdminComments.findIndex(c => c.commentId === commentId);
    if (cmtIdx === -1) throw new Error("Comment not found");
    const updated = {
      ...localAdminComments[cmtIdx],
      status: body.status,
      adminNote: body.adminNote || null,
      updatedAt: new Date().toISOString()
    };
    localAdminComments[cmtIdx] = updated;
    return updated;
  }
}

export async function updateAdminCommunityReportStatus(
  reportId: string,
  body: UpdateContentReportStatusRequest,
): Promise<ContentReportResponse> {
  try {
    return requireData(
      await requestJson<ContentReportResponse>(`${BASE_URL}/reports/${encodeURIComponent(reportId)}/status`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    );
  } catch (error) {
    console.warn("updateAdminCommunityReportStatus API failed, using mock data", error);
    const repIdx = localAdminReports.findIndex(r => r.reportId === reportId);
    if (repIdx === -1) throw new Error("Report not found");
    const updated = {
      ...localAdminReports[repIdx],
      status: body.status,
      adminNote: body.adminNote || null,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    localAdminReports[repIdx] = updated;
    return updated;
  }
}

export async function getAdminCommunityBlacklist(): Promise<BlacklistKeywordResponse[]> {
  try {
    const res = requireData(await requestJson<BlacklistKeywordResponse[]>(`${BASE_URL}/blacklist`));
    if (!res || res.length === 0) {
      throw new Error("EMPTY_RESPONSE");
    }
    return res;
  } catch (error) {
    console.warn("getAdminCommunityBlacklist API failed or empty, using mock data", error);
    return localBlacklist;
  }
}

export async function addAdminCommunityBlacklistKeyword(
  body: CreateBlacklistKeywordRequest,
): Promise<BlacklistKeywordResponse> {
  try {
    return requireData(
      await requestJson<BlacklistKeywordResponse>(`${BASE_URL}/blacklist`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    );
  } catch (error) {
    console.warn("addAdminCommunityBlacklistKeyword API failed, using mock data", error);
    const newWord: BlacklistKeywordResponse = {
      wordId: Date.now(),
      keyword: body.keyword,
      createdBy: MOCK_USERS.admin,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    localBlacklist = [newWord, ...localBlacklist];
    return newWord;
  }
}

export async function deleteAdminCommunityBlacklistKeyword(wordId: number): Promise<void> {
  try {
    await requestJson<void>(`${BASE_URL}/blacklist/${wordId}`, { method: "DELETE" });
  } catch (error) {
    console.warn("deleteAdminCommunityBlacklistKeyword API failed, using mock data", error);
    localBlacklist = localBlacklist.filter(w => w.wordId !== wordId);
  }
}

export async function getAdminCommunityRooms(
  params: AdminCommunityRoomParams = {},
): Promise<AdminCommunityPageResponse<CommunityRoomResponse>> {
  try {
    const query = new URLSearchParams();
    appendPageParams(query, params.page, params.size);
    if (params.status) query.set("status", params.status);
    if (params.mode) query.set("mode", params.mode);
    if (params.search?.trim()) query.set("search", params.search.trim());

    const res = requireData(
      await requestJson<AdminCommunityPageResponse<CommunityRoomResponse>>(`${BASE_URL}/rooms?${query.toString()}`),
    );
    if (!res || !res.items || res.items.length === 0) {
      throw new Error("EMPTY_RESPONSE");
    }
    return res;
  } catch (error) {
    console.warn("getAdminCommunityRooms API failed or empty, using mock data", error);
    let filtered = [...localRooms];
    if (params.status) {
      filtered = filtered.filter(r => r.status === params.status);
    }
    if (params.mode) {
      filtered = filtered.filter(r => r.mode === params.mode);
    }
    if (params.search?.trim()) {
      const q = params.search.trim().toLowerCase();
      filtered = filtered.filter(r => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q));
    }
    return paginate(filtered, params.page || 0, params.size || 10);
  }
}

export async function updateAdminCommunityRoomStatus(
  roomId: string,
  body: UpdateCommunityRoomStatusRequest,
): Promise<CommunityRoomResponse> {
  try {
    return requireData(
      await requestJson<CommunityRoomResponse>(`${BASE_URL}/rooms/${encodeURIComponent(roomId)}/status`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    );
  } catch (error) {
    console.warn("updateAdminCommunityRoomStatus API failed, using mock data", error);
    const roomIdx = localRooms.findIndex(r => r.roomId === roomId);
    if (roomIdx === -1) throw new Error("Room not found");
    const updated = {
      ...localRooms[roomIdx],
      status: body.status,
      adminNote: body.adminNote || null,
      updatedAt: new Date().toISOString()
    };
    localRooms[roomIdx] = updated;
    return updated;
  }
}

export async function getAdminCommunityRoomMessages(
  roomId: string,
  page: number = 0,
  size: number = 30,
): Promise<AdminCommunityPageResponse<CommunityChatMessageResponse>> {
  try {
    const query = new URLSearchParams();
    appendPageParams(query, page, size);

    const res = requireData(
      await requestJson<AdminCommunityPageResponse<CommunityChatMessageResponse>>(
        `${BASE_URL}/rooms/${encodeURIComponent(roomId)}/messages?${query.toString()}`,
      ),
    );
    if (!res || !res.items || res.items.length === 0) {
      throw new Error("EMPTY_RESPONSE");
    }
    return res;
  } catch (error) {
    console.warn("getAdminCommunityRoomMessages API failed or empty, using mock data", error);
    const list = localRoomMessages[roomId] || [];
    return paginate(list, page, size);
  }
}

export async function hideAdminCommunityRoomMessage(
  roomId: string,
  messageId: string,
  body: HideCommunityChatMessageRequest,
): Promise<CommunityChatMessageResponse> {
  try {
    return requireData(
      await requestJson<CommunityChatMessageResponse>(
        `${BASE_URL}/rooms/${encodeURIComponent(roomId)}/messages/${encodeURIComponent(messageId)}/hide`,
        {
          method: "PATCH",
          body: JSON.stringify(body),
        },
      ),
    );
  } catch (error) {
    console.warn("hideAdminCommunityRoomMessage API failed, using mock data", error);
    const list = localRoomMessages[roomId] || [];
    const msgIdx = list.findIndex(m => m.messageId === messageId);
    if (msgIdx === -1) throw new Error("Message not found");
    const updated = {
      ...list[msgIdx],
      hidden: body.hidden,
      adminNote: body.adminNote || null
    };
    list[msgIdx] = updated;
    return updated;
  }
}

export async function getAdminCommunityRoomPins(roomId: string): Promise<CommunityPinResponse[]> {
  try {
    const res = requireData(
      await requestJson<CommunityPinResponse[]>(`${BASE_URL}/rooms/${encodeURIComponent(roomId)}/pins`),
    );
    if (!res || res.length === 0) {
      throw new Error("EMPTY_RESPONSE");
    }
    return res;
  } catch (error) {
    console.warn("getAdminCommunityRoomPins API failed or empty, using mock data", error);
    const fallbackPins = localRoomPins[roomId] || [];
    return fallbackPins.map(p => ({
      pinId: p.pinId,
      roomId: p.roomId,
      itemType: p.linkUrl ? "DOCUMENT_URL" : "ANNOUNCEMENT",
      title: p.title,
      content: p.content,
      pinnedBy: p.pinnedBy,
      displayOrder: p.sortOrder,
      createdAt: p.createdAt,
      updatedAt: p.createdAt,
    }));
  }
}

export async function deleteAdminCommunityRoomPin(roomId: string, pinId: string): Promise<void> {
  try {
    await requestJson<void>(
      `${BASE_URL}/rooms/${encodeURIComponent(roomId)}/pins/${encodeURIComponent(pinId)}`,
      { method: "DELETE" },
    );
  } catch (error) {
    console.warn("deleteAdminCommunityRoomPin API failed, using mock data", error);
    if (localRoomPins[roomId]) {
      localRoomPins[roomId] = localRoomPins[roomId].filter(p => p.pinId !== pinId);
    }
  }
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

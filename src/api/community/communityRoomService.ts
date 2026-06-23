import { skillSprintApiClient, extractApiData, type ApiResponse } from "../core";
import type { PageableResponse } from "./communityTypes";
import type {
  CommunityRoomResponse,
  CommunityRoomMemberResponse,
  CommunityRoomInviteResponse,
  CommunityPinResponse,
  CommunityChatMessageResponse,
  CreateCommunityRoomRequest,
  UpdateCommunityRoomRequest,
  CreateCommunityRoomInviteRequest,
  UpdateCommunityRoomMemberRoleRequest,
  MuteCommunityRoomMemberRequest,
  CreateCommunityPinRequest,
  ReorderCommunityPinsRequest,
  HideCommunityChatMessageRequest,
  CreateContentReportRequest,
} from "./communityRoomTypes";

const BASE_URL = "/api/community/rooms";

export const communityRoomService = {
  // ── Rooms ───────────────────────────────────────────────────────────────
  createRoom: async (data: CreateCommunityRoomRequest): Promise<CommunityRoomResponse> => {
    const response = await skillSprintApiClient.post<ApiResponse<CommunityRoomResponse>>(BASE_URL, data);
    return extractApiData(response);
  },

  discoverRooms: async (
    page: number = 0,
    size: number = 10,
    mode?: string,
    search?: string,
  ): Promise<PageableResponse<CommunityRoomResponse>> => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("size", size.toString());
    if (mode) params.append("mode", mode);
    if (search) params.append("search", search);
    const response = await skillSprintApiClient.get<ApiResponse<PageableResponse<CommunityRoomResponse>>>(
      `${BASE_URL}?${params.toString()}`,
    );
    return extractApiData(response);
  },

  getMyRooms: async (page: number = 0, size: number = 10): Promise<PageableResponse<CommunityRoomResponse>> => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("size", size.toString());
    const response = await skillSprintApiClient.get<ApiResponse<PageableResponse<CommunityRoomResponse>>>(
      `${BASE_URL}/me?${params.toString()}`,
    );
    return extractApiData(response);
  },

  getRoom: async (roomId: string): Promise<CommunityRoomResponse> => {
    const response = await skillSprintApiClient.get<ApiResponse<CommunityRoomResponse>>(`${BASE_URL}/${roomId}`);
    return extractApiData(response);
  },

  updateRoom: async (roomId: string, data: UpdateCommunityRoomRequest): Promise<CommunityRoomResponse> => {
    const response = await skillSprintApiClient.patch<ApiResponse<CommunityRoomResponse>>(`${BASE_URL}/${roomId}`, data);
    return extractApiData(response);
  },

  deleteRoom: async (roomId: string): Promise<void> => {
    const response = await skillSprintApiClient.delete<ApiResponse<void>>(`${BASE_URL}/${roomId}`);
    return extractApiData(response);
  },

  joinRoom: async (roomId: string): Promise<CommunityRoomResponse> => {
    const response = await skillSprintApiClient.post<ApiResponse<CommunityRoomResponse>>(`${BASE_URL}/${roomId}/join`);
    return extractApiData(response);
  },

  leaveRoom: async (roomId: string): Promise<void> => {
    const response = await skillSprintApiClient.post<ApiResponse<void>>(`${BASE_URL}/${roomId}/leave`);
    return extractApiData(response);
  },

  // ── Members ─────────────────────────────────────────────────────────────
  getMembers: async (
    roomId: string,
    page: number = 0,
    size: number = 10,
  ): Promise<PageableResponse<CommunityRoomMemberResponse>> => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    const response = await skillSprintApiClient.get<ApiResponse<PageableResponse<CommunityRoomMemberResponse>>>(
      `${BASE_URL}/${roomId}/members?${params.toString()}`,
    );
    return extractApiData(response);
  },

  updateMemberRole: async (
    roomId: string,
    targetUserId: string,
    data: UpdateCommunityRoomMemberRoleRequest,
  ): Promise<CommunityRoomMemberResponse> => {
    const response = await skillSprintApiClient.patch<ApiResponse<CommunityRoomMemberResponse>>(
      `${BASE_URL}/${roomId}/members/${targetUserId}/role`,
      data,
    );
    return extractApiData(response);
  },

  muteMember: async (
    roomId: string,
    targetUserId: string,
    data: MuteCommunityRoomMemberRequest,
  ): Promise<CommunityRoomMemberResponse> => {
    const response = await skillSprintApiClient.patch<ApiResponse<CommunityRoomMemberResponse>>(
      `${BASE_URL}/${roomId}/members/${targetUserId}/mute`,
      data,
    );
    return extractApiData(response);
  },

  kickMember: async (roomId: string, targetUserId: string): Promise<void> => {
    const response = await skillSprintApiClient.delete<ApiResponse<void>>(
      `${BASE_URL}/${roomId}/members/${targetUserId}`,
    );
    return extractApiData(response);
  },

  banMember: async (roomId: string, targetUserId: string): Promise<CommunityRoomMemberResponse> => {
    const response = await skillSprintApiClient.patch<ApiResponse<CommunityRoomMemberResponse>>(
      `${BASE_URL}/${roomId}/members/${targetUserId}/ban`,
    );
    return extractApiData(response);
  },

  unbanMember: async (roomId: string, targetUserId: string): Promise<CommunityRoomMemberResponse> => {
    const response = await skillSprintApiClient.patch<ApiResponse<CommunityRoomMemberResponse>>(
      `${BASE_URL}/${roomId}/members/${targetUserId}/unban`,
    );
    return extractApiData(response);
  },

  // ── Invites ─────────────────────────────────────────────────────────────
  inviteMember: async (roomId: string, data: CreateCommunityRoomInviteRequest): Promise<CommunityRoomInviteResponse> => {
    const response = await skillSprintApiClient.post<ApiResponse<CommunityRoomInviteResponse>>(
      `${BASE_URL}/${roomId}/invites`,
      data,
    );
    return extractApiData(response);
  },

  getMyInvites: async (page: number = 0, size: number = 10): Promise<PageableResponse<CommunityRoomInviteResponse>> => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    const response = await skillSprintApiClient.get<ApiResponse<PageableResponse<CommunityRoomInviteResponse>>>(
      `${BASE_URL}/invites?${params.toString()}`,
    );
    return extractApiData(response);
  },

  acceptInvite: async (inviteId: string): Promise<CommunityRoomResponse> => {
    const response = await skillSprintApiClient.post<ApiResponse<CommunityRoomResponse>>(
      `${BASE_URL}/invites/${inviteId}/accept`,
    );
    return extractApiData(response);
  },

  declineInvite: async (inviteId: string): Promise<CommunityRoomInviteResponse> => {
    const response = await skillSprintApiClient.post<ApiResponse<CommunityRoomInviteResponse>>(
      `${BASE_URL}/invites/${inviteId}/decline`,
    );
    return extractApiData(response);
  },

  // ── Messages ─────────────────────────────────────────────────────────────
  getMessageHistory: async (
    roomId: string,
    page: number = 0,
    size: number = 30,
  ): Promise<PageableResponse<CommunityChatMessageResponse>> => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    const response = await skillSprintApiClient.get<ApiResponse<PageableResponse<CommunityChatMessageResponse>>>(
      `${BASE_URL}/${roomId}/messages?${params.toString()}`,
    );
    return extractApiData(response);
  },

  hideMessage: async (
    roomId: string,
    messageId: string,
    data: HideCommunityChatMessageRequest,
  ): Promise<CommunityChatMessageResponse> => {
    const response = await skillSprintApiClient.patch<ApiResponse<CommunityChatMessageResponse>>(
      `${BASE_URL}/${roomId}/messages/${messageId}/hide`,
      data,
    );
    return extractApiData(response);
  },

  reportMessage: async (
    roomId: string,
    messageId: string,
    data: CreateContentReportRequest,
  ): Promise<void> => {
    const response = await skillSprintApiClient.post<ApiResponse<void>>(
      `${BASE_URL}/${roomId}/messages/${messageId}/report`,
      data,
    );
    return extractApiData(response);
  },

  // ── Pins ─────────────────────────────────────────────────────────────────
  getPins: async (roomId: string): Promise<CommunityPinResponse[]> => {
    const response = await skillSprintApiClient.get<ApiResponse<CommunityPinResponse[]>>(`${BASE_URL}/${roomId}/pins`);
    return extractApiData(response);
  },

  createPin: async (roomId: string, data: CreateCommunityPinRequest): Promise<CommunityPinResponse> => {
    const response = await skillSprintApiClient.post<ApiResponse<CommunityPinResponse>>(
      `${BASE_URL}/${roomId}/pins`,
      data,
    );
    return extractApiData(response);
  },

  deletePin: async (roomId: string, pinId: string): Promise<void> => {
    const response = await skillSprintApiClient.delete<ApiResponse<void>>(`${BASE_URL}/${roomId}/pins/${pinId}`);
    return extractApiData(response);
  },

  reorderPins: async (roomId: string, data: ReorderCommunityPinsRequest): Promise<CommunityPinResponse[]> => {
    const response = await skillSprintApiClient.patch<ApiResponse<CommunityPinResponse[]>>(
      `${BASE_URL}/${roomId}/pins/reorder`,
      data,
    );
    return extractApiData(response);
  },
};

export default communityRoomService;

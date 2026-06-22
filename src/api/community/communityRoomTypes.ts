import type { PageableResponse } from "./communityTypes";

export type CommunityRoomMode = "PUBLIC" | "INVITE_ONLY" | "PRIVATE";
export type CommunityRoomStatus = "ACTIVE" | "LOCKED" | "HIDDEN" | "DELETED";
export type CommunityRoomRole = "OWNER" | "MODERATOR" | "MEMBER";
export type InviteStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";

export interface CommunityAuthor {
  userId: string;
  email?: string | null;
  fullName?: string | null;
  avatarObjectKey?: string | null;
  avatarUrl?: string | null;
}

export interface CommunityRoomResponse {
  roomId: string;
  name: string;
  description: string;
  mode: CommunityRoomMode;
  status: CommunityRoomStatus;
  owner: CommunityAuthor | null;
  maxMembers: number;
  memberCount: number;
  reportCount: number;
  myRole: CommunityRoomRole | null;
  joined: boolean;
  banned: boolean;
  adminNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityRoomMemberResponse {
  memberId: string;
  roomId: string;
  user: CommunityAuthor | null;
  role: CommunityRoomRole;
  joinedAt: string;
  mutedUntil?: string | null;
  bannedAt?: string | null;
}

export interface CommunityRoomInviteResponse {
  inviteId: string;
  roomId: string;
  roomName: string;
  inviter: CommunityAuthor | null;
  invitee: CommunityAuthor | null;
  status: InviteStatus;
  createdAt: string;
  expiresAt: string;
}

export interface CommunityPinResponse {
  pinId: string;
  roomId: string;
  pinnedBy: CommunityAuthor | null;
  title: string;
  content: string;
  linkUrl?: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface CommunityChatMessageResponse {
  messageId: string;
  roomId: string;
  sender: CommunityAuthor | null;
  content: string;
  rawContent?: string | null;
  hidden: boolean;
  reportCount: number;
  adminNote?: string | null;
  sentAt: string;
}

// Request Payload Types

export interface CreateCommunityRoomRequest {
  name: string;
  description?: string;
  mode: CommunityRoomMode;
  maxMembers: number;
}

export interface UpdateCommunityRoomRequest {
  name?: string;
  description?: string;
  mode?: CommunityRoomMode;
  maxMembers?: number;
}

export interface CreateCommunityRoomInviteRequest {
  inviteeUserId: string;
}

export interface UpdateCommunityRoomMemberRoleRequest {
  role: CommunityRoomRole;
}

export interface MuteCommunityRoomMemberRequest {
  muteDurationMinutes: number;
}

export interface CreateCommunityPinRequest {
  itemType: "ANNOUNCEMENT" | "DOCUMENT_URL" | "MESSAGE";
  title: string;
  content: string;
  linkUrl?: string;
}

export interface ReorderCommunityPinsRequest {
  pinIds: string[];
}

export interface HideCommunityChatMessageRequest {
  hidden: boolean;
  adminNote?: string;
}

export interface CreateContentReportRequest {
  targetType: "POST" | "COMMENT" | "MESSAGE";
  targetId: string;
  reason: string;
}

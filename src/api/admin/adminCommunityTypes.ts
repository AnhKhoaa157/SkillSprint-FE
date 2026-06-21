export type CommunityPostStatus = "APPROVED" | "PENDING_MODERATION" | "HIDDEN" | "DELETED";
export type PostCommentStatus = "VISIBLE" | "PENDING_MODERATION" | "HIDDEN" | "DELETED";
export type ContentReportStatus = "PENDING" | "REVIEWED" | "DISMISSED";
export type ContentReportTargetType = "POST" | "COMMENT" | "MESSAGE";
export type CommunityRoomStatus = "ACTIVE" | "LOCKED" | "HIDDEN" | "DELETED";
export type CommunityRoomMode = "PUBLIC" | "INVITE_ONLY" | "PRIVATE";
export type CommunityRoomRole = "OWNER" | "MODERATOR" | "MEMBER";

export interface AdminCommunityPageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface CommunityAuthorResponse {
  userId: string;
  email?: string | null;
  fullName?: string | null;
  avatarObjectKey?: string | null;
  avatarUrl?: string | null;
}

export interface CommunityPostResponse {
  postId: string;
  author: CommunityAuthorResponse | null;
  content: string;
  hashtags: string[];
  status: CommunityPostStatus;
  likeCount: number;
  commentCount: number;
  reportCount: number;
  likedByMe: boolean;
  adminNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PostCommentResponse {
  commentId: string;
  postId: string;
  author: CommunityAuthorResponse | null;
  content: string;
  status: PostCommentStatus;
  reportCount: number;
  adminNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContentReportResponse {
  reportId: string;
  targetType: ContentReportTargetType;
  targetId: string;
  reporter: CommunityAuthorResponse | null;
  reason: string;
  status: ContentReportStatus;
  adminNote?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BlacklistKeywordResponse {
  wordId: number;
  keyword: string;
  createdBy: CommunityAuthorResponse | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityRoomResponse {
  roomId: string;
  name: string;
  description: string;
  mode: CommunityRoomMode;
  status: CommunityRoomStatus;
  owner: CommunityAuthorResponse | null;
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

export interface CommunityChatMessageResponse {
  messageId: string;
  roomId: string;
  sender: CommunityAuthorResponse | null;
  content: string;
  rawContent?: string | null;
  hidden: boolean;
  reportCount: number;
  adminNote?: string | null;
  sentAt: string;
}

export interface AdminCommunityListParams<TStatus extends string = string> {
  status?: TStatus;
  search?: string;
  page?: number;
  size?: number;
}

export interface AdminCommunityReportParams {
  targetType?: ContentReportTargetType;
  status?: ContentReportStatus;
  page?: number;
  size?: number;
}

export interface UpdateCommunityPostStatusRequest {
  status: CommunityPostStatus;
  adminNote?: string;
}

export interface UpdatePostCommentStatusRequest {
  status: PostCommentStatus;
  adminNote?: string;
}

export interface UpdateContentReportStatusRequest {
  status: ContentReportStatus;
  adminNote?: string;
}

export interface CreateBlacklistKeywordRequest {
  keyword: string;
}

export interface AdminCommunityRoomParams {
  status?: CommunityRoomStatus;
  mode?: CommunityRoomMode;
  search?: string;
  page?: number;
  size?: number;
}

export interface UpdateCommunityRoomStatusRequest {
  status: CommunityRoomStatus;
  adminNote?: string;
}

export interface HideCommunityChatMessageRequest {
  hidden: boolean;
  adminNote?: string;
}

export type PostStatus = "APPROVED" | "PENDING_MODERATION" | "HIDDEN";
export type CommentStatus = "VISIBLE" | "PENDING_MODERATION" | "HIDDEN";

export interface CommunityPostUser {
  userId: string;
  fullName: string;
  avatarObjectKey?: string;
  avatarUrl?: string | null;
}

export interface CommunityPost {
  postId: string;
  author: CommunityPostUser;
  content: string;
  hashtags: string[];
  status: PostStatus;
  likeCount: number;
  commentCount: number;
  likedByMe?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PostComment {
  commentId: string;
  postId: string;
  author: CommunityPostUser;
  content: string;
  status: CommentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PageableResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface CreatePostRequest {
  content: string;
  hashtags: string[];
}

export interface CreateCommentRequest {
  content: string;
}

export interface ReportRequest {
  reason: string;
}

export type UpdatePostRequest = Partial<CreatePostRequest>;

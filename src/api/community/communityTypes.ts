export type PostStatus = "APPROVED" | "PENDING_MODERATION" | "HIDDEN";
export type CommentStatus = "VISIBLE" | "PENDING_MODERATION" | "HIDDEN";

export interface CommunityPostUser {
  userId: string;
  fullName: string;
  avatarObjectKey?: string;
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
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  first: boolean;
  size: number;
  number: number;
  empty: boolean;
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

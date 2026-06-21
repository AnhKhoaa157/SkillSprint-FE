import { skillSprintApiClient, extractApiData, type ApiResponse } from "../core";
import type {
  CommunityPost,
  PostComment,
  PageableResponse,
  CreatePostRequest,
  CreateCommentRequest,
  ReportRequest
} from "./communityTypes";

const BASE_URL = "/api/posts";

export const communityService = {
  /**
   * Fetch approved posts with optional hashtag filtering
   */
  getPosts: async (page: number = 0, size: number = 10, hashtag?: string): Promise<PageableResponse<CommunityPost>> => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("size", size.toString());
    if (hashtag) {
      params.append("hashtag", hashtag);
    }
    
    const response = await skillSprintApiClient.get<ApiResponse<PageableResponse<CommunityPost>>>(`${BASE_URL}?${params.toString()}`);
    return extractApiData(response);
  },

  /**
   * Create a new community post
   */
  createPost: async (data: CreatePostRequest): Promise<CommunityPost> => {
    const response = await skillSprintApiClient.post<ApiResponse<CommunityPost>>(BASE_URL, data);
    return extractApiData(response);
  },

  /**
   * Get a specific post by ID
   */
  getPostById: async (postId: string): Promise<CommunityPost> => {
    const response = await skillSprintApiClient.get<ApiResponse<CommunityPost>>(`${BASE_URL}/${postId}`);
    return extractApiData(response);
  },

  /**
   * Toggle like status on a post
   */
  likePost: async (postId: string): Promise<void> => {
    const response = await skillSprintApiClient.post<ApiResponse<void>>(`${BASE_URL}/${postId}/like`);
    return extractApiData(response);
  },

  unlikePost: async (postId: string): Promise<void> => {
    const response = await skillSprintApiClient.delete<ApiResponse<void>>(`${BASE_URL}/${postId}/like`);
    return extractApiData(response);
  },

  /**
   * Report a post
   */
  reportPost: async (postId: string, data: ReportRequest): Promise<void> => {
    const response = await skillSprintApiClient.post<ApiResponse<void>>(`${BASE_URL}/${postId}/report`, data);
    return extractApiData(response);
  },

  /**
   * Fetch comments for a post
   */
  getComments: async (postId: string, page: number = 0, size: number = 20): Promise<PageableResponse<PostComment>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString()
    });
    const response = await skillSprintApiClient.get<ApiResponse<PageableResponse<PostComment>>>(`${BASE_URL}/${postId}/comments?${params.toString()}`);
    return extractApiData(response);
  },

  /**
   * Create a comment on a post
   */
  createComment: async (postId: string, data: CreateCommentRequest): Promise<PostComment> => {
    const response = await skillSprintApiClient.post<ApiResponse<PostComment>>(`${BASE_URL}/${postId}/comments`, data);
    return extractApiData(response);
  },

  /**
   * Update a comment
   */
  updateComment: async (postId: string, commentId: string, data: CreateCommentRequest): Promise<PostComment> => {
    const response = await skillSprintApiClient.put<ApiResponse<PostComment>>(`${BASE_URL}/${postId}/comments/${commentId}`, data);
    return extractApiData(response);
  },

  /**
   * Delete a comment
   */
  deleteComment: async (postId: string, commentId: string): Promise<void> => {
    const response = await skillSprintApiClient.delete<ApiResponse<void>>(`${BASE_URL}/${postId}/comments/${commentId}`);
    return extractApiData(response);
  }
};

export default communityService;

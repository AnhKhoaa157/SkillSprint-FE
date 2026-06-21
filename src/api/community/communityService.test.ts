import { describe, it, expect, vi, beforeEach } from "vitest";
import communityService from "./communityService";
import { skillSprintApiClient } from "../core/skillSprintApiClient";

// Mock the core api client
vi.mock("../core/skillSprintApiClient", () => ({
  skillSprintApiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  extractApiData: vi.fn((response) => response.data),
}));

describe("communityService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPosts", () => {
    it("should fetch posts without hashtag", async () => {
      const mockResponse = { data: { content: [], last: true } };
      vi.mocked(skillSprintApiClient.get).mockResolvedValueOnce(mockResponse);

      const result = await communityService.getPosts(0, 10);

      expect(skillSprintApiClient.get).toHaveBeenCalledWith("/api/community/posts?page=0&size=10");
      expect(result).toEqual(mockResponse.data);
    });

    it("should fetch posts with hashtag", async () => {
      const mockResponse = { data: { content: [], last: true } };
      vi.mocked(skillSprintApiClient.get).mockResolvedValueOnce(mockResponse);

      const result = await communityService.getPosts(1, 20, "react");

      expect(skillSprintApiClient.get).toHaveBeenCalledWith("/api/community/posts?page=1&size=20&hashtag=react");
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("createPost", () => {
    it("should create a post", async () => {
      const mockPostData = { content: "Test", hashtags: ["test"] };
      const mockResponse = { data: { postId: "1", ...mockPostData } };
      vi.mocked(skillSprintApiClient.post).mockResolvedValueOnce(mockResponse);

      const result = await communityService.createPost(mockPostData);

      expect(skillSprintApiClient.post).toHaveBeenCalledWith("/api/community/posts", mockPostData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("likePost and unlikePost", () => {
    it("should like a post", async () => {
      vi.mocked(skillSprintApiClient.post).mockResolvedValueOnce({ data: null });
      await communityService.likePost("post-1");
      expect(skillSprintApiClient.post).toHaveBeenCalledWith("/api/community/posts/post-1/like");
    });

    it("should unlike a post", async () => {
      vi.mocked(skillSprintApiClient.delete).mockResolvedValueOnce({ data: null });
      await communityService.unlikePost("post-1");
      expect(skillSprintApiClient.delete).toHaveBeenCalledWith("/api/community/posts/post-1/like");
    });
  });

  describe("reportPost", () => {
    it("should report a post", async () => {
      const reportData = { reason: "Spam" };
      vi.mocked(skillSprintApiClient.post).mockResolvedValueOnce({ data: null });
      await communityService.reportPost("post-1", reportData);
      expect(skillSprintApiClient.post).toHaveBeenCalledWith("/api/community/posts/post-1/report", reportData);
    });
  });

  describe("comments", () => {
    it("should get comments", async () => {
      const mockResponse = { data: { content: [], last: true } };
      vi.mocked(skillSprintApiClient.get).mockResolvedValueOnce(mockResponse);

      const result = await communityService.getComments("post-1", 0, 15);

      expect(skillSprintApiClient.get).toHaveBeenCalledWith("/api/community/posts/post-1/comments?page=0&size=15");
      expect(result).toEqual(mockResponse.data);
    });

    it("should create comment", async () => {
      const mockCommentData = { content: "Nice post" };
      const mockResponse = { data: { commentId: "c1", ...mockCommentData } };
      vi.mocked(skillSprintApiClient.post).mockResolvedValueOnce(mockResponse);

      const result = await communityService.createComment("post-1", mockCommentData);

      expect(skillSprintApiClient.post).toHaveBeenCalledWith("/api/community/posts/post-1/comments", mockCommentData);
      expect(result).toEqual(mockResponse.data);
    });

    it("should delete comment", async () => {
      vi.mocked(skillSprintApiClient.delete).mockResolvedValueOnce({ data: null });
      await communityService.deleteComment("post-1", "c1");
      expect(skillSprintApiClient.delete).toHaveBeenCalledWith("/api/community/posts/post-1/comments/c1");
    });
  });
});

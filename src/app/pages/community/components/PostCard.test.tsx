import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { PostCard } from "./PostCard";
import communityService from "../../../../api/community/communityService";
import { toast } from "sonner";

vi.mock("../../../../api/community/communityService", () => ({
  default: {
    likePost: vi.fn(),
    unlikePost: vi.fn(),
    reportPost: vi.fn(),
    updatePost: vi.fn(),
    deletePost: vi.fn(),
  }
}));

vi.mock("../../../../api/auth/authService", () => ({
  getStoredUserId: vi.fn(() => "viewer"),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }
}));

const originalScrollTo = window.scrollTo;

beforeEach(() => {
  window.scrollTo = vi.fn();
  vi.clearAllMocks();
});

afterAll(() => {
  window.scrollTo = originalScrollTo;
});

vi.mock("./CommentSection", () => ({
  CommentSection: () => <div data-testid="mock-comment-section" />
}));

const mockPost = {
  postId: "p1",
  author: { userId: "u1", fullName: "John Doe" },
  content: "This is a test post content",
  hashtags: ["test", "react"],
  status: "APPROVED" as const,
  likeCount: 5,
  commentCount: 2,
  likedByMe: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("PostCard", () => {
  const mockOnPostUpdated = vi.fn();

  it("should render post information correctly", () => {
    render(<PostCard post={mockPost} onPostUpdated={mockOnPostUpdated} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("This is a test post content")).toBeInTheDocument();
    expect(screen.getByText("#test")).toBeInTheDocument();
    expect(screen.getByText("#react")).toBeInTheDocument();
    expect(screen.getByText("5 lượt thích")).toBeInTheDocument();
    expect(screen.getByText("2 bình luận")).toBeInTheDocument();
  });

  it("should call likePost api and optimistic update when liking", async () => {
    vi.mocked(communityService.likePost).mockResolvedValueOnce({
      ...mockPost,
      likedByMe: true,
      likeCount: 6
    });

    render(<PostCard post={mockPost} onPostUpdated={mockOnPostUpdated} />);

    const likeBtn = screen.getByRole("button", { name: /^Thích$/ });
    await userEvent.click(likeBtn);

    expect(mockOnPostUpdated).toHaveBeenCalledWith({
      ...mockPost,
      likedByMe: true,
      likeCount: 6
    });
    expect(communityService.likePost).toHaveBeenCalledWith("p1");
  });

  it("should call unlikePost api and optimistic update when unliking", async () => {
    vi.mocked(communityService.unlikePost).mockResolvedValueOnce({
      ...mockPost,
      likedByMe: false,
      likeCount: 5
    });

    const likedPost = { ...mockPost, likedByMe: true, likeCount: 6 };
    render(<PostCard post={likedPost} onPostUpdated={mockOnPostUpdated} />);

    const likeBtn = screen.getByRole("button", { name: /^Thích$/ });
    await userEvent.click(likeBtn);

    expect(mockOnPostUpdated).toHaveBeenCalledWith({
      ...likedPost,
      likedByMe: false,
      likeCount: 5
    });
    expect(communityService.unlikePost).toHaveBeenCalledWith("p1");
  });

  it("should revert like on API failure", async () => {
    vi.mocked(communityService.likePost).mockRejectedValueOnce(new Error("API failure"));

    render(<PostCard post={mockPost} onPostUpdated={mockOnPostUpdated} />);

    const likeBtn = screen.getByRole("button", { name: /^Thích$/ });
    await userEvent.click(likeBtn);

    expect(mockOnPostUpdated).toHaveBeenNthCalledWith(1, {
      ...mockPost,
      likedByMe: true,
      likeCount: 6
    });

    await waitFor(() => {
      expect(mockOnPostUpdated).toHaveBeenNthCalledWith(2, {
        ...mockPost,
        likedByMe: false,
        likeCount: 5
      });
      expect(toast.error).toHaveBeenCalledWith("API failure");
    });
  });

  it("should call report API when user provides a reason", async () => {
    vi.mocked(communityService.reportPost).mockResolvedValueOnce();

    render(<PostCard post={mockPost} onPostUpdated={mockOnPostUpdated} />);

    const reportBtn = screen.getByTitle("Báo cáo vi phạm");
    await userEvent.click(reportBtn);

    expect(screen.getByText("Báo cáo bài viết")).toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText("Nhập lý do báo cáo..."), "Spam");
    await userEvent.click(screen.getByRole("button", { name: "Gửi báo cáo" }));

    expect(communityService.reportPost).toHaveBeenCalledWith("p1", { reason: "Spam" });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Đã gửi báo cáo vi phạm. Quản trị viên sẽ xem xét.");
    });
  });

  it("should toggle comment section visibility when clicking comments", async () => {
    render(<PostCard post={mockPost} onPostUpdated={mockOnPostUpdated} />);

    expect(screen.queryByTestId("mock-comment-section")).not.toBeInTheDocument();

    const commentBtn = screen.getByRole("button", { name: /^Bình luận$/ });
    await userEvent.click(commentBtn);

    await waitFor(() => {
      expect(screen.getByTestId("mock-comment-section")).toBeInTheDocument();
    });

    await userEvent.click(commentBtn);

    await waitFor(() => {
      expect(screen.queryByTestId("mock-comment-section")).not.toBeInTheDocument();
    });
  });
});

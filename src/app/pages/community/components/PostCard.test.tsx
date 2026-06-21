import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { PostCard } from "./PostCard";
import communityService from "../../../../api/community/communityService";
import { toast } from "sonner";

// Mock dependencies
vi.mock("../../../../api/community/communityService", () => ({
  default: {
    likePost: vi.fn(),
    unlikePost: vi.fn(),
    reportPost: vi.fn(),
  }
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  }
}));

// Mock window.prompt
const originalPrompt = window.prompt;
const originalScrollTo = window.scrollTo;
beforeEach(() => {
  window.prompt = vi.fn();
  window.scrollTo = vi.fn();
  vi.clearAllMocks();
});
afterAll(() => {
  window.prompt = originalPrompt;
  window.scrollTo = originalScrollTo;
});

// Mock CommentSection to prevent it from rendering actual DOM which involves other requests
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
    expect(screen.getByText("5")).toBeInTheDocument(); // Like count
    expect(screen.getByText("2")).toBeInTheDocument(); // Comment count
  });

  it("should call likePost api and optimistic update when liking", async () => {
    vi.mocked(communityService.likePost).mockResolvedValueOnce();
    
    render(<PostCard post={mockPost} onPostUpdated={mockOnPostUpdated} />);
    
    // Find the Like button (it contains '5' from likeCount)
    const likeBtn = screen.getByText("5").closest("button");
    expect(likeBtn).not.toBeNull();
    
    await userEvent.click(likeBtn!);

    expect(mockOnPostUpdated).toHaveBeenCalledWith({
      ...mockPost,
      likedByMe: true,
      likeCount: 6
    });
    expect(communityService.likePost).toHaveBeenCalledWith("p1");
  });

  it("should call unlikePost api and optimistic update when unliking", async () => {
    vi.mocked(communityService.unlikePost).mockResolvedValueOnce();
    
    const likedPost = { ...mockPost, likedByMe: true, likeCount: 6 };
    render(<PostCard post={likedPost} onPostUpdated={mockOnPostUpdated} />);
    
    const likeBtn = screen.getByText("6").closest("button");
    expect(likeBtn).not.toBeNull();
    
    await userEvent.click(likeBtn!);

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
    
    const likeBtn = screen.getByText("5").closest("button");
    await userEvent.click(likeBtn!);

    // Initially optimistic update
    expect(mockOnPostUpdated).toHaveBeenNthCalledWith(1, {
      ...mockPost,
      likedByMe: true,
      likeCount: 6
    });

    // Revert after failure
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
    vi.mocked(window.prompt as any).mockReturnValueOnce("Spam");
    vi.mocked(communityService.reportPost).mockResolvedValueOnce();

    render(<PostCard post={mockPost} onPostUpdated={mockOnPostUpdated} />);
    
    const reportBtn = screen.getByTitle("Báo cáo vi phạm");
    await userEvent.click(reportBtn);

    expect(window.prompt).toHaveBeenCalledWith("Lý do báo cáo bài viết này:");
    expect(communityService.reportPost).toHaveBeenCalledWith("p1", { reason: "Spam" });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Đã gửi báo cáo vi phạm. Quản trị viên sẽ xem xét.");
    });
  });

  it("should toggle comment section visibility when clicking comments", async () => {
    render(<PostCard post={mockPost} onPostUpdated={mockOnPostUpdated} />);
    
    expect(screen.queryByTestId("mock-comment-section")).not.toBeInTheDocument();
    
    const commentBtn = screen.getByText("2").closest("button");
    await userEvent.click(commentBtn!);

    await waitFor(() => {
      expect(screen.getByTestId("mock-comment-section")).toBeInTheDocument();
    });
    
    // Click again to hide
    await userEvent.click(commentBtn!);
    
    await waitFor(() => {
      expect(screen.queryByTestId("mock-comment-section")).not.toBeInTheDocument();
    });
  });
});

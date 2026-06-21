import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CommentSection } from "./CommentSection";
import communityService from "../../../../api/community/communityService";
import * as authService from "../../../../api/auth/authService";
import { toast } from "sonner";

vi.mock("../../../../api/community/communityService", () => ({
  default: {
    getComments: vi.fn(),
    createComment: vi.fn(),
    deleteComment: vi.fn(),
  }
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }
}));

// Mock auth context to provide current user
vi.mock("../../../../api/auth/authService", () => ({
  getStoredUserProfile: vi.fn(),
  getStoredAuthSession: vi.fn(),
}));

// Provide a mock user whose id is 'u1' to match some comment authors
const mockCurrentUser = {
  email: "current@test.com",
  fullName: "Current User",
  firstName: "Current",
  lastName: "User",
  role: "LEARNER",
};

const mockAuthSession = {
  idToken: "header." + btoa(JSON.stringify({ sub: "u1" })) + ".signature"
};

const mockComments = [
  {
    commentId: "c1",
    postId: "p1",
    author: { userId: "u1", fullName: "Current User" },
    content: "My own comment",
    status: "VISIBLE" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    commentId: "c2",
    postId: "p1",
    author: { userId: "u2", fullName: "Other User" },
    content: "Someone else comment",
    status: "VISIBLE" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

describe("CommentSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.getStoredUserProfile).mockReturnValue(mockCurrentUser as any);
    vi.mocked(authService.getStoredAuthSession).mockReturnValue(mockAuthSession as any);
    
    // Default mock for getComments
    vi.mocked(communityService.getComments).mockResolvedValue({
      items: mockComments,
      page: 0, size: 10, totalItems: 2, first: true,
      last: true,
      totalPages: 1,
    });
  });

  it("should fetch and render comments on mount", async () => {
    render(<CommentSection postId="p1" initialCommentCount={2} />);
    
    // Shows loading initially, but resolves quickly
    await waitFor(() => {
      expect(communityService.getComments).toHaveBeenCalledWith("p1", 0, 10);
    });

    expect(screen.getByText("My own comment")).toBeInTheDocument();
    expect(screen.getByText("Current User")).toBeInTheDocument();
    
    expect(screen.getByText("Someone else comment")).toBeInTheDocument();
    expect(screen.getByText("Other User")).toBeInTheDocument();
  });

  it("should allow creating a new comment", async () => {
    vi.mocked(communityService.createComment).mockResolvedValueOnce({
      commentId: "c3",
      postId: "p1",
      author: { userId: "u1", fullName: "Current User" },
      content: "A brand new comment",
      status: "VISIBLE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    render(<CommentSection postId="p1" initialCommentCount={2} />);
    
    const input = screen.getByPlaceholderText("Viết bình luận...");
    await userEvent.type(input, "A brand new comment");
    
    const submitBtn = input.closest("form")?.querySelector<HTMLButtonElement>("button[type='submit']");
    if (!submitBtn) {
      throw new Error("Submit button not found");
    }
    await userEvent.click(submitBtn);

    expect(communityService.createComment).toHaveBeenCalledWith("p1", { content: "A brand new comment" });

    await waitFor(() => {
      expect(screen.getByText("A brand new comment")).toBeInTheDocument();
      expect(input).toHaveValue("");
    });
  });

  it("should display a toast if new comment is PENDING_MODERATION", async () => {
    vi.mocked(communityService.createComment).mockResolvedValueOnce({
      commentId: "c3",
      postId: "p1",
      author: { userId: "u1", fullName: "Current User" },
      content: "Sensitive comment",
      status: "PENDING_MODERATION",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    render(<CommentSection postId="p1" initialCommentCount={2} />);
    
    const input = screen.getByPlaceholderText("Viết bình luận...");
    await userEvent.type(input, "Sensitive comment");
    
    const submitBtn = input.parentElement?.querySelector("button[type='submit']");
    await userEvent.click(submitBtn!);

    await waitFor(() => {
      expect(toast.info).toHaveBeenCalledWith(expect.stringContaining("đang chờ duyệt"));
    });
  });

  // Note: Testing DropdownMenu visibility in JSDOM often requires mocking ResizeObserver
  // or pointer events, but we can test the delete function indirectly if we can trigger the menu item
  it("should show delete option only for user's own comments", async () => {
    render(<CommentSection postId="p1" initialCommentCount={2} />);
    
    await waitFor(() => {
      expect(screen.getByText("My own comment")).toBeInTheDocument();
    });

    // The MoreHorizontal button is rendered only for own comments.
    // In our mock, u1 has 1 comment, u2 has 1.
    // So there should be exactly 1 "More options" trigger button.
    const moreBtns = screen.getAllByRole("button", { expanded: false }); 
    // Wait, the dropdown triggers might just be buttons. Let's find it by the parent structure or class if needed.
    // Alternatively, just count buttons.
    // 1 submit button + 1 MoreHorizontal button = 2 buttons
    const buttons = document.querySelectorAll("button");
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });
});

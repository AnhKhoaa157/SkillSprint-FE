import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreatePostBox } from "./CreatePostBox";
import communityService from "../../../../api/community/communityService";
import { toast } from "sonner";

// Mock the dependencies
vi.mock("../../../../api/community/communityService", () => ({
  default: {
    createPost: vi.fn(),
  }
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }
}));

describe("CreatePostBox", () => {
  const mockOnPostCreated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render input fields and disabled submit button initially", () => {
    render(<CreatePostBox onPostCreated={mockOnPostCreated} />);
    
    expect(screen.getByPlaceholderText("Bạn muốn chia sẻ kiến thức gì hôm nay?")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Hashtags (VD: React, SpringBoot)")).toBeInTheDocument();
    
    const submitBtn = screen.getByRole("button", { name: /đăng bài/i });
    expect(submitBtn).toBeDisabled();
  });

  it("should enable submit button when content is entered", async () => {
    render(<CreatePostBox onPostCreated={mockOnPostCreated} />);
    
    const textarea = screen.getByPlaceholderText("Bạn muốn chia sẻ kiến thức gì hôm nay?");
    await userEvent.type(textarea, "Hôm nay tôi học được React Testing Library!");
    
    const submitBtn = screen.getByRole("button", { name: /đăng bài/i });
    expect(submitBtn).not.toBeDisabled();
  });

  it("should call createPost API and onPostCreated on successful submission", async () => {
    vi.mocked(communityService.createPost).mockResolvedValueOnce({
      status: "APPROVED",
      postId: "1",
      author: { userId: "u1", fullName: "Test User" },
      content: "Hello world",
      hashtags: ["react"],
      likeCount: 0,
      commentCount: 0,
      reportCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    render(<CreatePostBox onPostCreated={mockOnPostCreated} />);
    
    const textarea = screen.getByPlaceholderText("Bạn muốn chia sẻ kiến thức gì hôm nay?");
    const hashtagInput = screen.getByPlaceholderText("Hashtags (VD: React, SpringBoot)");
    const submitBtn = screen.getByRole("button", { name: /đăng bài/i });

    await userEvent.type(textarea, "Hello world");
    await userEvent.type(hashtagInput, "#react, frontend");
    await userEvent.click(submitBtn);

    expect(communityService.createPost).toHaveBeenCalledWith({
      content: "Hello world",
      hashtags: ["react", "frontend"],
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Đăng bài viết thành công!");
      expect(mockOnPostCreated).toHaveBeenCalled();
      // Form should be reset
      expect(textarea).toHaveValue("");
      expect(hashtagInput).toHaveValue("");
    });
  });

  it("should handle PENDING_MODERATION status correctly", async () => {
    vi.mocked(communityService.createPost).mockResolvedValueOnce({
      status: "PENDING_MODERATION",
      postId: "2",
      author: { userId: "u1", fullName: "Test User" },
      content: "Hello world",
      hashtags: [],
      likeCount: 0,
      commentCount: 0,
      reportCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    render(<CreatePostBox onPostCreated={mockOnPostCreated} />);
    
    const textarea = screen.getByPlaceholderText("Bạn muốn chia sẻ kiến thức gì hôm nay?");
    const submitBtn = screen.getByRole("button", { name: /đăng bài/i });

    await userEvent.type(textarea, "Sensitive content");
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(toast.info).toHaveBeenCalledWith("Bài viết của bạn đang chờ quản trị viên duyệt.", expect.any(Object));
      expect(mockOnPostCreated).toHaveBeenCalled();
    });
  });

  it("should handle API error", async () => {
    vi.mocked(communityService.createPost).mockRejectedValueOnce(new Error("API Error"));

    render(<CreatePostBox onPostCreated={mockOnPostCreated} />);
    
    const textarea = screen.getByPlaceholderText("Bạn muốn chia sẻ kiến thức gì hôm nay?");
    const submitBtn = screen.getByRole("button", { name: /đăng bài/i });

    await userEvent.type(textarea, "Hello world");
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("API Error");
      expect(mockOnPostCreated).not.toHaveBeenCalled();
    });
  });
});

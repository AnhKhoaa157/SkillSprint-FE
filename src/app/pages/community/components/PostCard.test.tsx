import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { PostCard } from "./PostCard";
import communityService from "../../../../api/community/communityService";
import { toast } from "sonner";

// ── Mocks ─────────────────────────────────────────────────────────────────
vi.mock("../../../../api/community/communityService", () => ({
  default: {
    likePost: vi.fn(),
    unlikePost: vi.fn(),
    reportPost: vi.fn(),
    updatePost: vi.fn(),
    deletePost: vi.fn(),
  },
}));

vi.mock("../../../../api/auth/authService", () => ({
  getStoredUserId: vi.fn(() => "viewer-id"),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("./CommentSection", () => ({
  CommentSection: () => <div data-testid="mock-comment-section" />,
}));

// ── Fixtures ───────────────────────────────────────────────────────────────
const basePost = {
  postId: "post-1",
  author: { userId: "author-1", fullName: "Nguyễn Văn A" },
  content: "Đây là nội dung bài viết test",
  hashtags: ["react", "typescript"],
  status: "APPROVED" as const,
  likeCount: 10,
  commentCount: 3,
  likedByMe: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ── Setup ─────────────────────────────────────────────────────────────────
const originalScrollTo = window.scrollTo;
const originalConfirm = window.confirm;

beforeEach(() => {
  window.scrollTo = vi.fn();
  window.confirm = vi.fn(() => true);
  vi.clearAllMocks();
});

afterAll(() => {
  window.scrollTo = originalScrollTo;
  window.confirm = originalConfirm;
});

// ── Tests ─────────────────────────────────────────────────────────────────
describe("PostCard", () => {
  const onPostUpdated = vi.fn();
  const onPostDeleted = vi.fn();

  // ── Rendering ────────────────────────────────────────────────────────────
  describe("Rendering", () => {
    it("should render author name, content and hashtags", () => {
      render(<PostCard post={basePost} onPostUpdated={onPostUpdated} />);

      expect(screen.getByText("Nguyễn Văn A")).toBeInTheDocument();
      expect(screen.getByText("Đây là nội dung bài viết test")).toBeInTheDocument();
      expect(screen.getByText("#react")).toBeInTheDocument();
      expect(screen.getByText("#typescript")).toBeInTheDocument();
    });

    it("should render like count when greater than 0", () => {
      render(<PostCard post={basePost} onPostUpdated={onPostUpdated} />);
      // likeCount = 10 → rendered as a number next to the thumbs-up icon
      expect(screen.getByText("10")).toBeInTheDocument();
    });

    it("should render comment count as clickable link", () => {
      render(<PostCard post={basePost} onPostUpdated={onPostUpdated} />);
      expect(screen.getByText("3 bình luận")).toBeInTheDocument();
    });

    it("should NOT show edit/delete options for non-author", () => {
      // getStoredUserId returns "viewer-id", author is "author-1"
      render(<PostCard post={basePost} onPostUpdated={onPostUpdated} />);
      // The MoreHorizontal dropdown button only shows for the author
      expect(screen.queryByLabelText("Tùy chọn")).not.toBeInTheDocument();
    });

    it("should show edit/delete dropdown for post author", () => {
      const authorPost = { ...basePost, author: { userId: "viewer-id", fullName: "Tôi" } };
      render(<PostCard post={authorPost} onPostUpdated={onPostUpdated} />);
      // More-options button appears only for the post author
      // The DropdownMenuTrigger button contains the MoreHorizontal icon
      const moreBtn = document.querySelector("button[aria-haspopup='menu']");
      expect(moreBtn).not.toBeNull();
    });
  });

  // ── Like / Unlike ────────────────────────────────────────────────────────
  describe("Like interaction", () => {
    it("should optimistically like a post and confirm with API response", async () => {
      const updatedPost = { ...basePost, likedByMe: true, likeCount: 11 };
      vi.mocked(communityService.likePost).mockResolvedValueOnce(updatedPost);

      render(<PostCard post={basePost} onPostUpdated={onPostUpdated} />);
      await userEvent.click(screen.getByRole("button", { name: /^Thích$/ }));

      // 1st call: optimistic update
      expect(onPostUpdated).toHaveBeenNthCalledWith(1, {
        ...basePost,
        likedByMe: true,
        likeCount: 11,
      });

      // 2nd call: confirmed from API
      await waitFor(() =>
        expect(onPostUpdated).toHaveBeenNthCalledWith(2, updatedPost)
      );
      expect(communityService.likePost).toHaveBeenCalledWith("post-1");
    });

    it("should optimistically unlike a post and confirm with API response", async () => {
      const likedPost = { ...basePost, likedByMe: true, likeCount: 11 };
      const updatedPost = { ...basePost, likedByMe: false, likeCount: 10 };
      vi.mocked(communityService.unlikePost).mockResolvedValueOnce(updatedPost);

      render(<PostCard post={likedPost} onPostUpdated={onPostUpdated} />);
      await userEvent.click(screen.getByRole("button", { name: /^Thích$/ }));

      expect(onPostUpdated).toHaveBeenNthCalledWith(1, {
        ...likedPost,
        likedByMe: false,
        likeCount: 10,
      });
      await waitFor(() =>
        expect(onPostUpdated).toHaveBeenNthCalledWith(2, updatedPost)
      );
    });

    it("should revert optimistic like update on API failure", async () => {
      vi.mocked(communityService.likePost).mockRejectedValueOnce(new Error("Network error"));

      render(<PostCard post={basePost} onPostUpdated={onPostUpdated} />);
      await userEvent.click(screen.getByRole("button", { name: /^Thích$/ }));

      // Optimistic update first
      expect(onPostUpdated).toHaveBeenNthCalledWith(1, {
        ...basePost,
        likedByMe: true,
        likeCount: 11,
      });

      // Then revert to original
      await waitFor(() => {
        expect(onPostUpdated).toHaveBeenNthCalledWith(2, basePost);
        expect(toast.error).toHaveBeenCalledWith("Network error");
      });
    });
  });

  // ── Comment Toggle ────────────────────────────────────────────────────────
  describe("Comment section", () => {
    it("should show comment section when clicking Bình luận button", async () => {
      render(<PostCard post={basePost} onPostUpdated={onPostUpdated} />);

      expect(screen.queryByTestId("mock-comment-section")).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole("button", { name: /^Bình luận$/ }));

      await waitFor(() =>
        expect(screen.getByTestId("mock-comment-section")).toBeInTheDocument()
      );
    });

    it("should hide comment section on second click (toggle)", async () => {
      render(<PostCard post={basePost} onPostUpdated={onPostUpdated} />);

      const btn = screen.getByRole("button", { name: /^Bình luận$/ });
      await userEvent.click(btn);
      await waitFor(() => expect(screen.getByTestId("mock-comment-section")).toBeInTheDocument());

      await userEvent.click(btn);
      await waitFor(() =>
        expect(screen.queryByTestId("mock-comment-section")).not.toBeInTheDocument()
      );
    });

    it("should also open comments when clicking the comment count link", async () => {
      render(<PostCard post={basePost} onPostUpdated={onPostUpdated} />);

      await userEvent.click(screen.getByText("3 bình luận"));

      await waitFor(() =>
        expect(screen.getByTestId("mock-comment-section")).toBeInTheDocument()
      );
    });
  });

  // ── Report ────────────────────────────────────────────────────────────────
  describe("Report", () => {
    it("should open report form on flag button click", async () => {
      render(<PostCard post={basePost} onPostUpdated={onPostUpdated} />);

      // Flag button uses title="Báo cáo"
      const flagBtn = screen.getByTitle("Báo cáo");
      await userEvent.click(flagBtn);
      expect(screen.getByText("Báo cáo bài viết")).toBeInTheDocument();
    });

    it("should submit report with reason and show success toast", async () => {
      vi.mocked(communityService.reportPost).mockResolvedValueOnce(undefined);

      render(<PostCard post={basePost} onPostUpdated={onPostUpdated} />);

      await userEvent.click(screen.getByTitle("Báo cáo"));
      await userEvent.type(screen.getByPlaceholderText("Nhập lý do báo cáo..."), "Nội dung spam");
      await userEvent.click(screen.getByRole("button", { name: "Gửi báo cáo" }));

      await waitFor(() => {
        expect(communityService.reportPost).toHaveBeenCalledWith("post-1", { reason: "Nội dung spam" });
        expect(toast.success).toHaveBeenCalledWith("Đã gửi báo cáo. Quản trị viên sẽ xem xét.");
      });
    });

    it("should disable Gửi báo cáo button when reason is empty", async () => {
      render(<PostCard post={basePost} onPostUpdated={onPostUpdated} />);

      await userEvent.click(screen.getByTitle("Báo cáo"));
      // Button is disabled when no reason is typed
      const submitBtn = screen.getByRole("button", { name: "Gửi báo cáo" });
      expect(submitBtn).toBeDisabled();
      expect(communityService.reportPost).not.toHaveBeenCalled();
    });
  });

  // ── Author Actions ────────────────────────────────────────────────────────
  describe("Author-only actions", () => {
    const authorPost = { ...basePost, author: { userId: "viewer-id", fullName: "Tôi" } };

    it("should show edit form when clicking edit option", async () => {
      render(<PostCard post={authorPost} onPostUpdated={onPostUpdated} />);

      // DropdownMenu trigger button
      const menuTrigger = document.querySelector("button[aria-haspopup='menu']") as HTMLElement;
      await userEvent.click(menuTrigger);
      await userEvent.click(screen.getByText("Chỉnh sửa"));

      // Edit textarea should appear pre-filled
      const textarea = screen.getByPlaceholderText("Bạn đang nghĩ gì?");
      expect(textarea).toBeInTheDocument();
      expect((textarea as HTMLTextAreaElement).value).toBe("Đây là nội dung bài viết test");
    });

    it("should call updatePost API and call onPostUpdated on save", async () => {
      const updatedPost = { ...authorPost, content: "Nội dung đã sửa" };
      vi.mocked(communityService.updatePost).mockResolvedValueOnce(updatedPost);

      render(<PostCard post={authorPost} onPostUpdated={onPostUpdated} />);

      const menuTrigger = document.querySelector("button[aria-haspopup='menu']") as HTMLElement;
      await userEvent.click(menuTrigger);
      await userEvent.click(screen.getByText("Chỉnh sửa"));

      const textarea = screen.getByPlaceholderText("Bạn đang nghĩ gì?");
      await userEvent.clear(textarea);
      await userEvent.type(textarea, "Nội dung đã sửa");

      await userEvent.click(screen.getByRole("button", { name: /Lưu thay đổi/i }));

      await waitFor(() => {
        expect(communityService.updatePost).toHaveBeenCalledWith("post-1", expect.objectContaining({ content: "Nội dung đã sửa" }));
        expect(onPostUpdated).toHaveBeenCalledWith(updatedPost);
        expect(toast.success).toHaveBeenCalledWith("Đã cập nhật bài viết");
      });
    });

    it("should call deletePost API and onPostDeleted after confirm", async () => {
      vi.mocked(communityService.deletePost).mockResolvedValueOnce(undefined);

      render(<PostCard post={authorPost} onPostUpdated={onPostUpdated} onPostDeleted={onPostDeleted} />);

      const menuTrigger = document.querySelector("button[aria-haspopup='menu']") as HTMLElement;
      await userEvent.click(menuTrigger);
      await userEvent.click(screen.getByText("Xóa bài viết"));

      await waitFor(() => {
        expect(communityService.deletePost).toHaveBeenCalledWith("post-1");
        expect(onPostDeleted).toHaveBeenCalledWith("post-1");
        expect(toast.success).toHaveBeenCalledWith("Đã xóa bài viết");
      });
    });
  });
});

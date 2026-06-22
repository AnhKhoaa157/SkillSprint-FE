import React, { useState } from "react";
import { Bookmark, Flag, Heart, MessageCircle, MoreHorizontal, Pencil, Share2, Trash, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
import { toast } from "sonner";
import { AnimatePresence, motion } from "motion/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import type { CommunityPost } from "../../../../api/community/communityTypes";
import communityService from "../../../../api/community/communityService";
import { getStoredUserId } from "../../../../api/auth/authService";
import { CommentSection } from "./CommentSection";

interface PostCardProps {
  post: CommunityPost;
  onPostUpdated: (updatedPost: CommunityPost) => void;
  onPostDeleted?: (postId: string) => void;
}

function parseHashtags(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(/[\s,]+/)
        .map((tag) => tag.replace(/^#+/, "").trim())
        .filter(Boolean),
    ),
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function PostCard({ post, onPostUpdated, onPostDeleted }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editHashtags, setEditHashtags] = useState((post.hashtags ?? []).join(" "));
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isReporting, setIsReporting] = useState(false);

  const isAuthor = getStoredUserId() === post.author.userId;

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);

    const isCurrentlyLiked = post.likedByMe;
    const previousLikeCount = post.likeCount;

    onPostUpdated({
      ...post,
      likedByMe: !isCurrentlyLiked,
      likeCount: isCurrentlyLiked ? Math.max(0, previousLikeCount - 1) : previousLikeCount + 1
    });

    try {
      const updatedServerPost = isCurrentlyLiked
        ? await communityService.unlikePost(post.postId)
        : await communityService.likePost(post.postId);
      onPostUpdated(updatedServerPost);
    } catch (error: unknown) {
      onPostUpdated({
        ...post,
        likedByMe: isCurrentlyLiked,
        likeCount: previousLikeCount
      });
      toast.error(getErrorMessage(error, "Không thể thực hiện thao tác"));
    } finally {
      setIsLiking(false);
    }
  };

  const handleReport = async () => {
    const reason = reportReason.trim();
    if (!reason) {
      toast.error("Vui lòng nhập lý do báo cáo");
      return;
    }

    setIsReporting(true);
    try {
      await communityService.reportPost(post.postId, { reason });
      toast.success("Đã gửi báo cáo vi phạm. Quản trị viên sẽ xem xét.");
      setReportReason("");
      setIsReportOpen(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Không thể gửi báo cáo"));
    } finally {
      setIsReporting(false);
    }
  };

  const startEditing = () => {
    setEditContent(post.content);
    setEditHashtags((post.hashtags ?? []).join(" "));
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    const content = editContent.trim();
    if (!content) {
      toast.error("Nội dung bài viết không được để trống");
      return;
    }

    setIsSaving(true);
    try {
      const updated = await communityService.updatePost(post.postId, {
        content,
        hashtags: parseHashtags(editHashtags),
      });
      onPostUpdated(updated);
      setIsEditing(false);
      if (updated.status === "PENDING_MODERATION") {
        toast.info("Bài viết đã chỉnh sửa chứa từ khóa nhạy cảm và đang chờ duyệt.");
      } else {
        toast.success("Đã cập nhật bài viết");
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Không thể cập nhật bài viết"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Bạn có chắc muốn xóa bài viết này?")) return;

    setIsDeleting(true);
    try {
      await communityService.deletePost(post.postId);
      onPostDeleted?.(post.postId);
      toast.success("Đã xóa bài viết");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Không thể xóa bài viết"));
      setIsDeleting(false);
    }
  };

  const timeAgo = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs} giờ trước`;
    return d.toLocaleDateString("vi-VN");
  };

  return (
    <article className="overflow-hidden rounded-[18px] border border-slate-200/80 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.06)] transition duration-200 hover:border-slate-300 hover:shadow-[0_14px_38px_rgba(15,23,42,0.09)]">
      <div className="p-5 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3.5">
            <Avatar className="h-11 w-11 shrink-0">
              <AvatarImage src={post.author.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-slate-100 text-sm font-bold text-slate-700">
                {post.author.fullName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-[15px] font-bold text-slate-950">
                  {post.author.fullName}
                </h3>
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-500">
                  Learner
                </span>
              </div>
              <p className="mt-0.5 text-[12px] font-medium text-slate-500">
                {timeAgo(post.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled
              title="Đang phát triển"
              aria-label="Lưu bài viết đang phát triển"
              className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-full text-slate-300"
            >
              <Bookmark className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsReportOpen(true)}
              title="Báo cáo vi phạm"
              aria-label="Báo cáo vi phạm"
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-500"
            >
              <Flag className="h-4 w-4" />
            </button>
            {isAuthor && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    title="Tùy chọn"
                    aria-label="Tùy chọn bài viết"
                    disabled={isDeleting}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={startEditing}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Chỉnh sửa
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600" onClick={handleDelete}>
                    <Trash className="mr-2 h-4 w-4" />
                    Xóa bài viết
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editContent}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditContent(e.target.value)}
              rows={4}
              className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-3 text-[15px] leading-7 text-slate-900 outline-none transition focus:border-[#FF6B00] focus:bg-white focus:ring-2 focus:ring-orange-100"
              placeholder="Bạn đang nghĩ gì?"
              disabled={isSaving}
            />
            <input
              value={editHashtags}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditHashtags(e.target.value)}
              className="w-full rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#FF6B00] focus:bg-white focus:ring-2 focus:ring-orange-100"
              placeholder="Hashtag, ví dụ: react springboot"
              disabled={isSaving}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
                className="flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-bold text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <X className="h-4 w-4" /> Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSaving || !editContent.trim()}
                className="flex h-9 items-center gap-1.5 rounded-full bg-[#FF6B00] px-4 text-sm font-bold text-white transition hover:bg-[#ea580c] disabled:opacity-50"
              >
                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="whitespace-pre-wrap text-[15px] leading-[1.72] text-[#0F172A]">
              {post.content}
            </p>

            {post.hashtags && post.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.hashtags.map((tag: string) => (
                  <span
                    key={tag}
                    className="rounded-full bg-orange-50/60 px-2.5 py-1 text-xs font-bold text-slate-700 ring-1 ring-orange-100/40 transition hover:bg-orange-50 hover:text-[#D95B00]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between border-b border-slate-100 pb-2.5 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-50 text-[#D95B00] ring-1 ring-orange-100">
              <Heart className="h-3 w-3 fill-current" />
            </span>
            <span>{post.likeCount} lượt thích</span>
          </div>
          <button
            type="button"
            onClick={() => setShowComments(true)}
            className="transition hover:text-slate-900"
          >
            {post.commentCount} bình luận
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1 pt-2">
          <button
            type="button"
            onClick={handleLike}
            className={`flex min-h-9 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition duration-150 active:scale-[0.98] ${
              post.likedByMe
                ? "bg-orange-50/80 text-[#D95B00]"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <Heart className={`h-4 w-4 transition-transform duration-150 ${post.likedByMe ? "scale-110 fill-current" : ""}`} />
            Thích
          </button>

          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className="flex min-h-9 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-slate-500 transition duration-150 hover:bg-slate-50 hover:text-slate-800 active:scale-[0.98]"
          >
            <MessageCircle className="h-4 w-4" />
            Bình luận
          </button>

          <button
            type="button"
            disabled
            title="Đang phát triển"
            className="flex min-h-9 cursor-not-allowed items-center justify-center gap-2 rounded-xl text-sm font-semibold text-slate-400"
          >
            <Share2 className="h-4 w-4" />
            Chia sẻ
          </button>
        </div>

        <AnimatePresence>
          {isReportOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-950">Báo cáo bài viết</h4>
                  <p className="mt-0.5 text-xs text-slate-500">Cho quản trị viên biết vấn đề bạn thấy.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsReportOpen(false);
                    setReportReason("");
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-white hover:text-slate-700"
                  aria-label="Đóng báo cáo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <textarea
                value={reportReason}
                onChange={(event) => setReportReason(event.target.value)}
                rows={3}
                placeholder="Nhập lý do báo cáo..."
                disabled={isReporting}
                className="w-full resize-none rounded-2xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#FF6B00] focus:ring-2 focus:ring-orange-100 disabled:opacity-60"
              />
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsReportOpen(false);
                    setReportReason("");
                  }}
                  disabled={isReporting}
                  className="h-9 rounded-full px-4 text-sm font-bold text-slate-500 transition hover:bg-white disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleReport}
                  disabled={isReporting || !reportReason.trim()}
                  className="inline-flex h-9 items-center justify-center rounded-full bg-[#FF6B00] px-4 text-sm font-bold text-white transition hover:bg-[#EA580C] disabled:bg-slate-200 disabled:text-slate-400"
                >
                  {isReporting ? "Đang gửi..." : "Gửi báo cáo"}
                </button>
              </div>
            </motion.div>
          )}

          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3">
                <CommentSection
                  postId={post.postId}
                  initialCommentCount={post.commentCount}
                  onCommentAdded={() => onPostUpdated({ ...post, commentCount: post.commentCount + 1 })}
                  onCommentDeleted={() => onPostUpdated({ ...post, commentCount: Math.max(0, post.commentCount - 1) })}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </article>
  );
}

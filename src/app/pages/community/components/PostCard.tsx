import React, { useState } from "react";
import {
  Bookmark, Flag, Heart, MessageCircle, MoreHorizontal,
  Pencil, Share2, Trash, X, ThumbsUp,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
import { toast } from "sonner";
import { AnimatePresence, motion } from "motion/react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
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
    new Set(input.split(/[\s,]+/).map(tag => tag.replace(/^#+/, "").trim()).filter(Boolean)),
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
    onPostUpdated({ ...post, likedByMe: !isCurrentlyLiked, likeCount: isCurrentlyLiked ? Math.max(0, previousLikeCount - 1) : previousLikeCount + 1 });
    try {
      const updated = isCurrentlyLiked
        ? await communityService.unlikePost(post.postId)
        : await communityService.likePost(post.postId);
      onPostUpdated(updated);
    } catch (error: unknown) {
      onPostUpdated({ ...post, likedByMe: isCurrentlyLiked, likeCount: previousLikeCount });
      toast.error(getErrorMessage(error, "Không thể thực hiện thao tác"));
    } finally { setIsLiking(false); }
  };

  const handleReport = async () => {
    const reason = reportReason.trim();
    if (!reason) { toast.error("Vui lòng nhập lý do báo cáo"); return; }
    setIsReporting(true);
    try {
      await communityService.reportPost(post.postId, { reason });
      toast.success("Đã gửi báo cáo. Quản trị viên sẽ xem xét.");
      setReportReason(""); setIsReportOpen(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Không thể gửi báo cáo"));
    } finally { setIsReporting(false); }
  };

  const startEditing = () => { setEditContent(post.content); setEditHashtags((post.hashtags ?? []).join(" ")); setIsEditing(true); };

  const handleSaveEdit = async () => {
    const content = editContent.trim();
    if (!content) { toast.error("Nội dung bài viết không được để trống"); return; }
    setIsSaving(true);
    try {
      const updated = await communityService.updatePost(post.postId, { content, hashtags: parseHashtags(editHashtags) });
      onPostUpdated(updated);
      setIsEditing(false);
      toast.success(updated.status === "PENDING_MODERATION" ? "Bài viết đang chờ duyệt." : "Đã cập nhật bài viết");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Không thể cập nhật bài viết"));
    } finally { setIsSaving(false); }
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
    const diffMins = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs} giờ trước`;
    return d.toLocaleDateString("vi-VN");
  };

  return (
    <article className="overflow-hidden rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-2 sm:gap-3 px-3 sm:px-5 pt-3.5 sm:pt-4 pb-2.5 sm:pb-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {/* Avatar */}
          <div className="relative shrink-0">
            <Avatar className="h-9 w-9 sm:h-11 sm:w-11 ring-2 ring-white shadow-md">
              <AvatarImage src={post.author.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-gradient-to-br from-[#FF6B00] to-orange-400 text-[13px] sm:text-[15px] font-black text-white">
                {post.author.fullName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full bg-emerald-400 border-2 border-white" />
          </div>

          {/* Author info */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[14px] font-bold text-slate-900 leading-tight">{post.author.fullName}</span>
              <span className="inline-flex items-center rounded-[4px] bg-[#FF6B00] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white leading-none">
                Học viên
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo(post.createdAt)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button type="button" onClick={() => setIsReportOpen(v => !v)} title="Báo cáo"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300 hover:bg-red-50 hover:text-red-500 transition">
            <Flag className="h-3.5 w-3.5" />
          </button>
          {isAuthor && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" disabled={isDeleting}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300 hover:bg-slate-100 hover:text-slate-700 transition disabled:opacity-50">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl border-slate-100 shadow-lg min-w-[140px]">
                <DropdownMenuItem onClick={startEditing} className="cursor-pointer text-[13px] font-semibold text-slate-700 focus:bg-slate-50">
                  <Pencil className="mr-2 h-4 w-4 text-slate-500" /> Chỉnh sửa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="cursor-pointer text-[13px] font-semibold text-red-600 focus:bg-red-50">
                  <Trash className="mr-2 h-4 w-4 text-red-500" /> Xóa bài viết
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-3 sm:px-5 pb-3">
        {isEditing ? (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={4}
              className="w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-[14px] leading-relaxed text-slate-800 outline-none transition focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/10"
              placeholder="Bạn đang nghĩ gì?" disabled={isSaving}
            />
            <input value={editHashtags} onChange={e => setEditHashtags(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700 outline-none transition focus:border-[#FF6B00]"
              placeholder="Hashtag, ví dụ: react springboot" disabled={isSaving}
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsEditing(false)} disabled={isSaving}
                className="h-8 rounded-full px-4 text-[12px] font-bold text-slate-500 hover:bg-slate-100 transition disabled:opacity-50">
                Hủy
              </button>
              <button type="button" onClick={handleSaveEdit} disabled={isSaving || !editContent.trim()}
                className="h-8 rounded-full bg-[#FF6B00] px-5 text-[12px] font-bold text-white hover:bg-[#e85f00] transition disabled:opacity-50">
                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="whitespace-pre-wrap text-[14px] leading-[1.75] text-slate-800">{post.content}</p>
            {post.hashtags && post.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {post.hashtags.map((tag: string) => (
                  <span key={tag}
                    className="inline-flex items-center rounded-full bg-[#FF6B00]/8 border border-[#FF6B00]/20 px-2.5 py-0.5 text-[12px] font-semibold text-[#FF6B00] cursor-pointer hover:bg-[#FF6B00]/15 transition">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Stats bar — Facebook style ── */}
      {(post.likeCount > 0 || post.commentCount > 0) && (
        <div className="mx-3 sm:mx-5 flex items-center justify-between border-t border-slate-100 py-2 text-[12px] text-slate-500">
          <div className="flex items-center gap-1.5">
            {post.likeCount > 0 && (
              <>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FF6B00] shadow-sm">
                  <ThumbsUp className="h-3 w-3 fill-current text-white" />
                </span>
                <span className="font-medium">{post.likeCount}</span>
              </>
            )}
          </div>
          {post.commentCount > 0 && (
            <button type="button" onClick={() => setShowComments(!showComments)}
              className="font-medium hover:underline hover:text-slate-700 transition">
              {post.commentCount} bình luận
            </button>
          )}
        </div>
      )}

      {/* ── Action bar — Facebook style ── */}
      <div className="mx-2 sm:mx-4 border-t border-slate-100">
        <div className="grid grid-cols-3 py-0.5">
          <motion.button type="button" whileTap={{ scale: 0.93 }} onClick={handleLike}
            className={`flex h-9 sm:h-10 items-center justify-center gap-1.5 sm:gap-2 rounded-xl text-[12px] sm:text-[13px] font-bold transition-all duration-150 ${
              post.likedByMe
                ? "text-[#FF6B00]"
                : "text-slate-500 hover:bg-slate-50 hover:text-[#FF6B00]"
            }`}>
            <ThumbsUp className={`h-4.5 w-4.5 transition-transform ${post.likedByMe ? "fill-current scale-110" : ""}`} />
            Thích
          </motion.button>

          <motion.button type="button" whileTap={{ scale: 0.93 }} onClick={() => setShowComments(!showComments)}
            className={`flex h-10 items-center justify-center gap-2 rounded-xl text-[13px] font-bold transition-all duration-150 ${
              showComments ? "text-[#FF6B00]" : "text-slate-500 hover:bg-slate-50 hover:text-[#FF6B00]"
            }`}>
            <MessageCircle className="h-4.5 w-4.5" />
            Bình luận
          </motion.button>

          <button type="button" disabled title="Đang phát triển"
            className="flex h-10 cursor-not-allowed items-center justify-center gap-2 rounded-xl text-[13px] font-bold text-slate-300">
            <Share2 className="h-4.5 w-4.5" />
            Chia sẻ
          </button>
        </div>
      </div>

      {/* ── Report form ── */}
      <AnimatePresence>
        {isReportOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mx-5 mb-3 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-bold text-slate-800">Báo cáo bài viết</p>
                <button type="button" onClick={() => { setIsReportOpen(false); setReportReason(""); }}
                  className="h-6 w-6 flex items-center justify-center rounded-full text-slate-400 hover:bg-white hover:text-slate-700 transition">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <textarea value={reportReason} onChange={e => setReportReason(e.target.value)} rows={2}
                placeholder="Nhập lý do báo cáo..." disabled={isReporting}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-[13px] text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/10 disabled:opacity-60"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => { setIsReportOpen(false); setReportReason(""); }}
                  className="text-[12px] font-bold text-slate-500 hover:text-slate-700 transition">Hủy</button>
                <button type="button" onClick={handleReport} disabled={isReporting || !reportReason.trim()}
                  className="rounded-full bg-[#FF6B00] px-4 py-1.5 text-[12px] font-bold text-white hover:bg-[#e85f00] transition disabled:opacity-50">
                  {isReporting ? "Đang gửi..." : "Gửi báo cáo"}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Comments ── */}
        {showComments && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="border-t border-slate-100 px-5 py-4">
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
    </article>
  );
}

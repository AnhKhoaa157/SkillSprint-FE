import React, { useState } from "react";
import { Flag, Heart, MessageCircle, MoreHorizontal, Share2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
import { toast } from "sonner";
import { AnimatePresence, motion } from "motion/react";
import type { CommunityPost } from "../../../../api/community/communityTypes";
import communityService from "../../../../api/community/communityService";
import { CommentSection } from "./CommentSection";

interface PostCardProps {
  post: CommunityPost;
  onPostUpdated: (updatedPost: CommunityPost) => void;
}

export function PostCard({ post, onPostUpdated }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

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
      if (isCurrentlyLiked) {
        await communityService.unlikePost(post.postId);
      } else {
        await communityService.likePost(post.postId);
      }
    } catch (err: any) {
      onPostUpdated({
        ...post,
        likedByMe: isCurrentlyLiked,
        likeCount: previousLikeCount
      });
      toast.error(err.message || "Không thể thực hiện thao tác");
    } finally {
      setIsLiking(false);
    }
  };

  const handleReport = async () => {
    const reason = window.prompt("Lý do báo cáo bài viết này:");
    if (!reason) return;

    try {
      await communityService.reportPost(post.postId, { reason });
      toast.success("Đã gửi báo cáo vi phạm. Quản trị viên sẽ xem xét.");
    } catch (err: any) {
      toast.error(err.message || "Không thể gửi báo cáo");
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
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_-20px_rgba(15,23,42,0.25)] transition hover:border-orange-100 hover:shadow-[0_18px_38px_-24px_rgba(255,107,0,0.35)]">
      <div className="p-4 sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="h-11 w-11 shrink-0 ring-2 ring-orange-50">
              <AvatarImage src={post.author.avatarObjectKey} />
              <AvatarFallback className="bg-gradient-to-br from-orange-100 to-amber-100 text-sm font-black text-[#FF6B00]">
                {post.author.fullName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-sm font-extrabold text-slate-900">
                  {post.author.fullName}
                </h3>
                <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#FF6B00]">
                  Learner
                </span>
              </div>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                {timeAgo(post.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleReport}
              title="Báo cáo vi phạm"
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-500"
            >
              <Flag className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Tùy chọn"
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-800">
            {post.content}
          </p>

          {post.hashtags && post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.hashtags.map((tag: string) => (
                <span
                  key={tag}
                  className="rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-xs font-bold text-[#FF6B00] transition hover:bg-orange-100"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between border-b border-slate-100 pb-3 text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#FF7E21] to-[#FF6B00] text-white shadow-sm">
              <Heart className="h-3.5 w-3.5 fill-current" />
            </span>
            <span>{post.likeCount} lượt thích</span>
          </div>
          <button
            type="button"
            onClick={() => setShowComments(true)}
            className="transition hover:text-[#FF6B00]"
          >
            {post.commentCount} bình luận
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1 pt-2">
          <button
            type="button"
            onClick={handleLike}
            className={`flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-extrabold transition active:scale-[0.98] ${
              post.likedByMe
                ? "bg-orange-50 text-[#FF6B00]"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`}
          >
            <Heart className={`h-4 w-4 ${post.likedByMe ? "fill-current" : ""}`} />
            Thích
          </button>

          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className="flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-extrabold text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 active:scale-[0.98]"
          >
            <MessageCircle className="h-4 w-4" />
            Bình luận
          </button>

          <button
            type="button"
            className="flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-extrabold text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 active:scale-[0.98]"
          >
            <Share2 className="h-4 w-4" />
            Chia sẻ
          </button>
        </div>

        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3">
                <CommentSection postId={post.postId} initialCommentCount={post.commentCount} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </article>
  );
}

import React, { useState } from "react";
import { Heart, MessageCircle, Flag, MoreHorizontal } from "lucide-react";
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
    
    const isCurrentlyLiked = post.isLikedByMe;
    const previousLikeCount = post.likeCount;
    
    // Optimistic update
    onPostUpdated({
      ...post,
      isLikedByMe: !isCurrentlyLiked,
      likeCount: isCurrentlyLiked ? Math.max(0, previousLikeCount - 1) : previousLikeCount + 1
    });

    try {
      if (isCurrentlyLiked) {
        await communityService.unlikePost(post.postId);
      } else {
        await communityService.likePost(post.postId);
      }
    } catch (err: any) {
      // Revert on error
      onPostUpdated({
        ...post,
        isLikedByMe: isCurrentlyLiked,
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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={post.user.avatarUrl} />
            <AvatarFallback className="bg-orange-100 text-[#FF6B00] font-semibold">
              {post.user.fullName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-800 text-sm leading-tight">
              {post.user.fullName}
            </span>
            <span className="text-xs text-slate-500">
              {timeAgo(post.createdAt)}
            </span>
          </div>
        </div>
        
        <button 
          onClick={handleReport}
          title="Báo cáo vi phạm"
          className="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
        >
          <Flag size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-slate-800 whitespace-pre-wrap text-[15px] leading-relaxed">
          {post.content}
        </p>
      </div>

      {/* Hashtags */}
      {post.hashtags && post.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.hashtags.map((tag: string) => (
            <span key={tag} className="text-xs font-semibold text-[#FF6B00] bg-orange-50 px-2 py-1 rounded-md cursor-pointer hover:bg-orange-100 transition-colors">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-6 pt-3 border-t border-slate-100">
        <button 
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-sm font-medium transition-all active:scale-95 ${
            post.isLikedByMe ? "text-red-500" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Heart size={18} fill={post.isLikedByMe ? "currentColor" : "none"} className={post.isLikedByMe ? "text-red-500" : ""} />
          <span>{post.likeCount > 0 ? post.likeCount : "Thích"}</span>
        </button>

        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition-all active:scale-95"
        >
          <MessageCircle size={18} />
          <span>{post.commentCount > 0 ? post.commentCount : "Bình luận"}</span>
        </button>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4">
              <CommentSection postId={post.postId} initialCommentCount={post.commentCount} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

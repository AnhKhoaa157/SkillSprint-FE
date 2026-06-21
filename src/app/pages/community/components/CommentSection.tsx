import React, { useState, useEffect } from "react";
import { MessageCircle, Send, MoreHorizontal, Trash, Edit2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import communityService from "../../../../api/community/communityService";
import type { PostComment } from "../../../../api/community/communityTypes";
import { getStoredUserProfile, getStoredAuthSession } from "../../../../api/auth/authService";

function decodeUserId(): string | null {
  const session = getStoredAuthSession();
  if (!session?.idToken) return null;
  try {
    const payloadB64 = session.idToken.split(".")[1];
    const json = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));
    return json.sub || json.userId || json.user_id || null;
  } catch {
    return null;
  }
}


interface CommentSectionProps {
  postId: string;
  initialCommentCount: number;
}

export function CommentSection({ postId, initialCommentCount }: CommentSectionProps) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  
  const currentUser = getStoredUserProfile();
  const currentUserId = decodeUserId();

  const loadComments = async (pageToLoad: number) => {
    setIsLoading(true);
    try {
      const response = await communityService.getComments(postId, pageToLoad, 10);
      if (pageToLoad === 0) {
        setComments(response.content);
      } else {
        setComments(prev => [...prev, ...response.content]);
      }
      setHasMore(!response.last);
      setPage(pageToLoad);
    } catch (err: any) {
      toast.error("Không thể tải bình luận");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComments(0);
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const comment = await communityService.createComment(postId, { content: newComment });
      
      if (comment.status === "PENDING_MODERATION") {
        toast.info("Bình luận của bạn chứa từ khóa nhạy cảm và đang chờ duyệt.");
      } else {
        // Add locally
        setComments(prev => [comment, ...prev]);
        setNewComment("");
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể gửi bình luận");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await communityService.deleteComment(postId, commentId);
      setComments(prev => prev.filter(c => c.commentId !== commentId));
      toast.success("Đã xóa bình luận");
    } catch (err: any) {
      toast.error(err.message || "Không thể xóa bình luận");
    }
  };

  return (
    <div className="pt-4 border-t border-slate-100 flex flex-col gap-4">
      {/* Input area */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <Avatar className="w-8 h-8 shrink-0">
          <AvatarFallback className="bg-slate-100 text-slate-500 text-xs">
            {currentUser?.fullName?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 flex items-center gap-2 relative">
          <Input
            value={newComment}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewComment(e.target.value)}
            placeholder="Viết bình luận..."
            className="rounded-full pr-10 bg-slate-50 border-slate-200"
            disabled={isSubmitting}
          />
          <button 
            type="submit" 
            disabled={isSubmitting || !newComment.trim()}
            className="absolute right-3 text-[#FF6B00] disabled:text-slate-300 transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </form>

      {/* Comments list */}
      <div className="flex flex-col gap-4 mt-2">
        {comments.map(comment => (
          <div key={comment.commentId} className="flex gap-3 group">
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarImage src={comment.author.avatarUrl} />
              <AvatarFallback className="bg-slate-100 text-slate-600 text-xs">
                {comment.author.fullName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 flex flex-col items-start gap-1">
              <div className="bg-slate-50 rounded-2xl px-4 py-2 relative w-full sm:w-auto sm:max-w-[85%]">
                <p className="font-semibold text-sm text-slate-800">{comment.author.fullName}</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{comment.content}</p>
                
                {currentUserId === comment.author.userId && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200">
                          <MoreHorizontal size={14} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(comment.commentId)}>
                          <Trash size={14} className="mr-2" />
                          Xóa bình luận
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
              <span className="text-[11px] text-slate-400 px-2">
                {new Date(comment.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-center py-2">
            <div className="w-5 h-5 border-2 border-slate-200 border-t-[#FF6B00] rounded-full animate-spin" />
          </div>
        )}

        {hasMore && !isLoading && (
          <button 
            onClick={() => loadComments(page + 1)}
            className="text-xs font-semibold text-[#FF6B00] hover:underline self-start pl-11"
          >
            Xem thêm bình luận
          </button>
        )}
      </div>
    </div>
  );
}

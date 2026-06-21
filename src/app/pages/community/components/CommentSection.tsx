import React, { useState, useEffect } from "react";
import { MoreHorizontal, Pencil, Send, Trash, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
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
import { getStoredUserProfile, getStoredUserId } from "../../../../api/auth/authService";
import meService from "../../../../api/utilities/meService";

interface CommentSectionProps {
  postId: string;
  initialCommentCount: number;
  onCommentAdded?: () => void;
  onCommentDeleted?: () => void;
}

export function CommentSection({ postId, initialCommentCount, onCommentAdded, onCommentDeleted }: CommentSectionProps) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const currentUser = getStoredUserProfile();
  const currentUserId = getStoredUserId();

  useEffect(() => {
    meService.getMe().then(me => setAvatarUrl(me.avatarUrl)).catch(() => {});
  }, []);

  const loadComments = async (pageToLoad: number) => {
    setIsLoading(true);
    try {
      const response = await communityService.getComments(postId, pageToLoad, 10);
      if (pageToLoad === 0) {
        setComments(response.items);
      } else {
        setComments(prev => [...prev, ...response.items]);
      }
      setHasMore(!response.last);
      setPage(pageToLoad);
    } catch {
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
        setComments(prev => [comment, ...prev]);
        setNewComment("");
        onCommentAdded?.();
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
      onCommentDeleted?.();
      toast.success("Đã xóa bình luận");
    } catch (err: any) {
      toast.error(err.message || "Không thể xóa bình luận");
    }
  };

  const startEditing = (comment: PostComment) => {
    setEditingId(comment.commentId);
    setEditValue(comment.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleUpdate = async (commentId: string) => {
    const content = editValue.trim();
    if (!content) return;

    setIsSavingEdit(true);
    try {
      const updated = await communityService.updateComment(postId, commentId, { content });
      setComments(prev => prev.map(c => (c.commentId === commentId ? updated : c)));
      cancelEditing();
      if (updated.status === "PENDING_MODERATION") {
        toast.info("Bình luận đã chỉnh sửa chứa từ khóa nhạy cảm và đang chờ duyệt.");
      } else {
        toast.success("Đã cập nhật bình luận");
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể cập nhật bình luận");
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 border-t border-slate-100 pt-4">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <Avatar className="h-8 w-8 shrink-0 ring-2 ring-orange-50">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback className="bg-orange-50 text-xs font-black text-[#FF6B00]">
            {currentUser?.fullName?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="relative flex-1">
          <Input
            value={newComment}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewComment(e.target.value)}
            placeholder="Viết bình luận..."
            className="h-10 rounded-full border-slate-200 bg-slate-50 pr-11 text-sm focus-visible:ring-[#FF6B00]"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#FF6B00] transition hover:bg-orange-50 disabled:text-slate-300 disabled:hover:bg-transparent"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>

      <div className="flex flex-col gap-3">
        {comments.map(comment => (
          <div key={comment.commentId} className="group flex gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={comment.author.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-slate-100 text-xs font-bold text-slate-600">
                {comment.author.fullName.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              {editingId === comment.commentId ? (
                <div className="flex flex-col gap-2">
                  <Input
                    value={editValue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditValue(e.target.value)}
                    className="h-10 rounded-2xl border-slate-200 bg-slate-50 text-sm focus-visible:ring-[#FF6B00]"
                    disabled={isSavingEdit}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdate(comment.commentId)}
                      disabled={isSavingEdit || !editValue.trim()}
                      className="rounded-full bg-[#FF6B00] px-4 py-1.5 text-xs font-extrabold text-white transition hover:bg-[#e85f00] disabled:opacity-50"
                    >
                      {isSavingEdit ? "Đang lưu..." : "Lưu"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      disabled={isSavingEdit}
                      className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-extrabold text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" /> Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <div className="min-w-0 rounded-2xl bg-slate-100 px-4 py-2">
                    <p className="text-sm font-extrabold text-slate-800">{comment.author.fullName}</p>
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
                      {comment.content}
                    </p>
                  </div>

                  {currentUserId === comment.author.userId && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="mt-1 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => startEditing(comment)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(comment.commentId)}>
                          <Trash className="mr-2 h-4 w-4" />
                          Xóa bình luận
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              )}

              <span className="mt-1 block px-2 text-[11px] font-semibold text-slate-400">
                {new Date(comment.createdAt).toLocaleDateString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-center py-2">
            <div className="h-5 w-5 rounded-full border-2 border-slate-200 border-t-[#FF6B00] animate-spin" />
          </div>
        )}

        {!isLoading && comments.length === 0 && initialCommentCount === 0 && (
          <p className="pl-11 text-sm font-medium text-slate-400">Chưa có bình luận nào.</p>
        )}

        {hasMore && !isLoading && (
          <button
            type="button"
            onClick={() => loadComments(page + 1)}
            className="self-start pl-11 text-xs font-extrabold text-[#FF6B00] transition hover:underline"
          >
            Xem thêm bình luận
          </button>
        )}
      </div>
    </div>
  );
}

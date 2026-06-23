import React, { useState, useEffect } from "react";
import { Flag, MoreHorizontal, Pencil, Send, Trash, X } from "lucide-react";
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
  const [reportingId, setReportingId] = useState<string | null>(null);

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

  const handleReport = async (commentId: string) => {
    const reason = window.prompt("Nhập lý do báo cáo bình luận này:");
    const trimmedReason = reason?.trim();
    if (!trimmedReason) return;

    setReportingId(commentId);
    try {
      await communityService.reportComment(commentId, { reason: trimmedReason });
      toast.success("Đã gửi báo cáo bình luận");
    } catch (err: any) {
      toast.error(err.message || "Không thể báo cáo bình luận");
    } finally {
      setReportingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <Avatar className="h-8 w-8 shrink-0 ring-2 ring-orange-100/50">
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
            className="h-10 rounded-full border-slate-200 bg-slate-50/50 pl-4 pr-11 text-sm outline-none transition duration-200 focus-visible:border-[#FF6B00] focus-visible:ring-1 focus-visible:ring-orange-100"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#FF6B00] transition hover:bg-orange-50 disabled:text-slate-300 disabled:hover:bg-transparent"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>

      <div className="flex flex-col gap-3.5">
        {comments.map(comment => (
          <div key={comment.commentId} className="group flex gap-3">
            <Avatar className="h-8 w-8 shrink-0 border border-slate-100">
              <AvatarImage src={comment.author.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-slate-100 text-xs font-bold text-slate-600">
                {comment.author.fullName.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              {editingId === comment.commentId ? (
                <div className="flex flex-col gap-2 rounded-2xl bg-slate-50/50 p-2 ring-1 ring-slate-200/50">
                  <Input
                    value={editValue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditValue(e.target.value)}
                    className="h-9 rounded-xl border-slate-200 bg-white text-sm focus-visible:ring-[#FF6B00]"
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
                      <X className="h-3 w-3" /> Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <div className="min-w-0 rounded-2xl bg-slate-50/60 backdrop-blur-sm px-4 py-2.5 border border-slate-100/35 hover:bg-slate-50/80 transition duration-300">
                    <p className="text-[13px] font-bold text-slate-800">{comment.author.fullName}</p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-slate-600">
                      {comment.content}
                    </p>
                  </div>

                  {currentUserId !== comment.author.userId && (
                    <button
                      type="button"
                      disabled={reportingId === comment.commentId}
                      onClick={() => handleReport(comment.commentId)}
                      className="mt-1.5 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 disabled:opacity-40"
                      title="Báo cáo bình luận"
                    >
                      <Flag className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {currentUserId === comment.author.userId && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="mt-1.5 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 opacity-0 transition hover:bg-slate-50 hover:text-slate-600 group-hover:opacity-100">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl border-slate-100 shadow-md">
                        <DropdownMenuItem onClick={() => startEditing(comment)} className="cursor-pointer font-medium text-slate-700">
                          <Pencil className="mr-2 h-3.5 w-3.5 text-slate-500" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer font-medium text-red-600 focus:bg-red-50" onClick={() => handleDelete(comment.commentId)}>
                          <Trash className="mr-2 h-3.5 w-3.5 text-red-500" />
                          Xóa bình luận
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              )}

              <span className="mt-1 block px-3.5 text-[10px] font-medium text-slate-400">
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
          <p className="pl-3 text-xs font-semibold text-slate-400">Chưa có bình luận nào.</p>
        )}

        {hasMore && !isLoading && (
          <button
            type="button"
            onClick={() => loadComments(page + 1)}
            className="self-start pl-3 text-xs font-bold text-[#FF6B00] transition hover:text-[#e85f00] hover:underline"
          >
            Xem thêm bình luận
          </button>
        )}
      </div>
    </div>
  );
}

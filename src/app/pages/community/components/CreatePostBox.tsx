import React, { useState, useEffect } from "react";
import { Hash, Lightbulb, Send, Sparkles } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Textarea } from "../../../components/ui/textarea";
import { Input } from "../../../components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
import { toast } from "sonner";
import communityService from "../../../../api/community/communityService";
import { getStoredUserProfile } from "../../../../api/auth/authService";
import meService from "../../../../api/utilities/meService";

interface CreatePostBoxProps {
  onPostCreated: () => void;
}

export function CreatePostBox({ onPostCreated }: CreatePostBoxProps) {
  const [content, setContent] = useState("");
  const [hashtags, setHashtags] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  const currentUser = getStoredUserProfile();
  useEffect(() => {
    meService.getMe().then(me => setAvatarUrl(me.avatarUrl)).catch(() => {});
  }, []);

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();

    if (!content.trim()) {
      toast.error("Vui lòng nhập nội dung bài viết");
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedHashtags = hashtags
        .split(/[\s,]+/)
        .map(tag => tag.startsWith("#") ? tag.substring(1) : tag)
        .filter(tag => tag.length > 0);

      const post = await communityService.createPost({
        content,
        hashtags: parsedHashtags
      });

      if (post.status === "PENDING_MODERATION") {
        toast.info("Bài viết của bạn đang chờ quản trị viên duyệt.", { duration: 5000 });
      } else {
        toast.success("Đăng bài viết thành công!");
      }

      setContent("");
      setHashtags("");
      onPostCreated();
    } catch (err: any) {
      toast.error(err.message || "Có lỗi xảy ra khi đăng bài.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200/60 bg-white shadow-sm"
    >
      <div className="flex gap-3 p-4 sm:p-5">
        <Avatar className="h-11 w-11 shrink-0 ring-2 ring-orange-50">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback className="bg-gradient-to-br from-orange-100 to-amber-100 text-sm font-black text-[#FF6B00]">
            {currentUser?.fullName?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <Textarea
            value={content}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
            placeholder="Bạn đang học được điều gì hôm nay?"
            className="min-h-[92px] resize-none border-none bg-transparent px-0 text-[15px] leading-relaxed text-slate-800 shadow-none placeholder:text-slate-400 focus-visible:ring-0"
            maxLength={5000}
          />

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-[#FF6B00]">
              <Sparkles className="h-3.5 w-3.5" />
              Chia sẻ sprint
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600">
              <Lightbulb className="h-3.5 w-3.5" />
              Mẹo học tập
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 px-4 py-3 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1">
            <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={hashtags}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHashtags(e.target.value)}
              placeholder="Hashtags: React, SpringBoot"
              className="h-10 rounded-full border-slate-200 bg-white pl-9 text-sm focus-visible:ring-[#FF6B00]"
            />
          </div>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <span className="text-xs font-bold text-slate-400">
              {content.length}/5000
            </span>
            <Button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="h-10 rounded-full bg-gradient-to-r from-[#FF7E21] to-[#FF6B00] px-5 text-white shadow-md shadow-orange-500/20 transition hover:brightness-105 active:scale-[0.98]"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Đăng bài
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

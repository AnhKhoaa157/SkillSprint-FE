import React, { useEffect, useState } from "react";
import { Clapperboard, Hash, Image, Lightbulb, Paperclip, Send, Sparkles, Video, X } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Textarea } from "../../../components/ui/textarea";
import { Input } from "../../../components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
import { toast } from "sonner";
import { AnimatePresence, motion } from "motion/react";
import communityService from "../../../../api/community/communityService";
import { getStoredUserProfile } from "../../../../api/auth/authService";
import meService from "../../../../api/utilities/meService";

interface CreatePostBoxProps {
  onPostCreated: () => void;
}

interface CreatePostModalProps extends CreatePostBoxProps {
  avatarUrl?: string;
  displayName: string;
  isOpen: boolean;
  onClose: () => void;
}

const MAX_CONTENT_LENGTH = 5000;

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function getFirstName(fullName?: string) {
  const parts = fullName?.trim().split(/\s+/).filter(Boolean) ?? [];
  return parts.length > 0 ? parts[parts.length - 1] : "Khoa";
}

export function CreatePostBox({ onPostCreated }: CreatePostBoxProps) {
  return <CreatePostComposer onPostCreated={onPostCreated} />;
}

export function CreatePostComposer({ onPostCreated }: CreatePostBoxProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  const currentUser = getStoredUserProfile();
  const displayName = currentUser?.fullName || "Chí Dân Hacker";
  const firstName = getFirstName(displayName);

  useEffect(() => {
    meService.getMe().then(me => {
      if (me.avatarUrl) setAvatarUrl(me.avatarUrl);
    }).catch(() => {});
  }, []);

  return (
    <>
      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="bg-orange-50 text-sm font-bold text-[#FF6B00]">
              {displayName.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="min-w-0 flex-1 rounded-full bg-[#F3F4F6] px-4 py-2.5 text-left text-[15px] font-medium text-slate-500 transition hover:bg-slate-200/70 focus:outline-none focus:ring-2 focus:ring-orange-200"
          >
            {firstName} ơi, bạn đang nghĩ gì thế?
          </button>

          <div className="hidden items-center gap-1 sm:flex">
            <button
              type="button"
              title="Video"
              onClick={() => setIsModalOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              <Video className="h-5 w-5" />
            </button>
            <button
              type="button"
              title="Hình ảnh"
              onClick={() => setIsModalOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              <Image className="h-5 w-5" />
            </button>
            <button
              type="button"
              title="Media"
              onClick={() => setIsModalOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              <Clapperboard className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPostCreated={onPostCreated}
        avatarUrl={avatarUrl}
        displayName={displayName}
      />
    </>
  );
}

export function CreatePostModal({ isOpen, onClose, onPostCreated, avatarUrl, displayName }: CreatePostModalProps) {
  const [content, setContent] = useState("");
  const [hashtags, setHashtags] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firstName = getFirstName(displayName);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();

    const trimmedContent = content.trim();
    if (!trimmedContent) {
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
        content: trimmedContent,
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
      onClose();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Có lỗi xảy ra khi đăng bài."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = content.trim().length > 0 && !isSubmitting;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onMouseDown={onClose}
        >
          <motion.form
            onSubmit={handleSubmit}
            onMouseDown={(event) => event.stopPropagation()}
            className="max-h-[92vh] w-full overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-w-[560px] sm:rounded-2xl"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <div className="relative flex h-14 items-center justify-center border-b border-slate-100 px-12">
              <h2 className="text-base font-bold text-slate-950">Tạo bài viết</h2>
              <button
                type="button"
                onClick={onClose}
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-950"
                title="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(92vh-112px)] overflow-y-auto px-4 py-4 sm:px-5">
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11 shrink-0">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="bg-orange-50 text-sm font-bold text-[#FF6B00]">
                    {displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-bold text-slate-950">{displayName}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">
                      Learner
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">Chia sẻ với cộng đồng</p>
                </div>
              </div>

              <div className="mt-4">
                <Textarea
                  autoFocus
                  value={content}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                  placeholder={`${firstName} ơi, bạn đang nghĩ gì thế?`}
                  className="min-h-[160px] resize-none border-0 bg-transparent px-0 text-[16px] leading-7 text-slate-900 shadow-none placeholder:text-slate-400 focus-visible:ring-0"
                  maxLength={MAX_CONTENT_LENGTH}
                />
                <div className="mt-2 text-right text-xs font-semibold text-slate-400">
                  {content.length}/{MAX_CONTENT_LENGTH}
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={hashtags}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHashtags(e.target.value)}
                    placeholder="Thêm hashtag: React, SpringBoot..."
                    className="h-10 rounded-full border-slate-200 bg-white pl-9 text-sm shadow-none focus-visible:ring-[#FF6B00]"
                  />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                    <Sparkles className="h-3.5 w-3.5 text-[#FF6B00]" />
                    Sprint note
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                    <Lightbulb className="h-3.5 w-3.5 text-emerald-600" />
                    Mẹo học tập
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                    <Paperclip className="h-3.5 w-3.5 text-slate-500" />
                    Thêm ảnh/video
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 p-4">
              <Button
                type="submit"
                disabled={!canSubmit}
                className="h-11 w-full rounded-full bg-[#FF6B00] text-sm font-bold text-white shadow-sm shadow-orange-500/20 transition hover:bg-[#ea580c] disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
              >
                {isSubmitting ? (
                  <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Đăng bài
              </Button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

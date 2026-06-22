import React, { useEffect, useRef, useState } from "react";
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
  openSignal?: number;
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

export function CreatePostBox({ onPostCreated, openSignal = 0 }: CreatePostBoxProps) {
  return <CreatePostComposer onPostCreated={onPostCreated} openSignal={openSignal} />;
}

export function CreatePostComposer({ onPostCreated, openSignal = 0 }: CreatePostBoxProps) {
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

  useEffect(() => {
    if (openSignal > 0) setIsModalOpen(true);
  }, [openSignal]);

  return (
    <>
      <section
        onClick={() => setIsModalOpen(true)}
        className="group cursor-pointer rounded-[18px] border border-slate-200/80 bg-white p-4 shadow-[0_6px_22px_rgba(15,23,42,0.05)] transition duration-200 hover:border-orange-200 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
      >
        <div className="flex min-h-12 items-center gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="bg-orange-50 text-sm font-bold text-[#FF6B00]">
              {displayName.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIsModalOpen(true);
            }}
            className="min-w-0 flex-1 rounded-full bg-[#F3F4F6] px-4 py-3 text-left text-[15px] font-semibold text-slate-600 transition group-hover:bg-white group-hover:text-slate-800 group-hover:ring-1 group-hover:ring-orange-100 hover:bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
          >
            {firstName} ơi, bạn đang nghĩ gì thế?
          </button>

          <div className="hidden items-center gap-1.5 sm:flex">
            <button
              type="button"
              title="Video"
              aria-label="Thêm video"
              onClick={(event) => {
                event.stopPropagation();
                setIsModalOpen(true);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition group-hover:bg-slate-50 hover:bg-orange-50 hover:text-[#D95B00]"
            >
              <Video className="h-[18px] w-[18px]" />
            </button>
            <button
              type="button"
              title="Hình ảnh"
              aria-label="Thêm hình ảnh"
              onClick={(event) => {
                event.stopPropagation();
                setIsModalOpen(true);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition group-hover:bg-slate-50 hover:bg-orange-50 hover:text-[#D95B00]"
            >
              <Image className="h-[18px] w-[18px]" />
            </button>
            <button
              type="button"
              title="Media"
              aria-label="Thêm media"
              onClick={(event) => {
                event.stopPropagation();
                setIsModalOpen(true);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition group-hover:bg-slate-50 hover:bg-orange-50 hover:text-[#D95B00]"
            >
              <Clapperboard className="h-[18px] w-[18px]" />
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
  const modalRef = useRef<HTMLFormElement>(null);
  const firstName = getFirstName(displayName);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !modalRef.current) return;

      const focusableElements = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
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
        toast.success("Đã đăng sprint của bạn 🚀");
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
  const isNearLimit = content.length >= MAX_CONTENT_LENGTH * 0.9;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onMouseDown={onClose}
        >
          <motion.form
            ref={modalRef}
            onSubmit={handleSubmit}
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-post-title"
            className="max-h-[92vh] w-full overflow-hidden rounded-t-[18px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] sm:max-w-[560px] sm:rounded-[18px]"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <div className="relative flex h-14 items-center justify-center border-b border-slate-100 px-12">
              <h2 id="create-post-title" className="text-base font-bold text-slate-950">Tạo bài viết</h2>
              <button
                type="button"
                onClick={onClose}
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-950"
                title="Đóng"
                aria-label="Đóng modal tạo bài viết"
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
                <div className={`mt-2 text-right text-xs font-semibold ${isNearLimit ? "text-[#D95B00]" : "text-slate-400"}`}>
                  {content.length}/{MAX_CONTENT_LENGTH}
                </div>
              </div>

              <div className="mt-4 rounded-[18px] border border-slate-200 bg-slate-50/70 p-3">
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={hashtags}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHashtags(e.target.value)}
                    placeholder="Thêm hashtag: React, SpringBoot..."
                    className="h-10 rounded-full border-slate-200 bg-white pl-9 text-sm shadow-none focus-visible:ring-orange-200"
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

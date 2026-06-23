import React, { useEffect, useRef, useState } from "react";
import { Clapperboard, Hash, Image, Lightbulb, Loader2, Paperclip, Send, Sparkles, Video, X } from "lucide-react";
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
        className="group cursor-pointer rounded-3xl border border-white bg-white/90 p-4.5 shadow-[0_12px_36px_rgba(0,0,0,0.02),0_1px_3px_rgba(0,0,0,0.01)] backdrop-blur-xl transition-all duration-300 hover:border-slate-200/85 hover:shadow-[0_20px_48px_rgba(0,0,0,0.04)]"
      >
        <div className="flex items-center gap-3.5">
          <div className="relative shrink-0">
            <div className="absolute -inset-0.5 rounded-full bg-gradient-to-tr from-[#FF6B00] to-[#FF8A00] opacity-40 blur-[1px] group-hover:opacity-90 transition duration-300" />
            <Avatar className="relative h-10 w-10 border-2 border-white">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-orange-50 text-sm font-black text-[#FF6B00]">
                {displayName.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
 
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIsModalOpen(true);
            }}
            className="min-w-0 flex-1 rounded-full bg-slate-50/70 border border-slate-200/50 px-5 py-2.5 text-left text-xs font-bold text-slate-400 transition-all duration-300 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-500 focus:outline-none"
          >
            {firstName} ơi, bạn đang nghĩ gì thế?
          </button>
 
          <div className="hidden items-center gap-1.5 sm:flex">
            <button
              type="button"
              title="Đăng video"
              aria-label="Đăng video"
              onClick={(event) => {
                event.stopPropagation();
                setIsModalOpen(true);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-all duration-300 hover:bg-slate-100 hover:text-rose-500 active:scale-95"
            >
              <Video className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              title="Đăng ảnh"
              aria-label="Đăng ảnh"
              onClick={(event) => {
                event.stopPropagation();
                setIsModalOpen(true);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-all duration-300 hover:bg-slate-100 hover:text-emerald-500 active:scale-95"
            >
              <Image className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              title="Chia sẻ ý tưởng"
              aria-label="Chia sẻ ý tưởng"
              onClick={(event) => {
                event.stopPropagation();
                setIsModalOpen(true);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-all duration-300 hover:bg-slate-100 hover:text-sky-500 active:scale-95"
            >
              <Lightbulb className="h-4.5 w-4.5" />
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
        toast.success("Đã đăng bài chia sẻ thành công 🚀");
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
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={onClose}
        >
          <motion.form
            ref={modalRef}
            onSubmit={handleSubmit}
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-post-title"
            className="relative max-h-[92vh] w-full overflow-hidden rounded-t-3xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:max-w-[540px] sm:rounded-3xl border border-slate-100"
            initial={{ opacity: 0, y: 15, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.97 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {/* Top orange gradient accent strip */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF6B00] via-[#FF8A00] to-[#FFB800]" />

            <div className="relative flex h-14 items-center justify-center border-b border-slate-100 px-12 mt-1">
              <h2 id="create-post-title" className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Tạo bài viết thảo luận</h2>
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-slate-50 border border-slate-200/50 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                title="Đóng"
                aria-label="Đóng modal tạo bài viết"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="max-h-[calc(92vh-120px)] overflow-y-auto px-5 py-5">
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11 shrink-0 border border-slate-150 shadow-xs">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="bg-orange-50 text-sm font-black text-[#FF6B00]">
                    {displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-xs font-black text-slate-800">{displayName}</p>
                    <span className="rounded-full bg-orange-50/80 border border-orange-100/50 px-2.5 py-0.5 text-[9px] font-bold uppercase text-[#FF6B00] tracking-wider">
                      Học viên
                    </span>
                  </div>
                  <p className="mt-0.5 text-[10px] font-semibold text-slate-400">Chia sẻ công khai với cộng đồng</p>
                </div>
              </div>

              <div className="mt-4">
                <Textarea
                  autoFocus
                  value={content}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                  placeholder={`${firstName} ơi, bạn đang nghĩ gì thế?`}
                  className="min-h-[160px] resize-none border-0 bg-transparent px-0 text-sm leading-relaxed text-slate-850 shadow-none placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                  maxLength={MAX_CONTENT_LENGTH}
                />
                <div className={`mt-2 text-right text-[10px] font-bold tracking-wide ${isNearLimit ? "text-[#FF6B00]" : "text-slate-400"}`}>
                  {content.length}/{MAX_CONTENT_LENGTH}
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 ring-1 ring-slate-200/50">
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 font-bold" />
                  <Input
                    value={hashtags}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHashtags(e.target.value)}
                    placeholder="Thêm các hashtag (ví dụ: React, SpringBoot...)"
                    className="h-10 rounded-xl border border-slate-200 bg-white pl-8 text-xs font-semibold shadow-none outline-none focus-visible:border-[#FF6B00] focus-visible:ring-1 focus-visible:ring-orange-100"
                  />
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-slate-600 border border-slate-200/60 shadow-xs">
                    <Sparkles className="h-3 w-3 text-[#FF6B00]" />
                    Kiến thức
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-slate-600 border border-slate-200/60 shadow-xs">
                    <Lightbulb className="h-3 w-3 text-emerald-500" />
                    Chia sẻ mẹo
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-slate-600 border border-slate-200/60 shadow-xs">
                    <Paperclip className="h-3 w-3 text-blue-500" />
                    Đính kèm tài liệu
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 p-4 bg-slate-50/30">
              <Button
                type="submit"
                disabled={!canSubmit}
                className="h-10 w-full rounded-full bg-gradient-to-r from-[#FF6B00] via-[#FF8A00] to-[#FF9F00] text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/35 transition active:scale-[0.98] disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                ) : (
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                )}
                Đăng bài viết chia sẻ
              </Button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

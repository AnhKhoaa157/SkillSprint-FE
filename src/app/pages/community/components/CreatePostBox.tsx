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
import { RankBadge } from "./RankBadge";
import meService from "../../../../api/utilities/meService";
import pointService from "../../../../api/learning/pointService";
import { normalizeHashtag, parseHashtags } from "../communityHashtags";

interface CreatePostBoxProps {
  onPostCreated: () => void;
  openSignal?: number;
}

interface CreatePostModalProps extends CreatePostBoxProps {
  avatarUrl?: string;
  displayName: string;
  allTimeRank: number | null;
  isOpen: boolean;
  onClose: () => void;
}

const MAX_CONTENT_LENGTH = 5000;

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function getComposerName(fullName?: string) {
  const parts = fullName?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return "";

  const lastPart = parts[parts.length - 1].toLowerCase();
  if (parts.length > 1 && ["hacker", "learner", "student", "user", "admin"].includes(lastPart)) {
    return parts.slice(0, Math.min(2, parts.length - 1)).join(" ");
  }

  return parts[0];
}

function getComposerPrompt(name: string) {
  return name ? `${name} ơi, hôm nay bạn học được gì?` : "Hôm nay bạn học được gì?";
}

export function CreatePostBox({ onPostCreated, openSignal = 0 }: CreatePostBoxProps) {
  return <CreatePostComposer onPostCreated={onPostCreated} openSignal={openSignal} />;
}

export function CreatePostComposer({ onPostCreated, openSignal = 0 }: CreatePostBoxProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const currentUser = getStoredUserProfile();
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  const [displayName, setDisplayName] = useState<string>(currentUser?.fullName?.trim() || "");
  const [allTimeRank, setAllTimeRank] = useState<number | null>(null);

  const composerName = getComposerName(displayName);
  const composerPrompt = getComposerPrompt(composerName);

  useEffect(() => {
    meService.getMe().then(me => {
      if (me.avatarUrl) setAvatarUrl(me.avatarUrl);
      if (me.fullName) setDisplayName(me.fullName);
    }).catch(() => {});
    pointService.getMeSummary().then(summary => {
      setAllTimeRank(summary.allTimeRank);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (openSignal > 0) setIsModalOpen(true);
  }, [openSignal]);

  return (
    <>
      <section
        onClick={() => setIsModalOpen(true)}
        className="group cursor-pointer rounded-[1.75rem] border border-white bg-white/85 p-4 shadow-[0_16px_45px_rgba(71,50,35,0.06)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-100 hover:bg-white hover:shadow-[0_20px_50px_rgba(71,50,35,0.08)] sm:p-5"
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative shrink-0">
            <div className="absolute -inset-1 rounded-2xl bg-orange-100 opacity-70 transition duration-300 group-hover:bg-orange-200" />
            <Avatar className="relative h-11 w-11 rounded-xl border-2 border-white shadow-sm">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="rounded-xl bg-orange-50 text-sm font-black text-[#FF6B00]">
                {displayName.charAt(0) || "S"}
              </AvatarFallback>
            </Avatar>
          </div>
 
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIsModalOpen(true);
            }}
            className="min-w-0 flex-1 rounded-2xl border border-slate-100 bg-[#F8F9FA] px-4 py-3 text-left text-xs font-semibold text-slate-400 transition-all duration-300 hover:border-orange-100 hover:bg-orange-50/40 hover:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 sm:px-5"
          >
            {composerPrompt}
          </button>
 
          <div className="hidden items-center gap-1 sm:flex">
            <button
              type="button"
              title="Đăng video"
              aria-label="Đăng video"
              onClick={(event) => {
                event.stopPropagation();
                setIsModalOpen(true);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-all duration-300 hover:bg-orange-50 hover:text-[#FF6B00] active:scale-95"
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
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-all duration-300 hover:bg-orange-50 hover:text-[#FF6B00] active:scale-95"
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
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-all duration-300 hover:bg-orange-50 hover:text-[#FF6B00] active:scale-95"
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
        allTimeRank={allTimeRank}
      />
    </>
  );
}

export function CreatePostModal({ isOpen, onClose, onPostCreated, avatarUrl, displayName, allTimeRank }: CreatePostModalProps) {
  const [content, setContent] = useState("");
  const [hashtags, setHashtags] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef<HTMLFormElement>(null);
  const composerPrompt = getComposerPrompt(getComposerName(displayName));
  const parsedPreviewHashtags = parseHashtags(hashtags);

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
    const parsedHashtags = parseHashtags(hashtags);

    if (!trimmedContent && parsedHashtags.length === 0) {
      toast.error("Vui lòng nhập nội dung hoặc hashtag cho bài viết");
      return;
    }

    setIsSubmitting(true);
    try {
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

  const canSubmit = (content.trim().length > 0 || parsedPreviewHashtags.length > 0) && !isSubmitting;
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
            className="relative max-h-[92vh] w-full overflow-hidden rounded-t-[2rem] border border-white bg-white shadow-[0_28px_90px_rgba(71,50,35,0.2)] sm:max-w-[620px] sm:rounded-[2rem]"
            initial={{ opacity: 0, y: 15, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.97 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div className="relative flex items-start justify-between border-b border-slate-100 bg-[#FFFDFB] px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl border border-orange-100 bg-[#FFF2EA] text-[#D9541E] shadow-[0_7px_18px_rgba(217,84,30,0.08)]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#C84E20]">Cộng đồng SkillSprint</p>
                  <h2 id="create-post-title" className="mt-0.5 text-base font-black tracking-[-0.02em] text-slate-900">Chia sẻ điều bạn vừa học</h2>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 active:scale-95"
                title="Đóng"
                aria-label="Đóng modal tạo bài viết"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="max-h-[calc(92vh-136px)] overflow-y-auto px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 px-3.5 py-3">
                <Avatar className="h-10 w-10 shrink-0 border border-white shadow-sm">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="bg-orange-50 text-sm font-bold text-[#FF6B00]">
                    {displayName.charAt(0) || "S"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-bold text-slate-900">{displayName}</p>
                    <RankBadge rank={allTimeRank} />
                  </div>
                  <p className="mt-0.5 text-[10px] font-semibold text-slate-400">Bài viết sẽ được chia sẻ với cộng đồng</p>
                </div>
              </div>

              <div className="mt-5">
                <Textarea
                  autoFocus
                  value={content}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                  placeholder={composerPrompt}
                  className="min-h-[190px] resize-none border-0 bg-transparent px-0 text-[16px] leading-7 text-slate-800 shadow-none placeholder:text-slate-400 focus-visible:ring-0"
                  maxLength={MAX_CONTENT_LENGTH}
                />
                <div className={`mt-2 text-right text-[10px] font-bold tabular-nums tracking-wide ${isNearLimit ? "text-[#D9541E]" : "text-slate-400"}`}>
                  {content.length}/{MAX_CONTENT_LENGTH}
                </div>
              </div>

              <div className="mt-3 border-t border-slate-100 pt-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Hashtag & tuỳ chọn</label>
                  <span className="text-[10px] font-medium text-slate-400">Giúp mọi người dễ tìm bài viết</span>
                </div>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 font-bold" />
                  <Input
                    value={hashtags}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHashtags(e.target.value)}
                    placeholder="Thêm các hashtag (ví dụ: React, SpringBoot...)"
                    className="h-11 rounded-xl border border-slate-200 bg-[#FBFCFD] pl-8 text-xs font-semibold shadow-none outline-none focus-visible:border-[#E9AE90] focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-orange-100"
                  />
                </div>

                {parsedPreviewHashtags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {parsedPreviewHashtags.map((tag) => {
                      const label = normalizeHashtag(tag);
                      return (
                        <span
                          key={tag}
                          title={label}
                          className="inline-flex max-w-[140px] items-center truncate rounded-lg border border-orange-100 bg-[#FFF7F2] px-2.5 py-1 text-[10px] font-bold text-[#C84E20]"
                        >
                          <span className="truncate">{label}</span>
                        </span>
                      );
                    })}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-600 shadow-sm">
                    <Sparkles className="h-3 w-3 text-[#FF6B00]" />
                    Sprint note
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-600 shadow-sm">
                    <Lightbulb className="h-3 w-3 text-emerald-500" />
                    Chia sẻ mẹo
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-600 shadow-sm">
                    <Paperclip className="h-3 w-3 text-blue-500" />
                    Đính kèm tài liệu
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-[#FFFDFC] px-5 py-4 sm:px-6">
              <p className="hidden text-[10px] font-medium text-slate-400 sm:block">Hãy chia sẻ cụ thể để nhận được phản hồi hữu ích.</p>
              <Button type="button" variant="ghost" onClick={onClose} className="h-10 rounded-xl px-3 text-xs font-bold text-slate-500 hover:bg-slate-100">Hủy</Button>
              <Button
                type="submit"
                disabled={!canSubmit}
                className="h-10 rounded-xl bg-[#E45F2A] px-5 text-xs font-bold text-white shadow-[0_8px_20px_rgba(228,95,42,0.2)] transition hover:bg-[#CF4F1F] hover:shadow-[0_10px_24px_rgba(228,95,42,0.26)] active:scale-[0.98] disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
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

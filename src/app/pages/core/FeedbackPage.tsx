import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bug, Lightbulb, HelpCircle, MessageSquare,
  CheckCircle2, Send, RotateCcw, Link as LinkIcon,
} from "lucide-react";
import { createFeedback, type FeedbackType } from "../../../api/feedbackService";
import { toast } from "sonner";

const TYPES: { value: FeedbackType; label: string; emoji: string; desc: string; icon: React.ReactNode }[] = [
  { value: "BUG",         label: "Báo lỗi",       emoji: "🐛", desc: "Tìm thấy lỗi trong ứng dụng",  icon: <Bug size={16} /> },
  { value: "IMPROVEMENT", label: "Đề xuất",       emoji: "💡", desc: "Ý tưởng cải thiện tính năng",   icon: <Lightbulb size={16} /> },
  { value: "QUESTION",    label: "Câu hỏi",       emoji: "❓", desc: "Cần giải đáp thắc mắc",         icon: <HelpCircle size={16} /> },
  { value: "OTHER",       label: "Khác",           emoji: "💬", desc: "Nội dung không thuộc loại trên", icon: <MessageSquare size={16} /> },
];

export default function FeedbackPage() {
  const [type, setType] = useState<FeedbackType>("IMPROVEMENT");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [relatedUrl, setRelatedUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setIsSubmitting(true);
    try {
      await createFeedback({
        type,
        title: title.trim(),
        content: content.trim(),
        relatedUrl: relatedUrl.trim() || null,
      });
      setSubmitted(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gửi phản hồi thất bại, vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setType("IMPROVEMENT");
    setTitle("");
    setContent("");
    setRelatedUrl("");
    setSubmitted(false);
  }

  return (
    <div className="h-full overflow-y-auto bg-[#F1F5F9] p-6 md:p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Gửi phản hồi</h1>
          <p className="mt-1 text-sm text-slate-500">Ý kiến của bạn giúp chúng tôi cải thiện SkillSprint mỗi ngày.</p>
        </div>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border border-slate-200 bg-white p-8 text-center"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 border border-violet-200">
                <CheckCircle2 size={24} className="text-violet-600" />
              </div>
              <h2 className="text-base font-extrabold text-slate-900">Phản hồi đã được gửi!</h2>
              <p className="mt-2 text-sm text-slate-500 leading-6">
                Cảm ơn bạn đã dành thời gian phản hồi. Đội ngũ SkillSprint sẽ xem xét và phản hồi sớm nhất có thể.
              </p>
              <button
                onClick={handleReset}
                className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <RotateCcw size={14} /> Gửi phản hồi khác
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Type selector */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-400 mb-3">Loại phản hồi</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                        type === t.value
                          ? "border-violet-300 bg-violet-50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50/40"
                      }`}
                    >
                      <span className="text-lg">{t.emoji}</span>
                      <span className={`text-xs font-bold ${type === t.value ? "text-violet-700" : "text-slate-700"}`}>
                        {t.label}
                      </span>
                      <span className="text-[10px] leading-4 text-slate-400">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title + content */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tiêu đề <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Mô tả ngắn gọn vấn đề hoặc ý tưởng..."
                    maxLength={200}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-[#F8F9FB] px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nội dung chi tiết <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Mô tả chi tiết vấn đề, các bước tái hiện lỗi, hoặc ý tưởng của bạn..."
                    maxLength={2000}
                    required
                    rows={6}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-[#F8F9FB] px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20 transition"
                  />
                  <p className="mt-1 text-right text-[10px] text-slate-400">{content.length}/2000</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    <span className="inline-flex items-center gap-1.5"><LinkIcon size={11} /> URL liên quan</span>{" "}
                    <span className="font-normal text-slate-400">(tùy chọn)</span>
                  </label>
                  <input
                    type="url"
                    value={relatedUrl}
                    onChange={(e) => setRelatedUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-slate-200 bg-[#F8F9FB] px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !title.trim() || !content.trim()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FF6B00] px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={15} />
                {isSubmitting ? "Đang gửi..." : "Gửi phản hồi"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

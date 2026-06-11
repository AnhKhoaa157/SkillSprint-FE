import { useMemo, useState } from "react";
import {
  AlertCircle,
  Bug,
  Link as LinkIcon,
  LoaderCircle,
  MessageSquare,
  Send,
  CheckCircle2,
  PlusCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  createFeedback,
  FeedbackType,
} from "../../../api/feedbackService";

const FEEDBACK_TYPES: Array<{ value: FeedbackType; label: string; description: string; icon: React.ReactNode }> = [
  { value: FeedbackType.BUG, label: "Bug", description: "Something is broken", icon: <Bug size={16} /> },
  { value: FeedbackType.IMPROVEMENT, label: "Improvement", description: "A product improvement", icon: <MessageSquare size={16} /> },
  { value: FeedbackType.QUESTION, label: "Question", description: "Something you need answered", icon: <AlertCircle size={16} /> },
  { value: FeedbackType.OTHER, label: "Other", description: "Anything else", icon: <AlertCircle size={16} /> },
];

// Hàm kiểm tra xem chuỗi có phải là link ảnh trực tiếp hay không
function isImageLink(url: string): boolean {
  const cleanUrl = url.trim().toLowerCase();
  return (
    cleanUrl.endsWith(".png") ||
    cleanUrl.endsWith(".jpg") ||
    cleanUrl.endsWith(".jpeg") ||
    cleanUrl.endsWith(".webp") ||
    cleanUrl.endsWith(".gif") ||
    cleanUrl.includes("image") // Dự phòng trường hợp link dạng CDN chứa chữ image
  );
}

export default function FeedbackPage() {
  const [type, setType] = useState<FeedbackType>(FeedbackType.IMPROVEMENT);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [combinedUrl, setCombinedUrl] = useState(""); // Ô input gộp duy nhất
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Tự động phân tích link nhập vào để làm nguồn Preview ảnh
  const imagePreviewSrc = useMemo(() => {
    if (!combinedUrl.trim()) return null;
    return isImageLink(combinedUrl) ? combinedUrl.trim() : null;
  }, [combinedUrl]);

  function resetForm() {
    setType(FeedbackType.IMPROVEMENT);
    setTitle("");
    setContent("");
    setCombinedUrl("");
  }

  function handleCreateNewFeedback() {
    resetForm();
    setIsSuccess(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const urlValue = combinedUrl.trim();
    // Logic bóc tách: Nếu là link ảnh -> gán vào imageUrl, ngược lại gán vào relatedUrl
    const isImg = isImageLink(urlValue);
    const relatedUrlPayload = urlValue && !isImg ? urlValue : null;
    const imageUrlPayload = urlValue && isImg ? urlValue : null;

    setSubmitting(true);
    try {
      await createFeedback({
        type,
        title,
        content,
        relatedUrl: relatedUrlPayload,
        imageUrl: imageUrlPayload,
      });

      toast.success("Feedback submitted successfully");
      setIsSuccess(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit feedback");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-[#F6F8FB] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl flex flex-col gap-6">
        
        {/* HEADER CĂN GIỮA */}
        <header className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500">Learner feedback</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Share feedback with SkillSprint</h1>
          <p className="mt-2 text-sm text-slate-500">
            Send product issues, suggestions, or ideas directly to our team.
          </p>
        </header>

        {isSuccess ? (
          /* MÀN HÌNH THÔNG BÁO THÀNH CÔNG */
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 mb-4">
              <CheckCircle2 size={36} />
            </div>
            <h2 className="text-xl font-black text-slate-900">Thank You!</h2>
            <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto leading-6">
              Your feedback has been successfully submitted. Our product team will review your report shortly to improve SkillSprint.
            </p>
            <div className="mt-8 border-t border-slate-100 pt-6">
              <button
                type="button"
                onClick={handleCreateNewFeedback}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600"
              >
                <PlusCircle size={16} />
                Submit another feedback
              </button>
            </div>
          </div>
        ) : (
          /* FORM NHẬP PHẢN HỒI CHÍNH */
          <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-4 border-b border-slate-100 pb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <Send size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">New feedback</h2>
                <p className="text-xs text-slate-500">Please provide detailed information below.</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* LOẠI FEEDBACK */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Feedback Type</label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {FEEDBACK_TYPES.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setType(item.value)}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                        type === item.value
                          ? "border-orange-300 bg-orange-50 text-orange-700"
                          : "border-slate-200 bg-white text-slate-700 hover:border-orange-200 hover:bg-orange-50/40"
                      }`}
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">{item.icon}</span>
                      <span className="min-w-0">
                        <span className="block text-sm font-extrabold">{item.label}</span>
                        <span className="block text-xs text-slate-400 truncate">{item.description}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* TIÊU ĐỀ */}
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">Title</label>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={255}
                  required
                  placeholder="Short summary of your feedback"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
                />
              </div>

              {/* CHI TIẾT */}
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">Details</label>
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  maxLength={5000}
                  required
                  rows={6}
                  placeholder="Describe what happened, what you expected, or what you would like improved."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
                />
                <p className="mt-1 text-right text-xs text-slate-400">{content.length}/5000</p>
              </div>

              {/* Ô INPUT GỘP THÔNG MINH BIẾN THIÊN */}
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">Related Link / Screenshot URL (Optional)</label>
                <div className="relative">
                  <LinkIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    value={combinedUrl}
                    onChange={(event) => setCombinedUrl(event.target.value)}
                    placeholder="Paste website link or image link (ending in .png, .jpg...)"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                {/* Chỉ hiển thị vùng preview này nếu hệ thống nhận diện được chuỗi nhập vào là LINK ẢNH */}
                {imagePreviewSrc && (
                  <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm animate-in fade-in duration-200">
                    <div className="bg-slate-50 px-4 py-1.5 text-[11px] font-bold text-slate-400 border-b border-slate-100">
                      Screenshot Preview
                    </div>
                    <img src={imagePreviewSrc} alt="Feedback attachment preview" className="max-h-60 w-full object-contain bg-slate-50/30 p-2" />
                  </div>
                )}
              </div>

              {/* BUTTON SUBMIT */}
              <button
                type="submit"
                disabled={submitting || !title.trim() || !content.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />}
                {submitting ? "Submitting..." : "Submit feedback"}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
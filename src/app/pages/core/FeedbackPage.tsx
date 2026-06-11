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
  { value: FeedbackType.BUG,         label: "Lỗi kỹ thuật", description: "Hệ thống gặp sự cố, tính năng không hoạt động",    icon: <Bug size={16} /> },
  { value: FeedbackType.IMPROVEMENT, label: "Cải tiến",     description: "Đề xuất cải tiến trải nghiệm sản phẩm",           icon: <MessageSquare size={16} /> },
  { value: FeedbackType.QUESTION,    label: "Câu hỏi",      description: "Thắc mắc cần đội ngũ giải đáp",                  icon: <AlertCircle size={16} /> },
  { value: FeedbackType.OTHER,       label: "Khác",          description: "Các ý kiến đóng góp khác",                       icon: <AlertCircle size={16} /> },
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

      toast.success("Phản hồi đã được gửi thành công!");
      setIsSuccess(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể gửi phản hồi. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-[#F6F8FB] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl flex flex-col gap-6">
        
        {/* HEADER CĂN GIỮA */}
        <header className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500">Phản hồi từ người học</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Chia sẻ ý kiến của bạn với SkillSprint</h1>
          <p className="mt-2 text-sm text-slate-500">
            Gửi các vấn đề, góp ý hoặc ý tưởng phát triển sản phẩm trực tiếp đến đội ngũ của chúng tôi.
          </p>
        </header>

        {isSuccess ? (
          /* MÀN HÌNH THÔNG BÁO THÀNH CÔNG */
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 mb-4">
              <CheckCircle2 size={36} />
            </div>
            <h2 className="text-xl font-black text-slate-900">Cảm ơn bạn!</h2>
            <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto leading-6">
              Phản hồi của bạn đã được gửi thành công. Đội ngũ sản phẩm sẽ xem xét và cải tiến SkillSprint dựa trên ý kiến của bạn.
            </p>
            <div className="mt-8 border-t border-slate-100 pt-6">
              <button
                type="button"
                onClick={handleCreateNewFeedback}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600"
              >
                <PlusCircle size={16} />
                Gửi phản hồi khác
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
                <h2 className="text-lg font-black text-slate-900">Phản hồi mới</h2>
                <p className="text-xs text-slate-500">Vui lòng cung cấp thông tin chi tiết ở bên dưới.</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* LOẠI FEEDBACK */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Loại phản hồi</label>
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
                <label className="mb-1.5 block text-sm font-bold text-slate-700">Tiêu đề</label>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={255}
                  required
                  placeholder="Tóm tắt ngắn gọn ý kiến phản hồi của bạn"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
                />
              </div>

              {/* CHI TIẾT */}
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">Chi tiết nội dung</label>
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  maxLength={5000}
                  required
                  rows={6}
                  placeholder="Mô tả chi tiết những gì đã xảy ra, kết quả bạn mong đợi hoặc những điểm bạn muốn hệ thống cải tiến kỹ năng..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
                />
                <p className="mt-1 text-right text-xs text-slate-400">{content.length}/5000</p>
              </div>

              {/* Ô INPUT GỘP THÔNG MINH BIẾN THIÊN */}
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">Liên kết liên quan / URL Ảnh chụp màn hình (Không bắt buộc)</label>
                <div className="relative">
                  <LinkIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    value={combinedUrl}
                    onChange={(event) => setCombinedUrl(event.target.value)}
                    placeholder="Dán liên kết website hoặc link ảnh minh hoạ (đuôi tệp dạng .png, .jpg...)"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                {/* Chỉ hiển thị vùng preview này nếu hệ thống nhận diện được chuỗi nhập vào là LINK ẢNH */}
                {imagePreviewSrc && (
                  <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm animate-in fade-in duration-200">
                    <div className="bg-slate-50 px-4 py-1.5 text-[11px] font-bold text-slate-400 border-b border-slate-100 uppercase tracking-wide">
                      Xem trước ảnh đính kèm
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
                {submitting ? "Đang gửi..." : "Gửi phản hồi"}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
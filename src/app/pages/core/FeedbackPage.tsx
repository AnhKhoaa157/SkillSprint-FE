import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Bug,
  ImagePlus,
  Link as LinkIcon,
  LoaderCircle,
  MessageSquare,
  Send,
  CheckCircle2,
  PlusCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  createFeedback,
  uploadFeedbackImage,
  FeedbackType,
} from "../../../api/utilities/feedbackService";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const FEEDBACK_TYPES: Array<{ value: FeedbackType; label: string; description: string; icon: React.ReactNode }> = [
  { value: FeedbackType.BUG,         label: "Lỗi kỹ thuật", description: "Hệ thống gặp sự cố, tính năng không hoạt động",    icon: <Bug size={16} /> },
  { value: FeedbackType.IMPROVEMENT, label: "Cải tiến",     description: "Đề xuất cải tiến trải nghiệm sản phẩm",           icon: <MessageSquare size={16} /> },
  { value: FeedbackType.QUESTION,    label: "Câu hỏi",      description: "Thắc mắc cần đội ngũ giải đáp",                  icon: <AlertCircle size={16} /> },
  { value: FeedbackType.OTHER,       label: "Khác",          description: "Các ý kiến đóng góp khác",                       icon: <AlertCircle size={16} /> },
];

export default function FeedbackPage() {
  const [type, setType] = useState<FeedbackType>(FeedbackType.IMPROVEMENT);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [relatedUrl, setRelatedUrl] = useState(""); // Link tham khảo (không bắt buộc)
  const [imageFile, setImageFile] = useState<File | null>(null); // Ảnh chọn từ máy
  const [imagePreview, setImagePreview] = useState<string | null>(null); // object URL để preview
  const [uploading, setUploading] = useState(false); // Trạng thái đang PUT ảnh lên S3
  const [submitting, setSubmitting] = useState(false); // Trạng thái đang gửi feedback
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tạo/thu hồi object URL preview khi đổi file để tránh rò rỉ bộ nhớ.
  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Ảnh chỉ hỗ trợ định dạng JPG, PNG, WEBP hoặc GIF.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error("Ảnh vượt quá dung lượng cho phép (tối đa 5MB).");
      event.target.value = "";
      return;
    }
    setImageFile(file);
  }

  function clearImage() {
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function resetForm() {
    setType(FeedbackType.IMPROVEMENT);
    setTitle("");
    setContent("");
    setRelatedUrl("");
    clearImage();
  }

  function handleCreateNewFeedback() {
    resetForm();
    setIsSuccess(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    try {
      // Bước 1: nếu có ảnh, upload trực tiếp lên S3 và lấy về objectKey.
      let imageObjectKey: string | null = null;
      if (imageFile) {
        setUploading(true);
        try {
          imageObjectKey = await uploadFeedbackImage(imageFile);
        } catch (uploadError) {
          toast.error(
            uploadError instanceof Error ? uploadError.message : "Tải ảnh lên thất bại. Vui lòng thử lại.",
          );
          return; // Dừng lại, không gửi feedback nếu ảnh lỗi.
        } finally {
          setUploading(false);
        }
      }

      // Bước 2: gửi feedback kèm tham chiếu imageObjectKey.
      await createFeedback({
        type,
        title,
        content,
        relatedUrl: relatedUrl.trim() || null,
        imageObjectKey,
      });

      toast.success("Phản hồi đã được gửi thành công!");
      setIsSuccess(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể gửi phản hồi. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  const isBusy = submitting || uploading;

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

              {/* LIÊN KẾT THAM KHẢO (Không bắt buộc) */}
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">Liên kết liên quan (Không bắt buộc)</label>
                <div className="relative">
                  <LinkIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    value={relatedUrl}
                    onChange={(event) => setRelatedUrl(event.target.value)}
                    placeholder="Dán liên kết trang/màn hình gặp vấn đề (nếu có)"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
                  />
                </div>
              </div>

              {/* CHỌN ẢNH TỪ MÁY (Không bắt buộc) */}
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">Ảnh đính kèm (Không bắt buộc)</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {!imageFile ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-slate-500 transition hover:border-orange-300 hover:bg-orange-50/40 hover:text-orange-600"
                  >
                    <ImagePlus size={24} />
                    <span className="text-sm font-bold">Chọn ảnh từ thiết bị của bạn</span>
                    <span className="text-xs text-slate-400">JPG, PNG, WEBP hoặc GIF · tối đa 5MB</span>
                  </button>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm animate-in fade-in duration-200">
                    <div className="flex items-center justify-between bg-slate-50 px-4 py-1.5 border-b border-slate-100">
                      <span className="truncate text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        {uploading ? "Đang tải ảnh lên..." : "Xem trước ảnh đính kèm"}
                      </span>
                      <button
                        type="button"
                        onClick={clearImage}
                        disabled={isBusy}
                        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold text-slate-400 transition hover:bg-slate-200 hover:text-slate-600 disabled:opacity-50"
                      >
                        <X size={12} /> Xóa
                      </button>
                    </div>
                    {imagePreview && (
                      <div className="relative">
                        <img src={imagePreview} alt="Feedback attachment preview" className="max-h-60 w-full object-contain bg-slate-50/30 p-2" />
                        {uploading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm">
                            <LoaderCircle size={28} className="animate-spin text-orange-500" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* BUTTON SUBMIT */}
              <button
                type="submit"
                disabled={isBusy || !title.trim() || !content.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isBusy ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />}
                {uploading ? "Đang tải ảnh..." : submitting ? "Đang gửi..." : "Gửi phản hồi"}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
import { useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  FileText,
  LayoutGrid,
  LoaderCircle,
  Sparkles,
} from "lucide-react";
import workspaceService from "../../../api/utilities/workspaceService";

const MAX_WORKSPACE_DESCRIPTION_LENGTH = 1000;

export default function WorkspacesNew() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    if (!trimmedName) {
      setNameError("Vui lòng nhập tên workspace");
      return;
    }

    try {
      setIsSubmitting(true);
      const workspace = await workspaceService.createWorkspace({
        name: trimmedName,
        ...(trimmedDescription ? { description: trimmedDescription } : {}),
      });
      window.dispatchEvent(new CustomEvent("workspace_created", { detail: { workspaceId: workspace.workspaceId } }));
      toast.success("Tạo workspace thành công");
      navigate(`/app/workspaces/${workspace.workspaceId}`, { state: { openOnboarding: true } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo workspace");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.12)]"
      >
        <header className="border-b border-orange-100 bg-gradient-to-r from-[#FFF7ED] via-white to-[#FFFBF5] px-5 py-6 sm:px-8 sm:py-8">
          <button
            type="button"
            onClick={() => navigate("/app/workspaces")}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-600 transition hover:bg-white hover:text-[#FF6B00] focus:outline-none focus:ring-4 focus:ring-orange-100"
          >
            <ArrowLeft className="h-4 w-4" />Quay lại Workspaces
          </button>
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF8C37] to-[#FF6B00] text-white shadow-lg shadow-orange-500/20">
              <LayoutGrid className="h-7 w-7" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white/80 px-3 py-1 text-xs font-bold text-[#D95800]">
                <Sparkles className="h-3.5 w-3.5" />Tạo workspace đầy đủ
              </div>
              <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Bắt đầu một không gian học tập có định hướng</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Đặt tên và mô tả mục tiêu để dễ quản lý tài liệu, lộ trình và tiến độ học tập của bạn.</p>
            </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
          <form onSubmit={handleSubmit} className="space-y-6 p-5 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-orange-100 bg-orange-50 text-[#FF6B00]">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Thông tin workspace</h2>
                <p className="text-sm text-slate-500">Bạn có thể cập nhật tên hoặc mô tả sau này.</p>
              </div>
            </div>

            <label className="block text-sm font-bold text-slate-900">
              Tên workspace <span className="text-rose-500">*</span>
              <input
                autoFocus
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setNameError(null);
                }}
                placeholder="Ví dụ: React Interview Prep"
                aria-invalid={Boolean(nameError)}
                aria-describedby={nameError ? "workspace-name-error" : undefined}
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#FF7E21]/50 focus:ring-4 focus:ring-[#FFF4EB]"
              />
            </label>
            {nameError && <p id="workspace-name-error" className="-mt-3 text-sm font-medium text-rose-600">{nameError}</p>}

            <label className="block text-sm font-bold text-slate-900">
              <span className="flex flex-wrap items-center justify-between gap-2">
                <span>Mô tả mục tiêu học tập <span className="font-medium text-slate-400">(không bắt buộc)</span></span>
                <span className="text-xs font-semibold tabular-nums text-slate-400" aria-live="polite">{description.length}/{MAX_WORKSPACE_DESCRIPTION_LENGTH}</span>
              </span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={MAX_WORKSPACE_DESCRIPTION_LENGTH}
                rows={7}
                placeholder="Ví dụ: Ôn React để phỏng vấn frontend trong 6 tuần, tập trung vào hooks, TypeScript và thực hành dự án nhỏ."
                aria-describedby="workspace-description-help"
                className="mt-2 min-h-40 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-[#FF7E21]/50 focus:ring-4 focus:ring-[#FFF4EB]"
              />
              <span id="workspace-description-help" className="mt-2 block text-xs font-medium leading-5 text-slate-500">Mô tả ngắn chủ đề, mục tiêu hoặc phạm vi để workspace rõ ràng ngay từ đầu.</span>
            </label>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => navigate("/app/workspaces")}
                disabled={isSubmitting}
                className="min-h-12 rounded-2xl px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF8C37] to-[#FF6B00] px-5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:shadow-xl hover:shadow-orange-500/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                {isSubmitting ? "Đang tạo workspace..." : "Tạo workspace"}
              </button>
            </div>
          </form>

          <aside className="border-t border-slate-200 bg-slate-50 p-5 sm:p-8 lg:border-l lg:border-t-0">
            <div className="rounded-3xl border border-orange-100 bg-gradient-to-br from-[#FFF7ED] to-white p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#FF6B00] shadow-sm"><BookOpenCheck className="h-5 w-5" /></div>
              <h2 className="mt-4 text-base font-extrabold text-slate-900">Mẹo viết mô tả</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Một mô tả hữu ích thường có ba ý chính:</p>
              <ul className="mt-4 space-y-3 text-sm leading-5 text-slate-600">
                <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />Chủ đề hoặc kỹ năng cần học.</li>
                <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />Kết quả bạn muốn đạt được.</li>
                <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />Thời gian hoặc bối cảnh nếu có.</li>
              </ul>
            </div>
          </aside>
        </div>
      </motion.div>
    </div>
  );
}

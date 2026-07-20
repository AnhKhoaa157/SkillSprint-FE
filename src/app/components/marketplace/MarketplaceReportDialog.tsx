import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Paperclip, ShieldAlert, X } from "lucide-react";
import marketplaceService from "../../../api/marketplace/marketplaceService";
import type {
  MarketplaceReportCategory,
  MarketplaceReportTargetType,
} from "../../../api/marketplace/marketplaceTypes";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

export interface MarketplaceReportTarget {
  packVersionId: string;
  targetType: MarketplaceReportTargetType;
  targetRef?: string | null;
  /** Human label for the locked target, e.g. "Câu hỏi 3" or the pack title. */
  label: string;
}

const CATEGORY_LABELS: Record<MarketplaceReportCategory, string> = {
  INCORRECT_ANSWER: "Đáp án sai",
  AMBIGUOUS: "Câu hỏi mơ hồ",
  BROKEN: "Nội dung lỗi / hỏng",
  DUPLICATE: "Trùng lặp",
  MISLEADING: "Gây hiểu nhầm",
  COPYRIGHT: "Vi phạm bản quyền",
  INAPPROPRIATE: "Nội dung không phù hợp",
  OTHER: "Khác",
};

const TARGET_TYPE_LABELS: Record<MarketplaceReportTargetType, string> = {
  VERSION: "Phiên bản Quiz Pack",
  CHAPTER: "Chương",
  QUESTION: "Câu hỏi",
  CREATOR: "Người tạo",
  REVIEW: "Đánh giá",
};

const MAX_DESCRIPTION = 2000;
const errorText = (error: unknown) => (error instanceof Error ? error.message : "Đã có lỗi xảy ra. Vui lòng thử lại.");
function statusOf(error: unknown): number | undefined {
  if (typeof error === "object" && error !== null && "status" in error && typeof (error as { status: unknown }).status === "number") {
    return (error as { status: number }).status;
  }
  return undefined;
}

export function MarketplaceReportDialog({
  open,
  onOpenChange,
  target,
  onSubmitted,
  timerNote,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: MarketplaceReportTarget;
  onSubmitted?: () => void;
  /** Shown when opened from a timed surface (e.g. Ranked) to reassure the timer keeps running. */
  timerNote?: string;
}) {
  const [category, setCategory] = useState<MarketplaceReportCategory | "">("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) {
      setCategory("");
      setDescription("");
      setFile(null);
      setPhase("idle");
      setError(null);
      setConflict(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [open]);

  const submit = async () => {
    if (!category) return;
    setPhase("submitting");
    setError(null);
    setConflict(false);
    try {
      let evidenceObjectKey: string | undefined;
      if (file) {
        evidenceObjectKey = await marketplaceService.uploadReportEvidence(file);
      }
      await marketplaceService.createContentReport({
        packVersionId: target.packVersionId,
        targetType: target.targetType,
        targetRef: target.targetRef ?? undefined,
        category,
        description: description.trim() || undefined,
        evidenceObjectKey,
      });
      setPhase("success");
      onSubmitted?.();
    } catch (submitError) {
      setPhase("idle");
      if (statusOf(submitError) === 409) {
        setConflict(true);
      } else {
        setError(errorText(submitError));
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <ShieldAlert className="h-5 w-5 text-[#FF6B00]" aria-hidden="true" />
            Báo cáo nội dung
          </DialogTitle>
          <DialogDescription>
            Gửi báo cáo về nội dung hoặc chất lượng. Báo cáo được xử lý bởi đội ngũ kiểm duyệt và
            không tự động thay đổi Quiz Pack.
          </DialogDescription>
        </DialogHeader>

        {phase === "success" ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center" role="status" aria-live="polite">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" aria-hidden="true" />
            <p className="text-sm font-bold text-slate-900">Đã gửi báo cáo</p>
            <p className="max-w-sm text-sm text-slate-500">Cảm ơn bạn. Đội ngũ kiểm duyệt sẽ xem xét báo cáo này.</p>
            <DialogClose className="mt-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700">
              Đóng
            </DialogClose>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Nội dung báo cáo</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {TARGET_TYPE_LABELS[target.targetType]} · {target.label}
              </p>
            </div>

            {timerNote && (
              <p className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-xs font-semibold leading-5 text-sky-800">
                {timerNote}
              </p>
            )}

            <fieldset>
              <legend className="text-sm font-bold text-slate-700">
                Lý do <span className="text-rose-600">*</span>
              </legend>
              <RadioGroup
                className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2"
                value={category}
                onValueChange={value => setCategory(value as MarketplaceReportCategory)}
                aria-label="Lý do báo cáo"
              >
                {(Object.keys(CATEGORY_LABELS) as MarketplaceReportCategory[]).map(value => (
                  <label
                    key={value}
                    className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-orange-200 hover:bg-orange-50/40 has-[:checked]:border-[#FF6B00] has-[:checked]:bg-orange-50"
                  >
                    <RadioGroupItem value={value} />
                    {CATEGORY_LABELS[value]}
                  </label>
                ))}
              </RadioGroup>
            </fieldset>

            <label className="block text-sm font-bold text-slate-700">
              Mô tả chi tiết
              <textarea
                value={description}
                maxLength={MAX_DESCRIPTION}
                onChange={event => setDescription(event.target.value)}
                placeholder="Mô tả vấn đề bạn gặp (không bắt buộc)"
                className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal outline-none focus:border-[#FF6B00]"
              />
              <span className="mt-1 block text-right text-xs font-normal text-slate-400">
                {description.length}/{MAX_DESCRIPTION}
              </span>
            </label>

            <div>
              <p className="text-sm font-bold text-slate-700">Ảnh minh chứng (không bắt buộc)</p>
              <div className="mt-2 flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  id="report-evidence"
                  onChange={event => setFile(event.target.files?.[0] ?? null)}
                />
                <label
                  htmlFor="report-evidence"
                  className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-orange-200 hover:bg-orange-50/40"
                >
                  <Paperclip className="h-4 w-4" aria-hidden="true" />
                  Chọn ảnh
                </label>
                {file && (
                  <span className="inline-flex items-center gap-1.5 truncate text-xs text-slate-500">
                    <span className="max-w-[12rem] truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="rounded p-0.5 text-slate-400 hover:text-rose-600"
                      aria-label="Bỏ ảnh minh chứng"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                )}
              </div>
            </div>

            {conflict && (
              <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-900" role="alert">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                Bạn đã có một báo cáo đang xử lý cho nội dung này với cùng lý do.
              </p>
            )}
            {error && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold leading-5 text-rose-800" role="alert">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-1">
              <DialogClose className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
                Hủy
              </DialogClose>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={!category || phase === "submitting"}
                className="inline-flex min-w-28 items-center justify-center gap-2 rounded-xl bg-[#FF6B00] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#e85f00] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {phase === "submitting" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Gửi báo cáo"}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** A small, accessible trigger button that opens the report dialog for a given target. */
export function MarketplaceReportButton({
  target,
  timerNote,
  className,
  label = "Báo cáo",
  onOpenChange,
}: {
  target: MarketplaceReportTarget;
  timerNote?: string;
  className?: string;
  label?: string;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const setState = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };
  return (
    <>
      <button
        type="button"
        onClick={() => setState(true)}
        className={
          className ??
          "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
        }
      >
        <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </button>
      <MarketplaceReportDialog open={open} onOpenChange={setState} target={target} timerNote={timerNote} />
    </>
  );
}

export default MarketplaceReportDialog;

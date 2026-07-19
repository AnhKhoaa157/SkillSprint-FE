import { AlertTriangle, CheckCircle2, CircleDashed, LoaderCircle, RefreshCw, ScanSearch, ShieldAlert, ShieldCheck } from "lucide-react";
import type { MarketplaceQualityJob, MarketplaceQualityJobStatus } from "../../../api/marketplace";

const statusContent: Record<MarketplaceQualityJobStatus, { label: string; className: string }> = {
  QUEUED: { label: "Đang chờ kiểm định", className: "border-sky-200 bg-sky-50 text-sky-700" },
  RUNNING: { label: "Đang kiểm định", className: "border-sky-200 bg-sky-50 text-sky-700" },
  PASSED: { label: "Đã đạt kiểm định", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  FAILED: { label: "Chưa đạt kiểm định", className: "border-amber-200 bg-amber-50 text-amber-800" },
  ERROR: { label: "Kiểm định gặp lỗi", className: "border-rose-200 bg-rose-50 text-rose-700" },
};

export function isQualityReady(status?: MarketplaceQualityJobStatus | null, currentSnapshot?: boolean): boolean {
  return status === "PASSED" && currentSnapshot === true;
}

export function isCreatorReviewReady(validationScore: number, status?: MarketplaceQualityJobStatus | null, currentSnapshot?: boolean): boolean {
  return validationScore >= 90 && isQualityReady(status, currentSnapshot);
}

export function QualityStatusBadge({ status, currentSnapshot = false }: { status?: MarketplaceQualityJobStatus | null; currentSnapshot?: boolean }) {
  if (!status) {
    return <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600"><CircleDashed className="h-3.5 w-3.5" />Chưa kiểm định</span>;
  }

  if (status === "PASSED" && !currentSnapshot) {
    return <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800"><AlertTriangle className="h-3.5 w-3.5" />Cần kiểm định lại</span>;
  }

  const meta = statusContent[status];
  const Icon = status === "PASSED" ? ShieldCheck : status === "FAILED" || status === "ERROR" ? ShieldAlert : LoaderCircle;
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${meta.className}`}><Icon className={`h-3.5 w-3.5 ${status === "QUEUED" || status === "RUNNING" ? "animate-spin" : ""}`} />{meta.label}</span>;
}

interface CreatorQualityPanelProps {
  job: MarketplaceQualityJob | null;
  loading: boolean;
  starting: boolean;
  active: boolean;
  error: string | null;
  onStart: () => void;
  onRetry: () => void;
}

export function CreatorQualityPanel({ job, loading, starting, active, error, onStart, onRetry }: CreatorQualityPanelProps) {
  const currentPass = isQualityReady(job?.status, job?.currentSnapshot);
  const issues = job?.report?.issues ?? [];

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white text-left shadow-sm" aria-labelledby="quality-panel-title" aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
        <div className="flex gap-3">
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${currentPass ? "bg-emerald-100 text-emerald-700" : "bg-orange-50 text-[#FF6B00]"}`}>
            {active || loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : currentPass ? <ShieldCheck className="h-5 w-5" /> : <ScanSearch className="h-5 w-5" />}
          </span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#FF6B00]">Quality gate</p>
            <h2 id="quality-panel-title" className="mt-1 text-lg font-black text-slate-950">Kiểm định chất lượng nội dung</h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">Hệ thống kiểm tra cấu trúc, đáp án, nội dung trùng lặp và bằng chứng nguồn trên đúng snapshot hiện tại.</p>
          </div>
        </div>
        <QualityStatusBadge status={job?.status} currentSnapshot={job?.currentSnapshot} />
      </div>

      <div className="px-5 py-5 sm:px-6">
        {loading ? (
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" />Đang tải kết quả kiểm định...</div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <p className="font-bold">Không thể tải trạng thái kiểm định.</p>
            <p className="mt-1 leading-5">{error}</p>
            <button type="button" onClick={onRetry} className="mt-3 inline-flex items-center gap-2 font-black text-rose-700"><RefreshCw className="h-4 w-4" />Thử tải lại</button>
          </div>
        ) : !job ? (
          <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-orange-200 bg-orange-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-slate-600">Chưa có kết quả cho phiên bản này. Chạy kiểm định trước khi gửi Admin duyệt.</p>
            <button type="button" onClick={onStart} disabled={starting} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#FF6B00] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
              {starting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}Chạy kiểm định
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-500">Điểm chất lượng</p><p className={`mt-1 text-2xl font-black ${currentPass ? "text-emerald-700" : "text-slate-900"}`}>{job.score ?? "—"}<span className="text-sm text-slate-400">/100</span></p></div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-500">Lỗi chặn</p><p className="mt-1 text-2xl font-black text-slate-900">{job.report?.blockingIssueCount ?? "—"}</p></div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-500">Snapshot</p><p className={`mt-2 inline-flex items-center gap-1.5 text-sm font-black ${job.currentSnapshot ? "text-emerald-700" : "text-amber-700"}`}>{job.currentSnapshot ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}{job.currentSnapshot ? "Đang dùng" : "Đã thay đổi"}</p></div>
            </div>

            {active && <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-700"><LoaderCircle className="h-4 w-4 animate-spin" />Hệ thống đang xử lý. Trang sẽ tự cập nhật kết quả.</p>}

            {!active && !currentPass && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><p className="font-bold text-amber-950">Cần xử lý trước khi gửi duyệt</p><p className="mt-1 text-sm leading-5 text-amber-900">{job.currentSnapshot ? "Sửa các lỗi bên dưới rồi làm mới snapshot và chạy lại." : "Snapshot đã thay đổi; hãy chạy kiểm định lại."}</p></div>
                  <button type="button" onClick={onStart} disabled={starting} className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm font-black text-amber-800 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${starting ? "animate-spin" : ""}`} />Chạy lại</button>
                </div>
                {issues.length > 0 && <ul className="mt-4 space-y-2">{issues.slice(0, 5).map((issue, index) => <li key={`${issue.code}-${issue.questionId ?? index}`} className="rounded-xl bg-white/80 px-3 py-2 text-sm leading-5 text-slate-700"><span className="font-bold text-slate-900">{issue.chapterSequenceNo ? `Chương ${issue.chapterSequenceNo}: ` : ""}</span>{issue.message}</li>)}</ul>}
                {issues.length > 5 && <p className="mt-2 text-xs font-semibold text-amber-800">Còn {issues.length - 5} lỗi khác trong báo cáo.</p>}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

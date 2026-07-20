import { AlertTriangle, CheckCircle2, CircleDashed, Clock3, FileWarning, ShieldCheck } from "lucide-react";
import type { MarketplaceQualityIssue, MarketplaceQualityJob } from "../../../api/marketplace";
import { isQualityReady, QualityStatusBadge } from "./MarketplaceQualityStatus";

const formatDate = (value?: string | null) => value
  ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value))
  : "—";

function issueLocation(issue: MarketplaceQualityIssue): string {
  if (issue.chapterSequenceNo && issue.questionId) return `Chương ${issue.chapterSequenceNo} · ID câu ${issue.questionId.slice(0, 8)}`;
  if (issue.chapterSequenceNo) return `Chương ${issue.chapterSequenceNo}`;
  return "Toàn bộ phiên bản";
}

export function AdminQualityReviewPanel({ latest, history = [], canQueue = false, queuing = false, onQueue }: { latest?: MarketplaceQualityJob | null; history?: MarketplaceQualityJob[]; canQueue?: boolean; queuing?: boolean; onQueue?: () => void }) {
  const currentPass = isQualityReady(latest?.status, latest?.currentSnapshot);
  const active = latest?.status === "QUEUED" || latest?.status === "RUNNING";
  const issues = latest?.report?.issues ?? [];

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-white bg-white/95 shadow-[0_16px_45px_rgba(71,50,35,0.06)]" aria-labelledby="admin-quality-title">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${currentPass ? "bg-emerald-100 text-emerald-700" : "bg-orange-50 text-[#FF6B00]"}`}>
            {currentPass ? <ShieldCheck className="h-5 w-5" /> : <FileWarning className="h-5 w-5" />}
          </span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#FF6B00]">Quality audit</p>
            <h2 id="admin-quality-title" className="mt-1 text-xl font-black tracking-[-0.02em] text-slate-950">Kiểm định trước xuất bản</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Kết quả được gắn với đúng snapshot phiên bản. Chỉ kết quả đạt và còn hiện hành mới mở khóa xuất bản.</p>
          </div>
        </div>
        <QualityStatusBadge status={latest?.status} currentSnapshot={latest?.currentSnapshot} />
      </header>

      <div className="p-5 sm:p-6">
        {!latest ? (
          <div className="flex items-start gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            <CircleDashed className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
            <div>Creator chưa chạy kiểm định cho phiên bản này. Admin vẫn có thể từ chối và ghi rõ yêu cầu chỉnh sửa, nhưng chưa thể xuất bản.{canQueue && <button type="button" onClick={onQueue} disabled={queuing} className="mt-3 inline-flex min-h-10 items-center rounded-xl bg-slate-950 px-4 text-xs font-black text-white transition hover:bg-slate-700 disabled:opacity-50">{queuing ? "Đang xếp lịch..." : "Chạy kiểm định cho pack cũ"}</button>}</div>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-500">Điểm chất lượng</p><p className="mt-1 text-2xl font-black text-slate-950">{latest.score ?? "—"}<span className="text-sm text-slate-400">/100</span></p></div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-500">Lỗi chặn</p><p className="mt-1 text-2xl font-black text-slate-950">{latest.report?.blockingIssueCount ?? "—"}</p></div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-500">Snapshot</p><p className={`mt-2 inline-flex items-center gap-1.5 text-sm font-black ${latest.currentSnapshot ? "text-emerald-700" : "text-amber-700"}`}>{latest.currentSnapshot ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}{latest.currentSnapshot ? "Hiện hành" : "Đã thay đổi"}</p></div>
            </div>

            {!currentPass && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><p className="font-black">Chưa đủ điều kiện xuất bản</p><p className="mt-1">{latest.currentSnapshot ? "Creator cần xử lý lỗi và chạy kiểm định lại." : "Nội dung đã thay đổi sau lần kiểm định gần nhất; cần kiểm định lại snapshot hiện tại."}</p></div>}

            {canQueue && !active && !currentPass && <button type="button" onClick={onQueue} disabled={queuing} className="mt-4 inline-flex min-h-11 items-center rounded-xl border border-orange-200 bg-white px-4 text-sm font-black text-[#FF6B00] transition hover:bg-orange-50 disabled:opacity-50">{queuing ? "Đang xếp lịch..." : "Chạy lại kiểm định"}</button>}

            {issues.length > 0 && <div className="mt-5"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-black text-slate-900">Vấn đề cần kiểm tra</h3><span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-800">{issues.length} vấn đề</span></div><ul className="mt-3 space-y-2">{issues.map((issue, index) => <li key={`${issue.code}-${issue.questionId ?? index}`} className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3"><div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.1em]"><span className="text-amber-700">{issue.severity}</span><span className="text-slate-300">•</span><span className="text-slate-500">{issue.code}</span><span className="text-slate-300">•</span><span className="text-slate-500">{issueLocation(issue)}</span></div><p className="mt-1.5 text-sm leading-6 text-slate-700">{issue.message}</p></li>)}</ul></div>}
          </>
        )}

        {history.length > 0 && <details className="group mt-5 rounded-2xl border border-slate-200 bg-white"><summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-black text-slate-800"><span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-slate-400" />Lịch sử kiểm định ({history.length})</span><span className="text-xs text-slate-400 group-open:hidden">Mở</span></summary><ol className="border-t border-slate-100 px-4 py-3">{history.map(job => <li key={job.jobId} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-0"><div><QualityStatusBadge status={job.status} currentSnapshot={job.currentSnapshot} /><p className="mt-1.5 text-xs text-slate-400">{formatDate(job.completedAt ?? job.createdAt)}</p></div><p className="text-sm font-black text-slate-800">{job.score ?? "—"}/100</p></li>)}</ol></details>}
      </div>
    </section>
  );
}

import { AlertTriangle, CircleDashed, LoaderCircle, ShieldAlert, ShieldCheck } from "lucide-react";
import type { MarketplaceQualityJobStatus } from "../../../api/marketplace";

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

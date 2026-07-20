import { useCallback, useEffect, useState } from "react";
import { CircleAlert, FileWarning, Loader2, RefreshCw, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import {
  getAdminMarketplaceReport,
  getAdminMarketplaceReports,
  updateAdminMarketplaceReportStatus,
} from "../../../api/admin/marketplaceReportAdminService";
import type {
  AdminMarketplaceReport,
  MarketplaceReportCategory,
  MarketplaceReportStatus,
  MarketplaceReportTargetType,
} from "../../../api/admin/marketplaceReportAdminTypes";

const date = (value?: string | null) =>
  value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";
const errorText = (error: unknown) => (error instanceof Error ? error.message : "Đã có lỗi xảy ra.");

const STATUS_LABELS: Record<MarketplaceReportStatus, string> = {
  OPEN: "Mới",
  IN_REVIEW: "Đang xem xét",
  RESOLVED: "Đã xử lý",
  DISMISSED: "Đã bỏ qua",
};
const CATEGORY_LABELS: Record<MarketplaceReportCategory, string> = {
  INCORRECT_ANSWER: "Đáp án sai",
  AMBIGUOUS: "Câu hỏi mơ hồ",
  BROKEN: "Nội dung lỗi",
  DUPLICATE: "Trùng lặp",
  MISLEADING: "Gây hiểu nhầm",
  COPYRIGHT: "Bản quyền",
  INAPPROPRIATE: "Không phù hợp",
  OTHER: "Khác",
};
const TARGET_LABELS: Record<MarketplaceReportTargetType, string> = {
  VERSION: "Phiên bản",
  CHAPTER: "Chương",
  QUESTION: "Câu hỏi",
  CREATOR: "Người tạo",
  REVIEW: "Đánh giá",
};

const STATUS_STYLE: Record<MarketplaceReportStatus, string> = {
  OPEN: "border-amber-200 bg-amber-50 text-amber-800",
  IN_REVIEW: "border-sky-200 bg-sky-50 text-sky-800",
  RESOLVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  DISMISSED: "border-slate-200 bg-slate-100 text-slate-600",
};

function StatusBadge({ status }: { status: MarketplaceReportStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLE[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

const STATUS_FILTERS: Array<{ value: MarketplaceReportStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "Tất cả" },
  { value: "OPEN", label: "Mới" },
  { value: "IN_REVIEW", label: "Đang xem xét" },
  { value: "RESOLVED", label: "Đã xử lý" },
  { value: "DISMISSED", label: "Đã bỏ qua" },
];

/** Actions the server allows from a given status. Terminal states offer none. */
function allowedTransitions(status: MarketplaceReportStatus): MarketplaceReportStatus[] {
  if (status === "OPEN") return ["IN_REVIEW", "RESOLVED", "DISMISSED"];
  if (status === "IN_REVIEW") return ["RESOLVED", "DISMISSED"];
  return [];
}

export default function MarketplaceReportsAdmin() {
  const [statusFilter, setStatusFilter] = useState<MarketplaceReportStatus | "ALL">("OPEN");
  const [reports, setReports] = useState<AdminMarketplaceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<AdminMarketplaceReport | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const page = await getAdminMarketplaceReports({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        size: 50,
      });
      setReports(page.items);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const openDetail = async (reportId: string) => {
    try {
      setSelected(await getAdminMarketplaceReport(reportId));
    } catch (error) {
      toast.error(errorText(error));
    }
  };

  return (
    <div className="relative isolate min-h-full overflow-hidden bg-[#F7F8FA] p-4 sm:p-7">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_8%_5%,rgba(255,237,223,0.9),transparent_28%),radial-gradient(circle_at_95%_11%,rgba(255,246,234,0.8),transparent_24%)]" />
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[2rem] border border-white bg-white/90 p-6 shadow-[0_20px_58px_rgba(71,50,35,0.07)] backdrop-blur-xl sm:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full border-[20px] border-orange-100/70" />
        <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#FF6B00]">
              <ShieldAlert className="h-3 w-3" />Marketplace reports
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-[-0.03em] text-slate-950 sm:text-3xl">Báo cáo nội dung</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Xem xét, lưu vết và xử lý báo cáo chất lượng từ người học đã sở hữu Quiz Pack.</p>
          </div>
          <button
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-orange-200 bg-white px-4 text-sm font-bold text-[#FF6B00] shadow-sm transition hover:bg-orange-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Làm mới
          </button>
        </div></div>

        <div className="mt-6 flex flex-wrap gap-2 rounded-[1.5rem] border border-white bg-white/80 p-2 shadow-[0_12px_36px_rgba(71,50,35,0.05)]">
          {STATUS_FILTERS.map(filter => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${statusFilter === filter.value ? "bg-white text-[#FF6B00] shadow-sm ring-1 ring-slate-200/70" : "text-slate-500 hover:bg-white/60 hover:text-slate-800"}`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <section className="mt-6 rounded-[1.75rem] border border-white bg-white/90 p-4 shadow-[0_16px_45px_rgba(71,50,35,0.06)] sm:p-5">
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}</div>
          ) : failed ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
              <CircleAlert className="mx-auto h-6 w-6 text-rose-600" />
              <p className="mt-2 text-sm font-bold text-rose-900">Không thể tải danh sách báo cáo</p>
              <button onClick={() => void load()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#FF6B00] px-4 py-2 text-sm font-bold text-white">
                <RefreshCw className="h-4 w-4" />Thử lại
              </button>
            </div>
          ) : reports.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <FileWarning className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-500">Không có báo cáo nào ở trạng thái này.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map(report => (
                <button
                  key={report.reportId}
                  type="button"
                  onClick={() => void openDetail(report.reportId)}
                  className="group flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-[0_8px_24px_rgba(15,23,42,0.025)] transition hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50/30 hover:shadow-[0_12px_28px_rgba(194,65,12,0.07)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100"
                >
                  <div className="min-w-0">
                    <p className="font-black text-slate-950">
                      {CATEGORY_LABELS[report.category]} · {TARGET_LABELS[report.targetType]}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {report.versionTitle || "—"}{report.versionNo != null ? ` · v${report.versionNo}` : ""} · {date(report.createdAt)}
                    </p>
                  </div>
                  <span className="flex items-center gap-3"><span className="hidden text-xs font-bold text-[#FF6B00] opacity-0 transition group-hover:opacity-100 sm:inline">Xem chi tiết</span><StatusBadge status={report.status} /></span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {selected && (
        <ReportDetailDrawer
          report={selected}
          onClose={() => setSelected(null)}
          onUpdated={async updated => {
            setSelected(updated);
            await load();
          }}
        />
      )}
    </div>
  );
}

function ReportDetailDrawer({
  report,
  onClose,
  onUpdated,
}: {
  report: AdminMarketplaceReport;
  onClose: () => void;
  onUpdated: (updated: AdminMarketplaceReport) => Promise<void>;
}) {
  const [note, setNote] = useState(report.resolutionNote ?? "");
  const [saving, setSaving] = useState<MarketplaceReportStatus | null>(null);
  const transitions = allowedTransitions(report.status);

  const apply = async (status: MarketplaceReportStatus) => {
    setSaving(status);
    try {
      const updated = await updateAdminMarketplaceReportStatus(report.reportId, {
        status,
        resolutionNote: note.trim() || undefined,
      });
      toast.success("Đã cập nhật báo cáo.");
      await onUpdated(updated);
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 sm:p-3" role="dialog" aria-modal="true" aria-label="Chi tiết báo cáo">
      <div className="h-full w-full max-w-lg overflow-y-auto rounded-none bg-white shadow-2xl sm:rounded-[1.75rem]">
        <div className="border-b border-orange-100 bg-[linear-gradient(120deg,#FFF8F1_0%,#FFFFFF_72%)] px-6 py-6"><div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#FF6B00]">Chi tiết báo cáo</p>
            <h2 className="mt-1 text-lg font-black text-slate-900">{CATEGORY_LABELS[report.category]}</h2>
          </div>
          <StatusBadge status={report.status} />
        </div></div>

        <div className="p-6"><dl className="space-y-3 text-sm">
          <Row label="Đối tượng" value={`${TARGET_LABELS[report.targetType]}${report.targetRef ? ` · ${report.targetRef}` : ""}`} />
          <Row label="Phiên bản" value={`${report.versionTitle || "—"}${report.versionNo != null ? ` · v${report.versionNo}` : ""}`} />
          <Row label="Người báo cáo" value={report.reporterName || report.reporterId || "—"} />
          <Row label="Thời điểm" value={date(report.createdAt)} />
          {report.reviewedByName && <Row label="Xử lý bởi" value={`${report.reviewedByName} · ${date(report.reviewedAt)}`} />}
        </dl>

        {report.description && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">{report.description}</div>
        )}

        {report.hasEvidence && report.evidenceUrl && (
          <a href={report.evidenceUrl} target="_blank" rel="noreferrer" className="mt-3 block overflow-hidden rounded-xl border border-slate-200">
            <img src={report.evidenceUrl} alt="Ảnh minh chứng báo cáo" className="max-h-64 w-full object-contain" />
          </a>
        )}

        <label className="mt-5 block text-sm font-bold text-slate-700">
          Ghi chú xử lý
          <textarea
            value={note}
            maxLength={2000}
            onChange={event => setNote(event.target.value)}
            placeholder="Ghi lại quyết định xử lý (không bắt buộc)"
            className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-normal leading-6 outline-none transition focus:border-[#FF6B00] focus:ring-4 focus:ring-orange-100"
          />
        </label>

        <div className="mt-6 flex flex-col gap-2">
          {transitions.length === 0 ? (
            <p className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-500">
              Báo cáo đã ở trạng thái cuối, không còn hành động khả dụng.
            </p>
          ) : (
            transitions.map(status => (
              <button
                key={status}
                type="button"
                onClick={() => void apply(status)}
                disabled={saving !== null}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 ${status === "RESOLVED" ? "bg-emerald-600 hover:bg-emerald-700" : status === "DISMISSED" ? "bg-slate-700 hover:bg-slate-800" : "bg-sky-600 hover:bg-sky-700"}`}
              >
                {saving === status ? <Loader2 className="h-4 w-4 animate-spin" /> : STATUS_LABELS[status]}
              </button>
            ))
          )}
          <button type="button" onClick={onClose} className="mt-1 inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
            Đóng
          </button>
        </div></div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="shrink-0 text-slate-400">{label}</dt>
      <dd className="text-right font-semibold text-slate-800">{value}</dd>
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  CircleAlert,
  Coins,
  Loader2,
  RefreshCw,
  Scale,
  Search,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  completeAdminDisputeRefund,
  decideAdminDispute,
  getAdminDispute,
  getAdminDisputes,
  getAdminVersionMetrics,
} from "../../../api/admin/marketplaceOpsAdminService";
import type {
  AdminMarketplaceDispute,
  MarketplaceDisputeReason,
  MarketplaceDisputeStatus,
  MarketplaceVersionMetrics,
} from "../../../api/admin/marketplaceOpsAdminTypes";

const date = (value?: string | null) =>
  value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";
const errorText = (error: unknown) => (error instanceof Error ? error.message : "Đã có lỗi xảy ra.");
const pct = (value: number) => `${(value * 100).toFixed(1)}%`;

const STATUS_LABELS: Record<MarketplaceDisputeStatus, string> = {
  OPEN: "Mới",
  UNDER_REVIEW: "Đang xem xét",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  REFUNDED: "Đã hoàn tiền",
};
const REASON_LABELS: Record<MarketplaceDisputeReason, string> = {
  NOT_AS_DESCRIBED: "Không đúng mô tả",
  POOR_QUALITY: "Chất lượng kém",
  TECHNICAL_ISSUE: "Lỗi kỹ thuật",
  ACCIDENTAL_PURCHASE: "Mua nhầm",
  OTHER: "Khác",
};
const STATUS_STYLE: Record<MarketplaceDisputeStatus, string> = {
  OPEN: "border-amber-200 bg-amber-50 text-amber-800",
  UNDER_REVIEW: "border-sky-200 bg-sky-50 text-sky-800",
  APPROVED: "border-indigo-200 bg-indigo-50 text-indigo-800",
  REJECTED: "border-rose-200 bg-rose-50 text-rose-700",
  REFUNDED: "border-emerald-200 bg-emerald-50 text-emerald-700",
};
const ACTION_LABELS: Record<string, string> = {
  REVIEW: "Chuyển xem xét",
  APPROVE: "Duyệt hoàn tiền",
  REJECT: "Từ chối",
  COMPLETE_REFUND: "Thực hiện hoàn tiền",
};

function StatusBadge({ status }: { status: MarketplaceDisputeStatus }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLE[status]}`}>{STATUS_LABELS[status]}</span>;
}

const STATUS_FILTERS: Array<{ value: MarketplaceDisputeStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "Tất cả" },
  { value: "OPEN", label: "Mới" },
  { value: "UNDER_REVIEW", label: "Đang xem xét" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "REFUNDED", label: "Đã hoàn tiền" },
  { value: "REJECTED", label: "Từ chối" },
];

export default function MarketplaceOpsAdmin() {
  const [tab, setTab] = useState<"disputes" | "metrics">("disputes");
  return (
    <div className="p-4 sm:p-7">
      <div className="mx-auto max-w-6xl">
        <div>
          <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#FF6B00]">
            <Scale className="h-3 w-3" />Marketplace operations
          </p>
          <h1 className="mt-1 text-2xl font-black text-slate-900">Vận hành Marketplace</h1>
          <p className="mt-2 text-sm text-slate-500">Xử lý tranh chấp hoàn tiền và theo dõi chỉ số chất lượng theo phiên bản.</p>
        </div>

        <div className="mt-6 flex gap-2 rounded-2xl bg-slate-100/75 p-1.5">
          <TabButton active={tab === "disputes"} onClick={() => setTab("disputes")} icon={<Scale className="h-4 w-4" />} label="Tranh chấp hoàn tiền" />
          <TabButton active={tab === "metrics"} onClick={() => setTab("metrics")} icon={<BarChart3 className="h-4 w-4" />} label="Chỉ số chất lượng" />
        </div>

        <div className="mt-6">{tab === "disputes" ? <DisputesTab /> : <MetricsTab />}</div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${active ? "bg-white text-[#FF6B00] shadow-sm ring-1 ring-slate-200/70" : "text-slate-500 hover:bg-white/60 hover:text-slate-800"}`}
    >
      {icon}
      {label}
    </button>
  );
}

function DisputesTab() {
  const [statusFilter, setStatusFilter] = useState<MarketplaceDisputeStatus | "ALL">("OPEN");
  const [disputes, setDisputes] = useState<AdminMarketplaceDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<AdminMarketplaceDispute | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const page = await getAdminDisputes({ status: statusFilter === "ALL" ? undefined : statusFilter, size: 50 });
      setDisputes(page.items);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const openDetail = async (disputeId: string) => {
    try {
      setSelected(await getAdminDispute(disputeId));
    } catch (error) {
      toast.error(errorText(error));
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 rounded-2xl bg-slate-100/60 p-1.5">
        {STATUS_FILTERS.map(filter => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setStatusFilter(filter.value)}
            className={`rounded-xl px-3.5 py-2 text-sm font-bold transition ${statusFilter === filter.value ? "bg-white text-[#FF6B00] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <section className="mt-5">
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />)}</div>
        ) : failed ? (
          <ErrorState onRetry={() => void load()} />
        ) : disputes.length === 0 ? (
          <EmptyState message="Không có tranh chấp nào ở trạng thái này." />
        ) : (
          <div className="space-y-3">
            {disputes.map(dispute => (
              <button
                key={dispute.disputeId}
                type="button"
                onClick={() => void openDetail(dispute.disputeId)}
                className="flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-orange-200 hover:bg-orange-50/30"
              >
                <div className="min-w-0">
                  <p className="font-bold text-slate-900">{REASON_LABELS[dispute.reason]} · {dispute.saleCoinAmount ?? 0} Coin</p>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {dispute.versionTitle || "—"}{dispute.versionNo != null ? ` · v${dispute.versionNo}` : ""} · {dispute.buyerName || dispute.buyerId || "—"} · {date(dispute.createdAt)}
                  </p>
                </div>
                <StatusBadge status={dispute.status} />
              </button>
            ))}
          </div>
        )}
      </section>

      {selected && (
        <DisputeDrawer
          dispute={selected}
          onClose={() => setSelected(null)}
          onUpdated={async updated => {
            setSelected(updated);
            await load();
          }}
        />
      )}
    </>
  );
}

function DisputeDrawer({
  dispute,
  onClose,
  onUpdated,
}: {
  dispute: AdminMarketplaceDispute;
  onClose: () => void;
  onUpdated: (updated: AdminMarketplaceDispute) => Promise<void>;
}) {
  const [note, setNote] = useState(dispute.decisionNote ?? "");
  const [busy, setBusy] = useState<string | null>(null);

  const runAction = async (action: string) => {
    setBusy(action);
    try {
      let updated: AdminMarketplaceDispute;
      if (action === "COMPLETE_REFUND") {
        updated = await completeAdminDisputeRefund(dispute.disputeId);
        toast.success(`Đã hoàn ${updated.refundCoinAmount ?? 0} Coin cho người mua.`);
      } else {
        const status = action === "REVIEW" ? "UNDER_REVIEW" : action === "APPROVE" ? "APPROVED" : "REJECTED";
        updated = await decideAdminDispute(dispute.disputeId, { status, decisionNote: note.trim() || undefined });
        toast.success("Đã cập nhật quyết định.");
      }
      // Never optimistic: re-fetch authoritative state drives the next allowed actions.
      await onUpdated(updated);
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setBusy(null);
    }
  };

  const needsNote = (action: string) => action === "APPROVE" || action === "REJECT";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40" role="dialog" aria-modal="true" aria-label="Chi tiết tranh chấp">
      <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#FF6B00]">Tranh chấp hoàn tiền</p>
            <h2 className="mt-1 text-lg font-black text-slate-900">{REASON_LABELS[dispute.reason]}</h2>
          </div>
          <StatusBadge status={dispute.status} />
        </div>

        <dl className="mt-5 space-y-3 text-sm">
          <Row label="Người mua" value={dispute.buyerName || dispute.buyerId || "—"} />
          <Row label="Phiên bản" value={`${dispute.versionTitle || "—"}${dispute.versionNo != null ? ` · v${dispute.versionNo}` : ""}`} />
          <Row label="Số Coin giao dịch" value={`${dispute.saleCoinAmount ?? 0} Coin`} />
          <Row label="Gửi lúc" value={date(dispute.createdAt)} />
          {dispute.decidedAt && <Row label="Quyết định" value={`${dispute.adminActorName || "—"} · ${date(dispute.decidedAt)}`} />}
          {dispute.status === "REFUNDED" && <Row label="Đã hoàn" value={`${dispute.refundCoinAmount ?? 0} Coin · ${date(dispute.refundedAt)}`} />}
        </dl>

        {dispute.description && <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">{dispute.description}</div>}

        {dispute.status === "APPROVED" && (
          <p className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-semibold leading-5 text-indigo-800">
            Đã duyệt. Thực hiện hoàn tiền để ghi bút toán bù trừ: hoàn Coin cho người mua, đảo settlement/thu nhập
            Creator và thu hồi quyền truy cập.
          </p>
        )}

        {dispute.allowedActions.some(needsNote) && (
          <label className="mt-4 block text-sm font-bold text-slate-700">
            Ghi chú quyết định <span className="text-rose-600">*</span>
            <textarea
              value={note}
              maxLength={2000}
              onChange={event => setNote(event.target.value)}
              placeholder="Bắt buộc khi duyệt hoặc từ chối"
              className="mt-2 min-h-20 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal outline-none focus:border-[#FF6B00]"
            />
          </label>
        )}

        <div className="mt-5 flex flex-col gap-2">
          {dispute.allowedActions.length === 0 ? (
            <p className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-500">Tranh chấp đã kết thúc, không còn hành động khả dụng.</p>
          ) : (
            dispute.allowedActions.map(action => (
              <button
                key={action}
                type="button"
                onClick={() => void runAction(action)}
                disabled={busy !== null || (needsNote(action) && !note.trim())}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-white disabled:opacity-50 ${action === "COMPLETE_REFUND" ? "bg-emerald-600 hover:bg-emerald-700" : action === "REJECT" ? "bg-rose-600 hover:bg-rose-700" : action === "APPROVE" ? "bg-indigo-600 hover:bg-indigo-700" : "bg-sky-600 hover:bg-sky-700"}`}
              >
                {busy === action ? <Loader2 className="h-4 w-4 animate-spin" /> : ACTION_LABELS[action] ?? action}
              </button>
            ))
          )}
          <button type="button" onClick={onClose} className="mt-1 inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricsTab() {
  const [versionId, setVersionId] = useState("");
  const [metrics, setMetrics] = useState<MarketplaceVersionMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!versionId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      setMetrics(await getAdminVersionMetrics(versionId.trim()));
    } catch (lookupError) {
      setMetrics(null);
      setError(errorText(lookupError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={lookup} className="flex flex-col gap-2 sm:flex-row">
        <input
          value={versionId}
          onChange={event => setVersionId(event.target.value)}
          placeholder="Nhập Version ID của phiên bản Quiz Pack"
          className="min-h-11 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#FF6B00]"
          aria-label="Version ID"
        />
        <button type="submit" disabled={loading || !versionId.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#FF6B00] px-4 text-sm font-bold text-white disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}Xem chỉ số
        </button>
      </form>

      <div className="mt-5">
        {error ? (
          <ErrorState onRetry={() => setError(null)} message={error} />
        ) : loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}</div>
        ) : !metrics ? (
          <EmptyState message="Nhập Version ID để xem chỉ số chất lượng của phiên bản." />
        ) : (
          <div>
            <p className="text-sm font-bold text-slate-900">{metrics.versionTitle || "—"}{metrics.versionNo != null ? ` · v${metrics.versionNo}` : ""}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <MetricCard icon={<ShieldCheck className="h-4 w-4" />} label="Tỷ lệ hoàn thành" value={pct(metrics.completionRate)} sub={`${metrics.completedLearnerCount}/${metrics.learnerCount} người học`} />
              <MetricCard icon={<BarChart3 className="h-4 w-4" />} label="Đánh giá trung bình" value={metrics.averageRating.toFixed(2)} sub={`${metrics.reviewCount} lượt đánh giá`} />
              <MetricCard icon={<CircleAlert className="h-4 w-4" />} label="Báo cáo đang mở" value={pct(metrics.openReportRate)} sub={`${metrics.openReportCount}/${metrics.reportCount} báo cáo`} tone={metrics.openReportCount > 0 ? "warn" : "ok"} />
              <MetricCard icon={<Scale className="h-4 w-4" />} label="Lượt Ranked nghi vấn" value={pct(metrics.suspiciousRankedAttemptRate)} sub={`${metrics.suspiciousRankedAttemptCount}/${metrics.rankedAttemptCount} lượt`} tone={metrics.suspiciousRankedAttemptCount > 0 ? "warn" : "ok"} />
              <MetricCard icon={<Coins className="h-4 w-4" />} label="Tỷ lệ hoàn tiền" value={pct(metrics.refundRate)} sub={`${metrics.refundedDisputeCount}/${metrics.disputeCount} tranh chấp`} tone={metrics.refundedDisputeCount > 0 ? "warn" : "ok"} />
              <MetricCard icon={<Coins className="h-4 w-4" />} label="Tổng Coin đã hoàn" value={`${metrics.refundedCoinAmount}`} sub="Coin" />
              <MetricCard icon={<Coins className="h-4 w-4" />} label="Doanh thu nền tảng ghi nhận" value={`${metrics.recognizedPlatformRevenue}`} sub="Coin, đã loại giao dịch hoàn tiền" tone="ok" />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function MetricCard({ icon, label, value, sub, tone = "neutral" }: { icon: React.ReactNode; label: string; value: string; sub: string; tone?: "neutral" | "ok" | "warn" }) {
  const toneClass = tone === "warn" ? "ring-amber-100 bg-amber-50" : tone === "ok" ? "ring-emerald-100 bg-emerald-50" : "ring-slate-100 bg-white";
  return (
    <div className={`rounded-2xl p-4 ring-1 ${toneClass}`}>
      <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{icon}{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{sub}</p>
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

function ErrorState({ onRetry, message }: { onRetry: () => void; message?: string }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
      <CircleAlert className="mx-auto h-6 w-6 text-rose-600" />
      <p className="mt-2 text-sm font-bold text-rose-900">{message || "Không thể tải dữ liệu"}</p>
      <button onClick={onRetry} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#FF6B00] px-4 py-2 text-sm font-bold text-white">
        <RefreshCw className="h-4 w-4" />Thử lại
      </button>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm font-semibold text-slate-500">{message}</div>;
}

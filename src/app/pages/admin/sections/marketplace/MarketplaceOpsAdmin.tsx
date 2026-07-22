import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  BarChart3,
  CircleAlert,
  Coins,
  Loader2,
  RefreshCw,
  Scale,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  completeAdminDisputeRefund,
  decideAdminDispute,
  getAdminDispute,
  getAdminDisputeTimeline,
  getAdminDisputes,
  getAdminVersionMetrics,
} from "../../../../../api/admin/marketplaceOpsAdminService";
import type {
  AdminMarketplaceDispute,
  MarketplaceDisputeReason,
  MarketplaceDisputeStatus,
  MarketplaceVersionMetrics,
} from "../../../../../api/admin/marketplaceOpsAdminTypes";
import type { MarketplaceAuditTimelineEvent } from "../../../../../api/admin/marketplaceOpsAdminService";

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
    <div className="relative isolate min-h-full overflow-hidden bg-[#F7F8FA] p-4 sm:p-7">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_8%_5%,rgba(255,237,223,0.9),transparent_28%),radial-gradient(circle_at_95%_11%,rgba(255,246,234,0.8),transparent_24%)]" />
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[2rem] border border-white bg-white/90 p-6 shadow-[0_20px_58px_rgba(71,50,35,0.07)] backdrop-blur-xl sm:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full border-[20px] border-orange-100/70" />
        <div className="relative">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#FF6B00]">
            <Scale className="h-3 w-3" />Marketplace operations
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-[-0.03em] text-slate-950 sm:text-3xl">Vận hành Marketplace</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Xử lý tranh chấp hoàn tiền và theo dõi chỉ số chất lượng theo từng phiên bản Quiz Pack.</p>
        </div></div>

        <div className="mt-6 flex flex-wrap gap-2 rounded-[1.5rem] border border-white bg-white/80 p-2 shadow-[0_12px_36px_rgba(71,50,35,0.05)]">
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
      className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition ${active ? "bg-orange-50 text-[#FF6B00] shadow-sm ring-1 ring-orange-100" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}
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
      <div className="flex flex-wrap gap-2 rounded-[1.5rem] border border-white bg-white/80 p-2 shadow-[0_12px_36px_rgba(71,50,35,0.05)]">
        {STATUS_FILTERS.map(filter => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setStatusFilter(filter.value)}
            className={`min-h-10 rounded-xl px-3.5 text-sm font-bold transition ${statusFilter === filter.value ? "bg-orange-50 text-[#FF6B00] shadow-sm ring-1 ring-orange-100" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <section className="mt-5 rounded-[1.75rem] border border-white bg-white/90 p-4 shadow-[0_16px_45px_rgba(71,50,35,0.06)] sm:p-5">
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}</div>
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
                className="group flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-[0_8px_24px_rgba(15,23,42,0.025)] transition hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50/30 hover:shadow-[0_12px_28px_rgba(194,65,12,0.07)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100"
              >
                <div className="min-w-0">
                  <p className="font-black text-slate-950">{REASON_LABELS[dispute.reason]} · {dispute.saleCoinAmount ?? 0} Coin</p>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {dispute.versionTitle || "—"}{dispute.versionNo != null ? ` · v${dispute.versionNo}` : ""} · {dispute.buyerName || dispute.buyerId || "—"} · {date(dispute.createdAt)}
                  </p>
                </div>
                <span className="flex items-center gap-3"><span className="hidden text-xs font-bold text-[#FF6B00] opacity-0 transition group-hover:opacity-100 sm:inline">Xử lý</span><StatusBadge status={dispute.status} /></span>
              </button>
            ))}
          </div>
        )}
      </section>

      {selected && createPortal(
        <DisputeDrawer
          dispute={selected}
          onClose={() => setSelected(null)}
          onUpdated={async updated => {
            setSelected(updated);
            await load();
          }}
        />,
        document.body,
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
  const [timeline, setTimeline] = useState<MarketplaceAuditTimelineEvent[]>([]);

  useEffect(() => {
    let active = true;
    Promise.resolve(getAdminDisputeTimeline(dispute.disputeId))
      .then(events => { if (active) setTimeline(events ?? []); })
      .catch(() => { if (active) setTimeline([]); });
    return () => { active = false; };
  }, [dispute.disputeId]);

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
    <div className="fixed inset-0 z-[70] flex justify-end bg-slate-950/45 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label="Chi tiết tranh chấp">
      <aside className="flex h-[100dvh] w-full max-w-[34rem] flex-col bg-white shadow-2xl">
        <header className="sticky top-0 z-10 border-b border-orange-100 bg-[linear-gradient(120deg,#FFF8F1_0%,#FFFFFF_72%)] px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-[#E85F00] shadow-[0_8px_18px_rgba(255,107,0,0.12)]">
              <CircleAlert className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#FF6B00]">Tranh chấp hoàn tiền</p>
                <StatusBadge status={dispute.status} />
              </div>
              <h2 className="mt-1 text-lg font-black leading-6 text-slate-900">{REASON_LABELS[dispute.reason]}</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">Xem giao dịch và đưa ra quyết định có thể truy vết.</p>
            </div>
            <button type="button" onClick={onClose} aria-label="Đóng chi tiết tranh chấp" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-100 bg-white text-slate-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[#E85F00] focus:outline-none focus:ring-4 focus:ring-orange-100">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4" aria-label="Thông tin giao dịch">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Thông tin giao dịch</p>
            <dl className="divide-y divide-slate-200/80 text-sm">
              <Row label="Người mua" value={dispute.buyerName || dispute.buyerId || "—"} />
              <Row label="Phiên bản" value={`${dispute.versionTitle || "—"}${dispute.versionNo != null ? ` · v${dispute.versionNo}` : ""}`} />
              <Row label="Số Coin giao dịch" value={`${dispute.saleCoinAmount ?? 0} Coin`} />
              <Row label="Gửi lúc" value={date(dispute.createdAt)} />
              {dispute.decidedAt && <Row label="Quyết định" value={`${dispute.adminActorName || "—"} · ${date(dispute.decidedAt)}`} />}
              {dispute.status === "REFUNDED" && <Row label="Đã hoàn" value={`${dispute.refundCoinAmount ?? 0} Coin · ${date(dispute.refundedAt)}`} />}
            </dl>
          </section>

          {dispute.description && (
            <section className="mt-4 rounded-2xl border border-orange-100 bg-orange-50/45 p-4" aria-label="Mô tả tranh chấp">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#E85F00]">Mô tả từ người mua</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{dispute.description}</p>
            </section>
          )}

          {dispute.status === "APPROVED" && (
            <section className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4" aria-label="Bước hoàn tiền tiếp theo">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">Sẵn sàng hoàn tiền</p>
              <p className="mt-2 text-sm leading-6 text-emerald-800">Thực hiện hoàn tiền để trả Coin cho người mua, đảo settlement/thu nhập Creator và thu hồi quyền truy cập.</p>
            </section>
          )}

          <section className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4" aria-label="Nhật ký xử lý">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Nhật ký xử lý</p>
            <div className="mt-3 space-y-3">{timeline.length === 0 ? <p className="text-sm text-slate-500">Chưa có hoạt động được ghi nhận.</p> : timeline.map(event => <div key={event.logId} className="border-l-2 border-orange-200 pl-3"><p className="text-sm font-bold text-slate-800">{event.title ?? event.actionType}</p><p className="mt-1 text-xs text-slate-500">{event.actorName ?? "Hệ thống"} · {date(event.occurredAt)}</p></div>)}</div>
          </section>

          {dispute.allowedActions.some(needsNote) && (
            <label className="mt-5 block text-sm font-bold text-slate-800">
              Ghi chú quyết định <span className="text-rose-600">*</span>
              <textarea
                value={note}
                maxLength={2000}
                onChange={event => setNote(event.target.value)}
                placeholder="Nêu lý do rõ ràng trước khi duyệt hoặc từ chối"
                className="mt-2 min-h-28 w-full resize-y rounded-2xl border border-slate-200 bg-white p-3 text-sm font-normal leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#FF6B00] focus:ring-4 focus:ring-orange-100"
              />
            </label>
          )}
        </div>

        <footer className="border-t border-slate-100 bg-white px-5 py-4 shadow-[0_-10px_24px_rgba(15,23,42,0.04)] sm:px-6">
          {dispute.allowedActions.length === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-5 text-slate-500">Tranh chấp đã kết thúc, không còn hành động khả dụng.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {dispute.allowedActions.map(action => (
                <button
                  key={action}
                  type="button"
                  onClick={() => void runAction(action)}
                  disabled={busy !== null || (needsNote(action) && !note.trim())}
                  className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${action === "COMPLETE_REFUND" ? "bg-emerald-600 text-white shadow-[0_8px_18px_rgba(5,150,105,0.18)] hover:bg-emerald-700 focus:ring-emerald-100" : action === "REJECT" ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus:ring-rose-100" : action === "APPROVE" ? "bg-[#FF6B00] text-white shadow-[0_8px_18px_rgba(255,107,0,0.2)] hover:bg-[#E85F00] focus:ring-orange-100" : "border border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100 focus:ring-sky-100"}`}
                >
                  {busy === action ? <Loader2 className="h-4 w-4 animate-spin" /> : ACTION_LABELS[action] ?? action}
                </button>
              ))}
            </div>
          )}
          <button type="button" onClick={onClose} className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100">
            Đóng
          </button>
        </footer>
      </aside>
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
      <form onSubmit={lookup} className="flex flex-col gap-2 rounded-[1.75rem] border border-white bg-white/90 p-4 shadow-[0_16px_45px_rgba(71,50,35,0.06)] sm:flex-row sm:items-center sm:p-5">
        <input
          value={versionId}
          onChange={event => setVersionId(event.target.value)}
          placeholder="Nhập Version ID của phiên bản Quiz Pack"
          className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-[#FF6B00] focus:ring-4 focus:ring-orange-100"
          aria-label="Version ID"
        />
        <button type="submit" disabled={loading || !versionId.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#FF6B00] px-4 text-sm font-bold text-white shadow-[0_8px_18px_rgba(255,107,0,0.2)] transition hover:-translate-y-0.5 hover:bg-[#E85F00] disabled:opacity-50 disabled:hover:translate-y-0">
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
    <div className={`rounded-2xl p-4 shadow-[0_8px_24px_rgba(15,23,42,0.025)] ring-1 ${toneClass}`}>
      <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{icon}{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{sub}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
      <dt className="shrink-0 text-slate-400">{label}</dt>
      <dd className="max-w-[62%] text-right font-semibold leading-5 text-slate-800">{value}</dd>
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

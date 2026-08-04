import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Building2, CalendarDays, ChevronDown, Coins, CreditCard, RefreshCw, UsersRound, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { getSubscriptionPlans, type ServicePlanResponse } from "../../../../../api/admin/adminSubscriptionPlansService";
import {
  getPlatformTreasuryEntries,
  getPlatformTreasuryMonthlySummaries,
  getPlatformTreasurySubscriptionPurchaseSummary,
  getPlatformTreasurySummary,
  type PlatformTreasuryAsset,
  type PlatformTreasuryEntry,
  type PlatformTreasuryEntryType,
  type PlatformTreasuryMonthlySummary,
  type PlatformTreasurySubscriptionPurchaseSummary,
  type PlatformTreasurySummary,
  type TreasuryPage,
} from "../../../../../api/admin";

type TreasuryDateRange = {
  from: string;
  to: string;
};

type PlatformTreasurySectionProps = {
  dateRange: TreasuryDateRange;
  periodLabel: string;
};

const PAGE_SIZE = 20;
const SUBSCRIPTION_PAYMENT_ENTRY_TYPE: PlatformTreasuryEntryType = "SUBSCRIPTION_PAYMENT_RECEIVED";
const vnd = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const coin = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });

const ENTRY_LABELS: Record<PlatformTreasuryEntryType, string> = {
  COIN_TOP_UP_RECEIVED: "Nạp Coin thành công",
  SUBSCRIPTION_PAYMENT_RECEIVED: "Thanh toán gói dịch vụ",
  MARKETPLACE_COMMISSION_EARNED: "Hoa hồng Marketplace",
  MARKETPLACE_COMMISSION_REVERSED: "Hoàn hoa hồng Marketplace",
  CREATOR_PAYOUT_COMPLETED: "Chi trả Creator",
};

function formatOccurredAt(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function startOfVietnamDay(value: string): string {
  return `${value}T00:00:00+07:00`;
}

function startOfNextDay(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  const nextDay = new Date(Date.UTC(year, month - 1, day + 1));
  const nextYear = nextDay.getUTCFullYear();
  const nextMonth = String(nextDay.getUTCMonth() + 1).padStart(2, "0");
  const nextDate = String(nextDay.getUTCDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDate}T00:00:00+07:00`;
}

export function PlatformTreasurySection({ dateRange, periodLabel }: PlatformTreasurySectionProps) {
  const [summary, setSummary] = useState<PlatformTreasurySummary | null>(null);
  const [monthlySummaries, setMonthlySummaries] = useState<PlatformTreasuryMonthlySummary[]>([]);
  const [subscriptionPurchaseSummary, setSubscriptionPurchaseSummary] = useState<PlatformTreasurySubscriptionPurchaseSummary | null>(null);
  const [plans, setPlans] = useState<ServicePlanResponse[]>([]);
  const [planId, setPlanId] = useState("");
  const [monthlyPeriodCount, setMonthlyPeriodCount] = useState(6);
  const [entries, setEntries] = useState<PlatformTreasuryEntry[]>([]);
  const [pageInfo, setPageInfo] = useState<TreasuryPage | null>(null);
  const [asset, setAsset] = useState<PlatformTreasuryAsset | "ALL">("ALL");
  const [type, setType] = useState<PlatformTreasuryEntryType | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const isSubscriptionPayment = type === SUBSCRIPTION_PAYMENT_ENTRY_TYPE;

  const query = useMemo(() => ({
    asset: asset === "ALL" ? undefined : asset,
    entryType: type === "ALL" ? undefined : type,
    planId: isSubscriptionPayment && planId ? planId : undefined,
    from: startOfVietnamDay(dateRange.from),
    to: startOfNextDay(dateRange.to),
    size: PAGE_SIZE,
  }), [asset, dateRange.from, dateRange.to, isSubscriptionPayment, planId, type]);

  const loadFirstPage = useCallback(async () => {
    setLoading(true);
    try {
      const subscriptionPurchaseSummaryRequest = isSubscriptionPayment
        ? getPlatformTreasurySubscriptionPurchaseSummary({
            from: query.from ?? "",
            to: query.to ?? "",
            ...(planId ? { planId } : {}),
          })
        : Promise.resolve(null);
      const [nextSummary, nextMonthlySummaries, nextPlans, nextSubscriptionPurchaseSummary, nextPage] = await Promise.all([
        getPlatformTreasurySummary(),
        getPlatformTreasuryMonthlySummaries(monthlyPeriodCount),
        getSubscriptionPlans(),
        subscriptionPurchaseSummaryRequest,
        getPlatformTreasuryEntries({ ...query, page: 0 }),
      ]);
      setSummary(nextSummary);
      setMonthlySummaries(nextMonthlySummaries);
      setPlans(nextPlans.filter((plan) => plan.active && (
        plan.planType === "SKILL_BUILDER" || plan.planType === "PREMIUM"
      )));
      setSubscriptionPurchaseSummary(nextSubscriptionPurchaseSummary);
      setEntries(nextPage.items);
      setPageInfo(nextPage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải sổ quỹ hệ thống.");
    } finally {
      setLoading(false);
    }
  }, [isSubscriptionPayment, monthlyPeriodCount, planId, query]);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  const loadMore = async () => {
    if (!pageInfo || pageInfo.last || loadingMore) return;

    setLoadingMore(true);
    try {
      const nextPage = await getPlatformTreasuryEntries({ ...query, page: pageInfo.page + 1 });
      setEntries((currentEntries) => [...currentEntries, ...nextPage.items]);
      setPageInfo(nextPage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải thêm giao dịch.");
    } finally {
      setLoadingMore(false);
    }
  };

  const cards = summary ? [
    { label: "Tiền mua gói dịch vụ", value: vnd.format(summary.subscriptionPaymentVnd), tone: "text-violet-700", icon: CreditCard, note: "Thanh toán subscription thành công" },
    { label: "Tiền nạp Coin", value: vnd.format(summary.coinTopUpVnd), tone: "text-blue-700", icon: ArrowDownLeft, note: "Nạp vào ví Coin của người dùng" },
    { label: "VND đã chi", value: vnd.format(summary.vndOutflow), tone: "text-rose-700", icon: ArrowUpRight, note: "Creator payout đã hoàn tất" },
    { label: "Vị thế VND nội bộ", value: vnd.format(summary.vndNetPosition), tone: "text-slate-950", icon: Building2, note: "Không phải số dư ngân hàng" },
    { label: "Hoa hồng Marketplace", value: `${coin.format(summary.commissionCoinNetPosition)} Coin`, tone: "text-emerald-700", icon: Coins, note: `Đã hoàn: ${coin.format(summary.commissionCoinReversed)} Coin` },
  ] : [];

  return <section id="platform-treasury-ledger" className="mt-6 scroll-mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#FF6B00]"><WalletCards className="h-3.5 w-3.5" />System treasury</span>
        <h2 className="mt-3 text-xl font-black tracking-[-0.025em] text-slate-950">Quỹ hệ thống</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Sổ đối soát nội bộ. Đang xem {periodLabel.toLowerCase()}, có thể lọc và tải thêm giao dịch.</p>
      </div>
      <button type="button" onClick={() => void loadFirstPage()} disabled={loading} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-orange-200 px-4 text-sm font-bold text-[#FF6B00] hover:bg-orange-50 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Làm mới</button>
    </div>

    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {loading && !summary ? Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-100" />) : cards.map((card) => { const Icon = card.icon; return <article key={card.label} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wide text-slate-400">{card.label}</span><span className="rounded-xl bg-white p-2 shadow-sm"><Icon className={`h-4 w-4 ${card.tone}`} /></span></div><p className={`mt-5 text-xl font-black tracking-[-0.035em] ${card.tone}`}>{card.value}</p><p className="mt-1 text-xs text-slate-500">{card.note}</p></article>; })}
    </div>

    <section aria-label="Chi tiết quỹ theo tháng" className="mt-7 overflow-hidden rounded-2xl border border-orange-100 bg-orange-50/40">
      <div className="flex flex-col gap-3 border-b border-orange-100 bg-white/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-black text-slate-900"><CalendarDays aria-hidden="true" className="h-4 w-4 text-[#FF6B00]" />Chi tiết quỹ theo tháng</div>
          <p className="mt-1 text-xs text-slate-500">Tách tiền mua gói, nạp Coin, chi và hoa hồng đã đối soát theo từng tháng.</p>
        </div>
        <select aria-label="Số tháng hiển thị" value={monthlyPeriodCount} onChange={(event) => setMonthlyPeriodCount(Number(event.target.value))} className="h-10 rounded-xl border border-orange-200 bg-white px-3 text-sm font-bold text-slate-700">
          <option value={3}>3 tháng gần nhất</option>
          <option value={6}>6 tháng gần nhất</option>
          <option value={12}>12 tháng gần nhất</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[1040px] w-full text-left">
          <thead className="bg-orange-50/70 text-[11px] font-black uppercase tracking-wide text-slate-400"><tr><th className="px-4 py-3">Tháng</th><th className="px-4 py-3 text-right">Mua gói dịch vụ</th><th className="px-4 py-3 text-right">Người mua gói</th><th className="px-4 py-3 text-right">Nạp Coin</th><th className="px-4 py-3 text-right">VND đã chi</th><th className="px-4 py-3 text-right">Vị thế VND</th><th className="px-4 py-3 text-right">Hoa hồng ròng</th></tr></thead>
          <tbody className="divide-y divide-orange-100 bg-white/90">
            {loading ? <tr><td colSpan={7} className="px-4 py-7 text-center text-sm text-slate-400">Đang tải chi tiết theo tháng…</td></tr> : monthlySummaries.map((month) => <tr key={month.month}><td className="whitespace-nowrap px-4 py-3 text-sm font-bold text-slate-800">{new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" }).format(new Date(`${month.month}-01T00:00:00`))}</td><td className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold text-violet-700">{vnd.format(month.subscriptionPaymentVnd)}</td><td className="whitespace-nowrap px-4 py-3 text-right text-sm font-black text-violet-700">{month.subscriptionPurchaserCount.toLocaleString("vi-VN")}</td><td className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold text-blue-700">{vnd.format(month.coinTopUpVnd)}</td><td className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold text-rose-700">{vnd.format(month.vndOutflow)}</td><td className="whitespace-nowrap px-4 py-3 text-right text-sm font-black text-slate-900">{vnd.format(month.vndNetPosition)}</td><td className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold text-emerald-700">{coin.format(month.commissionCoinNetPosition)} Coin</td></tr>)}
          </tbody>
        </table>
      </div>
    </section>

    <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-black text-slate-900">Sổ giao dịch quỹ</h3><p className="mt-1 text-xs text-slate-500">Đang xem {periodLabel.toLowerCase()}. Mỗi nghiệp vụ tài chính tạo một entry bất biến.</p></div><div className="flex flex-wrap gap-2">{isSubscriptionPayment && <select aria-label="Lọc gói dịch vụ" value={planId} onChange={(event) => setPlanId(event.target.value)} className="h-10 rounded-xl border border-violet-200 bg-violet-50/50 px-3 text-sm font-semibold text-slate-700"><option value="">Tất cả gói dịch vụ</option>{plans.map((plan) => <option key={plan.planId} value={plan.planId}>{plan.planName}</option>)}</select>}<select value={asset} onChange={(event) => setAsset(event.target.value as PlatformTreasuryAsset | "ALL")} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"><option value="ALL">Tất cả tài sản</option><option value="VND">VND</option><option value="COIN">Coin</option></select><select value={type} onChange={(event) => { const nextType = event.target.value as PlatformTreasuryEntryType | "ALL"; setType(nextType); if (nextType !== SUBSCRIPTION_PAYMENT_ENTRY_TYPE) setPlanId(""); }} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"><option value="ALL">Tất cả nghiệp vụ</option>{Object.entries(ENTRY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div></div>
    {isSubscriptionPayment && subscriptionPurchaseSummary && <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-100 bg-violet-50/50 px-4 py-3"><div className="flex items-center gap-2 text-sm font-bold text-violet-900"><UsersRound aria-hidden="true" className="h-4 w-4 text-violet-600" />{planId ? plans.find((plan) => plan.planId === planId)?.planName ?? "Gói dịch vụ đã chọn" : "Tất cả gói dịch vụ"}</div><p className="text-sm font-black text-violet-700">{subscriptionPurchaseSummary.purchaserCount.toLocaleString("vi-VN")} người đã mua trong kỳ</p></div>}
    <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-100"><table className="min-w-full divide-y divide-slate-100 text-left"><thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wide text-slate-400"><tr><th className="px-4 py-3">Thời điểm</th><th className="px-4 py-3">Nghiệp vụ</th><th className="px-4 py-3">Đối tác / xử lý</th><th className="px-4 py-3 text-right">Giá trị</th></tr></thead><tbody className="divide-y divide-slate-100 bg-white">{loading ? <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-400">Đang tải sổ quỹ…</td></tr> : entries.length === 0 ? <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-400">Chưa có giao dịch phù hợp trong {periodLabel.toLowerCase()}.</td></tr> : entries.map((entry) => <tr key={entry.entryId} className="hover:bg-orange-50/30"><td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{formatOccurredAt(entry.occurredAt)}</td><td className="px-4 py-3"><p className="text-sm font-bold text-slate-800">{ENTRY_LABELS[entry.entryType]}</p><p className="mt-0.5 text-xs text-slate-400">{entry.asset} · {entry.referenceType}</p></td><td className="px-4 py-3 text-sm text-slate-600"><p>{entry.counterpartyName ?? "Hệ thống"}</p>{entry.actorName && entry.actorName !== "SYSTEM" && <p className="mt-0.5 text-xs text-slate-400">Xử lý: {entry.actorName}</p>}</td><td className={`whitespace-nowrap px-4 py-3 text-right text-sm font-black ${entry.direction === "CREDIT" ? "text-emerald-700" : "text-rose-700"}`}>{entry.direction === "CREDIT" ? "+" : "−"}{entry.asset === "VND" ? vnd.format(entry.amount) : `${coin.format(entry.amount)} Coin`}</td></tr>)}</tbody></table></div>
    {!loading && pageInfo && <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs font-medium text-slate-500">Đã hiển thị {entries.length.toLocaleString("vi-VN")} / {pageInfo.totalItems.toLocaleString("vi-VN")} giao dịch</p>{pageInfo.last ? <p className="text-xs font-bold text-slate-400">Đã tải toàn bộ giao dịch trong kỳ</p> : <button type="button" disabled={loadingMore} onClick={() => void loadMore()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-orange-200 bg-white px-4 text-sm font-bold text-[#FF6B00] hover:bg-orange-50 disabled:opacity-50">{loadingMore ? "Đang tải…" : <>Tải thêm giao dịch <ChevronDown aria-hidden="true" className="h-4 w-4" /></>}</button>}</div>}
  </section>;
}

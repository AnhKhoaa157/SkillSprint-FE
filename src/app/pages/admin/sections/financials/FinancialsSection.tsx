import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Activity,
  BarChart3,
  Building2,
  ChevronRight,
  Coins,
  DollarSign,
  RefreshCw,
  UsersRound,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import {
  getAdminDashboardAnalytics,
  type AdminDashboardResponse,
} from "../../../../../api/admin/adminDashboardService";
import { PlatformTreasurySection } from "./PlatformTreasurySection";

const ACCENT = "#FF6B00";

type FinancialMetricKey = "subscriptionRevenue" | "coinTopUp" | "marketplaceCommission";

type FinancialChartDatum = {
  date: string;
  amount: number;
};

type ChartTooltipPayload = {
  color?: string;
  value?: number | string;
};

function formatCompactNumber(value: number): string {
  const absoluteValue = Math.abs(value);
  if (absoluteValue < 1_000) return value.toLocaleString("vi-VN");

  const divisor = absoluteValue >= 1_000_000 ? 1_000_000 : 1_000;
  const suffix = divisor === 1_000_000 ? "M" : "K";
  const compact = value / divisor;

  return `${compact.toLocaleString("en-US", { maximumFractionDigits: 1 })}${suffix}`;
}

function formatCurrency(value: number): string {
  return `${formatCompactNumber(value)} đ`;
}

function formatCoin(value: number): string {
  return `${formatCompactNumber(value)} Coin`;
}

function formatChartDate(date: string): string {
  if (!date || !date.includes("-") || date.length < 10) return date;

  const [, month, day] = date.split("-");
  return `${month}-${day}`;
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const width = 76;
  const height = 28;
  const safeData = data.length > 1 ? data : [0, 0];
  const max = Math.max(...safeData);
  const min = Math.min(...safeData);
  const range = max - min || 1;
  const points = safeData
    .map((value, index) => {
      const x = (index / (safeData.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg aria-hidden="true" className="overflow-visible" width={width} height={height}>
      <polyline
        fill="none"
        points={points}
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function FinancialChartTooltip({
  active,
  label,
  payload,
  formatValue,
}: {
  active?: boolean;
  label?: string;
  payload?: ChartTooltipPayload[];
  formatValue: (value: number) => string;
}) {
  const datum = payload?.[0];
  const value = typeof datum?.value === "number" ? datum.value : Number(datum?.value ?? 0);

  if (!active || !datum || Number.isNaN(value)) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-[11px] font-semibold text-slate-400">Ngày {label}</p>
      <p className="mt-0.5 text-sm font-black" style={{ color: datum.color }}>
        {formatValue(value)}
      </p>
    </div>
  );
}

function EmptyChartState({ description }: { description: string }) {
  return (
    <div className="flex h-[230px] flex-col items-center justify-center rounded-2xl border border-dashed border-orange-200 bg-orange-50/40 px-6 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#FF6B00] shadow-sm">
        <BarChart3 className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-black text-slate-800">Chưa có dữ liệu trong khoảng này</p>
      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">{description}</p>
    </div>
  );
}

function FinancialAreaChart({
  data,
  color,
  description,
  formatValue,
  label,
}: {
  data: FinancialChartDatum[];
  color: string;
  description: string;
  formatValue: (value: number) => string;
  label: string;
}) {
  const hasData = data.some((datum) => datum.amount !== 0);

  if (!hasData) return <EmptyChartState description={description} />;

  return (
    <div className="h-[230px]" aria-label={label}>
      <ResponsiveContainer height="100%" width="100%">
        <AreaChart data={data} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="financial-chart-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={color} stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#EEF2F7" strokeDasharray="3 4" vertical={false} />
          <XAxis
            dataKey="date"
            axisLine={false}
            tick={{ fill: "#94A3B8", fontSize: 10 }}
            tickLine={false}
          />
          <YAxis
            axisLine={false}
            tick={{ fill: "#94A3B8", fontSize: 10 }}
            tickFormatter={(value: number) => formatCompactNumber(value)}
            tickLine={false}
          />
          <Tooltip content={<FinancialChartTooltip formatValue={formatValue} />} cursor={{ stroke: "#CBD5E1" }} />
          <Area
            dataKey="amount"
            fill="url(#financial-chart-fill)"
            name={label}
            stroke={color}
            strokeWidth={2.5}
            type="monotone"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FinancialsView() {
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<FinancialMetricKey>("subscriptionRevenue");
  const mountedRef = useRef(true);

  const loadDashboard = useCallback(async () => {
    if (mountedRef.current) {
      setLoading(true);
      setError("");
    }

    try {
      const nextDashboard = await getAdminDashboardAnalytics();
      if (mountedRef.current) setDashboard(nextDashboard);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Không thể tải dữ liệu tài chính";
      if (mountedRef.current) {
        setError(message);
        toast.error(message);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void loadDashboard();
    return () => {
      mountedRef.current = false;
    };
  }, [loadDashboard]);

  const marketplaceCommission = useMemo(
    () => (dashboard?.charts.marketplaceCommissionByDay ?? []).reduce(
      (total, point) => ({
        gross: total.gross + point.grossCommissionCoin,
        refunded: total.refunded + point.refundedCommissionCoin,
        net: total.net + point.netCommissionCoin,
      }),
      { gross: 0, refunded: 0, net: 0 },
    ),
    [dashboard],
  );

  const chartMetrics = useMemo(() => {
    const revenueData = (dashboard?.charts.revenueByDay ?? []).map((point) => ({
      date: formatChartDate(point.date),
      amount: point.amount ?? 0,
    }));
    const topUpData = (dashboard?.charts.coinTopUpByDay ?? []).map((point) => ({
      date: formatChartDate(point.date),
      amount: point.amount ?? 0,
    }));
    const commissionData = (dashboard?.charts.marketplaceCommissionByDay ?? []).map((point) => ({
      date: formatChartDate(point.date),
      amount: point.netCommissionCoin ?? 0,
    }));

    return {
      subscriptionRevenue: {
        color: ACCENT,
        data: revenueData,
        description: "Chỉ tính các thanh toán subscription đã thành công.",
        formatValue: formatCurrency,
        label: "Doanh thu dịch vụ",
      },
      coinTopUp: {
        color: "#2563EB",
        data: topUpData,
        description: "Dòng tiền người dùng nạp vào ví Coin, được theo dõi riêng khỏi doanh thu.",
        formatValue: formatCurrency,
        label: "Tiền nạp Coin",
      },
      marketplaceCommission: {
        color: "#059669",
        data: commissionData,
        description: "Hoa hồng Marketplace ròng, sau các điều chỉnh hoàn tiền trong khoảng đang xem.",
        formatValue: formatCoin,
        label: "Hoa hồng Marketplace",
      },
    } satisfies Record<FinancialMetricKey, {
      color: string;
      data: FinancialChartDatum[];
      description: string;
      formatValue: (value: number) => string;
      label: string;
    }>;
  }, [dashboard]);

  if (loading && !dashboard) {
    return (
      <div className="space-y-5" aria-busy="true">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white" />
          ))}
        </div>
        <div className="grid gap-5 xl:grid-cols-5">
          <div className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-white xl:col-span-3" />
          <div className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-white xl:col-span-2" />
        </div>
      </div>
    );
  }

  if (error && !dashboard) {
    return (
      <section className="rounded-2xl border border-rose-200 bg-white p-10 text-center">
        <p className="text-base font-black text-rose-700">Không thể tải dữ liệu tài chính</p>
        <p className="mt-2 text-sm text-slate-500">{error}</p>
        <button
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#FF6B00] px-4 text-sm font-bold text-white hover:bg-[#EA580C]"
          onClick={() => void loadDashboard()}
          type="button"
        >
          <RefreshCw className="h-4 w-4" />
          Thử lại
        </button>
      </section>
    );
  }

  if (!dashboard) return null;

  const activeMetric = chartMetrics[selectedMetric];
  const activePlanCount = dashboard.subscriptions.free + dashboard.subscriptions.skillBuilder + dashboard.subscriptions.premium;
  const planDistribution = [
    { color: "#94A3B8", label: "Free", value: dashboard.subscriptions.free },
    { color: "#FB923C", label: "Skill Builder", value: dashboard.subscriptions.skillBuilder },
    { color: ACCENT, label: "Premium", value: dashboard.subscriptions.premium },
  ];
  const kpis = [
    {
      color: ACCENT,
      context: "Không gồm nạp Coin",
      icon: DollarSign,
      label: "Doanh thu gói dịch vụ",
      sparkline: chartMetrics.subscriptionRevenue.data.slice(-8).map((point) => point.amount),
      sub: `Hôm nay: ${formatCurrency(dashboard.overview.todayRevenue)}`,
      value: formatCurrency(dashboard.overview.totalRevenue),
    },
    {
      color: "#2563EB",
      context: "Tiền giữ hộ ví user",
      icon: Coins,
      label: "Tiền nạp Coin",
      sparkline: chartMetrics.coinTopUp.data.slice(-8).map((point) => point.amount),
      sub: `Tháng này: ${formatCurrency(dashboard.payments.coinTopUpThisMonth ?? 0)}`,
      value: formatCurrency(dashboard.payments.coinTopUpTotal ?? 0),
    },
    {
      color: "#059669",
      context: "Đã trừ phần hoàn tiền",
      icon: Activity,
      label: "Hoa hồng Marketplace",
      sparkline: chartMetrics.marketplaceCommission.data.slice(-8).map((point) => point.amount),
      sub: `Gross: ${formatCoin(marketplaceCommission.gross)}`,
      value: formatCoin(marketplaceCommission.net),
    },
    {
      color: "#7C3AED",
      context: `Free: ${dashboard.subscriptions.free.toLocaleString("vi-VN")}`,
      icon: UsersRound,
      label: "Gói đang hoạt động",
      sparkline: [
        dashboard.subscriptions.free,
        dashboard.subscriptions.skillBuilder,
        dashboard.subscriptions.premium,
        dashboard.subscriptions.active,
      ],
      sub: `Premium: ${dashboard.subscriptions.premium} · Builder: ${dashboard.subscriptions.skillBuilder}`,
      value: dashboard.overview.activeSubscriptions.toLocaleString("vi-VN"),
    },
  ];

  return (
    <motion.div animate={{ opacity: 1 }} className="space-y-5" initial={{ opacity: 0 }}>
      <section aria-label="Tổng quan tài chính" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <motion.article
              key={kpi.label}
              animate={{ opacity: 1, y: 0 }}
              className="relative min-h-40 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              initial={{ opacity: 0, y: 10 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${kpi.color}12`, color: kpi.color }}
                >
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-right text-[10px] font-bold text-slate-500">
                  {kpi.context}
                </span>
              </div>
              <p className="mt-4 text-2xl font-black tracking-[-0.045em] text-slate-950">{kpi.value}</p>
              <p className="mt-1 text-sm font-medium text-slate-600">{kpi.label}</p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <Sparkline color={kpi.color} data={kpi.sparkline} />
                <p className="max-w-28 text-right text-[10px] leading-4 text-slate-400">{kpi.sub}</p>
              </div>
            </motion.article>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-5">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:col-span-3">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Phân tích dòng tiền</p>
              <h2 className="mt-1 text-lg font-black tracking-[-0.025em] text-slate-950">Dòng tiền theo thời gian</h2>
            </div>
            <div aria-label="Chỉ số biểu đồ" className="inline-flex w-full rounded-xl bg-slate-100 p-1 sm:w-auto" role="tablist">
              {(
                [
                  ["subscriptionRevenue", "Doanh thu"],
                  ["coinTopUp", "Nạp Coin"],
                  ["marketplaceCommission", "Hoa hồng"],
                ] as const
              ).map(([metric, label]) => (
                <button
                  aria-selected={selectedMetric === metric}
                  className={`min-h-9 flex-1 rounded-lg px-3 text-xs font-bold transition-colors sm:flex-none ${selectedMetric === metric ? "bg-white text-[#FF6B00] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                  key={metric}
                  onClick={() => setSelectedMetric(metric)}
                  role="tab"
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="pt-5">
            <FinancialAreaChart {...activeMetric} />
          </div>
        </article>

        <article className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-sm sm:p-6 xl:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">Đối soát Marketplace</p>
              <h2 className="mt-1 text-lg font-black tracking-[-0.025em] text-slate-950">Hoa hồng ròng</h2>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
              <Building2 aria-hidden="true" className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-8 text-3xl font-black tracking-[-0.05em] text-emerald-700">{formatCoin(marketplaceCommission.net)}</p>
          <dl className="mt-6 space-y-3 border-y border-emerald-100 py-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Gross đã ghi nhận</dt>
              <dd className="font-black text-slate-800">{formatCoin(marketplaceCommission.gross)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Điều chỉnh hoàn tiền</dt>
              <dd className="font-black text-rose-600">{formatCoin(-marketplaceCommission.refunded)}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs leading-5 text-slate-500">Số liệu đối soát nội bộ, không phải số dư tài khoản ngân hàng có thể rút.</p>
          <button
            className="mt-5 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 text-sm font-bold text-emerald-700 hover:bg-emerald-50"
            onClick={() => document.getElementById("platform-treasury-ledger")?.scrollIntoView({ behavior: "smooth", block: "start" })}
            type="button"
          >
            Xem sổ chi tiết
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-5">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:col-span-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Tăng trưởng người dùng</p>
              <h2 className="mt-1 text-lg font-black tracking-[-0.025em] text-slate-950">Phân bổ gói người dùng</h2>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">
              {activePlanCount.toLocaleString("vi-VN")} tài khoản
            </span>
          </div>
          <div className="mt-6 space-y-5">
            {planDistribution.map((plan) => {
              const percentage = activePlanCount === 0 ? 0 : Math.round((plan.value / activePlanCount) * 100);
              return (
                <div key={plan.label}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-bold text-slate-700">{plan.label}</span>
                    <span className="text-slate-500">{plan.value.toLocaleString("vi-VN")} tài khoản ({percentage}%)</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full" style={{ backgroundColor: plan.color, width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:col-span-2">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Thanh toán</p>
          <h2 className="mt-1 text-lg font-black tracking-[-0.025em] text-slate-950">Tình trạng giao dịch</h2>
          <dl className="mt-6 divide-y divide-slate-100 border-y border-slate-100">
            {[
              { label: "Thành công", value: dashboard.payments.paid, tone: "text-emerald-600" },
              { label: "Đang chờ xử lý", value: dashboard.payments.pending, tone: "text-amber-600" },
              { label: "Thất bại", value: dashboard.payments.failed, tone: "text-rose-600" },
            ].map((stat) => (
              <div className="flex items-center justify-between py-3" key={stat.label}>
                <dt className="text-sm text-slate-500">{stat.label}</dt>
                <dd className={`text-sm font-black ${stat.tone}`}>{stat.value.toLocaleString("vi-VN")}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs leading-5 text-slate-500">Bao gồm thanh toán gói dịch vụ và các giao dịch nạp Coin.</p>
        </article>
      </section>

      <PlatformTreasurySection />
    </motion.div>
  );
}

export default FinancialsView;

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, ArrowUpRight, Coins, DollarSign, Repeat } from "lucide-react";
import { toast } from "sonner";
import { getAdminDashboardAnalytics, type AdminDashboardResponse } from "../../../../../api/admin/adminDashboardService";
import { PlatformTreasurySection } from "./PlatformTreasurySection";

const ACCENT = "#FF6B00";

/* ─────────────────────────────────────────────────────────
   Mini Sparkline
───────────────────────────────────────────────────────── */
export function Sparkline({ data, color, width = 80, height = 28 }: { data: number[]; color: string; width?: number; height?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  const fillPts = `0,${height} ${pts} ${width},${height}`;
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPts} fill={`url(#sg-${color.replace("#", "")})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 3px ${color}80)` }} />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────
   Hàm Helper format tiền tệ chuẩn Việt Nam
───────────────────────────────────────────────────────── */
const formatCompactNumber = (value: number) => {
  const absoluteValue = Math.abs(value);
  if (absoluteValue < 1_000) return value.toLocaleString("vi-VN");
  const divisor = absoluteValue >= 1_000_000 ? 1_000_000 : 1_000;
  const suffix = divisor === 1_000_000 ? "M" : "K";
  const compact = value / divisor;
  return `${compact.toLocaleString("en-US", { maximumFractionDigits: 1 })}${suffix}`;
};

const formatCurrency = (value: number) => `${formatCompactNumber(value)} ₫`;
const formatCoin = (value: number) => `${formatCompactNumber(value)} Coin`;

// Hàm xử lý chuỗi ngày tháng thông minh từ Backend gửi ra trục X
const formatChartDate = (dateStr: string) => {
  if (!dateStr) return "";
  // Nếu chuỗi có dạng định dạng chuẩn yyyy-MM-dd, ta cắt lấy MM-dd
  if (dateStr.includes("-") && dateStr.length >= 10) {
    const parts = dateStr.split("-");
    return `${parts[1]}-${parts[2]}`; // Trả về dạng MM-dd
  }
  return dateStr; // Dữ liệu fallback nếu BE đã tự tối ưu sẵn chuỗi ngắn
};

/* ─────────────────────────────────────────────────────────
   Custom Tooltip hiển thị tiền tệ lung linh
───────────────────────────────────────────────────────── */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
      <p style={{ color: "#9CA3AF", fontSize: "11px", marginBottom: "6px", fontWeight: 700 }}>Ngày: {label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || p.fill, fontSize: "13px", fontWeight: 700 }}>
          {p.name}: {p.value?.toLocaleString()} ₫
        </p>
      ))}
    </div>
  );
}

type FinancialChartDatum = {
  date: string;
  amount: number;
};

function FinancialAreaChart({
  title,
  description,
  data,
  color,
}: {
  title: string;
  description: string;
  data: FinancialChartDatum[];
  color: string;
}) {
  const tickFormatter = (value: number) => {
    return value >= 1_000_000 ? `${(value / 1_000_000).toFixed(1)}M` : `${Math.round(value / 1_000)}K`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-6"
      style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
    >
      <div className="mb-5">
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#9CA3AF", letterSpacing: "0.12em" }}>{title}</p>
        <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#111827" }}>{description}</p>
      </div>
      <div style={{ height: "220px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -5, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="date" stroke="#E5E7EB" tick={{ fill: "#9CA3AF", fontSize: 10 }} />
            <YAxis stroke="#F3F4F6" tick={{ fill: "#9CA3AF", fontSize: 10 }} tickFormatter={tickFormatter} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="amount" name={title}
              stroke={color} strokeWidth={2.5} fill={color} fillOpacity={0.12} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   ── FINANCIALS view ──
───────────────────────────────────────────────────────── */
export function FinancialsView() {
  const [dashData, setDashData] = useState<AdminDashboardResponse | null>(null);
  const [dashLoading, setDashLoading] = useState(true);
  const [dashError, setDashError] = useState("");

  function fetchDash() {
    setDashLoading(true);
    setDashError("");
    getAdminDashboardAnalytics()
      .then(setDashData)
      .catch((err: Error) => {
        const msg = err.message || "Không tải được dữ liệu tài chính";
        setDashError(msg);
        toast.error(msg);
      })
      .finally(() => setDashLoading(false));
  }

  useEffect(() => {
    let mounted = true;
    setDashLoading(true);
    getAdminDashboardAnalytics()
      .then((d) => { if (mounted) setDashData(d); })
      .catch((err: Error) => {
        if (!mounted) return;
        const msg = err.message || "Không tải được dữ liệu tài chính";
        setDashError(msg);
        toast.error(msg);
      })
      .finally(() => { if (mounted) setDashLoading(false); });
    return () => { mounted = false; };
  }, []);

  if (dashLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-5 animate-pulse"
              style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", height: 130 }}>
              <div className="h-3 rounded w-1/2 mb-3" style={{ background: "#F3F4F6" }} />
              <div className="h-7 rounded w-3/4 mb-2" style={{ background: "#F3F4F6" }} />
              <div className="h-2 rounded w-full" style={{ background: "#F3F4F6" }} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
          <div className="xl:col-span-3 animate-pulse rounded-2xl"
            style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", height: 420 }} />
          <div className="xl:col-span-2 animate-pulse rounded-2xl"
            style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", height: 420 }} />
        </div>
      </motion.div>
    );
  }

  if (dashError && !dashData) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="rounded-2xl p-10 text-center"
        style={{ background: "#FFFFFF", border: "1px solid #FCA5A5" }}>
        <p style={{ color: "#B91C1C", fontWeight: 700, marginBottom: 4 }}>Không tải được dữ liệu tài chính</p>
        <p style={{ color: "#6B7280", fontSize: "0.82rem", marginBottom: 16 }}>{dashError}</p>
        <button onClick={fetchDash}
          className="px-4 py-2 rounded-xl text-xs font-semibold"
          style={{ background: ACCENT, color: "#fff" }}>
          Thử lại
        </button>
      </motion.div>
    );
  }

  /* ---------- Mapping dữ liệu thẻ KPI ---------- */
  const kpiCards = dashData ? [
    {
      id: "subscription-revenue",
      label: "Doanh thu gói dịch vụ",
      value: formatCurrency(dashData.overview.totalRevenue),
      sub: `Hôm nay: ${formatCurrency(dashData.overview.todayRevenue)}`,
      context: "Không gồm nạp Coin",
      color: "#FF6B00",
      icon: DollarSign,
      sparkline: dashData.charts.revenueByDay.slice(-9).map(d => d.amount ?? 0),
    },
    {
      id: "coin-top-up",
      label: "Tiền nạp Coin",
      value: formatCurrency(dashData.payments.coinTopUpTotal ?? 0),
      sub: `Tháng này: ${formatCurrency(dashData.payments.coinTopUpThisMonth ?? 0)}`,
      context: "Tiền giữ hộ ví user",
      color: "#2563EB",
      icon: Coins,
      sparkline: (dashData.charts.coinTopUpByDay ?? []).slice(-9).map(d => d.amount ?? 0),
    },
    {
      id: "active-subs",
      label: "Subscription hoạt động",
      value: dashData.overview.activeSubscriptions.toLocaleString(),
      sub: `Premium: ${dashData.subscriptions.premium} · Builder: ${dashData.subscriptions.skillBuilder}`,
      context: `Free: ${dashData.subscriptions.free}`,
      color: "#F97316",
      icon: Repeat,
      sparkline: [
        dashData.subscriptions.free,
        dashData.subscriptions.skillBuilder,
        dashData.subscriptions.premium,
        dashData.subscriptions.active,
      ],
    },
    {
      id: "marketplace-commission",
      label: "Hoa hồng Marketplace",
      value: formatCoin((dashData.charts.marketplaceCommissionByDay ?? []).reduce((sum, point) => sum + point.netCommissionCoin, 0)),
      sub: "Số ròng trong khoảng dữ liệu đang xem",
      context: "Đã trừ phần hoàn tiền",
      color: "#059669",
      icon: Activity,
      sparkline: (dashData.charts.marketplaceCommissionByDay ?? []).slice(-9).map(d => d.netCommissionCoin ?? 0),
    },
  ] : [];

  // 🟢 Đã sửa: Map trục X an toàn bằng hàm formatChartDate giải quyết lỗi phẳng 0K
  const revenueChartData = (dashData?.charts.revenueByDay ?? []).map(d => ({
    date: formatChartDate(d.date),
    amount: d.amount ?? 0,
  }));

  const coinTopUpChartData = (dashData?.charts.coinTopUpByDay ?? []).map(d => ({
    date: formatChartDate(d.date),
    amount: d.amount ?? 0,
  }));

  const marketplaceCommission = (dashData?.charts.marketplaceCommissionByDay ?? []).reduce(
    (total, point) => ({
      gross: total.gross + point.grossCommissionCoin,
      refunded: total.refunded + point.refundedCommissionCoin,
      net: total.net + point.netCommissionCoin,
    }),
    { gross: 0, refunded: 0, net: 0 },
  );

  const usersChartData = (dashData?.charts.newUsersByDay ?? []).map(d => ({
    date: formatChartDate(d.date),
    count: d.count ?? 0,
  }));

  const summaryStats = dashData ? [
    {
      label: "Doanh thu gói dịch vụ",
      value: formatCurrency(dashData.payments.revenueTotal),
      color: "#22c55e",
      sub: `Hôm nay: ${formatCurrency(dashData.payments.revenueToday)}`,
    },
    {
      label: "Tiền nạp Coin tháng này",
      value: formatCurrency(dashData.payments.coinTopUpThisMonth ?? 0),
      color: "#2563EB",
      sub: "Không tính là doanh thu gói",
    },
    {
      label: "Hoa hồng Marketplace",
      value: formatCoin(marketplaceCommission.net),
      color: "#059669",
      sub: `Gross: ${formatCoin(marketplaceCommission.gross)} · Hoàn: ${formatCoin(marketplaceCommission.refunded)}`,
    },
    {
      label: "Giao dịch thanh toán thành công",
      value: String(dashData.payments.paid),
      color: "#d97706",
      sub: "Bao gồm gói dịch vụ và nạp Coin",
    },
  ] : [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => {
          const Icon = kpi.icon;
          const sparkData = kpi.sparkline.length >= 2 ? kpi.sparkline : [0, 1];
          return (
            <motion.div key={kpi.id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="relative rounded-2xl p-5 overflow-hidden"
              style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none"
                style={{ background: `radial-gradient(circle, ${kpi.color}10 0%, transparent 70%)`, transform: "translate(30%,-30%)" }} />
              <div className="flex items-start justify-between mb-3 relative z-10">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: `${kpi.color}10`, border: `1px solid ${kpi.color}22` }}>
                  <Icon size={14} style={{ color: kpi.color }} />
                </div>
                <div className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "#F8FAFC", color: "#64748B", border: "1px solid #E2E8F0", fontWeight: 700 }}>
                  {kpi.context}
                </div>
              </div>
              <p className="relative z-10 mb-0.5"
                style={{ fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-0.05em", lineHeight: 1, color: "#111827" }}>
                {kpi.value}
              </p>
              <p className="relative z-10 text-xs mb-3" style={{ color: "#6B7280" }}>{kpi.label}</p>
              <div className="relative z-10 flex items-end justify-between">
                <Sparkline data={sparkData} color={kpi.color} width={75} height={26} />
                <p style={{ fontSize: "9px", color: "#9CA3AF", textAlign: "right", maxWidth: 90 }}>{kpi.sub}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="xl:col-span-3 space-y-5">

          <FinancialAreaChart
            title="Doanh thu gói dịch vụ"
            description="Chỉ ghi nhận thanh toán subscription thành công"
            data={revenueChartData}
            color={ACCENT}
          />

          <FinancialAreaChart
            title="Tiền nạp Coin"
            description="Dòng tiền người dùng nạp vào ví Coin — tách riêng khỏi doanh thu gói"
            data={coinTopUpChartData}
            color="#2563EB"
          />

          {/* Người dùng mới theo ngày */}
          {usersChartData.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
              className="rounded-2xl p-6" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#9CA3AF", letterSpacing: "0.12em" }}>Người dùng mới</p>
                  <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#111827" }}>Đăng ký theo ngày</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
                  style={{ background: "rgba(6,182,212,0.08)", color: "#0891b2", border: "1px solid rgba(6,182,212,0.2)", fontWeight: 700 }}>
                  <ArrowUpRight size={11} /> {dashData?.overview.totalUsers.toLocaleString()} Tổng số
                </div>
              </div>
              <div style={{ height: "200px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={usersChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="date" stroke="#E5E7EB" tick={{ fill: "#9CA3AF", fontSize: 10 }} />
                    <YAxis stroke="#F3F4F6" tick={{ fill: "#9CA3AF", fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="count" name="Người dùng mới"
                      stroke="#06b6d4" strokeWidth={2} fill="#06b6d4" fillOpacity={0.1} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </div>

        {/* Tóm tắt chỉ số phụ + Phân bổ gói */}
        <div className="xl:col-span-2 space-y-5">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="grid grid-cols-2 gap-3">
            {summaryStats.map(s => (
              <div key={s.label} className="rounded-xl p-4"
                style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <p style={{ fontSize: "9px", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>{s.label}</p>
                <p style={{ fontWeight: 800, fontSize: "1.25rem", color: s.color, letterSpacing: "-0.04em", lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: "10px", color: "#9CA3AF", marginTop: "4px" }}>{s.sub}</p>
              </div>
            ))}
          </motion.div>

          {dashData && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
              className="rounded-xl p-5"
              style={{ background: "#F8FAFC", border: "1px solid #DCE7F5" }}
            >
              <p style={{ fontSize: "11px", color: "#2563EB", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                Sổ đối soát Marketplace
              </p>
              <p style={{ fontWeight: 800, fontSize: "1.35rem", color: "#065F46", letterSpacing: "-0.04em" }}>
                {formatCoin(marketplaceCommission.net)}
              </p>
              <div className="mt-3 space-y-1.5" style={{ fontSize: "11px", color: "#64748B" }}>
                <p className="flex justify-between gap-4"><span>Hoa hồng ghi nhận</span><strong style={{ color: "#0F766E" }}>{formatCoin(marketplaceCommission.gross)}</strong></p>
                <p className="flex justify-between gap-4"><span>Điều chỉnh hoàn tiền</span><strong style={{ color: "#E11D48" }}>−{formatCoin(marketplaceCommission.refunded)}</strong></p>
              </div>
              <p className="mt-3" style={{ fontSize: "10px", lineHeight: 1.5, color: "#94A3B8" }}>
                Đây là sổ đối soát commission từ giao dịch Marketplace, không phải số dư tài khoản ngân hàng hay “ví hệ thống” có thể chi trả.
              </p>
            </motion.div>
          )}

          {/* Phân bổ các gói Subs */}
          {dashData && (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="rounded-xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
              <p style={{ fontSize: "11px", color: "#9CA3AF", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Phân bổ gói người dùng</p>
              {[
                { label: "Free", value: dashData.subscriptions.free, color: "#94A3B8" },
                { label: "Skill Builder", value: dashData.subscriptions.skillBuilder, color: "#FB923C" },
                { label: "Premium", value: dashData.subscriptions.premium, color: ACCENT },
              ].map(tier => {
                const tierTotal = dashData.subscriptions.free + dashData.subscriptions.skillBuilder + dashData.subscriptions.premium || 1;
                const pct = Math.round((tier.value / tierTotal) * 100);
                return (
                  <div key={tier.label} className="mb-4 last:mb-0">
                    <div className="flex justify-between mb-1.5">
                      <span style={{ fontSize: "12px", color: "#374151", fontWeight: 600 }}>{tier.label}</span>
                      <span style={{ fontSize: "12px", color: "#6B7280", fontWeight: 500 }}>{tier.value.toLocaleString()} tài khoản ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: "#F3F4F6" }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: tier.color }} />
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>
      <PlatformTreasurySection />
    </motion.div>
  );
}

export default FinancialsView;

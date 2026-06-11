import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, ArrowUpRight, DollarSign, Repeat, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { getAdminDashboardAnalytics, type AdminDashboardResponse } from "../../../api/adminDashboardService";

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


export const USER_GROWTH_DATA = [
  { week: "W1", total: 148, organic: 90, paid: 38, referral: 20 },
  { week: "W2", total: 290, organic: 170, paid: 75, referral: 45 },
  { week: "W3", total: 440, organic: 255, paid: 110, referral: 75 },
  { week: "W4", total: 620, organic: 350, paid: 160, referral: 110 },
  { week: "W5", total: 810, organic: 450, paid: 210, referral: 150 },
  { week: "W6", total: 1020, organic: 560, paid: 265, referral: 195 },
  { week: "W7", total: 1230, organic: 665, paid: 310, referral: 255 },
  { week: "W8", total: 1410, organic: 760, paid: 345, referral: 305 },
  { week: "W9", total: 1560, organic: 830, paid: 368, referral: 362 },
  { week: "W10", total: 1680, organic: 883, paid: 378, referral: 419 },
  { week: "W11", total: 1760, organic: 915, paid: 382, referral: 463 },
  { week: "W12", total: 1840, organic: 940, paid: 385, referral: 515 },
];

const UNIT_ECON_DATA = [
  { label: "CAC", value: 40000, fill: "#475569" },
  { label: "LTV", value: 408000, fill: "#FF6B00" },
];


/* ─────────────────────────────────────────────────────────
   Custom Tooltip
───────────────────────────────────────────────────────── */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
      <p style={{ color: "#9CA3AF", fontSize: "11px", marginBottom: "6px" }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || p.fill, fontSize: "12px", fontWeight: 600 }}>
          {p.name}: {typeof p.value === "number" && p.value > 10000 ? `${(p.value / 1000).toFixed(0)}K ₫` : p.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Custom bar shape for unit economics
───────────────────────────────────────────────────────── */
function UnitEconBar(props: any) {
  const { x, y, width, height, label } = props;
  const isLTV = label === "LTV";
  return (
    <rect x={x} y={y} width={width} height={height}
      fill={isLTV ? ACCENT : "#94A3B8"}
      rx={6} ry={6}
      style={{ filter: isLTV ? "drop-shadow(0 0 10px rgba(255,107,0,0.45))" : "none" }}
    />
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

  /* ---------- loading skeleton ---------- */
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

  /* ---------- error state ---------- */
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

  /* ---------- derived KPI cards ---------- */
  const kpiCards = dashData ? [
    {
      id: "total-revenue",
      label: "Tổng doanh thu",
      value: `${(dashData.overview.totalRevenue / 1_000_000).toFixed(1)}M ₫`,
      sub: `Hôm nay: ${(dashData.overview.todayRevenue / 1_000).toFixed(0)}K ₫`,
      delta: `${dashData.overview.paidUsers} trả phí`,
      color: "#FF6B00",
      icon: DollarSign,
      sparkline: dashData.charts.revenueByDay.slice(-9).map(d => d.revenue ?? 0),
    },
    {
      id: "month-revenue",
      label: "Doanh thu tháng này",
      value: `${(dashData.payments.revenueThisMonth / 1_000_000).toFixed(1)}M ₫`,
      sub: `${dashData.payments.paid}/${dashData.payments.total} giao dịch`,
      delta: `+${dashData.payments.paid} OK`,
      color: "#FB923C",
      icon: TrendingUp,
      sparkline: dashData.charts.revenueByDay.slice(-9).map(d => (d.revenue ?? 0) * 0.85),
    },
    {
      id: "active-subs",
      label: "Subscription hoạt động",
      value: dashData.overview.activeSubscriptions.toLocaleString(),
      sub: `Premium: ${dashData.subscriptions.premium} · Builder: ${dashData.subscriptions.skillBuilder}`,
      delta: `Free: ${dashData.subscriptions.free}`,
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
      id: "paid-users",
      label: "Người dùng trả phí",
      value: dashData.overview.paidUsers.toLocaleString(),
      sub: `Tổng tài khoản: ${dashData.overview.totalUsers.toLocaleString()}`,
      delta: `${dashData.overview.activeUsers} đang hoạt động`,
      color: "#EA580C",
      icon: Activity,
      sparkline: dashData.charts.newUsersByDay.slice(-9).map(d => d.count ?? 0),
    },
  ] : [];

  const revenueChartData = (dashData?.charts.revenueByDay ?? []).map(d => ({
    date: d.date?.slice(5) ?? d.date,
    revenue: d.revenue ?? 0,
  }));

  const usersChartData = (dashData?.charts.newUsersByDay ?? []).map(d => ({
    date: d.date?.slice(5) ?? d.date,
    count: d.count ?? 0,
  }));

  const summaryStats = dashData ? [
    {
      label: "Tổng doanh thu",
      value: `${(dashData.payments.revenueTotal / 1_000_000).toFixed(1)}M ₫`,
      color: "#22c55e",
      sub: `Hôm nay: ${(dashData.payments.revenueToday / 1_000).toFixed(0)}K ₫`,
    },
    {
      label: "Người dùng hoạt động",
      value: dashData.overview.activeUsers.toLocaleString(),
      color: "#06b6d4",
      sub: `Tổng: ${dashData.overview.totalUsers.toLocaleString()} tài khoản`,
    },
    {
      label: "Thanh toán đang chờ",
      value: String(dashData.overview.pendingPayments),
      color: dashData.overview.pendingPayments > 0 ? "#f59e0b" : "#FF6B00",
      sub: `Thất bại: ${dashData.overview.failedPayments}`,
    },
    {
      label: "Tháng này",
      value: `${(dashData.payments.revenueThisMonth / 1_000_000).toFixed(1)}M ₫`,
      color: "#d97706",
      sub: `${dashData.payments.paid} giao dịch thành công`,
    },
  ] : [];

  /* ---------- render ---------- */
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
                <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(34,197,94,0.08)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.2)", fontWeight: 700 }}>
                  <ArrowUpRight size={10} /> {kpi.delta}
                </div>
              </div>
              <p className="relative z-10 mb-0.5"
                style={{ fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-0.05em", lineHeight: 1, color: "#111827" }}>
                {kpi.value}
              </p>
              <p className="relative z-10 text-xs mb-3" style={{ color: "#6B7280" }}>{kpi.label}</p>
              <div className="relative z-10 flex items-end justify-between">
                <Sparkline data={sparkData} color={kpi.color} width={75} height={26} />
                <p style={{ fontSize: "9px", color: "#9CA3AF", textAlign: "right", maxWidth: 80 }}>{kpi.sub}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="xl:col-span-3 space-y-5">

          {/* Revenue by Day */}
          {revenueChartData.length > 0 ? (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="rounded-2xl p-6" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#9CA3AF", letterSpacing: "0.12em" }}>Doanh thu theo ngày</p>
                  <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#111827" }}>Biểu đồ doanh thu</p>
                </div>
              </div>
              <div style={{ height: "180px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="date" stroke="#E5E7EB" tick={{ fill: "#9CA3AF", fontSize: 10 }} />
                    <YAxis stroke="#F3F4F6" tick={{ fill: "#9CA3AF", fontSize: 10 }} tickFormatter={(v) => `${(v / 1_000).toFixed(0)}K`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="revenue" name="Doanh thu (₫)"
                      stroke={ACCENT} strokeWidth={2} fill={ACCENT} fillOpacity={0.12} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          ) : (
            /* Fallback: static CAC/LTV when no time-series data yet */
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="rounded-2xl p-6" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#9CA3AF", letterSpacing: "0.12em" }}>Hiệu quả đơn vị</p>
                  <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#111827" }}>CAC vs LTV</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
                  style={{ background: "rgba(34,197,94,0.08)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.2)", fontWeight: 700 }}>
                  LTV/CAC: 10.2×
                </div>
              </div>
              <div style={{ height: "180px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[{ label: "CAC", value: 40000, name: "CAC" }, { label: "LTV", value: 408000, name: "LTV" }]}
                    margin={{ top: 10, right: 20, left: 10, bottom: 5 }} barCategoryGap="50%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="label" stroke="#E5E7EB" tick={{ fill: "#6B7280", fontSize: 12, fontWeight: 600 }} />
                    <YAxis stroke="#F3F4F6" tick={{ fill: "#9CA3AF", fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="value" shape={<UnitEconBar />} radius={[6, 6, 0, 0]}>
                      {UNIT_ECON_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* New Users by Day */}
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
                  <ArrowUpRight size={11} /> {dashData?.overview.totalUsers.toLocaleString()} total
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

        {/* Summary stats + subscription breakdown */}
        <div className="xl:col-span-2 space-y-5">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="grid grid-cols-2 gap-3">
            {summaryStats.map(s => (
              <div key={s.label} className="rounded-xl p-4"
                style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <p style={{ fontSize: "9px", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>{s.label}</p>
                <p style={{ fontWeight: 800, fontSize: "1.25rem", color: s.color, letterSpacing: "-0.04em", lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: "10px", color: "#D1D5DB", marginTop: "2px" }}>{s.sub}</p>
              </div>
            ))}
          </motion.div>

          {/* Subscription plan breakdown */}
          {dashData && (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="rounded-xl p-4" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
              <p style={{ fontSize: "11px", color: "#9CA3AF", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Phân bổ gói</p>
              {[
                { label: "Free", value: dashData.subscriptions.free, color: "#94A3B8" },
                { label: "Skill Builder", value: dashData.subscriptions.skillBuilder, color: "#FB923C" },
                { label: "Premium", value: dashData.subscriptions.premium, color: ACCENT },
              ].map(tier => {
                const tierTotal = dashData.subscriptions.free + dashData.subscriptions.skillBuilder + dashData.subscriptions.premium || 1;
                const pct = Math.round((tier.value / tierTotal) * 100);
                return (
                  <div key={tier.label} className="mb-3">
                    <div className="flex justify-between mb-1">
                      <span style={{ fontSize: "12px", color: "#374151", fontWeight: 600 }}>{tier.label}</span>
                      <span style={{ fontSize: "12px", color: "#6B7280" }}>{tier.value.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "#F3F4F6" }}>
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
    </motion.div>
  );
}

export default FinancialsView;

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
import { getAdminDashboardAnalytics, type AdminDashboardResponse } from "../../../../../api/adminDashboardService";

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

const UNIT_ECON_DATA = [
  { label: "CAC", value: 40000, fill: "#475569" },
  { label: "LTV", value: 408000, fill: "#FF6B00" },
];

/* ─────────────────────────────────────────────────────────
   Hàm Helper format tiền tệ chuẩn Việt Nam
───────────────────────────────────────────────────────── */
const formatCurrency = (value: number) => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M ₫`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K ₫`;
  }
  return `${value} ₫`;
};

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
      id: "total-revenue",
      label: "Tổng doanh thu",
      value: formatCurrency(dashData.overview.totalRevenue),
      sub: `Hôm nay: ${formatCurrency(dashData.overview.todayRevenue)}`,
      delta: `${dashData.overview.paidUsers} trả phí`,
      color: "#FF6B00",
      icon: DollarSign,
      sparkline: dashData.charts.revenueByDay.slice(-9).map(d => d.revenue ?? 0),
    },
    {
      id: "month-revenue",
      label: "Doanh thu tháng này",
      value: formatCurrency(dashData.payments.revenueThisMonth),
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

  // 🟢 Đã sửa: Map trục X an toàn bằng hàm formatChartDate giải quyết lỗi phẳng 0K
  const revenueChartData = (dashData?.charts.revenueByDay ?? []).map(d => ({
    date: formatChartDate(d.date),
    revenue: d.revenue ?? 0,
  }));

  const usersChartData = (dashData?.charts.newUsersByDay ?? []).map(d => ({
    date: formatChartDate(d.date),
    count: d.count ?? 0,
  }));

  const summaryStats = dashData ? [
    {
      label: "Tổng doanh thu",
      value: formatCurrency(dashData.payments.revenueTotal),
      color: "#22c55e",
      sub: `Hôm nay: ${formatCurrency(dashData.payments.revenueToday)}`,
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
      value: formatCurrency(dashData.payments.revenueThisMonth),
      color: "#d97706",
      sub: `${dashData.payments.paid} giao dịch thành công`,
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
                <p style={{ fontSize: "9px", color: "#9CA3AF", textAlign: "right", maxWidth: 90 }}>{kpi.sub}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="xl:col-span-3 space-y-5">

          {/* 🟢 BIỂU ĐỒ DOANH THU THỰC TẾ ĐÃ ĐƯỢC FIX LỖI 0K */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="rounded-2xl p-6" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#9CA3AF", letterSpacing: "0.12em" }}>Doanh thu theo ngày</p>
                <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#111827" }}>Biểu đồ doanh thu thực tế</p>
              </div>
            </div>
            <div style={{ height: "220px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData} margin={{ top: 5, right: 10, left: -5, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="date" stroke="#E5E7EB" tick={{ fill: "#9CA3AF", fontSize: 10 }} />
                  {/* Format lại cột mốc tiền tệ cho mượt mắt */}
                  <YAxis stroke="#F3F4F6" tick={{ fill: "#9CA3AF", fontSize: 10 }} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" name="Doanh thu"
                    stroke={ACCENT} strokeWidth={2.5} fill={ACCENT} fillOpacity={0.12} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

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
    </motion.div>
  );
}

export default FinancialsView;
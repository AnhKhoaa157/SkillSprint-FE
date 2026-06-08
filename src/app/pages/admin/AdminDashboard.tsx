import { useEffect, useState, useRef } from "react";
import { motion } from "motion/react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell,
} from "recharts";
import {
  TrendingUp,
  ArrowUpRight, Download,
  Activity, DollarSign, Repeat,
  GraduationCap, BookOpen, Award, ShieldCheck,
  Search, Command, X,
  MessageSquare,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "sonner";
import AdminHealth from "./AdminHealth";
import healthService from "../../../api/healthService";
import adminUserService from "../../../api/adminUserService";
import {
  getAdminDashboardAnalytics,
  getAdminPayments,
} from "../../../api/adminDashboardService";
import type {
  AdminDashboardResponse,
  PaymentTransactionResponse,
} from "../../../api/adminDashboardService";
import {
  getAdminFeedbacks,
  updateFeedbackStatus,
  type FeedbackResponse,
} from "../../../api/feedbackService";

const ACCENT = "#FF6B00";

function toCsv(rows: Record<string, string | number>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escapeCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
  const lines = [headers.join(",")];
  rows.forEach((row) => {
    lines.push(headers.map((h) => escapeCell(row[h] ?? "")).join(","));
  });
  return lines.join("\n");
}

function downloadCsv(filename: string, rows: Record<string, string | number>[]) {
  const csv = toCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/* ─────────────────────────────────────────────────────────
   Mini Sparkline
───────────────────────────────────────────────────────── */
function Sparkline({ data, color, width = 80, height = 28 }: { data: number[]; color: string; width?: number; height?: number }) {
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


const USER_GROWTH_DATA = [
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
function FinancialsView() {
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


/* ─────────────────────────────────────────────────────────
   ── PAYMENTS view ──
───────────────────────────────────────────────────────── */
const PAYMENT_STATUS_BADGE: Record<string, { bg: string; text: string; border: string; label: string }> = {
  PAID: { bg: "rgba(34,197,94,0.08)", text: "#15803D", border: "rgba(34,197,94,0.28)", label: "Thành công" },
  COMPLETED: { bg: "rgba(34,197,94,0.08)", text: "#15803D", border: "rgba(34,197,94,0.28)", label: "Hoàn thành" },
  PENDING: { bg: "rgba(245,158,11,0.10)", text: "#B45309", border: "rgba(245,158,11,0.28)", label: "Đang chờ" },
  FAILED: { bg: "rgba(239,68,68,0.10)", text: "#B91C1C", border: "rgba(239,68,68,0.28)", label: "Thất bại" },
  CANCELED: { bg: "#F3F4F6", text: "#6B7280", border: "#E5E7EB", label: "Đã hủy" },
  EXPIRED: { bg: "#F3F4F6", text: "#9CA3AF", border: "#E5E7EB", label: "Hết hạn" },
};

function paymentBadge(status: string) {
  return (
    PAYMENT_STATUS_BADGE[status.toUpperCase()] ?? {
      bg: "#F3F4F6", text: "#6B7280", border: "#E5E7EB", label: status,
    }
  );
}

const PLAN_LABEL: Record<string, string> = {
  FREE: "Free",
  SKILL_BUILDER: "Skill Builder",
  PREMIUM: "Premium",
};

const PAYMENTS_COLS = "2fr 1.2fr 1.2fr 1.4fr 1.3fr 1.5fr";

function PaymentsView() {
  const [payments, setPayments] = useState<PaymentTransactionResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const PAGE_SIZE = 10;

  async function load(p: number) {
    setLoading(true);
    try {
      const result = await getAdminPayments(p, PAGE_SIZE);
      const items = result.items ?? (result as any).content ?? [];
      const total = result.totalItems ?? (result as any).totalElements ?? 0;
      const pages = result.totalPages ?? Math.ceil(total / PAGE_SIZE);
      setPayments(items);
      setTotalItems(total);
      setTotalPages(pages);
      setPage(p);
    } catch (err) {
      toast.error((err as Error).message || "Không tải được danh sách thanh toán");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(0); }, []);

  const formatVnd = (amount: number) =>
    amount >= 1_000_000
      ? `${(amount / 1_000_000).toFixed(1)}M ₫`
      : `${(amount / 1_000).toFixed(0)}K ₫`;

  const formatDate = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })
      : "—";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

      {/* Header banner */}
      <div className="rounded-2xl p-5"
        style={{ background: "linear-gradient(135deg,#FFFFFF 0%,#F8FAFC 100%)", border: "1px solid #E2E8F0" }}>
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#0F172A" }}>Quản lý thanh toán</h2>
            <p style={{ margin: "4px 0 0", color: "#64748B", fontSize: "0.88rem" }}>Lịch sử giao dịch · Phân tích thanh toán</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs"
              style={{ background: "#fff", border: "1px solid #E5E7EB", color: "#334155" }}>
              Tổng: {totalItems.toLocaleString()}
            </span>
            <span className="px-3 py-1 rounded-full text-xs"
              style={{ background: "#fff", border: "1px solid #E5E7EB", color: "#334155" }}>
              Trang: {page + 1} / {totalPages || 1}
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>

        {/* Column headers */}
        <div className="grid px-6 py-2.5"
          style={{ gridTemplateColumns: PAYMENTS_COLS, borderBottom: "1px solid #F3F4F6", background: "#FAFAFA" }}>
          {["Mã giao dịch", "Gói", "Số tiền", "Trạng thái", "Thanh toán lúc", "Tạo lúc"].map(col => (
            <span key={col}
              style={{ color: "#9CA3AF", fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {col}
            </span>
          ))}
        </div>

        {/* Loading skeleton rows */}
        {loading && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="grid px-6 py-4 animate-pulse"
            style={{ gridTemplateColumns: PAYMENTS_COLS, borderBottom: "1px solid #F9FAFB", alignItems: "center" }}>
            {[0.8, 0.6, 0.5, 0.55, 0.6, 0.7].map((w, j) => (
              <div key={j} className="h-3 rounded" style={{ background: "#F3F4F6", width: `${w * 100}%` }} />
            ))}
          </div>
        ))}

        {/* Empty state */}
        {!loading && payments.length === 0 && (
          <div className="py-16 text-center">
            <DollarSign size={32} style={{ color: "#E5E7EB", margin: "0 auto 8px" }} />
            <p style={{ color: "#9CA3AF", fontSize: "0.85rem" }}>Không có giao dịch nào</p>
          </div>
        )}

        {/* Data rows */}
        {!loading && payments.map((tx, i) => {
          const badge = paymentBadge(tx.status);
          return (
            <motion.div key={tx.paymentId}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.025 }}
              className="grid px-6 py-3.5"
              style={{ gridTemplateColumns: PAYMENTS_COLS, borderBottom: "1px solid #F9FAFB", alignItems: "center" }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "#F9FAFB"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}>

              {/* Transaction ID */}
              <div>
                <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "#111827", fontFamily: "monospace" }}>
                  {tx.paymentId.slice(0, 8).toUpperCase()}…
                </p>
                {tx.paymentCode && (
                  <p style={{ fontSize: "0.68rem", color: "#9CA3AF" }}>{tx.paymentCode}</p>
                )}
              </div>

              {/* Plan */}
              <span style={{ fontSize: "0.78rem", color: "#374151", fontWeight: 500 }}>
                {PLAN_LABEL[tx.plan] ?? tx.plan}
              </span>

              {/* Amount */}
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#16a34a" }}>
                {formatVnd(tx.amount)}
              </span>

              {/* Status badge */}
              <span className="inline-flex items-center px-2 py-0.5 rounded-full font-semibold"
                style={{ background: badge.bg, color: badge.text, border: `1px solid ${badge.border}`, fontSize: "10px", width: "fit-content" }}>
                {badge.label}
              </span>

              {/* Paid at */}
              <span style={{ fontSize: "0.72rem", color: "#6B7280" }}>{formatDate(tx.paidAt)}</span>

              {/* Created at */}
              <span style={{ fontSize: "0.72rem", color: "#9CA3AF" }}>{formatDate(tx.createdAt)}</span>
            </motion.div>
          );
        })}

        {/* Pagination footer */}
        <div className="px-6 py-3 flex items-center justify-between"
          style={{ borderTop: "1px solid #F3F4F6", background: "#FAFAFA" }}>
          <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
            Trang {page + 1} · {totalItems.toLocaleString()} giao dịch
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => load(Math.max(0, page - 1))}
              disabled={page === 0 || loading}
              className="px-3 py-1.5 rounded-lg text-xs"
              style={{
                border: "1px solid #E2E8F0", background: "#fff", color: "#334155",
                opacity: page === 0 || loading ? 0.4 : 1,
                cursor: page === 0 || loading ? "not-allowed" : "pointer",
              }}>
              ← Trước
            </button>
            <button
              onClick={() => load(page + 1)}
              disabled={page + 1 >= totalPages || loading}
              className="px-3 py-1.5 rounded-lg text-xs"
              style={{
                border: "1px solid #E2E8F0", background: "#fff", color: "#334155",
                opacity: page + 1 >= totalPages || loading ? 0.4 : 1,
                cursor: page + 1 >= totalPages || loading ? "not-allowed" : "pointer",
              }}>
              Tiếp →
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   ── FEEDBACK VIEW ──
───────────────────────────────────────────────────────── */
const FEEDBACK_TYPE_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  BUG:         { label: "Bug",         color: "#DC2626", bg: "rgba(220,38,38,0.08)" },
  IMPROVEMENT: { label: "Cải tiến",    color: "#7C3AED", bg: "rgba(124,58,237,0.08)" },
  QUESTION:    { label: "Câu hỏi",     color: "#0284C7", bg: "rgba(2,132,199,0.08)" },
  OTHER:       { label: "Khác",        color: "#64748B", bg: "rgba(100,116,139,0.08)" },
};

const FEEDBACK_STATUS_LABEL: Record<string, { label: string; color: string; bg: string; border: string }> = {
  PENDING:   { label: "Chờ xử lý", color: "#B45309", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.28)" },
  REVIEWED:  { label: "Đã xem",    color: "#0284C7", bg: "rgba(2,132,199,0.08)",  border: "rgba(2,132,199,0.28)"  },
  RESOLVED:  { label: "Đã giải quyết", color: "#15803D", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.28)" },
  CLOSED:    { label: "Đã đóng",   color: "#64748B", bg: "rgba(100,116,139,0.08)", border: "rgba(100,116,139,0.28)" },
};

function FeedbackView() {
  const [feedbacks, setFeedbacks] = useState<FeedbackResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [selected, setSelected] = useState<FeedbackResponse | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [updating, setUpdating] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [statusDraft, setStatusDraft] = useState("");
  const PAGE_SIZE = 15;

  const load = async (p: number, status = statusFilter) => {
    setLoading(true);
    try {
      const res = await getAdminFeedbacks(p, PAGE_SIZE, status || undefined);
      setFeedbacks(res.content ?? []);
      setTotalItems(res.totalElements ?? 0);
      setTotalPages(res.totalPages ?? 0);
      setPage(p);
    } catch (err) {
      toast.error((err as Error).message || "Không tải được danh sách feedback");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(0); }, []);

  const handleSelect = (fb: FeedbackResponse) => {
    setSelected(fb);
    setStatusDraft(fb.status || "PENDING");
    setAdminNote(fb.adminNote || "");
  };

  const handleUpdate = async () => {
    if (!selected) return;
    setUpdating(true);
    try {
      const updated = await updateFeedbackStatus(selected.feedbackId, statusDraft, adminNote || undefined);
      setSelected(updated);
      setFeedbacks(prev => prev.map(fb => fb.feedbackId === updated.feedbackId ? updated : fb));
      toast.success("Cập nhật feedback thành công");
    } catch (err) {
      toast.error((err as Error).message || "Lỗi cập nhật");
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Header banner */}
      <div className="rounded-2xl p-5"
        style={{ background: "linear-gradient(135deg,#FFFFFF 0%,#F5F3FF 100%)", border: "1px solid #DDD6FE" }}>
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#0F172A" }}>Feedback người dùng</h2>
            <p style={{ margin: "4px 0 0", color: "#64748B", fontSize: "0.88rem" }}>Xem và xử lý phản hồi, báo lỗi từ người dùng</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs" style={{ background: "#fff", border: "1px solid #E5E7EB", color: "#334155" }}>
              Tổng: {totalItems}
            </span>
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); load(0, e.target.value); }}
              style={{ height: 32, padding: "0 10px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: "0.82rem", color: "#334155" }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xử lý</option>
              <option value="REVIEWED">Đã xem</option>
              <option value="RESOLVED">Đã giải quyết</option>
              <option value="CLOSED">Đã đóng</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Table */}
        <div className="xl:col-span-2 rounded-2xl overflow-hidden"
          style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div className="grid px-5 py-2.5"
            style={{ gridTemplateColumns: "2fr 1fr 1.2fr 1.2fr", borderBottom: "1px solid #F3F4F6", background: "#FAFAFA" }}>
            {["Người dùng / Tiêu đề", "Loại", "Trạng thái", "Thời gian"].map(col => (
              <span key={col} style={{ color: "#9CA3AF", fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {col}
              </span>
            ))}
          </div>

          {loading && Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="grid px-5 py-3.5 animate-pulse"
              style={{ gridTemplateColumns: "2fr 1fr 1.2fr 1.2fr", borderBottom: "1px solid #F9FAFB", alignItems: "center" }}>
              {[0.7, 0.4, 0.5, 0.55].map((w, j) => (
                <div key={j} className="h-3 rounded" style={{ background: "#F3F4F6", width: `${w * 100}%` }} />
              ))}
            </div>
          ))}

          {!loading && feedbacks.length === 0 && (
            <div className="py-16 text-center">
              <MessageSquare size={32} style={{ color: "#E5E7EB", margin: "0 auto 8px" }} />
              <p style={{ color: "#9CA3AF", fontSize: "0.85rem" }}>Không có feedback nào</p>
            </div>
          )}

          {!loading && feedbacks.map((fb, i) => {
            const typeInfo = FEEDBACK_TYPE_LABEL[fb.type] ?? FEEDBACK_TYPE_LABEL.OTHER;
            const statusInfo = FEEDBACK_STATUS_LABEL[fb.status] ?? FEEDBACK_STATUS_LABEL.PENDING;
            const isActive = selected?.feedbackId === fb.feedbackId;
            return (
              <motion.div key={fb.feedbackId}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                onClick={() => handleSelect(fb)}
                className="grid px-5 py-3 cursor-pointer"
                style={{
                  gridTemplateColumns: "2fr 1fr 1.2fr 1.2fr",
                  borderBottom: "1px solid #F9FAFB",
                  alignItems: "center",
                  background: isActive ? "#F5F3FF" : "#FFFFFF",
                  borderLeft: isActive ? "3px solid #7C3AED" : "3px solid transparent",
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "#F8FAFC"; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "#FFFFFF"; }}
              >
                <div className="min-w-0 pr-2">
                  <p style={{ fontWeight: 600, fontSize: "0.8rem", color: "#111827" }} className="truncate">{fb.title}</p>
                  <p style={{ fontSize: "0.7rem", color: "#9CA3AF" }} className="truncate">{fb.userFullName || fb.userEmail}</p>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold w-fit"
                  style={{ background: typeInfo.bg, color: typeInfo.color }}>
                  {typeInfo.label}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border w-fit"
                  style={{ background: statusInfo.bg, color: statusInfo.color, border: `1px solid ${statusInfo.border}` }}>
                  {statusInfo.label}
                </span>
                <span style={{ fontSize: "0.72rem", color: "#6B7280" }}>{formatDate(fb.createdAt)}</span>
              </motion.div>
            );
          })}

          {/* Pagination */}
          <div className="px-5 py-3 flex items-center justify-between"
            style={{ borderTop: "1px solid #F3F4F6", background: "#FAFAFA" }}>
            <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
              Trang {page + 1} · {totalItems} phản hồi
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => load(Math.max(0, page - 1))} disabled={page === 0 || loading}
                className="px-3 py-1.5 rounded-lg text-xs"
                style={{ border: "1px solid #E2E8F0", background: "#fff", color: "#334155", opacity: page === 0 || loading ? 0.4 : 1, cursor: page === 0 ? "not-allowed" : "pointer" }}>
                ← Trước
              </button>
              <button onClick={() => load(page + 1)} disabled={page + 1 >= totalPages || loading}
                className="px-3 py-1.5 rounded-lg text-xs"
                style={{ border: "1px solid #E2E8F0", background: "#fff", color: "#334155", opacity: page + 1 >= totalPages || loading ? 0.4 : 1, cursor: page + 1 >= totalPages ? "not-allowed" : "pointer" }}>
                Tiếp →
              </button>
            </div>
          </div>
        </div>

        {/* Detail panel */}
        <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: "0.95rem", fontWeight: 800, color: "#0F172A" }}>Chi tiết phản hồi</h3>
          {!selected ? (
            <p style={{ fontSize: "0.82rem", color: "#94A3B8" }}>Chọn một dòng để xem chi tiết và cập nhật.</p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl p-3" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                <p style={{ fontWeight: 700, fontSize: "0.88rem", color: "#0F172A" }}>{selected.title}</p>
                <p style={{ fontSize: "0.75rem", color: "#64748B", marginTop: 2 }}>{selected.userFullName} · {selected.userEmail}</p>
                <p style={{ fontSize: "0.72rem", color: "#9CA3AF", marginTop: 2 }}>ID: {selected.feedbackId.slice(0, 12)}…</p>
              </div>

              <div>
                <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B", marginBottom: 4 }}>Nội dung</p>
                <p style={{ fontSize: "0.82rem", color: "#374151", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{selected.content}</p>
              </div>

              {selected.relatedUrl && (
                <div>
                  <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B", marginBottom: 2 }}>URL liên quan</p>
                  <p style={{ fontSize: "0.75rem", color: "#7C3AED", wordBreak: "break-all" }}>{selected.relatedUrl}</p>
                </div>
              )}

              <div>
                <label style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 700, display: "block", marginBottom: 4 }}>Cập nhật trạng thái</label>
                <select value={statusDraft} onChange={e => setStatusDraft(e.target.value)}
                  style={{ width: "100%", height: 36, borderRadius: 8, border: "1px solid #E2E8F0", padding: "0 10px", fontSize: "0.82rem" }}>
                  <option value="PENDING">Chờ xử lý</option>
                  <option value="REVIEWED">Đã xem</option>
                  <option value="RESOLVED">Đã giải quyết</option>
                  <option value="CLOSED">Đã đóng</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 700, display: "block", marginBottom: 4 }}>Ghi chú Admin</label>
                <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={3}
                  placeholder="Thêm ghi chú phản hồi..."
                  style={{ width: "100%", borderRadius: 8, border: "1px solid #E2E8F0", padding: "8px 10px", fontSize: "0.82rem", resize: "vertical" }} />
              </div>

              <button onClick={handleUpdate} disabled={updating}
                className="w-full py-2 rounded-xl text-sm font-semibold"
                style={{ background: "#7C3AED", color: "#fff", opacity: updating ? 0.6 : 1, cursor: updating ? "not-allowed" : "pointer" }}>
                {updating ? "Đang lưu..." : "Lưu cập nhật"}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   Main Admin Dashboard
───────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const [activeNav, setActiveNav] = useState<"financials" | "users" | "payments" | "feedback">("financials");
  const [, setLastSync] = useState(new Date());
  const [actionMessage, setActionMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<{ fullName?: string; roles?: string[]; avatarUrl?: string } | null>(null);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [showHealthPanel, setShowHealthPanel] = useState(false);
  const [mgmtUsers, setMgmtUsers] = useState<any[]>([]);
  const [mgmtPage, setMgmtPage] = useState(0);
  const [mgmtSize] = useState(10);
  const [mgmtTotal, setMgmtTotal] = useState(0);
  const [mgmtLoading, setMgmtLoading] = useState(false);
  const [mgmtSelected, setMgmtSelected] = useState<any | null>(null);
  const [mgmtSearch, setMgmtSearch] = useState("");
  const [mgmtStatusDraft, setMgmtStatusDraft] = useState("");
  const [mgmtRolesDraft, setMgmtRolesDraft] = useState("");
  const [mgmtMessage, setMgmtMessage] = useState("");
  const navItems = [
    { id: "financials", label: "Tài chính", icon: TrendingUp },
    { id: "users", label: "Quản lý người dùng", icon: ShieldCheck },
    { id: "payments", label: "Quản lý thanh toán", icon: DollarSign },
    { id: "feedback", label: "Feedback người dùng", icon: MessageSquare },
  ] as const;

  const handleLogout = () => {
    logout();
    navigate("/admin-login", { replace: true });
  };

  async function loadMgmt(page = 0, searchTerm = mgmtSearch) {
    setMgmtLoading(true);
    try {
      console.log('[AdminDashboard] loadMgmt called', { page, searchTerm });
      const data = await adminUserService.getAdminUsers(searchTerm.trim() || undefined, page, mgmtSize);
      console.log('[AdminDashboard] API response data:', data);
      console.log('[AdminDashboard] data.content:', data.content, 'data.totalElements:', data.totalElements);
      setMgmtUsers(data.content || []);
      setMgmtTotal(data.totalElements || (data.content?.length ?? 0));
      setMgmtPage(page);
      setMgmtMessage("");
    } catch (e) {
      console.error(e);
      setMgmtMessage((e as Error).message || 'Không tải được danh sách admin users');
    } finally {
      setMgmtLoading(false);
    }
  }

  async function openMgmtDetail(userId: string) {
    console.log("[AdminDashboard] openMgmtDetail called with userId:", userId);
    setMgmtLoading(true);
    try {
      const detail = await adminUserService.getAdminUser(userId);
      setMgmtSelected(detail);
      setMgmtStatusDraft(detail.status || "ACTIVE");
      setMgmtRolesDraft(detail.role || "");
    } catch (e) {
      console.error(e);
      setMgmtMessage((e as Error).message || 'Không tải được chi tiết người dùng');
    } finally { setMgmtLoading(false); }
  }

  async function saveMgmtStatus(userId: string, status: string) {
    setMgmtLoading(true);
    try {
      const updated = await adminUserService.updateUserStatus(userId, { status });
      await loadMgmt(mgmtPage, mgmtSearch);
      setMgmtSelected(updated);
      setMgmtStatusDraft(updated.status || status);
      setMgmtMessage('Cập nhật trạng thái thành công');
    } catch (e) { setMgmtMessage((e as Error).message || 'Lỗi cập nhật trạng thái'); }
    finally { setMgmtLoading(false); }
  }

  async function saveMgmtRoles(userId: string, roles: string[]) {
    setMgmtLoading(true);
    try {
      const updated = await adminUserService.updateUserRole(userId, { roles });
      await loadMgmt(mgmtPage, mgmtSearch);
      setMgmtSelected(updated);
      setMgmtRolesDraft(updated.role || roles.join(", "));
      setMgmtMessage('Cập nhật vai trò thành công');
    } catch (e) { setMgmtMessage((e as Error).message || 'Lỗi cập nhật vai trò'); }
    finally { setMgmtLoading(false); }
  }
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const headerLabels: Record<string, { title: string; sub: string }> = {
    financials: { title: "Tài chính", sub: "Chỉ số doanh thu · Unit economics" },
    users: { title: "Quản lý người dùng", sub: "Quản lý người dùng và phân quyền" },
    payments: { title: "Quản lý thanh toán", sub: "Lịch sử giao dịch · Phân tích thanh toán" },
    feedback: { title: "Feedback người dùng", sub: "Xem và quản lý phản hồi từ người dùng" },
  };
  const current = headerLabels[activeNav];

  useEffect(() => {
    let mounted = true;
    import('../../../api/meService').then(mod => mod.getMe().then((me: any) => {
      if (!mounted) return;
      setCurrentUser(me);
    }).catch(() => { }));
    return () => { mounted = false; };
  }, []);

  const handleExport = () => {
    if (activeNav === "users") {
      downloadCsv("admin-users-cohorts.csv", mgmtUsers.map((user: any) => ({
        name: user.fullName || user.email || "-",
        role: user.role || "USER",
        status: user.status || "-",
        updatedAt: user.updatedAt || "-",
      })));
      setActionMessage("Đã xuất dữ liệu Quản lý người dùng.");
      return;
    }

    if (activeNav === "financials") {
      downloadCsv("admin-financials.csv", USER_GROWTH_DATA.map((point) => ({
        week: point.week,
        total: point.total,
        organic: point.organic,
        paid: point.paid,
        referral: point.referral,
      })));
      setActionMessage("Đã xuất dữ liệu Tài chính.");
      return;
    }

    if (activeNav === "payments") {
      setActionMessage("Xuất CSV giao dịch: sử dụng nút Xuất trong tab Quản lý thanh toán.");
      return;
    }
  };

  const handleSync = () => {
    setLastSync(new Date());
    setActionMessage("Đã đồng bộ dữ liệu admin thành công.");
  };


  const commandActions = [
    { id: "goto-users", label: "Đi tới Quản lý người dùng", keywords: "users students cohorts quản lý người dùng phân quyền", action: () => setActiveNav("users") },
    { id: "goto-financials", label: "Đi tới Tài chính", keywords: "finance revenue mrr", action: () => setActiveNav("financials") },
    { id: "goto-payments", label: "Đi tới Quản lý thanh toán", keywords: "payments transactions giao dịch thanh toán", action: () => setActiveNav("payments") },
    { id: "export", label: "Xuất dữ liệu màn hình hiện tại", keywords: "export csv download", action: handleExport },
    { id: "sync", label: "Đồng bộ dữ liệu admin", keywords: "sync refresh", action: handleSync },
  ];

  const filteredCommands = commandActions.filter((item) => {
    const normalized = `${item.label} ${item.keywords}`.toLowerCase();
    return normalized.includes(commandQuery.toLowerCase().trim());
  });

  const executeCommand = (id: string) => {
    const command = commandActions.find((entry) => entry.id === id);
    if (!command) return;
    command.action();
    setCommandOpen(false);
    setCommandQuery("");
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isTypingTarget = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";

      if (event.key === "/" && !isTypingTarget) {
        event.preventDefault();
        setCommandOpen(true);
      }

      if (event.key === "Escape") {
        setCommandOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Health subscription for admin sidebar
  const [healthStatus, setHealthStatus] = useState<'unknown' | 'up' | 'down'>('unknown');
  const [lastHealthPayload, setLastHealthPayload] = useState<any>(null);
  useEffect(() => {
    const off = healthService.subscribeHealth((s: any) => setHealthStatus(s));
    healthService.probeHealth().then((p) => setLastHealthPayload(p)).catch(() => { });
    return () => off();
  }, []);

  // Listen for external toggle (profile dropdown -> open management)
  useEffect(() => {
    const handler = (e: any) => {
      try {
        const page = e?.detail?.page ?? 0;
        loadMgmt(page, mgmtSearch);
        setActiveNav("users");
      } catch (err) {
        console.error('openAdminUserMgmt handler error', err);
      }
    };
    window.addEventListener('openAdminUserMgmt', handler as EventListener);
    return () => window.removeEventListener('openAdminUserMgmt', handler as EventListener);
  }, [mgmtSearch]);

  useEffect(() => {
    if (activeNav === 'users') {
      loadMgmt(0, mgmtSearch);
    }
  }, [activeNav]);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#F1F5F9", fontFamily: "'Inter', sans-serif", color: "#111827" }}
    >
      <style>{`
        @keyframes statusPulse { 0%,100%{opacity:1;}50%{opacity:0.4;} }
        @keyframes slideInFromRight { from { transform: translateX(8px) translateY(-6px); opacity: 0; } to { transform: translateX(0) translateY(0); opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 2px; }
      `}</style>

      {/* ── SIDEBAR ── */}
      <aside
        className="flex flex-col h-full shrink-0"
        style={{ width: "224px", background: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)", borderRight: "1px solid #E2E8F0" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5"
          style={{ borderBottom: "1px solid rgba(148,163,184,0.18)" }}>
          <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg,#FF6B00,#EA580C)", padding: "6px" }}>
            <img src="/brand-logo.svg" alt="SkillSprint" className="w-full h-full object-contain brightness-0 invert" />
          </div>
          <div>
            <p style={{ fontWeight: 800, fontSize: "0.88rem", letterSpacing: "-0.03em", color: "#0F172A" }}>SkillSprint</p>
            <p style={{ color: "#94A3B8", fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em" }}>B2B · CỔNG QUẢN TRỊ</p>
          </div>
        </div>

        {/* Section label */}
        <div className="px-5 pt-5 pb-2">
          <p style={{ color: "#64748B", fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Điều hướng
          </p>
        </div>

        {/* Health quick link in sidebar (open inline panel) */}
        <div className="px-4 pb-3">
          <button onClick={() => setShowHealthPanel(true)} className="flex items-center gap-3 px-3 py-2 rounded-xl"
            style={{ background: "#FFFFFF", border: "1px solid rgba(226,232,240,0.6)", color: "#374151" }}>
            <div style={{ width: 10, height: 10, borderRadius: 999, background: healthStatus === 'up' ? '#22c55e' : healthStatus === 'down' ? '#ef4444' : '#94A3B8', boxShadow: healthStatus === 'up' ? '0 0 6px #22c55e' : healthStatus === 'down' ? '0 0 6px #ef4444' : 'none' }} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
              <span style={{ fontSize: '13px', fontWeight: 700 }}>{healthStatus === 'up' ? 'Hệ thống ổn định' : healthStatus === 'down' ? 'Sự cố hệ thống' : 'Đang kiểm tra'}</span>
              {lastHealthPayload?.timestamp && (
                <span style={{ fontSize: '11px', color: '#9CA3AF' }}>Cập nhật: {new Date(lastHealthPayload.timestamp).toLocaleTimeString()}</span>
              )}
            </div>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map(item => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveNav(item.id);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 text-left"
                style={{
                  background: isActive ? "rgba(124,58,237,0.07)" : "transparent",
                  border: isActive ? "1px solid rgba(124,58,237,0.18)" : "1px solid transparent",
                  color: isActive ? "#5B21B6" : "#334155",
                  fontWeight: isActive ? 700 : 400,
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(148,163,184,0.10)"; e.currentTarget.style.color = "#0F172A"; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#334155"; } }}
              >
                <item.icon size={15} style={{ color: isActive ? "#7C3AED" : "#64748B", flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: "#7C3AED" }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Direct management link removed — moved to user dropdown */}

        {/* Bottom */}
        <div className="px-3 pb-4 pt-3 space-y-2" style={{ borderTop: "1px solid rgba(148,163,184,0.18)" }}>
          <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl transition-all text-left"
            style={{ color: "#64748B", background: "none", border: "none", cursor: "pointer" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#DC2626"; e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#64748B"; e.currentTarget.style.background = "transparent"; }}>
            ← Đăng xuất
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">

        {/* Top header: title, quick actions, and Health link */}
        <header
          className="flex items-center justify-between px-8 h-14 shrink-0 relative z-30"
          style={{ borderBottom: "1px solid #E5E7EB", background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)" }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div>
              <h1 style={{ fontWeight: 700, fontSize: "0.95rem", letterSpacing: "-0.02em", color: "#111827" }}>{current.title}</h1>
              <p style={{ color: "#9CA3AF", fontSize: "11px" }}>{current.sub}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            {/* Health summary button - open inline health panel (no redirect) */}
            <button
              onClick={() => setShowHealthPanel(true)}
              className="hidden md:inline-flex items-center gap-3 px-3 py-1.5 rounded-xl text-sm"
              style={{
                background: "#FFFFFF",
                border: healthStatus === 'down' ? '1px solid rgba(239,68,68,0.18)' : '1px solid #E5E7EB',
                color: "#374151",
                boxShadow: healthStatus === 'down' ? '0 6px 20px rgba(239,68,68,0.06)' : undefined,
                animation: healthStatus === 'down' ? 'statusPulse 1600ms infinite' : undefined,
              }}
              title={lastHealthPayload?.timestamp ? `Cập nhật: ${new Date(lastHealthPayload.timestamp).toLocaleString()}` : "Trạng thái hệ thống"}
            >
              <div style={{ width: 10, height: 10, borderRadius: 999, background: healthStatus === 'up' ? '#22c55e' : healthStatus === 'down' ? '#ef4444' : '#94A3B8', boxShadow: healthStatus === 'up' ? '0 0 6px #22c55e' : healthStatus === 'down' ? '0 0 6px #ef4444' : 'none' }} />
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                <span style={{ fontSize: '12px', fontWeight: 700 }}>
                  {healthStatus === 'up' ? 'Ổn định' : healthStatus === 'down' ? 'Sự cố' : 'Đang kiểm tra'}
                </span>
                {lastHealthPayload?.timestamp && (
                  <span style={{ fontSize: '10px', color: '#9CA3AF' }}>{new Date(lastHealthPayload.timestamp).toLocaleTimeString()}</span>
                )}
              </div>
              <div className="sr-only" aria-live="polite">{healthStatus === 'up' ? 'Hệ thống ổn định' : healthStatus === 'down' ? 'Sự cố hệ thống' : 'Đang kiểm tra'}</div>
            </button>
            <button className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{ background: "rgba(124,58,237,0.07)", color: "#5B21B6", border: "1px solid rgba(124,58,237,0.18)" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#4C1D95"; e.currentTarget.style.background = "rgba(124,58,237,0.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#5B21B6"; e.currentTarget.style.background = "rgba(124,58,237,0.07)"; }}
              onClick={handleExport}>
              <Download size={12} /> Xuất dữ liệu
            </button>

            <button
              onClick={() => setCommandOpen(true)}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all"
              style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", color: "#6B7280" }}
            >
              <Command size={12} />
              Lệnh nhanh
              <span className="px-1.5 py-0.5 rounded" style={{ background: "#F3F4F6", color: "#9CA3AF", fontSize: "10px" }}>/</span>
            </button>

            {/* User menu (hover) */}
            <div ref={userMenuRef} style={{ position: 'relative', zIndex: 99 }}>
              <button
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm"
                style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}
                onClick={() => setUserMenuOpen(v => !v)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setUserMenuOpen(v => !v); } }}
                aria-expanded={userMenuOpen}
              >
                <div style={{ width: 28, height: 28, borderRadius: 999, background: 'linear-gradient(135deg,#FF6B00,#FF9A3D)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>{(currentUser?.fullName || "A").charAt(0).toUpperCase()}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>Quản trị</span>
                  <span style={{ fontSize: '10px', color: '#9CA3AF' }}>Admin</span>
                </div>
              </button>
              {userMenuOpen && (
                <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 220, background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 10, boxShadow: '0 8px 24px rgba(2,6,23,0.12)', padding: 8, zIndex: 9999 }}>
                  <Link to="/admin/profile" className="w-full text-left px-3 py-2 rounded" style={{ display: 'block', color: '#111827', fontWeight: 700 }}>Hồ sơ</Link>
                  <div style={{ height: 1, background: '#F1F5F9', margin: '6px 0' }} />
                  <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded" style={{ display: 'block', color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}>← Đăng xuất</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── SCROLLABLE CONTENT ── */}  
        <div className="flex-1 overflow-y-auto p-7">
          {actionMessage && (
            <div className="mb-4 px-4 py-2 rounded-xl text-sm" style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.18)", color: "#5B21B6" }}>
              {actionMessage}
            </div>
          )}
          {activeNav === "users" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* ── LIVE SUMMARY CARDS ── */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    icon: GraduationCap,
                    label: "Tổng người dùng hoạt động",
                    value: mgmtTotal.toLocaleString(),
                    sub: "Trên toàn bộ hệ thống",
                    color: "#06b6d4",
                    sparkline: [10, 20, 35, 55, 80, 110, 140, 170, 200, 230, 260, Math.max(mgmtTotal, 1)],
                  },
                  {
                    icon: BookOpen,
                    label: "Tỷ lệ tài khoản ACTIVE",
                    value: mgmtUsers.length > 0
                      ? `${Math.round((mgmtUsers.filter((u: any) => String(u.status).toUpperCase() === 'ACTIVE').length / mgmtUsers.length) * 100)}%`
                      : "—",
                    sub: `${mgmtUsers.filter((u: any) => String(u.status).toUpperCase() === 'ACTIVE').length} / ${mgmtUsers.length} trang hiện tại`,
                    color: "#a78bfa",
                    sparkline: [50, 55, 58, 60, 63, 66, 70, 74, 78, 82, 86, 90],
                  },
                  {
                    icon: Award,
                    label: "Tài khoản quản trị",
                    value: String(mgmtUsers.filter((u: any) => String(u.role).toUpperCase().includes('ADMIN')).length),
                    sub: `Trên ${mgmtUsers.length} tài khoản trang này`,
                    color: "#f59e0b",
                    sparkline: [0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, Math.max(mgmtUsers.filter((u: any) => String(u.role).toUpperCase().includes('ADMIN')).length, 1)],
                  },
                ].map((card, i) => (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="relative rounded-2xl p-5 overflow-hidden"
                    style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
                  >
                    <div className="absolute top-0 right-0 w-28 h-28 pointer-events-none"
                      style={{ background: `radial-gradient(circle, ${card.color}10 0%, transparent 70%)`, transform: "translate(20%,-20%)" }} />
                    <div className="flex items-start justify-between mb-4 relative z-10">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: `${card.color}10`, border: `1px solid ${card.color}22` }}>
                        <card.icon size={16} style={{ color: card.color }} />
                      </div>
                      <Sparkline data={card.sparkline} color={card.color} width={70} height={24} />
                    </div>
                    <p className="relative z-10" style={{ fontWeight: 800, fontSize: "1.8rem", letterSpacing: "-0.05em", lineHeight: 1, color: "#111827" }}>
                      {card.value}
                    </p>
                    <p className="relative z-10 mt-1" style={{ color: "#6B7280", fontSize: "0.78rem" }}>{card.label}</p>
                    <p className="relative z-10" style={{ color: "#9CA3AF", fontSize: "0.7rem", marginTop: "2px" }}>{card.sub}</p>
                  </motion.div>
                ))}
              </div>

              <div>
                <div className="space-y-4">
                  {mgmtMessage && (
                    <div className="px-4 py-2 rounded-xl text-sm" style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.18)", color: "#5B21B6" }}>
                      {mgmtMessage}
                    </div>
                  )}

                  <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg,#FFFFFF 0%,#F8FAFC 100%)", border: "1px solid #E2E8F0" }}>
                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                      <div>
                        <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#0F172A" }}>Quản lý người dùng</h2>
                        <p style={{ margin: "4px 0 0", color: "#64748B", fontSize: "0.88rem" }}>Theo dõi người dùng, cập nhật trạng thái và phân quyền nhanh.</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-3 py-1 rounded-full text-xs" style={{ background: "#fff", border: "1px solid #E5E7EB", color: "#334155" }}>Tổng: {mgmtTotal}</span>
                        <span className="px-3 py-1 rounded-full text-xs" style={{ background: "#fff", border: "1px solid #E5E7EB", color: "#334155" }}>Trang: {mgmtPage + 1}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    <div className="xl:col-span-2 rounded-2xl" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", overflow: "hidden" }}>
                      <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3" style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <div className="relative w-full md:max-w-md">
                          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
                          <input
                            value={mgmtSearch}
                            onChange={(event) => setMgmtSearch(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                loadMgmt(0, mgmtSearch);
                              }
                            }}
                            placeholder="Tìm theo email hoặc tên"
                            className="w-full"
                            style={{ height: 38, padding: "0 12px 0 34px", borderRadius: 10, border: "1px solid #E2E8F0", fontSize: "0.86rem" }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => loadMgmt(0, mgmtSearch)}
                            className="px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                            style={{ background: "linear-gradient(135deg,#FF6B00,#EA580C)", color: "#FFFFFF" }}
                          >
                            Tìm kiếm
                          </button>
                          <button
                            onClick={() => {
                              setMgmtSearch("");
                              loadMgmt(0, "");
                            }}
                            className="px-3 py-2 rounded-lg text-xs font-semibold"
                            style={{ background: "#FFFFFF", color: "#334155", border: "1px solid #E2E8F0" }}
                          >
                            Xóa lọc
                          </button>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ background: "#F8FAFC", textAlign: "left", borderBottom: "2px solid #E2E8F0" }}>
                              <th style={{ padding: "11px 14px", fontSize: "0.68rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em" }}>Người dùng</th>
                              <th style={{ padding: "11px 14px", fontSize: "0.68rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em" }}>Vai trò</th>
                              <th style={{ padding: "11px 14px", fontSize: "0.68rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em" }}>Trạng thái</th>
                              <th style={{ padding: "11px 14px", fontSize: "0.68rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em" }}>Cập nhật</th>
                              <th style={{ padding: "11px 14px", fontSize: "0.68rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em" }}>Hành động</th>
                            </tr>
                          </thead>
                          <tbody>
                            {!mgmtLoading && mgmtUsers.length === 0 && (
                              <tr>
                                <td colSpan={5} style={{ padding: 24, textAlign: "center", color: "#94A3B8" }}>
                                  Không có người dùng phù hợp.
                                </td>
                              </tr>
                            )}
                            {mgmtUsers.map((user) => {
                              const status = String(user.status || "UNKNOWN").toUpperCase();
                              const badge = status === "ACTIVE"
                                ? { bg: "rgba(34,197,94,0.10)", text: "#15803D", border: "rgba(34,197,94,0.28)" }
                                : status === "LOCKED"
                                  ? { bg: "rgba(239,68,68,0.10)", text: "#B91C1C", border: "rgba(239,68,68,0.28)" }
                                  : { bg: "rgba(245,158,11,0.10)", text: "#B45309", border: "rgba(245,158,11,0.28)" };
                              return (
                                <tr key={user.id} style={{ borderTop: "1px solid #F1F5F9", background: mgmtSelected?.id === user.id ? "#EEF2FF" : "#FFFFFF" }}>
                                  <td style={{ padding: "12px 14px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                      <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#7C3AED,#FF6B00)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.82rem", flexShrink: 0 }}>
                                        {(user.fullName || user.email || "?").charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <div style={{ fontWeight: 700, color: "#0F172A", fontSize: "0.84rem" }}>{user.fullName || "Chưa cập nhật tên"}</div>
                                        <div style={{ color: "#64748B", fontSize: "0.78rem" }}>{user.email}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td style={{ padding: "12px 14px", color: "#334155", fontSize: "0.82rem" }}>{user.role || "USER"}</td>
                                  <td style={{ padding: "12px 14px" }}>
                                    <span className="px-2 py-1 rounded-full text-[11px] font-semibold" style={{ background: badge.bg, color: badge.text, border: `1px solid ${badge.border}` }}>{status}</span>
                                  </td>
                                  <td style={{ padding: "12px 14px", color: "#64748B", fontSize: "0.78rem" }}>{user.updatedAt ? new Date(user.updatedAt).toLocaleString() : "-"}</td>
                                  <td style={{ padding: "12px 14px" }}>
                                    <button
                                      onClick={() => openMgmtDetail(user.id)}
                                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                      style={{ background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.2)", color: "#5B21B6" }}
                                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(124,58,237,0.14)"; }}
                                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(124,58,237,0.07)"; }}
                                    >
                                      Chi tiết →
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="px-4 py-3 flex items-center justify-between" style={{ borderTop: "1px solid #F1F5F9" }}>
                        <span style={{ fontSize: "0.8rem", color: "#64748B" }}>Hiển thị {mgmtUsers.length} / {mgmtTotal}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => loadMgmt(Math.max(0, mgmtPage - 1), mgmtSearch)}
                            disabled={mgmtPage === 0 || mgmtLoading}
                            className="px-3 py-1.5 rounded-lg text-xs"
                            style={{ border: "1px solid #E2E8F0", background: "#fff", color: "#334155", opacity: mgmtPage === 0 || mgmtLoading ? 0.5 : 1 }}
                          >
                            Prev
                          </button>
                          <button
                            onClick={() => loadMgmt(mgmtPage + 1, mgmtSearch)}
                            disabled={mgmtUsers.length < mgmtSize || mgmtLoading}
                            className="px-3 py-1.5 rounded-lg text-xs"
                            style={{ border: "1px solid #E2E8F0", background: "#fff", color: "#334155", opacity: mgmtUsers.length < mgmtSize || mgmtLoading ? 0.5 : 1 }}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl p-4" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderTop: "3px solid #7C3AED" }}>
                      <h3 style={{ margin: "0 0 8px", fontSize: "0.95rem", fontWeight: 800, color: "#0F172A" }}>Chi tiết & cập nhật</h3>
                      {!mgmtSelected ? (
                        <div className="py-8 text-center">
                          <p style={{ fontSize: "0.82rem", color: "#94A3B8" }}>Chọn một người dùng để xem chi tiết và cập nhật.</p>
                        </div>
                      ) : (
                        <div className="space-y-3 mt-3">
                          <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#7C3AED,#FF6B00)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.1rem", flexShrink: 0 }}>
                              {(mgmtSelected.fullName || mgmtSelected.email || "?").charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p style={{ margin: 0, fontWeight: 700, fontSize: "0.85rem", color: "#0F172A" }}>{mgmtSelected.fullName || "Chưa cập nhật tên"}</p>
                              <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "#64748B" }} className="truncate">{mgmtSelected.email}</p>
                              <p style={{ margin: "2px 0 0", fontSize: "0.68rem", color: "#94A3B8", fontFamily: "monospace" }}>ID: {String(mgmtSelected.id).slice(0, 12)}…</p>
                            </div>
                          </div>

                          <div>
                            <label style={{ fontSize: "0.78rem", color: "#64748B", fontWeight: 700 }}>Trạng thái</label>
                            <select
                              value={mgmtStatusDraft}
                              onChange={(event) => setMgmtStatusDraft(event.target.value)}
                              style={{ width: "100%", marginTop: 6, height: 36, borderRadius: 8, border: "1px solid #E2E8F0", padding: "0 10px", fontSize: "0.82rem" }}
                            >
                              <option value="ACTIVE">ACTIVE</option>
                              <option value="DISABLED">DISABLED</option>
                            </select>
                            <button
                              onClick={() => saveMgmtStatus(mgmtSelected.id, mgmtStatusDraft)}
                              disabled={!mgmtStatusDraft || mgmtLoading}
                              className="mt-2 w-full px-3 py-2 rounded-lg text-xs font-semibold"
                              style={{ background: "linear-gradient(135deg,#FF6B00,#EA580C)", color: "#fff", opacity: !mgmtStatusDraft || mgmtLoading ? 0.5 : 1, cursor: !mgmtStatusDraft || mgmtLoading ? "not-allowed" : "pointer" }}
                            >
                              Lưu trạng thái
                            </button>
                          </div>

                          <div>
                            <label style={{ fontSize: "0.78rem", color: "#64748B", fontWeight: 700 }}>Vai trò</label>
                            <select
                              value={mgmtRolesDraft}
                              onChange={(event) => setMgmtRolesDraft(event.target.value)}
                              style={{ width: "100%", marginTop: 6, height: 36, borderRadius: 8, border: "1px solid #E2E8F0", padding: "0 10px", fontSize: "0.82rem" }}
                            >
                              <option value="">-- Chọn vai trò --</option>
                              <option value="ADMIN">Admin</option>
                              <option value="LEARNER">Learner</option>
                            </select>
                            <button
                              onClick={() => {
                                // Đảm bảo chỉ gửi mảng có giá trị
                                const rolesToUpdate = mgmtRolesDraft.trim() ? [mgmtRolesDraft.trim()] : [];
                                saveMgmtRoles(mgmtSelected.id, rolesToUpdate);
                              }}
                              disabled={!mgmtRolesDraft.trim() || mgmtLoading}
                              className="mt-2 w-full px-3 py-2 rounded-lg text-xs font-semibold"
                              style={{
                                background: "#EA580C",
                                color: "#fff",
                                opacity: (!mgmtRolesDraft.trim() || mgmtLoading) ? 0.5 : 1,
                                cursor: (!mgmtRolesDraft.trim() || mgmtLoading) ? "not-allowed" : "pointer"
                              }}
                            >
                              {mgmtLoading ? "Đang lưu..." : "Lưu vai trò"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          {activeNav === "financials" && <FinancialsView />}
          {activeNav === "payments" && <PaymentsView />}
          {activeNav === "feedback" && <FeedbackView />}
        </div>
      </main>



      {showHealthPanel && (
        <div
          className="fixed z-40"
          style={{
            left: 'calc(224px + 12px)',
            top: 64,
            width: 'min(720px, calc(100vw - 260px))',
            maxWidth: 720,
            maxHeight: 'calc(100vh - 80px)',
            overflow: 'visible',
            animation: 'slideInFromRight 220ms ease',
            boxShadow: '0 30px 60px rgba(15,23,42,0.12)',
            borderRadius: 12,
            backgroundClip: 'padding-box',
          }}
        >
          <div style={{ padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <button onClick={() => setShowHealthPanel(false)} className="rounded p-1" style={{ background: '#ffffffaa', border: '1px solid #E5E7EB' }} aria-label="Close health panel"><X size={16} /></button>
            </div>
            <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12, padding: 12, overflow: 'hidden' }}>
              <AdminHealth />
            </div>
          </div>
        </div>
      )}

      {commandOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4"
          style={{ background: "rgba(15,23,42,0.42)", backdropFilter: "blur(2px)" }}
          onClick={() => setCommandOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl overflow-hidden"
            style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 20px 44px rgba(2,6,23,0.20)" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-4 py-3" style={{ borderBottom: "1px solid #F1F5F9" }}>
              <input
                autoFocus
                type="text"
                value={commandQuery}
                onChange={(event) => setCommandQuery(event.target.value)}
                placeholder="Nhập lệnh (ví dụ: export, sync, users...)"
                className="w-full outline-none text-sm"
                style={{ color: "#111827" }}
              />
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {filteredCommands.map((command) => (
                <button
                  key={command.id}
                  onClick={() => executeCommand(command.id)}
                  className="w-full text-left px-3 py-2.5 rounded-xl transition-all"
                  style={{ color: "#374151" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,58,237,0.07)"; e.currentTarget.style.color = "#5B21B6"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#374151"; }}
                >
                  <p style={{ fontWeight: 600, fontSize: "0.83rem" }}>{command.label}</p>
                  <p style={{ color: "#9CA3AF", fontSize: "0.7rem" }}>{command.keywords}</p>
                </button>
              ))}
              {!filteredCommands.length && (
                <p className="px-3 py-4" style={{ color: "#9CA3AF", fontSize: "0.78rem" }}>Không tìm thấy lệnh phù hợp.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
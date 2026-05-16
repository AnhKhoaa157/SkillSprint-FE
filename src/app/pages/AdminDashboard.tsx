import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend, Cell,
} from "recharts";
import {
  Users, TrendingUp, Building2,
  Zap, ArrowUpRight, Download, Bell,
  Activity, DollarSign, Repeat, Target,
  GraduationCap, BookOpen, Award, ShieldCheck,
  ChevronDown, Search, AlertTriangle, Command, X, ChevronRight,
} from "lucide-react";
import { Link } from "react-router";

const ACCENT = "#FF6B00";
const ACCENT_DEEP = "#EA580C";
const ACCENT_SOFT = "rgba(255,107,0,0.08)";
const ACCENT_BORDER = "rgba(255,107,0,0.2)";

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

/* ─────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────── */
// Student cohort data for "Users & Cohorts" view
const STUDENTS = [
  { id: 1, name: "Nguyễn Văn A",   cohort: "FPT K21",   roadmap: "Frontend Dev", progress: 72, skillGap: 28, streak: 12, plan: "Premium", status: "on-track" },
  { id: 2, name: "Trần Thị B",     cohort: "FPT K21",   roadmap: "Backend Dev",  progress: 58, skillGap: 42, streak: 5,  plan: "Premium", status: "at-risk" },
  { id: 3, name: "Lê Văn C",       cohort: "VNU K20",   roadmap: "Data Science", progress: 91, skillGap: 9,  streak: 21, plan: "Premium", status: "excellent" },
  { id: 4, name: "Phạm Thị D",     cohort: "HUST K22",  roadmap: "UI/UX Design", progress: 44, skillGap: 56, streak: 2,  plan: "Free",    status: "at-risk" },
  { id: 5, name: "Hoàng Minh E",   cohort: "RMIT 2024", roadmap: "Frontend Dev", progress: 83, skillGap: 17, streak: 18, plan: "Premium", status: "excellent" },
  { id: 6, name: "Vũ Thị F",       cohort: "VNU K20",   roadmap: "DevOps",       progress: 37, skillGap: 63, streak: 0,  plan: "Free",    status: "stalled" },
  { id: 7, name: "Đặng Văn G",     cohort: "FPT K21",   roadmap: "Backend Dev",  progress: 66, skillGap: 34, streak: 8,  plan: "Premium", status: "on-track" },
  { id: 8, name: "Bùi Thị H",      cohort: "HCMUT K23", roadmap: "Frontend Dev", progress: 19, skillGap: 81, streak: 1,  plan: "Free",    status: "stalled" },
  { id: 9, name: "Ngô Văn I",      cohort: "HUST K22",  roadmap: "Data Science", progress: 77, skillGap: 23, streak: 14, plan: "Premium", status: "on-track" },
  { id: 10, name: "Đinh Thị J",    cohort: "RMIT 2024", roadmap: "UI/UX Design", progress: 94, skillGap: 6,  streak: 30, plan: "Premium", status: "excellent" },
];

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  excellent: { label: "Xuất sắc",  bg: "rgba(34,197,94,0.08)",   text: "#22c55e", border: "rgba(34,197,94,0.25)"  },
  "on-track":{ label: "Đúng tiến độ",   bg: "rgba(6,182,212,0.08)",   text: "#06b6d4", border: "rgba(6,182,212,0.25)"  },
  "at-risk":  { label: "Cần chú ý",    bg: "rgba(245,158,11,0.08)",  text: "#f59e0b", border: "rgba(245,158,11,0.25)" },
  stalled:    { label: "Chững lại",    bg: "rgba(239,68,68,0.08)",   text: "#ef4444", border: "rgba(239,68,68,0.25)"  },
};

const USER_GROWTH_DATA = [
  { week: "W1",  total: 148,  organic: 90,  paid: 38,  referral: 20 },
  { week: "W2",  total: 290,  organic: 170, paid: 75,  referral: 45 },
  { week: "W3",  total: 440,  organic: 255, paid: 110, referral: 75 },
  { week: "W4",  total: 620,  organic: 350, paid: 160, referral: 110 },
  { week: "W5",  total: 810,  organic: 450, paid: 210, referral: 150 },
  { week: "W6",  total: 1020, organic: 560, paid: 265, referral: 195 },
  { week: "W7",  total: 1230, organic: 665, paid: 310, referral: 255 },
  { week: "W8",  total: 1410, organic: 760, paid: 345, referral: 305 },
  { week: "W9",  total: 1560, organic: 830, paid: 368, referral: 362 },
  { week: "W10", total: 1680, organic: 883, paid: 378, referral: 419 },
  { week: "W11", total: 1760, organic: 915, paid: 382, referral: 463 },
  { week: "W12", total: 1840, organic: 940, paid: 385, referral: 515 },
];

const CAMPUS_DATA = [
  { name: "FPT University", users: 500, mrr: 12500000, plan: "Campus Pro",   status: "Ổn định",     trend: "+18%", health: "green" },
  { name: "VNU-HCM",        users: 310, mrr: 7750000,  plan: "Campus Basic", status: "Đang hoạt động", trend: "+11%", health: "green" },
  { name: "HUST",           users: 200, mrr: 5000000,  plan: "Campus Basic", status: "Đang hoạt động", trend: "+9%",  health: "green" },
  { name: "RMIT Vietnam",   users: 120, mrr: 3000000,  plan: "Campus Pilot", status: "Tăng trưởng",   trend: "+34%", health: "cyan"  },
  { name: "UEH",            users: 85,  mrr: 2125000,  plan: "Dùng thử",     status: "Dùng thử",      trend: "+5%",  health: "amber" },
  { name: "HCMUT",          users: 45,  mrr: 0,        plan: "Tiềm năng",    status: "Tiềm năng",     trend: "—",    health: "gray"  },
];

const HEALTH_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  green: { bg: "rgba(34,197,94,0.08)",   text: "#16a34a", border: "rgba(34,197,94,0.2)"  },
  cyan:  { bg: "rgba(6,182,212,0.08)",   text: "#0891b2", border: "rgba(6,182,212,0.2)"  },
  amber: { bg: "rgba(245,158,11,0.08)",  text: "#d97706", border: "rgba(245,158,11,0.2)" },
  gray:  { bg: "#F3F4F6", text: "#9CA3AF", border: "#E5E7EB" },
};

const KPI_DATA = [
  { id: "activation", label: "Tỷ lệ kích hoạt", value: "48%",  target: ">45%", passing: true, delta: "+3.2%", color: "#FF6B00", icon: Activity,   sparkline: [38,40,41,42,43,45,46,47,48] },
  { id: "retention",  label: "Giữ chân tuần 4", value: "42%", target: ">35%", passing: true, delta: "+4.5%", color: "#FB923C", icon: Repeat,     sparkline: [32,33,34,36,37,38,40,41,42] },
  { id: "conversion", label: "Chuyển đổi trả phí",  value: "7.2%",target: ">5%",  passing: true, delta: "+1.1%", color: "#F97316", icon: TrendingUp,  sparkline: [4.8,5.2,5.5,5.8,6.1,6.4,6.7,7.0,7.2] },
  { id: "arpa",       label: "Doanh thu bình quân", value: "51K ₫",target: "Tối đa", passing: true, delta: "+12%",  color: "#EA580C", icon: DollarSign, sparkline: [44,45,46,47,48,49.5,50,50.5,51] },
];

const UNIT_ECON_DATA = [
  { label: "CAC", value: 40000,  fill: "#475569" },
  { label: "LTV", value: 408000, fill: "#FF6B00" },
];

const ADMIN_ALERTS = [
  {
    id: "alert-1",
    level: "critical",
    title: "2 cohorts có tỷ lệ stalled > 25%",
    detail: "HCMUT K23 và VNU K20 cần can thiệp mentor trong 48h.",
  },
  {
    id: "alert-2",
    level: "warning",
    title: "Chuyển đổi trả phí giảm 0.8% tuần này",
    detail: "Nên kiểm tra điểm nghẽn tại bước thanh toán của nhóm gói miễn phí.",
  },
  {
    id: "alert-3",
    level: "info",
    title: "RMIT 2024 tăng tốc tốt",
    detail: "Tỷ lệ hoàn thành vượt 85%, có thể nhân bản playbook cho cohort khác.",
  },
] as const;

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
   Sidebar nav — EXACTLY 3 items per the prompt
───────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { id: "users",      label: "Người học & Nhóm học", icon: Users     },
  { id: "financials", label: "Tài chính",           icon: TrendingUp },
  { id: "b2b",        label: "Đối tác B2B",         icon: Building2  },
];

/* ─────────────────────────────────────────────────────────
   ── USERS & COHORTS view ──
───────────────────────────────────────────────────────── */
function UsersView() {
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<(typeof STUDENTS)[number] | null>(null);
  const [alerts, setAlerts] = useState([...ADMIN_ALERTS]);
  const totalActive   = STUDENTS.length;
  const avgCompletion = Math.round(STUDENTS.reduce((s, st) => s + st.progress, 0) / totalActive);
  const premiumLicenses = STUDENTS.filter(s => s.plan === "Premium").length;
  const filtered = STUDENTS.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.cohort.toLowerCase().includes(search.toLowerCase()) ||
    s.roadmap.toLowerCase().includes(search.toLowerCase())
  );

  const cohortHeatmap = useMemo(() => {
    const grouped = STUDENTS.reduce((acc, student) => {
      if (!acc[student.cohort]) {
        acc[student.cohort] = { cohort: student.cohort, total: 0, progress: 0, gap: 0, atRisk: 0 };
      }
      acc[student.cohort].total += 1;
      acc[student.cohort].progress += student.progress;
      acc[student.cohort].gap += student.skillGap;
      if (student.status === "at-risk" || student.status === "stalled") {
        acc[student.cohort].atRisk += 1;
      }
      return acc;
    }, {} as Record<string, { cohort: string; total: number; progress: number; gap: number; atRisk: number }>);

    return Object.values(grouped).map((item) => {
      const avgProgress = Math.round(item.progress / item.total);
      const avgGap = Math.round(item.gap / item.total);
      return {
        ...item,
        avgProgress,
        avgGap,
        heat: Math.round((avgProgress + (100 - avgGap)) / 2),
      };
    });
  }, []);

  const alertStyle = (level: (typeof ADMIN_ALERTS)[number]["level"]) => {
    if (level === "critical") {
      return { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)", text: "#B91C1C", tag: "Nghiêm trọng" };
    }
    if (level === "warning") {
      return { bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.24)", text: "#B45309", tag: "Cảnh báo" };
    }
    return { bg: "rgba(6,182,212,0.08)", border: "rgba(6,182,212,0.2)", text: "#0E7490", tag: "Thông tin" };
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

      {/* ── ALERT CENTER ── */}
      <div className="rounded-2xl p-4" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} color={ACCENT} />
            <p style={{ fontWeight: 700, fontSize: "0.86rem", color: "#111827" }}>Trung tâm cảnh báo ưu tiên</p>
          </div>
          <span style={{ fontSize: "11px", color: "#9CA3AF" }}>{alerts.length} cảnh báo</span>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
          {alerts.map((alert) => {
            const style = alertStyle(alert.level);
            return (
              <div key={alert.id} className="rounded-xl p-3" style={{ background: style.bg, border: `1px solid ${style.border}` }}>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: style.text, border: `1px solid ${style.border}` }}>
                    {style.tag}
                  </span>
                  <button
                    className="text-xs"
                    style={{ color: style.text }}
                    onClick={() => setAlerts((prev) => prev.filter((entry) => entry.id !== alert.id))}
                  >
                    Bỏ qua
                  </button>
                </div>
                <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1F2937", marginBottom: "3px" }}>{alert.title}</p>
                <p style={{ fontSize: "0.72rem", color: "#6B7280", lineHeight: 1.45 }}>{alert.detail}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── TOP METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: GraduationCap,
            label: "Tổng người học hoạt động",
            value: totalActive.toString(),
            sub: "Trên toàn bộ cohort",
            color: "#06b6d4",
            sparkline: [55,60,65,70,80,90,100,110,120,130,140,totalActive],
          },
          {
            icon: BookOpen,
            label: "Tỷ lệ hoàn thành TB",
            value: `${avgCompletion}%`,
            sub: "Gộp toàn bộ lộ trình",
            color: "#a78bfa",
            sparkline: [52,55,58,59,60,61,62,63,64,65,66,avgCompletion],
          },
          {
            icon: Award,
            label: "Gói Premium đang dùng",
            value: `${premiumLicenses}/${totalActive}`,
            sub: `${Math.round((premiumLicenses/totalActive)*100)}% tỷ lệ sử dụng`,
            color: "#f59e0b",
            sparkline: [3,4,4,5,5,6,6,6,7,7,7,premiumLicenses],
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

      {/* ── COHORT HEATMAP ── */}
      <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p style={{ fontWeight: 700, fontSize: "0.92rem", color: "#111827" }}>Bản đồ nhiệt cohort</p>
            <p style={{ fontSize: "0.74rem", color: "#9CA3AF" }}>Điểm nhiệt = hoàn thành + mức sẵn sàng (bấm để lọc nhanh)</p>
          </div>
          <span style={{ fontSize: "11px", color: "#9CA3AF" }}>{cohortHeatmap.length} cohort</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {cohortHeatmap.map((cohort) => {
            const heatColor = cohort.heat >= 80 ? "#16A34A" : cohort.heat >= 65 ? "#F59E0B" : "#DC2626";
            const heatBg = cohort.heat >= 80 ? "rgba(34,197,94,0.08)" : cohort.heat >= 65 ? "rgba(245,158,11,0.10)" : "rgba(239,68,68,0.10)";
            return (
              <button
                key={cohort.cohort}
                onClick={() => setSearch(cohort.cohort)}
                className="text-left rounded-xl p-3 transition-all"
                style={{ background: heatBg, border: "1px solid rgba(148,163,184,0.2)" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p style={{ fontWeight: 700, fontSize: "0.8rem", color: "#111827" }}>{cohort.cohort}</p>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: heatColor }}>{cohort.heat}</span>
                </div>
                <div className="space-y-1">
                  <p style={{ fontSize: "11px", color: "#6B7280" }}>Hoàn thành: <strong>{cohort.avgProgress}%</strong></p>
                  <p style={{ fontSize: "11px", color: "#6B7280" }}>Skill gap: <strong>{cohort.avgGap}%</strong></p>
                  <p style={{ fontSize: "11px", color: cohort.atRisk > 0 ? "#B45309" : "#6B7280" }}>Cần chú ý: <strong>{cohort.atRisk}/{cohort.total}</strong></p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── STUDENT DATA TABLE ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
      >
        {/* Table header bar */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid #F3F4F6" }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: "0.92rem", color: "#111827" }}>Danh sách người học</p>
            <p style={{ color: "#9CA3AF", fontSize: "0.75rem" }}>
              {filtered.length} người học · Sắp xếp theo tiến độ
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm người học..."
                className="pl-8 pr-4 py-2 rounded-xl text-xs outline-none transition-all"
                style={{
                  background: "#F9FAFB",
                  border: "1px solid #E5E7EB",
                  width: "180px",
                  color: "#111827",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = "rgba(6,182,212,0.4)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "#E5E7EB"; }}
              />
            </div>
            <button
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-all"
              style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "#6B7280" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#111827"; e.currentTarget.style.background = "#F3F4F6"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#6B7280"; e.currentTarget.style.background = "#F9FAFB"; }}
            >
                <Download size={12} /> Xuất dữ liệu
            </button>
          </div>
        </div>

        {/* Column headers */}
        <div className="grid px-6 py-2.5"
          style={{
            gridTemplateColumns: "2fr 1fr 1fr 2fr 1fr 1fr 1fr",
            borderBottom: "1px solid #F3F4F6",
            background: "#FAFAFA",
          }}>
          {["Người học", "Cohort", "Lộ trình", "Tiến độ", "Skill Gap", "Chuỗi học", "Trạng thái"].map(col => (
            <div key={col} className="flex items-center gap-1" style={{ color: "#9CA3AF", fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {col} {["Tiến độ","Skill Gap"].includes(col) && <ChevronDown size={10} />}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="overflow-y-auto" style={{ maxHeight: "400px" }}>
          {filtered.map((student, i) => {
            const sc = STATUS_CONFIG[student.status];
            return (
              <motion.div
                key={student.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="grid px-6 py-3.5 group transition-all duration-150 cursor-pointer"
                style={{
                  gridTemplateColumns: "2fr 1fr 1fr 2fr 1fr 1fr 1fr",
                  borderBottom: "1px solid #F9FAFB",
                  alignItems: "center",
                }}
                onClick={() => setSelectedStudent(student)}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "#F9FAFB"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
              >
                {/* Student name */}
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
                    style={{
                      background: `linear-gradient(135deg, ${["#0ea5e9","#a78bfa","#22c55e","#f59e0b","#ef4444","#06b6d4"][i % 6]}, ${["#6366f1","#ec4899","#059669","#d97706","#dc2626","#0891b2"][i % 6]})`,
                    }}
                  >
                    {student.name.charAt(0)}
                  </div>
                  <span style={{ fontSize: "0.82rem", fontWeight: 500, color: "#111827" }}>{student.name}</span>
                </div>

                {/* Cohort */}
                <span style={{ color: "#6B7280", fontSize: "0.78rem" }}>{student.cohort}</span>

                {/* Roadmap */}
                <span style={{ color: "#6B7280", fontSize: "0.78rem" }}>{student.roadmap}</span>

                {/* Progress bar */}
                <div className="pr-4">
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ color: "#9CA3AF", fontSize: "0.7rem" }}>
                      {student.progress}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${student.progress}%`,
                        background: student.progress >= 80
                          ? "linear-gradient(90deg, #22c55e, #16a34a)"
                          : student.progress >= 50
                            ? "linear-gradient(90deg, #06b6d4, #0891b2)"
                            : "linear-gradient(90deg, #f59e0b, #d97706)",
                        boxShadow: student.progress >= 80
                          ? "0 0 6px rgba(34,197,94,0.5)"
                          : "none",
                      }}
                    />
                  </div>
                </div>

                {/* Skill Gap Score */}
                <div>
                  <span
                    className="text-xs font-bold"
                    style={{
                      color: student.skillGap > 50 ? "#ef4444" : student.skillGap > 30 ? "#f59e0b" : "#22c55e",
                    }}
                  >
                    {student.skillGap}%
                  </span>
                </div>

                {/* Streak */}
                <div className="flex items-center gap-1">
                  <span style={{ fontSize: "12px" }}>🔥</span>
                  <span style={{ color: "#64748B", fontSize: "0.78rem" }}>{student.streak} ngày</span>
                </div>

                {/* Status badge */}
                <span
                  className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap"
                  style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, fontWeight: 600, fontSize: "10px" }}
                >
                  {sc.label}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Table footer */}
        <div className="px-6 py-3 flex items-center justify-between"
          style={{ borderTop: "1px solid #F3F4F6", background: "#FAFAFA" }}>
          <div className="flex items-center gap-4">
            {Object.entries(STATUS_CONFIG).map(([key, s]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: s.text }} />
                <span style={{ color: "#9CA3AF", fontSize: "11px" }}>
                  {s.label} ({STUDENTS.filter(st => st.status === key).length})
                </span>
              </div>
            ))}
          </div>
          <span style={{ color: "#D1D5DB", fontSize: "11px" }}>
            Hiển thị {filtered.length}/{STUDENTS.length} người học
          </span>
        </div>
      </motion.div>

      {selectedStudent && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5"
          style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
        >
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p style={{ fontWeight: 700, fontSize: "0.92rem", color: "#111827" }}>Chi tiết người học</p>
              <p style={{ fontSize: "0.74rem", color: "#9CA3AF" }}>Chi tiết hành vi và đề xuất can thiệp cho từng learner</p>
            </div>
            <button onClick={() => setSelectedStudent(null)} className="p-1 rounded-lg" style={{ border: "1px solid #E5E7EB", color: "#6B7280" }}>
              <X size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <div className="rounded-xl p-3" style={{ background: "#F8FAFC", border: "1px solid #E5E7EB" }}>
              <p style={{ fontSize: "11px", color: "#9CA3AF" }}>Người học</p>
              <p style={{ fontWeight: 700, color: "#111827" }}>{selectedStudent.name}</p>
              <p style={{ fontSize: "12px", color: "#6B7280" }}>{selectedStudent.cohort} · {selectedStudent.roadmap}</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: "#FFF7ED", border: "1px solid #FDBA74" }}>
              <p style={{ fontSize: "11px", color: "#9A3412" }}>Mức rủi ro hiện tại</p>
              <p style={{ fontWeight: 800, color: "#9A3412", fontSize: "1.1rem" }}>{selectedStudent.skillGap}% gap</p>
              <p style={{ fontSize: "12px", color: "#B45309" }}>Chuỗi học: {selectedStudent.streak} ngày</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: "#ECFDF5", border: "1px solid #86EFAC" }}>
              <p style={{ fontSize: "11px", color: "#166534" }}>Hành động đề xuất</p>
              <p style={{ fontWeight: 700, color: "#166534" }}>Giao mentor checkpoint + mock interview</p>
              <p style={{ fontSize: "12px", color: "#15803D" }}>Đánh giá lại sau 7 ngày</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
              style={{ background: ACCENT, color: "#FFFFFF" }}>
              Kích hoạt can thiệp <ChevronRight size={12} />
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs"
              style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "#374151" }}>
              Báo mentor
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs"
              style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "#374151" }}>
              Lên lịch đánh giá
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   ── FINANCIALS view ──
───────────────────────────────────────────────────────── */
function FinancialsView() {
  const totalMRR = CAMPUS_DATA.reduce((s, c) => s + c.mrr, 0);
  const totalUsers = USER_GROWTH_DATA[USER_GROWTH_DATA.length - 1].total;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {KPI_DATA.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="relative rounded-2xl p-5 overflow-hidden"
              style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
            >
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
              <p className="relative z-10 mb-0.5" style={{ fontWeight: 800, fontSize: "1.6rem", letterSpacing: "-0.05em", lineHeight: 1, color: "#111827" }}>
                {kpi.value}
              </p>
              <p className="relative z-10 text-xs mb-3" style={{ color: "#6B7280" }}>{kpi.label}</p>
              <div className="relative z-10 flex items-end justify-between">
                <Sparkline data={kpi.sparkline} color={kpi.color} width={75} height={26} />
                <div>
                  <p style={{ fontSize: "9px", color: "#9CA3AF", textAlign: "right" }}>Target</p>
                  <p style={{ fontSize: "9px", color: kpi.passing ? "#16a34a" : "#ef4444", fontWeight: 700, textAlign: "right" }}>
                    {kpi.target} {kpi.passing ? "✓" : "✗"}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* Unit Economics + Growth Chart */}
        <div className="xl:col-span-3 space-y-5">
          {/* Unit Economics */}
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
                <BarChart data={[{ label: "CAC", value: 40000, name: "CAC" }, { label: "LTV", value: 408000, name: "LTV" }]} margin={{ top: 10, right: 20, left: 10, bottom: 5 }} barCategoryGap="50%">
                  <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis key="x" dataKey="label" stroke="#E5E7EB" tick={{ fill: "#6B7280", fontSize: 12, fontWeight: 600 }} />
                  <YAxis key="y" stroke="#F3F4F6" tick={{ fill: "#9CA3AF", fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                  <Tooltip key="tooltip" content={<CustomTooltip />} />
                  <Bar key="bar" dataKey="value" name="value" shape={<UnitEconBar />} radius={[6,6,0,0]}>
                    {UNIT_ECON_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* User Growth Area Chart */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
            className="rounded-2xl p-6" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#9CA3AF", letterSpacing: "0.12em" }}>Thu hút người dùng</p>
                <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#111827" }}>Tăng trưởng theo kênh — 12 tuần</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
                style={{ background: "rgba(6,182,212,0.08)", color: "#0891b2", border: "1px solid rgba(6,182,212,0.2)", fontWeight: 700 }}>
                <ArrowUpRight size={11} /> {totalUsers.toLocaleString()} total
              </div>
            </div>
            <div style={{ height: "200px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={USER_GROWTH_DATA} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis key="x" dataKey="week" stroke="#E5E7EB" tick={{ fill: "#9CA3AF", fontSize: 10 }} />
                  <YAxis key="y" stroke="#F3F4F6" tick={{ fill: "#9CA3AF", fontSize: 10 }} />
                  <Tooltip key="tooltip" content={<CustomTooltip />} />
                  <Legend key="legend" wrapperStyle={{ fontSize: "11px", paddingTop: "10px", color: "#6B7280" }} />
                  <Area key="total" type="monotone" dataKey="total"   name="Tổng"   stroke="#06b6d4" strokeWidth={2}   fill="#06b6d4" fillOpacity={0.1} />
                  <Area key="organic" type="monotone" dataKey="organic" name="Tự nhiên" stroke="#22c55e" strokeWidth={1.5} fill="#22c55e" fillOpacity={0.08} />
                  <Area key="referral" type="monotone" dataKey="referral" name="Giới thiệu" stroke="#a78bfa" strokeWidth={1.5} fill="#a78bfa" fillOpacity={0.08} strokeDasharray="4 2" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Summary stats */}
        <div className="xl:col-span-2 space-y-5">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="grid grid-cols-2 gap-3">
            {[
              { label: "MRR tổng",         value: `${(totalMRR/1000000).toFixed(1)}M ₫`, color: "#22c55e", sub: "↑ 24% so với tháng trước" },
              { label: "Campus đang hoạt động", value: `${CAMPUS_DATA.filter(c=>c.health!=="gray").length}`,   color: "#06b6d4", sub: "1 campus đang dùng thử" },
              { label: "Phiên học trung bình", value: "47 phút",                                           color: "#FF6B00", sub: "Trên mỗi người học/ngày" },
              { label: "Điểm NPS",        value: "72",                                                  color: "#d97706", sub: "Mức hài lòng rất tốt" },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-4"
                style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <p style={{ fontSize: "9px", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>{s.label}</p>
                <p style={{ fontWeight: 800, fontSize: "1.25rem", color: s.color, letterSpacing: "-0.04em", lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: "10px", color: "#D1D5DB", marginTop: "2px" }}>{s.sub}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   ── B2B PARTNERS view ──
───────────────────────────────────────────────────────── */
function B2BView() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

      {/* Partner summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Đối tác đang hoạt động", value: "5",        color: "#22c55e", icon: Building2  },
          { label: "Tổng người dùng B2B",   value: "1,260",    color: "#06b6d4", icon: Users      },
          { label: "MRR từ B2B",            value: "30.4M ₫",  color: "#f59e0b", icon: DollarSign },
          { label: "Điểm sức khỏe TB",      value: "87/100",   color: "#a78bfa", icon: ShieldCheck },
        ].map((card, i) => (
          <motion.div key={card.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="rounded-2xl p-5 relative overflow-hidden"
            style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div className="absolute top-0 right-0 w-20 h-20 pointer-events-none"
              style={{ background: `radial-gradient(circle, ${card.color}10 0%, transparent 70%)`, transform: "translate(20%,-20%)" }} />
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
              style={{ background: `${card.color}10`, border: `1px solid ${card.color}22` }}>
              <card.icon size={15} style={{ color: card.color }} />
            </div>
            <p style={{ fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-0.05em", lineHeight: 1, color: "#111827" }}>{card.value}</p>
            <p style={{ color: "#6B7280", fontSize: "0.75rem", marginTop: "4px" }}>{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Campus Table */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid #F3F4F6" }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: "0.92rem", color: "#111827" }}>Danh sách đối tác campus</p>
            <p style={{ color: "#9CA3AF", fontSize: "0.75rem" }}>6 trường · 1 trường trong pipeline</p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-all"
            style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "#6B7280" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#F3F4F6"; e.currentTarget.style.color = "#111827"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#F9FAFB"; e.currentTarget.style.color = "#6B7280"; }}>
            <Download size={12} /> Xuất dữ liệu
          </button>
        </div>

        {/* Column headers */}
        <div className="grid px-6 py-2.5"
          style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", borderBottom: "1px solid #F3F4F6", background: "#FAFAFA" }}>
          {["Trường", "Người dùng", "MRR", "Gói", "Xu hướng", "Trạng thái"].map(col => (
            <span key={col} style={{ color: "#9CA3AF", fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{col}</span>
          ))}
        </div>

        {CAMPUS_DATA.map((c, i) => {
          const hc = HEALTH_COLORS[c.health];
          return (
            <div key={c.name} className="grid px-6 py-4 transition-all"
              style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", borderBottom: "1px solid #F9FAFB", alignItems: "center" }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "#F9FAFB"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${["#0ea5e9","#22c55e","#a78bfa","#f59e0b","#ef4444","#6366f1"][i % 6]}, ${["#6366f1","#16a34a","#FF6B00","#d97706","#dc2626","#4f46e5"][i % 6]})` }}>
                  {c.name.charAt(0)}
                </div>
                <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "#111827" }}>{c.name}</span>
              </div>
              <span style={{ color: "#374151", fontSize: "0.82rem", fontWeight: 600 }}>{c.users.toLocaleString()}</span>
              <span style={{ color: "#16a34a", fontSize: "0.82rem", fontWeight: 600 }}>
                {c.mrr > 0 ? `${(c.mrr/1000000).toFixed(1)}M ₫` : "—"}
              </span>
              <span style={{ color: "#6B7280", fontSize: "0.78rem" }}>{c.plan}</span>
              <span style={{ color: c.trend.startsWith("+") ? "#16a34a" : "#9CA3AF", fontSize: "0.82rem", fontWeight: 600 }}>
                {c.trend}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: hc.bg, color: hc.text, border: `1px solid ${hc.border}`, fontWeight: 600, fontSize: "10px" }}>
                {c.status}
              </span>
            </div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   Main Admin Dashboard
───────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const [activeNav, setActiveNav] = useState<"users" | "financials" | "b2b">("users");
  const [timeRange, setTimeRange] = useState("90d");
  const [lastSync, setLastSync] = useState(new Date());
  const [actionMessage, setActionMessage] = useState("");
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");

  const headerLabels: Record<string, { title: string; sub: string }> = {
    users:      { title: "Người học & Nhóm học",  sub: "Tiến độ người học · Phân tích skill gap" },
    financials: { title: "Tài chính",            sub: "Chỉ số doanh thu · Unit economics" },
    b2b:        { title: "Đối tác B2B",          sub: "Tài khoản trường · Sức khỏe đối tác" },
  };
  const current = headerLabels[activeNav];

  const handleExport = () => {
    if (activeNav === "users") {
      downloadCsv("admin-users-cohorts.csv", STUDENTS.map((student) => ({
        name: student.name,
        cohort: student.cohort,
        roadmap: student.roadmap,
        progress: student.progress,
        skillGap: student.skillGap,
        streak: student.streak,
        plan: student.plan,
        status: student.status,
      })));
      setActionMessage("Đã xuất dữ liệu Người học & Nhóm học.");
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

    downloadCsv("admin-b2b-partners.csv", CAMPUS_DATA.map((campus) => ({
      name: campus.name,
      users: campus.users,
      mrr: campus.mrr,
      plan: campus.plan,
      status: campus.status,
      trend: campus.trend,
    })));
    setActionMessage("Đã xuất dữ liệu Đối tác B2B.");
  };

  const handleSync = () => {
    setLastSync(new Date());
    setActionMessage("Đã đồng bộ dữ liệu admin thành công.");
  };

  const handleSendSummary = () => {
    setActionMessage(`Đã gửi báo cáo ${current.title} cho team vận hành.`);
  };

  const commandActions = [
    { id: "goto-users", label: "Đi tới Người học & Nhóm học", keywords: "users students cohorts", action: () => setActiveNav("users") },
    { id: "goto-financials", label: "Đi tới Tài chính", keywords: "finance revenue mrr", action: () => setActiveNav("financials") },
    { id: "goto-b2b", label: "Đi tới Đối tác B2B", keywords: "b2b partners campus", action: () => setActiveNav("b2b") },
    { id: "export", label: "Xuất dữ liệu màn hình hiện tại", keywords: "export csv download", action: handleExport },
    { id: "sync", label: "Đồng bộ dữ liệu admin", keywords: "sync refresh", action: handleSync },
    { id: "summary", label: "Gửi báo cáo tổng hợp", keywords: "summary report send", action: handleSendSummary },
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

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#FFF7ED", fontFamily: "'Inter', sans-serif", color: "#111827" }}
    >
      <style>{`
        @keyframes statusPulse { 0%,100%{opacity:1;}50%{opacity:0.4;} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 2px; }
      `}</style>

      {/* ── SIDEBAR ── */}
      <aside
        className="flex flex-col h-full shrink-0"
        style={{ width: "224px", background: "linear-gradient(180deg, #FFFFFF 0%, #FFF7ED 100%)", borderRight: "1px solid #E2E8F0" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5"
          style={{ borderBottom: "1px solid rgba(148,163,184,0.18)" }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DEEP})` }}>
            <Zap size={13} className="text-white fill-white" />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: "0.85rem", letterSpacing: "-0.02em", color: "#0F172A" }}>SkillSprint</p>
            <p style={{ color: "#64748B", fontSize: "9px", fontWeight: 600, letterSpacing: "0.1em" }}>B2B · CỔNG QUẢN TRỊ</p>
          </div>
        </div>

        {/* Section label */}
        <div className="px-5 pt-5 pb-2">
          <p style={{ color: "#64748B", fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Điều hướng
          </p>
        </div>

        {/* Nav — exactly 3 items */}
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id as any)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 text-left"
                style={{
                  background: isActive ? ACCENT_SOFT : "transparent",
                  border: isActive ? `1px solid ${ACCENT_BORDER}` : "1px solid transparent",
                  color: isActive ? "#9A3412" : "#334155",
                  fontWeight: isActive ? 600 : 400,
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(148,163,184,0.10)"; e.currentTarget.style.color = "#0F172A"; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#334155"; } }}
              >
                <item.icon size={15} style={{ color: isActive ? "#C2410C" : "#64748B", flexShrink: 0 }} />
                {item.label}
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ background: "#C2410C" }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-4 pt-3 space-y-2" style={{ borderTop: "1px solid rgba(148,163,184,0.18)" }}>
          <Link to="/admin-login" className="flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl transition-all"
            style={{ color: "#64748B" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#9A3412"; e.currentTarget.style.background = "rgba(255,107,0,0.12)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#64748B"; e.currentTarget.style.background = "transparent"; }}>
            ← Đăng xuất
          </Link>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">

        {/* ── TOP HEADER ── */}
        <header
          className="flex items-center justify-between px-8 h-14 shrink-0"
          style={{ borderBottom: "1px solid #E5E7EB", background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)" }}
        >
          <div>
            <h1 style={{ fontWeight: 700, fontSize: "0.95rem", letterSpacing: "-0.02em", color: "#111827" }}>
              {current.title}
            </h1>
            <p style={{ color: "#9CA3AF", fontSize: "11px" }}>{current.sub}</p>
          </div>

          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            {/* Time range */}
            <div className="hidden xl:flex items-center rounded-xl overflow-hidden"
              style={{ border: "1px solid #E5E7EB" }}>
              {["30d","60d","90d"].map(r => (
                <button key={r} onClick={() => setTimeRange(r)}
                  className="px-3 py-1.5 text-xs transition-all"
                  style={{
                    background: timeRange === r ? ACCENT_SOFT : "transparent",
                    color: timeRange === r ? ACCENT : "#6B7280",
                    fontWeight: timeRange === r ? 700 : 400,
                    borderRight: r !== "90d" ? "1px solid #E5E7EB" : "none",
                  }}>
                  {r}
                </button>
              ))}
            </div>

            <button className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all"
              style={{ background: "#FFF7ED", color: "#9A3412", border: "1px solid #FDBA74" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#7C2D12"; e.currentTarget.style.background = "#FFEDD5"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#9A3412"; e.currentTarget.style.background = "#FFF7ED"; }}
              onClick={handleExport}>
              <Download size={12} /> Xuất dữ liệu
            </button>

            <button className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all"
              style={{ background: ACCENT, color: "#FFFFFF", border: `1px solid ${ACCENT}` }}
              onMouseEnter={e => { e.currentTarget.style.background = ACCENT_DEEP; e.currentTarget.style.borderColor = ACCENT_DEEP; }}
              onMouseLeave={e => { e.currentTarget.style.background = ACCENT; e.currentTarget.style.borderColor = ACCENT; }}
              onClick={handleSendSummary}>
              Gửi báo cáo
            </button>

            <button className="relative p-2 rounded-xl transition-all"
              style={{ color: "#6B7280", border: "1px solid #E5E7EB" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#111827"; e.currentTarget.style.background = "#F3F4F6"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#6B7280"; e.currentTarget.style.background = "transparent"; }}>
              <Bell size={15} />
              <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
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
          </div>
        </header>

        <div className="px-8 py-2.5 flex items-center justify-between" style={{ background: "#FFF7ED", borderBottom: "1px solid #FED7AA" }}>
          <p style={{ fontSize: "11px", color: "#9A3412" }}>
            Khung thời gian: <strong>{timeRange}</strong> · Đồng bộ lần cuối: <strong>{lastSync.toLocaleTimeString("vi-VN")}</strong>
          </p>
          <button
            onClick={handleSync}
            className="text-xs px-3 py-1 rounded-lg transition-all"
            style={{ color: "#9A3412", border: "1px solid #FDBA74", background: "#FFEDD5" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#FED7AA"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#FFEDD5"; }}
          >
            Đồng bộ ngay
          </button>
        </div>

        {/* ── SCROLLABLE CONTENT ── */}
        <div className="flex-1 overflow-y-auto p-7">
          {actionMessage && (
            <div className="mb-4 px-4 py-2 rounded-xl text-sm" style={{ background: "#FFF7ED", border: "1px solid #FDBA74", color: "#9A3412" }}>
              {actionMessage}
            </div>
          )}
          {activeNav === "users"      && <UsersView />}
          {activeNav === "financials" && <FinancialsView />}
          {activeNav === "b2b"        && <B2BView />}
        </div>
      </main>

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
                  onMouseEnter={e => { e.currentTarget.style.background = "#FFF7ED"; e.currentTarget.style.color = "#9A3412"; }}
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
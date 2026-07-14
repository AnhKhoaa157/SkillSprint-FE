import { BarChart3, DollarSign, Layers, Megaphone, MessageSquare, ServerCog, ShieldAlert, ShieldCheck, Store, TrendingUp } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router";

const NAV_ITEMS = [
  { label: "Tài chính", icon: TrendingUp, to: "/admin" },
  { label: "Quản lý người dùng", icon: ShieldCheck, to: "/admin" },
  { label: "Quản lý bảng điểm", icon: BarChart3, to: "/admin" },
  { label: "Quản lý thanh toán", icon: DollarSign, to: "/admin" },
  { label: "Gói dịch vụ", icon: Layers, to: "/admin" },
  { label: "Feedback người dùng", icon: MessageSquare, to: "/admin" },
  { label: "Kiểm duyệt cộng đồng", icon: ShieldAlert, to: "/admin" },
  { label: "Duyệt Quiz Pack", icon: Store, to: "/admin/marketplace", marketplace: true },
  { label: "Phòng cộng đồng", icon: Megaphone, to: "/admin" },
  { label: "Hệ thống & Cảnh báo", icon: ServerCog, to: "/admin" },
] as const;

export default function AdminLayout() {
  const location = useLocation();
  const isDashboardHome = location.pathname === "/admin" || location.pathname === "/admin/";

  // The dashboard owns its own full shell. Sub-pages use the same navigation styling
  // so they remain part of the Admin experience instead of opening as standalone pages.
  if (isDashboardHome) return <Outlet />;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F1F5F9", fontFamily: "'Inter', sans-serif", color: "#111827" }}>
      <aside className="flex h-full w-56 shrink-0 flex-col" style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)", borderRight: "1px solid #E2E8F0" }}>
        <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: "1px solid rgba(148,163,184,0.18)" }}>
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-white"><img src="/logo.png" alt="SkillSprint Logo" className="h-full w-full object-contain p-1" /></div>
          <div><p className="text-[0.95rem] font-extrabold leading-tight text-slate-900">SkillSprint</p><p className="mt-0.5 text-[0.58rem] font-bold uppercase tracking-[0.12em] text-slate-400">Cổng quản trị</p></div>
        </div>
        <div className="px-5 pb-2 pt-5"><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">Điều hướng</p></div>
        <nav className="flex-1 space-y-0.5 px-3 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const { label, icon: Icon, to } = item;
            const active = Boolean("marketplace" in item && item.marketplace && location.pathname.startsWith("/admin/marketplace"));
            return <Link key={label} to={to} className="flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors" style={{ background: active ? "rgba(255,107,0,0.07)" : "transparent", borderColor: active ? "rgba(255,107,0,0.18)" : "transparent", color: active ? "#C2410C" : "#334155", fontWeight: active ? 700 : 400 }}><Icon size={15} style={{ color: active ? "#FF6B00" : "#64748B" }} /><span className="flex-1">{label}</span>{active && <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B00]" />}</Link>;
          })}
        </nav>
        <div className="px-3 pb-4 pt-3" style={{ borderTop: "1px solid rgba(148,163,184,0.18)" }}><Link to="/admin" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-slate-500 hover:bg-slate-100">← Về trang quản trị</Link></div>
      </aside>
      <main className="min-w-0 flex-1 overflow-y-auto"><header className="flex h-14 items-center border-b border-slate-200 bg-white/95 px-8"><div><p className="text-sm font-bold text-slate-900">Duyệt Quiz Pack</p><p className="text-[11px] text-slate-400">Marketplace moderation</p></div></header><Outlet /></main>
    </div>
  );
}

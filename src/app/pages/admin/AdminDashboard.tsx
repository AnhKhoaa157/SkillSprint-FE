import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { TrendingUp, DollarSign, MessageSquare, Award, BookOpen, Command, Download, GraduationCap, Search, ShieldCheck, X } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "sonner";
import AdminHealth from "./AdminHealth";
import AdminFeedback from "./AdminFeedback";
import FinancialsView, { Sparkline, USER_GROWTH_DATA } from "./FinancialsView";
import PaymentsView from "./PaymentsView";
import healthService from "../../../api/healthService";
import adminUserService from "../../../api/adminUserService";

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
        <div className="flex items-center gap-3 px-5 py-5"
          style={{ borderBottom: "1px solid rgba(148,163,184,0.18)" }}>
          <div
            className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-slate-100"
            style={{ background: "white" }}
          >
            <img
              src="/logo.png"
              alt="SkillSprint Logo"
              className="w-full h-full object-contain p-1"
            />
          </div>

          <div className="flex flex-col min-w-0">
            <p style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0F172A", lineHeight: 1.2 }}>
              SkillSprint
            </p>
            <p style={{ color: "#94A3B8", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: "2px" }}>
              CỔNG QUẢN TRỊ
            </p>
          </div>
        </div>

        {/* Section label */}
        <div className="px-5 pt-5 pb-2">
          <p style={{ color: "#64748B", fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Điều hướng
          </p>
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
                  background: isActive ? "rgba(255,107,0,0.07)" : "transparent",
                  border: isActive ? "1px solid rgba(255,107,0,0.18)" : "1px solid transparent",
                  color: isActive ? "#C2410C" : "#334155",
                  fontWeight: isActive ? 700 : 400,
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(148,163,184,0.10)"; e.currentTarget.style.color = "#0F172A"; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#334155"; } }}
              >
                <item.icon size={15} style={{ color: isActive ? "#FF6B00" : "#64748B", flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: "#FF6B00" }} />
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
              style={{ background: "rgba(255,107,0,0.07)", color: "#C2410C", border: "1px solid rgba(255,107,0,0.18)" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#9A3412"; e.currentTarget.style.background = "rgba(255,107,0,0.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#C2410C"; e.currentTarget.style.background = "rgba(255,107,0,0.07)"; }}
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
            <div className="mb-4 px-4 py-2 rounded-xl text-sm" style={{ background: "rgba(255,107,0,0.06)", border: "1px solid rgba(255,107,0,0.18)", color: "#C2410C" }}>
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
                    <div className="px-4 py-2 rounded-xl text-sm" style={{ background: "rgba(255,107,0,0.06)", border: "1px solid rgba(255,107,0,0.18)", color: "#C2410C" }}>
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
                                      <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#FF6B00,#F97316)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.82rem", flexShrink: 0 }}>
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
                                      style={{ background: "rgba(255,107,0,0.07)", border: "1px solid rgba(255,107,0,0.2)", color: "#C2410C" }}
                                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,107,0,0.14)"; }}
                                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,107,0,0.07)"; }}
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

                    <div className="rounded-2xl p-4" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderTop: "3px solid #FF6B00" }}>
                      <h3 style={{ margin: "0 0 8px", fontSize: "0.95rem", fontWeight: 800, color: "#0F172A" }}>Chi tiết & cập nhật</h3>
                      {!mgmtSelected ? (
                        <div className="py-8 text-center">
                          <p style={{ fontSize: "0.82rem", color: "#94A3B8" }}>Chọn một người dùng để xem chi tiết và cập nhật.</p>
                        </div>
                      ) : (
                        <div className="space-y-3 mt-3">
                          <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#FF6B00,#F97316)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.1rem", flexShrink: 0 }}>
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
          {activeNav === "feedback" && <AdminFeedback isDashboard={true} />}
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
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,107,0,0.07)"; e.currentTarget.style.color = "#C2410C"; }}
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

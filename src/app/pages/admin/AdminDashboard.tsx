import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { TrendingUp, DollarSign, MessageSquare, Command, Download, ShieldCheck, X, Layers } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import AdminHealth from "./AdminHealth";
import AdminFeedback from "./AdminFeedback";
import AdminUsers from "./AdminUsers";
import FinancialsView, { USER_GROWTH_DATA } from "./FinancialsView";
import PaymentsView from "./PaymentsView";
import { SubscriptionPlansView } from "./SubscriptionPlansView";
import healthService from "../../../api/healthService";

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
  const [activeNav, setActiveNav] = useState<"financials" | "users" | "payments" | "feedback" | "subscriptions">("financials");
  const [, setLastSync] = useState(new Date());
  const [actionMessage, setActionMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<{ fullName?: string; roles?: string[]; avatarUrl?: string } | null>(null);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [showHealthPanel, setShowHealthPanel] = useState(false);

  const navItems = [
    { id: "financials",    label: "Tài chính",           icon: TrendingUp  },
    { id: "users",         label: "Quản lý người dùng",  icon: ShieldCheck },
    { id: "payments",      label: "Quản lý thanh toán",  icon: DollarSign  },
    { id: "subscriptions", label: "Gói dịch vụ",         icon: Layers      },
    { id: "feedback",      label: "Feedback người dùng", icon: MessageSquare },
  ] as const;

  const handleLogout = () => {
    logout();
    navigate("/admin-login", { replace: true });
  };

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
    financials:    { title: "Tài chính",           sub: "Chỉ số doanh thu · Unit economics" },
    users:         { title: "Quản lý người dùng",  sub: "Quản lý người dùng và phân quyền" },
    payments:      { title: "Quản lý thanh toán",  sub: "Lịch sử giao dịch · Phân tích thanh toán" },
    subscriptions: { title: "Gói dịch vụ",         sub: "Quản lý subscription plans · Tính năng · Nhật ký" },
    feedback:      { title: "Feedback người dùng", sub: "Xem và quản lý phản hồi từ người dùng" },
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
    { id: "goto-subscriptions", label: "Đi tới Gói dịch vụ", keywords: "subscriptions plans gói dịch vụ features tính năng", action: () => setActiveNav("subscriptions") },
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

  // Health status for admin header indicator
  const [healthStatus, setHealthStatus] = useState<'unknown' | 'up' | 'down'>('unknown');
  const [lastHealthPayload, setLastHealthPayload] = useState<any>(null);
  useEffect(() => {
    const off = healthService.subscribeHealth((s: any) => setHealthStatus(s));
    healthService.probeHealth().then((p) => setLastHealthPayload(p)).catch(() => { });
    return () => off();
  }, []);

  // External trigger from profile dropdown to open user management tab
  useEffect(() => {
    const handler = () => setActiveNav("users");
    window.addEventListener('openAdminUserMgmt', handler);
    return () => window.removeEventListener('openAdminUserMgmt', handler);
  }, []);

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
                onClick={() => setActiveNav(item.id)}
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

        {/* Top header */}
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

            {/* User menu */}
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <AdminUsers />
            </motion.div>
          )}
          {activeNav === "financials" && <FinancialsView />}
          {activeNav === "payments" && <PaymentsView />}
          {activeNav === "subscriptions" && <SubscriptionPlansView />}
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

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { TrendingUp, DollarSign, MessageSquare, Command, Download, ShieldCheck, ShieldAlert, X, Layers, ServerCog, Megaphone, BarChart3, Store, WalletCards, HandCoins, Scale } from "lucide-react";
import { Link, useLocation, useMatch, useNavigate } from "react-router";
import { useAuth } from "../../../contexts/AuthContext";
import AdminHealth from "../sections/health";
import AdminFeedback from "../sections/feedback";
import AdminUsers from "../sections/users";
import FinancialsView from "../sections/financials";
import PaymentsView from "../sections/payments";
import SubscriptionPlansView from "../sections/subscriptionPlans";
import AdminSystemSection from "../sections/system/AdminSystemSection";
import AdminLeaderboard from "../sections/leaderboard";
import AdminCommunityModeration from "../sections/community/AdminCommunityModeration";
import AdminCommunityRooms from "../sections/community/AdminCommunityRooms";
import MarketplaceAdmin from "../MarketplaceAdmin";
import MarketplaceReportsAdmin from "../MarketplaceReportsAdmin";
import MarketplaceOpsAdmin from "../MarketplaceOpsAdmin";
import MarketplacePayouts from "../MarketplacePayouts";
import CoinWalletSection from "../sections/wallet/CoinWalletSection";
import AdminUserDetail from "../userDetail";
import healthService from "../../../../api/system/healthService";

type AdminNavSection = "financials" | "users" | "payments" | "wallet" | "feedback" | "subscriptions" | "system" | "leaderboard" | "community" | "communityRooms" | "marketplace" | "marketplaceReports" | "marketplaceOps" | "payouts";

function getRequestedAdminSection(state: unknown): AdminNavSection | null {
  if (!state || typeof state !== "object") return null;

  const section = (state as { adminSection?: unknown }).adminSection;
  return section === "financials" || section === "users" || section === "payments" || section === "wallet" ||
    section === "feedback" || section === "subscriptions" || section === "system" || section === "leaderboard" ||
    section === "community" || section === "communityRooms" || section === "marketplace" ||
    section === "marketplaceReports" || section === "marketplaceOps" || section === "payouts"
    ? section
    : null;
}

/** Navbar profile avatar. Renders a strictly square, cropped circular image and
 *  falls back to the styled initial circle on a missing/broken source. Keeping the
 *  <img> a real w-8/h-8 node (not an absolutely-stretched overlay) lets object-cover
 *  crop the native aspect ratio instead of squishing non-square sources. */
function AdminNavAvatar({ avatarUrl, fullName }: { avatarUrl?: string; fullName?: string }) {
  const [imgError, setImgError] = useState(false);
  const initial = (fullName || "A").charAt(0).toUpperCase();
  const showImage = !!avatarUrl && !imgError;

  useEffect(() => { setImgError(false); }, [avatarUrl]);

  if (showImage) {
    return (
      <img
        src={avatarUrl}
        alt={fullName || "Admin avatar"}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg,#FF6B00,#FF9A3D)' }}
    >
      <span style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>{initial}</span>
    </div>
  );
}

export default function AdminDashboard() {
  const location = useLocation();
  const userDetailMatch = useMatch("/admin/users/:id");
  const requestedSection = getRequestedAdminSection(location.state);
  const isUserDetailRoute = Boolean(userDetailMatch);
  const [activeNav, setActiveNav] = useState<AdminNavSection>(() => requestedSection ?? (isUserDetailRoute ? "users" : "financials"));
  const [, setLastSync] = useState(new Date());
  const [actionMessage, setActionMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<{ fullName?: string; roles?: string[]; avatarUrl?: string } | null>(null);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [showHealthPanel, setShowHealthPanel] = useState(false);

  useEffect(() => {
    if (requestedSection) setActiveNav(requestedSection);
  }, [requestedSection]);

  const navGroups = [
    {
      label: "Tổng quan",
      items: [{ id: "financials", label: "Dashboard", icon: TrendingUp }],
    },
    {
      label: "Người dùng",
      items: [
        { id: "users", label: "Quản lý người dùng", icon: ShieldCheck },
        { id: "subscriptions", label: "Gói dịch vụ", icon: Layers },
        { id: "leaderboard", label: "Quản lý bảng điểm", icon: BarChart3 },
      ],
    },
    {
      label: "Tài chính",
      items: [
        { id: "payments", label: "Quản lý thanh toán", icon: DollarSign },
        { id: "wallet", label: "Quản lý ví Coin", icon: WalletCards },
        { id: "payouts", label: "Yêu cầu rút tiền", icon: HandCoins },
      ],
    },
    {
      label: "Marketplace",
      items: [
        { id: "marketplace", label: "Duyệt Quiz Pack", icon: Store },
        { id: "marketplaceReports", label: "Báo cáo Marketplace", icon: ShieldAlert },
        { id: "marketplaceOps", label: "Vận hành Marketplace", icon: Scale },
      ],
    },
    {
      label: "Cộng đồng & hỗ trợ",
      items: [
        { id: "community", label: "Kiểm duyệt cộng đồng", icon: ShieldAlert },
        { id: "communityRooms", label: "Phòng cộng đồng", icon: Megaphone },
        { id: "feedback", label: "Feedback người dùng", icon: MessageSquare },
      ],
    },
    {
      label: "Hệ thống",
      items: [{ id: "system", label: "Hệ thống & Cảnh báo", icon: ServerCog }],
    },
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
    wallet:        { title: "Quản lý ví Coin",      sub: "Số dư · Audit điều chỉnh · Giao dịch Coin" },
    financials:    { title: "Tài chính",           sub: "Chỉ số doanh thu · Unit economics" },
    users:         { title: "Quản lý người dùng",  sub: "Quản lý người dùng và phân quyền" },
    leaderboard:   { title: "Quản lý bảng điểm",   sub: "Xếp hạng người dùng theo XP · Tuần · Tháng · Tổng" },
    payments:      { title: "Quản lý thanh toán",  sub: "Lịch sử giao dịch · Phân tích thanh toán" },
    subscriptions: { title: "Gói dịch vụ",         sub: "Quản lý subscription plans · Tính năng · Nhật ký" },
    feedback:      { title: "Feedback người dùng", sub: "Xem và quản lý phản hồi từ người dùng" },
    community:     { title: "Kiểm duyệt cộng đồng", sub: "Duyệt bài viết · Bình luận · Report · Từ khóa cấm" },
    marketplace:   { title: "Duyệt Quiz Pack", sub: "Kiểm tra nội dung và xuất bản Quiz Pack" },
    marketplaceReports: { title: "Báo cáo Marketplace", sub: "Xem xét và xử lý báo cáo nội dung Quiz Pack" },
    marketplaceOps: { title: "Vận hành Marketplace", sub: "Tranh chấp hoàn tiền · Chỉ số chất lượng phiên bản" },
    payouts:       { title: "Yêu cầu rút tiền", sub: "Duyệt và đối soát chuyển khoản cho Creator" },
    communityRooms: { title: "Quản lý Phòng Cộng Đồng", sub: "Danh sách phòng · Tin nhắn · Trạng thái" },
    system:        { title: "Hệ thống & Cảnh báo", sub: "Bảo trì hệ thống · Thông báo chung" },
  };

  const handleNavigation = (section: AdminNavSection) => {
    if (isUserDetailRoute) {
      navigate("/admin", { state: { adminSection: section } });
      return;
    }
    setActiveNav(section);
  };
  const current = headerLabels[activeNav];

  useEffect(() => {
    let mounted = true;
    import('../../../../api/utilities/meService').then(mod => mod.getMe().then((me: any) => {
      if (!mounted) return;
      setCurrentUser(me);
    }).catch(() => { }));
    return () => { mounted = false; };
  }, []);

  const handleExport = () => {
    setActionMessage("Xuất dữ liệu đang được phát triển.");
  };

  const handleSync = () => {
    setLastSync(new Date());
    setActionMessage("Đã đồng bộ dữ liệu admin thành công.");
  };

  const commandActions = [
    { id: "goto-wallet", label: "Đi tới Quản lý ví Coin", keywords: "wallet coin số dư nạp điều chỉnh", action: () => setActiveNav("wallet") },
    { id: "goto-users", label: "Đi tới Quản lý người dùng", keywords: "users students cohorts quản lý người dùng phân quyền", action: () => setActiveNav("users") },
    { id: "goto-leaderboard", label: "Đi tới Quản lý bảng điểm", keywords: "leaderboard ranking xp điểm bảng xếp hạng quản lý bảng điểm thống kê", action: () => setActiveNav("leaderboard") },
    { id: "goto-financials", label: "Đi tới Tài chính", keywords: "finance revenue mrr", action: () => setActiveNav("financials") },
    { id: "goto-payments", label: "Đi tới Quản lý thanh toán", keywords: "payments transactions giao dịch thanh toán", action: () => setActiveNav("payments") },
    { id: "goto-system", label: "Đi tới Hệ thống & Cảnh báo", keywords: "system maintenance bảo trì trạng thái hệ thống vận hành thông báo announcements", action: () => setActiveNav("system") },
    { id: "goto-marketplace", label: "Đi tới Duyệt Quiz Pack", keywords: "marketplace quiz pack duyệt xuất bản", action: () => setActiveNav("marketplace") },
    { id: "goto-marketplace-reports", label: "Đi tới Báo cáo Marketplace", keywords: "marketplace report báo cáo nội dung vi phạm", action: () => setActiveNav("marketplaceReports") },
    { id: "goto-marketplace-ops", label: "Đi tới Vận hành Marketplace", keywords: "marketplace dispute refund hoàn tiền tranh chấp chỉ số metrics", action: () => setActiveNav("marketplaceOps") },
    { id: "goto-payouts", label: "Đi tới Yêu cầu rút tiền", keywords: "payout creator withdrawal rút tiền chuyển khoản", action: () => setActiveNav("payouts") },
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
        style={{ width: "248px", background: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)", borderRight: "1px solid #E2E8F0" }}
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

        {/* Nav */}
        <nav className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-4">
          {navGroups.map(group => (
            <div key={group.label}>
              <p className="px-3 pb-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const isActive = activeNav === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item.id)}
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
                      <span className="min-w-0 flex-1 truncate whitespace-nowrap" title={item.label}>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
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

            <button disabled title="Tính năng đang phát triển" className="hidden md:flex cursor-not-allowed items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold opacity-55"
              style={{ background: "#F8FAFC", color: "#64748B", border: "1px solid #E2E8F0" }}>
              <Download size={12} /> Xuất dữ liệu <span className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-slate-500">Đang phát triển</span>
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
                <AdminNavAvatar avatarUrl={currentUser?.avatarUrl} fullName={currentUser?.fullName} />
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
        <div className={`flex-1 overflow-y-auto [scrollbar-gutter:stable_both-edges] ${isUserDetailRoute ? "" : "p-7"}`}>
          {actionMessage && (
            <div className="mb-4 px-4 py-2 rounded-xl text-sm" style={{ background: "rgba(255,107,0,0.06)", border: "1px solid rgba(255,107,0,0.18)", color: "#C2410C" }}>
              {actionMessage}
            </div>
          )}
          {isUserDetailRoute ? <AdminUserDetail /> : (
            <>
          {activeNav === "users" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <AdminUsers />
            </motion.div>
          )}
          {activeNav === "leaderboard" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <AdminLeaderboard />
            </motion.div>
          )}
          {activeNav === "financials" && <FinancialsView />}
          {activeNav === "payments" && <PaymentsView />}
          {activeNav === "wallet" && <CoinWalletSection />}
          {activeNav === "subscriptions" && <SubscriptionPlansView />}
          {activeNav === "feedback" && <AdminFeedback isDashboard={true} />}
          {activeNav === "community" && <AdminCommunityModeration isDashboard={true} />}
          {activeNav === "marketplace" && <MarketplaceAdmin />}
          {activeNav === "marketplaceReports" && <MarketplaceReportsAdmin />}
          {activeNav === "marketplaceOps" && <MarketplaceOpsAdmin />}
          {activeNav === "payouts" && <MarketplacePayouts />}
          {activeNav === "communityRooms" && <AdminCommunityRooms isDashboard={true} />}
          {activeNav === "system" && (
            <AdminSystemSection />
          )}
            </>
          )}
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

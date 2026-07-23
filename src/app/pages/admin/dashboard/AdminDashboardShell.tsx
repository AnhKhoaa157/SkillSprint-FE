import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { TrendingUp, DollarSign, MessageSquare, Command, Download, ShieldCheck, ShieldAlert, X, Layers, ServerCog, Megaphone, BarChart3, Store, WalletCards, HandCoins, Scale, ChevronDown, LogOut, UserRound } from "lucide-react";
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
import MarketplaceAdmin from "../sections/marketplace/MarketplaceAdmin";
import MarketplaceReportsAdmin from "../sections/marketplace/MarketplaceReportsAdmin";
import MarketplaceOpsAdmin from "../sections/marketplace/MarketplaceOpsAdmin";
import MarketplacePayouts from "../sections/marketplace/MarketplacePayouts";
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
  const [currentUser, setCurrentUser] = useState<{ fullName?: string; email?: string; roles?: string[]; avatarUrl?: string } | null>(null);
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
      icon: TrendingUp,
      iconClass: "bg-orange-50 text-[#F97316] ring-orange-100",
      items: [{ id: "financials", label: "Dashboard", icon: TrendingUp }],
    },
    {
      label: "Người dùng",
      icon: UserRound,
      iconClass: "bg-sky-50 text-sky-600 ring-sky-100",
      items: [
        { id: "users", label: "Quản lý người dùng", icon: ShieldCheck },
        { id: "subscriptions", label: "Gói dịch vụ", icon: Layers },
        { id: "leaderboard", label: "Quản lý bảng điểm", icon: BarChart3 },
      ],
    },
    {
      label: "Tài chính",
      icon: WalletCards,
      iconClass: "bg-emerald-50 text-emerald-600 ring-emerald-100",
      items: [
        { id: "payments", label: "Quản lý thanh toán", icon: DollarSign },
        { id: "wallet", label: "Quản lý ví Coin", icon: WalletCards },
        { id: "payouts", label: "Yêu cầu rút tiền", icon: HandCoins },
      ],
    },
    {
      label: "Marketplace",
      icon: Store,
      iconClass: "bg-violet-50 text-violet-600 ring-violet-100",
      items: [
        { id: "marketplace", label: "Duyệt Quiz Pack", icon: Store },
        { id: "marketplaceReports", label: "Báo cáo Marketplace", icon: ShieldAlert },
        { id: "marketplaceOps", label: "Vận hành Marketplace", icon: Scale },
      ],
    },
    {
      label: "Cộng đồng & hỗ trợ",
      icon: Megaphone,
      iconClass: "bg-blue-50 text-blue-600 ring-blue-100",
      items: [
        { id: "community", label: "Kiểm duyệt cộng đồng", icon: ShieldAlert },
        { id: "communityRooms", label: "Phòng cộng đồng", icon: Megaphone },
        { id: "feedback", label: "Feedback người dùng", icon: MessageSquare },
      ],
    },
    {
      label: "Hệ thống",
      icon: ServerCog,
      iconClass: "bg-slate-100 text-slate-600 ring-slate-200",
      items: [{ id: "system", label: "Hệ thống & Cảnh báo", icon: ServerCog }],
    },
  ] as const;

  const activeNavGroup = navGroups.find((group) => group.items.some((item) => item.id === activeNav))?.label;
  const [expandedNavGroups, setExpandedNavGroups] = useState<string[]>(() => [activeNavGroup ?? navGroups[0].label]);

  useEffect(() => {
    if (!activeNavGroup) return;

    setExpandedNavGroups((groups) => groups.includes(activeNavGroup) ? groups : [...groups, activeNavGroup]);
  }, [activeNavGroup]);

  const toggleNavGroup = (groupLabel: string) => {
    setExpandedNavGroups((groups) => (
      groups.includes(groupLabel)
        ? groups.filter((label) => label !== groupLabel)
        : [...groups, groupLabel]
    ));
  };

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
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setUserMenuOpen(false);
    }
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
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
        className="flex h-full w-[272px] shrink-0 flex-col border-r border-slate-200/80 bg-[#FCFDFE] p-3 shadow-[12px_0_35px_rgba(15,23,42,0.025)]"
      >
        {/* Logo */}
        <div className="relative overflow-hidden rounded-2xl border border-orange-100 bg-[linear-gradient(135deg,#FFF9F4_0%,#FFFFFF_62%,#FFF3E7_100%)] px-4 py-3.5 shadow-[0_8px_22px_rgba(194,65,12,0.05)]">
          <div aria-hidden="true" className="pointer-events-none absolute -right-5 -top-6 h-20 w-20 rounded-full border-[14px] border-orange-100/60" />
          <div
            className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-orange-100 bg-white shadow-[0_8px_18px_rgba(255,107,0,0.1)]"
          >
            <img
              src="/brand-logo.svg"
              alt="Biểu tượng SkillSprint"
              className="h-11 w-11"
            />
          </div>
          <div className="relative mt-3 flex min-w-0 items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[15px] font-black tracking-[-0.03em] text-slate-950">SkillSprint</p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Không gian quản trị</p>
            </div>
            <span className="rounded-lg border border-orange-100 bg-orange-50 px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-[#C2410C]">Admin</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="min-h-0 flex-1 overflow-y-auto px-1 py-5" aria-label="Điều hướng quản trị">
          <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Điều hướng</p>
          <div className="space-y-1.5">
          {navGroups.map((group, groupIndex) => {
            const isExpanded = expandedNavGroups.includes(group.label);
            const containsActiveItem = group.items.some((item) => item.id === activeNav);
            const groupId = `admin-nav-group-${groupIndex}`;
            const GroupIcon = group.icon;

            return (
              <div key={group.label} className={`rounded-2xl p-1.5 transition-colors ${containsActiveItem ? "bg-orange-50/65" : "hover:bg-slate-50/80"}`}>
                <button
                  type="button"
                  onClick={() => toggleNavGroup(group.label)}
                  aria-expanded={isExpanded}
                  aria-controls={groupId}
                  className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-2.5 text-left text-[10px] font-extrabold uppercase tracking-[0.12em] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${containsActiveItem ? "text-[#C2410C]" : "text-slate-500 hover:bg-white hover:text-slate-800"}`}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ring-1 transition-colors ${containsActiveItem ? "bg-white text-[#FF6B00] ring-orange-100 shadow-sm" : group.iconClass}`}>
                      <GroupIcon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="truncate">{group.label}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5 text-slate-400">
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold normal-case tracking-normal ${containsActiveItem ? "bg-orange-100 text-[#C2410C]" : "bg-slate-100 text-slate-500"}`}>{group.items.length}</span>
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180 text-orange-500" : ""}`} aria-hidden="true" />
                  </span>
                </button>

                <div id={groupId} className={`grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none ${isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                  <div className="min-h-0 overflow-hidden">
                    <div className="ml-5 mt-1 space-y-0.5 border-l border-orange-100/80 pb-1 pl-3 pr-1">
                      {group.items.map((item) => {
                        const isActive = activeNav === item.id;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleNavigation(item.id)}
                            className={`relative flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${isActive ? "bg-white font-bold text-[#C2410C] shadow-[0_6px_16px_rgba(194,65,12,0.08)] before:absolute before:-left-[13px] before:h-6 before:w-0.5 before:rounded-full before:bg-[#FF6B00]" : "text-slate-600 hover:bg-white hover:text-slate-950"}`}
                          >
                            <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-[#FF6B00]" : "text-slate-500"}`} aria-hidden="true" />
                            <span className="min-w-0 flex-1 truncate whitespace-nowrap" title={item.label}>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </nav>

        {/* Direct management link removed — moved to user dropdown */}

        {/* Bottom */}
        <div className="mt-3 border-t border-slate-100 px-1 pt-3">
          <button onClick={handleLogout} className="flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-left text-xs font-bold text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-100">
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Đăng xuất
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
                type="button"
                className="flex min-h-11 items-center gap-2 rounded-xl px-2.5 text-sm transition hover:border-orange-200 hover:bg-orange-50/60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100"
                style={{ background: userMenuOpen ? '#FFF7ED' : '#FFFFFF', border: userMenuOpen ? '1px solid #FED7AA' : '1px solid #E5E7EB' }}
                onClick={() => setUserMenuOpen(v => !v)}
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
              >
                <AdminNavAvatar avatarUrl={currentUser?.avatarUrl} fullName={currentUser?.fullName} />
                <div className="hidden max-w-28 min-w-0 flex-col text-left sm:flex" style={{ lineHeight: 1 }}>
                  <span className="truncate text-[0.78rem] font-bold text-slate-800">{currentUser?.fullName || "Quản trị"}</span>
                  <span className="mt-1 text-[10px] font-medium text-slate-400">Admin</span>
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${userMenuOpen ? "rotate-180 text-orange-500" : ""}`} aria-hidden="true" />
              </button>
              {userMenuOpen && (
                <div role="menu" className="absolute right-0 top-[calc(100%+10px)] z-[9999] w-72 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-2 shadow-[0_18px_40px_rgba(15,23,42,0.16)]">
                  <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50/60 px-3 py-3">
                    <AdminNavAvatar avatarUrl={currentUser?.avatarUrl} fullName={currentUser?.fullName} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-900">{currentUser?.fullName || "Quản trị viên"}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{currentUser?.email || "Tài khoản quản trị"}</p>
                    </div>
                  </div>
                  <div className="my-2 h-px bg-slate-100" />
                  <Link to="/admin/profile" role="menuitem" onClick={() => setUserMenuOpen(false)} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold text-slate-700 transition hover:bg-slate-50 hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600"><UserRound size={16} /></span>
                    <span className="flex-1">Hồ sơ của tôi</span>
                  </Link>
                  <button type="button" role="menuitem" onClick={handleLogout} className="mt-1 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold text-rose-600 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600"><LogOut size={16} /></span>
                    <span>Đăng xuất</span>
                  </button>
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

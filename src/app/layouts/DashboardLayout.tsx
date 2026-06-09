import { useEffect, useState } from "react";
import { Outlet, NavLink, useLocation, Link, useNavigate } from "react-router";
import {
  LayoutDashboard, Map, Mic,
  Menu, X, Zap, Bell, ChevronRight, Crown, Gift, Sparkles,
  AlertTriangle, CalendarClock, BookOpenCheck, CheckCircle2,
  LoaderCircle,
} from "lucide-react";
import { useNotificationSocket } from "../hooks/useNotificationSocket";
import { APP_NAV_SECTIONS } from "../config/nav";
import { motion, AnimatePresence } from "motion/react";
import { PricingModal } from "../components/modals/PricingModal";
import { BrandLogo } from "../components/layout/BrandLogo";
import meService from "../../api/meService";
import workspaceService from "../../api/workspaceService";
import { getStoredUserProfile } from "../../api/authService";

/* ─── Sidebar Design Tokens ─── */
const F      = "'Inter','Plus Jakarta Sans',sans-serif";
const SBG    = "#FFFFFF";   // sidebar white
const SBDR   = "rgba(15,23,42,0.06)";
const STXT   = "#64748B";   // inactive text
const STXT_A = "#0F172A";   // active text
const OG     = "#FF6B00";
const OGL    = "rgba(255,107,0,0.08)";
const SHOVER = "rgba(15,23,42,0.03)";
/* content area tokens */
const BG     = "#F9FAFB";
const CARD   = "#FFFFFF";
const T1     = "#1F2937";
const T2     = "#6B7280";
const T3     = "#9CA3AF";
const BDR    = "#E5E7EB";

const CRUMBS: Record<string,string> = {
  "/app":"Trung tâm điều khiển",
  "/app/syllabus":"Nhập syllabus",
  "/app/roadmap":"Lộ trình AI",
  "/app/calendar":"Lịch học",
  "/app/matrix":"Ma trận công việc",
  "/app/leaderboard":"Bảng xếp hạng",
  "/app/learning":"Trung tâm học tập",
  "/app/learning/course":"Trung tâm học tập > Video bài giảng",
  "/app/quiz-review":"Trung tâm học tập > Quiz luyện tập",
  "/app/profile":"Cài đặt",
  "/app/upgraded":"Sau nâng cấp",
  "/app/workspaces":"Workspaces",
};

type RoadmapSidebarWorkspace = {
  workspaceId?: unknown;
  id?: unknown;
  name?: unknown;
  title?: unknown;
  workspaceName?: unknown;
  status?: unknown;
  roadmapStatus?: unknown;
  roadmapId?: unknown;
  learningStructure?: {
    status?: unknown;
    roadmapStatus?: unknown;
    chapters?: unknown[];
    tasks?: unknown[];
    [key: string]: unknown;
  } | null;
  currentRoadmap?: unknown;
  roadmap?: unknown;
  hasRoadmap?: unknown;
  [key: string]: unknown;
};

type RoadmapSidebarItem = {
  id: string;
  name: string;
  statusLabel: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toText(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return undefined;
}

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return ["true", "1", "yes", "y"].includes(value.trim().toLowerCase());
  }

  return false;
}

function extractRoadmapCandidates(payload: unknown): RoadmapSidebarWorkspace[] {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord) as RoadmapSidebarWorkspace[];
  }

  if (!isRecord(payload)) {
    return [];
  }

  const candidates = [payload.data, payload.content, payload.items, payload.workspaces, payload.payload, payload.result];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter(isRecord) as RoadmapSidebarWorkspace[];
    }

    if (isRecord(candidate)) {
      const nested = extractRoadmapCandidates(candidate);
      if (nested.length > 0) {
        return nested;
      }
    }
  }

  return [];
}

function getRoadmapStatusLabel(workspace: RoadmapSidebarWorkspace): string {
  const learningStructure = isRecord(workspace.learningStructure) ? workspace.learningStructure : null;
  const status =
    toText(learningStructure?.status) ??
    toText(workspace.status) ??
    toText(workspace.roadmapStatus) ??
    toText((isRecord(workspace.currentRoadmap) ? workspace.currentRoadmap : null)?.status) ??
    toText((isRecord(workspace.roadmap) ? workspace.roadmap : null)?.status);

  return (status || "").toUpperCase();
}

function hasRenderableRoadmap(workspace: RoadmapSidebarWorkspace): boolean {
  const status = getRoadmapStatusLabel(workspace);
  const normalizedStatus = status.toUpperCase();
  const hasRoadmapObject = isRecord(workspace.currentRoadmap) || isRecord(workspace.roadmap);
  const hasRoadmapFlag = toBoolean(workspace.hasRoadmap);
  const hasRoadmapId = Boolean(toText(workspace.roadmapId));
  const learningStructure = isRecord(workspace.learningStructure) ? workspace.learningStructure : null;
  const hasNestedStructure = Boolean(
    (Array.isArray(learningStructure?.chapters) && learningStructure.chapters.length > 0) ||
    (Array.isArray(learningStructure?.tasks) && learningStructure.tasks.length > 0)
  );

  return hasRoadmapObject || hasRoadmapFlag || hasRoadmapId || hasNestedStructure || ["CONFIRMED", "ACTIVE", "READY", "GENERATED", "DONE", "COMPLETED"].includes(normalizedStatus);
}

function normalizeRoadmapSidebarItem(workspace: RoadmapSidebarWorkspace, index: number): RoadmapSidebarItem | null {
  const id =
    toText(workspace.workspaceId) ??
    toText(workspace.id) ??
    toText(workspace["workspace_id"]) ??
    `workspace-${index}`;

  const name =
    toText(workspace.name) ??
    toText(workspace.title) ??
    toText(workspace.workspaceName) ??
    "Không có tên";

  if (!hasRenderableRoadmap(workspace)) {
    return null;
  }

  return {
    id,
    name,
    statusLabel: getRoadmapStatusLabel(workspace) || "READY",
  };
}

/* ─── Notification helpers ─── */

function toRelativeTime(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "Vừa xong";
    if (mins < 60) return `${mins} phút trước`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} giờ trước`;
    return `${Math.floor(hrs / 24)} ngày trước`;
  } catch {
    return "";
  }
}

type NotifIconType = "check" | "alert" | "calendar" | "sparkles" | "bell";
type NotifMeta = {
  iconType: NotifIconType;
  iconBg: string; iconBorder: string; iconColor: string;
  label: string; labelColor: string;
  itemBg: string; leftBorderColor?: string;
};

function getNotifMeta(type: string): NotifMeta {
  switch (type) {
    case "MATERIAL_ANALYSIS_DONE":
      return { iconType:"check", iconBg:"#F0FDF4", iconBorder:"#A7F3D0", iconColor:"#059669", label:"Tài liệu", labelColor:"#059669", itemBg:CARD };
    case "MATERIAL_PROCESSING_FAILED":
      return { iconType:"alert", iconBg:"#FEF2F2", iconBorder:"#FECACA", iconColor:"#DC2626", label:"Lỗi xử lý", labelColor:"#DC2626", itemBg:"#FFF5F5", leftBorderColor:"#EF4444" };
    case "ROADMAP_READY":
      return { iconType:"check", iconBg:"#F0FDF4", iconBorder:"#A7F3D0", iconColor:"#059669", label:"AI Roadmap", labelColor:"#059669", itemBg:CARD };
    case "TASK_REMINDER":
      return { iconType:"calendar", iconBg:"#FFFBEB", iconBorder:"#FCD34D", iconColor:"#D97706", label:"Nhắc nhở", labelColor:"#D97706", itemBg:"#FFFBEB", leftBorderColor:"#F59E0B" };
    case "TASK_OVERDUE":
      return { iconType:"alert", iconBg:"#FEF2F2", iconBorder:"#FECACA", iconColor:"#DC2626", label:"Quá hạn", labelColor:"#DC2626", itemBg:"#FFF5F5", leftBorderColor:"#EF4444" };
    case "AI_SCHEDULE_READY":
      return { iconType:"sparkles", iconBg:"#FFF7ED", iconBorder:"#FED7AA", iconColor:OG, label:"AI Lịch học", labelColor:OG, itemBg:CARD };
    default:
      return { iconType:"bell", iconBg:"#EFF6FF", iconBorder:"#BFDBFE", iconColor:"#2563EB", label:"Thông báo", labelColor:"#2563EB", itemBg:CARD };
  }
}

export default function DashboardLayout() {
  const [sideOpen, setSideOpen]       = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [notifOpen, setNotifOpen]     = useState(false);
  const [roadmapMenuOpen, setRoadmapMenuOpen] = useState(true);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [roadmapWorkspaces, setRoadmapWorkspaces] = useState<RoadmapSidebarItem[]>([]);
  const [profile, setProfile] = useState<{ fullName: string; roleLabel: string; avatarLetter: string; avatarUrl?: string }>(() => {
    const stored = getStoredUserProfile();
    const fullName = stored?.fullName || "Learner";
    return {
      fullName,
      roleLabel: stored?.role === "ADMIN" ? "Admin" : "Learner",
      avatarLetter: fullName.trim().charAt(0).toUpperCase() || "L",
    };
  });
  const { notifications, unreadCount, markAsRead } = useNotificationSocket();
  const navigate = useNavigate();
  const loc   = useLocation();
  const pathname = loc.pathname.replace(/\/+$/, "") || "/";
  const showAuthLoader = (loc.state as any)?.showLoadingFromAuth ?? false;
  let crumb = CRUMBS[loc.pathname] ?? "Trung tâm điều khiển";
  if (loc.pathname.startsWith("/app/workspaces")) {
    if (loc.pathname === "/app/workspaces") crumb = CRUMBS["/app/workspaces"];
    else crumb = "Workspace";
  }

  const isNavItemActive = (path: string, end?: boolean, match?: "exact" | "prefix") => {
    const normalizedPath = path.replace(/\/+$/, "") || "/";

    if (match === "prefix") {
      return pathname === normalizedPath || pathname.startsWith(`${normalizedPath}/`);
    }

    if (end) {
      return pathname === normalizedPath;
    }

    return pathname === normalizedPath || pathname.startsWith(`${normalizedPath}/`);
  };

  const refreshRoadmapWorkspaces = async () => {
    setRoadmapLoading(true);
    try {
      const payload = (await workspaceService.getMyWorkspaces()) as unknown;
      const items = extractRoadmapCandidates(payload)
        .map((workspace, index) => normalizeRoadmapSidebarItem(workspace, index))
        .filter((item): item is RoadmapSidebarItem => Boolean(item))
        .sort((left, right) => left.name.localeCompare(right.name, "vi"));

      setRoadmapWorkspaces(items);
    } catch {
      setRoadmapWorkspaces([]);
    } finally {
      setRoadmapLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        const me = await meService.getMe();
        if (!mounted) return;

        const fullName = me.fullName || "Learner";
        setProfile({
          fullName,
          roleLabel: me.roles?.includes("ADMIN") ? "Admin" : "Learner",
          avatarLetter: fullName.trim().charAt(0).toUpperCase() || "L",
          avatarUrl: me.avatarUrl || undefined,
        });
      } catch {
        if (!mounted) return;
        const stored = getStoredUserProfile();
        const fullName = stored?.fullName || "Learner";
        setProfile({
          fullName,
          roleLabel: stored?.role === "ADMIN" ? "Admin" : "Learner",
          avatarLetter: fullName.trim().charAt(0).toUpperCase() || "L",
        });
      }
    };

    loadProfile();

    const handleProfileUpdated = () => {
      loadProfile();
    };

    window.addEventListener("skillSprint:profile-updated", handleProfileUpdated);

    void refreshRoadmapWorkspaces();

    const handleWorkspaceChanged = () => {
      void refreshRoadmapWorkspaces();
    };

    window.addEventListener("workspace_created", handleWorkspaceChanged);
    window.addEventListener("workspace_updated", handleWorkspaceChanged);
    window.addEventListener("workspace_deleted", handleWorkspaceChanged);

    return () => {
      mounted = false;
      window.removeEventListener("skillSprint:profile-updated", handleProfileUpdated);
      window.removeEventListener("workspace_created", handleWorkspaceChanged);
      window.removeEventListener("workspace_updated", handleWorkspaceChanged);
      window.removeEventListener("workspace_deleted", handleWorkspaceChanged);
    };
  }, []);

  return (
    <div style={{
      display:"flex", height:"100vh", overflow:"hidden",
      background:BG, fontFamily:F, color:T1,
    }}>
      <style>{`
        @keyframes ss-pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.12);border-radius:99px}
        .ss-nav-link{border:1px solid transparent;transform:translateX(0);}
        .ss-nav-link:hover{background:${SHOVER};border-color:rgba(148,163,184,0.20);transform:translateX(2px);}
        .ss-nav-link:focus-visible{outline:none;border-color:rgba(255,107,0,0.45);box-shadow:0 0 0 2px rgba(255,107,0,0.18)}
        .ss-upgrade:hover{transform:translateY(-1px);box-shadow:0 8px 18px rgba(255,107,0,0.22)}
        .ss-referral:hover{background:rgba(251,191,36,0.18)}
      `}</style>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sideOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            onClick={()=>setSideOpen(false)}
            className="lg:hidden"
            style={{position:"fixed",inset:0,zIndex:40,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(4px)"}}/>
        )}
      </AnimatePresence>

      <aside
        className={`fixed top-0 left-0 z-50 h-full flex flex-col
          lg:relative lg:translate-x-0 transition-transform duration-300
          ${sideOpen?"translate-x-0":"-translate-x-full"}`}
        style={{
          width:"228px", flexShrink:0,
          background:"linear-gradient(180deg, #FFFDFB 0%, #FAF7F2 100%)",
          borderRight:"1px solid rgba(255,107,0,0.08)",
          boxShadow:"4px 0 24px rgba(255,107,0,0.02), 1px 0 5px rgba(0,0,0,0.01)",
        }}
      >
        {/* Logo */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"16px",
          borderBottom:"1px solid rgba(255,107,0,0.08)",
        }}>
          <div style={{display:"flex",alignItems:"center",gap:"24px"}}>
            <BrandLogo size={20} align="left" />
            <span style={{
              fontSize:"9px",padding:"1px 6px",borderRadius:"4px",
              display:"inline-block",background:"rgba(255,107,0,0.1)",
              color:OG,fontWeight:700,letterSpacing:"0.06em",
              flexShrink:0
            }}>FREE</span>
          </div>
          <button className="lg:hidden" onClick={()=>setSideOpen(false)}
            style={{background:"none",border:"none",cursor:"pointer",color:STXT}}>
            <X size={16}/>
          </button>
        </div>

        {/* Navigation groups */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          {APP_NAV_SECTIONS.map((section, idx) => (
            <div key={section.label} className="space-y-1">
              {idx > 0 && <div className="my-2 border-t border-orange-100/40" />}
              {section.items
                .filter(item => !(section.label === "Học tập & AI" && item.path === "/app/roadmap"))
                .map(item => {
                  const isActive = isNavItemActive(item.path, item.end, item.match);

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.end}
                      onClick={() => setSideOpen(false)}
                      className={() => [
                        "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-all duration-200",
                        "border-l-4 border-transparent",
                        isActive
                          ? "border-l-[#FF6B00] bg-gradient-to-r from-orange-500/8 to-amber-500/4 text-[#FF6B00] font-bold shadow-[0_4px_12px_rgba(255,107,0,0.03)]"
                          : "text-slate-500 hover:bg-orange-500/4 hover:text-slate-800",
                      ].join(" ")}
                    >
                      <>
                        <item.icon
                          size={18}
                          strokeWidth={isActive ? 2.5 : 2}
                          className={[
                            "shrink-0 transition-transform duration-200 group-hover:scale-105",
                            isActive ? "text-[#FF6B00]" : "text-slate-400 group-hover:text-slate-600",
                          ].join(" ")}
                        />
                        <span className="flex-1 font-medium">{item.label}</span>
                        {item.badge && (
                          <span className="relative flex h-2 w-2 shrink-0 items-center justify-center">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-orange-500/35 animate-ping" />
                            <span className="relative h-2 w-2 rounded-full bg-orange-500" />
                          </span>
                        )}
                      </>
                    </NavLink>
                  );
                })}

              {section.label === "Học tập & AI" && (
                <div className="mt-1 pl-4 border-l border-orange-100/80 ml-3 space-y-1 py-1">
                  <button
                    type="button"
                    onClick={() => setRoadmapMenuOpen((value) => !value)}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-slate-500 hover:bg-orange-500/4 hover:text-[#FF6B00] transition"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles size={14} className="text-[#FF6B00]" />
                      Lộ trình AI theo workspace
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="rounded-full bg-orange-500/10 px-1.5 py-0.2 text-[9px] font-bold text-[#FF6B00]">
                        {roadmapLoading ? "..." : roadmapWorkspaces.length}
                      </span>
                      <ChevronRight
                        size={12}
                        className={`text-slate-400 transition-transform ${roadmapMenuOpen ? "rotate-90" : ""}`}
                      />
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {roadmapMenuOpen ? (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-1 py-1">
                          {roadmapLoading ? (
                            Array.from({ length: 2 }).map((_, index) => (
                              <div key={index} className="h-7 w-full animate-pulse rounded-md bg-slate-100/60" />
                            ))
                          ) : roadmapWorkspaces.length > 0 ? (
                            roadmapWorkspaces.map((workspace) => {
                              const roadmapPath = `/app/workspaces/${workspace.id}/roadmap`;
                              const isActive = pathname === roadmapPath || pathname.startsWith(`${roadmapPath}/`);

                              return (
                                <NavLink
                                  key={workspace.id}
                                  to={roadmapPath}
                                  onClick={() => setSideOpen(false)}
                                  className={() => [
                                    "group flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] transition-colors duration-200",
                                    isActive
                                      ? "bg-orange-500/8 text-[#FF6B00] font-bold"
                                      : "text-slate-400 hover:bg-orange-500/4 hover:text-slate-700",
                                  ].join(" ")}
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="truncate font-medium">{workspace.name}</div>
                                    <div className="mt-0.5 flex items-center gap-1 text-[9px] text-green-600/80">
                                      <span className="h-1 w-1 rounded-full bg-green-500" />
                                      <span className="uppercase tracking-wider">{workspace.statusLabel || "READY"}</span>
                                    </div>
                                  </div>
                                  <ChevronRight size={12} className="shrink-0 opacity-50 transition-transform group-hover:translate-x-0.5" />
                                </NavLink>
                              );
                            })
                          ) : (
                            <div className="rounded-lg border border-dashed border-orange-100/40 bg-orange-50/10 px-2.5 py-2 text-[10px] leading-relaxed text-slate-400">
                              Chưa có workspace nào có roadmap đã xác nhận.
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-4 pt-2">
          <div className="ss-upgrade mb-2" onClick={()=>setPricingOpen(true)}
            style={{
              padding:"12px",borderRadius:"10px",cursor:"pointer",
              background:"rgba(255,107,0,0.08)",
              border:"1px solid rgba(255,107,0,0.18)",
              transition:"all 0.15s ease",
            }}
            onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.background="rgba(255,107,0,0.14)";}}
            onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.background="rgba(255,107,0,0.08)";}}
          >
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"2px"}}>
              <span style={{fontSize:"8.5px",fontWeight:700,color:OG,letterSpacing:"0.08em",textTransform:"uppercase"}}>GÓI MIỄN PHÍ</span>
              <Crown size={12} color="#F59E0B"/>
            </div>
            <p style={{fontWeight:700,fontSize:"0.8rem",color:"#0F172A",marginBottom:"1px"}}>Nâng cấp lên Pro</p>
            <p style={{color:"#64748B",fontSize:"0.7rem"}}>Mở khóa tính năng AI và nhiều hơn</p>
          </div>



          <div className="border-t border-slate-100 pt-3">
            <Link to="/app/profile" className="block rounded-xl transition hover:bg-slate-100" style={{ textDecoration: "none" }}>
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-400 text-sm font-bold text-white shadow-[0_0_0_1px_rgba(0,0,0,0.06)] overflow-hidden">
                  {profile.avatarUrl
                    ? <img src={profile.avatarUrl} alt={profile.fullName} className="w-full h-full object-cover" />
                    : profile.avatarLetter}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{profile.fullName}</p>
                  <p className="text-xs text-slate-500">{profile.roleLabel}</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </aside>

      {/* ════════════════ MAIN AREA ════════════════ */}
      <main style={{flex:1,display:"flex",flexDirection:"column",height:"100%",overflow:"hidden",minWidth:0}}>
        {/* Header */}
        <header style={{
          display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"0 24px",height:"56px",flexShrink:0,
          background:CARD,borderBottom:`1px solid ${BDR}`,
          boxShadow:"0 1px 4px rgba(0,0,0,0.04)",
        }}>
          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            <button className="lg:hidden" onClick={()=>setSideOpen(true)}
              style={{color:T2,background:"none",border:"none",cursor:"pointer",padding:"4px"}}>
              <Menu size={18}/>
            </button>
            <nav style={{display:"flex",alignItems:"center",gap:"6px",padding:"6px 10px",borderRadius:"10px",background:"#F8FAFC",border:`1px solid ${BDR}`}}>
              <span style={{color:T3,fontSize:"0.78rem",fontFamily:F}}>SkillSprint</span>
              <ChevronRight size={11} color={T3}/>
              <span style={{color:T1,fontSize:"0.8rem",fontFamily:F,fontWeight:700}}>{crumb}</span>
              {/* health indicator removed from header; footer shows status */}
            </nav>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
            {/* ── Notification Bell ── */}
            <div style={{ position:"relative" }}>
              <button
                onClick={() => setNotifOpen(p => !p)}
                style={{
                  position:"relative", padding:"7px", borderRadius:"9px",
                  color:notifOpen ? OG : T2,
                  border:`1px solid ${notifOpen ? "rgba(255,107,0,0.30)" : BDR}`,
                  background: notifOpen ? OGL : "transparent",
                  cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  transition:"all 0.15s",
                }}
              >
                <Bell size={15}/>
                {unreadCount > 0 && (
                  <span style={{
                    position:"absolute", top:"-5px", right:"-5px",
                    minWidth:"16px", height:"16px", borderRadius:"99px",
                    background:OG, border:`2px solid ${CARD}`,
                    display:"flex", alignItems:"center", justifyContent:"center", padding:"0 3px",
                  }}>
                    <span style={{fontFamily:F,fontSize:"8px",fontWeight:800,color:"#fff",lineHeight:1}}>
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  </span>
                )}
              </button>

              {/* Dropdown */}
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity:0, y:8, scale:0.96 }}
                    animate={{ opacity:1, y:0, scale:1 }}
                    exit={{ opacity:0, y:6, scale:0.96 }}
                    transition={{ duration:0.18, ease:[0.22,1,0.36,1] }}
                    style={{
                      position:"absolute", top:"calc(100% + 8px)", right:0,
                      width:330, background:CARD,
                      borderRadius:14,
                      border:`1px solid ${BDR}`,
                      boxShadow:"0 4px 8px rgba(0,0,0,0.05), 0 16px 48px rgba(0,0,0,0.12)",
                      overflow:"hidden", zIndex:200,
                    }}
                  >
                    {/* Header */}
                    <div style={{ padding:"12px 16px 10px", borderBottom:`1px solid ${BDR}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                        <Bell size={13} color={T1}/>
                        <span style={{ fontFamily:F, fontWeight:700, fontSize:"0.875rem", color:T1 }}>Thông báo</span>
                        <div style={{ padding:"1px 7px", borderRadius:99, background:OGL, border:`1px solid rgba(255,107,0,0.2)` }}>
                          <span style={{ fontFamily:F, fontSize:"0.60rem", fontWeight:700, color:OG }}>
                            {unreadCount > 0 ? `${unreadCount} mới` : "Đã đọc hết"}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setNotifOpen(false)}
                        style={{ background:"none", border:"none", cursor:"pointer", color:T3, padding:2, display:"flex" }}
                      >
                        <X size={14}/>
                      </button>
                    </div>

                    {/* Notification list */}
                    <div style={{ display:"flex", flexDirection:"column", maxHeight:320, overflowY:"auto" }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding:"32px 20px", textAlign:"center" }}>
                          <div style={{ display:"flex", justifyContent:"center", marginBottom:8 }}>
                            <Bell size={28} color={T3}/>
                          </div>
                          <p style={{ fontFamily:F, fontSize:"0.75rem", color:T3, fontWeight:500 }}>
                            Chưa có thông báo nào
                          </p>
                        </div>
                      ) : notifications.slice(0, 8).map((notif) => {
                        const meta = getNotifMeta(notif.type);
                        const relTime = toRelativeTime(notif.createdAt);
                        const iconEl =
                          meta.iconType === "check"    ? <BookOpenCheck size={15} color={meta.iconColor}/> :
                          meta.iconType === "alert"    ? <AlertTriangle  size={15} color={meta.iconColor}/> :
                          meta.iconType === "calendar" ? <CalendarClock  size={15} color={meta.iconColor}/> :
                          meta.iconType === "sparkles" ? <Sparkles        size={15} color={meta.iconColor}/> :
                                                         <Bell            size={15} color={meta.iconColor}/>;
                        return (
                          <div
                            key={notif.notificationId}
                            onClick={() => { if (!notif.read) void markAsRead(notif.notificationId); }}
                            style={{
                              padding:"12px 15px",
                              borderBottom:`1px solid ${BDR}`,
                              background: notif.read ? CARD : meta.itemBg,
                              ...(meta.leftBorderColor && !notif.read ? { borderLeft:`3px solid ${meta.leftBorderColor}` } : {}),
                              display:"flex", alignItems:"flex-start", gap:10,
                              cursor: notif.read ? "default" : "pointer",
                              opacity: notif.read ? 0.72 : 1,
                              transition:"opacity 0.15s",
                            }}
                          >
                            <div style={{
                              width:32, height:32, borderRadius:8, flexShrink:0,
                              background:meta.iconBg, border:`1.5px solid ${meta.iconBorder}`,
                              display:"flex", alignItems:"center", justifyContent:"center",
                            }}>
                              {iconEl}
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:3 }}>
                                <span style={{ fontFamily:F, fontSize:"0.60rem", fontWeight:700, color:meta.labelColor }}>
                                  {meta.label}
                                </span>
                                <span style={{ fontFamily:F, fontSize:"0.60rem", color:T3 }}>{relTime}</span>
                                {!notif.read && (
                                  <span style={{ marginLeft:"auto", width:6, height:6, borderRadius:"50%", background:OG, display:"inline-block", flexShrink:0 }}/>
                                )}
                              </div>
                              <p style={{ fontFamily:F, fontSize:"0.75rem", color: notif.read ? T2 : T1, lineHeight:1.5, wordBreak:"break-word" }}>
                                {notif.message}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Footer */}
                    <div style={{ padding:"9px 15px", borderTop:`1px solid ${BDR}`, background:BG, textAlign:"center" }}>
                      <button
                        onClick={() => { setNotifOpen(false); navigate("/app/notifications"); }}
                        style={{
                          fontFamily:F, fontSize:"0.72rem", fontWeight:700,
                          color:OG, background:"none", border:"none", cursor:"pointer",
                        }}>
                        Xem tất cả thông báo →
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div style={{flex:1,overflowY:"auto",overflowX:"hidden",padding:"28px 28px 36px"}}>
          <div style={{width:"100%"}}>
            <Outlet/>
          </div>
        </div>

        {/* Loader requested from Auth during immediate navigation */}
        <AnimatePresence>
          {showAuthLoader && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              style={{position:"fixed",top:10,left:0,right:0,height:6,zIndex:120,display:'flex',overflow:'hidden',alignItems:'center',justifyContent:'center'}}>
              <div style={{position:'relative',width:'100%',height:'100%',overflow:'hidden'}}>
                <div style={{position:'absolute',left:0,top:0,bottom:0,width:'100%',transform:'translateX(-100%)',background:'linear-gradient(90deg, rgba(255,107,0,0.12), #FF6B00)',animation:'slidebar 700ms cubic-bezier(.22,1,.36,1) forwards'}} />
                <div style={{position:'absolute',left:0,top:0,bottom:0,width:'25%',transform:'translateX(-120%)',pointerEvents:'none',background:'linear-gradient(90deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06), rgba(255,255,255,0.18))',animation:'shimmerbar 800ms linear forwards'}} />
              </div>
              <style>{`@keyframes slidebar { from { transform: translateX(-100%); } to { transform: translateX(0%); } } @keyframes shimmerbar { from { transform: translateX(-120%); } to { transform: translateX(120%); } }`}</style>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <PricingModal
        isOpen={pricingOpen}
        onClose={()=>setPricingOpen(false)}
        onSuccess={() => {}}
        currentPlan="FREE"
      />
    </div>
  );
}
import { useEffect, useState } from "react";
import { Outlet, NavLink, useLocation, Link, useNavigate } from "react-router";
import {
  LayoutDashboard, Map, Mic,
  Menu, X, Zap, Bell, ChevronRight, Crown, Gift, Sparkles,
  AlertTriangle, CalendarClock, BookOpenCheck, CheckCircle2,
  LoaderCircle, Loader2,
} from "lucide-react";
import { APP_NAV_SECTIONS } from "../config/nav";
import { motion, AnimatePresence } from "motion/react";
import { PricingModal } from "../components/modals/PricingModal";
import { ReferralModal } from "../components/modals/ReferralModal";
import { BrandLogo } from "../components/layout/BrandLogo";
import meService from "../../api/meService";
import workspaceService from "../../api/workspaceService";
import { getStoredUserProfile } from "../../api/authService";
import { getUnreadNotifications, getNotifications } from "../../api/notificationsService";
import type { NotificationResponse } from "../../api/skillSprintModels";

/* ─── Sidebar Design Tokens ─── */
const F      = "'Inter','Plus Jakarta Sans',sans-serif";
const SBG    = "#0B1220";   // sidebar dark navy
const SBDR   = "rgba(255,255,255,0.06)";
const STXT   = "#94A3B8";   // inactive text
const STXT_A = "#FFFFFF";   // active text
const OG     = "#FF6B00";
const OGL    = "rgba(255,107,0,0.12)";
const SHOVER = "rgba(255,255,255,0.05)";
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

export default function DashboardLayout() {
  const [sideOpen, setSideOpen]       = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [referralOpen, setReferralOpen] = useState(false);
  const [notifOpen, setNotifOpen]     = useState(false);
  const [roadmapMenuOpen, setRoadmapMenuOpen] = useState(true);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [roadmapWorkspaces, setRoadmapWorkspaces] = useState<RoadmapSidebarItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const [profile, setProfile] = useState<{ fullName: string; roleLabel: string; avatarLetter: string }>(() => {
    const stored = getStoredUserProfile();
    const fullName = stored?.fullName || "Learner";
    return {
      fullName,
      roleLabel: stored?.role === "ADMIN" ? "Admin" : "Learner",
      avatarLetter: fullName.trim().charAt(0).toUpperCase() || "L",
    };
  });
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

  const loadNotifications = async () => {
    setNotifLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch {
      // silently fail — notifications are non-critical
    } finally {
      setNotifLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const data = await getUnreadNotifications();
      setUnreadCount(data.length);
    } catch {
      // silently fail — notifications are non-critical
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
    void fetchUnreadCount();

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
        @keyframes wiggle{0%,100%{transform:rotate(0deg)}20%{transform:rotate(-10deg)}40%{transform:rotate(6deg)}60%{transform:rotate(-4deg)}80%{transform:rotate(2deg)}}
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

      {/* ════════════════ DARK NAVY SIDEBAR ════════════════ */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full flex flex-col
          lg:relative lg:translate-x-0 transition-transform duration-300
          ${sideOpen?"translate-x-0":"-translate-x-full"}`}
        style={{
          width:"228px", flexShrink:0,
          background:"linear-gradient(180deg, #0A1223 0%, #07132B 100%)",
          borderRight:`1px solid ${SBDR}`,
          boxShadow:"inset -1px 0 0 rgba(255,255,255,0.03)",
        }}
      >
        {/* Logo */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"18px 16px 16px",
          borderBottom:`1px solid ${SBDR}`,
        }}>
          <Link to="/" style={{display:"flex",alignItems:"center",gap:"9px",textDecoration:"none"}}>
            <div style={{
              width:"32px",height:"32px",borderRadius:"8px",
              background:OG,display:"flex",alignItems:"center",justifyContent:"center",
              boxShadow:"0 4px 12px rgba(255,107,0,0.35)",flexShrink:0,
            }}>
              <Zap size={15} color="#fff" fill="#fff"/>
            </div>
            <div>
              <p style={{fontWeight:800,fontSize:"0.96rem",color:"#FFFFFF",letterSpacing:"-0.02em",lineHeight:1}}>
                SkillSprint
              </p>
              <span style={{
                fontSize:"9px",padding:"1px 6px",borderRadius:"3px",marginTop:"3px",
                display:"inline-block",background:"rgba(255,107,0,0.2)",
                color:OG,fontWeight:700,letterSpacing:"0.06em",
              }}>FREE</span>
            </div>
          </Link>
          <button className="lg:hidden" onClick={()=>setSideOpen(false)}
            style={{background:"none",border:"none",cursor:"pointer",color:STXT}}>
            <X size={16}/>
          </button>
        </div>

        {/* Navigation groups */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          {APP_NAV_SECTIONS.map(section => (
            <div key={section.label} className="mb-4 last:mb-0">
              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {section.label}
              </div>
              <div className="space-y-1">
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
                          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                          "border-l-2 border-transparent",
                          isActive
                            ? "border-l-orange-500 bg-gradient-to-r from-orange-500/15 to-orange-500/5 text-orange-500"
                            : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200",
                        ].join(" ")}
                      >
                        <>
                          <item.icon
                            size={18}
                            strokeWidth={2}
                            className={[
                              "shrink-0 transition-transform duration-200 group-hover:scale-105",
                              isActive ? "text-orange-500" : "text-current",
                            ].join(" ")}
                          />
                          <span className="flex-1 font-medium">{item.label}</span>
                          {item.badge && (
                            <span className="relative flex h-2.5 w-2.5 shrink-0 items-center justify-center">
                              <span className="absolute inline-flex h-full w-full rounded-full bg-orange-500/35 animate-ping" />
                              <span className="relative h-2.5 w-2.5 rounded-full bg-orange-500" />
                            </span>
                          )}
                        </>
                      </NavLink>
                    );
                  })}

                {section.label === "Học tập & AI" && (
                  <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 p-2">
                    <button
                      type="button"
                      onClick={() => setRoadmapMenuOpen((value) => !value)}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-white/5"
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                        <Sparkles size={16} className="text-orange-400" />
                        Lộ trình AI theo workspace
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[11px] font-bold text-orange-300">
                          {roadmapLoading ? "..." : roadmapWorkspaces.length}
                        </span>
                        <ChevronRight
                          size={14}
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
                          <div className="space-y-1 px-1 pb-1 pt-2">
                            {roadmapLoading ? (
                              Array.from({ length: 3 }).map((_, index) => (
                                <div key={index} className="rounded-md border border-white/5 bg-white/5 px-3 py-2">
                                  <div className="h-3 w-24 animate-pulse rounded-full bg-white/15" />
                                  <div className="mt-2 h-2 w-36 animate-pulse rounded-full bg-white/10" />
                                </div>
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
                                      "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors duration-200",
                                      "border-l-2 border-transparent",
                                      isActive
                                        ? "border-l-orange-500 bg-slate-800 text-orange-200"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-100",
                                    ].join(" ")}
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="truncate font-medium">{workspace.name}</div>
                                      <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-green-400">
                                        <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                                        <span className="uppercase tracking-[0.2em]">{workspace.statusLabel || "READY"}</span>
                                      </div>
                                    </div>
                                    <ChevronRight size={14} className="shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5" />
                                  </NavLink>
                                );
                              })
                            ) : (
                              <div className="rounded-md border border-dashed border-white/10 bg-white/5 px-3 py-2 text-xs leading-5 text-slate-400">
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
            <p style={{fontWeight:700,fontSize:"0.8rem",color:"#FFFFFF",marginBottom:"1px"}}>Nâng cấp lên Pro</p>
            <p style={{color:STXT,fontSize:"0.7rem"}}>Mở khóa tính năng AI và nhiều hơn</p>
          </div>

          <button className="ss-referral mb-3" onClick={()=>setReferralOpen(true)}
            style={{
              display:"flex",alignItems:"center",gap:"7px",padding:"8px 10px",
              borderRadius:"8px",cursor:"pointer",width:"100%",
              background:"rgba(251,191,36,0.1)",border:"1px solid rgba(251,191,36,0.2)",
              color:"#FBBF24",fontFamily:F,fontWeight:600,fontSize:"0.78rem",
              transition:"background 0.15s ease",
            }}>
            <Gift size={12}/>
            Mời bạn &amp; nhận Premium
          </button>

          <div className="border-t border-slate-800/60 pt-3">
            <Link to="/app/profile" className="block rounded-xl transition hover:bg-slate-800/30" style={{ textDecoration: "none" }}>
              <div className="flex items-center gap-3 px-3 py-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-400 text-sm font-bold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                {profile.avatarLetter}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-200">{profile.fullName}</p>
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
            <div className="hidden sm:flex" style={{
              alignItems:"center",gap:"5px",padding:"4px 12px",
              borderRadius:"99px",background:"#ECFDF5",border:"1px solid #A7F3D0",
            }}>
              <div style={{width:"5px",height:"5px",borderRadius:"50%",background:"#059669",animation:"ss-pulse 2s infinite"}}/>
              <span style={{fontSize:"0.7rem",color:"#059669",fontWeight:700,fontFamily:F}}>AI Online</span>
            </div>

            {/* ── Notification Bell ── */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(p => {
                  const next = !p;
                  if (next) loadNotifications();
                  return next;
                })}
                className={[
                  "relative flex items-center justify-center p-[7px] rounded-[9px] cursor-pointer transition-all duration-150 border group",
                  notifOpen
                    ? "border-orange-500/30 bg-orange-500/12 text-orange-500"
                    : "border-gray-200 bg-transparent text-gray-500 hover:bg-gray-100/50",
                  "hover:animate-[wiggle_0.5s_ease-in-out]",
                ].join(" ")}
              >
                <Bell size={15} className="transition-transform duration-200 group-hover:scale-110" />

                {/* Red badge with pulse ring */}
                {unreadCount > 0 && (
                  <>
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 animate-ping opacity-75" />
                    </span>
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[9px] font-bold leading-4 text-center px-[4px] border-[1.5px] border-white shadow-[0_2px_6px_rgba(239,68,68,0.4)] z-10">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  </>
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
                    className="absolute top-full right-0 mt-2 w-[360px] bg-white rounded-[14px] border border-gray-200 shadow-[0_4px_8px_rgba(0,0,0,0.05),0_16px_48px_rgba(0,0,0,0.12)] overflow-hidden z-50"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center gap-[7px]">
                        <Bell size={13} className="text-gray-800" />
                        <span className="font-bold text-[0.875rem] text-gray-800" style={{ fontFamily: F }}>Thông báo</span>
                        {unreadCount > 0 && (
                          <span className="px-[7px] py-[1px] rounded-full bg-orange-500/12 border border-orange-500/20 text-[0.60rem] font-bold text-orange-500" style={{ fontFamily: F }}>
                            {unreadCount} mới
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setNotifOpen(false)}
                        className="bg-none border-none cursor-pointer text-gray-400 p-[2px] flex"
                      >
                        <X size={14}/>
                      </button>
                    </div>

                    {/* Skeleton loading */}
                    {notifLoading ? (
                      <div className="p-4 space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="flex items-start gap-3 animate-pulse">
                            <div className="w-8 h-8 rounded-lg bg-gray-200 flex-shrink-0" />
                            <div className="flex-1 space-y-2 py-1">
                              <div className="h-2.5 w-20 bg-gray-200 rounded" />
                              <div className="h-2 w-full bg-gray-100 rounded" />
                              <div className="h-2 w-3/4 bg-gray-100 rounded" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="py-8 px-4 text-center">
                        <Bell size={28} className="text-gray-400 mx-auto mb-2" />
                        <p className="text-[0.82rem] font-semibold text-gray-500 mb-1" style={{ fontFamily: F }}>Không có thông báo mới</p>
                        <p className="text-[0.72rem] text-gray-400" style={{ fontFamily: F }}>Mọi thứ đều ổn, bạn không có thông báo nào chưa đọc.</p>
                      </div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.map((n) => {
                          let iconColor = "#6B7280";
                          let bgColor = "#F9FAFB";
                          let borderColor = BDR;
                          let badgeLabel = "";
                          let badgeColor = "";
                          let IconComponent = Bell;

                          if (n.type === "WARNING" || n.type === "URGENT") {
                            iconColor = "#D97706"; bgColor = "#FFFBEB"; borderColor = "#F59E0B"; badgeLabel = "Cảnh báo"; badgeColor = "#D97706"; IconComponent = AlertTriangle;
                          } else if (n.type === "ACHIEVEMENT") {
                            iconColor = "#2563EB"; bgColor = "#EFF6FF"; borderColor = "#BFDBFE"; badgeLabel = "Thành tích"; badgeColor = "#2563EB"; IconComponent = CheckCircle2;
                          } else if (n.type === "ROADMAP" || n.type === "AI") {
                            iconColor = "#059669"; bgColor = "#F0FDF4"; borderColor = "#A7F3D0"; badgeLabel = "AI Roadmap"; badgeColor = "#059669"; IconComponent = BookOpenCheck;
                          } else if (n.type === "REMINDER") {
                            iconColor = "#7C3AED"; bgColor = "#F5F3FF"; borderColor = "#C4B5FD"; badgeLabel = "Nhắc nhở"; badgeColor = "#7C3AED"; IconComponent = CalendarClock;
                          }

                          const timeAgo = (() => {
                            const diff = Date.now() - new Date(n.createdAt).getTime();
                            const mins = Math.floor(diff / 60000);
                            if (mins < 1) return "Vừa xong";
                            if (mins < 60) return `${mins} phút trước`;
                            const hours = Math.floor(mins / 60);
                            if (hours < 24) return `${hours} giờ trước`;
                            const days = Math.floor(hours / 24);
                            return `${days} ngày trước`;
                          })();

                          return (
                            <div key={n.notificationId} className={[
                              "px-4 py-3 border-b border-gray-200 flex items-start gap-[10px]",
                              n.read ? "bg-white" : "bg-blue-50/60",
                            ].join(" ")}
                              style={{
                                borderLeft: n.read ? "3px solid transparent" : `3px solid ${borderColor}`,
                              }}
                            >
                              <div style={{
                                width:32, height:32, borderRadius:8, flexShrink:0,
                                background: n.read ? "#F3F4F6" : bgColor,
                                border:`1.5px solid ${n.read ? BDR : borderColor}`,
                                display:"flex", alignItems:"center", justifyContent:"center",
                              }}>
                                <IconComponent size={15} color={n.read ? T3 : iconColor}/>
                              </div>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                                  {badgeLabel && (
                                    <span style={{ fontFamily:F, fontSize:"0.60rem", fontWeight:700, color:badgeColor, letterSpacing:"0.04em" }}>
                                      {badgeLabel}
                                    </span>
                                  )}
                                  <span style={{ fontFamily:F, fontSize:"0.58rem", color:T3 }}>{timeAgo}</span>
                                  {!n.read && (
                                    <span style={{
                                      width:6, height:6, borderRadius:"50%",
                                      background:OG, flexShrink:0,
                                    }}/>
                                  )}
                                </div>
                                <p style={{ fontFamily:F, fontSize:"0.80rem", fontWeight: n.read ? 400 : 600, color: n.read ? T2 : T1, lineHeight:1.5 }}>
                                  {n.title && <span style={{ fontWeight:700 }}>{n.title}</span>}
                                  {n.title && n.message ? ': ' : ''}
                                  {n.message}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Footer */}
                    <Link to="/app/profile?tab=notifications"
                      onClick={() => setNotifOpen(false)}
                      className="block py-[9px] px-[15px] border-t border-gray-200 bg-gray-50 text-center no-underline text-[0.72rem] font-bold text-orange-500"
                      style={{ fontFamily: F }}
                    >
                      Xem tất cả thông báo →
                    </Link>
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
        onSuccess={(plan) => navigate("/app/upgraded", { state: { plan } })}
      />
      <ReferralModal isOpen={referralOpen} onClose={()=>setReferralOpen(false)}/>
    </div>
  );
}
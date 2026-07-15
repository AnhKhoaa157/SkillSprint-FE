import React, { useState } from "react";
import { NavLink, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, X, Zap } from "lucide-react";
import { BrandLogo } from "../components/layout/BrandLogo";
import { APP_NAV_SECTIONS } from "../config/nav";
import type { RoadmapSidebarItem } from "./DashboardLayout";

// Extracted from DashboardLayout.tsx
const SHOVER = "rgba(15, 23, 42, 0.02)";
const OG = "#FF6B00";
const STXT = "#475569";

export type SidebarProps = {
  sideOpen: boolean;
  setSideOpen: (open: boolean) => void;
  setPricingOpen: (open: boolean) => void;
  navWorkspaces: RoadmapSidebarItem[];
  planId: string;
  planName: string;
  dynamicNextPlan: string | null;
  planMeta: any;
  profile: { fullName: string; roleLabel: string; avatarLetter: string; avatarUrl?: string };
};

const SidebarComponent: React.FC<SidebarProps> = ({
  sideOpen,
  setSideOpen,
  setPricingOpen,
  navWorkspaces,
  planId,
  planName,
  dynamicNextPlan,
  planMeta,
  profile,
}) => {
  const loc = useLocation();
  const pathname = loc.pathname.replace(/\/+$/, "") || "/";
  const [expandedNavs, setExpandedNavs] = useState<Record<string, boolean>>({ "Roadmap": true, "Tiến độ": true });

  const toggleNav = (label: string) => {
    setExpandedNavs(prev => ({ ...prev, [label]: !prev[label] }));
  };

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

  return (
    <>
      <style>{`
        .ss-nav-link{border:1px solid transparent;transform:translateX(0);}
        .ss-nav-link:hover{background:${SHOVER};border-color:rgba(148,163,184,0.12);transform:translateX(1px);}
        .ss-nav-link:focus-visible{outline:none;border-color:rgba(255,107,0,0.3);box-shadow:0 0 0 2px rgba(255,107,0,0.1)}
        .ss-upgrade:hover{transform:translateY(-1px);box-shadow:0 6px 14px rgba(255,107,0,0.08)}
      `}</style>
      
      {/* Mobile overlay */}
      <AnimatePresence>
        {sideOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            onClick={()=>setSideOpen(false)}
            className="md:hidden"
            style={{position:"fixed",inset:0,zIndex:40,background:"rgba(0,0,0,0.4)",backdropFilter:"blur(3px)"}}/>
        )}
      </AnimatePresence>

      <aside
        className={`fixed top-0 left-0 z-50 h-full flex flex-col
          md:relative md:translate-x-0 transition-transform duration-300
          ${sideOpen?"translate-x-0":"-translate-x-full"} hidden md:flex`}
        style={{
          width:"220px", flexShrink:0,
          background:"#FFFFFF",
          borderRight:"1px solid #F1F5F9",
        }}
      >
        {/* Logo */}
        <div style={{
          position: "relative",
          display:"flex", alignItems:"center", justifyContent:"center",
          padding:"16px 12px",
          borderBottom:"1px solid #F1F5F9",
        }}>
          <BrandLogo size={80} align="center" />
          <button className="md:hidden absolute right-4" onClick={()=>setSideOpen(false)}
            style={{background:"none",border:"none",cursor:"pointer",color:STXT}}>
            <X size={16}/>
          </button>
        </div>

        {/* Navigation groups */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-2 custom-scrollbar">
          {APP_NAV_SECTIONS.map((section, idx) => (
            <div key={section.label} className="space-y-0.5">
              {idx > 0 && <div className="my-1.5 border-t border-slate-100/50" />}
              {section.items.map(item => {
                const isMarketplaceGroupChild = section.label === "Marketplace" && item.path !== "/app/marketplace";
                if (isMarketplaceGroupChild) return null;

                const nestedItems = section.label === "Marketplace" && item.path === "/app/marketplace"
                  ? section.items.filter(child => child.path !== item.path)
                  : [];
                const hasActiveChild = nestedItems.some(child => isNavItemActive(child.path, child.end, child.match));
                const isActive = isNavItemActive(item.path, item.end, item.match) || hasActiveChild;
                const isExpanded = nestedItems.length > 0
                  ? (item.label in expandedNavs ? expandedNavs[item.label] : isActive)
                  : expandedNavs[item.label] !== false;

                return (
                  <div key={item.path} className="relative">
                    <NavLink
                      to={item.path}
                      end={item.end}
                      onClick={() => setSideOpen(false)}
                      className={() => [
                        "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-all duration-150",
                        "border-l-2 border-transparent",
                        isActive
                          ? "border-l-[#FF6B00] bg-[#FF6B00]/[0.03] text-[#FF6B00] font-semibold"
                          : "text-slate-600 hover:bg-slate-550/[0.03] hover:text-slate-900",
                      ].join(" ")}
                    >
                      <>
                        <item.icon
                          size={15}
                          strokeWidth={isActive ? 2.2 : 1.8}
                          className={[
                            "shrink-0 transition-transform duration-150",
                            isActive ? "text-[#FF6B00]" : "text-slate-400 group-hover:text-slate-650",
                          ].join(" ")}
                        />
                        <span className="flex-1 font-medium">{item.label}</span>
                        {item.badge && typeof item.badge !== "string" && (
                          <span className="relative flex h-1.5 w-1.5 shrink-0 items-center justify-center ml-auto">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-orange-500/25 animate-ping" />
                            <span className="relative h-1.5 w-1.5 rounded-full bg-orange-500" />
                          </span>
                        )}
                        {(item.dynamicChildren === "workspaces" && navWorkspaces.length > 0 || nestedItems.length > 0) && (
                          <div 
                            className="p-0.5 rounded hover:bg-orange-500/10 transition-colors ml-0.5"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleNav(item.label);
                            }}
                          >
                            <ChevronDown 
                              size={12} 
                              className={`transition-transform duration-150 text-slate-400 group-hover:text-slate-600 ${isExpanded ? "rotate-180" : ""}`} 
                            />
                          </div>
                        )}
                      </>
                    </NavLink>
                    {typeof item.badge === "string" && (
                      <div 
                        className="absolute inset-0 z-10 flex items-center justify-end px-3 rounded-lg cursor-not-allowed"
                        style={{ background: "rgba(255, 255, 255, 0.45)", backdropFilter: "blur(0.5px)" }}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      >
                        <span className="shrink-0 px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider text-orange-655 bg-orange-50 border border-orange-200/60 uppercase shadow-none">
                          {item.badge}
                        </span>
                      </div>
                    )}
                    <AnimatePresence initial={false}>
                      {nestedItems.length > 0 && isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="mt-0.5 ml-[18px] mr-1.5 border-l border-slate-100 pl-2.5 py-0.5 space-y-0.5">
                            {nestedItems.map(child => {
                              const childActive = isNavItemActive(child.path, child.end, child.match);

                              return (
                                <div key={child.path} className="relative">
                                  <NavLink
                                    to={child.path}
                                    end={child.end}
                                    onClick={() => setSideOpen(false)}
                                    className={[
                                      "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] transition-colors",
                                      childActive
                                        ? "bg-orange-500/[0.04] text-[#FF6B00] font-semibold"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium",
                                    ].join(" ")}
                                  >
                                    <child.icon size={13} strokeWidth={childActive ? 2.1 : 1.8} className={childActive ? "text-[#FF6B00]" : "text-slate-400"} />
                                    <span className="min-w-0 flex-1 truncate">{child.label}</span>
                                  </NavLink>
                                  {typeof child.badge === "string" && (
                                    <div
                                      className="absolute inset-0 z-10 flex items-center justify-end rounded-md px-2.5 cursor-not-allowed"
                                      style={{ background: "rgba(255, 255, 255, 0.45)", backdropFilter: "blur(0.5px)" }}
                                      onClick={(event) => { event.preventDefault(); event.stopPropagation(); }}
                                    >
                                      <span className="shrink-0 rounded border border-orange-200/60 bg-orange-50 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-orange-655">
                                        {child.badge}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                      {item.dynamicChildren === "workspaces" && navWorkspaces.length > 0 && isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="mt-0.5 ml-[18px] mr-1.5 border-l border-slate-100 pl-2.5 py-0.5 space-y-0.5">
                            {navWorkspaces.map(ws => {
                              const childSegment = item.path.split("/").pop() || "";
                              const childPath = `/app/workspaces/${ws.id}/${childSegment}`;
                              const childActive = pathname === childPath;
                              const showProgress = item.label === "Tiến độ" && typeof ws.progressPercent === "number";
                              
                              return (
                                <NavLink
                                  key={ws.id}
                                  to={childPath}
                                  onClick={() => setSideOpen(false)}
                                  className={[
                                    "flex items-center justify-between rounded-md px-2.5 py-1.5 text-[11px] transition-colors cursor-pointer",
                                    childActive
                                      ? "bg-orange-500/[0.04] text-[#FF6B00] font-semibold"
                                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium"
                                  ].join(" ")}
                                >
                                  <span className="truncate pr-1.5">{ws.name}</span>
                                  {showProgress && (
                                    <span className={`shrink-0 text-[9px] font-bold ${childActive ? "text-orange-600" : "text-slate-400"}`}>
                                      {Math.round(ws.progressPercent!)}%
                                    </span>
                                  )}
                                </NavLink>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-2.5 pb-4 pt-2">
          <div className="ss-upgrade mb-2" onClick={()=>setPricingOpen(true)}
            style={{
              padding:"10px",borderRadius:"8px",cursor:"pointer",
              background:"rgba(255,107,0,0.04)",
              border:"1px solid rgba(255,107,0,0.1)",
              transition:"all 0.15s ease",
            }}
            onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.background="rgba(255,107,0,0.08)";}}
            onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.background="rgba(255,107,0,0.04)";}}
          >
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.5px"}}>
              <span style={{fontSize:"8px",fontWeight:700,color:OG,letterSpacing:"0.06em",textTransform:"uppercase"}}>
                GÓI {planName ? planName.toUpperCase() : "STARTER"}
              </span>
              <Zap size={10} className="text-[#FF6B00]" fill="currentColor" />
            </div>
            <p style={{fontWeight:700,fontSize:"0.75rem",color:"#0F172A",marginBottom:"0.5px"}}>
              {planId === "FREE" && dynamicNextPlan ? `Nâng cấp lên ${dynamicNextPlan}` : (planMeta?.upgradeLabel || "Nâng cấp lên Pro")}
            </p>
            <p style={{color:"#64748B",fontSize:"0.65rem",lineHeight:"1.2"}}>
              {planMeta?.upgradeSubtext || "Mở khóa tính năng AI và nhiều hơn"}
            </p>
          </div>

          <div className="border-t border-slate-100 pt-2.5">
            <NavLink to="/app/profile" className="block rounded-lg transition hover:bg-slate-50" style={{ textDecoration: "none" }} onClick={() => setSideOpen(false)}>
              <div className="flex items-center gap-2 px-2.5 py-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-400 text-xs font-bold text-white shadow-[0_0_0_1px_rgba(0,0,0,0.04)] overflow-hidden">
                  {profile.avatarUrl
                    ? <img src={profile.avatarUrl} alt={profile.fullName} className="w-full h-full object-cover" />
                    : profile.avatarLetter}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-800">{profile.fullName}</p>
                  <p className="text-[10px] text-slate-500">{profile.roleLabel}</p>
                </div>
              </div>
            </NavLink>
          </div>
        </div>
      </aside>
    </>
  );
};

export const Sidebar = React.memo(SidebarComponent);

import React, { useState } from "react";
import { NavLink, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, X, Crown } from "lucide-react";
import { BrandLogo } from "../components/layout/BrandLogo";
import { APP_NAV_SECTIONS } from "../config/nav";
import type { RoadmapSidebarItem } from "./DashboardLayout";

// Extracted from DashboardLayout.tsx
const SHOVER = "rgba(255, 107, 0, 0.04)";
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
        .ss-nav-link:hover{background:${SHOVER};border-color:rgba(148,163,184,0.20);transform:translateX(2px);}
        .ss-nav-link:focus-visible{outline:none;border-color:rgba(255,107,0,0.45);box-shadow:0 0 0 2px rgba(255,107,0,0.18)}
        .ss-upgrade:hover{transform:translateY(-1px);box-shadow:0 8px 18px rgba(255,107,0,0.22)}
      `}</style>
      
      {/* Mobile overlay */}
      <AnimatePresence>
        {sideOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            onClick={()=>setSideOpen(false)}
            className="md:hidden"
            style={{position:"fixed",inset:0,zIndex:40,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(4px)"}}/>
        )}
      </AnimatePresence>

      <aside
        className={`fixed top-0 left-0 z-50 h-full flex flex-col
          md:relative md:translate-x-0 transition-transform duration-300
          ${sideOpen?"translate-x-0":"-translate-x-full"} hidden md:flex`}
        style={{
          width:"228px", flexShrink:0,
          background:"linear-gradient(180deg, #FFFDFB 0%, #FAF7F2 100%)",
          borderRight:"1px solid rgba(255,107,0,0.08)",
          boxShadow:"4px 0 24px rgba(255,107,0,0.02), 1px 0 5px rgba(0,0,0,0.01)",
        }}
      >
        {/* Logo */}
        <div style={{
          position: "relative",
          display:"flex", alignItems:"center", justifyContent:"center",
          padding:"16px",
          borderBottom:"1px solid rgba(255,107,0,0.08)",
        }}>
          <BrandLogo size={85} align="center" />
          <button className="md:hidden absolute right-4" onClick={()=>setSideOpen(false)}
            style={{background:"none",border:"none",cursor:"pointer",color:STXT}}>
            <X size={16}/>
          </button>
        </div>

        {/* Navigation groups */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-3 custom-scrollbar">
          {APP_NAV_SECTIONS.map((section, idx) => (
            <div key={section.label} className="space-y-1">
              {idx > 0 && <div className="my-2 border-t border-orange-100/40" />}
              {section.items.map(item => {
                const isActive = isNavItemActive(item.path, item.end, item.match);
                const isExpanded = expandedNavs[item.label] !== false;

                return (
                  <div key={item.path} className="relative">
                    <NavLink
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
                        {item.badge && typeof item.badge !== "string" && (
                          <span className="relative flex h-2 w-2 shrink-0 items-center justify-center ml-auto">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-orange-500/35 animate-ping" />
                            <span className="relative h-2 w-2 rounded-full bg-orange-500" />
                          </span>
                        )}
                        {item.dynamicChildren === "workspaces" && navWorkspaces.length > 0 && (
                          <div 
                            className="p-1 rounded hover:bg-orange-500/10 transition-colors ml-1"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleNav(item.label);
                            }}
                          >
                            <ChevronDown 
                              size={14} 
                              className={`transition-transform duration-200 text-slate-400 group-hover:text-slate-600 ${isExpanded ? "rotate-180" : ""}`} 
                            />
                          </div>
                        )}
                      </>
                    </NavLink>
                    {typeof item.badge === "string" && (
                      <div 
                        className="absolute inset-0 z-10 flex items-center justify-end px-3 rounded-xl cursor-not-allowed"
                        style={{ background: "rgba(255, 255, 255, 0.45)", backdropFilter: "blur(1px)" }}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      >
                        <span className="shrink-0 px-2 py-0.5 rounded text-[9px] font-bold tracking-wider text-orange-600 bg-orange-100 border border-orange-200 uppercase shadow-sm">
                          {item.badge}
                        </span>
                      </div>
                    )}
                    <AnimatePresence initial={false}>
                      {item.dynamicChildren === "workspaces" && navWorkspaces.length > 0 && isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="mt-1 ml-[22px] mr-2 space-y-0.5 border-l-2 border-orange-100/50 pl-3 py-1">
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
                                    "flex items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors cursor-pointer",
                                    childActive
                                      ? "bg-orange-50 text-[#FF6B00] font-bold"
                                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700 font-medium"
                                  ].join(" ")}
                                >
                                  <span className="truncate pr-2">{ws.name}</span>
                                  {showProgress && (
                                    <span className={`shrink-0 text-[10px] font-bold ${childActive ? "text-orange-600" : "text-slate-400"}`}>
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
              <span style={{fontSize:"8.5px",fontWeight:700,color:OG,letterSpacing:"0.08em",textTransform:"uppercase"}}>
                GÓI {planName ? planName.toUpperCase() : "STARTER"}
              </span>
              <Crown size={12} color="#F59E0B"/>
            </div>
            <p style={{fontWeight:700,fontSize:"0.8rem",color:"#0F172A",marginBottom:"1px"}}>
              {planId === "FREE" && dynamicNextPlan ? `Nâng cấp lên ${dynamicNextPlan}` : (planMeta?.upgradeLabel || "Nâng cấp lên Pro")}
            </p>
            <p style={{color:"#64748B",fontSize:"0.7rem"}}>
              {planMeta?.upgradeSubtext || "Mở khóa tính năng AI và nhiều hơn"}
            </p>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <NavLink to="/app/profile" className="block rounded-xl transition hover:bg-slate-100" style={{ textDecoration: "none" }} onClick={() => setSideOpen(false)}>
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
            </NavLink>
          </div>
        </div>
      </aside>
    </>
  );
};

export const Sidebar = React.memo(SidebarComponent);

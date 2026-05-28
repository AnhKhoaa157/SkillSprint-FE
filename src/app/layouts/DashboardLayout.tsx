import { useState } from "react";
import { Outlet, NavLink, useLocation, Link, useNavigate } from "react-router";
import {
  LayoutDashboard, Map, Mic, Settings,
  Menu, X, Bell, ChevronRight, Crown, Gift,
  Calendar, CheckSquare, BarChart2, Trophy, UploadCloud, Sparkles,
  AlertTriangle, CalendarClock, BookOpenCheck, CheckCircle2, FolderKanban,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ReferralModal } from "../components/ReferralModal";
import { BrandLogo } from "../components/BrandLogo";
import { PricingModal } from "../components/PricingModal";

/* ─── Sidebar Design Tokens ─── */
const F      = "'Inter','Plus Jakarta Sans',sans-serif";
const SBG    = "#FAFAFA";   // sidebar light background
const SBDR   = "#E5E7EB";
const STXT   = "#6B7280";   // inactive text
const STXT_A = "#111827";   // active text
const OG     = "#FF6B00";
const OGL    = "rgba(255,107,0,0.12)";
const SHOVER = "#F3F4F6";
/* content area tokens */
const BG     = "#F9FAFB";
const CARD   = "#FFFFFF";
const T1     = "#1F2937";
const T2     = "#6B7280";
const T3     = "#9CA3AF";
const BDR    = "#E5E7EB";

const NAV = [
  { path:"/app",                label:"Trung tâm điều khiển", icon:LayoutDashboard, end:true },
  { path:"/app/roadmap",        label:"Lộ trình AI",          icon:Map },
  { path:"/app/calendar",       label:"Lịch học",             icon:Calendar },
  { path:"/app/matrix",         label:"Ma trận công việc",    icon:CheckSquare },
  { path:"/app/workspaces",     label:"Workspace",            icon:FolderKanban },
  { path:"/app/leaderboard",    label:"Bảng xếp hạng",        icon:Trophy },
];

const CRUMBS: Record<string,string> = {
  "/app":"Trung tâm điều khiển",
  "/app/syllabus":"Nhập syllabus",
  "/app/roadmap":"Lộ trình AI",
  "/app/calendar":"Lịch học",
  "/app/matrix":"Ma trận công việc",
  "/app/workspaces":"Workspace",
  "/app/analytics":"Phân tích",
  "/app/leaderboard":"Bảng xếp hạng",
  "/app/mock-interview":"Phỏng vấn thử",
  "/app/learning":"Trung tâm học tập",
  "/app/learning/course":"Trung tâm học tập > Video bài giảng",
  "/app/quiz-review":"Trung tâm học tập > Quiz luyện tập",
  "/app/profile":"Cài đặt",
  "/app/upgraded":"Sau nâng cấp",
};

export default function DashboardLayout() {
  const [sideOpen, setSideOpen]       = useState(false);
  const [referralOpen, setReferralOpen] = useState(false);
  const [notifOpen, setNotifOpen]     = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const navigate = useNavigate();
  const loc   = useLocation();
  const crumb = CRUMBS[loc.pathname] ?? "Trung tâm điều khiển";

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

      {/* ════════════════ DARK NAVY SIDEBAR ════════════════ */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full flex flex-col
          lg:relative lg:translate-x-0 transition-transform duration-300
          ${sideOpen?"translate-x-0":"-translate-x-full"}`}
        style={{
          width:"228px", flexShrink:0,
          background: SBG,
          borderRight:`1px solid ${SBDR}`,
        }}
      >
        {/* Logo */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"18px 16px 16px",
          borderBottom:`1px solid ${SBDR}`,
        }}>
          <Link to="/" style={{display:"flex",alignItems:"center",gap:"9px",textDecoration:"none"}}>
            <BrandLogo size={32} showText={false} textColor="#111827" useSvg={true} />
            <div>
              <p style={{fontWeight:800,fontSize:"0.96rem",color:"#111827",letterSpacing:"-0.02em",lineHeight:1}}>
                SkillSprint
              </p>
              <span style={{
                fontSize:"9px",padding:"1px 6px",borderRadius:"3px",marginTop:"3px",
                display:"inline-block",background:"rgba(255,107,0,0.12)",
                color:OG,fontWeight:700,letterSpacing:"0.06em",
              }}>FREE</span>
            </div>
          </Link>
          <button className="lg:hidden" onClick={()=>setSideOpen(false)}
            style={{background:"none",border:"none",cursor:"pointer",color:STXT}}>
            <X size={16}/>
          </button>
        </div>

        {/* Section label */}
        <div style={{padding:"13px 16px 8px"}}>
          <p style={{fontSize:"9px",color:"rgba(148,163,184,0.5)",fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase"}}>
            Danh mục
          </p>
        </div>

        {/* Nav */}
        <nav style={{flex:1,padding:"0 10px",overflowY:"auto",display:"flex",flexDirection:"column",gap:"4px"}}>
          {NAV.map(item => (
            <NavLink key={item.path} to={item.path} end={item.end}
              className="ss-nav-link"
              onClick={()=>setSideOpen(false)}
              style={({isActive})=>({
                display:"flex",alignItems:"center",gap:"9px",
                padding:"9px 11px",borderRadius:"10px",textDecoration:"none",
                color:isActive?"#FFFFFF":STXT,
                background:isActive?"linear-gradient(135deg, #FF6B00, #FF8C3A)":"transparent",
                borderColor:"transparent",
                fontWeight:isActive?700:500,
                fontSize:"0.848rem",fontFamily:F,
                transition:"all 0.14s ease",
                position:"relative",
                boxShadow:isActive?"0 4px 12px rgba(255,107,0,0.25)":"none",
              })}>
              {({isActive})=>(
                <>
                  <item.icon size={15} color={isActive?"#FFFFFF":STXT} strokeWidth={isActive?2.2:1.9}/>
                  <span style={{flex:1}}>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{padding:"11px 10px 16px",borderTop:`1px solid ${SBDR}`,display:"flex",flexDirection:"column",gap:"7px"}}>
          {/* Upgrade card */}
          <button
            className="ss-upgrade"
            onClick={() => setPricingOpen(true)}
            style={{
              textAlign: "left",
              padding:"14px 12px",borderRadius:"12px",cursor:"pointer",
              background:"linear-gradient(180deg, #111827 0%, #0B1220 100%)",
              border:"1px solid #374151",
              transition:"all 0.15s ease",
              display:"block",
              width: "100%",
              position:"relative",
              overflow:"hidden",
            }}
            onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.boxShadow="0 8px 24px rgba(0,0,0,0.15)"; (e.currentTarget as HTMLButtonElement).style.borderColor="#4B5563";}}
            onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.boxShadow="none"; (e.currentTarget as HTMLButtonElement).style.borderColor="#374151";}}
          >
            <div style={{
              position:"absolute", top:"-20px", right:"-20px",
              width:"60px", height:"60px", borderRadius:"50%",
              background:"radial-gradient(circle, rgba(255,107,0,0.2), transparent 70%)",
            }}/>
            <div style={{position:"relative", zIndex:1}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"}}>
                <span style={{fontSize:"8.5px",fontWeight:800,color:"#FDBA74",letterSpacing:"0.08em",textTransform:"uppercase"}}>GÓI MIỄN PHÍ</span>
                <Crown size={14} color="#F59E0B"/>
              </div>
              <p style={{fontWeight:700,fontSize:"0.85rem",color:"#FFFFFF",marginBottom:"2px"}}>Nâng cấp lên Pro</p>
              <p style={{color:"#9CA3AF",fontSize:"0.7rem",lineHeight:1.4}}>Mở khóa phỏng vấn thử AI và nhiều hơn</p>
            </div>
          </button>

          {/* Referral */}
          <button className="ss-referral" onClick={()=>setReferralOpen(true)}
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

          {/* User */}
          <Link to="/app/profile" style={{textDecoration:"none"}}>
            <div style={{
              display:"flex",alignItems:"center",gap:"9px",
              padding:"9px 10px",borderRadius:"8px",cursor:"pointer",
              transition:"background 0.12s",
            }}
            onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.background=OGL;}}
            onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.background="transparent";}}>
              <div style={{
                width:"28px",height:"28px",borderRadius:"50%",flexShrink:0,
                background:"linear-gradient(135deg,#FF6B00,#FF9A3D)",
                display:"flex",alignItems:"center",justifyContent:"center",
              }}>
                <span style={{fontSize:"11px",fontWeight:800,color:"#fff"}}>A</span>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:"0.78rem",fontWeight:600,color:"#111827",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  Nguyễn Văn A
                </p>
                <p style={{fontSize:"9.5px",color:STXT}}>Free Tier</p>
              </div>
            </div>
          </Link>
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
                <span style={{position:"absolute",top:"6px",right:"6px",width:"6px",height:"6px",borderRadius:"50%",background:OG,border:`1.5px solid ${CARD}`}}/>
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
                          <span style={{ fontFamily:F, fontSize:"0.60rem", fontWeight:700, color:OG }}>3 mới</span>
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
                    <div style={{ display:"flex", flexDirection:"column" }}>

                      {/* ── Item 1: URGENT alert ── */}
                      <div style={{
                        padding:"13px 15px",
                        borderBottom:`1px solid ${BDR}`,
                        background:"#FFFBEB",
                        borderLeft:"3px solid #F59E0B",
                      }}>
                        <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                          <div style={{
                            width:32, height:32, borderRadius:8, flexShrink:0,
                            background:"#FEF3C7", border:"1.5px solid #FCD34D",
                            display:"flex", alignItems:"center", justifyContent:"center",
                          }}>
                            <AlertTriangle size={15} color="#D97706"/>
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                              <span style={{ fontFamily:F, fontSize:"0.60rem", fontWeight:800, color:"#D97706", letterSpacing:"0.08em", textTransform:"uppercase" }}>Cảnh báo</span>
                              <span style={{ fontFamily:F, fontSize:"0.60rem", color:T3 }}>Hôm qua · 8:00 PM</span>
                            </div>
                            <p style={{ fontFamily:F, fontSize:"0.80rem", fontWeight:600, color:T1, lineHeight:1.5, marginBottom:10 }}>
                              Bạn đã bỏ lỡ buổi học HTML &amp; CSS hôm qua. Muốn AI sắp xếp lại lịch không?
                            </p>
                            <div style={{ display:"flex", gap:7 }}>
                              <button style={{
                                padding:"5px 13px", borderRadius:7,
                                border:"1.5px solid #D97706", background:"transparent",
                                fontFamily:F, fontWeight:700, fontSize:"0.72rem", color:"#D97706",
                                cursor:"pointer", transition:"all 0.12s",
                                display:"flex", alignItems:"center", gap:5,
                              }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background="#FEF3C7"; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background="transparent"; }}
                              >
                                <CalendarClock size={12}/>
                                Sắp xếp lại
                              </button>
                              <button style={{
                                padding:"5px 13px", borderRadius:7,
                                border:`1.5px solid ${BDR}`, background:"transparent",
                                fontFamily:F, fontWeight:600, fontSize:"0.72rem", color:T3,
                                cursor:"pointer", transition:"all 0.12s",
                              }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background=BG; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background="transparent"; }}
                              >
                                Bỏ qua
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ── Item 2 ── */}
                      <div style={{
                        padding:"12px 15px",
                        borderBottom:`1px solid ${BDR}`,
                        background:CARD,
                        display:"flex", alignItems:"flex-start", gap:10,
                      }}>
                        <div style={{
                          width:32, height:32, borderRadius:8, flexShrink:0,
                          background:"#F0FDF4", border:"1.5px solid #A7F3D0",
                          display:"flex", alignItems:"center", justifyContent:"center",
                        }}>
                          <BookOpenCheck size={15} color="#059669"/>
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:3 }}>
                            <span style={{ fontFamily:F, fontSize:"0.60rem", fontWeight:700, color:"#059669" }}>AI Roadmap</span>
                            <span style={{ fontFamily:F, fontSize:"0.60rem", color:T3 }}>2 giờ trước</span>
                          </div>
                          <p style={{ fontFamily:F, fontSize:"0.78rem", color:T2, lineHeight:1.5 }}>
                            Lộ trình tuần 4 đã sẵn sàng — 5 chủ đề mới về <strong style={{ color:T1 }}>Data Structures</strong> được thêm vào.
                          </p>
                        </div>
                      </div>

                      {/* ── Item 3 ── */}
                      <div style={{
                        padding:"12px 15px",
                        background:CARD,
                        display:"flex", alignItems:"flex-start", gap:10,
                      }}>
                        <div style={{
                          width:32, height:32, borderRadius:8, flexShrink:0,
                          background:"#EFF6FF", border:"1.5px solid #BFDBFE",
                          display:"flex", alignItems:"center", justifyContent:"center",
                        }}>
                          <CheckCircle2 size={15} color="#2563EB"/>
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:3 }}>
                            <span style={{ fontFamily:F, fontSize:"0.60rem", fontWeight:700, color:"#2563EB" }}>Thành tích</span>
                            <span style={{ fontFamily:F, fontSize:"0.60rem", color:T3 }}>Hôm nay</span>
                          </div>
                          <p style={{ fontFamily:F, fontSize:"0.78rem", color:T2, lineHeight:1.5 }}>
                            Bạn đạt <strong style={{ color:T1 }}>12 ngày streak</strong> liên tiếp! 🔥 Giữ vững nhé!
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div style={{ padding:"9px 15px", borderTop:`1px solid ${BDR}`, background:BG, textAlign:"center" }}>
                      <button style={{
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
      </main>

      <ReferralModal isOpen={referralOpen} onClose={()=>setReferralOpen(false)}/>
      <PricingModal isOpen={pricingOpen} onClose={()=>setPricingOpen(false)} />
    </div>
  );
}
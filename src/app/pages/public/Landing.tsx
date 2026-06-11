import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "motion/react";
import {
  ArrowRight, Zap, Map, FileText, FolderKanban, Star,
  CheckCircle, ChevronRight, Sparkles, Brain,
  TrendingUp, Shield, Users, Play, Github,
  Twitter, Linkedin, Menu, X, Target, Clock,
} from "lucide-react";
import { BrandLogo } from "../components/BrandLogo";
import { PublicNavbar } from "../components/PublicNavbar";
import { Footer as PublicFooter } from "../components/Footer";
import LandingHero3DViewer from "../components/landing/LandingHero3DViewer";
import LandingSection3DViewer from "../components/landing/LandingSection3DViewer";

/* ─── Design Tokens ─── */
const F    = "'Plus Jakarta Sans', Inter, sans-serif";
const BG   = "#F9FAFB";
const CARD = "#FFFFFF";
const T1   = "#1F2937";
const T2   = "#6B7280";
const T3   = "#9CA3AF";
const OG   = "#FF6B00";
const OGL  = "#FFF7ED";
const OGLT = "#FFEDD5";
const BDR  = "#E5E7EB";
const SH   = "0 1px 3px rgba(0,0,0,0.06),0 4px 12px rgba(0,0,0,0.04)";
const SHM  = "0 4px 16px rgba(0,0,0,0.08),0 1px 4px rgba(0,0,0,0.04)";
const SHL  = "0 8px 40px rgba(0,0,0,0.10),0 2px 8px rgba(0,0,0,0.05)";

/* ─── Radar Chart ─── */
function SkillRadar() {
  const cx = 130, cy = 130, r = 92;
  const skills = ["React","TypeScript","Node.js","SQL","System\nDesign","Comms"];
  const target  = [1.0,1.0,0.9,0.85,1.0,0.9];
  const current = [0.72,0.50,0.62,0.38,0.28,0.82];
  const n = skills.length;
  const pt = (i: number, v: number) => {
    const a = (i * 2 * Math.PI) / n - Math.PI / 2;
    return { x: cx + v * r * Math.cos(a), y: cy + v * r * Math.sin(a) };
  };
  const poly = (vs: number[]) =>
    vs.map((v,i) => pt(i,v)).map((p,i) => `${i===0?"M":"L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")+"Z";

  return (
    <svg width="260" height="260" viewBox="0 0 260 260">
      <defs>
        <linearGradient id="rTgt" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF6B00" stopOpacity="0.07"/>
          <stop offset="100%" stopColor="#FF6B00" stopOpacity="0.03"/>
        </linearGradient>
        <linearGradient id="rCur" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF6B00" stopOpacity="0.55"/>
          <stop offset="100%" stopColor="#FF6B00" stopOpacity="0.35"/>
        </linearGradient>
        <filter id="rGlow">
          <feGaussianBlur stdDeviation="2.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {[0.25,0.5,0.75,1.0].map((lv,i) => (
        <path key={i} d={poly(Array(n).fill(lv))} fill="none" stroke="#E5E7EB" strokeWidth="1.5"/>
      ))}
      {skills.map((_,i) => {
        const p = pt(i,1);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#E5E7EB" strokeWidth="1.5"/>;
      })}
      <path d={poly(target)} fill="url(#rTgt)" stroke="#FFEDD5" strokeWidth="1.5"/>
      <path d={poly(current)} fill="url(#rCur)" stroke={OG} strokeWidth="2" filter="url(#rGlow)"/>
      {current.map((v,i) => {
        const p = pt(i,v);
        return (
          <motion.circle key={i} cx={p.x} cy={p.y} r={5} fill={OG}
            style={{ filter: "drop-shadow(0 0 4px rgba(255,107,0,0.6))" }}
            animate={{ r:[4,6,4] }} transition={{ duration:2, repeat:Infinity, delay:i*0.3 }}/>
        );
      })}
      {skills.map((s,i) => {
        const p = pt(i,1.22);
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
            style={{ fill: T2, fontSize:"9.5px", fontFamily:F, fontWeight:600 }}>
            {s.split("\n").map((l,li) => <tspan key={li} x={p.x} dy={li===0?"0":"11"}>{l}</tspan>)}
          </text>
        );
      })}
    </svg>
  );
}

/* ─── Dashboard Mockup ─── */
function DashboardMockup() {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setCoords({ x, y });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setCoords({ x: 0, y: 0 });
  };

  // Base rotation: rotateX(11deg) rotateY(-8deg) rotateZ(2deg)
  const rx = isHovered ? 11 - coords.y * 12 : 11;
  const ry = isHovered ? -8 + coords.x * 12 : -8;
  const rz = isHovered ? 2 + coords.x * 2 : 2;
  const scale = isHovered ? 1.03 : 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
      className="relative mx-auto"
      style={{
        maxWidth: "820px",
        perspective: "2000px",
        perspectiveOrigin: "50% 50%"
      }}
    >
      <div
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${scale})`,
          transition: isHovered ? "transform 0.05s linear, box-shadow 0.3s ease" : "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease",
          cursor: "pointer"
        }}
      >
        {/* Soft, premium ambient back-glow */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: "24px",
          background: "radial-gradient(ellipse 70% 40% at 50% 105%, rgba(255,107,0,0.15) 0%, rgba(124,58,237,0.08) 50%, transparent 85%)",
          filter: "blur(40px)",
          transform: "translateZ(-30px)",
          pointerEvents: "none"
        }}/>

        {/* Browser window */}
        <div style={{
          background: CARD,
          borderRadius: "18px",
          overflow: "hidden",
          boxShadow: isHovered 
            ? "0 30px 100px rgba(0,0,0,0.16), 0 10px 30px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)"
            : "0 20px 80px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
          transformStyle: "preserve-3d",
          transition: "box-shadow 0.3s ease"
        }}>
          {/* Chrome bar */}
          <div style={{
            display: "flex", alignItems: "center", gap: "8px", padding: "12px 16px",
            borderBottom: `1px solid ${BDR}`, background: "#FAFAFA",
            transform: "translateZ(5px)"
          }}>
            <div style={{ display: "flex", gap: "6px" }}>
              {["#FF5F57", "#FFBD2E", "#28C840"].map((c, i) => (
                <div key={i} style={{ width: "10px", height: "10px", borderRadius: "50%", background: c }}/>
              ))}
            </div>
            <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: "6px", padding: "4px 12px",
                borderRadius: "6px", background: "#F1F3F4", fontSize: "11px", color: T3, fontFamily: F,
              }}>skillsprint.app/dashboard</div>
            </div>
          </div>

          {/* Content */}
          <div style={{ display: "flex", height: "340px", transformStyle: "preserve-3d" }}>
            {/* Mini sidebar with translateZ */}
            <div style={{
              width: "52px", display: "flex", flexDirection: "column", alignItems: "center",
              paddingTop: "16px", gap: "16px", borderRight: `1px solid ${BDR}`, background: "#FAFAFA",
              transform: "translateZ(15px)",
              transformStyle: "preserve-3d",
              transition: "transform 0.3s ease"
            }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "8px",
                background: OG, display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 8px rgba(255,107,0,0.3)"
              }}>
                <Zap size={13} color="#fff" fill="#fff"/>
              </div>
              {[Map, FileText, FolderKanban, TrendingUp].map((Icon, i) => (
                <div key={i} style={{
                  width: "32px", height: "32px", borderRadius: "8px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: i === 0 ? OGL : "transparent",
                  color: i === 0 ? OG : T3,
                }}>
                  <Icon size={15}/>
                </div>
              ))}
            </div>

            {/* Main area */}
            <div style={{ flex: 1, padding: "20px", background: BG, overflow: "hidden", transformStyle: "preserve-3d" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", transform: "translateZ(10px)" }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.85rem", color: T1, fontFamily: F }}>Bảng điều khiển tiến độ học tập</p>
                  <p style={{ color: T3, fontSize: "0.65rem", fontFamily: F }}>Cập nhật 2 giờ trước</p>
                </div>
                <span style={{
                  fontSize: "10px", padding: "2px 8px", borderRadius: "99px",
                  background: OGL, color: OG, border: `1px solid ${OGLT}`,
                  fontFamily: F, fontWeight: 700,
                  boxShadow: "0 2px 6px rgba(255,107,0,0.08)"
                }}>ĐANG HỌC</span>
              </div>

              {/* Stats row with translateZ - cards lift up individually */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "14px", transformStyle: "preserve-3d" }}>
                {[
                  { l: "Độ khớp kỹ năng", v: "72%", c: "#FF6B00", z: "35px" },
                  { l: "XP tích lũy", v: "1.2K", c: "#7C3AED", z: "40px" },
                  { l: "Chuỗi ngày học", v: "12", c: "#059669", z: "35px" },
                ].map(s => (
                  <div key={s.l} style={{
                    background: CARD, borderRadius: "10px", padding: "10px",
                    boxShadow: isHovered ? "0 10px 24px rgba(0,0,0,0.06)" : SH,
                    transform: `translateZ(${isHovered ? s.z : "20px"})`,
                    transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease",
                    transformStyle: "preserve-3d"
                  }}>
                    <p style={{ fontWeight: 800, fontSize: "1.1rem", color: s.c, fontFamily: F, lineHeight: 1 }}>{s.v}</p>
                    <p style={{ color: T3, fontSize: "9px", fontFamily: F, marginTop: "2px" }}>{s.l}</p>
                  </div>
                ))}
              </div>

              {/* Lower row */}
              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", transformStyle: "preserve-3d" }}>
                <div style={{
                  flex: 1,
                  transform: `translateZ(${isHovered ? "28px" : "15px"})`,
                  transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                  transformStyle: "preserve-3d"
                }}>
                  <p style={{ color: T3, fontSize: "9px", fontFamily: F, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Radar skill gap</p>
                  <div style={{ filter: "drop-shadow(0 8px 24px rgba(255,107,0,0.08))" }}>
                    <SkillRadar/>
                  </div>
                </div>

                <div style={{
                  width: "110px",
                  transform: `translateZ(${isHovered ? "32px" : "15px"})`,
                  transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
                }}>
                  <p style={{ color: T3, fontSize: "9px", fontFamily: F, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Lộ trình AI</p>
                  {["React Hooks", "TypeScript", "System Design"].map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                      <div style={{
                        width: "16px", height: "16px", borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        background: i === 0 ? "#ECFDF5" : i === 1 ? OGL : BG,
                        border: `1.5px solid ${i === 0 ? "#6EE7B7" : i === 1 ? OGLT : BDR}`,
                      }}>
                        {i === 0 && <CheckCircle size={9} color="#059669"/>}
                        {i === 1 && <Zap size={8} color={OG}/>}
                      </div>
                      <span style={{ color: i === 2 ? T3 : T1, fontSize: "8px", fontFamily: F, fontWeight: i === 1 ? 600 : 400 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Navbar ─── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <motion.nav initial={{ y:-20, opacity:0 }} animate={{ y:0, opacity:1 }}
      transition={{ duration:0.5 }}
      className="fixed top-0 left-0 right-0 z-50 px-4" style={{ paddingTop:"14px" }}>
      <div className="max-w-6xl mx-auto">
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"10px 20px", borderRadius:"14px",
          background: scrolled ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.7)",
          backdropFilter:"blur(20px)",
          boxShadow: scrolled ? SHM : "none",
          border:`1px solid ${scrolled ? BDR : "transparent"}`,
          transition:"all 0.3s ease",
        }}>
          {/* Logo */}
          <Link to="/" style={{ display:"flex", alignItems:"center", gap:"10px", textDecoration:"none" }}>
            <BrandLogo size={32} textColor={T1} textSize="1rem" align="left" />
          </Link>
          {/* Desktop nav */}
          <div className="hidden md:flex" style={{ gap:"28px" }}>
            {[
              { label: "Tính năng", to: "/features" },
              { label: "Bảng giá", to: "/#pricing" },
              { label: "Giới thiệu", to: "/about" },
              { label: "Liên hệ", to: "/contact" },
            ].map(item => (
              <Link key={item.label} to={item.to} style={{ color:T2, fontSize:"0.875rem", fontFamily:F, fontWeight:500, textDecoration:"none" }}
                onMouseEnter={e=>{(e.target as HTMLAnchorElement).style.color=T1;}}
                onMouseLeave={e=>{(e.target as HTMLAnchorElement).style.color=T2;}}>
                {item.label}
              </Link>
            ))}
          </div>
          {/* CTAs */}
          <div className="hidden md:flex" style={{ gap:"10px", alignItems:"center" }}>
            <Link to="/login" style={{ color:T2, fontSize:"0.875rem", fontFamily:F, fontWeight:500, textDecoration:"none", padding:"6px 12px" }}>
              Đăng nhập
            </Link>
            <Link to="/login">
              <motion.button style={{
                padding:"8px 20px", borderRadius:"10px", background:OG, color:"#fff",
                fontFamily:F, fontWeight:700, fontSize:"0.875rem", border:"none", cursor:"pointer",
                boxShadow:`0 4px 14px rgba(255,107,0,0.35)`,
              }}
              whileHover={{ scale:1.03, boxShadow:`0 6px 20px rgba(255,107,0,0.45)` }}
              whileTap={{ scale:0.97 }}>
                Bắt đầu miễn phí →
              </motion.button>
            </Link>
          </div>
          <button className="md:hidden" onClick={()=>setOpen(v=>!v)} style={{ color:T2, background:"none", border:"none", cursor:"pointer" }}>
            {open ? <X size={20}/> : <Menu size={20}/>}
          </button>
        </div>
        <AnimatePresence>
          {open && (
            <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
              style={{
                marginTop:"8px", padding:"16px", borderRadius:"14px",
                background:CARD, boxShadow:SHL, border:`1px solid ${BDR}`,
              }}>
              {[
                { label: "Tính năng", to: "/features" },
                { label: "Bảng giá", to: "/#pricing" },
                { label: "Giới thiệu", to: "/about" },
                { label: "Liên hệ", to: "/contact" },
              ].map(item => (
                <Link key={item.label} to={item.to} style={{ display: "block", padding:"10px 0", borderBottom:`1px solid ${BDR}`, textDecoration: "none" }} onClick={() => setOpen(false)}>
                  <span style={{ color:T1, fontFamily:F, fontWeight:500 }}>{item.label}</span>
                </Link>
              ))}
              <Link to="/login" style={{ display:"block", marginTop:"12px", textDecoration:"none" }}>
                <button style={{ width:"100%", padding:"10px", borderRadius:"10px", background:OG, color:"#fff", fontFamily:F, fontWeight:700, border:"none", cursor:"pointer" }}>
                  Bắt đầu dùng thử
                </button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}

/* ─── Hero ─── */
function Hero() {
  return (
    <section style={{ background:"transparent", paddingTop:"140px", paddingBottom:"80px", textAlign:"center", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", inset:0, zIndex:0, pointerEvents:"none" }}>
        <LandingHero3DViewer />
      </div>

      {/* Subtle radial tint */}
      <div style={{
        position:"absolute", top:"-10%", left:"50%", transform:"translateX(-50%)",
        width:"700px", height:"500px",
        background:"radial-gradient(ellipse, rgba(255,107,0,0.07) 0%, transparent 65%)",
        zIndex:1,
        pointerEvents:"none",
      }}/>

      <div className="max-w-4xl mx-auto px-4" style={{ position:"relative", zIndex:2 }}>
        {/* Announcement pill */}
        <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
          style={{
            display:"inline-flex", alignItems:"center", gap:"6px",
            padding:"6px 14px", borderRadius:"99px", marginBottom:"28px",
            background:OGL, border:`1px solid ${OGLT}`,
          }}>
          <Sparkles size={12} color={OG}/>
          <span style={{ fontFamily:F, fontSize:"0.78rem", color:OG, fontWeight:700 }}>
            Study Coach AI cho sinh viên Gen Z
          </span>
          <ChevronRight size={12} color={OG}/>
        </motion.div>

        {/* Heading */}
        <motion.h1 initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:0.7, delay:0.15, ease:[0.16,1,0.3,1] }}
          style={{
            fontFamily:F, fontWeight:900, fontSize:"clamp(2.8rem,6vw,5.2rem)",
            letterSpacing:"-0.04em", lineHeight:1.05, color:T1,
            marginBottom:"20px",
          }}>
          Học <span style={{ color:OG }}>Thông Minh,</span><br/>Không Học Quá Tải.
        </motion.h1>

        {/* Subtitle */}
        <motion.p initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:0.7, delay:0.25 }}
          style={{
            fontFamily:F, fontSize:"1.15rem", color:T2, lineHeight:1.75,
            maxWidth:"500px", margin:"0 auto 36px",
          }}>
          Hệ sinh thái AI giúp bạn phát hiện lỗ hổng kỹ năng, xây lộ trình rõ ràng
          và tăng cơ hội đạt kết quả tốt trong học tập lẫn thực tập.
        </motion.p>

        {/* CTAs */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:0.6, delay:0.32 }}
          style={{ display:"flex", gap:"12px", justifyContent:"center", flexWrap:"wrap", marginBottom:"60px" }}>
          <Link to="/login" style={{ textDecoration:"none" }}>
            <motion.button style={{
              display:"flex", alignItems:"center", gap:"8px",
              padding:"14px 32px", borderRadius:"14px", background:OG, color:"#fff",
              fontFamily:F, fontWeight:700, fontSize:"1rem", border:"none", cursor:"pointer",
              boxShadow:`0 4px 20px rgba(255,107,0,0.4), 0 1px 4px rgba(255,107,0,0.2)`,
            }}
            whileHover={{ scale:1.04, boxShadow:`0 8px 28px rgba(255,107,0,0.5), 0 2px 6px rgba(255,107,0,0.3)` }}
            whileTap={{ scale:0.97 }}>
              <Zap size={16} fill="#fff" color="#fff"/>
              Bắt đầu dùng thử
              <ArrowRight size={16}/>
            </motion.button>
          </Link>
          <motion.button style={{
            display:"flex", alignItems:"center", gap:"8px",
            padding:"14px 28px", borderRadius:"14px",
            background:CARD, color:T1,
            fontFamily:F, fontWeight:600, fontSize:"1rem",
            border:`1.5px solid ${BDR}`, cursor:"pointer",
            boxShadow:SH,
          }}
          whileHover={{ scale:1.03, boxShadow:SHM }} whileTap={{ scale:0.97 }}>
            <Play size={14} fill={T2} color={T2}/>
            Xem Demo
          </motion.button>
        </motion.div>

        {/* Social proof */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }}
          style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"20px", flexWrap:"wrap", marginBottom:"64px" }}>
          <div style={{ display:"flex", marginLeft:"-8px" }}>
            {["#FF6B00","#7C3AED","#0EA5E9","#059669","#EC4899"].map((c,i) => (
              <div key={i} style={{
                width:"32px", height:"32px", borderRadius:"50%",
                background:`linear-gradient(135deg,${c},${c}88)`,
                border:`2px solid ${CARD}`, marginLeft:"-8px",
                display:"flex", alignItems:"center", justifyContent:"center",
                color:"#fff", fontSize:"11px", fontWeight:700,
              }}>
                {["N","T","L","H","V"][i]}
              </div>
            ))}
          </div>
          <span style={{ color:T2, fontSize:"0.85rem", fontFamily:F }}>
            <strong style={{ color:T1 }}>Tham gia Early Access</strong> cùng 50+ sinh viên IT tiên phong
          </span>
          <div style={{ display:"flex", gap:"2px" }}>
            {[1,2,3,4,5].map(i => <Star key={i} size={14} fill={OG} color={OG}/>)}
          </div>
        </motion.div>

        {/* Mockup */}
        <DashboardMockup/>
      </div>
    </section>
  );
}

/* ─── Features ─── */
interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  borderColor?: string;
  hoverBorderColor?: string;
}

function BentoCard({ children, className, style, borderColor = BDR, hoverBorderColor = OG }: BentoCardProps) {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setCoords({ x, y });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setCoords({ x: 0, y: 0 });
  };

  const rotateX = isHovered ? -coords.y * 8 : 0;
  const rotateY = isHovered ? coords.x * 8 : 0;

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{
        background: CARD,
        borderRadius: "24px",
        border: `1px solid ${isHovered ? hoverBorderColor : borderColor}`,
        boxShadow: isHovered 
          ? "0 20px 40px rgba(15,23,42,0.05), 0 8px 16px rgba(15,23,42,0.02), 0 0 0 1px rgba(15,23,42,0.04)" 
          : SH,
        cursor: "default",
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(${isHovered ? -4 : 0}px) translateZ(${isHovered ? 8 : 0}px)`,
        transition: isHovered ? "transform 0.05s linear, box-shadow 0.3s ease, border-color 0.3s ease" : "transform 0.4s ease, box-shadow 0.3s ease, border-color 0.3s ease",
        transformStyle: "preserve-3d",
        ...style
      }}
    >
      {children}
    </div>
  );
}

function Features() {
  return (
    <section style={{ background:"transparent", padding:"96px 16px", position:"relative", overflow:"hidden" }}>
      {/* Background glow orbs */}
      <div style={{
        position:"absolute", top:"-10%", right:"-5%",
        width:"400px", height:"400px", borderRadius:"50%",
        background:"radial-gradient(circle, rgba(255,107,0,0.03) 0%, transparent 70%)",
        filter:"blur(60px)", pointerEvents:"none", zIndex:0
      }}/>
      <div style={{
        position:"absolute", bottom:"-10%", left:"-5%",
        width:"400px", height:"400px", borderRadius:"50%",
        background:"radial-gradient(circle, rgba(124,58,237,0.03) 0%, transparent 70%)",
        filter:"blur(60px)", pointerEvents:"none", zIndex:0
      }}/>

      <div className="max-w-6xl mx-auto" style={{ position:"relative", zIndex:1 }}>
        <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          style={{ textAlign:"center", marginBottom:"56px" }}>
          <div style={{
            display:"inline-flex", alignItems:"center", gap:"6px",
            padding:"5px 14px", borderRadius:"99px", marginBottom:"16px",
            background:OGL, border:`1px solid ${OGLT}`,
          }}>
            <Sparkles size={12} color={OG}/>
            <span style={{ fontFamily:F, fontSize:"0.78rem", color:OG, fontWeight:700 }}>Hệ sinh thái thông minh</span>
          </div>
          <h2 style={{ fontFamily:F, fontWeight:900, fontSize:"clamp(1.8rem,3.5vw,2.8rem)", color:T1, letterSpacing:"-0.03em", lineHeight:1.1, margin:"0 auto 16px" }}>
            Lợi thế học tập vượt bậc<br/>
            <span style={{
              background: "linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>bắt đầu từ đây.</span>
          </h2>
          <p style={{ fontFamily:F, color:T2, fontSize:"1rem", lineHeight:1.7, maxWidth:"480px", margin:"0 auto" }}>
            Sáu công cụ AI liên kết chặt chẽ để giúp bạn học nhanh hơn và sẵn sàng cho sự nghiệp.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="bento-grid" style={{ perspective: "2000px" }}>
          {/* Card 1 - AI Skill Gap (Wide) */}
          <motion.div
            initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
            className="bento-wide"
          >
            <BentoCard hoverBorderColor="rgba(255,107,0,0.25)" className="flex flex-col md:flex-row w-full h-full" style={{ gap: "0px", alignItems: "stretch", padding: "0px", overflow: "hidden" }}>
              <div style={{ flex: 1.1, minWidth: "260px", padding: "40px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{
                    width:"46px", height:"46px", borderRadius:"12px",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    background:"rgba(255,107,0,0.06)", border:`1.5px solid ${OGLT}`,
                    marginBottom: "20px"
                  }}>
                    <Brain size={22} color={OG}/>
                  </div>
                  <h3 style={{ fontFamily:F, fontWeight:800, fontSize:"1.2rem", color:T1, marginBottom:"12px", letterSpacing: "-0.01em" }}>AI Phân Tích Skill Gap</h3>
                  <p style={{ fontFamily:F, fontSize:"0.875rem", color:T2, lineHeight:1.7, margin: 0 }}>
                    Chỉ cần nhập mục tiêu nghề nghiệp, AI của SkillSprint tự động bóc tách các kỹ năng cốt lõi và định vị chính xác khoảng trống kiến thức của bạn.
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "24px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 800, color: OG, letterSpacing: "0.05em" }}>PHÂN TÍCH TỰ ĐỘNG</span>
                  <Sparkles size={11} color={OG} />
                </div>
              </div>

              {/* High-Fidelity UI Widget */}
              <div className="border-t md:border-t-0 md:border-l border-slate-200" style={{ flex: 0.9, minWidth: "260px", background: "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)", display: "flex", alignItems: "flex-end", justifyContent: "flex-end", padding: "24px 0 0 24px", overflow: "hidden", position: "relative" }}>
                <div style={{
                  width: "108%",
                  background: CARD,
                  borderRadius: "12px 0 0 0",
                  borderTop: "1px solid #E2E8F0",
                  borderLeft: "1px solid #E2E8F0",
                  boxShadow: "-8px 8px 30px rgba(15,23,42,0.05)",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  transform: "translateY(2px)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${BDR}`, paddingBottom: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#EF4444" }}/>
                      <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#F59E0B" }}/>
                      <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10B981" }}/>
                      <span style={{ fontSize: "9.5px", fontWeight: 700, color: T3, marginLeft: "6px" }}>SkillGap_Engine.tsx</span>
                    </div>
                    <span style={{ fontSize: "8.5px", fontWeight: 800, color: "#10B981", background: "#ECFDF5", padding: "2px 8px", borderRadius: "99px" }}>ACTIVE</span>
                  </div>

                  <div style={{ background: "#F8FAFC", border: `1.5px solid ${OGLT}`, borderRadius: "8px", padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "10.5px", fontWeight: 700, color: T1 }}>Mục tiêu: React Developer</span>
                    <span style={{ fontSize: "8.5px", fontWeight: 800, color: OG, background: OGL, padding: "2.5px 6px", borderRadius: "4px", animation: "pulseGlow 2s infinite" }}>Analyzing...</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {[
                      { name: "React Server Components", progress: 90, color: "#10B981", label: "Đã học" },
                      { name: "State Management (Redux)", progress: 45, color: OG, label: "Lỗ hổng" }
                    ].map((item, i) => (
                      <div key={i} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10.5px" }}>
                          <span style={{ fontWeight: 700, color: T1 }}>{item.name}</span>
                          <span style={{ fontWeight: 800, color: item.color, fontSize: "9px" }}>{item.label} ({item.progress}%)</span>
                        </div>
                        <div style={{ width: "100%", height: "5px", background: "#E2E8F0", borderRadius: "99px", overflow: "hidden" }}>
                          <div style={{ width: `${item.progress}%`, height: "100%", background: item.color, borderRadius: "99px" }}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </BentoCard>
          </motion.div>

          {/* Card 2 - Adaptivity Timeline (Normal) */}
          <motion.div
            initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          >
            <BentoCard hoverBorderColor="rgba(124,58,237,0.25)" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", padding: "0px", overflow: "hidden" }}>
              <div style={{ padding: "32px 32px 20px" }}>
                <div style={{
                  width:"46px", height:"46px", borderRadius:"12px",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  background:"rgba(124,58,237,0.06)", border:`1.5px solid #F3E8FF`,
                  marginBottom: "20px"
                }}>
                  <Map size={22} color="#7C3AED"/>
                </div>
                <h3 style={{ fontFamily:F, fontWeight:800, fontSize:"1.2rem", color:T1, marginBottom:"12px", letterSpacing: "-0.01em" }}>Lộ Trình Thích Ứng</h3>
                <p style={{ fontFamily:F, fontSize:"0.875rem", color:T2, lineHeight:1.65, margin: 0 }}>
                  AI tự động điều chỉnh tốc độ học và các bài ôn tập theo tiến độ làm bài quiz thực tế của bạn trước thềm deadline.
                </p>
              </div>

              {/* Adaptivity Timeline Mockup */}
              <div style={{ background: "linear-gradient(135deg, #FDFDFD 0%, #F8FAFC 100%)", borderTop: `1px solid ${BDR}`, padding: "20px 24px", display: "flex", flexDirection: "column", gap: "10px", position: "relative" }}>
                <div style={{ position: "absolute", left: "34px", top: "28px", bottom: "28px", width: "2px", background: "#E2E8F0", zIndex: 0 }}/>
                {[
                  { title: "Cơ bản React JS", time: "Hoàn thành", color: "#10B981", active: false, badge: "Done" },
                  { title: "State Management", time: "Đang thích ứng", color: OG, active: true, badge: "Shift ⚡" },
                  { title: "Tối ưu hiệu năng", time: "Chờ mở khóa", color: T3, active: false, badge: "Lock 🔒" }
                ].map((step, sIdx) => (
                  <div key={sIdx} style={{ display: "flex", alignItems: "center", gap: "12px", zIndex: 1, position: "relative" }}>
                    <div style={{
                      width: "22px", height: "22px", borderRadius: "50%",
                      background: step.active ? OGL : "#FFFFFF",
                      border: `2px solid ${step.color}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: step.active ? `0 0 8px ${OG}25` : "none",
                      flexShrink: 0
                    }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: step.color }}/>
                    </div>
                    <div style={{ flex: 1, background: step.active ? "#FFFFFF" : "transparent", border: step.active ? `1.5px solid ${OGLT}` : "1px solid transparent", borderRadius: "8px", padding: step.active ? "8px 12px" : "4px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: "11px", fontWeight: step.active ? 800 : 600, color: step.active ? T1 : T2 }}>{step.title}</div>
                        <div style={{ fontSize: "9px", color: T3, marginTop: "2px" }}>{step.time}</div>
                      </div>
                      <span style={{ fontSize: "8.5px", fontWeight: 800, color: step.color, background: step.active ? OGL : "transparent", padding: "2px 6px", borderRadius: "4px" }}>{step.badge}</span>
                    </div>
                  </div>
                ))}
              </div>
            </BentoCard>
          </motion.div>

          {/* Card 3 - Workspace Stack (Normal) */}
          <motion.div
            initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          >
            <BentoCard hoverBorderColor="rgba(14,165,233,0.25)" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", padding: "0px", overflow: "hidden" }}>
              <div style={{ padding: "32px 32px 20px" }}>
                <div style={{
                  width:"46px", height:"46px", borderRadius:"12px",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  background:"rgba(14,165,233,0.06)", border:`1.5px solid #E0F2FE`,
                  marginBottom: "20px"
                }}>
                  <FolderKanban size={22} color="#0EA5E9"/>
                </div>
                <h3 style={{ fontFamily:F, fontWeight:800, fontSize:"1.2rem", color:T1, marginBottom:"12px", letterSpacing: "-0.01em" }}>Không Gian Học Tập</h3>
                <p style={{ fontFamily:F, fontSize:"0.875rem", color:T2, lineHeight:1.65, margin: 0 }}>
                  Quản lý khoa học toàn bộ tài liệu, bài tập và ghi chú khóa học của bạn trong các không gian làm việc chuyên nghiệp.
                </p>
              </div>

              {/* Workspace Sidebar Mockup */}
              <div style={{ background: "linear-gradient(135deg, #FDFDFD 0%, #F8FAFC 100%)", borderTop: `1px solid ${BDR}`, padding: "20px 24px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  { name: "💻 CS 101: Web Dev", active: true, desc: "Syllabus & 4 Assignments", color: OG },
                  { name: "🎨 UI/UX Design System", active: false, desc: "Figma files & Guidelines", color: "#7C3AED" },
                  { name: "📊 Cấu trúc dữ liệu", active: false, desc: "LeetCode solutions", color: "#0EA5E9" }
                ].map((ws, i) => (
                  <div key={i} style={{
                    display: "flex", flexDirection: "column", padding: "10px 12px",
                    background: ws.active ? CARD : "transparent",
                    border: ws.active ? `1.5px solid ${OG}` : `1px solid ${BDR}`,
                    borderRadius: "10px",
                    boxShadow: ws.active ? "0 4px 15px rgba(255,107,0,0.06)" : "none",
                    cursor: "pointer"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "11px", fontWeight: ws.active ? 800 : 600, color: ws.active ? T1 : T2 }}>{ws.name}</span>
                      <ChevronRight size={12} color={ws.active ? OG : T3} />
                    </div>
                    {ws.active && <span style={{ fontSize: "9px", color: T3, marginTop: "4px" }}>{ws.desc}</span>}
                  </div>
                ))}
              </div>
            </BentoCard>
          </motion.div>

          {/* Card 4 - Profile Optimization (Wide) */}
          <motion.div
            initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
            className="bento-wide"
          >
            <BentoCard hoverBorderColor="rgba(5,150,105,0.25)" className="flex flex-col md:flex-row w-full h-full" style={{ gap: "0px", alignItems: "stretch", padding: "0px", overflow: "hidden" }}>
              <div style={{ flex: 1.1, minWidth: "260px", padding: "40px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{
                    width:"46px", height:"46px", borderRadius:"12px",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    background:"rgba(5,150,105,0.06)", border:`1.5px solid #D1FAE5`,
                    marginBottom: "20px"
                  }}>
                    <FileText size={22} color="#059669"/>
                  </div>
                  <h3 style={{ fontFamily:F, fontWeight:800, fontSize:"1.2rem", color:T1, marginBottom:"12px", letterSpacing: "-0.01em" }}>Tối Ưu Hồ Sơ Học Tập</h3>
                  <p style={{ fontFamily:F, fontSize:"0.875rem", color:T2, lineHeight:1.7, margin: 0 }}>
                    Hệ thống AI tự động dịch thuật và tối ưu hóa các dự án thực hành trong khóa học thành các luận điểm giá trị cao nổi bật trong mắt nhà tuyển dụng.
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "24px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 800, color: "#059669", letterSpacing: "0.05em" }}>TĂNG 3x TỶ LỆ GỌI PHỎNG VẤN</span>
                  <CheckCircle size={11} color="#059669" />
                </div>
              </div>

              {/* Diff Editor UI Widget */}
              <div className="border-t md:border-t-0 md:border-l border-slate-200" style={{ flex: 0.9, minWidth: "260px", background: "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", overflow: "hidden" }}>
                <div style={{
                  width: "100%",
                  background: CARD,
                  borderRadius: "12px",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px"
                }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "9px", fontWeight: 800, color: "#EF4444", marginBottom: "4px" }}>
                      <span>❌ TRƯỚC KHI TỐI ƯU</span>
                    </div>
                    <div style={{ fontSize: "10.5px", padding: "8px 12px", background: "#FEF2F2", borderRadius: "8px", color: T2, border: "1px solid #FEE2E2", lineHeight: 1.45 }}>
                      "Em đã làm một vài dự án bằng React."
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "center", margin: "-4px 0" }}>
                    <div style={{ width: "2px", height: "16px", background: "linear-gradient(180deg, #EF4444, #10B981)" }}/>
                  </div>

                  <div style={{ boxShadow: "0 4px 15px rgba(16,185,129,0.04)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "9px", fontWeight: 800, color: "#10B981", marginBottom: "4px" }}>
                      <span>✓ SAU KHI AI TỐI ƯU HÓA</span>
                    </div>
                    <div style={{
                      fontSize: "10.5px", padding: "10px 12px", background: "#ECFDF5", borderRadius: "8px",
                      color: T1, fontWeight: 700, border: "1.5px solid #A7F3D0", lineHeight: 1.45
                    }}>
                      "Thiết kế 3 ứng dụng Single Page React tối ưu hiệu năng đạt điểm Lighthouse 95+."
                    </div>
                  </div>
                </div>
              </div>
            </BentoCard>
          </motion.div>

          {/* Card 5 - Goal Readiness Ring (Normal) */}
          <motion.div
            initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          >
            <BentoCard hoverBorderColor="rgba(245,158,11,0.25)" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", padding: "0px", overflow: "hidden" }}>
              <div style={{ padding: "32px 32px 20px" }}>
                <div style={{
                  width:"46px", height:"46px", borderRadius:"12px",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  background:"rgba(245,158,11,0.06)", border:`1.5px solid #FEF3C7`,
                  marginBottom: "20px"
                }}>
                  <TrendingUp size={22} color="#F59E0B"/>
                </div>
                <h3 style={{ fontFamily:F, fontWeight:800, fontSize:"1.2rem", color:T1, marginBottom:"12px", letterSpacing: "-0.01em" }}>Điểm Sẵn Sàng</h3>
                <p style={{ fontFamily:F, fontSize:"0.875rem", color:T2, lineHeight:1.65, margin: 0 }}>
                  Chỉ số tổng hợp theo thời gian thực giúp bạn biết độ sẵn sàng phỏng vấn trước các cơ hội thực tập lớn.
                </p>
              </div>

              {/* Speedometer circular gauge and company badges */}
              <div style={{ background: "linear-gradient(135deg, #FDFDFD 0%, #F8FAFC 100%)", borderTop: `1px solid ${BDR}`, padding: "20px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{
                    position: "relative", width: "64px", height: "64px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    filter: "drop-shadow(0 4px 12px rgba(16,185,129,0.15))"
                  }}>
                    <svg width="64" height="64" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="16" fill="none" stroke="#E2E8F0" strokeWidth="3"/>
                      <circle cx="18" cy="18" r="16" fill="none" stroke="#10B981" strokeWidth="3" strokeDasharray="100" strokeDashoffset="12" strokeLinecap="round"/>
                    </svg>
                    <span style={{ position: "absolute", fontSize: "13px", fontWeight: 900, color: "#10B981" }}>88%</span>
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10B981", animation: "pulseGlow 2s infinite" }}/>
                      <span style={{ fontSize: "11px", fontWeight: 800, color: T1 }}>Sẵn Sàng Thực Tập</span>
                    </div>
                    <span style={{ fontSize: "9px", color: T3, marginTop: "2px", display: "block" }}>Đã đạt yêu cầu doanh nghiệp</span>
                  </div>
                </div>

                <div style={{ width: "100%", display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center" }}>
                  {[
                    { name: "VNG Corp", score: "92%" },
                    { name: "FPT Software", score: "88%" },
                    { name: "Shopee", score: "76%" }
                  ].map((comp, idx) => (
                    <span key={idx} style={{ fontSize: "9.5px", fontWeight: 700, padding: "4px 8px", background: CARD, border: `1px solid ${BDR}`, borderRadius: "6px", color: T2 }}>
                      🏢 {comp.name}: <span style={{ color: "#10B981" }}>{comp.score}</span>
                    </span>
                  ))}
                </div>
              </div>
            </BentoCard>
          </motion.div>

          {/* Card 6 - Leaderboard / Team (Wide) */}
          <motion.div
            initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
            className="bento-wide"
          >
            <BentoCard hoverBorderColor="rgba(236,72,153,0.25)" className="flex flex-col md:flex-row w-full h-full" style={{ gap: "0px", alignItems: "stretch", padding: "0px", overflow: "hidden" }}>
              <div style={{ flex: 1.1, minWidth: "260px", padding: "40px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{
                    width:"46px", height:"46px", borderRadius:"12px",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    background:"rgba(236,72,153,0.06)", border:`1.5px solid #FCE7F3`,
                    marginBottom: "20px"
                  }}>
                    <Users size={22} color="#EC4899"/>
                  </div>
                  <h3 style={{ fontFamily:F, fontWeight:800, fontSize:"1.2rem", color:T1, marginBottom:"12px", letterSpacing: "-0.01em" }}>Học Theo Nhóm Hiệu Quả</h3>
                  <p style={{ fontFamily:F, fontSize:"0.875rem", color:T2, lineHeight:1.7, margin: 0 }}>
                    Lập nhóm học tập cùng bạn bè, thi đua điểm tích lũy XP hàng tuần và leo bảng xếp hạng năng lực học tập thực tế.
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "24px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 800, color: "#EC4899", letterSpacing: "0.05em" }}>LIVE LEADERBOARD HÀNG TUẦN</span>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#FDF2F8", padding: "2px 8px", borderRadius: "99px" }}>
                    <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#EC4899", animation: "pulseGlow 1.5s infinite" }}/>
                    <span style={{ fontSize: "8.5px", color: "#EC4899", fontWeight: 800 }}>12 ACTIVE</span>
                  </div>
                </div>
              </div>

              {/* Multiplayer Leaderboard UI Widget with Floating Cursors */}
              <div className="border-t md:border-t-0 md:border-l border-slate-200" style={{ flex: 0.9, minWidth: "260px", background: "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", overflow: "hidden", position: "relative" }}>
                
                {/* Simulated multiplayer pointer cursors */}
                <div style={{ position: "absolute", left: "15%", top: "60%", zIndex: 10, display: "flex", flexDirection: "column", gap: "2px", pointerEvents: "none", transform: "translateZ(30px)" }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M0 0V9.5L2.8 7.5L5.5 12L7 11.2L4.5 6.8L8.5 6.2L0 0Z" fill={OG}/>
                  </svg>
                  <span style={{ fontSize: "8px", fontWeight: 800, color: "#FFFFFF", background: OG, padding: "1px 4px", borderRadius: "3px", whiteSpace: "nowrap", boxShadow: "0 2px 5px rgba(0,0,0,0.1)" }}>Minh Khoa</span>
                </div>

                <div style={{ position: "absolute", right: "20%", top: "25%", zIndex: 10, display: "flex", flexDirection: "column", gap: "2px", pointerEvents: "none", transform: "translateZ(35px)" }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M0 0V9.5L2.8 7.5L5.5 12L7 11.2L4.5 6.8L8.5 6.2L0 0Z" fill="#7C3AED"/>
                  </svg>
                  <span style={{ fontSize: "8px", fontWeight: 800, color: "#FFFFFF", background: "#7C3AED", padding: "1px 4px", borderRadius: "3px", whiteSpace: "nowrap", boxShadow: "0 2px 5px rgba(0,0,0,0.1)" }}>Anh Tuấn</span>
                </div>

                <div style={{
                  width: "100%",
                  background: CARD,
                  borderRadius: "12px",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${BDR}`, paddingBottom: "8px" }}>
                    <span style={{ fontSize: "9px", fontWeight: 800, color: T3, fontFamily: F, letterSpacing: "0.05em" }}>BẢNG XẾP HẠNG</span>
                    <span style={{ fontSize: "8px", color: "#10B981", fontWeight: 800, display: "flex", alignItems: "center", gap: "3px" }}>
                      <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#10B981" }}/>
                      LIVE
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {[
                      { r: "🥇", name: "Minh Khoa", xp: "1,450 XP", active: true, color: OGL },
                      { r: "🥈", name: "Anh Tuấn", xp: "1,220 XP", active: true, color: "transparent" },
                      { r: "🥉", name: "Thanh Hằng", xp: "1,180 XP", active: false, color: "transparent" }
                    ].map((item, idx) => (
                      <div key={idx} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px",
                        background: item.color, padding: "6px 8px", borderRadius: "6px",
                        border: item.active && item.r === "🥇" ? `1px solid ${OGLT}` : "1px solid transparent"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "12px" }}>{item.r}</span>
                          <span style={{ fontWeight: item.r === "🥇" ? 800 : 600, color: T1 }}>{item.name}</span>
                          {item.active && <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#10B981" }}/>}
                        </div>
                        <span style={{ fontWeight: 800, color: OG }}>{item.xp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </BentoCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Stats ─── */
function Stats() {
  const items = [
    { val:"24/7", label:"Mentor AI luôn sẵn sàng đồng hành và giải đáp thắc mắc.", color:"#FF6B00" },
    { val:"100%", label:"Lộ trình được cá nhân hóa tự động theo đúng mục tiêu cốt lõi.", color:"#7C3AED" },
    { val:"3",    label:"Đánh giá đa chiều: Tư duy logic, Kỹ thuật và Kỹ năng mềm.", color:"#0EA5E9" },
    { val:"50+",  label:"Sinh viên IT tiên phong đang trải nghiệm sớm (Beta).", color:"#059669" },
  ];
  return (
    <section style={{ padding:"72px 16px", position:"relative", overflow:"hidden", background:"transparent" }}>
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", opacity:0.55, zIndex:0 }}>
        <LandingSection3DViewer variant="stats" />
      </div>
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(55% 40% at 50% 50%, rgba(255,255,255,0.15) 0%, rgba(249,250,251,0.05) 60%, transparent 100%)", pointerEvents:"none", zIndex:1 }} />
      <div className="max-w-6xl mx-auto">
        <div style={{
          background:CARD, borderRadius:"24px", padding:"56px 40px",
          boxShadow:SHL, border:`1px solid ${BDR}`,
          position:"relative", zIndex:2,
        }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:"40px" }}>
            {items.map((s,i) => (
              <motion.div key={i} initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true }} transition={{ delay:i*0.1 }}
                style={{ textAlign:"center" }}>
                <p style={{
                  fontFamily:F, fontWeight:900, fontSize:"3rem", letterSpacing:"-0.05em",
                  lineHeight:1, color:s.color, marginBottom:"8px",
                }}>{s.val}</p>
                <p style={{ fontFamily:F, fontSize:"0.85rem", color:T2, lineHeight:1.5 }}>{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── How it works ─── */
function HowItWorks() {
  const steps = [
    { n: "01", title: "Nhập mục tiêu & Dữ liệu", desc: "Thêm syllabus hoặc mục tiêu thực tập để AI xác định khoảng trống kỹ năng.", icon: Target, col: "#FF6B00", bgGlow: "rgba(255,107,0,0.04)" },
    { n: "02", title: "Bản đồ lộ trình AI", desc: "Học theo lộ trình cá nhân hóa tự động cập nhật theo tiến độ thực tế.", icon: Brain, col: "#7C3AED", bgGlow: "rgba(124,58,237,0.04)" },
    { n: "03", title: "Quiz Cốt Lõi", desc: "Củng cố kiến thức nhanh qua các quiz tương tác ngắn sau mỗi chương học.", icon: Zap, col: "#0EA5E9", bgGlow: "rgba(14,165,233,0.04)" },
    { n: "04", title: "Hồ Sơ Sẵn Sàng", desc: "Theo dõi tiến độ học tập theo sprint để sẵn sàng đón nhận cơ hội mới.", icon: Sparkles, col: "#059669", bgGlow: "rgba(5,150,105,0.04)" },
  ];

  return (
    <section style={{ background: "transparent", padding: "96px 16px", position: "relative", overflow: "hidden" }}>
      {/* Dot background */}
      <div className="premium-dot-grid" style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}/>

      {/* Decorative ambient glowing orbs */}
      <div style={{
        position: "absolute", top: "20%", left: "10%", width: "300px", height: "300px",
        background: "radial-gradient(circle, rgba(255,107,0,0.03) 0%, transparent 70%)",
        filter: "blur(50px)", pointerEvents: "none", zIndex: 0
      }}/>
      <div style={{
        position: "absolute", bottom: "10%", right: "10%", width: "300px", height: "300px",
        background: "radial-gradient(circle, rgba(124,58,237,0.03) 0%, transparent 70%)",
        filter: "blur(50px)", pointerEvents: "none", zIndex: 0
      }}/>

      <div style={{ position: "absolute", left: "-4%", top: "10%", width: "36%", height: "76%", pointerEvents: "none", opacity: 0.48, zIndex: 0 }}>
        <LandingSection3DViewer variant="flow" />
      </div>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(249,250,251,0.04) 0%, rgba(249,250,251,0.02) 22%, transparent 100%)", pointerEvents: "none", zIndex: 1 }} />

      <div className="max-w-5xl mx-auto" style={{ position: "relative", zIndex: 2 }}>
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} style={{ textAlign: "center", marginBottom: "56px" }}>
          <h2 style={{
            fontFamily: F, fontWeight: 900, fontSize: "clamp(1.7rem,3vw,2.5rem)", color: T1, letterSpacing: "-0.03em",
            lineHeight: 1.15
          }}>
            Từ khoảng trống kỹ năng đến <span style={{
              background: "linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>sẵn sàng bứt phá</span> trong 4 bước.
          </h2>
        </motion.div>

        {/* 3D Physical Cards Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "24px",
          perspective: "1000px"
        }}>
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                style={{
                  background: CARD,
                  borderRadius: "20px",
                  padding: "32px 24px",
                  boxShadow: SH,
                  border: `1px solid ${BDR}`,
                  position: "relative",
                  transformStyle: "preserve-3d",
                  transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  cursor: "default"
                }}
              >
                {/* Floating Glow Inside Card */}
                <div style={{
                  position: "absolute", inset: 0, borderRadius: "20px",
                  background: `radial-gradient(circle at 80% 20%, ${s.bgGlow} 0%, transparent 60%)`,
                  pointerEvents: "none"
                }}/>

                {/* Step Number with outline effect */}
                <div style={{
                  fontSize: "3.2rem", fontWeight: 900, fontFamily: F, lineHeight: 1, marginBottom: "16px",
                  color: "transparent",
                  WebkitTextStroke: `1.5px ${s.col}35`,
                  letterSpacing: "-0.04em",
                  transform: "translateZ(20px)",
                  transformStyle: "preserve-3d"
                }}>{s.n}</div>

                {/* Icon Container floating in 3D */}
                <div style={{
                  width: "40px", height: "40px", borderRadius: "10px",
                  background: `${s.col}08`, border: `1.5px solid ${s.col}20`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: "16px",
                  transform: "translateZ(30px)",
                  boxShadow: `0 4px 12px ${s.col}10`
                }}>
                  <Icon size={18} color={s.col}/>
                </div>

                <h3 style={{
                  fontFamily: F, fontWeight: 800, fontSize: "0.95rem", color: T1, marginBottom: "8px",
                  transform: "translateZ(15px)"
                }}>{s.title}</h3>

                <p style={{
                  fontFamily: F, fontSize: "0.85rem", color: T2, lineHeight: 1.6,
                  transform: "translateZ(10px)", margin: 0
                }}>{s.desc}</p>

                {i < steps.length - 1 && (
                  <div className="hidden lg:flex" style={{
                    position: "absolute", right: "-18px", top: "50%", transform: "translateY(-50%) translateZ(10px)",
                    zIndex: 10, width: "24px", height: "24px", borderRadius: "50%",
                    background: CARD, border: `1.5px solid ${BDR}`,
                    alignItems: "center", justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
                  }}>
                    <ChevronRight size={12} color={T3}/>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── Final CTA ─── */
function FinalCTA() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 120, mass: 0.5 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [12, -12]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-12, 12]), springConfig);
  
  // Spotlight position spring
  const glowX = useSpring(useTransform(x, [-0.5, 0.5], [-300, 300]), springConfig);
  const glowY = useSpring(useTransform(y, [-0.5, 0.5], [-180, 180]), springConfig);

  const handleMouseMoveWrapper = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;
    x.set(mouseX / width);
    y.set(mouseY / height);
  };

  const handleMouseLeaveWrapper = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <section style={{ padding: "120px 16px", position: "relative", overflow: "hidden" }}>
      {/* Background blurry ambient orb behind card */}
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: "700px", height: "400px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,107,0,0.06) 0%, rgba(124,58,237,0.02) 60%, transparent 100%)",
        filter: "blur(100px)", pointerEvents: "none", zIndex: 0
      }}/>

      <div className="max-w-3xl mx-auto" style={{ position: "relative", zIndex: 2, perspective: "2000px" }}>
        
        {/* Floating 3D Element Left - Glowing target orb */}
        <motion.div
          style={{
            position: "absolute", left: "-70px", top: "15%",
            width: "60px", height: "60px", borderRadius: "20px",
            background: "linear-gradient(135deg, #FF6B00 0%, #FFA366 100%)",
            boxShadow: "0 15px 35px rgba(255,107,0,0.3), inset 0 1px 0 rgba(255,255,255,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transformStyle: "preserve-3d",
            zIndex: 3,
            cursor: "pointer"
          }}
          animate={{ 
            y: [0, -18, 0], 
            rotateX: [12, -12, 12], 
            rotateY: [12, -12, 12],
            rotateZ: [0, 360] 
          }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
          whileHover={{ scale: 1.18, rotate: 180 }}
        >
          <Zap size={26} color="#FFFFFF" fill="#FFFFFF" style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.15))" }}/>
        </motion.div>

        {/* Floating 3D Element Right - Glowing spark container */}
        <motion.div
          style={{
            position: "absolute", right: "-70px", bottom: "15%",
            width: "60px", height: "60px", borderRadius: "20px",
            background: "linear-gradient(135deg, #7C3AED 0%, #C084FC 100%)",
            boxShadow: "0 15px 35px rgba(124,58,237,0.3), inset 0 1px 0 rgba(255,255,255,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transformStyle: "preserve-3d",
            zIndex: 3,
            cursor: "pointer"
          }}
          animate={{ 
            y: [0, 18, 0], 
            rotateX: [-12, 12, -12], 
            rotateY: [-12, 12, -12],
            rotateZ: [360, 0] 
          }}
          transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
          whileHover={{ scale: 1.18, rotate: -180 }}
        >
          <Sparkles size={26} color="#FFFFFF" fill="#FFFFFF" style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.15))" }}/>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 36 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          style={{ rotateX, rotateY, transformStyle: "preserve-3d", position: "relative" }}
        >
          {/* Active sweeping outline wrapper (Futuristic Glowing Border) */}
          <motion.div
            style={{
              position: "absolute",
              inset: "-1.5px",
              borderRadius: "29px",
              background: "linear-gradient(90deg, #FF6B00, #C084FC, #FFA366, #FF6B00)",
              backgroundSize: "200% 200%",
              zIndex: 0,
              pointerEvents: "none",
              opacity: 0.8
            }}
            animate={{ backgroundPosition: ["0% 50%", "200% 50%"] }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          />

          <div
            onMouseMove={handleMouseMoveWrapper}
            onMouseLeave={handleMouseLeaveWrapper}
            style={{
              background: "#FFFFFF",
              borderRadius: "28px",
              padding: "58px 44px",
              border: "1.5px solid rgba(255, 107, 0, 0.08)",
              boxShadow: "0 40px 90px rgba(255, 107, 0, 0.15), 0 12px 30px rgba(255, 107, 0, 0.06), inset 0 1px 1px rgba(255, 255, 255, 0.9)",
              position: "relative",
              overflow: "hidden",
              transformStyle: "preserve-3d",
              cursor: "default",
              zIndex: 1
            }}
          >
            {/* Cybernetic HUD Corner Brackets */}
            <div style={{ position: "absolute", top: "14px", left: "14px", width: "16px", height: "16px", borderLeft: "2.5px solid rgba(255,107,0,0.5)", borderTop: "2.5px solid rgba(255,107,0,0.5)", pointerEvents: "none", zIndex: 2, transform: "translateZ(20px)" }}/>
            <div style={{ position: "absolute", top: "14px", right: "14px", width: "16px", height: "16px", borderRight: "2.5px solid rgba(255,107,0,0.5)", borderTop: "2.5px solid rgba(255,107,0,0.5)", pointerEvents: "none", zIndex: 2, transform: "translateZ(20px)" }}/>
            <div style={{ position: "absolute", bottom: "14px", left: "14px", width: "16px", height: "16px", borderLeft: "2.5px solid rgba(255,107,0,0.5)", borderBottom: "2.5px solid rgba(255,107,0,0.5)", pointerEvents: "none", zIndex: 2, transform: "translateZ(20px)" }}/>
            <div style={{ position: "absolute", bottom: "14px", right: "14px", width: "16px", height: "16px", borderRight: "2.5px solid rgba(255,107,0,0.5)", borderBottom: "2.5px solid rgba(255,107,0,0.5)", pointerEvents: "none", zIndex: 2, transform: "translateZ(20px)" }}/>

            {/* Cybernetic Scanning Laser Line (HUD Scanner) */}
            <motion.div
              style={{
                position: "absolute", left: 0, right: 0, height: "3px",
                background: "linear-gradient(90deg, transparent, rgba(255, 107, 0, 0.4) 15%, #FF6B00 50%, rgba(255, 107, 0, 0.4) 85%, transparent)",
                boxShadow: "0 0 12px #FF6B00, 0 0 24px rgba(255, 107, 0, 0.5)",
                zIndex: 2,
                pointerEvents: "none"
              }}
              animate={{ top: ["-5%", "105%"] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            />



            {/* Magnetic Spotlight Mouse Glow */}
            <motion.div style={{
              position: "absolute",
              width: "450px",
              height: "450px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,107,0,0.18) 0%, rgba(255,107,0,0.03) 65%, transparent 100%)",
              x: glowX,
              y: glowY,
              left: "calc(50% - 225px)",
              top: "calc(50% - 225px)",
              pointerEvents: "none",
              zIndex: 0,
              filter: "blur(20px)"
            }}/>

            {/* 3D Infinite Perspective Scrolling Grid Background */}
            <div style={{
              position: "absolute",
              inset: 0,
              overflow: "hidden",
              pointerEvents: "none",
              zIndex: 0,
              opacity: 0.5,
              perspective: "900px"
            }}>
              <motion.div
                style={{
                  position: "absolute",
                  width: "200%",
                  height: "200%",
                  top: "-50%",
                  left: "-50%",
                  backgroundSize: "36px 36px",
                  backgroundImage: `
                    linear-gradient(to right, rgba(255, 107, 0, 0.08) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(255, 107, 0, 0.08) 1px, transparent 1px)
                  `,
                  transform: "rotateX(60deg) translateZ(-30px)",
                  transformOrigin: "center center"
                }}
                animate={{ backgroundPosition: ["0px 0px", "36px 36px"] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
              />
            </div>

            {/* Content Wrapper */}
            <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", transformStyle: "preserve-3d" }}>
              
              {/* Pill badge with 3D elevation & Blinking Tech Ticker */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "6px 14px", borderRadius: "99px", marginBottom: "26px",
                background: OGL, border: `1px solid ${OGLT}`,
                transform: "translateZ(45px)",
                boxShadow: "0 4px 12px rgba(255,107,0,0.06)"
              }}>
                <Zap size={12} fill={OG} color={OG}/>
                <span style={{ fontFamily: F, fontSize: "0.75rem", color: OG, fontWeight: 800, letterSpacing: "0.02em" }}>
                  BETA ACCESS
                </span>
                <span style={{ width: "1px", height: "10px", background: "rgba(255, 107, 0, 0.3)" }}/>
                <motion.span 
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{ fontFamily: "monospace", fontSize: "10px", color: "#7C3AED", fontWeight: 700 }}
                >
                  [ AI_ENGINE_v2.0 // ACTIVE ]
                </motion.span>
              </div>

              {/* Title with outlined text accent and high 3D pop */}
              <h2 style={{
                fontFamily: F, fontWeight: 900, fontSize: "clamp(1.9rem, 4.8vw, 2.9rem)",
                color: "#0F172A", letterSpacing: "-0.03em", lineHeight: 1.15,
                marginBottom: "16px", textAlign: "center",
                transform: "translateZ(75px)"
              }}>
                Sẵn sàng lấp đầy<br/>
                <span style={{
                  background: "linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent"
                }}>khoảng trống kỹ năng?</span>
              </h2>

              {/* Description floating in middle depth */}
              <p style={{
                fontFamily: F, fontSize: "0.98rem", color: "#475569", lineHeight: 1.6,
                marginBottom: "38px", maxWidth: "520px", textAlign: "center",
                transform: "translateZ(40px)"
              }}>
                Chỉ mất 5 phút để kết nối mục tiêu học tập và nhận ngay lộ trình cá nhân hóa tự động từ AI.
              </p>

              {/* Glassmorphic Visual Interactive Sprint Timeline Widget with sonar ripples */}
              <div style={{
                width: "100%", maxWidth: "490px", 
                background: "rgba(255, 255, 255, 0.78)",
                backdropFilter: "blur(16px)",
                border: `1.5px solid ${OGLT}`, 
                borderRadius: "16px", 
                padding: "18px 22px",
                marginBottom: "44px", 
                transform: "translateZ(60px)",
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                position: "relative", 
                gap: "8px", 
                overflow: "hidden",
                boxShadow: "0 15px 35px rgba(255, 107, 0, 0.05), inset 0 1px 2px rgba(255, 255, 255, 0.8)"
              }}>
                {/* Connecting timeline track */}
                <div style={{
                  position: "absolute", left: "15%", right: "15%", top: "29px", height: "2.5px",
                  background: `linear-gradient(to right, ${OG} 50%, #E2E8F0 50%)`, zIndex: 0
                }}/>

                {[
                  { label: "1. Chọn Mục Tiêu 🎯", active: true, color: OG, ping: true },
                  { label: "2. Nhận Lộ Trình AI ⚡", active: true, color: OG, ping: true },
                  { label: "3. Bắt Đầu Học Tập 🚀", active: false, color: "#94A3B8", ping: false }
                ].map((node, nIdx) => (
                  <div key={nIdx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", zIndex: 1, flex: 1 }}>
                    <div style={{
                      width: "22px", height: "22px", borderRadius: "50%",
                      background: "#FFFFFF",
                      border: `2px solid ${node.active ? node.color : "#CBD5E1"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: node.active ? `0 0 10px ${node.color}45` : "none",
                      transition: "all 0.3s ease",
                      position: "relative"
                    }}>
                      {/* Active radar sonar ripples */}
                      {node.ping && (
                        <>
                          <motion.div
                            style={{
                              position: "absolute", inset: -4, borderRadius: "50%",
                              border: `1.5px solid ${node.color}`, pointerEvents: "none"
                            }}
                            animate={{ scale: [1, 2.0], opacity: [0.7, 0] }}
                            transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                          />
                          <motion.div
                            style={{
                              position: "absolute", inset: -4, borderRadius: "50%",
                              border: `1.5px solid ${node.color}`, pointerEvents: "none"
                            }}
                            animate={{ scale: [1, 2.0], opacity: [0.7, 0] }}
                            transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut", delay: 0.8 }}
                          />
                        </>
                      )}

                      <div style={{
                        width: "8px", height: "8px", borderRadius: "50%",
                        background: node.active ? node.color : "#CBD5E1"
                      }}/>
                    </div>
                    <span style={{ fontSize: "9.5px", fontWeight: node.active ? 800 : 600, color: node.active ? "#1E293B" : "#94A3B8", fontFamily: F, whiteSpace: "nowrap" }}>
                      {node.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Shimmering CTA Button at highest depth */}
              <Link to="/login" style={{ textDecoration: "none", transform: "translateZ(90px)", display: "inline-block" }}>
                <motion.button
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "10px",
                    padding: "20px 50px", borderRadius: "14px", background: OG, color: "#fff",
                    fontFamily: F, fontWeight: 800, fontSize: "1.06rem", border: "none", cursor: "pointer",
                    boxShadow: `0 12px 32px rgba(255,107,0,0.35), 0 2px 4px rgba(255,107,0,0.15), inset 0 1px 0 rgba(255,255,255,0.25)`,
                    position: "relative", overflow: "hidden"
                  }}
                  whileHover={{ 
                    scale: 1.06, 
                    boxShadow: `0 18px 45px rgba(255,107,0,0.45), 0 4px 10px rgba(255,107,0,0.25)`
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Shimmer Sweep Animation bar */}
                  <motion.div
                    style={{
                      position: "absolute", top: 0, left: "-100%", width: "50%", height: "100%",
                      background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                      transform: "skewX(-25deg)"
                    }}
                    animate={{ left: ["-100%", "200%"] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                  />

                  <Zap size={18} fill="#fff" color="#fff"/>
                  Bắt đầu dùng thử

                  {/* Interactive animated arrow */}
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    style={{ display: "inline-flex", alignItems: "center" }}
                  >
                    <ArrowRight size={18}/>
                  </motion.span>
                </motion.button>
              </Link>

              {/* Trust signals at lower depth */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "26px", transform: "translateZ(30px)" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10B981", animation: "pulseGlow 1.5s infinite" }}/>
                <span style={{ fontSize: "10.5px", fontWeight: 600, color: "#64748B", fontFamily: F }}>
                  Không bắt buộc thẻ tín dụng · Hủy bất cứ lúc nào
                </span>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer style={{ borderTop:`1px solid ${BDR}`, padding:"40px 16px 24px" }}>
      <div className="max-w-6xl mx-auto"
        style={{ display:"flex", flexDirection:"row", alignItems:"center", justifyContent:"space-between", gap:"20px", flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <BrandLogo size={28} textColor={T1} textSize="0.95rem" align="left" />
        </div>
        <p style={{ fontFamily:F, fontSize:"0.8rem", color:T3 }}>© 2026 SkillSprint. Thiết kế cho thế hệ học tập chủ động.</p>
        <div style={{ display:"flex", gap:"16px" }}>
          {[Github,Twitter,Linkedin].map((Icon,i) => (
            <motion.a key={i} href="#" whileHover={{ scale:1.2 }} style={{ color:T3, transition:"color 0.2s" }}
              onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.color=T1;}}
              onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.color=T3;}}>
              <Icon size={16}/>
            </motion.a>
          ))}
        </div>
      </div>
    </footer>
  );
}

/* ─── Page ─── */
export default function Landing() {
  const globalCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = globalCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const colors = [
      "#3B82F6", // Blue
      "#7C3AED", // Purple
      "#EF4444", // Red/Coral
      "#F97316", // Orange
      "#10B981", // Teal
      "#EAB308", // Gold
      "#EC4899", // Pink
      "#06B6D4", // Cyan
    ];

    const particles: Array<{
      x: number; y: number;
      baseX: number; baseY: number;
      vx: number; vy: number;
      radius: number;
      color: string;
      angle: number;
      driftSpeed: number;
      driftRadius: number;
    }> = [];

    const numParticles = 700;

    const initParticles = () => {
      particles.length = 0;
      for (let i = 0; i < numParticles; i++) {
        const bx = Math.random() * width;
        const by = Math.random() * height;
        particles.push({
          x: bx, y: by, baseX: bx, baseY: by,
          vx: 0, vy: 0,
          radius: Math.random() * 1.2 + 0.6,
          color: colors[Math.floor(Math.random() * colors.length)],
          angle: Math.random() * Math.PI * 2,
          driftSpeed: (Math.random() * 0.007 + 0.003) * (Math.random() > 0.5 ? 1 : -1),
          driftRadius: Math.random() * 80 + 35,
        });
      }
    };

    initParticles();

    let mouse = { x: -9999, y: -9999, active: false };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true;
    };
    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.x = -9999; mouse.y = -9999;
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    };
    window.addEventListener("resize", handleResize);

    const MOUSE_ATTRACT_RADIUS = 600;
    const MOUSE_REPEL_RADIUS   = 100;
    const ATTRACT_STRENGTH     = 0.055;
    const REPEL_STRENGTH       = 0.13;
    const DAMPING              = 0.83;
    const RETURN_STRENGTH      = 0.026;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Detect footer top to exclude particle rendering in footer zone
      const footerEl = document.getElementById("public-footer");
      const footerTop = footerEl
        ? footerEl.getBoundingClientRect().top
        : height + 999;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Idle drift
        p.angle += p.driftSpeed;
        const driftX = p.baseX + Math.cos(p.angle) * p.driftRadius;
        const driftY = p.baseY + Math.sin(p.angle) * p.driftRadius;
        p.vx += (driftX - p.x) * RETURN_STRENGTH;
        p.vy += (driftY - p.y) * RETURN_STRENGTH;

        // Mouse interaction
        const mdx = mouse.x - p.x;
        const mdy = mouse.y - p.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < MOUSE_ATTRACT_RADIUS && mdist > 0) {
          const nx = mdx / mdist;
          const ny = mdy / mdist;
          if (mdist < MOUSE_REPEL_RADIUS) {
            const f = (MOUSE_REPEL_RADIUS - mdist) / MOUSE_REPEL_RADIUS * REPEL_STRENGTH;
            p.vx -= nx * f;
            p.vy -= ny * f;
          } else {
            const f = (1 - (mdist - MOUSE_REPEL_RADIUS) / (MOUSE_ATTRACT_RADIUS - MOUSE_REPEL_RADIUS)) * ATTRACT_STRENGTH;
            p.vx += nx * f;
            p.vy += ny * f;
          }
        }

        p.vx *= DAMPING; p.vy *= DAMPING;
        p.x += p.vx; p.y += p.vy;

        // Skip drawing particles inside footer area
        if (p.y >= footerTop) continue;

        // Alpha: ONLY visible near cursor — invisible elsewhere
        const dist = Math.sqrt((p.x - mouse.x) ** 2 + (p.y - mouse.y) ** 2);
        let alpha = 0;
        if (mouse.active && dist < MOUSE_ATTRACT_RADIUS) {
          const t = 1 - dist / MOUSE_ATTRACT_RADIUS;
          alpha = t * t * t * 0.95;
        }

        // Draw oriented dash — SMALLER
        const vLen = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const dashLen = Math.max(3, Math.min(14, vLen * 2.5 + 3));
        let dxd = 0, dyd = 0;
        if (vLen > 0.05) {
          dxd = (p.vx / vLen) * dashLen;
          dyd = (p.vy / vLen) * dashLen;
        } else {
          dxd = Math.cos(p.angle) * dashLen;
          dyd = Math.sin(p.angle) * dashLen;
        }

        ctx.beginPath();
        ctx.moveTo(p.x - dxd * 0.5, p.y - dyd * 0.5);
        ctx.lineTo(p.x + dxd * 0.5, p.y + dyd * 0.5);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.radius;
        ctx.globalAlpha = alpha;
        ctx.lineCap = "round";
        ctx.stroke();
      }

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
    };
  }, []);



  return (
    <div style={{ background:BG, minHeight:"100vh", fontFamily:F, position: "relative" }} className="premium-dot-grid">
      {/* Global Interactive Antigravity Canvas Background */}
      <canvas
        ref={globalCanvasRef}
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          pointerEvents: "none",
          zIndex: 0,
          opacity: 0.95
        }}
      />
      
      <style>{`
        ::-webkit-scrollbar{width:6px}
        ::-webkit-scrollbar-track{background:${BG}}
        ::-webkit-scrollbar-thumb{background:#D1D5DB;border-radius:99px}
        *{box-sizing:border-box}

        @keyframes spinGlow {
          0% { transform: rotate(0deg) translate(0px, 0px) scale(1); }
          50% { transform: rotate(180deg) translate(30px, 40px) scale(1.08); }
          100% { transform: rotate(360deg) translate(0px, 0px) scale(1); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        .premium-dot-grid {
          background-image: radial-gradient(rgba(15, 23, 42, 0.02) 1.2px, transparent 1.2px);
          background-size: 24px 24px;
        }
        .text-outline-gradient {
          color: transparent;
          -webkit-text-stroke: 1.5px rgba(255, 107, 0, 0.35);
          background: linear-gradient(135deg, rgba(255, 107, 0, 0.5) 0%, transparent 100%);
          -webkit-background-clip: text;
          background-clip: text;
        }

        .bento-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        @media (max-width: 1024px) {
          .bento-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 768px) {
          .bento-grid {
            grid-template-columns: 1fr;
          }
        }
        .bento-wide {
          grid-column: span 2;
        }
        @media (max-width: 768px) {
          .bento-wide {
            grid-column: span 1;
          }
        }
      `}</style>
      
      {/* Content wrapper with relative positioning so it renders on top of the fixed background canvas */}
      <div style={{ position: "relative", zIndex: 1, pointerEvents: "auto" }}>
        <PublicNavbar />
        <Hero/>
        <Features/>
        <Stats/>
        <HowItWorks/>
        <FinalCTA/>
        <PublicFooter />
      </div>
    </div>
  );
}

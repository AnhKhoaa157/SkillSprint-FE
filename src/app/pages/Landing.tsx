import { useState, useEffect } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight, Zap, Map, FileText, Mic, Star,
  CheckCircle, ChevronRight, Sparkles, Brain,
  TrendingUp, Shield, Users, Play, Github,
  Twitter, Linkedin, Target, Clock,
  Mail, Phone, MapPin, ExternalLink,
} from "lucide-react";
import { BrandLogo } from "../components/BrandLogo";
import { PublicNavbar } from "../components/PublicNavbar";

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
  return (
    <motion.div
      initial={{ opacity:0, y:32, scale:0.97 }}
      animate={{ opacity:1, y:0, scale:1 }}
      transition={{ duration:0.8, ease:[0.16,1,0.3,1], delay:0.3 }}
      className="relative mx-auto"
      style={{ maxWidth:"820px" }}
    >
      {/* Soft ambient shadow */}
      <div style={{
        position:"absolute", inset:0, borderRadius:"20px",
        background:"radial-gradient(ellipse 70% 50% at 50% 105%, rgba(255,107,0,0.18) 0%, transparent 65%)",
        filter:"blur(32px)", transform:"translateY(12px) scale(0.97)",
      }}/>
      {/* Browser window */}
      <div style={{
        background:CARD, borderRadius:"18px", overflow:"hidden",
        boxShadow:"0 20px 80px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
      }}>
        {/* Chrome bar */}
        <div style={{
          display:"flex", alignItems:"center", gap:"8px", padding:"12px 16px",
          borderBottom:`1px solid ${BDR}`, background:"#FAFAFA",
        }}>
          <div style={{ display:"flex", gap:"6px" }}>
            {["#FF5F57","#FFBD2E","#28C840"].map((c,i) => (
              <div key={i} style={{ width:"10px", height:"10px", borderRadius:"50%", background:c }}/>
            ))}
          </div>
          <div style={{ flex:1, display:"flex", justifyContent:"center" }}>
            <div style={{
              display:"flex", alignItems:"center", gap:"6px", padding:"4px 12px",
              borderRadius:"6px", background:"#F1F3F4", fontSize:"11px", color:T3, fontFamily:F,
            }}>skillsprint.app/dashboard</div>
          </div>
        </div>
        {/* Content */}
        <div style={{ display:"flex", height:"340px" }}>
          {/* Mini sidebar */}
          <div style={{
            width:"52px", display:"flex", flexDirection:"column", alignItems:"center",
            paddingTop:"16px", gap:"16px", borderRight:`1px solid ${BDR}`, background:"#FAFAFA",
          }}>
            <div style={{
              width:"28px", height:"28px", borderRadius:"8px",
              background:OG, display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <Zap size={13} color="#fff" fill="#fff"/>
            </div>
            {[Map,FileText,Mic,TrendingUp].map((Icon,i) => (
              <div key={i} style={{
                width:"32px", height:"32px", borderRadius:"8px",
                display:"flex", alignItems:"center", justifyContent:"center",
                background: i===0 ? OGL : "transparent",
                color: i===0 ? OG : T3,
              }}>
                <Icon size={15}/>
              </div>
            ))}
          </div>
          {/* Main area */}
          <div style={{ flex:1, padding:"20px", background:BG, overflow:"hidden" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"14px" }}>
              <div>
                <p style={{ fontWeight:700, fontSize:"0.85rem", color:T1, fontFamily:F }}>Bảng điều khiển tiến độ học tập</p>
                <p style={{ color:T3, fontSize:"0.65rem", fontFamily:F }}>Cập nhật 2 giờ trước</p>
              </div>
              <span style={{
                fontSize:"10px", padding:"2px 8px", borderRadius:"99px",
                background:OGL, color:OG, border:`1px solid ${OGLT}`,
                fontFamily:F, fontWeight:700,
              }}>ĐANG HỌC</span>
            </div>
            {/* Stats row */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px", marginBottom:"14px" }}>
              {[
                {l:"Độ khớp kỹ năng",v:"72%",c:"#FF6B00"},
                {l:"XP tích lũy",v:"1.2K",c:"#7C3AED"},
                {l:"Chuỗi ngày học",v:"12",c:"#059669"},
              ].map(s => (
                <div key={s.l} style={{
                  background:CARD, borderRadius:"10px", padding:"10px",
                  boxShadow:SH,
                }}>
                  <p style={{ fontWeight:800, fontSize:"1.1rem", color:s.c, fontFamily:F, lineHeight:1 }}>{s.v}</p>
                  <p style={{ color:T3, fontSize:"9px", fontFamily:F, marginTop:"2px" }}>{s.l}</p>
                </div>
              ))}
            </div>
            {/* Lower row */}
            <div style={{ display:"flex", gap:"14px", alignItems:"flex-start" }}>
              <div style={{ flex:1 }}>
                <p style={{ color:T3, fontSize:"9px", fontFamily:F, marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.1em" }}>Radar skill gap</p>
                <SkillRadar/>
              </div>
              <div style={{ width:"110px" }}>
                <p style={{ color:T3, fontSize:"9px", fontFamily:F, marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.1em" }}>Lộ trình AI</p>
                {["React Hooks","TypeScript","System Design"].map((item,i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"8px" }}>
                    <div style={{
                      width:"16px", height:"16px", borderRadius:"50%",
                      display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                      background: i===0 ? "#ECFDF5" : i===1 ? OGL : BG,
                      border: `1.5px solid ${i===0?"#6EE7B7":i===1?OGLT:BDR}`,
                    }}>
                      {i===0 && <CheckCircle size={9} color="#059669"/>}
                      {i===1 && <Zap size={8} color={OG}/>}
                    </div>
                    <span style={{ color:i===2?T3:T1, fontSize:"8px", fontFamily:F, fontWeight:i===1?600:400 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Navbar (use shared PublicNavbar component) ─── */
/* Removed inline Navbar function - now using PublicNavbar from components for consistency */

/* ─── Hero ─── */
function Hero() {
  return (
    <section style={{ background:BG, paddingTop:"140px", paddingBottom:"80px", textAlign:"center", position:"relative", overflow:"hidden" }}>
      {/* Subtle radial tint */}
      <div style={{
        position:"absolute", top:"-10%", left:"50%", transform:"translateX(-50%)",
        width:"700px", height:"500px",
        background:"radial-gradient(ellipse, rgba(255,107,0,0.07) 0%, transparent 65%)",
        pointerEvents:"none",
      }}/>

      <div className="max-w-4xl mx-auto px-4" style={{ position:"relative" }}>
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
          <Link to="/auth" style={{ textDecoration:"none" }}>
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
            <strong style={{ color:T1 }}>2,400+</strong> sinh viên từ FPT, VNU, HUST, RMIT
          </span>
          <div style={{ display:"flex", gap:"2px" }}>
            {[1,2,3,4,5].map(i => <Star key={i} size={14} fill={OG} color={OG}/>)}
            <span style={{ color:T2, fontSize:"0.82rem", fontFamily:F, marginLeft:"4px" }}>4.9/5</span>
          </div>
        </motion.div>

        {/* Mockup */}
        <DashboardMockup/>
      </div>
    </section>
  );
}

/* ─── Features ─── */
const FEATURES = [
  { icon:Brain,     title:"AI Phân Tích Skill Gap",       desc:"Nhập mục tiêu môn học hoặc nghề nghiệp, AI chỉ ra khoảng trống kỹ năng và gợi ý lộ trình cá nhân.", tag:"Cốt lõi",      color:"#FF6B00" },
  { icon:Map,       title:"Lộ Trình Học Thích Ứng",       desc:"Lộ trình thay đổi theo tiến độ thực tế, giúp bạn học đúng trọng tâm trước deadline.",                tag:"Lộ trình",      color:"#7C3AED" },
  { icon:Mic,       title:"Luyện Phỏng Vấn Với AI",       desc:"Mô phỏng phỏng vấn và nhận góp ý tức thì về tư duy, cách trình bày và chiều sâu kỹ thuật.",           tag:"Phỏng vấn",    color:"#0EA5E9" },
  { icon:FileText,  title:"Tối Ưu Hồ Sơ Học Tập",         desc:"AI giúp viết lại điểm mạnh và thành quả học tập để hồ sơ rõ ràng, thuyết phục hơn.",                   tag:"Hồ sơ",        color:"#059669" },
  { icon:TrendingUp,title:"Điểm Sẵn Sàng Mục Tiêu",       desc:"Theo dõi mức độ sẵn sàng theo từng sprint để biết cần cải thiện gì ngay.",                                tag:"Phân tích",     color:"#F59E0B" },
  { icon:Users,     title:"Học Theo Nhóm Hiệu Quả",      desc:"Lập nhóm học, theo dõi tiến độ bạn bè và tạo động lực qua bảng xếp hạng.",                               tag:"Cộng đồng",     color:"#EC4899" },
];

function Features() {
  return (
    <section style={{ background:BG, padding:"96px 16px" }}>
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          style={{ textAlign:"center", marginBottom:"56px" }}>
          <div style={{
            display:"inline-flex", alignItems:"center", gap:"6px",
            padding:"5px 14px", borderRadius:"99px", marginBottom:"16px",
            background:OGL, border:`1px solid ${OGLT}`,
          }}>
            <Sparkles size={12} color={OG}/>
            <span style={{ fontFamily:F, fontSize:"0.78rem", color:OG, fontWeight:700 }}>Đầy đủ công cụ cần thiết</span>
          </div>
          <h2 style={{ fontFamily:F, fontWeight:900, fontSize:"clamp(1.8rem,3.5vw,2.8rem)", color:T1, letterSpacing:"-0.03em", lineHeight:1.1, margin:"0 auto 14px" }}>
            Lợi thế học tập của bạn<br/>
            <span style={{ color:OG }}>bắt đầu từ đây.</span>
          </h2>
          <p style={{ fontFamily:F, color:T2, fontSize:"1rem", lineHeight:1.7, maxWidth:"480px", margin:"0 auto" }}>
            Sáu công cụ AI liên kết chặt chẽ để giúp bạn học nhanh hơn và đi đúng hướng.
          </p>
        </motion.div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:"18px" }}>
          {FEATURES.map((f,i) => (
            <motion.div key={f.title}
              initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true }} transition={{ delay:i*0.07 }}
              style={{
                background:CARD, borderRadius:"16px", padding:"28px",
                boxShadow:SH, cursor:"default", transition:"all 0.25s ease",
              }}
              onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow=SHL;(e.currentTarget as HTMLDivElement).style.transform="translateY(-3px)";}}
              onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow=SH;(e.currentTarget as HTMLDivElement).style.transform="translateY(0)";}}>
              <div style={{
                display:"inline-flex", alignItems:"center", gap:"5px",
                padding:"3px 10px", borderRadius:"6px", marginBottom:"16px",
                background:`${f.color}10`, border:`1px solid ${f.color}20`,
              }}>
                <span style={{ fontSize:"10px", color:f.color, fontWeight:700, fontFamily:F }}>{f.tag}</span>
              </div>
              <div style={{
                width:"42px", height:"42px", borderRadius:"12px", marginBottom:"16px",
                display:"flex", alignItems:"center", justifyContent:"center",
                background:`${f.color}10`, border:`1px solid ${f.color}18`,
              }}>
                <f.icon size={20} color={f.color}/>
              </div>
              <h3 style={{ fontFamily:F, fontWeight:700, fontSize:"1.02rem", color:T1, marginBottom:"8px" }}>{f.title}</h3>
              <p style={{ fontFamily:F, fontSize:"0.875rem", color:T2, lineHeight:1.7 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Stats ─── */
function Stats() {
  const items = [
    { val:"72%",  label:"Trung bình skill gap được phát hiện ở lần quét đầu",         color:"#FF6B00" },
    { val:"3.4×", label:"Tăng tần suất phản hồi sau luyện phỏng vấn với AI",           color:"#7C3AED" },
    { val:"89%",  label:"Tỉ lệ hồ sơ vượt vòng lọc sau khi tối ưu",                     color:"#0EA5E9" },
    { val:"12d",  label:"Chuỗi ngày học liên tục trung bình của người dùng",            color:"#059669" },
  ];
  return (
    <section style={{ padding:"72px 16px" }}>
      <div className="max-w-6xl mx-auto">
        <div style={{
          background:CARD, borderRadius:"24px", padding:"56px 40px",
          boxShadow:SHL, border:`1px solid ${BDR}`,
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
    { n:"01", title:"Nhập mục tiêu và dữ liệu học", desc:"Thêm syllabus, mục tiêu điểm số hoặc vị trí thực tập để AI phân tích khoảng trống kỹ năng." },
    { n:"02", title:"Đi theo lộ trình AI cá nhân",   desc:"Lộ trình học được cá nhân hóa theo thời gian còn lại và tiến độ thực tế của bạn." },
    { n:"03", title:"Luyện quiz và phỏng vấn nhỏ",   desc:"Ôn tập ngay sau mỗi chương bằng quiz ngắn để ghi nhớ lâu và tự tin hơn." },
    { n:"04", title:"Tổng hợp thành quả rõ ràng",    desc:"Theo dõi kết quả theo sprint và cập nhật hồ sơ học tập để sẵn sàng cho cơ hội mới." },
  ];
  return (
    <section style={{ background:BG, padding:"96px 16px" }}>
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }}
          viewport={{ once:true }} style={{ textAlign:"center", marginBottom:"56px" }}>
          <h2 style={{ fontFamily:F, fontWeight:900, fontSize:"clamp(1.7rem,3vw,2.5rem)", color:T1, letterSpacing:"-0.03em" }}>
            Từ khoảng trống kỹ năng đến <span style={{ color:OG }}>sẵn sàng bứt phá</span> trong 4 bước.
          </h2>
        </motion.div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:"16px" }}>
          {steps.map((s,i) => (
            <motion.div key={i} initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true }} transition={{ delay:i*0.1 }}
              style={{ background:CARD, borderRadius:"16px", padding:"28px 24px", boxShadow:SH, position:"relative" }}>
              <div style={{
                fontSize:"2.5rem", fontWeight:900, fontFamily:F, lineHeight:1, marginBottom:"14px",
                color:`${OG}18`, letterSpacing:"-0.04em",
              }}>{s.n}</div>
              <h3 style={{ fontFamily:F, fontWeight:700, fontSize:"0.95rem", color:T1, marginBottom:"8px" }}>{s.title}</h3>
              <p style={{ fontFamily:F, fontSize:"0.85rem", color:T2, lineHeight:1.65 }}>{s.desc}</p>
              {i < steps.length-1 && (
                <div className="hidden lg:flex" style={{
                  position:"absolute", right:"-17px", top:"50%", transform:"translateY(-50%)",
                  zIndex:10, width:"18px", height:"18px", borderRadius:"50%",
                  background:CARD, border:`1.5px solid ${BDR}`,
                  alignItems:"center", justifyContent:"center",
                }}>
                  <ChevronRight size={10} color={T3}/>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Pricing ─── */
function Pricing() {
  const plans = [
    {
      name: "Free",
      price: "0đ",
      note: "Luôn miễn phí",
      badge: "Starter",
      highlight: false,
      features: [
        "2 roadmap đang hoạt động",
        "Phân tích skill gap cơ bản",
        "Pomodoro và checklist học",
      ],
    },
    {
      name: "Basic",
      price: "89.000đ",
      note: "/ tháng",
      badge: "Phổ biến",
      highlight: true,
      features: [
        "Roadmap không giới hạn",
        "Quiz AI theo syllabus",
        "Theo dõi tiến độ theo sprint",
        "Nhắc lịch học thông minh",
      ],
    },
    {
      name: "Premium",
      price: "199.000đ",
      note: "/ tháng",
      badge: "Career Track",
      highlight: false,
      features: [
        "Mô phỏng phỏng vấn kỹ thuật",
        "Xuất evidence portfolio",
        "Coach AI nâng cao",
        "Ưu tiên hỗ trợ 1-1",
      ],
    },
  ];

  return (
    <section id="pricing" style={{ background: BG, padding: "90px 16px" }}>
      <div className="max-w-6xl mx-auto">
        <div style={{ textAlign: "center", marginBottom: "44px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "5px 14px", borderRadius: "99px", marginBottom: "14px",
            background: OGL, border: `1px solid ${OGLT}`,
          }}>
            <Target size={12} color={OG} />
            <span style={{ fontFamily: F, fontSize: "0.78rem", color: OG, fontWeight: 700 }}>Bảng giá minh bạch</span>
          </div>
          <h2 style={{ fontFamily: F, fontWeight: 900, fontSize: "clamp(1.7rem,3.2vw,2.6rem)", color: T1, letterSpacing: "-0.03em", marginBottom: "10px" }}>
            Chọn gói phù hợp với nhịp học của bạn
          </h2>
          <p style={{ fontFamily: F, color: T2, fontSize: "0.98rem" }}>
            Nâng cấp bất kỳ lúc nào. Hủy tự động gia hạn trong một chạm.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: "16px" }}>
          {plans.map((plan) => (
            <div key={plan.name} style={{
              background: CARD,
              borderRadius: "18px",
              padding: "24px",
              border: plan.highlight ? `1.5px solid ${OG}` : `1px solid ${BDR}`,
              boxShadow: plan.highlight ? "0 10px 34px rgba(255,107,0,0.16)" : SH,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <h3 style={{ fontFamily: F, fontWeight: 800, fontSize: "1.05rem", color: T1 }}>{plan.name}</h3>
                <span style={{
                  fontFamily: F, fontSize: "0.68rem", fontWeight: 700,
                  color: plan.highlight ? OG : T2,
                  padding: "3px 8px", borderRadius: "999px",
                  background: plan.highlight ? OGL : "#F3F4F6",
                  border: `1px solid ${plan.highlight ? OGLT : BDR}`,
                }}>{plan.badge}</span>
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "12px" }}>
                <p style={{ fontFamily: F, fontWeight: 900, fontSize: "2rem", color: plan.highlight ? OG : T1, lineHeight: 1 }}>{plan.price}</p>
                <span style={{ fontFamily: F, fontSize: "0.78rem", color: T3 }}>{plan.note}</span>
              </div>

              <div style={{ marginBottom: "18px" }}>
                {plan.features.map((feature) => (
                  <div key={feature} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <CheckCircle size={14} color={plan.highlight ? OG : "#10B981"} />
                    <span style={{ fontFamily: F, fontSize: "0.84rem", color: T2 }}>{feature}</span>
                  </div>
                ))}
              </div>

              <Link to="/auth?mode=register" style={{ textDecoration: "none" }}>
                <button style={{
                  width: "100%", padding: "11px", borderRadius: "10px",
                  background: plan.highlight ? OG : "#111827",
                  color: "#fff", border: "none", cursor: "pointer",
                  fontFamily: F, fontWeight: 700, fontSize: "0.84rem",
                }}>
                  Chọn gói {plan.name}
                </button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ ─── */
function FAQ() {
  const faqs = [
    {
      q: "SkillSprint phù hợp với ai?",
      a: "Phù hợp cho sinh viên năm 1-4, người chuẩn bị internship/fresher và người cần kế hoạch học có deadline rõ ràng.",
    },
    {
      q: "Dữ liệu học tập có an toàn không?",
      a: "Dữ liệu được lưu trữ theo nguyên tắc tối thiểu, mã hóa khi truyền tải và có phân quyền truy cập theo vai trò.",
    },
    {
      q: "Có dùng được miễn phí không?",
      a: "Có. Bạn có thể bắt đầu ở gói Free, sau đó nâng cấp khi cần thêm công cụ AI nâng cao.",
    },
    {
      q: "SkillSprint có thay thế giảng viên không?",
      a: "Không. SkillSprint là lớp hỗ trợ định hướng và luyện tập, giúp bạn học có hệ thống hơn bên cạnh lớp chính khóa.",
    },
  ];

  return (
    <section style={{ padding: "84px 16px", background: "#FFFFFF" }}>
      <div className="max-w-5xl mx-auto">
        <div style={{ textAlign: "center", marginBottom: "34px" }}>
          <h2 style={{ fontFamily: F, fontWeight: 900, fontSize: "clamp(1.6rem,2.8vw,2.3rem)", color: T1, letterSpacing: "-0.03em" }}>
            Câu hỏi thường gặp
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "14px" }}>
          {faqs.map((item) => (
            <div key={item.q} style={{ background: BG, border: `1px solid ${BDR}`, borderRadius: "14px", padding: "18px" }}>
              <p style={{ fontFamily: F, fontWeight: 700, fontSize: "0.94rem", color: T1, marginBottom: "8px" }}>{item.q}</p>
              <p style={{ fontFamily: F, fontSize: "0.84rem", color: T2, lineHeight: 1.7 }}>{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Final CTA ─── */
function FinalCTA() {
  return (
    <section style={{ padding:"80px 16px" }}>
      <div className="max-w-3xl mx-auto" style={{ textAlign:"center" }}>
        <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}>
          <div style={{
            background:CARD, borderRadius:"24px", padding:"64px 48px",
            boxShadow:SHL, border:`1px solid ${BDR}`,
            backgroundImage:`radial-gradient(ellipse 60% 50% at 50% 0%, rgba(255,107,0,0.06) 0%, transparent 60%)`,
          }}>
            <div style={{
              display:"inline-flex", alignItems:"center", gap:"6px",
              padding:"5px 14px", borderRadius:"99px", marginBottom:"20px",
              background:OGL, border:`1px solid ${OGLT}`,
            }}>
              <Zap size={12} fill={OG} color={OG}/>
              <span style={{ fontFamily:F, fontSize:"0.78rem", color:OG, fontWeight:700 }}>Miễn phí dùng thử · Không cần thẻ</span>
            </div>
            <h2 style={{ fontFamily:F, fontWeight:900, fontSize:"clamp(1.8rem,4vw,3.2rem)", color:T1, letterSpacing:"-0.04em", lineHeight:1.08, marginBottom:"16px" }}>
              Mục tiêu của bạn chỉ còn<br/><span style={{ color:OG }}>một sprint nữa thôi.</span>
            </h2>
            <p style={{ fontFamily:F, fontSize:"1rem", color:T2, lineHeight:1.7, marginBottom:"32px" }}>
              Tham gia cùng 2,400+ sinh viên đang dùng SkillSprint để lấp skill gap,<br/>tăng tốc học tập và chinh phục cột mốc mới.
            </p>
            <Link to="/auth" style={{ textDecoration:"none" }}>
              <motion.button style={{
                display:"inline-flex", alignItems:"center", gap:"8px",
                padding:"16px 40px", borderRadius:"14px", background:OG, color:"#fff",
                fontFamily:F, fontWeight:700, fontSize:"1.05rem", border:"none", cursor:"pointer",
                boxShadow:`0 6px 24px rgba(255,107,0,0.4)`,
              }}
              whileHover={{ scale:1.05, boxShadow:`0 10px 32px rgba(255,107,0,0.5)` }}
              whileTap={{ scale:0.97 }}>
                <Zap size={18} fill="#fff" color="#fff"/>
                Bắt đầu dùng thử
                <ArrowRight size={18}/>
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function Footer() {
  const columns = {
    "Sản phẩm": [
      { label: "Trang chủ", to: "/" },
      { label: "Tính năng", to: "/features" },
      { label: "Bảng giá", to: "/pricing" },
      { label: "Bắt đầu miễn phí", to: "/auth?mode=register" },
      { label: "Đăng nhập", to: "/auth?mode=login" },
    ],
    // 'Nền tảng' column removed (moved to app navigation)
    "Công ty": [
      { label: "Giới thiệu", to: "/about" },
      { label: "Liên hệ", to: "/contact" },
      { label: "Email hỗ trợ", href: "mailto:support@skillsprint.vn" },
      { label: "Hotline", href: "tel:+842835555888" },
    ],
    "Pháp lý": [
      { label: "Chính sách bảo mật", href: "#" },
      { label: "Điều khoản sử dụng", href: "#" },
      { label: "Chính sách dữ liệu", href: "#" },
      { label: "Điều khoản thanh toán", href: "#" },
    ],
  } as const;

  return (
    <footer style={{ borderTop:`1px solid ${BDR}`, padding:"56px 16px 24px", background:"#FFFFFF" }}>
      <div className="max-w-6xl mx-auto">
        <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr 1fr 1fr", gap:"22px", marginBottom:"30px" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"12px" }}>
              <BrandLogo size={30} textColor={T1} textSize="0.98rem" />
            </div>
            <p style={{ fontFamily:F, fontSize:"0.84rem", color:T2, lineHeight:1.7, marginBottom:"14px" }}>
              SkillSprint là nền tảng Study Coach AI giúp sinh viên xác định skill gap,
              xây lộ trình học rõ ràng và theo dõi tiến độ theo sprint.
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginBottom:"14px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                <MapPin size={14} color={T3} />
                <span style={{ fontFamily:F, fontSize:"0.8rem", color:T2 }}>Khu Công nghệ cao, Thu Duc, TP.HCM</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                <Mail size={14} color={T3} />
                <a href="mailto:support@skillsprint.vn" style={{ fontFamily:F, fontSize:"0.8rem", color:T2, textDecoration:"none" }}>support@skillsprint.vn</a>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                <Phone size={14} color={T3} />
                <a href="tel:+842835555888" style={{ fontFamily:F, fontSize:"0.8rem", color:T2, textDecoration:"none" }}>(+84) 28 3555 5888</a>
              </div>
            </div>
            <div style={{ display:"flex", gap:"10px" }}>
              {[
                { icon: Github, href: "https://github.com/", label: "GitHub" },
                { icon: Twitter, href: "https://x.com/", label: "X" },
                { icon: Linkedin, href: "https://www.linkedin.com/", label: "LinkedIn" },
              ].map((item) => (
                <motion.a key={item.label} href={item.href} target="_blank" rel="noreferrer"
                  whileHover={{ scale: 1.08 }}
                  style={{
                    width:"34px", height:"34px", borderRadius:"9px", border:`1px solid ${BDR}`,
                    display:"inline-flex", alignItems:"center", justifyContent:"center", color:T2,
                  }}>
                  <item.icon size={15} />
                </motion.a>
              ))}
            </div>
          </div>

          {Object.entries(columns).map(([title, links]) => (
            <div key={title}>
              <p style={{ fontFamily:F, fontSize:"0.72rem", color:T3, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:"12px" }}>{title}</p>
              <div style={{ display:"flex", flexDirection:"column", gap:"9px" }}>
                {links.map((item) => (
                  <div key={item.label}>
                    {'to' in item ? (
                      <Link to={item.to} style={{ color:T2, textDecoration:"none", fontFamily:F, fontSize:"0.84rem" }} onClick={() => setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 40)}>
                        {item.label}
                      </Link>
                    ) : (
                      <a href={('href' in item && item.href) || '#'} style={{ color:T2, textDecoration:"none", fontFamily:F, fontSize:"0.84rem", display:"inline-flex", alignItems:"center", gap:"5px" }} onClick={() => setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 40)}>
                        {item.label}
                        {('href' in item && typeof item.href === 'string' && item.href.startsWith("http")) && <ExternalLink size={12} />}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop:`1px solid ${BDR}`, paddingTop:"14px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"12px", flexWrap:"wrap" }}>
          <p style={{ fontFamily:F, fontSize:"0.78rem", color:T3 }}>© 2026 SkillSprint. All rights reserved.</p>
          <div style={{ display:"flex", alignItems:"center", gap:"12px", flexWrap:"wrap" }}>
            <span style={{ display:"inline-flex", alignItems:"center", gap:"6px", fontFamily:F, fontSize:"0.75rem", color:T3 }}>
              <span style={{ width:"7px", height:"7px", borderRadius:"50%", background:"#22C55E", boxShadow:"0 0 6px rgba(34,197,94,0.8)" }} />
              Hệ thống ổn định
            </span>
            <span style={{ fontFamily:F, fontSize:"0.75rem", color:T3 }}>MST: 0319999888</span>
            <span style={{ fontFamily:F, fontSize:"0.75rem", color:T3 }}>Giờ hỗ trợ: 08:30 - 18:00 (T2-T6)</span>
          </div>
        </div>
        {/* Floating quick actions for landing */}
        <div style={{ position: "fixed", right: 18, bottom: 28, zIndex: 60, display: "flex", flexDirection: "column", gap: 10 }}>
          <a
            href="https://zalo.me/"
            target="_blank"
            rel="noreferrer"
            aria-label="Chat via Zalo"
            style={{
              width: 48, height: 48, borderRadius: 12, background: "#2E9AFE",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              color: "#fff", boxShadow: "0 6px 18px rgba(46,154,254,0.18)", textDecoration: "none",
            }}
            title="Chat qua Zalo"
            onClick={() => setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 40)}
          >
            <img src="https://logowik.com/content/uploads/images/zalo3249.jpg" alt="Zalo" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 12 }} />
          </a>

          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Back to top"
            style={{
              width: 48, height: 48, borderRadius: 12, background: "#111827",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              color: "#fff", boxShadow: "0 6px 18px rgba(0,0,0,0.12)", border: "none", cursor: "pointer",
            }}
            title="Back to top"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5L12 19" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5 12L12 5L19 12" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </footer>
  );
}

/* ─── Page ─── */
export default function Landing() {
  return (
    <div style={{ background:BG, minHeight:"100vh", fontFamily:F }}>
      <style>{`
        ::-webkit-scrollbar{width:6px}
        ::-webkit-scrollbar-track{background:${BG}}
        ::-webkit-scrollbar-thumb{background:#D1D5DB;border-radius:99px}
        *{box-sizing:border-box}
      `}</style>
      <PublicNavbar/>
      <Hero/>
      <Features/>
      <Stats/>
      <HowItWorks/>
      <Pricing/>
      <FAQ/>
      <FinalCTA/>
      <Footer/>
    </div>
  );
}

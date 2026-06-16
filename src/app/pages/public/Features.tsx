import { motion, useMotionValue, useTransform } from "motion/react";
import { Link } from "react-router";
import { 
  Sparkles, Cpu, Clock3, LineChart, Target, Zap, 
  ArrowUpRight, FileText, CheckCircle2, AlertCircle, Play 
} from "lucide-react";
import { Footer as PublicFooter } from "../components/Footer";
import { PublicNavbar } from "../components/PublicNavbar";
import CursorSpotlight from "../components/CursorSpotlight";

/* ─── Premium Design Tokens ─── */
const F    = "'Plus Jakarta Sans', Inter, sans-serif";
const BG   = "#FAFAFA";
const CARD = "#FFFFFF";
const T1   = "#0F172A"; // Slate 900
const T2   = "#475569"; // Slate 600
const OG   = "#FF6B00"; // Brand Orange
const OGL  = "#FFF7ED";
const OGLT = "#FFEDD5";
const BDR  = "rgba(226, 232, 240, 0.8)"; 
const SHL  = "0 30px 60px -15px rgba(15,23,42,0.05), 0 10px 20px -5px rgba(15,23,42,0.01)";

export default function FeaturesLanding() {
  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: F, position: "relative" }} className="antialiased">
      {/* Premium Subtle Light Grid Background */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(255,107,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,107,0,0.02) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        pointerEvents: "none", zIndex: 0
      }}/>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 0%, transparent 0%, #FAFAFA 85%)", pointerEvents: "none", zIndex: 0 }}/>

      <div style={{ position: "relative", zIndex: 1 }}>
        <PublicNavbar />

        <main style={{ paddingTop: "160px", paddingBottom: "120px" }}>
          
          {/* ================= HERO SECTION (STYLE THEO ẢNH 2 BẢNG GIÁ) ================= */}
          <section style={{ textAlign: "center", padding: "0 16px", marginBottom: "100px", position: "relative" }}>
            <div style={{
              position: "absolute", top: "-50%", left: "50%", transform: "translateX(-50%)",
              width: "1000px", height: "1000px", background: "radial-gradient(circle, rgba(255,107,0,0.04) 0%, transparent 70%)",
              pointerEvents: "none", zIndex: 0
            }}/>
            
            <div className="max-w-4xl mx-auto" style={{ position: "relative", zIndex: 1 }}>
              
              {/* 1. Badge: Viền cam mảnh + Chữ cam Bold giống Ảnh 2 */}
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "6px 20px", borderRadius: "99px", marginBottom: "32px",
                  background: CARD, 
                  border: "1px solid rgba(255, 107, 0, 0.35)", // Viền màu cam nhạt tinh tế
                  boxShadow: "0 2px 10px rgba(255,107,0,0.02)"
                }}>
                <Sparkles size={12} color={OG} />
                <span style={{ 
                  fontFamily: F, 
                  fontSize: "0.75rem", 
                  color: OG, // Chữ màu cam nguyên bản thương hiệu
                  fontWeight: 800, 
                  letterSpacing: "0.8px" 
                }} className="uppercase">
                  Hệ sinh thái lõi • AI-Driven Tech
                </span>
              </motion.div>

              {/* 2. Heading: Không còn dải gradient, thay bằng chữ Cam có gạch chân trang trí mảnh */}
              <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
                style={{
                  fontFamily: F, 
                  fontWeight: 800, 
                  fontSize: "clamp(2.4rem, 5.2vw, 4.2rem)",
                  letterSpacing: "-0.03em", 
                  lineHeight: 1.25, 
                  color: T1, 
                  marginBottom: "32px",
                }}>
                Đóng gói toàn bộ <br />
                <span style={{ 
                  color: OG, // Chuyển từ Gradient thành màu Cam thuần
                  position: "relative",
                  display: "inline-block",
                  paddingBottom: "6px"
                }}>
                  quy trình học tập.
                  
                  {/* Đường line gạch chân nhẹ màu cam đặc trưng của ảnh 2 */}
                  <span style={{
                    position: "absolute",
                    bottom: "0",
                    left: "0",
                    width: "100%",
                    height: "3px", 
                    background: "rgba(255, 107, 0, 0.3)",
                    borderRadius: "99px"
                  }} />
                </span>
              </motion.h1>

              {/* 3. Subtitle: Tinh chỉnh sắc độ để text chính nổi bật hơn */}
              <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
                style={{
                  fontFamily: F, 
                  fontSize: "1.1rem", 
                  color: "#64748B", 
                  lineHeight: 1.7,
                  maxWidth: "700px", 
                  margin: "0 auto", 
                  fontWeight: 500
                }}>
                Biến hàng mớ tài liệu lộn xộn thành một lộ trình có thể thực thi. AI của chúng tôi sẽ đóng vai trò như một học giả trợ lý tận tụy, đồng hành cùng bạn đạt điểm tuyệt đối.
              </motion.p>
            </div>
          </section>

          {/* ================= HYPER-PREMIUM BENTO GRID ================= */}
          <section style={{ padding: "0 24px", marginBottom: "140px" }} className="relative">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                
                {/* 🌟 BOX 1: AI SYLLABUS INTEGRATION (Span 2) */}
                <CursorSpotlight className="md:col-span-2" color="rgba(255,107,0,0.15)" size={280}>
                  <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    whileHover={{ y: -6, boxShadow: "0 40px 80px -15px rgba(15,23,42,0.12)" }}
                    className="rounded-[40px] p-8 md:p-11 relative overflow-hidden group flex flex-col justify-between"
                    style={{ background: CARD, border: `1px solid ${BDR}`, minHeight: "460px", boxShadow: SHL, transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)" }}
                  >
                    <div style={{ position: "absolute", top: 0, right: 0, width: "350px", height: "350px", background: "radial-gradient(circle, rgba(255,107,0,0.05) 0%, transparent 70%)", pointerEvents: "none" }}/>
                    
                    <div className="relative z-10 max-w-sm">
                      <div className="inline-flex items-center justify-center" style={{ padding: "14px", borderRadius: "20px", background: "rgba(255,107,0,0.05)", border: "1px solid rgba(255,107,0,0.1)", marginBottom: "28px" }}>
                        <Cpu size={26} color={OG} className="animate-spin" style={{ animationDuration: '8s' }}/>
                      </div>
                      <h3 style={{ fontFamily: F, fontWeight: 900, fontSize: "2rem", color: T1, marginBottom: "14px", letterSpacing: "-0.03em" }}>
                        Kỹ thuật bóc tách Syllabus chuyên sâu
                      </h3>
                      <p style={{ fontFamily: F, fontSize: "1.05rem", color: T2, lineHeight: 1.65, fontWeight: 500 }}>
                        Hệ thống tự động quét sâu cấu trúc môn học học thuật, phân tách thành các lõi liên kết tri thức dạng mạng lưới và hiển thị rõ rệt lỗ hổng kỹ năng của bạn.
                      </p>
                    </div>
                    
                    {/* 🖥️ High-Fidelity Mockup Window */}
                    <div style={{ position: "absolute", right: "-30px", bottom: "-20px", width: "420px", height: "290px", background: "#FCFDFE", borderRadius: "24px", border: "1px solid #E2E8F0", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.08)", overflow: "hidden" }}
                         className="hidden md:flex flex-col transition-all duration-500 group-hover:translate-x-[-12px] group-hover:translate-y-[-10px] group-hover:border-orange-500/20">
                      {/* Window Header */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #F1F5F9", background: "#F8FAFC" }}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#FF5F56" }}/>
                          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#FFBD2E" }}/>
                          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#27C93F" }}/>
                        </div>
                        <span style={{ fontSize: "0.7rem", fontFamily: "monospace", color: "#94A3B8", marginLeft: "12px", fontWeight: 700 }}>PARSING_ENGINE_CORE.ms</span>
                      </div>
                      
                      {/* Interactive Simulated Node Canvas */}
                      <div className="p-5 flex-1 flex flex-col justify-center gap-4 relative bg-white">
                        <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl w-64 shadow-sm z-10">
                          <div className="bg-orange-500 p-2 rounded-lg text-white shadow-sm"><FileText size={14} /></div>
                          <div className="flex flex-col text-left">
                            <span className="text-xs font-bold text-slate-800 truncate max-w-[160px]">Syllabus_Data_Structures.pdf</span>
                            <span className="text-[10px] font-bold text-orange-500 tracking-wide uppercase">Processing via AI Core</span>
                          </div>
                        </div>

                        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                          <motion.path d="M260,75 C300,75 280,140 330,140" fill="none" stroke="#FF6B00" strokeWidth="2" strokeDasharray="4 4" />
                          <motion.path d="M260,75 C300,75 280,200 330,200" fill="none" stroke="#E2E8F0" strokeWidth="2" />
                        </svg>

                        <div className="absolute right-4 top-24 flex flex-col gap-3 z-10">
                          <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-2 px-3 py-2 bg-white border border-orange-200 shadow-md rounded-xl border-l-4 border-l-orange-500">
                            <CheckCircle2 size={12} className="text-orange-500" />
                            <span className="text-[11px] font-black text-slate-700">Node 01: AVL Trees Struct</span>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-100 shadow-sm rounded-xl border-l-4 border-l-purple-500">
                            <AlertCircle size={12} className="text-purple-500" />
                            <span className="text-[11px] font-black text-slate-700">Node 02: Big-O Complexity</span>
                          </motion.div>
                        </div>
                        
                        <motion.div animate={{ x: [-100, 350, -100] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                          style={{ position: "absolute", top: 0, bottom: 0, width: "80px", background: "linear-gradient(90deg, transparent, rgba(255,107,0,0.06), transparent)", pointerEvents: "none", zIndex: 5 }}/>
                      </div>
                    </div>
                  </motion.div>
                </CursorSpotlight>

                {/* 🌟 BOX 2: ADVANCED TIME MANAGEMENT (Span 1) */}
                <CursorSpotlight className="md:col-span-1" color="rgba(147,51,234,0.15)" size={240}>
                  <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                    whileHover={{ y: -6, boxShadow: "0 40px 80px -15px rgba(15,23,42,0.12)" }}
                    className="rounded-[40px] p-8 md:p-10 relative overflow-hidden group flex flex-col justify-between"
                    style={{ background: CARD, boxShadow: SHL, border: `1px solid ${BDR}`, minHeight: "460px", transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)" }}
                  >
                    <div className="relative z-10">
                      <div className="inline-flex items-center justify-center" style={{ padding: "14px", borderRadius: "20px", background: "#F3E8FF", border: "1px solid #E9D5FF", marginBottom: "28px" }}>
                        <Clock3 size={26} color="#9333EA"/>
                      </div>
                      <h3 style={{ fontFamily: F, fontWeight: 900, fontSize: "1.6rem", color: T1, marginBottom: "12px", letterSpacing: "-0.02em" }}>
                        Quản trị tiêu điểm siêu năng suất
                      </h3>
                      <p style={{ fontFamily: F, fontSize: "1.02rem", color: T2, lineHeight: 1.6, fontWeight: 500 }}>
                        Tích hợp đồng hồ Pomodoro cải tiến gắn liền trực tiếp với từng chương mục bài học giúp bảo vệ bạn khỏi sự xao nhãng.
                      </p>
                    </div>
                    
                    <div className="w-full relative mt-6 flex justify-center items-center h-48 hidden md:flex" style={{ zIndex: 1 }}>
                      <div className="absolute bg-white border border-slate-100 rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.04)] p-5 w-64 text-center transform transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-2">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[9px] font-black tracking-widest bg-purple-50 text-purple-600 border border-purple-100 px-2 py-0.5 rounded-md uppercase">DEEP FOCUS</span>
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        </div>
                        <div className="relative flex items-center justify-center my-4">
                          <span className="text-3xl font-black tracking-tight text-slate-800 font-mono">21:48</span>
                          <svg className="absolute w-24 h-24 transform -rotate-90">
                            <circle cx="48" cy="48" r="42" stroke="#F3E8FF" strokeWidth="4" fill="transparent" />
                            <circle cx="48" cy="48" r="42" stroke="#9333EA" strokeWidth="4" fill="transparent" strokeDasharray="264" strokeDashoffset="60" strokeLinecap="round" />
                          </svg>
                        </div>
                        <button className="mx-auto mt-2 px-4 py-1.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                          <Play size={8} fill="currentColor" /> Tạm dừng
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </CursorSpotlight>

                {/* 🌟 BOX 3: PERFORMANCE ANALYTICS (Span 1) */}
                <CursorSpotlight className="md:col-span-1" color="rgba(14,165,233,0.15)" size={240}>
                  <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                    whileHover={{ y: -6, boxShadow: "0 40px 80px -15px rgba(15,23,42,0.12)" }}
                    className="rounded-[40px] p-8 md:p-10 relative overflow-hidden group flex flex-col justify-between"
                    style={{ background: CARD, boxShadow: SHL, border: `1px solid ${BDR}`, minHeight: "460px", transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)" }}
                  >
                    <div className="relative z-10">
                      <div className="inline-flex items-center justify-center" style={{ padding: "14px", borderRadius: "20px", background: "#E0F2FE", border: "1px solid #BAE6FD", marginBottom: "28px" }}>
                        <LineChart size={26} color="#0284C7"/>
                      </div>
                      <h3 style={{ fontFamily: F, fontWeight: 900, fontSize: "1.6rem", color: T1, marginBottom: "12px", letterSpacing: "-0.02em" }}>
                        Cảnh báo chỉ số trễ hạn
                      </h3>
                      <p style={{ fontFamily: F, fontSize: "1.02rem", color: T2, lineHeight: 1.6, fontWeight: 500 }}>
                        Thuật toán tự động giám sát tốc độ xử lý Node kiến thức thực tế, phát ra tín hiệu cảnh báo đỏ nếu phát hiện rủi ro trễ lịch thi.
                      </p>
                    </div>

                    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "190px", overflow: "hidden", zIndex: 1 }} className="hidden md:block transition-all duration-700 group-hover:scale-105 origin-bottom">
                      <div className="absolute top-2 left-8 bg-white border border-slate-100 px-3 py-1.5 rounded-xl shadow-md flex items-center gap-2 z-10">
                        <span className="text-[10px] font-black text-slate-500">Hiệu suất học lập trình:</span>
                        <span className="text-xs font-black text-emerald-500">+24.8%</span>
                      </div>
                      
                      <div style={{ width: "100%", height: "100%", position: "relative" }}>
                        <svg viewBox="0 0 100 50" style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "100%", overflow: "visible" }} preserveAspectRatio="none">
                          <path d="M0,45 C15,45 20,38 35,32 C50,25 60,12 75,18 C85,22 90,5 100,2" fill="none" stroke="#0284C7" strokeWidth="3" strokeLinecap="round" />
                          <path d="M0,45 C15,45 20,38 35,32 C50,25 60,12 75,18 C85,22 90,5 100,2 L100,50 L0,50 Z" fill="url(#blueGlowGrad)" opacity="0.15" />
                          <defs>
                            <linearGradient id="blueGlowGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#0EA5E9" stopOpacity="1"/>
                              <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0"/>
                            </linearGradient>
                          </defs>
                        </svg>
                        <div style={{ position: "absolute", right: "25%", top: "30%", width: "10px", height: "10px", borderRadius: "50%", background: "#fff", border: "3px solid #0284C7", boxShadow: "0 0 12px rgba(2,132,199,0.8)" }} />
                      </div>
                    </div>
                  </motion.div>
                </CursorSpotlight>

                {/* 🌟 BOX 4: ADAPTIVE ROADMAP CONTROLLER (Span 2) */}
                <CursorSpotlight className="md:col-span-2" color="rgba(34,197,94,0.15)" size={280}>
                  <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
                    whileHover={{ y: -6, boxShadow: "0 40px 80px -15px rgba(15,23,42,0.12)" }}
                    className="rounded-[40px] p-8 md:p-11 relative overflow-hidden group flex flex-col justify-between"
                    style={{ background: CARD, border: `1px solid ${BDR}`, minHeight: "460px", boxShadow: SHL, transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)" }}
                  >
                    <div style={{ position: "absolute", top: 0, right: 0, width: "350px", height: "350px", background: "radial-gradient(circle, rgba(34,197,94,0.04) 0%, transparent 70%)", pointerEvents: "none" }}/>

                    <div className="relative z-10 max-w-sm">
                      <div className="inline-flex items-center justify-center" style={{ padding: "14px", borderRadius: "20px", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.12)", marginBottom: "28px" }}>
                        <Target size={26} color="#22C55E"/>
                      </div>
                      <h3 style={{ fontFamily: F, fontWeight: 900, fontSize: "2rem", color: T1, marginBottom: "14px", letterSpacing: "-0.03em" }}>
                        Lộ trình Sprint linh hoạt, thích ứng liên tục
                      </h3>
                      <p style={{ fontFamily: F, fontSize: "1.05rem", color: T2, lineHeight: 1.65, fontWeight: 500 }}>
                        Chia cắt khối lượng kiến thức khổng lồ thành các chặng chạy nước rút ngắn ngày (Sprint). Hệ thống tự động tái cấu trúc phân phối lại nếu bạn lỡ trượt một ngày bận rộn.
                      </p>
                    </div>
                    
                    <div style={{ position: "absolute", right: "24px", bottom: "35px", width: "410px", background: "#FAFBFD", borderRadius: "24px", border: "1px solid #E2E8F0", boxShadow: "0 20px 45px rgba(0,0,0,0.05)", padding: "20px", zIndex: 1 }} 
                         className="hidden md:block transition-all duration-500 group-hover:translate-x-[-8px] group-hover:border-emerald-500/20">
                      
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 text-[10px] font-black text-slate-400 tracking-wider">STAGE 01</div>
                        <div className="flex-1 bg-slate-100 h-9 rounded-xl relative overflow-hidden flex items-center px-3 border border-slate-200/60">
                          <div className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: "100%" }} />
                          <span className="relative z-10 text-[10px] font-black text-white flex items-center gap-1.5"><CheckCircle2 size={11} /> Căn bản OOP (Hoàn thành)</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 text-[10px] font-black text-emerald-600 tracking-wider">ACTIVE NOW</div>
                        <div className="flex-1 bg-slate-100 h-9 rounded-xl relative overflow-hidden flex items-center px-3 border border-slate-200/60">
                          <motion.div initial={{ width: 0 }} whileInView={{ width: "65%" }} transition={{ duration: 1.2, delay: 0.3 }} 
                                      className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-orange-500 to-amber-400 shadow-[0_0_15px_rgba(249,115,22,0.3)]" />
                          <span className="relative z-10 text-[10px] font-black text-slate-800 ml-1">Cấu trúc giải thuật nâng cao (65%)</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="w-16 text-[10px] font-black text-slate-400 tracking-wider">STAGE 03</div>
                        <div className="flex-1 bg-slate-100 h-9 rounded-xl relative overflow-hidden flex items-center px-3 border border-slate-200/40">
                          <span className="text-[10px] font-bold text-slate-400 italic">Luyện đề thi kết khóa Mock Test</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </CursorSpotlight>

              </div>
            </div>
          </section>

          {/* ================= ULTRA-PREMIUM CTA SECTION ================= */}
          <section style={{ padding: "0 16px" }}>
            <div className="max-w-6xl mx-auto" style={{ textAlign: "center" }}>
              <CursorSpotlight color="rgba(255,107,0,0.18)" size={240}>
                <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                  whileHover={{ scale: 1.005 }}
                  style={{
                    background: CARD, borderRadius: "40px", padding: "90px 40px",
                    boxShadow: SHL, position: "relative", overflow: "hidden",
                    border: `1px solid ${BDR}`,
                    transition: "transform 0.4s ease, box-shadow 0.4s ease"
                  }}>
                <div style={{ position: "absolute", top: "-50%", left: "-20%", width: "60%", height: "150%", background: OG, opacity: 0.04, filter: "blur(120px)", pointerEvents: "none" }}/>
                <div style={{ position: "absolute", bottom: "-50%", right: "-20%", width: "60%", height: "150%", background: "#9333EA", opacity: 0.04, filter: "blur(120px)", pointerEvents: "none" }}/>
                
                <div style={{ position: "relative", zIndex: 2 }}>
                  <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}
                    style={{ width: "68px", height: "68px", borderRadius: "22px", background: OGL, border: `1px solid ${OGLT}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "32px", margin: "0 auto", boxShadow: "0 8px 20px rgba(255,107,0,0.06)" }}>
                    <Sparkles size={30} color={OG} />
                  </motion.div>
                  
                  <h2 style={{ fontFamily: F, fontWeight: 900, fontSize: "clamp(2.5rem, 5vw, 4.2rem)", color: T1, letterSpacing: "-0.03em", marginBottom: "24px", lineHeight: 1.1 }}>
                    Sẵn sàng bứt phá cùng <br/>
                    <span style={{ 
                      background: `linear-gradient(135deg, ${OG} 0%, #EA580C 100%)`, 
                      WebkitBackgroundClip: "text", 
                      backgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      color: "transparent",
                      display: "inline-block"
                    }}>SkillSprint?</span>
                  </h2>
                  
                  <p style={{ fontFamily: F, fontSize: "1.2rem", color: T2, lineHeight: 1.7, marginBottom: "48px", maxWidth: "540px", margin: "0 auto 48px", fontWeight: 500 }}>
                    Ngừng lãng phí thời gian vào việc loay hoay lên kế hoạch. Hãy để hệ thống làm điều đó, và bạn chỉ việc tập trung bứt phá điểm số.
                  </p>
                  
                  <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
                    <Link to="/login?mode=register" style={{ textDecoration: "none" }}>
                      <motion.button style={{
                        display: "inline-flex", alignItems: "center", gap: "12px",
                        padding: "22px 54px", borderRadius: "99px", background: OG, color: "#FFFFFF",
                        fontFamily: F, fontWeight: 900, fontSize: "1.1rem", border: "none", cursor: "pointer",
                        boxShadow: `0 12px 35px rgba(255,107,0,0.3), inset 0 2px 0 rgba(255,255,255,0.2)`,
                      }}
                      whileHover={{ scale: 1.03, boxShadow: `0 20px 45px rgba(255,107,0,0.4), inset 0 2px 0 rgba(255,255,255,0.2)` }}
                      whileTap={{ scale: 0.97 }}>
                        <Zap size={16} fill="currentColor" strokeWidth={0} />
                        Bắt đầu trải nghiệm miễn phí
                        <ArrowUpRight size={16} />
                      </motion.button>
                    </Link>
                  </div>
                </div>
                </motion.div>
              </CursorSpotlight>
            </div>
          </section>

        </main>

        <PublicFooter />
      </div>
    </div>
  );
}
import { motion } from "motion/react";
import { Link } from "react-router";
import { Sparkles, Cpu, Clock3, LineChart, Target, Zap } from "lucide-react";
import { Footer as PublicFooter } from "../components/Footer";
import { PublicNavbar } from "../components/PublicNavbar";
import CursorSpotlight from "../components/CursorSpotlight";

/* ─── Design Tokens ─── */
const F    = "'Plus Jakarta Sans', Inter, sans-serif";
const BG   = "#FAFAFA";
const CARD = "#FFFFFF";
const T1   = "#111827"; // Deep Charcoal Title
const T2   = "#4B5563"; // Slate Gray Paragraph
const TW2  = "#94A3B8"; // Muted text
const OG   = "#FF6B00"; // Brand Orange
const OGL  = "#FFF7ED";
const OGLT = "#FFEDD5";
const BDR  = "#E5E7EB"; // Light border
const SH   = "0 1px 3px rgba(0,0,0,0.05),0 4px 12px rgba(0,0,0,0.03)";
const SHL  = "0 10px 40px rgba(15,23,42,0.06), 0 2px 8px rgba(15,23,42,0.02)";

export default function FeaturesLanding() {
  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: F, position: "relative" }}>
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

        <main style={{ paddingTop: "140px", paddingBottom: "80px", overflow: "hidden" }}>
          
          {/* Hero Section */}
          <section style={{ textAlign: "center", padding: "0 16px", marginBottom: "80px", position: "relative" }}>
            <div style={{
              position: "absolute", top: "-50%", left: "50%", transform: "translateX(-50%)",
              width: "800px", height: "800px", background: "radial-gradient(circle, rgba(255,107,0,0.05) 0%, transparent 70%)",
              pointerEvents: "none", zIndex: 0
            }}/>
            
            <div className="max-w-4xl mx-auto" style={{ position: "relative", zIndex: 1 }}>
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "6px 14px", borderRadius: "99px", marginBottom: "24px",
                  background: CARD, border: `1px solid ${BDR}`, boxShadow: SH
                }}>
                <Sparkles size={12} color={OG}/>
                <span style={{ fontFamily: F, fontSize: "0.78rem", color: T1, fontWeight: 700 }}>
                  Công nghệ lõi của SkillSprint
                </span>
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
                style={{
                  fontFamily: F, fontWeight: 900, fontSize: "clamp(2.5rem,5vw,4.5rem)",
                  letterSpacing: "-0.04em", lineHeight: 1.1, color: T1, marginBottom: "24px",
                }}>
                Đóng gói toàn bộ <br />
                <span style={{ 
                  background: `linear-gradient(135deg, ${OG}, #FF3B00)`, 
                  WebkitBackgroundClip: "text", 
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  color: "transparent",
                  display: "inline-block"
                }}>quy trình học tập.</span>
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
                style={{
                  fontFamily: F, fontSize: "1.15rem", color: T2, lineHeight: 1.75,
                  maxWidth: "680px", margin: "0 auto",
                }}>
                Biến hàng mớ tài liệu lộn xộn thành một lộ trình có thể thực thi. AI của chúng tôi sẽ đóng vai trò như một study coach tận tụy, đồng hành cùng bạn đến ngày thi.
              </motion.p>
            </div>
          </section>

          {/* Bento Grid (100% Light Mode Cohesive recoloring) */}
          <section style={{ padding: "0 16px", marginBottom: "120px" }}>
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Box 1: AI (Light Mode recolored - Span 2) */}
                <CursorSpotlight className="md:col-span-2" color="rgba(255,107,0,0.14)" size={220}>
                  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    whileHover={{ y: -8, scale: 1.012, boxShadow: "0 30px 60px rgba(15,23,42,0.08)" }}
                    className="rounded-[32px] p-8 md:p-12 relative overflow-hidden group flex flex-col justify-between"
                    style={{ background: CARD, border: `1px solid ${BDR}`, minHeight: "420px", boxShadow: SHL, transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
                  >
                    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 100% 100%, rgba(255,107,0,0.04), transparent 60%)", pointerEvents: "none" }}/>
                    
                    <div style={{ position: "relative", zIndex: 2, maxWidth: "380px" }}>
                      <div style={{ display: "inline-flex", padding: "12px", borderRadius: "16px", background: "rgba(255,107,0,0.06)", border: "1px solid rgba(255,107,0,0.12)", marginBottom: "24px" }}>
                        <Cpu size={28} color={OG}/>
                      </div>
                      <h3 style={{ fontFamily: F, fontWeight: 800, fontSize: "1.8rem", color: T1, marginBottom: "12px", letterSpacing: "-0.02em" }}>
                        AI phân tách Syllabus
                      </h3>
                      <p style={{ fontFamily: F, fontSize: "1.05rem", color: T2, lineHeight: 1.6 }}>
                        Tự động quét cấu trúc môn học, bóc tách thành các Node kiến thức trọng tâm và nhận diện lỗ hổng skill gap cực kỳ chuẩn xác.
                      </p>
                    </div>
                    
                    {/* High-fidelity Mockup: macOS Terminal / Code Editor (Light Theme) */}
                    <div style={{ position: "absolute", right: "-20px", bottom: "-20px", width: "400px", height: "260px", background: "#F8FAFC", borderRadius: "20px", border: `1px solid #E2E8F0`, boxShadow: "0 20px 40px rgba(0,0,0,0.06)", overflow: "hidden", zIndex: 1 }} 
                         className="hidden md:flex flex-col transition-transform duration-700 group-hover:-translate-x-4 group-hover:-translate-y-4">
                      {/* Top Bar */}
                      <div style={{ display: "flex", gap: "8px", padding: "14px 18px", borderBottom: "1px solid #E2E8F0", background: "#F1F5F9" }}>
                        <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#FF5F56" }}/>
                        <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#FFBD2E" }}/>
                        <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#27C93F" }}/>
                      </div>
                      {/* Code Body */}
                      <div style={{ padding: "20px", flex: 1, position: "relative", fontFamily: "monospace", fontSize: "0.8rem", color: "#334155" }}>
                         <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                            <span style={{ color: "#94A3B8" }}>1</span>
                            <div style={{ flex: 1 }}>
                              <span style={{color: "#D32F2F"}}>const</span> <span style={{color: "#0D47A1"}}>syllabus</span> = <span style={{color: "#7B1FA2"}}>analyze</span>(<span style={{color: "#2E7D32"}}>'CS101'</span>);
                            </div>
                         </div>
                         <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                            <span style={{ color: "#94A3B8" }}>2</span>
                            <div style={{ flex: 1 }}>
                              <span style={{color: "#D32F2F"}}>await</span> <span style={{color: "#7B1FA2"}}>extractNodes</span>(syllabus);
                            </div>
                         </div>
                         <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                            <span style={{ color: "#94A3B8" }}>3</span>
                            <div style={{ width: "40%", height: "8px", borderRadius: "4px", background: "#CBD5E1", marginTop: "6px" }}/>
                         </div>
                         <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                            <span style={{ color: "#94A3B8" }}>4</span>
                            <div style={{ width: "60%", height: "8px", borderRadius: "4px", background: "#CBD5E1", marginTop: "6px" }}/>
                         </div>
                         {/* AI Scanner Beam */}
                         <motion.div animate={{ y: [0, 180, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                           style={{ position: "absolute", top: 0, left: 0, right: 0, height: "40px", background: "linear-gradient(to bottom, transparent, rgba(255,107,0,0.06))", borderBottom: "2px solid #FF6B00", boxShadow: "0 10px 20px rgba(255,107,0,0.05)", pointerEvents: "none" }}/>
                      </div>
                    </div>
                  </motion.div>
                </CursorSpotlight>

                {/* Box 2: Time Management (Light Mode - Span 1) */}
                <CursorSpotlight className="md:col-span-1" color="rgba(147,51,234,0.12)" size={180}>
                  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                    whileHover={{ y: -8, scale: 1.012, boxShadow: "0 30px 60px rgba(15,23,42,0.08)" }}
                    className="rounded-[32px] p-8 md:p-12 relative overflow-hidden group flex flex-col"
                    style={{ background: CARD, boxShadow: SHL, border: `1px solid ${BDR}`, minHeight: "420px", transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
                  >
                    <div style={{ position: "relative", zIndex: 2 }}>
                      <div style={{ display: "inline-flex", padding: "12px", borderRadius: "16px", background: "#F3E8FF", border: "1px solid #E9D5FF", marginBottom: "24px" }}>
                        <Clock3 size={28} color="#9333EA"/>
                      </div>
                      <h3 style={{ fontFamily: F, fontWeight: 800, fontSize: "1.5rem", color: T1, marginBottom: "12px" }}>
                        Quản trị thời gian
                      </h3>
                      <p style={{ fontFamily: F, fontSize: "1.05rem", color: T2, lineHeight: 1.6 }}>
                        Tích hợp Pomodoro giúp bạn làm chủ sự tập trung tối đa.
                      </p>
                    </div>
                    
                    {/* High-fidelity Mockup: Stacked Task Cards */}
                    <div style={{ position: "absolute", right: "10px", bottom: "-30px", width: "280px", zIndex: 1 }} className="hidden md:block transition-transform duration-700 group-hover:-translate-y-6">
                      {/* Card 1 (Back) */}
                      <div style={{ position: "absolute", top: "-50px", right: "30px", width: "100%", height: "120px", background: "#F9FAFB", borderRadius: "20px", border: "1px solid #E5E7EB", transform: "scale(0.85) rotate(6deg)", opacity: 0.6 }}/>
                      {/* Card 2 (Middle) */}
                      <div style={{ position: "absolute", top: "-25px", right: "15px", width: "100%", height: "120px", background: "#F3F4F6", borderRadius: "20px", border: "1px solid #E5E7EB", boxShadow: "0 10px 20px rgba(0,0,0,0.03)", transform: "scale(0.9) rotate(3deg)", opacity: 0.9 }}/>
                      {/* Card 3 (Front Glassmorphism) */}
                      <div style={{ position: "relative", width: "100%", background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.8)", boxShadow: "0 20px 40px rgba(0,0,0,0.08)", padding: "24px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                          <div style={{ padding: "6px 12px", borderRadius: "8px", background: "#FEE2E2", color: "#EF4444", fontSize: "0.75rem", fontWeight: 800 }}>URGENT</div>
                          <div style={{ color: "#9333EA", fontSize: "0.9rem", fontWeight: 800, fontFamily: "monospace" }}>25:00</div>
                        </div>
                        <div style={{ width: "85%", height: "12px", borderRadius: "6px", background: "#A855F7", marginBottom: "12px" }}/>
                        <div style={{ width: "60%", height: "12px", borderRadius: "6px", background: "#E9D5FF" }}/>
                      </div>
                    </div>
                  </motion.div>
                </CursorSpotlight>

                {/* Box 3: Tracking (Light Mode - Span 1) */}
                <CursorSpotlight className="md:col-span-1" color="rgba(14,165,233,0.12)" size={180}>
                  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
                    whileHover={{ y: -8, scale: 1.012, boxShadow: "0 30px 60px rgba(15,23,42,0.08)" }}
                    className="rounded-[32px] p-8 md:p-12 relative overflow-hidden group flex flex-col"
                    style={{ background: CARD, boxShadow: SHL, border: `1px solid ${BDR}`, minHeight: "420px", transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
                  >
                    <div style={{ position: "relative", zIndex: 2 }}>
                      <div style={{ display: "inline-flex", padding: "12px", borderRadius: "16px", background: "#E0F2FE", border: "1px solid #BAE6FD", marginBottom: "24px" }}>
                        <LineChart size={28} color="#0284C7"/>
                      </div>
                      <h3 style={{ fontFamily: F, fontWeight: 800, fontSize: "1.5rem", color: T1, marginBottom: "12px" }}>
                        Kiểm soát tiến độ
                      </h3>
                      <p style={{ fontFamily: F, fontSize: "1.05rem", color: T2, lineHeight: 1.6 }}>
                        Hệ thống tự động cảnh báo đỏ nếu bạn có nguy cơ trễ kỳ thi.
                      </p>
                    </div>

                    {/* High-fidelity Mockup: Gradient Area Chart */}
                    <div style={{ position: "absolute", right: 0, bottom: 0, width: "100%", height: "200px", zIndex: 1 }} className="hidden md:flex items-end transition-transform duration-700 group-hover:scale-105 origin-bottom">
                      <div style={{ width: "100%", height: "100%", position: "relative", padding: "0 20px" }}>
                        {/* SVG Chart */}
                        <svg viewBox="0 0 100 50" style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "100%", overflow: "visible" }} preserveAspectRatio="none">
                          <path d="M0,45 C15,45 25,25 40,30 C60,38 75,10 100,5" fill="none" stroke="#0EA5E9" strokeWidth="2.5" />
                          <path d="M0,45 C15,45 25,25 40,30 C60,38 75,10 100,5 L100,50 L0,50 Z" fill="url(#blueGradient)" opacity="0.2" />
                          <defs>
                            <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#0EA5E9" stopOpacity="1"/>
                              <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0"/>
                            </linearGradient>
                          </defs>
                        </svg>
                        {/* Tooltip Target */}
                        <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }} 
                                    style={{ position: "absolute", right: "10%", top: "10%", width: "14px", height: "14px", borderRadius: "50%", background: "#fff", border: "4px solid #0EA5E9", boxShadow: "0 0 15px rgba(14,165,233,0.6)" }}/>
                      </div>
                    </div>
                  </motion.div>
                </CursorSpotlight>

                {/* Box 4: Roadmap (Light Mode recolored - Span 2) */}
                <CursorSpotlight className="md:col-span-2" color="rgba(34,197,94,0.14)" size={220}>
                  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
                    whileHover={{ y: -8, scale: 1.012, boxShadow: "0 30px 60px rgba(15,23,42,0.08)" }}
                    className="rounded-[32px] p-8 md:p-12 relative overflow-hidden group flex flex-col justify-between"
                    style={{ background: CARD, border: `1px solid ${BDR}`, minHeight: "420px", boxShadow: SHL, transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
                  >
                    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 100% 100%, rgba(34,197,94,0.04), transparent 60%)", pointerEvents: "none" }}/>

                    <div style={{ position: "relative", zIndex: 2, maxWidth: "420px" }}>
                      <div style={{ display: "inline-flex", padding: "12px", borderRadius: "16px", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.12)", marginBottom: "24px" }}>
                        <Target size={28} color="#22C55E"/>
                      </div>
                      <h3 style={{ fontFamily: F, fontWeight: 800, fontSize: "1.8rem", color: T1, marginBottom: "12px", letterSpacing: "-0.02em" }}>
                        Lộ trình Sprint linh hoạt
                      </h3>
                      <p style={{ fontFamily: F, fontSize: "1.05rem", color: T2, lineHeight: 1.6 }}>
                        Chia nhỏ núi kiến thức khổng lồ thành các Sprint ngắn hạn. Ưu tiên những lõi kiến thức quan trọng nhất dựa trên thời gian thực tế bạn có.
                      </p>
                    </div>
                    
                    {/* High-fidelity Mockup: Gantt Chart Dashboard (Light Theme) */}
                    <div style={{ position: "absolute", right: "20px", bottom: "30px", width: "420px", background: "#F8FAFC", borderRadius: "20px", border: "1px solid #E2E8F0", boxShadow: "0 20px 40px rgba(0,0,0,0.06)", padding: "24px", zIndex: 1 }} 
                         className="hidden md:block transition-transform duration-700 group-hover:-translate-x-6">
                      {/* Track 1 */}
                      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
                        <div style={{ width: "70px", fontSize: "0.75rem", color: "#64748B", fontWeight: 700, letterSpacing: "0.5px" }}>SPRINT 1</div>
                        <div style={{ flex: 1, height: "10px", background: "#E2E8F0", borderRadius: "5px", position: "relative" }}>
                          <motion.div initial={{ width: 0 }} whileInView={{ width: "100%" }} transition={{ duration: 1.5, ease: "easeOut" }} 
                                      style={{ position: "absolute", top: 0, left: 0, height: "100%", background: "linear-gradient(90deg, #10B981, #34D399)", borderRadius: "5px", boxShadow: "0 0 15px rgba(34,197,94,0.2)" }}/>
                        </div>
                      </div>
                      {/* Track 2 */}
                      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
                        <div style={{ width: "70px", fontSize: "0.75rem", color: "#64748B", fontWeight: 700, letterSpacing: "0.5px" }}>SPRINT 2</div>
                        <div style={{ flex: 1, height: "10px", background: "#E2E8F0", borderRadius: "5px", position: "relative" }}>
                          <motion.div initial={{ width: 0 }} whileInView={{ width: "70%" }} transition={{ duration: 1.5, delay: 0.4, ease: "easeOut" }} 
                                      style={{ position: "absolute", top: 0, left: "20%", height: "100%", background: "linear-gradient(90deg, #8B5CF6, #A78BFA)", borderRadius: "5px", boxShadow: "0 0 15px rgba(168,85,247,0.2)" }}/>
                        </div>
                      </div>
                      {/* Track 3 */}
                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ width: "70px", fontSize: "0.75rem", color: "#EF4444", fontWeight: 800, letterSpacing: "0.5px" }}>FINAL EXAM</div>
                        <div style={{ flex: 1, height: "10px", background: "#E2E8F0", borderRadius: "5px", position: "relative" }}>
                          <motion.div initial={{ width: 0 }} whileInView={{ width: "20%" }} transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }} 
                                      style={{ position: "absolute", top: 0, left: "80%", height: "100%", background: "linear-gradient(90deg, #EF4444, #F87171)", borderRadius: "5px", boxShadow: "0 0 15px rgba(239,68,68,0.2)" }}/>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </CursorSpotlight>

              </div>
            </div>
          </section>

          {/* Ultra-Premium CTA (Light Mode recolored) */}
          <section style={{ padding: "0 16px" }}>
            <div className="max-w-6xl mx-auto" style={{ textAlign: "center" }}>
              <CursorSpotlight color="rgba(255,107,0,0.18)" size={240}>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                  whileHover={{ scale: 1.008 }}
                  style={{
                    background: CARD, borderRadius: "32px", padding: "100px 40px",
                    boxShadow: SHL, position: "relative", overflow: "hidden",
                    border: `1px solid ${BDR}`,
                    transition: "transform 0.4s ease, box-shadow 0.4s ease"
                  }}>
                {/* Glowing Mesh Background */}
                <div style={{ position: "absolute", top: "-50%", left: "-20%", width: "60%", height: "150%", background: OG, opacity: 0.04, filter: "blur(120px)", pointerEvents: "none", borderRadius: "50%" }}/>
                <div style={{ position: "absolute", bottom: "-50%", right: "-20%", width: "60%", height: "150%", background: "#9333EA", opacity: 0.04, filter: "blur(120px)", pointerEvents: "none", borderRadius: "50%" }}/>
                
                {/* Tech Grid Pattern */}
                <div style={{
                  position: "absolute", inset: 0,
                  backgroundImage: "linear-gradient(rgba(255,107,0,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,107,0,0.015) 1px, transparent 1px)",
                  backgroundSize: "30px 30px", pointerEvents: "none", zIndex: 0
                }}/>

                {/* Abstract floating nodes */}
                <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} style={{ position: "absolute", top: "20%", left: "15%", width: "8px", height: "8px", borderRadius: "50%", background: OG, opacity: 0.6, boxShadow: `0 0 20px ${OG}` }}/>
                <motion.div animate={{ y: [0, 20, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }} style={{ position: "absolute", bottom: "30%", right: "20%", width: "12px", height: "12px", borderRadius: "50%", background: "#9333EA", opacity: 0.6, boxShadow: "0 0 20px #9333EA" }}/>

                <div style={{ position: "relative", zIndex: 2 }}>
                  <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}
                    style={{ width: "64px", height: "64px", borderRadius: "16px", background: OGL, border: `1px solid ${OGLT}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "32px", margin: "0 auto", boxShadow: "0 4px 12px rgba(255,107,0,0.08)" }}>
                    <Sparkles size={32} color={OG} />
                  </motion.div>
                  
                  <h2 style={{ fontFamily: F, fontWeight: 900, fontSize: "clamp(2.5rem,5vw,4rem)", color: T1, letterSpacing: "-0.03em", marginBottom: "24px" }}>
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
                  
                  <p style={{ fontFamily: F, fontSize: "1.15rem", color: T2, lineHeight: 1.7, marginBottom: "48px", maxWidth: "500px", margin: "0 auto 48px" }}>
                    Ngừng lãng phí thời gian vào việc lên kế hoạch. Hãy để hệ thống làm điều đó, và bạn chỉ việc tập trung học.
                  </p>
                  
                  <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
                    <Link to="/login?mode=register" style={{ textDecoration: "none" }}>
                      <motion.button style={{
                        display: "inline-flex", alignItems: "center", gap: "10px",
                        padding: "20px 48px", borderRadius: "99px", background: OG, color: "#FFFFFF",
                        fontFamily: F, fontWeight: 800, fontSize: "1.1rem", border: "none", cursor: "pointer",
                        boxShadow: `0 10px 30px rgba(255,107,0,0.25), inset 0 2px 0 rgba(255,255,255,0.25)`,
                      }}
                      whileHover={{ scale: 1.04, boxShadow: `0 15px 40px rgba(255,107,0,0.35), inset 0 2px 0 rgba(255,255,255,0.25)` }}
                      whileTap={{ scale: 0.97 }}>
                        <Zap size={16} fill="currentColor" strokeWidth={0} />
                        Bắt đầu miễn phí ngay
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

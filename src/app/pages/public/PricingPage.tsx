import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router";
import { Check, X, Sparkles, Zap, HelpCircle, Plus } from "lucide-react";
import { Footer as PublicFooter } from "../components/Footer";
import { PublicNavbar } from "../components/PublicNavbar";
import CursorSpotlight from "../components/CursorSpotlight";

/* ─── Design Tokens ─── */
const F    = "'Plus Jakarta Sans', Inter, sans-serif";
const BG   = "#FAFAFA";
const CARD = "#FFFFFF";
const DARK = "#0A0A0C"; 
const T1   = "#111827";
const T2   = "#4B5563";
const TW   = "#FFFFFF";
const TW2  = "#9CA3AF";
const OG   = "#FF6B00";
const BDR  = "#E5E7EB";

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  return (
    <div style={{ background:BG, minHeight:"100vh", fontFamily:F, position:"relative" }}>
      {/* Background Grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
        backgroundSize: "40px 40px", pointerEvents: "none", zIndex: 0
      }}/>
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(circle at 50% 0%, transparent 0%, #FAFAFA 80%)", pointerEvents:"none", zIndex:0 }}/>

      <div style={{ position:"relative", zIndex:1 }}>
        <PublicNavbar />

        <main style={{ paddingTop:"140px", paddingBottom:"120px", overflow:"hidden" }}>
          
          {/* Header Section */}
          <section style={{ textAlign:"center", padding:"0 16px", marginBottom:"60px", position:"relative" }}>
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.7 }}
              style={{
                fontFamily:F, fontWeight:900, fontSize:"clamp(2.5rem,5vw,4.5rem)",
                letterSpacing:"-0.04em", lineHeight:1.1, color:T1, marginBottom:"20px",
              }}>
              Đầu tư cho <span style={{ background:`linear-gradient(135deg, ${OG}, #FF3B00)`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>tương lai</span> của bạn.
            </motion.div>
            <motion.p initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.7, delay:0.1 }}
              style={{ fontFamily:F, fontSize:"1.15rem", color:T2, maxWidth:"600px", margin:"0 auto" }}>
              Chọn gói phù hợp nhất với nhu cầu học tập của bạn. Hủy bất cứ lúc nào.
            </motion.p>
          </section>

          {/* Toggle Switch */}
          <section style={{ display:"flex", justifyContent:"center", marginBottom:"80px", padding:"0 16px" }}>
            <div style={{ position:"relative", display:"inline-flex", background:"#F3F4F6", borderRadius:"99px", padding:"6px", border:"1px solid #E5E7EB", boxShadow:"inset 0 2px 4px rgba(0,0,0,0.02)" }}>
              {/* Badge */}
              <motion.div animate={{ y:[0,-4,0] }} transition={{ duration:2, repeat:Infinity, ease:"easeInOut" }}
                style={{ position:"absolute", top:"-28px", right:"10px", background:"#10B981", color:"#fff", fontSize:"0.75rem", fontWeight:800, padding:"4px 10px", borderRadius:"8px", boxShadow:"0 4px 10px rgba(16,185,129,0.3)" }}>
                TIẾT KIỆM 25%
                <div style={{ position:"absolute", bottom:"-4px", left:"50%", transform:"translateX(-50%) rotate(45deg)", width:"8px", height:"8px", background:"#10B981" }}/>
              </motion.div>

              <button onClick={() => setIsAnnual(false)} style={{ position:"relative", zIndex:1, padding:"12px 24px", borderRadius:"99px", border:"none", background:"transparent", cursor:"pointer", fontFamily:F, fontWeight:700, fontSize:"1rem", color: !isAnnual ? T1 : T2, transition:"color 0.3s" }}>
                Trả theo tháng
              </button>
              <button onClick={() => setIsAnnual(true)} style={{ position:"relative", zIndex:1, padding:"12px 24px", borderRadius:"99px", border:"none", background:"transparent", cursor:"pointer", fontFamily:F, fontWeight:700, fontSize:"1rem", color: isAnnual ? T1 : T2, transition:"color 0.3s" }}>
                Trả theo năm
              </button>
              
              {/* Animated Pill Background */}
              <motion.div layout transition={{ type:"spring", bounce:0.2, duration:0.5 }}
                style={{ position:"absolute", top:"6px", bottom:"6px", left: isAnnual ? "calc(50% + 2px)" : "6px", width:"calc(50% - 8px)", background:"#fff", borderRadius:"99px", boxShadow:"0 2px 8px rgba(0,0,0,0.08)", zIndex:0 }}/>
            </div>
          </section>

          {/* Pricing Cards */}
          <section style={{ padding:"0 16px", marginBottom:"120px" }}>
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8 justify-center items-center md:items-stretch">
              
              {/* Box 1: Builder (Light) */}
              <CursorSpotlight color="rgba(14,165,233,0.16)" size={180}>
                <motion.div initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.5, delay:0.2 }}
                  style={{ flex:1, width:"100%", maxWidth:"400px", background:CARD, borderRadius:"32px", border:`1px solid ${BDR}`, padding:"40px", boxShadow:"0 10px 40px rgba(0,0,0,0.03)", display:"flex", flexDirection:"column" }}>
                
                <h3 style={{ fontFamily:F, fontWeight:800, fontSize:"1.8rem", color:T1, marginBottom:"8px" }}>Gói Builder</h3>
                <p style={{ fontFamily:F, fontSize:"1rem", color:T2, marginBottom:"32px" }}>Dành cho người mới bắt đầu làm quen với phương pháp học mới.</p>
                
                <div style={{ display:"flex", alignItems:"baseline", gap:"4px", marginBottom:"32px" }}>
                  <span style={{ fontFamily:F, fontWeight:900, fontSize:"3.5rem", color:T1, lineHeight:1, letterSpacing:"-0.03em" }}>
                    {isAnnual ? "69" : "89"}
                  </span>
                  <span style={{ fontFamily:F, fontWeight:700, fontSize:"1.2rem", color:T1 }}>.000</span>
                  <span style={{ fontFamily:F, fontSize:"1rem", color:T2, marginLeft:"4px" }}>đ/tháng</span>
                </div>

                <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                  style={{ width:"100%", padding:"16px", borderRadius:"16px", background:"#F3F4F6", color:T1, fontFamily:F, fontWeight:800, fontSize:"1.05rem", border:"1px solid #E5E7EB", cursor:"pointer", marginBottom:"40px", transition:"background 0.2s" }}>
                  Bắt đầu miễn phí
                </motion.button>

                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:F, fontWeight:700, fontSize:"0.9rem", color:T1, textTransform:"uppercase", letterSpacing:"1px", marginBottom:"20px" }}>Bao gồm:</div>
                  <ul style={{ listStyle:"none", padding:0, margin:0, display:"flex", flexDirection:"column", gap:"16px" }}>
                    {[
                      { text: "Lộ trình học AI cơ bản", inc: true },
                      { text: "Quản lý lịch học thông minh", inc: true },
                      { text: "Phân tích tiến độ học tập", inc: true },
                      { text: "Phòng phỏng vấn thử AI", inc: false },
                      { text: "Gợi ý học tập nâng cao", inc: false },
                      { text: "Hỗ trợ ưu tiên 24/7", inc: false },
                      { text: "Tải về lộ trình định dạng PDF", inc: false },
                    ].map((feature, i) => (
                      <li key={i} style={{ display:"flex", alignItems:"center", gap:"12px", opacity: feature.inc ? 1 : 0.4 }}>
                        <div style={{ width:"24px", height:"24px", borderRadius:"50%", background: feature.inc ? "#E0F2FE" : "#F3F4F6", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          {feature.inc ? <Check size={14} color="#0284C7" strokeWidth={3}/> : <X size={14} color="#9CA3AF" strokeWidth={3}/>}
                        </div>
                        <span style={{ fontFamily:F, fontSize:"1.05rem", color:T1, fontWeight: feature.inc ? 600 : 400, textDecoration: feature.inc ? "none" : "line-through" }}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                </motion.div>
              </CursorSpotlight>

              {/* Box 2: Premium (Dark with Glow) */}
              <div style={{ position:"relative", flex:1, width:"100%", maxWidth:"420px" }}>
                {/* Glowing Aura */}
                <div style={{ position:"absolute", inset:0, background:OG, opacity:0.25, filter:"blur(50px)", borderRadius:"32px", zIndex:0 }}/>
                
                <CursorSpotlight color="rgba(255,107,0,0.26)" size={200}>
                  <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.5, delay:0.3 }}
                    style={{ position:"relative", zIndex:1, background:DARK, borderRadius:"32px", border:`1px solid #3F3F46`, padding:"40px", boxShadow:"0 30px 60px rgba(0,0,0,0.5)", display:"flex", flexDirection:"column", height:"100%" }}>
                  
                  {/* Floating Ribbon */}
                  <div style={{ position:"absolute", top:"-16px", left:"50%", transform:"translateX(-50%)", background:"linear-gradient(90deg, #FF6B00, #F59E0B)", color:"#fff", padding:"6px 16px", borderRadius:"99px", fontFamily:F, fontSize:"0.8rem", fontWeight:800, display:"flex", alignItems:"center", gap:"6px", boxShadow:"0 10px 20px rgba(255,107,0,0.4)", border:"1px solid rgba(255,255,255,0.2)", width:"max-content" }}>
                    <Sparkles size={14} />
                    ĐƯỢC KHUYÊN DÙNG
                  </div>

                  <h3 style={{ fontFamily:F, fontWeight:800, fontSize:"1.8rem", color:TW, marginBottom:"8px", marginTop:"10px" }}>Gói Premium</h3>
                  <p style={{ fontFamily:F, fontSize:"1rem", color:TW2, marginBottom:"32px" }}>Toàn quyền truy cập mọi tính năng siêu việt nhất.</p>
                  
                  <div style={{ display:"flex", alignItems:"baseline", gap:"4px", marginBottom:"32px" }}>
                    <span style={{ fontFamily:F, fontWeight:900, fontSize:"3.5rem", color:TW, lineHeight:1, letterSpacing:"-0.03em" }}>
                      {isAnnual ? "149" : "199"}
                    </span>
                    <span style={{ fontFamily:F, fontWeight:700, fontSize:"1.2rem", color:TW }}>.000</span>
                    <span style={{ fontFamily:F, fontSize:"1rem", color:TW2, marginLeft:"4px" }}>đ/tháng</span>
                  </div>

                  <motion.button whileHover={{ scale:1.02, boxShadow:"0 10px 25px rgba(255,107,0,0.4)" }} whileTap={{ scale:0.98 }}
                    style={{ width:"100%", padding:"16px", borderRadius:"16px", background:OG, color:TW, fontFamily:F, fontWeight:800, fontSize:"1.05rem", border:"none", cursor:"pointer", marginBottom:"40px", boxShadow:"0 6px 15px rgba(255,107,0,0.25)", transition:"box-shadow 0.2s" }}>
                    Nâng cấp lên Premium
                  </motion.button>

                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:F, fontWeight:700, fontSize:"0.9rem", color:TW, textTransform:"uppercase", letterSpacing:"1px", marginBottom:"20px" }}>Mọi thứ của Builder, cộng thêm:</div>
                    <ul style={{ listStyle:"none", padding:0, margin:0, display:"flex", flexDirection:"column", gap:"16px" }}>
                      {[
                        { text: "Lộ trình AI cá nhân hóa sâu" },
                        { text: "Phòng phỏng vấn thử AI với feedback chi tiết" },
                        { text: "Gợi ý học tập AI nâng cao (Tự động thích ứng)" },
                        { text: "Hỗ trợ ưu tiên 24/7 (Phản hồi <1h)" },
                        { text: "Tải về lộ trình định dạng PDF/Notion" },
                      ].map((feature, i) => (
                        <li key={i} style={{ display:"flex", alignItems:"flex-start", gap:"12px" }}>
                          <div style={{ width:"24px", height:"24px", borderRadius:"50%", background:"rgba(255,107,0,0.1)", border:"1px solid rgba(255,107,0,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:"2px" }}>
                            <Zap size={14} color={OG} strokeWidth={3}/>
                          </div>
                          <span style={{ fontFamily:F, fontSize:"1.05rem", color:"#E5E7EB", fontWeight: 600, lineHeight:1.5 }}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  </motion.div>
                </CursorSpotlight>
              </div>

            </div>
          </section>

          {/* High-end FAQ Section */}
          <section style={{ padding: "80px 16px 120px 16px", background: "linear-gradient(to bottom, #FAFAFA, #F3F4F6)", borderTop: `1px solid ${BDR}` }}>
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
              
              {/* Left sticky column */}
              <div className="md:col-span-5 md:sticky md:top-24">
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  padding: "6px 14px", borderRadius: "99px", marginBottom: "20px",
                  background: "#F3E8FF", border: "1px solid #E9D5FF"
                }}>
                  <HelpCircle size={14} color="#9333EA"/>
                  <span style={{ fontFamily: F, fontSize: "0.8rem", color: "#9333EA", fontWeight: 700 }}>
                    Hỗ trợ & Giải đáp
                  </span>
                </div>
                
                <h2 style={{ fontFamily: F, fontWeight: 900, fontSize: "clamp(2rem,4vw,2.8rem)", color: T1, letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: "20px" }}>
                  Câu hỏi <br />
                  <span style={{ background: `linear-gradient(135deg, ${OG}, #FF3B00)`, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent" }}>thường gặp.</span>
                </h2>
                
                <p style={{ fontFamily: F, fontSize: "1.1rem", color: T2, lineHeight: 1.6, marginBottom: "32px", maxWidth: "380px" }}>
                  Mọi thắc mắc của bạn về tính năng học tập và thanh toán dịch vụ đều được giải đáp nhanh chóng tại đây.
                </p>
                
                {/* Visual support card */}
                <div style={{
                  background: CARD, border: `1px solid ${BDR}`, borderRadius: "24px", padding: "24px",
                  position: "relative", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.02)"
                }}>
                  <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "120px", height: "120px", background: "radial-gradient(circle, rgba(255,107,0,0.08) 0%, transparent 70%)", borderRadius: "50%" }}/>
                  <h4 style={{ fontFamily: F, fontWeight: 800, fontSize: "1.05rem", color: T1, marginBottom: "8px" }}>Vẫn còn câu hỏi khác?</h4>
                  <p style={{ fontFamily: F, fontSize: "0.95rem", color: T2, lineHeight: 1.5, marginBottom: "16px" }}>Liên hệ ngay với bộ phận hỗ trợ học tập của chúng tôi để được tư vấn trực tiếp 24/7.</p>
                  <Link to="/contact" style={{ textDecoration: "none" }}>
                    <motion.button 
                      whileHover={{ scale: 1.03, background: OG, color: "#fff", borderColor: OG }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        padding: "10px 20px", borderRadius: "12px", border: `1px solid ${BDR}`,
                        background: "transparent", color: T1, fontFamily: F, fontWeight: 700, fontSize: "0.9rem",
                        cursor: "pointer", transition: "all 0.2s"
                      }}
                    >
                      Kết nối với chúng tôi
                    </motion.button>
                  </Link>
                </div>
              </div>

              {/* Right column: Interactive Accordions */}
              <div className="md:col-span-7 space-y-4">
                {[
                  {
                    q: "Nếu Syllabus của trường tôi quá phức tạp thì AI có đọc được không?",
                    a: "AI của SkillSprint bóc tách chính xác mọi đề cương phức tạp, hỗ trợ từ file PDF, ảnh chụp giáo trình đến tài liệu đa ngôn ngữ."
                  },
                  {
                    q: "Nếu tôi bận rộn và trễ deadline, lộ trình có tự điều chỉnh không?",
                    a: "Có. Với lộ trình động (Dynamic Roadmap), hệ thống sẽ tự động tối ưu và phân bổ lại lượng kiến thức khi bạn lỡ lịch học."
                  },
                  {
                    q: "Phòng phỏng vấn thử AI (Gói Premium) hoạt động như thế nào?",
                    a: "AI đóng vai trò giám khảo, đặt câu hỏi từ các bài đã học và phân tích giọng nói để chấm điểm chi tiết chuyên môn lẫn sự tự tin."
                  },
                  {
                    q: "Tôi có thể hủy gói Premium sau khi đã thi xong không?",
                    a: "Hoàn toàn được. Bạn có thể chủ động nâng cấp, hạ cấp hoặc hủy gia hạn bất kỳ lúc nào ngay trong Cài đặt tài khoản."
                  }
                ].map((faq, i) => {
                  const isOpen = activeFaq === i;
                  return (
                    <motion.div
                      key={i}
                      layout
                      style={{
                        background: CARD,
                        borderRadius: "20px",
                        border: `1px solid ${isOpen ? "rgba(255,107,0,0.3)" : BDR}`,
                        boxShadow: isOpen ? "0 12px 30px rgba(255,107,0,0.06)" : "0 4px 12px rgba(0,0,0,0.01)",
                        overflow: "hidden",
                        position: "relative",
                        transition: "border-color 0.3s, box-shadow 0.3s"
                      }}
                    >
                      {/* Active indicator strip */}
                      <div style={{
                        position: "absolute", left: 0, top: 0, bottom: 0, width: "5px",
                        background: `linear-gradient(to bottom, ${OG}, #FF3B00)`,
                        opacity: isOpen ? 1 : 0, transition: "opacity 0.3s"
                      }}/>

                      {/* Header click area */}
                      <div
                        onClick={() => setActiveFaq(isOpen ? null : i)}
                        style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "24px 28px", cursor: "pointer", userSelect: "none"
                        }}
                      >
                        <h4 style={{
                          fontFamily: F, fontWeight: 800, fontSize: "1.1rem",
                          color: isOpen ? OG : T1, transition: "color 0.2s",
                          lineHeight: 1.4, paddingRight: "16px"
                        }}>
                          {faq.q}
                        </h4>
                        
                        <div style={{
                          width: "36px", height: "36px", borderRadius: "50%",
                          background: isOpen ? "#FFF7ED" : "#F3F4F6",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0, transform: `rotate(${isOpen ? "135deg" : "0deg"})`,
                          transition: "transform 0.3s, background 0.3s"
                        }}>
                          <Plus size={18} color={isOpen ? OG : T2} />
                        </div>
                      </div>

                      {/* Expanding Answer area */}
                      <motion.div
                        initial={false}
                        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        style={{ overflow: "hidden" }}
                      >
                        <div style={{
                          padding: "0 28px 24px 28px", fontFamily: F, fontSize: "1rem",
                          color: T2, lineHeight: 1.6, borderTop: `1px solid ${isOpen ? "rgba(255,107,0,0.08)" : "transparent"}`,
                          paddingTop: "16px"
                        }}>
                          {faq.a}
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>

            </div>
          </section>

        </main>

        <PublicFooter />
      </div>
    </div>
  );
}

import { motion } from "motion/react";
import { Send, MapPin, Mail, MessageSquare, Clock, Users, ArrowRight, Facebook } from "lucide-react";
import { Footer as PublicFooter } from "../components/Footer";
import { PublicNavbar } from "../components/PublicNavbar";
import CursorSpotlight from "../components/CursorSpotlight";

/* ─── Design Tokens ─── */
const F    = "'Plus Jakarta Sans', Inter, sans-serif";
const BG   = "#FAFAFA";
const T1   = "#111827";
const T2   = "#4B5563";
const OG   = "#FF6B00";
const OGL  = "#FFF7ED";

export default function Contact() {
  return (
    <div style={{ background:BG, minHeight:"100vh", fontFamily:F, position:"relative" }}>
      {/* Background Tech Grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
        backgroundSize: "40px 40px", pointerEvents: "none", zIndex: 0
      }}/>
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(circle at 80% 20%, rgba(255,107,0,0.05), transparent 50%)", pointerEvents:"none", zIndex:0 }}/>

      <div style={{ position:"relative", zIndex:1 }}>
        <PublicNavbar />

        <main style={{ paddingTop:"140px", paddingBottom:"120px", overflow:"hidden" }}>
          
          {/* Header Section */}
          <section style={{ textAlign:"center", padding:"0 16px", marginBottom:"80px", position:"relative" }}>
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.7 }}
              style={{
                fontFamily:F, fontWeight:900, fontSize:"clamp(2.5rem,5vw,4rem)",
                letterSpacing:"-0.04em", lineHeight:1.1, color:T1, marginBottom:"20px",
              }}>
              Chúng tôi ở đây để giúp bạn <span style={{ background:`linear-gradient(135deg, ${OG}, #FF3B00)`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>bứt phá.</span>
            </motion.div>
            <motion.p initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.7, delay:0.1 }}
              style={{ fontFamily:F, fontSize:"1.15rem", color:T2, maxWidth:"600px", margin:"0 auto" }}>
              Đội ngũ SkillSprint luôn sẵn sàng hỗ trợ bạn giải quyết mọi vấn đề trên con đường chinh phục tri thức.
            </motion.p>
          </section>

          {/* Main Content: Bento Grid + Form */}
          <section style={{ padding:"0 16px" }}>
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Information Bento Grid */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                
                {/* Community VIP Card */}
                <CursorSpotlight color="rgba(255,107,0,0.22)" size={200}>
                  <motion.div initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.5, delay:0.2 }}
                    style={{
                      background:"linear-gradient(135deg, #111827, #1F2937)", borderRadius:"32px", padding:"40px",
                      boxShadow:"0 20px 40px rgba(0,0,0,0.1)", position:"relative", overflow:"hidden", border:"1px solid #374151"
                    }}>
                  <div style={{ position:"absolute", top:"-50%", right:"-20%", width:"70%", height:"150%", background:OG, opacity:0.2, filter:"blur(60px)", pointerEvents:"none", borderRadius:"50%" }}/>
                  
                  <div style={{ position:"relative", zIndex:1 }}>
                    <div style={{ width:"48px", height:"48px", borderRadius:"16px", background:"rgba(255,107,0,0.15)", border:"1px solid rgba(255,107,0,0.3)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"24px" }}>
                      <Users size={24} color={OG} />
                    </div>
                    <h3 style={{ fontFamily:F, fontWeight:800, fontSize:"1.5rem", color:"#fff", marginBottom:"12px" }}>
                      Cộng đồng Học tập
                    </h3>
                    <p style={{ fontFamily:F, fontSize:"1rem", color:"#9CA3AF", lineHeight:1.6, marginBottom:"24px" }}>
                      Tham gia cùng <strong>10.000+ sinh viên</strong> khác. Trao đổi đề thi, mẹo ôn tập và nhận thông báo cập nhật tính năng sớm nhất.
                    </p>
                    <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                      style={{
                        display:"inline-flex", alignItems:"center", gap:"8px", padding:"12px 24px", borderRadius:"12px",
                        background:"rgba(255,255,255,0.1)", color:"#fff", fontFamily:F, fontWeight:700, fontSize:"0.95rem",
                        border:"1px solid rgba(255,255,255,0.2)", cursor:"pointer", transition:"background 0.2s"
                      }}>
                      <MessageSquare size={18} />
                      Cập Nhật Sau!!!
                    </motion.button>

                    {/* Secondary Social Channels */}
                    <div className="mt-6 pt-6 border-t border-slate-700/60 flex items-center gap-4">
                      <span className="text-xs text-slate-400 font-semibold" style={{ fontFamily: F }}>Theo dõi thêm:</span>
                      <a
                        href="https://www.facebook.com/profile.php?id=61590323403077"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Facebook SkillSprint"
                        className="text-slate-400 hover:text-[#FF6B00] hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-1.5 text-xs font-semibold no-underline"
                        style={{ fontFamily: F }}
                      >
                        <Facebook size={16} />
                        <span>Facebook</span>
                      </a>
                      <a
                        href="https://www.tiktok.com/@skillsprint26"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="TikTok SkillSprint"
                        className="text-slate-400 hover:text-[#FF6B00] hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-1.5 text-xs font-semibold no-underline"
                        style={{ fontFamily: F }}
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .79.11V9.5a6.27 6.27 0 0 0-3.1-1.74 6.36 6.36 0 0 0-6 5.56 6.34 6.34 0 0 0 6.1 7.18A6.3 6.3 0 0 0 15.82 16c0-.05.02-.1.02-.15V8.82a8.17 8.17 0 0 0 4.85 1.58V7a4.83 4.83 0 0 1-1.1-.31z" />
                        </svg>
                        <span>TikTok</span>
                      </a>
                    </div>
                  </div>
                  </motion.div>
                </CursorSpotlight>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
                  {/* Speed Commitment Card */}
                  <CursorSpotlight color="rgba(16,185,129,0.18)" size={160}>
                    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.3 }}
                      style={{
                        background:"#fff", borderRadius:"24px", padding:"24px", border:"1px solid #E5E7EB",
                        boxShadow:"0 10px 30px rgba(0,0,0,0.03)", display:"flex", alignItems:"flex-start", gap:"16px"
                      }}>
                    <div style={{ width:"40px", height:"40px", borderRadius:"12px", background:"#ECFDF5", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <Clock size={20} color="#10B981" />
                    </div>
                    <div>
                      <h4 style={{ fontFamily:F, fontWeight:800, fontSize:"1.05rem", color:T1, marginBottom:"4px" }}>Cam kết hỗ trợ</h4>
                      <p style={{ fontFamily:F, fontSize:"0.95rem", color:T2, lineHeight:1.5 }}>
                        Đội ngũ Support cam kết phản hồi các yêu cầu của bạn <strong>trong vòng 2 giờ</strong> làm việc.
                      </p>
                    </div>
                    </motion.div>
                  </CursorSpotlight>

                  {/* Contact Info Card */}
                  <CursorSpotlight color="rgba(255,107,0,0.16)" size={160}>
                    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.4 }}
                      style={{
                        background:"#fff", borderRadius:"24px", padding:"24px", border:"1px solid #E5E7EB",
                        boxShadow:"0 10px 30px rgba(0,0,0,0.03)", display:"flex", flexDirection:"column", gap:"20px"
                      }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
                      <div style={{ width:"40px", height:"40px", borderRadius:"12px", background:OGL, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <Mail size={20} color={OG} />
                      </div>
                      <div>
                        <div style={{ fontFamily:F, fontSize:"0.85rem", color:T2, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px" }}>Email hỗ trợ</div>
                        <div style={{ fontFamily:F, fontWeight:700, fontSize:"1.05rem", color:T1 }}>skillsprint2026@gmail.com</div>
                      </div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
                      <div style={{ width:"40px", height:"40px", borderRadius:"12px", background:"#F3F4F6", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <MapPin size={20} color={T2} />
                      </div>
                      <div>
                        <div style={{ fontFamily:F, fontSize:"0.85rem", color:T2, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px" }}>Trụ sở chính</div>
                        <div style={{ fontFamily:F, fontWeight:600, fontSize:"1rem", color:T1 }}>Cập Nhật Sau!!!!</div>
                      </div>
                    </div>
                    </motion.div>
                  </CursorSpotlight>
                </div>

              </div>

              {/* Right Column: Glassmorphism Form */}
              <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.5, delay:0.3 }} className="lg:col-span-7">
                <CursorSpotlight color="rgba(255,107,0,0.14)" size={200}>
                  <div style={{
                    background:"rgba(255,255,255,0.7)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
                    borderRadius:"32px", padding:"48px", border:"1px solid rgba(255,255,255,0.9)",
                    boxShadow:"0 20px 40px rgba(0,0,0,0.04)"
                  }}>
                  <h3 style={{ fontFamily:F, fontWeight:800, fontSize:"1.8rem", color:T1, marginBottom:"8px" }}>Gửi tin nhắn cho chúng tôi</h3>
                  <p style={{ fontFamily:F, fontSize:"1rem", color:T2, marginBottom:"32px" }}>Vui lòng điền chi tiết vấn đề để chúng tôi có thể hỗ trợ bạn nhanh nhất.</p>

                  <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <label style={{ fontFamily:F, fontWeight:700, fontSize:"0.9rem", color:T1 }}>Họ và tên</label>
                        <input type="text" placeholder="Nguyễn Văn A" className="px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm placeholder:text-slate-400 focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 outline-none transition-all duration-200" style={{ fontFamily:F, fontSize:"1rem", color:T1 }} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label style={{ fontFamily:F, fontWeight:700, fontSize:"0.9rem", color:T1 }}>Email liên hệ</label>
                        <input type="email" placeholder="skillsprint2026@gmail.com" className="px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm placeholder:text-slate-400 focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 outline-none transition-all duration-200" style={{ fontFamily:F, fontSize:"1rem", color:T1 }} />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label style={{ fontFamily:F, fontWeight:700, fontSize:"0.9rem", color:T1 }}>Chủ đề (Vấn đề bạn gặp phải)</label>
                      <select className="px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm placeholder:text-slate-400 focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 outline-none transition-all duration-200 appearance-none" style={{ fontFamily:F, fontSize:"1rem", color:T1 }}>
                        <option>Hỗ trợ thanh toán / Nâng cấp gói</option>
                        <option>Báo lỗi lộ trình học AI</option>
                        <option>Tư vấn chọn gói học tập</option>
                        <option>Khác</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label style={{ fontFamily:F, fontWeight:700, fontSize:"0.9rem", color:T1 }}>Nội dung chi tiết</label>
                      <textarea rows={5} placeholder="Ví dụ: Mình vừa thanh toán qua Momo nhưng tài khoản chưa được nâng cấp lên Premium..." className="px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm placeholder:text-slate-400 focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 outline-none transition-all duration-200 resize-none" style={{ fontFamily:F, fontSize:"1rem", color:T1 }} />
                    </div>

                    <motion.button whileHover={{ scale:1.02, boxShadow:"0 12px 30px rgba(255,107,0,0.35)" }} whileTap={{ scale:0.98 }}
                      style={{
                        marginTop:"16px", display:"inline-flex", alignItems:"center", justifyContent:"center", gap:"10px",
                        padding:"18px 40px", borderRadius:"16px", background:OG, color:"#fff",
                        fontFamily:F, fontWeight:800, fontSize:"1.1rem", border:"none", cursor:"pointer",
                        boxShadow:"0 8px 20px rgba(255,107,0,0.25)", transition:"box-shadow 0.2s"
                      }}>
                      Gửi yêu cầu hỗ trợ
                      <Send size={18} />
                    </motion.button>
                  </form>
                  </div>
                </CursorSpotlight>
              </motion.div>

            </div>
          </section>

        </main>

        <PublicFooter />
      </div>
    </div>
  );
}
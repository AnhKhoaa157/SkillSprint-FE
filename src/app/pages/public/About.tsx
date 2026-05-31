import { motion } from "motion/react";
import { Link } from "react-router";
import { ArrowRight, Target, LineChart, Clock, ShieldCheck, Sparkles, Zap, Map } from "lucide-react";
import { PublicNavbar } from "../components/PublicNavbar";
import { Footer as PublicFooter } from "../components/Footer";

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

export default function About() {
  return (
    <div style={{ background:BG, minHeight:"100vh", fontFamily:F }}>
      <PublicNavbar />

      <main style={{ paddingTop:"140px", paddingBottom:"80px", overflow:"hidden" }}>
        {/* Hero Section */}
        <section style={{ textAlign:"center", padding:"0 16px", marginBottom:"100px", position:"relative" }}>
          <div style={{
            position:"absolute", top:"-50%", left:"50%", transform:"translateX(-50%)",
            width:"600px", height:"600px", background:"radial-gradient(ellipse, rgba(255,107,0,0.08) 0%, transparent 60%)",
            pointerEvents:"none", zIndex:0
          }}/>
          
          <div className="max-w-4xl mx-auto" style={{ position:"relative", zIndex:1 }}>
            <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
              style={{
                display:"inline-flex", alignItems:"center", gap:"6px",
                padding:"6px 14px", borderRadius:"99px", marginBottom:"24px",
                background:OGL, border:`1px solid ${OGLT}`,
              }}>
              <Sparkles size={12} color={OG}/>
              <span style={{ fontFamily:F, fontSize:"0.78rem", color:OG, fontWeight:700 }}>
                Câu chuyện của SkillSprint
              </span>
            </motion.div>

            <motion.h1 initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.7, delay:0.2 }}
              style={{
                fontFamily:F, fontWeight:900, fontSize:"clamp(2.5rem,5vw,4.5rem)",
                letterSpacing:"-0.04em", lineHeight:1.1, color:T1, marginBottom:"24px",
              }}>
              Kiến tạo thế hệ <br />
              <span style={{ color:OG }}>học tập chủ động.</span>
            </motion.h1>

            <motion.p initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.7, delay:0.3 }}
              style={{
                fontFamily:F, fontSize:"1.15rem", color:T2, lineHeight:1.75,
                maxWidth:"680px", margin:"0 auto",
              }}>
              Không "học thay" bạn. SkillSprint trang bị lộ trình và công cụ để biến bạn thành người tự học xuất sắc, tự tin đáp ứng mọi yêu cầu khắt khe của ngành IT.
            </motion.p>
          </div>
        </section>

        {/* The Problem & Mission */}
        <section style={{ padding:"0 16px", marginBottom:"120px" }}>
          <div className="max-w-6xl mx-auto">
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:"40px", alignItems:"center" }}>
              <motion.div initial={{ opacity:0, x:-20 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ duration:0.6 }}>
                <h2 style={{ fontFamily:F, fontWeight:900, fontSize:"clamp(1.8rem,3vw,2.5rem)", color:T1, letterSpacing:"-0.03em", lineHeight:1.2, marginBottom:"20px" }}>
                  Giáo trình đồ sộ, <br/>thời gian có hạn.
                </h2>
                <p style={{ fontFamily:F, fontSize:"1rem", color:T2, lineHeight:1.7, marginBottom:"16px" }}>
                  Tài liệu khổng lồ nhưng thiếu định hướng khiến sinh viên IT dễ "bơi" trong kiến thức, học dàn trải và nhanh chóng rơi vào trạng thái quá tải (burnout).
                </p>
                <p style={{ fontFamily:F, fontSize:"1rem", color:T2, lineHeight:1.7 }}>
                  <strong style={{ color:T1 }}>Giải pháp:</strong> Số hóa toàn bộ giáo trình thành lộ trình cá nhân hóa. Chia nhỏ kiến thức thành các mục tiêu đo lường được qua từng Sprint ngắn.
                </p>
              </motion.div>
              <motion.div initial={{ opacity:0, scale:0.95 }} whileInView={{ opacity:1, scale:1 }} viewport={{ once:true }} transition={{ duration:0.6 }}
                style={{
                  background:CARD, borderRadius:"24px", padding:"40px",
                  boxShadow:SHL, border:`1px solid ${BDR}`,
                  backgroundImage:`linear-gradient(135deg, ${OGL} 0%, transparent 100%)`,
                }}>
                <div style={{ display:"grid", gap:"24px" }}>
                  {[
                    { icon: Map, title:"Định hướng rõ ràng", desc:"Chỉ học những gì cần thiết nhất cho mục tiêu hiện tại." },
                    { icon: Target, title:"Lộ trình cá nhân hóa", desc:"Thích ứng với năng lực tiếp thu và quỹ thời gian của riêng bạn." },
                    { icon: Zap, title:"Tăng tốc độ học", desc:"Tối đa hóa hiệu suất tự học thay vì thụ động lắng nghe." },
                  ].map((item, i) => (
                    <div key={i} style={{ display:"flex", gap:"16px" }}>
                      <div style={{
                        width:"48px", height:"48px", borderRadius:"12px", flexShrink:0,
                        background:CARD, border:`1px solid ${OGLT}`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:SH
                      }}>
                        <item.icon size={20} color={OG} />
                      </div>
                      <div>
                        <h3 style={{ fontFamily:F, fontWeight:800, fontSize:"1.05rem", color:T1, marginBottom:"6px" }}>{item.title}</h3>
                        <p style={{ fontFamily:F, fontSize:"0.9rem", color:T2, lineHeight:1.6 }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section style={{ padding:"0 16px", marginBottom:"120px" }}>
          <div className="max-w-6xl mx-auto">
            <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} style={{ textAlign:"center", marginBottom:"56px" }}>
              <h2 style={{ fontFamily:F, fontWeight:900, fontSize:"clamp(2rem,3vw,3.1rem)", color:T1, letterSpacing:"-0.05em", lineHeight:1.05 }}>
                Ba giá trị cốt lõi
              </h2>
            </motion.div>

            <div style={{ position:"relative" }}>
              <div style={{
                position:"absolute", inset:"-18px 0 auto", height:"30px", pointerEvents:"none", opacity:0.45,
                background:"radial-gradient(circle at 10% 20%, rgba(255,107,0,0.14) 0 2px, transparent 2.5px), radial-gradient(circle at 32% 10%, rgba(124,58,237,0.14) 0 2px, transparent 2.5px), radial-gradient(circle at 56% 18%, rgba(14,165,233,0.14) 0 2px, transparent 2.5px), radial-gradient(circle at 79% 8%, rgba(16,185,129,0.14) 0 2px, transparent 2.5px)"
              }}/>

              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:"20px" }}>
                {[
                  { icon: Target, title: "Tính Thực Chiến", desc: "Học để dùng. Mọi kiến thức tiếp thu đều phục vụ trực tiếp cho mục tiêu vượt qua kỳ thi hoặc đáp ứng tiêu chí tuyển dụng.", color: "#FF6B00" },
                  { icon: LineChart, title: "Dữ Liệu Hóa", desc: "Tiến bộ không đến từ cảm tính. Từ lỗ hổng kiến thức đến độ tự tin, mọi thứ đều được lượng hóa bằng chỉ số trực quan.", color: "#7C3AED" },
                  { icon: Clock, title: "Tối Ưu Thời Gian", desc: "Ngừng bơi trong tài liệu rác. Hệ thống giúp bạn tập trung 100% năng lượng vào đúng kiến thức mà bạn đang thực sự thiếu sót.", color: "#0EA5E9" },
                ].map((val, i) => {
                  const indexLabel = String(i + 1).padStart(2, "0");
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity:0, y:24 }}
                      whileInView={{ opacity:1, y:0 }}
                      viewport={{ once:true }}
                      transition={{ duration:0.55, delay:i * 0.08 }}
                      style={{
                        position:"relative",
                        minHeight:"260px",
                        borderRadius:"14px",
                        padding:"12px",
                        overflow:"hidden",
                        background:`linear-gradient(180deg, ${val.color}06 0%, rgba(255,255,255,0.99) 34%, #FFFFFF 100%)`,
                        border:"1px solid rgba(229,231,235,0.88)",
                        boxShadow:"0 4px 12px rgba(15,23,42,0.035), 0 1px 4px rgba(15,23,42,0.02)",
                        transition:"transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease",
                      }}
                      onMouseEnter={e=>{
                        const card = e.currentTarget as HTMLDivElement;
                        card.style.transform = "translateY(-6px)";
                        card.style.boxShadow = "0 18px 40px rgba(15,23,42,0.10), 0 4px 12px rgba(15,23,42,0.06)";
                        card.style.borderColor = `${val.color}33`;
                      }}
                      onMouseLeave={e=>{
                        const card = e.currentTarget as HTMLDivElement;
                        card.style.transform = "translateY(0)";
                        card.style.boxShadow = "0 10px 28px rgba(15,23,42,0.06), 0 2px 8px rgba(15,23,42,0.04)";
                        card.style.borderColor = "rgba(229,231,235,0.95)";
                      }}
                    >
                      <div style={{ position:"absolute", inset:"0 auto auto 0", pointerEvents:"none", opacity:0.55 }}>
                        <span style={{
                          display:"block",
                          fontFamily:F,
                          fontWeight:900,
                          fontSize:"clamp(1.6rem,3.2vw,2.4rem)",
                          lineHeight:1,
                          letterSpacing:"-0.08em",
                          color:`${val.color}22`,
                          WebkitTextStroke:`1.4px ${val.color}44`,
                          margin:"28px 0 0 18px",
                          userSelect:"none",
                        }}>
                          {indexLabel}
                        </span>
                      </div>

                      <div style={{ position:"relative", zIndex:1, display:"flex", flexDirection:"column", height:"100%" }}>
                        <div style={{ marginTop:"64px", marginBottom:"18px" }}>
                          <div style={{
                            width:"40px", height:"40px", borderRadius:"10px",
                            display:"flex", alignItems:"center", justifyContent:"center",
                            background:`${val.color}08`, border:`1px solid ${val.color}18`,
                            boxShadow:"0 3px 8px rgba(15,23,42,0.02)",
                          }}>
                            <val.icon size={16} color={val.color} />
                          </div>
                        </div>

                        <h3 style={{ fontFamily:F, fontWeight:900, fontSize:"1.02rem", color:T1, letterSpacing:"-0.03em", lineHeight:1.06, marginBottom:"14px" }}>
                          {val.title}
                        </h3>
                        <p style={{ fontFamily:F, fontSize:"0.86rem", color:T2, lineHeight:1.42, maxWidth:"100%" }}>
                          {val.desc}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Principles & Trust */}
        <section style={{ padding:"0 16px", marginBottom:"80px" }}>
          <div className="max-w-6xl mx-auto">
            <motion.div initial={{ opacity:0, y:6 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
              style={{
                background:`linear-gradient(180deg, rgba(250,250,252,1) 0%, rgba(255,255,255,1) 50%)`,
                borderRadius:"18px", padding:"48px 48px 40px",
                boxShadow:"0 18px 48px rgba(15,23,42,0.04)", border:`1px solid ${BDR}`
              }}
            >
              <h2 style={{ fontFamily:F, fontWeight:900, fontSize:"clamp(1.7rem,2.4vw,2.2rem)", color:T1, marginBottom:"32px", textAlign:"center" }}>
                Cam kết phát triển sản phẩm
              </h2>

              <div style={{ display:"grid", gap:"22px", gridTemplateColumns:"repeat(2, minmax(0, 1fr))" }}>
                {[
                  { text: "Dữ liệu học tập thực tế phải dẫn dắt kế hoạch.", accent: "#FFDCC5" },
                  { text: "Lộ trình phải thực sự cá nhân hóa theo từng sinh viên.", accent: "#EEDDFF" },
                  { text: "Theo dõi tiến độ phải trực quan, dễ hành động.", accent: "#DFF6FF" },
                  { text: "Cam kết bảo mật tuyệt đối dữ liệu cá nhân của người dùng.", accent: "#E8F9EF" },
                ].map((item, i) => (
                  <div key={i} style={{
                    display:"flex",
                    alignItems:"center",
                    gap:18,
                    background:"#FFFFFF",
                    padding:"18px 20px",
                    borderRadius:12,
                    border:`1px solid rgba(229,231,235,0.88)`,
                    boxShadow:"0 8px 26px rgba(15,23,42,0.03)",
                    minHeight:78,
                    transition:"transform 0.16s ease, box-shadow 0.16s ease",
                    cursor: 'default'
                  }}
                  onMouseEnter={(e)=>{const el=e.currentTarget as HTMLDivElement; el.style.transform='translateY(-6px)'; el.style.boxShadow='0 20px 40px rgba(15,23,42,0.06)';}}
                  onMouseLeave={(e)=>{const el=e.currentTarget as HTMLDivElement; el.style.transform='translateY(0)'; el.style.boxShadow='0 8px 26px rgba(15,23,42,0.03)';}}
                  >
                        <div style={{
                          width:52, height:52, borderRadius:26,
                          display:"flex", alignItems:"center", justifyContent:"center",
                          background:`linear-gradient(135deg, ${item.accent} 0%, rgba(255,255,255,0.6) 100%)`,
                          border:`1px solid rgba(255,255,255,0.6)`,
                          boxShadow:"inset 0 1px 0 rgba(255,255,255,0.6)"
                        }}>
                          <div style={{
                            width:34, height:34, borderRadius:18, display:"flex", alignItems:"center", justifyContent:"center",
                            background: "rgba(255,255,255,0.8)", boxShadow:"0 2px 8px rgba(15,23,42,0.06)"
                          }}>
                            <ShieldCheck size={16} color={OG} />
                          </div>
                        </div>

                    <div style={{ flex:1 }}>
                      <span style={{ fontFamily:F, fontSize:"1.01rem", color:T1, fontWeight:700, lineHeight:1.35 }}>{item.text}</span>
                    </div>
                  </div>
                ))}
              </div>

            </motion.div>
          </div>
        </section>

      </main>

      <PublicFooter />
    </div>
  );
}

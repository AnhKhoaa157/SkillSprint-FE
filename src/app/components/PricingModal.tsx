import { useState } from "react";
import { X, Check, ShieldCheck, ChevronRight, Zap, CreditCard, Smartphone, Star } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const F = "'Inter','Plus Jakarta Sans',sans-serif";
const OG = "#FF6B00";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (plan: "builder" | "premium") => void;
}

/* ─── Reusable dark feature row ─── */
function DarkFeature({ text, color="rgba(255,255,255,0.75)", check="default", dim=false }: {
  text: string; color?: string; check?: "default"|"orange"|"dim"; dim?: boolean;
}) {
  const iconColor = check==="orange" ? OG : check==="dim" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.35)";
  return (
    <li style={{
      display:"flex", alignItems:"flex-start", gap:"9px",
      opacity: dim ? 0.38 : 1,
    }}>
      {check === "dim"
        ? <X size={13} color="rgba(255,255,255,0.25)" style={{ flexShrink:0, marginTop:"2px" }}/>
        : <Check size={13} color={iconColor} strokeWidth={2.5} style={{ flexShrink:0, marginTop:"2px" }}/>
      }
      <span style={{ fontSize:"0.84rem", color, lineHeight:1.5 }}>{text}</span>
    </li>
  );
}

export function PricingModal({ isOpen, onClose, onSuccess }: PricingModalProps) {
  const [step,          setStep]          = useState<"pricing"|"checkout">("pricing");
  const [selectedPlan,  setSelectedPlan]  = useState<"builder"|"premium">("premium");
  const [billingCycle,  setBillingCycle]  = useState<"monthly"|"yearly">("monthly");
  const [paymentMethod, setPaymentMethod] = useState<"momo"|"vnpay"|"card">("momo");
  const [paying, setPaying] = useState(false);

  if (!isOpen) return null;

  const resetAndClose = () => {
    setPaying(false);
    setStep("pricing");
    onClose();
  };

  const handlePay = () => {
    if (paying) return;
    setPaying(true);
    setTimeout(() => {
      onSuccess?.(selectedPlan);
      resetAndClose();
    }, 1200);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={resetAndClose}
        style={{
          position:"fixed", inset:0, zIndex:50,
          display:"flex", alignItems:"center", justifyContent:"center",
          padding:"16px",
          background:"rgba(0,0,0,0.82)", backdropFilter:"blur(8px)",
          overflowY:"auto",
        }}
      >
        <motion.div
          initial={{ opacity:0, scale:0.95, y:12 }}
          animate={{ opacity:1, scale:1, y:0 }}
          exit={{ opacity:0, scale:0.95 }}
          onClick={e => e.stopPropagation()}
          style={{
            width:"100%",
            maxWidth: step==="pricing" ? "860px" : "820px",
            background:"#111115",
            borderRadius:"18px",
            border:"1px solid rgba(255,255,255,0.08)",
            boxShadow:"0 32px 80px rgba(0,0,0,0.6)",
            overflow:"hidden",
            position:"relative",
            fontFamily:F,
          }}
        >
          {/* Close */}
          <button onClick={resetAndClose}
            style={{
              position:"absolute", top:"14px", right:"14px",
              width:"30px", height:"30px", borderRadius:"50%",
              background:"rgba(255,255,255,0.08)", border:"none",
              display:"flex", alignItems:"center", justifyContent:"center",
              cursor:"pointer", color:"rgba(255,255,255,0.6)", zIndex:20,
            }}
            onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,0.14)";}}
            onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,0.08)";}}
          >
            <X size={15}/>
          </button>

          {/* ══ PRICING STEP ══ */}
          {step === "pricing" && (
            <>
              {/* Header */}
              <div style={{ textAlign:"center", padding:"36px 24px 28px" }}>
                {/* Badge */}
                <div style={{
                  display:"inline-flex", alignItems:"center", gap:"6px",
                  padding:"5px 14px", borderRadius:"99px",
                  background:"rgba(255,107,0,0.15)", border:"1px solid rgba(255,107,0,0.35)",
                  marginBottom:"18px",
                }}>
                  <Zap size={11} color={OG} fill={OG}/>
                  <span style={{ fontSize:"0.72rem", color:OG, fontWeight:800, letterSpacing:"0.1em" }}>
                    GÓI SKILLSPRINT
                  </span>
                </div>
                <h2 style={{
                  fontWeight:900, fontSize:"clamp(1.5rem,3vw,2rem)",
                  color:"#FFFFFF", letterSpacing:"-0.04em",
                  marginBottom:"8px", lineHeight:1.1,
                }}>
                  Nâng cấp hành trình sự nghiệp
                </h2>
                <p style={{ fontSize:"0.9rem", color:"rgba(255,255,255,0.45)" }}>
                  Chọn gói phù hợp với mục tiêu học tập của bạn.
                </p>
              </div>

              {/* Cards grid */}
              <div style={{
                display:"grid", gridTemplateColumns:"repeat(3,1fr)",
                borderTop:"1px solid rgba(255,255,255,0.07)",
              }}>

                {/* ── Starter ── */}
                <div style={{
                  padding:"28px 24px 24px",
                  borderRight:"1px solid rgba(255,255,255,0.07)",
                  display:"flex", flexDirection:"column",
                }}>
                  <p style={{ fontSize:"0.95rem", fontWeight:600, color:"rgba(255,255,255,0.45)", marginBottom:"12px" }}>
                    Starter
                  </p>
                  <div style={{ marginBottom:"10px" }}>
                    <span style={{ fontSize:"2.6rem", fontWeight:900, color:"#FFFFFF", letterSpacing:"-0.05em" }}>0đ</span>
                    <span style={{ fontSize:"0.82rem", color:"rgba(255,255,255,0.3)", marginLeft:"2px" }}>/tháng</span>
                  </div>
                  <p style={{ fontSize:"0.8rem", color:"rgba(255,255,255,0.38)", lineHeight:1.6, marginBottom:"20px" }}>
                    Công cụ cơ bản để tổ chức việc học.
                  </p>
                  <ul style={{ listStyle:"none", margin:0, padding:0, display:"flex", flexDirection:"column", gap:"10px", marginBottom:"auto" }}>
                    <DarkFeature text="Quản lý công việc học tập"/>
                    <DarkFeature text="Lộ trình mẫu"/>
                    <DarkFeature text="Lộ trình AI cá nhân hóa" check="dim" dim/>
                  </ul>
                  <button onClick={onClose}
                    style={{
                      width:"100%", padding:"11px", borderRadius:"10px",
                      background:"transparent", border:"1px solid rgba(255,255,255,0.15)",
                      color:"rgba(255,255,255,0.5)", fontFamily:F, fontWeight:600,
                      fontSize:"0.875rem", cursor:"pointer", marginTop:"24px",
                    }}>
                    Gói hiện tại
                  </button>
                </div>

                {/* ── Skill Builder ── */}
                <div style={{
                  padding:"28px 24px 24px",
                  borderRight:"1px solid rgba(255,255,255,0.07)",
                  display:"flex", flexDirection:"column",
                  background:"rgba(255,107,0,0.03)",
                }}>
                  <p style={{ fontSize:"0.95rem", fontWeight:700, color:OG, marginBottom:"12px" }}>
                    Skill Builder
                  </p>
                  <div style={{ marginBottom:"10px" }}>
                    <span style={{ fontSize:"2.6rem", fontWeight:900, color:OG, letterSpacing:"-0.05em" }}>89k</span>
                    <span style={{ fontSize:"0.82rem", color:"rgba(255,255,255,0.3)", marginLeft:"2px" }}>/tháng</span>
                  </div>
                  <p style={{ fontSize:"0.8rem", color:"rgba(255,255,255,0.38)", lineHeight:1.6, marginBottom:"20px" }}>
                    Mở khóa lộ trình AI cá nhân hóa.
                  </p>
                  <ul style={{ listStyle:"none", margin:0, padding:0, display:"flex", flexDirection:"column", gap:"10px", marginBottom:"auto" }}>
                    <DarkFeature text="Lộ trình AI cá nhân hóa" check="orange" color="rgba(255,255,255,0.85)"/>
                    <DarkFeature text="Phát hiện lỗ hổng kỹ năng" check="orange" color="rgba(255,255,255,0.85)"/>
                    <DarkFeature text="Gợi ý tài nguyên học bằng AI" check="orange" color="rgba(255,255,255,0.85)"/>
                  </ul>
                  <motion.button
                    whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                    onClick={()=>{ setSelectedPlan("builder"); setStep("checkout"); }}
                    style={{
                      width:"100%", padding:"11px", borderRadius:"10px",
                      background:"transparent", border:`1.5px solid ${OG}`,
                      color:OG, fontFamily:F, fontWeight:700,
                      fontSize:"0.875rem", cursor:"pointer", marginTop:"24px",
                    }}>
                    Chọn Skill Builder
                  </motion.button>
                </div>

                {/* ── Career Premium ── */}
                <div style={{
                  padding:"28px 24px 24px",
                  background:"rgba(255,107,0,0.06)",
                  border:`1.5px solid ${OG}`,
                  display:"flex", flexDirection:"column",
                  position:"relative", overflow:"hidden",
                }}>
                  {/* RECOMMENDED ribbon */}
                  <div style={{
                    position:"absolute", top:"16px", right:"-28px",
                    background:OG, color:"#000",
                    fontSize:"8.5px", fontWeight:900, letterSpacing:"0.1em",
                    padding:"4px 36px",
                    transform:"rotate(45deg)",
                    transformOrigin:"center",
                    whiteSpace:"nowrap",
                    boxShadow:"0 2px 8px rgba(255,107,0,0.4)",
                  }}>
                    ĐỀ XUẤT
                  </div>

                  <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"12px" }}>
                    <p style={{ fontSize:"0.95rem", fontWeight:700, color:"#FFFFFF" }}>Career Premium</p>
                    <Star size={13} color="#FBBF24" fill="#FBBF24"/>
                  </div>
                    <div style={{ marginBottom:"10px" }}><span style={{ fontSize:"2.6rem", fontWeight:900, color:"#FFFFFF", letterSpacing:"-0.05em" }}>199k</span><span style={{ fontSize:"0.82rem", color:"rgba(255,255,255,0.3)", marginLeft:"2px" }}>/tháng</span></div>
                  <p style={{ fontSize:"0.8rem", color:"rgba(255,255,255,0.38)", lineHeight:1.6, marginBottom:"20px" }}>
                    Bộ công cụ tăng tốc học tập với Gia sư AI và Quiz nhỏ theo chương.
                  </p>
                  <ul style={{ listStyle:"none", margin:0, padding:0, display:"flex", flexDirection:"column", gap:"10px", marginBottom:"auto" }}>
                    <DarkFeature text="Bao gồm toàn bộ gói Skill Builder, cộng thêm:" check="orange" color={OG}/>
                    
                    {/* Tính năng "Killer Feature" nổi bật nhất của gói Premium */}
                    <li style={{ display:"flex", alignItems:"center", gap:"9px" }}>
                      <Zap size={13} color="#FBBF24" fill="#FBBF24" style={{ flexShrink:0 }}/>
                      <span style={{ fontSize:"0.84rem", color:"#FFFFFF", fontWeight:700 }}>Gia sư AI 24/7 cá nhân hóa</span>
                    </li>
                    
                    {/* Các tính năng xịn sò đi kèm */}
                    <DarkFeature text="AI tự động tìm tài nguyên" check="orange" color="rgba(255,255,255,0.85)"/>
                    <DarkFeature text="Quiz nhỏ và thống kê tiến độ" check="orange" color="rgba(255,255,255,0.85)"/>
                    <DarkFeature text="Ưu tiên xử lý AI không giới hạn" check="orange" color="rgba(255,255,255,0.85)"/>
                  </ul>
                  <motion.button
                    whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                    onClick={()=>{ setSelectedPlan("premium"); setStep("checkout"); }}
                    style={{
                      width:"100%", padding:"11px", borderRadius:"10px",
                      background:OG, border:"none",
                      color:"#FFFFFF", fontFamily:F, fontWeight:700,
                      fontSize:"0.875rem", cursor:"pointer", marginTop:"24px",
                      boxShadow:"0 4px 16px rgba(255,107,0,0.38)",
                    }}>
                    Nâng cấp Premium
                  </motion.button>
                </div>
              </div>

              {/* Trust bar */}
              <div style={{
                display:"flex", alignItems:"center", justifyContent:"center",
                gap:"24px", padding:"14px 24px",
                borderTop:"1px solid rgba(255,255,255,0.06)",
              }}>
                {[
                  { icon:<ShieldCheck size={12} color="rgba(255,255,255,0.35)"/>, text:"Bảo mật và mã hóa" },
                  { icon:<Check size={12} color="rgba(255,255,255,0.35)" strokeWidth={2.5}/>, text:"Không phí ẩn" },
                  { icon:<Check size={12} color="rgba(255,255,255,0.35)" strokeWidth={2.5}/>, text:"Hủy bất kỳ lúc nào" },
                ].map(t=>(
                  <div key={t.text} style={{ display:"flex", alignItems:"center", gap:"5px" }}>
                    {t.icon}
                    <span style={{ fontSize:"0.72rem", color:"rgba(255,255,255,0.3)" }}>{t.text}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ══ CHECKOUT STEP ══ */}
          {step === "checkout" && (
            <div style={{ display:"flex", minHeight:"500px" }}>
              {/* Left: Order Summary */}
              <div style={{
                width:"42%", background:"#0D0D11",
                padding:"32px 28px",
                borderRight:"1px solid rgba(255,255,255,0.07)",
                display:"flex", flexDirection:"column",
                position:"relative", overflow:"hidden",
              }}>
                <div style={{
                  position:"absolute", top:0, left:0, width:"100%", height:"100%",
                  background:"radial-gradient(circle at top left, rgba(255,107,0,0.12) 0%, transparent 55%)",
                  pointerEvents:"none",
                }}/>
                <button onClick={()=>setStep("pricing")}
                  style={{
                    display:"flex", alignItems:"center", gap:"4px",
                    fontSize:"0.75rem", color:"rgba(255,255,255,0.4)",
                    background:"none", border:"none", cursor:"pointer", fontFamily:F,
                    marginBottom:"20px", zIndex:1,
                  }}>
                  <ChevronRight size={14} style={{transform:"rotate(180deg)"}}/>
                  Quay lại bảng giá
                </button>
                <h2 style={{ fontSize:"1.3rem", fontWeight:800, color:"#fff", marginBottom:"20px", zIndex:1 }}>
                  {selectedPlan==="premium" ? "Gói Career Premium" : "Gói Skill Builder"}
                </h2>
                {/* Billing toggle */}
                <div style={{
                  display:"flex", background:"rgba(255,255,255,0.06)", borderRadius:"10px",
                  padding:"3px", marginBottom:"20px", zIndex:1,
                }}>
                  {(["monthly","yearly"] as const).map(c=>(
                    <button key={c} onClick={()=>setBillingCycle(c)}
                      style={{
                        flex:1, padding:"8px 0", borderRadius:"8px",
                        background: billingCycle===c ? (c==="yearly" ? OG : "rgba(255,255,255,0.12)") : "transparent",
                        border:"none", cursor:"pointer", fontFamily:F,
                        fontWeight:billingCycle===c ? 700 : 400,
                        fontSize:"0.8rem",
                        color: billingCycle===c ? "#fff" : "rgba(255,255,255,0.35)",
                        transition:"all 0.15s",
                      }}>
                      {c==="monthly" ? "Theo tháng" : <>Theo năm <span style={{ fontSize:"9px", background:"#10B981", color:"#fff", padding:"1px 5px", borderRadius:"3px", marginLeft:"3px" }}>TIẾT KIỆM 50%</span></>}
                    </button>
                  ))}
                </div>
                {/* Price */}
                <div style={{ marginBottom:"20px", zIndex:1 }}>
                  <p style={{ fontSize:"1.8rem", fontWeight:900, color:"#fff" }}>
                    {billingCycle==="monthly"
                      ? (selectedPlan==="premium" ? "199,000 VND" : "89,000 VND")
                      : (selectedPlan==="premium" ? "1,190,000 VND" : "534,000 VND")}
                  </p>
                  <p style={{ fontSize:"0.78rem", color:"rgba(255,255,255,0.35)", marginTop:"3px" }}>
                    {billingCycle==="monthly" ? "Thanh toán theo tháng" : "Thanh toán theo năm"}
                  </p>
                </div>
                {/* Features */}
                <div style={{ marginTop:"auto", zIndex:1 }}>
                  <p style={{ fontSize:"0.65rem", fontWeight:700, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"10px" }}>
                    Mở khóa ngay:
                  </p>
                  <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                    {selectedPlan==="premium" ? (
                  <>
                    <DarkFeature text="Gia sư AI 24/7" check="orange"/>
                    <DarkFeature text="Phân tích syllabus và lỗ hổng kỹ năng" check="orange"/>
                    <DarkFeature text="AI tự động tìm tài nguyên" check="orange"/>
                    <DarkFeature text="Quiz nhỏ và thống kê tiến độ" check="orange"/>
                    <DarkFeature text="Ưu tiên xử lý AI và truy vấn không giới hạn" check="orange"/>
                  </>
                    ) : (
                      <>
                        <DarkFeature text="Cây kỹ năng AI cá nhân hóa" check="orange"/>
                        <DarkFeature text="Gợi ý tài nguyên học bằng AI" check="orange"/>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Payment */}
              <div style={{ flex:1, background:"#090909", padding:"32px 28px", display:"flex", flexDirection:"column" }}>
                <h3 style={{ fontSize:"1rem", fontWeight:700, color:"#fff", marginBottom:"18px" }}>
                  Chọn phương thức thanh toán
                </h3>
                <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginBottom:"20px" }}>
                  {[
                    { id:"momo" as const,  label:"Ví điện tử MoMo",       accent:"#EC4899" },
                    { id:"vnpay" as const, label:"VNPay QR",             accent:"#3B82F6" },
                    { id:"card" as const,  label:"Thẻ tín dụng / ghi nợ",  accent:"#94A3B8" },
                  ].map(pm=>(
                    <label key={pm.id}
                      style={{
                        display:"flex", alignItems:"center", gap:"12px",
                        padding:"12px 14px", borderRadius:"10px", cursor:"pointer",
                        border:`1px solid ${paymentMethod===pm.id ? pm.accent+"66" : "rgba(255,255,255,0.07)"}`,
                        background: paymentMethod===pm.id ? pm.accent+"12" : "rgba(255,255,255,0.02)",
                      }}
                      onClick={()=>setPaymentMethod(pm.id)}
                    >
                      <div style={{
                        width:"18px", height:"18px", borderRadius:"50%",
                        border:`2px solid ${paymentMethod===pm.id ? pm.accent : "rgba(255,255,255,0.2)"}`,
                        display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                      }}>
                        {paymentMethod===pm.id && <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:pm.accent }}/>}
                      </div>
                      <span style={{ flex:1, fontSize:"0.875rem", fontWeight:600, color:"#fff" }}>{pm.label}</span>
                      {pm.id==="momo"  && <Smartphone size={16} color="#EC4899"/>}
                      {pm.id==="vnpay" && <span style={{ fontSize:"9px", fontWeight:900, color:"#3B82F6", border:"1px solid #3B82F6", padding:"1px 5px", borderRadius:"3px" }}>VNPAY</span>}
                      {pm.id==="card"  && <CreditCard size={16} color="#94A3B8"/>}
                    </label>
                  ))}
                </div>
                <div style={{ marginTop:"auto" }}>
                  <motion.button
                    whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                    disabled={paying}
                    onClick={handlePay}
                    style={{
                      width:"100%", padding:"14px", borderRadius:"10px",
                      background:OG, border:"none", color:"#fff",
                      fontFamily:F, fontWeight:700, fontSize:"1rem",
                      cursor:paying ? "default" : "pointer", display:"flex", alignItems:"center",
                      justifyContent:"center", gap:"7px", marginBottom:"16px",
                      boxShadow:paying ? "0 2px 8px rgba(255,107,0,0.2)" : "0 4px 20px rgba(255,107,0,0.38)",
                      opacity:paying ? 0.8 : 1,
                    }}>
                    <ShieldCheck size={17}/> {paying ? "Đang xử lý thanh toán..." : "Thanh toán an toàn"}
                  </motion.button>
                  <div style={{ textAlign:"center" }}>
                    <p style={{ fontSize:"0.68rem", color:"rgba(255,255,255,0.25)" }}>
                      Thanh toán được mã hóa và bảo mật. Tuân thủ PDPA.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

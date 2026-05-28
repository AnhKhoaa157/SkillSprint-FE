import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User, Award, Crown, Bell, Shield, Zap, LogOut,
  ChevronDown, AlertTriangle, Check, Trash2, Gift,
} from "lucide-react";
import { useNavigate } from "react-router";
import { getStoredUserProfile } from "../../api/authService";
import { updateMe } from "../../api/meService";

/* ─── Tokens ─── */
const F    = "'Inter','Plus Jakarta Sans',sans-serif";
const OG   = "#FF6B00";
const OGL  = "#FFF7ED";
const OGLT = "#FFEDD5";
const T1   = "#111827";
const T2   = "#6B7280";
const T3   = "#9CA3AF";
const BDR  = "#E5E7EB";
const CARD = "#FFFFFF";
const SH   = "0 1px 3px rgba(0,0,0,0.04), 0 6px 20px rgba(0,0,0,0.05)";

/* ─── Sub-nav items ─── */
const TABS = [
  { id:"account",       label:"Tài khoản",      icon:User,   danger:false },
  { id:"achievements",  label:"Thành tựu",      icon:Award,  danger:false },
  { id:"subscription",  label:"Gói dịch vụ",    icon:Crown,  danger:false },
  { id:"notifications", label:"Thông báo",      icon:Bell,   danger:false },
  { id:"privacy",       label:"Quyền riêng tư", icon:Shield, danger:false },
  { id:"integrations",  label:"Tích hợp",       icon:Zap,    danger:false },
];

/* ─── Input field ─── */
function Input({
  label, value, onChange, placeholder, type="text", disabled=false,
  hint,
}: {
  label:string; value:string; onChange:(v:string)=>void;
  placeholder?:string; type?:string; disabled?:boolean; hint?:string;
}) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
      <label style={{ fontSize:"0.8rem", fontWeight:600, color:T1, fontFamily:F }}>{label}</label>
      <input
        type={type} value={value} disabled={disabled}
        onChange={e=>onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          padding:"10px 14px", borderRadius:"9px",
          border:`1.5px solid ${BDR}`,
          background: disabled ? "#F9FAFB" : CARD,
          fontFamily:F, fontSize:"0.875rem", color:T1,
          outline:"none", transition:"border-color 0.15s",
          cursor: disabled ? "not-allowed" : "text",
        }}
        onFocus={e=>{ if(!disabled) e.target.style.borderColor=OG; }}
        onBlur={e=>{ e.target.style.borderColor=BDR; }}
      />
      {hint && <p style={{ fontSize:"0.72rem", color:T3, fontFamily:F }}>{hint}</p>}
    </div>
  );
}

/* ─── Select field ─── */
function Select({
  label, value, onChange, options,
}: {
  label:string; value:string;
  onChange:(v:string)=>void; options:string[];
}) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
      <label style={{ fontSize:"0.8rem", fontWeight:600, color:T1, fontFamily:F }}>{label}</label>
      <div style={{ position:"relative" }}>
        <select value={value} onChange={e=>onChange(e.target.value)}
          style={{
            width:"100%", padding:"10px 36px 10px 14px",
            borderRadius:"9px", border:`1.5px solid ${BDR}`,
            background:CARD, fontFamily:F, fontSize:"0.875rem", color:T1,
            outline:"none", appearance:"none", cursor:"pointer",
            transition:"border-color 0.15s",
          }}
          onFocus={e=>{ e.target.style.borderColor=OG; }}
          onBlur={e=>{ e.target.style.borderColor=BDR; }}
        >
          {options.map(o=><option key={o}>{o}</option>)}
        </select>
        <ChevronDown size={15} color={T3} style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
      </div>
    </div>
  );
}

/* ─── Section heading ─── */
function SectionHeading({ title }: { title:string }) {
  return (
    <h3 style={{
      fontWeight:700, fontSize:"0.975rem", color:T1, marginBottom:"16px",
      paddingBottom:"10px", borderBottom:`1px solid ${BDR}`, fontFamily:F,
    }}>{title}</h3>
  );
}

/* ═══════════════════════════════════════════════
   ACCOUNT TAB
═══════════════════════════════════════════════ */
function AccountTab() {
  const profile = getStoredUserProfile();
  const [firstName,  setFirstName]  = useState(profile?.firstName ?? "Nguyễn");
  const [lastName,   setLastName]   = useState(profile?.lastName ?? "Văn A");
  const [email,      setEmail]      = useState(profile?.email ?? "student@university.edu");
  const [university, setUniversity] = useState("FPT University");
  const [major,      setMajor]      = useState("Kỹ thuật phần mềm");
  const [year,       setYear]       = useState("Năm 3");
  const [gpa,        setGpa]        = useState("3.4");
  const [saved,      setSaved]      = useState(false);
  const [deleteModal,setDeleteModal]= useState(false);

  useEffect(() => {
    const stored = getStoredUserProfile();
    if (!stored) {
      return;
    }

    setFirstName(stored.firstName || "Nguyễn");
    setLastName(stored.lastName || "Văn A");
    setEmail(stored.email || "student@university.edu");
  }, []);

  const handleSave = () => {
    void updateMe({ fullName: [firstName, lastName].filter(Boolean).join(" ").trim() || "Nguyễn Văn A" });
    setSaved(true);
    setTimeout(()=>setSaved(false), 2500);
  };

  const UNIVERSITIES = [
    "FPT University","VNU-HCM","HUST","RMIT Vietnam",
    "Fulbright University","Đại học Bách khoa TP.HCM","Khác",
  ];

  return (
    <>
      {/* Personal Information */}
      <div style={{ marginBottom:"28px" }}>
        <SectionHeading title="Thông tin cá nhân"/>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px", marginBottom:"14px" }}>
          <Input label="Tên"         value={firstName} onChange={setFirstName} placeholder="Nhập tên"/>
          <Input label="Họ và tên đệm" value={lastName}  onChange={setLastName}  placeholder="Nhập họ và tên đệm"/>
        </div>
        <Input label="Địa chỉ email" value={email} onChange={setEmail}
          type="email" placeholder="student@university.edu"
          hint="Email được dùng để đăng nhập và nhận thông báo."/>
      </div>

      {/* University Details */}
      <div style={{ marginBottom:"28px" }}>
        <SectionHeading title="Thông tin học tập"/>
        <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
          <Select label="Trường" value={university} onChange={setUniversity} options={UNIVERSITIES}/>
          <Input  label="Chuyên ngành" value={major} onChange={setMajor} placeholder="VD: Kỹ thuật phần mềm"/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
            <Select label="Năm học" value={year} onChange={setYear}
              options={["Năm 1","Năm 2","Năm 3","Năm 4","Đã tốt nghiệp"]}/>
            <Input  label="GPA" value={gpa}  onChange={setGpa} placeholder="VD: 3.4" type="text"/>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div style={{ marginBottom:"24px" }}>
        <SectionHeading title="Vùng nguy hiểm"/>
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"14px 16px", borderRadius:"10px",
          background:"#FFF1F2", border:"1px solid #FECDD3",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <AlertTriangle size={16} color="#EF4444"/>
            <div>
              <p style={{ fontWeight:700, fontSize:"0.875rem", color:"#991B1B", fontFamily:F }}>Xóa tài khoản</p>
              <p style={{ fontSize:"0.75rem", color:"#EF4444", fontFamily:F }}>
                Xóa vĩnh viễn toàn bộ dữ liệu của bạn. Hành động này không thể hoàn tác.
              </p>
            </div>
          </div>
          <button onClick={()=>setDeleteModal(true)}
            style={{
              display:"flex", alignItems:"center", gap:"5px",
              padding:"7px 14px", borderRadius:"8px",
              background:"#EF4444", color:"#fff", border:"none",
              cursor:"pointer", fontFamily:F, fontWeight:700, fontSize:"0.78rem",
              flexShrink:0,
            }}>
            <Trash2 size={12}/> Xóa tài khoản
          </button>
        </div>
      </div>

      {/* Save button */}
      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <motion.button
          whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
          onClick={handleSave}
          style={{
            display:"flex", alignItems:"center", gap:"6px",
            padding:"11px 28px", borderRadius:"10px",
            background: saved
              ? "linear-gradient(135deg,#059669,#10B981)"
              : "linear-gradient(135deg,#FF6B00,#FF8C3A)",
            color:"#fff", border:"none", cursor:"pointer",
            fontFamily:F, fontWeight:700, fontSize:"0.9rem",
            boxShadow: saved
              ? "0 4px 14px rgba(5,150,105,0.32)"
              : "0 4px 14px rgba(255,107,0,0.32)",
            transition:"background 0.3s, box-shadow 0.3s",
          }}
        >
          {saved ? <><Check size={15}/> Đã lưu!</> : "Lưu thay đổi"}
        </motion.button>
      </div>

      {/* Delete modal */}
      <AnimatePresence>
        {deleteModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            style={{ position:"fixed", inset:0, zIndex:100, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }}>
            <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.9,opacity:0}}
              style={{ background:CARD, borderRadius:"16px", padding:"28px", maxWidth:"420px", width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
              <div style={{ width:"44px", height:"44px", borderRadius:"12px", background:"#FFF1F2", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"16px" }}>
                <Trash2 size={20} color="#EF4444"/>
              </div>
              <h3 style={{ fontWeight:900, fontSize:"1.1rem", color:T1, fontFamily:F, marginBottom:"8px" }}>Bạn muốn xóa tài khoản?</h3>
              <p style={{ fontSize:"0.875rem", color:T2, lineHeight:1.65, marginBottom:"20px", fontFamily:F }}>
                Thao tác này sẽ xóa vĩnh viễn dữ liệu, tiến độ, lộ trình học và tệp CV của bạn. Không thể hoàn tác.
              </p>
              <div style={{ display:"flex", gap:"10px" }}>
                <button onClick={()=>setDeleteModal(false)}
                  style={{ flex:1, padding:"10px", borderRadius:"9px", border:`1px solid ${BDR}`, background:CARD, color:T2, fontFamily:F, fontWeight:600, cursor:"pointer" }}>
                  Hủy
                </button>
                <button style={{ flex:1, padding:"10px", borderRadius:"9px", background:"#EF4444", border:"none", color:"#fff", fontFamily:F, fontWeight:700, cursor:"pointer" }}>
                  Đồng ý xóa
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Placeholder tab ─── */
function PlaceholderTab({ label }:{ label:string }) {
  return (
    <div style={{ textAlign:"center", padding:"60px 20px" }}>
      <div style={{ fontSize:"36px", marginBottom:"12px" }}>🚧</div>
      <h3 style={{ fontWeight:700, fontSize:"1rem", color:T1, marginBottom:"6px", fontFamily:F }}>{label}</h3>
      <p style={{ color:T3, fontSize:"0.875rem", fontFamily:F }}>Mục này sẽ sớm được cập nhật.</p>
    </div>
  );
}

/* ════════════════════════════════════════════════
   SUBSCRIPTION TAB  ← matches reference image exactly
════════════════════════════════════════════════ */
function PlanFeature({ text, color="#374151" }: { text: string; color?: string }) {
  return (
    <li style={{ display:"flex", alignItems:"center", gap:"7px", fontSize:"0.82rem", color }}>
      <Check size={13} color={color === "#374151" ? "#6B7280" : color} strokeWidth={2.5} style={{ flexShrink:0 }}/>
      {text}
    </li>
  );
}

function SubscriptionTab() {
  const PLANS = [
    {
      id:       "free",
      tier:     "Miễn phí",
      price:    "Miễn phí",
      priceSub: null,
      desc:     null,
      accent:   "#6B7280",
      bg:       "#F9FAFB",
      border:   BDR,
      btnBg:    "transparent",
      btnBorder:"#D1D5DB",
      btnColor: "#9CA3AF",
      btnLabel: "Gói hiện tại",
      btnDisabled: true,
      badge:    null,
      features: ["3 lộ trình đang hoạt động","Pomodoro cơ bản","Truy cập cộng đồng"],
    },
    {
      id:       "basic",
      tier:     "Cơ bản",
      price:    "89k",
      priceSub: "đ/mo",
      desc:     null,
      accent:   "#0F766E",
      bg:       "#F0FDFA",
      border:   "rgba(15,118,110,0.18)",
      btnBg:    "#0F766E",
      btnBorder:"#0F766E",
      btnColor: "#FFFFFF",
      btnLabel: "Nâng cấp lên Cơ bản",
      btnDisabled: false,
      badge:    null,
      features: ["Lộ trình không giới hạn","Phân tích nâng cao","Hỗ trợ ưu tiên"],
    },
    {
      id:       "premium",
      tier:     "Cao cấp",
      price:    "199k",
      priceSub: "đ/mo",
      desc:     null,
      accent:   OG,
      bg:       "#FFF7ED",
      border:   "rgba(255,107,0,0.18)",
      btnBg:    OG,
      btnBorder:OG,
      btnColor: "#FFFFFF",
      btnLabel: "Nâng cấp lên Cao cấp",
      btnDisabled: false,
      badge:    "PHỔ BIẾN NHẤT",
      features: ["Toàn bộ tính năng gói Cơ bản","Xuất CV & minh chứng","Mentor kỹ năng AI","Ghép cặp gia sư 1-1"],
    },
  ];

  return (
    <div>
      {/* ─ Current Plan Banner ─ */}
      <div style={{
        display:"flex", alignItems:"center", gap:"12px",
        padding:"14px 16px", borderRadius:"12px",
        background:"#F9FAFB", border:`1px solid ${BDR}`,
        marginBottom:"20px",
      }}>
        <div style={{
          width:"36px", height:"36px", borderRadius:"9px",
          background:"#F3F4F6", border:`1px solid ${BDR}`,
          display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
        }}>
          <Zap size={16} color="#9CA3AF"/>
        </div>
        <div style={{ flex:1 }}>
          <p style={{ fontWeight:700, fontSize:"0.9rem", color:T1, fontFamily:F, lineHeight:1 }}>Gói miễn phí</p>
          <p style={{ fontSize:"0.75rem", color:T3, fontFamily:F, marginTop:"2px" }}>
            0 VND / tháng · Không cần thẻ
          </p>
        </div>
        <div style={{
          padding:"4px 12px", borderRadius:"99px",
          background:"transparent", border:"1.5px solid #10B981",
          display:"flex", alignItems:"center", gap:"5px",
        }}>
          <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:"#10B981" }}/>
          <span style={{ fontSize:"0.75rem", color:"#10B981", fontWeight:700, fontFamily:F }}>Đang hoạt động</span>
            
        </div>
      </div>

      {/* ─ Plans Grid ─ */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"12px" }}>
        {PLANS.map(plan => (
          <motion.div key={plan.id}
            whileHover={!plan.btnDisabled ? { y:-2 } : {}}
            style={{
              background: plan.bg,
              borderRadius:"14px",
              border:`1px solid ${plan.border}`,
              padding:"20px 18px",
              display:"flex", flexDirection:"column",
              boxShadow:"0 1px 4px rgba(0,0,0,0.04)",
              position:"relative", overflow:"hidden",
            }}
          >
            {/* MOST POPULAR badge */}
            {plan.badge && (
              <div style={{
                display:"flex", alignItems:"center", gap:"5px",
                marginBottom:"8px",
              }}>
                <span style={{
                  fontSize:"0.62rem", fontWeight:800, color:OG,
                  letterSpacing:"0.1em", textTransform:"uppercase",
                }}>
                  {plan.badge}
                </span>
                <Crown size={11} color="#FBBF24" fill="#FBBF24"/>
              </div>
            )}

            {/* Title */}
            <p style={{
              fontSize:"1rem", fontWeight:700,
              color: plan.badge ? T1 : plan.accent,
              fontFamily:F, marginBottom:"6px",
              marginTop: plan.badge ? "0" : "18px", // align with others
            }}>
              {plan.tier}
            </p>

            {/* Price */}
            <div style={{ display:"flex", alignItems:"baseline", gap:"2px", marginBottom:"14px" }}>
              <span style={{
                fontSize:"1.8rem", fontWeight:900, letterSpacing:"-0.04em",
                color: plan.id==="free" ? T1 : plan.accent,
              }}>
                {plan.price}
              </span>
              {plan.priceSub && (
                <span style={{ fontSize:"0.75rem", color:T3, marginLeft:"1px" }}>{plan.priceSub}</span>
              )}
            </div>

            {/* Features */}
            <ul style={{
              listStyle:"none", margin:"0 0 auto", padding:0,
              display:"flex", flexDirection:"column", gap:"8px",
              marginBottom:"18px",
            }}>
              {plan.features.map(f => (
                <PlanFeature key={f} text={f} color={plan.id==="free" ? T2 : T1}/>
              ))}
            </ul>

            {/* CTA */}
            <motion.button
              whileHover={!plan.btnDisabled ? { scale:1.02 } : {}}
              whileTap={!plan.btnDisabled ? { scale:0.97 } : {}}
              disabled={plan.btnDisabled}
              style={{
                width:"100%", padding:"11px 0", borderRadius:"10px",
                background: plan.btnBg,
                border:`1.5px solid ${plan.btnBorder}`,
                color: plan.btnColor,
                fontFamily:F, fontWeight:700, fontSize:"0.875rem",
                cursor: plan.btnDisabled ? "default" : "pointer",
                boxShadow: plan.id==="premium" ? "0 4px 14px rgba(255,107,0,0.28)"
                          : plan.id==="basic"   ? "0 4px 14px rgba(15,118,110,0.2)"
                          : "none",
                transition:"all 0.15s",
              }}
            >
              {plan.btnLabel}
            </motion.button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PROFILE PAGE
═══════════════════════════════════════════════ */
export default function Profile() {
  const navigate  = useNavigate();
  const [activeTab, setActiveTab] = useState("account");
  const profile = getStoredUserProfile();

  const LEVEL    = 7;
  const STREAK   = 12;

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.28}} style={{fontFamily:F}}>

      {/* ── Profile Banner ── */}
      <div style={{
        background:CARD, borderRadius:"14px", padding:"20px 24px",
        boxShadow:SH, border:`1px solid ${BDR}`,
        display:"flex", alignItems:"center", gap:"16px",
        marginBottom:"20px",
      }}>
        {/* Avatar */}
        <div style={{
          width:"58px", height:"58px", borderRadius:"50%", flexShrink:0,
          background:"linear-gradient(135deg,#FF6B00,#6366F1)",
          display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:"0 4px 16px rgba(99,102,241,0.3)",
        }}>
          <span style={{ fontSize:"22px", fontWeight:900, color:"#fff" }}>A</span>
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          <h2 style={{
            fontWeight:900, fontSize:"1.1rem", color:T1,
            letterSpacing:"-0.03em", marginBottom:"2px", fontFamily:F,
          }}>
            {profile?.fullName ?? "Nguyễn Văn A"}
          </h2>
          <p style={{ fontSize:"0.82rem", color:T2, marginBottom:"8px", fontFamily:F }}>
            {profile?.email ?? "student@university.edu"} · Kỹ thuật phần mềm · Năm 3 · FPT University
            
          </p>
          <div style={{ display:"flex", gap:"7px", flexWrap:"wrap" }}>
            <span style={{
              fontSize:"0.68rem", padding:"3px 9px", borderRadius:"99px",
              background:"#F3F4F6", color:T2, fontWeight:600,
            }}>Gói miễn phí</span>
            
            <span style={{
              fontSize:"0.68rem", padding:"3px 9px", borderRadius:"99px",
              background:"#FFF9C4", color:"#92400E",
              border:"1px solid #FDE68A", fontWeight:700,
            }}>⭐ Cấp {LEVEL}</span>
            <span style={{
              fontSize:"0.68rem", padding:"3px 9px", borderRadius:"99px",
              background:"#ECFDF5", color:"#065F46",
              border:"1px solid #A7F3D0", fontWeight:700,
            }}>🔥 Chuỗi {STREAK} ngày</span>
            
          </div>
        </div>

        <motion.button
          whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
          style={{
            display:"flex", alignItems:"center", gap:"6px",
            padding:"9px 18px", borderRadius:"10px",
            background:OG, color:"#fff", border:"none", cursor:"pointer",
            fontFamily:F, fontWeight:700, fontSize:"0.82rem", flexShrink:0,
            boxShadow:"0 4px 14px rgba(255,107,0,0.32)",
          }}
        >
          <Gift size={13}/> Giới thiệu bạn bè &amp; nhận Premium
        </motion.button>
      </div>

      {/* ── Two-column: sub-nav + form ── */}
      <div style={{ display:"grid", gridTemplateColumns:"200px 1fr", gap:"16px", alignItems:"start" }}>

        {/* Left sub-nav */}
        <div style={{
          background:CARD, borderRadius:"14px", padding:"12px 8px",
          boxShadow:SH, border:`1px solid ${BDR}`,
        }}>
          <p style={{
            fontSize:"0.62rem", color:T3, fontWeight:700,
            letterSpacing:"0.14em", textTransform:"uppercase",
            padding:"6px 10px 8px", fontFamily:F,
          }}>Cài đặt</p>

          {TABS.map(tab=>{
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id}
                onClick={()=>setActiveTab(tab.id)}
                style={{
                  display:"flex", alignItems:"center", gap:"9px",
                  width:"100%", padding:"9px 10px", borderRadius:"8px",
                  background: isActive ? OGL : "transparent",
                  border:"none", cursor:"pointer",
                  color: isActive ? OG : T2,
                  fontFamily:F, fontWeight: isActive ? 700 : 400,
                  fontSize:"0.848rem", transition:"all 0.12s",
                  textAlign:"left",
                }}
                onMouseEnter={e=>{if(!isActive)(e.currentTarget as HTMLButtonElement).style.background="#F9FAFB";}}
                onMouseLeave={e=>{if(!isActive)(e.currentTarget as HTMLButtonElement).style.background="transparent";}}
              >
                <tab.icon size={14} color={isActive ? OG : T3} strokeWidth={isActive?2.2:1.8}/>
                <span style={{ flex:1 }}>{tab.label}</span>
                {isActive && <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:OG }}/>}
              </button>
            );
          })}

          <div style={{ height:"1px", background:BDR, margin:"8px 6px" }}/>

          <button
            onClick={()=>navigate("/auth")}
            style={{
              display:"flex", alignItems:"center", gap:"9px",
              width:"100%", padding:"9px 10px", borderRadius:"8px",
              background:"transparent", border:"none", cursor:"pointer",
              color:"#EF4444", fontFamily:F, fontWeight:500, fontSize:"0.848rem",
              textAlign:"left", transition:"background 0.12s",
            }}
            onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="#FFF1F2";}}
            onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="transparent";}}
          >
            <LogOut size={14} color="#EF4444" strokeWidth={1.8}/>
            Đăng xuất
          </button>
        </div>

        {/* Right form content */}
        <div style={{
          background:CARD, borderRadius:"14px", padding:"24px",
          boxShadow:SH, border:`1px solid ${BDR}`,
        }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}
              exit={{opacity:0,y:-6}}
              transition={{duration:0.2}}
            >
              {activeTab === "account"       && <AccountTab/>}
              {activeTab === "subscription"  && <SubscriptionTab/>}
              {activeTab !== "account" && activeTab !== "subscription" && (
                <PlaceholderTab label={TABS.find(t=>t.id===activeTab)?.label ?? "Cài đặt"}/>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
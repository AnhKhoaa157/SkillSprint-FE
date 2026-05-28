import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { RegistrationSuccessModal } from "../components/RegistrationSuccessModal";
import { BrandLogo } from "../components/BrandLogo";
import { login, register, requestPasswordReset } from "../../api/authService";

/* ─── Tokens ─── */
const F   = "'Inter','Plus Jakarta Sans',sans-serif";
const OG  = "#FF6B00";
const BDR = "#E5E7EB";

/* ─── Google SVG ─── */
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  );
}

/* ─── Input field ─── */
function Field({
  label, type="text", placeholder, icon: Icon, value, onChange,
  right, error,
}: {
  label: string; type?: string; placeholder: string;
  icon: React.ElementType; value: string;
  onChange: (v:string)=>void; right?: React.ReactNode; error?: string;
}) {
  return (
    <div style={{marginBottom:"20px"}}>
      <label style={{display:"block",fontSize:"0.85rem",fontWeight:600,color:"#374151",marginBottom:"8px",fontFamily:F}}>
        {label}
      </label>
      <div style={{position:"relative",display:"flex",alignItems:"center"}}>
        <Icon size={18} color="#9CA3AF" style={{position:"absolute",left:"14px",pointerEvents:"none",zIndex:1}}/>
        <input
          type={type} value={value} onChange={e=>onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width:"100%",padding:"13px 44px 13px 42px",
            border:`1.5px solid ${error?"#EF4444":"#E5E7EB"}`,
            borderRadius:"12px",fontSize:"0.95rem",
            fontFamily:F,color:"#111827",background:"#FFFFFF",outline:"none",
            transition:"all 0.2s ease",boxSizing:"border-box",
            boxShadow:"0 1px 2px rgba(0,0,0,0.02)",
          }}
          onFocus={e=>{
            e.target.style.borderColor=OG;
            e.target.style.boxShadow=`0 0 0 4px rgba(255,107,0,0.1)`;
          }}
          onBlur={e=>{
            e.target.style.borderColor=error?"#EF4444":"#E5E7EB";
            e.target.style.boxShadow="0 1px 2px rgba(0,0,0,0.02)";
          }}
        />
        {right && (
          <div style={{position:"absolute",right:"14px",cursor:"pointer"}}>{right}</div>
        )}
      </div>
      {error && <p style={{fontSize:"0.75rem",color:"#EF4444",marginTop:"6px",fontFamily:F}}>{error}</p>}
    </div>
  );
}

/* ─── Feature list ─── */
const FEATURES = [
  "Lộ trình học cá nhân hóa bằng AI",
  "Phân tích khoảng trống kỹ năng theo thời gian thực",
  "Tối ưu hồ sơ nghề nghiệp và xuất portfolio",
  "Mô phỏng phỏng vấn thử bằng AI",
];

const TESTIMONIAL = {
  stars: 5,
  text: '"Trước đây mình mất hàng giờ để chọn học gì trước. SkillSprint cho mình lộ trình rõ ràng và mình đã có internship tại VNG chỉ sau 3 tháng."',
  name: "Linh Tran",
  role: "CS @ RMIT Vietnam",
  avatar: "L",
};

/* ═══════════════════════════════════════════
   LEFT PANEL (REDESIGNED: BRIGHT & CLEAN)
═══════════════════════════════════════════ */
function LeftPanel() {
  return (
    <div className="hidden lg:flex" style={{
      width:"28%", minWidth:"300px", maxWidth:"380px",
      background:"#FAFAFA", // Light beautiful gray/white
      borderRight:`1px solid ${BDR}`,
      flexDirection:"column", padding:"48px 32px",
      position:"relative", overflow:"hidden", flexShrink:0,
    }}>
      {/* Subtle organic orange glow */}
      <div style={{
        position:"absolute", top:"-100px", right:"-100px",
        width:"400px", height:"400px", borderRadius:"50%",
        background:"radial-gradient(circle, rgba(255,107,0,0.07), transparent 70%)",
        pointerEvents:"none",
      }}/>
      <div style={{
        position:"absolute", bottom:"-80px", left:"-80px",
        width:"350px", height:"350px", borderRadius:"50%",
        background:"radial-gradient(circle, rgba(255,107,0,0.05), transparent 70%)",
        pointerEvents:"none",
      }}/>

      {/* Logo */}
      <BrandLogo size={36} textColor="#111827" textSize="1.15rem" className="mb-10" align="left"/>

      {/* Badge */}
      <div style={{
        display:"inline-flex",alignItems:"center",gap:"8px",
        padding:"6px 16px",borderRadius:"99px",
        background:"#FFF7ED",border:"1px solid #FFEDD5",
        marginBottom:"32px",width:"fit-content",
      }}>
        <div style={{width:"6px",height:"6px",borderRadius:"50%",background:OG}}/>
        <span style={{fontSize:"0.8rem",color:OG,fontWeight:700,fontFamily:F}}>
          Dự án sinh viên (Bản thử nghiệm Beta)
        </span>
      </div>

      {/* Headline */}
      <h1 style={{
        fontSize:"2.2rem",fontWeight:900,lineHeight:1.15,
        letterSpacing:"-0.03em",marginBottom:"16px",fontFamily:F,
      }}>
        <span style={{color:"#111827"}}>Đừng để kiến thức làm bạn </span>
        <span style={{color:OG}}>quá tải.</span>
      </h1>
      <p style={{fontSize:"0.95rem",color:"#6B7280",lineHeight:1.65,marginBottom:"40px",fontFamily:F}}>
        Ứng dụng được tạo ra bởi sinh viên, dành cho sinh viên. Giúp bạn gom nhóm kiến thức, biết mình thiếu gì và cần học gì tiếp theo.
      </p>

      {/* Features */}
      <div style={{display:"flex",flexDirection:"column",gap:"16px",marginBottom:"auto"}}>
        {[
          "Học đến đâu, gạch đầu dòng đến đó",
          "Phát hiện những phần kiến thức bị hổng",
          "Mô phỏng phỏng vấn để luyện phản xạ",
          "Tổng hợp lại hồ sơ học tập cực xịn",
        ].map(f => (
          <div key={f} style={{display:"flex",alignItems:"flex-start",gap:"12px"}}>
            <div style={{
              width:"24px",height:"24px",borderRadius:"50%",
              background:"#FFF7ED",border:"1px solid #FFEDD5",
              display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:"2px",
            }}>
              <Check size={12} color={OG} strokeWidth={3}/>
            </div>
            <span style={{fontSize:"0.9rem",color:"#4B5563",lineHeight:1.5,fontFamily:F}}>{f}</span>
          </div>
        ))}
      </div>

      {/* Dev Team Message instead of Fake Testimonial */}
      <div style={{
        marginTop:"32px",padding:"20px",borderRadius:"16px",
        background:"#FFFFFF",border:"1px solid #F3F4F6",
        boxShadow:"0 4px 24px rgba(0,0,0,0.03)",
      }}>
        <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"12px"}}>
          <div style={{width:"8px",height:"8px",borderRadius:"50%",background:"#10B981"}}/>
          <span style={{fontSize:"0.8rem",fontWeight:700,color:"#111827",fontFamily:F,letterSpacing:"0.02em"}}>
            LỜI NHẮN TỪ TEAM DEV 💻
          </span>
        </div>
        <p style={{
          fontSize:"0.9rem",color:"#4B5563",lineHeight:1.65,
          marginBottom:"0",fontFamily:F,
        }}>
          "Tụi mình hiểu cảm giác hoang mang khi đứng trước núi tài liệu. SkillSprint được sinh ra không phải để 'hack' não, mà chỉ đơn giản là một công cụ giúp chúng ta đi từng bước vững chắc hơn."
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   RESET PASSWORD MODAL
═══════════════════════════════════════════ */
function ResetPassword({ onBack, onSubmit }: { onBack:()=>void; onSubmit:(email: string) => Promise<{ sent: boolean; email: string }>; }) {
  const [email, setEmail] = useState("");
  const [sent, setSent]   = useState(false);
  return (
    <div style={{
      position:"fixed",inset:0,zIndex:50,
      background:"rgba(243,244,246,0.9)", backdropFilter:"blur(12px)",
      display:"flex",alignItems:"center",justifyContent:"center",
    }}>
      <motion.div
        initial={{opacity:0,scale:0.94,y:12}}
        animate={{opacity:1,scale:1,y:0}}
        style={{
          background:"#FFFFFF",borderRadius:"24px",padding:"48px",
          width:"100%",maxWidth:"480px",
          border:"1px solid #E5E7EB",
          boxShadow:"0 20px 80px rgba(0,0,0,0.08)",
          margin:"16px",
        }}
      >
        {/* Logo */}
        <BrandLogo size={36} textColor="#111827" textSize="1.1rem" className="mb-8" align="left"/>

        {!sent ? (
          <>
            <h2 style={{fontWeight:900,fontSize:"1.6rem",color:"#111827",letterSpacing:"-0.03em",marginBottom:"10px",fontFamily:F}}>Quên mật khẩu</h2>
            <p style={{fontSize:"0.95rem",color:"#6B7280",marginBottom:"32px",lineHeight:1.6,fontFamily:F}}>
              Nhập email trường học để nhận liên kết đặt lại mật khẩu an toàn.
            </p>
            <Field label="Email trường học" placeholder="student@university.edu"
              icon={Mail} value={email} onChange={setEmail}/>
            <motion.button
              whileHover={{scale:1.02}} whileTap={{scale:0.98}}
              onClick={async()=>{ await onSubmit(email); setSent(true); }}
              style={{
                width:"100%",padding:"15px",borderRadius:"12px",
                background:OG,color:"#fff",border:"none",cursor:"pointer",
                fontFamily:F,fontWeight:700,fontSize:"1rem",
                boxShadow:"0 8px 24px rgba(255,107,0,0.3)",marginBottom:"20px",marginTop:"10px",
              }}
            >
              Gửi liên kết đặt lại
            </motion.button>
            <button onClick={onBack}
              style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"6px",background:"none",border:"none",cursor:"pointer",color:"#6B7280",fontFamily:F,fontSize:"0.9rem",width:"100%"}}>
              <ArrowLeft size={16}/> Quay về đăng nhập
            </button>
          </>
        ) : (
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} style={{textAlign:"center"}}>
            <div style={{width:"64px",height:"64px",borderRadius:"50%",background:"#ECFDF5",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
              <Check size={32} color="#059669" strokeWidth={3}/>
            </div>
            <h2 style={{fontWeight:900,fontSize:"1.5rem",color:"#111827",fontFamily:F,marginBottom:"10px"}}>Kiểm tra email của bạn</h2>
            <p style={{fontSize:"0.95rem",color:"#6B7280",lineHeight:1.65,fontFamily:F,marginBottom:"32px"}}>
              Liên kết đặt lại đã được gửi đến <strong>{email}</strong>. Vui lòng kiểm tra hộp thư.
            </p>
            <button onClick={onBack}
              style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"6px",background:"none",border:"none",cursor:"pointer",color:OG,fontFamily:F,fontSize:"0.95rem",fontWeight:700,width:"100%"}}>
              <ArrowLeft size={16}/> Quay về đăng nhập
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN AUTH PAGE
═══════════════════════════════════════════ */
export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tab,       setTab]     = useState<"signin"|"signup">("signin");
  const [showReset, setShowReset] = useState(false);
  const [showPw,    setShowPw]  = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  /* form state */
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");

  const isSignup = tab === "signup";
  const params = new URLSearchParams(location.search);
  const redirectPath = params.get("redirect") || "";
  const redirectPlan = params.get("plan") || "";
  const redirectTarget = redirectPath === "/pricing"
    ? `${redirectPath}${redirectPlan ? `?plan=${redirectPlan}` : ""}`
    : "/app";

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");
    if (mode === "register") setTab("signup");
    if (mode === "login") setTab("signin");
  }, [location.search]);

  const handleSubmit = () => {
    if (isSignup) {
      void register({ fullName: name, email, password }).then(() => setShowSuccess(true));
    } else {
      void login({ email, password }).then(() => navigate(redirectTarget));
    }
  };

  return (
    <div style={{
      minHeight:"100vh", display:"flex",
      fontFamily:F, background:"#FFFFFF",
    }}>
      {/* ── Left light panel (redesigned) ── */}
      <LeftPanel/>

      {/* ── Right white panel ── */}
      <div style={{
        flex:1, display:"flex", flexDirection:"column",
        background:"#FFFFFF", overflowY:"auto",
      }}>
        {/* Top bar */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"24px 40px",
        }}>
          <Link to="/" style={{
            display:"flex",alignItems:"center",gap:"8px",
            fontSize:"0.9rem",fontWeight:500,color:"#6B7280",textDecoration:"none",fontFamily:F,
            transition:"color 0.2s"
          }}
          onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.color="#111827";}}
          onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.color="#6B7280";}}>
            <ArrowLeft size={16}/>
            Về trang chủ
          </Link>
          <div className="lg:hidden">
             <BrandLogo size={28} textColor="#111827" textSize="0.95rem" align="left"/>
          </div>
        </div>

        {/* Form content */}
        <div style={{
          flex:1, display:"flex", alignItems:"center", justifyContent:"center",
          padding:"20px 40px 60px",
        }}>
          <div style={{width:"100%",maxWidth:"420px"}}>
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
                exit={{opacity:0,y:-12}}
                transition={{duration:0.25, ease:[0.16,1,0.3,1]}}
              >
                {/* Heading */}
                <div style={{textAlign:"center", marginBottom:"36px"}}>
                  <h2 style={{
                    fontWeight:900, fontSize:"2.2rem",
                    letterSpacing:"-0.04em", color:"#111827",
                    marginBottom:"8px", fontFamily:F, lineHeight:1.2,
                  }}>
                    {isSignup ? "Tạo tài khoản mới ✨" : "Chào mừng trở lại 👋"}
                  </h2>
                  <p style={{fontSize:"1rem",color:"#8A94A6",fontFamily:F,margin:0}}>
                    {isSignup
                      ? "Tham gia cùng các bạn sinh viên đang bứt phá."
                      : "Đăng nhập để tiếp tục hành trình học tập"}
                  </p>
                </div>

                {/* Google button */}
                <button
                  style={{
                    width:"100%",padding:"13px",borderRadius:"12px",
                    border:"1.5px solid #E5E7EB",background:"#FFFFFF",
                    display:"flex",alignItems:"center",justifyContent:"center",gap:"12px",
                    cursor:"pointer",fontSize:"0.95rem",fontWeight:600,
                    color:"#374151",fontFamily:F,
                    boxShadow:"0 2px 6px rgba(0,0,0,0.02)",
                    transition:"all 0.2s ease",marginBottom:"24px",
                  }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="#F9FAFB";(e.currentTarget as HTMLButtonElement).style.borderColor="#D1D5DB";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="#FFFFFF";(e.currentTarget as HTMLButtonElement).style.borderColor="#E5E7EB";}}
                >
                  <GoogleIcon/>
                  Tiếp tục với Google
                </button>

                {/* Divider */}
                <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"24px"}}>
                  <div style={{flex:1,height:"1px",background:"#E5E7EB"}}/>
                  <span style={{fontSize:"0.8rem",color:"#9CA3AF",fontFamily:F,fontWeight:500}}>hoặc tiếp tục với email</span>
                  <div style={{flex:1,height:"1px",background:"#E5E7EB"}}/>
                </div>

                {/* Fields */}
                {isSignup && (
                  <Field label="Họ và tên" placeholder="Nguyễn Văn A"
                    icon={User} value={name} onChange={setName}/>
                )}
                <Field label="Địa chỉ email" type="email" placeholder="student@university.edu"
                  icon={Mail} value={email} onChange={setEmail}/>
                <div style={{marginBottom:"28px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}>
                    <label style={{fontSize:"0.85rem",fontWeight:600,color:"#374151",fontFamily:F}}>Mật khẩu</label>
                    {!isSignup && (
                      <button onClick={()=>setShowReset(true)}
                        style={{fontSize:"0.85rem",color:OG,background:"none",border:"none",cursor:"pointer",fontFamily:F,fontWeight:600,padding:0}}>
                        Quên mật khẩu?
                      </button>
                    )}
                  </div>
                  <div style={{position:"relative",display:"flex",alignItems:"center"}}>
                    <Lock size={18} color="#9CA3AF" style={{position:"absolute",left:"14px",zIndex:1}}/>
                    <input
                      type={showPw?"text":"password"} value={password}
                      onChange={e=>setPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{
                        width:"100%",padding:"13px 44px 13px 42px",
                        border:"1.5px solid #E5E7EB",borderRadius:"12px",
                        fontSize:"0.95rem",fontFamily:F,color:"#111827",
                        background:"#FFFFFF",outline:"none",boxSizing:"border-box",
                        transition:"all 0.2s ease",
                        boxShadow:"0 1px 2px rgba(0,0,0,0.02)",
                      }}
                      onFocus={e=>{
                        e.target.style.borderColor=OG;
                        e.target.style.boxShadow=`0 0 0 4px rgba(255,107,0,0.1)`;
                      }}
                      onBlur={e=>{
                        e.target.style.borderColor="#E5E7EB";
                        e.target.style.boxShadow="0 1px 2px rgba(0,0,0,0.02)";
                      }}
                    />
                    <button onClick={()=>setShowPw(v=>!v)}
                      style={{position:"absolute",right:"14px",background:"none",border:"none",cursor:"pointer",color:"#9CA3AF",padding:0}}>
                      {showPw ? <EyeOff size={18}/> : <Eye size={18}/>}
                    </button>
                  </div>
                </div>

                {/* CTA */}
                <motion.button
                  whileHover={{scale:1.02}} whileTap={{scale:0.98}}
                  onClick={handleSubmit}
                  style={{
                    width:"100%",padding:"16px",borderRadius:"12px",
                    background:`linear-gradient(135deg, ${OG}, #FF8C3A)`,
                    color:"#fff",border:"none",cursor:"pointer",
                    fontFamily:F,fontWeight:700,fontSize:"1.05rem",
                    display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",
                    boxShadow:"0 8px 24px rgba(255,107,0,0.3)",
                    marginBottom:"20px",
                  }}
                >
                  {isSignup ? "Tạo tài khoản" : "Đăng nhập"}
                  <ArrowRight size={18}/>
                </motion.button>

                {/* Start for free note */}
                {isSignup && (
                  <p style={{textAlign:"center",fontSize:"0.85rem",color:"#9CA3AF",fontFamily:F,marginBottom:"16px"}}>
                    Bắt đầu miễn phí. Không cần thẻ tín dụng.
                  </p>
                )}

                {/* Switch mode */}
                <p style={{textAlign:"center",fontSize:"0.95rem",color:"#6B7280",fontFamily:F,marginBottom:"32px"}}>
                  {isSignup ? (
                    <>Đã có tài khoản?{" "}
                      <button onClick={()=>setTab("signin")} style={{color:OG,fontWeight:700,background:"none",border:"none",cursor:"pointer",fontFamily:F,fontSize:"0.95rem"}}>
                        Đăng nhập
                      </button>
                    </>
                  ) : (
                    <>Chưa có tài khoản?{" "}
                      <button onClick={()=>setTab("signup")} style={{color:OG,fontWeight:700,background:"none",border:"none",cursor:"pointer",fontFamily:F,fontSize:"0.95rem"}}>
                        Đăng ký miễn phí
                      </button>
                    </>
                  )}
                </p>

                {/* Admin link */}
                <p style={{textAlign:"center",marginTop:"40px",fontSize:"0.8rem",color:"#9CA3AF",fontFamily:F}}>
                  <Link to="/admin-login" style={{color:"#9CA3AF",textDecoration:"none",transition:"color 0.2s"}} onMouseEnter={e=>{(e.target as HTMLAnchorElement).style.color="#6B7280"}} onMouseLeave={e=>{(e.target as HTMLAnchorElement).style.color="#9CA3AF"}}>Đăng nhập cho đối tác trường ĐH</Link>
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Reset password overlay */}
      <AnimatePresence>
        {showReset && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <ResetPassword onBack={()=>setShowReset(false)} onSubmit={requestPasswordReset}/>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Registration success modal */}
      <RegistrationSuccessModal
        open={showSuccess}
        onStartSetup={() => {
          setShowSuccess(false);
          window.localStorage.setItem("ss_user_logged_in", "true");
          if (redirectPath === "/pricing") {
            navigate(redirectTarget);
            return;
          }
          navigate("/onboarding");
        }}
        onSkip={() => {
          setShowSuccess(false);
          window.localStorage.setItem("ss_user_logged_in", "true");
          navigate(redirectTarget);
        }}
      />
    </div>
  );
}
import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { RegistrationSuccessModal } from "../../components/modals/RegistrationSuccessModal";
import { BrandLogo } from "../../components/layout/BrandLogo";
import { completeNewPassword, confirmForgotPassword, confirmRegister, forgotPassword, isAdminRole, login, register, resendConfirmationCode, storeAuthTokens, getPostLoginPath } from "../../../api/authService";

/* ─── Tokens ─── */
const F   = "'Inter','Plus Jakarta Sans',sans-serif";
const OG  = "#FF6B00";
const NAV = "#0B1220";
const NAV2= "#111827";

/* ─── Google SVG ─── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
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
    <div className="mb-5">
      <label className="block text-xs font-semibold text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative flex items-center">
        <Icon size={15} color="#9CA3AF" className="absolute left-3 pointer-events-none z-10"/>
        <input
          type={type} value={value} onChange={e=>onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-10 py-3 text-sm rounded-lg font-[${F}] outline-none transition-all duration-200 ${
            error 
              ? 'border-1.5 border-red-500 focus:border-red-500' 
              : 'border-1.5 border-gray-200 focus:border-orange-500'
          } focus:ring-2 focus:ring-orange-100`}
          onFocus={e=>{
            e.currentTarget.style.boxShadow="0 0 0 3px rgba(255,107,0,0.1)";
          }}
          onBlur={e=>{
            e.currentTarget.style.boxShadow="none";
          }}
        />
        {right && (
          <div className="absolute right-3 cursor-pointer">{right}</div>
        )}
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

/* ─── Feature list ─── */
const FEATURES = [
  "Lộ trình học cá nhân hóa bằng AI",
  "Phân tích khoảng trống kỹ năng theo thời gian thực",
  "Tối ưu hồ sơ nghề nghiệp và xuất portfolio",
  "Hỗ trợ nâng cao hồ sơ nghề nghiệp",
];

const TESTIMONIAL = {
  stars: 5,
  text: '"Trước đây mình mất hàng giờ để chọn học gì trước. SkillSprint cho mình lộ trình rõ ràng và mình đã có internship tại VNG chỉ sau 3 tháng."',
  name: "Linh Tran",
  role: "CS @ RMIT Vietnam",
  avatar: "L",
};

/* ═══════════════════════════════════════════
   LEFT PANEL
═══════════════════════════════════════════ */
function LeftPanel() {
  const aiImage = ((import.meta as any).env?.VITE_LEFT_PANEL_IMAGE as string | undefined) || "/assets/left-ai-3.svg";

  return (
    <div
      className="w-[40%] flex flex-col px-16 py-12 relative overflow-hidden flex-shrink-0"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(11,18,32,0.86), rgba(3,7,18,0.6)), url(${aiImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Subtle glow effects */}
      <div className="absolute -top-20 -right-16 w-56 h-56 rounded-full bg-gradient-to-b from-orange-500/15 to-transparent opacity-50 pointer-events-none blur-3xl"/>
      <div className="absolute -bottom-10 -left-10 w-52 h-52 rounded-full bg-gradient-to-t from-indigo-500/12 to-transparent opacity-50 pointer-events-none blur-3xl"/>

      {/* Logo */}
      <BrandLogo size={32} textColor="#FFFFFF" textSize="0.95rem" className="mb-7"/>

      {/* Badge */}
      <div style={{
        display:"inline-flex",alignItems:"center",gap:"5px",
        padding:"4px 10px",borderRadius:"99px",
        background:"rgba(255,107,0,0.15)",border:"1px solid rgba(255,107,0,0.3)",
        marginBottom:"20px",width:"fit-content",
      }}>
        <div style={{width:"5px",height:"5px",borderRadius:"50%",background:OG}}/>
        <span style={{fontSize:"0.7rem",color:OG,fontWeight:700,fontFamily:F}}>
          30.000+ sinh viên đang tăng tốc
        </span>
      </div>

      {/* Headline */}
      <h1 style={{
        fontSize:"1.6rem",fontWeight:900,lineHeight:1.2,
        letterSpacing:"-0.03em",marginBottom:"12px",fontFamily:F,
      }}>
        <span style={{color:"#FFFFFF"}}>Biến kỹ năng của bạn thành </span>
        <span style={{color:OG}}>cơ hội nghề nghiệp.</span>
      </h1>
      <p style={{fontSize:"0.78rem",color:"#94A3B8",lineHeight:1.65,marginBottom:"24px",fontFamily:F}}>
        Nền tảng định hướng nghề nghiệp AI dành cho sinh viên Việt Nam. Cá nhân hóa lộ trình, tập trung vào kết quả thực tế.
      </p>

      {/* Features */}
      <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"auto"}}>
        {FEATURES.map(f => (
          <div key={f} style={{display:"flex",alignItems:"flex-start",gap:"9px"}}>
            <div style={{
              width:"18px",height:"18px",borderRadius:"50%",
              background:"rgba(255,107,0,0.15)",border:"1px solid rgba(255,107,0,0.3)",
              display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:"1px",
            }}>
              <Check size={10} color={OG} strokeWidth={3}/>
            </div>
            <span style={{fontSize:"0.78rem",color:"#CBD5E1",lineHeight:1.5,fontFamily:F}}>{f}</span>
          </div>
        ))}
      </div>

      {/* Testimonial */}
      <div style={{
        marginTop:"28px",padding:"16px",borderRadius:"12px",
        background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",
      }}>
        <div style={{display:"flex",gap:"2px",marginBottom:"10px"}}>
          {Array.from({length:TESTIMONIAL.stars}).map((_,i)=>(
            <span key={i} style={{color:"#FBBF24",fontSize:"11px"}}>★</span>
          ))}
        </div>
        <p style={{
          fontSize:"0.75rem",color:"#CBD5E1",lineHeight:1.65,
          fontStyle:"italic",marginBottom:"12px",fontFamily:F,
        }}>
          {TESTIMONIAL.text}
        </p>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <div style={{
            width:"28px",height:"28px",borderRadius:"50%",
            background:"linear-gradient(135deg,#FF6B00,#FF9A3D)",
            display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
          }}>
            <span style={{fontSize:"11px",fontWeight:800,color:"#fff"}}>{TESTIMONIAL.avatar}</span>
          </div>
          <div>
            <p style={{fontSize:"0.75rem",fontWeight:700,color:"#FFFFFF",fontFamily:F,lineHeight:1}}>{TESTIMONIAL.name}</p>
            <p style={{fontSize:"0.68rem",color:"#94A3B8",fontFamily:F}}>{TESTIMONIAL.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   RESET PASSWORD MODAL
═══════════════════════════════════════════ */
function ResetPassword({ onBack }: { onBack:()=>void }) {
  const [email, setEmail] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<"request" | "confirm">("request");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const handleSendCode = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Vui lòng nhập email.");
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");

    try {
      await forgotPassword(normalizedEmail);
      setStep("confirm");
      setNotice("Mã xác nhận đã được gửi tới email của bạn.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Không thể gửi mã xác nhận.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!confirmationCode || !newPassword || !confirmPassword) {
      setError("Vui lòng nhập mã xác nhận và mật khẩu mới.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await confirmForgotPassword(normalizedEmail, confirmationCode.trim(), newPassword);
      onBack();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Không thể đặt lại mật khẩu.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={{
      position:"fixed",inset:0,zIndex:50,
      background:"#F3F4F6",
      display:"flex",alignItems:"center",justifyContent:"center",
    }}>
      <motion.div
        initial={{opacity:0,scale:0.94,y:12}}
        animate={{opacity:1,scale:1,y:0}}
        style={{
          background:"#FFFFFF",borderRadius:"16px",padding:"36px 40px",
          width:"100%",maxWidth:"440px",
          boxShadow:"0 4px 6px rgba(0,0,0,0.05), 0 20px 60px rgba(0,0,0,0.12)",
          margin:"16px",
        }}
      >
        {/* Logo */}
        <BrandLogo size={32} textSize="0.9rem" className="mb-6"/>

        {step === "request" ? (
          <>
            <h2 style={{fontWeight:900,fontSize:"1.5rem",color:"#111827",letterSpacing:"-0.03em",marginBottom:"6px",fontFamily:F}}>Quên mật khẩu</h2>
            <p style={{fontSize:"0.85rem",color:"#6B7280",marginBottom:"24px",lineHeight:1.6,fontFamily:F}}>
              Nhập email trường học để nhận mã đặt lại mật khẩu an toàn.
            </p>
            <Field label="Email trường học" placeholder="student@gmail.com"
              icon={Mail} value={email} onChange={setEmail}/>
            {error && <p style={{fontSize:"0.72rem",color:"#EF4444",marginBottom:"12px",fontFamily:F}}>{error}</p>}
            <motion.button
              whileHover={{scale:1.02}} whileTap={{scale:0.98}}
              onClick={handleSendCode}
              disabled={loading}
              style={{
                width:"100%",padding:"13px",borderRadius:"10px",
                background: loading ? "#FDBA74" : OG,color:"#fff",border:"none",cursor: loading ? "not-allowed" : "pointer",
                fontFamily:F,fontWeight:700,fontSize:"0.95rem",
                boxShadow:"0 4px 16px rgba(255,107,0,0.35)",marginBottom:"14px",
              }}
            >
              {loading ? "Đang gửi..." : "Gửi mã đặt lại"}
            </motion.button>
            <button onClick={onBack}
              style={{display:"flex",alignItems:"center",gap:"4px",background:"none",border:"none",cursor:"pointer",color:"#6B7280",fontFamily:F,fontSize:"0.82rem",margin:"0 auto"}}>
              <ArrowLeft size={13}/> Quay về đăng nhập
            </button>
          </>
        ) : (
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} style={{textAlign:"center"}}>
            <div style={{width:"52px",height:"52px",borderRadius:"50%",background:"#ECFDF5",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
              <Check size={24} color="#059669" strokeWidth={3}/>
            </div>
            <h2 style={{fontWeight:900,fontSize:"1.3rem",color:"#111827",fontFamily:F,marginBottom:"6px"}}>Nhập mã xác nhận</h2>
            <p style={{fontSize:"0.85rem",color:"#6B7280",lineHeight:1.65,fontFamily:F,marginBottom:"16px"}}>
              {notice || <>Mã đặt lại đã được gửi đến <strong>{email}</strong>. Vui lòng nhập mã và mật khẩu mới.</>}
            </p>
            <Field label="Mã xác nhận" placeholder="123456" icon={Check} value={confirmationCode} onChange={setConfirmationCode}/>
            <Field label="Mật khẩu mới" type="password" placeholder="Tối thiểu 8 ký tự" icon={Lock} value={newPassword} onChange={setNewPassword}/>
            <Field label="Xác nhận mật khẩu" type="password" placeholder="Nhập lại mật khẩu mới" icon={Lock} value={confirmPassword} onChange={setConfirmPassword} error={error}/>
            {error && !confirmPassword && <p style={{fontSize:"0.72rem",color:"#EF4444",marginTop:"-8px",marginBottom:"12px",fontFamily:F}}>{error}</p>}
            <motion.button
              whileHover={{scale:1.02}} whileTap={{scale:0.98}}
              onClick={handleConfirmReset}
              disabled={loading}
              style={{
                width:"100%",padding:"13px",borderRadius:"10px",
                background: loading ? "#FDBA74" : OG,color:"#fff",border:"none",cursor: loading ? "not-allowed" : "pointer",
                fontFamily:F,fontWeight:700,fontSize:"0.95rem",
                boxShadow:"0 4px 16px rgba(255,107,0,0.35)",marginBottom:"14px",
              }}
            >
              {loading ? "Đang cập nhật..." : "Đặt lại mật khẩu"}
            </motion.button>
            <button onClick={onBack}
              style={{display:"flex",alignItems:"center",gap:"4px",background:"none",border:"none",cursor:"pointer",color:OG,fontFamily:F,fontSize:"0.85rem",fontWeight:600,margin:"0 auto"}}>
              <ArrowLeft size={13}/> Quay về đăng nhập
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

function NewPasswordRequiredModal({
  email,
  session,
  onBack,
  onSuccess,
}: {
  email: string;
  session: string;
  onBack: () => void;
  onSuccess: (role: string | null) => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!newPassword || !confirmPassword) {
      setError("Vui lòng nhập mật khẩu mới và xác nhận mật khẩu.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const tokens = await completeNewPassword(email, newPassword, session);

      if (isAdminRole(tokens.role)) {
        setError("Tài khoản quản trị không thể đăng nhập ở cổng Learner. Vui lòng dùng cổng Admin.");
        return;
      }

      storeAuthTokens(tokens);
      onSuccess(tokens.role);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Không thể hoàn tất đổi mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position:"fixed",inset:0,zIndex:60,
      background:"rgba(11,18,32,0.42)",
      display:"flex",alignItems:"center",justifyContent:"center",
      padding:"16px",
    }}>
      <motion.div
        initial={{opacity:0,scale:0.94,y:12}}
        animate={{opacity:1,scale:1,y:0}}
        style={{
          background:"#FFFFFF",borderRadius:"16px",padding:"36px 40px",
          width:"100%",maxWidth:"460px",
          boxShadow:"0 4px 6px rgba(0,0,0,0.05), 0 20px 60px rgba(0,0,0,0.18)",
        }}
      >
        <BrandLogo size={32} textSize="0.9rem" className="mb-6"/>
        <h2 style={{fontWeight:900,fontSize:"1.45rem",color:"#111827",letterSpacing:"-0.03em",marginBottom:"6px",fontFamily:F}}>
          Đặt mật khẩu mới
        </h2>
        <p style={{fontSize:"0.85rem",color:"#6B7280",marginBottom:"20px",lineHeight:1.6,fontFamily:F}}>
          Tài khoản <strong>{email}</strong> cần đặt mật khẩu mới để hoàn tất đăng nhập.
        </p>

        <Field
          label="Mật khẩu mới"
          type="password"
          placeholder="Tối thiểu 8 ký tự"
          icon={Lock}
          value={newPassword}
          onChange={setNewPassword}
        />
        <Field
          label="Xác nhận mật khẩu"
          type="password"
          placeholder="Nhập lại mật khẩu mới"
          icon={Lock}
          value={confirmPassword}
          onChange={setConfirmPassword}
          error={error}
        />

        {error && !confirmPassword && (
          <p style={{fontSize:"0.72rem",color:"#EF4444",marginTop:"-8px",marginBottom:"12px",fontFamily:F}}>{error}</p>
        )}

        <motion.button
          whileHover={{scale:1.02}}
          whileTap={{scale:0.98}}
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width:"100%",padding:"13px",borderRadius:"10px",
            background: loading ? "#FDBA74" : OG,
            color:"#fff",border:"none",cursor: loading ? "not-allowed" : "pointer",
            fontFamily:F,fontWeight:700,fontSize:"0.95rem",
            boxShadow:"0 4px 16px rgba(255,107,0,0.35)",marginTop:"6px",marginBottom:"12px",
            opacity: loading ? 0.85 : 1,
          }}
        >
          {loading ? "Đang cập nhật..." : "Hoàn tất đăng nhập"}
        </motion.button>

        <button
          onClick={onBack}
          style={{display:"flex",alignItems:"center",gap:"4px",background:"none",border:"none",cursor:"pointer",color:"#6B7280",fontFamily:F,fontSize:"0.82rem",margin:"0 auto"}}
        >
          <ArrowLeft size={13}/> Quay lại
        </button>
      </motion.div>
    </div>
  );
}

function ConfirmRegisterModal({ email, onClose, onConfirmed }: { email: string; onClose: () => void; onConfirmed: () => void; }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const handleResend = async () => {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      await resendConfirmationCode(email);
      setNotice("Mã xác nhận đã được gửi lại.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể gửi lại mã.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!code.trim()) {
      setError("Vui lòng nhập mã xác nhận.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await confirmRegister(email, code.trim());
      onConfirmed();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể xác nhận mã.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:60,background:"rgba(11,18,32,0.42)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
      <motion.div initial={{opacity:0,scale:0.94,y:12}} animate={{opacity:1,scale:1,y:0}} style={{background:"#FFFFFF",borderRadius:"16px",padding:"28px 32px",width:"100%",maxWidth:"420px",boxShadow:"0 10px 30px rgba(0,0,0,0.12)"}}>
        <BrandLogo size={28} textSize="0.9rem" className="mb-4"/>
        <h3 style={{fontWeight:900,fontSize:"1.25rem",marginBottom:"8px",fontFamily:F}}>Xác nhận email</h3>
        <p style={{fontSize:"0.9rem",color:"#6B7280",marginBottom:"14px",fontFamily:F}}>Nhập mã xác nhận đã gửi tới <strong>{email}</strong>.</p>
        <Field label="Mã xác nhận" placeholder="123456" icon={Check} value={code} onChange={setCode} error={error}/>
        {notice && <p style={{fontSize:"0.8rem",color:"#059669",marginBottom:"8px",fontFamily:F}}>{notice}</p>}
        <div style={{display:"flex",gap:"10px",marginTop:"6px"}}>
          <button onClick={handleConfirm} disabled={loading} style={{flex:1,padding:"12px",borderRadius:"10px",background:loading?"#FDBA74":OG,color:"#fff",border:"none",fontWeight:700,cursor:loading?"not-allowed":"pointer",fontFamily:F}}> {loading?"Đang xác nhận...":"Xác nhận"}</button>
          <button onClick={handleResend} disabled={loading} style={{padding:"12px",borderRadius:"10px",background:"#F3F4F6",border:"none",cursor:loading?"not-allowed":"pointer",fontFamily:F}}>Gửi lại</button>
        </div>
        <div style={{textAlign:"center",marginTop:"12px"}}>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#6B7280",cursor:"pointer",fontFamily:F}}>Đóng</button>
        </div>
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
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPw,    setShowPw]  = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");
  const [challengeSession, setChallengeSession] = useState("");
  const [challengeRole, setChallengeRole] = useState<string | null>(null);
  // removed local overlay; destination layout will display loader
  /* form state */
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");

  const isSignup = tab === "signup";

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");
    if (mode === "register") setTab("signup");
    if (mode === "login") setTab("signin");
  }, [location.search]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setAuthError("");

    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (isSignup) {
        if (!name.trim() || !normalizedEmail || !password) {
          setAuthError("Vui lòng nhập họ tên, email và mật khẩu.");
          return;
        }

        try {
          await register(name.trim(), normalizedEmail, password);
          setShowConfirm(true);
          setShowSuccess(false);
        } catch (e) {
          setAuthError(e instanceof Error ? e.message : "Không thể tạo tài khoản.");
        }

        return;
      }

      // Signin flow
      if (!normalizedEmail || !password) {
        setAuthError("Vui lòng nhập email và mật khẩu.");
        return;
      }

      try {
        const result = await login(normalizedEmail, password);

        if (result.status === "authenticated") {
          if (isAdminRole(result.tokens.role)) {
            setAuthError("Tài khoản quản trị không thể đăng nhập ở cổng Learner. Vui lòng dùng cổng Admin.");
            return;
          }

          // store tokens and navigate immediately; dashboard will show loader
          storeAuthTokens(result.tokens);
          const to = getPostLoginPath(result.tokens.role);
          // navigate to a dedicated loading page which will forward to the final target
          navigate(`/loading`, { replace: true, state: { to } });
        } else if (result.status === "new-password-required") {
          setChallengeSession(result.session);
          setChallengeRole(result.role);
          setShowNewPassword(true);
        }
      } catch (e) {
        setAuthError(e instanceof Error ? e.message : "Đăng nhập thất bại.");
        // ensure user sees the error area
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight:"100vh", display:"flex",
      fontFamily:F, background:"#FFFFFF",
    }}>
      {/* Navigates immediately to app; loader displayed by dashboard layout when needed */}
      {/* ── Left dark panel ── */}
      <LeftPanel/>

      {/* ── Right white panel ── */}
      <div style={{
        flex:1, display:"flex", flexDirection:"column",
        background:"#FFFFFF", overflowY:"auto",
      }}>
        {/* Top bar with back link */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"flex-start",
          padding:"20px 32px",
        }}>
          <Link to="/" style={{
            display:"flex",alignItems:"center",gap:"5px",
            fontSize:"0.8rem",color:"#6B7280",textDecoration:"none",fontFamily:F,
            transition:"color 0.2s ease",
          }}
          onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.color="#111827";}}
          onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.color="#6B7280";}}
          >
            <ArrowLeft size={14}/>
            Về trang chủ
          </Link>
        </div>

        {/* Form content */}
        <div style={{
          flex:1, display:"flex", alignItems:"center", justifyContent:"center",
          padding:"0px 32px 40px",
        }}>
          <div style={{width:"100%",maxWidth:"400px"}}>

            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                exit={{opacity:0,y:-8}}
                transition={{duration:0.22}}
              >
                {/* Heading */}
                <h2 style={{
                  fontWeight:900, fontSize:"1.75rem",
                  letterSpacing:"-0.04em", color:"#111827",
                  marginBottom:"8px", fontFamily:F, lineHeight:1.2,
                  marginTop:"0px",
                }}>
                  {isSignup ? "Tạo tài khoản" : "Đăng nhập"}
                </h2>
                <p style={{fontSize:"0.875rem",color:"#6B7280",marginBottom:"24px",fontFamily:F}}>
                  {isSignup
                    ? "Bắt đầu hành trình cá nhân hóa học tập của bạn."
                    : "Tiếp tục từ nơi bạn đã dừng lại."}
                </p>

                {/* Google button */}
                <motion.button
                  whileHover={{backgroundColor:"#F9FAFB",boxShadow:"0 2px 4px rgba(0,0,0,0.08)"}}
                  whileTap={{scale:0.99}}
                  style={{
                    width:"100%",padding:"11px 14px",borderRadius:"10px",
                    border:"1px solid #D1D5DB",background:"#FFFFFF",
                    display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",
                    cursor:"pointer",fontSize:"0.875rem",fontWeight:600,
                    color:"#374151",fontFamily:F,
                    boxShadow:"0 1px 2px rgba(0,0,0,0.05)",
                    transition:"all 0.2s ease",marginBottom:"18px",
                  }}
                >
                  <GoogleIcon/>
                  Tiếp tục với Google
                </motion.button>

                {/* Divider */}
                <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"18px"}}>
                  <div style={{flex:1,height:"1px",background:"#E5E7EB"}}/>
                  <span style={{fontSize:"0.75rem",color:"#9CA3AF",fontFamily:F}}>hoặc</span>
                  <div style={{flex:1,height:"1px",background:"#E5E7EB"}}/>
                </div>

                {/* Fields */}
                {isSignup && (
                  <Field label="Họ và tên" placeholder="Nguyễn Văn A"
                    icon={User} value={name} onChange={setName}/>
                )}
                <Field label="Địa chỉ email" type="email" placeholder="student@gmail.com"
                  icon={Mail} value={email} onChange={setEmail}/>
                <div style={{marginBottom:"18px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px",alignItems:"baseline"}}>
                    <label style={{fontSize:"0.8rem",fontWeight:600,color:"#374151",fontFamily:F}}>Mật khẩu</label>
                    {!isSignup && (
                      <button onClick={()=>setShowReset(true)}
                        style={{fontSize:"0.78rem",color:OG,background:"none",border:"none",cursor:"pointer",fontFamily:F,fontWeight:600,padding:0,transition:"opacity 0.2s"}}
                        onMouseEnter={e=>{(e.target as HTMLButtonElement).style.opacity="0.8";}}
                        onMouseLeave={e=>{(e.target as HTMLButtonElement).style.opacity="1";}}
                      >
                        Quên mật khẩu?
                      </button>
                    )}
                  </div>
                  <div style={{position:"relative",display:"flex",alignItems:"center"}}>
                    <Lock size={15} color="#9CA3AF" style={{position:"absolute",left:"13px",pointerEvents:"none",zIndex:1}}/>
                    <input
                      type={showPw?"text":"password"} value={password}
                      onChange={e=>setPassword(e.target.value)}
                      placeholder="Tối thiểu 8 ký tự"
                      style={{
                        width:"100%",padding:"11px 40px 11px 38px",
                        border:"1.5px solid #E5E7EB",borderRadius:"10px",
                        fontSize:"0.875rem",fontFamily:F,color:"#111827",
                        background:"#FFFFFF",outline:"none",boxSizing:"border-box",
                        transition:"all 0.2s ease",
                      }}
                      onFocus={e=>{
                        e.target.style.borderColor=OG;
                        e.target.style.boxShadow="0 0 0 3px rgba(255,107,0,0.1)";
                      }}
                      onBlur={e=>{
                        e.target.style.borderColor="#E5E7EB";
                        e.target.style.boxShadow="none";
                      }}
                    />
                    <button onClick={()=>setShowPw(v=>!v)}
                      style={{position:"absolute",right:"13px",background:"none",border:"none",cursor:"pointer",color:"#9CA3AF",padding:0,display:"flex",alignItems:"center",transition:"color 0.2s"}}
                      onMouseEnter={e=>{(e.target as HTMLButtonElement).style.color="#6B7280";}}
                      onMouseLeave={e=>{(e.target as HTMLButtonElement).style.color="#9CA3AF";}}
                    >
                      {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  </div>
                </div>

                {authError && (
                  <motion.div
                    initial={{opacity:0,y:-4}}
                    animate={{opacity:1,y:0}}
                    style={{
                      padding:"10px 12px",borderRadius:"8px",
                      background:"#FEE2E2",border:"1px solid #FECACA",
                      fontSize:"0.8rem",color:"#991B1B",marginBottom:"14px",fontFamily:F,lineHeight:1.5,
                    }}
                  >
                    {authError}
                  </motion.div>
                )}

                {/* CTA */}
                <motion.button
                  whileHover={{scale:1.02,boxShadow:"0 6px 20px rgba(255,107,0,0.45)"}}
                  whileTap={{scale:0.97}}
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  style={{
                    width:"100%",padding:"13px",borderRadius:"10px",
                    background:isSubmitting ? "#FDBA74" : OG,
                    color:"#fff",border:"none",cursor:isSubmitting ? "not-allowed" : "pointer",
                    fontFamily:F,fontWeight:700,fontSize:"0.95rem",
                    display:"flex",alignItems:"center",justifyContent:"center",gap:"6px",
                    boxShadow:"0 4px 14px rgba(255,107,0,0.35)",
                    marginBottom:"14px",opacity:isSubmitting ? 0.9 : 1,
                    transition:"all 0.2s ease",
                  }}
                >
                  {isSubmitting ? (isSignup ? "Đang tạo..." : "Đang đăng nhập...") : (isSignup ? "Tạo tài khoản" : "Đăng nhập")}
                  {!isSubmitting && <ArrowRight size={14}/>}
                </motion.button>

                {/* Start for free note */}
                {isSignup && (
                  <p style={{textAlign:"center",fontSize:"0.75rem",color:"#9CA3AF",fontFamily:F,marginBottom:"14px"}}>
                    Bắt đầu miễn phí. Không cần thẻ tín dụng.
                  </p>
                )}

                {/* Switch mode */}
                <p style={{textAlign:"center",fontSize:"0.82rem",color:"#6B7280",fontFamily:F,marginBottom:"24px"}}>
                  {isSignup ? (
                    <>Đã có tài khoản?{" "}
                      <button onClick={()=>{setTab("signin");setAuthError("");}} style={{color:OG,fontWeight:700,background:"none",border:"none",cursor:"pointer",fontFamily:F,fontSize:"0.82rem",transition:"opacity 0.2s"}} onMouseEnter={e=>{(e.target as HTMLButtonElement).style.opacity="0.8";}} onMouseLeave={e=>{(e.target as HTMLButtonElement).style.opacity="1";}}
                      >
                        Đăng nhập
                      </button>
                    </>
                  ) : (
                    <>Chưa có tài khoản?{" "}
                      <button onClick={()=>{setTab("signup");setAuthError("");}} style={{color:OG,fontWeight:700,background:"none",border:"none",cursor:"pointer",fontFamily:F,fontSize:"0.82rem",transition:"opacity 0.2s"}} onMouseEnter={e=>{(e.target as HTMLButtonElement).style.opacity="0.8";}} onMouseLeave={e=>{(e.target as HTMLButtonElement).style.opacity="1";}}
                      >
                        Đăng ký miễn phí
                      </button>
                    </>
                  )}
                </p>

                {/* Trust badges */}
                <div style={{borderTop:"1px solid #F3F4F6",paddingTop:"16px",textAlign:"center"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"16px",marginBottom:"6px"}}>
                    {["AWS","Google Cloud","ISO 27001"].map(b=>(
                      <span key={b} style={{fontSize:"0.68rem",color:"#9CA3AF",fontWeight:600,fontFamily:F}}>{b}</span>
                    ))}
                  </div>
                  <p style={{fontSize:"0.68rem",color:"#9CA3AF",fontFamily:F}}>
                    Ẩn danh dữ liệu 100%. Tuân thủ PDPA.
                  </p>
                </div>

                {/* Admin link */}
                <p style={{textAlign:"center",marginTop:"14px",fontSize:"0.72rem",color:"#9CA3AF",fontFamily:F}}>
                  🏛 Bạn là đối tác trường đại học?{" "}
                  <Link to="/admin-login" style={{color:"#6B7280",fontWeight:600}}>Đăng nhập quản trị</Link>
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
            <ResetPassword onBack={()=>setShowReset(false)}/>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNewPassword && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <NewPasswordRequiredModal
              email={email.trim().toLowerCase()}
              session={challengeSession}
              onBack={() => {
                setShowNewPassword(false);
                setChallengeSession("");
                setChallengeRole(null);
              }}
              onSuccess={(role) => {
                if (isAdminRole(role ?? challengeRole)) {
                  setShowNewPassword(false);
                  setChallengeSession("");
                  setChallengeRole(null);
                  setPassword("");
                  setAuthError("Tài khoản quản trị không thể đăng nhập ở cổng Learner. Vui lòng dùng cổng Admin.");
                  return;
                }

                setShowNewPassword(false);
                setChallengeSession("");
                setChallengeRole(null);
                setPassword("");
                navigate("/app");
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showConfirm && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <ConfirmRegisterModal
              email={email.trim().toLowerCase()}
              onClose={() => setShowConfirm(false)}
              onConfirmed={() => {
                setShowConfirm(false);
                setShowSuccess(true);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Registration success modal */}
      <RegistrationSuccessModal
        open={showSuccess}
        onStartSetup={() => { setShowSuccess(false); navigate("/onboarding"); }}
        onSkip={() => { setShowSuccess(false); navigate("/app"); }}
      />
    </div>
  );
}
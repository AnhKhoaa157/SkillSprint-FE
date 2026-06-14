import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Lock, ArrowLeft, Check } from "lucide-react";
import { RegistrationSuccessModal } from "../../components/modals/RegistrationSuccessModal";
import { BrandLogo } from "../../components/layout/BrandLogo";
import { AuthForm, getEmailError } from "./AuthForm";
import { clearAuthTokens, completeNewPassword, confirmForgotPassword, confirmRegister, forgotPassword, isAdminRole, login, register, resendConfirmationCode, storeAuthTokens, getPostLoginPath, redirectToCognitoGoogleSignIn } from "../../../api/authService";
import { useMaintenance } from "../../../components/system/MaintenanceGate";
import { MaintenancePopup } from "../../../components/system/MaintenancePopup";

/* ─── Tokens ─── */
const F   = "'Plus Jakarta Sans','Inter',sans-serif";
const OG  = "#FF6B00";

/* ─── Input field ─── */
function Field({
  label, type="text", placeholder, icon: Icon, value, onChange,
  right, error, className="mb-5",
}: {
  label: string; type?: string; placeholder: string;
  icon: React.ElementType; value: string;
  onChange: (v:string)=>void; right?: React.ReactNode; error?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-[0.82rem] font-semibold text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative flex items-center">
        <Icon size={16} color="#9CA3AF" className="absolute left-3.5 pointer-events-none z-10"/>
        <input
          type={type} value={value} onChange={e=>onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full pl-11 pr-11 py-3 text-base bg-white rounded-xl outline-none transition-all duration-200 ${
            error 
              ? 'border border-red-500 focus:border-red-500' 
              : 'border border-gray-200 focus:border-[#FF6B00]'
          }`}
          style={{
            fontFamily: F,
          }}
          onFocus={e=>{
            e.currentTarget.style.borderColor = "#FF6B00";
            e.currentTarget.style.boxShadow = "0 0 0 4px rgba(255, 107, 0, 0.08)";
          }}
          onBlur={e=>{
            e.currentTarget.style.borderColor = error ? "#EF4444" : "#E5E7EB";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        {right && (
          <div className="absolute right-3.5 cursor-pointer z-10">{right}</div>
        )}
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

/* ─── Feature list ─── */
const FEATURES = [
  "Học đến đâu, gạch đầu dòng đến đó",
  "Phát hiện những phần kiến thức bị hổng",
  "Mô phỏng phòng vấn để luyện phản xạ",
  "Tổng hợp lại hồ sơ học tập cực xịn",
];

/* ═══════════════════════════════════════════
   LEFT PANEL
 ═══════════════════════════════════════════ */
function LeftPanel() {
  return (
    <div
      className="hidden md:flex h-screen w-[40%] flex-col pl-10 pr-12 py-12 relative overflow-hidden flex-shrink-0"
      style={{
        background: "linear-gradient(180deg, #FAF6F2 0%, #F3ECE3 100%)",
      }}
    >
      {/* Brand logo */}
      <BrandLogo size={100} align="left" className="mb-7" />

      {/* Badge */}
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "5px 14px",
        borderRadius: "99px",
        background: "#FFF7ED",
        border: "1px solid #FFEDD5",
        marginBottom: "28px",
        width: "fit-content",
      }}>
        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#FF6B00" }} />
        <span style={{ fontSize: "0.75rem", color: "#FF6B00", fontWeight: 700, fontFamily: F }}>
          Dự án sinh viên (Bản thử nghiệm Beta)
        </span>
      </div>

      {/* Headline */}
      <h1 style={{
        fontSize: "2.2rem",
        fontWeight: 900,
        lineHeight: 1.25,
        letterSpacing: "-0.03em",
        color: "#1F2937",
        marginBottom: "16px",
        fontFamily: F,
      }}>
        Đừng để kiến thức<br />làm bạn <span style={{ color: "#FF6B00" }}>quá tải.</span>
      </h1>
      
      <p style={{
        fontSize: "0.875rem",
        color: "#4B5563",
        lineHeight: 1.65,
        marginBottom: "32px",
        fontFamily: F,
      }}>
        Ứng dụng được tạo ra bởi sinh viên, dành cho sinh viên. Giúp bạn gom nhóm kiến thức, biết mình thiếu gì và cần học gì tiếp theo.
      </p>

      {/* Features */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "auto" }}>
        {FEATURES.map(f => (
          <div key={f} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              background: "#FFF7ED",
              border: "1px solid #FFEDD5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <Check size={11} color="#FF6B00" strokeWidth={3.5} />
            </div>
            <span style={{ fontSize: "0.875rem", color: "#374151", fontWeight: 600, fontFamily: F }}>
              {f}
            </span>
          </div>
        ))}
      </div>

      {/* Dev message card */}
      <div style={{
        marginTop: "40px",
        padding: "20px 24px",
        borderRadius: "16px",
        background: "#FFFFFF",
        border: "1px solid rgba(0, 0, 0, 0.04)",
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.02)",
        position: "relative",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
          <span style={{ color: "#10B981", fontSize: "16px", lineHeight: 1 }}>•</span>
          <span style={{
            fontSize: "0.75rem",
            fontWeight: 800,
            color: "#10B981",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontFamily: F,
          }}>
            LỜI NHẮN TỪ TEAM DEV 💻
          </span>
        </div>
        <p style={{
          fontSize: "0.82rem",
          color: "#4B5563",
          lineHeight: 1.6,
          fontFamily: F,
          fontWeight: 500,
          margin: 0,
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
            <div className="space-y-4 mb-5">
              <Field label="Email trường học" placeholder="student@gmail.com"
                icon={Mail} value={email} onChange={setEmail} className=""/>
            </div>
            {error && <p style={{fontSize:"0.72rem",color:"#EF4444",marginBottom:"12px",fontFamily:F}}>{error}</p>}
            <motion.button
              whileHover={{scale:1.02}} whileTap={{scale:0.98}}
              onClick={handleSendCode}
              disabled={loading}
              className="w-full min-h-[44px] py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-all"
              style={{
                background: loading ? "#FDBA74" : "#FF6B00",
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: F,
                marginBottom: "14px",
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
            <div className="space-y-4 text-left mb-5">
              <Field label="Mã xác nhận" placeholder="123456" icon={Check} value={confirmationCode} onChange={setConfirmationCode} className=""/>
              <Field label="Mật khẩu mới" type="password" placeholder="Tối thiểu 8 ký tự" icon={Lock} value={newPassword} onChange={setNewPassword} className=""/>
              <Field label="Xác nhận mật khẩu" type="password" placeholder="Nhập lại mật khẩu mới" icon={Lock} value={confirmPassword} onChange={setConfirmPassword} error={error} className=""/>
            </div>
            {error && !confirmPassword && <p style={{fontSize:"0.72rem",color:"#EF4444",marginTop:"-8px",marginBottom:"12px",fontFamily:F}}>{error}</p>}
            <motion.button
              whileHover={{scale:1.02}} whileTap={{scale:0.98}}
              onClick={handleConfirmReset}
              disabled={loading}
              className="w-full min-h-[44px] py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-all"
              style={{
                background: loading ? "#FDBA74" : "#FF6B00",
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: F,
                marginBottom: "14px",
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

        <div className="space-y-4 mb-5">
          <Field
            label="Mật khẩu mới"
            type="password"
            placeholder="Tối thiểu 8 ký tự"
            icon={Lock}
            value={newPassword}
            onChange={setNewPassword}
            className=""
          />
          <Field
            label="Xác nhận mật khẩu"
            type="password"
            placeholder="Nhập lại mật khẩu mới"
            icon={Lock}
            value={confirmPassword}
            onChange={setConfirmPassword}
            error={error}
            className=""
          />
        </div>

        {error && !confirmPassword && (
          <p style={{fontSize:"0.72rem",color:"#EF4444",marginTop:"-8px",marginBottom:"12px",fontFamily:F}}>{error}</p>
        )}

        <motion.button
          whileHover={{scale:1.02}}
          whileTap={{scale:0.98}}
          onClick={handleSubmit}
          disabled={loading}
          className="w-full min-h-[44px] py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-all"
          style={{
            background: loading ? "#FDBA74" : "#FF6B00",
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: F,
            marginTop: "6px",
            marginBottom: "12px",
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
        <div className="space-y-4 mb-5">
          <Field label="Mã xác nhận" placeholder="123456" icon={Check} value={code} onChange={setCode} error={error} className=""/>
        </div>
        {notice && <p style={{fontSize:"0.8rem",color:"#059669",marginBottom:"8px",fontFamily:F}}>{notice}</p>}
        <div style={{display:"flex",gap:"10px",marginTop:"6px"}}>
          <button 
            onClick={handleConfirm} 
            disabled={loading} 
            className="flex-1 min-h-[44px] py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-all"
            style={{
              background: loading ? "#FDBA74" : "#FF6B00",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: F,
            }}
          > 
            {loading ? "Đang xác nhận..." : "Xác nhận"}
          </button>
          <button 
            onClick={handleResend} 
            disabled={loading} 
            className="min-h-[44px] px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all"
            style={{
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: F,
            }}
          >
            Gửi lại
          </button>
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
  const { status } = useMaintenance();
  const [isMaintenancePopupOpen, setIsMaintenancePopupOpen] = useState(false);
  const [tab,       setTab]     = useState<"signin"|"signup">("signin");
  const [showReset, setShowReset] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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

  /**
   * Authentication-layer maintenance boundary. When maintenance is active and the freshly
   * authenticated profile is NOT an admin, we intercept the learner BEFORE any route navigation:
   * surface the maintenance popup and wipe any partial session/token so the client stays
   * cleanly unauthenticated. Returns true when the caller must abort the login transition.
   */
  const blockLearnerDuringMaintenance = (role: unknown): boolean => {
    if (status?.isActive === true && !isAdminRole(role)) {
      clearAuthTokens();
      setIsMaintenancePopupOpen(true);
      return true;
    }
    return false;
  };

  const onLoginSuccess = async (tokens: Parameters<typeof storeAuthTokens>[0]) => {
    try {
      localStorage.clear();
      sessionStorage.clear();

      storeAuthTokens(tokens);

      console.log("[Auth] Fresh session stored. Initiating routing cooldown...");

      setTimeout(() => {
        window.location.href = getPostLoginPath(tokens.role);
      }, 100);
    } catch (error) {
      console.error("Login session initialization failed:", error);
    }
  };

  const handleAutoLogin = async () => {
    setShowSuccess(false);
    setIsSubmitting(true);
    setAuthError("");

    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail || !password) {
        setTab("signin");
        setAuthError("Vui lòng nhập mật khẩu để đăng nhập.");
        return;
      }

      const result = await login(normalizedEmail, password);

      if (result.status === "authenticated") {
        if (isAdminRole(result.tokens.role)) {
          setAuthError("Tài khoản quản trị không thể đăng nhập ở cổng Learner. Vui lòng dùng cổng Admin.");
          setTab("signin");
          return;
        }

        // Maintenance boundary: block learners at the auth layer before navigating.
        if (blockLearnerDuringMaintenance(result.tokens.role)) {
          return;
        }

        await onLoginSuccess(result.tokens);
      } else if (result.status === "new-password-required") {
        setChallengeSession(result.session);
        setChallengeRole(result.role);
        setShowNewPassword(true);
      }
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : "Tự động đăng nhập thất bại. Vui lòng đăng nhập thủ công.");
      setTab("signin");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setAuthError("");

    try {
      const normalizedEmail = email.trim().toLowerCase();

      const emailError = getEmailError(normalizedEmail);
      if (emailError) {
        setAuthError(emailError);
        return;
      }

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

          // Maintenance boundary: block learners at the auth layer before navigating.
          if (blockLearnerDuringMaintenance(result.tokens.role)) {
            return;
          }

          await onLoginSuccess(result.tokens);
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
    <div 
      className="h-screen min-h-screen flex w-full overflow-hidden bg-white font-sans"
      style={{ fontFamily: F }}
    >
      {/* Maintenance interceptor — surfaced when a learner tries to sign in during maintenance. */}
      <MaintenancePopup
        open={isMaintenancePopupOpen}
        onClose={() => setIsMaintenancePopupOpen(false)}
      />

      {/* Navigates immediately to app; loader displayed by dashboard layout when needed */}
      {/* ── Left dark panel ── */}
      <LeftPanel/>

      {/* ── Right white panel ── */}
      <div className="h-screen min-h-screen w-full md:flex-1 flex flex-col bg-white overflow-hidden">
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
        <div className="w-full max-w-md mx-auto px-4 sm:px-6 py-8 flex flex-1 flex-col justify-center min-h-0">
          <div className="w-full">

            <AuthForm
              mode={tab}
              name={name}
              email={email}
              password={password}
              onNameChange={setName}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              authError={authError}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              onContinueWithGoogle={redirectToCognitoGoogleSignIn}
              onForgotPassword={() => setShowReset(true)}
              onSwitchMode={(mode) => { setTab(mode); setAuthError(""); }}
            />
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

                // Maintenance boundary: intercept the learner before routing into the workspace.
                if (blockLearnerDuringMaintenance(role ?? challengeRole)) {
                  setShowNewPassword(false);
                  setChallengeSession("");
                  setChallengeRole(null);
                  setPassword("");
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
        onStartSetup={handleAutoLogin}
        onSkip={() => {
          setShowSuccess(false);
          setName("");
          setEmail("");
          setPassword("");
          setAuthError("");
          navigate("/");
        }}
      />
    </div>
  );
}

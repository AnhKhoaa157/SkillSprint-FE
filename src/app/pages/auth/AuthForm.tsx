import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, User, Wrench, Zap } from "lucide-react";
import { Button } from "../../components/ui/button";
import { getEmailError, F, InputField, isMaintenanceError } from "./components/AuthShared";
import { login, register, isAdminRole } from "../../../api/authService";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  );
}

function MaintenanceBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: -6, height: 0 }}
      transition={{ duration: 0.25 }}
      role="alert"
      aria-live="assertive"
      className="mb-5 overflow-hidden"
    >
      <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 px-4 py-3.5 shadow-[0_1px_2px_rgba(217,119,6,0.06)]">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
          <Wrench size={16} strokeWidth={2.3} />
        </span>
        <div className="min-w-0">
          <p className="text-[13.5px] font-bold tracking-[-0.01em] text-amber-900">
            Hệ thống đang được nâng cấp định kỳ
          </p>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-amber-700">
            Cổng đăng nhập tạm thời bị khoá để tối ưu hiệu năng. Các nút đăng nhập sẽ tự mở lại ngay khi quá trình bảo trì hoàn tất — bạn không cần tải lại trang.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

interface CommonFormProps {
  isMaintenanceActive: boolean;
  isGoogleLoading: boolean;
  onContinueWithGoogle: () => void;
  onSwitchMode: (mode: "signin" | "signup") => void;
  onLoginSuccess: (tokens: any) => void;
  onRequireNewPassword: (email: string, session: string, role: string | null) => void;
  onRequireConfirmation: (email: string, password?: string) => void;
  onForgotPassword: () => void;
  onError: (msg: string) => void;
}

function LoginForm({ props }: { props: CommonFormProps }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [authError, setAuthError] = useState("");

  const showFor = (field: keyof typeof touched) => touched[field] || submitAttempted;
  const emailError = showFor("email") ? getEmailError(email) : null;
  const passwordError = showFor("password") ? (!password ? "Vui lòng nhập mật khẩu." : null) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (props.isMaintenanceActive) return;
    setSubmitAttempted(true);
    setAuthError("");

    const invalid = getEmailError(email) !== null || !password;
    if (invalid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const result = await login(normalizedEmail, password);
      if (result.status === "authenticated") {
        if (isAdminRole(result.tokens.role)) {
          setAuthError("Tài khoản quản trị không thể đăng nhập ở cổng Learner. Vui lòng dùng cổng Admin.");
          return;
        }
        props.onLoginSuccess(result.tokens);
      } else if (result.status === "new-password-required") {
        props.onRequireNewPassword(normalizedEmail, result.session, result.role);
      }
    } catch (e: any) {
      if (isMaintenanceError(e) || e?.message?.toLowerCase().includes("bảo trì")) {
        props.onError("maintenance");
      } else {
        setAuthError(e instanceof Error ? e.message : "Đăng nhập thất bại.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }} style={{ fontFamily: F }} className="w-full">
      <style>{`
        @keyframes wave-hand {
          0%, 100% { transform: rotate(0deg); }
          20%, 60% { transform: rotate(-14deg); }
          40%, 80% { transform: rotate(10deg); }
        }
        .waving-hand {
          display: inline-block;
          transform-origin: 70% 70%;
          animation: wave-hand 2.2s ease-in-out infinite;
        }
        @keyframes btn-gloss {
          0% { transform: translateX(-150px); opacity: 0; }
          12% { opacity: 1; }
          35% { transform: translateX(380px); opacity: 0; }
          100% { transform: translateX(380px); opacity: 0; }
        }
      `}</style>

      <div className="flex justify-center w-full mb-6">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-[#FF8533]/8 to-[#FFA066]/4 text-[#FF8533] border border-[#FF8533]/15 uppercase tracking-widest select-none shadow-[0_2px_8px_rgba(255,133,51,0.02)]">
          <Zap size={11} className="fill-[#FF8533] text-[#FF8533] animate-pulse shrink-0" />
          Nền tảng học tập AI
        </div>
      </div>

      <div className="text-center mb-8 flex flex-col items-center">
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent flex items-center justify-center gap-2">
          Chào mừng trở lại <span className="waving-hand text-2xl">👋</span>
        </h2>
        <p className="text-sm font-medium text-slate-500 mt-2 select-none leading-relaxed max-w-[340px] mx-auto">
          Đăng nhập vào tài khoản SkillSprint để tiếp tục học tập.
        </p>
      </div>

      <AnimatePresence>
        {props.isMaintenanceActive && <MaintenanceBanner />}
      </AnimatePresence>

      <Button
        type="button" variant="outline" disabled={isSubmitting || props.isGoogleLoading || props.isMaintenanceActive} onClick={props.onContinueWithGoogle}
        className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.01)] transition-all duration-350 hover:bg-slate-50 hover:border-slate-350 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {props.isGoogleLoading ? <Loader2 size={15} className="animate-spin text-slate-400" /> : <GoogleIcon />}
        <span>Sign in with Google</span>
      </Button>

      <div className="my-6 flex items-center gap-4">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-slate-200/60" />
        <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest select-none">hoặc đăng nhập bằng email</span>
        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-slate-200/60" />
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <InputField id="auth-email" label="Địa chỉ email" icon={Mail} type="email" value={email} onChange={setEmail} onBlur={() => setTouched(t => ({ ...t, email: true }))} placeholder="student@gmail.com" autoComplete="email" error={emailError} disabled={props.isMaintenanceActive} />
        <InputField id="auth-password" label="Mật khẩu" icon={Lock} type={showPassword ? "text" : "password"} value={password} onChange={setPassword} onBlur={() => setTouched(t => ({ ...t, password: true }))} placeholder="••••••••" autoComplete="current-password" error={passwordError} disabled={props.isMaintenanceActive}
          labelAction={
            <button type="button" onClick={props.onForgotPassword} className="cursor-pointer border-none bg-transparent p-0 text-xs font-bold text-slate-450 hover:text-[#FF8533] transition-colors duration-150">Quên mật khẩu?</button>
          }
          trailing={
            <button type="button" onClick={() => setShowPassword(v => !v)} className="mr-1 flex cursor-pointer items-center border-none bg-transparent p-0 text-slate-400 hover:text-slate-650 transition-colors duration-150">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        <AnimatePresence>
          {authError && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl border border-red-200 bg-red-50/70 px-4 py-3 text-xs leading-relaxed text-red-700 shadow-sm" role="alert">
              {authError}
            </motion.div>
          )}
        </AnimatePresence>

        <Button 
          type="submit" 
          disabled={isSubmitting || props.isMaintenanceActive} 
          className={`group relative overflow-hidden flex h-12 w-full items-center justify-center gap-1.5 rounded-xl border-none text-sm font-extrabold uppercase tracking-wide text-white transition-all duration-300 shadow-[0_4px_16px_rgba(255,133,51,0.18)] hover:shadow-[0_8px_24px_rgba(255,133,51,0.3)] ${
            props.isMaintenanceActive 
              ? "cursor-not-allowed bg-slate-300" 
              : "bg-gradient-to-r from-[#FFAC75] via-[#FF8533] to-[#FF6A00] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985] cursor-pointer"
          }`}
        >
          {/* Shimmer gloss effect */}
          {!props.isMaintenanceActive && !isSubmitting && (
            <div 
              className="absolute top-0 bottom-0 left-0 w-[40px] bg-white/25 -skew-x-[20deg] pointer-events-none"
              style={{
                animation: "btn-gloss 3.5s cubic-bezier(0.19, 1, 0.22, 1) infinite",
              }}
            />
          )}
          {props.isMaintenanceActive ? (
            <><Wrench size={14} strokeWidth={2.4} /> Tạm khoá do bảo trì</>
          ) : isSubmitting ? (
            <><Loader2 size={15} className="animate-spin" /> Đang đăng nhập...</>
          ) : (
            <>
              <span>Đăng nhập</span> 
              <ArrowRight size={14} strokeWidth={2.5} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-7 space-y-3.5">
        <p className="text-center text-xs text-slate-500 select-none">
          Chưa có tài khoản?{" "}
          <button type="button" onClick={() => props.onSwitchMode("signup")} className="cursor-pointer border-none bg-transparent p-0 font-extrabold text-[#FF8533] hover:text-[#FFA066] hover:underline transition-colors duration-150">Đăng ký ngay</button>
        </p>
        <p className="text-center">
          <Link to="/admin-login" className="inline-block text-[11px] font-bold text-slate-400 no-underline transition-colors duration-150 hover:text-slate-700 hover:underline">Đăng nhập cổng Đối tác / Nhà trường</Link>
        </p>
      </div>
    </motion.div>
  );
}

function RegisterForm({ props }: { props: CommonFormProps }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<{ name?: boolean; email?: boolean; password?: boolean }>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [authError, setAuthError] = useState("");

  const showFor = (field: keyof typeof touched) => touched[field] || submitAttempted;
  const nameError = showFor("name") && !name.trim() ? "Vui lòng nhập họ và tên." : null;
  const emailError = showFor("email") ? getEmailError(email) : null;
  const passwordError = showFor("password") ? (!password ? "Vui lòng nhập mật khẩu." : password.length < 8 ? "Mật khẩu phải có ít nhất 8 ký tự." : null) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (props.isMaintenanceActive) return;
    setSubmitAttempted(true);
    setAuthError("");

    const invalid = getEmailError(email) !== null || !password || password.length < 8 || !name.trim();
    if (invalid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      await register(name.trim(), normalizedEmail, password);
      props.onRequireConfirmation(normalizedEmail, password);
    } catch (e: any) {
      if (isMaintenanceError(e) || e?.message?.toLowerCase().includes("bảo trì")) {
        props.onError("maintenance");
      } else {
        setAuthError(e instanceof Error ? e.message : "Không thể tạo tài khoản.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }} style={{ fontFamily: F }} className="w-full">
      <style>{`
        @keyframes btn-gloss-reg {
          0% { transform: translateX(-150px); opacity: 0; }
          12% { opacity: 1; }
          35% { transform: translateX(380px); opacity: 0; }
          100% { transform: translateX(380px); opacity: 0; }
        }
      `}</style>

      <div className="flex justify-center w-full mb-6">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-[#FF8533]/8 to-[#FFA066]/4 text-[#FF8533] border border-[#FF8533]/15 uppercase tracking-widest select-none shadow-[0_2px_8px_rgba(255,133,51,0.02)]">
          <Zap size={11} className="fill-[#FF8533] text-[#FF8533] animate-pulse shrink-0" />
          Nền tảng học tập AI
        </div>
      </div>

      <div className="text-center mb-8 flex flex-col items-center">
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
          Tạo tài khoản mới ✨
        </h2>
        <p className="text-sm font-medium text-slate-500 mt-2 select-none leading-relaxed max-w-[340px] mx-auto">
          Tham gia cùng các bạn sinh viên đang bứt phá.
        </p>
      </div>

      <AnimatePresence>
        {props.isMaintenanceActive && <MaintenanceBanner />}
      </AnimatePresence>

      <Button
        type="button" variant="outline" disabled={isSubmitting || props.isGoogleLoading || props.isMaintenanceActive} onClick={props.onContinueWithGoogle}
        className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.01)] transition-all duration-350 hover:bg-slate-50 hover:border-slate-355 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {props.isGoogleLoading ? <Loader2 size={15} className="animate-spin text-slate-400" /> : <GoogleIcon />}
        <span>Sign up with Google</span>
      </Button>

      <div className="my-6 flex items-center gap-4">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-slate-200/60" />
        <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest select-none">hoặc đăng ký bằng email</span>
        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-slate-200/60" />
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <InputField id="auth-name" label="Họ và tên" icon={User} value={name} onChange={setName} onBlur={() => setTouched(t => ({ ...t, name: true }))} placeholder="Nguyễn Văn A" autoComplete="name" error={nameError} disabled={props.isMaintenanceActive} />
        <InputField id="auth-email" label="Địa chỉ email" icon={Mail} type="email" value={email} onChange={setEmail} onBlur={() => setTouched(t => ({ ...t, email: true }))} placeholder="student@gmail.com" autoComplete="email" error={emailError} disabled={props.isMaintenanceActive} />
        <InputField id="auth-password" label="Mật khẩu" icon={Lock} type={showPassword ? "text" : "password"} value={password} onChange={setPassword} onBlur={() => setTouched(t => ({ ...t, password: true }))} placeholder="••••••••" autoComplete="new-password" error={passwordError} disabled={props.isMaintenanceActive}
          trailing={
            <button type="button" onClick={() => setShowPassword(v => !v)} className="mr-1 flex cursor-pointer items-center border-none bg-transparent p-0 text-slate-400 hover:text-slate-655 transition-colors duration-150">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        <AnimatePresence>
          {authError && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl border border-red-200 bg-red-50/70 px-4 py-3 text-xs leading-relaxed text-red-700 shadow-sm" role="alert">
              {authError}
            </motion.div>
          )}
        </AnimatePresence>

        <Button 
          type="submit" 
          disabled={isSubmitting || props.isMaintenanceActive} 
          className={`group relative overflow-hidden flex h-12 w-full items-center justify-center gap-1.5 rounded-xl border-none text-sm font-extrabold uppercase tracking-wide text-white transition-all duration-300 shadow-[0_4px_16px_rgba(255,133,51,0.18)] hover:shadow-[0_8px_24px_rgba(255,133,51,0.3)] ${
            props.isMaintenanceActive 
              ? "cursor-not-allowed bg-slate-300" 
              : "bg-gradient-to-r from-[#FFAC75] via-[#FF8533] to-[#FF6A00] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985] cursor-pointer"
          }`}
        >
          {/* Shimmer gloss effect */}
          {!props.isMaintenanceActive && !isSubmitting && (
            <div 
              className="absolute top-0 bottom-0 left-0 w-[40px] bg-white/25 -skew-x-[20deg] pointer-events-none"
              style={{
                animation: "btn-gloss-reg 3.5s cubic-bezier(0.19, 1, 0.22, 1) infinite",
              }}
            />
          )}
          {props.isMaintenanceActive ? (
            <><Wrench size={14} strokeWidth={2.4} /> Tạm khoá do bảo trì</>
          ) : isSubmitting ? (
            <><Loader2 size={15} className="animate-spin" /> Đang tạo...</>
          ) : (
            <>
              <span>Tạo tài khoản</span> 
              <ArrowRight size={14} strokeWidth={2.5} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </>
          )}
        </Button>
      </form>

      <p className="mt-5 text-center text-[11px] font-bold text-slate-400 select-none">Bắt đầu miễn phí. Không cần thẻ tín dụng.</p>

      <div className="mt-6 space-y-4">
        <p className="text-center text-xs text-slate-500 select-none">
          Đã có tài khoản?{" "}
          <button type="button" onClick={() => props.onSwitchMode("signin")} className="cursor-pointer border-none bg-transparent p-0 font-extrabold text-[#FF8533] hover:text-[#FFA066] hover:underline transition-colors duration-150">Đăng nhập</button>
        </p>
      </div>
    </motion.div>
  );
}

export interface AuthFormProps {
  mode: "signin" | "signup";
  isMaintenanceActive: boolean;
  isGoogleLoading: boolean;
  onContinueWithGoogle: () => void;
  onSwitchMode: (mode: "signin" | "signup") => void;
  onLoginSuccess: (tokens: any) => void;
  onRequireNewPassword: (email: string, session: string, role: string | null) => void;
  onRequireConfirmation: (email: string, password?: string) => void;
  onForgotPassword: () => void;
  onError: (msg: string) => void;
}

export function AuthForm(props: AuthFormProps) {
  return (
    <AnimatePresence mode="wait">
      {props.mode === "signin" ? (
        <LoginForm key="signin" props={props} />
      ) : (
        <RegisterForm key="signup" props={props} />
      )}
    </AnimatePresence>
  );
}
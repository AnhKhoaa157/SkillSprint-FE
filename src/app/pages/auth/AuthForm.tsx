import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, User, Wrench, Zap } from "lucide-react";
import { Button } from "../../components/ui/button";
import { getEmailError, F, InputField, isMaintenanceError } from "./components/AuthShared";
import { login, register, isAdminRole } from "../../../api/auth/authService";

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
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }} style={{ fontFamily: F }} className="relative z-[1] w-full">
      <span className="absolute right-0 top-0 hidden min-h-[34px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white/95 px-3 text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-600 sm:inline-flex">
        <span className="text-sm text-[#FF6B00]" aria-hidden="true">✦</span>
        AI Learning Portal
      </span>

      <div className="inline-flex min-h-[34px] items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3.5 text-[10px] font-extrabold uppercase tracking-[0.09em] text-[#EA580C]">
        <Zap size={11} className="fill-[#FF6B00] text-[#FF6B00]" aria-hidden="true" />
        Nền tảng học tập AI
      </div>

      <div className="mb-6 mt-7">
        <h1 className="text-[32px] font-black leading-tight tracking-[-0.045em] text-slate-950 sm:text-[34px]">
          Chào mừng trở lại
        </h1>
        <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
          Đăng nhập để tiếp tục hành trình học tập của bạn.
        </p>
      </div>

      <AnimatePresence>
        {props.isMaintenanceActive && <MaintenanceBanner />}
      </AnimatePresence>

      <Button
        type="button" variant="outline" disabled={isSubmitting || props.isGoogleLoading || props.isMaintenanceActive} onClick={props.onContinueWithGoogle}
        className="flex h-[52px] w-full cursor-pointer items-center justify-center gap-2.5 rounded-[14px] border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-sm transition-[background-color,border-color,box-shadow,transform] duration-200 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {props.isGoogleLoading ? <Loader2 size={15} className="animate-spin text-slate-400" /> : <GoogleIcon />}
        <span>Tiếp tục với Google</span>
      </Button>

      <div className="my-[22px] flex items-center gap-3.5">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="select-none whitespace-nowrap text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">hoặc đăng nhập bằng email</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <InputField id="auth-email" label="Địa chỉ email" icon={Mail} type="email" value={email} onChange={setEmail} onBlur={() => setTouched(t => ({ ...t, email: true }))} placeholder="student@gmail.com" autoComplete="email" error={emailError} disabled={props.isMaintenanceActive} />
        <InputField id="auth-password" label="Mật khẩu" icon={Lock} type={showPassword ? "text" : "password"} value={password} onChange={setPassword} onBlur={() => setTouched(t => ({ ...t, password: true }))} placeholder="••••••••" autoComplete="current-password" error={passwordError} disabled={props.isMaintenanceActive}
          labelAction={
            <button type="button" onClick={props.onForgotPassword} className="min-h-8 cursor-pointer rounded-lg border-none bg-transparent px-1 text-xs font-bold text-slate-600 transition-colors duration-150 hover:text-[#EA580C] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF6B00]/20">Quên mật khẩu?</button>
          }
          trailing={
            <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} className="mr-1 flex min-h-11 min-w-11 cursor-pointer items-center justify-center border-none bg-transparent p-0 text-slate-400 transition-colors duration-150 hover:text-slate-650 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF6B00]/20">
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
          className={`group relative flex h-[52px] w-full items-center justify-center gap-2 overflow-hidden rounded-[14px] border-none text-sm font-black uppercase tracking-[0.035em] text-white transition-[background-color,box-shadow,transform] duration-200 shadow-[0_10px_24px_rgba(248,98,6,0.24)] hover:shadow-[0_12px_28px_rgba(248,98,6,0.3)] ${
            props.isMaintenanceActive 
              ? "cursor-not-allowed bg-slate-300" 
              : "cursor-pointer bg-[#F86206] hover:bg-[#EA580C] active:scale-[0.99]"
          }`}
        >
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

      <div className="mt-5 space-y-3.5">
        <p className="text-center text-xs text-slate-500 select-none">
          Chưa có tài khoản?{" "}
          <button type="button" onClick={() => props.onSwitchMode("signup")} className="cursor-pointer border-none bg-transparent p-0 font-extrabold text-[#FF8533] hover:text-[#FFA066] hover:underline transition-colors duration-150">Đăng ký ngay</button>
        </p>
        <p className="text-center">
          <Link to="/admin-login" className="inline-block rounded-md text-xs font-extrabold text-slate-700 underline decoration-slate-300 underline-offset-4 transition-colors duration-150 hover:text-[#EA580C] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF6B00]/20">Đăng nhập dành cho quản trị viên</Link>
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
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }} style={{ fontFamily: F }} className="auth-register-form relative z-[1] w-full">
      <span className="absolute right-0 top-0 hidden min-h-[34px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white/95 px-3 text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-600 sm:inline-flex">
        <span className="text-sm text-[#FF6B00]" aria-hidden="true">✦</span>
        AI Learning Portal
      </span>

      <div className="inline-flex min-h-[34px] items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3.5 text-[10px] font-extrabold uppercase tracking-[0.09em] text-[#EA580C]">
        <Zap size={11} className="fill-[#FF6B00] text-[#FF6B00]" aria-hidden="true" />
        Nền tảng học tập AI
      </div>

      <div className="auth-register-title mb-4 mt-5">
        <h1 className="text-[30px] font-black leading-tight tracking-[-0.045em] text-slate-950 sm:text-[32px]">
          Tạo tài khoản mới
        </h1>
        <p className="mt-1.5 text-sm font-medium leading-relaxed text-slate-500">
          Bắt đầu hành trình học tập được thiết kế riêng cho bạn.
        </p>
      </div>

      <AnimatePresence>
        {props.isMaintenanceActive && <MaintenanceBanner />}
      </AnimatePresence>

      <Button
        type="button" variant="outline" disabled={isSubmitting || props.isGoogleLoading || props.isMaintenanceActive} onClick={props.onContinueWithGoogle}
        className="auth-register-google flex h-[50px] w-full cursor-pointer items-center justify-center gap-2.5 rounded-[14px] border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-sm transition-[background-color,border-color,box-shadow,transform] duration-200 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {props.isGoogleLoading ? <Loader2 size={15} className="animate-spin text-slate-400" /> : <GoogleIcon />}
        <span>Tiếp tục với Google</span>
      </Button>

      <div className="auth-register-divider my-4 flex items-center gap-3.5">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="select-none whitespace-nowrap text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">hoặc đăng ký bằng email</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <form onSubmit={handleSubmit} noValidate className="auth-register-fields flex flex-col gap-3">
        <InputField id="auth-name" label="Họ và tên" icon={User} value={name} onChange={setName} onBlur={() => setTouched(t => ({ ...t, name: true }))} placeholder="Nguyễn Văn A" autoComplete="name" error={nameError} disabled={props.isMaintenanceActive} />
        <InputField id="auth-email" label="Địa chỉ email" icon={Mail} type="email" value={email} onChange={setEmail} onBlur={() => setTouched(t => ({ ...t, email: true }))} placeholder="student@gmail.com" autoComplete="email" error={emailError} disabled={props.isMaintenanceActive} />
        <InputField id="auth-password" label="Mật khẩu" icon={Lock} type={showPassword ? "text" : "password"} value={password} onChange={setPassword} onBlur={() => setTouched(t => ({ ...t, password: true }))} placeholder="••••••••" autoComplete="new-password" error={passwordError} disabled={props.isMaintenanceActive}
          trailing={
            <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} className="mr-1 flex min-h-11 min-w-11 cursor-pointer items-center justify-center border-none bg-transparent p-0 text-slate-400 transition-colors duration-150 hover:text-slate-655 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF6B00]/20">
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
          className={`group relative flex h-[50px] w-full items-center justify-center gap-2 overflow-hidden rounded-[14px] border-none text-sm font-black uppercase tracking-[0.035em] text-white transition-[background-color,box-shadow,transform] duration-200 shadow-[0_10px_24px_rgba(248,98,6,0.24)] hover:shadow-[0_12px_28px_rgba(248,98,6,0.3)] ${
            props.isMaintenanceActive 
              ? "cursor-not-allowed bg-slate-300" 
              : "cursor-pointer bg-[#F86206] hover:bg-[#EA580C] active:scale-[0.99]"
          }`}
        >
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

      <p className="auth-register-trust mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] font-bold text-slate-500">
        <ShieldCheck size={14} className="text-emerald-500" aria-hidden="true" />
        Bắt đầu miễn phí, không cần thẻ tín dụng
      </p>

      <p className="auth-register-footer mt-3 text-center text-xs text-slate-500">
        Đã có tài khoản?{" "}
        <button type="button" onClick={() => props.onSwitchMode("signin")} className="min-h-11 cursor-pointer rounded-lg border-none bg-transparent px-1 font-extrabold text-[#F86206] transition-colors duration-150 hover:text-[#EA580C] hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF6B00]/20">Đăng nhập</button>
      </p>
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

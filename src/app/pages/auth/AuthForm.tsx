import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, User, Wrench } from "lucide-react";
import { Button } from "../../components/ui/button";
import { getEmailError, F, InputField } from "./components/AuthShared";
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
      if (e?.message?.toLowerCase().includes("503") || e?.message?.toLowerCase().includes("maintenance")) {
        props.onError("maintenance");
      } else {
        setAuthError(e instanceof Error ? e.message : "Đăng nhập thất bại.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }} style={{ fontFamily: F }}>
      <h2 className="text-[1.9rem] font-extrabold leading-tight tracking-[-0.035em] text-slate-900 mb-8">
        Chào mừng trở lại 👋
      </h2>

      <AnimatePresence>
        {props.isMaintenanceActive && <MaintenanceBanner />}
      </AnimatePresence>

      <Button
        type="button" variant="outline" disabled={isSubmitting || props.isGoogleLoading || props.isMaintenanceActive} onClick={props.onContinueWithGoogle}
        className="relative flex min-h-[48px] w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] font-semibold text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-300 cursor-pointer hover:border-slate-300 hover:shadow-[0_6px_14px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {props.isGoogleLoading ? <Loader2 size={17} className="animate-spin text-slate-400" /> : <div className="pointer-events-none shrink-0"><GoogleIcon /></div>}
        <span>{props.isGoogleLoading ? "Đang kiểm tra hệ thống..." : "Sign in with Google"}</span>
      </Button>

      <div className="my-8 flex items-center gap-3">
        <div className="h-px flex-1 border-t border-slate-100" />
        <span className="whitespace-nowrap text-xs text-slate-400">hoặc tiếp tục với email</span>
        <div className="h-px flex-1 border-t border-slate-100" />
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <InputField id="auth-email" label="Địa chỉ email" icon={Mail} type="email" value={email} onChange={setEmail} onBlur={() => setTouched(t => ({ ...t, email: true }))} placeholder="student@gmail.com" autoComplete="email" error={emailError} disabled={props.isMaintenanceActive} />
        <InputField id="auth-password" label="Mật khẩu" icon={Lock} type={showPassword ? "text" : "password"} value={password} onChange={setPassword} onBlur={() => setTouched(t => ({ ...t, password: true }))} placeholder="••••••••" autoComplete="current-password" error={passwordError} disabled={props.isMaintenanceActive}
          labelAction={
            <button type="button" onClick={props.onForgotPassword} className="cursor-pointer border-none bg-transparent p-0 text-[13px] font-semibold text-slate-700 underline-offset-4 transition-colors hover:text-[#FF6B00] hover:underline">Quên mật khẩu?</button>
          }
          trailing={
            <button type="button" onClick={() => setShowPassword(v => !v)} className="mr-3.5 flex cursor-pointer items-center border-none bg-transparent p-0 text-slate-400 hover:text-slate-600">
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          }
        />

        <AnimatePresence>
          {authError && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] leading-relaxed text-red-700" role="alert">
              {authError}
            </motion.div>
          )}
        </AnimatePresence>

        <Button type="submit" disabled={isSubmitting || props.isMaintenanceActive} className={`flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border-none text-[15px] font-bold text-white transition-all duration-150 ${props.isMaintenanceActive ? "cursor-not-allowed bg-slate-300" : "bg-[#FF6B00] hover:bg-[#FF7A00] hover:shadow-lg hover:shadow-orange-500/30 active:translate-y-0.5 cursor-pointer"}`}>
          {props.isMaintenanceActive ? <><Wrench size={16} strokeWidth={2.4} /> Tạm khoá do bảo trì</> : isSubmitting ? <><Loader2 size={17} className="animate-spin" /> Đang đăng nhập...</> : <>Đăng nhập <ArrowRight size={16} strokeWidth={2.5} /></>}
        </Button>
      </form>

      <div className="mt-7 space-y-4">
        <p className="text-center text-[13px] text-slate-500">
          Chưa có tài khoản?{" "}
          <button type="button" onClick={() => props.onSwitchMode("signup")} className="cursor-pointer border-none bg-transparent p-0 text-[13px] font-bold text-[#FF6B00] hover:underline">Đăng ký ngay</button>
        </p>
        <p className="text-center text-xs">
          <Link to="/admin-login" className="block w-full text-center mx-auto font-medium text-slate-700 no-underline transition-colors hover:text-slate-900 hover:underline">Đăng nhập cho đối tác trường ĐH</Link>
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
      if (e?.message?.toLowerCase().includes("503") || e?.message?.toLowerCase().includes("maintenance")) {
        props.onError("maintenance");
      } else {
        setAuthError(e instanceof Error ? e.message : "Không thể tạo tài khoản.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }} style={{ fontFamily: F }}>
      <h2 className="text-[1.9rem] font-extrabold leading-tight tracking-[-0.035em] text-slate-900 mb-2">
        Tạo tài khoản mới ✨
      </h2>
      <p className="mb-10 text-sm leading-relaxed text-slate-500">
        Tham gia cùng các bạn sinh viên đang bứt phá.
      </p>

      <AnimatePresence>
        {props.isMaintenanceActive && <MaintenanceBanner />}
      </AnimatePresence>

      <Button
        type="button" variant="outline" disabled={isSubmitting || props.isGoogleLoading || props.isMaintenanceActive} onClick={props.onContinueWithGoogle}
        className="relative flex min-h-[48px] w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] font-semibold text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-300 cursor-pointer hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {props.isGoogleLoading ? <Loader2 size={17} className="animate-spin text-slate-400" /> : <div className="pointer-events-none shrink-0"><GoogleIcon /></div>}
        <span>{props.isGoogleLoading ? "Đang kiểm tra hệ thống..." : "Sign up with Google"}</span>
      </Button>

      <div className="my-8 flex items-center gap-3">
        <div className="h-px flex-1 border-t border-slate-100" />
        <span className="whitespace-nowrap text-xs text-slate-400">hoặc tiếp tục với email</span>
        <div className="h-px flex-1 border-t border-slate-100" />
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <InputField id="auth-name" label="Họ và tên" icon={User} value={name} onChange={setName} onBlur={() => setTouched(t => ({ ...t, name: true }))} placeholder="Nguyễn Văn A" autoComplete="name" error={nameError} disabled={props.isMaintenanceActive} />
        <InputField id="auth-email" label="Địa chỉ email" icon={Mail} type="email" value={email} onChange={setEmail} onBlur={() => setTouched(t => ({ ...t, email: true }))} placeholder="student@gmail.com" autoComplete="email" error={emailError} disabled={props.isMaintenanceActive} />
        <InputField id="auth-password" label="Mật khẩu" icon={Lock} type={showPassword ? "text" : "password"} value={password} onChange={setPassword} onBlur={() => setTouched(t => ({ ...t, password: true }))} placeholder="••••••••" autoComplete="new-password" error={passwordError} disabled={props.isMaintenanceActive}
          trailing={
            <button type="button" onClick={() => setShowPassword(v => !v)} className="mr-3.5 flex cursor-pointer items-center border-none bg-transparent p-0 text-slate-400 hover:text-slate-600">
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          }
        />

        <AnimatePresence>
          {authError && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] leading-relaxed text-red-700" role="alert">
              {authError}
            </motion.div>
          )}
        </AnimatePresence>

        <Button type="submit" disabled={isSubmitting || props.isMaintenanceActive} className={`flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border-none text-[15px] font-bold text-white transition-all duration-150 ${props.isMaintenanceActive ? "cursor-not-allowed bg-slate-300" : "bg-[#FF6B00] hover:bg-[#FF7A00] hover:shadow-lg hover:shadow-orange-500/30 active:translate-y-0.5 cursor-pointer"}`}>
          {props.isMaintenanceActive ? <><Wrench size={16} strokeWidth={2.4} /> Tạm khoá do bảo trì</> : isSubmitting ? <><Loader2 size={17} className="animate-spin" /> Đang tạo...</> : <>Tạo tài khoản <ArrowRight size={16} strokeWidth={2.5} /></>}
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-slate-400">Bắt đầu miễn phí. Không cần thẻ tín dụng.</p>

      <div className="mt-7 space-y-4">
        <p className="text-center text-[13px] text-slate-500">
          Đã có tài khoản?{" "}
          <button type="button" onClick={() => props.onSwitchMode("signin")} className="cursor-pointer border-none bg-transparent p-0 text-[13px] font-bold text-[#FF6B00] hover:underline">Đăng nhập</button>
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
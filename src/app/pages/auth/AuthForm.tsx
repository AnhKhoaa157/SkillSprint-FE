import { useEffect, useState } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, User, Wrench } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

const F = "'Plus Jakarta Sans', 'Inter', sans-serif";
const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const ALLOWED_EMAIL_DOMAINS = ["gmail.com", "fpt.edu.vn"] as const;

export function getEmailError(rawEmail: string): string | null {
  const email = rawEmail.trim().toLowerCase();
  if (!email) return "Vui lòng nhập địa chỉ email.";
  if (!EMAIL_PATTERN.test(email)) return "Định dạng email không hợp lệ.";
  const domain = email.slice(email.lastIndexOf("@") + 1);
  if (!ALLOWED_EMAIL_DOMAINS.some(allowed => allowed === domain)) {
    return "Email phải có đuôi @gmail.com hoặc @fpt.edu.vn";
  }
  return null;
}

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

function InputField({
  id, label, icon: Icon, value, onChange, onBlur,
  type = "text", placeholder, autoComplete, error, labelAction, trailing, disabled,
}: {
  id: string; label: string; icon: React.ElementType; value: string;
  onChange: (value: string) => void; onBlur?: () => void; type?: string;
  placeholder?: string; autoComplete?: string; error?: string | null;
  labelAction?: React.ReactNode; trailing?: React.ReactNode; disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <Label htmlFor={id} className="text-[13px] font-semibold tracking-[-0.01em] text-slate-700">
          {label}
        </Label>
        {labelAction}
      </div>
      <div className="relative group flex items-center">
        <Icon size={17} strokeWidth={2} aria-hidden className={`absolute left-3.5 z-10 transition-colors duration-300 ${error ? "text-red-400" : "text-slate-400 group-focus-within:text-[#FF6B00]"}`} />
        <Input
          id={id} type={type} value={value} onChange={e => onChange(e.target.value)} onBlur={onBlur}
          placeholder={placeholder} autoComplete={autoComplete} aria-invalid={!!error} disabled={disabled}
          className={`min-h-[48px] w-full rounded-xl pl-[2.4rem] pr-10 text-[15px] font-medium text-slate-900 placeholder:font-normal placeholder:text-slate-400 disabled:cursor-not-allowed transition-all duration-300 ${
            error 
              ? "border-red-400 focus-visible:border-red-500 focus-visible:ring-4 focus-visible:ring-red-500/20" 
              : "border-slate-200 focus-visible:border-[#FF6B00] focus-visible:ring-4 focus-visible:ring-[#FF6B00]/20"
          }`}
        />
        {trailing && <div className="absolute right-0 top-0 bottom-0 flex items-center pr-1.5 z-10">{trailing}</div>}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="mt-1.5 text-xs font-medium text-red-500">
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export interface AuthFormProps {
  mode: "signin" | "signup";
  name: string;
  email: string;
  password: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  authError?: string;
  isSubmitting: boolean;
  onSubmit: () => void;
  onContinueWithGoogle: () => void;
  onForgotPassword: () => void;
  onSwitchMode: (mode: "signin" | "signup") => void;
  /** Soft lockdown: when true the form stays visible but every actionable control is disabled. */
  isMaintenanceActive?: boolean;
  /** True while the last-second "double-check guard" re-verifies status before the Google redirect. */
  isGoogleLoading?: boolean;
}

export function AuthForm({
  mode, name, email, password,
  onNameChange, onEmailChange, onPasswordChange,
  authError, isSubmitting, onSubmit, onContinueWithGoogle, onForgotPassword, onSwitchMode,
  isMaintenanceActive = false, isGoogleLoading = false,
}: AuthFormProps) {
  const isSignup = mode === "signup";
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<{ name?: boolean; email?: boolean; password?: boolean }>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    setTouched({});
    setSubmitAttempted(false);
    setShowPassword(false);
  }, [mode]);

  const showFor = (field: keyof typeof touched) => touched[field] || submitAttempted;

  const nameError = isSignup && showFor("name") && !name.trim() ? "Vui lòng nhập họ và tên." : null;
  const emailError = showFor("email") ? getEmailError(email) : null;
  const passwordError = showFor("password")
    ? !password ? "Vui lòng nhập mật khẩu." : isSignup && password.length < 8 ? "Mật khẩu phải có ít nhất 8 ký tự." : null
    : null;

  // Soft lockdown short-circuit: while maintenance is active every actionable control is disabled,
  // but we also hard-block submission here so a stray keyboard "Enter" can't slip a login through.
  // Otherwise the request fires naturally and the backend enforces the multi-tenant rule (admins →
  // 200 bypass, learners → 503), which <Auth> catches and surfaces as an inline error. Normal field
  // validation + the in-flight guard also block submission.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isMaintenanceActive) return;
    setSubmitAttempted(true);
    const invalid = getEmailError(email) !== null || !password || (isSignup && (password.length < 8 || !name.trim()));
    if (invalid || isSubmitting) return;
    onSubmit();
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div key={mode} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }} style={{ fontFamily: F }}>
        <h2 className={`text-[1.9rem] font-extrabold leading-tight tracking-[-0.035em] text-slate-900 ${isSignup ? "mb-2" : "mb-8"}`}>
          {isSignup ? "Tạo tài khoản mới ✨" : "Chào mừng trở lại 👋"}
        </h2>
        {isSignup && (
          <p className="mb-10 text-sm leading-relaxed text-slate-500">
            Tham gia cùng các bạn sinh viên đang bứt phá.
          </p>
        )}

        {/* Soft-lockdown banner. Stays mounted above the (still-visible) form whenever maintenance is
            active so the user understands why the buttons are greyed out, instead of the whole page
            being swapped for a black screen. Amber/orange tones to match the brand + a "scheduled
            upgrade" tone. */}
        <AnimatePresence>
          {isMaintenanceActive && (
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
                    Cổng đăng nhập tạm thời bị khoá để tối ưu hiệu năng. Các nút đăng nhập sẽ tự mở lại
                    ngay khi quá trình bảo trì hoàn tất — bạn không cần tải lại trang.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Google sign-in via Cognito Hosted UI. <Auth> wires onContinueWithGoogle to a "double-check
            guard" that re-verifies maintenance status right before redirecting. The button is disabled
            while submitting, while that check runs (isGoogleLoading), and during soft lockdown. The SVG
            sits in a pointer-events-none wrapper so dragging across the button selects the label text. */}
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting || isGoogleLoading || isMaintenanceActive}
          aria-disabled={isSubmitting || isGoogleLoading || isMaintenanceActive}
          onClick={onContinueWithGoogle}
          style={isMaintenanceActive ? { cursor: "not-allowed" } : undefined}
          className="relative flex min-h-[48px] w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] font-semibold text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-300 cursor-pointer hover:border-slate-300 hover:shadow-[0_6px_14px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:-translate-y-0 disabled:hover:shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
        >
          {isGoogleLoading ? (
            <Loader2 size={17} className="animate-spin text-slate-400" />
          ) : (
            <div className="pointer-events-none shrink-0 flex items-center justify-center select-none">
              <GoogleIcon />
            </div>
          )}
          <span>
            {isGoogleLoading
              ? "Đang kiểm tra hệ thống..."
              : isSignup ? "Sign up with Google" : "Sign in with Google"}
          </span>
        </Button>

        <div className="my-8 flex items-center gap-3">
          <div className="h-px flex-1 border-t border-slate-100" />
          <span className="whitespace-nowrap text-xs text-slate-400">hoặc tiếp tục với email</span>
          <div className="h-px flex-1 border-t border-slate-100" />
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {isSignup && (
            <InputField id="auth-name" label="Họ và tên" icon={User} value={name} onChange={onNameChange} onBlur={() => setTouched(t => ({ ...t, name: true }))} placeholder="Nguyễn Văn A" autoComplete="name" error={nameError} disabled={isMaintenanceActive} />
          )}

          <InputField id="auth-email" label="Địa chỉ email" icon={Mail} type="email" value={email} onChange={onEmailChange} onBlur={() => setTouched(t => ({ ...t, email: true }))} placeholder="student@gmail.com" autoComplete="email" error={emailError} disabled={isMaintenanceActive} />

          <InputField id="auth-password" label="Mật khẩu" icon={Lock} type={showPassword ? "text" : "password"} value={password} onChange={onPasswordChange} onBlur={() => setTouched(t => ({ ...t, password: true }))} placeholder="••••••••" autoComplete={isSignup ? "new-password" : "current-password"} error={passwordError} disabled={isMaintenanceActive}
            labelAction={!isSignup ? (
              <button type="button" onClick={onForgotPassword} className="cursor-pointer border-none bg-transparent p-0 text-[13px] font-semibold text-slate-400 underline-offset-4 transition-colors hover:text-[#FF6B00] hover:underline">Quên mật khẩu?</button>
            ) : undefined}
            trailing={
              <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} className="mr-3.5 flex cursor-pointer items-center border-none bg-transparent p-0 text-slate-400 transition-colors hover:text-slate-600">
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

          <Button
            type="submit"
            disabled={isSubmitting || isMaintenanceActive}
            aria-disabled={isSubmitting || isMaintenanceActive}
            className={`flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border-none text-[15px] font-bold text-white transition-all duration-150 ${isMaintenanceActive
              ? "cursor-not-allowed bg-slate-300 shadow-none hover:bg-slate-300"
              : "bg-[#FF6B00] shadow-[0_4px_14px_rgba(255,107,0,0.2)] hover:bg-[#FF7A00] hover:shadow-[0_0_20px_rgba(255,107,0,0.3)] active:translate-y-0.5"
              }`}
            style={{ cursor: isMaintenanceActive ? "not-allowed" : "pointer" }}
          >
            {isMaintenanceActive ? (
              <>
                <Wrench size={16} strokeWidth={2.4} />
                Tạm khoá do bảo trì
              </>
            ) : isSubmitting ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                {isSignup ? "Đang tạo..." : "Đang đăng nhập..."}
              </>
            ) : (
              <>
                {isSignup ? "Tạo tài khoản" : "Đăng nhập"}
                <ArrowRight size={16} strokeWidth={2.5} />
              </>
            )}
          </Button>
        </form>

        {isSignup && <p className="mt-4 text-center text-xs text-slate-400">Bắt đầu miễn phí. Không cần thẻ tín dụng.</p>}

        <div className="mt-7 space-y-4">
          <p className="text-center text-[13px] text-slate-500">
            {isSignup ? "Đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
            <button type="button" onClick={() => onSwitchMode(isSignup ? "signin" : "signup")} className="cursor-pointer border-none bg-transparent p-0 text-[13px] font-bold text-[#FF6B00] underline-offset-4 transition-all hover:text-orange-600 hover:underline">{isSignup ? "Đăng nhập" : "Đăng ký ngay"}</button>
          </p>
          <p className="text-center text-xs">
            <Link to="/admin-login" className="block w-full text-center mx-auto text-slate-400 no-underline underline-offset-4 transition-colors hover:text-slate-600 hover:underline">Đăng nhập cho đối tác trường ĐH</Link>
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
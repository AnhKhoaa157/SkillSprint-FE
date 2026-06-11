import { useEffect, useState } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";

/* ─── Tokens ─── */
const F = "'Plus Jakarta Sans', 'Inter', sans-serif";

/* ─── Email validation ───
   Only personal Gmail accounts and FPT University student emails are accepted. */
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

/* ─── Google SVG ─── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  );
}

/* ─── Input field ─── */
function InputField({
  id, label, icon: Icon, value, onChange, onBlur,
  type = "text", placeholder, autoComplete, error, labelAction, trailing,
}: {
  id: string;
  label: string;
  icon: React.ElementType;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  error?: string | null;
  labelAction?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label htmlFor={id} className="text-[13px] font-semibold tracking-[-0.01em] text-slate-700">
          {label}
        </label>
        {labelAction}
      </div>
      <div
        className={`flex items-center rounded-xl border bg-white transition-all duration-200 ${
          error
            ? "border-red-400 focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/10"
            : "border-slate-200 focus-within:border-[#FF6B00] focus-within:ring-4 focus-within:ring-[#FF6B00]/10"
        }`}
      >
        <Icon size={17} strokeWidth={2} aria-hidden
          className={`ml-3.5 shrink-0 transition-colors duration-200 ${error ? "text-red-400" : "text-slate-400"}`}
        />
        <input
          id={id}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          className="min-h-[46px] w-full rounded-xl bg-transparent px-3 text-[15px] font-medium text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 autofill:shadow-[inset_0_0_0_1000px_#ffffff] autofill:[-webkit-text-fill-color:#0f172a]"
        />
        {trailing}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="mt-1.5 text-xs font-medium text-red-500"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Auth form ─── */
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
}

export function AuthForm({
  mode, name, email, password,
  onNameChange, onEmailChange, onPasswordChange,
  authError, isSubmitting, onSubmit, onContinueWithGoogle, onForgotPassword, onSwitchMode,
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
    ? !password
      ? "Vui lòng nhập mật khẩu."
      : isSignup && password.length < 8
        ? "Mật khẩu phải có ít nhất 8 ký tự."
        : null
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    const invalid =
      getEmailError(email) !== null ||
      !password ||
      (isSignup && (password.length < 8 || !name.trim()));
    if (invalid || isSubmitting) return;
    onSubmit();
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={mode}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22 }}
        style={{ fontFamily: F }}
      >
        {/* Heading */}
        <h2 className="mb-2 text-[1.9rem] font-extrabold leading-tight tracking-[-0.035em] text-slate-900">
          {isSignup ? "Tạo tài khoản mới ✨" : "Chào mừng trở lại 👋"}
        </h2>
        <p className="mb-7 text-sm leading-relaxed text-slate-500">
          {isSignup
            ? "Tham gia cùng các bạn sinh viên đang bứt phá."
            : "Đăng nhập để tiếp tục hành trình học tập"}
        </p>

        {/* Google sign-in through AWS Cognito Hosted UI */}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onContinueWithGoogle}
          className="relative flex min-h-[46px] w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <GoogleIcon />
          <span>{isSignup ? "Sign up with Google" : "Sign in with Google"}</span>
        </button>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 border-t border-slate-100" />
          <span className="whitespace-nowrap text-xs text-slate-400">hoặc tiếp tục với email</span>
          <div className="h-px flex-1 border-t border-slate-100" />
        </div>

        {/* Fields */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {isSignup && (
            <InputField
              id="auth-name"
              label="Họ và tên"
              icon={User}
              value={name}
              onChange={onNameChange}
              onBlur={() => setTouched(t => ({ ...t, name: true }))}
              placeholder="Nguyễn Văn A"
              autoComplete="name"
              error={nameError}
            />
          )}

          <InputField
            id="auth-email"
            label="Địa chỉ email"
            icon={Mail}
            type="email"
            value={email}
            onChange={onEmailChange}
            onBlur={() => setTouched(t => ({ ...t, email: true }))}
            placeholder="student@gmail.com"
            autoComplete="email"
            error={emailError}
          />

          <InputField
            id="auth-password"
            label="Mật khẩu"
            icon={Lock}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={onPasswordChange}
            onBlur={() => setTouched(t => ({ ...t, password: true }))}
            placeholder="••••••••"
            autoComplete={isSignup ? "new-password" : "current-password"}
            error={passwordError}
            labelAction={
              !isSignup ? (
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="cursor-pointer border-none bg-transparent p-0 text-[13px] font-semibold text-slate-400 underline-offset-4 transition-colors hover:text-[#FF6B00] hover:underline"
                >
                  Quên mật khẩu?
                </button>
              ) : undefined
            }
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                className="mr-3.5 flex cursor-pointer items-center border-none bg-transparent p-0 text-slate-400 transition-colors hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            }
          />

          {/* Server / submit error */}
          <AnimatePresence>
            {authError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] leading-relaxed text-red-700"
                role="alert"
              >
                {authError}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Primary CTA */}
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={isSubmitting ? undefined : { scale: 1.015, y: -1 }}
            whileTap={isSubmitting ? undefined : { scale: 0.985 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border-none bg-gradient-to-r from-[#FF6B00] to-[#FF7E21] text-[15px] font-bold text-white shadow-[0_4px_20px_rgba(255,107,0,0.25)] transition-[box-shadow,filter] duration-200 hover:brightness-[1.06] hover:shadow-[0_8px_28px_rgba(255,107,0,0.35)] disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none disabled:hover:brightness-100"
            style={{ cursor: isSubmitting ? "not-allowed" : "pointer" }}
          >
            {isSubmitting ? (
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
          </motion.button>
        </form>

        {isSignup && (
          <p className="mt-4 text-center text-xs text-slate-400">
            Bắt đầu miễn phí. Không cần thẻ tín dụng.
          </p>
        )}

        {/* Footer links */}
        <div className="mt-7 space-y-4">
          <p className="text-center text-[13px] text-slate-500">
            {isSignup ? "Đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
            <button
              type="button"
              onClick={() => onSwitchMode(isSignup ? "signin" : "signup")}
              className="cursor-pointer border-none bg-transparent p-0 text-[13px] font-bold text-[#FF6B00] underline-offset-4 transition-all hover:text-orange-600 hover:underline"
            >
              {isSignup ? "Đăng nhập" : "Đăng ký ngay"}
            </button>
          </p>

          <p className="text-center text-xs">
            <Link
              to="/admin-login"
              className="text-slate-400 no-underline underline-offset-4 transition-colors hover:text-slate-600 hover:underline"
            >
              Đăng nhập cho đối tác trường ĐH
            </Link>
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

import { motion, useReducedMotion } from "framer-motion";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Circle,
  CircleAlert,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { PW_RULES, SLIDE } from "./config";
import type { AdminAuthState } from "./useAdminAuth";

const fieldShellClassName =
  "group relative flex min-h-[52px] items-center rounded-[14px] border border-slate-300 bg-white px-4 shadow-sm transition-[border-color,box-shadow,background-color] duration-200 hover:border-slate-400 focus-within:border-[#F86206] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#F86206]/10";

const primaryButtonClassName =
  "inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#F86206] px-4 text-sm font-black uppercase tracking-[0.035em] text-white shadow-[0_10px_24px_rgba(248,98,6,0.24)] transition-[background-color,box-shadow,transform] duration-200 hover:bg-[#EA580C] hover:shadow-[0_12px_28px_rgba(248,98,6,0.3)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F86206]/30 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none";

type FormFieldProps = {
  id: string;
  label: string;
  icon: LucideIcon;
  value: string;
  onChange: (value: string) => void;
  type?: "email" | "password" | "text";
  placeholder: string;
  autoComplete?: string;
  autoFocus?: boolean;
  error?: string | null;
  labelAction?: ReactNode;
  trailing?: ReactNode;
};

function AuthField({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  autoFocus,
  error,
  labelAction,
  trailing,
}: FormFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className="space-y-2 text-left">
      <div className="flex min-h-5 items-start justify-between gap-3">
        <label htmlFor={id} className="pt-0.5 text-xs font-extrabold text-slate-700">
          {label}
        </label>
        {labelAction ??
          (error ? (
            <span id={errorId} role="alert" className="text-right text-xs font-semibold leading-5 text-rose-600">
              {error}
            </span>
          ) : null)}
      </div>
      <div className={`${fieldShellClassName} ${error ? "border-rose-400 focus-within:border-rose-500 focus-within:ring-rose-500/10" : ""}`}>
        <Icon className="mr-3 size-[18px] shrink-0 text-slate-400 transition-colors duration-200 group-focus-within:text-[#EA580C]" aria-hidden="true" />
        <input
          id={id}
          type={type}
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className="h-full min-w-0 flex-1 border-none bg-transparent p-0 pr-10 text-sm font-semibold text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 focus:ring-0"
        />
        {trailing}
      </div>
    </div>
  );
}

function PasswordVisibilityButton({ visible, onToggle, label }: { visible: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={`${visible ? "Ẩn" : "Hiện"} ${label}`}
      className="absolute right-1 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-xl text-slate-400 transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F86206]/20"
    >
      {visible ? <EyeOff className="size-[18px]" aria-hidden="true" /> : <Eye className="size-[18px]" aria-hidden="true" />}
    </button>
  );
}

function PrimaryButton({ children, className = "", ...props }: ComponentPropsWithoutRef<"button">) {
  return (
    <button {...props} className={`${primaryButtonClassName} ${className}`}>
      {children}
    </button>
  );
}

function AuthViewMotion({ children }: { children: ReactNode }) {
  const prefersReducedMotion = useReducedMotion();
  const animation = prefersReducedMotion
    ? { initial: false, animate: { opacity: 1 }, transition: { duration: 0 } }
    : SLIDE;

  return <motion.div {...animation} className="flex w-full flex-col justify-center">{children}</motion.div>;
}

function FormHeader({ icon: Icon, title, description, badge }: { icon: LucideIcon; title: string; description: ReactNode; badge?: string }) {
  return (
    <div className="mb-8 text-center">
      {badge ? (
        <div className="mb-4 inline-flex min-h-8 items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#EA580C]">
          <Icon className="size-3.5" aria-hidden="true" />
          {badge}
        </div>
      ) : (
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl border border-orange-100 bg-orange-50 text-[#EA580C] shadow-sm">
          <Icon className="size-6" aria-hidden="true" />
        </div>
      )}
      <h1 className="text-[30px] font-black leading-tight tracking-[-0.04em] text-slate-950 sm:text-[32px]">{title}</h1>
      <p className="mx-auto mt-2 max-w-[320px] text-sm font-medium leading-relaxed text-slate-500">{description}</p>
    </div>
  );
}

function BackToLoginButton({ onClick, label = "Quay lại đăng nhập" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-7 inline-flex min-h-11 w-fit items-center gap-2 rounded-xl px-1 text-sm font-bold text-slate-600 transition-colors hover:text-[#EA580C] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F86206]/20"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      {label}
    </button>
  );
}

export function ErrBanner({ msg }: { msg: string }) {
  if (!msg) return null;

  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold leading-relaxed text-rose-700">
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{msg}</span>
    </div>
  );
}

export function BrandPanel() {
  const benefits = [
    { icon: ShieldCheck, title: "Xác thực & bảo mật tập trung", description: "Kiểm soát quyền truy cập và thao tác quản trị ở một nơi." },
    { icon: BarChart3, title: "Báo cáo & phân tích thời gian thực", description: "Theo dõi sức khỏe vận hành để ra quyết định nhanh hơn." },
  ];

  return (
    <section aria-label="Giới thiệu cổng quản trị SkillSprint" className="relative min-w-0 overflow-hidden border-b border-orange-100 bg-[#fff8f2] p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-12">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(249,115,22,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(249,115,22,0.07)_1px,transparent_1px)] bg-[size:24px_24px]" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-24 -top-24 size-64 rounded-full bg-orange-200/30 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-28 -right-28 size-72 rounded-full bg-amber-100/60 blur-3xl" aria-hidden="true" />

      <div className="relative">
        <img src="/logo.png" alt="SkillSprint" className="h-20 w-auto max-w-full object-contain" />

        <div className="mt-7 lg:mt-12">
          <div className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-orange-200 bg-white/85 px-3 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#EA580C] shadow-sm">
            <Zap className="size-3.5 fill-current" aria-hidden="true" />
            Cổng quản trị
          </div>
          <h2 className="mt-4 max-w-full text-[30px] font-black leading-[1.08] tracking-[-0.045em] text-slate-950 sm:text-[38px]">
            Quản lý hệ thống <span className="block text-[#EA580C]">SkillSprint</span>
          </h2>
          <p className="mt-4 max-w-md text-sm font-medium leading-6 text-slate-600">
            Phê duyệt đối tác, giám sát hoạt động và điều phối nền tảng từ một nơi duy nhất.
          </p>
        </div>

        <ul className="mt-8 hidden space-y-3 lg:block" aria-label="Quyền lợi của cổng quản trị">
          {benefits.map(({ icon: Icon, title, description }) => (
            <li key={title} className="flex items-start gap-3.5 rounded-2xl border border-white/90 bg-white/85 p-4 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-orange-100 bg-orange-50 text-[#EA580C]">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-extrabold text-slate-800">{title}</span>
                <span className="mt-1 block text-xs font-medium leading-5 text-slate-500">{description}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function LoginView({ auth }: { auth: AdminAuthState }) {
  const {
    handleLogin,
    email,
    setEmail,
    showPwd,
    setShowPwd,
    password,
    setPassword,
    remember,
    setRemember,
    loginError,
    submitting,
    setRecoveryEmail,
    goTo,
  } = auth;

  const emailError = loginError && (loginError.toLowerCase().includes("email") || loginError.includes("tài khoản")) ? loginError : null;
  const passwordError = loginError && (loginError.toLowerCase().includes("mật khẩu") || loginError.includes("password")) ? loginError : null;
  const generalError = !emailError && !passwordError ? loginError : null;

  return (
    <AuthViewMotion>
      <FormHeader
        icon={ShieldCheck}
        badge="Hệ thống bảo mật cao"
        title="Đăng nhập Admin"
        description="Chỉ tài khoản có quyền quản trị mới được phép truy cập."
      />

      <form onSubmit={handleLogin} className="space-y-5">
        <AuthField id="admin-email" label="Email quản trị" icon={Mail} value={email} onChange={setEmail} type="email" placeholder="admin@company.com" autoComplete="email" error={emailError} />
        <AuthField
          id="admin-password"
          label="Mật khẩu"
          icon={Lock}
          value={password}
          onChange={setPassword}
          type={showPwd ? "text" : "password"}
          placeholder="••••••••"
          autoComplete="current-password"
          error={passwordError}
          trailing={<PasswordVisibilityButton visible={showPwd} onToggle={() => setShowPwd((current) => !current)} label="mật khẩu" />}
        />

        <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-xs font-bold text-slate-600">
            <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="size-4 rounded border-slate-300 accent-[#F86206]" />
            Ghi nhớ đăng nhập
          </label>
          <button
            type="button"
            onClick={() => {
              setRecoveryEmail(email.trim());
              goTo("fp-step1");
            }}
            className="min-h-11 rounded-lg px-1 text-xs font-extrabold text-[#EA580C] transition-colors hover:text-orange-700 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F86206]/20"
          >
            Quên mật khẩu?
          </button>
        </div>

        <ErrBanner msg={generalError ?? ""} />

        <PrimaryButton type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          {submitting ? "Đang xác thực..." : "Đăng nhập"}
        </PrimaryButton>
      </form>

      <p className="mt-8 border-t border-slate-200 pt-5 text-center text-xs font-medium leading-relaxed text-slate-500">
        Chỉ sử dụng tài khoản được cấp quyền. Mọi hoạt động quản trị đều được ghi nhận.
      </p>
    </AuthViewMotion>
  );
}

export function ForgotStep1View({ auth }: { auth: AdminAuthState }) {
  const { goTo, handleFpStep1, recoveryEmail, setRecoveryEmail, fpError, step1Loading } = auth;
  const emailError = fpError && (fpError.toLowerCase().includes("email") || fpError.includes("tài khoản")) ? fpError : null;
  const generalError = !emailError ? fpError : null;

  return (
    <AuthViewMotion>
      <BackToLoginButton onClick={() => goTo("login")} />
      <FormHeader icon={KeyRound} title="Quên mật khẩu" description="Nhập email quản trị để nhận mã xác minh." />
      <form onSubmit={handleFpStep1} className="space-y-6">
        <AuthField id="admin-recovery-email" label="Email tài khoản Admin" icon={Mail} value={recoveryEmail} onChange={setRecoveryEmail} type="email" placeholder="admin@company.com" autoComplete="email" autoFocus error={emailError} />
        <ErrBanner msg={generalError ?? ""} />
        <PrimaryButton type="submit" disabled={step1Loading}>
          {step1Loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          {step1Loading ? "Đang gửi mã..." : "Gửi mã xác minh"}
        </PrimaryButton>
      </form>
    </AuthViewMotion>
  );
}

export function ForgotStep2View({ auth }: { auth: AdminAuthState }) {
  const {
    goTo,
    recoveryEmail,
    handleFpStep2,
    fpCode,
    setFpCode,
    handleResendCode,
    fpShowPwd,
    setFpShowPwd,
    fpPassword,
    setFpPassword,
    strength,
    fpConfirm,
    setFpConfirm,
    confirmMismatch,
    fpShowConfirm,
    setFpShowConfirm,
    step2Loading,
    fpError,
  } = auth;

  const codeError = fpError && (fpError.toLowerCase().includes("mã") || fpError.includes("code")) ? fpError : null;
  const passwordError = fpError && (fpError.toLowerCase().includes("mật khẩu") || fpError.includes("password") || fpError.includes("yêu cầu")) ? fpError : null;
  const generalError = !codeError && !passwordError ? fpError : null;

  return (
    <AuthViewMotion>
      <BackToLoginButton onClick={() => goTo("fp-step1")} label="Quay lại email xác minh" />
      <FormHeader
        icon={ShieldCheck}
        title="Đặt lại mật khẩu"
        description={<><span>Mã xác minh đã được gửi đến </span><span className="font-bold text-slate-700">{recoveryEmail}</span>.</>}
      />

      <form onSubmit={handleFpStep2} className="space-y-5">
        <AuthField
          id="admin-recovery-code"
          label="Mã xác minh"
          icon={KeyRound}
          value={fpCode}
          onChange={setFpCode}
          placeholder="Nhập mã gồm 6 ký tự"
          autoComplete="one-time-code"
          autoFocus
          error={codeError}
          labelAction={
            <button type="button" onClick={handleResendCode} className="min-h-8 rounded-lg px-1 text-xs font-extrabold text-[#EA580C] hover:text-orange-700 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F86206]/20">
              Gửi lại mã
            </button>
          }
        />
        <AuthField
          id="admin-new-password"
          label="Mật khẩu mới"
          icon={Lock}
          value={fpPassword}
          onChange={setFpPassword}
          type={fpShowPwd ? "text" : "password"}
          placeholder="••••••••"
          autoComplete="new-password"
          error={passwordError}
          trailing={<PasswordVisibilityButton visible={fpShowPwd} onToggle={() => setFpShowPwd((current) => !current)} label="mật khẩu mới" />}
        />

        {fpPassword ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex gap-1.5" aria-label={`Độ mạnh mật khẩu: ${strength.label}`}>
              {PW_RULES.map((rule, index) => (
                <span key={rule.label} className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: index < strength.n ? strength.color : "#E2E8F0" }} />
              ))}
            </div>
            <p className="mt-2 text-xs font-extrabold" style={{ color: strength.color }}>Độ mạnh: {strength.label}</p>
            <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
              {PW_RULES.map((rule) => {
                const passes = rule.test(fpPassword);
                const RuleIcon = passes ? CheckCircle2 : Circle;
                return (
                  <li key={rule.label} className={`flex items-center gap-1.5 text-xs font-medium ${passes ? "text-emerald-700" : "text-slate-500"}`}>
                    <RuleIcon className="size-3.5 shrink-0" aria-hidden="true" />
                    {rule.label}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <AuthField
          id="admin-confirm-password"
          label="Xác nhận mật khẩu mới"
          icon={Lock}
          value={fpConfirm}
          onChange={setFpConfirm}
          type={fpShowConfirm ? "text" : "password"}
          placeholder="••••••••"
          autoComplete="new-password"
          error={confirmMismatch ? "Mật khẩu xác nhận chưa khớp." : null}
          trailing={<PasswordVisibilityButton visible={fpShowConfirm} onToggle={() => setFpShowConfirm((current) => !current)} label="xác nhận mật khẩu" />}
        />

        <ErrBanner msg={generalError ?? ""} />
        <PrimaryButton type="submit" disabled={step2Loading || confirmMismatch || !fpPassword}>
          {step2Loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          {step2Loading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
        </PrimaryButton>
      </form>
    </AuthViewMotion>
  );
}

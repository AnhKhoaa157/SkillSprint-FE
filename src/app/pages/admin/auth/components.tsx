import { motion } from "framer-motion";
import {
  ArrowLeft, Eye, EyeOff, KeyRound, Loader2, Lock,
  Mail, ShieldCheck, BarChart3,
} from "lucide-react";
import { fieldCls, primaryBtnCls, PW_RULES, SLIDE } from "./config";
import type { AdminAuthState } from "./useAdminAuth";

// ─── Inline error banner ──────────────────────────────────────────────────────

export function ErrBanner({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div
      className="text-sm px-3 py-2 rounded-md"
      style={{
        color: "#B91C1C",
        background: "rgba(254,226,226,0.6)",
        border: "1px solid rgba(185,28,28,0.12)",
      }}
    >
      {msg}
    </div>
  );
}

// ─── Static branding column ───────────────────────────────────────────────────

export function BrandPanel() {
  return (
    <div
      className="relative p-8 md:p-10 flex flex-col justify-between gap-8 overflow-hidden"
      style={{
        background: "linear-gradient(145deg, #fff8f3 0%, #fff3ea 60%, #ffeadb 100%)",
        borderRight: "1px solid rgba(255,107,0,0.08)",
      }}
    >
      {/* Decorative circle */}
      <div
        className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(255,107,0,0.10) 0%, transparent 70%)" }}
      />

      {/* Brand Logo Header */}
      <div className="flex items-center relative z-10">
        <img
          src="/logo.png"
          alt="SkillSprint Logo"
          className="h-20 w-20 object-cover rounded-xl flex-shrink-0 shadow-sm"
        />
      </div>

      {/* Brand copy */}
      <div className="relative z-10 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-700">
          <ShieldCheck className="w-3.5 h-3.5" />
          Cổng Quản Trị Bảo Mật
        </div>
        <h2 className="text-2xl md:text-[1.75rem] font-extrabold text-slate-900 leading-snug">
          Quản lý hệ thống<br />
          <span className="text-orange-600">SkillSprint</span>
        </h2>
        <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
          Phê duyệt đối tác, giám sát hoạt động và điều phối nền tảng từ một nơi duy nhất.
        </p>
      </div>

      {/* Feature list */}
      <ul className="relative z-10 space-y-3 text-sm text-slate-600">
        <li className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm flex-shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          </span>
          Xác thực & bảo mật tập trung
        </li>
        <li className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm flex-shrink-0">
            <BarChart3 className="w-3.5 h-3.5 text-orange-500" />
          </span>
          Báo cáo & phân tích thời gian thực
        </li>
      </ul>
    </div>
  );
}

// ─── LOGIN VIEW ───────────────────────────────────────────────────────────────

export function LoginView({ auth }: { auth: AdminAuthState }) {
  const {
    handleLogin, email, setEmail, showPwd, setShowPwd,
    password, setPassword, remember, setRemember,
    loginError, submitting, setRecoveryEmail, goTo,
  } = auth;

  return (
    <motion.div key="login" {...SLIDE}>
      <div className="mb-7">
        <h3 className="text-xl font-bold text-slate-900">Đăng nhập Admin</h3>
        <p className="mt-1 text-sm text-slate-500">
          Chỉ tài khoản có quyền quản trị mới được phép truy cập.
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
            Email quản trị
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Mail className="w-4 h-4" />
            </span>
            <input
              type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@company.com"
              className={`${fieldCls} pl-10 pr-4 py-2.5`}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
            Mật khẩu
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Lock className="w-4 h-4" />
            </span>
            <input
              type={showPwd ? "text" : "password"} required
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`${fieldCls} pl-10 pr-10 py-2.5`}
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Toggle password visibility"
            >
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Remember / Forgot */}
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox" checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="accent-orange-500 rounded"
            />
            Ghi nhớ đăng nhập
          </label>
          <button
            type="button"
            onClick={() => { setRecoveryEmail(email.trim()); goTo("fp-step1"); }}
            className="text-orange-600 hover:text-orange-500 text-sm font-medium transition-colors hover:underline underline-offset-2"
          >
            Quên mật khẩu?
          </button>
        </div>

        <ErrBanner msg={loginError} />

        <button type="submit" disabled={submitting} className={primaryBtnCls}>
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? "Đang xác thực..." : "Đăng nhập"}
        </button>
      </form>
    </motion.div>
  );
}

// ─── FP STEP 1: Request code ──────────────────────────────────────────────────

export function ForgotStep1View({ auth }: { auth: AdminAuthState }) {
  const { goTo, handleFpStep1, recoveryEmail, setRecoveryEmail, fpError, step1Loading } = auth;

  return (
    <motion.div key="fp-step1" {...SLIDE}>
      <button
        type="button"
        onClick={() => goTo("login")}
        className="inline-flex items-center gap-1.5 mb-6 text-xs font-semibold text-slate-500 hover:text-orange-600 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Quay lại đăng nhập
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-5 ring-1 ring-orange-100 flex-shrink-0">
          <KeyRound className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Quên mật khẩu</h3>
          <p className="text-xs text-slate-500">Nhập email để nhận mã xác minh.</p>
        </div>
      </div>

      <form onSubmit={handleFpStep1} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
            Email tài khoản Admin
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Mail className="w-4 h-4" />
            </span>
            <input
              type="email" required autoFocus
              value={recoveryEmail}
              onChange={(e) => setRecoveryEmail(e.target.value)}
              placeholder="admin@company.com"
              className={`${fieldCls} pl-10 pr-4 py-2.5`}
            />
          </div>
        </div>

        <ErrBanner msg={fpError} />

        <button type="submit" disabled={step1Loading} className={primaryBtnCls}>
          {step1Loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {step1Loading ? "Đang gửi mã..." : "Gửi mã xác minh"}
        </button>
      </form>
    </motion.div>
  );
}

// ─── FP STEP 2: code + new password + confirm ─────────────────────────────────

export function ForgotStep2View({ auth }: { auth: AdminAuthState }) {
  const {
    goTo, recoveryEmail, handleFpStep2, fpCode, setFpCode, handleResendCode,
    fpShowPwd, setFpShowPwd, fpPassword, setFpPassword, strength,
    fpConfirm, setFpConfirm, confirmMismatch, fpShowConfirm, setFpShowConfirm,
    step2Loading, fpError,
  } = auth;

  return (
    <motion.div key="fp-step2" {...SLIDE}>
      <button
        type="button"
        onClick={() => goTo("fp-step1")}
        className="inline-flex items-center gap-1.5 mb-5 text-xs font-semibold text-slate-500 hover:text-orange-600 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Quay lại
      </button>

      <div className="mb-5">
        <h3 className="text-base font-bold text-slate-900">Đặt lại mật khẩu</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Mã xác minh đã gửi đến{" "}
          <span className="font-semibold text-slate-700">{recoveryEmail}</span>
        </p>
      </div>

      <form onSubmit={handleFpStep2} className="space-y-4">
        {/* Verification code */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
            Mã xác nhận
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <input
              type="text" inputMode="numeric" required autoFocus maxLength={6}
              value={fpCode}
              onChange={(e) => setFpCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className={`${fieldCls} pl-10 pr-4 py-2.5 tracking-[0.3em] font-mono text-center text-base`}
            />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Không nhận được mã?{" "}
            <button
              type="button"
              className="text-orange-600 font-semibold hover:underline underline-offset-2"
              onClick={handleResendCode}
            >
              Gửi lại
            </button>
          </p>
        </div>

        {/* New password */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
            Mật khẩu mới
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Lock className="w-4 h-4" />
            </span>
            <input
              type={fpShowPwd ? "text" : "password"} required
              value={fpPassword} onChange={(e) => setFpPassword(e.target.value)}
              placeholder="••••••••"
              className={`${fieldCls} pl-10 pr-10 py-2.5`}
            />
            <button
              type="button"
              onClick={() => setFpShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Toggle new password visibility"
            >
              {fpShowPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {fpPassword.length > 0 && (
            <div className="mt-2 space-y-1.5">
              <div className="flex gap-1">
                {PW_RULES.map((_, i) => (
                  <div
                    key={i}
                    className="h-1 flex-1 rounded-full transition-all duration-300"
                    style={{ background: i < strength.n ? strength.color : "#E2E8F0" }}
                  />
                ))}
              </div>
              <p className="text-[11px] font-semibold" style={{ color: strength.color }}>
                Độ mạnh: {strength.label}
              </p>
              <ul className="space-y-0.5">
                {PW_RULES.map((rule, i) => {
                  const ok = rule.test(fpPassword);
                  return (
                    <li
                      key={i}
                      className={`text-[11px] flex items-center gap-1.5 ${ok ? "text-emerald-600" : "text-slate-400"}`}
                    >
                      <span>{ok ? "✓" : "○"}</span>
                      {rule.label}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
            Xác nhận mật khẩu
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Lock className="w-4 h-4" />
            </span>
            <input
              type={fpShowConfirm ? "text" : "password"} required
              value={fpConfirm} onChange={(e) => setFpConfirm(e.target.value)}
              placeholder="••••••••"
              className={`${fieldCls} pl-10 pr-10 py-2.5 ${confirmMismatch ? "border-red-300 focus:border-red-400" : ""
                }`}
            />
            <button
              type="button"
              onClick={() => setFpShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Toggle confirm password visibility"
            >
              {fpShowConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirmMismatch && (
            <p className="mt-1 text-xs text-red-500">Mật khẩu xác nhận không khớp.</p>
          )}
        </div>

        <ErrBanner msg={fpError} />

        <button
          type="submit"
          disabled={step2Loading || confirmMismatch || fpPassword.length === 0}
          className={
            "w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 active:scale-[0.98] " +
            "disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm " +
            "transition-all duration-150 shadow-sm inline-flex items-center justify-center gap-2 mt-1"
          }
        >
          {step2Loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang đặt lại mật khẩu...
            </>
          ) : (
            "Đặt lại mật khẩu"
          )}
        </button>
      </form>
    </motion.div>
  );
}

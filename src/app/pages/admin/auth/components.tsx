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
    <div className="relative p-8 md:p-12 flex flex-col justify-between gap-10 overflow-hidden bg-gradient-to-br from-[#FF6B00] via-orange-500 to-orange-400">
      {/* Decorative blobs */}
      <div className="absolute top-[-20%] right-[-20%] w-[350px] h-[350px] rounded-full bg-white/10 blur-[60px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-20%] w-[300px] h-[300px] rounded-full bg-yellow-300/10 blur-[50px] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />

      {/* Brand Logo Header */}
      <div className="flex items-center relative z-10">
        <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl shadow-lg ring-1 ring-white/20">
          <img
            src="/logo.png"
            alt="SkillSprint Logo"
            className="h-14 w-14 object-contain"
          />
        </div>
      </div>

      {/* Brand copy */}
      <div className="relative z-10 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-bold bg-white/20 text-white backdrop-blur-sm border border-white/20 shadow-sm uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          Cổng Quản Trị
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-white leading-[1.15] drop-shadow-sm">
          Quản lý hệ thống<br />
          <span className="text-yellow-100">SkillSprint</span>
        </h2>
        <p className="text-sm text-orange-50/90 leading-relaxed max-w-xs font-medium">
          Phê duyệt đối tác, giám sát hoạt động và điều phối toàn bộ nền tảng từ một nơi duy nhất.
        </p>
      </div>

      {/* Feature list */}
      <ul className="relative z-10 space-y-4 text-sm text-white/90 font-medium">
        <li className="flex items-center gap-3.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-sm ring-1 ring-white/30 flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-white" />
          </span>
          Xác thực & bảo mật tập trung
        </li>
        <li className="flex items-center gap-3.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-sm ring-1 ring-white/30 flex-shrink-0">
            <BarChart3 className="w-4 h-4 text-white" />
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
      <div className="mb-8">
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Đăng nhập Admin</h3>
        <p className="mt-1.5 text-sm text-slate-500 font-medium">
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
          <label className="flex items-center gap-2.5 text-slate-600 cursor-pointer select-none font-medium hover:text-slate-800 transition-colors">
            <input
              type="checkbox" checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="accent-[#FF6B00] w-4 h-4 rounded cursor-pointer"
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

      <div className="flex items-center gap-4 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 ring-2 ring-orange-100 flex-shrink-0 shadow-sm">
          <KeyRound className="w-6 h-6 text-[#FF6B00]" />
        </div>
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Quên mật khẩu</h3>
          <p className="text-sm font-medium text-slate-500 mt-1">Nhập email để nhận mã xác minh.</p>
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

      <div className="mb-7">
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Đặt lại mật khẩu</h3>
        <p className="text-sm font-medium text-slate-500 mt-1.5 leading-relaxed">
          Mã xác minh đã được gửi đến{" "}
          <span className="font-bold text-slate-800">{recoveryEmail}</span>
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

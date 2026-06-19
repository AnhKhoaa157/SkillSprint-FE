import { motion } from "framer-motion";
import {
  ArrowLeft, Eye, EyeOff, KeyRound, Loader2, Lock,
  Mail, ShieldCheck, BarChart3, Zap,
} from "lucide-react";
import { fieldCls, primaryBtnCls, PW_RULES, SLIDE } from "./config";
import type { AdminAuthState } from "./useAdminAuth";

// ─── Inline error banner ──────────────────────────────────────────────────────

export function ErrBanner({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div
      className="text-xs font-semibold px-4 py-3 rounded-xl border flex items-start gap-2 text-rose-700 bg-rose-50/80 border-rose-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
    >
      <span className="shrink-0 text-rose-500 font-extrabold">⚠️</span>
      <span>{msg}</span>
    </div>
  );
}

// ─── Static branding column ───────────────────────────────────────────────────

export function BrandPanel() {
  return (
    <div className="relative p-8 md:p-12 flex flex-col justify-between gap-10 overflow-hidden bg-gradient-to-br from-[#FFFDF9] via-[#FFF5ED] to-[#FBEFE5] border-r border-slate-100/85">
      {/* Decorative glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[250px] h-[250px] rounded-full bg-[#FF8533]/12 blur-[60px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[250px] h-[250px] rounded-full bg-amber-400/8 blur-[60px] pointer-events-none" />
      
      {/* Decorative pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f3e8db_1px,transparent_1px),linear-gradient(to_bottom,#f3e8db_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none z-0 opacity-30" />

      {/* Brand Logo Header */}
      <div className="flex items-center relative z-10">
        <img
          src="/logo.png"
          alt="SkillSprint Logo"
          className="h-12 w-auto object-contain"
        />
      </div>

      {/* Brand copy */}
      <div className="relative z-10 space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-extrabold bg-[#FF8533]/8 text-[#FF8533] border border-[#FF8533]/15 shadow-sm uppercase tracking-wider select-none">
          <Zap size={11} className="fill-[#FF8533] text-[#FF8533] animate-pulse shrink-0" />
          Cổng Quản Trị
        </div>
        <h2 className="text-3xl md:text-3.5xl font-black text-slate-800 leading-[1.2] drop-shadow-sm">
          Quản lý hệ thống<br />
          <span className="bg-gradient-to-r from-[#FF8533] to-[#FF5100] bg-clip-text text-transparent">SkillSprint</span>
        </h2>
        <p className="text-sm text-slate-500 leading-relaxed max-w-xs font-semibold">
          Phê duyệt đối tác, giám sát hoạt động và điều phối toàn bộ nền tảng từ một nơi duy nhất.
        </p>
      </div>

      {/* Feature list */}
      <div className="relative z-10 space-y-3.5 text-sm text-slate-600 font-bold">
        <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white/75 border border-slate-100/90 shadow-[0_4px_16px_rgba(0,0,0,0.015)] hover:bg-white hover:border-slate-200/50 hover:shadow-[0_8px_24px_rgba(0,0,0,0.03)] transition-all duration-300">
          <span className="flex h-9.5 w-9.5 items-center justify-center rounded-xl bg-orange-50 shadow-sm ring-1 ring-orange-100 flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-[#FF8533]" />
          </span>
          <span>Xác thực & bảo mật tập trung</span>
        </div>
        <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white/75 border border-slate-100/90 shadow-[0_4px_16px_rgba(0,0,0,0.015)] hover:bg-white hover:border-slate-200/50 hover:shadow-[0_8px_24px_rgba(0,0,0,0.03)] transition-all duration-300">
          <span className="flex h-9.5 w-9.5 items-center justify-center rounded-xl bg-orange-50 shadow-sm ring-1 ring-orange-100 flex-shrink-0">
            <BarChart3 className="w-5 h-5 text-[#FF8533]" />
          </span>
          <span>Báo cáo & phân tích thời gian thực</span>
        </div>
      </div>
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

  // Derive inline errors for fields to prevent jumps
  const emailErr = loginError && (loginError.toLowerCase().includes("email") || loginError.includes("tài khoản")) ? loginError : null;
  const pwdErr = loginError && (loginError.toLowerCase().includes("mật khẩu") || loginError.includes("password")) ? loginError : null;
  const generalErr = (!emailErr && !pwdErr) ? loginError : null;

  return (
    <motion.div key="login" {...SLIDE} className="w-full flex flex-col justify-center">
      <style>{`
        @keyframes btn-gloss-admin {
          0% { transform: translateX(-150px); opacity: 0; }
          12% { opacity: 1; }
          35% { transform: translateX(380px); opacity: 0; }
          100% { transform: translateX(380px); opacity: 0; }
        }
      `}</style>

      <div className="mb-8 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-extrabold bg-[#FF8533]/8 text-[#FF8533] border border-[#FF8533]/15 uppercase tracking-widest select-none shadow-[0_2px_8px_rgba(255,133,51,0.02)] mb-3">
          <ShieldCheck size={11} className="text-[#FF8533] shrink-0" />
          Hệ thống bảo mật cao
        </div>
        <h3 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-2">Đăng nhập Admin</h3>
        <p className="text-xs text-slate-400 font-bold max-w-[280px]">
          Chỉ tài khoản có quyền quản trị mới được phép truy cập.
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        {/* Email */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 select-none">
              Email quản trị
            </label>
            {emailErr && (
              <span className="text-[10px] font-bold text-red-500 animate-pulse">
                — {emailErr}
              </span>
            )}
          </div>
          <div className="relative group flex items-center h-12.5 rounded-2xl border border-slate-200 bg-slate-50/40 px-3.5 transition-all duration-200 focus-within:bg-white focus-within:border-[#FF8533] focus-within:ring-4 focus-within:ring-[#FF8533]/8 shadow-[0_1px_2px_rgba(0,0,0,0.01)] hover:border-slate-300">
            <span className="shrink-0 text-slate-400 group-focus-within:text-[#FF8533] transition-colors duration-200 mr-2">
              <Mail className="w-4.5 h-4.5 stroke-[1.8]" />
            </span>
            <input
              type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@company.com"
              className="w-full h-full bg-transparent text-sm font-semibold text-slate-800 placeholder:font-normal placeholder:text-slate-400 outline-none border-none p-0 focus:ring-0"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 select-none">
              Mật khẩu
            </label>
            {pwdErr && (
              <span className="text-[10px] font-bold text-red-500 animate-pulse">
                — {pwdErr}
              </span>
            )}
          </div>
          <div className="relative group flex items-center h-12.5 rounded-2xl border border-slate-200 bg-slate-50/40 px-3.5 transition-all duration-200 focus-within:bg-white focus-within:border-[#FF8533] focus-within:ring-4 focus-within:ring-[#FF8533]/8 shadow-[0_1px_2px_rgba(0,0,0,0.01)] hover:border-slate-300">
            <span className="shrink-0 text-slate-400 group-focus-within:text-[#FF8533] transition-colors duration-200 mr-2">
              <Lock className="w-4.5 h-4.5 stroke-[1.8]" />
            </span>
            <input
              type={showPwd ? "text" : "password"} required
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-full bg-transparent text-sm font-semibold text-slate-800 placeholder:font-normal placeholder:text-slate-400 outline-none border-none p-0 focus:ring-0 pr-8"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
              aria-label="Toggle password visibility"
            >
              {showPwd ? <EyeOff className="w-4.5 h-4.5 stroke-[1.8]" /> : <Eye className="w-4.5 h-4.5 stroke-[1.8]" />}
            </button>
          </div>
        </div>

        {/* Remember / Forgot */}
        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 text-slate-500 cursor-pointer select-none font-bold hover:text-slate-800 transition-colors uppercase tracking-wider text-[10px]">
            <input
              type="checkbox" checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="accent-[#FF8533] w-4 h-4 rounded cursor-pointer"
            />
            Ghi nhớ đăng nhập
          </label>
          <button
            type="button"
            onClick={() => { setRecoveryEmail(email.trim()); goTo("fp-step1"); }}
            className="text-[#FF8533] hover:text-orange-500 font-bold transition-colors hover:underline underline-offset-2 uppercase tracking-wider text-[10px]"
          >
            Quên mật khẩu?
          </button>
        </div>

        {generalErr && <ErrBanner msg={generalErr} />}

        <button 
          type="submit" 
          disabled={submitting} 
          className="group relative overflow-hidden w-full h-12.5 bg-gradient-to-r from-[#FFAC75] via-[#FF8533] to-[#FF6A00] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold rounded-2xl text-sm transition-all duration-300 shadow-[0_6px_20px_rgba(255,133,51,0.22)] hover:shadow-[0_10px_28px_rgba(255,133,51,0.35)] inline-flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
        >
          {!submitting && (
            <div 
              className="absolute top-0 bottom-0 left-0 w-[40px] bg-white/25 -skew-x-[20deg] pointer-events-none"
              style={{
                animation: "btn-gloss-admin 3.5s cubic-bezier(0.19, 1, 0.22, 1) infinite",
              }}
            />
          )}
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

  const emailErr = fpError && (fpError.toLowerCase().includes("email") || fpError.includes("tài khoản")) ? fpError : null;
  const generalErr = !emailErr ? fpError : null;

  return (
    <motion.div key="fp-step1" {...SLIDE} className="w-full flex flex-col justify-center relative">
      <button
        type="button"
        onClick={() => goTo("login")}
        className="absolute -top-6 left-0 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#FF8533] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Quay lại đăng nhập
      </button>

      <div className="flex flex-col items-center text-center mb-8 mt-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 ring-4 ring-orange-100/50 mb-4 shadow-sm">
          <KeyRound className="w-7 h-7 text-[#FF8533]" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Quên mật khẩu</h3>
        <p className="text-sm font-medium text-slate-500 mt-1.5 max-w-[280px]">
          Nhập email để nhận mã xác minh.
        </p>
      </div>

      <form onSubmit={handleFpStep1} className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 select-none">
              Email tài khoản Admin
            </label>
            {emailErr && (
              <span className="text-[10px] font-bold text-red-500">
                — {emailErr}
              </span>
            )}
          </div>
          <div className="relative group flex items-center h-12.5 rounded-2xl border border-slate-200 bg-slate-50/40 px-3.5 transition-all duration-200 focus-within:bg-white focus-within:border-[#FF8533] focus-within:ring-4 focus-within:ring-[#FF8533]/8 shadow-[0_1px_2px_rgba(0,0,0,0.01)] hover:border-slate-300">
            <span className="shrink-0 text-slate-400 group-focus-within:text-[#FF8533] transition-colors duration-200 mr-2">
              <Mail className="w-4.5 h-4.5 stroke-[1.8]" />
            </span>
            <input
              type="email" required autoFocus
              value={recoveryEmail}
              onChange={(e) => setRecoveryEmail(e.target.value)}
              placeholder="admin@company.com"
              className="w-full h-full bg-transparent text-sm font-semibold text-slate-800 placeholder:font-normal placeholder:text-slate-400 outline-none border-none p-0 focus:ring-0"
            />
          </div>
        </div>

        {generalErr && <ErrBanner msg={generalErr} />}

        <button 
          type="submit" 
          disabled={step1Loading} 
          className="group relative overflow-hidden w-full h-12.5 bg-gradient-to-r from-[#FFAC75] via-[#FF8533] to-[#FF6A00] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold rounded-2xl text-sm transition-all duration-300 shadow-[0_6px_20px_rgba(255,133,51,0.22)] hover:shadow-[0_10px_28px_rgba(255,133,51,0.35)] inline-flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
        >
          {!step1Loading && (
            <div 
              className="absolute top-0 bottom-0 left-0 w-[40px] bg-white/25 -skew-x-[20deg] pointer-events-none"
              style={{
                animation: "btn-gloss-admin 3.5s cubic-bezier(0.19, 1, 0.22, 1) infinite",
              }}
            />
          )}
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

  const codeErr = fpError && (fpError.toLowerCase().includes("mã") || fpError.includes("code")) ? fpError : null;
  const pwdErr = fpError && (fpError.toLowerCase().includes("mật khẩu") || fpError.includes("password") || fpError.includes("yêu cầu")) ? fpError : null;
  const generalErr = (!codeErr && !pwdErr) ? fpError : null;

  return (
    <motion.div key="fp-step2" {...SLIDE} className="w-full flex flex-col justify-center relative">
      <button
        type="button"
        onClick={() => goTo("fp-step1")}
        className="absolute -top-6 left-0 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#FF8533] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Quay lại
      </button>

      <div className="flex flex-col items-center text-center mb-8 mt-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 ring-4 ring-orange-100/50 mb-4 shadow-sm">
          <ShieldCheck className="w-7 h-7 text-[#FF8533]" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Đặt lại mật khẩu</h3>
        <p className="text-sm font-medium text-slate-500 mt-1.5 max-w-[320px] leading-relaxed">
          Mã xác minh đã được gửi đến{" "}
          <span className="font-bold text-slate-800 break-all">{recoveryEmail}</span>
        </p>
      </div>

      <form onSubmit={handleFpStep2} className="space-y-5">
        {/* Verification code */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 select-none">
              Mã xác nhận
            </label>
            {codeErr && (
              <span className="text-[10px] font-bold text-red-500">
                — {codeErr}
              </span>
            )}
          </div>
          <div className="relative group flex items-center h-12.5 rounded-2xl border border-slate-200 bg-slate-50/40 px-3.5 transition-all duration-200 focus-within:bg-white focus-within:border-[#FF8533] focus-within:ring-4 focus-within:ring-[#FF8533]/8 shadow-[0_1px_2px_rgba(0,0,0,0.01)] hover:border-slate-300">
            <span className="shrink-0 text-slate-400 group-focus-within:text-[#FF8533] transition-colors duration-200 mr-2">
              <ShieldCheck className="w-4.5 h-4.5 stroke-[1.8]" />
            </span>
            <input
              type="text" inputMode="numeric" required autoFocus maxLength={6}
              value={fpCode}
              onChange={(e) => setFpCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="w-full h-full bg-transparent text-sm font-semibold text-slate-800 placeholder:font-normal placeholder:text-slate-400 outline-none border-none p-0 focus:ring-0 tracking-[0.3em] font-mono text-center"
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            Không nhận được mã?{" "}
            <button
              type="button"
              className="text-[#FF8533] font-bold hover:underline underline-offset-2 cursor-pointer"
              onClick={handleResendCode}
            >
              Gửi lại
            </button>
          </p>
        </div>

        {/* New password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 select-none">
              Mật khẩu mới
            </label>
            {pwdErr && (
              <span className="text-[10px] font-bold text-red-500">
                — {pwdErr}
              </span>
            )}
          </div>
          <div className="relative group flex items-center h-12.5 rounded-2xl border border-slate-200 bg-slate-50/40 px-3.5 transition-all duration-200 focus-within:bg-white focus-within:border-[#FF8533] focus-within:ring-4 focus-within:ring-[#FF8533]/8 shadow-[0_1px_2px_rgba(0,0,0,0.01)] hover:border-slate-300">
            <span className="shrink-0 text-slate-400 group-focus-within:text-[#FF8533] transition-colors duration-200 mr-2">
              <Lock className="w-4.5 h-4.5 stroke-[1.8]" />
            </span>
            <input
              type={fpShowPwd ? "text" : "password"} required
              value={fpPassword} onChange={(e) => setFpPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-full bg-transparent text-sm font-semibold text-slate-800 placeholder:font-normal placeholder:text-slate-400 outline-none border-none p-0 focus:ring-0 pr-8"
            />
            <button
              type="button"
              onClick={() => setFpShowPwd((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#FF8533] transition-colors cursor-pointer"
              aria-label="Toggle new password visibility"
            >
              {fpShowPwd ? <EyeOff className="w-4.5 h-4.5 stroke-[1.8]" /> : <Eye className="w-4.5 h-4.5 stroke-[1.8]" />}
            </button>
          </div>

          {fpPassword.length > 0 && (
            <div className="mt-2.5 space-y-2 bg-slate-50/50 border border-slate-100 p-3 rounded-xl">
              <div className="flex gap-1.5">
                {PW_RULES.map((_, i) => (
                  <div
                    key={i}
                    className="h-1 flex-1 rounded-full transition-all duration-300"
                    style={{ background: i < strength.n ? strength.color : "#E2E8F0" }}
                  />
                ))}
              </div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: strength.color }}>
                Độ mạnh: {strength.label}
              </p>
              <ul className="space-y-1">
                {PW_RULES.map((rule, i) => {
                  const ok = rule.test(fpPassword);
                  return (
                    <li
                      key={i}
                      className={`text-[11px] flex items-center gap-1.5 font-medium ${ok ? "text-emerald-600" : "text-slate-400"}`}
                    >
                      <span className="text-[10px]">{ok ? "✓" : "○"}</span>
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
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 select-none">
              Xác nhận mật khẩu
            </label>
            {confirmMismatch && (
              <span className="text-[10px] font-bold text-red-500 animate-pulse">
                — Không khớp
              </span>
            )}
          </div>
          <div className="relative group flex items-center h-12.5 rounded-2xl border border-slate-200 bg-slate-50/40 px-3.5 transition-all duration-200 focus-within:bg-white focus-within:border-[#FF8533] focus-within:ring-4 focus-within:ring-[#FF8533]/8 shadow-[0_1px_2px_rgba(0,0,0,0.01)] hover:border-slate-300">
            <span className="shrink-0 text-slate-400 group-focus-within:text-[#FF8533] transition-colors duration-200 mr-2">
              <Lock className="w-4.5 h-4.5 stroke-[1.8]" />
            </span>
            <input
              type={fpShowConfirm ? "text" : "password"} required
              value={fpConfirm} onChange={(e) => setFpConfirm(e.target.value)}
              placeholder="••••••••"
              className="w-full h-full bg-transparent text-sm font-semibold text-slate-800 placeholder:font-normal placeholder:text-slate-400 outline-none border-none p-0 focus:ring-0 pr-8"
            />
            <button
              type="button"
              onClick={() => setFpShowConfirm((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-655 transition-colors cursor-pointer"
              aria-label="Toggle confirm password visibility"
            >
              {fpShowConfirm ? <EyeOff className="w-4.5 h-4.5 stroke-[1.8]" /> : <Eye className="w-4.5 h-4.5 stroke-[1.8]" />}
            </button>
          </div>
        </div>

        {generalErr && <ErrBanner msg={generalErr} />}

        <button
          type="submit"
          disabled={step2Loading || confirmMismatch || fpPassword.length === 0}
          className="group relative overflow-hidden w-full h-12.5 bg-gradient-to-r from-[#FFAC75] via-[#FF8533] to-[#FF6A00] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold rounded-2xl text-sm transition-all duration-300 shadow-[0_6px_20px_rgba(255,133,51,0.22)] hover:shadow-[0_10px_28px_rgba(255,133,51,0.35)] inline-flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider mt-2 disabled:bg-slate-200 disabled:shadow-none"
        >
          {!step2Loading && !confirmMismatch && fpPassword.length > 0 && (
            <div 
              className="absolute top-0 bottom-0 left-0 w-[40px] bg-white/25 -skew-x-[20deg] pointer-events-none"
              style={{
                animation: "btn-gloss-admin 3.5s cubic-bezier(0.19, 1, 0.22, 1) infinite",
              }}
            />
          )}
          {step2Loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang đặt lại...
            </>
          ) : (
            "Đặt lại mật khẩu"
          )}
        </button>
      </form>
    </motion.div>
  );
}

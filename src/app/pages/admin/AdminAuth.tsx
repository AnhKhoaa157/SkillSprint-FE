import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Eye, EyeOff, KeyRound, Loader2, Lock,
  Mail, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "../../components/layout/BrandLogo";
import {
  forgotPassword,
  getPostLoginPath,
  isAdminRole,
  login,
  storeAuthTokens,
  verifyPasswordResetCode,
  completePasswordReset,
} from "../../../api/authService";

// ─── Types ────────────────────────────────────────────────────────────────────

type View = "login" | "fp-step1" | "fp-step2";

// ─── Cognito password rules (must match SYSTEM_CONTEXT.md §4) ────────────────

const PW_RULES = [
  { label: "Ít nhất 8 ký tự",      test: (p: string) => p.length >= 8 },
  { label: "Có chữ hoa (A–Z)",     test: (p: string) => /[A-Z]/.test(p) },
  { label: "Có chữ thường (a–z)",  test: (p: string) => /[a-z]/.test(p) },
  { label: "Có chữ số (0–9)",      test: (p: string) => /\d/.test(p) },
  { label: "Có ký tự đặc biệt",    test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function scorePassword(pw: string) {
  const n = PW_RULES.filter((r) => r.test(pw)).length;
  if (n <= 2) return { n, color: "#EF4444", label: "Yếu" };
  if (n === 3) return { n, color: "#F59E0B", label: "Trung bình" };
  if (n === 4) return { n, color: "#3B82F6", label: "Khá" };
  return { n, color: "#10B981", label: "Mạnh" };
}

// ─── Animation preset ─────────────────────────────────────────────────────────

const SLIDE = {
  initial:    { opacity: 0, x: 14 },
  animate:    { opacity: 1, x: 0  },
  exit:       { opacity: 0, x: -14 },
  transition: { duration: 0.2 },
} as const;

// ─── Shared input class ────────────────────────────────────────────────────────

const fieldCls =
  "w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg " +
  "focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all";

// ─── Inline error banner ──────────────────────────────────────────────────────

function ErrBanner({ msg }: { msg: string }) {
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

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminAuth() {
  const navigate = useNavigate();

  // ── Login state ──────────────────────────────────────────────────────────────
  const [email,        setEmail]        = useState("admin@gmail.com");
  const [password,     setPassword]     = useState("");
  const [remember,     setRemember]     = useState(true);
  const [showPwd,      setShowPwd]      = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [loginError,   setLoginError]   = useState("");

  // ── Forgot-password shared state (lifted — survives AnimatePresence unmount) ─
  const [view,          setView]         = useState<View>("login");
  const [recoveryEmail, setRecoveryEmail]= useState("");
  const [fpError,       setFpError]      = useState("");

  // ── FP Step 1 state ───────────────────────────────────────────────────────────
  const [step1Loading, setStep1Loading] = useState(false);

  // ── FP Step 2 state ───────────────────────────────────────────────────────────
  const [fpCode,         setFpCode]         = useState("");
  const [fpPassword,     setFpPassword]     = useState("");
  const [fpConfirm,      setFpConfirm]      = useState("");
  const [fpShowPwd,      setFpShowPwd]      = useState(false);
  const [fpShowConfirm,  setFpShowConfirm]  = useState(false);
  const [step2Loading,   setStep2Loading]   = useState(false);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function goTo(v: View) {
    setFpError("");
    setView(v);
  }

  // ── Login handler ─────────────────────────────────────────────────────────────

  const handleLogin = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setLoginError("");
    const norm = email.trim().toLowerCase();
    if (!norm || !password) { setLoginError("Vui lòng nhập email và mật khẩu."); return; }
    setSubmitting(true);
    try {
      const result = await login(norm, password);
      if (result.status === "new-password-required") {
        setLoginError("Tài khoản này cần hoàn tất đổi mật khẩu ở luồng đăng nhập chung.");
        return;
      }
      if (!isAdminRole(result.tokens.role)) {
        setLoginError("Tài khoản này không có quyền truy cập Admin Portal.");
        return;
      }
      storeAuthTokens(result.tokens);
      navigate(getPostLoginPath(result.tokens.role));
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Đăng nhập thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── FP Step 1: send code ──────────────────────────────────────────────────────

  const handleFpStep1 = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setFpError("");
    const norm = recoveryEmail.trim().toLowerCase();
    if (!norm) { setFpError("Vui lòng nhập địa chỉ email."); return; }
    setStep1Loading(true);
    try {
      await forgotPassword(norm);
      setRecoveryEmail(norm);
      toast.success("Mã xác minh đã được gửi đến email của bạn.");
      goTo("fp-step2");
    } catch (err) {
      setFpError(err instanceof Error ? err.message : "Không thể gửi mã. Vui lòng thử lại.");
    } finally {
      setStep1Loading(false);
    }
  };

  // ── FP Step 2: verify code → complete reset (sequential chain) ────────────────

  const handleFpStep2 = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setFpError("");

    if (fpCode.trim().length < 6) {
      setFpError("Mã xác minh phải có ít nhất 6 ký tự.");
      return;
    }

    const failedRules = PW_RULES.filter((r) => !r.test(fpPassword));
    if (failedRules.length > 0) {
      setFpError(`Mật khẩu chưa đạt yêu cầu: ${failedRules[0].label}.`);
      return;
    }

    if (fpPassword !== fpConfirm) {
      setFpError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setStep2Loading(true);
    try {
      // Sequential chain as required:
      // 1️⃣  POST /api/auth/confirm-forgot-password  { email, code }
      await verifyPasswordResetCode(recoveryEmail.trim(), fpCode.trim());

      // 2️⃣  POST /api/auth/complete-new-password    { email, code, newPassword }
      await completePasswordReset(
        recoveryEmail.trim(),
        fpCode.trim(),
        fpPassword.trim(),
      );

      toast.success("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.", {
        duration: 5000,
      });

      // Reset FP state and return to login
      setFpCode("");
      setFpPassword("");
      setFpConfirm("");
      setRecoveryEmail("");
      goTo("login");
    } catch (err) {
      setFpError(
        err instanceof Error
          ? err.message
          : "Không thể đặt lại mật khẩu. Mã có thể đã hết hạn hoặc không đúng.",
      );
    } finally {
      setStep2Loading(false);
    }
  };

  const strength      = scorePassword(fpPassword);
  const confirmMismatch = fpConfirm.length > 0 && fpConfirm !== fpPassword;

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ background: "#F8FAFC", fontFamily: "'Inter', sans-serif" }}
    >
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          style={{
            position: "absolute", width: "900px", height: "900px",
            background: "radial-gradient(circle, rgba(255,107,0,0.12) 0%, transparent 60%)",
            top: "-260px", right: "-160px", filter: "blur(36px)",
          }}
        />
      </div>

      {/* Back to student login */}
      <button
        onClick={() => navigate("/auth")}
        className="absolute z-10 top-6 left-6 inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
        style={{ color: "#475569", border: "1px solid #CBD5E1", background: "#FFFFFF" }}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Quay lại đăng nhập sinh viên
      </button>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 w-full max-w-5xl bg-transparent rounded-2xl p-6"
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">

          {/* ── Left — static branding ── */}
          <div
            style={{ background: "linear-gradient(180deg, rgba(255,107,0,0.06), rgba(255,107,0,0.02))" }}
            className="p-8 md:p-12 flex flex-col justify-center gap-6"
          >
            <div className="flex items-center gap-3">
              <BrandLogo size={48} showText />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">Cổng Quản Trị</h2>
              <p className="mt-2 text-slate-600">Quản lý hệ thống, phê duyệt đối tác và giám sát hoạt động.</p>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-500">
              <li className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Bảo mật &amp; vận hành
              </li>
              <li className="flex items-center gap-3">
                <TargetIconFallback />
              </li>
            </ul>
          </div>

          {/* ── Right — animated content ── */}
          <div className="p-8 md:p-10 min-h-[460px] flex flex-col justify-center">
            <AnimatePresence mode="wait">

              {/* ── LOGIN VIEW ── */}
              {view === "login" && (
                <motion.div key="login" {...SLIDE}>
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-900">Đăng nhập Admin</h3>
                    <p className="text-sm text-slate-500">
                      Đăng nhập bằng tài khoản quản trị để truy cập cổng quản trị.
                    </p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-5">
                    {/* Email */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-2">Email</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <Mail className="w-4 h-4" />
                        </span>
                        <input
                          type="email" required value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="admin@company.com"
                          className={`${fieldCls} pl-10 pr-4 py-3`}
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-2">Mật khẩu</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <Lock className="w-4 h-4" />
                        </span>
                        <input
                          type={showPwd ? "text" : "password"} required
                          value={password} onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className={`${fieldCls} pl-10 pr-10 py-3`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPwd((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                          aria-label="Toggle password"
                        >
                          {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Remember / Forgot */}
                    <div className="flex items-center justify-between text-sm">
                      <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                        <input type="checkbox" checked={remember}
                          onChange={(e) => setRemember(e.target.checked)}
                          className="accent-orange-500"
                        />
                        Ghi nhớ
                      </label>
                      <button
                        type="button"
                        onClick={() => { setRecoveryEmail(email.trim()); goTo("fp-step1"); }}
                        className="text-orange-600 hover:underline text-sm font-medium transition-colors"
                      >
                        Quên mật khẩu?
                      </button>
                    </div>

                    <ErrBanner msg={loginError} />

                    <button
                      type="submit" disabled={submitting}
                      className="w-full py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-70 text-white font-semibold rounded-lg text-sm transition-shadow shadow inline-flex items-center justify-center gap-2"
                    >
                      {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      {submitting ? "Đang xác thực..." : "Đăng nhập"}
                    </button>

                    <p className="text-xs text-slate-500 text-center">
                      Chỉ tài khoản có quyền admin mới được phép truy cập.
                    </p>
                  </form>
                </motion.div>
              )}

              {/* ── FP STEP 1: Request code ── */}
              {view === "fp-step1" && (
                <motion.div key="fp-step1" {...SLIDE}>
                  <button
                    type="button"
                    onClick={() => goTo("login")}
                    className="inline-flex items-center gap-1.5 mb-6 text-xs font-semibold text-slate-500 hover:text-orange-600 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Quay lại đăng nhập
                  </button>

                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 flex-shrink-0">
                      <KeyRound className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Quên mật khẩu</h3>
                      <p className="text-xs text-slate-500">Nhập email để nhận mã xác minh qua hộp thư.</p>
                    </div>
                  </div>

                  <form onSubmit={handleFpStep1} className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-2">
                        Email tài khoản Admin
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <Mail className="w-4 h-4" />
                        </span>
                        <input
                          type="email" required autoFocus
                          value={recoveryEmail}
                          onChange={(e) => setRecoveryEmail(e.target.value)}
                          placeholder="admin@company.com"
                          className={`${fieldCls} pl-10 pr-4 py-3`}
                        />
                      </div>
                    </div>

                    <ErrBanner msg={fpError} />

                    <button
                      type="submit" disabled={step1Loading}
                      className="w-full py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-70 text-white font-semibold rounded-lg text-sm transition-shadow shadow inline-flex items-center justify-center gap-2"
                    >
                      {step1Loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {step1Loading ? "Đang gửi mã..." : "Gửi mã xác minh"}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* ── FP STEP 2: Combined — code + new password + confirm ── */}
              {view === "fp-step2" && (
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
                    {/* ── Verification code ── */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-2">
                        Mã xác nhận
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <ShieldCheck className="w-4 h-4" />
                        </span>
                        <input
                          type="text" required autoFocus maxLength={8}
                          value={fpCode}
                          onChange={(e) => setFpCode(e.target.value.replace(/\D/g, ""))}
                          placeholder="000000"
                          className={`${fieldCls} pl-10 pr-4 py-3 tracking-[0.3em] font-mono text-center text-base`}
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        Không nhận được mã?{" "}
                        <button
                          type="button"
                          className="text-orange-600 font-semibold hover:underline"
                          onClick={async () => {
                            try {
                              await forgotPassword(recoveryEmail.trim());
                              toast.success("Mã xác minh mới đã được gửi lại.");
                            } catch {
                              toast.error("Không thể gửi lại mã. Vui lòng thử lại.");
                            }
                          }}
                        >
                          Gửi lại
                        </button>
                      </p>
                    </div>

                    {/* ── New password ── */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-2">
                        Mật khẩu mới
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <Lock className="w-4 h-4" />
                        </span>
                        <input
                          type={fpShowPwd ? "text" : "password"} required
                          value={fpPassword} onChange={(e) => setFpPassword(e.target.value)}
                          placeholder="••••••••"
                          className={`${fieldCls} pl-10 pr-10 py-3`}
                        />
                        <button
                          type="button"
                          onClick={() => setFpShowPwd((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                          aria-label="Toggle new password"
                        >
                          {fpShowPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Strength bar */}
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

                    {/* ── Confirm password ── */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-2">
                        Xác nhận mật khẩu
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <Lock className="w-4 h-4" />
                        </span>
                        <input
                          type={fpShowConfirm ? "text" : "password"} required
                          value={fpConfirm} onChange={(e) => setFpConfirm(e.target.value)}
                          placeholder="••••••••"
                          className={`${fieldCls} pl-10 pr-10 py-3 ${
                            confirmMismatch
                              ? "border-red-300 focus:border-red-400 focus:ring-red-300"
                              : ""
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setFpShowConfirm((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                          aria-label="Toggle confirm password"
                        >
                          {fpShowConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {confirmMismatch && (
                        <p className="mt-1 text-xs text-red-500">Mật khẩu xác nhận không khớp.</p>
                      )}
                    </div>

                    <ErrBanner msg={fpError} />

                    {/* ── Submit ── */}
                    <button
                      type="submit"
                      disabled={step2Loading || confirmMismatch || fpPassword.length === 0}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold rounded-lg text-sm transition-shadow shadow inline-flex items-center justify-center gap-2 mt-1"
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
              )}

            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Fallback icon ────────────────────────────────────────────────────────────

function TargetIconFallback() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="#F59E0B" strokeWidth="1.5" fill="rgba(255,107,0,0.06)" />
      <circle cx="12" cy="12" r="4" fill="#FF6B00" />
    </svg>
  );
}

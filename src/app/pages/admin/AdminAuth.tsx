import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion"; // Đã đồng bộ về thư viện chuẩn
import {
  ArrowLeft, Eye, EyeOff, KeyRound, Loader2, Lock,
  Mail, ShieldCheck, BarChart3,
} from "lucide-react";
import { toast } from "sonner";
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
  { label: "Ít nhất 8 ký tự", test: (p: string) => p.length >= 8 },
  { label: "Có chữ hoa (A–Z)", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Có chữ thường (a–z)", test: (p: string) => /[a-z]/.test(p) },
  { label: "Có chữ số (0–9)", test: (p: string) => /\d/.test(p) },
  { label: "Có ký tự đặc biệt", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
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
  initial: { opacity: 0, x: 14 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -14 },
  transition: { duration: 0.2 },
} as const;

// ─── Shared input class ────────────────────────────────────────────────────────

const fieldCls =
  "w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg " +
  "focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 transition-all";

// ─── Shared button class ───────────────────────────────────────────────────────

const primaryBtnCls =
  "w-full py-3 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 active:scale-[0.98] " +
  "disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm " +
  "transition-all duration-150 shadow-sm shadow-orange-200 inline-flex items-center justify-center gap-2";

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
  const [email, setEmail] = useState("admin@gmail.com");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");

  // ── Forgot-password shared state (survives AnimatePresence unmount) ──────────
  const [view, setView] = useState<View>("login");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [fpError, setFpError] = useState("");

  // ── FP Step 1 state ───────────────────────────────────────────────────────────
  const [step1Loading, setStep1Loading] = useState(false);

  // ── FP Step 2 state ───────────────────────────────────────────────────────────
  const [fpCode, setFpCode] = useState("");
  const [fpPassword, setFpPassword] = useState("");
  const [fpConfirm, setFpConfirm] = useState("");
  const [fpShowPwd, setFpShowPwd] = useState(false);
  const [fpShowConfirm, setFpShowConfirm] = useState(false);
  const [step2Loading, setStep2Loading] = useState(false);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function goTo(v: View) {
    setFpError("");
    setView(v);
  }

  // ── Login handler ─────────────────────────────────────────────────────────────

  const handleLogin = async (e: React.FormEvent) => {
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

      // Xóa session cũ tránh nhiễm chéo dữ liệu Redis 401
      localStorage.clear();
      sessionStorage.clear();

      storeAuthTokens(result.tokens);

      setTimeout(() => {
        window.location.href = getPostLoginPath(result.tokens.role);
      }, 100);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Đăng nhập thất bại.");
    } {
      setSubmitting(false);
    }
  };

  // ── FP Step 1: send code ──────────────────────────────────────────────────────

  const handleFpStep1 = async (e: React.FormEvent) => {
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

  const handleFpStep2 = async (e: React.FormEvent) => {
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
      await verifyPasswordResetCode(recoveryEmail.trim(), fpCode.trim());
      await completePasswordReset(recoveryEmail.trim(), fpCode.trim(), fpPassword.trim());

      toast.success("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.", {
        duration: 5000,
      });

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

  const strength = scorePassword(fpPassword);
  const confirmMismatch = fpConfirm.length > 0 && fpConfirm !== fpPassword;

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden"
      style={{ background: "#F8FAFC", fontFamily: "'Inter', sans-serif" }}
    >
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          style={{
            position: "absolute", width: "900px", height: "900px",
            background: "radial-gradient(circle, rgba(255,107,0,0.10) 0%, transparent 60%)",
            top: "-260px", right: "-160px", filter: "blur(40px)",
          }}
        />
        <div
          style={{
            position: "absolute", width: "600px", height: "600px",
            background: "radial-gradient(circle, rgba(255,107,0,0.05) 0%, transparent 60%)",
            bottom: "-100px", left: "-100px", filter: "blur(40px)",
          }}
        />
      </div>

      {/* Back to student login */}
      <button
        onClick={() => navigate("/login")}
        className="absolute z-10 top-5 left-5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:bg-slate-100"
        style={{ color: "#475569", border: "1px solid #E2E8F0", background: "#FFFFFF" }}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Quay lại đăng nhập sinh viên
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-full max-w-4xl"
      >
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-[1fr_1.1fr]">

          {/* ── Left — static branding ── */}
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

          {/* ── Right — animated content ── */}
          <div className="p-8 md:p-10 min-h-[480px] flex flex-col justify-center">
            <AnimatePresence mode="wait">

              {/* ── LOGIN VIEW ── */}
              {view === "login" && (
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
              )}

              {/* ── FP STEP 2: code + new password + confirm ── */}
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
              )}

            </AnimatePresence>
          </div>

        </div>
      </motion.div>
    </div>
  );
}

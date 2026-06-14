import { useState } from "react";
import { toast } from "sonner";
import {
  forgotPassword,
  getPostLoginPath,
  isAdminRole,
  login,
  storeAuthTokens,
  verifyPasswordResetCode,
  completePasswordReset,
} from "../../../../api/authService";
import { PW_RULES, scorePassword, type View } from "./config";

/**
 * Owns all Admin authentication state and side-effects: login, the two-step
 * forgot-password flow, and derived password-strength signals. Presentational
 * views consume the returned object; navigation stays in the page shell.
 */
export function useAdminAuth() {
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
    } finally {
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

  // ── FP Step 2: resend verification code ────────────────────────────────────────

  const handleResendCode = async () => {
    try {
      await forgotPassword(recoveryEmail.trim());
      toast.success("Mã xác minh mới đã được gửi lại.");
    } catch {
      toast.error("Không thể gửi lại mã. Vui lòng thử lại.");
    }
  };

  const strength = scorePassword(fpPassword);
  const confirmMismatch = fpConfirm.length > 0 && fpConfirm !== fpPassword;

  return {
    // login
    email, setEmail,
    password, setPassword,
    remember, setRemember,
    showPwd, setShowPwd,
    submitting,
    loginError,
    handleLogin,
    // view machine
    view, goTo,
    // forgot-password shared
    recoveryEmail, setRecoveryEmail,
    fpError,
    // step 1
    step1Loading,
    handleFpStep1,
    // step 2
    fpCode, setFpCode,
    fpPassword, setFpPassword,
    fpConfirm, setFpConfirm,
    fpShowPwd, setFpShowPwd,
    fpShowConfirm, setFpShowConfirm,
    step2Loading,
    handleFpStep2,
    handleResendCode,
    // derived
    strength,
    confirmMismatch,
  };
}

export type AdminAuthState = ReturnType<typeof useAdminAuth>;

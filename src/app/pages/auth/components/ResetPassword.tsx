import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Check, Lock, Mail, Loader2, ArrowRight } from "lucide-react";
import { F, InputField } from "./AuthShared";
import { Button } from "../../../components/ui/button";
import { forgotPassword, confirmForgotPassword } from "../../../../api/auth/authService";

export function ResetPassword({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<"request" | "confirm">("request");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const handleSendCode = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Vui lòng nhập email.");
      return;
    }
    setLoading(true);
    setError("");
    setNotice("");
    try {
      await forgotPassword(normalizedEmail);
      setStep("confirm");
      setNotice("Mã xác nhận đã được gửi tới email của bạn.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Không thể gửi mã xác nhận.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!confirmationCode || !newPassword || !confirmPassword) {
      setError("Vui lòng nhập mã xác nhận và mật khẩu mới.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await confirmForgotPassword(normalizedEmail, confirmationCode.trim(), newPassword);
      onBack();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Không thể đặt lại mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }} style={{ fontFamily: F }}>
      {step === "request" ? (
        <>
          <h2 className="text-[1.9rem] font-extrabold leading-tight tracking-[-0.035em] text-slate-900 mb-2">
            Quên mật khẩu?
          </h2>
          <p className="mb-10 text-[0.85rem] leading-relaxed text-slate-500">
            Nhập email trường học của bạn để nhận mã đặt lại mật khẩu an toàn.
          </p>

          <div className="space-y-6">
            <InputField id="reset-email" label="Email trường học" placeholder="student@gmail.com" icon={Mail} value={email} onChange={setEmail} />
            
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] leading-relaxed text-red-700" role="alert">
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              onClick={handleSendCode}
              disabled={loading}
              className={`flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border-none text-[15px] font-bold text-white transition-all duration-150 ${loading ? "cursor-not-allowed bg-slate-300 shadow-none" : "bg-[#FF6B00] shadow-[0_4px_14px_rgba(255,107,0,0.2)] hover:bg-[#FF7A00] hover:shadow-[0_0_20px_rgba(255,107,0,0.3)] active:translate-y-0.5 cursor-pointer"}`}
            >
              {loading ? (
                <><Loader2 size={17} className="animate-spin" /> Đang gửi mã...</>
              ) : (
                <>Gửi mã đặt lại <ArrowRight size={16} strokeWidth={2.5} /></>
              )}
            </Button>
          </div>

          <div className="mt-7 space-y-4 text-center">
            <button type="button" onClick={onBack} className="inline-flex items-center justify-center gap-2 cursor-pointer border-none bg-transparent p-0 text-[13px] font-bold text-slate-500 hover:text-slate-700 transition-colors">
              <ArrowLeft size={14} /> Quay về đăng nhập
            </button>
          </div>
        </>
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
            <Check size={24} className="text-emerald-500" strokeWidth={2.5} />
          </div>
          <h2 className="text-center text-[1.6rem] font-extrabold leading-tight tracking-[-0.035em] text-slate-900 mb-2">
            Nhập mã xác nhận
          </h2>
          <p className="mb-8 text-center text-[0.85rem] leading-relaxed text-slate-500">
            {notice || <>Mã đặt lại đã được gửi đến <strong>{email}</strong>. Vui lòng kiểm tra hộp thư.</>}
          </p>

          <div className="space-y-6">
            <InputField id="reset-code" label="Mã xác nhận" placeholder="123456" icon={Check} value={confirmationCode} onChange={setConfirmationCode} />
            <InputField id="reset-new-pass" label="Mật khẩu mới" type="password" placeholder="Tối thiểu 8 ký tự" icon={Lock} value={newPassword} onChange={setNewPassword} />
            <InputField id="reset-confirm-pass" label="Xác nhận mật khẩu" type="password" placeholder="Nhập lại mật khẩu mới" icon={Lock} value={confirmPassword} onChange={setConfirmPassword} />

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] leading-relaxed text-red-700" role="alert">
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              onClick={handleConfirmReset}
              disabled={loading}
              className={`flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border-none text-[15px] font-bold text-white transition-all duration-150 ${loading ? "cursor-not-allowed bg-slate-300 shadow-none" : "bg-[#FF6B00] shadow-[0_4px_14px_rgba(255,107,0,0.2)] hover:bg-[#FF7A00] hover:shadow-[0_0_20px_rgba(255,107,0,0.3)] active:translate-y-0.5 cursor-pointer"}`}
            >
              {loading ? (
                <><Loader2 size={17} className="animate-spin" /> Đang cập nhật...</>
              ) : (
                <>Đặt lại mật khẩu <ArrowRight size={16} strokeWidth={2.5} /></>
              )}
            </Button>
          </div>

          <div className="mt-7 space-y-4 text-center">
            <button type="button" onClick={onBack} className="inline-flex items-center justify-center gap-2 cursor-pointer border-none bg-transparent p-0 text-[13px] font-bold text-slate-500 hover:text-slate-700 transition-colors">
              <ArrowLeft size={14} /> Quay về đăng nhập
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

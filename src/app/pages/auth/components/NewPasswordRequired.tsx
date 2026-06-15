import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Lock, Loader2, ArrowRight } from "lucide-react";
import { F, InputField } from "./AuthShared";
import { Button } from "../../../components/ui/button";
import { completeNewPassword, storeAuthTokens, isAdminRole } from "../../../../api/authService";

export function NewPasswordRequiredModal({
  email, session, onBack, onSuccess,
}: {
  email: string; session: string; onBack: () => void; onSuccess: (role: string | null) => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!newPassword || !confirmPassword) {
      setError("Vui lòng nhập mật khẩu mới và xác nhận mật khẩu.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const tokens = await completeNewPassword(email, newPassword, session);
      if (isAdminRole(tokens.role)) {
        setError("Tài khoản quản trị không thể đăng nhập ở cổng Learner. Vui lòng dùng cổng Admin.");
        return;
      }
      storeAuthTokens(tokens);
      onSuccess(tokens.role);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Không thể hoàn tất đổi mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }} style={{ fontFamily: F }}>
      <h2 className="text-[1.9rem] font-extrabold leading-tight tracking-[-0.035em] text-slate-900 mb-2">
        Đặt mật khẩu mới
      </h2>
      <p className="mb-10 text-[0.85rem] leading-relaxed text-slate-500">
        Tài khoản <strong>{email}</strong> cần đặt mật khẩu mới để hoàn tất quy trình đăng nhập an toàn.
      </p>

      <div className="space-y-6">
        <InputField id="new-req-pass" label="Mật khẩu mới" type="password" placeholder="Tối thiểu 8 ký tự" icon={Lock} value={newPassword} onChange={setNewPassword} />
        <InputField id="new-req-confirm" label="Xác nhận mật khẩu" type="password" placeholder="Nhập lại mật khẩu mới" icon={Lock} value={confirmPassword} onChange={setConfirmPassword} />

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] leading-relaxed text-red-700" role="alert">
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          onClick={handleSubmit}
          disabled={loading}
          className={`flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border-none text-[15px] font-bold text-white transition-all duration-150 ${loading ? "cursor-not-allowed bg-slate-300 shadow-none" : "bg-[#FF6B00] shadow-[0_4px_14px_rgba(255,107,0,0.2)] hover:bg-[#FF7A00] hover:shadow-[0_0_20px_rgba(255,107,0,0.3)] active:translate-y-0.5 cursor-pointer"}`}
        >
          {loading ? (
            <><Loader2 size={17} className="animate-spin" /> Đang cập nhật...</>
          ) : (
            <>Hoàn tất đăng nhập <ArrowRight size={16} strokeWidth={2.5} /></>
          )}
        </Button>
      </div>

      <div className="mt-7 space-y-4 text-center">
        <button type="button" onClick={onBack} className="inline-flex items-center justify-center gap-2 cursor-pointer border-none bg-transparent p-0 text-[13px] font-bold text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft size={14} /> Trở lại đăng nhập
        </button>
      </div>
    </motion.div>
  );
}

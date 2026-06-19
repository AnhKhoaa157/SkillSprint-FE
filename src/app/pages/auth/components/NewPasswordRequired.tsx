import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Lock, Loader2, ArrowRight } from "lucide-react";
import { F, InputField } from "./AuthShared";
import { Button } from "../../../components/ui/button";
import { completeNewPassword, storeAuthTokens, isAdminRole } from "../../../../api/auth/authService";

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
      <h2 className="text-center text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent mb-2">
        Đặt mật khẩu mới
      </h2>
      <p className="mb-8 text-center text-sm font-medium leading-relaxed text-slate-500 max-w-[340px] mx-auto">
        Tài khoản <strong>{email}</strong> cần đặt mật khẩu mới để hoàn tất quy trình đăng nhập an toàn.
      </p>

      <div className="space-y-6">
        <InputField id="new-req-pass" label="Mật khẩu mới" type="password" placeholder="Tối thiểu 8 ký tự" icon={Lock} value={newPassword} onChange={setNewPassword} />
        <InputField id="new-req-confirm" label="Xác nhận mật khẩu" type="password" placeholder="Nhập lại mật khẩu mới" icon={Lock} value={confirmPassword} onChange={setConfirmPassword} />

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl border border-red-200 bg-red-50/70 px-4 py-3 text-xs leading-relaxed text-red-700 shadow-sm" role="alert">
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          onClick={handleSubmit}
          disabled={loading}
          className={`group relative overflow-hidden flex h-12 w-full items-center justify-center gap-1.5 rounded-xl border-none text-sm font-extrabold uppercase tracking-wide text-white transition-all duration-300 shadow-[0_4px_16px_rgba(255,133,51,0.18)] hover:shadow-[0_8px_24px_rgba(255,133,51,0.3)] ${
            loading
              ? "cursor-not-allowed bg-slate-300"
              : "bg-gradient-to-r from-[#FFAC75] via-[#FF8533] to-[#FF6A00] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985] cursor-pointer"
          }`}
        >
          {/* Shimmer gloss effect */}
          {!loading && (
            <div 
              className="absolute top-0 bottom-0 left-0 w-[40px] bg-white/25 -skew-x-[20deg] pointer-events-none"
              style={{
                animation: "btn-gloss-req-pass 3.5s cubic-bezier(0.19, 1, 0.22, 1) infinite",
              }}
            />
          )}
          <style>{`
            @keyframes btn-gloss-req-pass {
              0% { transform: translateX(-150px); opacity: 0; }
              12% { opacity: 1; }
              35% { transform: translateX(380px); opacity: 0; }
              100% { transform: translateX(380px); opacity: 0; }
            }
          `}</style>
          {loading ? (
            <><Loader2 size={15} className="animate-spin" /> Đang cập nhật...</>
          ) : (
            <>
              <span>Hoàn tất đăng nhập</span>
              <ArrowRight size={14} strokeWidth={2.5} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </>
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

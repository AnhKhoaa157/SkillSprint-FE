import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Loader2, ArrowRight } from "lucide-react";
import { F, InputField } from "./AuthShared";
import { Button } from "../../../components/ui/button";
import { resendConfirmationCode, confirmRegister } from "../../../../api/authService";

export function ConfirmRegisterModal({ email, onClose, onConfirmed }: { email: string; onClose: () => void; onConfirmed: () => void; }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const handleResend = async () => {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      await resendConfirmationCode(email);
      setNotice("Mã xác nhận đã được gửi lại.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể gửi lại mã.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!code.trim()) {
      setError("Vui lòng nhập mã xác nhận.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await confirmRegister(email, code.trim());
      onConfirmed();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể xác nhận mã.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }} style={{ fontFamily: F }}>
      <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
        <Check size={24} className="text-emerald-500" strokeWidth={2.5} />
      </div>
      <h2 className="text-center text-[1.6rem] font-extrabold leading-tight tracking-[-0.035em] text-slate-900 mb-2">
        Xác nhận email
      </h2>
      <p className="mb-8 text-center text-[0.85rem] leading-relaxed text-slate-500">
        Nhập mã xác nhận gồm 6 chữ số đã được gửi tới<br /><strong>{email}</strong>
      </p>

      <div className="space-y-6">
        <InputField id="confirm-code" label="Mã xác nhận" placeholder="123456" icon={Check} value={code} onChange={setCode} />

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] leading-relaxed text-red-700" role="alert">
              {error}
            </motion.div>
          )}
          {notice && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[13px] leading-relaxed text-emerald-700" role="alert">
              {notice}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex flex-1 min-h-[48px] items-center justify-center gap-2 rounded-xl border-none text-[15px] font-bold text-white transition-all duration-150 ${loading ? "cursor-not-allowed bg-slate-300 shadow-none" : "bg-[#FF6B00] shadow-[0_4px_14px_rgba(255,107,0,0.2)] hover:bg-[#FF7A00] hover:shadow-[0_0_20px_rgba(255,107,0,0.3)] active:translate-y-0.5 cursor-pointer"}`}
          >
            {loading ? (
              <><Loader2 size={17} className="animate-spin" /> Đang xác nhận...</>
            ) : (
              <>Xác nhận <ArrowRight size={16} strokeWidth={2.5} /></>
            )}
          </Button>

          <Button
            onClick={handleResend}
            disabled={loading}
            variant="outline"
            className="flex min-h-[48px] px-6 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-[15px] font-semibold text-slate-700 transition-all duration-300 hover:bg-slate-50 hover:border-slate-300 active:translate-y-0.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            Gửi lại mã
          </Button>
        </div>
      </div>

      <div className="mt-8 text-center">
        <button type="button" onClick={onClose} className="cursor-pointer border-none bg-transparent p-0 text-[13px] font-semibold text-slate-400 hover:text-slate-600 transition-colors">
          Đóng và quay lại
        </button>
      </div>
    </motion.div>
  );
}

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Loader2, ArrowRight } from "lucide-react";
import { F, InputField } from "./AuthShared";
import { Button } from "../../../components/ui/button";
import { resendConfirmationCode, confirmRegister } from "../../../../api/auth/authService";

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
      <h2 className="text-center text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent mb-2">
        Xác nhận email
      </h2>
      <p className="mb-8 text-center text-sm font-medium leading-relaxed text-slate-500">
        Nhập mã xác nhận gồm 6 chữ số đã được gửi tới<br /><strong>{email}</strong>
      </p>

      <div className="space-y-6">
        <InputField id="confirm-code" label="Mã xác nhận" placeholder="123456" icon={Check} value={code} onChange={setCode} />

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl border border-red-200 bg-red-50/70 px-4 py-3 text-xs leading-relaxed text-red-700 shadow-sm" role="alert">
              {error}
            </motion.div>
          )}
          {notice && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-xs leading-relaxed text-emerald-700 shadow-sm" role="alert">
              {notice}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className={`group relative overflow-hidden flex flex-1 h-12 items-center justify-center gap-1.5 rounded-xl border-none text-sm font-extrabold uppercase tracking-wide text-white transition-all duration-300 shadow-[0_4px_16px_rgba(255,133,51,0.18)] hover:shadow-[0_8px_24px_rgba(255,133,51,0.3)] ${
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
                  animation: "btn-gloss-confirm-reg 3.5s cubic-bezier(0.19, 1, 0.22, 1) infinite",
                }}
              />
            )}
            <style>{`
              @keyframes btn-gloss-confirm-reg {
                0% { transform: translateX(-150px); opacity: 0; }
                12% { opacity: 1; }
                35% { transform: translateX(380px); opacity: 0; }
                100% { transform: translateX(380px); opacity: 0; }
              }
            `}</style>
            {loading ? (
              <><Loader2 size={15} className="animate-spin" /> Đang xác nhận...</>
            ) : (
              <>
                <span>Xác nhận</span>
                <ArrowRight size={14} strokeWidth={2.5} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </>
            )}
          </Button>

          <Button
            onClick={handleResend}
            disabled={loading}
            variant="outline"
            className="flex h-12 px-5 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.985] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            Gửi lại mã
          </Button>
        </div>
      </div>

      <div className="mt-8 text-center">
        <button type="button" onClick={onClose} className="cursor-pointer border-none bg-transparent p-0 text-[13px] font-bold text-slate-400 hover:text-slate-650 transition-colors">
          Đóng và quay lại
        </button>
      </div>
    </motion.div>
  );
}

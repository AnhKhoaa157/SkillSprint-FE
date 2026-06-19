import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";

export const F = "'Plus Jakarta Sans','Inter',sans-serif";
export const OG = "#FF6B00";

export const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
export const ALLOWED_EMAIL_DOMAINS = ["gmail.com", "fpt.edu.vn"] as const;

export function getEmailError(rawEmail: string): string | null {
  const email = rawEmail.trim().toLowerCase();
  if (!email) return "Vui lòng nhập địa chỉ email.";
  if (!EMAIL_PATTERN.test(email)) return "Định dạng email không hợp lệ.";
  const domain = email.slice(email.lastIndexOf("@") + 1);
  if (!ALLOWED_EMAIL_DOMAINS.some(allowed => allowed === domain)) {
    return "Email phải có đuôi @gmail.com hoặc @fpt.edu.vn";
  }
  return null;
}

export function InputField({
  id, label, icon: Icon, value, onChange, onBlur,
  type = "text", placeholder, autoComplete, error, labelAction, trailing, disabled,
}: {
  id: string; label: string; icon: React.ElementType; value: string;
  onChange: (value: string) => void; onBlur?: () => void; type?: string;
  placeholder?: string; autoComplete?: string; error?: string | null;
  labelAction?: React.ReactNode; trailing?: React.ReactNode; disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5 text-left">
      <div className="flex items-center justify-between min-h-4">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <Label htmlFor={id} className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 select-none shrink-0">
            {label}
          </Label>
          <AnimatePresence mode="wait">
            {error && (
              <motion.span 
                initial={{ opacity: 0, x: -4 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -4 }} 
                transition={{ duration: 0.18 }}
                className="text-[9.5px] font-bold text-rose-500 uppercase tracking-wide truncate"
              >
                — {error}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        {labelAction}
      </div>
      <div 
        className={`relative group flex items-center h-12 rounded-xl border bg-slate-50/40 px-3.5 transition-all duration-200 ${
          error
            ? "border-rose-200/90 focus-within:border-rose-450 focus-within:ring-4 focus-within:ring-rose-500/6 focus-within:bg-white shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
            : "border-slate-200/80 focus-within:border-[#FF8533] focus-within:ring-4 focus-within:ring-[#FF8533]/8 focus-within:bg-white shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
        } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <Icon 
          size={15} 
          strokeWidth={1.8} 
          aria-hidden 
          className={`shrink-0 transition-colors duration-200 mr-2 ${
            error ? "text-rose-400" : "text-slate-400 group-focus-within:text-[#FF8533]"
          }`} 
        />
        <input
          id={id} 
          type={type} 
          value={value} 
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)} 
          onBlur={onBlur}
          placeholder={placeholder} 
          autoComplete={autoComplete} 
          aria-invalid={!!error} 
          disabled={disabled}
          className="w-full h-full bg-transparent text-sm font-medium text-slate-800 placeholder:font-normal placeholder:text-slate-400 outline-none border-none p-0 focus:ring-0 disabled:cursor-not-allowed"
        />
        {trailing && <div className="absolute right-3.5 top-0 bottom-0 flex items-center z-10">{trailing}</div>}
      </div>
    </div>
  );
}

export function isMaintenanceError(e: unknown): boolean {
  if (e && typeof e === "object" && "status" in e && (e as { status?: number }).status === 503) {
    return true;
  }
  if (e instanceof Error) {
    const msg = e.message.toLowerCase();
    return (
      msg.includes("503") || msg.includes("maintenance") || msg.includes("bảo trì") || msg.includes("failed to fetch") ||
      msg.includes("load failed") || msg.includes("networkerror") || msg.includes("network request failed")
    );
  }
  return false;
}

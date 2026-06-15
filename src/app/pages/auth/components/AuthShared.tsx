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
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <Label htmlFor={id} className="text-[13px] font-semibold tracking-[-0.01em] text-slate-700">
          {label}
        </Label>
        {labelAction}
      </div>
      <div className="relative group flex items-center">
        <Icon size={17} strokeWidth={2} aria-hidden className={`absolute left-3.5 z-10 transition-colors duration-300 ${error ? "text-red-400" : "text-slate-400 group-focus-within:text-[#FF6B00]"}`} />
        <Input
          id={id} type={type} value={value} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)} onBlur={onBlur}
          placeholder={placeholder} autoComplete={autoComplete} aria-invalid={!!error} disabled={disabled}
          className={`min-h-[48px] w-full rounded-xl pl-[2.4rem] pr-10 text-[15px] font-medium text-slate-900 placeholder:font-normal placeholder:text-slate-400 disabled:cursor-not-allowed transition-all duration-300 ${
            error 
              ? "border-red-400 focus-visible:border-red-500 focus-visible:ring-4 focus-visible:ring-red-500/20" 
              : "border-slate-200 focus-visible:border-[#FF6B00] focus-visible:ring-4 focus-visible:ring-[#FF6B00]/20"
          }`}
        />
        {trailing && <div className="absolute right-0 top-0 bottom-0 flex items-center pr-1.5 z-10">{trailing}</div>}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="mt-1.5 text-xs font-medium text-red-500">
            {error}
          </motion.p>
        )}
      </AnimatePresence>
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
      msg.includes("503") || msg.includes("maintenance") || msg.includes("failed to fetch") ||
      msg.includes("load failed") || msg.includes("networkerror") || msg.includes("network request failed")
    );
  }
  return false;
}

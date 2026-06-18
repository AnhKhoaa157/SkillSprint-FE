// ─── Admin auth view machine ────────────────────────────────────────────────
export type View = "login" | "fp-step1" | "fp-step2";

// ─── Cognito password rules (must match SYSTEM_CONTEXT.md §4) ────────────────
export const PW_RULES = [
  { label: "Ít nhất 8 ký tự", test: (p: string) => p.length >= 8 },
  { label: "Có chữ hoa (A–Z)", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Có chữ thường (a–z)", test: (p: string) => /[a-z]/.test(p) },
  { label: "Có chữ số (0–9)", test: (p: string) => /\d/.test(p) },
  { label: "Có ký tự đặc biệt", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export function scorePassword(pw: string) {
  const n = PW_RULES.filter((r) => r.test(pw)).length;
  if (n <= 2) return { n, color: "#EF4444", label: "Yếu" };
  if (n === 3) return { n, color: "#F59E0B", label: "Trung bình" };
  if (n === 4) return { n, color: "#3B82F6", label: "Khá" };
  return { n, color: "#10B981", label: "Mạnh" };
}

// ─── Animation preset ────────────────────────────────────────────────────────
export const SLIDE = {
  initial: { opacity: 0, x: 14 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -14 },
  transition: { duration: 0.2 },
} as const;

// ─── Shared input class ──────────────────────────────────────────────────────
export const fieldCls =
  "w-full bg-slate-50/50 border border-slate-200 text-slate-900 text-sm rounded-xl " +
  "focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-[3px] focus:ring-orange-500/20 transition-all placeholder:text-slate-400";

// ─── Shared button class ─────────────────────────────────────────────────────
export const primaryBtnCls =
  "w-full py-3.5 bg-gradient-to-r from-[#FF6B00] to-orange-500 hover:from-orange-600 hover:to-[#FF6B00] " +
  "active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-white font-extrabold rounded-xl text-sm " +
  "transition-all duration-200 shadow-[0_8px_16px_rgba(255,107,0,0.25)] hover:shadow-[0_12px_20px_rgba(255,107,0,0.3)] " +
  "ring-1 ring-orange-500/50 inline-flex items-center justify-center gap-2";

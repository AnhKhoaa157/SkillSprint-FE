import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ToggleLeft, ToggleRight, X } from "lucide-react";

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap border ${className || ""}`}>
      {children}
    </span>
  );
}

export function ToggleSwitch({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 bg-transparent border-0 p-0 ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      }`}
    >
      {checked
        ? <ToggleRight size={22} className="text-[#FF6B00]" />
        : <ToggleLeft size={22} className="text-slate-400" />}
    </button>
  );
}

export function Modal({ open, onClose, title, width = 560, children }: {
  open: boolean; onClose: () => void; title: string; width?: number; children: React.ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 16,
              boxShadow: "0 24px 64px rgba(15,23,42,0.18)",
              width: "100%", maxWidth: width,
              maxHeight: "90vh", overflow: "hidden",
              display: "flex", flexDirection: "column",
            }}
          >
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "20px 24px 16px", borderBottom: "1px solid #F1F5F9", flexShrink: 0,
            }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: "#0F172A" }}>{title}</span>
              <button
                onClick={onClose}
                style={{
                  background: "#F1F5F9", border: "none", borderRadius: 8,
                  width: 32, height: 32, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B",
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Field({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-slate-700">
        {label}{required && <span className="text-orange-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <span className="text-xs text-slate-400">{hint}</span>}
    </div>
  );
}

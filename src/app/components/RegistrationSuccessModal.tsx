import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ArrowRight } from "lucide-react";

/* ─── Design tokens ─── */
const F   = "'Plus Jakarta Sans', Inter, sans-serif";
const OG  = "#FF6B00";
const NAV = "#0B1220";
const GRN = "#16A34A";

interface Props {
  open: boolean;
  onStartSetup: () => void;
  onSkip: () => void;
}

export function RegistrationSuccessModal({ open, onStartSetup, onSkip }: Props) {
  const btnRef = useRef<HTMLButtonElement>(null);

  /* Auto-focus CTA */
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => btnRef.current?.focus(), 380);
      return () => clearTimeout(t);
    }
  }, [open]);

  /* Keyboard: Escape = skip, Enter = proceed */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") onSkip();
      if (e.key === "Enter")  onStartSetup();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onSkip, onStartSetup]);

  return (
    <AnimatePresence>
      {open && (
        /* ── Single overlay: flex container that centers the card ── */
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          onClick={onSkip}
          style={{
            /* Full viewport, stacked above everything */
            position: "fixed",
            inset: 0,
            zIndex: 9999,

            /* Dark blurred backdrop */
            background: "rgba(7, 11, 20, 0.72)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",

            /* Dead-center the card */
            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            /* Prevent content bleed */
            padding: "20px",
          }}
        >
          {/* ── Modal card ── */}
          <motion.div
            key="card"
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.82, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 16 }}
            transition={{
              duration: 0.44,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{
              /* Sizing */
              width: "100%",
              maxWidth: "420px",

              /* Appearance */
              background: "#FFFFFF",
              borderRadius: "20px",
              boxShadow:
                "0 0 0 1px rgba(0,0,0,0.06), " +
                "0 4px 16px rgba(0,0,0,0.10), " +
                "0 16px 48px rgba(0,0,0,0.18), " +
                "0 40px 80px rgba(0,0,0,0.14)",

              /* Layout */
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              padding: "48px 40px 36px",
              fontFamily: F,
              position: "relative",
              overflow: "hidden",
            }}
          >

            {/* ── Thin top accent bar ── */}
            <div style={{
              position: "absolute",
              top: 0, left: 0, right: 0,
              height: "3px",
              background: `linear-gradient(90deg, ${GRN} 0%, ${OG} 100%)`,
              borderRadius: "20px 20px 0 0",
            }} />

            {/* ── Green checkmark circle ── */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.12,
                type: "spring",
                stiffness: 260,
                damping: 18,
              }}
              style={{
                width: "88px",
                height: "88px",
                borderRadius: "50%",
                background: "#F0FDF4",
                border: "2px solid #BBF7D0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "28px",
                boxShadow:
                  "0 0 0 8px rgba(22,163,74,0.06), " +
                  "0 8px 24px rgba(22,163,74,0.18)",
                flexShrink: 0,
              }}
            >
              {/* Animated check SVG draw */}
              <motion.div
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  delay: 0.24,
                  type: "spring",
                  stiffness: 300,
                  damping: 14,
                }}
              >
                <Check
                  size={42}
                  color={GRN}
                  strokeWidth={2.8}
                  style={{ display: "block" }}
                />
              </motion.div>
            </motion.div>

            {/* ── Heading ── */}
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              style={{
                fontFamily: F,
                fontWeight: 800,
                fontSize: "1.75rem",
                letterSpacing: "-0.035em",
                lineHeight: 1.2,
                color: NAV,
                margin: "0 0 10px",
              }}
            >
              Account Created!
            </motion.h2>

            {/* ── Subtitle ── */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.34, duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
              style={{
                fontFamily: F,
                fontSize: "0.975rem",
                color: "#6B7280",
                lineHeight: 1.65,
                margin: "0 0 32px",
                maxWidth: "300px",
              }}
            >
              Let's personalize your learning roadmap
              before you start.
            </motion.p>

            {/* ── Primary CTA button ── */}
            <motion.button
              ref={btnRef}
              onClick={onStartSetup}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.40, duration: 0.36 }}
              whileHover={{
                scale: 1.025,
                boxShadow: "0 12px 36px rgba(255,107,0,0.50), 0 4px 12px rgba(255,107,0,0.24)",
              }}
              whileTap={{ scale: 0.975 }}
              style={{
                width: "100%",
                padding: "15px 24px",
                borderRadius: "12px",
                border: "none",
                cursor: "pointer",
                background: OG,
                color: "#fff",
                fontFamily: F,
                fontWeight: 700,
                fontSize: "1rem",
                letterSpacing: "-0.01em",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "9px",
                boxShadow: "0 6px 24px rgba(255,107,0,0.38), 0 2px 8px rgba(255,107,0,0.16)",
                marginBottom: "10px",
                transition: "box-shadow 0.2s ease",
              }}
            >
              Start Setup
              <ArrowRight size={18} strokeWidth={2.5} />
            </motion.button>

            {/* ── Skip link ── */}
            <motion.button
              onClick={onSkip}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.50 }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: F,
                fontSize: "0.82rem",
                color: "#9CA3AF",
                padding: "6px 0",
                lineHeight: 1,
                transition: "color 0.15s ease",
              }}
              onMouseEnter={e =>
                ((e.currentTarget as HTMLButtonElement).style.color = "#6B7280")
              }
              onMouseLeave={e =>
                ((e.currentTarget as HTMLButtonElement).style.color = "#9CA3AF")
              }
            >
              I'll set it up later
            </motion.button>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

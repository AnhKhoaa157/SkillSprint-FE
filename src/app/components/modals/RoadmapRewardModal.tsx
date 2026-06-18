import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";

import { Button } from "../ui/button";

/* ─── Theme tokens ─── */
const BRAND_ORANGE = "#FF6B00";
const BRIGHT_GOLD = "#FFD700";
const AMBER_YELLOW = "#FFA500";

const CHEST_CLOSED_SRC = "/assets/images/roadmap-chest-closed.png";
const CHEST_OPEN_SRC = "/assets/images/roadmap-chest-open.png";

const CONFETTI_DURATION_MS = 2500;
const CONFETTI_COLORS: string[] = [BRAND_ORANGE, BRIGHT_GOLD, AMBER_YELLOW];

interface RoadmapRewardModalProps {
  /** Controls visibility of the modal. */
  open: boolean;
  /** Invoked when the user dismisses the modal (backdrop, CTA after reward, or Escape). */
  onClose: () => void;
  /** Optional amount of XP shown in the payout badge. Defaults to 500. */
  xpAmount?: number;
}

export function RoadmapRewardModal({
  open,
  onClose,
  xpAmount = 500,
}: RoadmapRewardModalProps) {
  const [isOpened, setIsOpened] = useState<boolean>(false);
  /** Holds the active confetti rAF id so we can cancel it on unmount/close. */
  const confettiFrameRef = useRef<number | null>(null);

  /* ─── Confetti explosion engine ─── */
  const fireConfetti = useCallback((): void => {
    const animationEnd = Date.now() + CONFETTI_DURATION_MS;

    const frame = (): void => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        confettiFrameRef.current = null;
        return;
      }

      // Bottom-left burst, 60° trajectory.
      confetti({
        particleCount: 6,
        angle: 60,
        spread: 70,
        startVelocity: 55,
        origin: { x: 0.1, y: 0.8 },
        colors: CONFETTI_COLORS,
        scalar: 1.1,
        zIndex: 10000,
      });

      // Bottom-right burst, 120° trajectory.
      confetti({
        particleCount: 6,
        angle: 120,
        spread: 70,
        startVelocity: 55,
        origin: { x: 0.9, y: 0.8 },
        colors: CONFETTI_COLORS,
        scalar: 1.1,
        zIndex: 10000,
      });

      confettiFrameRef.current = requestAnimationFrame(frame);
    };

    confettiFrameRef.current = requestAnimationFrame(frame);
  }, []);

  /* ─── Stop any running confetti loop ─── */
  const stopConfetti = useCallback((): void => {
    if (confettiFrameRef.current !== null) {
      cancelAnimationFrame(confettiFrameRef.current);
      confettiFrameRef.current = null;
    }
  }, []);

  /* ─── Open the chest (Stage 2 + 3 trigger) ─── */
  const handleOpenChest = useCallback((): void => {
    if (isOpened) return;
    setIsOpened(true);
    fireConfetti();
  }, [isOpened, fireConfetti]);

  /* ─── CTA handler: opens chest if closed, otherwise closes modal ─── */
  const handleCtaClick = useCallback((): void => {
    if (isOpened) {
      onClose();
    } else {
      handleOpenChest();
    }
  }, [isOpened, onClose, handleOpenChest]);

  /* Reset internal state each time the modal is (re)opened. */
  useEffect(() => {
    if (open) {
      setIsOpened(false);
    } else {
      stopConfetti();
    }
  }, [open, stopConfetti]);

  /* Cleanup confetti loop on unmount. */
  useEffect(() => stopConfetti, [stopConfetti]);

  /* Keyboard: Escape closes the modal. */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="roadmap-reward-overlay"
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          onClick={onClose}
        >
          {/* ── Modal card ── */}
          <motion.div
            key="roadmap-reward-card"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.82, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 16 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            className="relative flex w-full max-w-[420px] flex-col items-center overflow-hidden rounded-[32px] border-4 border-slate-200 bg-white px-8 pb-9 pt-12 text-center shadow-[0_4px_16px_rgba(0,0,0,0.10),0_24px_64px_rgba(0,0,0,0.22),0_48px_96px_rgba(0,0,0,0.16)]"
          >
            {/* ── Heading ── */}
            <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-slate-900">
              Chúc mừng! 🎉
            </h2>
            <p className="mb-8 max-w-[300px] text-[0.95rem] leading-relaxed text-slate-500">
              Bạn đã hoàn thành lộ trình học tập. Mở rương để nhận phần thưởng
              của bạn!
            </p>

            {/* ── Chest stage ── */}
            <div className="relative mb-8 flex h-56 w-full items-center justify-center">
              {/* Animated radial glow behind the chest */}
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 m-auto h-56 w-56 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${BRIGHT_GOLD}55 0%, ${AMBER_YELLOW}22 45%, transparent 70%)`,
                }}
                animate={{
                  scale: isOpened ? [1, 1.35, 1.2] : [1, 1.12, 1],
                  opacity: isOpened ? [0.6, 1, 0.85] : [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: isOpened ? 1.2 : 2.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* The chest itself */}
              <motion.button
                type="button"
                onClick={handleOpenChest}
                disabled={isOpened}
                aria-label={isOpened ? "Rương đã mở" : "Mở rương phần thưởng"}
                className="relative z-10 cursor-pointer border-none bg-transparent p-0 outline-none disabled:cursor-default"
                whileHover={isOpened ? undefined : { scale: 1.06 }}
                whileTap={isOpened ? undefined : { scale: 0.94 }}
                animate={
                  isOpened
                    ? { rotate: 0, y: 0, scale: 1 }
                    : {
                        // Stage 1: subtle "alive" shake + lift loop
                        y: [0, -6, 0],
                        rotate: [-2.5, 2.5, -2.5],
                      }
                }
                transition={
                  isOpened
                    ? { type: "spring", stiffness: 300, damping: 15 }
                    : {
                        duration: 1.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }
                }
              >
                <img
                  src={isOpened ? CHEST_OPEN_SRC : CHEST_CLOSED_SRC}
                  alt={isOpened ? "Rương kho báu đã mở" : "Rương kho báu"}
                  draggable={false}
                  className="h-48 w-48 select-none object-contain drop-shadow-[0_18px_24px_rgba(0,0,0,0.25)]"
                />
              </motion.button>

              {/* ── Stage 3: floating +XP badge ── */}
              <AnimatePresence>
                {isOpened && (
                  <motion.div
                    key="xp-badge"
                    className="pointer-events-none absolute -top-2 z-20"
                    initial={{ opacity: 0, y: 30, scale: 0.6 }}
                    animate={{ opacity: 1, y: -8, scale: 1 }}
                    exit={{ opacity: 0, y: -40, scale: 0.8 }}
                    transition={{
                      delay: 0.15,
                      type: "spring",
                      stiffness: 260,
                      damping: 16,
                    }}
                  >
                    <motion.span
                      className="block text-4xl font-black tracking-tight"
                      style={{
                        color: BRAND_ORANGE,
                        textShadow: `0 0 12px ${BRIGHT_GOLD}cc, 0 0 24px ${AMBER_YELLOW}88, 0 2px 4px rgba(0,0,0,0.2)`,
                        filter: "drop-shadow(0 0 6px rgba(255,215,0,0.6))",
                      }}
                      animate={{ y: [0, -10, 0] }}
                      transition={{
                        duration: 1.6,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      +{xpAmount} XP
                    </motion.span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Primary 3D CTA button ── */}
            <Button
              onClick={handleCtaClick}
              className="h-auto w-full rounded-2xl bg-orange-500 px-6 py-4 text-base font-bold text-white shadow-[0_6px_0_0_#c2410c,0_10px_20px_rgba(255,107,0,0.35)] transition-all hover:bg-orange-600 active:translate-y-[4px] active:shadow-[0_2px_0_0_#c2410c,0_4px_10px_rgba(255,107,0,0.3)]"
            >
              {isOpened ? "Nhận thưởng" : "Mở rương ngay!"}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default RoadmapRewardModal;

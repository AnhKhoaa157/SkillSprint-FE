import { useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Play, X } from "lucide-react";
import { motion } from "motion/react";

const F    = "'Plus Jakarta Sans', Inter, sans-serif";
const CARD = "#FFFFFF";
const T1   = "#1F2937";
const T2   = "#6B7280";
const BDR  = "#E5E7EB";
const SH   = "0 1px 3px rgba(0,0,0,0.06),0 4px 12px rgba(0,0,0,0.04)";
const SHM  = "0 4px 16px rgba(0,0,0,0.08),0 1px 4px rgba(0,0,0,0.04)";

export function DemoModal() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [open, setOpen] = useState(false);

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <motion.button
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "14px 28px",
            borderRadius: "14px",
            background: CARD,
            color: T1,
            fontFamily: F,
            fontWeight: 600,
            fontSize: "1rem",
            border: `1.5px solid ${BDR}`,
            cursor: "pointer",
            boxShadow: SH,
          }}
          whileHover={{ scale: 1.03, boxShadow: SHM }}
          whileTap={{ scale: 0.97 }}
        >
          <Play size={14} fill={T2} color={T2} />
          Xem Demo
        </motion.button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay
          className="
            fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm
            data-[state=open]:animate-in  data-[state=closed]:animate-out
            data-[state=open]:fade-in-0   data-[state=closed]:fade-out-0
            duration-200
          "
        />
        <Dialog.Content
          aria-describedby={undefined}
          className="
            fixed left-1/2 top-1/2 z-[101]
            w-[90vw] max-w-3xl
            -translate-x-1/2 -translate-y-1/2
            rounded-2xl bg-white overflow-hidden
            shadow-[0_24px_80px_rgba(0,0,0,0.18),0_4px_16px_rgba(0,0,0,0.08)]
            data-[state=open]:animate-in   data-[state=closed]:animate-out
            data-[state=open]:fade-in-0    data-[state=closed]:fade-out-0
            data-[state=open]:zoom-in-95   data-[state=closed]:zoom-out-95
            duration-200
          "
        >
          <Dialog.Title className="sr-only">SkillSprint — Demo</Dialog.Title>

          <div className="relative">
            <Dialog.Close
              aria-label="Đóng"
              className="
                absolute right-3 top-3 z-10
                flex h-8 w-8 items-center justify-center
                rounded-full bg-white/80 backdrop-blur-sm
                text-gray-500 hover:text-gray-900
                hover:bg-white shadow-sm
                transition-all duration-150 cursor-pointer
                border border-transparent hover:border-gray-200
              "
            >
              <X size={16} strokeWidth={2.5} />
            </Dialog.Close>

            {/* 🟢 CHỈ CHECK 1 LẦN: Render video sạch sẽ khi Modal mở */}
            {open && (
              <video
                ref={videoRef}
                src="/videos/skillsprint_Video_Demo.mp4"
                controls
                autoPlay
                muted
                playsInline
                preload="auto"
                style={{ width: "100%", display: "block" }}
              />
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
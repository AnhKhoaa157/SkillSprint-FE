import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X, Copy, Check, Share2, Users, Zap, Gift,
  Lock, Crown, CheckCircle, ArrowRight,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────
   Animated blurred "PDF Resume" preview
───────────────────────────────────────────────────────── */
function BlurredResume() {
  return (
    <div
      className="relative rounded-xl overflow-hidden"
      style={{
        background: "#1a1a2e",
        border: "1px solid rgba(255,255,255,0.08)",
        padding: "18px",
        filter: "blur(3px)",
        transform: "scale(0.96)",
        userSelect: "none",
        pointerEvents: "none",
      }}
    >
      {/* Header section */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full" style={{ background: "linear-gradient(135deg, #FF6B00, #06b6d4)" }} />
        <div className="flex-1">
          <div className="h-2.5 rounded-full mb-1.5" style={{ background: "rgba(255,255,255,0.5)", width: "60%" }} />
          <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.2)", width: "45%" }} />
        </div>
        <div className="w-8 h-8 rounded" style={{ background: "rgba(255,107,0,0.3)" }} />
      </div>

      {/* Skill bars */}
      <div className="space-y-2 mb-4">
        {[
          { w: "82%", color: "#06b6d4" },
          { w: "74%", color: "#FF6B00" },
          { w: "65%", color: "#22c55e" },
        ].map((bar, i) => (
          <div key={i}>
            <div className="h-1.5 rounded-full mb-1" style={{ background: "rgba(255,255,255,0.1)", width: "100%" }}>
              <div className="h-full rounded-full" style={{ width: bar.w, background: bar.color, opacity: 0.7 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Text lines */}
      <div className="space-y-1.5">
        {[90, 75, 55, 80, 60, 70, 45].map((w, i) => (
          <div key={i} className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.12)", width: `${w}%` }} />
        ))}
      </div>

      {/* QR code block */}
      <div className="flex items-center justify-between mt-4">
        <div className="w-10 h-10 rounded" style={{ background: "rgba(255,255,255,0.08)", display: "grid", placeItems: "center" }}>
          <div style={{ width: "24px", height: "24px", background: "rgba(255,255,255,0.3)", borderRadius: "2px" }} />
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle size={11} style={{ color: "#22c55e" }} />
          <div className="h-1.5 rounded-full" style={{ background: "rgba(34,197,94,0.5)", width: "60px" }} />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Avatar row for invited friends
───────────────────────────────────────────────────────── */
function InviteAvatars({ invited }: { invited: number }) {
  const colors = ["#FF6B00", "#06b6d4", "#f59e0b"];
  const initials = ["A", "B", "C"];
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs transition-all duration-300"
            style={{
              background: i < invited ? colors[i] : "rgba(255,255,255,0.05)",
              borderColor: i < invited ? colors[i] : "rgba(255,255,255,0.1)",
              color: i < invited ? "#fff" : "rgba(255,255,255,0.2)",
              fontWeight: 700, zIndex: 3 - i,
              boxShadow: i < invited ? `0 0 10px ${colors[i]}80` : "none",
            }}
          >
            {i < invited ? initials[i] : "+"}
          </div>
        ))}
      </div>
      <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
        <span style={{ color: "#fff", fontWeight: 700 }}>{invited}</span>/3 bạn đã mời
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Main ReferralModal — Split Screen
───────────────────────────────────────────────────────── */
interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReferralModal({ isOpen, onClose }: ReferralModalProps) {
  const [copied, setCopied] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [upgraded, setUpgraded] = useState(false);
  const invited = 1;
  const referralLink = "skillsprint.app/r/student-abc123";

  const handleCopy = () => {
    navigator.clipboard?.writeText(`https://${referralLink}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpgrade = () => {
    setUpgrading(true);
    setTimeout(() => { setUpgrading(false); setUpgraded(true); }, 2200);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(14px)" }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 210, damping: 26 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-3xl pointer-events-auto rounded-2xl overflow-hidden flex flex-col md:flex-row"
              style={{
                background: "rgba(4,4,16,0.97)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 0 100px rgba(255,107,0,0.2), 0 50px 120px rgba(0,0,0,0.7)",
                maxHeight: "90vh",
              }}
            >
              {/* Top shimmer */}
              <div className="absolute top-0 left-0 right-0 h-px z-20" style={{ background: "linear-gradient(90deg, transparent, rgba(255,107,0,0.8), rgba(6,182,212,0.6), transparent)" }} />

              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-30 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                style={{ color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.07)" }}
                onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.3)"; e.currentTarget.style.background = "transparent"; }}
              >
                <X size={15} />
              </button>

              {/* ─── LEFT SIDE: Referral ─── */}
              <div
                className="flex-1 p-7 flex flex-col"
                style={{ borderRight: "1px solid rgba(255,255,255,0.05)" }}
              >
                {/* Icon + Title */}
                <div className="mb-6">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", boxShadow: "0 0 16px rgba(245,158,11,0.15)" }}>
                    <Gift size={20} style={{ color: "#f59e0b" }} />
                  </div>
                  <h2 className="text-white mb-1.5" style={{ fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.03em" }}>
                    Mời bạn học,<br />nhận Premium. 🎁
                  </h2>
                  <p style={{ color: "rgba(255,255,255,0.38)", fontSize: "0.85rem", lineHeight: 1.65 }}>
                    Mời 3 bạn và mở khóa <span style={{ color: "#f59e0b", fontWeight: 600 }}>1 tháng Premium miễn phí</span>. Không cần thẻ ngân hàng.
                  </p>
                </div>

                {/* Progress */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <InviteAvatars invited={invited} />
                    <span className="text-xs px-2 py-1 rounded-full"
                      style={{ background: "rgba(245,158,11,0.08)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)", fontWeight: 700 }}>
                      Còn {3 - invited} bạn nữa!
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(invited / 3) * 100}%` }}
                      transition={{ duration: 0.9, ease: "easeOut", delay: 0.3 }}
                      style={{
                        background: "linear-gradient(90deg, #f59e0b, #f97316)",
                        boxShadow: "0 0 8px rgba(245,158,11,0.5)",
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>1 bạn đã mời</span>
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Cần 3 bạn</span>
                  </div>
                </div>

                {/* Referral link */}
                <div className="mb-5">
                  <p className="text-xs mb-2 uppercase" style={{ color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em", fontWeight: 500 }}>
                    Link giới thiệu của bạn
                  </p>
                  <div
                    className="flex items-center gap-2 p-3 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <span className="flex-1 text-xs truncate" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>
                      {referralLink}
                    </span>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all shrink-0"
                      style={{
                        background: copied ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.07)",
                        color: copied ? "#22c55e" : "rgba(255,255,255,0.6)",
                        border: `1px solid ${copied ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.1)"}`,
                        fontWeight: 600,
                      }}
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {copied ? "Đã sao chép!" : "Sao chép"}
                    </button>
                  </div>
                </div>

                {/* Share button */}
                <button
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm transition-all duration-200"
                  style={{
                    background: "rgba(245,158,11,0.1)",
                    border: "1px solid rgba(245,158,11,0.3)",
                    color: "#f59e0b",
                    fontWeight: 700,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(245,158,11,0.18)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(245,158,11,0.2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(245,158,11,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <Share2 size={14} /> Chia sẻ liên kết
                </button>

                {/* Reward tiers */}
                <div className="mt-5 space-y-2">
                  {[
                    { refs: 1, reward: "500 XP thưởng",     done: true  },
                    { refs: 3, reward: "1 tháng Premium",   done: false },
                    { refs: 5, reward: "Giảm 20% trọn đời", done: false },
                  ].map(tier => (
                    <div key={tier.refs} className="flex items-center gap-2.5 text-xs"
                      style={{ color: tier.done ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.25)" }}>
                      <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          background: tier.done ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.04)",
                          border: `1px solid ${tier.done ? "rgba(34,197,94,0.35)" : "rgba(255,255,255,0.08)"}`,
                        }}>
                        {tier.done ? <Check size={9} style={{ color: "#22c55e" }} /> : <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "7px" }}>{tier.refs}</span>}
                      </div>
                      <span>{tier.refs} lượt mời</span>
                      <span className="mx-1" style={{ color: "rgba(255,255,255,0.1)" }}>→</span>
                      <span style={{ color: tier.done ? "#22c55e" : "inherit" }}>{tier.reward}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ─── RIGHT SIDE: Paywall ─── */}
              <div className="flex-1 p-7 flex flex-col relative">
                {/* BG orbs */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-r-2xl">
                  <div style={{ position: "absolute", width: "220px", height: "220px", background: "radial-gradient(circle, rgba(255,107,0,0.14) 0%, transparent 70%)", borderRadius: "50%", top: "-60px", right: "-40px" }} />
                  <div style={{ position: "absolute", width: "180px", height: "180px", background: "radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)", borderRadius: "50%", bottom: "-40px", left: "-20px" }} />
                </div>

                {/* Lock badge */}
                <div className="flex items-center gap-2 mb-5 relative z-10">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                    style={{ background: "rgba(255,107,0,0.12)", border: "1px solid rgba(255,107,0,0.3)", color: "#fb923c", fontWeight: 700 }}>
                    <Lock size={10} /> Tính năng Premium
                  </div>
                </div>

                {/* Title */}
                <div className="relative z-10 mb-5">
                  <h2 className="text-white mb-1.5" style={{ fontWeight: 800, fontSize: "1.15rem", letterSpacing: "-0.03em", lineHeight: 1.3 }}>
                    Mở khóa gói học nâng cao<br />và tài nguyên độc quyền
                  </h2>
                  <p style={{ color: "rgba(255,255,255,0.38)", fontSize: "0.85rem", lineHeight: 1.65 }}>
                    Nâng cấp để nhận tư vấn AI 24/7, quiz thông minh và công cụ hỗ trợ học tập ưu tiên.
                  </p>
                </div>

                {/* Blurred PDF preview with overlay */}
                <div className="relative z-10 mb-5">
                  <BlurredResume />

                  {/* Overlay on PDF */}
                  <div
                    className="absolute inset-0 flex items-center justify-center rounded-xl"
                    style={{ background: "linear-gradient(to bottom, rgba(4,4,16,0) 0%, rgba(4,4,16,0.8) 60%)" }}
                  >
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
                        style={{ background: "rgba(255,107,0,0.2)", border: "1px solid rgba(255,107,0,0.4)", color: "#fb923c", backdropFilter: "blur(8px)" }}>
                        <Lock size={10} />
                        Nâng cấp để mở tính năng Premium
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing card */}
                <div
                  className="relative z-10 rounded-xl p-4 mb-4"
                  style={{
                    background: "rgba(255,107,0,0.07)",
                    border: "1px solid rgba(255,107,0,0.3)",
                    boxShadow: "0 0 20px rgba(255,107,0,0.1)",
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Crown size={12} style={{ color: "#f59e0b" }} />
                        <span className="text-xs" style={{ color: "#f59e0b", fontWeight: 700, letterSpacing: "0.06em" }}>STUDENT PREMIUM</span>
                      </div>
                      <p style={{ fontWeight: 800, fontSize: "1.4rem", color: "#fff", letterSpacing: "-0.04em", lineHeight: 1 }}>
                        89.000 <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>VNĐ/tháng</span>
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full"
                      style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)", fontWeight: 700 }}>
                      Phổ biến nhất
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      "Gia sư kỹ năng AI",
                      "Quiz thông minh theo chương",
                      "Báo cáo tiến độ chi tiết",
                      "Sprint học không giới hạn",
                    ].map(f => (
                      <div key={f} className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                        <CheckCircle size={10} style={{ color: "#fb923c", flexShrink: 0 }} />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upgrade CTA */}
                <motion.button
                  onClick={handleUpgrade}
                  disabled={upgrading || upgraded}
                  className="relative z-10 w-full py-3.5 rounded-full text-white text-sm flex items-center justify-center gap-2 transition-all duration-200"
                  style={{
                    fontWeight: 700,
                    background: upgraded
                      ? "linear-gradient(135deg, #22c55e, #16a34a)"
                      : "linear-gradient(135deg, #FF6B00, #EA580C)",
                    boxShadow: upgraded
                      ? "0 0 30px rgba(34,197,94,0.5)"
                      : "0 0 30px rgba(255,107,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)",
                  }}
                  whileHover={!upgrading && !upgraded ? { y: -1, boxShadow: "0 0 50px rgba(255,107,0,0.75)" } : {}}
                  whileTap={!upgrading && !upgraded ? { scale: 0.98 } : {}}
                >
                  {upgrading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Đang xử lý...
                    </>
                  ) : upgraded ? (
                    <><CheckCircle size={15} /> Đã mở khóa Premium!</>
                  ) : (
                    <><Crown size={14} style={{ color: "#f59e0b" }} /> Nâng cấp ngay — 89.000 VNĐ<ArrowRight size={14} /></>
                  )}
                </motion.button>

                <p className="relative z-10 text-center text-xs mt-2" style={{ color: "rgba(255,255,255,0.2)" }}>
                  Hủy bất kỳ lúc nào · Thanh toán an toàn · Giá ưu đãi sinh viên
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

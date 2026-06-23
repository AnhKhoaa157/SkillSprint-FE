import { useState, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useNavigate } from "react-router";
import { Link } from "react-router";
import {
  X, HelpCircle, Plus, Check,
  Crown, Layers3, Shield, ArrowUpRight, Zap
} from "lucide-react";
import { Footer as PublicFooter } from "../components/Footer";
import { PublicNavbar } from "../components/PublicNavbar";
import { useAuth } from "../../contexts/AuthContext";
import {
  listSubscriptionPlans,
  formatPlanPrice,
  resolvePlanFeatures,
  type PublicPlanResponse
} from "../../../api/admin/adminSubscriptionPlansService";
import { useEffect } from "react";

/* ──────────────────────────────────────────────────────────────
   🎴 Tilt 3D Card — Wrapper tạo hiệu ứng nghiêng 3D khi hover
   (Nâng cấp độ nhạy và hiệu ứng bóng đổ khi nghiêng)
 ────────────────────────────────────────────────────────────── */
function TiltCard({
  children,
  className,
  isPremium,
}: {
  children: React.ReactNode;
  className?: string;
  isPremium?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 180, damping: 24 });
  const springY = useSpring(mouseY, { stiffness: 180, damping: 24 });

  const tiltLimit = isPremium ? 12 : 8;
  const rotateY = useTransform(springX, [-0.5, 0.5], [-tiltLimit, tiltLimit]);
  const rotateX = useTransform(springY, [-0.5, 0.5], [tiltLimit, -tiltLimit]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 1500,
        transformStyle: "preserve-3d",
      }}
      whileHover={{ 
        scale: isPremium ? 1.04 : 1.03, 
        y: isPremium ? -16 : -10,
        z: 30 
      }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────────
   ✨ Shimmer highlight — Ánh sáng quét chéo qua thẻ khi hover
 ────────────────────────────────────────────────────────────── */
function ShimmerOverlay() {
  return (
    <motion.div
      className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none z-10"
      initial={{ opacity: 0 }}
      whileHover={{ opacity: 1 }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-25deg]"
        initial={{ x: "-150%" }}
        whileHover={{ x: "250%" }}
        transition={{ duration: 0.95, ease: "easeInOut" }}
      />
    </motion.div>
  );
}

export default function UltraPremiumPricingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const [pendingAuthPlan, setPendingAuthPlan] = useState<{ id: string; name: string } | null>(null);
  const [plans, setPlans] = useState<PublicPlanResponse[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    let isMounted = true;
    setLoadingPlans(true);
    listSubscriptionPlans()
      .then(data => { if (isMounted) setPlans(data); })
      .catch(() => { if (isMounted) setPlans([]); })
      .finally(() => { if (isMounted) setLoadingPlans(false); });
    return () => { isMounted = false; };
  }, []);

  const handlePlanCTA = (plan: PublicPlanResponse) => {
    if (isAuthenticated) {
      navigate(`/app?pricing=${plan.planId}&period=monthly`);
      return;
    }
    setPendingAuthPlan({ id: plan.planId, name: plan.planName });
    setAuthGateOpen(true);
  };

  return (
    <div
      className="min-h-screen relative overflow-x-hidden antialiased selection:bg-orange-500/20 selection:text-orange-600 text-slate-800"
      style={{
        fontFamily: "'Plus Jakarta Sans', Inter, sans-serif",
        background: "linear-gradient(180deg, #ffffff 0%, #fffbf7 30%, #fff7ef 60%, #faf6f0 100%)",
      }}
    >
      {/* ── Lưới nền trang trí tinh xảo ── */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,107,0,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,107,0,0.02) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
          maskImage: "radial-gradient(ellipse at 50% 30%, black 60%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 30%, black 60%, transparent 100%)",
        }}
      />

      {/* ── Hệ thống hào quang ambient 2 lớp ── */}
      <div
        className="absolute top-[180px] left-1/2 -translate-x-1/2 w-[1100px] h-[550px] rounded-full pointer-events-none z-0 opacity-80"
        style={{
          background: "radial-gradient(ellipse at center, rgba(255,107,0,0.08) 0%, rgba(251,146,60,0.03) 45%, transparent 70%)",
          filter: "blur(70px)",
        }}
      />
      <div
        className="absolute top-12 left-1/4 w-[400px] h-[400px] rounded-full pointer-events-none z-0 opacity-60"
        style={{
          background: "radial-gradient(circle, rgba(255,237,213,0.6) 0%, transparent 80%)",
          filter: "blur(60px)",
        }}
      />

      <div className="relative z-10">
        <PublicNavbar />

        <main className="pt-36 pb-32">
          {/* ══════════════════════════════════════════
              HERO SECTION (Không còn nút Toggle Hàng năm)
              ══════════════════════════════════════════ */}
          <section className="px-4 max-w-5xl mx-auto text-center mb-16 relative z-10">
            {/* Badge tiêu chớp mới */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 mb-8"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,247,237,0.95))",
                border: "1.5px solid rgba(255,107,0,0.25)",
                boxShadow: "0 10px 30px -5px rgba(255,107,0,0.12), inset 0 1.5px 0 rgba(255,255,255,1)",
                backdropFilter: "blur(10px)",
              }}
            >
              <Zap size={13} className="text-orange-500 fill-orange-500 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-wider text-orange-600">
                LỰA CHỌN TỐI ƯU · CAM KẾT HIỆU QUẢ TRỌN VẸN
              </span>
            </motion.div>

            {/* Tiêu đề nâng cấp */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-[62px] font-black tracking-tight text-slate-900 leading-[1.08] mb-6"
            >
              Đầu tư thông minh.{" "}
              <br />
              <span className="relative inline-block mt-2">
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: "linear-gradient(135deg, #f97316 0%, #ea580c 50%, #e65c00 100%)" }}
                >
                  Làm chủ lộ trình tương lai.
                </span>
                <span
                  className="absolute -bottom-2.5 left-0 w-full h-[6px] rounded-full"
                  style={{ background: "linear-gradient(90deg, rgba(255,107,0,0.45) 0%, rgba(251,146,60,0.05) 100%)" }}
                />
              </span>
            </motion.h1>

            {/* Mô tả phụ mượt mà */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-2xl mx-auto text-[15px] text-slate-500 leading-relaxed font-semibold mt-4"
            >
              Kích hoạt đặc quyền xử lý tri thức chuyên sâu từ hệ thống AI thông minh bậc nhất.
              Tập trung hoàn toàn vào gói tháng linh hoạt, không lo lắng các ràng buộc dài hạn.
            </motion.p>
          </section>

          {/* ══════════════════════════════════════════
              PRICING CARDS SECTION
              ══════════════════════════════════════════ */}
          <section className="max-w-6xl mx-auto px-4 mt-2 relative z-10">
            {loadingPlans ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="rounded-[36px] h-[620px] animate-pulse"
                    style={{
                      background: "linear-gradient(135deg, rgba(255,255,255,0.85), rgba(255,237,213,0.3))",
                      border: "1px solid rgba(255,107,0,0.08)",
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-7 items-stretch">
                {plans.map((plan, idx) => {
                  const isFree = plan.monthlyPrice <= 0;
                  const isPremium = !isFree && idx === plans.length - 1 && plans.length > 1;
                  const isMiddle = !isFree && !isPremium && idx > 0;

                  return (
                    <motion.div
                      key={plan.planId}
                      initial={{ opacity: 0, y: 60 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: idx * 0.12 }}
                      className={`flex flex-col ${isPremium ? "lg:-translate-y-4" : ""}`}
                      style={{ transformStyle: "preserve-3d" }}
                    >
                      <TiltCard isPremium={isPremium} className="relative h-full flex flex-col flex-1">
                        {/* ── CARD WRAPPER ── */}
                        <div
                          className="relative rounded-[36px] flex flex-col h-full overflow-hidden flex-1 transition-all duration-350"
                          style={
                            isPremium
                              ? {
                                  /* Nền tối sâu thẳm Obsidian Black cho Premium */
                                  background: "linear-gradient(160deg, #090e18 0%, #0d1525 50%, #060a12 100%)",
                                  border: "1.5px solid rgba(249,115,22,0.6)",
                                  boxShadow:
                                    "0 35px 70px -15px rgba(249,115,22,0.3), 0 15px 30px -10px rgba(0,0,0,0.7), inset 0 1px 1px rgba(255,255,255,0.1)",
                                  padding: "44px 36px 36px",
                                }
                              : isMiddle
                              ? {
                                  /* Thẻ giữa: Kính sáng cao cấp và viền cam nhẹ */
                                  background: "linear-gradient(165deg, rgba(255,255,255,0.98) 0%, rgba(255,250,245,0.95) 100%)",
                                  border: "1.5px solid rgba(255,107,0,0.2)",
                                  boxShadow:
                                    "0 30px 60px -15px rgba(255,107,0,0.1), 0 10px 20px -8px rgba(15,23,42,0.04), inset 0 1.5px 0 rgba(255,255,255,1)",
                                  backdropFilter: "blur(20px)",
                                  padding: "40px 32px 32px",
                                }
                              : {
                                  /* Gói Free: Nền kính tinh tế, muted hơn */
                                  background: "linear-gradient(165deg, rgba(255,255,255,0.92) 0%, rgba(248,250,252,0.85) 100%)",
                                  border: "1px solid rgba(226,232,240,0.9)",
                                  boxShadow:
                                    "0 20px 40px -10px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,1)",
                                  backdropFilter: "blur(16px)",
                                  padding: "40px 32px 32px",
                                }
                          }
                        >
                          <ShimmerOverlay />

                          {/* Glow viền & góc cho Premium */}
                          {isPremium && (
                            <>
                              <div
                                className="absolute top-0 right-0 w-56 h-56 pointer-events-none opacity-40"
                                style={{
                                  background: "radial-gradient(circle at top right, rgba(249,115,22,0.45) 0%, transparent 70%)",
                                }}
                              />
                              <div
                                className="absolute bottom-0 left-0 w-44 h-44 pointer-events-none opacity-30"
                                style={{
                                  background: "radial-gradient(circle at bottom left, rgba(234,88,12,0.3) 0%, transparent 70%)",
                                }}
                              />
                            </>
                          )}

                          {/* Badge nổi bật Premium */}
                          {isPremium && (
                            <div
                              className="absolute -top-px left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-6 py-2 rounded-b-2xl z-20"
                              style={{
                                background: "linear-gradient(135deg, #f97316 0%, #ea580c 50%, #e65c00 100%)",
                                boxShadow: "0 6px 20px rgba(249,115,22,0.45)",
                              }}
                            >
                              <Zap size={11} className="text-white fill-white animate-bounce" />
                              <span className="text-[10px] text-white font-extrabold tracking-widest uppercase">
                                KHUYÊN DÙNG NHẤT
                              </span>
                            </div>
                          )}

                          {/* CARD HEADER */}
                          <div className="flex items-start justify-between gap-4 mb-8 relative z-10" style={{ marginTop: isPremium ? "12px" : "0" }}>
                            {/* Icon gói */}
                            <div
                              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                              style={
                                isPremium
                                  ? {
                                      background: "linear-gradient(135deg, rgba(249,115,22,0.25), rgba(234,88,12,0.1))",
                                      border: "1.5px solid rgba(249,115,22,0.45)",
                                      boxShadow: "0 10px 25px rgba(249,115,22,0.35)",
                                    }
                                  : isMiddle
                                  ? {
                                      background: "linear-gradient(135deg, rgba(255,247,237,1), rgba(255,237,213,0.7))",
                                      border: "1.5px solid rgba(255,107,0,0.25)",
                                      boxShadow: "0 6px 18px rgba(255,107,0,0.1)",
                                    }
                                  : {
                                      background: "linear-gradient(135deg, rgba(241,245,249,0.9), rgba(226,232,240,0.6))",
                                      border: "1px solid rgba(203,213,225,0.5)",
                                    }
                              }
                            >
                              {isFree ? (
                                <Layers3 size={24} className="text-slate-600" />
                              ) : isPremium ? (
                                <Crown size={24} className="text-orange-400 fill-orange-400/20" />
                              ) : (
                                <Shield size={24} className="text-orange-500" />
                              )}
                            </div>

                            {/* Tag định danh gói */}
                            <span
                              className="text-[9px] font-black tracking-widest uppercase px-3 py-1.5 rounded-full"
                              style={
                                isPremium
                                  ? {
                                      background: "rgba(249,115,22,0.18)",
                                      color: "#ff914d",
                                      border: "1px solid rgba(249,115,22,0.3)",
                                    }
                                  : isMiddle
                                  ? {
                                      background: "rgba(255,107,0,0.08)",
                                      color: "#ea580c",
                                      border: "1px solid rgba(255,107,0,0.15)",
                                    }
                                  : {
                                      background: "rgba(100,116,139,0.08)",
                                      color: "#475569",
                                      border: "1px solid rgba(100,116,139,0.15)",
                                    }
                              }
                            >
                              {isFree ? "Starter" : isPremium ? "Gói Đỉnh Cao" : "Pro Core"}
                            </span>
                          </div>

                          {/* TÊN GÓI */}
                          <h3
                            className="text-[30px] font-black tracking-tight leading-none mb-2.5 relative z-10"
                            style={{ color: isPremium ? "#ffffff" : "#0f172a" }}
                          >
                            {plan.planName}
                          </h3>

                          {/* Mô tả ngắn */}
                          <p
                            className="text-[13.5px] leading-relaxed font-semibold mb-8 relative z-10 min-h-[40px]"
                            style={{ color: isPremium ? "#94a3b8" : "#64748b" }}
                          >
                            {plan.description || "Giải pháp toàn diện giúp bứt phá giới hạn tư duy học tập."}
                          </p>

                          {/* KHUNG GIÁ (CTA TIỀN TỆ QUAN TRỌNG) */}
                          <div
                            className="mb-8 rounded-[24px] p-6 relative z-10 transition-all duration-300"
                            style={
                              isPremium
                                ? {
                                    background: "linear-gradient(135deg, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.08) 100%)",
                                    border: "1.5px solid rgba(249,115,22,0.35)",
                                    boxShadow: "inset 0 1px 2px rgba(255,255,255,0.05)",
                                  }
                                : isMiddle
                                ? {
                                    background: "linear-gradient(135deg, rgba(255,247,237,0.9) 0%, rgba(255,237,213,0.5) 100%)",
                                    border: "1.5px solid rgba(255,107,0,0.15)",
                                  }
                                : {
                                    background: "linear-gradient(135deg, rgba(248,250,252,0.9) 0%, rgba(241,245,249,0.5) 100%)",
                                    border: "1px solid rgba(226,232,240,0.8)",
                                  }
                            }
                          >
                            {isFree ? (
                              <>
                                <div className="flex items-baseline gap-1">
                                  <span
                                    className="text-4xl font-extrabold tracking-tight text-slate-800"
                                  >
                                    Miễn phí
                                  </span>
                                </div>
                                <p className="text-[11px] font-extrabold text-emerald-600 mt-2 flex items-center gap-1">
                                  <Zap size={11} className="fill-emerald-600" /> Không cần thẻ tín dụng
                                </p>
                              </>
                            ) : (
                              <>
                                <div className="flex items-baseline gap-1 flex-wrap">
                                  <span
                                    className="text-5xl font-black tracking-tight leading-none"
                                    style={
                                      isPremium
                                        ? { color: "#f97316", textShadow: "0 4px 20px rgba(249,115,22,0.2)" }
                                        : { color: "#ea580c" }
                                    }
                                  >
                                    {formatPlanPrice(plan.monthlyPrice, "").replace(/[VNDvndđĐ\s]/g, "")}
                                  </span>
                                  <span
                                    className="text-2xl font-black ml-1 relative -top-1"
                                    style={{ color: isPremium ? "#f97316" : "#ea580c" }}
                                  >
                                    đ
                                  </span>
                                  <span className={`text-[13px] font-bold ml-2 ${isPremium ? "text-slate-400" : "text-slate-500"}`}>
                                    / tháng
                                  </span>
                                </div>
                                <p
                                  className="text-[11px] font-bold mt-2"
                                  style={{ color: isPremium ? "#64748b" : "#64748b" }}
                                >
                                  Gia hạn hàng tháng • Hủy bất cứ lúc nào
                                </p>
                              </>
                            )}
                          </div>

                          {/* DANH SÁCH ĐẶC QUYỀN */}
                          <div className="flex-1 relative z-10 mb-8">
                            <div
                              className="text-[11px] font-black uppercase tracking-wider mb-5"
                              style={{ color: isPremium ? "#ff914d" : "#ea580c" }}
                            >
                              Đặc quyền có trong gói:
                            </div>
                            <ul className="space-y-4">
                              {(() => {
                                const resolved = resolvePlanFeatures(plan);
                                const rawFeatures =
                                  resolved && resolved.length > 0 ? resolved : plan.benefits || [];
                                return rawFeatures.map((f: any, i: number) => {
                                  const isString = typeof f === "string";
                                  const featureName = isString ? f : f.featureName || f.name;
                                  const enabled = isString ? true : f.enabled !== false;
                                  return (
                                    <li
                                      key={i}
                                      className="flex items-start gap-3 text-[13.5px] font-semibold"
                                      style={{
                                        color: enabled
                                          ? isPremium
                                            ? "#e2e8f0"
                                            : "#334155"
                                          : isPremium
                                          ? "#475569"
                                          : "#94a3b8",
                                        textDecoration: enabled ? "none" : "line-through",
                                      }}
                                    >
                                      {/* Icon checkmark hoặc tia chớp mới */}
                                      <div
                                        className="w-5.5 h-5.5 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                                        style={
                                          enabled
                                            ? isPremium
                                              ? {
                                                  background: "linear-gradient(135deg, #f97316, #ea580c)",
                                                  boxShadow: "0 4px 10px rgba(249,115,22,0.35)",
                                                  color: "#fff",
                                                }
                                              : {
                                                  background: "rgba(255,107,0,0.1)",
                                                  border: "1px solid rgba(255,107,0,0.2)",
                                                  color: "#ea580c",
                                                }
                                            : {
                                                background: "rgba(148,163,184,0.08)",
                                                color: "#94a3b8",
                                              }
                                        }
                                      >
                                        {enabled ? (
                                          <Zap size={11} className="fill-current" />
                                        ) : (
                                          <X size={10} />
                                        )}
                                      </div>
                                      <span className="leading-snug pt-0.5 text-left">
                                        {featureName}
                                      </span>
                                    </li>
                                  );
                                });
                              })()}
                            </ul>
                          </div>

                          {/* CTA BUTTON */}
                          <motion.button
                            whileHover={{ scale: 1.025 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handlePlanCTA(plan)}
                            className="relative z-10 w-full py-4.5 px-4 rounded-2xl font-black text-xs tracking-wider uppercase cursor-pointer flex items-center justify-center gap-2 group overflow-hidden transition-all duration-300"
                            style={
                              isPremium
                                ? {
                                    background:
                                      "linear-gradient(135deg, #f97316 0%, #ea580c 50%, #e65c00 100%)",
                                    color: "#ffffff",
                                    boxShadow:
                                      "0 20px 35px rgba(249,115,22,0.35), inset 0 1px 0 rgba(255,255,255,0.25)",
                                    border: "none",
                                  }
                                : isMiddle
                                ? {
                                    background: "#0f172a",
                                    color: "#ffffff",
                                    boxShadow: "0 10px 25px rgba(15,23,42,0.15)",
                                    border: "none",
                                  }
                                : {
                                    background: "rgba(255,255,255,0.8)",
                                    color: "#1e293b",
                                    border: "1.5px solid rgba(15,23,42,0.12)",
                                    boxShadow: "0 4px 10px rgba(15,23,42,0.03)",
                                  }
                            }
                          >
                            {isPremium && (
                              <motion.span
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-25deg]"
                                initial={{ x: "-150%" }}
                                whileHover={{ x: "200%" }}
                                transition={{ duration: 0.8, ease: "easeInOut" }}
                              />
                            )}
                            <span className="relative">
                              {isFree ? "Trải nghiệm miễn phí" : `KÍCH HOẠT ${plan.planName.toUpperCase()}`}
                            </span>
                            <ArrowUpRight
                              size={14}
                              className="relative transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                            />
                          </motion.button>
                        </div>
                      </TiltCard>
                    </motion.div>
                  );
                })}
              </div>
            )}

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center text-[12.5px] text-slate-400 font-semibold mt-12"
            >
              ✦ Giá đã bao gồm đầy đủ VAT · Hủy bất cứ khi nào · Tuyệt đối không chi phí ẩn
            </motion.p>
          </section>

          {/* ══════════════════════════════════════════
              FAQ SECTION (Vẫn giữ nguyên, nâng cấp icon)
              ══════════════════════════════════════════ */}
          <section className="max-w-5xl mx-auto px-4 mt-40 relative z-10">
            <div className="text-center mb-16">
              <div
                className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-full mb-4"
                style={{
                  background: "rgba(255,107,0,0.06)",
                  border: "1px solid rgba(255,107,0,0.15)",
                }}
              >
                <HelpCircle size={12} className="text-orange-500" />
                <span className="text-[10px] text-orange-700 font-black uppercase tracking-widest">
                  GIẢI ĐÁP THẮC MẮC
                </span>
              </div>
              <h2 className="text-3xl md:text-[40px] font-black text-slate-900 tracking-tight leading-tight">
                Giải đáp khúc mắc học tập.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-7 items-stretch">
              <div
                className="md:col-span-4 rounded-[32px] p-8 flex flex-col justify-between"
                style={{
                  background:
                    "linear-gradient(160deg, rgba(255,255,255,0.95) 0%, rgba(255,247,237,0.7) 100%)",
                  border: "1.5px solid rgba(255,107,0,0.15)",
                  boxShadow: "0 20px 45px rgba(255,107,0,0.05), inset 0 1px 0 rgba(255,255,255,1)",
                }}
              >
                <div>
                  <h4 className="font-black text-slate-900 text-[19px] mb-3">Vẫn cần sự hỗ trợ?</h4>
                  <p className="text-slate-500 text-xs leading-relaxed font-semibold">
                    Đội ngũ hỗ trợ và cố vấn chuyên môn của chúng tôi luôn sẵn sàng đồng hành cùng bạn thiết lập hệ thống học tập tối ưu nhất.
                  </p>
                </div>
                <Link to="/contact" className="mt-8 block">
                  <button
                    className="w-full py-4 font-black text-xs tracking-wider uppercase rounded-xl cursor-pointer transition-all duration-300"
                    style={{
                      background: "rgba(255,255,255,1)",
                      border: "1px solid rgba(226,232,240,1)",
                      color: "#1e293b",
                      boxShadow: "0 4px 12px rgba(15,23,42,0.04)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,107,0,0.4)";
                      (e.currentTarget as HTMLButtonElement).style.color = "#ea580c";
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 16px rgba(255,107,0,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(226,232,240,1)";
                      (e.currentTarget as HTMLButtonElement).style.color = "#1e293b";
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 12px rgba(15,23,42,0.04)";
                    }}
                  >
                    Gặp chuyên viên trực tiếp
                  </button>
                </Link>
              </div>

              {/* FAQ Accordion */}
              <div
                className="md:col-span-8 rounded-[32px] p-6 md:p-8 space-y-3"
                style={{
                  background: "rgba(255,255,255,0.92)",
                  border: "1px solid rgba(226,232,240,0.8)",
                  boxShadow: "0 20px 50px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,1)",
                  backdropFilter: "blur(12px)",
                }}
              >
                {[
                  {
                    q: "Nếu Syllabus của trường tôi quá phức tạp thì AI có đọc được không?",
                    a: "Mô hình lõi của SkillSprint tích hợp cơ chế bóc tách lớp sâu (Deep Parsing), có khả năng đọc và chuẩn hóa mọi sơ đồ phức tạp, bảng điểm hoặc biểu đồ học trình từ tệp ảnh/PDF đa ngôn ngữ lập tức.",
                  },
                  {
                    q: "Nếu tôi bận rộn và trễ deadline, lộ trình có tự điều chỉnh không?",
                    a: "Hoàn toàn tự động. Thuật toán thích ứng liên tục theo thời gian thực sẽ tự căn chỉnh lại khối lượng kiến thức còn tồn đọng và giãn cách lịch học một cách khoa học để loại bỏ áp lực tâm lý.",
                  },
                  {
                    q: "Tôi có thể hủy gói Premium sau khi đã thi xong không?",
                    a: "Tất nhiên. Việc quản lý gói hoàn toàn minh bạch ngay trong phần cài đặt tài khoản. Bạn có thể chấm dứt gia hạn bất cứ lúc nào và hệ thống vẫn duy trì quyền lợi cho tới ngày cuối chu kỳ.",
                  },
                ].map((item, idx) => {
                  const isOpen = activeFaq === idx;
                  return (
                    <div
                      key={idx}
                      className="rounded-2xl overflow-hidden transition-all duration-300"
                      style={{
                        border: isOpen
                          ? "1.5px solid rgba(255,107,0,0.3)"
                          : "1px solid rgba(226,232,240,0.7)",
                        background: isOpen ? "rgba(255,247,237,0.35)" : "transparent",
                      }}
                    >
                      <button
                        onClick={() => setActiveFaq(isOpen ? null : idx)}
                        className="w-full flex justify-between items-center p-5 text-[14.5px] text-left border-none bg-transparent cursor-pointer select-none"
                      >
                        <span
                          className="font-black transition-colors"
                          style={{ color: isOpen ? "#ea580c" : "#0f172a" }}
                        >
                          {item.q}
                        </span>
                        <div
                          className="w-6.5 h-6.5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300"
                          style={
                            isOpen
                              ? {
                                  background: "linear-gradient(135deg, #f97316, #ea580c)",
                                  color: "#fff",
                                  transform: "rotate(45deg)",
                                }
                              : {
                                  background: "rgba(241,245,249,0.9)",
                                  color: "#94a3b8",
                                }
                          }
                        >
                          <Plus size={12} strokeWidth={3.5} />
                        </div>
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                           <motion.div
                             initial={{ height: 0, opacity: 0 }}
                             animate={{ height: "auto", opacity: 1 }}
                             exit={{ height: 0, opacity: 0 }}
                             transition={{ duration: 0.22, ease: "easeOut" }}
                           >
                             <div className="px-5 pb-5 text-[13.5px] text-slate-500 leading-relaxed border-t border-orange-100/50 pt-3 font-semibold">
                               {item.a}
                             </div>
                           </motion.div>
                         )}
                       </AnimatePresence>
                     </div>
                  );
                })}
              </div>
            </div>
          </section>
        </main>

        <PublicFooter />
      </div>

      {/* ══════════════════════════════════════════
          AUTH GATE MODAL (Nâng cấp với icon Zap mới)
          ══════════════════════════════════════════ */}
      <AnimatePresence>
        {authGateOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAuthGateOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(15,23,42,0.65)", backdropFilter: "blur(14px)" }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-sm w-full rounded-[36px] p-8 text-center"
              style={{
                background: "linear-gradient(160deg, #ffffff 0%, #fffaf5 100%)",
                border: "1.5px solid rgba(255,107,0,0.2)",
                boxShadow: "0 40px 80px rgba(15,23,42,0.3), 0 20px 40px rgba(0,0,0,0.15)",
              }}
            >
              <button
                type="button"
                onClick={() => setAuthGateOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer border-none"
                style={{ background: "rgba(241,245,249,0.9)" }}
              >
                <X size={14} className="text-slate-400" />
              </button>

              {/* Thay Sparkles thành Zap */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white"
                style={{
                  background: "linear-gradient(135deg, #f97316, #ea580c)",
                  boxShadow: "0 12px 28px rgba(249,115,22,0.4)",
                }}
              >
                <Zap size={24} className="fill-white animate-pulse" />
              </div>

              <h3 className="font-black text-xl text-slate-900 tracking-tight mb-2">
                Bắt đầu hành trình của bạn
              </h3>
              <p className="text-slate-500 text-xs leading-relaxed font-bold mb-6 px-2">
                Bạn cần đăng nhập để kích hoạt gói{" "}
                <span className="font-black text-orange-600">{pendingAuthPlan?.name}</span>.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    if (pendingAuthPlan) sessionStorage.setItem("pendingPlan", pendingAuthPlan.id);
                    navigate("/login?mode=register");
                  }}
                  className="w-full py-4.5 rounded-xl text-white font-black text-xs tracking-wider uppercase cursor-pointer border-none transition-all duration-200"
                  style={{
                    background: "linear-gradient(135deg, #f97316, #ea580c)",
                    boxShadow: "0 8px 20px rgba(249,115,22,0.35)",
                  }}
                >
                  Đăng ký tài khoản mới
                </button>
                <button
                  onClick={() => {
                    if (pendingAuthPlan) sessionStorage.setItem("pendingPlan", pendingAuthPlan.id);
                    navigate("/login?mode=login");
                  }}
                  className="w-full py-4.5 rounded-xl font-black text-xs tracking-wider uppercase cursor-pointer transition-all duration-200"
                  style={{
                    background: "rgba(248,250,252,0.95)",
                    border: "1.5px solid rgba(226,232,240,1)",
                    color: "#334155",
                  }}
                >
                  Đăng nhập hệ thống
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

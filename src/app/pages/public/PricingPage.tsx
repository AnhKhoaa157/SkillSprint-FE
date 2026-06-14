import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";
import { Link } from "react-router";
import {
  Check, X, Sparkles, HelpCircle, Plus, LogIn, UserPlus,
  Crown, Zap, Flame, ShieldAlert, Star, Rocket, Gem, Award, BadgeCheck,
  type LucideIcon,
} from "lucide-react";
import { Footer as PublicFooter } from "../components/Footer";
import { PublicNavbar } from "../components/PublicNavbar";
import CursorSpotlight from "../components/CursorSpotlight";
import { useAuth } from "../../contexts/AuthContext";
import { listSubscriptionPlans, STATIC_FALLBACK_PLANS, formatPlanPrice, isFeatureEnabled, type PublicPlanResponse } from "../../../api/adminSubscriptionPlansService";

// ─── Dynamic badge tokens (BE-driven via badgeColor / badgeIcon / animationType) ─
// Maps the lucide icon *name* the backend sends to the actual component. Unknown
// names simply resolve to `undefined`, so the badge degrades to text-only.
const BADGE_ICONS: Record<string, LucideIcon> = {
  Crown, Zap, Flame, Sparkles, ShieldAlert, Star, Rocket, Gem, Award, BadgeCheck,
};

// Default gradient when a plan is featured but the BE didn't supply a badgeColor.
const DEFAULT_BADGE_GRADIENT = "from-[#FF6B00] to-[#FF7E21] text-white shadow-orange-500/20";

/**
 * Translate the BE `animationType` into Tailwind utility classes. `shimmer` also
 * widens the gradient so the keyframe (background-position) has room to travel.
 */
function badgeAnimationClass(animationType?: string | null): string {
  switch ((animationType ?? "").trim().toLowerCase()) {
    case "shimmer": return "animate-shimmer bg-[length:200%_auto]";
    case "pulse":   return "animate-pulse";
    default:        return "";
  }
}

// ─── Skeleton card shown while loading ───────────────────────────────────────
function PlanCardSkeleton({ featured = false }: { featured?: boolean }) {
  return (
    <div
      className={`animate-pulse bg-white rounded-3xl p-8 md:p-10 flex flex-col gap-4 h-full ${
        featured ? "border-2 border-orange-200 shadow-[0_20px_50px_rgba(255,107,0,0.08)]" : "border border-slate-200 shadow-sm"
      }`}
    >
      <div className="h-7 bg-slate-100 rounded-lg w-36" />
      <div className="h-4 bg-slate-100 rounded w-3/4" />
      <div className="mt-4 h-14 bg-slate-100 rounded-xl" />
      <div className="h-12 bg-slate-100 rounded-xl" />
      <div className="border-t border-slate-100 pt-4 mt-2 flex flex-col gap-3">
        {[75, 90, 65, 80, 70].map((w, i) => (
          <div key={i} className="h-4 bg-slate-100 rounded" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const [pendingAuthPlan, setPendingAuthPlan] = useState<{ id: string; name: string } | null>(null);

  const [plans, setPlans] = useState<PublicPlanResponse[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Public page: the plans endpoint requires auth, so guests (401) — or any
  // transient failure — gracefully fall back to STATIC_FALLBACK_PLANS instead of
  // showing an empty page. The skeleton still shows on first mount until either
  // real data or the fallback replaces it.
  useEffect(() => {
    let cancelled = false;
    setLoadingPlans(true);
    listSubscriptionPlans()
      .then(data => { if (!cancelled) setPlans(data.length > 0 ? data : STATIC_FALLBACK_PLANS); })
      .catch(() => { if (!cancelled) setPlans(STATIC_FALLBACK_PLANS); })
      .finally(() => { if (!cancelled) setLoadingPlans(false); });
    return () => { cancelled = true; };
  }, []);

  const handlePlanCTA = (plan: PublicPlanResponse) => {
    if (isAuthenticated) {
      navigate(`/app?pricing=${plan.planId}&period=${isAnnual ? "annual" : "monthly"}`);
      return;
    }
    setPendingAuthPlan({ id: plan.planId, name: plan.planName });
    setAuthGateOpen(true);
  };

  const handleAuthGateNavigate = (mode: "login" | "register") => {
    if (pendingAuthPlan) sessionStorage.setItem("pendingPlan", pendingAuthPlan.id);
    setAuthGateOpen(false);
    navigate(`/login?mode=${mode}`);
  };

  // Annual billing applies a 25% discount to the monthly price.
  function getEffectivePrice(plan: PublicPlanResponse) {
    return isAnnual ? Math.round(plan.monthlyPrice * 0.75) : plan.monthlyPrice;
  }

  // ─── Dynamic plan cards (plans is never empty post-load: real data or fallback) ─
  // One unified renderer; the highest-priced paid plan (last) is the featured one.
  // Each card is flex-col h-full with a flex-1 upper section so every CTA button
  // lands on the same horizontal baseline regardless of feature-list length.
  const gridColsClass =
    plans.length >= 3 ? "md:grid-cols-3 max-w-5xl" : plans.length === 2 ? "md:grid-cols-2 max-w-4xl" : "max-w-sm";

  const planCards = (
    <div className={`mx-auto grid grid-cols-1 ${gridColsClass} gap-6 items-stretch justify-center`}>
      {plans?.map((plan, idx) => {
        const isFree = plan.monthlyPrice <= 0;
        const isFeatured = !isFree && idx === plans.length - 1 && plans.length > 1;
        const price = getEffectivePrice(plan);

        // Dynamic badge: render whenever the BE styles the plan, or when it's the
        // featured tier (which falls back to the default orange gradient).
        const BadgeIcon = plan.badgeIcon ? BADGE_ICONS[plan.badgeIcon] : undefined;
        const showBadge = Boolean(plan.badgeColor || plan.badgeIcon) || isFeatured;
        const badgeGradient = plan.badgeColor?.trim() || DEFAULT_BADGE_GRADIENT;
        const badgeAnim = badgeAnimationClass(plan.animationType);

        return (
          <div key={plan.planId} className="relative h-full flex">
            {isFeatured && (
              <div className="absolute inset-[-8px] bg-[radial-gradient(circle,_rgba(255,107,0,0.1)_0%,transparent_70%)] filter blur-2xl rounded-[40px] pointer-events-none z-0" />
            )}
            <CursorSpotlight
              className="relative z-10 h-full w-full flex"
              color={isFeatured ? "rgba(255,107,0,0.12)" : "rgba(14,165,233,0.08)"}
              size={isFeatured ? 240 : 220}
            >
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className={`relative w-full bg-white rounded-3xl p-8 md:p-10 flex flex-col h-full justify-between ${
                  isFeatured
                    ? "border-2 border-[#FF6B00] shadow-[0_20px_50px_rgba(255,107,0,0.12)]"
                    : "border border-slate-200 shadow-[0_10px_35px_rgba(0,0,0,0.06)]"
                }`}
              >
                {showBadge && (
                  <div
                    className={`absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 inline-flex items-center gap-1.5 bg-gradient-to-r ${badgeGradient} ${badgeAnim} px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase shadow-md border border-white/20 whitespace-nowrap`}
                  >
                    {BadgeIcon ? <BadgeIcon size={12} className="stroke-[2.5]" /> : "🔥"}
                    ĐƯỢC KHUYÊN DÙNG
                  </div>
                )}

                {/* Upper section — grows to fill, pushing the CTA button to the bottom */}
                <div className="flex-1 flex flex-col">
                  <h3 className={`text-2xl font-extrabold text-slate-900 tracking-tight ${isFeatured ? "mt-2" : ""}`}>
                    {plan.planName}
                  </h3>
                  <p className="text-slate-500 text-sm mt-2 leading-relaxed min-h-[40px]">
                    {plan.description ?? "Lựa chọn phù hợp với nhu cầu học tập của bạn."}
                  </p>

                  {/* Price block — "Miễn phí" for free, else "89.000 đ/tháng" */}
                  <div className="mt-8 mb-8 flex items-baseline gap-1.5 text-slate-900">
                    <span className={`font-black text-5xl tracking-tight leading-none ${isFeatured ? "text-[#FF6B00]" : ""}`}>
                      {formatPlanPrice(price, plan.currency)}
                    </span>
                    {!isFree && <span className="text-sm font-medium text-slate-400">/tháng</span>}
                  </div>

                  {/* Features — dynamic from plan.features (featureName + enabled) */}
                  <div className="border-t border-slate-100 pt-6 flex-1">
                    <div className={`text-xs font-black tracking-wider uppercase mb-4 ${isFeatured ? "text-[#FF6B00]" : "text-slate-400"}`}>
                      Bao gồm:
                    </div>
                    <ul className="space-y-4">
                      {(plan.features ?? []).map(f => {
                        const enabled = isFeatureEnabled(f);
                        return (
                          <li key={f.featureKey} className={`flex items-start gap-3 text-sm font-medium ${enabled ? "text-slate-700" : "text-slate-300 line-through"}`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${enabled ? (isFeatured ? "bg-orange-50/50 text-[#FF6B00]" : "bg-blue-50 text-blue-500") : "bg-slate-50 text-slate-300"}`}>
                              {enabled ? <Check size={13} className="stroke-[3]" /> : <X size={12} />}
                            </div>
                            <span className="leading-relaxed">{f.featureName}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>

                {/* CTA — pinned to the bottom, aligned across all cards */}
                <motion.button
                  whileHover={isFeatured ? { scale: 1.015, boxShadow: "0 10px 25px rgba(255,107,0,0.3)" } : { scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => handlePlanCTA(plan)}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all cursor-pointer mt-8 ${
                    isFeatured
                      ? "bg-[#FF6B00] hover:bg-[#E05E00] text-white shadow-[0_4px_15px_rgba(255,107,0,0.2)]"
                      : "bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700"
                  }`}
                >
                  {isFree ? "Bắt đầu miễn phí" : isFeatured ? `Nâng cấp lên ${plan.planName}` : "Bắt đầu ngay"}
                </motion.button>
              </motion.div>
            </CursorSpotlight>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="bg-[#FAFAFA] min-h-screen relative overflow-x-hidden selection:bg-orange-500/10 selection:text-[#FF6B00]" style={{ fontFamily: "'Plus Jakarta Sans', Inter, sans-serif" }}>
      {/* Background Grid Layer */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,transparent_0%,#FAFAFA_75%)] pointer-events-none z-0" />

      <div className="relative z-10">
        <PublicNavbar />

        <main className="pt-36 pb-28">

          {/* HEADER SECTION */}
          <section className="text-center px-4 mb-12">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 leading-[1.1] mb-5"
            >
              Đầu tư cho <span className="bg-gradient-to-r from-[#FF6B00] to-[#FF3B00] bg-clip-text text-transparent">tương lai</span> của bạn.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-slate-500 text-lg md:text-xl max-w-xl mx-auto font-medium"
            >
              Chọn gói phù hợp nhất với nhu cầu học tập của bạn. Hủy bất cứ lúc nào.
            </motion.p>
          </section>

          {/* TOGGLE BILLING PERIOD SWITCH */}
          <section className="flex justify-center mb-16 px-4">
            <div className="relative inline-flex bg-slate-100 rounded-full p-1 border border-slate-200/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
              {/* Discount Badge */}
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-7 right-2 bg-[#10B981] text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-[0_4px_12px_rgba(16,185,129,0.25)] z-20"
              >
                TIẾT KIỆM 25%
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rotate-45 w-1.5 h-1.5 bg-[#10B981]" />
              </motion.div>

              <button
                type="button"
                onClick={() => setIsAnnual(false)}
                className={`relative z-10 px-6 py-2.5 rounded-full font-bold text-sm transition-colors cursor-pointer ${!isAnnual ? "text-slate-900" : "text-slate-500 hover:text-slate-800"}`}
              >
                Trả theo tháng
              </button>
              <button
                type="button"
                onClick={() => setIsAnnual(true)}
                className={`relative z-10 px-6 py-2.5 rounded-full font-bold text-sm transition-colors cursor-pointer ${isAnnual ? "text-slate-900" : "text-slate-500 hover:text-slate-800"}`}
              >
                Trả theo năm
              </button>

              {/* Sliding Pill Indicator */}
              <motion.div
                layout
                transition={{ type: "spring", stiffness: 350, damping: 26 }}
                className="absolute top-1 bottom-1 left-1 bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] z-0"
                style={{ width: "calc(50% - 4px)", x: isAnnual ? "100%" : "0%" }}
              />
            </div>
          </section>

          {/* PRICING CARDS SECTION */}
          <section className="px-4 mb-24">
            {loadingPlans ? (
              <div className="mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch justify-center">
                <PlanCardSkeleton />
                <PlanCardSkeleton />
                <PlanCardSkeleton featured />
              </div>
            ) : (
              planCards
            )}
          </section>

          {/* HIGH-END ACCORDION FAQ SECTION */}
          <section className="py-24 px-4 bg-gradient-to-b from-[#FAFAFA] to-slate-100 border-t border-slate-200">
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 items-start">

              {/* FAQ Left Column */}
              <div className="md:col-span-5 md:sticky md:top-28">
                <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full mb-5">
                  <HelpCircle size={13} className="text-purple-600" />
                  <span className="text-xs text-purple-600 font-bold uppercase tracking-wider">Hỗ trợ & Giải đáp</span>
                </div>

                <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-[1.15] mb-4">
                  Câu hỏi <br />
                  <span className="bg-gradient-to-r from-[#FF6B00] to-[#FF3B00] bg-clip-text text-transparent">thường gặp.</span>
                </h2>

                <p className="text-slate-500 text-base leading-relaxed mb-8 max-w-sm">
                  Mọi thắc mắc của bạn về tính năng học tập và thanh toán dịch vụ đều được giải đáp nhanh chóng tại đây.
                </p>

                {/* Embedded Contact Support Widget */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 relative overflow-hidden shadow-sm">
                  <div className="absolute -top-12 -right-12 w-28 h-28 bg-[radial-gradient(circle,rgba(255,107,0,0.06)_0%,transparent_70%)] rounded-full" />
                  <h4 className="font-extrabold text-slate-900 text-sm mb-1.5">Vẫn còn câu hỏi khác?</h4>
                  <p className="text-slate-500 text-xs leading-relaxed mb-4">Liên hệ ngay với bộ phận hỗ trợ học tập của chúng tôi để được tư vấn trực tiếp 24/7.</p>
                  <Link to="/contact">
                    <motion.button
                      whileHover={{ scale: 1.02, background: "#FF6B00", color: "#fff", borderColor: "#FF6B00" }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 py-2 border border-slate-200 bg-transparent text-slate-800 font-bold text-xs rounded-xl cursor-pointer transition-all"
                    >
                      Kết nối với chúng tôi
                    </motion.button>
                  </Link>
                </div>
              </div>

              {/* FAQ Right Column (Accordion Lists) */}
              <div className="md:col-span-7 space-y-4">
                {[
                  {
                    q: "Nếu Syllabus của trường tôi quá phức tạp thì AI có đọc được không?",
                    a: "AI của SkillSprint bóc tách chính xác mọi đề cương phức tạp, hỗ trợ từ file PDF, ảnh chụp giáo trình đến tài liệu đa ngôn ngữ."
                  },
                  {
                    q: "Nếu tôi bận rộn và trễ deadline, lộ trình có tự điều chỉnh không?",
                    a: "Có. Với lộ trình động (Dynamic Roadmap), hệ thống sẽ tự động tối ưu và phân bổ lại lượng kiến thức khi bạn lỡ lịch học."
                  },
                  {
                    q: "Tôi có thể hủy gói Premium sau khi đã thi xong không?",
                    a: "Hoàn toàn được. Bạn có thể chủ động hủy gói bất kỳ lúc nào ngay trong Cài đặt tài khoản. Hệ thống không hỗ trợ hạ cấp gói khi đang trong chu kỳ thanh toán."
                  }
                ].map((faq, i) => {
                  const isOpen = activeFaq === i;
                  return (
                    <motion.div
                      key={i}
                      layout
                      className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden relative ${isOpen ? "border-orange-500/30 shadow-[0_12px_30px_rgba(255,107,0,0.05)]" : "border-slate-200 shadow-sm"}`}
                    >
                      {/* Active Left Indicator Strip */}
                      <div className={`absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-[#FF6B00] to-[#FF3B00] transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`} />

                      {/* Header Anchor */}
                      <div
                        onClick={() => setActiveFaq(isOpen ? null : i)}
                        className="flex justify-between items-center p-6 cursor-pointer user-select-none"
                      >
                        <h4 className={`font-bold text-base transition-colors duration-200 pr-4 leading-snug ${isOpen ? "text-[#FF6B00]" : "text-slate-800"}`}>
                          {faq.q}
                        </h4>

                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${isOpen ? "bg-orange-50 rotate-135" : "bg-slate-100"}`}>
                          <Plus size={16} className={isOpen ? "text-[#FF6B00]" : "text-slate-500"} />
                        </div>
                      </div>

                      {/* Expanding Content Block */}
                      <motion.div
                        initial={false}
                        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-5 text-sm text-slate-500 leading-relaxed border-t border-slate-50 pt-4">
                          {faq.a}
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>

            </div>
          </section>

        </main>

        <PublicFooter />
      </div>

      {/* GUEST INTERCEPT AUTH-GATE MODAL */}
      <AnimatePresence>
        {authGateOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAuthGateOpen(false)}
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center relative"
            >
              {/* Close Handle */}
              <button
                type="button"
                onClick={() => setAuthGateOpen(false)}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors border-none cursor-pointer"
              >
                <X size={14} className="text-slate-500" />
              </button>

              {/* Glowing Icon Container */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF6B00] to-[#FF3B00] flex items-center justify-center mx-auto mb-5 shadow-[0_8px_20px_rgba(255,107,0,0.3)]">
                <Sparkles size={22} className="text-white" />
              </div>

              <h3 className="font-extrabold text-lg text-slate-900 tracking-tight mb-2">
                Bạn cần đăng nhập để tiếp tục
              </h3>
              <p className="text-slate-500 text-xs leading-relaxed mb-6 px-2">
                Tạo tài khoản miễn phí hoặc đăng nhập để mở khoá gói{" "}
                <span className="font-black text-[#FF6B00]">
                  {pendingAuthPlan?.name ?? "Premium"}
                </span>{" "}
                và bắt đầu hành trình học tập bứt phá.
              </p>

              <div className="flex flex-col gap-2.5">
                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => handleAuthGateNavigate("register")}
                  className="w-full py-3 rounded-xl bg-[#FF6B00] border-none text-white font-bold text-sm cursor-pointer flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(255,107,0,0.25)]"
                >
                  <UserPlus size={15} /> Đăng ký miễn phí
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => handleAuthGateNavigate("login")}
                  className="w-full py-3 rounded-xl bg-transparent border border-slate-200 text-slate-800 font-bold text-sm cursor-pointer flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                >
                  <LogIn size={15} /> Đăng nhập
                </motion.button>
              </div>

              <p className="text-[10px] text-slate-400 mt-4 font-medium">
                Không cần thẻ tín dụng để tạo tài khoản.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

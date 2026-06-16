import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";
import { Link } from "react-router";
import {
  X, Sparkles, HelpCircle, Plus, Check,
  Crown, Layers3, Shield, ArrowUpRight
} from "lucide-react";
import { Footer as PublicFooter } from "../components/Footer";
import { PublicNavbar } from "../components/PublicNavbar";
import { useAuth } from "../../contexts/AuthContext";
import { listSubscriptionPlans, STATIC_FALLBACK_PLANS, formatPlanPrice, resolvePlanFeatures, type PublicPlanResponse } from "../../../api/adminSubscriptionPlansService";

export default function UltraPremiumPricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
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
      .then(data => { if (isMounted) setPlans(data.length > 0 ? data : STATIC_FALLBACK_PLANS); })
      .catch(() => { if (isMounted) setPlans(STATIC_FALLBACK_PLANS); })
      .finally(() => { if (isMounted) setLoadingPlans(false); });
    return () => { isMounted = false; };
  }, []);

  const handlePlanCTA = (plan: PublicPlanResponse) => {
    if (isAuthenticated) {
      navigate(`/app?pricing=${plan.planId}&period=${billingPeriod}`);
      return;
    }
    setPendingAuthPlan({ id: plan.planId, name: plan.planName });
    setAuthGateOpen(true);
  };

  return (
    <div className="bg-[#FAFAFA] min-h-screen relative overflow-x-hidden antialiased selection:bg-orange-500/20 selection:text-orange-600 text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', Inter, sans-serif" }}>
      
      {/* 🔮 Hệ lưới nền ma trận */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,107,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,107,0,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,transparent_0%,#FAFAFA_70%)] pointer-events-none z-0" />
      <div className="absolute top-[600px] left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-r from-orange-400/[0.06] to-amber-400/[0.04] blur-[140px] rounded-full pointer-events-none z-0" />

      <div className="relative z-10">
        <PublicNavbar />

        <main className="pt-36 pb-32">
          {/* ================= HERO SECTION ================= */}
          <section className="px-4 max-w-5xl mx-auto text-center mb-24 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-widest text-orange-600 mb-6 shadow-[0_4px_12px_rgba(234,88,12,0.05)]"
            >
              <Sparkles size={12} className="text-orange-500 animate-spin" style={{ animationDuration: '4s' }} />
              Báo giá đặc quyền công nghệ mã hóa lộ trình
            </motion.div>

            <h1 className="text-4xl sm:text-5xl md:text-[64px] font-black tracking-tight text-slate-900 leading-[1.08] mb-6">
              Đầu tư thông minh. <br />
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 bg-clip-text text-transparent">
                  Làm chủ lộ trình tương lai.
                </span>
                <span className="absolute -bottom-2 left-0 w-full h-[6px] bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-transparent rounded-full" />
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-400 leading-relaxed font-semibold mt-4">
              Kích hoạt đặc quyền xử lý tri thức chuyên sâu từ hệ thống AI thông minh bậc nhất. Chọn lộ trình của bạn — Tăng tốc tiến độ, cam kết hiệu quả thực chất vượt trội.
            </p>

            {/* 🔄 Bộ chuyển đổi kỳ hạn */}
            <div className="mt-12 inline-flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-[0_16px_32px_rgba(15,23,42,0.04)]">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`px-6 py-3 text-xs font-black rounded-xl transition-all duration-300 cursor-pointer ${
                  billingPeriod === "monthly" 
                    ? "bg-slate-900 text-white shadow-md shadow-slate-950/20" 
                    : "text-slate-400 hover:text-slate-800"
                }`}
              >
                Thanh toán hàng tháng
              </button>
              <button
                onClick={() => setBillingPeriod("yearly")}
                className={`relative px-6 py-3 text-xs font-black rounded-xl transition-all duration-300 cursor-pointer flex items-center gap-2 ${
                  billingPeriod === "yearly" 
                    ? "bg-slate-900 text-white shadow-md shadow-slate-950/20" 
                    : "text-slate-400 hover:text-slate-800"
                }`}
              >
                Thanh toán theo năm
                <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[9px] px-2 py-0.5 rounded-md font-black tracking-wider uppercase">
                  -20%
                </span>
              </button>
            </div>
          </section>

          {/* ================= PRICING CARDS ================= */}
          <section className="max-w-6xl mx-auto px-4 mt-4 relative z-10">
            {loadingPlans ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center justify-center">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-[32px] p-10 h-[580px] border border-slate-100 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6 items-stretch justify-center">
                {plans.map((plan, idx) => {
                  const isFree = plan.monthlyPrice <= 0;
                  const isPremium = !isFree && idx === plans.length - 1 && plans.length > 1;
                  
                  let displayPrice = plan.monthlyPrice;
                  let originalPrice = plan.monthlyPrice;
                  if (billingPeriod === "yearly" && !isFree) {
                    displayPrice = Math.round((plan.monthlyPrice * 12 * 0.8) / 12);
                  }

                  return (
                    <motion.div
                      key={plan.planId}
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: idx * 0.1 }}
                      whileHover={{ y: isPremium ? -12 : -6 }}
                      className={`relative rounded-[38px] flex flex-col justify-between transition-all duration-500 ${
                        isPremium 
                          ? "bg-[#0B0F19] text-white p-9 lg:p-11 shadow-[0_40px_90px_-15px_rgba(234,88,12,0.35)] border border-slate-800 lg:-translate-y-4 z-20" 
                          : "bg-white p-8 lg:p-9 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.06)] border border-slate-200/70 z-10"
                      }`}
                    >
                      {isPremium && (
                        <>
                          <div className="absolute top-0 right-12 w-32 h-32 bg-gradient-to-b from-orange-500/20 to-transparent blur-2xl rounded-full pointer-events-none" />
                          <div className="absolute -inset-px bg-gradient-to-b from-orange-500/40 via-transparent to-slate-800/20 rounded-[38px] pointer-events-none z-0" />
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 text-white text-[10px] font-black tracking-widest uppercase px-6 py-2.5 rounded-full shadow-[0_8px_24px_rgba(234,88,12,0.4)] border border-white/20 whitespace-nowrap flex items-center gap-1.5 z-30 animate-pulse">
                            <Crown size={12} />
                            KHUYÊN DÙNG NHẤT
                          </div>
                        </>
                      )}

                      <div className="relative z-10">
                        {/* Card Header */}
                        <div className="flex justify-between items-start gap-4 mb-6">
                          <div>
                            <span className={`text-[9px] font-black tracking-widest uppercase px-3 py-1 rounded-full ${
                              isPremium ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" : "bg-slate-100 text-slate-500"
                            }`}>
                              {isFree ? "Starter" : isPremium ? "Ultimate Power" : "Pro Core"}
                            </span>
                            <h3 className={`text-3xl font-black mt-4 tracking-tight ${isPremium ? "text-white" : "text-slate-900"}`}>
                              {plan.planName}
                            </h3>
                          </div>
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                            isPremium ? "bg-orange-50 text-orange-600" : "bg-slate-50 text-slate-400 border border-slate-100"
                          }`}>
                            {isFree ? <Layers3 size={24} /> : isPremium ? <Crown size={24} /> : <Shield size={24} />}
                          </div>
                        </div>

                        <p className="text-xs leading-relaxed font-medium mb-8 text-slate-400">
                          {plan.description || "Lựa chọn toàn diện giúp bứt phá hoàn toàn giới hạn tư duy học tập học thuật."}
                        </p>

                        {/* 💰 KHU VỰC HIỂN THỊ GIÁ (ĐÃ ĐƯỢC FIX LỖI XUỐNG DÒNG VÀ CHE CHỮ) */}
                        <div className={`mb-8 p-5 rounded-2xl border flex flex-col justify-center relative overflow-visible ${
                          isPremium ? "bg-slate-900/60 border-slate-800" : "bg-slate-50/70 border-slate-100"
                        }`}>
                          {isFree ? (
                            <div className="flex items-baseline whitespace-nowrap">
                              <span className={`text-3xl xl:text-4xl font-black tracking-tight ${isPremium ? "text-white" : "text-slate-900"}`}>
                                Miễn phí
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-baseline flex-wrap gap-x-0.5 whitespace-nowrap overflow-visible">
                              {/* Chỉ bóc tách lấy chữ số tinh khiết, loại bỏ hoàn toàn các ký tự gây xuống hàng tự động */}
                              <span className={`text-3xl xl:text-4xl font-black tracking-tight ${isPremium ? "text-white" : "text-slate-900"}`}>
                                {formatPlanPrice(displayPrice, "").replace(/[VNDvndđĐ\s]/g, "")}
                              </span>
                              {/* Đưa ký hiệu đ lên cùng hàng một cách cố định */}
                              <span className={`text-base xl:text-lg font-black ml-0.5 relative -top-0.5 ${isPremium ? "text-orange-400" : "text-slate-900"}`}>
                                đ
                              </span>
                              {/* Phần kỳ hạn luôn bám đuôi chuẩn xác mà không bị đẩy tràn viền */}
                              <span className="text-xs font-bold text-slate-400 ml-1.5">
                                / tháng
                              </span>
                            </div>
                          )}
                          
                          {billingPeriod === "yearly" && !isFree && (
                            <p className="text-[11px] font-semibold text-slate-500 mt-1 line-through">
                              Gốc: {formatPlanPrice(originalPrice, "").replace(/[VNDvndđĐ\s]/g, "")}đ
                            </p>
                          )}

                          {isFree && (
                            <p className="text-[11px] font-black text-emerald-500 mt-1 flex items-center gap-1">
                              ✦ Miễn phí hoàn toàn • Không cần điền thẻ
                            </p>
                          )}
                        </div>

                        {/* Đặc quyền cấu hình hệ thống */}
                        <div className="space-y-4 mb-8">
                          <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isPremium ? "text-orange-400" : "text-slate-400"}`}>
                            Đặc quyền cấu hình hệ thống:
                          </div>
                          <ul className="space-y-3.5">
                            {(() => {
                              const resolved = resolvePlanFeatures(plan);
                              const rawFeatures = (resolved && resolved.length > 0) ? resolved : (plan.benefits || []);
                              return rawFeatures.map((f: any, i: number) => {
                                const isString = typeof f === "string";
                                const featureName = isString ? f : (f.featureName || f.name);
                                const enabled = isString ? true : f.enabled !== false;

                                return (
                                  <li key={i} className={`flex items-start gap-3.5 text-[13px] font-semibold transition-colors ${
                                    enabled 
                                      ? isPremium ? "text-slate-200" : "text-slate-700" 
                                      : isPremium ? "text-slate-600 line-through" : "text-slate-300 line-through"
                                  }`}>
                                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 shadow-sm transition-all ${
                                      enabled 
                                        ? isPremium ? "bg-orange-500 text-white" : "bg-orange-50 text-orange-600 border border-orange-100"
                                        : isPremium ? "bg-slate-900 text-slate-700" : "bg-slate-50 text-slate-300"
                                    }`}>
                                      {enabled ? <Check size={11} className="stroke-[3.5]" /> : <X size={10} />}
                                    </div>
                                    <span className="leading-tight text-left pt-0.5">{featureName}</span>
                                  </li>
                                );
                              });
                            })()}
                          </ul>
                        </div>
                      </div>

                      {/* CTA Button */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handlePlanCTA(plan)}
                        className={`w-full py-4.5 px-4 rounded-2xl font-black text-xs tracking-widest uppercase transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 group relative overflow-hidden ${
                          isPremium
                            ? "bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 text-white shadow-[0_20px_40px_rgba(234,88,12,0.3)]"
                            : "bg-slate-900 hover:bg-slate-800 text-white shadow-md shadow-slate-900/10"
                        }`}
                      >
                        {isPremium && (
                          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" style={{ transform: 'skewX(-20deg)' }} />
                        )}
                        <span>{isFree ? "Trải nghiệm miễn phí" : `Kích hoạt ${plan.planName}`}</span>
                        <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </motion.button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ================= FAQ SECTION ================= */}
          <section className="max-w-5xl mx-auto px-4 mt-44 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-100 px-3 py-1 rounded-full mb-3 shadow-sm">
                <HelpCircle size={12} className="text-orange-500" />
                <span className="text-[10px] text-orange-700 font-black uppercase tracking-wider">Hệ thống trợ giúp chuyên gia</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                Giải đáp khúc mắc học tập.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
              <div className="md:col-span-4 bg-gradient-to-b from-white to-orange-50/20 border border-slate-200/80 rounded-[32px] p-6 md:p-8 flex flex-col justify-between shadow-sm">
                <div>
                  <h4 className="font-black text-slate-900 text-lg mb-2">Vẫn cần sự hỗ trợ?</h4>
                  <p className="text-slate-400 text-xs leading-relaxed font-semibold">Đội ngũ kỹ sư giải pháp giáo dục của chúng tôi luôn trực tuyến để cấu hình hệ thống riêng cho bạn.</p>
                </div>
                <Link to="/contact" className="mt-8">
                  <button className="w-full py-3.5 bg-white border border-slate-200 hover:border-orange-500/30 hover:bg-orange-50/20 text-slate-800 hover:text-orange-600 font-black text-xs rounded-xl cursor-pointer transition-all duration-300 shadow-sm">
                    Gặp chuyên viên trực tiếp
                  </button>
                </Link>
              </div>

              <div className="md:col-span-8 bg-white border border-slate-200/80 rounded-[32px] p-5 md:p-7 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.03)] space-y-3">
                {[
                  {
                    q: "Nếu Syllabus của trường tôi quá phức tạp thì AI có đọc được không?",
                    a: "Mô hình lõi của SkillSprint tích hợp cơ chế bóc tách lớp sâu (Deep Parsing), có khả năng đọc và chuẩn hóa mọi sơ đồ phức tạp, bảng điểm hoặc biểu đồ học trình từ tệp ảnh/PDF đa ngôn ngữ lập tức."
                  },
                  {
                    q: "Nếu tôi bận rộn và trễ deadline, lộ trình có tự điều chỉnh không?",
                    a: "Hoàn toàn tự động. Thuật toán thích ứng liên tục theo thời gian thực sẽ tự căn chỉnh lại khối lượng kiến thức còn tồn đọng và giãn cách lịch học một cách khoa học để loại bỏ áp lực tâm lý."
                  },
                  {
                    q: "Tôi có thể hủy gói Premium sau khi đã thi xong không?",
                    a: "Tất nhiên. Việc quản lý gói hoàn toàn minh bạch ngay trong phần cài đặt tài khoản. Bạn có thể chấm dứt gia hạn bất cứ lúc nào và hệ thống vẫn duy trì quyền lợi cho tới ngày cuối chu kỳ."
                  }
                ].map((item, idx) => {
                  const isOpen = activeFaq === idx;
                  return (
                    <div
                      key={idx}
                      className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                        isOpen ? "border-orange-500/40 bg-orange-50/5 shadow-inner" : "border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <button
                        onClick={() => setActiveFaq(isOpen ? null : idx)}
                        className="w-full flex justify-between items-center p-5 text-left border-none bg-transparent cursor-pointer select-none"
                      >
                        <span className={`font-black text-sm transition-colors ${isOpen ? "text-orange-600" : "text-slate-800"}`}>
                          {item.q}
                        </span>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${isOpen ? "bg-orange-500 text-white rotate-45" : "bg-slate-100 text-slate-400"}`}>
                          <Plus size={11} className="stroke-[3.5]" />
                        </div>
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                          >
                            <div className="px-5 pb-5 text-xs text-slate-500 leading-relaxed border-t border-slate-100/50 pt-3 font-medium">
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

      {/* ================= AUTH GATE MODAL ================= */}
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
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl text-center relative border border-slate-100"
            >
              <button
                type="button"
                onClick={() => setAuthGateOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors border-none cursor-pointer"
              >
                <X size={14} className="text-slate-400" />
              </button>

              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mx-auto mb-5 text-white">
                <Sparkles size={24} className="animate-spin" style={{ animationDuration: '6s' }} />
              </div>

              <h3 className="font-black text-lg text-slate-900 tracking-tight mb-2">
                Bắt đầu hành trình của bạn
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed font-semibold mb-6 px-2">
                Bạn cần đăng nhập hoặc tạo một tài khoản mới để kích hoạt và lưu trữ cấu hình hệ thống gói <span className="font-black text-orange-500">{pendingAuthPlan?.name}</span>.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    if (pendingAuthPlan) sessionStorage.setItem("pendingPlan", pendingAuthPlan.id);
                    navigate("/login?mode=register");
                  }}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 border-none text-white font-black text-xs tracking-widest uppercase cursor-pointer"
                >
                  Đăng ký tài khoản mới
                </button>
                <button
                  onClick={() => {
                    if (pendingAuthPlan) sessionStorage.setItem("pendingPlan", pendingAuthPlan.id);
                    navigate("/login?mode=login");
                  }}
                  className="w-full py-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-black text-xs tracking-widest uppercase cursor-pointer"
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
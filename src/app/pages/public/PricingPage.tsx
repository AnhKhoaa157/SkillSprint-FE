import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion"; // Đồng bộ dùng framer-motion thống nhất
import { useNavigate } from "react-router";
import { Link } from "react-router";
import { Check, X, Sparkles, Zap, HelpCircle, Plus, LogIn, UserPlus } from "lucide-react";
import { Footer as PublicFooter } from "../components/Footer";
import { PublicNavbar } from "../components/PublicNavbar";
import CursorSpotlight from "../components/CursorSpotlight";
import { useAuth } from "../../contexts/AuthContext";

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const [pendingAuthPlan, setPendingAuthPlan] = useState<"SKILL_BUILDER" | "PREMIUM" | null>(null);

  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Danh sách tính năng bê nguyên xi từ ảnh và thiết kế mới sang
  const builderFeatures = [
    { text: "Lộ trình học AI cơ bản", included: true },
    { text: "Quản lý lịch học thông minh", included: true },
    { text: "Phân tích tiến độ học tập", included: true },
    { text: "Mở khóa lộ trình AI cá nhân hóa.", included: false },
    { text: "Phát hiện lỗ hổng kỹ năng", included: false },
    { text: "Gợi ý tài nguyên học bằng AI", included: false },
  ];

  const premiumFeatures = [
    { text: "Mở khóa lộ trình AI cá nhân hóa.", isBold: false },
    { text: "Phát hiện lỗ hổng kỹ năng", isBold: false },
    { text: "Gợi ý tài nguyên học bằng AI", isBold: false },
    { text: "Gia sư AI 24/7 cá nhân hóa", isBold: true, hasZap: true },
    { text: "AI tự động tìm tài nguyên", isBold: false },
    { text: "Quiz nhỏ và thống kê tiến độ", isBold: false },
    { text: "Ưu tiên xử lý AI không giới hạn", isBold: false },
  ];

  const handlePlanCTA = (plan: "SKILL_BUILDER" | "PREMIUM") => {
    if (isAuthenticated) {
      navigate(`/app?pricing=${plan}&period=${isAnnual ? "annual" : "monthly"}`);
      return;
    }
    setPendingAuthPlan(plan);
    setAuthGateOpen(true);
  };

  const handleAuthGateNavigate = (mode: "login" | "register") => {
    if (pendingAuthPlan) sessionStorage.setItem("pendingPlan", pendingAuthPlan);
    setAuthGateOpen(false);
    navigate(`/login?mode=${mode}`);
  };

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
            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 items-stretch justify-center">

              {/* CARD 1: BUILDER PACK (LIGHT) */}
              <CursorSpotlight color="rgba(14,165,233,0.08)" size={220}>
                <motion.div
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="bg-white rounded-3xl border border-slate-200 p-8 md:p-10 flex flex-col justify-between shadow-[0_10px_35px_rgba(0,0,0,0.06)] h-full"
                >
                  <div>
                    <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Gói Builder</h3>
                    <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                      Dành cho người mới bắt đầu làm quen với phương pháp học mới.
                    </p>

                    <div className="mt-8 mb-8 flex items-baseline gap-0.5 text-slate-900">
                      <span className="font-black text-5xl tracking-tight leading-none">
                        {isAnnual ? "69" : "89"}
                      </span>
                      <span className="font-extrabold text-xl">.000</span>
                      <span className="text-sm font-medium text-slate-400 ml-1.5">đ/tháng</span>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      onClick={() => handlePlanCTA("SKILL_BUILDER")}
                      className="w-full py-3.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-sm transition-colors cursor-pointer mb-8"
                    >
                      Bắt đầu ngay
                    </motion.button>

                    <div className="border-t border-slate-100 pt-6">
                      <div className="text-xs font-black text-slate-400 tracking-wider uppercase mb-4">Bao gồm:</div>
                      <ul className="space-y-4">
                        {builderFeatures.map((feature, i) => (
                          <li
                            key={i}
                            className={`flex items-start gap-3 text-sm transition-all duration-150 ${
                              feature.included ? "text-slate-700 font-medium" : "text-slate-300 line-through opacity-50"
                            }`}
                          >
                            {feature.included ? (
                              <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                                <Check size={13} className="stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full text-slate-300/60 flex items-center justify-center shrink-0 mt-0.5">
                                <X size={13} className="stroke-[2.5]" />
                              </div>
                            )}
                            <span className="leading-relaxed">{feature.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              </CursorSpotlight>

              {/* CARD 2: PREMIUM PACK (FEATURED LIGHT GRADIENT) */}
              <div className="relative h-full flex">
                {/* Aura Glow Backdrop overlay */}
                <div className="absolute inset-[-8px] bg-[radial-gradient(circle,_rgba(255,107,0,0.1)_0%,transparent_70%)] filter blur-2xl rounded-[40px] pointer-events-none z-0" />

                <CursorSpotlight color="rgba(255,107,0,0.12)" size={240}>
                  <motion.div
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="relative z-10 bg-white rounded-3xl border-2 border-[#FF6B00] p-8 md:p-10 flex flex-col justify-between shadow-[0_20px_50px_rgba(255,107,0,0.12)] h-full"
                  >
                    {/* Absolute Header Badge */}
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#FF6B00] to-[#FF7E21] text-white px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase shadow-md shadow-orange-500/10 border border-white/20 whitespace-nowrap">
                      🔥 ĐƯỢC KHUYÊN DÙNG
                    </div>

                    <div>
                      <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-2">Gói Premium</h3>
                      <p className="text-slate-500 text-sm mt-2 leading-relaxed">Toàn quyền truy cập mọi tính năng siêu việt nhất.</p>

                      <div className="mt-8 mb-8 flex items-baseline gap-0.5 text-slate-900">
                        <span className="font-black text-5xl tracking-tight leading-none text-[#FF6B00]">
                          {isAnnual ? "149" : "199"}
                        </span>
                        <span className="font-extrabold text-xl text-[#FF6B00]">.000</span>
                        <span className="text-sm font-medium text-slate-400 ml-1.5">đ/tháng</span>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.015, boxShadow: "0 10px 25px rgba(255,107,0,0.3)" }}
                        whileTap={{ scale: 0.985 }}
                        onClick={() => handlePlanCTA("PREMIUM")}
                        className="w-full py-3.5 px-4 rounded-xl bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold text-sm transition-all shadow-[0_4px_15px_rgba(255,107,0,0.2)] cursor-pointer mb-8"
                      >
                        Nâng cấp lên Premium
                      </motion.button>

                      <div className="border-t border-slate-100 pt-6">
                        <div className="text-xs font-black text-[#FF6B00] tracking-wider uppercase mb-4">Bao gồm toàn bộ gói Skill Builder, cộng thêm:</div>

                        <ul className="space-y-4">
                          {premiumFeatures.map((feature, i) => (
                            <li key={i} className={`flex items-start gap-3 text-sm leading-relaxed ${feature.isBold ? "text-slate-900 font-extrabold" : "text-slate-700 font-medium"}`}>
                              {feature.hasZap ? (
                                <div className="w-5 h-5 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0 mt-0.5 shadow-sm border border-orange-100">
                                  <Zap size={12} className="fill-[#FF6B00] stroke-[#FF6B00]" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-orange-50/50 text-[#FF6B00] flex items-center justify-center shrink-0 mt-0.5">
                                  <Check size={13} className="stroke-[3]" />
                                </div>
                              )}
                              <span>{feature.text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                </CursorSpotlight>
              </div>

            </div>
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
                  {pendingAuthPlan === "PREMIUM" ? "Career Premium" : "Skill Builder"}
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
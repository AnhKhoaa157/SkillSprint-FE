import { PublicNavbar } from "../../components/layout/PublicNavbar";
import { Footer } from "../../components/layout/Footer";
import { CheckCircle, Target } from "lucide-react";
import { motion } from "motion/react";

const F = "'Plus Jakarta Sans', Inter, sans-serif";
const BG = "#F9FAFB";
const CARD = "#FFFFFF";
const T1 = "#1F2937";
const T2 = "#6B7280";
const T3 = "#9CA3AF";
const OG = "#FF6B00";
const BDR = "#E5E7EB";

const plans = [
  {
    name: "Starter",
    price: "0đ",
    note: "/ tháng",
    badge: "Free",
    highlight: false,
    features: ["Quản lý công việc học tập", "Lộ trình mẫu"],
  },
  {
    name: "Skill Builder",
    price: "89.000đ",
    note: "/ tháng",
    badge: "AI Roadmap",
    highlight: false,
    features: ["Lộ trình AI cá nhân hóa", "Gợi ý tài nguyên bằng AI"],
  },
  {
    name: "Career Premium",
    price: "199.000đ",
    note: "/ tháng",
    badge: "Recommended",
    highlight: true,
    features: ["Gia sư AI 24/7", "Quiz & phân tích tiến độ"],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col">
      <PublicNavbar />
      <main className="pt-28 pb-16 flex-1">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-orange-100 bg-white p-8 md:p-12 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <p className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-1 text-xs font-bold uppercase tracking-wider text-orange-700 mb-4">
              <Target size={14} /> Bảng giá
            </p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight mb-4">Chọn gói phù hợp với nhịp học của bạn</h1>
            <p className="text-slate-600 text-lg max-w-4xl">Nâng cấp bất kỳ lúc nào. Hủy dễ dàng, không phí ẩn.</p>
          </motion.div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: "16px" }}>
            {plans.map((plan) => (
              <div key={plan.name} style={{ background: CARD, borderRadius: 18, padding: 24, border: plan.highlight ? `1.5px solid ${OG}` : `1px solid ${BDR}`, boxShadow: plan.highlight ? "0 10px 34px rgba(255,107,0,0.16)" : undefined }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <h3 style={{ fontFamily: F, fontWeight: 800, fontSize: "1.05rem", color: T1 }}>{plan.name}</h3>
                  <span style={{ fontFamily: F, fontSize: "0.68rem", fontWeight: 700, color: plan.highlight ? OG : T2, padding: "3px 8px", borderRadius: 999, background: plan.highlight ? "rgba(255,107,0,0.06)" : "#F3F4F6", border: plan.highlight ? `1px solid rgba(255,107,0,0.12)` : undefined }}>{plan.badge}</span>
                </div>

                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 12 }}>
                  <p style={{ fontFamily: F, fontWeight: 900, fontSize: "1.6rem", color: plan.highlight ? OG : T1 }}>{plan.price}</p>
                  <span style={{ fontFamily: F, fontSize: "0.78rem", color: T3 }}>{plan.note}</span>
                </div>

                <div style={{ marginBottom: 18 }}>
                  {plan.features.map((f) => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <CheckCircle size={14} color={plan.highlight ? OG : "#10B981"} />
                      <span style={{ fontFamily: F, fontSize: "0.84rem", color: T2 }}>{f}</span>
                    </div>
                  ))}
                </div>

                <a href="/auth?mode=register" style={{ textDecoration: "none" }}>
                  <button style={{ width: "100%", padding: "11px", borderRadius: 10, background: plan.highlight ? OG : "#111827", color: "#fff", border: "none", cursor: "pointer", fontFamily: F, fontWeight: 700, fontSize: "0.84rem" }}>Chọn gói {plan.name}</button>
                </a>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

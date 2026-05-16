import { motion } from "motion/react";
import { ArrowRight, CheckCircle2, Clock3, GraduationCap, Sparkles, Target } from "lucide-react";
import { Link } from "react-router";
import { PublicNavbar } from "../components/PublicNavbar";
import { Footer } from "../components/Footer";

export default function About() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col">
      <PublicNavbar />

      <main className="pt-28 pb-16 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <section className="mb-10">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-orange-100 bg-white p-8 md:p-12 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
            >
              <p className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-1 text-xs font-bold uppercase tracking-wider text-orange-700 mb-5">
                <Sparkles size={14} /> Câu chuyện SkillSprint
              </p>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-5">
                Từ "không biết bắt đầu từ đâu" đến
                <span className="text-orange-600"> lộ trình học rõ ràng</span>
              </h1>
              <p className="text-slate-600 text-lg leading-relaxed max-w-4xl">
                SkillSprint được xây để giải quyết bài toán thực tế của sinh viên: có syllabus nhưng không biết học gì trước,
                có nhiều tài liệu nhưng bị lan man, và không biết chia thời gian để kịp quiz, midterm, final.
              </p>
            </motion.div>
          </section>

          <section className="grid md:grid-cols-3 gap-5 mb-10">
            {[
              {
                icon: <Target size={18} className="text-orange-600" />,
                title: "Vấn đề cốt lõi",
                text: "Sinh viên có tài liệu nhưng thiếu định hướng học tập theo thứ tự ưu tiên và theo thời gian còn lại trước kỳ thi.",
              },
              {
                icon: <Clock3 size={18} className="text-orange-600" />,
                title: "Giải pháp",
                text: "Phân tích syllabus + năng lực hiện tại để tạo roadmap cá nhân hóa, lịch học tuần/ngày/buổi và tự điều chỉnh theo tiến độ thực tế.",
              },
              {
                icon: <GraduationCap size={18} className="text-orange-600" />,
                title: "Giá trị khác biệt",
                text: "Không chỉ là app ghi lịch. SkillSprint là study coach có AI: phân tích skill gap, đề xuất thứ tự học và nhắc khi lệch kế hoạch.",
              },
            ].map((item) => (
              <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 border border-orange-100">
                  {item.icon}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.text}</p>
              </article>
            ))}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-8 md:p-10 shadow-sm">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-6">Nguyên tắc sản phẩm</h2>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {[
                "Dữ liệu học tập thực tế phải dẫn dắt kế hoạch học",
                "Lộ trình phải cá nhân hóa theo từng sinh viên",
                "Theo dõi tiến độ phải trực quan, dễ hành động",
                "Nhắc nhở đúng thời điểm để giảm bỏ buổi học",
              ].map((line) => (
                <div key={line} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <CheckCircle2 size={16} className="text-emerald-600 mt-0.5" />
                  <span className="text-sm text-slate-700">{line}</span>
                </div>
              ))}
            </div>
            <Link
              to="/features"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white hover:bg-orange-400 transition-colors"
            >
              Xem hệ sinh thái tính năng <ArrowRight size={16} />
            </Link>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

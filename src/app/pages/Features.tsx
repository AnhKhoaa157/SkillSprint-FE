import { motion } from "motion/react";
import { Link } from "react-router";
import { ArrowRight, Brain, CalendarClock, CheckCircle2, Clock3, FileText, Sparkles, Target } from "lucide-react";
import { Footer } from "../components/Footer";
import { PublicNavbar } from "../components/PublicNavbar";

const featureGroups = [
  {
    title: "Phân tích học tập bằng AI",
    icon: <Brain size={18} className="text-orange-600" />,
    bullets: [
      "Đọc syllabus và tách cấu trúc môn học",
      "Xác định topic nền tảng, trọng tâm, nâng cao",
      "Phân tích skill gap theo từng sinh viên",
    ],
  },
  {
    title: "Lập kế hoạch cá nhân hóa",
    icon: <Target size={18} className="text-orange-600" />,
    bullets: [
      "Tạo roadmap theo giai đoạn học",
      "Chuyển roadmap thành lịch tuần/ngày/buổi",
      "Ưu tiên theo thời gian còn lại trước kỳ thi",
    ],
  },
  {
    title: "Quản lý thời gian học",
    icon: <Clock3 size={18} className="text-orange-600" />,
    bullets: [
      "Pomodoro cho từng phiên học",
      "Ma trận Eisenhower để ưu tiên task",
      "Nhắc học đúng giờ, tránh bỏ buổi",
    ],
  },
  {
    title: "Theo dõi và điều chỉnh tiến độ",
    icon: <CalendarClock size={18} className="text-orange-600" />,
    bullets: [
      "% hoàn thành toàn môn và từng phần",
      "Cảnh báo chậm tiến độ gần kỳ thi",
      "Tự động điều chỉnh lịch khi lệch kế hoạch",
    ],
  },
];

export default function FeaturesLanding() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col">
      <PublicNavbar />

      <main className="pt-28 pb-16 flex-1">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-orange-100 bg-white p-8 md:p-12 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
          >
            <p className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-1 text-xs font-bold uppercase tracking-wider text-orange-700 mb-4">
              <Sparkles size={14} /> Hệ sinh thái SkillSprint
            </p>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-4">
              Không chỉ ghi lịch học.
              <span className="text-orange-600"> Đây là study coach có AI.</span>
            </h1>
            <p className="text-slate-600 text-lg max-w-4xl">
              Từ đầu vào syllabus và thông tin người học, hệ thống tự phân tích skill gap, tạo roadmap, tạo lịch học, theo dõi tiến độ và nhắc khi lệch kế hoạch.
            </p>
          </motion.div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
          <div className="grid md:grid-cols-2 gap-5">
            {featureGroups.map((group, idx) => (
              <motion.article
                key={group.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: idx * 0.06 }}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-orange-100 bg-orange-50">
                  {group.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">{group.title}</h3>
                <ul className="space-y-3">
                  {group.bullets.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                      <CheckCircle2 size={15} className="text-emerald-600 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 md:p-10 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Bắt đầu ngay</p>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">Xây lộ trình học cá nhân hóa cho môn học của bạn</h2>
              <p className="text-slate-600">Nhập syllabus, khai báo thời gian rảnh và để SkillSprint tạo kế hoạch học tự động.</p>
            </div>
            <div className="flex gap-3">
              <Link to="/auth?mode=register" className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white hover:bg-orange-400 transition-colors">
                Dùng thử miễn phí <ArrowRight size={16} />
              </Link>
              <Link to="/app/syllabus" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                <FileText size={15} /> Nhập syllabus
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
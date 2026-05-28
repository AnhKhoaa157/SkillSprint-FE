import { motion } from "motion/react";
import { ArrowLeft, Mail, MapPin, MessageSquare, Send } from "lucide-react";
import { Link } from "react-router";
import { PublicNavbar } from "../../components/layout/PublicNavbar";
import { Footer } from "../../components/layout/Footer";

export default function Contact() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col">
      <PublicNavbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-6">
            <ArrowLeft size={15} /> Quay về trang chủ
          </Link>

          <div className="rounded-3xl border border-orange-100 bg-white p-8 md:p-10 shadow-[0_20px_60px_rgba(15,23,42,0.08)] mb-8">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3">
              Cùng xây tương lai học tập
              <span className="text-orange-600"> có định hướng</span>
            </h1>
            <p className="text-slate-600 text-lg max-w-3xl">
              Bạn cần tư vấn triển khai tại trường, góp ý sản phẩm, hoặc hợp tác cộng đồng? Đội ngũ SkillSprint luôn sẵn sàng hỗ trợ.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 items-start">
            <motion.div
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-bold mb-2">Cộng đồng học tập</h3>
                <p className="text-slate-600 text-sm mb-4">
                  Kết nối với sinh viên khác, trao đổi tips ôn tập và nhận thông báo cập nhật tính năng sớm.
                </p>
                <button className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-400 transition-colors">
                  <MessageSquare size={16} /> Tham gia cộng đồng
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-3">Thông tin liên hệ</h3>
                <div className="space-y-3 text-sm text-slate-700">
                  <a href="mailto:hello@skillsprint.edu" className="flex items-center gap-2 hover:text-orange-600 transition-colors">
                    <Mail size={16} className="text-orange-600" /> hello@skillsprint.edu
                  </a>
                  <p className="flex items-center gap-2">
                    <MapPin size={16} className="text-orange-600" /> Khu Công nghệ cao, TP. Thu Duc, TP.HCM
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1">Họ và tên</label>
                  <input id="name" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-orange-400" placeholder="Nguyễn Văn A" />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1">Email trường / công việc</label>
                  <input id="email" type="email" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-orange-400" placeholder="ban@gmail.com" />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold text-slate-700 mb-1">Chủ đề</label>
                  <select id="subject" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-orange-400">
                    <option>Hỗ trợ kỹ thuật</option>
                    <option>Hợp tác trường học</option>
                    <option>Góp ý sản phẩm</option>
                    <option>Khác</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-slate-700 mb-1">Nội dung</label>
                  <textarea id="message" rows={5} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-orange-400 resize-none" placeholder="Bạn cần SkillSprint hỗ trợ nội dung gì?" />
                </div>
                <button className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white hover:bg-orange-400 transition-colors">
                  Gửi liên hệ <Send size={16} />
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
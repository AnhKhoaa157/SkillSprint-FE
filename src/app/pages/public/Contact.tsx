import { motion } from "motion/react";
import {
  Send,
  Mail,
  Clock,
  Facebook,
  Headphones,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  MessageSquareText,
  AlertCircle
} from "lucide-react";
import { Footer as PublicFooter } from "../components/Footer";
import { PublicNavbar } from "../components/PublicNavbar";
import CursorSpotlight from "../components/CursorSpotlight";

const F = "'Plus Jakarta Sans', Inter, sans-serif";
const BG = "#FAFAFA"; // Nền kem Slate mịn màng cao cấp hơn màu trắng tinh cũ

function TikTokIcon() {
  return (
    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .79.11V9.5a6.27 6.27 0 0 0-3.1-1.74 6.36 6.36 0 0 0-6 5.56 6.34 6.34 0 0 0 6.1 7.18A6.3 6.3 0 0 0 15.82 16c0-.05.02-.1.02-.15V8.82a8.17 8.17 0 0 0 4.85 1.58V7a4.83 4.83 0 0 1-1.1-.31z" />
    </svg>
  );
}

export default function Contact() {
  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: F, position: "relative" }} className="antialiased selection:bg-orange-500/10 selection:text-orange-600 text-slate-800">
      
      {/* 🔮 Background Mesh Art: Thay thế lưới nét thô cũ bằng lưới vector siêu mảnh */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,107,0,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,107,0,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,transparent_0%,#FAFAFA_85%)] pointer-events-none z-0" />

      <div style={{ position: "relative", zIndex: 1 }}>
        <PublicNavbar />

        <main className="overflow-hidden pb-32 pt-36">
          {/* ================= HERO SECTION ================= */}
          <section className="px-4 pb-16 text-center relative z-10">
            <div className="mx-auto max-w-4xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-200/60 bg-orange-50/80 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-orange-700 shadow-sm"
              >
                <Sparkles size={12} className="text-orange-500 animate-pulse" />
                Trung tâm phản hồi SkillSprint
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-4xl sm:text-5xl md:text-[60px] font-black leading-[1.1] tracking-tight text-slate-950"
              >
                Kết nối trực tiếp với <br />
                <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 bg-clip-text text-transparent relative inline-block">
                  Hệ thống hỗ trợ chuyên gia
                  <span className="absolute -bottom-1 left-0 w-full h-[4px] bg-orange-500/10 rounded-full" />
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mx-auto mt-6 max-w-2xl text-sm sm:text-base leading-relaxed text-slate-400 font-medium"
              >
                Chúng tôi lược bỏ mọi quy trình thủ tục rườm rà để mang đến trải nghiệm xử lý kỹ thuật tối tốc — Giúp học trình AI của bạn luôn mượt mà.
              </motion.p>
            </div>
          </section>

          {/* ================= MAIN LAYOUT GRID ================= */}
          <section className="px-4 relative z-10">
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-[24rem_1fr] items-start">
              
              {/* 📱 LEFT COLUMN: BENTO GRID INFO CHẮC CHẮN */}
              <div className="flex flex-col gap-5">
                
                {/* Panel 1: Master Glass Card */}
                <CursorSpotlight color="rgba(234,88,12,0.12)" size={200}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative overflow-hidden rounded-[32px] border border-slate-200/80 bg-white p-7 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.04)]"
                  >
                    <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-orange-500/10 to-transparent blur-2xl pointer-events-none" />
                    
                    <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 border border-orange-100/60 shadow-sm">
                      <Headphones size={20} />
                    </div>

                    <h2 className="text-xl font-black text-slate-950 tracking-tight leading-snug">
                      Đồng hành cùng học viên kỹ thuật số
                    </h2>

                    <p className="mt-3 text-xs leading-relaxed text-slate-400 font-medium">
                      Bất kỳ các vấn đề về đồng bộ dữ liệu lộ trình, nâng cấp gói dịch vụ hay tùy biến Workspace, đội ngũ cam kết đồng hành sát sao.
                    </p>

                    {/* Hệ thống nút mạng xã hội tinh xảo */}
                    <div className="mt-6 flex flex-col gap-2">
                      <a
                        href="https://www.facebook.com/profile.php?id=61590323403077"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 text-xs font-bold text-slate-700 no-underline transition-all duration-300 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
                      >
                        <div className="flex items-center gap-2">
                          <Facebook size={14} className="text-blue-600" />
                          <span>Cộng đồng Facebook Group</span>
                        </div>
                        <ArrowRight size={12} className="opacity-60" />
                      </a>

                      <a
                        href="https://www.tiktok.com/@skillsprint26"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 text-xs font-bold text-slate-700 no-underline transition-all duration-300 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
                      >
                        <div className="flex items-center gap-2">
                          <TikTokIcon />
                          <span>Kênh truyền thông TikTok</span>
                        </div>
                        <ArrowRight size={12} className="opacity-60" />
                      </a>
                    </div>
                  </motion.div>
                </CursorSpotlight>

                {/* Panel 2: Email Card */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_16px_40px_-15px_rgba(15,23,42,0.03)] group hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 border border-orange-100">
                      <Mail size={16} />
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Trục liên hệ chính</span>
                      <h3 className="text-[14px] font-black text-slate-950 mt-0.5 tracking-tight group-hover:text-orange-600 transition-colors">
                        skillsprint2026@gmail.com
                      </h3>
                    </div>
                  </div>
                </motion.div>

                {/* Panel 3: SLA Timing Card */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_16px_40px_-15px_rgba(15,23,42,0.03)]"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                      <Clock size={16} />
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Thời gian cam kết phản hồi</span>
                      <h3 className="text-[14px] font-black text-emerald-700 mt-0.5 tracking-tight">
                        Trong 2 giờ làm việc
                      </h3>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* 📝 RIGHT COLUMN: CONTACT FORM HOÀN HẢO, CÂN ĐỐI */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.55 }}
              >
                <CursorSpotlight color="rgba(234,88,12,0.08)" size={260}>
                  <div className="rounded-[36px] border border-slate-200 bg-white p-6 md:p-10 shadow-[0_30px_70px_-20px_rgba(15,23,42,0.04)]">
                    
                    {/* Header nội bộ của Form */}
                    <div className="mb-8 border-b border-slate-100 pb-6">
                      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <MessageSquareText size={11} className="text-slate-400" />
                        Phiếu yêu cầu điện tử
                      </div>
                      <h2 className="text-2xl font-black text-slate-950 tracking-tight">
                        Gửi ticket hỗ trợ hệ thống
                      </h2>
                    </div>

                    <form className="flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
                      
                      {/* Lưới 2 cột cho Họ tên & Email */}
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-bold text-slate-700">Họ và tên</label>
                          <input
                            type="text"
                            placeholder="Nguyễn Văn A"
                            className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/5"
                          />
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-bold text-slate-700">Email liên hệ</label>
                          <input
                            type="email"
                            placeholder="example@gmail.com"
                            className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/5"
                          />
                        </div>
                      </div>

                      {/* Hàng chọn Chủ đề */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-700">Chủ đề cần xử lý</label>
                        <div className="relative">
                          <select className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/5 cursor-pointer">
                            <option>Hỗ trợ thanh toán / Gia hạn hoặc Nâng cấp gói dịch vụ</option>
                            <option>Báo cáo lỗi kỹ thuật / Sai lệch lộ trình học tập AI</option>
                            <option>Tư vấn lộ trình học tập doanh nghiệp & cá nhân</option>
                            <option>Yêu cầu khác</option>
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
                        </div>
                      </div>

                      {/* ⚡ Tái định vị Hộp Lưu ý: Biến thành một Notification Banner tinh xảo đặt ngay trung tâm form */}
                      <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-4 text-xs leading-relaxed text-orange-800 flex items-start gap-2.5 shadow-sm">
                        <AlertCircle size={15} className="text-orange-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-black text-orange-900">Luồng ưu tiên cao:</span> Mọi ticket về lỗi thanh toán & đồng bộ sơ đồ AI được định tuyến tự động thẳng đến kỹ sư giải pháp để phản hồi lập tức. Vui lòng ghi rõ bối cảnh tài khoản của bạn.
                        </div>
                      </div>

                      {/* Hàng nhập Nội dung chi tiết */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-700">Nội dung mô tả chi tiết</label>
                        <textarea
                          rows={5}
                          placeholder="Vui lòng miêu tả chi tiết vấn đề hoặc thao tác bạn vừa thực hiện để kỹ thuật viên nắm bắt nhanh nhất..."
                          className="resize-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/5"
                        />
                      </div>

                      {/* Footer Form & Nút Gửi */}
                      <div className="flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="max-w-xs text-[11px] leading-relaxed text-slate-400 font-semibold">
                          Dữ liệu truyền tải được mã hóa đầu cuối nhằm bảo mật tuyệt đối thông tin định danh của bạn.
                        </p>

                        <motion.button
                          whileHover={{ scale: 1.02, boxShadow: "0 16px 32px rgba(234,88,12,0.25)" }}
                          whileTap={{ scale: 0.98 }}
                          className="group inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border-none bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 px-6 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-orange-500/10"
                        >
                          Khởi tạo Ticket hỗ trợ
                          <Send size={12} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </motion.button>
                      </div>
                    </form>
                  </div>
                </CursorSpotlight>
              </motion.div>

            </div>
          </section>
        </main>

        <PublicFooter />
      </div>
    </div>
  );
}
import React, { useState } from "react";
import { Shield, Lock, Eye, Database } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
// Import lại Navbar và Footer theo đúng template chung của Bảo VC
import { PublicNavbar } from "../../components/layout/PublicNavbar";

export default function Privacy() {
  const [activeSection, setActiveSection] = useState(0);

  const menuItems = [
    { title: "1. Thu thập dữ liệu", icon: <Eye size={16} /> },
    { title: "2. Lưu trữ bằng AWS", icon: <Database size={16} /> },
    { title: "3. Mục đích sử dụng", icon: <Shield size={16} /> },
    { title: "4. Bảo mật & Mã hóa", icon: <Lock size={16} /> },
  ];

  return (
    <div className="bg-[#FAFAFA] min-h-screen flex flex-col justify-between relative overflow-x-hidden selection:bg-orange-500/10 selection:text-[#FF6B00]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* 1. THANH ĐIỀU HƯỚNG NAVBAR */}
      <PublicNavbar />

      {/* Background Grid Layer */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,transparent_0%,#FAFAFA_75%)] pointer-events-none z-0" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(255,107,0,0.05)_0%,transparent_70%)] filter blur-3xl pointer-events-none z-0" />

      {/* 2. CỤM NỘI DUNG CHÍNH (Đã fix khoảng cách an toàn từ Navbar) */}
      <div className="relative z-10 max-w-6xl w-full mx-auto pt-32 pb-20 px-4 flex-grow">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-100 px-3 py-1 rounded-full mb-4">
            <Shield size={14} className="text-[#FF6B00]" />
            <span className="text-xs text-[#FF6B00] font-bold uppercase tracking-wider">An toàn & Minh bạch</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
            Chính sách <span className="bg-gradient-to-r from-[#FF6B00] to-[#FF3B00] bg-clip-text text-transparent">Bảo mật.</span>
          </h1>
          <p className="text-slate-500 text-sm mt-3 font-medium">Cập nhật mới nhất: Tháng 6, 2026</p>
        </div>

        {/* Bi-Column Content layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
          {/* Left Sticky Sidebar */}
          <div className="md:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm md:sticky md:top-28">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-3 mb-3">Mục lục chính sách</p>
            <div className="space-y-1">
              {menuItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSection(idx)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all border-none cursor-pointer text-left ${
                    activeSection === idx 
                      ? "bg-orange-50 text-[#FF6B00] shadow-[inset_3px_0_0_#FF6B00]" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span className={activeSection === idx ? "text-[#FF6B00]" : "text-slate-400"}>{item.icon}</span>
                  {item.title}
                </button>
              ))}
            </div>
          </div>

          {/* Right Content Area */}
          <div className="md:col-span-8 bg-white border border-slate-200/80 rounded-3xl p-8 md:p-10 shadow-[0_10px_35px_rgba(0,0,0,0.01)] min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="text-slate-600 text-sm leading-relaxed space-y-5"
              >
                {activeSection === 0 && (
                  <>
                    <h2 className="text-slate-900 font-extrabold text-xl pb-2 border-b border-slate-100 flex items-center gap-2">
                      <Eye size={18} className="text-[#FF6B00]" /> 1. Thu thập dữ liệu người dùng
                    </h2>
                    <p>SkillSprint thực hiện thu thập thông tin tài khoản cơ bản bao gồm Họ và tên, Email sinh viên khi bạn đăng ký sử dụng hệ thống nhằm định danh cá nhân và hỗ trợ đồng bộ dữ liệu môn học.</p>
                    <p>Trong quá trình tối ưu hóa lộ trình học tập, chúng tôi thu thập các tệp tin Đề cương môn học (Syllabus) dạng tài liệu, hình ảnh do bạn chủ động tải lên, kèm theo kết quả làm bài trắc nghiệm (Quiz) để AI phân tích cấu trúc kiến thức.</p>
                  </>
                )}

                {activeSection === 1 && (
                  <>
                    <h2 className="text-slate-900 font-extrabold text-xl pb-2 border-b border-slate-100 flex items-center gap-2">
                      <Database size={18} className="text-[#FF6B00]" /> 2. Lưu trữ an toàn trên cơ sở hạ tầng AWS
                    </h2>
                    <p>Toàn bộ tài nguyên và hồ sơ dữ liệu của bạn được vận hành trực tiếp trên nền tảng đám mây **Amazon Web Services (AWS)** để bảo đảm tính sẵn sàng cao và chống mất mát dữ liệu học tập.</p>
                    <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 text-xs space-y-2 font-medium">
                      <p>🔹 **Dữ liệu cấu trúc bài học:** Lưu trữ bảo mật tại hệ thống cơ sở dữ liệu **Amazon RDS MySQL**, được thiết lập sao lưu tự động (Automated Backups).</p>
                      <p>🔹 **Tệp tin tài liệu:** Đề cương (Syllabus) tải lên được cách ly an toàn trong các phân vùng lưu trữ đối tượng **Amazon S3 Buckets** kèm chính sách phân quyền truy cập nghiêm ngặt.</p>
                      <p>🔹 **Tốc độ truyền tải:** Phân phối dữ liệu học tập thông qua mạng lưới CDN **Amazon CloudFront** giúp mã hóa đường truyền đầu cuối.</p>
                    </div>
                  </>
                )}

                {activeSection === 2 && (
                  <>
                    <h2 className="text-slate-900 font-extrabold text-xl pb-2 border-b border-slate-100 flex items-center gap-2">
                      <Shield size={18} className="text-[#FF6B00]" /> 3. Mục đích xử lý dữ liệu bằng AI
                    </h2>
                    <p>Dữ liệu đề cương học tập thu thập chỉ được sử dụng cho mục đích duy nhất là huấn luyện mô hình ngôn ngữ lớn (LLM) nội bộ tạo lập Bản đồ lộ trình AI và kích hoạt hệ thống Gia sư AI 24/7 cá nhân hóa giải đáp bài tập.</p>
                    <p>Chúng tôi cam kết không chia sẻ, bán hoặc cung cấp bất kỳ tệp tin dữ liệu học tập cá nhân nào của sinh viên cho bên thứ ba vì mục đích thương mại hay quảng cáo.</p>
                  </>
                )}

                {activeSection === 3 && (
                  <>
                    <h2 className="text-slate-900 font-extrabold text-xl pb-2 border-b border-slate-100 flex items-center gap-2">
                      <Lock size={18} className="text-[#FF6B00]" /> 4. Cơ chế bảo mật & Quyền xóa dữ liệu
                    </h2>
                    <p>Mọi luồng dữ liệu truyền tải giữa máy tính người dùng và hệ thống máy chủ **Amazon EC2** đều được bắt buộc mã hóa thông qua giao thức bảo mật lớp truyền tải **SSL/TLS công nghiệp**.</p>
                    <p>Sinh viên hoàn toàn có quyền chủ động yêu cầu xóa vĩnh viễn toàn bộ tài khoản, các tệp syllabus đã tải lên và lịch sử trò chuyện với AI bất kỳ lúc nào thông qua mục Cài đặt tài khoản trong Dashboard hệ thống.</p>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
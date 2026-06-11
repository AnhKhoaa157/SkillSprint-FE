import React, { useState } from "react";
import { Cookie, Settings, EyeOff, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
// Giữ nguyên chuẩn bọc Layout
import { PublicNavbar } from "../../components/layout/PublicNavbar";

export default function Cookies() {
  const [activeSection, setActiveSection] = useState(0);

  const menuItems = [
    { title: "1. Cookie thiết yếu", icon: <ShieldCheck size={16} /> },
    { title: "2. Cookie tùy chọn", icon: <Settings size={16} /> },
    { title: "3. Quản lý Cookie", icon: <EyeOff size={16} /> },
  ];

  return (
    <div className="bg-[#FAFAFA] min-h-screen flex flex-col justify-between relative overflow-x-hidden selection:bg-orange-500/10 selection:text-[#FF6B00]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* 1. THANH ĐIỀU HƯỚNG NAVBAR */}
      <PublicNavbar />

      {/* Background Grid Layer */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,transparent_0%,#FAFAFA_75%)] pointer-events-none z-0" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(255,107,0,0.05)_0%,transparent_70%)] filter blur-3xl pointer-events-none z-0" />

      {/* 2. CỤM NỘI DUNG CHÍNH */}
      <div className="relative z-10 max-w-6xl w-full mx-auto pt-32 pb-20 px-4 flex-grow">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full mb-4">
            <Cookie size={14} className="text-blue-500" />
            <span className="text-xs text-blue-500 font-bold uppercase tracking-wider">Công nghệ lưu trữ</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
            Chính sách <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">Cookie.</span>
          </h1>
          <p className="text-slate-500 text-sm mt-3 font-medium">Cập nhật mới nhất: Tháng 6, 2026</p>
        </div>

        {/* Bi-Column Content layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
          {/* Left Sticky Sidebar */}
          <div className="md:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm md:sticky md:top-28">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-3 mb-3">Phân loại Cookie</p>
            <div className="space-y-1">
              {menuItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSection(idx)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all border-none cursor-pointer text-left ${
                    activeSection === idx 
                      ? "bg-blue-50 text-blue-600 shadow-[inset_3px_0_0_#2563EB]" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span className={activeSection === idx ? "text-blue-600" : "text-slate-400"}>{item.icon}</span>
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
                      <ShieldCheck size={18} className="text-blue-500" /> 1. Cookie kỹ thuật bắt buộc
                    </h2>
                    <p>Đây là nhóm Cookie cốt lõi nhằm mục đích duy trì phiên đăng nhập bảo mật (Session Token) của sinh viên khi di chuyển giữa các phân hệ bên trong nền tảng máy chủ **Amazon EC2**.</p>
                    <p>Nếu bạn tắt nhóm Cookie này, các tính năng yêu cầu bảo mật cao như tải tệp lên AWS S3 hay gọi API chat với Gia sư AI 24/7 sẽ không thể vận hành bình thường.</p>
                  </>
                )}

                {activeSection === 1 && (
                  <>
                    <h2 className="text-slate-900 font-extrabold text-xl pb-2 border-b border-slate-100 flex items-center gap-2">
                      <Settings size={18} className="text-blue-500" /> 2. Cookie tùy chọn trải nghiệm
                    </h2>
                    <p>Nhóm Cookie này ghi nhớ các tùy chọn cá nhân hóa của bạn trên giao diện hệ thống.</p>
                    <p>Ví dụ: Lưu trạng thái của nút gạt **Trả theo tháng / Trả theo năm** tại trang bảng giá, giúp hệ thống hiển thị đúng mệnh giá tiền trong các phiên truy cập tiếp theo mà không cần tải lại dữ liệu liên tục từ hệ thống cơ sở dữ liệu **RDS MySQL**.</p>
                  </>
                )}

                {activeSection === 2 && (
                  <>
                    <h2 className="text-slate-900 font-extrabold text-xl pb-2 border-b border-slate-100 flex items-center gap-2">
                      <EyeOff size={18} className="text-blue-500" /> 3. Cách thức vô hiệu hóa Cookie
                    </h2>
                    <p>Sinh viên hoàn toàn có quyền từ chối hoặc chủ động xóa sạch toàn bộ lịch sử Cookie của SkillSprint thông qua phần Cài đặt nâng cao của các trình duyệt như Chrome, Edge hoặc Safari.</p>
                    <p>Lưu ý: Việc xóa Cookie thiết yếu sẽ làm mất phiên làm việc hiện tại và buộc bạn phải thực hiện đăng nhập lại từ đầu để tiếp tục sử dụng dịch vụ.</p>
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
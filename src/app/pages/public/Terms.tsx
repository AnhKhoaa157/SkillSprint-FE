import React, { useState } from "react";
import { FileText, UserCheck, ShieldAlert, CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
// Đồng bộ cụm import Navbar và Footer sạch sẽ
import { PublicNavbar } from "../../components/layout/PublicNavbar";

export default function Terms() {
  const [activeSection, setActiveSection] = useState(0);

  const menuItems = [
    { title: "1. Đăng ký tài khoản", icon: <UserCheck size={16} /> },
    { title: "2. Quy định Syllabus", icon: <FileText size={16} /> },
    { title: "3. Cơ chế thanh toán", icon: <CreditCard size={16} /> },
    { title: "4. Giới hạn trách nhiệm", icon: <ShieldAlert size={16} /> },
  ];

  return (
    <div className="bg-[#FAFAFA] min-h-screen flex flex-col justify-between relative overflow-x-hidden selection:bg-orange-500/10 selection:text-[#FF6B00]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* 1. THANH ĐIỀU HƯỚNG NAVBAR */}
      <PublicNavbar />

      {/* Background Grid Layer */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,transparent_0%,#FAFAFA_75%)] pointer-events-none z-0" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(255,107,0,0.05)_0%,transparent_70%)] filter blur-3xl pointer-events-none z-0" />

      {/* 2. CỤM NỘI DUNG CHÍNH (pt-32 né Navbar) */}
      <div className="relative z-10 max-w-6xl w-full mx-auto pt-32 pb-20 px-4 flex-grow">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-100 px-3 py-1 rounded-full mb-4">
            <FileText size={14} className="text-purple-600" />
            <span className="text-xs text-purple-600 font-bold uppercase tracking-wider">Thỏa thuận người dùng</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
            Điều khoản <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Sử dụng.</span>
          </h1>
          <p className="text-slate-500 text-sm mt-3 font-medium">Cập nhật mới nhất: Tháng 6, 2026</p>
        </div>

        {/* Bi-Column Content layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
          {/* Left Sticky Sidebar */}
          <div className="md:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm md:sticky md:top-28">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-3 mb-3">Nội dung thỏa thuận</p>
            <div className="space-y-1">
              {menuItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSection(idx)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all border-none cursor-pointer text-left ${
                    activeSection === idx 
                      ? "bg-purple-50 text-purple-600 shadow-[inset_3px_0_0_#9333EA]" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span className={activeSection === idx ? "text-purple-600" : "text-slate-400"}>{item.icon}</span>
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
                      <UserCheck size={18} className="text-purple-600" /> 1. Quyền sở hữu và Đăng ký tài khoản
                    </h2>
                    <p>Khi đăng ký sử dụng SkillSprint, bạn cam kết cung cấp thông tin email sinh viên chính xác và chịu hoàn toàn trách nhiệm bảo mật thông tin mã khóa token hoặc phiên đăng nhập cá nhân của mình.</p>
                    <p>Hệ thống nghiêm cấm hành vi chia sẻ chung tài khoản hoặc khai thác lỗ hổng API nhằm mục đích làm quá tải hạ tầng máy chủ xử lý AI đặt trên nền tảng AWS.</p>
                  </>
                )}

                {activeSection === 1 && (
                  <>
                    <h2 className="text-slate-900 font-extrabold text-xl pb-2 border-b border-slate-100 flex items-center gap-2">
                      <FileText size={18} className="text-purple-600" /> 2. Trách nhiệm tải lên dữ liệu học tập
                    </h2>
                    <p>Sinh viên được toàn quyền sở hữu các tài liệu, syllabus môn học tải lên bộ lưu trữ **Amazon S3** của hệ thống. Bạn phải bảo đảm tài liệu tải lên không vi phạm bản quyền nghiêm trọng hoặc chứa mã độc phá hoại cấu trúc trang web.</p>
                    <p>Hệ thống có quyền tự động hủy hoặc xóa bỏ các tệp tin chứa dữ liệu rác, nội dung không đúng định dạng sư phạm mà không cần thông báo trước để giải phóng tài nguyên đám mây.</p>
                  </>
                )}

                {activeSection === 2 && (
                  <>
                    <h2 className="text-slate-900 font-extrabold text-xl pb-2 border-b border-slate-100 flex items-center gap-2">
                      <CreditCard size={18} className="text-purple-600" /> 3. Cơ chế đăng ký gói cước dịch vụ
                    </h2>
                    <p>SkillSprint vận hành theo mô hình đăng ký gói cước dịch vụ định kỳ theo Tháng hoặc theo Năm cho gói Builder và Premium.</p>
                    <div className="bg-orange-50/50 border border-orange-200 rounded-xl p-4 text-xs font-semibold text-slate-800">
                      ⚠️ CHÍNH SÁCH CHẶN HẠ CẤP: Hệ thống cho phép nâng cấp tài khoản ngay lập tức. Tuy nhiên, hệ thống hoàn toàn không hỗ trợ hoàn tiền hoặc hạ cấp gói dịch vụ khi đang nằm trong chu kỳ thanh toán đã kích hoạt.
                    </div>
                  </>
                )}

                {activeSection === 3 && (
                  <>
                    <h2 className="text-slate-900 font-extrabold text-xl pb-2 border-b border-slate-100 flex items-center gap-2">
                      <ShieldAlert size={18} className="text-purple-600" /> 4. Giới hạn trách nhiệm hạ tầng đám mây
                    </h2>
                    <p>Chúng tôi đảm bảo tỷ lệ hoạt động của hệ thống (Uptime) ở mức tối đa nhờ cơ chế co giãn tự động trên máy chủ **Amazon EC2** và cơ sở dữ liệu **Amazon RDS**.</p>
                    <p>Tuy nhiên, trong các điều kiện bất khả kháng do sự cố đường truyền cáp quang quốc tế hoặc lịch bảo trì từ nhà cung cấp AWS, SkillSprint được miễn trừ trách nhiệm đối với việc gián đoạn xử lý lộ trình học tập tạm thời.</p>
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
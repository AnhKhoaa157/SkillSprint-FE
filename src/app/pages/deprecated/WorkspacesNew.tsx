import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { Sparkles, ArrowLeft, LayoutGrid, Construction } from "lucide-react";

export default function WorkspacesNew() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-md w-full bg-white rounded-3xl border border-slate-100 p-8 shadow-xl shadow-slate-100/40 text-center relative overflow-hidden"
      >
        {/* Decorative background glows */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col items-center font-sans">
          {/* Animated Icon Container */}
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-3xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF6B00]">
              <LayoutGrid size={40} className="stroke-[1.8]" />
            </div>
            {/* Corner Badge */}
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-xl p-1.5 border-2 border-white shadow-sm flex items-center justify-center">
              <Construction size={14} className="stroke-[2.5]" />
            </div>
          </div>

          {/* Tag */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-[#FF6B00] text-xs font-bold border border-orange-100/60 mb-4 uppercase tracking-wider">
            <Sparkles size={12} className="animate-pulse" />
            Tính năng đang phát triển
          </span>

          {/* Heading */}
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-3">
            Trang Tạo Workspace Mới
          </h1>

          {/* Description */}
          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            Trang tạo workspace chi tiết với đầy đủ cấu trúc đang được phát triển. Vui lòng sử dụng tính năng tạo nhanh ngay trên trang quản lý Workspace để tiếp tục!
          </p>

          {/* Action Button */}
          <button
            onClick={() => navigate("/app/workspaces")}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF6B00] to-orange-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/15 hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
          >
            <ArrowLeft size={16} className="stroke-[2.2]" />
            Quay lại Workspaces
          </button>
        </div>
      </motion.div>
    </div>
  );
}

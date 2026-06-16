import React, { useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Hammer, FileText, ChevronDown } from "lucide-react";
import { F } from "./AuthShared";

function LeftPanel() {
  return (
    <div className="hidden lg:flex h-screen w-[50%] flex-col px-12 pt-16 pb-4 xl:px-20 relative overflow-hidden flex-shrink-0 bg-[#F4EFE6] bg-[url('/assets/pannel/Pannel.png')] bg-[length:100%_100%] bg-center bg-no-repeat">
    </div>
  );
}

function MaintenanceDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute top-6 right-6 z-[999] flex flex-col items-end">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center gap-2.5 px-3 py-2 rounded-full transition-all duration-300 cursor-pointer border ${
          isOpen
            ? "bg-orange-50/80 border-orange-200 shadow-inner"
            : "bg-white border-slate-200 shadow-sm hover:border-orange-300 hover:shadow-[0_4px_16px_rgba(255,107,0,0.12)] hover:-translate-y-0.5"
        }`}
      >
        <div className={`flex items-center justify-center p-1.5 rounded-full transition-colors duration-300 ${isOpen ? "bg-[#FF6B00] text-white shadow-sm shadow-orange-500/30" : "bg-orange-100/70 text-[#FF6B00] group-hover:bg-[#FF6B00] group-hover:text-white"}`}>
          <FileText className="w-3.5 h-3.5" />
        </div>
        <span className={`text-[11px] font-extrabold uppercase tracking-wide transition-colors duration-300 ${isOpen ? "text-[#FF6B00]" : "text-slate-600 group-hover:text-slate-800"}`}>
          Nhật ký bảo trì
        </span>
        <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-300 ${isOpen ? "rotate-180 text-[#FF6B00]" : "text-slate-400 group-hover:text-orange-400"}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-80 flex flex-col items-center justify-center text-center p-6 bg-white rounded-3xl border border-orange-100 shadow-2xl shadow-orange-900/10 origin-top-right"
          >
            <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center mb-4 ring-4 ring-orange-50/50">
              <Hammer className="h-6 w-6 text-[#FF6B00]" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-800 mb-2 tracking-tight">Tính năng đang phát triển</h2>
            <p className="text-slate-500 leading-relaxed text-xs">
              Phân hệ này hiện đang trong quá trình nâng cấp và bảo trì để mang lại trải nghiệm tốt nhất cho bạn. Vui lòng quay lại sau!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen min-h-screen flex w-full overflow-hidden bg-white font-sans" style={{ fontFamily: F }}>
      <motion.div
        key="normal-auth-ui"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex min-h-screen w-full"
      >
        <LeftPanel />
        <div className="h-screen min-h-screen w-full lg:w-[50%] flex flex-col bg-white overflow-hidden relative">
          <MaintenanceDropdown />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", padding: "20px 32px" }}>
            <Link to="/" style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.8rem", color: "#6B7280", textDecoration: "none", fontFamily: F, transition: "color 0.2s ease" }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#111827"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#6B7280"; }}
            >
              <ArrowLeft size={14} />
              Về trang chủ
            </Link>
          </div>
          <div className="w-full max-w-[390px] mx-auto px-4 py-8 flex flex-1 flex-col justify-center min-h-0 relative z-10">
            <div className="w-full">
              {children}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

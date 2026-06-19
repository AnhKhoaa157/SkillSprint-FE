import React, { useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Hammer, FileText, ChevronDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import { F } from "./AuthShared";
import { useMaintenance } from "../../../../components/system/MaintenanceGate";

function LeftPanel() {
  return (
    <div className="hidden lg:flex h-screen w-[50%] flex-col px-12 pt-16 pb-4 xl:px-20 relative overflow-hidden flex-shrink-0 bg-[#F4EFE6] bg-[url('/assets/pannel/Pannel.png')] bg-cover bg-center bg-no-repeat">
    </div>
  );
}

function MaintenanceBannerPill() {
  const { status } = useMaintenance();

  let hasUpcoming = false;
  let scheduleText = "Hệ thống hoạt động bình thường. Hiện tại không có lịch bảo trì nào được lên kế hoạch.";
  
  if (status && status.isActive) {
    hasUpcoming = true;
    const end = status.endAt ? new Date(status.endAt) : null;
    const endLabel = end && !Number.isNaN(end.getTime()) ? end.toLocaleString("vi-VN") : null;
    scheduleText = `Hệ thống đang được bảo trì${endLabel ? `, dự kiến hoàn thành lúc ${endLabel}` : ""}. Vui lòng quay lại sau.`;
  } else if (status && !status.isActive && status.startAt) {
    const start = new Date(status.startAt);
    const msUntilStart = start.getTime() - Date.now();
    if (msUntilStart > 0) {
      hasUpcoming = true;
      const startLabel = start.toLocaleString("vi-VN");
      const end = status.endAt ? new Date(status.endAt) : null;
      const endLabel = end && !Number.isNaN(end.getTime()) ? end.toLocaleString("vi-VN") : null;
      scheduleText = `Cảnh báo: Hệ thống sẽ bảo trì từ ${startLabel}${endLabel ? ` đến ${endLabel}` : ""}. Vui lòng sắp xếp thời gian lưu dữ liệu của bạn.`;
    }
  }

  if (!hasUpcoming) return null;

  return (
    <div className="absolute top-6 right-6 z-[999]">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-[340px] flex items-center gap-3 p-3 bg-white rounded-2xl border border-orange-100 shadow-xl shadow-orange-900/5 overflow-hidden"
      >
        <div className="flex items-center justify-center shrink-0 w-9 h-9 rounded-full bg-amber-100 text-amber-600">
           <AlertTriangle className="w-4 h-4" />
        </div>
        
        <div className="flex-1 overflow-hidden relative">
          <div 
            className="whitespace-nowrap flex w-fit" 
            style={{ animation: "marquee 15s linear infinite" }}
          >
            <span className="pr-8 text-amber-900 text-[12px] font-medium leading-tight tracking-tight">{scheduleText}</span>
            <span className="pr-8 text-amber-900 text-[12px] font-medium leading-tight tracking-tight" aria-hidden="true">{scheduleText}</span>
          </div>
          <style>{`
            @keyframes marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            @media (prefers-reduced-motion: reduce) {
              .whitespace-nowrap.flex.w-fit {
                animation: none !important;
                transform: none !important;
                flex-wrap: wrap !important;
              }
              .pr-8:nth-child(2) {
                display: none;
              }
              .pr-8 {
                white-space: normal;
                padding-right: 0 !important;
              }
            }
          `}</style>
        </div>
      </motion.div>
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
        <div className="h-screen min-h-screen w-full lg:w-[50%] flex flex-col bg-[#FAF9F6] overflow-hidden relative">
          {/* Ambient Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f033_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f033_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none z-0 opacity-60" />
          
          {/* Ambient Background Glows */}
          <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-orange-500/8 to-amber-500/3 blur-[120px] pointer-events-none z-0" />
          <div className="absolute bottom-[10%] left-[-5%] w-[350px] h-[350px] rounded-full bg-gradient-to-br from-[#FF6B00]/4 to-orange-400/2 blur-[100px] pointer-events-none z-0" />
          <div className="absolute top-[40%] right-[20%] w-[250px] h-[250px] rounded-full bg-amber-500/3 blur-[80px] pointer-events-none z-0" />

          <MaintenanceBannerPill />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", padding: "20px 32px" }} className="relative z-10">
            <Link to="/" className="flex items-center gap-1.5 text-xs text-slate-400 no-underline transition-colors hover:text-slate-900">
              <ArrowLeft size={14} />
              Về trang chủ
            </Link>
          </div>
          <div className="w-full max-w-[480px] mx-auto px-4 py-8 flex flex-1 flex-col justify-center min-h-0 relative z-10">
            <div className="w-full bg-white/85 backdrop-blur-xl rounded-[32px] border border-white/60 shadow-[0_0_0_1px_rgba(0,0,0,0.01),0_10px_30px_-10px_rgba(0,0,0,0.04),0_35px_70px_-15px_rgba(255,107,0,0.06),0_50px_100px_-20px_rgba(0,0,0,0.02)] px-6 py-9 md:px-9 md:py-11 relative overflow-hidden">
              {/* Top Accent Gradient Bar */}
              <div className="absolute top-0 left-0 right-0 h-[3.5px] bg-gradient-to-r from-[#FFAC75] via-[#FF8533] to-[#FF6A00]" />
              {children}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

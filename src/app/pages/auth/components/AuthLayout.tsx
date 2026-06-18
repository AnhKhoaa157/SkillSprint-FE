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

/** ISO-8601 → separate { date, time } parts so they can be rendered on distinct lines. */
function splitDateTime(value: string | null | undefined): { date: string; time: string } | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return {
    date: d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }),
    time: d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
  };
}

function MaintenanceBannerPill() {
  const { status } = useMaintenance();

  let hasUpcoming = false;
  let scheduleContent: React.ReactNode = null;

  if (status && status.isActive) {
    hasUpcoming = true;
    const end = splitDateTime(status.endAt);
    // Date and time are broken onto two lines so the timestamp never crowds the
    // surrounding copy or merges into an unreadable string.
    scheduleContent = (
      <>
        Hệ thống đang được bảo trì
        {end ? (
          <>
            , dự kiến hoàn thành vào ngày <span className="font-bold">{end.date}</span>
            <br />
            lúc <span className="font-bold">{end.time}</span>.
          </>
        ) : (
          "."
        )}{" "}
        Vui lòng quay lại sau.
      </>
    );
  } else if (status && !status.isActive && status.startAt) {
    const start = new Date(status.startAt);
    const msUntilStart = start.getTime() - Date.now();
    if (msUntilStart > 0) {
      hasUpcoming = true;
      const startParts = splitDateTime(status.startAt);
      const endParts = splitDateTime(status.endAt);
      scheduleContent = (
        <>
          Cảnh báo: Hệ thống sẽ bảo trì
          {startParts && (
            <>
              {" "}từ ngày <span className="font-bold">{startParts.date}</span>
              <br />
              lúc <span className="font-bold">{startParts.time}</span>
            </>
          )}
          {endParts && (
            <>
              {" "}đến ngày <span className="font-bold">{endParts.date}</span>
              <br />
              lúc <span className="font-bold">{endParts.time}</span>
            </>
          )}
          . Vui lòng sắp xếp thời gian lưu dữ liệu của bạn.
        </>
      );
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
            <span className="pr-8 text-amber-900 text-[12px] font-medium leading-snug tracking-tight">{scheduleContent}</span>
            <span className="pr-8 text-amber-900 text-[12px] font-medium leading-snug tracking-tight" aria-hidden="true">{scheduleContent}</span>
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
        <div className="h-screen min-h-screen w-full lg:w-[50%] flex flex-col bg-white overflow-hidden relative">
          <MaintenanceBannerPill />
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

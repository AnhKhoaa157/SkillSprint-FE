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

/**
 * ISO-8601 → "dd/MM/yyyy lúc HH:mm" as ONE atomic string. Rendered inside a
 * `whitespace-nowrap` wrapper so the date/time never fractures across lines
 * (e.g. the hour splitting away from the minutes).
 */
function formatDateTime(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const date = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  return `${date} lúc ${time}`;
}

function MaintenanceBannerPill() {
  const { status } = useMaintenance();

  let hasUpcoming = false;
  let scheduleContent: React.ReactNode = null;

  if (status && status.isActive) {
    hasUpcoming = true;
    const end = formatDateTime(status.endAt);
    scheduleContent = (
      <div className="space-y-1">
        <p className="font-bold">Hệ thống đang được bảo trì</p>
        {end && (
          <ul className="space-y-0.5">
            <li className="flex gap-1.5">
              <span aria-hidden="true">•</span>
              <span>
                Dự kiến hoàn thành:{" "}
                <strong className="whitespace-nowrap font-bold">{end}</strong>
              </span>
            </li>
          </ul>
        )}
        <p>Vui lòng quay lại sau.</p>
      </div>
    );
  } else if (status && !status.isActive && status.startAt) {
    const start = new Date(status.startAt);
    const msUntilStart = start.getTime() - Date.now();
    if (msUntilStart > 0) {
      hasUpcoming = true;
      const startLabel = formatDateTime(status.startAt);
      const endLabel = formatDateTime(status.endAt);
      scheduleContent = (
        <div className="space-y-1">
          <p className="font-bold">Hệ thống sẽ bảo trì:</p>
          <ul className="space-y-0.5">
            {startLabel && (
              <li className="flex gap-1.5">
                <span aria-hidden="true">•</span>
                <span>
                  Từ ngày: <strong className="whitespace-nowrap font-bold">{startLabel}</strong>
                </span>
              </li>
            )}
            {endLabel && (
              <li className="flex gap-1.5">
                <span aria-hidden="true">•</span>
                <span>
                  Đến ngày: <strong className="whitespace-nowrap font-bold">{endLabel}</strong>
                </span>
              </li>
            )}
          </ul>
          <p>Vui lòng sắp xếp thời gian lưu dữ liệu của bạn!</p>
        </div>
      );
    }
  }

  if (!hasUpcoming) return null;

  return (
    <div className="absolute top-6 right-6 z-[999]">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-[340px] flex items-start gap-3 py-3 px-4 bg-white rounded-2xl border border-orange-100 shadow-xl shadow-orange-900/5"
      >
        <div className="flex items-center justify-center shrink-0 w-9 h-9 rounded-full bg-amber-100 text-amber-600">
           <AlertTriangle className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0 text-amber-900 text-[12px] font-medium leading-relaxed tracking-tight">
          {scheduleContent}
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

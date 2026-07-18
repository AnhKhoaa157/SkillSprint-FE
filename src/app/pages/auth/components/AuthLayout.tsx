import React from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { F } from "./AuthShared";
import { useMaintenance } from "../../../../components/system/MaintenanceGate";

function LeftPanel() {
  return (
    <section
      aria-label="Hành trình học tập SkillSprint"
      className="relative hidden h-full w-[47%] shrink-0 overflow-hidden border-r border-slate-200/80 bg-[#eef2f7] bg-[url('/assets/pannel/Pannel.png')] bg-cover bg-center bg-no-repeat lg:block"
    >
      <div className="absolute inset-y-[-8%] right-[-116px] w-[180px] rounded-l-[55%] bg-[#fbfaf7]/70 shadow-[-20px_0_50px_rgba(255,255,255,0.25)]" aria-hidden="true" />

      <div className="absolute bottom-8 left-8 right-16 z-10 rounded-3xl border border-white/80 bg-white/75 px-6 py-5 shadow-[0_20px_50px_rgba(15,23,42,0.1)] backdrop-blur-xl xl:bottom-10 xl:left-10 xl:right-20">
        <h2 className="text-[26px] font-black tracking-[-0.04em] text-slate-900">
          Học thông minh. Tiến xa hơn.
        </h2>
        <p className="mt-1.5 text-sm font-medium leading-relaxed text-slate-500">
          Biến mục tiêu thành một hành trình học tập rõ ràng và đầy cảm hứng.
        </p>
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Lợi ích nổi bật">
          {["AI cá nhân hóa", "Lộ trình rõ ràng", "Tiến bộ mỗi ngày"].map((benefit) => (
            <span
              key={benefit}
              className="inline-flex min-h-8 items-center gap-2 rounded-full border border-orange-200 bg-orange-50/90 px-3 text-[11px] font-extrabold text-orange-800"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B00] shadow-[0_0_0_4px_rgba(255,107,0,0.1)]" aria-hidden="true" />
              {benefit}
            </span>
          ))}
        </div>
      </div>
    </section>
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
    <div className="flex h-[100dvh] min-h-[720px] w-full overflow-hidden bg-white font-sans" style={{ fontFamily: F }}>
      <motion.div
        key="normal-auth-ui"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex h-full w-full"
      >
        <LeftPanel />
        <section className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#fbfaf7] lg:w-[53%]">
          <style>{`
            @media (min-width: 1024px) and (max-height: 820px) {
              .auth-topbar { height: 72px; }
              .auth-topbar-logo { width: 60px; height: 60px; }
              .auth-card-region { padding-top: 0; padding-bottom: 8px; }
              .auth-card-surface { min-height: 0; padding-top: 24px; padding-bottom: 24px; }
              .auth-register-title { margin-top: 12px; margin-bottom: 12px; }
              .auth-register-google { height: 46px; }
              .auth-register-divider { margin-top: 10px; margin-bottom: 10px; }
              .auth-register-fields { gap: 8px; }
              .auth-register-form .auth-input-label-row { min-height: 16px; }
              .auth-register-form .auth-input-shell { height: 48px; }
              .auth-register-trust { margin-top: 8px; }
              .auth-register-footer { margin-top: 4px; }
            }
          `}</style>
          <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(to_right,rgba(226,232,240,0.32)_1px,transparent_1px),linear-gradient(to_bottom,rgba(226,232,240,0.32)_1px,transparent_1px)] bg-[size:22px_22px]" aria-hidden="true" />
          <div className="pointer-events-none absolute right-[-4%] top-[18%] z-0 select-none text-[330px] font-black leading-none text-[#FF6B00]/[0.055]" aria-hidden="true">S</div>
          <div className="pointer-events-none absolute bottom-[-145px] right-[-128px] z-0 h-[300px] w-[300px] rotate-45 bg-gradient-to-br from-[#FF6B00] to-[#FF9A4D] shadow-[0_0_0_18px_rgba(255,107,0,0.07)]" aria-hidden="true" />
          <div className="pointer-events-none absolute right-[-10%] top-[-10%] z-0 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-orange-500/8 to-amber-500/3 blur-[120px]" aria-hidden="true" />

          <MaintenanceBannerPill />
          <div className="relative z-10 flex h-full min-h-0 flex-col overflow-x-hidden overflow-y-auto">
            <header className="auth-topbar mx-auto flex h-[104px] w-full max-w-[570px] shrink-0 items-center justify-between px-4 sm:px-0">
              <Link to="/" aria-label="Về trang chủ SkillSprint" className="rounded-xl outline-none ring-[#FF6B00]/30 focus-visible:ring-4">
                <img src="/logo.png" alt="SkillSprint" className="auth-topbar-logo block h-[78px] w-[78px] object-contain" />
              </Link>
              <Link to="/" className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-[13px] font-bold text-slate-700 no-underline transition-colors hover:bg-white/70 hover:text-[#EA580C] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF6B00]/20">
                <ArrowLeft size={15} aria-hidden="true" />
                Về trang chủ
              </Link>
            </header>

            <div className="auth-card-region mx-auto flex w-full max-w-[602px] flex-1 items-center px-4 pb-10 pt-4">
              <div className="relative w-full before:absolute before:inset-x-[-12px] before:bottom-[-12px] before:top-[14px] before:translate-x-[14px] before:rounded-[34px] before:border before:border-[#FF6B00]/15 before:bg-gradient-to-br before:from-[#FF6B00]/10 before:to-white/75">
                <div className="auth-card-surface relative min-h-[660px] w-full overflow-hidden rounded-[34px] border border-[#FF6B00]/35 border-l-4 border-t-[3px] border-l-[#FF6B00] border-t-[#FF6B00] bg-white/95 px-6 py-9 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:px-11 sm:pb-9 sm:pt-10">
                  <div className="pointer-events-none absolute right-[-48px] top-[-48px] h-[150px] w-[150px] rounded-full border-[20px] border-[#FF6B00]/5" aria-hidden="true" />
                  {children}
                </div>
              </div>
            </div>
          </div>
        </section>
      </motion.div>
    </div>
  );
}

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
      className="relative hidden w-1/2 shrink-0 self-stretch overflow-hidden border-r border-slate-200/70 bg-[#eef2f7] lg:block"
    >
      <img
        src="/assets/pannel/Pannel.png"
        alt="Không gian học tập đa lĩnh vực của SkillSprint"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-slate-950/10" aria-hidden="true" />
      <motion.div
        className="pointer-events-none absolute -left-1/3 top-[18%] h-[38%] w-[40%] rotate-12 bg-gradient-to-r from-transparent via-white/35 to-transparent blur-2xl"
        animate={{ x: [0, 760] }}
        transition={{ duration: 8, repeat: Infinity, repeatDelay: 5, ease: "easeInOut" }}
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-6 left-6 right-6 z-10 mx-auto max-w-[590px] overflow-hidden rounded-[22px] border border-white bg-white/[0.94] py-4 pl-5 pr-[112px] shadow-[0_20px_50px_rgba(51,65,85,0.14),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-xl xl:bottom-8 xl:pr-[128px]"
      >
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#FF6B00]/70 to-transparent" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-[-38px] right-[-24px] h-[160px] w-[160px] rounded-full bg-gradient-to-br from-orange-100/80 via-amber-50/60 to-transparent" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-3 right-3 flex h-[104px] w-[94px] items-center justify-center rounded-[20px] border border-orange-200/60 bg-white/55 shadow-[0_14px_30px_rgba(234,88,12,0.1),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md xl:h-[112px] xl:w-[102px]" aria-hidden="true">
          <svg viewBox="0 0 96 104" className="h-[88px] w-[80px]" fill="none">
            <circle cx="48" cy="52" r="38" stroke="#FED7AA" strokeWidth="1.5" strokeDasharray="3 5" />
            <path d="M18 78C28 72 28 61 39 57C51 52 51 40 62 35C72 31 75 23 82 17" stroke="#F97316" strokeWidth="3" strokeLinecap="round" />
            <circle cx="18" cy="78" r="5" fill="#FFF7ED" stroke="#FB923C" strokeWidth="2" />
            <circle cx="40" cy="56" r="5" fill="#FFF7ED" stroke="#FB923C" strokeWidth="2" />
            <circle cx="63" cy="35" r="5" fill="#FFF7ED" stroke="#FB923C" strokeWidth="2" />
            <path d="M82 9L84.7 14.5L91 15.4L86.5 19.8L87.6 26L82 23L76.4 26L77.5 19.8L73 15.4L79.3 14.5L82 9Z" fill="#F97316" />
            <path d="M14 91H82" stroke="#E2E8F0" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M22 91V86M42 91V82M62 91V77M78 91V70" stroke="#FDBA74" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>

        <p className="mb-1.5 text-[9px] font-extrabold uppercase tracking-[0.17em] text-[#EA580C]">
          Học đúng trọng tâm
        </p>
        <h2 className="text-[20px] font-black leading-tight tracking-[-0.04em] text-slate-950 xl:text-[21px]">
          Học thông minh. Tiến xa hơn.
        </h2>
        <p className="mt-1 max-w-[48ch] text-[11.5px] font-medium leading-relaxed text-slate-600 xl:text-xs">
          Biến mục tiêu thành một hành trình học tập rõ ràng và đầy cảm hứng.
        </p>
        <div className="mt-3 flex flex-wrap gap-x-3.5 gap-y-1.5 border-t border-slate-200/70 pt-2.5" aria-label="Lợi ích nổi bật">
          {["AI cá nhân hóa", "Lộ trình rõ ràng", "Tiến bộ mỗi ngày"].map((benefit) => (
            <span
              key={benefit}
              className="inline-flex min-h-5 items-center gap-1.5 text-[9.5px] font-extrabold text-slate-700 xl:text-[10px]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B00] shadow-[0_0_0_3px_rgba(255,107,0,0.1)]" aria-hidden="true" />
              {benefit}
            </span>
          ))}
        </div>
      </motion.div>
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
    <div className="flex min-h-[100dvh] w-full overflow-hidden bg-white font-sans" style={{ fontFamily: F }}>
      <motion.div
        key="normal-auth-ui"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex min-h-[100dvh] w-full"
      >
        <LeftPanel />
        <section className="relative flex min-h-[100dvh] w-full flex-col overflow-hidden bg-[#fbfaf7] lg:w-1/2">
          <style>{`
            @media (min-width: 1024px) and (max-height: 820px) {
              .auth-topbar { height: 76px; }
              .auth-topbar-logo { width: 62px; height: 62px; }
              .auth-card-region { padding-top: 0; padding-bottom: 12px; }
              .auth-card-surface { padding-top: 22px; padding-bottom: 22px; }
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
          <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(to_right,rgba(226,232,240,0.24)_1px,transparent_1px),linear-gradient(to_bottom,rgba(226,232,240,0.24)_1px,transparent_1px)] bg-[size:24px_24px]" aria-hidden="true" />
          <div className="pointer-events-none absolute left-[-18%] top-[-18%] z-0 h-[420px] w-[420px] rounded-full bg-orange-200/20 blur-[110px]" aria-hidden="true" />
          <div className="pointer-events-none absolute bottom-[-18%] right-[-16%] z-0 h-[420px] w-[420px] rounded-full bg-amber-200/20 blur-[120px]" aria-hidden="true" />

          <MaintenanceBannerPill />
          <div className="relative z-10 flex min-h-[100dvh] flex-col overflow-x-hidden overflow-y-auto">
            <header className="auth-topbar mx-auto flex h-[92px] w-full max-w-[590px] shrink-0 items-center justify-between px-5 sm:px-0">
              <Link to="/" aria-label="Về trang chủ SkillSprint" className="rounded-xl outline-none ring-[#FF6B00]/30 focus-visible:ring-4">
                <img src="/logo.png" alt="SkillSprint" className="auth-topbar-logo block h-[72px] w-[72px] object-contain" />
              </Link>
              <Link to="/" className="flex min-h-10 items-center gap-2 rounded-xl px-3 text-[12px] font-bold text-slate-600 no-underline transition-colors hover:bg-white/80 hover:text-[#EA580C] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF6B00]/20">
                <ArrowLeft size={15} aria-hidden="true" />
                Về trang chủ
              </Link>
            </header>

            <div className="auth-card-region mx-auto flex w-full max-w-[590px] flex-1 items-center px-5 pb-7 pt-1 sm:px-0 lg:-translate-y-6">
              <div className="auth-card-surface relative w-full overflow-hidden rounded-[26px] border border-slate-200/90 bg-white/95 px-6 py-7 shadow-[0_24px_70px_rgba(30,41,59,0.1),0_2px_8px_rgba(30,41,59,0.04)] backdrop-blur-xl sm:px-10 sm:py-9">
                <div className="pointer-events-none absolute inset-x-10 top-0 h-[3px] rounded-b-full bg-gradient-to-r from-transparent via-[#FF6B00] to-transparent opacity-90" aria-hidden="true" />
                <div className="pointer-events-none absolute right-[-54px] top-[-58px] h-[140px] w-[140px] rounded-full bg-orange-100/55 blur-sm" aria-hidden="true" />
                {children}
              </div>
            </div>
          </div>
        </section>
      </motion.div>
    </div>
  );
}

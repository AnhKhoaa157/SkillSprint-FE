import React from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { F } from "./AuthShared";

const GLOBE = { cx: 465, cy: 375, r: 115 };
const ORBIT_A = "M 645.8 301.95 A 195 72 -22 1 1 284.2 448.05 A 195 72 -22 1 1 645.8 301.95";
const ORBIT_B = "M 609.2 416.34 A 150 95 16 1 1 320.8 333.66 A 150 95 16 1 1 609.2 416.34";

function OrbitRing({
  path, dur, behindDelay,
}: { path: string; dur: number; behindDelay: number }) {
  return (
    <>
      <path d={path} fill="none" className="stroke-[#FF6B00]/15" strokeWidth={1.5} />
      <g mask="url(#globeMask)">
        <circle r={11} className="fill-[#FF6B00]/30" filter="url(#softBlur)">
          <animateMotion dur={`${dur}s`} begin={`-${behindDelay}s`} repeatCount="indefinite" path={path} />
        </circle>
      </g>
      <circle r={9} className="fill-[#FF6B00]/25" filter="url(#softBlur)">
        <animateMotion dur={`${dur}s`} repeatCount="indefinite" path={path} />
      </circle>
      <circle r={4} className="fill-[#FF6B00] drop-shadow-[0_0_8px_#FF6B00]">
        <animateMotion dur={`${dur}s`} repeatCount="indefinite" path={path} />
      </circle>
    </>
  );
}

function GlobeOrbit3D() {
  return (
    <div className="absolute left-0 top-0 h-full w-auto aspect-[932/699] pointer-events-none z-0">
      <svg viewBox="0 0 932 699" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="softBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <filter id="coreGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="26" />
          </filter>
          <mask id="globeMask" maskUnits="userSpaceOnUse" x="0" y="0" width="932" height="699">
            <rect x="0" y="0" width="932" height="699" fill="black" />
            <circle cx={GLOBE.cx} cy={GLOBE.cy} r={GLOBE.r + 4} fill="white" filter="url(#softBlur)" />
          </mask>
        </defs>

        <circle cx={GLOBE.cx} cy={GLOBE.cy} r={118} className="fill-[#FF6B00]/10" filter="url(#coreGlow)">
          <animate attributeName="opacity" values="0.45;0.9;0.45" dur="5s" repeatCount="indefinite" />
        </circle>

        <OrbitRing path={ORBIT_A} dur={7} behindDelay={3.5} />
        <OrbitRing path={ORBIT_B} dur={9} behindDelay={4.5} />
      </svg>
    </div>
  );
}

function LeftPanel() {
  return (
    <div className="hidden lg:flex h-screen w-[60%] flex-col px-12 pt-16 pb-4 xl:px-20 relative overflow-hidden flex-shrink-0 bg-[#F4EFE6] bg-[url('/assets/pannel/Pannel.png')] bg-[length:auto_100%] bg-left bg-no-repeat">
      <GlobeOrbit3D />
      <img
        src="/logo.png"
        alt="SkillSprint"
        className="absolute top-6 left-6 md:top-10 md:left-10 z-20 h-16 md:h-20 w-auto object-contain drop-shadow-[0_6px_16px_rgba(0,0,0,0.22)]"
      />
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
        <div className="h-screen min-h-screen w-full lg:w-[40%] flex flex-col bg-white overflow-hidden relative">
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

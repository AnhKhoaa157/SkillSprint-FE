import { Zap } from "lucide-react";

export interface DynamicXpBadgeProps {
  points: number;
  className?: string;
  onClick?: () => void;
  title?: string;
  "aria-label"?: string;
}

export function DynamicXpBadge({ points, className = "", onClick, title, "aria-label": ariaLabel }: DynamicXpBadgeProps) {
  const isUltimate = points >= 500000;
  const isMaster = points >= 50000 && points < 500000;
  const isPro = points >= 5000 && points < 50000;

  if (isUltimate) {
    const Component = onClick ? "button" : "div";
    return (
      <Component
        type={onClick ? "button" : undefined}
        onClick={onClick}
        title={title}
        aria-label={ariaLabel}
        className={`group relative inline-flex items-center justify-center p-[1.5px] rounded-full overflow-hidden shadow-[0_0_12px_rgba(255,107,0,0.2)] motion-reduce:transition-none ${
          onClick ? "transition-all duration-300 hover:scale-[1.05] active:scale-95 cursor-pointer motion-reduce:hover:scale-100" : ""
        } ${className}`}
      >
        <style>
          {`
            @keyframes plasma-spin {
              100% { transform: translate(-50%, -50%) rotate(360deg); }
            }
            .plasma-border {
              position: absolute;
              top: 50%;
              left: 50%;
              width: 250%;
              height: 400%;
              background: conic-gradient(from 90deg, transparent 0%, transparent 60%, #ff8c00 80%, #fff 100%);
              transform: translate(-50%, -50%) rotate(0deg);
              animation: plasma-spin 2.5s linear infinite;
              z-index: 0;
            }
            @media (prefers-reduced-motion: reduce) {
              .plasma-border {
                animation: none !important;
                background: #ff8c00 !important;
              }
            }
          `}
        </style>
        <div className="plasma-border" />
        
        <div className="relative z-10 flex items-center gap-1.5 bg-[#0F172A] rounded-full px-2.5 py-1 w-full h-full group-hover:bg-[#1E293B] transition-colors">
          <Zap size={12} className="shrink-0 fill-orange-500/20 text-orange-400 drop-shadow-[0_0_5px_rgba(255,135,0,0.8)]" />
          <span className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-orange-400 to-amber-300">
            {points.toLocaleString("vi-VN")} <span className="text-[9px] font-bold text-orange-500/80 uppercase">XP</span>
          </span>
        </div>
      </Component>
    );
  }

  let baseClass = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-extrabold shadow-sm motion-reduce:transition-none";
  let iconClass = "shrink-0";

  if (isMaster) {
    baseClass += " bg-gradient-to-r from-cyan-50 to-blue-50 text-blue-700 border border-blue-200 shadow-md";
    iconClass += " fill-blue-500";
  } else if (isPro) {
    baseClass += " bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border border-amber-300";
    iconClass += " fill-amber-500";
  } else {
    baseClass += " bg-orange-50 border border-[#FF6B00]/25 text-[#FF6B00]";
    iconClass += " fill-[#FF6B00]";
  }

  if (onClick) {
    baseClass += " transition-all duration-300 hover:scale-[1.05] active:scale-95 cursor-pointer motion-reduce:hover:scale-100";
  }

  const Component = onClick ? "button" : "div";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      className={`${baseClass} ${className}`}
    >
      <Zap size={12} className={iconClass} />
      {points.toLocaleString("vi-VN")} XP
    </Component>
  );
}

export default DynamicXpBadge;

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
        className={`group relative inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black motion-reduce:transition-none gold-ultimate-bg border border-amber-300/50 ${
          onClick ? "transition-all duration-300 hover:scale-[1.05] active:scale-95 cursor-pointer motion-reduce:hover:scale-100" : ""
        } ${className}`}
      >
        <style>
          {`
            @keyframes shimmerGold {
              0% { background-position: -200% center; }
              100% { background-position: 200% center; }
            }
            .gold-ultimate-bg {
              background: linear-gradient(
                110deg, 
                #FBBF24 0%, 
                #F59E0B 30%, 
                #FEF08A 50%, 
                #F59E0B 70%, 
                #D97706 100%
              );
              background-size: 250% auto;
              animation: shimmerGold 3s linear infinite;
              box-shadow: 
                inset 0 2px 3px rgba(255, 255, 255, 0.7), 
                inset 0 -2px 3px rgba(180, 83, 9, 0.6),
                0 4px 12px rgba(245, 158, 11, 0.35);
            }
            @media (prefers-reduced-motion: reduce) {
              .gold-ultimate-bg {
                animation: none !important;
                background-size: auto !important;
              }
            }
          `}
        </style>
        <Zap size={12} className="shrink-0 fill-amber-700 text-amber-900 drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]" />
        <span className="text-amber-900 font-black tracking-tight drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
          {points.toLocaleString("vi-VN")} <span className="text-[9px] uppercase font-bold text-amber-800/90 tracking-normal">XP</span>
        </span>
      </Component>
    );
  }

  let baseClass = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black shadow-sm motion-reduce:transition-none";
  let iconClass = "shrink-0";
  let xpTextClass = "text-[9px] uppercase font-bold tracking-normal";

  if (isMaster) {
    // Epic Tier: Purple / Fuchsia
    baseClass += " bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border border-fuchsia-400/50 shadow-[0_4px_10px_rgba(192,38,211,0.25)]";
    iconClass += " fill-fuchsia-300 text-fuchsia-100 drop-shadow-sm";
    xpTextClass += " text-white/80";
  } else if (isPro) {
    // Rare Tier: Emerald / Teal
    baseClass += " bg-gradient-to-r from-emerald-500 to-teal-500 text-white border border-teal-300/50 shadow-[0_2px_8px_rgba(20,184,166,0.25)]";
    iconClass += " fill-teal-200 text-teal-50 drop-shadow-sm";
    xpTextClass += " text-white/80";
  } else {
    // Common Tier: Brand Orange (Light)
    baseClass += " bg-orange-50 border border-[#FF6B00]/25 text-[#FF6B00]";
    iconClass += " fill-[#FF6B00]";
    xpTextClass += " text-[#FF6B00]/80";
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
      <span>
        {points.toLocaleString("vi-VN")} <span className={xpTextClass}>XP</span>
      </span>
    </Component>
  );
}

export default DynamicXpBadge;

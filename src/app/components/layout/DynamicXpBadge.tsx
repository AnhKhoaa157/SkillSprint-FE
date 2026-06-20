import { Zap, Flame, Star, Gem, Crown } from "lucide-react";

export interface DynamicXpBadgeProps {
  points: number;
  className?: string;
  onClick?: () => void;
  title?: string;
  "aria-label"?: string;
}

export function DynamicXpBadge({ points, className = "", onClick, title, "aria-label": ariaLabel }: DynamicXpBadgeProps) {
  const isGodTier = points >= 10000000;
  const isUltimate = points >= 500000 && points < 10000000;
  const isMaster = points >= 50000 && points < 500000;
  const isPro = points >= 5000 && points < 50000;

  if (isGodTier) {
    const Component = onClick ? "button" : "div";
    return (
      <Component
        type={onClick ? "button" : undefined}
        onClick={onClick}
        title={title}
        aria-label={ariaLabel}
        className={`group relative inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black motion-reduce:transition-none godtier-bg border border-red-400/50 ${
          onClick ? "transition-all duration-300 hover:scale-[1.05] active:scale-95 cursor-pointer motion-reduce:hover:scale-100" : ""
        } ${className}`}
      >
        <style>
          {`
            @keyframes shimmerFire {
              0% { background-position: -200% center; }
              100% { background-position: 200% center; }
            }
            .godtier-bg {
              background: linear-gradient(
                110deg,
                #ef4444 0%,
                #f97316 25%,
                #facc15 50%,
                #f97316 75%,
                #ef4444 100%
              );
              background-size: 200% auto;
              animation: shimmerFire 3s linear infinite;
              box-shadow: 
                inset 0 2px 3px rgba(255, 255, 255, 0.6), 
                inset 0 -2px 3px rgba(153, 27, 27, 0.8),
                0 4px 15px rgba(234, 88, 12, 0.4);
            }
            .divine-spark {
              position: absolute;
              width: 3px;
              height: 3px;
              background: #facc15;
              border-radius: 50%;
              box-shadow: 0 0 6px #ea580c;
              animation: sparkRiseLight 1.2s linear infinite;
              z-index: 20;
            }
            @keyframes sparkRiseLight {
              0% { transform: translateY(0px) scale(1); opacity: 1; }
              100% { transform: translateY(-15px) scale(0); opacity: 0; }
            }
            @media (prefers-reduced-motion: reduce) {
              .godtier-bg {
                animation: none !important;
                background-size: auto !important;
              }
            }
          `}
        </style>
        
        <Flame size={12} className="shrink-0 fill-yellow-300 text-yellow-100 drop-shadow-[0_1px_2px_rgba(153,27,27,0.5)] z-10" />
        <span className="whitespace-nowrap text-white font-black tracking-tight drop-shadow-[0_1px_2px_rgba(153,27,27,0.8)] z-10">
          {points.toLocaleString("vi-VN")} <span className="text-[9px] uppercase font-bold text-yellow-200 tracking-normal">XP</span>
        </span>

        {/* Sparks */}
        <div className="divine-spark" style={{ left: '20%', bottom: '2px', animationDelay: '0.1s' }} />
        <div className="divine-spark" style={{ left: '50%', bottom: '2px', animationDelay: '0.7s' }} />
        <div className="divine-spark" style={{ left: '80%', bottom: '2px', animationDelay: '0.4s' }} />
      </Component>
    );
  }

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
        <Crown size={12} className="shrink-0 fill-amber-300 text-amber-700 drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]" />
        <span className="whitespace-nowrap text-amber-900 font-black tracking-tight drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
          {points.toLocaleString("vi-VN")} <span className="text-[9px] uppercase font-bold text-amber-800/90 tracking-normal">XP</span>
        </span>
      </Component>
    );
  }

  let baseClass = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black shadow-sm motion-reduce:transition-none";
  let iconClass = "shrink-0";
  let xpTextClass = "text-[9px] uppercase font-bold tracking-normal";
  let IconElement = Zap;

  if (isMaster) {
    // Epic Tier: Soft Indigo, Diamond Gem icon
    IconElement = Gem;
    baseClass += " bg-indigo-50 border border-indigo-200/80 text-indigo-700 shadow-sm";
    iconClass += " fill-indigo-200 text-indigo-600";
    xpTextClass += " text-indigo-500/80";
  } else if (isPro) {
    // Rare Tier: Soft Sky Blue, Star icon
    IconElement = Star;
    baseClass += " bg-sky-50 border border-sky-200/80 text-sky-700 shadow-sm";
    iconClass += " fill-sky-200 text-sky-600";
    xpTextClass += " text-sky-500/80";
  } else {
    // Common Tier: Soft Orange, Zap icon
    IconElement = Zap;
    baseClass += " bg-orange-50 border border-[#FF6B00]/25 text-[#FF6B00]";
    iconClass += " fill-orange-200 text-[#FF6B00]";
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
      <IconElement size={12} className={iconClass} />
      <span className="whitespace-nowrap">
        {points.toLocaleString("vi-VN")} <span className={xpTextClass}>XP</span>
      </span>
    </Component>
  );
}

export default DynamicXpBadge;

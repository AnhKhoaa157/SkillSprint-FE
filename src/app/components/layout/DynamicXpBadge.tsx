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
        className={`group relative inline-flex items-center justify-center p-[2.5px] rounded-full overflow-visible shadow-[0_4px_20px_rgba(234,88,12,0.3)] motion-reduce:transition-none ${
          onClick ? "transition-all duration-300 hover:scale-[1.05] active:scale-95 cursor-pointer motion-reduce:hover:scale-100" : ""
        } ${className}`}
      >
        <style>
          {`
            @keyframes divineFireSpin {
              100% { transform: translate(-50%, -50%) rotate(360deg); }
            }
            @keyframes divinePulse {
              0%, 100% { box-shadow: inset 0 0 10px rgba(234,88,12,0.1); background-color: #ffffff; }
              50% { box-shadow: inset 0 0 20px rgba(250,204,21,0.3); background-color: #fffbeb; }
            }
            .divine-fire-bg {
              position: absolute;
              top: 50%;
              left: 50%;
              width: 250%;
              height: 400%;
              background: conic-gradient(from 0deg, #ef4444, #f97316, #facc15, #f97316, #ef4444);
              transform: translate(-50%, -50%) rotate(0deg);
              animation: divineFireSpin 2.5s linear infinite;
              z-index: 0;
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
              .divine-fire-bg {
                animation: none !important;
                background: #f97316 !important;
              }
            }
          `}
        </style>
        
        {/* Animated Fire Border (Clipped) */}
        <div className="absolute inset-0 rounded-full overflow-hidden z-0">
          <div className="divine-fire-bg" />
        </div>
        
        {/* Inner white background to hollow out the border */}
        <div 
          className="relative z-10 flex items-center gap-1.5 rounded-full px-3 py-1 w-full h-full" 
          style={{ animation: 'divinePulse 1.5s infinite alternate' }}
        >
          <Flame size={16} className="shrink-0 fill-orange-500 text-red-600 drop-shadow-[0_2px_4px_rgba(234,88,12,0.4)]" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 font-black tracking-tight drop-shadow-[0_1px_1px_rgba(255,255,255,1)]">
            {points.toLocaleString("vi-VN")} <span className="text-[10px] uppercase font-black text-orange-600 tracking-normal drop-shadow-none">XP</span>
          </span>
        </div>

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
        <span className="text-amber-900 font-black tracking-tight drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
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
      <span>
        {points.toLocaleString("vi-VN")} <span className={xpTextClass}>XP</span>
      </span>
    </Component>
  );
}

export default DynamicXpBadge;

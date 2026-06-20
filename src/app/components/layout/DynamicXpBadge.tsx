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
        className={`group relative inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-black motion-reduce:transition-none bg-black border-[1.5px] border-yellow-500 overflow-visible ${
          onClick ? "transition-all duration-300 hover:scale-[1.05] active:scale-95 cursor-pointer motion-reduce:hover:scale-100" : ""
        } ${className}`}
      >
        <style>
          {`
            @keyframes fireFramePulse {
              0%, 100% { box-shadow: 0 0 10px #ea580c, inset 0 0 5px #ea580c; border-color: #f59e0b; }
              50% { box-shadow: 0 0 20px #facc15, inset 0 0 10px #facc15; border-color: #fef08a; }
            }
            .god-tier-frame {
              animation: fireFramePulse 1.2s infinite alternate;
            }
            .god-tier-spark {
              position: absolute;
              width: 2px;
              height: 2px;
              background: #facc15;
              border-radius: 50%;
              box-shadow: 0 0 4px #ea580c, 0 0 8px #ef4444;
              animation: sparkRise 1s linear infinite;
              z-index: 20;
            }
            @keyframes sparkRise {
              0% { transform: translateY(0px) scale(1); opacity: 1; }
              100% { transform: translateY(-15px) scale(0); opacity: 0; }
            }
          `}
        </style>
        
        {/* Frame Animation */}
        <div className="absolute inset-0 rounded-xl god-tier-frame pointer-events-none" />

        {/* Flames at Bottom Left */}
        <div className="absolute -left-3 -bottom-3 pointer-events-none z-0" style={{ animation: 'fireFramePulse 0.8s infinite alternate' }}>
          <Flame className="absolute -left-1 -bottom-1 w-8 h-8 fill-red-600 text-red-500 blur-[4px] opacity-70" />
          <Flame className="absolute left-0 bottom-0 w-7 h-7 fill-orange-500 text-orange-400 blur-[2px] opacity-90" />
          <Flame className="absolute left-1 bottom-1 w-5 h-5 fill-yellow-400 text-yellow-200" />
        </div>

        {/* Flames at Top Right */}
        <div className="absolute -right-3 -top-3 pointer-events-none z-0" style={{ animation: 'fireFramePulse 0.9s infinite alternate-reverse', transform: 'scale(-1, -1)' }}>
          <Flame className="absolute -left-1 -bottom-1 w-8 h-8 fill-red-600 text-red-500 blur-[4px] opacity-70" />
          <Flame className="absolute left-0 bottom-0 w-7 h-7 fill-orange-500 text-orange-400 blur-[2px] opacity-90" />
          <Flame className="absolute left-1 bottom-1 w-5 h-5 fill-yellow-400 text-yellow-200" />
        </div>

        {/* Sparks */}
        <div className="god-tier-spark" style={{ left: '25%', bottom: '-2px', animationDelay: '0.1s' }} />
        <div className="god-tier-spark" style={{ left: '65%', bottom: '-2px', animationDelay: '0.6s' }} />
        <div className="god-tier-spark" style={{ left: '85%', bottom: '-2px', animationDelay: '0.3s' }} />
        <div className="god-tier-spark" style={{ left: '10%', top: '-2px', animationDelay: '0.8s' }} />

        {/* Inner Content */}
        <div className="relative z-10 flex items-center gap-1.5">
          <Flame size={14} className="shrink-0 fill-yellow-400 text-yellow-200 drop-shadow-[0_0_8px_rgba(250,204,21,1)]" />
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-yellow-400 to-orange-600 font-black tracking-tight drop-shadow-[0_0_2px_rgba(234,88,12,0.8)]">
            {points.toLocaleString("vi-VN")} <span className="text-[10px] uppercase font-black text-yellow-500 tracking-normal drop-shadow-none">XP</span>
          </span>
        </div>
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

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
        className={`group relative z-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black motion-reduce:transition-none godtier-bg border border-red-400/50 ${
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
            @keyframes divineAuraPulse {
              0%, 100% { transform: scale(1); opacity: 0.5; }
              50% { transform: scale(1.15); opacity: 0.85; }
            }
            .godtier-aura {
              position: absolute;
              inset: -2px;
              border-radius: 9999px;
              background: linear-gradient(90deg, #ef4444, #f97316, #facc15);
              filter: blur(10px);
              opacity: 0.6;
              animation: divineAuraPulse 2s ease-in-out infinite;
              z-index: -1;
            }
            @keyframes glassSweep {
              0% { transform: translateX(-150%) skewX(-25deg); }
              20%, 100% { transform: translateX(250%) skewX(-25deg); }
            }
            .godtier-sweep {
              position: absolute;
              top: 0;
              left: 0;
              width: 30%;
              height: 100%;
              background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.65), transparent);
              animation: glassSweep 3s infinite;
              pointer-events: none;
            }
            @keyframes flameFlicker {
              0%, 100% { transform: scale(1) rotate(-2deg); filter: brightness(1); }
              50% { transform: scale(1.15) rotate(2deg); filter: brightness(1.3); }
            }
            .godtier-flame {
              animation: flameFlicker 0.6s ease-in-out infinite alternate;
            }
            .divine-spark {
              position: absolute;
              background: #facc15;
              border-radius: 50%;
              box-shadow: 0 0 8px #ea580c, 0 0 12px #facc15;
              animation: sparkRiseLight 1s linear infinite;
              z-index: 20;
            }
            @keyframes sparkRiseLight {
              0% { transform: translateY(0px) scale(1); opacity: 1; }
              100% { transform: translateY(-20px) scale(0); opacity: 0; }
            }
            @media (prefers-reduced-motion: reduce) {
              .godtier-bg, .godtier-aura, .godtier-sweep, .godtier-flame, .divine-spark {
                animation: none !important;
              }
              .godtier-sweep, .divine-spark {
                display: none !important;
              }
            }
          `}
        </style>
        
        {/* Aura */}
        <div className="godtier-aura pointer-events-none" />

        {/* Sweep */}
        <div className="absolute inset-0 overflow-hidden rounded-full z-[5] pointer-events-none">
          <div className="godtier-sweep" />
        </div>

        <Flame size={12} className="godtier-flame shrink-0 fill-yellow-300 text-yellow-100 drop-shadow-[0_1px_2px_rgba(153,27,27,0.5)] z-10" />
        <span className="whitespace-nowrap text-white font-black tracking-tight drop-shadow-[0_1px_2px_rgba(153,27,27,0.8)] z-10 relative">
          {points.toLocaleString("vi-VN")} <span className="text-[9px] uppercase font-bold text-yellow-200 tracking-normal">XP</span>
        </span>

        {/* Sparks */}
        <div className="divine-spark w-[3px] h-[3px]" style={{ left: '15%', bottom: '0px', animationDelay: '0.1s', animationDuration: '1.2s' }} />
        <div className="divine-spark w-[4px] h-[4px]" style={{ left: '35%', bottom: '-2px', animationDelay: '0.5s', animationDuration: '0.9s' }} />
        <div className="divine-spark w-[2px] h-[2px]" style={{ left: '50%', bottom: '2px', animationDelay: '0.8s', animationDuration: '1.5s' }} />
        <div className="divine-spark w-[3px] h-[3px]" style={{ left: '70%', bottom: '-1px', animationDelay: '0.3s', animationDuration: '1.1s' }} />
        <div className="divine-spark w-[4px] h-[4px]" style={{ left: '85%', bottom: '1px', animationDelay: '0.9s', animationDuration: '1s' }} />
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

  if (isMaster) {
    const Component = onClick ? "button" : "div";
    return (
      <Component
        type={onClick ? "button" : undefined}
        onClick={onClick}
        title={title}
        aria-label={ariaLabel}
        className={`group relative inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black motion-reduce:transition-none diamond-master-bg border border-indigo-300/50 ${
          onClick ? "transition-all duration-300 hover:scale-[1.05] active:scale-95 cursor-pointer motion-reduce:hover:scale-100" : ""
        } ${className}`}
      >
        <style>
          {`
            @keyframes diamondBreathe {
              0%, 100% { 
                box-shadow: inset 0 2px 3px rgba(255, 255, 255, 0.8), inset 0 -2px 3px rgba(49, 46, 129, 0.6), 0 4px 8px rgba(99, 102, 241, 0.3); 
              }
              50% { 
                box-shadow: inset 0 2px 3px rgba(255, 255, 255, 0.9), inset 0 -2px 3px rgba(49, 46, 129, 0.8), 0 4px 18px rgba(99, 102, 241, 0.7); 
              }
            }
            @keyframes diamondGlint {
              0%, 85%, 100% { filter: brightness(1) drop-shadow(0 1px 1px rgba(49,46,129,0.5)); transform: scale(1) rotate(0deg); }
              92% { filter: brightness(1.5) drop-shadow(0 0 8px rgba(255,255,255,0.9)); transform: scale(1.15) rotate(5deg); }
            }
            .diamond-master-bg {
              background: linear-gradient(
                110deg, 
                #a5b4fc 0%, 
                #6366f1 30%, 
                #e0e7ff 50%, 
                #6366f1 70%, 
                #4f46e5 100%
              );
              animation: diamondBreathe 2.5s ease-in-out infinite;
            }
            .diamond-icon {
              animation: diamondGlint 3.5s ease-in-out infinite;
            }
            @media (prefers-reduced-motion: reduce) {
              .diamond-master-bg, .diamond-icon {
                animation: none !important;
              }
            }
          `}
        </style>
        <Gem size={12} className="diamond-icon shrink-0 fill-indigo-200 text-white drop-shadow-[0_1px_1px_rgba(49,46,129,0.5)]" />
        <span className="whitespace-nowrap text-white font-black tracking-tight drop-shadow-[0_1px_1px_rgba(49,46,129,0.8)]">
          {points.toLocaleString("vi-VN")} <span className="text-[9px] uppercase font-bold text-indigo-100 tracking-normal">XP</span>
        </span>
      </Component>
    );
  }

  let baseClass = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black shadow-sm motion-reduce:transition-none";
  let iconClass = "shrink-0";
  let xpTextClass = "text-[9px] uppercase font-bold tracking-normal";
  let IconElement = Zap;

  if (isPro) {
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

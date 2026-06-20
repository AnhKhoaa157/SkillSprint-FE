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

  let baseClass = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-extrabold shadow-sm motion-reduce:transition-none";
  let iconClass = "shrink-0";

  if (isUltimate) {
    baseClass += " xp-ultimate-bg relative z-10 text-white border-transparent";
    iconClass += " fill-white animate-pulse";
  } else if (isMaster) {
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
    <>
      {isUltimate && (
        <style>
          {`
            @keyframes gradientShimmerXP {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            @keyframes roaringFire {
              0% { 
                box-shadow: 0 0 4px #facc15, 2px -2px 6px #f59e0b, -2px -4px 8px #ea580c, 2px -8px 12px #dc2626, -2px -12px 14px #991b1b, 0 4px 10px rgba(220,38,38,0.5); 
                transform: scale(1);
              }
              25% { 
                box-shadow: 0 0 4px #facc15, -2px -3px 6px #f59e0b, 2px -5px 8px #ea580c, -2px -9px 12px #dc2626, 2px -13px 14px #991b1b, 0 4px 10px rgba(220,38,38,0.6); 
                transform: scale(1.02);
              }
              50% { 
                box-shadow: 0 0 4px #facc15, 2px -2px 6px #f59e0b, -2px -6px 8px #ea580c, 3px -10px 12px #dc2626, -1px -14px 14px #991b1b, 0 4px 10px rgba(220,38,38,0.7); 
                transform: scale(1.01);
              }
              75% { 
                box-shadow: 0 0 4px #facc15, -2px -2px 6px #f59e0b, 2px -5px 8px #ea580c, -3px -9px 12px #dc2626, 1px -13px 14px #991b1b, 0 4px 10px rgba(220,38,38,0.6); 
                transform: scale(1.03);
              }
              100% { 
                box-shadow: 0 0 4px #facc15, 2px -2px 6px #f59e0b, -2px -4px 8px #ea580c, 2px -8px 12px #dc2626, -2px -12px 14px #991b1b, 0 4px 10px rgba(220,38,38,0.5); 
                transform: scale(1);
              }
            }
            .xp-ultimate-bg {
              background: linear-gradient(90deg, #FF6B00, #F59E0B, #EC4899, #FF6B00);
              background-size: 300% 300%;
              animation: gradientShimmerXP 3s ease infinite, roaringFire 0.8s infinite alternate ease-in-out;
              margin-top: 8px; /* Give space for the fire above */
            }
            @media (prefers-reduced-motion: reduce) {
              .xp-ultimate-bg {
                animation: none !important;
                transform: none !important;
                box-shadow: none !important;
                margin-top: 0 !important;
              }
              .animate-pulse {
                animation: none !important;
              }
            }
          `}
        </style>
      )}
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
    </>
  );
}

export default DynamicXpBadge;

import React from "react";
import { Crown, Medal, Shield, Star } from "lucide-react";

interface RankBadgeProps {
  rank?: number | null;
  className?: string;
}

export function RankBadge({ rank, className = "" }: RankBadgeProps) {
  if (!rank) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold leading-none text-slate-500 ${className}`}>
        <Shield className="h-3 w-3 text-slate-400" />
        Tân binh
      </span>
    );
  }

  if (rank === 1) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border border-orange-200/70 bg-orange-50 px-2 py-0.5 text-[11px] font-bold leading-none text-orange-700 ${className}`}>
        <Crown className="h-3 w-3 text-orange-500" />
        Hạng 1
      </span>
    );
  }

  if (rank === 2) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-bold leading-none text-slate-700 ${className}`}>
        <Medal className="h-3 w-3 text-slate-500" />
        Hạng 2
      </span>
    );
  }

  if (rank === 3) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold leading-none text-amber-700 ${className}`}>
        <Medal className="h-3 w-3 text-amber-500" />
        Hạng 3
      </span>
    );
  }

  if (rank <= 10) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold leading-none text-slate-600 ${className}`}>
        <Star className="h-3 w-3 text-slate-400" />
        Hạng {rank}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center rounded-full border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold leading-none text-slate-500 ${className}`}>
      Hạng {rank}
    </span>
  );
}

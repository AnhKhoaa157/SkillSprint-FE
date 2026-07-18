import { useState, type SyntheticEvent } from "react";
import { Avatar, AvatarFallback } from "../ui/avatar";

type MarketplaceCreatorIdentityProps = {
  creatorName: string;
  creatorAvatarUrl?: string | null;
  variant?: "default" | "compact";
};

function creatorInitial(name: string) {
  return name.trim().charAt(0).toLocaleUpperCase("vi-VN") || "S";
}

export default function MarketplaceCreatorIdentity({ creatorName, creatorAvatarUrl, variant = "default" }: MarketplaceCreatorIdentityProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = Boolean(creatorAvatarUrl && creatorAvatarUrl !== failedUrl);
  const handleImageError = (_event: SyntheticEvent<HTMLImageElement>) => {
    setFailedUrl(creatorAvatarUrl ?? null);
  };

  const isCompact = variant === "compact";

  return <div className={isCompact ? "mt-5 flex min-w-0 items-center gap-2.5" : "mt-4 flex min-w-0 items-center gap-3"}>
    <Avatar className={isCompact ? "size-9 shrink-0 border border-white bg-slate-950 shadow-sm ring-1 ring-slate-200" : "size-11 border-2 border-white bg-slate-950 shadow-sm ring-1 ring-slate-200"}>
      {showImage ? <img
        src={creatorAvatarUrl ?? undefined}
        alt={`Ảnh đại diện của ${creatorName}`}
        className="size-full object-cover"
        onError={handleImageError}
      /> : <AvatarFallback className={isCompact ? "bg-slate-950 text-xs font-black uppercase text-white" : "bg-slate-950 text-sm font-black uppercase text-white"}>
        {creatorInitial(creatorName)}
      </AvatarFallback>}
    </Avatar>
    <span className="min-w-0">
      <span className={isCompact ? "block text-[10px] font-bold uppercase tracking-wider text-slate-400" : "block text-[10px] font-black uppercase tracking-[0.12em] text-slate-400"}>Creator</span>
      <span className={isCompact ? "block truncate text-xs font-bold text-slate-700" : "mt-0.5 block truncate text-sm font-bold text-slate-800"}>{creatorName}</span>
    </span>
  </div>;
}

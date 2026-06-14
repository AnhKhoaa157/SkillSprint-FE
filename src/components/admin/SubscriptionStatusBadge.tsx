import React from "react";

export type SubscriptionStatusBadgeProps = {
  status?: string | null;
  className?: string;
  size?: "sm" | "md";
};

export function SubscriptionStatusBadge({
  status,
  className = "",
  size = "sm",
}: SubscriptionStatusBadgeProps) {
  const normalizedStatus = String(status || "").toUpperCase().trim();
  const isActive = normalizedStatus === "ACTIVE";
  const label = normalizedStatus || "UNKNOWN";

  const style: React.CSSProperties = {
    background: isActive ? "rgba(34,197,94,0.08)" : "#F1F5F9",
    color: isActive ? "#16A34A" : "#64748B",
    border: isActive ? "1px solid rgba(34,197,94,0.15)" : "1px solid #E2E8F0",
  };

  const sizingClass = size === "md" 
    ? "px-2 py-0.5 text-[10px]" 
    : "px-1.5 py-0.5 text-[9px]";

  return (
    <span
      style={style}
      className={`rounded font-bold uppercase tracking-wide shrink-0 inline-block ${sizingClass} ${className}`}
    >
      {label}
    </span>
  );
}

export default SubscriptionStatusBadge;

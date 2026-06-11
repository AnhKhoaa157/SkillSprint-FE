import type { LucideIcon } from "lucide-react";

export type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  /** Wired to the matching creation modal flow or redirect of the host screen. */
  onAction?: () => void;
  actionIcon?: LucideIcon;
  /** "card" renders a full dashed-border panel; "plain" only the inner content for embedding inside an existing card. */
  variant?: "card" | "plain";
  className?: string;
};

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  variant = "card",
  className = "",
}: EmptyStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-50 border border-slate-200 text-slate-300">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-base font-extrabold text-slate-800">{title}</h3>
      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 text-sm bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold rounded-xl transition shadow-md"
        >
          {ActionIcon && <ActionIcon className="h-4 w-4" />}
          {actionLabel}
        </button>
      )}
    </div>
  );

  if (variant === "plain") {
    return <div className={`py-12 px-6 ${className}`}>{content}</div>;
  }

  return (
    <div className={`rounded-2xl border border-dashed border-slate-300 bg-white/80 p-12 shadow-sm backdrop-blur-sm ${className}`}>
      {content}
    </div>
  );
}

import type { CSSProperties } from "react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ServicePlanType } from "../../api/adminSubscriptionPlansService";

export type PlanBadgeAnimation = "shimmer" | "pulse" | "none";

/**
 * Static per-type fallbacks. The Tailwind class strings are written as literals here so the
 * Tailwind scanner generates them. Fully custom `badgeColor` values coming from the database
 * are only rendered correctly if those utilities also exist in the build — see the safelist note
 * in the PR description.
 */
const TYPE_FALLBACK: Record<
  ServicePlanType,
  { label: string; badgeColor: string; badgeIcon: string; animationType: PlanBadgeAnimation }
> = {
  FREE:          { label: "Free",          badgeColor: "from-slate-200 to-slate-300 text-slate-700 shadow-slate-300/30",            badgeIcon: "Layers",      animationType: "none" },
  SKILL_BUILDER: { label: "Skill Builder", badgeColor: "from-blue-500 to-indigo-600 text-white shadow-indigo-500/30",               badgeIcon: "Zap",         animationType: "none" },
  PREMIUM:       { label: "Premium",       badgeColor: "from-amber-400 via-orange-500 to-amber-500 text-white shadow-orange-500/30", badgeIcon: "Crown",       animationType: "shimmer" },
  ADMIN_DEFAULT: { label: "Admin",         badgeColor: "from-emerald-500 to-teal-600 text-white shadow-emerald-500/30",             badgeIcon: "ShieldAlert", animationType: "pulse" },
};

// Keyframes for the shimmer sweep + pulse ring. Mount <PlanBadgeStyles/> once near the view root.
const PLAN_BADGE_CSS = `
@keyframes planBadgeShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
@keyframes planBadgePulseRing {
  0%, 100% { box-shadow: 0 0 0 0 rgb(var(--plan-pulse, 168 85 247) / 0.45); }
  50%      { box-shadow: 0 0 0 6px rgb(var(--plan-pulse, 168 85 247) / 0); }
}
.plan-badge-shimmer { background-size: 200% 100% !important; animation: planBadgeShimmer 2.8s linear infinite; }
.plan-badge-pulse   { animation: planBadgePulseRing 2s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .plan-badge-shimmer, .plan-badge-pulse { animation: none !important; }
}
`;

/**
 * Inject the badge keyframes + the Tailwind JIT safelist once, near each view root.
 *
 * The hidden div is the single home for every dynamic `badgeColor` utility that may arrive
 * from the database. Tailwind v4 only emits a class if its literal string appears in a scanned
 * source file (see `@source` in styles/tailwind.css), so admin-entered free-text classes survive
 * production builds *only* if they are listed here. Keep this in sync with the badge designer
 * presets in SubscriptionPlansView. (Truly arbitrary, un-listed classes still won't emit — that
 * is an inherent limit of the class-string approach.)
 */
export function PlanBadgeStyles() {
  return (
    <>
      <style>{PLAN_BADGE_CSS}</style>
      <div
        aria-hidden
        className="hidden
          bg-gradient-to-r bg-gradient-to-br bg-gradient-to-l bg-gradient-to-tr
          from-emerald-500 to-teal-600 from-rose-500 via-pink-500 to-red-500 from-rose-500 to-red-600
          from-amber-400 via-orange-500 to-amber-500 from-sky-500 to-blue-600 from-blue-500 to-indigo-600
          from-pink-500 via-purple-500 to-indigo-600 from-slate-200 to-slate-300 from-slate-500 to-slate-600
          text-white text-amber-950 text-slate-700 text-rose-100 text-amber-100 text-sky-100 text-emerald-100
          border-rose-300 border-emerald-300 border-amber-300 border-sky-300 border-slate-300
          shadow-emerald-500/30 shadow-red-500/30 shadow-rose-500/30 shadow-amber-500/30 shadow-sky-500/30
          shadow-slate-500/10 shadow-slate-300/30 shadow-blue-500/30 shadow-indigo-500/30 shadow-orange-500/30
          shadow-purple-500/30 shadow-red-600/30 animate-pulse"
      />
    </>
  );
}

/**
 * 500-shade RGB for the palette colors badge gradients are built from. Used to tint the `pulse`
 * glow ring so it matches the badge (emerald badge → emerald ring) instead of a hardcoded color.
 */
const PULSE_RGB: Record<string, string> = {
  emerald: "16 185 129", teal: "20 184 166", amber: "245 158 11", orange: "249 115 22",
  blue: "59 130 246", indigo: "99 102 241", pink: "236 72 153", purple: "168 85 247",
  rose: "244 63 94", red: "239 68 68", sky: "14 165 233", slate: "100 116 139",
};

/** Pull the `from-<color>` hue out of a gradient string for the pulse ring; purple if unknown. */
function pulseRgb(gradient: string): string {
  const match = gradient.match(/from-([a-z]+)-\d+/);
  return (match && PULSE_RGB[match[1]]) || "168 85 247";
}

/** Resolve a Lucide icon component by name via reflection, falling back to Layers (spec §3). */
function resolveIcon(name?: string | null): LucideIcon {
  if (name) {
    const candidate = (LucideIcons as Record<string, unknown>)[name];
    if (candidate) return candidate as LucideIcon;
  }
  return LucideIcons.Layers;
}

export type PlanTypeBadgeProps = {
  type?: ServicePlanType | null;
  label?: string | null;
  badgeColor?: string | null;
  badgeIcon?: string | null;
  animationType?: string | null;
  size?: "sm" | "md";
};

/**
 * Reusable, fully dynamic plan badge. Visuals come from the (admin-customizable) badgeColor /
 * badgeIcon / animationType when provided, otherwise from the per-type fallback.
 */
export function PlanTypeBadge({
  type,
  label,
  badgeColor,
  badgeIcon,
  animationType,
  size = "sm",
}: PlanTypeBadgeProps) {
  const fallback = TYPE_FALLBACK[(type ?? "FREE") as ServicePlanType] ?? TYPE_FALLBACK.FREE;

  const rawGradient = (badgeColor && badgeColor.trim()) || fallback.badgeColor;
  // Normalization (spec §2): a `from-…/to-…` string with no direction token won't fire the
  // gradient engine — prepend `bg-gradient-to-r`. A string that already sets its own direction
  // (e.g. `bg-gradient-to-br`) is left untouched so custom directions aren't clobbered.
  const gradient =
    rawGradient.includes("from-") && rawGradient.includes("to-") && !rawGradient.includes("bg-gradient-")
      ? `bg-gradient-to-r ${rawGradient}`
      : rawGradient;
  const iconName = (badgeIcon && badgeIcon.trim()) || fallback.badgeIcon;
  const animation = ((animationType && animationType.trim()) || fallback.animationType) as PlanBadgeAnimation;
  const text = (label && label.trim()) || fallback.label;
  const Icon = resolveIcon(iconName);

  const sizing = size === "md" ? "px-3.5 py-1.5 text-sm gap-1.5" : "px-3 py-1 text-xs gap-1";
  const iconSize = size === "md" ? 14 : 11;
  const animClass = animation === "shimmer" ? "plan-badge-shimmer" : animation === "pulse" ? "plan-badge-pulse" : "";
  // Tint the pulse glow to the badge's own hue (consumed by the planBadgePulseRing keyframe).
  const pulseStyle =
    animation === "pulse" ? ({ "--plan-pulse": pulseRgb(gradient) } as CSSProperties) : undefined;

  return (
    <span
      style={pulseStyle}
      className={`inline-flex items-center rounded-full font-bold whitespace-nowrap shadow-sm select-none ${gradient} ${sizing} ${animClass}`}
    >
      <Icon size={iconSize} className="shrink-0" />
      {text}
    </span>
  );
}

export default PlanTypeBadge;

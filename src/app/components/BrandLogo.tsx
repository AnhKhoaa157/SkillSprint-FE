type BrandLogoProps = {
  size?: number;
  showText?: boolean;
  textColor?: string;
  textSize?: string;
  className?: string;
};

export function BrandLogo({
  size = 32,
  showText = true,
  textColor = "#0F172A",
  textSize = "1rem",
  className,
}: BrandLogoProps) {
  return (
    <div className={className} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <img
        src="/brand-logo.svg"
        alt="SkillSprint logo"
        width={size}
        height={size}
        style={{ width: `${size}px`, height: `${size}px`, objectFit: "contain", flexShrink: 0 }}
      />
      {showText && (
        <span style={{ color: textColor, fontWeight: 700, fontSize: textSize, letterSpacing: "-0.02em" }}>
          SkillSprint
        </span>
      )}
    </div>
  );
}
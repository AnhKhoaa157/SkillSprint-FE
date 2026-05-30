type BrandLogoProps = {
  size?: number;
  showText?: boolean;
  textColor?: string;
  textSize?: string;
  className?: string;
  align?: "center" | "left";
  useSvg?: boolean;
};

export function BrandLogo({
  size = 72, // Tăng kích thước lên vì logo gốc có viền rỗng lớn
  showText = false,
  textColor = "#0F172A",
  textSize = "1rem",
  className,
  align = "center",
  useSvg = false,
}: BrandLogoProps) {
  return (
    <div className={className} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <img
        src={useSvg ? "/brand-logo.svg" : "/logo.png"}
        alt="SkillSprint logo"
        style={useSvg ? {
          width: `${size}px`,
          height: `${size}px`,
          objectFit: "contain",
          flexShrink: 0,
        } : { 
          height: `${size}px`, 
          width: "auto", 
          objectFit: "contain", 
          flexShrink: 0,
          mixBlendMode: "multiply", 
          filter: "contrast(1.2)",
          transform: "scale(2.2)", // Phóng to 2.2 lần để lấp đầy khoảng viền thừa của ảnh
          transformOrigin: align === "left" ? "left center" : "center"
        }}
      />
      {/* Ẩn text mặc định vì logo mới đã có sẵn chữ */}
      {showText && (
        <span style={{ color: textColor, fontWeight: 700, fontSize: textSize, letterSpacing: "-0.02em" }}>
          SkillSprint
        </span>
      )}
    </div>
  );
}
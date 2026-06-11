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
  size = 36, // Đưa về kích thước tiêu chuẩn (36px) thay vì 72px vì ảnh logo.png mới đã chuẩn khung
  showText = false,
  textColor = "#0F172A",
  textSize = "1rem",
  className,
  align = "center",
  useSvg = false,
}: BrandLogoProps) {
  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: align === "left" ? "flex-start" : "center",
        gap: "8px",
        height: `${size}px`,
      }}
    >
      <img
        src={useSvg ? "/brand-logo.svg" : "/logo.png"} // Đường dẫn map chuẩn từ thư mục public
        alt="SkillSprint logo"
        style={{
          height: `${size}px`,
          width: "auto",
          objectFit: "contain",
          flexShrink: 0,
          // Đã xóa bỏ toàn bộ hack transform scale(2.2) và filter gây vỡ ảnh/sai màu logo gốc
        }}
      />
      
      {showText && (
        <span 
          style={{ 
            color: textColor, 
            fontWeight: 700, 
            fontSize: textSize, 
            letterSpacing: "-0.02em" 
          }}
        >
          SkillSprint
        </span>
      )}
    </div>
  );
}
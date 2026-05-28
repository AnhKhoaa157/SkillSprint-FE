import { CSSProperties, ReactNode, useState } from "react";

type CursorSpotlightProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  color?: string;
  size?: number;
  falloff?: number;
};

export default function CursorSpotlight({
  children,
  className,
  style,
  color = "rgba(255,107,0,0.18)",
  size = 180,
  falloff = 60,
}: CursorSpotlightProps) {
  const [hovered, setHovered] = useState(false);
  const [coords, setCoords] = useState({ x: 50, y: 50 });

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setCoords({ x, y });
  };

  return (
    <div
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        isolation: "isolate",
        ...style,
      }}
      onMouseMove={handleMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 2,
          opacity: hovered ? 1 : 0,
          transition: "opacity 180ms ease",
          background: `radial-gradient(${size}px circle at ${coords.x}% ${coords.y}%, ${color} 0%, rgba(255,255,255,0) ${falloff}%)`,
        }}
      />
    </div>
  );
}
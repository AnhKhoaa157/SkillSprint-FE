import { CSSProperties, MouseEvent, ReactNode, useMemo, useState } from "react";

type Interactive3DPanelProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  maxTiltDeg?: number;
  size?: number;
  color?: string;
  falloff?: number;
};

export default function Interactive3DPanel({
  children,
  className,
  style,
  maxTiltDeg = 8,
  size = 180,
  color = "rgba(255,107,0,0.16)",
  falloff = 60,
}: Interactive3DPanelProps) {
  const [hovered, setHovered] = useState(false);
  const [coords, setCoords] = useState({ x: 50, y: 50 });

  const transform = useMemo(() => {
    const rotateX = hovered ? (coords.y - 50) / 50 * -maxTiltDeg : 0;
    const rotateY = hovered ? (coords.x - 50) / 50 * maxTiltDeg : 0;
    const scale = hovered ? 1.02 : 1;
    return `perspective(1800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;
  }, [coords.x, coords.y, hovered, maxTiltDeg]);

  const handleMove = (event: MouseEvent<HTMLDivElement>) => {
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
        transform,
        transformStyle: "preserve-3d",
        transition: hovered ? "transform 80ms linear" : "transform 360ms cubic-bezier(0.16, 1, 0.3, 1)",
        willChange: "transform",
        ...style,
      }}
      onMouseMove={handleMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: hovered ? 1 : 0,
          transition: "opacity 180ms ease",
          borderRadius: "inherit",
          background: `radial-gradient(${size}px circle at ${coords.x}% ${coords.y}%, ${color} 0%, rgba(255,255,255,0) ${falloff}%)`,
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          transformStyle: "preserve-3d",
          transform: "translateZ(18px)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
type SkillTree2DFallbackProps = {
  className?: string;
  reason?: string;
};

export default function SkillTree2DFallback({ className, reason }: SkillTree2DFallbackProps) {
  return (
    <div
      className={className}
      aria-label={`2d-fallback-${reason ?? "default"}`}
      style={{
        width: "100%",
        height: "100%",
        background:
          "radial-gradient(70% 45% at 50% 20%, rgba(255,107,0,0.09), transparent 70%), linear-gradient(180deg, #f8fafc 0%, #f9fafb 100%)",
      }}
    />
  );
}

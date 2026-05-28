type LandingSection3DViewerProps = {
  className?: string;
  variant?: "features" | "stats" | "flow" | "cta";
};

function Section2DFallback({ className, variant = "features" }: LandingSection3DViewerProps) {
  const backgrounds = {
    features:
      "radial-gradient(40% 40% at 20% 40%, rgba(255,107,0,0.10), transparent 72%), radial-gradient(30% 35% at 80% 30%, rgba(14,165,233,0.08), transparent 74%)",
    stats:
      "radial-gradient(40% 40% at 25% 50%, rgba(255,107,0,0.08), transparent 72%), radial-gradient(28% 32% at 78% 40%, rgba(124,58,237,0.08), transparent 74%)",
    flow:
      "radial-gradient(42% 42% at 25% 40%, rgba(255,107,0,0.10), transparent 72%), radial-gradient(30% 30% at 75% 55%, rgba(5,150,105,0.08), transparent 74%)",
    cta:
      "radial-gradient(45% 45% at 50% 35%, rgba(255,107,0,0.12), transparent 72%), radial-gradient(28% 28% at 70% 70%, rgba(251,191,36,0.08), transparent 74%)",
  } as const;

  return <div className={className} style={{ width: "100%", height: "100%", background: backgrounds[variant] }} />;
}

export default function LandingSection3DViewer({ className, variant = "features" }: LandingSection3DViewerProps) {
  return <Section2DFallback className={className} variant={variant} />;
}

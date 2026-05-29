type LandingHero3DViewerProps = {
  className?: string;
};

function Hero2DFallback({ className }: LandingHero3DViewerProps) {
  return (
    <div
      className={className}
      style={{
        width: "100%",
        height: "100%",
        background:
          "radial-gradient(55% 45% at 50% 25%, rgba(255,107,0,0.14), transparent 72%), radial-gradient(35% 28% at 20% 60%, rgba(251,191,36,0.10), transparent 75%), radial-gradient(35% 28% at 80% 55%, rgba(14,165,233,0.08), transparent 75%)",
      }}
    />
  );
}

export default function LandingHero3DViewer({ className }: LandingHero3DViewerProps) {
  return <Hero2DFallback className={className} />;
}

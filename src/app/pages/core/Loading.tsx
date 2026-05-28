import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { BrandLogo } from "../../components/layout/BrandLogo";

export default function LoadingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const to = (location.state as any)?.to || "/app";

  useEffect(() => {
    let cancelled = false;
    // allow the fill animation to play before navigating
    const t = window.setTimeout(() => {
      if (!cancelled) navigate(to, { replace: true });
    }, 900);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [navigate, to]);

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', width: '100%', maxWidth: 760, padding: '36px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
          <BrandLogo size={48} textSize="1rem" />
        </div>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem', fontWeight: 800, color: '#111827', textAlign: 'center' }}>Đang chuẩn bị giao diện...</h2>
        <p style={{ marginTop: 8, color: '#6B7280', textAlign: 'center' }}>Chuyển đến trung tâm điều khiển</p>

        <div style={{ marginTop: 22, display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 420, maxWidth: '90%', background: '#F3F4F6', borderRadius: 999, height: 14, overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '100%', transform: 'translateX(-100%)', borderRadius: 999, background: '#FF6B00', animation: 'fillbar 800ms cubic-bezier(.22,1,.36,1) forwards' }} />
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '30%', transform: 'translateX(-120%)', pointerEvents: 'none', background: 'linear-gradient(90deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06), rgba(255,255,255,0.18))', animation: 'shimmer 900ms linear forwards' }} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fillbar { from { transform: translateX(-100%); } to { transform: translateX(0%); } }
        @keyframes shimmer { from { transform: translateX(-120%); } to { transform: translateX(120%); } }
      `}</style>
    </div>
  );
}

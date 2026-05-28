import { Link } from "react-router";
import { useState, useEffect } from "react";
import { ExternalLink, Github, Linkedin, Mail, MapPin, Phone, Twitter } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import healthService from "../../api/healthService";

const footerLinks = {
    "Sản phẩm": [
    { label: "Trang chủ", to: "/" },
    { label: "Tính năng", to: "/features" },
    { label: "Bảng giá", to: "/pricing" },
    { label: "Đăng ký", to: "/auth?mode=register" },
    { label: "Đăng nhập", to: "/auth?mode=login" },
  ],
  "Công ty": [
    { label: "Về chúng tôi", to: "/about" },
    { label: "Liên hệ", to: "/contact" },
    { label: "Email hỗ trợ", href: "mailto:support@skillsprint.vn" },
    { label: "Hotline", href: "tel:+842835555888" },
  ],
  "Pháp lý": [
    { label: "Chính sách bảo mật", href: "#" },
    { label: "Điều khoản sử dụng", href: "#" },
    { label: "Chính sách dữ liệu", href: "#" },
    { label: "Điều khoản thanh toán", href: "#" },
  ],
};

export function Footer() {
  const [status, setStatus] = useState<'unknown' | 'up' | 'down'>('unknown');

  useEffect(() => {
    const off = healthService.subscribeHealth((s: any) => setStatus(s));
    return () => off();
  }, []);

  const indicator =
    status === 'up'
      ? { color: '#22c55e', text: 'Ổn định', shadow: '0 0 6px #22c55e' }
      : status === 'down'
      ? { color: '#ef4444', text: 'Sự cố', shadow: '0 0 6px #ef4444' }
      : { color: '#94A3B8', text: 'Đang kiểm tra', shadow: 'none' };

  return (
    <footer
      style={{
        background: "#FFFFFF",
        borderTop: "1px solid #E2E8F0",
      }}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16">
        {/* Top row */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-14">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <BrandLogo size={32} textColor="#0F172A" textSize="1rem" />
            </Link>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "#64748B", maxWidth: "320px" }}>
              Trung tâm điều phối học tập bằng AI, giúp sinh viên phát hiện skill gap,
              xây lộ trình rõ ràng và duy trì tiến độ theo từng sprint.
            </p>
            <div className="space-y-2 mb-5">
              <div className="flex items-center gap-2 text-xs" style={{ color: "#64748B" }}>
                <MapPin size={14} /> Khu Công nghệ cao, Thu Duc, TP.HCM
              </div>
              <a href="mailto:support@skillsprint.vn" className="flex items-center gap-2 text-xs" style={{ color: "#64748B", textDecoration: "none" }}>
                <Mail size={14} /> support@skillsprint.vn
              </a>
              <a href="tel:+842835555888" className="flex items-center gap-2 text-xs" style={{ color: "#64748B", textDecoration: "none" }}>
                <Phone size={14} /> (+84) 28 3555 5888
              </a>
            </div>
            <div className="flex items-center gap-3">
              {[
                  { label: "GitHub", href: "https://github.com/", icon: Github },
                  { label: "X", href: "https://x.com/", icon: Twitter },
                  { label: "LinkedIn", href: "https://www.linkedin.com/", icon: Linkedin },
                ].map((soc) => (
                  <a
                    key={soc.label}
                    href={soc.href}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-full text-xs transition-all duration-200"
                    style={{
                      color: "#64748B",
                      border: "1px solid #E2E8F0",
                      fontWeight: 500,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#0F172A"; e.currentTarget.style.borderColor = "#CBD5E1"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "#64748B"; e.currentTarget.style.borderColor = "#E2E8F0"; }}
                  >
                    <soc.icon size={13} />
                    {soc.label}
                  </a>
                ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4
                className="text-xs uppercase tracking-widest mb-4"
                style={{ color: "#94A3B8", fontWeight: 600, letterSpacing: "0.1em" }}
              >
                {section}
              </h4>
              <ul className="space-y-3">
                {links.map((item) => (
                  <li key={item.label}>
                    {'to' in item ? (
                      <Link
                        to={item.to as string}
                        className="text-sm transition-colors duration-200"
                        style={{ color: "#64748B" }}
                        onClick={() => setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 40)}
                        onMouseEnter={e => (e.currentTarget.style.color = "#0F172A")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#64748B")}
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <a
                        href={('href' in item && item.href) || '#'}
                        className="text-sm transition-colors duration-200"
                        style={{ color: "#64748B", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
                        onClick={() => setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 40)}
                        onMouseEnter={e => (e.currentTarget.style.color = "#0F172A")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#64748B")}
                      >
                        {item.label}
                        {('href' in item && typeof item.href === 'string' && item.href.startsWith("http")) && <ExternalLink size={12} />}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8"
          style={{ borderTop: "1px solid #E2E8F0" }}
        >
          <p className="text-xs" style={{ color: "#94A3B8" }}>
            © 2026 SkillSprint. All rights reserved.
          </p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <div className="flex items-center gap-2" style={{ alignItems: 'center' }}>
              <div style={{ width: 10, height: 10, borderRadius: 999, background: indicator.color, boxShadow: indicator.shadow, animation: status === 'up' || status === 'down' ? 'pulse 1800ms infinite' : 'none' }} />
              <span className="text-xs" style={{ color: "#94A3B8", fontWeight: 600 }}>
                {indicator.text}
              </span>
              <style>{`@keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.6; } 100% { transform: scale(1); opacity: 1; } }`}</style>
            </div>
            <span className="text-xs" style={{ color: "#94A3B8" }}>MST: 0319999888</span>
            <span className="text-xs" style={{ color: "#94A3B8" }}>Giờ hỗ trợ: 08:30 - 18:00 (T2-T6)</span>
          </div>
        </div>
      </div>
      {/* Floating quick actions: Zalo + Back-to-top */}
      <FloatingZalo />
    </footer>
  );
}

function FloatingZalo() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'fixed', right: 18, bottom: 28, zIndex: 60, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      >
        {/* Dropdown shown on hover */}
        <div
          role="dialog"
          aria-hidden={!open}
          style={{
            position: 'absolute',
            right: 58,
            bottom: 0,
            transform: open ? 'translateY(0)' : 'translateY(6px)',
            opacity: open ? 1 : 0,
            pointerEvents: open ? 'auto' : 'none',
            transition: 'all 160ms ease',
            background: '#FFFFFF',
            borderRadius: 12,
            boxShadow: '0 10px 30px rgba(2,6,23,0.12)',
            padding: '12px 14px',
            minWidth: 200,
            color: '#0F172A',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Chăm sóc khách hàng</div>
          <div style={{ fontSize: 13, color: '#475569', marginBottom: 8 }}>Zalo: <strong style={{ color: '#0F172A' }}>0934 567 890</strong></div>
          <div style={{ fontSize: 13, color: '#475569', marginBottom: 8 }}>Hotline: <a href="tel:+842835555888" style={{ color: '#0F172A', fontWeight: 700 }}>(+84) 28 3555 5888</a></div>
          <a href="https://zalo.me/" target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 6, padding: '8px 10px', background: 'linear-gradient(135deg,#FF6B00,#FF9A3D)', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 700 }}>Mở Zalo</a>
        </div>

        <a
          href="https://zalo.me/"
          target="_blank"
          rel="noreferrer"
          aria-label="Chat via Zalo"
          style={{
            width: 48, height: 48, borderRadius: 12, background: '#2E9AFE',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', boxShadow: '0 6px 18px rgba(46,154,254,0.18)', textDecoration: 'none',
          }}
          title="Chat qua Zalo"
          onClick={() => setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 40)}
        >
          <img src="https://logowik.com/content/uploads/images/zalo3249.jpg" alt="Zalo" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 10 }} />
        </a>
      </div>

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
        style={{
          width: 48, height: 48, borderRadius: 12, background: '#111827',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', boxShadow: '0 6px 18px rgba(0,0,0,0.12)', border: 'none', cursor: 'pointer',
        }}
        title="Back to top"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 5L12 19" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5 12L12 5L19 12" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}

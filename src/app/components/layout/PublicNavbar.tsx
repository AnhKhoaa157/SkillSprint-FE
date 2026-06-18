import { Link, useLocation } from "react-router";
import { Menu, X, Zap } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { BrandLogo } from "./BrandLogo";

interface NavLink {
  to: string;
  label: string;
}

const NAV_LINKS: NavLink[] = [
  { to: "/about", label: "Giới thiệu" },
  { to: "/features", label: "Tính năng" },
  { to: "/pricing", label: "Bảng giá" },
  { to: "/contact", label: "Liên hệ" },
];

export function PublicNavbar() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const [activeStyle, setActiveStyle] = useState({ left: 0, width: 0, opacity: 0 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const isActive = (to: string) => location.pathname === to;

  const updateActiveIndicator = useCallback(() => {
    const activeIdx = NAV_LINKS.findIndex((l) => l.to === location.pathname);
    if (activeIdx !== -1) {
      const el = linkRefs.current[activeIdx];
      const parent = el?.parentElement;
      if (el && parent) {
        const parentRect = parent.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        setActiveStyle({
          left: elRect.left - parentRect.left + (elRect.width - 24) / 2,
          width: 24,
          opacity: 1,
        });
        return;
      }
    }
    setActiveStyle({ left: 0, width: 0, opacity: 0 });
  }, [location.pathname]);

  useEffect(() => {
    const timer = setTimeout(updateActiveIndicator, 60);
    window.addEventListener("resize", updateActiveIndicator);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateActiveIndicator);
    };
  }, [updateActiveIndicator]);

  const handleMouseEnter = (idx: number, el: HTMLElement) => {
    setHoveredIdx(idx);
    const parent = el.parentElement;
    if (parent) {
      const parentRect = parent.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      setPillStyle({
        left: elRect.left - parentRect.left,
        width: elRect.width,
        opacity: 1,
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredIdx(null);
    setPillStyle((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <>
      <style>{`
        @media (max-width: 767px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-btn { display: flex !important; }
        }
        @media (min-width: 768px) {
          .nav-desktop { display: flex !important; }
          .nav-mobile-btn { display: none !important; }
        }
        @keyframes navSlideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes mobileMenuIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <nav
        className="absolute top-0 left-0 right-0 z-[1000] h-[76px] transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] animate-[navSlideDown_0.45s_cubic-bezier(0.16,1,0.3,1)_both]"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          background: scrolled ? "rgba(255,255,255,0.78)" : "rgba(255,255,255,0.62)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderBottom: scrolled ? "1px solid rgba(226, 232, 240, 0.65)" : "1px solid rgba(226, 232, 240, 0.4)",
          boxShadow: scrolled ? "0 10px 30px rgba(15,23,42,0.03)" : "none",
        }}
      >
        <div className="max-w-[1280px] h-full mx-auto px-6 grid grid-cols-[1fr_auto_1fr] items-center gap-5">
          
          {/* Left: Logo */}
          <div className="flex justify-start items-center">
            <Link
              to="/"
              className="flex items-center no-underline transition-opacity duration-200 hover:opacity-85"
            >
              <div className="h-16 flex items-center overflow-visible">
                <BrandLogo size={72} align="left" />
              </div>
            </Link>
          </div>

          {/* Center: Desktop nav */}
          <div
            className={`nav-desktop relative items-center justify-center gap-1 p-1 rounded-full border transition-all duration-300 min-w-fit ${
              scrolled
                ? "bg-slate-50/80 border-slate-200/80 shadow-[0_6px_20px_rgba(15,23,42,0.03)]"
                : "bg-slate-50/95 border-slate-200/90 shadow-[0_6px_18px_rgba(15,23,42,0.04)]"
            }`}
            onMouseLeave={handleMouseLeave}
          >
            {/* Hover pill */}
            <span
              className="absolute top-1 bottom-1 rounded-full bg-gradient-to-r from-orange-500/8 to-orange-400/4 border border-orange-500/12 shadow-[0_4px_12px_rgba(255,107,0,0.04)] pointer-events-none z-0"
              style={{
                left: pillStyle.left,
                width: pillStyle.width,
                opacity: pillStyle.opacity,
                transition: "left 0.24s cubic-bezier(0.25, 1, 0.5, 1), width 0.24s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.15s ease",
              }}
            />

            {/* Active underline */}
            <span
              className="absolute bottom-1 h-0.5 rounded-full bg-orange-500 shadow-[0_2px_8px_rgba(255,107,0,0.35)] pointer-events-none z-0"
              style={{
                left: activeStyle.left,
                width: activeStyle.width,
                opacity: activeStyle.opacity,
                transition: "left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease, width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            />

            {NAV_LINKS.map((link, idx) => {
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  ref={(el) => {
                    linkRefs.current[idx] = el;
                  }}
                  className={`relative z-10 px-4.5 py-2 text-[13px] whitespace-nowrap transition-colors duration-200 no-underline ${
                    active
                      ? "text-orange-500 font-bold"
                      : hoveredIdx === idx
                        ? "text-orange-500 font-semibold"
                        : "text-slate-650 font-semibold hover:text-orange-500"
                  }`}
                  style={{ fontFamily: "'Plus Jakarta Sans', Inter, sans-serif" }}
                  onMouseEnter={(e) => handleMouseEnter(idx, e.currentTarget)}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right: CTA */}
          <div className="flex justify-end items-center gap-2.5">
            <div className="nav-desktop items-center gap-2">
              <Link
                to="/login?mode=login"
                className="px-4.5 py-2.5 rounded-full text-[13px] font-bold text-slate-650 hover:text-slate-900 hover:bg-slate-100/80 transition-all duration-205 no-underline"
                style={{ fontFamily: "'Plus Jakarta Sans', Inter, sans-serif" }}
              >
                Đăng nhập
              </Link>

              {/* Nút bấm vật lý lún xuống khi click */}
              <Link
                to="/login?mode=register"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[13px] font-bold text-white whitespace-nowrap bg-orange-500 shadow-[0_4px_0_#EA580C] hover:translate-y-[1px] hover:shadow-[0_3px_0_#EA580C] active:translate-y-[4px] active:shadow-none transition-all duration-100 no-underline"
                style={{ fontFamily: "'Plus Jakarta Sans', Inter, sans-serif" }}
              >
                <Zap size={12} className="fill-current" strokeWidth={0} />
                Bắt đầu miễn phí
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="nav-mobile-btn items-center justify-center w-9 h-9 rounded-xl border border-orange-500/25 bg-orange-500/5 text-orange-500 cursor-pointer transition-all duration-200 hover:bg-orange-500/10 active:scale-95"
              onClick={() => setIsMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile menu - Floating bubble design */}
        {isMenuOpen && (
          <div
            className="absolute top-[78px] left-4 right-4 p-4 bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-[0_20px_40px_rgba(15,23,42,0.08)] animate-[mobileMenuIn_0.25s_cubic-bezier(0.16,1,0.3,1)_both] flex flex-col gap-2 z-50"
          >
            {NAV_LINKS.map((link) => {
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`block px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-205 no-underline ${
                    active
                      ? "bg-orange-500/8 text-orange-500"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                  style={{ fontFamily: "'Plus Jakarta Sans', Inter, sans-serif" }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="h-px bg-slate-100 my-1.5" />

            <Link
              to="/login?mode=login"
              className="block px-4 py-2.5 rounded-xl text-[13px] font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all duration-205 no-underline"
              style={{ fontFamily: "'Plus Jakarta Sans', Inter, sans-serif" }}
              onClick={() => setIsMenuOpen(false)}
            >
              Đăng nhập
            </Link>

            <Link
              to="/login?mode=register"
              className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-[13px] font-bold text-white bg-orange-500 shadow-[0_3px_0_#EA580C] hover:translate-y-[1px] hover:shadow-[0_2px_0_#EA580C] active:translate-y-[3px] active:shadow-none transition-all duration-100 no-underline"
              style={{ fontFamily: "'Plus Jakarta Sans', Inter, sans-serif" }}
              onClick={() => setIsMenuOpen(false)}
            >
              <Zap size={13} className="fill-current" strokeWidth={0} />
              Bắt đầu miễn phí
            </Link>
          </div>
        )}
      </nav>

      <div className="h-[76px]" />
    </>
  );
}
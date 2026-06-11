import { Link, useLocation } from "react-router";
import { Menu, X, Zap } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { BrandLogo } from "./BrandLogo";

/* ─── Nav items ─── */
const NAV_LINKS = [
  { to: "/about",    label: "Giới thiệu" },
  { to: "/features", label: "Tính năng"  },
  { to: "/pricing",  label: "Bảng giá"   },
  { to: "/contact",  label: "Liên hệ"    },
];

export function PublicNavbar() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  /* Refs for sliding calculations */
  const navContainerRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  /* Pill indicator styles for hover and active states */
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const [activeStyle, setActiveStyle] = useState({ left: 0, width: 0, opacity: 0 });

  /* ── Scroll detection ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Close mobile menu on route change ── */
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  /* ── Active link check ── */
  const isActive = (to: string) => location.pathname === to;

  /* ── Update active underline position ── */
  const updateActiveIndicator = useCallback(() => {
    const activeIdx = NAV_LINKS.findIndex(l => l.to === location.pathname);
    if (activeIdx !== -1) {
      const el = linkRefs.current[activeIdx];
      const parent = el?.parentElement;
      if (el && parent) {
        const parentRect = parent.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        setActiveStyle({
          left: elRect.left - parentRect.left + (elRect.width - 24) / 2, // centers a 24px wide underline
          width: 24,
          opacity: 1,
        });
      }
    } else {
      setActiveStyle({ left: 0, width: 0, opacity: 0 });
    }
  }, [location.pathname]);

  /* ── Handle active underline updates ── */
  useEffect(() => {
    const timer = setTimeout(updateActiveIndicator, 60);
    window.addEventListener("resize", updateActiveIndicator);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateActiveIndicator);
    };
  }, [location.pathname, updateActiveIndicator]);

  /* ── Hover calculations ── */
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
    setPillStyle(prev => ({ ...prev, opacity: 0 }));
  };

  /* ── Dynamic text colors for nav links ── */
  const getLinkColor = (to: string, idx: number) => {
    if (isActive(to)) return "#FF6B00";
    if (hoveredIdx === idx) return "#FF6B00";
    return "#4B5563";
  };

  return (
    <>
      {/* ── Global Styles & Keyframes ── */}
      <style>{`
        /* Robust media query toggles for desktop/mobile elements */
        @media (max-width: 767px) {
          .nav-desktop {
            display: none !important;
          }
          .nav-mobile-btn {
            display: flex !important;
          }
        }
        @media (min-width: 768px) {
          .nav-desktop {
            display: flex !important;
          }
          .nav-mobile-btn {
            display: none !important;
          }
        }

        /* Nav slide down animation */
        @keyframes navSlideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0);     }
        }

        /* Mobile menu dropdown slide-in */
        @keyframes mobileMenuIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.99); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }

        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
      `}</style>

      {/* ══════════════════════════════════════
          MAIN NAVBAR WRAPPER (Full width header)
          ══════════════════════════════════════ */}
      <nav
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          zIndex: 1000,
          height: "76px",
          /* Deep elite glassmorphism */
          background: "rgba(255, 255, 255, 0.65)",
          backdropFilter: "blur(20px) saturate(190%)",
          WebkitBackdropFilter: "blur(20px) saturate(190%)",
          /* Soft separation borders */
          borderBottom: "1px solid rgba(229, 231, 235, 0.35)",
          /* Soft ambient shadow when scrolled */
          boxShadow: "none",
          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          animation: "navSlideDown 0.45s cubic-bezier(0.16, 1, 0.3, 1) both",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            height: "100%",
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* ══════════════════════════════════════
              LEFT: Brand Logo (Flex section)
              ══════════════════════════════════════ */}
          <div style={{ flex: 1, display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
            <Link
              to="/"
              style={{
                display: "flex",
                alignItems: "center",
                textDecoration: "none",
                transition: "opacity 0.2s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
            >
              <BrandLogo size={26} textSize="1.1rem" align="left" />
            </Link>
          </div>

          {/* ══════════════════════════════════════
              CENTER: Desktop Menu (Symmetric)
              ══════════════════════════════════════ */}
          <div
            ref={navContainerRef}
            className="nav-desktop"
            style={{
              position: "relative",
              alignItems: "center",
              gap: "4px",
              padding: "4px",
              borderRadius: "99px",
              background: scrolled ? "rgba(241, 245, 249, 0.4)" : "rgba(241, 245, 249, 0.6)",
              border: "1px solid rgba(226, 232, 240, 0.8)",
              backdropFilter: "blur(8px)",
              transition: "all 0.3s ease",
            }}
            onMouseLeave={handleMouseLeave}
          >
            {/* Sliding Pill Hover Highlight */}
            <span
              style={{
                position: "absolute",
                top: 4,
                bottom: 4,
                left: pillStyle.left,
                width: pillStyle.width,
                opacity: pillStyle.opacity,
                borderRadius: "99px",
                /* High-end warm orange-purple subtle gradient glow */
                background: "linear-gradient(135deg, rgba(255, 107, 0, 0.09) 0%, rgba(124, 58, 237, 0.06) 100%)",
                border: "1px solid rgba(255, 107, 0, 0.18)",
                boxShadow: "0 4px 12px rgba(255, 107, 0, 0.05)",
                transition: "left 0.24s cubic-bezier(0.25, 1, 0.5, 1), width 0.24s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.15s ease",
                pointerEvents: "none",
                zIndex: 0,
              }}
            />

            {/* Sliding Active Underline ("Điểm nhấn") */}
            <span
              style={{
                position: "absolute",
                bottom: "3px",
                left: activeStyle.left,
                width: activeStyle.width,
                height: "3px",
                borderRadius: "99px",
                background: "#FF6B00",
                boxShadow: "0 2px 6px rgba(255, 107, 0, 0.4)",
                opacity: activeStyle.opacity,
                transition: "left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease, width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                pointerEvents: "none",
                zIndex: 0,
              }}
            />

            {/* Links */}
            {NAV_LINKS.map(({ to, label }, idx) => {
              const active = isActive(to);
              return (
                <Link
                  key={to}
                  to={to}
                  ref={el => { linkRefs.current[idx] = el; }}
                  style={{
                    position: "relative",
                    zIndex: 1,
                    padding: "8px 18px",
                    fontSize: "0.85rem",
                    fontWeight: active ? 700 : 500,
                    fontFamily: "'Plus Jakarta Sans', Inter, sans-serif",
                    letterSpacing: "-0.01em",
                    color: getLinkColor(to, idx),
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    transition: "color 0.2s ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={e => handleMouseEnter(idx, e.currentTarget)}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* ══════════════════════════════════════
              RIGHT: Desktop CTA & Mobile Toggle
              ══════════════════════════════════════ */}
          <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "10px" }}>
            {/* Desktop Auth Buttons */}
            <div className="nav-desktop" style={{ alignItems: "center", gap: "8px" }}>
              {/* Login */}
              <Link
                to="/login?mode=login"
                style={{
                  padding: "8px 16px",
                  borderRadius: "99px",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  fontFamily: "'Plus Jakarta Sans', Inter, sans-serif",
                  letterSpacing: "-0.01em",
                  color: "#4B5563",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                  border: "1px solid transparent",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = "#111827";
                  e.currentTarget.style.background = "rgba(0, 0, 0, 0.04)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = "#4B5563";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                Đăng nhập
              </Link>

              {/* High-end CTA Button */}
              <Link
                to="/login?mode=register"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 18px",
                  borderRadius: "99px",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  fontFamily: "'Plus Jakarta Sans', Inter, sans-serif",
                  letterSpacing: "-0.01em",
                  color: "#FFFFFF",
                  textDecoration: "none",
                  background: "linear-gradient(135deg, #FF6B00 0%, #FF8C42 100%)",
                  boxShadow: "0 4px 14px rgba(255, 107, 0, 0.25)",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(255, 107, 0, 0.38)";
                  e.currentTarget.style.filter = "brightness(1.04)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 14px rgba(255, 107, 0, 0.25)";
                  e.currentTarget.style.filter = "brightness(1)";
                }}
              >
                <Zap size={13} fill="currentColor" strokeWidth={0} />
                Bắt đầu miễn phí
              </Link>
            </div>

            {/* Mobile Hamburger toggle */}
            <button
              className="nav-mobile-btn"
              style={{
                alignItems: "center",
                justifyContent: "center",
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                border: "1px solid rgba(255, 107, 0, 0.3)",
                background: "rgba(255, 107, 0, 0.05)",
                color: "#FF6B00",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onClick={() => setIsMenuOpen(v => !v)}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255, 107, 0, 0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255, 107, 0, 0.05)"; }}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════
            MOBILE DROPDOWN DRAWER
            ══════════════════════════════════════ */}
        {isMenuOpen && (
          <div
            style={{
              position: "absolute",
              top: "76px",
              left: 0, right: 0,
              padding: "10px 16px 16px",
              background: "rgba(255, 255, 255, 0.97)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderBottom: "1px solid rgba(229, 231, 235, 0.8)",
              boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
              animation: "mobileMenuIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) both",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {NAV_LINKS.map(({ to, label }) => {
              const active = isActive(to);
              return (
                <Link
                  key={to}
                  to={to}
                  style={{
                    display: "block",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    fontSize: "0.9rem",
                    fontWeight: active ? 700 : 500,
                    fontFamily: "'Plus Jakarta Sans', Inter, sans-serif",
                    color: active ? "#FF6B00" : "#374151",
                    background: active ? "rgba(255, 107, 0, 0.06)" : "transparent",
                    textDecoration: "none",
                    transition: "all 0.15s ease",
                  }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {label}
                </Link>
              );
            })}

            {/* Divider */}
            <div style={{ height: "1px", background: "rgba(229, 231, 235, 0.8)", margin: "4px 0" }} />

            {/* Mobile Auth Links */}
            <Link
              to="/login?mode=login"
              style={{
                display: "block",
                padding: "12px 16px",
                borderRadius: "10px",
                fontSize: "0.9rem",
                fontWeight: 500,
                fontFamily: "'Plus Jakarta Sans', Inter, sans-serif",
                color: "#374151",
                textDecoration: "none",
              }}
              onClick={() => setIsMenuOpen(false)}
            >
              Đăng nhập
            </Link>

            <Link
              to="/login?mode=register"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "12px 16px",
                borderRadius: "10px",
                fontSize: "0.9rem",
                fontWeight: 700,
                fontFamily: "'Plus Jakarta Sans', Inter, sans-serif",
                color: "#FFFFFF",
                textDecoration: "none",
                background: "linear-gradient(135deg, #FF6B00 0%, #FF8C42 100%)",
                boxShadow: "0 4px 12px rgba(255, 107, 0, 0.2)",
              }}
              onClick={() => setIsMenuOpen(false)}
            >
              <Zap size={14} fill="currentColor" strokeWidth={0} />
              Bắt đầu miễn phí
            </Link>
          </div>
        )}
      </nav>
      {/* Spacer to push content below fixed header */}
      <div style={{ height: "76px", transition: "height 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }} />
    </>
  );
}


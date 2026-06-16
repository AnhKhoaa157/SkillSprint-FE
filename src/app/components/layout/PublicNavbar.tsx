import { Link, useLocation } from "react-router";
import { Menu, X, Zap } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { BrandLogo } from "./BrandLogo";

/* Requirement 1:
   - Remove "Cộng đồng"
   - Re-align remaining links for a balanced premium layout
*/
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
          left: elRect.left - parentRect.left + (elRect.width - 26) / 2,
          width: 26,
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

  const getLinkColor = (to: string, idx: number) => {
    if (isActive(to)) return "#FF6B00";
    if (hoveredIdx === idx) return "#FF6B00";
    return "#475569";
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
          from { opacity: 0; transform: translateY(-6px) scale(0.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <nav
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          height: "76px",
          background: scrolled ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.68)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderBottom: "1px solid rgba(226, 232, 240, 0.55)",
          boxShadow: scrolled ? "0 12px 32px rgba(15,23,42,0.05)" : "none",
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
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            gap: "20px",
          }}
        >
          {/* Left: Logo */}
          <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
            <Link
              to="/"
              className="flex items-center"
              style={{ textDecoration: "none", transition: "opacity 0.2s ease" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.85";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              <div className="h-12 flex items-center overflow-visible">
                <BrandLogo size={60} align="left" />
              </div>
            </Link>
          </div>

          {/* Center: Desktop nav */}
          <div
            className="nav-desktop"
            style={{
              position: "relative",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "5px",
              borderRadius: "999px",
              background: scrolled ? "rgba(248,250,252,0.76)" : "rgba(248,250,252,0.9)",
              border: "1px solid rgba(226,232,240,0.95)",
              boxShadow: "0 6px 18px rgba(15,23,42,0.04)",
              minWidth: "fit-content",
            }}
            onMouseLeave={handleMouseLeave}
          >
            {/* Hover pill */}
            <span
              style={{
                position: "absolute",
                top: 5,
                bottom: 5,
                left: pillStyle.left,
                width: pillStyle.width,
                opacity: pillStyle.opacity,
                borderRadius: "999px",
                background:
                  "linear-gradient(135deg, rgba(255,107,0,0.08) 0%, rgba(255,140,66,0.04) 100%)",
                border: "1px solid rgba(255,107,0,0.14)",
                boxShadow: "0 4px 12px rgba(255,107,0,0.05)",
                transition:
                  "left 0.24s cubic-bezier(0.25, 1, 0.5, 1), width 0.24s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.15s ease",
                pointerEvents: "none",
                zIndex: 0,
              }}
            />

            {/* Active underline */}
            <span
              style={{
                position: "absolute",
                bottom: 3,
                left: activeStyle.left,
                width: activeStyle.width,
                height: 3,
                borderRadius: "999px",
                background: "#FF6B00",
                boxShadow: "0 2px 8px rgba(255,107,0,0.35)",
                opacity: activeStyle.opacity,
                transition:
                  "left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease, width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                pointerEvents: "none",
                zIndex: 0,
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
                  style={{
                    position: "relative",
                    zIndex: 1,
                    padding: "9px 18px",
                    fontSize: "0.875rem",
                    fontWeight: active ? 700 : 500,
                    fontFamily: "'Plus Jakarta Sans', Inter, sans-serif",
                    letterSpacing: "-0.01em",
                    color: getLinkColor(link.to, idx),
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    transition: "color 0.2s ease",
                  }}
                  onMouseEnter={(e) => handleMouseEnter(idx, e.currentTarget)}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right: CTA */}
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "10px" }}>
            <div className="nav-desktop" style={{ alignItems: "center", gap: "8px" }}>
              <Link
                to="/login?mode=login"
                style={{
                  padding: "8px 16px",
                  borderRadius: "999px",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  fontFamily: "'Plus Jakarta Sans', Inter, sans-serif",
                  color: "#475569",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                  border: "1px solid transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#111827";
                  e.currentTarget.style.background = "rgba(15,23,42,0.04)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#475569";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                Đăng nhập
              </Link>

              <Link
                to="/login?mode=register"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 18px",
                  borderRadius: "999px",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  fontFamily: "'Plus Jakarta Sans', Inter, sans-serif",
                  color: "#FFFFFF",
                  textDecoration: "none",
                  background: "linear-gradient(135deg, #FF6B00 0%, #FF8C42 100%)",
                  boxShadow: "0 4px 14px rgba(255, 107, 0, 0.25)",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(255, 107, 0, 0.38)";
                  e.currentTarget.style.filter = "brightness(1.04)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 14px rgba(255, 107, 0, 0.25)";
                  e.currentTarget.style.filter = "brightness(1)";
                }}
              >
                <Zap size={13} fill="currentColor" strokeWidth={0} />
                Bắt đầu miễn phí
              </Link>
            </div>

            {/* Mobile menu button */}
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
              onClick={() => setIsMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div
            style={{
              position: "absolute",
              top: "76px",
              left: 0,
              right: 0,
              padding: "10px 16px 16px",
              background: "rgba(255,255,255,0.97)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderBottom: "1px solid rgba(229,231,235,0.8)",
              boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
              animation: "mobileMenuIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) both",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {NAV_LINKS.map((link) => {
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
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
                  }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}

            <div style={{ height: 1, background: "rgba(229,231,235,0.8)", margin: "4px 0" }} />

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

      <div style={{ height: "76px" }} />
    </>
  );
}
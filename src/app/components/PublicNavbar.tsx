import { Link } from "react-router";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { BrandLogo } from "./BrandLogo";

export function PublicNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled
          ? "rgba(255,255,255,0.94)"
          : "rgba(255,255,255,0.78)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: scrolled ? "1px solid #E5E7EB" : "1px solid transparent",
      }}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2"
            style={{ color: "#0F172A", fontWeight: 700, fontSize: "1.1rem", letterSpacing: "-0.02em" }}
          >
            <BrandLogo size={32} textSize="1.1rem" />
          </Link>

          {/* Desktop Navigation - pill centered */}
          <div
            className="hidden md:flex items-center gap-1 px-2 py-1 rounded-full"
            style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
          >
            <Link to="/about" className="text-sm px-4 py-1.5 rounded-full transition-all duration-200"
              style={{ color: "#475569" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#FFFFFF"; e.currentTarget.style.color = "#0F172A"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#475569"; }}
            >Giới thiệu</Link>
            <Link to="/features" className="text-sm px-4 py-1.5 rounded-full transition-all duration-200"
              style={{ color: "#475569" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#FFFFFF"; e.currentTarget.style.color = "#0F172A"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#475569"; }}
            >Tính năng</Link>
            <Link to="/pricing" className="px-4 py-1.5 rounded-full transition-all duration-200 text-[14px] text-left"
              style={{ color: "#475569" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#FFFFFF"; e.currentTarget.style.color = "#0F172A"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#475569"; }}
            >Gói dịch vụ</Link>
            <Link to="/contact" className="text-sm px-4 py-1.5 rounded-full transition-all duration-200"
              style={{ color: "#475569" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#FFFFFF"; e.currentTarget.style.color = "#0F172A"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#475569"; }}
            >Liên hệ</Link>
          </div>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/auth?mode=login"
              className="text-sm px-4 py-2 rounded-full transition-all duration-200"
              style={{ color: "#64748B", fontWeight: 500 }}
              onMouseEnter={e => { e.currentTarget.style.color = "#0F172A"; e.currentTarget.style.background = "#F1F5F9"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#64748B"; e.currentTarget.style.background = "transparent"; }}
            >
              Đăng nhập
            </Link>
            <Link
              to="/auth?mode=register"
              className="text-sm px-5 py-2 rounded-full text-white transition-all duration-200"
              style={{
                fontWeight: 600,
                background: "linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)",
                boxShadow: "0 0 20px rgba(255,107,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 0 28px rgba(255,107,0,0.45), inset 0 1px 0 rgba(255,255,255,0.15)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 0 20px rgba(255,107,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              Bắt đầu miễn phí
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 transition-colors"
            style={{ color: "#64748B" }}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div style={{ background: "rgba(255,255,255,0.98)", borderBottom: "1px solid #E2E8F0" }}>
          <div className="px-5 pt-3 pb-6 space-y-1 max-w-7xl mx-auto">
            {[
              { to: "/about", label: "Giới thiệu" },
              { to: "/features", label: "Tính năng" },
              { to: "/pricing", label: "Gói dịch vụ" },
              { to: "/contact", label: "Liên hệ" },
              { to: "/auth?mode=login", label: "Đăng nhập" },
            ].map(({ to, label }) => (
              (
                <Link
                  key={label}
                  to={to!}
                  className="block px-4 py-2.5 rounded-xl text-sm transition-colors"
                  style={{ color: "#475569" }}
                  onClick={() => setIsMenuOpen(false)}
                  onMouseEnter={e => { e.currentTarget.style.background = "#F8FAFC"; e.currentTarget.style.color = "#0F172A"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#475569"; }}
                >
                  {label}
                </Link>
              )
            ))}
            <Link
              to="/auth?mode=register"
              className="block mt-4 text-center px-4 py-3 rounded-xl text-sm text-white"
              style={{ fontWeight: 600, background: "linear-gradient(135deg, #FF6B00, #EA580C)" }}
              onClick={() => setIsMenuOpen(false)}
            >
              Bắt đầu miễn phí
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

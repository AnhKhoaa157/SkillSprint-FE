import { Link } from "react-router";
import { ArrowRight, Facebook } from "lucide-react";
import { BrandLogo } from "./BrandLogo";

const footerLinks = {
  "Sản phẩm": [
    { label: "Tính năng", to: "/features" },
    { label: "Bảng giá", to: "/pricing" },
    { label: "Lộ trình", to: "/login" },
  ],
  "Công ty": [
    { label: "Về chúng tôi", to: "/about" },
    { label: "Liên hệ", to: "/contact" },
  ],
  "Pháp lý": [
    { label: "Chính sách bảo mật", to: "/privacy" },
    { label: "Điều khoản sử dụng", to: "/terms" },
    { label: "Chính sách Cookie", to: "/cookies" },
  ],
};

function TikTokIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={`${className} fill-current`} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .79.11V9.5a6.27 6.27 0 0 0-3.1-1.74 6.36 6.36 0 0 0-6 5.56 6.34 6.34 0 0 0 6.1 7.18A6.3 6.3 0 0 0 15.82 16c0-.05.02-.1.02-.15V8.82a8.17 8.17 0 0 0 4.85 1.58V7a4.83 4.83 0 0 1-1.1-.31z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer
      id="public-footer"
      className="relative border-t border-slate-200/60 bg-[linear-gradient(180deg,#F8FAFC_0%,#FFFFFF_40%,#FFF7ED_100%)]"
    >
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-14">
        
        {/* Banner CTA */}
        <section className="mb-12 rounded-[24px] border border-orange-100 bg-white px-6 py-8 shadow-[0_12px_40px_rgba(234,88,12,0.04)] md:px-8 md:py-10">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-orange-500">
                SkillSprint Platform
              </p>
              <h3 className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl lg:text-4xl">
                Sẵn sàng bứt phá kết quả học tập cùng{" "}
                <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                  SkillSprint
                </span>?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Kích hoạt lộ trình học tập cá nhân hóa, theo dõi tiến độ thông minh và xây dựng nhịp học tập tập trung, bền vững hơn mỗi ngày.
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-start gap-2.5 lg:items-end">
              <Link
                to="/login?mode=register"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-3 text-xs font-semibold text-white no-underline transition-all duration-300 hover:-translate-y-0.5 hover:opacity-95 hover:shadow-[0_10px_20px_rgba(234,88,12,0.2)]"
              >
                Bắt đầu miễn phí ngay
                <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
              <p className="text-[11px] text-slate-400 lg:text-right">
                Không cần thẻ tín dụng • Thiết lập nhanh
              </p>
            </div>
          </div>
        </section>

        {/* Links Grid */}
        <section className="grid grid-cols-1 gap-10 border-b border-orange-100/70 pb-10 lg:grid-cols-[1.35fr_0.75fr_0.75fr_0.85fr]">
          <div className="max-w-sm">
            <Link to="/" className="inline-flex items-center no-underline">
              <BrandLogo size={38} textColor="#0F172A" textSize="1rem" align="left" />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-slate-500">
              Nền tảng học tập ứng dụng AI giúp sinh viên xây dựng lộ trình rõ ràng, duy trì nhịp học bền vững và tập trung vào kết quả.
            </p>
            <div className="mt-5 flex flex-wrap gap-1.5 text-[10px] font-semibold tracking-wide">
              <span className="rounded-full bg-orange-50/80 px-2.5 py-0.5 text-orange-600 border border-orange-100/50">
                AI Learning Flow
              </span>
              <span className="rounded-full bg-orange-50/80 px-2.5 py-0.5 text-orange-600 border border-orange-100/50">
                Smart Progress
              </span>
              <span className="rounded-full bg-orange-50/80 px-2.5 py-0.5 text-orange-600 border border-orange-100/50">
                Focused Results
              </span>
            </div>
          </div>

          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4 className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                {section}
              </h4>
              <ul className="space-y-2.5">
                {links.map(({ label, to }) => (
                  <li key={label}>
                    <Link
                      to={to}
                      className="text-sm font-medium text-slate-600 no-underline transition-colors duration-150 hover:text-orange-500"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        {/* Bottom bar */}
        <section className="flex flex-col gap-5 pt-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 text-xs font-medium text-slate-400">
            <p>© 2026 SkillSprint. Đồng hành cùng sinh viên học đúng hướng.</p>
            <span className="hidden text-slate-300 sm:inline">•</span>
            <p>
              Hỗ trợ: <span className="hover:text-orange-500 transition-colors cursor-pointer">skillsprint2026@gmail.com</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://www.facebook.com/profile.php?id=61590323403077"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook Group SkillSprint"
              className="group flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 text-slate-500 shadow-[0_1px_3px_rgba(15,23,42,0.04)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50/60 hover:text-orange-500 hover:shadow-[0_8px_20px_rgba(234,88,12,0.12)]"
            >
              <Facebook size={17} className="transition-transform duration-300 group-hover:scale-110" />
            </a>

            <a
              href="https://www.tiktok.com/@skillsprint26"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok SkillSprint"
              className="group flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 text-slate-500 shadow-[0_1px_3px_rgba(15,23,42,0.04)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50/60 hover:text-orange-500 hover:shadow-[0_8px_20px_rgba(234,88,12,0.12)]"
            >
              <TikTokIcon className="w-[17px] h-[17px] transition-transform duration-300 group-hover:scale-110" />
            </a>
          </div>
        </section>
      </div>
    </footer>
  );
}
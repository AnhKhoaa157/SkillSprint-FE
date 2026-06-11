import { Link } from "react-router";
import { BrandLogo } from "./BrandLogo";
import { Mail, Facebook } from "lucide-react";

const footerLinks = {
  "Sản phẩm": [
    { label: "Tính năng", to: "/login" },
    { label: "Gói dịch vụ", to: "/login" },
    { label: "Lộ trình", to: "/login" },
    { label: "Phân tích", to: "/login" }
  ],
  "Công ty": [
    { label: "Về chúng tôi", to: "/about" },
    { label: "Blog", to: "#" },
    { label: "Tuyển dụng", to: "#" },
    { label: "Liên hệ", to: "/contact" },
  ],
  "Tài nguyên": [
    { label: "Tài liệu", to: "#" },
    { label: "Tham chiếu API", to: "#" },
    { label: "Trạng thái hệ thống", to: "#" },
    { label: "Cộng đồng", to: "#" },
  ],
  "Pháp lý": [
    { label: "Chính sách bảo mật", to: "/privacy" },
    { label: "Điều khoản sử dụng", to: "/terms" },
    { label: "Chính sách Cookie", to: "/cookies" },
  ],
};

export function Footer() {
  return (
    <footer
      id="public-footer"
      style={{
        background: "transparent",
        borderTop: "1px solid #E2E8F0",
      }}
    >

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16">
        <div
          className="mb-10 rounded-2xl p-6 md:p-8"
          style={{
            border: "1px solid #FED7AA",
            background: "linear-gradient(135deg, #FFF7ED 0%, #FFFFFF 65%)",
          }}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div style={{ width:"32px", height:"32px", borderRadius:"8px", background:"#FFEDD5", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Mail size={16} color="#EA580C" />
                </div>
                <span
                  className="text-[11px] px-2 py-1 rounded-full"
                  style={{ color: "#9A3412", background: "#FFEDD5", fontWeight: 700 }}
                >
                  Bản tin học tập AI
                </span>
              </div>
              <p className="text-sm" style={{ color: "#64748B" }}>
                Nhận mẹo học theo tuần, mẫu lịch ôn thi và cập nhật tính năng mới từ SkillSprint.
              </p>
            </div>
            <form className="w-full md:w-auto" onSubmit={(e) => e.preventDefault()}>
              {/* Wrapper box: the CTA sits INSIDE with a p-1.5 padding buffer so the
                  border-radius flow of the white container is never broken */}
              <div className="flex items-center gap-1.5 w-full max-w-md border border-slate-200 rounded-xl p-1.5 bg-white focus-within:border-[#FF6B00] focus-within:ring-4 focus-within:ring-[#FF6B00]/10 transition-all shadow-sm">
                <input
                  type="email"
                  placeholder="Nhập email sinh viên"
                  className="flex-1 min-w-0 bg-transparent border-none px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-lg px-4 py-2 text-sm text-white border-none cursor-pointer"
                  style={{
                    fontWeight: 700,
                    background: "linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)",
                    boxShadow: "0 2px 8px rgba(255,107,0,0.25)",
                  }}
                >
                  Đăng ký nhận tin
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-7 gap-8 mb-14">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <BrandLogo size={34} textColor="#0F172A" textSize="1rem" align="left" />
            </Link>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "#64748B", maxWidth: "260px" }}>
              Trung tâm điều phối học tập dùng AI, giúp sinh viên có lộ trình rõ ràng, bám sát tiến độ và giữ nhịp học ổn định.
            </p>
            <div className="flex items-center flex-wrap gap-2">
              {["X", "GitHub", "Discord", "Facebook"].map(soc => (
                <a
                  key={soc}
                  href="#"
                  className="px-3 py-1.5 rounded-full text-xs transition-all duration-200"
                  style={{
                    color: "#64748B",
                    border: "1px solid #E2E8F0",
                    fontWeight: 500,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = "#0F172A";
                    e.currentTarget.style.borderColor = "#CBD5E1";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = "#64748B";
                    e.currentTarget.style.borderColor = "#E2E8F0";
                  }}
                >
                  {soc}
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4
                className="text-xs uppercase tracking-widest mb-4"
                style={{ color: "#94A3B8", fontWeight: 600, letterSpacing: "0.1em" }}
              >
                {section}
              </h4>
              <ul className="space-y-3">
                {links.map(({ label, to }) => (
                  <li key={label}>
                    <Link
                      to={to}
                      className={`text-sm font-medium transition-colors duration-200${
                        section === "Pháp lý"
                          ? " text-slate-500 hover:text-[#FF6B00]"
                          : ""
                      }`}
                      style={section !== "Pháp lý" ? { color: "#64748B" } : undefined}
                      onMouseEnter={e => { if (section !== "Pháp lý") e.currentTarget.style.color = "#0F172A"; }}
                      onMouseLeave={e => { if (section !== "Pháp lý") e.currentTarget.style.color = "#64748B"; }}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8"
          style={{ borderTop: "1px solid #E2E8F0" }}
        >
          <div className="flex items-center gap-3">
            <p className="text-xs" style={{ color: "#94A3B8" }}>
              © 2026 SkillSprint. Đồng hành cùng sinh viên học đúng hướng.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: "#22c55e", boxShadow: "0 0 6px #22c55e" }}
                />
                <span className="text-xs" style={{ color: "#94A3B8" }}>
                  Hệ thống hoạt động ổn định
                </span>
              </div>
              <span className="text-xs" style={{ color: "#94A3B8" }}>
                Hỗ trợ: skillsprint2026@gmail.com
              </span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://www.facebook.com/profile.php?id=61590323403077"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook SkillSprint"
                className="text-slate-400 hover:text-[#FF6B00] hover:-translate-y-0.5 transition-all duration-200"
              >
                <Facebook size={18} />
              </a>
              <a
                href="https://www.tiktok.com/@skillsprint26"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok SkillSprint"
                className="text-slate-400 hover:text-[#FF6B00] hover:-translate-y-0.5 transition-all duration-200"
              >
                <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .79.11V9.5a6.27 6.27 0 0 0-3.1-1.74 6.36 6.36 0 0 0-6 5.56 6.34 6.34 0 0 0 6.1 7.18A6.3 6.3 0 0 0 15.82 16c0-.05.02-.1.02-.15V8.82a8.17 8.17 0 0 0 4.85 1.58V7a4.83 4.83 0 0 1-1.1-.31z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

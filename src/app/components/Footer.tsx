import { Link } from "react-router";
import { BrandLogo } from "./BrandLogo";
import { Mail } from "lucide-react";

const footerLinks = {
  "Sản phẩm": [
    { label: "Tính năng", to: "/features" },
    { label: "Gói dịch vụ", to: "/features" },
    { label: "Lộ trình", to: "/app/roadmap" },
    { label: "Phân tích", to: "/app/analytics" },
    { label: "Bảng điều khiển", to: "/app" },
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
    { label: "Chính sách bảo mật", to: "#" },
    { label: "Điều khoản sử dụng", to: "#" },
    { label: "Chính sách cookie", to: "#" },
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
            <form className="w-full md:w-auto flex flex-col sm:flex-row gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Nhập email sinh viên"
                className="w-full sm:w-64 rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-orange-400"
              />
              <button
                className="rounded-xl px-4 py-2.5 text-sm text-white"
                style={{
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)",
                }}
              >
                Đăng ký nhận tin
              </button>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-10 mb-14">
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
                      className="text-sm transition-colors duration-200"
                      style={{ color: "#64748B" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#0F172A")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#64748B")}
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
              Hỗ trợ: hello@skillsprint.edu
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

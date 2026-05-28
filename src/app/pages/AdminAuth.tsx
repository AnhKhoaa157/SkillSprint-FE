import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { BrandLogo } from "../components/BrandLogo";

export default function AdminAuth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@edu.vn");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const allowedEmails = ["admin@edu.vn", "ops@skillsprint.vn", "partner-admin@skillsprint.vn"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!allowedEmails.includes(email.trim().toLowerCase())) {
      setError("Email này chưa được cấp quyền Admin Portal.");
      return;
    }

    if (password.length < 6 || !/\d/.test(password)) {
      setError("Mật khẩu cần tối thiểu 6 ký tự và có ít nhất 1 số.");
      return;
    }

    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 750));
    navigate("/admin");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ background: "#F8FAFC", fontFamily: "'Inter', sans-serif" }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div style={{ position: "absolute", width: "800px", height: "800px", background: "radial-gradient(circle, rgba(255,107,0,0.16) 0%, transparent 60%)", top: "-220px", right: "-140px", filter: "blur(26px)" }} />
        <div style={{ position: "absolute", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(14,165,233,0.10) 0%, transparent 60%)", bottom: "-120px", left: "-140px", filter: "blur(26px)" }} />
      </div>

      <button
        onClick={() => navigate("/auth")}
        className="absolute z-10 top-6 left-6 inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
        style={{ color: "#475569", border: "1px solid #CBD5E1", background: "#FFFFFF" }}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Quay lại đăng nhập sinh viên
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <BrandLogo size={46} showText={false} className="mb-4"/>
          <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Cổng Quản Trị SkillSprint</h1>
          <p className="text-sm text-slate-500">Truy cập bảo mật cho đội vận hành và đối tác trường đại học.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Email quản trị</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                title="Email quản trị"
                placeholder="admin@edu.vn"
                className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Mật khẩu</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                title="Mật khẩu quản trị"
                placeholder="••••••••"
                className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-xl pl-11 pr-11 py-3 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="accent-orange-500"
              />
              Ghi nhớ thiết bị này
            </label>
            <span className="text-[11px] text-slate-500">2FA: {remember ? "Thiết bị tin cậy" : "Bắt buộc"}</span>
          </div>

          {error && (
            <div className="text-xs px-3 py-2 rounded-lg border" style={{ color: "#FCA5A5", borderColor: "rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.12)" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all shadow-[0_8px_20px_rgba(255,107,0,0.28)] hover:shadow-[0_12px_24px_rgba(255,107,0,0.35)] flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            {submitting ? "Đang xác thực..." : "Đăng nhập an toàn"}
          </button>

          <p className="text-[11px] text-slate-500 text-center">
            Demo accounts: admin@edu.vn / ops@skillsprint.vn · Mật khẩu tối thiểu 6 ký tự, gồm 1 số.
          </p>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Bảo mật hạ tầng đám mây · Tuân thủ chuẩn ISO 27001
          </div>
          <p className="text-[10px] text-slate-500 text-center max-w-[280px]">
            Hệ thống áp dụng cơ chế ẩn danh dữ liệu người học và chính sách bảo vệ thông tin theo quy định nội bộ.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

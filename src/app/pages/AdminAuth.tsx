import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { BrandLogo } from "../components/BrandLogo";
import { getPostLoginPath, isAdminRole, login, storeAuthTokens } from "../../api/authService";

export default function AdminAuth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@gmail.com");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setError("Vui lòng nhập email và mật khẩu.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await login(normalizedEmail, password);

      if (result.status === "new-password-required") {
        setError("Tài khoản này cần hoàn tất đổi mật khẩu ở luồng đăng nhập chung.");
        return;
      }

      if (!isAdminRole(result.tokens.role)) {
        setError("Tài khoản này không có quyền truy cập Admin Portal.");
        return;
      }

      storeAuthTokens(result.tokens);
      navigate(getPostLoginPath(result.tokens.role));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Đăng nhập thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ background: "#F8FAFC", fontFamily: "'Inter', sans-serif" }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div style={{ position: "absolute", width: "900px", height: "900px", background: "radial-gradient(circle, rgba(255,107,0,0.12) 0%, transparent 60%)", top: "-260px", right: "-160px", filter: "blur(36px)" }} />
      </div>

      <button
        onClick={() => navigate("/auth")}
        className="absolute z-10 top-6 left-6 inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
        style={{ color: "#475569", border: "1px solid #CBD5E1", background: "#FFFFFF" }}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Quay lại đăng nhập sinh viên
      </button>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="relative z-10 w-full max-w-5xl bg-transparent rounded-2xl p-6">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
          {/* Left - branding */}
          <div style={{ background: "linear-gradient(180deg, rgba(255,107,0,0.06), rgba(255,107,0,0.02))" }} className="p-8 md:p-12 flex flex-col justify-center gap-6">
            <div className="flex items-center gap-3">
              <BrandLogo size={48} showText={true} />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">Cổng Quản Trị</h2>
              <p className="mt-2 text-slate-600">Quản lý hệ thống, phê duyệt đối tác và giám sát hoạt động.</p>
            </div>
            <div className="mt-4 text-sm text-slate-500">
              <ul className="space-y-2">
                <li className="flex items-center gap-3"><ShieldCheck className="w-4 h-4 text-emerald-500"/> Bảo mật &amp; vận hành</li>
                <li className="flex items-center gap-3"><TargetIconFallback /></li>
              </ul>
            </div>
          </div>

          {/* Right - form */}
          <div className="p-8 md:p-10">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900">Đăng nhập Admin</h3>
              <p className="text-sm text-slate-500">Đăng nhập bằng tài khoản quản trị để truy cập cổng quản trị.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Email</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Mail className="w-4 h-4"/></span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@company.com"
                    className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Mật khẩu</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Lock className="w-4 h-4"/></span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg pl-10 pr-10 py-3 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors" aria-label="Toggle password">
                    {showPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                  <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="accent-orange-500" /> Ghi nhớ
                </label>
                <a href="#" className="text-orange-600 hover:underline text-sm">Quên mật khẩu?</a>
              </div>

              {error && <div className="text-sm px-3 py-2 rounded-md" style={{ color: '#B91C1C', background: 'rgba(254,226,226,0.6)', border: '1px solid rgba(185,28,28,0.12)' }}>{error}</div>}

              <button type="submit" disabled={submitting} className="w-full py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-70 text-white font-semibold rounded-lg text-sm transition-shadow shadow">
                {submitting ? 'Đang xác thực...' : 'Đăng nhập'}
              </button>

              <p className="text-xs text-slate-500 text-center">Chỉ tài khoản có quyền admin mới được phép truy cập.</p>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// small fallback icon component to avoid introducing new imports for example list
function TargetIconFallback() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="#F59E0B" strokeWidth="1.5" fill="rgba(255,107,0,0.06)" />
      <circle cx="12" cy="12" r="4" fill="#FF6B00" />
    </svg>
  );
}

import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion"; // Đã đồng bộ về thư viện chuẩn
import { ArrowLeft } from "lucide-react";
import { useAdminAuth } from "./useAdminAuth";
import { BrandPanel, LoginView, ForgotStep1View, ForgotStep2View } from "./components";

export default function AdminAuth() {
  const navigate = useNavigate();
  const auth = useAdminAuth();

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden"
      style={{ background: "#F8FAFC", fontFamily: "'Inter', sans-serif" }}
    >
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          style={{
            position: "absolute", width: "900px", height: "900px",
            background: "radial-gradient(circle, rgba(255,107,0,0.10) 0%, transparent 60%)",
            top: "-260px", right: "-160px", filter: "blur(40px)",
          }}
        />
        <div
          style={{
            position: "absolute", width: "600px", height: "600px",
            background: "radial-gradient(circle, rgba(255,107,0,0.05) 0%, transparent 60%)",
            bottom: "-100px", left: "-100px", filter: "blur(40px)",
          }}
        />
      </div>

      {/* Back to student login */}
      <button
        onClick={() => navigate("/login")}
        className="absolute z-10 top-5 left-5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:bg-slate-100"
        style={{ color: "#475569", border: "1px solid #E2E8F0", background: "#FFFFFF" }}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Quay lại đăng nhập sinh viên
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-full max-w-4xl"
      >
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-[1fr_1.1fr]">

          {/* ── Left — static branding ── */}
          <BrandPanel />

          {/* ── Right — animated content ── */}
          <div className="p-8 md:p-10 min-h-[480px] flex flex-col justify-center">
            <AnimatePresence mode="wait">
              {auth.view === "login" && <LoginView auth={auth} />}
              {auth.view === "fp-step1" && <ForgotStep1View auth={auth} />}
              {auth.view === "fp-step2" && <ForgotStep2View auth={auth} />}
            </AnimatePresence>
          </div>

        </div>
      </motion.div>
    </div>
  );
}

import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion"; // Đã đồng bộ về thư viện chuẩn
import { ArrowLeft } from "lucide-react";
import { useAdminAuth } from "./useAdminAuth";
import { BrandPanel, LoginView, ForgotStep1View, ForgotStep2View } from "./components";

export default function AdminAuth() {
  const navigate = useNavigate();
  const auth = useAdminAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-slate-50 font-['Inter']">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-orange-400/10 blur-[80px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-orange-500/5 blur-[80px]" />
      </div>

      {/* Back to student login */}
      <button
        onClick={() => navigate("/login")}
        className="absolute z-20 top-5 left-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 hover:shadow active:scale-95"
      >
        <ArrowLeft className="w-4 h-4 text-slate-400" />
        Quay lại đăng nhập sinh viên
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[900px]"
      >
        <div className="bg-white rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.04)] ring-1 ring-slate-100 overflow-hidden grid grid-cols-1 md:grid-cols-[1.1fr_1fr]">

          {/* ── Left — static branding ── */}
          <BrandPanel />

          {/* ── Right — animated content ── */}
          <div className="p-8 sm:p-10 md:p-12 min-h-[500px] flex flex-col justify-center bg-white">
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

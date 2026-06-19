import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion"; // Đã đồng bộ về thư viện chuẩn
import { ArrowLeft } from "lucide-react";
import { useAdminAuth } from "./useAdminAuth";
import { BrandPanel, LoginView, ForgotStep1View, ForgotStep2View } from "./components";

export default function AdminAuth() {
  const navigate = useNavigate();
  const auth = useAdminAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-[#FDFBF7] font-sans">
      {/* Grid Coordinates Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1e9db_1px,transparent_1px),linear-gradient(to_bottom,#f1e9db_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0 opacity-45" />

      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-5%] right-[-5%] w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-[#FF8533]/12 to-[#FFA066]/6 blur-[120px]" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#FF8533]/6 to-transparent blur-[100px]" />
      </div>

      {/* Back to student login */}
      <button
        onClick={() => navigate("/login")}
        className="absolute z-20 top-6 left-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-200 hover:bg-slate-50 hover:border-slate-350 hover:text-slate-800 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] active:scale-95 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 text-slate-450" />
        Quay lại đăng nhập sinh viên
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[920px]"
      >
        <div className="relative bg-white/90 backdrop-blur-xl rounded-[2.2rem] border border-white/60 shadow-[0_0_0_1px_rgba(0,0,0,0.01),0_10px_30px_-10px_rgba(0,0,0,0.04),0_35px_70px_-15px_rgba(255,107,0,0.06),0_50px_100px_-20px_rgba(0,0,0,0.02)] overflow-hidden grid grid-cols-1 md:grid-cols-[1.15fr_1fr]">
          {/* Top Accent Gradient Bar */}
          <div className="absolute top-0 left-0 right-0 h-[3.5px] bg-gradient-to-r from-[#FFAC75] via-[#FF8533] to-[#FF6A00] z-20" />

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

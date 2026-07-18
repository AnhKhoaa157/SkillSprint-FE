import { useNavigate } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useAdminAuth } from "./useAdminAuth";
import { BrandPanel, ForgotStep1View, ForgotStep2View, LoginView } from "./components";

export default function AdminAuthPage() {
  const navigate = useNavigate();
  const auth = useAdminAuth();
  const prefersReducedMotion = useReducedMotion();
  const pageAnimation = prefersReducedMotion
    ? { initial: false, animate: { opacity: 1 }, transition: { duration: 0 } }
    : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.25, ease: "easeOut" as const } };

  return (
    <main className="relative flex min-h-[100dvh] flex-col overflow-x-hidden bg-[#fdfbf7] font-sans">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(249,115,22,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(249,115,22,0.08)_1px,transparent_1px)] bg-[size:24px_24px]" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-48 -top-44 size-[620px] rounded-full bg-orange-200/20 blur-[110px]" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-60 -left-52 size-[620px] rounded-full bg-amber-100/55 blur-[110px]" aria-hidden="true" />

      <header className="relative z-10 flex px-4 pt-4 sm:px-6 sm:pt-6">
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3.5 text-sm font-bold text-slate-600 shadow-sm transition-[border-color,background-color,color,box-shadow] hover:border-slate-300 hover:bg-white hover:text-slate-900 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F86206]/20"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Quay lại đăng nhập học viên
        </button>
      </header>

      <section className="relative z-10 flex min-w-0 flex-1 items-center justify-center px-4 pb-8 pt-6 sm:px-6 sm:pb-10 sm:pt-8 lg:px-10">
        <motion.div {...pageAnimation} className="min-w-0 w-full max-w-[1040px]">
          <div className="relative min-w-0 overflow-hidden rounded-[30px] border border-orange-100 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.12)] lg:grid lg:grid-cols-[1.08fr_0.92fr] lg:rounded-[34px]">
            <div className="absolute left-0 right-0 top-0 z-10 h-[3px] bg-[#F86206]" aria-hidden="true" />
            <BrandPanel />
            <div className="flex min-h-[540px] min-w-0 items-center bg-white p-6 sm:p-8 lg:min-h-[590px] lg:p-12">
              <AnimatePresence mode="wait">
                {auth.view === "login" ? <LoginView key="login" auth={auth} /> : null}
                {auth.view === "fp-step1" ? <ForgotStep1View key="fp-step1" auth={auth} /> : null}
                {auth.view === "fp-step2" ? <ForgotStep2View key="fp-step2" auth={auth} /> : null}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </section>
    </main>
  );
}

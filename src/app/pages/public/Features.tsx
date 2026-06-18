import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "motion/react";
import { Link } from "react-router";
import {
  Cpu, Clock3, LineChart, Target, Zap,
  ArrowUpRight, FileText, CheckCircle2, AlertCircle, Play
} from "lucide-react";
import { Footer as PublicFooter } from "../components/Footer";
import { PublicNavbar } from "../components/PublicNavbar";
import CursorSpotlight from "../components/CursorSpotlight";

/* ──────────────────────────────────────────────────────────────
   🎴 Tilt3D Card — Wrapper tạo hiệu ứng nghiêng 3D khi hover
   (Tương đồng với trang Giới thiệu)
 ────────────────────────────────────────────────────────────── */
function Tilt3D({
  children,
  className,
  intensity = 6,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const sx = useSpring(mx, { stiffness: 180, damping: 22 });
  const sy = useSpring(my, { stiffness: 180, damping: 22 });

  const rotateY = useTransform(sx, [-0.5, 0.5], [-intensity, intensity]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [intensity, -intensity]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <motion.div
      ref={ref}
      style={{ rotateX, rotateY, transformPerspective: 1200, transformStyle: "preserve-3d", ...style }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ y: -6, scale: 1.015 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function FeaturesLanding() {
  return (
    <div
      className="min-h-screen relative overflow-x-hidden antialiased selection:bg-orange-500/20 selection:text-orange-650 text-slate-800"
      style={{
        fontFamily: "'Plus Jakarta Sans', Inter, sans-serif",
        background: "linear-gradient(180deg, #ffffff 0%, #fffbf7 30%, #fff7ef 60%, #faf6f0 100%)",
      }}
    >
      {/* ── Lưới nền trang trí tinh xảo ── */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,107,0,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,107,0,0.02) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage: "radial-gradient(ellipse at 50% 30%, black 70%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 30%, black 70%, transparent 100%)",
        }}
      />

      {/* ── Hệ thống hào quang ambient 3 lớp ── */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] pointer-events-none z-0 opacity-80"
        style={{
          background: "radial-gradient(ellipse at center, rgba(255,107,0,0.08) 0%, rgba(251,146,60,0.02) 50%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      <div
        className="absolute top-[400px] right-[-100px] w-[500px] h-[500px] rounded-full pointer-events-none z-0 opacity-40"
        style={{
          background: "radial-gradient(circle, rgba(124,58,237,0.05) 0%, transparent 70%)",
          filter: "blur(70px)",
        }}
      />
      <div
        className="absolute top-[800px] left-[-100px] w-[500px] h-[500px] rounded-full pointer-events-none z-0 opacity-40"
        style={{
          background: "radial-gradient(circle, rgba(14,165,233,0.05) 0%, transparent 70%)",
          filter: "blur(70px)",
        }}
      />

      <div className="relative z-10">
        <PublicNavbar />

        <main className="pt-36 pb-32">
          {/* ================= HERO SECTION ================= */}
          <section className="px-4 text-center mb-20 relative z-10">
            <div className="max-w-4xl mx-auto">
              {/* Badge tia chớp (Zap) mới */}
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,247,237,0.95))",
                  border: "1.5px solid rgba(255,107,0,0.25)",
                  boxShadow: "0 10px 30px -5px rgba(255,107,0,0.1), inset 0 1.5px 0 rgba(255,255,255,1)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <Zap size={13} className="text-orange-500 fill-orange-500 animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-wider text-orange-600">
                  Hệ sinh thái lõi • AI-Driven Tech
                </span>
              </motion.div>

              {/* Heading có gạch chân trang trí gradient cam */}
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.08 }}
                className="text-4xl sm:text-5xl md:text-[62px] font-black leading-[1.15] tracking-tight text-slate-900 mb-6"
              >
                Đóng gói toàn bộ <br />
                <span className="relative inline-block mt-1">
                  <span
                    className="bg-clip-text text-transparent"
                    style={{
                      backgroundImage: "linear-gradient(135deg, #f97316 0%, #ea580c 50%, #e65c00 100%)",
                    }}
                  >
                    quy trình học tập.
                  </span>
                  <span className="absolute -bottom-2 left-0 w-full h-[5px] bg-orange-500/25 rounded-full" />
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.16 }}
                className="text-lg text-slate-500 leading-relaxed max-w-2xl mx-auto font-medium"
              >
                Biến hàng mớ tài liệu lộn xộn thành một lộ trình có thể thực thi. AI của chúng tôi sẽ đóng vai trò như một học giả trợ lý tận tụy, đồng hành cùng bạn đạt điểm tuyệt đối.
              </motion.p>
            </div>
          </section>

          {/* ================= HYPER-PREMIUM BENTO GRID ================= */}
          <section className="px-6 mb-32 relative z-10">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                
                {/* 🌟 BOX 1: AI SYLLABUS INTEGRATION (Span 2) */}
                <Tilt3D className="lg:col-span-2 rounded-[32px] h-full">
                  <CursorSpotlight className="h-full w-full rounded-[32px]" color="rgba(255,107,0,0.15)" size={280}>
                    <div className="bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-[32px] shadow-[0_30px_60px_-15px_rgba(15,23,42,0.05)] flex flex-col lg:flex-row justify-between items-stretch h-full relative overflow-hidden p-8 lg:p-10 min-h-[460px]">
                      {/* Ambient light for Box 1 */}
                      <div className="absolute top-0 right-0 w-[350px] h-[350px] bg-gradient-to-br from-orange-500/5 to-transparent blur-[60px] pointer-events-none" />

                      {/* Zone A — Text */}
                      <div className="relative z-10 w-full lg:w-1/2 flex flex-col justify-center pr-4">
                        <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-orange-50 border border-orange-100 mb-6 w-fit shadow-[0_4px_12px_rgba(255,107,0,0.06)]">
                          <Cpu size={24} className="text-orange-500 animate-spin" style={{ animationDuration: "8s" }} />
                        </div>
                        <h3 className="font-black text-2xl lg:text-3xl text-slate-900 mb-4 tracking-tight leading-snug">
                          Kỹ thuật bóc tách Syllabus chuyên sâu
                        </h3>
                        <p className="text-[15px] text-slate-600 leading-relaxed font-medium">
                          Hệ thống tự động quét sâu cấu trúc môn học học thuật, phân tách thành các lõi liên kết tri thức dạng mạng lưới và hiển thị rõ rệt lỗ hổng kỹ năng của bạn.
                        </p>
                      </div>

                      {/* Zone B — Illustration (High-Fidelity Mockup Window) */}
                      <div className="hidden lg:flex flex-col justify-end p-2 z-10">
                        <div className="w-[340px] h-[250px] bg-white border border-slate-200/80 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col transition-all duration-300 hover:border-orange-500/20">
                          {/* Window Header */}
                          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
                            <div className="flex gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                            </div>
                            <span className="text-[9px] font-mono font-bold text-slate-400">PARSING_ENGINE_CORE.ms</span>
                          </div>

                          {/* Interactive Simulated Node Canvas */}
                          <div className="p-4 flex-1 flex flex-col justify-center gap-3 relative bg-white overflow-hidden">
                            <div className="flex items-center gap-2.5 p-2.5 bg-white border border-slate-100 rounded-xl w-52 shadow-md z-10 hover:border-orange-200 transition-all">
                              <div className="bg-orange-500 p-2 rounded-lg text-white shadow-[0_4px_10px_rgba(255,107,0,0.35)]">
                                <FileText size={13} />
                              </div>
                              <div className="flex flex-col text-left">
                                <span className="text-[10px] font-black text-slate-800 truncate max-w-[110px]">Syllabus_OOP.pdf</span>
                                <span className="text-[8px] font-bold text-orange-500 tracking-wider uppercase animate-pulse">Parsing via AI</span>
                              </div>
                            </div>

                            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                              <path d="M180,68 C220,68 200,115 240,115" fill="none" stroke="#FF6B00" strokeWidth="2" strokeDasharray="4 4" />
                              <path d="M180,68 C220,68 200,165 240,165" fill="none" stroke="#E2E8F0" strokeWidth="2" />
                            </svg>

                            <div className="absolute right-3 top-12 flex flex-col gap-2.5 z-10">
                              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 border border-orange-100 shadow-[0_4px_10px_rgba(255,107,0,0.04)] rounded-lg border-l-4 border-l-orange-500 transform hover:scale-105 transition-all">
                                <CheckCircle2 size={10} className="text-orange-500" />
                                <span className="text-[9px] font-extrabold text-slate-700">Node 01: Polymorphism</span>
                              </div>
                              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 border border-purple-100 shadow-[0_4px_10px_rgba(147,51,234,0.04)] rounded-lg border-l-4 border-l-purple-500 transform hover:scale-105 transition-all">
                                <AlertCircle size={10} className="text-purple-500 animate-pulse" />
                                <span className="text-[9px] font-extrabold text-slate-700">Node 02: Interface vs Abstract</span>
                              </div>
                            </div>

                            {/* Scanning laser line */}
                            <motion.div
                              animate={{ y: [-10, 200, -10] }}
                              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                              className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500/40 to-transparent pointer-events-none"
                              style={{ zIndex: 5, boxShadow: "0 0 8px 1px rgba(255,107,0,0.15)" }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CursorSpotlight>
                </Tilt3D>

                {/* 🌟 BOX 2: ADVANCED TIME MANAGEMENT (Span 1) */}
                <Tilt3D className="lg:col-span-1 rounded-[32px] h-full">
                  <CursorSpotlight className="h-full w-full rounded-[32px]" color="rgba(147,51,234,0.15)" size={240}>
                    <div className="bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-[32px] shadow-[0_30px_60px_-15px_rgba(15,23,42,0.05)] flex flex-col justify-between h-full relative overflow-hidden p-8 lg:p-10 min-h-[460px]">
                      {/* Ambient light for Box 2 */}
                      <div className="absolute top-0 right-0 w-[250px] h-[250px] bg-gradient-to-br from-purple-500/5 to-transparent blur-[50px] pointer-events-none" />

                      <div className="relative z-10">
                        <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-purple-50 border border-purple-100 mb-6 w-fit shadow-[0_4px_12px_rgba(147,51,234,0.06)]">
                          <Clock3 size={24} className="text-purple-600" />
                        </div>
                        <h3 className="font-black text-xl lg:text-2xl text-slate-900 mb-3 tracking-tight leading-snug">
                          Quản trị tiêu điểm siêu năng suất
                        </h3>
                        <p className="text-sm text-slate-600 leading-relaxed font-medium">
                          Tích hợp đồng hồ Pomodoro cải tiến gắn liền trực tiếp với từng chương mục bài học giúp bảo vệ bạn khỏi sự xao nhãng.
                        </p>
                      </div>

                      {/* Pomodoro widget — physical look */}
                      <div className="mt-6 flex justify-center z-10">
                        <div className="bg-white/95 border border-slate-200/60 rounded-3xl shadow-[0_20px_45px_rgba(0,0,0,0.04)] p-5 w-60 text-center flex flex-col items-center transform transition-transform duration-300 hover:scale-102 hover:border-purple-300/35">
                          <div className="flex justify-between items-center mb-3 w-full">
                            <span className="text-[8px] font-black tracking-widest bg-purple-50 text-purple-600 border border-purple-100 px-2 py-0.5 rounded-md uppercase">DEEP FOCUS</span>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          </div>
                          <div className="relative w-22 h-22 my-2 flex items-center justify-center">
                            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                              <circle cx="44" cy="44" r="38" stroke="#F3E8FF" strokeWidth="4" fill="transparent" />
                              <circle cx="44" cy="44" r="38" stroke="#9333EA" strokeWidth="4" fill="transparent" strokeDasharray="239" strokeDashoffset="60" strokeLinecap="round" className="drop-shadow-[0_0_4px_rgba(147,51,234,0.3)]" />
                            </svg>
                            <span className="relative text-xl font-black tracking-tight text-slate-800 font-mono">21:48</span>
                          </div>
                          {/* Nút bấm vật lý lún xuống khi click */}
                          <button className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-[0_3px_0_#000000] hover:translate-y-[1px] hover:shadow-[0_2px_0_#000000] active:translate-y-[3px] active:shadow-none transition-all duration-100 cursor-pointer">
                            <Play size={8} fill="currentColor" /> Tạm dừng
                          </button>
                        </div>
                      </div>
                    </div>
                  </CursorSpotlight>
                </Tilt3D>

                {/* 🌟 BOX 3: PERFORMANCE ANALYTICS (Span 1) */}
                <Tilt3D className="lg:col-span-1 rounded-[32px] h-full">
                  <CursorSpotlight className="h-full w-full rounded-[32px]" color="rgba(14,165,233,0.15)" size={240}>
                    <div className="bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-[32px] shadow-[0_30px_60px_-15px_rgba(15,23,42,0.05)] flex flex-col justify-between h-full relative overflow-hidden p-8 lg:p-10 min-h-[460px]">
                      {/* Ambient light for Box 3 */}
                      <div className="absolute top-0 right-0 w-[250px] h-[250px] bg-gradient-to-br from-sky-500/5 to-transparent blur-[50px] pointer-events-none" />

                      <div className="relative z-10">
                        <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-sky-50 border border-sky-100 mb-6 w-fit shadow-[0_4px_12px_rgba(14,165,233,0.06)]">
                          <LineChart size={24} className="text-sky-600" />
                        </div>
                        <h3 className="font-black text-xl lg:text-2xl text-slate-900 mb-3 tracking-tight leading-snug">
                          Cảnh báo chỉ số trễ hạn
                        </h3>
                        <p className="text-sm text-slate-600 leading-relaxed font-medium">
                          Thuật toán tự động giám sát tốc độ xử lý Node kiến thức thực tế, phát ra tín hiệu cảnh báo đỏ nếu phát hiện rủi ro trễ lịch thi.
                        </p>
                      </div>

                      {/* Chart zone — glowing vector chart */}
                      <div className="relative z-0 mt-6 -mx-8 lg:-mx-10 -mb-8 lg:-mb-10 h-[170px] overflow-hidden rounded-b-[32px] transition-all duration-500 hover:scale-102 origin-bottom">
                        <div className="absolute top-2 left-6 bg-white/95 border border-slate-100 px-3 py-1.5 rounded-xl shadow-md flex items-center gap-2 z-10">
                          <span className="text-[9px] font-black text-slate-500">Hiệu suất học tập:</span>
                          <span className="text-xs font-black text-emerald-500">+24.8%</span>
                        </div>

                        <div className="w-full h-full relative">
                          <svg viewBox="0 0 100 50" className="absolute bottom-0 left-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                            <path d="M0,42 C15,42 20,35 35,28 C50,22 60,10 75,15 C85,18 90,4 100,2" fill="none" stroke="#0284C7" strokeWidth="3" strokeLinecap="round" className="drop-shadow-[0_2px_6px_rgba(2,132,199,0.3)]" />
                            <path d="M0,42 C15,42 20,35 35,28 C50,22 60,10 75,15 C85,18 90,4 100,2 L100,50 L0,50 Z" fill="url(#blueGlowGrad2)" opacity="0.15" />
                            <defs>
                              <linearGradient id="blueGlowGrad2" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#0EA5E9" stopOpacity="1" />
                                <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <div className="absolute right-[25%] top-[25%] w-3.5 h-3.5 rounded-full bg-white border-4 border-sky-500 shadow-[0_0_10px_rgba(2,132,199,0.7)] animate-pulse" />
                        </div>
                      </div>
                    </div>
                  </CursorSpotlight>
                </Tilt3D>

                {/* 🌟 BOX 4: ADAPTIVE ROADMAP CONTROLLER (Span 2) */}
                <Tilt3D className="lg:col-span-2 rounded-[32px] h-full">
                  <CursorSpotlight className="h-full w-full rounded-[32px]" color="rgba(34,197,94,0.15)" size={280}>
                    <div className="bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-[32px] shadow-[0_30px_60px_-15px_rgba(15,23,42,0.05)] flex flex-col lg:flex-row justify-between items-stretch h-full relative overflow-hidden p-8 lg:p-10 min-h-[460px]">
                      {/* Ambient light for Box 4 */}
                      <div className="absolute top-0 right-0 w-[350px] h-[350px] bg-gradient-to-br from-green-500/5 to-transparent blur-[60px] pointer-events-none" />

                      {/* Zone A — Text */}
                      <div className="relative z-10 w-full lg:w-1/2 flex flex-col justify-center pr-4">
                        <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-green-50 border border-green-100 mb-6 w-fit shadow-[0_4px_12px_rgba(34,197,94,0.06)]">
                          <Target size={24} className="text-green-600" />
                        </div>
                        <h3 className="font-black text-2xl lg:text-3xl text-slate-900 mb-4 tracking-tight leading-snug">
                          Lộ trình Sprint linh hoạt, thích ứng liên tục
                        </h3>
                        <p className="text-[15px] text-slate-600 leading-relaxed font-medium">
                          Chia cắt khối lượng kiến thức khổng lồ thành các chặng chạy nước rút ngắn ngày (Sprint). Hệ thống tự động tái cấu trúc phân phối lại nếu bạn lỡ trượt một ngày bận rộn.
                        </p>
                      </div>

                      {/* Zone B — Illustration (Stage Checklist) */}
                      <div className="hidden lg:flex flex-col justify-end p-2 z-10">
                        <div className="w-[340px] bg-white border border-slate-200/80 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.04)] p-5 transition-all duration-300 hover:border-green-500/20">
                          
                          {/* Item 1: Completed */}
                          <div className="flex items-center gap-3.5 mb-4">
                            <div className="w-16 text-[8px] font-black text-slate-400 tracking-wider">STAGE 01</div>
                            <div className="flex-1 bg-slate-50 h-10 rounded-xl relative overflow-hidden flex items-center px-3 border border-slate-200/50 shadow-sm">
                              <div className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-emerald-500 to-teal-400 w-full" />
                              <span className="relative z-10 text-[9px] font-black text-white flex items-center gap-1.5">
                                <CheckCircle2 size={10} /> Căn bản OOP (Hoàn thành)
                              </span>
                            </div>
                          </div>

                          {/* Item 2: Active */}
                          <div className="flex items-center gap-3.5 mb-4">
                            <div className="w-16 text-[8px] font-black text-emerald-600 tracking-wider flex items-center gap-0.5">
                              <span className="w-1 h-1 rounded-full bg-orange-500 animate-ping" />
                              ACTIVE
                            </div>
                            <div className="flex-1 bg-slate-50 h-10 rounded-xl relative overflow-hidden flex items-center px-3 border border-slate-200/50 shadow-sm">
                              <motion.div
                                initial={{ width: 0 }}
                                whileInView={{ width: "65%" }}
                                transition={{ duration: 1.2, delay: 0.3 }}
                                className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-orange-500 to-amber-400 shadow-[0_0_12px_rgba(249,115,22,0.25)]"
                              />
                              <span className="relative z-10 text-[9px] font-black text-slate-800 ml-1">
                                Cấu trúc giải thuật nâng cao (65%)
                              </span>
                            </div>
                          </div>

                          {/* Item 3: Upcoming */}
                          <div className="flex items-center gap-3.5">
                            <div className="w-16 text-[8px] font-black text-slate-400 tracking-wider">STAGE 03</div>
                            <div className="flex-1 bg-slate-50/50 h-10 rounded-xl relative overflow-hidden flex items-center px-3 border border-slate-200/30">
                              <span className="text-[9px] font-bold text-slate-400 italic">
                                Luyện đề thi kết khóa Mock Test
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CursorSpotlight>
                </Tilt3D>

              </div>
            </div>
          </section>

          {/* ================= ULTRA-PREMIUM CTA SECTION ================= */}
          <section className="px-6 relative z-10">
            <div className="max-w-6xl mx-auto text-center">
              <CursorSpotlight color="rgba(255,107,0,0.18)" size={240} className="rounded-[40px]">
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="bg-white/80 backdrop-blur-md rounded-[40px] border border-slate-200/80 shadow-[0_30px_70px_-15px_rgba(15,23,42,0.06)] relative overflow-hidden py-20 px-8 sm:px-12 transition-all duration-300 hover:border-orange-500/20"
                >
                  {/* Subtle Background Glows */}
                  <div className="absolute -top-1/2 -left-1/4 w-[60%] h-[150%] bg-orange-500/5 blur-[120px] pointer-events-none" />
                  <div className="absolute -bottom-1/2 -right-1/4 w-[60%] h-[150%] bg-purple-500/5 blur-[120px] pointer-events-none" />

                  <div className="relative z-20">
                    {/* Glowing Zap badge */}
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      transition={{ type: "spring", bounce: 0.5 }}
                      className="w-[72px] h-[72px] rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mb-8 mx-auto shadow-[0_8px_24px_rgba(255,107,0,0.1)] relative"
                    >
                      <Zap size={30} className="text-orange-500 fill-orange-500 animate-pulse" />
                      <div className="absolute inset-0 rounded-2xl bg-orange-500/10 blur-sm opacity-50 animate-ping" />
                    </motion.div>

                    <h2 className="font-black text-4xl sm:text-5xl md:text-[56px] text-slate-900 tracking-tight leading-[1.12] mb-6">
                      Sẵn sàng bứt phá cùng <br />
                      <span
                        className="bg-clip-text text-transparent"
                        style={{
                          backgroundImage: "linear-gradient(135deg, #f97316 0%, #ea580c 50%, #e65c00 100%)",
                        }}
                      >
                        SkillSprint?
                      </span>
                    </h2>

                    <p className="text-slate-500 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-10 font-medium">
                      Ngừng lãng phí thời gian vào việc loay hoay lên kế hoạch. Hãy để hệ thống làm điều đó, và bạn chỉ việc tập trung bứt phá điểm số.
                    </p>

                    <div className="flex justify-center">
                      <Link to="/login?mode=register" className="no-underline">
                        {/* Physical button with depth */}
                        <motion.button
                          className="inline-flex items-center gap-3 px-10 py-5 rounded-full bg-orange-500 text-white font-black text-lg cursor-pointer border-none shadow-[0_8px_0_#EA580C] hover:translate-y-[2px] hover:shadow-[0_6px_0_#EA580C] active:translate-y-[6px] active:shadow-[0_2px_0_#EA580C] transition-all duration-150"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <Zap size={18} className="fill-current" />
                          Bắt đầu trải nghiệm miễn phí
                          <ArrowUpRight size={18} />
                        </motion.button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              </CursorSpotlight>
            </div>
          </section>
        </main>

        <PublicFooter />
      </div>
    </div>
  );
}

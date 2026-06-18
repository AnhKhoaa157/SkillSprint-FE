import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "motion/react";
import { Link } from "react-router";
import { ArrowRight, Target, LineChart, Clock, ShieldCheck, Zap, Map } from "lucide-react";
import { PublicNavbar } from "../components/PublicNavbar";
import { Footer as PublicFooter } from "../components/Footer";

/* ──────────────────────────────────────────────────────────────
   🎴 Tilt3D Card — Wrapper tạo hiệu ứng nghiêng 3D khi hover
 ────────────────────────────────────────────────────────────── */
function Tilt3D({
  children,
  className,
  intensity = 8,
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
      whileHover={{ y: -8, scale: 1.025 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function About() {
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
        className="absolute top-[300px] right-[-100px] w-[500px] h-[500px] rounded-full pointer-events-none z-0 opacity-40"
        style={{
          background: "radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)",
          filter: "blur(70px)",
        }}
      />
      <div
        className="absolute top-[600px] left-[-100px] w-[500px] h-[500px] rounded-full pointer-events-none z-0 opacity-40"
        style={{
          background: "radial-gradient(circle, rgba(14,165,233,0.06) 0%, transparent 70%)",
          filter: "blur(70px)",
        }}
      />

      <div className="relative z-10">
        <PublicNavbar />

        <main className="pt-36 pb-32">
          
          {/* ══════════════════════════════════
              HERO SECTION
              ══════════════════════════════════ */}
          <section className="px-4 pb-20 text-center relative z-10">
            <div className="mx-auto max-w-4xl">
              {/* Badge tia chớp mới */}
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
                  Câu chuyện của SkillSprint
                </span>
              </motion.div>

              {/* H1 */}
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.08 }}
                className="text-4xl sm:text-5xl md:text-[62px] font-black leading-[1.08] tracking-tight text-slate-900 mb-6"
              >
                Kiến tạo thế hệ <br />
                <span className="relative inline-block mt-1">
                  <span
                    className="bg-clip-text text-transparent"
                    style={{
                      backgroundImage: "linear-gradient(135deg, #f97316 0%, #ea580c 50%, #e65c00 100%)",
                    }}
                  >
                    học tập chủ động.
                  </span>
                  <span
                    className="absolute -bottom-2.5 left-0 w-full h-[5px] rounded-full"
                    style={{
                      background:
                        "linear-gradient(90deg, rgba(255,107,0,0.45) 0%, rgba(251,146,60,0.05) 100%)",
                    }}
                  />
                </span>
              </motion.h1>

              {/* Hướng dẫn phụ */}
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.18 }}
                className="mx-auto max-w-2xl text-[15.5px] leading-relaxed text-slate-500 font-semibold"
              >
                Không "học thay" bạn. SkillSprint trang bị lộ trình và công cụ để biến bạn thành người tự học xuất sắc, tự tin đáp ứng mọi yêu cầu khắt khe của ngành IT.
              </motion.p>
            </div>
          </section>

          {/* ══════════════════════════════════
              THE PROBLEM & MISSION
              ══════════════════════════════════ */}
          <section className="px-4 pb-24 relative z-10">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-center">
                {/* Cột trái: Text mô tả */}
                <motion.div 
                  initial={{ opacity: 0, x: -28 }} 
                  whileInView={{ opacity: 1, x: 0 }} 
                  viewport={{ once: true }} 
                  transition={{ duration: 0.6 }}
                >
                  <span className="block text-[11px] font-black text-orange-600 uppercase tracking-widest mb-3.5">
                    Thực trạng ngành IT
                  </span>
                  <h2 className="text-3xl md:text-[40px] font-black text-slate-900 tracking-tight leading-tight mb-5">
                    Giáo trình đồ sộ, <br />thời gian có hạn.
                  </h2>
                  <p className="text-[14px] leading-relaxed text-slate-400 font-semibold mb-4.5">
                    Tài liệu khổng lồ nhưng thiếu định hướng khiến sinh viên IT dễ "bơi" trong kiến thức, học dàn trải và nhanh chóng rơi vào trạng thái quá tải (burnout).
                  </p>
                  <p className="text-[14px] leading-relaxed text-slate-500 font-semibold">
                    <strong className="text-orange-600 font-black">Giải pháp:</strong> Số hóa toàn bộ giáo trình thành lộ trình cá nhân hóa. Chia nhỏ kiến thức thành các mục tiêu đo lường được qua từng Sprint ngắn.
                  </p>
                </motion.div>
                
                {/* Cột phải: Card giải pháp 3D */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.96 }} 
                  whileInView={{ opacity: 1, scale: 1 }} 
                  viewport={{ once: true }} 
                  transition={{ duration: 0.6 }}
                  className="rounded-[36px] p-8 md:p-10 relative overflow-hidden"
                  style={{
                    background: "linear-gradient(145deg, rgba(255,255,255,0.99) 0%, rgba(255,247,237,0.7) 100%)",
                    border: "1.5px solid rgba(255,107,0,0.18)",
                    boxShadow: "0 30px 70px -15px rgba(255,107,0,0.08), 0 10px 20px -8px rgba(15,23,42,0.03), inset 0 1.5px 0 rgba(255,255,255,1)",
                  }}
                >
                  <div className="grid gap-6 relative z-10">
                    {[
                      { icon: Map, title: "Định hướng rõ ràng", desc: "Chỉ học những gì cần thiết nhất cho mục tiêu hiện tại của bạn." },
                      { icon: Target, title: "Lộ trình cá nhân hóa", desc: "Thích ứng chính xác với năng lực tiếp thu và quỹ thời gian cá nhân." },
                      { icon: Zap, title: "Tăng tốc tốc độ học", desc: "Tối đa hóa hiệu suất tự học thực chiến thay vì thụ động lắng nghe lý thuyết." },
                    ].map((item, i) => (
                      <div key={i} className="flex gap-4">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                          style={{
                            background: "#ffffff",
                            border: "1.5px solid rgba(255,107,0,0.2)",
                            boxShadow: "0 6px 18px rgba(255,107,0,0.06), inset 0 1px 0 rgba(255,255,255,1)",
                          }}
                        >
                          <item.icon size={20} className="text-orange-500 fill-orange-500/10" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-[15px] text-slate-900 mb-1">{item.title}</h3>
                          <p className="text-[13px] text-slate-450 leading-relaxed font-semibold">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════
              CORE VALUES (3D TILT CARDS)
              ══════════════════════════════════ */}
          <section className="px-4 pb-24 relative z-10">
            <div className="max-w-6xl mx-auto">
              {/* Header */}
              <motion.div 
                initial={{ opacity: 0, y: 16 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true }} 
                className="text-center mb-16"
              >
                <div
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full mb-3.5"
                  style={{
                    background: "rgba(255,107,0,0.06)",
                    border: "1px solid rgba(255,107,0,0.15)",
                  }}
                >
                  <span className="text-[10px] text-orange-700 font-black uppercase tracking-widest">
                    TRIẾT LÝ CỐT LÕI
                  </span>
                </div>
                <h2 className="text-3xl md:text-[40px] font-black text-slate-900 tracking-tight leading-none">
                  Ba giá trị bền vững
                </h2>
              </motion.div>

              <div className="relative">
                {/* 3 cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { icon: Target, title: "Tính Thực Chiến", desc: "Học để dùng. Mọi kiến thức tiếp thu đều phục vụ trực tiếp cho mục tiêu vượt qua kỳ thi hoặc đáp ứng tiêu chí tuyển dụng.", color: "#FF6B00", shadow: "rgba(255,107,0,0.25)" },
                    { icon: LineChart, title: "Dữ Liệu Hóa", desc: "Tiến bộ không đến từ cảm tính. Từ lỗ hổng kiến thức đến độ tự tin, mọi thứ đều được lượng hóa bằng chỉ số trực quan.", color: "#7C3AED", shadow: "rgba(124,90,237,0.25)" },
                    { icon: Clock, title: "Tối Ưu Thời Gian", desc: "Ngừng bơi trong tài liệu rác. Hệ thống giúp bạn tập trung 100% năng lượng vào đúng kiến thức mà bạn đang thực sự thiếu sót.", color: "#0EA5E9", shadow: "rgba(14,165,233,0.25)" },
                  ].map((val, i) => {
                    const indexLabel = String(i + 1).padStart(2, "0");
                    return (
                      <Tilt3D 
                        key={i} 
                        intensity={6}
                        className="flex flex-col h-full"
                      >
                        <div
                          className="relative rounded-[28px] p-6 md:p-8 flex flex-col justify-between flex-1 overflow-hidden transition-all duration-300"
                          style={{
                            background: `linear-gradient(180deg, ${val.color}04 0%, rgba(255,255,255,0.99) 40%, #ffffff 100%)`,
                            border: "1.5px solid rgba(226,232,240,0.85)",
                            boxShadow: "0 10px 30px -10px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,1)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = `${val.color}35`;
                            e.currentTarget.style.boxShadow = `0 24px 50px -15px ${val.shadow}, inset 0 1px 0 rgba(255,255,255,1)`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "rgba(226,232,240,0.85)";
                            e.currentTarget.style.boxShadow = "0 10px 30px -10px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,1)";
                          }}
                        >
                          {/* Số outline nghệ thuật ở góc phải */}
                          <div className="absolute right-6 top-6 select-none pointer-events-none opacity-20">
                            <span 
                              className="font-black text-6xl tracking-tighter leading-none"
                              style={{
                                color: "transparent",
                                WebkitTextStroke: `1.5px ${val.color}`,
                              }}
                            >
                              {indexLabel}
                            </span>
                          </div>

                          <div className="relative z-10 flex flex-col h-full justify-between mt-8">
                            <div>
                              {/* Icon container nổi bật */}
                              <div 
                                className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                                style={{
                                  background: `${val.color}08`,
                                  border: `1.5px solid ${val.color}25`,
                                  boxShadow: `0 6px 16px -4px ${val.color}20`,
                                }}
                              >
                                <val.icon size={18} color={val.color} />
                              </div>

                              <h3 className="font-black text-[17px] text-slate-900 leading-none mb-3.5">
                                {val.title}
                              </h3>
                              <p className="text-[13.5px] text-slate-450 leading-relaxed font-semibold">
                                {val.desc}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Tilt3D>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════
              PRINCIPLES & TRUST (PRODUCT PROMISES)
              ══════════════════════════════════ */}
          <section className="px-4 pb-12 relative z-10">
            <div className="max-w-6xl mx-auto">
              <motion.div 
                initial={{ opacity: 0, y: 16 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true }}
                className="rounded-[40px] p-8 md:p-12 relative overflow-hidden"
                style={{
                  background: "linear-gradient(180deg, rgba(250,250,252,0.95) 0%, rgba(255,255,255,0.9) 50%)",
                  border: "1.5px solid rgba(226,232,240,0.85)",
                  boxShadow: "0 24px 60px -20px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,1)",
                }}
              >
                {/* Tiêu đề phần cam kết */}
                <div className="text-center mb-10">
                  <span className="block text-[11px] font-black text-orange-600 uppercase tracking-widest mb-3">
                    Sứ mệnh vững vàng
                  </span>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none">
                    Cam kết phát triển sản phẩm
                  </h2>
                </div>

                {/* 2x2 grid của cam kết */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {[
                    { text: "Dữ liệu học tập thực tế phải dẫn dắt kế hoạch.", accent: "#FFDCC5" },
                    { text: "Lộ trình phải thực sự cá nhân hóa theo từng sinh viên.", accent: "#EEDDFF" },
                    { text: "Theo dõi tiến độ phải trực quan, dễ hành động.", accent: "#DFF6FF" },
                    { text: "Cam kết bảo mật tuyệt đối dữ liệu cá nhân của người dùng.", accent: "#E8F9EF" },
                  ].map((item, i) => (
                    <motion.div 
                      key={i} 
                      whileHover={{ y: -4, scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-4.5 bg-white p-5 rounded-2xl transition-all duration-300 cursor-default"
                      style={{
                        border: "1.5px solid rgba(229,231,235,0.8)",
                        boxShadow: "0 6px 20px rgba(15,23,42,0.02)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "rgba(249,115,22,0.25)";
                        e.currentTarget.style.boxShadow = "0 15px 30px rgba(249,115,22,0.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "rgba(229,231,235,0.8)";
                        e.currentTarget.style.boxShadow = "0 6px 20px rgba(15,23,42,0.02)";
                      }}
                    >
                      {/* Vòng tròn check gradient đẹp mắt */}
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${item.accent} 0%, rgba(255,255,255,0.6) 100%)`,
                          border: "1px solid rgba(255,255,255,0.8)",
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
                        }}
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-sm">
                          <ShieldCheck size={16} className="text-orange-500" />
                        </div>
                      </div>

                      <div className="flex-1">
                        <span className="font-extrabold text-[14px] text-slate-800 leading-snug">{item.text}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </section>

        </main>

        <PublicFooter />
      </div>
    </div>
  );
}
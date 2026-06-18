import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "motion/react";
import {
  Send, Mail, Clock, Facebook, Headphones,
  ShieldCheck, ArrowUpRight, MessageSquareText, 
  AlertCircle, CheckCircle2, ChevronDown, Loader2, PhoneCall, Zap
} from "lucide-react";
import { Footer as PublicFooter } from "../components/Footer";
import { PublicNavbar } from "../components/PublicNavbar";

/* ─────────────────────────────────────────────
   SVG TikTok Icon
 ───────────────────────────────────────────── */
function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .79.11V9.5a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.3 6.3 0 0 0 6.3-6.3c0-.05-.01-.1-.01-.15V8.82a8.17 8.17 0 0 0 4.85 1.58V7a4.83 4.83 0 0 1-1.08-.31z" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Tilt3D Wrapper — hiệu ứng nghiêng 3D khi hover
 ───────────────────────────────────────────── */
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

  return (
    <motion.div
      ref={ref}
      style={{ rotateX, rotateY, transformPerspective: 1000, transformStyle: "preserve-3d", ...style }}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        mx.set((e.clientX - rect.left) / rect.width - 0.5);
        my.set((e.clientY - rect.top) / rect.height - 0.5);
      }}
      onMouseLeave={() => { mx.set(0); my.set(0); }}
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ duration: 0.25 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   SocialLink — hộp link mạng xã hội 3D nổi
 ───────────────────────────────────────────── */
function SocialLink({
  href, icon, label, sublabel,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  sublabel: string;
}) {
  return (
    <Tilt3D intensity={5}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-4 rounded-2xl p-4 no-underline transition-all duration-300"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,247,237,0.7))",
          border: "1.5px solid rgba(226,232,240,0.8)",
          boxShadow: "0 4px 16px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,1)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(249,115,22,0.3)";
          (e.currentTarget as HTMLAnchorElement).style.boxShadow =
            "0 12px 32px rgba(249,115,22,0.12), inset 0 1px 0 rgba(255,255,255,1)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(226,232,240,0.8)";
          (e.currentTarget as HTMLAnchorElement).style.boxShadow =
            "0 4px 16px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,1)";
        }}
      >
        <div
          className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
          style={{
            background: "rgba(255,107,0,0.08)",
            border: "1px solid rgba(255,107,0,0.12)",
            color: "#ea580c",
          }}
        >
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
            {sublabel}
          </p>
          <p className="text-[13px] font-black text-slate-800 truncate group-hover:text-orange-600 transition-colors">
            {label}
          </p>
        </div>

        <ArrowUpRight
          size={15}
          className="shrink-0 text-slate-300 transition-all duration-300 group-hover:text-orange-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </a>
    </Tilt3D>
  );
}

/* ─────────────────────────────────────────────
   InfoChip — hộp thông tin nhỏ (email, SLA, Hotline)
 ───────────────────────────────────────────── */
function InfoChip({
  icon, label, value, accentColor = "#ea580c", glowColor = "rgba(249,115,22,0.15)",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accentColor?: string;
  glowColor?: string;
}) {
  return (
    <Tilt3D intensity={5}>
      <div
        className="flex items-center gap-4 rounded-2xl p-4.5 transition-all duration-300"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,250,245,0.85))",
          border: "1.5px solid rgba(226,232,240,0.8)",
          boxShadow: "0 6px 20px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,1)",
        }}
      >
        <div
          className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center"
          style={{
            background: glowColor,
            border: `1.5px solid ${accentColor}25`,
            color: accentColor,
            boxShadow: `0 4px 12px ${glowColor}`,
          }}
        >
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">{label}</p>
          <p className="text-[14px] font-black mt-2 leading-none" style={{ color: accentColor }}>{value}</p>
        </div>
      </div>
    </Tilt3D>
  );
}

/* ─────────────────────────────────────────────
   FormInput — input field tối giản, tinh tế 3D
 ───────────────────────────────────────────── */
function FormInput({
  label, type = "text", placeholder, required,
}: {
  label: string;
  type?: string;
  placeholder: string;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="text-[11px] font-black uppercase tracking-wider transition-colors duration-200"
        style={{ color: focused ? "#ea580c" : "#64748b" }}
      >
        {label} {required && <span className="text-orange-500">*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        required={required}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full rounded-xl text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-400"
        style={{
          padding: "13px 16px",
          background: focused
            ? "#ffffff"
            : "linear-gradient(135deg, rgba(248,250,252,0.95), rgba(255,247,237,0.4))",
          border: focused ? "1.5px solid rgba(249,115,22,0.6)" : "1.5px solid rgba(226,232,240,0.9)",
          boxShadow: focused
            ? "0 0 0 4px rgba(249,115,22,0.08), 0 4px 12px rgba(249,115,22,0.06), inset 0 2px 4px rgba(0,0,0,0.01)"
            : "inset 0 2px 4px rgba(15,23,42,0.03), 0 1px 2px rgba(15,23,42,0.01)",
        }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
 ───────────────────────────────────────────── */
export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [textareaFocused, setTextareaFocused] = useState(false);
  const [selectFocused, setSelectFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1600);
  };

  return (
    <div
      className="min-h-screen relative overflow-x-hidden antialiased selection:bg-orange-500/20 selection:text-orange-600 text-slate-800"
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

      {/* ── Hào quang cam lớn ── */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[650px] pointer-events-none z-0 opacity-90"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(255,107,0,0.09) 0%, rgba(255,107,0,0.02) 55%, transparent 75%)",
          filter: "blur(60px)",
        }}
      />

      <div className="relative z-10">
        <PublicNavbar />

        <main className="pt-36 pb-32 overflow-hidden">

          {/* ══════════════════════════════════
              HERO SECTION
              ══════════════════════════════════ */}
          <section className="px-4 pb-14 text-center relative z-10">
            <div className="mx-auto max-w-4xl">
              {/* Badge tia chớp mới */}
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,247,237,0.95))",
                  border: "1.5px solid rgba(255,107,0,0.25)",
                  boxShadow: "0 10px 30px -5px rgba(255,107,0,0.1), inset 0 1.5px 0 rgba(255,255,255,1)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <Zap size={13} className="text-orange-500 fill-orange-500 animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-wider text-orange-600">
                  Trung tâm phản hồi SkillSprint
                </span>
              </motion.div>

              {/* H1 */}
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.08 }}
                className="text-4xl sm:text-5xl md:text-[56px] font-black leading-[1.1] tracking-tight text-slate-900 mb-5"
              >
                Kết nối trực tiếp với{" "}
                <br />
                <span className="relative inline-block mt-1">
                  <span
                    className="bg-clip-text text-transparent"
                    style={{
                      backgroundImage: "linear-gradient(135deg, #f97316 0%, #ea580c 50%, #e65c00 100%)",
                    }}
                  >
                    Hệ thống hỗ trợ chuyên gia
                  </span>
                  <span
                    className="absolute -bottom-2 left-0 w-full h-[5px] rounded-full"
                    style={{
                      background:
                        "linear-gradient(90deg, rgba(255,107,0,0.4) 0%, rgba(251,146,60,0.05) 100%)",
                    }}
                  />
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.18 }}
                className="mx-auto max-w-xl text-[14.5px] leading-relaxed text-slate-500 font-semibold"
              >
                Chúng tôi lược bỏ mọi thủ tục rườm rà để mang đến trải nghiệm xử lý tối tốc —
                Giúp học trình AI của bạn luôn mượt mà.
              </motion.p>
            </div>
          </section>

          {/* ══════════════════════════════════
              MAIN 2-COLUMN LAYOUT
              ══════════════════════════════════ */}
          <section className="px-4 relative z-10">
            <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 xl:gap-10 items-stretch">

              {/* ══════════════════════════════
                  LEFT COLUMN — Info Cards
                  ══════════════════════════════ */}
              <motion.div
                initial={{ opacity: 0, x: -28 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col gap-4.5"
              >
                {/* ── Masthead Info Card ── */}
                <Tilt3D intensity={5} className="flex flex-col flex-1">
                  <div
                    className="relative overflow-hidden rounded-[32px] p-7.5 flex flex-col justify-between flex-1"
                    style={{
                      background:
                        "linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(255,247,237,0.7) 100%)",
                      border: "1.5px solid rgba(255,107,0,0.18)",
                      boxShadow:
                        "0 24px 60px -15px rgba(255,107,0,0.08), 0 8px 24px -8px rgba(15,23,42,0.03), inset 0 1px 0 rgba(255,255,255,1)",
                    }}
                  >
                    <div
                      className="absolute -right-12 -top-12 w-40 h-40 rounded-full pointer-events-none"
                      style={{
                        background:
                          "radial-gradient(ellipse at center, rgba(249,115,22,0.12) 0%, transparent 70%)",
                      }}
                    />

                    <div>
                      {/* Icon header */}
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                        style={{
                          background: "linear-gradient(135deg, rgba(249,115,22,0.2), rgba(234,88,12,0.08))",
                          border: "1.5px solid rgba(249,115,22,0.35)",
                          boxShadow: "0 8px 20px rgba(249,115,22,0.15)",
                          color: "#ea580c",
                        }}
                      >
                        <Headphones size={20} />
                      </div>

                      <h2 className="text-[20px] font-black text-slate-900 tracking-tight leading-snug mb-3">
                        Đồng hành cùng học viên kỹ thuật số
                      </h2>
                      <p className="text-[13.5px] leading-relaxed text-slate-400 font-semibold mb-8">
                        Bất kỳ vấn đề về đồng bộ lộ trình AI, nâng cấp gói dịch vụ hay tùy biến
                        Workspace — đội ngũ cam kết đồng hành sát sao và phản hồi tức thì.
                      </p>
                    </div>

                    {/* Social links */}
                    <div className="flex flex-col gap-3">
                      <SocialLink
                        href="https://www.facebook.com/profile.php?id=61590323403077"
                        icon={<Facebook size={16} />}
                        label="Cộng đồng Facebook Group"
                        sublabel="CỘNG ĐỒNG"
                      />
                      <SocialLink
                        href="https://www.tiktok.com/@skillsprint26"
                        icon={<TikTokIcon size={16} />}
                        label="@skillsprint26"
                        sublabel="KÊNH TRUYỀN THÔNG TIKTOK"
                      />
                    </div>
                  </div>
                </Tilt3D>

                {/* ── Hotline Chip (Mới & Nổi bật) ── */}
                <InfoChip
                  icon={<PhoneCall size={16} />}
                  label="Đường dây nóng 24/7"
                  value="0968.866.930"
                  accentColor="#d97706"
                  glowColor="rgba(217,119,6,0.12)"
                />

                {/* ── Email Chip ── */}
                <InfoChip
                  icon={<Mail size={16} />}
                  label="Trực liên hệ chính"
                  value="skillsprint2026@gmail.com"
                  accentColor="#ea580c"
                  glowColor="rgba(249,115,22,0.1)"
                />

                {/* ── SLA Timing Chip ── */}
                <InfoChip
                  icon={<Clock size={16} />}
                  label="Thời gian cam kết phản hồi"
                  value="Trong 2 giờ làm việc"
                  accentColor="#059669"
                  glowColor="rgba(5,150,105,0.1)"
                />

                {/* ── Security Note ── */}
                <div
                  className="flex items-center gap-3 rounded-2xl px-5 py-3.5"
                  style={{
                    background: "rgba(248,250,252,0.85)",
                    border: "1.5px solid rgba(226,232,240,0.7)",
                  }}
                >
                  <ShieldCheck size={16} className="text-slate-400 shrink-0" />
                  <p className="text-[11.5px] text-slate-400 font-semibold leading-relaxed">
                    Dữ liệu được mã hóa đầu cuối · Bảo mật tuyệt đối thông tin định danh
                  </p>
                </div>
              </motion.div>

              {/* ══════════════════════════════
                  RIGHT COLUMN — Contact Form
                  ══════════════════════════════ */}
              <motion.div
                initial={{ opacity: 0, x: 28 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
                className="flex flex-col h-full"
              >
                <div
                  className="rounded-[36px] p-8 md:p-9.5 relative overflow-hidden flex flex-col justify-between h-full"
                  style={{
                    background:
                      "linear-gradient(160deg, rgba(255,255,255,0.99) 0%, rgba(255,250,245,0.92) 100%)",
                    border: "1.5px solid rgba(226,232,240,0.9)",
                    boxShadow:
                      "0 32px 72px -20px rgba(255,107,0,0.07), 0 12px 32px -12px rgba(15,23,42,0.03), inset 0 1px 0 rgba(255,255,255,1)",
                  }}
                >
                  <div
                    className="absolute -right-20 -top-20 w-56 h-56 rounded-full pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(ellipse at center, rgba(249,115,22,0.06) 0%, transparent 70%)",
                    }}
                  />

                  {/* ── Form Header ── */}
                  <div
                    className="mb-6 pb-5 relative z-10"
                    style={{ borderBottom: "1.5px solid rgba(226,232,240,0.7)" }}
                  >
                    <div
                      className="mb-3.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5"
                      style={{
                        background: "rgba(255,107,0,0.07)",
                        border: "1px solid rgba(255,107,0,0.15)",
                      }}
                    >
                      <MessageSquareText size={11} className="text-orange-500" />
                      <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">
                        Phiếu yêu cầu điện tử
                      </span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                      Gửi ticket hỗ trợ hệ thống
                    </h2>
                    <p className="text-[13px] text-slate-400 font-semibold mt-2">
                      Điền đầy đủ thông tin để kỹ thuật viên xử lý nhanh nhất có thể.
                    </p>
                  </div>

                  {/* ══════════ SUCCESS STATE ══════════ */}
                  {submitted ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 12 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="py-16 text-center relative z-10 flex-1 flex flex-col justify-center"
                    >
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                        style={{
                          background: "linear-gradient(135deg, rgba(5,150,105,0.12), rgba(5,150,105,0.06))",
                          border: "1.5px solid rgba(5,150,105,0.25)",
                          color: "#059669",
                        }}
                      >
                        <CheckCircle2 size={28} />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-2">
                        Ticket đã được khởi tạo!
                      </h3>
                      <p className="text-[13.5px] text-slate-400 font-semibold max-w-xs mx-auto leading-relaxed">
                        Đội ngũ kỹ thuật sẽ phản hồi bạn trong vòng{" "}
                        <span className="font-black text-emerald-600">2 giờ làm việc</span>.
                      </p>
                      <button
                        onClick={() => setSubmitted(false)}
                        className="mt-8 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer transition-all self-center"
                        style={{
                          background: "rgba(248,250,252,0.95)",
                          border: "1.5px solid rgba(226,232,240,1)",
                          color: "#64748b",
                        }}
                      >
                        Gửi ticket mới
                      </button>
                    </motion.div>
                  ) : (

                    /* ══════════ FORM ══════════ */
                    <form
                      onSubmit={handleSubmit}
                      className="flex flex-col gap-4.5 relative z-10 flex-1 justify-between"
                    >
                      <div className="flex flex-col gap-4.5">
                        {/* Row 1: Họ tên + Email */}
                        <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2">
                          <FormInput label="Họ và tên" placeholder="Nguyễn Văn A" required />
                          <FormInput label="Email liên hệ" type="email" placeholder="example@gmail.com" required />
                        </div>

                        {/* Row 2: Chủ đề select */}
                        <div className="flex flex-col gap-1.5">
                          <label
                            className="text-[11px] font-black uppercase tracking-wider transition-colors duration-200"
                            style={{ color: selectFocused ? "#ea580c" : "#64748b" }}
                          >
                            Chủ đề cần xử lý <span className="text-orange-500">*</span>
                          </label>
                          <div className="relative">
                            <select
                              required
                              onFocus={() => setSelectFocused(true)}
                              onBlur={() => setSelectFocused(false)}
                              className="w-full appearance-none text-sm text-slate-900 outline-none transition-all duration-300 cursor-pointer"
                              style={{
                                padding: "13px 40px 13px 16px",
                                borderRadius: "12px",
                                background: selectFocused
                                  ? "#ffffff"
                                  : "linear-gradient(135deg, rgba(248,250,252,0.95), rgba(255,247,237,0.4))",
                                border: selectFocused
                                  ? "1.5px solid rgba(249,115,22,0.6)"
                                  : "1.5px solid rgba(226,232,240,0.9)",
                                boxShadow: selectFocused
                                  ? "0 0 0 4px rgba(249,115,22,0.08), 0 4px 12px rgba(249,115,22,0.06)"
                                  : "inset 0 2px 4px rgba(15,23,42,0.02), 0 1px 2px rgba(15,23,42,0.01)",
                              }}
                            >
                              <option value="">— Chọn chủ đề —</option>
                              <option>Hỗ trợ thanh toán / Gia hạn hoặc Nâng cấp gói dịch vụ</option>
                              <option>Báo cáo lỗi kỹ thuật / Sai lệch lộ trình học tập AI</option>
                              <option>Tư vấn lộ trình học tập doanh nghiệp &amp; cá nhân</option>
                              <option>Yêu cầu khác</option>
                            </select>
                            <ChevronDown
                              size={14}
                              className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200"
                              style={{ color: selectFocused ? "#ea580c" : "#94a3b8" }}
                            />
                          </div>
                        </div>

                        {/* Row 3: Alert banner */}
                        <div
                          className="rounded-xl p-4 flex items-start gap-3"
                          style={{
                            background:
                              "linear-gradient(135deg, rgba(255,247,237,0.85), rgba(255,237,213,0.45))",
                            border: "1.5px solid rgba(249,115,22,0.2)",
                            boxShadow: "0 2px 8px rgba(249,115,22,0.04)",
                          }}
                        >
                          <AlertCircle size={14} className="text-orange-500 shrink-0 mt-0.5" />
                          <p className="text-[12px] leading-relaxed text-orange-850 font-semibold">
                            <span className="font-black text-orange-950">Luồng ưu tiên cao: </span>
                            Ticket về lỗi thanh toán &amp; đồng bộ AI được định tuyến thẳng đến kỹ sư để phản hồi lập tức. Vui lòng ghi rõ thông tin tài khoản.
                          </p>
                        </div>

                        {/* Row 4: Textarea */}
                        <div className="flex flex-col gap-1.5">
                          <label
                            className="text-[11px] font-black uppercase tracking-wider transition-colors duration-200"
                            style={{ color: textareaFocused ? "#ea580c" : "#64748b" }}
                          >
                            Nội dung mô tả chi tiết <span className="text-orange-500">*</span>
                          </label>
                          <textarea
                            rows={4}
                            required
                            placeholder="Vui lòng mô tả chi tiết vấn đề hoặc thao tác bạn vừa thực hiện để kỹ thuật viên nắm bắt nhanh nhất..."
                            onFocus={() => setTextareaFocused(true)}
                            onBlur={() => setTextareaFocused(false)}
                            className="w-full resize-none text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-400"
                            style={{
                              padding: "14px 16px",
                              borderRadius: "12px",
                              background: textareaFocused
                                ? "#ffffff"
                                : "linear-gradient(135deg, rgba(248,250,252,0.95), rgba(255,247,237,0.4))",
                              border: textareaFocused
                                ? "1.5px solid rgba(249,115,22,0.6)"
                                : "1.5px solid rgba(226,232,240,0.9)",
                              boxShadow: textareaFocused
                                ? "0 0 0 4px rgba(249,115,22,0.08), 0 4px 12px rgba(249,115,22,0.06), inset 0 2px 4px rgba(0,0,0,0.01)"
                                : "inset 0 2px 4px rgba(15,23,42,0.03), 0 1px 2px rgba(15,23,42,0.01)",
                            }}
                          />
                        </div>
                      </div>

                      {/* Row 5: CTA Button */}
                      <div
                        className="flex flex-col gap-4 pt-5.5 sm:flex-row sm:items-center sm:justify-between mt-6"
                        style={{ borderTop: "1.5px solid rgba(226,232,240,0.7)" }}
                      >
                        {/* Security micro-note */}
                        <p className="text-[11px] leading-relaxed text-slate-400 font-semibold max-w-[220px]">
                          🔐 Dữ liệu mã hóa đầu cuối — Bảo mật tuyệt đối thông tin
                        </p>

                        {/* Submit CTA (3D Physics Pressed Button) */}
                        <motion.button
                          type="submit"
                          disabled={loading}
                          whileHover={loading ? {} : {
                            y: -2,
                            boxShadow: "0 8px 0 #b43e06, 0 16px 28px rgba(234,88,12,0.35), inset 0 1px 0 rgba(255,255,255,0.2)"
                          }}
                          whileTap={loading ? {} : {
                            y: 4,
                            boxShadow: "0 2px 0 #b43e06, 0 4px 10px rgba(234,88,12,0.2)"
                          }}
                          transition={{ duration: 0.12, ease: "easeOut" }}
                          className="group relative cursor-pointer inline-flex items-center justify-center gap-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-white border-none transition-all duration-150"
                          style={{
                            padding: "14px 32px",
                            background: loading
                              ? "linear-gradient(135deg, #fdba74, #fb923c)"
                              : "linear-gradient(135deg, #f97316 0%, #ea580c 55%, #fb923c 100%)",
                            transformStyle: "preserve-3d",
                            boxShadow: loading 
                              ? "0 2px 0 #9a3412, 0 4px 8px rgba(0,0,0,0.1)" 
                              : "0 6px 0 #b43e06, 0 12px 24px rgba(234,88,12,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
                          }}
                        >
                          {loading ? (
                            <>
                              <Loader2 size={13} className="animate-spin" />
                              Đang xử lý...
                            </>
                          ) : (
                            <>
                              Khởi tạo Ticket hỗ trợ
                              <Send
                                size={13}
                                className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                              />
                            </>
                          )}
                        </motion.button>
                      </div>
                    </form>
                  )}
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
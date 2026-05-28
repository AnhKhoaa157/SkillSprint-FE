import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Zap, Clock, TrendingUp, BookOpen, Trophy, Target, Flame, Lock, Brain } from "lucide-react";

const F = "'Plus Jakarta Sans', Inter, sans-serif";
const OG = "#F37021";
const OGL = "var(--an-ogl)";
const WH = "var(--an-wh)";
const T1 = "var(--an-t1)";
const T2 = "var(--an-t2)";
const T3 = "var(--an-t3)";
const BDR = "var(--an-bdr)";
const BG = "var(--an-bg)";

const CONSISTENCY_DATA = [
  { day: "T2", yourHours: 2.5, classAvg: 1.8 },
  { day: "T3", yourHours: 3.8, classAvg: 2.1 },
  { day: "T4", yourHours: 4.2, classAvg: 2.4 },
  { day: "T5", yourHours: 1.5, classAvg: 2.0 },
  { day: "T6", yourHours: 5.0, classAvg: 2.8 },
  { day: "T7", yourHours: 6.5, classAvg: 3.5 },
  { day: "CN", yourHours: 4.0, classAvg: 2.9 },
];

const TOPIC_PROGRESS = [
  { name: "Nền tảng", pct: 100, color: "#3B82F6", bg: "#EFF6FF", count: "3/3 chủ đề" },
  { name: "Cốt lõi React", pct: 67, color: OG, bg: OGL, count: "2/3 chủ đề" },
  { name: "Nâng cao", pct: 25, color: "#8B5CF6", bg: "#F5F3FF", count: "0.5/2 chủ đề" },
  { name: "Thiết kế hệ thống", pct: 12, color: "#D97706", bg: "#FFFBEB", count: "1/8 bài" },
];

const ACHIEVEMENTS = [
  { title: "Chuỗi 7 ngày", icon: <Flame size={16} color="#EF4444" />, bg: "#FEF2F2", date: "08/03/2026", xp: 200, earned: true },
  { title: "Bậc thầy React", icon: <Trophy size={16} color="#F59E0B" />, bg: "#FFFBEB", date: "01/03/2026", xp: 500, earned: true },
  { title: "Tân binh Thuật toán", icon: <Target size={16} color="#8B5CF6" />, bg: "#F5F3FF", date: "Đang tiến hành", xp: 300, earned: false },
  { title: "Chiến binh Sprint", icon: <Zap size={16} color={OG} />, bg: OGL, date: "Chưa mở", xp: 400, earned: false },
];

const RECENT_QUIZ_SCORES = [
  { title: "Đánh giá Giai đoạn 1", score: 86, total: 100, time: "14p", date: "18/03" },
  { title: "Trắc nghiệm nhanh: React Hooks", score: 8, total: 10, time: "4p", date: "17/03" },
  { title: "Trắc nghiệm nhanh: State Patterns", score: 7, total: 10, time: "5p", date: "15/03" },
];

function StatCard({ icon, value, label, sub, color, bg }: {
  icon: React.ReactNode;
  value: string;
  label: string;
  sub?: string;
  color: string;
  bg: string;
}) {
  return (
    <div style={{
      background: WH,
      borderRadius: "14px",
      border: `1px solid ${BDR}`,
      boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
      padding: "18px",
    }}>
      <div style={{
        width: "34px",
        height: "34px",
        borderRadius: "10px",
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "8px",
      }}>
        {icon}
      </div>
      <p style={{ fontFamily: F, fontWeight: 900, fontSize: "1.55rem", color, lineHeight: 1, letterSpacing: "-0.04em" }}>{value}</p>
      <p style={{ fontFamily: F, fontSize: "0.78rem", fontWeight: 700, color: T2, marginTop: "4px" }}>{label}</p>
      {sub && <p style={{ fontFamily: F, fontSize: "0.7rem", color, fontWeight: 700, marginTop: "3px" }}>{sub}</p>}
    </div>
  );
}

function ProgressRow({ name, pct, color, bg, count }: {
  name: string;
  pct: number;
  color: string;
  bg: string;
  count: string;
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "7px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ padding: "3px 9px", borderRadius: "6px", background: bg, border: `1px solid ${color}22` }}>
            <span style={{ fontFamily: F, fontSize: "0.72rem", fontWeight: 700, color }}>{name}</span>
          </div>
          <span style={{ fontFamily: F, fontSize: "0.72rem", color: T3 }}>{count}</span>
        </div>
        <span style={{ fontFamily: F, fontSize: "0.82rem", fontWeight: 800, color }}>{pct}%</span>
      </div>
      <div style={{ height: "8px", background: BDR, borderRadius: "99px", overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ height: "100%", background: `linear-gradient(90deg, ${color}99, ${color})`, borderRadius: "99px" }}
        />
      </div>
    </div>
  );
}

export default function Analytics() {
  const [selectedQuiz] = useState(0);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("ss_theme") === "dark";
  });

  useEffect(() => {
    const syncTheme = () => {
      setIsDark(window.localStorage.getItem("ss_theme") === "dark");
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === "ss_theme") syncTheme();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("ss-theme-updated", syncTheme as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("ss-theme-updated", syncTheme as EventListener);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`max-w-6xl mx-auto w-full rounded-3xl p-5 md:p-6 ${isDark ? "border border-slate-700 bg-slate-950" : "border-2 border-[#FBD5BE] bg-[#FFFBF8]"}`}
      style={{
        fontFamily: F,
        ["--an-ogl" as string]: isDark ? "rgba(243,112,33,0.2)" : "rgba(243,112,33,0.12)",
        ["--an-wh" as string]: isDark ? "#111827" : "#FFFFFF",
        ["--an-t1" as string]: isDark ? "#E5E7EB" : "#111827",
        ["--an-t2" as string]: isDark ? "#94A3B8" : "#6B7280",
        ["--an-t3" as string]: isDark ? "#64748B" : "#9CA3AF",
        ["--an-bdr" as string]: isDark ? "rgba(148,163,184,0.24)" : "#E5E7EB",
        ["--an-bg" as string]: isDark ? "#0F172A" : "#F9FAFB",
      }}
    >
      <div className={`mb-4 rounded-2xl p-4 md:p-5 ${isDark ? "border border-slate-700 bg-slate-900" : "border border-[#FBD5BE] bg-white"}`}>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className={`rounded-full px-3 py-1 text-xs font-black ${isDark ? "border border-amber-700 bg-amber-950/60 text-amber-300" : "border border-[#FCD34D] bg-[#FFFBEB] text-[#B45309]"}`}>MỤC TIÊU TUẦN 5h</span>
          <span className={`rounded-full px-3 py-1 text-xs font-black ${isDark ? "border border-rose-700 bg-rose-950/60 text-rose-300" : "border border-[#F8B4B4] bg-[#FEF2F2] text-[#B91C1C]"}`}>CHUỖI 12 NGÀY</span>
          <span className={`rounded-full px-3 py-1 text-xs font-black ${isDark ? "border border-indigo-700 bg-indigo-950/60 text-indigo-300" : "border border-[#C7D2FE] bg-[#EEF2FF] text-[#4338CA]"}`}>HẠNG #18</span>
          <span className={`rounded-full px-3 py-1 text-xs font-black ${isDark ? "border border-orange-700 bg-orange-950/60 text-orange-300" : "border border-[#FBD5BE] bg-[#FFF3EB] text-[#9A3412]"}`}>72% SẴN SÀNG</span>
        </div>
        <h1 className={`mt-3 text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-gray-900"}`}>Trung tâm tiến độ</h1>
        <p className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-gray-500"}`}>Theo dõi kết quả theo phong cách ứng dụng học tập: chuỗi nhiệm vụ, cấp độ và tiến độ từng kỹ năng.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "16px" }}>
        <StatCard icon={<Zap size={18} color={OG} />} value="45" label="Tổng sprint" sub="↑ 8 trong tuần" color={OG} bg="rgba(243,112,33,0.1)" />
        <StatCard icon={<Clock size={18} color="#3B82F6" />} value="120h" label="Tổng giờ học" sub="TB 4.3h / ngày" color="#3B82F6" bg="#EFF6FF" />
        <StatCard icon={<TrendingUp size={18} color="#1D4ED8" />} value="72%" label="Điểm sẵn sàng" sub="+6 so với tuần trước" color="#1D4ED8" bg="#EFF6FF" />
        <StatCard icon={<BookOpen size={18} color="#8B5CF6" />} value="5/8" label="Chủ đề đã nắm" sub="Còn 3 chủ đề" color="#8B5CF6" bg="#F5F3FF" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: "14px", marginBottom: "14px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ background: WH, borderRadius: "16px", border: `1px solid ${BDR}`, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", padding: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <h3 style={{ fontFamily: F, fontWeight: 800, fontSize: "1rem", color: T1 }}>Kết quả quiz gần đây</h3>
              <span style={{ fontFamily: F, fontSize: "0.72rem", color: T3 }}>3 lần làm gần nhất</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
              {RECENT_QUIZ_SCORES.map((q, idx) => {
                const pct = Math.round((q.score / q.total) * 100);
                const isActive = idx === selectedQuiz;
                return (
                  <div key={q.title} style={{ padding: "11px 12px", borderRadius: "10px", border: `1px solid ${isActive ? "#C7D2FE" : BDR}`, background: isActive ? "#EEF2FF" : BG }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontFamily: F, fontSize: "0.78rem", fontWeight: 700, color: T1 }}>{q.title}</span>
                      <span style={{ fontFamily: F, fontSize: "0.72rem", fontWeight: 800, color: pct >= 80 ? "#1D4ED8" : pct >= 60 ? "#D97706" : "#DC2626" }}>{pct}%</span>
                    </div>
                    <div style={{ height: "6px", borderRadius: "99px", overflow: "hidden", background: "#E5E7EB", marginBottom: "5px" }}>
                      <div style={{ width: `${pct}%`, height: "100%", borderRadius: "99px", background: pct >= 80 ? "#10B981" : pct >= 60 ? "#F59E0B" : "#EF4444" }} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: F, fontSize: "0.68rem", color: T3 }}>{q.time}</span>
                      <span style={{ fontFamily: F, fontSize: "0.68rem", color: T3 }}>{q.date}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background: WH, borderRadius: "16px", border: `1px solid ${BDR}`, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <h3 style={{ fontFamily: F, fontWeight: 800, fontSize: "1rem", color: T1 }}>Tiến độ cây kỹ năng</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "8px", background: OGL }}>
                <Brain size={14} color={OG} />
                <span style={{ fontFamily: F, fontSize: "0.7rem", color: OG, fontWeight: 800 }}>THEO DÕI THÔNG MINH</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {TOPIC_PROGRESS.map(t => (
                <ProgressRow key={t.name} name={t.name} pct={t.pct} color={t.color} bg={t.bg} count={t.count} />
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ background: WH, borderRadius: "16px", border: `1px solid ${BDR}`, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", padding: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <h3 style={{ fontFamily: F, fontWeight: 800, fontSize: "1rem", color: T1 }}>Thành tựu</h3>
              <span style={{ fontFamily: F, fontSize: "0.7rem", fontWeight: 700, color: "#F59E0B", background: "#FFFBEB", padding: "3px 9px", borderRadius: "6px" }}>{ACHIEVEMENTS.filter(a => a.earned).length} đã mở</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {ACHIEVEMENTS.map((a, i) => (
                <motion.div
                  key={a.title}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * i }}
                  style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", background: a.earned ? a.bg : BG, border: `1px solid ${a.earned ? "transparent" : BDR}`, opacity: a.earned ? 1 : 0.65 }}
                >
                  <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: a.earned ? WH : BDR, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: a.earned ? "0 2px 6px rgba(0,0,0,0.08)" : "none" }}>
                    {a.earned ? a.icon : <Lock size={13} color={T3} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: F, fontSize: "0.82rem", fontWeight: 700, color: a.earned ? T1 : T3 }}>{a.title}</p>
                    <p style={{ fontFamily: F, fontSize: "0.68rem", color: T3, marginTop: "1px" }}>{a.date}</p>
                  </div>
                  {a.earned && <span style={{ fontFamily: F, fontSize: "0.68rem", fontWeight: 800, color: "#D97706", background: "#FFFBEB", padding: "2px 7px", borderRadius: "5px", flexShrink: 0 }}>+{a.xp} XP</span>}
                </motion.div>
              ))}
            </div>
          </div>

          <div style={{ background: WH, borderRadius: "16px", border: `1px solid ${BDR}`, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", padding: "18px" }}>
            <h3 style={{ fontFamily: F, fontWeight: 800, fontSize: "0.95rem", color: T1, marginBottom: "8px" }}>Nhận xét từ AI Coach</h3>
            <p style={{ fontFamily: F, fontSize: "0.75rem", color: T2, lineHeight: 1.7 }}>
              Bạn đang học đều hơn mức trung bình lớp, nhưng điểm Thiết kế hệ thống và React nâng cao vẫn thấp. Hãy ưu tiên 2 bài trắc nghiệm nhanh tiếp theo ở hai nhóm này để kéo điểm sẵn sàng tăng nhanh hơn.
            </p>
          </div>
        </div>
      </div>

      <div style={{ background: WH, borderRadius: "16px", border: `1px solid ${BDR}`, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <h3 style={{ fontFamily: F, fontWeight: 800, fontSize: "1rem", color: T1 }}>Độ ổn định theo tuần</h3>
          <span style={{ fontFamily: F, fontSize: "0.72rem", color: T3 }}>Giờ học của bạn so với trung bình lớp</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "8px" }}>
          {CONSISTENCY_DATA.map((d) => (
            <div key={d.day} style={{ border: `1px solid ${BDR}`, borderRadius: "10px", padding: "10px 8px", background: BG }}>
              <p style={{ textAlign: "center", fontSize: "0.7rem", fontWeight: 800, color: T2, marginBottom: "8px" }}>{d.day}</p>
              <div style={{ height: "72px", display: "flex", alignItems: "flex-end", justifyContent: "center", gap: "4px" }}>
                <div style={{ width: "9px", height: `${d.classAvg * 10}px`, borderRadius: "99px", background: "#9CA3AF" }} />
                <div style={{ width: "9px", height: `${d.yourHours * 10}px`, borderRadius: "99px", background: OG }} />
              </div>
              <p style={{ textAlign: "center", fontSize: "0.65rem", color: T3, marginTop: "6px" }}>{d.yourHours}h</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

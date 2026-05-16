import { useState } from "react";
import { motion } from "motion/react";
import {
  Zap, Clock, TrendingUp, BookOpen, Star,
  Trophy, Target, Flame, Lock,
} from "lucide-react";

/* ─── Tokens ─── */
const F   = "'Plus Jakarta Sans', Inter, sans-serif";
const OG  = "#FF6B00";
const OGL = "rgba(255,107,0,0.08)";
const WH  = "#FFFFFF";
const T1  = "#111827";
const T2  = "#6B7280";
const T3  = "#9CA3AF";
const BDR = "#E5E7EB";
const BG  = "#F9FAFB";

/* ─── Data ─── */
const RADAR_DATA = [
  { skill: "Giải quyết vấn đề", you: 85,  market: 75 },
  { skill: "React.js",        you: 72,  market: 80 },
  { skill: "Thiết kế UI/UX",  you: 68,  market: 70 },
  { skill: "Giao tiếp",       you: 78,  market: 75 },
  { skill: "System Design",   you: 45,  market: 60 },
  { skill: "Cấu trúc dữ liệu", you: 90,  market: 80 },
];

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
  { name: "Nền tảng", pct: 100, color: "#3B82F6", bg: "#EFF6FF", count: "3/3 chủ đề"   },
  { name: "Cốt lõi",   pct: 67,  color: OG,        bg: OGL,        count: "2/3 chủ đề"   },
  { name: "Nâng cao",  pct: 25,  color: "#8B5CF6", bg: "#F5F3FF", count: "0.5/2 chủ đề" },
];

const ACHIEVEMENTS = [
  { title: "Chuỗi 7 ngày",      icon: <Flame  size={16} color="#EF4444" />, bg: "#FEF2F2", date: "08/03/2026", xp: 200, earned: true  },
  { title: "React Master",      icon: <Trophy size={16} color="#F59E0B" />, bg: "#FFFBEB", date: "01/03/2026", xp: 500, earned: true  },
  { title: "Mới vào thuật toán", icon: <Target size={16} color="#8B5CF6" />, bg: "#F5F3FF", date: "Đang tiến hành", xp: 300, earned: false },
  { title: "Nhà vô địch sprint", icon: <Zap    size={16} color={OG} />,      bg: OGL,       date: "Khóa",       xp: 400, earned: false },
];

/* ══════════════════════════════
   CUSTOM SVG RADAR CHART
   (avoids recharts duplicate-key bug with PolarGrid)
══════════════════════════════ */
function RadarChartSVG() {
  const cx = 200;
  const cy = 180;
  const R  = 120;
  const levels = 4;
  const n = RADAR_DATA.length;

  // Angle for each axis (start from top, go clockwise)
  const angle = (i: number) => (i * 2 * Math.PI) / n - Math.PI / 2;

  // Convert (value 0-100, axis index) -> (x, y)
  const pt = (val: number, i: number) => ({
    x: cx + (val / 100) * R * Math.cos(angle(i)),
    y: cy + (val / 100) * R * Math.sin(angle(i)),
  });

  // Build polygon path string from array of points
  const polyPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ") + " Z";

  // Grid rings
  const rings = Array.from({ length: levels }, (_, li) => {
    const r = ((li + 1) / levels) * R;
    const pts = Array.from({ length: n }, (_, i) => ({
      x: cx + r * Math.cos(angle(i)),
      y: cy + r * Math.sin(angle(i)),
    }));
    return polyPath(pts);
  });

  // Axis lines
  const axes = Array.from({ length: n }, (_, i) => {
    const outer = pt(100, i);
    return { x1: cx, y1: cy, x2: outer.x, y2: outer.y };
  });

  // Data polygons
  const youPts    = RADAR_DATA.map((d, i) => pt(d.you,    i));
  const mktPts    = RADAR_DATA.map((d, i) => pt(d.market, i));

  // Label positions (slightly beyond R)
  const labelOffset = 20;
  const labels = RADAR_DATA.map((d, i) => {
    const a = angle(i);
    return {
      text: d.skill,
      x: cx + (R + labelOffset) * Math.cos(a),
      y: cy + (R + labelOffset) * Math.sin(a),
    };
  });

  return (
    <svg viewBox="0 0 400 360" style={{ width: "100%", height: "100%" }}>
      {/* Grid rings */}
      {rings.map((d, i) => (
        <path
          key={`ring-${i}`}
          d={d}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={1}
        />
      ))}

      {/* Axis lines */}
      {axes.map((a, i) => (
        <line
          key={`axis-${i}`}
          x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2}
          stroke="#E5E7EB" strokeWidth={1}
        />
      ))}

      {/* Market polygon */}
      <path
        d={polyPath(mktPts)}
        fill="#F3F4F6"
        fillOpacity={0.6}
        stroke="#9CA3AF"
        strokeWidth={2}
        strokeDasharray="5 3"
      />

      {/* You polygon */}
      <path
        d={polyPath(youPts)}
        fill={OG}
        fillOpacity={0.16}
        stroke={OG}
        strokeWidth={2.5}
      />

      {/* You dots */}
      {youPts.map((p, i) => (
        <circle key={`you-dot-${i}`} cx={p.x} cy={p.y} r={4} fill={OG} />
      ))}

      {/* Labels */}
      {labels.map((l, i) => {
        // Horizontal alignment based on x position
        const anchor =
          l.x < cx - 10 ? "end" : l.x > cx + 10 ? "start" : "middle";
        return (
          <text
            key={`label-${i}`}
            x={l.x}
            y={l.y}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize={11}
            fontWeight={600}
            fontFamily={F}
            fill={T2}
          >
            {l.text}
          </text>
        );
      })}
    </svg>
  );
}

/* ══════════════════════════════
   CUSTOM SVG LINE CHART
   (avoids recharts duplicate-key bug with Line/dot rendering)
══════════════════════════════ */
function LineChartSVG() {
  const W = 900, H = 210;
  const padL = 36, padR = 16, padT = 12, padB = 32;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const data = CONSISTENCY_DATA;
  const n = data.length;
  const maxY = 7;

  const xPos = (i: number) => padL + (i / (n - 1)) * innerW;
  const yPos = (v: number) => padT + innerH - (v / maxY) * innerH;

  // Build polyline points string
  const pointsStr = (key: "yourHours" | "classAvg") =>
    data.map((d, i) => `${xPos(i).toFixed(1)},${yPos(d[key]).toFixed(1)}`).join(" ");

  // Y grid lines
  const yTicks = [0, 2, 4, 6];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%" }}>
      {/* Y grid lines */}
      {yTicks.map(v => (
        <g key={`ygrid-${v}`}>
          <line
            x1={padL} x2={W - padR}
            y1={yPos(v)} y2={yPos(v)}
            stroke="#F3F4F6" strokeWidth={1}
          />
          <text
            x={padL - 5} y={yPos(v)}
            textAnchor="end" dominantBaseline="middle"
            fontSize={11} fontFamily={F} fill="#6B7280"
          >{v}h</text>
        </g>
      ))}

      {/* X axis labels */}
      {data.map((d, i) => (
        <text
          key={`xlabel-${i}`}
          x={xPos(i)} y={H - 6}
          textAnchor="middle"
          fontSize={12} fontFamily={F} fontWeight={600} fill="#6B7280"
        >{d.day}</text>
      ))}

      {/* Class avg line */}
      <polyline
        points={pointsStr("classAvg")}
        fill="none" stroke="#9CA3AF" strokeWidth={2.5}
        strokeDasharray="5 4" strokeLinecap="round" strokeLinejoin="round"
      />
      {/* Class avg dots */}
      {data.map((d, i) => (
        <circle key={`avg-dot-${i}`} cx={xPos(i)} cy={yPos(d.classAvg)} r={4} fill="#9CA3AF" />
      ))}

      {/* Your hours line */}
      <polyline
        points={pointsStr("yourHours")}
        fill="none" stroke={OG} strokeWidth={3}
        strokeLinecap="round" strokeLinejoin="round"
      />
      {/* Your hours dots */}
      {data.map((d, i) => (
        <g key={`you-dot-${i}`}>
          <circle cx={xPos(i)} cy={yPos(d.yourHours)} r={6} fill={WH} stroke={OG} strokeWidth={2.5} />
          <circle cx={xPos(i)} cy={yPos(d.yourHours)} r={3} fill={OG} />
        </g>
      ))}
    </svg>
  );
}

/* ─── Stat card ─── */
function StatCard({ icon, value, label, sub, color, bg }: {
  icon: React.ReactNode; value: string; label: string;
  sub?: string; color: string; bg: string;
}) {
  return (
    <div style={{
      background: WH, borderRadius: "14px",
      border: `1px solid ${BDR}`,
      boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
      padding: "20px 18px",
      display: "flex", flexDirection: "column", gap: "4px",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: "-18px", right: "-18px",
        width: "72px", height: "72px", borderRadius: "50%",
        background: bg, opacity: 0.7,
      }} />
      <div style={{
        width: "36px", height: "36px", borderRadius: "10px",
        background: bg, display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: "6px", flexShrink: 0, position: "relative",
      }}>
        {icon}
      </div>
      <p style={{ fontFamily: F, fontWeight: 900, fontSize: "1.7rem", color, lineHeight: 1, letterSpacing: "-0.04em" }}>
        {value}
      </p>
      <p style={{ fontFamily: F, fontSize: "0.78rem", fontWeight: 700, color: T2, letterSpacing: "0.02em" }}>
        {label}
      </p>
      {sub && (
        <p style={{ fontFamily: F, fontSize: "0.7rem", color, fontWeight: 600, marginTop: "2px" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

/* ─── Line chart tooltip ─── */
function LineTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: WH, border: `1px solid ${BDR}`,
      borderRadius: "10px", padding: "10px 13px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
      fontFamily: F, fontSize: "0.78rem",
    }}>
      <p style={{ fontWeight: 700, color: T1, marginBottom: "4px" }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.stroke, fontWeight: 600 }}>
          {p.name}: <span style={{ color: T1 }}>{p.value}h</span>
        </p>
      ))}
    </div>
  );
}

/* ─── Main component ─── */
export default function Analytics() {
  const [focusMode] = useState("Cân bằng");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-6xl mx-auto w-full"
      style={{ fontFamily: F }}
    >
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-7">
        <div>
          <h1 style={{ fontFamily: F }} className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
            Phân tích học tập
          </h1>
          <p className="text-gray-500 text-sm" style={{ fontFamily: F }}>
            Theo dõi tiến độ, so sánh với mặt bằng lớp, và tối ưu nhịp độ học tập của bạn.
          </p>
        </div>
        <div style={{
          fontFamily: F,
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 12px",
          borderRadius: "10px",
          border: `1px solid ${BDR}`,
          background: WH,
        }}>
          <span style={{ fontSize: "0.72rem", color: T3, fontWeight: 700 }}>Chế độ tập trung</span>
          <span style={{ fontSize: "0.74rem", color: OG, fontWeight: 800 }}>{focusMode}</span>
        </div>
      </div>

      {/* ── 4 Stat cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "24px" }}>
        <StatCard
          icon={<Zap size={18} color={OG} />}
          value="45" label="Tổng sprint" sub="↑ 8 sprint tuần này"
          color={OG} bg="rgba(255,107,0,0.1)"
        />
        <StatCard
          icon={<Clock size={18} color="#3B82F6" />}
          value="120h" label="Tổng giờ học" sub="Trung bình 4.3h / ngày"
          color="#3B82F6" bg="#EFF6FF"
        />
        <StatCard
          icon={<TrendingUp size={18} color="#059669" />}
          value="0%" label="Điểm sẵn sàng" sub="Bắt đầu học để tăng điểm"
          color="#059669" bg="#ECFDF5"
        />
        <StatCard
          icon={<BookOpen size={18} color="#8B5CF6" />}
          value="0/8" label="Chủ đề đã nắm" sub="Còn 8 chủ đề"
          color="#8B5CF6" bg="#F5F3FF"
        />
      </div>

      {/* ── Main 3-column layout ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "18px", marginBottom: "18px" }}>

        {/* ── LEFT (2 cols): Radar + Topic Progress ── */}
        <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Capability Radar — custom SVG (no recharts to avoid duplicate key bug) */}
          <div style={{
            background: WH, borderRadius: "16px",
            border: `1px solid ${BDR}`,
            boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
            padding: "22px 22px 10px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
              <div>
                <h3 style={{ fontFamily: F, fontWeight: 800, fontSize: "1rem", color: T1 }}>Radar năng lực</h3>
                <p style={{ fontFamily: F, fontSize: "0.75rem", color: T3, marginTop: "2px" }}>
                  Năng lực của bạn so với mặt bằng thị trường
                </p>
              </div>
              <div style={{ display: "flex", gap: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "rgba(255,107,0,0.15)", border: `2px solid ${OG}` }} />
                  <span style={{ fontFamily: F, fontSize: "0.72rem", fontWeight: 600, color: T2 }}>Bạn</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#F3F4F6", border: "2px solid #9CA3AF" }} />
                  <span style={{ fontFamily: F, fontSize: "0.72rem", fontWeight: 600, color: T2 }}>Mặt bằng thị trường</span>
                </div>
              </div>
            </div>
            <div style={{ height: "300px", width: "100%" }}>
              <RadarChartSVG />
            </div>
          </div>

          {/* Topic Progress */}
          <div style={{
            background: WH, borderRadius: "16px",
            border: `1px solid ${BDR}`,
            boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
            padding: "22px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ fontFamily: F, fontWeight: 800, fontSize: "1rem", color: T1 }}>Tiến độ chủ đề</h3>
              <span style={{
                fontFamily: F, fontSize: "0.7rem", fontWeight: 700,
                color: OG, background: OGL, padding: "3px 10px", borderRadius: "6px",
              }}>
                {TOPIC_PROGRESS.filter(t => t.pct === 100).length}/{TOPIC_PROGRESS.length} hoàn thành
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {TOPIC_PROGRESS.map(t => (
                <div key={t.name}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "7px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ padding: "3px 9px", borderRadius: "6px", background: t.bg, border: `1px solid ${t.color}22` }}>
                        <span style={{ fontFamily: F, fontSize: "0.72rem", fontWeight: 700, color: t.color }}>{t.name}</span>
                      </div>
                      <span style={{ fontFamily: F, fontSize: "0.72rem", color: T3 }}>{t.count}</span>
                    </div>
                    <span style={{ fontFamily: F, fontSize: "0.82rem", fontWeight: 800, color: t.color }}>{t.pct}%</span>
                  </div>
                  <div style={{ height: "8px", background: BDR, borderRadius: "99px", overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${t.pct}%` }}
                      transition={{ duration: 1.1, ease: "easeOut", delay: 0.2 }}
                      style={{
                        height: "100%",
                        background: `linear-gradient(90deg, ${t.color}99, ${t.color})`,
                        borderRadius: "99px",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Insights + Achievements ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Weekly Insight */}
          <div style={{
            background: WH, borderRadius: "16px",
            border: `1px solid ${BDR}`,
            boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
            padding: "20px", position: "relative", overflow: "hidden",
          }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "3px 8px",
              borderRadius: "6px",
              background: OGL,
              border: `1px solid rgba(255,107,0,0.2)`,
              marginBottom: "12px",
            }}>
              <TrendingUp size={10} color={OG} />
              <span style={{ fontFamily: F, fontSize: "0.62rem", fontWeight: 800, color: OG }}>TUẦN NÀY</span>
            </div>
            <div style={{
              width: "46px", height: "46px", borderRadius: "13px",
              background: OGL, border: `1px solid rgba(255,107,0,0.18)`,
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px",
            }}>
              <Zap size={22} color={OG} />
            </div>
            <h3 style={{ fontFamily: F, fontWeight: 800, fontSize: "1rem", color: T1, marginBottom: "6px" }}>Động lực học tập</h3>
            <p style={{ fontFamily: F, fontSize: "0.75rem", color: T2, lineHeight: 1.6, marginBottom: "16px" }}>
              Bạn đang mạnh ở tính đều đặn và khối lượng luyện tập. Gợi ý tiếp theo: tập trung System Design để tăng điểm sẵn sàng nhanh hơn.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div style={{ padding: "10px", borderRadius: "10px", background: "#ECFDF5", border: "1px solid #BBF7D0" }}>
                <p style={{ fontFamily: F, fontSize: "0.65rem", color: "#047857", fontWeight: 700 }}>Ngày tốt nhất</p>
                <p style={{ fontFamily: F, fontSize: "0.9rem", color: "#065F46", fontWeight: 800, marginTop: "2px" }}>Thứ Bảy</p>
              </div>
              <div style={{ padding: "10px", borderRadius: "10px", background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                <p style={{ fontFamily: F, fontSize: "0.65rem", color: "#1D4ED8", fontWeight: 700 }}>Kỹ năng cần bù</p>
                <p style={{ fontFamily: F, fontSize: "0.9rem", color: "#1E40AF", fontWeight: 800, marginTop: "2px" }}>System Design</p>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div style={{
            background: WH, borderRadius: "16px",
            border: `1px solid ${BDR}`,
            boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
            padding: "20px", flex: 1,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <h3 style={{ fontFamily: F, fontWeight: 800, fontSize: "1rem", color: T1 }}>Thành tích</h3>
              <span style={{
                fontFamily: F, fontSize: "0.7rem", fontWeight: 700,
                color: "#F59E0B", background: "#FFFBEB", padding: "3px 9px", borderRadius: "6px",
              }}>
                {ACHIEVEMENTS.filter(a => a.earned).length} đã đạt
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {ACHIEVEMENTS.map((a, i) => (
                <motion.div
                  key={a.title}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "10px 12px", borderRadius: "10px",
                    background: a.earned ? a.bg : BG,
                    border: `1px solid ${a.earned ? "transparent" : BDR}`,
                    opacity: a.earned ? 1 : 0.65,
                  }}
                >
                  <div style={{
                    width: "34px", height: "34px", borderRadius: "9px",
                    background: a.earned ? WH : BDR,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: a.earned ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
                  }}>
                    {a.earned ? a.icon : <Lock size={13} color={T3} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: F, fontSize: "0.82rem", fontWeight: 700, color: a.earned ? T1 : T3 }}>{a.title}</p>
                    <p style={{ fontFamily: F, fontSize: "0.68rem", color: T3, marginTop: "1px" }}>{a.date}</p>
                  </div>
                  {a.earned && (
                    <span style={{
                      fontFamily: F, fontSize: "0.68rem", fontWeight: 800,
                      color: "#D97706", background: "#FFFBEB",
                      padding: "2px 7px", borderRadius: "5px", flexShrink: 0,
                    }}>+{a.xp} XP</span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom wide: Study Consistency line graph ── */}
      <div style={{
        background: WH, borderRadius: "16px",
        border: `1px solid ${BDR}`,
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        padding: "22px 22px 16px",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
          <div>
            <h3 style={{ fontFamily: F, fontWeight: 800, fontSize: "1rem", color: T1 }}>Độ ổn định học tập</h3>
            <p style={{ fontFamily: F, fontSize: "0.75rem", color: T3, marginTop: "2px" }}>
              Giờ học của bạn so với trung bình lớp — tuần này
            </p>
          </div>
          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "20px", height: "3px", borderRadius: "99px", background: OG }} />
              <span style={{ fontFamily: F, fontSize: "0.72rem", fontWeight: 600, color: T2 }}>Giờ học của bạn</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "20px", height: "3px", borderRadius: "99px", background: "#9CA3AF" }} />
              <span style={{ fontFamily: F, fontSize: "0.72rem", fontWeight: 600, color: T2 }}>Trung bình lớp</span>
            </div>
          </div>
        </div>

        <div style={{ height: "210px", width: "100%" }}>
          <LineChartSVG />
        </div>
      </div>
    </motion.div>
  );
}
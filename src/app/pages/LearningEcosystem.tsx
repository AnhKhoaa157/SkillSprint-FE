import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLocation, useNavigate } from "react-router";
import { PomodoroTimer } from "../components/PomodoroTimer";
import {
  Sparkles, Clock, Send, Brain, CheckCircle2,
  Youtube, FileText, ChevronRight, BookOpen,
  ExternalLink, RotateCcw, Play, Star, X,
  Pause, Zap, Bell, Lock, Check, Search,
  ChevronDown, ListVideo, AlignLeft, Headphones,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════
   DESIGN TOKENS — Light Theme (matches app template)
═══════════════════════════════════════════════════════ */
const F         = "'Inter','Plus Jakarta Sans',sans-serif";
const PAGE      = "#F8FAFC";          // app background
const NAVY      = "#0F172A";          // AI Tutor panel background
const CARD      = "#FFFFFF";          // white cards
const CARD2     = "#F1F5F9";          // subtle card variant
const BORDER    = "#E5E7EB";          // light border
const BORDER2   = "#D1D5DB";          // slightly darker border
const OG        = "#FF6B00";          // SkillSprint orange
const OG2       = "#FF8C3A";
const BLUE      = "#2563EB";
const BLUE2     = "#1E40AF";
const PU        = "#7C3AED";
const GR        = "#10B981";
const RD        = "#EF4444";
const T1        = "#111827";          // primary text (dark)
const T2        = "#6B7280";          // secondary
const T3        = "#9CA3AF";          // muted
const T4        = "#D1D5DB";          // very muted / placeholder
const PT1       = "#F8FAFC";          // panel primary text
const PT2       = "#CBD5E1";          // panel secondary text
const PT3       = "#94A3B8";          // panel muted text
const PT4       = "#64748B";          // panel placeholder text
const PBORDER   = "rgba(148,163,184,0.24)";
const PSURFACE  = "#132035";
const OG_DARK   = "#C2410C";
const OG_SOFT   = "#FDBA74";
const P_ORANGE_SURFACE = "rgba(255,107,0,0.14)";

/* ═══════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════ */
const EPISODES = [
  { id: 1,  title: "Nhập môn Cấu trúc dữ liệu",          dur: "08:12", views: "12.4K", done: true,  active: false, tag: "Bài giảng"  },
  { id: 2,  title: "Mảng và đánh chỉ số từ 0",           dur: "14:22", views: "9.1K",  done: false, active: true,  tag: "Bài giảng"  },
  { id: 3,  title: "Danh sách liên kết — Lý thuyết & Thực hành",dur: "21:05", views: "7.8K",  done: false, active: false, tag: "Bài giảng"  },
  { id: 4,  title: "Giải thích ngăn xếp & hàng đợi",     dur: "18:44", views: "6.2K",  done: false, active: false, tag: "Thực hành" },
  { id: 5,  title: "Bảng băm chuyên sâu",                dur: "26:38", views: "5.9K",  done: false, active: false, tag: "Bài giảng"  },
  { id: 6,  title: "Cây nhị phân & cây tìm kiếm nhị phân",dur: "33:21", views: "4.7K",  done: false, active: false, tag: "Bài giảng"  },
  { id: 7,  title: "Duyệt đồ thị: BFS & DFS",            dur: "28:56", views: "4.1K",  done: false, active: false, tag: "Mô phỏng"    },
  { id: 8,  title: "Thuật toán sắp xếp — O(n log n)",    dur: "41:15", views: "3.8K",  done: false, active: false, tag: "Bài giảng"  },
];

const ARTICLES = [
  { id: "a1", title: "Hiểu Big-O: Hướng dẫn trực quan",                     source: "Medium",             readTime: "7 phút",  tag: "Cơ bản",     icon: "📘" },
  { id: "a2", title: "Mảng đánh chỉ số từ 0: lịch sử và ý nghĩa",            source: "Stack Overflow Blog", readTime: "5 phút",  tag: "Khái niệm",  icon: "📖" },
  { id: "a3", title: "Mảng và danh sách liên kết: khi nào dùng?",            source: "GeeksForGeeks",      readTime: "10 phút", tag: "So sánh",    icon: "⚖️" },
  { id: "a4", title: "Giải thích Hash Map bằng ví dụ thực tế",               source: "Dev.to",             readTime: "8 phút",  tag: "Nâng cao",   icon: "🗂️" },
  { id: "a5", title: "Nghệ thuật đệ quy: điều kiện dừng và ngăn xếp lời gọi", source: "CS50 Blog",          readTime: "12 phút", tag: "Nâng cao",   icon: "🔁" },
];

const QUIZ_OPTS = [
  { id: "a", text: "O(n) — Thời gian tuyến tính"       },
  { id: "b", text: "O(log n) — Thời gian logarit"      },
  { id: "c", text: "O(n log n) — Tuyến tính-logarit"   },
  { id: "d", text: "O(1) — Thời gian hằng số"          },
];

const INIT_MSGS = [
  { role: "ai",   text: "Chào bạn! 👋 Bạn đang học mảng và đánh chỉ số. Muốn mình giải thích nhanh cách đánh chỉ số từ 0 bằng ví dụ trực quan không?", time: "Vừa xong" },
  { role: "user", text: "Có, mình hay nhầm index 4 với vị trí 5.",                                                                                              time: "Vừa xong" },
  { role: "ai",   text: "Đây là nhầm lẫn rất phổ biến! Hãy xem mảng như các ô đỗ xe đánh số từ 0:\n\narr = [3, 1, 4, 1, 5, 9]\nÔ số 0 → 3\nÔ số 4 → 5 ✅\n\nVì đếm từ 0 nên 'vị trí thứ 5' sẽ tương ứng với index 4.", time: "Vừa xong" },
];
const CHIPS = ["Cho mình thêm ví dụ", "Vì sao bắt đầu từ 0?", "Mảng và danh sách liên kết", "Cho mình câu hỏi luyện tập"];

type RoadmapLearningPayload = {
  id?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  phase?: number;
  tip?: string;
  est?: string;
  xp?: number;
};

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════ */
export default function LearningEcosystem() {
  const location = useLocation();
  const navigate = useNavigate();
  const roadmapContext = (location.state as { roadmap?: RoadmapLearningPayload } | null)?.roadmap;
  const pageTitle = roadmapContext?.title ?? "Mảng và đánh chỉ số từ 0";
  const pageSub = roadmapContext?.description
    ?? "Hiểu cách đánh chỉ số mảng hoạt động bên dưới: vì sao bắt đầu từ 0, lỗi off-by-one thường gặp, và các mẫu code dùng trong sản phẩm thực tế.";
  const pageModule = roadmapContext?.phase ? `Học phần ${roadmapContext.phase}` : "Học phần 3";
  const playingLabel = roadmapContext?.id
    ? `▶ LỘ TRÌNH · ${roadmapContext.id.toUpperCase()}`
    : "▶ ĐANG PHÁT · BÀI 2";

  const initialMsgs = useMemo(() => {
    if (!roadmapContext?.title) return INIT_MSGS;
    return [
      { role: "ai", text: `Bạn đang học \"${roadmapContext.title}\". Bạn có muốn lộ trình hướng dẫn nhanh trong 5 phút cho nút kiến thức này không?`, time: "Vừa xong" },
      { role: "user", text: "Có, cho mình cách nhanh nhất để nắm học phần này.", time: "Vừa xong" },
      { role: "ai", text: `Tuyệt. Chúng ta sẽ tập trung vào các khái niệm tác động cao trước, sau đó làm 1 bài thực hành. ${roadmapContext.tip ?? "Mình sẽ điều chỉnh theo tiến độ của bạn theo thời gian thực."}`, time: "Vừa xong" },
    ];
  }, [roadmapContext?.id, roadmapContext?.title, roadmapContext?.tip]);

  /* ── Quiz modal ── */
  const [quizOpen,   setQuizOpen]   = useState(true);
  const [selected,   setSelected]   = useState<string | null>(null);
  const [submitted,  setSubmitted]  = useState(false);
  const [quizTimer,  setQuizTimer]  = useState(120); // 2 min countdown

  /* ── AI Tutor panel ── */
  const [panelOpen, setPanelOpen] = useState(true);
  const [messages,  setMessages]  = useState(initialMsgs);
  const [msgInput,  setMsgInput]  = useState("");
  const [typing,    setTyping]    = useState(false);
  const chatEndRef  = useRef<HTMLDivElement>(null);
  const PANEL_W     = 390;

  /* ── Content ── */
  const [activeEp,  setActiveEp]  = useState(2);
  const [search,    setSearch]    = useState("");
  const [hubPlaying, setHubPlaying] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [podcastPlaying, setPodcastPlaying] = useState(false);
  const [activePick, setActivePick] = useState("Giải thích tìm kiếm nhị phân");

  /* timer countdown while quiz open */
  useEffect(() => {
    if (!quizOpen || submitted) return;
    const t = setInterval(() => setQuizTimer(n => (n > 0 ? n - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [quizOpen, submitted]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    setMessages(initialMsgs);
    setActiveEp(1);
  }, [initialMsgs]);

  const sendMsg = (text: string) => {
    if (!text.trim()) return;
    setMessages(p => [...p, { role: "user", text, time: "Vừa xong" }]);
    setMsgInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(p => [...p, {
        role: "ai",
        text: "Câu hỏi hay! Mình sẽ tách nhỏ bằng ví dụ cụ thể để bạn nhớ lâu hơn. Đánh chỉ số trong mảng là nền tảng mở khóa rất nhiều chủ đề khác. 🔑",
        time: "Vừa xong",
      }]);
    }, 1600);
  };

  const timerPct = (quizTimer / 120) * 100;
  const timerColor = quizTimer > 60 ? GR : quizTimer > 30 ? "#F59E0B" : RD;
  const filteredEps = EPISODES.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase())
  );
  const activeEpisode = EPISODES.find(ep => ep.id === activeEp) ?? EPISODES[0];
  const learningSubject = useMemo(() => {
    const lowered = pageTitle.toLowerCase();
    if (lowered.includes("mảng") || lowered.includes("cấu trúc dữ liệu") || lowered.includes("danh sách liên kết")) {
      return "Cấu trúc dữ liệu";
    }
    if (lowered.includes("xác suất") || lowered.includes("thống kê")) {
      return "Xác suất & Thống kê";
    }
    if (lowered.includes("os") || lowered.includes("hệ điều hành")) {
      return "Hệ điều hành";
    }
    return "Môn hiện tại";
  }, [pageTitle]);

  return (
    <div style={{ position: "relative", fontFamily: F, background: PAGE, minHeight: "100%" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.14); border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.26); }
        ::placeholder { color: ${T3}; }
        @keyframes lh-pulse  { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes lh-glow   { 0%,100%{box-shadow:0 0 0 0 rgba(255,107,0,0)} 50%{box-shadow:0 0 0 6px rgba(255,107,0,0.18)} }
        @keyframes lh-bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }
        @keyframes lh-slide  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .eco-pre { white-space: pre-wrap; }
        .ep-header { position: sticky; top: 0; z-index: 10; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
      `}</style>

      {/* ════════════════════════════════════════════
          TOP BAR — slim brand + controls, NO TABS
      ════════════════════════════════════════════ */}
      

      {/* ════════════════════════════════════════════
          MAIN SCROLLABLE BACKGROUND
          Auto-Resources: full course content view
      ════════════════════════════════════════════ */}
      <div style={{
        paddingRight: panelOpen ? `${PANEL_W}px` : "0",
        transition: "padding-right 0.44s cubic-bezier(0.22,1,0.36,1)",
        background: PAGE,
      }}>

        {/* ── NOW PLAYING hero ── */}
        <div style={{
          background: `linear-gradient(135deg, rgba(255,107,0,0.10) 0%, rgba(255,140,58,0.06) 56%, rgba(251,146,60,0.04) 100%)`,
          borderBottom: `1px solid ${BORDER}`,
          padding: "28px 32px 24px",
          position: "relative", overflow: "hidden",
        }}>
          {/* Ambient orbs */}
          <div style={{ position:"absolute", top:-60, right:60, width:300, height:300, borderRadius:"50%", background:"rgba(255,107,0,0.08)", filter:"blur(80px)", pointerEvents:"none" }}/>
          <div style={{ position:"absolute", bottom:-80, left:20, width:240, height:240, borderRadius:"50%", background:"rgba(251,146,60,0.08)", filter:"blur(70px)", pointerEvents:"none" }}/>

          <div style={{ position:"relative", zIndex:1, display:"flex", gap:26, alignItems:"flex-start" }}>

            {/* Video player mock */}
            <div style={{
              width:220, height:130, borderRadius:14, flexShrink:0,
              background:"linear-gradient(145deg, #18181B 0%, #111827 55%, #1F2937 100%)",
              border:`1px solid rgba(255,255,255,0.12)`,
              display:"flex", alignItems:"center", justifyContent:"center",
              position:"relative", overflow:"hidden",
              boxShadow:"0 16px 36px rgba(2,6,23,0.45), 0 8px 20px rgba(255,107,0,0.20)",
            }}>
              <div style={{ position:"absolute", inset:0, background:"radial-gradient(circle at 78% 20%, rgba(255,107,0,0.22), transparent 55%)" }} />
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.42) 100%)" }} />
              {/* Code lines bg */}
              <div style={{ position:"absolute", inset:0, padding:"10px 12px", pointerEvents:"none" }}>
                {["const arr = [3, 1, 4, 1, 5, 9];", "arr[4] // → 5  ✅", "// zero-indexed!"].map((l,i)=>(
                  <div key={i} style={{ fontFamily:"'Courier New',monospace", fontSize:"0.58rem", color:`rgba(255,237,213,${0.65-i*0.14})`, lineHeight:1.9 }}>{l}</div>
                ))}
              </div>
              <div style={{ position:"absolute", top:8, right:8, background:"rgba(255,107,0,0.22)", border:"1px solid rgba(255,140,58,0.45)", borderRadius:4, padding:"2px 7px", zIndex:2 }}>
                <span style={{ fontSize:"0.56rem", fontWeight:700, color:"#FFEDD5" }}>Chương 2</span>
              </div>
              {/* Play */}
              <button
                onClick={() => {
                  setActiveEp(2);
                  setQuizOpen(false);
                  setHubPlaying(v => !v);
                }}
                style={{
                width:44, height:44, borderRadius:"50%",
                background:"rgba(255,107,0,0.20)", backdropFilter:"blur(8px)",
                border:"1.5px solid rgba(255,140,58,0.55)",
                display:"flex", alignItems:"center", justifyContent:"center",
                cursor:"pointer", zIndex:2,
                boxShadow:"0 0 0 5px rgba(255,107,0,0.16)",
              }}
              >
                {hubPlaying ? <Pause size={17} color="#fff" /> : <Play size={17} color="#fff" fill="#fff"/>}
              </button>
              {/* Badges */}
              <div style={{ position:"absolute", top:8, left:8, display:"flex", alignItems:"center", gap:4, background:RD, padding:"2px 8px", borderRadius:4, zIndex:2 }}>
                <div style={{ width:5,height:5,borderRadius:"50%",background:"#fff",animation:"lh-pulse 1.5s infinite" }}/>
                <span style={{ fontSize:"0.56rem", fontWeight:800, color:"#fff", letterSpacing:"0.06em" }}>TRỰC TIẾP</span>
              </div>
              <div style={{ position:"absolute", bottom:8, right:8, background:"rgba(0,0,0,0.72)", padding:"2px 8px", borderRadius:4, zIndex:2 }}>
                <span style={{ fontSize:"0.62rem", fontWeight:700, color:"#fff" }}>42:15</span>
              </div>
              <div style={{ position:"absolute", left:10, right:10, bottom:10, height:3, background:"rgba(255,255,255,0.20)", borderRadius:99, zIndex:2 }}>
                <div style={{ width:"34%", height:"100%", background:`linear-gradient(90deg, ${OG}, ${OG2})`, borderRadius:99 }} />
              </div>
            </div>

            {/* Info */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <span style={{ fontSize:"0.60rem", fontWeight:700, color:OG, letterSpacing:"0.10em", textTransform:"uppercase" }}>{playingLabel}</span>
                <span style={{ fontSize:"0.60rem", color:T3 }}>{pageModule}</span>
              </div>
              <h1 style={{ fontSize:"1.22rem", fontWeight:800, color:T1, letterSpacing:"-0.03em", lineHeight:1.25, marginBottom:10 }}>
                {pageTitle}
              </h1>
              <p style={{ fontSize:"0.78rem", color:T2, lineHeight:1.65, maxWidth:480, marginBottom:14 }}>
                {pageSub}
              </p>

              {/* Progress */}
              <div style={{ marginBottom:14, maxWidth:440 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                  <span style={{ fontSize:"0.62rem", color:T3 }}>14:22 / 42:15</span>
                  <span style={{ fontSize:"0.62rem", color:OG_DARK, fontWeight:700 }}>Hoàn thành 34%</span>
                </div>
                <div style={{ height:4, background:CARD2, borderRadius:99 }}>
                  <motion.div
                    initial={{ width:0 }} animate={{ width:"34%" }}
                    transition={{ duration:1.2, ease:[0.22,1,0.36,1] }}
                    style={{ height:"100%", background:`linear-gradient(90deg,${OG},${OG2})`, borderRadius:99 }}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {[
                  { label:"Tiếp tục",   icon:<Play size={12} fill="#fff"/>,   bg:`linear-gradient(135deg,${OG},${OG2})`, sh:"rgba(255,107,0,0.40)" },
                  { label:"Học lại",    icon:<RotateCcw size={12} color={T2}/>,  bg:CARD, sh:"none" },
                  { label:"Đánh dấu",   icon:<Star size={12} color={bookmarked ? OG : T2} fill={bookmarked ? OG : "none"}/>, bg:CARD, sh:"none" },
                ].map(a => (
                  <button
                    key={a.label}
                    onClick={() => {
                      if (a.label === "Tiếp tục") {
                        setQuizOpen(false);
                        setPanelOpen(false);
                        setHubPlaying(true);
                        const activeLessonIndex = Math.max(0, EPISODES.findIndex(ep => ep.id === activeEpisode.id));
                        navigate("/app/learning/course", {
                          state: {
                            title: activeEpisode.title,
                            duration: activeEpisode.dur,
                            channel: "SkillSprint Academy",
                            subject: learningSubject,
                            lessonId: activeEpisode.id,
                            lessonIndex: activeLessonIndex,
                            lessonSection: activeEpisode.tag,
                          },
                        });
                      }
                      if (a.label === "Học lại") {
                        setQuizOpen(true);
                        setSubmitted(false);
                        setSelected(null);
                        setQuizTimer(120);
                        setActiveEp(2);
                        setHubPlaying(false);
                      }
                      if (a.label === "Đánh dấu") {
                        setBookmarked(v => !v);
                      }
                    }}
                    style={{
                    display:"flex", alignItems:"center", gap:6,
                    padding:"7px 16px", borderRadius:8,
                    border: a.sh === "none" ? `1px solid ${BORDER}` : "none",
                    background:a.bg, cursor:"pointer",
                    color: a.sh === "none" ? T2 : "#fff",
                    fontWeight:600, fontSize:"0.74rem",
                    boxShadow: a.sh !== "none" ? `0 4px 16px ${a.sh}` : "none",
                  }}
                  >
                    {a.icon}
                    {a.label}
                  </button>
                ))}
                <button
                  onClick={() => navigate("/app/quiz-review", {
                    state: {
                      subject: learningSubject,
                      lessonTitle: activeEpisode.title,
                    },
                  })}
                  style={{
                    display:"flex", alignItems:"center", gap:6,
                    padding:"7px 16px", borderRadius:8,
                    border:`1px solid ${BORDER}`,
                    background:CARD, cursor:"pointer",
                    color:T2, fontWeight:600, fontSize:"0.74rem",
                  }}
                >
                  Ôn tập TH
                </button>
              </div>
            </div>

            {/* XP badge */}
            <div style={{
              flexShrink:0, display:"flex", flexDirection:"column", alignItems:"center",
              gap:4, padding:"14px 18px", borderRadius:12,
              background:"rgba(255,107,0,0.10)", border:`1px solid rgba(255,107,0,0.22)`,
            }}>
              <span style={{ fontSize:"1.4rem" }}>⚡</span>
              <p style={{ fontSize:"0.72rem", fontWeight:800, color:OG }}>+150 XP</p>
              <p style={{ fontSize:"0.58rem", color:T3, textAlign:"center" }}>khi hoàn thành</p>
            </div>
          </div>
        </div>

        {/* ── Content grid: Episodes + Articles ── */}
        <div style={{ display:"flex", gap:0, minHeight:600 }}>

          {/* ─ LEFT: Episode list ─ */}
          <div style={{ flex:"1 1 55%", borderRight:`1px solid ${BORDER}`, display:"flex", flexDirection:"column" }}>

            {/* Header — sticky on scroll */}
            <div className="ep-header" style={{
              display:"flex", alignItems:"center", justifyContent:"space-between",
              marginBottom:0, padding:"16px 28px 14px",
              background:`linear-gradient(180deg, ${PAGE}F5 0%, ${PAGE}E0 100%)`,
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                <ListVideo size={16} color={OG}/>
                <span style={{ fontSize:"0.92rem", fontWeight:700, color:T1 }}>Danh sách bài học</span>
                <span style={{ fontSize:"0.68rem", color:T3, background:CARD, padding:"1px 9px", borderRadius:99, border:`1px solid ${BORDER}` }}>
                  {EPISODES.length} bài
                </span>
              </div>
              {/* Search */}
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 12px", borderRadius:9, background:CARD, border:`1px solid ${BORDER}` }}>
                <Search size={13} color={T3}/>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Tìm bài học..."
                  style={{ background:"none", border:"none", outline:"none", fontSize:"0.76rem", color:T1, width:140 }}
                />
              </div>
            </div>

            {/* Episode rows */}
            <div style={{ display:"flex", flexDirection:"column", gap:6, padding:"4px 28px 40px" }}>
              {filteredEps.map((ep, i) => {
                const isActive = ep.id === activeEp;
                const tagColor = ep.tag === "Thực hành" ? "#EA580C" : ep.tag === "Mô phỏng" ? "#F97316" : OG;
                return (
                  <motion.div
                    key={ep.id}
                    initial={{ opacity:0, x:-12 }}
                    animate={{ opacity:1, x:0 }}
                    transition={{ delay: i * 0.04, duration:0.28 }}
                    onClick={() => {
                      setActiveEp(ep.id);
                      setHubPlaying(true);
                    }}
                    whileHover={{ x: 3 }}
                    style={{
                      display:"flex", alignItems:"center", gap:14,
                      padding:"12px 14px", borderRadius:11, cursor:"pointer",
                      background: isActive ? `linear-gradient(135deg, rgba(255,107,0,0.14), rgba(255,107,0,0.07))` : CARD,
                      border: isActive ? `1.5px solid rgba(255,107,0,0.35)` : `1px solid ${BORDER}`,
                      transition:"border-color 0.15s, background 0.15s",
                      boxShadow: isActive ? "0 4px 20px rgba(255,107,0,0.12)" : "none",
                    }}
                  >
                    {/* Status icon */}
                    <div style={{
                      width:34, height:34, borderRadius:9, flexShrink:0,
                      background: ep.done
                        ? "rgba(16,185,129,0.18)"
                        : isActive
                        ? `rgba(255,107,0,0.20)`
                        : CARD2,
                      border: ep.done
                        ? "1.5px solid rgba(16,185,129,0.32)"
                        : isActive
                        ? `1.5px solid rgba(255,107,0,0.40)`
                        : `1px solid ${BORDER}`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                    }}>
                      {ep.done
                        ? <Check size={15} color={GR} strokeWidth={3}/>
                        : isActive
                        ? <Play size={13} color={OG} fill={OG}/>
                        : <span style={{ fontSize:"0.68rem", fontWeight:700, color:T3 }}>{String(ep.id).padStart(2,"0")}</span>
                      }
                    </div>

                    {/* Info */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:3 }}>
                        <p style={{
                          fontSize:"0.82rem", fontWeight: isActive ? 700 : 500,
                          color: isActive ? T1 : ep.done ? T2 : T1,
                          lineHeight:1.3, flex:1,
                        }}>{ep.title}</p>
                        <span style={{
                          fontSize:"0.60rem", fontWeight:700, color:tagColor,
                          background:`${tagColor}18`, padding:"1px 7px", borderRadius:4,
                          flexShrink:0,
                        }}>{ep.tag}</span>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <span style={{ fontSize:"0.64rem", color:T3, display:"flex", alignItems:"center", gap:3 }}>
                          <Clock size={10}/> {ep.dur}
                        </span>
                        <span style={{ fontSize:"0.64rem", color:T3 }}>{ep.views} lượt xem</span>
                        {isActive && (
                          <span style={{ fontSize:"0.60rem", fontWeight:700, color:OG, display:"flex", alignItems:"center", gap:4 }}>
                            <div style={{ width:5,height:5,borderRadius:"50%",background:OG,animation:"lh-pulse 1.5s infinite" }}/>
                            {hubPlaying ? "Đang phát" : "Tạm dừng"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Lock / play indicator */}
                    {!ep.done && !isActive && ep.id > 3 && (
                      <Lock size={13} color={T4}/>
                    )}
                    {isActive && (
                      <motion.div
                        animate={{ scale:[1,1.15,1] }}
                        transition={{ duration:1.6, repeat:Infinity }}
                        style={{
                          width:8, height:8, borderRadius:"50%",
                          background:OG, flexShrink:0,
                          boxShadow:`0 0 0 3px rgba(255,107,0,0.25)`,
                        }}
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* ─ RIGHT: Reading Materials ─ */}
          <div style={{ flex:"1 1 45%", padding:"0 28px" }}>

            {/* Pomodoro card */}
            <div style={{ marginTop: 16, marginBottom: 14 }}>
              <PomodoroTimer onModeChange={() => setPanelOpen(false)} />
            </div>

            {/* AI badge — sticky on scroll */}
            <div className="ep-header" style={{
              display:"flex", alignItems:"center", justifyContent:"space-between",
              marginBottom:0, padding:"16px 0 14px",
              background:`linear-gradient(180deg, ${PAGE}F5 0%, ${PAGE}E0 100%)`,
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                <AlignLeft size={16} color={OG}/>
                <span style={{ fontSize:"0.92rem", fontWeight:700, color:T1 }}>Tài liệu đọc</span>
                <div style={{ display:"flex", alignItems:"center", gap:5, padding:"2px 9px", borderRadius:99, background:"rgba(255,107,0,0.14)", border:`1px solid rgba(255,107,0,0.28)` }}>
                  <Sparkles size={10} color={OG}/>
                  <span style={{ fontSize:"0.60rem", fontWeight:700, color:OG_DARK }}>AI tuyển chọn</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setSearch("");
                  setActiveEp(2);
                  setMessages(initialMsgs);
                }}
                style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:8, background:CARD, border:`1px solid ${BORDER}`, cursor:"pointer", fontSize:"0.72rem", color:T2 }}
              >
                <RotateCcw size={11}/> Làm mới
              </button>
            </div>

            {/* AI recommendation banner */}
            <div style={{
              display:"flex", alignItems:"flex-start", gap:10,
              padding:"10px 13px", borderRadius:10, marginBottom:14, marginTop:16,
              background:"rgba(255,107,0,0.10)", border:`1px solid rgba(255,107,0,0.22)`,
            }}>
              <Sparkles size={13} color={OG} style={{ flexShrink:0, marginTop:1 }}/>
              <p style={{ fontSize:"0.73rem", color:OG_DARK, lineHeight:1.55 }}>
                <strong>Được đề xuất theo phiên học của bạn:</strong> Bạn đạt 60% ở bài quiz gần nhất. Các tài liệu này tập trung vào đánh chỉ số từ 0 và độ phức tạp mảng.
              </p>
            </div>

            {/* Article cards */}
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {ARTICLES.map((art, i) => (
                <motion.div
                  key={art.id}
                  initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                  transition={{ delay:i * 0.06, duration:0.28 }}
                  whileHover={{ x:4, backgroundColor: CARD2 }}
                  onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(art.title)}`, "_blank", "noopener,noreferrer")}
                  style={{
                    background:CARD, borderRadius:11, padding:"13px 15px",
                    border:`1px solid ${BORDER}`,
                    display:"flex", alignItems:"center", gap:13,
                    cursor:"pointer", transition:"all 0.15s",
                    boxShadow:"0 1px 4px rgba(0,0,0,0.06)",
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width:40, height:40, borderRadius:10, flexShrink:0,
                    background:"rgba(255,107,0,0.14)", border:`1px solid rgba(255,107,0,0.26)`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:"1.1rem",
                  }}>{art.icon}</div>

                  {/* Content */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:"0.82rem", fontWeight:600, color:T1, lineHeight:1.35, marginBottom:5 }}>
                      {art.title}
                    </p>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:"0.62rem", fontWeight:700, color:OG_DARK, background:"rgba(255,107,0,0.12)", padding:"1px 7px", borderRadius:4 }}>{art.source}</span>
                      <span style={{ fontSize:"0.62rem", color:T3, display:"flex", alignItems:"center", gap:3 }}>
                        <Clock size={9}/> {art.readTime}
                      </span>
                      <span style={{ fontSize:"0.60rem", fontWeight:600, color:T3, background:CARD2, padding:"1px 7px", borderRadius:4, border:`1px solid ${BORDER}` }}>
                        {art.tag}
                      </span>
                    </div>
                  </div>
                  <ExternalLink size={13} color={T4}/>
                </motion.div>
              ))}
            </div>

            {/* Podcast teaser */}
            <div style={{
              marginTop:20, padding:"14px 16px", borderRadius:12,
              background:`linear-gradient(135deg, rgba(255,107,0,0.18), rgba(255,140,58,0.10))`,
              border:`1px solid rgba(255,107,0,0.25)`,
              display:"flex", alignItems:"center", gap:12,
            }}>
              <div style={{
                width:40, height:40, borderRadius:10, flexShrink:0,
                background:`linear-gradient(135deg, ${OG}, ${OG2})`,
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:"0 4px 14px rgba(255,107,0,0.35)",
              }}>
                <Headphones size={18} color="#fff"/>
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:"0.78rem", fontWeight:700, color:T1, marginBottom:3 }}>Podcast Khoa học máy tính · Cấu trúc dữ liệu</p>
                <p style={{ fontSize:"0.68rem", color:T2 }}>Tập 12 — "Vì sao mảng bắt đầu từ 0" · 23 phút</p>
              </div>
              <motion.button
                whileHover={{ scale:1.06 }} whileTap={{ scale:0.94 }}
                onClick={() => setPodcastPlaying(v => !v)}
                style={{
                  width:34, height:34, borderRadius:"50%", border:"none", flexShrink:0,
                  background:`linear-gradient(135deg, ${OG}, ${OG2})`,
                  display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer",
                  boxShadow:"0 4px 12px rgba(255,107,0,0.40)",
                }}
              >
                {podcastPlaying
                  ? <Pause size={13} color="#fff"/>
                  : <Play size={13} color="#fff" fill="#fff"/>
                }
              </motion.button>
            </div>

            {/* YouTube cards */}
            <div style={{ marginTop:20 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                <Youtube size={15} color="#FF0000"/>
                <span style={{ fontSize:"0.85rem", fontWeight:700, color:T1 }}>Video gợi ý</span>
                <button
                  onClick={() => window.open("https://www.youtube.com/results?search_query=data+structures+course", "_blank", "noopener,noreferrer")}
                  style={{ fontSize:"0.65rem", color:OG_DARK, fontWeight:600, marginLeft:"auto", cursor:"pointer", border:"none", background:"transparent" }}
                >
                  Xem tất cả →
                </button>
              </div>
              <div style={{ display:"flex", gap:10, overflowX:"auto", paddingBottom:4 }}>
                {[
                  { title:"Giải thích tìm kiếm nhị phân", ch:"NeetCode",    dur:"24:18", color:"#F97316" },
                  { title:"Mẫu bài tập mảng trong 10 phút", ch:"Fireship", dur:"10:05", color:"#FB923C" },
                  { title:"Hướng dẫn trực quan Big-O", ch:"CS Dojo",    dur:"18:42", color:"#EA580C" },
                ].map(v => (
                  <motion.div
                    key={v.title}
                    whileHover={{ y:-4 }}
                    onClick={() => {
                      setActivePick(v.title);
                      navigate("/app/learning/course", {
                        state: {
                          title: v.title,
                          channel: v.ch,
                          duration: v.dur,
                          subject: learningSubject,
                        },
                      });
                    }}
                    style={{
                      width:170, flexShrink:0, borderRadius:10, overflow:"hidden",
                      background:CARD,
                      border: v.title === activePick ? `1.5px solid ${OG}` : `1px solid ${BORDER}`,
                      cursor:"pointer",
                    }}
                  >
                    <div style={{
                      height:90, background:`linear-gradient(135deg, ${v.color}25, ${v.color}45)`,
                      display:"flex", alignItems:"center", justifyContent:"center", position:"relative",
                    }}>
                      <div style={{ width:32,height:32,borderRadius:"50%",background:"rgba(0,0,0,0.40)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                        <Play size={13} color="#fff" fill="#fff"/>
                      </div>
                      <div style={{ position:"absolute",bottom:6,right:6,background:"rgba(0,0,0,0.72)",padding:"1px 6px",borderRadius:3 }}>
                        <span style={{ fontSize:"0.58rem", fontWeight:700, color:"#fff" }}>{v.dur}</span>
                      </div>
                      <div style={{ position:"absolute",top:6,left:6,background:OG,padding:"1px 6px",borderRadius:3,display:"flex",alignItems:"center",gap:3 }}>
                        <Sparkles size={8} color="#fff"/>
                        <span style={{ fontSize:"0.55rem", fontWeight:700, color:"#fff" }}>AI gợi ý</span>
                      </div>
                    </div>
                    <div style={{ padding:"9px 10px" }}>
                      <p style={{ fontSize:"0.73rem", fontWeight:600, color:T1, lineHeight:1.35, marginBottom:3 }}>{v.title}</p>
                      <p style={{ fontSize:"0.62rem", color:T3 }}>{v.ch}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Bottom spacer */}
        <div style={{ height:40 }} />
      </div>

      {/* ════════════════════════════════════════════
          LAYER 1 — MICRO-QUIZ GATEKEEPER MODAL
          Centered overlay, prominent
      ════════════════════════════════════════════ */}
      <AnimatePresence>
        {quizOpen && (
          /* ── Backdrop doubles as flex centering wrapper ── */
          <motion.div
            key="quiz-backdrop"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            transition={{ duration:0.28 }}
            onClick={() => setQuizOpen(false)}
            style={{
              position:"fixed", inset:0, zIndex:50,
              background:"rgba(5,9,18,0.82)",
              backdropFilter:"blur(6px)",
              display:"flex", alignItems:"center", justifyContent:"center",
              padding:"24px",
            }}
          >
            {/* Modal — stops click propagation to backdrop */}
            <motion.div
              key="quiz-modal"
              initial={{ opacity:0, scale:0.90, y:28 }}
              animate={{ opacity:1, scale:1, y:0 }}
              exit={{ opacity:0, scale:0.92, y:16 }}
              transition={{ duration:0.44, ease:[0.22,1,0.36,1] }}
              onClick={e => e.stopPropagation()}
              style={{
                width:"min(540px, 100%)",
                borderRadius:20,
                overflow:"hidden",
                boxShadow:"0 0 0 1px rgba(255,255,255,0.10), 0 32px 80px rgba(0,0,0,0.70), 0 8px 24px rgba(0,0,0,0.50)",
                flexShrink:0,
              }}
            >
              {/* Top accent stripe */}
              <div style={{ height:4, background:`linear-gradient(90deg, ${RD}, #F97316, ${PU})` }}/>

              {/* Modal body */}
              <div style={{
                background: CARD,
                padding:"24px 26px 22px",
              }}>

                {/* Header row */}
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:20 }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:7 }}>
                      {/* Red badge */}
                      <div style={{
                        display:"flex", alignItems:"center", gap:6,
                        background:"rgba(239,68,68,0.18)", border:"1px solid rgba(239,68,68,0.32)",
                        padding:"4px 11px", borderRadius:7,
                      }}>
                        <Pause size={11} color={RD}/>
                        <span style={{ fontSize:"0.68rem", fontWeight:800, color:RD, letterSpacing:"0.04em" }}>KIỂM TRA NHANH · VIDEO TẠM DỪNG</span>
                      </div>
                      <span style={{ fontSize:"0.68rem", color:T3 }}>14:22</span>
                    </div>
                    <p style={{ fontSize:"0.62rem", fontWeight:700, color:T3, letterSpacing:"0.12em", textTransform:"uppercase" }}>
                      Kiểm tra nhanh · Tìm kiếm nhị phân · Học phần 3
                    </p>
                  </div>

                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    {/* Timer ring */}
                    <div style={{ position:"relative", width:44, height:44, flexShrink:0 }}>
                      <svg width={44} height={44} style={{ position:"absolute", inset:0, transform:"rotate(-90deg)" }}>
                        <circle cx={22} cy={22} r={18} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={3}/>
                        <motion.circle
                          cx={22} cy={22} r={18} fill="none"
                          stroke={timerColor} strokeWidth={3}
                          strokeDasharray={`${2*Math.PI*18}`}
                          strokeDashoffset={`${2*Math.PI*18*(1-timerPct/100)}`}
                          strokeLinecap="round"
                          transition={{ duration:0.5 }}
                        />
                      </svg>
                      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <span style={{ fontSize:"0.62rem", fontWeight:800, color:timerColor }}>
                          {Math.floor(quizTimer/60)}:{String(quizTimer%60).padStart(2,"0")}
                        </span>
                      </div>
                    </div>

                    {/* Close */}
                    <button
                      onClick={() => setQuizOpen(false)}
                      style={{ width:30,height:30,borderRadius:8, background:"rgba(255,255,255,0.06)", border:`1px solid ${BORDER2}`, cursor:"pointer", display:"flex",alignItems:"center",justifyContent:"center" }}
                    >
                      <X size={14} color={T2}/>
                    </button>
                  </div>
                </div>

                {/* Question */}
                <div style={{ marginBottom:18 }}>
                  <h3 style={{ fontSize:"1.05rem", fontWeight:700, color:T1, lineHeight:1.5 }}>
                    Độ phức tạp thời gian của tìm kiếm nhị phân trong trường hợp xấu nhất là gì?
                  </h3>
                </div>

                {/* Options */}
                <div style={{ display:"flex", flexDirection:"column", gap:9, marginBottom:20 }}>
                  {QUIZ_OPTS.map(opt => {
                    const isSel     = selected === opt.id;
                    const isCorrect = submitted && opt.id === "b";
                    const isWrong   = submitted && isSel && opt.id !== "b";
                    return (
                      <motion.button
                        key={opt.id}
                        whileHover={!submitted ? { x:3 } : {}}
                        whileTap={!submitted ? { scale:0.99 } : {}}
                        onClick={() => !submitted && setSelected(opt.id)}
                        style={{
                          display:"flex", alignItems:"center", gap:13,
                          padding:"12px 14px", borderRadius:11, textAlign:"left",
                          border: `2px solid ${
                            isCorrect ? GR
                            : isWrong  ? RD
                            : isSel    ? BLUE
                            : BORDER2
                          }`,
                          background: isCorrect ? "rgba(16,185,129,0.12)"
                            : isWrong  ? "rgba(239,68,68,0.10)"
                            : isSel    ? "rgba(37,99,235,0.14)"
                              : CARD,
                          cursor: submitted ? "default" : "pointer",
                          transition:"all 0.15s ease",
                          boxShadow: isSel && !submitted ? `0 0 0 3px rgba(37,99,235,0.14)` : "none",
                        }}
                      >
                        {/* Radio dot */}
                        <div style={{
                          width:20, height:20, borderRadius:"50%", flexShrink:0,
                          border:`2px solid ${isCorrect ? GR : isWrong ? RD : isSel ? BLUE : BORDER2}`,
                          background: isCorrect ? GR : isWrong ? RD : isSel ? BLUE : "transparent",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          transition:"all 0.15s",
                        }}>
                          {(isSel || isCorrect) && <div style={{ width:6,height:6,borderRadius:"50%",background:"#fff" }}/>}
                        </div>
                        <span style={{
                          fontSize:"0.875rem", flex:1,
                          color: isCorrect ? GR : isWrong ? RD : isSel ? BLUE2 : T2,
                          fontWeight: isSel ? 600 : 400,
                          transition:"color 0.15s",
                        }}>
                          {opt.text}
                        </span>
                        {isCorrect && <CheckCircle2 size={16} color={GR} style={{ flexShrink:0 }}/>}
                      </motion.button>
                    );
                  })}
                </div>

                {/* CTA */}
                <AnimatePresence mode="wait">
                  {!submitted ? (
                    <motion.button
                      key="submit"
                      whileHover={selected ? { scale:1.02 } : {}}
                      whileTap={selected ? { scale:0.98 } : {}}
                      onClick={() => selected && setSubmitted(true)}
                      style={{
                        width:"100%", padding:"13px", borderRadius:11, border:"none",
                        background: selected
                          ? `linear-gradient(135deg, ${BLUE}, ${PU})`
                          : "rgba(255,255,255,0.06)",
                        color: selected ? "#fff" : T3,
                        fontWeight:700, fontSize:"0.9rem",
                        cursor: selected ? "pointer" : "not-allowed",
                        transition:"all 0.22s ease",
                        boxShadow: selected ? `0 6px 20px rgba(37,99,235,0.45)` : "none",
                        letterSpacing:"-0.01em",
                        position:"relative", overflow:"hidden",
                      }}
                    >
                      {selected && (
                        <motion.div
                          animate={{ x:["-100%","200%"] }}
                          transition={{ duration:2, repeat:Infinity, repeatDelay:0.5 }}
                          style={{ position:"absolute", top:0, bottom:0, left:0, width:"40%", background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)", pointerEvents:"none" }}
                        />
                      )}
                      {selected ? "Gửi đáp án →" : "Chọn đáp án để tiếp tục"}
                    </motion.button>
                  ) : (
                    <motion.div
                      key="result"
                      initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                      style={{
                        padding:"13px 15px", borderRadius:11,
                        background:"rgba(16,185,129,0.14)",
                        border:"1.5px solid rgba(16,185,129,0.30)",
                        display:"flex", alignItems:"flex-start", gap:11,
                      }}
                    >
                      <CheckCircle2 size={18} color={GR} style={{ flexShrink:0, marginTop:1 }}/>
                      <div>
                        <p style={{ fontWeight:700, fontSize:"0.88rem", color:T1 }}>Chính xác! 🎉 +25 XP</p>
                        <p style={{ fontSize:"0.76rem", color:T2, marginTop:4, lineHeight:1.55 }}>
                          Tìm kiếm nhị phân chia đôi không gian tìm kiếm sau mỗi bước → <strong style={{ color:GR }}>O(log n)</strong>. Video sẽ tiếp tục phát.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Resume / close actions */}
                {submitted && (
                  <motion.div
                    initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.35 }}
                    style={{ display:"flex", gap:8, marginTop:10 }}
                  >
                    <button
                      onClick={() => setQuizOpen(false)}
                      style={{
                        flex:1, padding:"10px", borderRadius:10,
                        border:`1px solid ${BORDER2}`, background:"rgba(255,255,255,0.06)",
                        color:T2, fontWeight:600, fontSize:"0.84rem", cursor:"pointer",
                        display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                      }}
                    >
                      <Star size={13}/> Tiếp tục video
                    </button>
                    <button
                      onClick={() => { setQuizOpen(false); setPanelOpen(true); }}
                      style={{
                        flex:1, padding:"10px", borderRadius:10,
                        border:"none", background:`linear-gradient(135deg, ${BLUE}, ${PU})`,
                        color:"#fff", fontWeight:700, fontSize:"0.84rem", cursor:"pointer",
                        display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                        boxShadow:"0 4px 14px rgba(37,99,235,0.38)",
                      }}
                    >
                      <Brain size={13}/> Hỏi Trợ lý AI
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════
          LAYER 2 — AI TUTOR FLOATING SLIDE-OVER
          Far right, dark navy panel
      ════════════════════════════════════════════ */}
      <AnimatePresence>
        {panelOpen && (
          <>
            {/* soft vignette on content side */}
            <motion.div
              key="tutor-vignette"
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              transition={{ duration:0.28 }}
              style={{
                position:"fixed", top:52, right:PANEL_W, width:60, bottom:0, zIndex:15,
                background:`linear-gradient(270deg, rgba(8,16,30,0.45) 0%, transparent 100%)`,
                pointerEvents:"none",
              }}
            />

            <motion.div
              key="tutor-panel"
              initial={{ x: PANEL_W + 20, opacity:0 }}
              animate={{ x:0, opacity:1 }}
              exit={{ x: PANEL_W + 20, opacity:0 }}
              transition={{ duration:0.46, ease:[0.22,1,0.36,1] }}
              style={{
                position:"fixed", top:52, right:0, bottom:0,
                width: PANEL_W, zIndex:20,
                background: NAVY,
                borderLeft:`1px solid ${PBORDER}`,
                display:"flex", flexDirection:"column",
                boxShadow:`-20px 0 70px rgba(0,0,0,0.65), -2px 0 12px rgba(0,0,0,0.40)`,
              }}
            >
              {/* ─ Panel Header ─ */}
              <div style={{
                padding:"16px 18px 13px",
                borderBottom:`1px solid ${PBORDER}`,
                flexShrink:0,
                background:`linear-gradient(180deg, rgba(255,107,0,0.16) 0%, transparent 100%)`,
              }}>
                {/* Top row */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:11 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:11 }}>
                    {/* Avatar */}
                    <div style={{
                      width:42, height:42, borderRadius:12, flexShrink:0,
                      background:`linear-gradient(135deg, ${OG}, ${OG2})`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      boxShadow:`0 4px 16px rgba(255,107,0,0.45)`,
                      position:"relative",
                    }}>
                      <Brain size={19} color="#fff"/>
                      <div style={{
                        position:"absolute", bottom:1, right:1,
                        width:10, height:10, borderRadius:"50%",
                        background:GR, border:`2.5px solid ${NAVY}`,
                      }}/>
                    </div>
                    <div>
                      <p style={{ fontWeight:800, fontSize:"0.92rem", color:PT1, lineHeight:1 }}>Trợ lý AI</p>
                      <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:4 }}>
                        <div style={{ width:6,height:6,borderRadius:"50%",background:GR,animation:"lh-pulse 2s infinite" }}/>
                        <span style={{ fontSize:"0.61rem", color:PT2 }}>Theo ngữ cảnh · Đang phân tích phiên học</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setPanelOpen(false)}
                    style={{ width:30,height:30,borderRadius:8, background:"rgba(148,163,184,0.10)", border:`1px solid ${PBORDER}`, cursor:"pointer", display:"flex",alignItems:"center",justifyContent:"center" }}
                  >
                    <ChevronRight size={15} color={PT2}/>
                  </button>
                </div>

                {/* Context pill */}
                <div style={{
                  display:"flex", alignItems:"center", gap:7,
                  padding:"7px 12px", borderRadius:8,
                  background:"rgba(255,107,0,0.14)", border:"1px solid rgba(255,107,0,0.30)",
                }}>
                  <Sparkles size={11} color={OG}/>
                  <span style={{ fontSize:"0.67rem", color:"#FED7AA", fontWeight:600 }}>
                    Đang nhận diện: {roadmapContext?.title ? `${roadmapContext.title} · ${pageModule}` : "Mảng & Đánh chỉ số · Bài 2 · 14:22"}
                  </span>
                </div>
              </div>

              {/* ─ Messages ─ */}
              <div style={{ flex:1, overflowY:"auto", padding:"14px 14px 8px", display:"flex", flexDirection:"column", gap:10 }}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={i >= INIT_MSGS.length ? { opacity:0, y:8 } : { opacity:1 }}
                    animate={{ opacity:1, y:0 }}
                    transition={{ duration:0.22 }}
                    style={{ display:"flex", flexDirection: msg.role === "user" ? "row-reverse" : "row", alignItems:"flex-end", gap:8 }}
                  >
                    {msg.role === "ai" && (
                      <div style={{
                        width:26, height:26, borderRadius:"50%", flexShrink:0,
                        background:`linear-gradient(135deg, ${OG}, ${OG2})`,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        boxShadow:`0 2px 8px rgba(255,107,0,0.36)`,
                      }}>
                        <Brain size={12} color="#fff"/>
                      </div>
                    )}
                    <div style={{
                      maxWidth:"79%", padding:"10px 13px",
                      borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "4px 14px 14px 14px",
                      background: msg.role === "user"
                        ? `linear-gradient(135deg, ${OG}, ${OG_DARK})`
                        : PSURFACE,
                      border: msg.role === "ai" ? `1px solid ${PBORDER}` : "none",
                      boxShadow: msg.role === "ai"
                        ? "0 2px 10px rgba(0,0,0,0.25)"
                        : "0 2px 12px rgba(37,99,235,0.28)",
                    }}>
                      <p className="eco-pre" style={{ fontSize:"0.80rem", lineHeight:1.65, color: msg.role === "user" ? "#EFF6FF" : PT1, margin:0 }}>
                        {msg.text}
                      </p>
                      <p style={{ fontSize:"0.58rem", marginTop:5, color: msg.role === "user" ? "rgba(147,197,253,0.55)" : PT3, textAlign: msg.role === "user" ? "right" : "left" }}>
                        {msg.time}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {/* Typing indicator */}
                {typing && (
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:26,height:26,borderRadius:"50%", background:`linear-gradient(135deg,${OG},${OG2})`, display:"flex",alignItems:"center",justifyContent:"center", flexShrink:0 }}>
                      <Brain size={12} color="#fff"/>
                    </div>
                    <div style={{ padding:"10px 14px", borderRadius:"4px 14px 14px 14px", background:PSURFACE, border:`1px solid ${PBORDER}` }}>
                      <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                        {[0,1,2].map(j => (
                          <div key={j} style={{ width:6, height:6, borderRadius:"50%", background:OG2, animation:`lh-bounce 1s ease infinite ${j*0.18}s` }}/>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef}/>
              </div>

              {/* ─ Quick chips ─ */}
              <div style={{ padding:"8px 13px 9px", borderTop:`1px solid ${PBORDER}`, flexShrink:0 }}>
                <p style={{ fontSize:"0.58rem", fontWeight:700, color:PT4, letterSpacing:"0.10em", textTransform:"uppercase", marginBottom:7 }}>Thao tác nhanh</p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                  {CHIPS.map(chip => (
                    <motion.button
                      key={chip}
                      onClick={() => sendMsg(chip)}
                      whileHover={{ y:-1 }}
                      whileTap={{ scale:0.98 }}
                      style={{
                        padding:"5px 10px", borderRadius:7,
                        border:`1px solid ${PBORDER}`,
                        background:P_ORANGE_SURFACE,
                        fontSize:"0.67rem", fontWeight:500, color:PT2,
                        cursor:"pointer", transition:"all 0.12s", whiteSpace:"nowrap",
                      }}
                    >{chip}</motion.button>
                  ))}
                </div>
              </div>

              {/* ─ Input area ─ */}
              <div style={{ padding:"10px 13px 16px", borderTop:`1px solid ${PBORDER}`, flexShrink:0 }}>
                <div style={{ display:"flex", gap:8 }}>
                  <input
                    value={msgInput}
                    onChange={e => setMsgInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendMsg(msgInput)}
                    placeholder="Hỏi Trợ lý AI bất cứ điều gì..."
                    style={{
                      flex:1, padding:"11px 14px", borderRadius:10,
                      border:`1.5px solid ${PBORDER}`,
                      background:"#0B1423",
                      fontSize:"0.82rem", color:PT1,
                      outline:"none", transition:"border-color 0.15s, box-shadow 0.15s",
                      boxSizing:"border-box",
                    }}
                    onFocus={e => { e.target.style.borderColor=OG; e.target.style.boxShadow="0 0 0 3px rgba(255,107,0,0.18)"; }}
                    onBlur={e  => { e.target.style.borderColor=PBORDER; e.target.style.boxShadow="none"; }}
                  />
                  <motion.button
                    whileHover={{ scale:1.07 }} whileTap={{ scale:0.93 }}
                    onClick={() => sendMsg(msgInput)}
                    style={{
                      width:42, height:42, borderRadius:10, border:"none", flexShrink:0,
                      background:`linear-gradient(135deg, ${OG}, ${OG2})`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      cursor:"pointer", boxShadow:`0 4px 14px rgba(255,107,0,0.44)`,
                    }}
                  >
                    <Send size={16} color="#fff"/>
                  </motion.button>
                </div>
                <p style={{ fontSize:"0.62rem", color:PT4, marginTop:8, textAlign:"center" }}>
                  AI đọc lịch sử quiz và ngữ cảnh bài học theo thời gian thực
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* FAB — reopen AI panel */}
      <AnimatePresence>
        {!panelOpen && (
          <motion.button
            key="fab"
            initial={{ opacity:0, scale:0.75, x:16 }}
            animate={{ opacity:1, scale:1, x:0 }}
            exit={{ opacity:0, scale:0.75, x:16 }}
            transition={{ duration:0.28, ease:[0.22,1,0.36,1] }}
            onClick={() => setPanelOpen(true)}
            style={{
              position:"fixed", bottom:28, right:28, zIndex:30,
              display:"flex", alignItems:"center", gap:9,
              padding:"12px 20px", borderRadius:99, border:"none",
              background:`linear-gradient(135deg, ${OG}, ${OG2})`,
              cursor:"pointer", color:"#fff",
              fontWeight:700, fontSize:"0.82rem",
              boxShadow:`0 8px 28px rgba(255,107,0,0.48), 0 2px 8px rgba(255,107,0,0.30)`,
            }}
          >
            <Brain size={16}/> Hỏi Trợ lý AI
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

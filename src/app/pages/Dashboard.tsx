import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router";
import {
  Plus, Check, Play, Pause, RotateCcw, ArrowRight,
  Map, BarChart2, Calendar, CheckSquare, Sparkles, MessageSquare,
} from "lucide-react";

/* ─── Tokens ─── */
const F    = "'Inter','Plus Jakarta Sans',sans-serif";
const BG   = "#F9FAFB";
const CARD = "#FFFFFF";
const T1   = "#111827";
const T2   = "#6B7280";
const T3   = "#9CA3AF";
const OG   = "#F37021";
const BDR  = "#E5E7EB";
const SH   = "0 1px 3px rgba(15,23,42,0.05), 0 10px 28px rgba(15,23,42,0.06)";

const SHOWCASE_MODULES = [
  {
    title: "Lộ trình AI",
    desc: "Lộ trình kỹ năng theo phase, có gate assessment và tiến độ trực quan.",
    to: "/app/roadmap",
    icon: Map,
    tier: "Miễn phí",
  },
  {
    title: "Ma trận công việc",
    desc: "Ma trận ưu tiên công việc + AI auto-sort cho luồng học tập hàng ngày.",
    to: "/app/matrix",
    icon: CheckSquare,
    tier: "Cao cấp",
  },
  {
    title: "Lịch học",
    desc: "Lịch học theo tuần để sắp xếp sprint, deadline và lịch ôn tập.",
    to: "/app/calendar",
    icon: Calendar,
    tier: "Miễn phí",
  },
  {
    title: "Phân tích học tập",
    desc: "Theo dõi điểm sẵn sàng, lượt quiz, độ ổn định và tiến độ kỹ năng.",
    to: "/app/workspaces",
    icon: BarChart2,
    tier: "Xây nền tảng",
  },
  {
    title: "Trung tâm học tập",
    desc: "Workspace học tập tập trung: lesson flow, tài liệu và gợi ý AI.",
    to: "/app/learning",
    icon: Sparkles,
    tier: "Xây nền tảng",
  },
];

const TIER_STYLE: Record<string, { bg: string; border: string; text: string }> = {
  "Miễn phí": {
    bg: "#EFF6FF",
    border: "#BFDBFE",
    text: "#1D4ED8",
  },
  "Xây nền tảng": {
    bg: "#EFF6FF",
    border: "#BFDBFE",
    text: "#1D4ED8",
  },
  "Cao cấp": {
    bg: "#FFF3EB",
    border: "#FBD5BE",
    text: "#9A3412",
  },
};

/* ─── Task item ─── */
const TAG_COLORS: Record<string,[string,string]> = {
  "Học tập":    ["#FFF3EB", "#9A3412"],
  "Ôn tập":     ["#EFF6FF", "#1E40AF"],
  "Sự nghiệp":  ["#FFF3EB", "#9A3412"],
  "Lập trình":  ["#FFF3EB", "#9A3412"],
};
interface Task { id:number; text:string; done:boolean; tag:string; }
const INIT_TASKS: Task[] = [
  { id:1, text:"Hoàn thành module React Hooks", done:false, tag:"Học tập"   },
  { id:2, text:"Ôn lại ghi chú System Design",   done:false, tag:"Ôn tập"    },
  { id:3, text:"Cập nhật CV với kỹ năng mới",    done:false, tag:"Sự nghiệp" },
  { id:4, text:"Xem 2 video kỹ năng mềm", done:false, tag:"Sự nghiệp" },
  { id:5, text:"Đẩy repo luyện TypeScript",      done:false, tag:"Lập trình" },
];

/* ─── Pomodoro ─── */
type PMode = "focus"|"short"|"long";
const PMODE: Record<PMode,{ label:string; dur:number; color:string }> = {
  focus: { label:"Tập trung",       dur:25*60, color:OG        },
  short: { label:"Nghỉ ngắn", dur: 5*60, color:"#EA580C" },
  long:  { label:"Nghỉ dài",  dur:15*60, color:"#15803D" },
};

/* ═══════════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════════ */
export default function Dashboard() {
  /* Tasks */
  const [tasks, setTasks]       = useState<Task[]>(INIT_TASKS);
  const [newTask, setNewTask]   = useState("");
  const [addingTask, setAddingTask] = useState(false);
  const toggleTask = (id:number) => setTasks(p=>p.map(t=>t.id===id?{...t,done:!t.done}:t));
  const addTask = () => {
    if(!newTask.trim()) return;
    setTasks(p=>[...p,{id:Date.now(),text:newTask.trim(),done:false,tag:"Lập trình"}]);
    setNewTask(""); setAddingTask(false);
  };

  /* Pomodoro */
  const [pMode,  setPMode]   = useState<PMode>("focus");
  const [timeLeft,setTimeLeft]= useState(PMODE.focus.dur);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const mm = String(Math.floor(timeLeft/60)).padStart(2,"0");
  const ss = String(timeLeft%60).padStart(2,"0");

  useEffect(()=>{
    if(running){
      timerRef.current = setInterval(()=>{
        setTimeLeft(t=>{
          if(t<=1){ setRunning(false); return 0; }
          return t-1;
        });
      },1000);
    } else clearInterval(timerRef.current);
    return ()=>clearInterval(timerRef.current);
  },[running]);
  const switchMode=(m:PMode)=>{ setPMode(m); setRunning(false); setTimeLeft(PMODE[m].dur); };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.28}} style={{fontFamily:F}}>
      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))",
        gap:"12px",
        marginBottom:"12px",
      }}>
        {SHOWCASE_MODULES.map((m, i) => (
          <motion.div
            key={m.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Link to={m.to} style={{ textDecoration:"none" }}>
              <div style={{
                background:CARD,
                borderRadius:"14px",
                border:`1px solid ${BDR}`,
                boxShadow:SH,
                padding:"15px",
                height:"100%",
                transition:"transform .14s ease",
              }}>
                <div style={{
                  width:"30px", height:"30px", borderRadius:"9px", marginBottom:"10px",
                  background:"#FFF3EB", border:"1px solid #FBD5BE",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  <m.icon size={15} color="#B45309" />
                </div>
                <span
                  style={{
                    display: "inline-flex",
                    marginBottom: "8px",
                    padding: "2px 8px",
                    borderRadius: "999px",
                    fontSize: "0.64rem",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    background: TIER_STYLE[m.tier].bg,
                    border: `1px solid ${TIER_STYLE[m.tier].border}`,
                    color: TIER_STYLE[m.tier].text,
                  }}
                >
                  {m.tier}
                </span>
                <h3 style={{ fontSize:"0.9rem", fontWeight:700, color:T1, marginBottom:"5px" }}>{m.title}</h3>
                <p style={{ fontSize:"0.76rem", color:T2, lineHeight:1.55 }}>{m.desc}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:"12px", marginBottom:"12px" }}>
        <div style={{ background:CARD, borderRadius:"14px", border:`1px solid ${BDR}`, boxShadow:SH, padding:"18px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" }}>
            <div>
              <h1 style={{ fontWeight:800, fontSize:"1.2rem", color:T1, letterSpacing:"-0.02em", marginBottom:"2px" }}>Ưu tiên hôm nay</h1>
              <p style={{ color:T2, fontSize:"0.8rem" }}>Đánh dấu hoàn thành các tác vụ quan trọng trước.</p>
            </div>
            <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }} onClick={()=>setAddingTask(true)} title="Thêm một tác vụ mới" style={{
              display:"flex", alignItems:"center", gap:"5px", padding:"7px 12px", borderRadius:"9px", border:"1px solid #F7B489",
              background:"#FFF3EB", color:"#9A3412", fontWeight:700, fontSize:"0.75rem", cursor:"pointer",
            }}>
              <Plus size={13}/> Thêm
            </motion.button>
          </div>
          <AnimatePresence>
            {addingTask && (
              <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} style={{ overflow:"hidden", marginBottom:"10px" }}>
                <div style={{ display:"flex", gap:"6px" }}>
                  <input value={newTask} onChange={e=>setNewTask(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addTask();if(e.key==="Escape")setAddingTask(false);}} placeholder="Thêm tác vụ mới..." autoFocus style={{
                    flex:1, padding:"8px 12px", borderRadius:"9px", border:`1.5px solid ${BDR}`, outline:"none", fontFamily:F, fontSize:"0.82rem",
                  }}/>
                  <button onClick={addTask} style={{ padding:"8px 14px", borderRadius:"9px", border:"1px solid #F7B489", background:"#FFF3EB", color:"#9A3412", cursor:"pointer", fontWeight:700 }}>Lưu</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
            {tasks.map(task => {
              const [tagBg,tagColor] = TAG_COLORS[task.tag] ?? ["#F3F4F6","#6B7280"];
              return (
                <div key={task.id} style={{
                  border:`1px solid ${BDR}`, borderRadius:"10px", background:"#fff", padding:"9px 10px",
                  display:"flex", alignItems:"center", gap:"9px",
                }}>
                  <button onClick={()=>toggleTask(task.id)} style={{
                    width:"18px", height:"18px", borderRadius:"50%", border:`1.5px solid ${task.done?"#10B981":BDR}`,
                    background:task.done?"#10B981":"transparent", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer",
                  }}>{task.done && <Check size={10} color="#fff" strokeWidth={3}/>}</button>
                  <span style={{ flex:1, fontSize:"0.84rem", color:task.done?T3:T1, textDecoration:task.done?"line-through":"none" }}>{task.text}</span>
                  <span style={{ fontSize:"0.64rem", padding:"2px 8px", borderRadius:"99px", background:tagBg, color:tagColor, fontWeight:700 }}>{task.tag}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
          <div style={{ background:CARD, borderRadius:"14px", border:`1px solid ${BDR}`, boxShadow:SH, padding:"16px" }}>
            <p style={{ fontSize:"0.66rem", fontWeight:700, color:T3, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:"6px" }}>Lộ trình học</p>
            <h3 style={{ fontSize:"0.96rem", fontWeight:700, color:T1, marginBottom:"4px" }}>React Hooks</h3>
            <p style={{ fontSize:"0.76rem", color:T2, lineHeight:1.5, marginBottom:"10px" }}>Tiếp tục bài học kế tiếp trong lộ trình.</p>
            <Link to="/app/roadmap" style={{ textDecoration:"none" }} title="Mở lộ trình và tiếp tục bài học">
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"7px", padding:"9px", borderRadius:"9px", border:"1px solid #F7B489", background:"#FFF3EB", color:"#9A3412", fontWeight:700, fontSize:"0.78rem" }}>
                Mở lộ trình <ArrowRight size={14}/>
              </div>
            </Link>
          </div>

          <div style={{ background:CARD, borderRadius:"14px", border:`1px solid ${BDR}`, boxShadow:SH, padding:"16px" }}>
            <p style={{ fontSize:"0.62rem", color:T3, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:"4px" }}>
            Bộ đếm tập trung
          </p>
          <p style={{ fontWeight:700, fontSize:"0.9rem", color:T1, marginBottom:"12px", fontFamily:F }}>
            {running ? "Đang tập trung" : "Sẵn sàng"}
          </p>

          {/* Mode tabs */}
          <div style={{ display:"flex", background:"#F3F4F6", borderRadius:"8px", padding:"3px", marginBottom:"14px" }}>
            {(Object.keys(PMODE) as PMode[]).map(m=>(
              <button key={m} onClick={()=>switchMode(m)} style={{
                flex:1, padding:"5px 0", borderRadius:"6px",
                background:pMode===m?CARD:"transparent",
                border:"none", cursor:"pointer",
                fontSize:"0.7rem", fontFamily:F,
                color:pMode===m?PMODE[m].color:T3,
                fontWeight:pMode===m?700:400,
                boxShadow:pMode===m?SH:"none", transition:"all 0.15s",
              }}>
                {PMODE[m].label}
              </button>
            ))}
          </div>

          {/* Timer display */}
          <p style={{
            fontSize:"2.3rem", fontWeight:800, letterSpacing:"-0.05em",
            color:T1, textAlign:"center", lineHeight:1,
            marginBottom:"12px", fontVariantNumeric:"tabular-nums",
          }}>
            {mm}:{ss}
          </p>

          {/* Controls */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"10px", marginBottom:"10px" }}>
            <button onClick={()=>{setRunning(false);setTimeLeft(PMODE[pMode].dur);}}
              style={{ width:"34px", height:"34px", borderRadius:"9px", border:`1px solid ${BDR}`, background:"transparent", cursor:"pointer", color:T3, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <RotateCcw size={14}/>
            </button>
            <motion.button
              whileHover={{ scale:1.06 }} whileTap={{ scale:0.94 }}
              onClick={()=>setRunning(v=>!v)}
              style={{
                width:"44px", height:"44px", borderRadius:"50%",
                background:"#FFF3EB",
                border:"1px solid #F7B489",
                color:"#9A3412",
                display:"flex", alignItems:"center", justifyContent:"center",
                cursor:"pointer",
                boxShadow:"none",
              }}
            >
              {running ? <Pause size={18} fill="#9A3412"/> : <Play size={18} fill="#9A3412"/>}
            </motion.button>
          </div>

          <p style={{ fontSize:"0.72rem", color:T2, textAlign:"center" }}>
            Bắt đầu 25 phút tập trung, sau đó nghỉ ngắn.
          </p>
        </div>
      </div>
      </div>
    </motion.div>
  );
}
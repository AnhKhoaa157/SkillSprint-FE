import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router";
import {
  Plus, Check, Play, Pause, RotateCcw, ArrowRight,
  Map, BarChart2, Calendar, CheckSquare, Sparkles,
} from "lucide-react";
import EmptyState from "../../components/ui/EmptyState";

/* ─── Tokens ─── */
const F    = "'Inter','Plus Jakarta Sans',sans-serif";
const OG   = "#FF6B00";

const SHOWCASE_MODULES = [
  {
    title: "Lộ trình AI",
    desc: "Lộ trình kỹ năng theo phase, có gate assessment và tiến độ trực quan.",
    to: "/app/workspaces",
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
    bg: "#E8F5E9",
    border: "#C8E6C9",
    text: "#2E7D32",
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
  "Sự nghiệp":  ["#F3E5F5", "#6A1B9A"],
  "Lập trình":  ["#E0F7FA", "#00838F"],
};
interface Task { id:number; text:string; done:boolean; tag:string; }
const INIT_TASKS: Task[] = [
  { id:1, text:"Hoàn thành module React Hooks", done:false, tag:"Học tập"   },
  { id:2, text:"Ôn lại ghi chú System Design",   done:false, tag:"Ôn tập"    },
  { id:3, text:"Cập nhật CV với kỹ năng mới",    done:false, tag:"Sự nghiệp" },
  { id:4, text:"Xem 2 video kỹ năng mềm",        done:false, tag:"Sự nghiệp" },
  { id:5, text:"Đẩy repo luyện TypeScript",      done:false, tag:"Lập trình" },
];

/* ─── Pomodoro ─── */
type PMode = "focus"|"short"|"long";
const PMODE: Record<PMode,{ label:string; dur:number; color:string }> = {
  focus: { label:"Tập trung",       dur:25*60, color:OG        },
  short: { label:"Nghỉ ngắn",        dur: 5*60, color:"#EF4444" },
  long:  { label:"Nghỉ dài",         dur:15*60, color:"#10B981" },
};

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
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
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
    <div className="relative min-h-screen bg-[#F9FAFB] px-1 py-1 text-slate-900 overflow-hidden" style={{ fontFamily: F }}>
      {/* Ambient background glows */}
      <div className="absolute left-[-10%] top-[-10%] -z-10 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#FF6B00]/5 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute right-[-10%] bottom-[-10%] -z-10 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-[#10B981]/5 to-transparent blur-[150px] pointer-events-none" />

      {/* Header Banner */}
      <div className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-[2rem] border border-orange-100 bg-gradient-to-br from-[#FFF8F5] via-[#FFF1EB] to-[#FFFFFF] p-6 shadow-[0_16px_40px_-12px_rgba(255,107,0,0.08)] sm:flex-row sm:items-center sm:p-8 mb-8">
        <div className="absolute -left-20 -top-20 h-48 w-48 rounded-full bg-[#FF6B00]/5 blur-[80px]" />
        
        <div className="relative space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/10 border border-orange-500/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#FF6B00]">
            <Sparkles className="h-3.5 w-3.5" />
            Control Hub
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Trung tâm điều khiển</h2>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-600 font-medium">
            Tổng quan ngày học của bạn, truy cập nhanh lộ trình AI, quản lý các tác vụ và luyện tập Pomodoro.
          </p>
        </div>
      </div>

      {/* Showcase Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5 mb-8">
        {SHOWCASE_MODULES.map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div
              key={m.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="h-full"
            >
              <Link to={m.to} className="block h-full group">
                <div className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_8px_-3px_rgba(15,23,42,0.05),0_12px_24px_-4px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-[#FF6B00]/30 hover:shadow-[0_20px_40px_-15px_rgba(255,107,0,0.08)] flex flex-col items-start">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 border border-orange-100 text-orange-600 transition-colors duration-300 group-hover:bg-[#FF6B00] group-hover:text-white mb-4">
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  <span
                    className="inline-flex mb-3 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border"
                    style={{
                      backgroundColor: TIER_STYLE[m.tier].bg,
                      borderColor: TIER_STYLE[m.tier].border,
                      color: TIER_STYLE[m.tier].text,
                    }}
                  >
                    {m.tier}
                  </span>
                  
                  <h3 className="text-sm font-bold text-slate-800 group-hover:text-[#FF6B00] transition-colors mb-1.5">{m.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mt-auto">{m.desc}</p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Main Sections */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 mb-8">
        
        {/* Priorities Section */}
        <div className="lg:col-span-2 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_2px_8px_-3px_rgba(15,23,42,0.05),0_12px_24px_-4px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Ưu tiên hôm nay</h3>
              <p className="text-xs text-slate-500 mt-1">Đánh dấu hoàn thành các tác vụ quan trọng trước.</p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setAddingTask(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50/50 px-4 py-2 text-xs font-bold text-[#FF6B00] transition hover:bg-orange-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Thêm tác vụ
            </motion.button>
          </div>

          <AnimatePresence>
            {addingTask && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-4"
              >
                <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-200">
                  <input
                    value={newTask}
                    onChange={e => setNewTask(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") addTask();
                      if (e.key === "Escape") setAddingTask(false);
                    }}
                    placeholder="Thêm tác vụ mới cho hôm nay..."
                    autoFocus
                    className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-slate-400"
                  />
                  <button
                    onClick={addTask}
                    className="rounded-xl bg-[#FF6B00] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#E05E00]"
                  >
                    Lưu
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {tasks.length === 0 && !addingTask && (
            <EmptyState
              variant="plain"
              icon={CheckSquare}
              title="Chưa có tác vụ nào cho hôm nay — lên kế hoạch ngay!"
              description="Thêm các tác vụ ưu tiên để theo dõi tiến độ học tập trong ngày của bạn."
              actionLabel="Thêm tác vụ đầu tiên"
              actionIcon={Plus}
              onAction={() => setAddingTask(true)}
            />
          )}

          <div className="space-y-2.5">
            {tasks.map(task => {
              const [tagBg, tagColor] = TAG_COLORS[task.tag] ?? ["#F3F4F6", "#6B7280"];
              return (
                <div
                  key={task.id}
                  className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/30 p-3.5 transition hover:border-[#FF6B00]/20 hover:bg-white hover:shadow-sm"
                >
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-200"
                    style={{
                      borderColor: task.done ? "#10B981" : "#CBD5E1",
                      backgroundColor: task.done ? "#10B981" : "#FFFFFF",
                    }}
                  >
                    {task.done && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                  </button>
                  
                  <span
                    className="flex-1 text-sm font-semibold transition-all duration-200"
                    style={{
                      color: task.done ? "#94A3B8" : "#334155",
                      textDecoration: task.done ? "line-through" : "none",
                    }}
                  >
                    {task.text}
                  </span>
                  
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                    style={{ backgroundColor: tagBg, color: tagColor }}
                  >
                    {task.tag}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar widgets */}
        <div className="space-y-6">
          
          {/* Quick Learning Path */}
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_2px_8px_-3px_rgba(15,23,42,0.05),0_12px_24px_-4px_rgba(15,23,42,0.04)]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lộ trình học tập</span>
            <h4 className="text-base font-extrabold text-slate-800 mt-1 mb-1">React Hooks</h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">Tiếp tục bài học kế tiếp trong lộ trình thông minh.</p>
            
            <Link to="/app/workspaces" className="block text-center">
              <div className="inline-flex w-full items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-[#FF6B00] to-amber-500 py-3 text-xs font-bold text-white shadow-md shadow-[#FF6B00]/15 transition hover:brightness-105">
                Mở lộ trình học <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          </div>

          {/* Pomodoro Timer widget */}
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_2px_8px_-3px_rgba(15,23,42,0.05),0_12px_24px_-4px_rgba(15,23,42,0.04)] relative overflow-hidden">
            {/* Soft status light indicator in corner */}
            <div
              className="absolute right-5 top-5 h-2.5 w-2.5 rounded-full blur-[2px] transition-colors"
              style={{
                backgroundColor: running ? "#10B981" : "#FF6B00",
                animation: running ? "ss-pulse 2s infinite" : "none",
              }}
            />

            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bộ đếm tập trung</span>
            <h4 className="text-sm font-extrabold text-slate-800 mt-1 mb-4">
              {running ? "Đang đếm ngược..." : "Đang chờ bắt đầu"}
            </h4>

            {/* Switch tabs */}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-5">
              {(Object.keys(PMODE) as PMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className="flex-1 text-[10px] font-bold py-1.5 rounded-lg transition-all duration-200"
                  style={{
                    backgroundColor: pMode === m ? "#FFFFFF" : "transparent",
                    color: pMode === m ? PMODE[m].color : "#64748B",
                    boxShadow: pMode === m ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  {PMODE[m].label}
                </button>
              ))}
            </div>

            {/* Large clock */}
            <div className="flex justify-center mb-5">
              <div className="font-mono text-5xl font-black tracking-tight text-slate-800 select-none tabular-nums drop-shadow-sm">
                {mm}:{ss}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setRunning(false);
                  setTimeLeft(PMODE[pMode].dur);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300"
                title="Đặt lại"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setRunning(v => !v)}
                className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition"
                style={{
                  backgroundColor: running ? "#E05E00" : "#FF6B00",
                  boxShadow: `0 4px 12px ${running ? "rgba(224,94,0,0.25)" : "rgba(255,107,0,0.25)"}`,
                }}
              >
                {running ? <Pause className="h-5 w-5 fill-white text-white" /> : <Play className="h-5 w-5 fill-white text-white" />}
              </motion.button>
            </div>
            
            <p className="text-[10px] text-slate-400 text-center mt-4">Bắt đầu chu kỳ tập trung 25 phút để tối ưu học tập.</p>
          </div>

        </div>

      </div>

    </div>
  );
}
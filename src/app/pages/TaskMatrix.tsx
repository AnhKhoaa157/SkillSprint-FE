import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Plus, CheckCircle2, Circle, Sparkles, Crown, Flame, Heart, Stars } from "lucide-react";
import { PricingModal } from "../components/PricingModal";

type Task = {
  id: number;
  text: string;
  completed: boolean;
};

export default function TaskMatrix() {
  const [planTier, setPlanTier] = useState<"free" | "builder" | "premium">(() => {
    const raw = window.localStorage.getItem("ss_plan_tier");
    if (raw === "premium" || raw === "builder") return raw;
    return "free";
  });
  const isPremiumUser = planTier === "premium";
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("ss_theme") === "dark";
  });
  const [pricingOpen, setPricingOpen] = useState(false);
  const [autoSorted, setAutoSorted] = useState(false);

  const [tasks, setTasks] = useState<{ [key: string]: Task[] }>({
    doFirst: [
      { id: 1, text: "Hoàn thành bài tập Cấu trúc dữ liệu", completed: false },
      { id: 2, text: "Ôn thi giữa kỳ", completed: false },
    ],
    schedule: [
      { id: 3, text: "Đọc chương 4 về Cây", completed: false },
      { id: 4, text: "Cập nhật CV", completed: false },
    ],
    delegate: [
      { id: 5, text: "Đọc thêm tài liệu tham khảo", completed: false },
      { id: 6, text: "Sắp xếp thư mục học tập", completed: false },
    ],
    eliminate: [
      { id: 7, text: "Lướt mạng xã hội không kiểm soát", completed: false },
    ]
  });

  const [newTasks, setNewTasks] = useState<{ [key: string]: string }>({
    doFirst: "", schedule: "", delegate: "", eliminate: ""
  });

  const handleAddTask = (quadrant: string) => {
    if (!newTasks[quadrant].trim()) return;
    const newTask = { id: Date.now(), text: newTasks[quadrant], completed: false };
    setTasks(prev => ({
      ...prev,
      [quadrant]: [...prev[quadrant], newTask]
    }));
    setNewTasks(prev => ({ ...prev, [quadrant]: "" }));
  };

  const toggleTask = (quadrant: string, id: number) => {
    setTasks(prev => ({
      ...prev,
      [quadrant]: prev[quadrant].map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    }));
  };

  const handleAiAutoSort = () => {
    if (!isPremiumUser) {
      setPricingOpen(true);
      return;
    }

    setTasks({
      doFirst: [
        { id: Date.now() + 1, text: "Nộp bài sprint React trước 23:59", completed: false },
        { id: Date.now() + 2, text: "Luyện đề đánh giá Giai đoạn 2 (bấm giờ)", completed: false },
      ],
      schedule: [
        { id: Date.now() + 3, text: "Ôn nền tảng TypeScript cho mốc roadmap", completed: false },
        { id: Date.now() + 4, text: "Chuẩn bị câu hỏi cho giờ hỏi đáp với AI tutor", completed: false },
      ],
      delegate: [
        { id: Date.now() + 5, text: "Sắp xếp ghi chú và đổi tên thư mục", completed: false },
      ],
      eliminate: [
        { id: Date.now() + 6, text: "Lướt mạng xã hội không kiểm soát", completed: false },
      ],
    });
    setAutoSorted(true);
    setTimeout(() => setAutoSorted(false), 2500);
  };

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

  const Lane = ({
    id,
    title,
    desc,
    emoji,
    cardClass,
    chipClass,
  }: {
    id: string;
    title: string;
    desc: string;
    emoji: string;
    cardClass: string;
    chipClass: string;
  }) => (
    <div className={`rounded-2xl border p-4 ${cardClass} flex flex-col min-h-[300px]`}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className={`text-xs font-bold uppercase tracking-[0.1em] ${isDark ? "text-slate-400" : "text-gray-500"}`}>{desc}</p>
          <h3 className={`mt-1 text-base font-black flex items-center gap-2 ${isDark ? "text-slate-100" : "text-gray-900"}`}>
            <span>{emoji}</span>
            {title}
          </h3>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${chipClass}`}>{tasks[id].length}</span>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto mb-3 hide-scrollbar pr-1">
        {tasks[id].map(task => (
          <div
            key={task.id}
            className={`rounded-xl p-2.5 shadow-sm ${isDark ? "bg-slate-900 border border-slate-700/70" : "bg-white border border-gray-200"}`}
          >
            <div className="flex items-start gap-2">
              <button
                onClick={() => toggleTask(id, task.id)}
                className={`mt-0.5 shrink-0 transition-colors ${isDark ? "text-slate-500 hover:text-[#FDBA74]" : "text-gray-300 hover:text-[#F37021]"}`}
              >
                {task.completed ? <CheckCircle2 size={18} className="text-orange-500" /> : <Circle size={18} />}
              </button>
              <span className={`text-sm leading-snug ${task.completed ? (isDark ? "line-through text-slate-500" : "line-through text-gray-400") : (isDark ? "text-slate-200" : "text-gray-700")}`}>{task.text}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="relative">
        <input
          type="text"
          value={newTasks[id]}
          onChange={e => setNewTasks(prev => ({ ...prev, [id]: e.target.value }))}
          onKeyDown={e => e.key === "Enter" && handleAddTask(id)}
          placeholder="Thêm tác vụ..."
          className={`w-full rounded-xl py-2.5 pl-3.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#F7B489] ${isDark ? "border border-slate-700 bg-slate-900 text-slate-200 placeholder:text-slate-500" : "border border-gray-200 bg-white text-gray-700"}`}
        />
        <button
          onClick={() => handleAddTask(id)}
          aria-label="Thêm tác vụ"
          title="Thêm tác vụ"
          className={`absolute right-2 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500 hover:text-[#FDBA74]" : "text-gray-400 hover:text-[#F37021]"}`}
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );

  const total = tasks.doFirst.length + tasks.schedule.length + tasks.delegate.length + tasks.eliminate.length;
  const done = Object.values(tasks).flat().filter(t => t.completed).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`max-w-6xl mx-auto w-full rounded-3xl p-5 md:p-6 ${isDark ? "border border-slate-700 bg-slate-950" : "border-2 border-[#FBD5BE] bg-[#FFFBF8]"}`}
    >
      <div className={`mb-5 rounded-2xl px-4 py-4 md:px-5 ${isDark ? "border border-slate-700 bg-slate-900" : "border border-[#FBD5BE] bg-white"}`}>
        <div className="flex flex-wrap items-center gap-3">
          <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black tracking-[0.08em] ${isDark ? "bg-amber-950/60 border border-amber-700 text-amber-300" : "bg-[#FFF4DB] border border-[#FBD38D] text-[#9A6700]"}`}>
            <Flame size={13} />
            NHIỆM VỤ HÔM NAY
          </div>
          <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ${isDark ? "bg-rose-950/60 border border-rose-700 text-rose-300" : "bg-[#FDE8E8] border border-[#F8B4B4] text-[#C81E1E]"}`}>
            <Heart size={13} fill="currentColor" />
            5 tim
          </div>
          <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ${isDark ? "bg-indigo-950/60 border border-indigo-700 text-indigo-300" : "bg-[#EEF4FF] border border-[#BFDBFE] text-[#1E40AF]"}`}>
            <Stars size={13} />
            {done}/{total} nhiệm vụ đã xong
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleAiAutoSort}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition ${isDark ? "border border-orange-700 bg-orange-950/50 text-orange-300 hover:bg-orange-900/40" : "border border-[#F7B489] bg-[#FFF3EB] text-[#9A3412] hover:bg-[#FDE6D8]"}`}
            >
              <Sparkles size={14} />
              AI phân loại nhanh
            </button>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black tracking-[0.08em] ${isDark ? "border border-amber-700 bg-amber-950/50 text-amber-300" : "border border-amber-300 bg-amber-50 text-amber-700"}`}>
              <Crown size={11} />
              CAO CẤP
            </span>
          </div>
        </div>
        {autoSorted && (
          <div className={`mt-3 rounded-lg px-3 py-2 text-xs font-semibold ${isDark ? "border border-orange-700 bg-orange-950/50 text-orange-300" : "border border-orange-200 bg-orange-50 text-orange-700"}`}>
            AI đã tự động phân loại tác vụ theo từng làn nhiệm vụ.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Lane
          id="doFirst"
          title="Làm ngay"
          desc="Khẩn cấp"
          emoji="🚨"
          cardClass={isDark ? "bg-red-950/25 border-red-900/60" : "bg-red-50/70 border-red-200"}
          chipClass={isDark ? "bg-red-900/70 text-red-300" : "bg-red-100 text-red-700"}
        />
        <Lane
          id="schedule"
          title="Lên lịch"
          desc="Có kế hoạch"
          emoji="📅"
          cardClass={isDark ? "bg-amber-950/25 border-amber-900/60" : "bg-amber-50/70 border-amber-200"}
          chipClass={isDark ? "bg-amber-900/70 text-amber-300" : "bg-amber-100 text-amber-700"}
        />
        <Lane
          id="delegate"
          title="Để sau"
          desc="Ít tác động"
          emoji="🧩"
          cardClass={isDark ? "bg-blue-950/25 border-blue-900/60" : "bg-blue-50/70 border-blue-200"}
          chipClass={isDark ? "bg-blue-900/70 text-blue-300" : "bg-blue-100 text-blue-700"}
        />
        <Lane
          id="eliminate"
          title="Loại bỏ"
          desc="Gây xao nhãng"
          emoji="🗑️"
          cardClass={isDark ? "bg-slate-900/70 border-slate-700" : "bg-gray-50/80 border-gray-200"}
          chipClass={isDark ? "bg-slate-800 text-slate-300" : "bg-gray-200 text-gray-700"}
        />
      </div>

      <div className={`mt-4 rounded-2xl p-4 ${isDark ? "border border-slate-700 bg-slate-900" : "border border-[#FBD5BE] bg-white"}`}>
        <h4 className={`text-sm font-black mb-1 ${isDark ? "text-slate-100" : "text-gray-900"}`}>Gợi ý học tập</h4>
        <p className={`text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-gray-600"}`}>
          Ưu tiên hoàn thành nhóm "Làm ngay", sau đó mới xử lý "Lên lịch". Nếu quá tải, hãy dời sang "Để sau" thay vì để việc tồn đọng thành khẩn cấp.
        </p>
      </div>

      <PricingModal
        isOpen={pricingOpen}
        onClose={() => {
          const raw = window.localStorage.getItem("ss_plan_tier");
          setPlanTier(raw === "premium" || raw === "builder" ? raw : "free");
          setPricingOpen(false);
        }}
      />
    </motion.div>
  );
}
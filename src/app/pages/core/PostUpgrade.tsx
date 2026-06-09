import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  CheckCircle2, Sparkles, BookOpen, BrainCircuit, Mic, ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router";

const FEATURES = [
  {
    icon: <Sparkles className="w-4 h-4 text-violet-500" />,
    title: "Lộ trình AI cá nhân hóa",
    desc: "AI phân tích mục tiêu và tài liệu của bạn để tạo lộ trình học phù hợp nhất.",
    bg: "bg-violet-50 border-violet-100",
  },
  {
    icon: <BrainCircuit className="w-4 h-4 text-orange-500" />,
    title: "Quiz kiểm tra kiến thức",
    desc: "Bộ câu hỏi AI tự động sinh từ nội dung bài học để đánh giá sâu mức độ nắm bài.",
    bg: "bg-orange-50 border-orange-100",
  },
  {
    icon: <Mic className="w-4 h-4 text-emerald-500" />,
    title: "Gia sư AI 24/7",
    desc: "Đặt câu hỏi bất kỳ lúc nào, AI trả lời ngay dựa trên tài liệu và lộ trình của bạn.",
    bg: "bg-emerald-50 border-emerald-100",
  },
];

export default function PostUpgradeDashboard() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (countdown <= 0) {
      navigate("/app/workspaces", { replace: true });
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, navigate]);

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] overflow-hidden"
        >
          {/* Success header */}
          <div className="px-8 py-8 text-center bg-gradient-to-b from-violet-50/70 to-transparent border-b border-slate-100">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.1 }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 border border-violet-200 shadow-[0_8px_24px_-6px_rgba(124,58,237,0.25)]"
            >
              <CheckCircle2 size={28} className="text-violet-600" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-violet-600">
                THANH TOÁN THÀNH CÔNG
              </span>
              <h1 className="mt-2 text-xl font-extrabold tracking-tight text-slate-900">
                Gói của bạn đã được kích hoạt!
              </h1>
              <p className="mt-1.5 text-sm text-slate-500 leading-6">
                Tất cả tính năng mới đã sẵn sàng. Bắt đầu học ngay bây giờ.
              </p>
            </motion.div>
          </div>

          {/* Features preview */}
          <div className="px-8 py-6 space-y-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className={`flex items-start gap-3 rounded-xl border p-3.5 ${f.bg}`}
              >
                <div className="mt-0.5 shrink-0">{f.icon}</div>
                <div>
                  <p className="text-xs font-bold text-slate-800">{f.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-4">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA + countdown */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="px-8 pb-8 space-y-3"
          >
            <button
              onClick={() => navigate("/app/workspaces", { replace: true })}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-violet-500 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-violet-500/20 transition hover:from-violet-700 hover:to-violet-600 active:scale-[0.98]"
            >
              <BookOpen size={15} /> Bắt đầu học ngay
            </button>
            <button
              onClick={() => navigate("/app/workspaces", { replace: true })}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-[0.98]"
            >
              Vào workspace <ArrowRight size={14} />
            </button>
            <p className="text-center text-xs text-slate-400">
              Tự động chuyển trang sau {countdown}s...
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

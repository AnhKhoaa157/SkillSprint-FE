import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2, Sparkles, Crown, ArrowRight, BookOpen,
  Mic, FileText, Medal, PlayCircle, Download,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router";

type Tier = "builder" | "premium";

export default function PostUpgradeDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialTier = ((location.state as { plan?: Tier } | null)?.plan ?? "premium") as Tier;
  const [tier, setTier] = useState<Tier>(initialTier);

  const tierMeta = useMemo(() => {
    if (tier === "premium") {
      return {
        title: "Career Premium đã được kích hoạt",
        subtitle: "Bạn đã mở khóa đầy đủ bộ công cụ tăng tốc nghề nghiệp.",
        badge: "Premium Active",
      };
    }
    return {
      title: "Skill Builder đã được kích hoạt",
      subtitle: "Bạn đã mở khóa lộ trình AI cá nhân hóa và học tập thông minh.",
      badge: "Skill Builder Active",
    };
  }, [tier]);

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-50">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6 mb-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 border border-orange-200 mb-3">
              <CheckCircle2 size={14} className="text-orange-600" />
              <span className="text-xs font-bold tracking-wide text-orange-700">THANH TOÁN THÀNH CÔNG</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{tierMeta.title}</h1>
            <p className="text-sm text-slate-600 mt-1">{tierMeta.subtitle}</p>
          </div>

          <div className="flex bg-slate-900 p-1 rounded-xl">
            <button
              onClick={() => setTier("builder")}
              className={`px-4 py-2 text-sm rounded-lg transition-all ${tier === "builder" ? "bg-orange-500 text-white font-bold" : "text-slate-300 hover:text-white"}`}
            >
              Skill Builder
            </button>
            <button
              onClick={() => setTier("premium")}
              className={`px-4 py-2 text-sm rounded-lg transition-all ${tier === "premium" ? "bg-orange-500 text-white font-bold" : "text-slate-300 hover:text-white"}`}
            >
              Career Premium
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200">{tierMeta.badge}</span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white text-slate-600 border border-slate-200">Kích hoạt ngay lập tức</span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white text-slate-600 border border-slate-200">Không cần thao tác thêm</span>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/app/workspaces")}
            className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-colors inline-flex items-center gap-2"
          >
            <BookOpen size={16} /> Bắt đầu học ngay
          </button>
          <button
            onClick={() => navigate("/app/workspaces")}
            className="px-4 py-2 rounded-xl border border-orange-200 bg-white text-orange-700 text-sm font-bold hover:bg-orange-50 transition-colors inline-flex items-center gap-2"
          >
            Xem roadmap <ArrowRight size={16} />
          </button>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tier}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-5"
        >
          <FeatureCard
            icon={<Sparkles className="w-4 h-4 text-orange-500" />}
            title="AI Learning Engine"
            desc={tier === "premium" ? "Lộ trình học tự động điều chỉnh theo tiến độ + mục tiêu nghề nghiệp." : "Lộ trình AI cá nhân hóa cho module hiện tại."}
            cta="Mở Learning Hub"
            onClick={() => navigate("/app/workspaces")}
          />

          <FeatureCard
            icon={tier === "premium" ? <Mic className="w-4 h-4 text-orange-500" /> : <FileText className="w-4 h-4 text-orange-500" />}
            title={tier === "premium" ? "Career Tools" : "Skill Gap + Resources"}
            desc={tier === "premium" ? "Career profile nâng cao và bộ công cụ nghề nghiệp." : "Phân tích thiếu hụt kỹ năng và đề xuất tài liệu học tập."}
            cta={tier === "premium" ? "Mở Career Tools" : "Xem phân tích"}
            onClick={() => navigate(tier === "premium" ? "/app/profile" : "/app/workspaces")}
          />

          <FeatureCard
            icon={tier === "premium" ? <Medal className="w-4 h-4 text-orange-500" /> : <PlayCircle className="w-4 h-4 text-orange-500" />}
            title={tier === "premium" ? "CV + Micro-credentials" : "Practice & Progress"}
            desc={tier === "premium" ? "Career profile nâng cao, badge chia sẻ LinkedIn và chứng nhận kỹ năng." : "Theo dõi tiến độ và mở kho bài luyện tập nâng cao."}
            cta={tier === "premium" ? "Mở hồ sơ nghề nghiệp" : "Tiếp tục học"}
            onClick={() => navigate(tier === "premium" ? "/app/profile" : "/app/workspaces")}
          />
        </motion.div>
      </AnimatePresence>

          {tier === "premium" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 rounded-2xl border border-slate-200 bg-white p-5"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-widest text-orange-600 uppercase mb-1">Premium Starter Pack</p>
                  <p className="text-sm text-slate-700">Bạn có thể bắt đầu ngay với Career Profile và bộ công cụ nghề nghiệp để thấy kết quả nhanh nhất.</p>
            </div>
            <button
              onClick={() => navigate("/app/profile")}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-black transition-colors inline-flex items-center gap-2"
            >
              <Download size={15} /> Mở Career Tools
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
  cta,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col">
      <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-600 mt-1 mb-4 leading-relaxed">{desc}</p>
      <button
        onClick={onClick}
        className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-800 text-sm font-semibold hover:bg-slate-50 transition-colors"
      >
        {cta} <ArrowRight size={14} />
      </button>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import roadmapService, { RoadmapResponse, RoadmapResource, RoadmapStep } from "../../../api/roadmapService";
import calendarService, { type CalendarTaskResponse } from "../../../api/calendarService";
import { getCurrentSubscription } from "../../../api/subscriptionsService";
import {
  ArrowLeft,
  BookOpenCheck,
  Bot,
  CircleHelp,
  CalendarDays,
  Clock3,
  FileText,
  Layers3,
  LoaderCircle,
  PlayCircle,
  Sparkles,
  X,
  Lock,
  Check,
  BookOpen,
  FileCheck,
  ArrowUpRight,
  ChevronRight,
} from "lucide-react";
import AiTutorChat from "./AiTutorChat";
import { toast } from "sonner";

type StepTone = {
  label: string;
  bgClass: string;
  borderClass: string;
  dotClass: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toText(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function getResourceMeta(resource: RoadmapResource) {
  const type = (toText(resource.type) || "document").toLowerCase();

  if (type.includes("video") || type.includes("lecture") || type.includes("course")) {
    return {
      icon: PlayCircle,
      label: "Video bài giảng",
      action: "Học ngay",
      tone: "bg-orange-50/60 text-[#FF7E21] border-orange-100/80 hover:bg-orange-100/40 hover:border-orange-200",
    };
  }

  if (type.includes("quiz") || type.includes("test") || type.includes("exercise") || type.includes("practice")) {
    return {
      icon: CircleHelp,
      label: "Trắc nghiệm / Bài tập",
      action: "Làm bài",
      tone: "bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100/60 hover:border-slate-300",
    };
  }

  return {
    icon: FileText,
    label: "Tài liệu học tập",
    action: "Xem tài liệu",
    tone: "bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100/60 hover:border-slate-300",
  };
}

function getStepTone(step: RoadmapStep, index: number, totalSteps: number): StepTone {
  const difficulty = toText(step.difficulty) || toText(step.complexity) || (index === 0 ? "easy" : index === totalSteps - 1 ? "hard" : "medium");
  const normalized = difficulty.toLowerCase();

  if (normalized.includes("hard") || normalized.includes("advanced") || normalized.includes("high")) {
    return {
      label: "Nâng cao",
      bgClass: "bg-rose-50 text-rose-700 border-rose-100/80",
      borderClass: "border-rose-200",
      dotClass: "border-rose-200 text-rose-600 bg-rose-50/60",
    };
  }

  if (normalized.includes("medium") || normalized.includes("intermediate")) {
    return {
      label: "Trung bình",
      bgClass: "bg-amber-50 text-amber-700 border-amber-100/80",
      borderClass: "border-amber-200",
      dotClass: "border-amber-200 text-amber-600 bg-amber-50/60",
    };
  }

  return {
    label: "Cơ bản",
    bgClass: "bg-emerald-50 text-emerald-700 border-emerald-100/80",
    borderClass: "border-emerald-200",
    dotClass: "border-emerald-200 text-emerald-600 bg-emerald-50/60",
  };
}

function getStepDurationMinutes(step: RoadmapStep): number | null {
  const value = toNumber(step.durationMinutes) ?? toNumber(step.duration) ?? toNumber(step.minutes);
  return typeof value === "number" ? value : null;
}

function getStepSummary(step: RoadmapStep): string {
  return toText(step.description) || toText(step.summary) || "Nội dung đang được chuẩn hoá từ cấu trúc đã xác nhận.";
}

function getStepKey(step: RoadmapStep): string | null {
  return toText(step.stepId) || toText(step.id) || toText(step._id) || null;
}

function formatTaskDate(taskDate: string | null | undefined): string {
  if (!taskDate) return "";
  const parsed = new Date(taskDate);
  if (Number.isNaN(parsed.getTime())) return taskDate;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

function getTotalResources(roadmapData: RoadmapResponse | null): number {
  if (!roadmapData) return 0;
  const stepResources = (roadmapData.steps || []).reduce((count, step) => count + (step.resources?.length || 0), 0);
  return stepResources + (roadmapData.resources?.length || 0);
}

function formatRoadmapId(rawId: unknown): string {
  const id = toText(rawId);
  if (!id) return "RM-000000";
  const suffix = id.replace(/[^a-zA-Z0-9]/g, "").slice(-6).padStart(6, "0");
  return `RM-${suffix}`;
}

const xOffsets = [50, 65, 55, 38, 30, 48, 70, 60, 42, 35];

const renderMapDecoration = (index: number, xVal: number) => {
  const isLeft = xVal < 50;
  const positionClass = isLeft
    ? "absolute top-4 right-[10%] sm:right-[20%] pointer-events-none select-none opacity-25"
    : "absolute top-4 left-[10%] sm:left-[20%] pointer-events-none select-none opacity-25";

  switch (index % 6) {
    case 0: // Clouds
      return (
        <div className={positionClass}>
          <svg className="w-16 h-10 text-[#D4A373]" viewBox="0 0 100 60" fill="currentColor">
            <path d="M20 40 A15 15 0 0 1 35 25 A18 18 0 0 1 65 22 A15 15 0 0 1 80 40 A12 12 0 0 1 70 50 L25 50 A12 12 0 0 1 20 40 Z" />
          </svg>
        </div>
      );
    case 1: // Sailboat
      return (
        <div className={positionClass}>
          <svg className="w-16 h-16 text-[#D4A373]" viewBox="0 0 100 100" fill="currentColor">
            <path d="M10 80 C20 75, 30 85, 40 80 C50 75, 60 85, 70 80 C80 75, 90 85, 100 80" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M15 85 C25 80, 35 90, 45 85 C55 80, 65 90, 75 85 C85 80, 95 90, 105 85" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
            <path d="M25 70 L75 70 L68 80 L32 80 Z" />
            <line x1="40" y1="70" x2="40" y2="30" stroke="currentColor" strokeWidth="2" />
            <line x1="58" y1="70" x2="58" y2="25" stroke="currentColor" strokeWidth="2" />
            <line x1="72" y1="70" x2="72" y2="40" stroke="currentColor" strokeWidth="1.5" />
            <path d="M40 32 C48 35, 48 50, 40 55 C48 50, 48 35, 40 32 Z" fill="currentColor" opacity="0.8" />
            <path d="M40 57 C46 60, 46 65, 40 68" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M58 27 C68 30, 68 50, 58 55 C68 50, 68 30, 58 27 Z" fill="currentColor" opacity="0.9" />
            <polygon points="58,25 50,28 58,31" />
          </svg>
        </div>
      );
    case 2: // Kraken
      return (
        <div className={positionClass}>
          <svg className="w-16 h-20 text-[#D4A373]" viewBox="0 0 100 120" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M20 100 C30 95, 40 105, 50 100 C60 95, 70 105, 80 100" />
            <path d="M40 100 C35 70, 20 60, 30 30 C35 15, 55 10, 60 25 C65 40, 50 55, 48 80 C47 90, 48 95, 50 100" fill="currentColor" opacity="0.25" />
          </svg>
        </div>
      );
    case 3: // Wind Rose
      return (
        <div className={positionClass}>
          <svg className="w-14 h-14 text-[#D4A373]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.2">
            <circle cx="50" cy="50" r="30" strokeDasharray="2,2" />
            <path d="M50 10 L50 90 M10 50 L90 50" />
            <polygon points="50,15 53,47 50,50 47,47" fill="currentColor" opacity="0.5" />
          </svg>
        </div>
      );
    default:
      return null;
  }
};

export default function Roadmap() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const navigationRoadmap = (location.state as { roadmap?: RoadmapResponse } | null)?.roadmap ?? null;
  
  const [roadmapData, setRoadmapData] = useState<RoadmapResponse | null>(navigationRoadmap);
  const [tasks, setTasks] = useState<CalendarTaskResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStep, setSelectedStep] = useState<RoadmapStep | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [detailTab, setDetailTab] = useState<"overview" | "resources" | "tutor">("overview");
  const [isPremium, setIsPremium] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    getCurrentSubscription()
      .then(sub => { setIsPremium(sub.plan?.planType !== "FREE"); })
      .catch(() => { setIsPremium(false); });
  }, []);

  useEffect(() => {
    setDetailTab("overview");
  }, [selectedStep]);

  const steps = roadmapData?.steps || [];
  const totalResources = useMemo(() => getTotalResources(roadmapData), [roadmapData]);
  const progressPercent = useMemo(() => {
    if (!roadmapData) return 0;
    const status = (toText(roadmapData.status) || "").toUpperCase();
    if (status === "GENERATING") return 0;
    if (steps.length === 0) return 0;
    const completedCount = steps.filter(step => {
      const stepId = getStepKey(step);
      const matched = tasks.find(t => t.roadmapStepId === stepId);
      return matched?.status?.toUpperCase() === "COMPLETED" || matched?.status?.toUpperCase() === "DONE";
    }).length;
    return Math.round((completedCount / steps.length) * 100);
  }, [roadmapData, steps, tasks]);

  const roadmapTitle = toText(roadmapData?.title) || "Roadmap học tập";
  const roadmapDescription = toText(roadmapData?.description) || "Lộ trình học tập theo workspace đã xác nhận.";

  useEffect(() => {
    let mounted = true;

    const loadRoadmapAndTasks = async () => {
      if (!workspaceId) {
        if (mounted) setError("Không tìm thấy workspace");
        return;
      }

      if (!roadmapData) setLoading(true);
      setError(null);

      try {
        let currentRoadmap = null;
        try {
          currentRoadmap = await roadmapService.getRoadmap(workspaceId);
        } catch (err: any) {
          if (err?.status === 404 || String(err?.message || "").includes("404") || String(err || "").includes("404")) {
            if (mounted) setGenerating(true);
            try {
              await roadmapService.generateRoadmap(workspaceId);
            } catch (genErr) {
              console.warn("Auto-generate trigger failed", genErr);
            }
            currentRoadmap = await roadmapService.getRoadmap(workspaceId).catch(() => null);
          } else {
            throw err;
          }
        }

        const taskResult = await calendarService.getCalendarTasks(workspaceId).catch(() => []);

        if (!mounted) return;

        setRoadmapData(currentRoadmap);
        setTasks(taskResult || []);
      } catch (err: any) {
        if (!mounted) return;
        if (!roadmapData) setError(err?.message || "Không thể tải dữ liệu tự động");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadRoadmapAndTasks();
    return () => { mounted = false; };
  }, [workspaceId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const isGeneratingState = generating || roadmapData?.status === "GENERATING" || roadmapData?.status === "PENDING";
    
    if (isGeneratingState && workspaceId) {
      interval = setInterval(async () => {
        try {
          const fresh = await roadmapService.getRoadmap(workspaceId);
          setRoadmapData(fresh);
          
          if (fresh && fresh.status !== "GENERATING" && fresh.status !== "PENDING") {
            clearInterval(interval);
            setGenerating(false);
            toast.success("Khởi tạo lộ trình thành công!");
          }
        } catch (e) {
          console.warn("Polling roadmap failed", e);
        }
      }, 3000);
    }
    
    return () => clearInterval(interval);
  }, [roadmapData?.status, generating, workspaceId]);

  const handleGenerate = async () => {
    if (!workspaceId) return;
    setGenerating(true);
    setError(null);

    try {
      await roadmapService.generateRoadmap(workspaceId);
      const fresh = await roadmapService.getRoadmap(workspaceId);
      setRoadmapData(fresh);
    } catch (err: any) {
      setError(err?.message || "Không thể khởi tạo lộ trình");
      setGenerating(false);
    }
  };

  const handleBackToDetail = () => {
    if (!workspaceId) {
      navigate("/app/workspaces");
      return;
    }
    navigate(`/app/workspaces/${workspaceId}`);
  };

  const handleStartLearning = () => {
    if (!selectedStep) return;
    const matchedTask = tasks.find((task) => task.roadmapStepId === getStepKey(selectedStep));

    if (matchedTask?.taskId) {
      setIsStarting(true);
      navigate(`/app/learning/course?taskId=${matchedTask.taskId}`);
    } else {
      toast.info("Nội dung bài học đang được AI chuẩn bị hoặc chưa tới ngày.");
    }
  };

  const renderStepDetail = (isMobileView = false) => {
    if (!selectedStep) return null;

    const step = selectedStep;
    const stepIndex = steps.findIndex((s) => s.id === step.id);
    const idx = stepIndex >= 0 ? stepIndex : 0;
    const tone = getStepTone(step, idx, steps.length);
    const durationMinutes = getStepDurationMinutes(step);
    const stepResources = step.resources || [];
    const stepSummary = getStepSummary(step);
    const matchedTask = tasks.find((task) => task.roadmapStepId === getStepKey(step));
    const matchedTaskDate = matchedTask?.taskDate ? formatTaskDate(matchedTask.taskDate) : "";
    const canStart = Boolean(matchedTask);
    const stepCompletionPercent = Math.min(100, 20 + idx * 15);

    return (
      <div className={isMobileView 
        ? "flex flex-col bg-white w-full" 
        : "h-full flex flex-col bg-white border-l border-slate-100 shadow-[0_-8px_24px_rgba(15,23,42,0.03)] z-20 relative"
      }>
        <div className={`px-6 pt-5 bg-white shrink-0 ${isMobileView ? "px-0" : ""}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#FF7E21] border border-orange-100/60 shadow-sm mt-0.5">
                <BookOpen className="h-5.5 w-5.5 text-[#FF7E21]" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#FF7E21] block">
                  Cột mốc {idx + 1}
                </span>
                <h2 className="text-base font-extrabold tracking-tight text-slate-850 break-words mt-1 leading-snug">
                  {toText(step.title) || `Cột mốc học tập ${idx + 1}`}
                </h2>
              </div>
            </div>
            {!isMobileView && (
              <button
                type="button"
                onClick={() => setSelectedStep(null)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:border-slate-350 hover:bg-slate-50 transition shadow-sm cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex mt-4 rounded-xl bg-slate-50 border border-slate-100 p-1 gap-1">
            <button
              type="button"
              onClick={() => setDetailTab("overview")}
              className={`flex-1 py-2 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                detailTab === "overview"
                  ? "bg-white text-[#FF7E21] shadow-sm border border-orange-100/60"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/60"
              }`}
            >
              Tổng quan
            </button>
            <button
              type="button"
              onClick={() => setDetailTab("resources")}
              className={`flex-1 py-2 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                detailTab === "resources"
                  ? "bg-white text-[#FF7E21] shadow-sm border border-orange-100/60"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/60"
              }`}
            >
              <span>Tài nguyên</span>
              <span className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                detailTab === "resources" ? "bg-orange-50 text-[#FF7E21]" : "bg-slate-200 text-slate-500"
              }`}>
                {stepResources.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setDetailTab("tutor")}
              className={`flex-1 py-2 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                detailTab === "tutor"
                  ? "bg-white text-orange-600 shadow-sm border border-orange-100/60"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/60"
              }`}
            >
              <Bot className="h-3 w-3" />
              <span>Hỏi AI</span>
            </button>
          </div>
        </div>

        <div className={`flex-1 bg-white ${
          detailTab === "tutor" ? "overflow-hidden flex flex-col min-h-0 px-4 pt-3 pb-4" : "overflow-y-auto custom-scrollbar px-6 pt-5 pb-6"
        } ${isMobileView ? "px-0" : ""}`}>
          {detailTab === "tutor" ? (
            <AiTutorChat
              key={getStepKey(step) ?? ""}
              mode="step"
              contextId={getStepKey(step) ?? ""}
              contextTitle={toText(step.title) || `Cột mốc ${idx + 1}`}
            />
          ) : detailTab === "overview" ? (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-[#FF7E21] border border-orange-100/40">
                      <Clock3 className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Thời gian</div>
                      <div className="text-xs font-bold text-slate-700 mt-0.5">
                        {durationMinutes ? `${durationMinutes} phút` : "Tự điều chỉnh"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-500 border border-slate-200/30">
                      <Layers3 className="h-4.5 w-4.5 text-slate-650" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Độ phức tạp</div>
                      <div className="mt-0.5">
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${tone.bgClass} ${tone.borderClass}`}>
                          {tone.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100/60">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${matchedTask ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' : 'bg-slate-50 text-slate-400 border border-slate-200/30'}`}>
                      <CalendarDays className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lịch học cá nhân</div>
                      <div className="text-xs font-bold text-slate-700 mt-0.5">
                        {matchedTask ? `Ngày học: ${matchedTaskDate}` : "Chưa được lên lịch học"}
                      </div>
                    </div>
                  </div>
                  {matchedTask ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-100">Đang mở</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[9px] font-bold text-slate-400 border border-slate-200/30">Chờ lên lịch</span>
                  )}
                </div>
              </div>
              <div className="border-b border-slate-100 pb-5 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span>Tiến độ module</span>
                  <span className="text-[#FF7E21]">{stepCompletionPercent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 border border-slate-200/40 shadow-inner">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-[#FF7E21] transition-all duration-500 shadow-[0_0_8px_rgba(255,126,33,0.2)]"
                    style={{ width: `${stepCompletionPercent}%` }}
                  />
                </div>
              </div>
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#FF7E21] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF7E21]" /> Mục tiêu bài học
                </h4>
                <div className="border-l-4 border-[#FF7E21] bg-orange-50/20 p-4 rounded-r-xl shadow-sm border-r border-t border-b border-orange-100/30">
                  <p className="text-xs text-slate-700 leading-relaxed font-semibold whitespace-pre-line">{stepSummary}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileCheck className="h-4.5 w-4.5 text-[#FF7E21]" /> Tài nguyên học tập chính thức
              </div>
              {stepResources.length > 0 ? (
                <div className="grid gap-3.5">
                  {stepResources.map((resource, resourceIndex) => {
                    const meta = getResourceMeta(resource);
                    const ResourceIcon = meta.icon;
                    const hasUrl = Boolean(toText(resource.url));

                    return (
                      <a
                        key={`panel-${step.id}-${resourceIndex}-${toText(resource.title) || "res"}`}
                        href={toText(resource.url) || "#"}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => { if (!hasUrl) e.preventDefault(); }}
                        className={`group flex items-start gap-3.5 rounded-xl border border-slate-200/80 bg-white p-4 transition-all duration-200 ${
                          hasUrl ? 'hover:border-orange-200 hover:shadow-[0_4px_16px_rgba(255,126,33,0.04)] cursor-pointer' : 'cursor-default'
                        }`}
                      >
                        <div className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-650 border border-slate-100 shadow-inner group-hover:bg-orange-50 group-hover:text-[#FF7E21] group-hover:border-orange-100/50 transition-colors">
                          <ResourceIcon className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-500 border border-slate-200/30">{meta.label}</span>
                            {hasUrl && (
                              <span className="text-[8px] font-bold text-[#FF7E21] bg-orange-50 border border-orange-100/50 px-1.5 py-0.5 rounded">Lớp học trực tuyến</span>
                            )}
                          </div>
                          <h5 className="text-xs font-bold text-slate-900 mt-1.5 leading-snug group-hover:text-[#FF7E21] transition-colors">{toText(resource.title) || "Tài nguyên học tập"}</h5>
                          {toText(resource.description) && <p className="text-[11px] text-slate-500 mt-1 leading-relaxed break-words">{toText(resource.description)}</p>}
                        </div>
                        {hasUrl && (
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 group-hover:bg-[#FF7E21] group-hover:text-white transition-all shadow-sm">
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </a>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center shadow-sm">
                  <FileText className="mx-auto h-7 w-7 text-slate-350" />
                  <p className="mt-2 text-xs font-medium text-slate-400">Chưa có tài liệu cho module này.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={`border-t border-slate-100 p-4 bg-white shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.015)] ${isMobileView ? "px-0 pb-0" : ""}`}>
          <button
            disabled={!canStart || isStarting}
            onClick={handleStartLearning}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 flex justify-center items-center gap-1.5 ${
              canStart && !isStarting ? "bg-[#FF7E21] text-white hover:bg-[#E05E00] shadow-sm hover:shadow shadow-orange-100 cursor-pointer" : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/50"
            }`}
          >
            {isStarting ? <><LoaderCircle className="h-4.5 w-4.5 animate-spin" /> Đang khởi tạo...</> : canStart ? <><span>Bắt đầu học ngay</span><ChevronRight className="h-4 w-4" /></> : <span>Chưa đến ngày học</span>}
          </button>
        </div>
      </div>
    );
  };

  const isGeneratingState = generating || roadmapData?.status === "GENERATING" || roadmapData?.status === "PENDING";

  if (loading && !isGeneratingState) {
    return (
      <div className="min-h-[calc(100vh-2rem)] rounded-[2rem] bg-[#FDFBF7] px-6 py-8 border border-amber-100 flex items-center justify-center">
        <div className="text-center space-y-3"><LoaderCircle className="h-8 w-8 animate-spin text-[#FF6B00] mx-auto" /><p className="text-sm font-semibold text-slate-500">Đang chuẩn bị không gian học tập...</p></div>
      </div>
    );
  }

  if (isGeneratingState) {
    return (
      <div className="min-h-[calc(100vh-2rem)] rounded-[2rem] bg-[#FDFBF7] px-6 py-8 border border-amber-100 flex items-center justify-center shadow-inner">
        <div className="text-center max-w-sm space-y-5 bg-white p-8 rounded-[2rem] shadow-xl border border-orange-100/50">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-orange-50 text-[#FF6B00] shadow-inner border border-orange-100">
            <LoaderCircle className="h-10 w-10 animate-spin" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">AI đang thiết kế lộ trình...</h1>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed font-medium">
              Hệ thống đang phân tích các tài liệu và cấu hình học tập của bạn. <br/>Quá trình này diễn ra tự động, vui lòng đợi trong giây lát!
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!roadmapData || error) {
    return (
      <div className="min-h-[calc(100vh-2rem)] rounded-[2rem] bg-[radial-gradient(circle_at_top_left,_rgba(255,107,0,0.10),_transparent_30%),linear-gradient(180deg,_#F8FAFC_0%,_#F1F5F9_100%)] px-6 py-8 text-slate-900 lg:px-10">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
          <div className="w-full rounded-[2rem] border border-rose-200 bg-white p-8 text-center shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600"><BookOpenCheck className="h-8 w-8" /></div>
            <h1 className="mt-5 text-2xl font-bold text-slate-900">Không thể tải lộ trình</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">{error || "Vui lòng kiểm tra lại cấu hình."}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button type="button" onClick={handleBackToDetail} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer">
                <ArrowLeft size={16} /> Quay lại
              </button>
              <button type="button" onClick={handleGenerate} className="inline-flex items-center gap-2 rounded-xl bg-[#FF6B00] px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-[#E05E00] cursor-pointer">
                <Sparkles size={16} /> Thử tạo lại roadmap
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-2rem)] rounded-[2rem] px-4 sm:px-6 py-8 text-slate-900 lg:px-10 border border-[#EEDCC5]/70 shadow-[0_16px_40px_rgba(212,163,115,0.06)] relative overflow-hidden"
      style={{
        backgroundColor: "#FDFBF7",
        backgroundImage: `radial-gradient(#E8D8C8 1px, transparent 1px), linear-gradient(rgba(212, 163, 115, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(212, 163, 115, 0.04) 1px, transparent 1px)`,
        backgroundSize: "20px 20px, 40px 40px, 40px 40px",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-1.5 border border-[#EEDCC5]/40 pointer-events-none rounded-[1.8rem] z-0" />
      <div className="absolute inset-3 border border-dashed border-[#EEDCC5]/30 pointer-events-none rounded-[1.6rem] z-0" />

      <div className="absolute top-[220px] left-[8%] opacity-20 pointer-events-none transform -translate-y-1/2 select-none">
        <svg className="w-24 h-24 text-[#D4A373]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="50" cy="50" r="42" strokeDasharray="3,3" />
          <circle cx="50" cy="50" r="38" />
          <path d="M50 5 L50 95 M5 50 L95 50 M18 18 L82 82 M18 82 L82 18" />
          <polygon points="50,5 54,46 50,50 46,46" fill="currentColor" />
          <polygon points="50,95 54,54 50,50 46,54" fill="currentColor" />
          <polygon points="95,50 54,54 50,50 54,46" fill="currentColor" />
          <polygon points="5,50 46,54 50,50 46,46" fill="currentColor" />
          <text x="47" y="16" fill="currentColor" className="text-[10px] font-black">N</text>
          <text x="47" y="92" fill="currentColor" className="text-[10px] font-black">S</text>
          <circle cx="50" cy="50" r="3" fill="#FDFBF7" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>

      <div className={`h-[calc(100vh-120px)] flex flex-col md:flex-row items-start overflow-hidden px-1 sm:px-4 transition-all duration-700 ease-in-out ${selectedStep && !isMobile ? 'justify-start gap-0 lg:gap-8' : 'justify-center'}`}>
        {/* LEFT COLUMN: ROADMAP PATH WITH SCROLL CONTEXT */}
        <div className={`h-full overflow-y-auto custom-scrollbar px-1 sm:px-2 transition-all duration-700 ease-in-out flex-shrink-0 relative z-10 ${selectedStep && !isMobile ? "w-full lg:w-[55%]" : "w-full max-w-3xl"}`}>
          
          <section className="mb-6 rounded-2xl border border-amber-200 bg-[#FFFDF9]/95 p-4 sm:p-5 shadow-[0_12px_32px_rgba(212,163,115,0.12)] backdrop-blur relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-orange-100/40 to-transparent pointer-events-none rounded-bl-full border-l border-b border-orange-100/20" />
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between relative z-10">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-[#FF7E21] border border-orange-200/50 uppercase tracking-wider shadow-sm shadow-orange-500/5">
                  <Sparkles className="h-3.5 w-3.5 text-[#FF7E21]" /> Bản đồ hành trình AI
                </div>
                <h1 className="mt-3.5 text-lg sm:text-2xl font-extrabold tracking-tight text-slate-800 leading-snug">{roadmapTitle}</h1>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{roadmapDescription} Mã: <span className="font-extrabold text-orange-850 bg-orange-50 px-2 py-0.5 rounded border border-orange-100/50">{formatRoadmapId(roadmapData?.id || workspaceId)}</span></p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] sm:text-xs shrink-0 w-full lg:w-auto">
                <div className="rounded-xl border border-amber-200/60 bg-[#FDFBF7] px-2 sm:px-3 py-2 text-center min-w-0 shadow-sm">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Trạng thái</div>
                  <div className="mt-1 text-xs font-extrabold text-slate-700 truncate">{(roadmapData.status || "ACTIVE").toUpperCase()}</div>
                </div>
                <div className="rounded-xl border border-amber-200/60 bg-[#FDFBF7] px-2 sm:px-3 py-2 text-center min-w-0 shadow-sm">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Cột mốc</div>
                  <div className="mt-1 text-xs font-extrabold text-slate-700">{steps.length}</div>
                </div>
                <div className="rounded-xl border border-amber-200/60 bg-[#FDFBF7] px-2 sm:px-3 py-2 text-center min-w-0 shadow-sm">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Tài nguyên</div>
                  <div className="mt-1 text-xs font-extrabold text-slate-700">{totalResources}</div>
                </div>
              </div>
            </div>
            
            <div className="mt-5 pt-4 border-t border-amber-100/50">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                <span>Tiến trình hoàn thành</span><span className="text-[#FF7E21]">{progressPercent}%</span>
              </div>
              <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-100 border border-slate-200/40 shadow-inner">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-[#FF7E21] transition-all duration-500 shadow-[0_0_8px_rgba(255,107,0,0.4)]" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </section>

          {/* INDEPENDENT INDIVIDUAL SCROLLBOX FOR THE GRAPH INTERFACES */}
          <div className="w-full overflow-x-auto custom-scrollbar touch-pan-x select-none border border-amber-100/40 bg-[#FFFDF9]/40 rounded-3xl p-2 sm:p-4 shadow-inner">
            <div className="min-w-[650px] md:min-w-0 w-full h-full relative py-12 flex flex-col items-center select-none">
              {steps.map((step, index) => {
                const isLast = index === steps.length - 1;
                const isActive = selectedStep?.id === step.id;
                const stepId = getStepKey(step) || `step-${index}`;
                const title = toText(step.title) || `Cột mốc ${index + 1}`;
                const matchedTask = tasks.find((task) => task.roadmapStepId === stepId);
                const isCompleted = matchedTask?.status?.toUpperCase() === "COMPLETED" || matchedTask?.status?.toUpperCase() === "DONE";
                const isFreemiumLocked = !isPremium && index >= 2;
                const X_curr = xOffsets[index % 10];
                const X_next = xOffsets[(index + 1) % 10];

                return (
                  <div key={stepId} className="relative w-full h-28 flex items-center justify-center">
                    {renderMapDecoration(index, X_curr)}
                    <div className="absolute top-1/2 left-0 w-full h-[calc(100%+3.5rem)] z-0 pointer-events-none">
                      <svg className="w-full h-full text-[#D4A373]/50" preserveAspectRatio="none" viewBox="0 0 100 100">
                        <path d={isLast ? `M ${X_curr} 0 C ${X_curr} 50, 50 50, 50 100` : `M ${X_curr} 0 C ${X_curr} 50, ${X_next} 50, ${X_next} 100`} stroke="currentColor" strokeWidth="3.5" strokeDasharray="6,6" strokeLinecap="round" fill="none" vectorEffect="non-scaling-stroke" />
                      </svg>
                    </div>

                    <div className="absolute -translate-x-1/2 -translate-y-1/2 z-10 top-1/2 flex flex-col items-center" style={{ left: `${X_curr}%` }}>
                      {isFreemiumLocked ? (
                        <button type="button" onClick={() => setShowUpgradeModal(true)} className="flex flex-col items-center focus:outline-none group cursor-pointer">
                          <div className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-slate-200 bg-slate-100 text-slate-400 overflow-hidden">
                            <div className="absolute inset-0 backdrop-blur-[2px] bg-white/40" />
                            <Lock className="h-5 w-5 text-slate-400 relative z-10" />
                          </div>
                          <div className="mt-2 bg-slate-50/95 px-3 py-1 rounded-xl border border-slate-200 relative z-10 w-28 sm:w-36 text-center overflow-hidden">
                            <div className="absolute inset-0 backdrop-blur-[1px]" />
                            <h3 className="text-[10px] font-bold tracking-tight text-slate-400 truncate leading-snug relative z-10 blur-[2px]" title={title}>{title}</h3>
                            <span className="block text-[9px] font-semibold text-orange-500 relative z-10 mt-0.5">🔒 Mở khoá Pro</span>
                          </div>
                        </button>
                      ) : (
                        <button type="button" onClick={() => setSelectedStep(step)} className="flex flex-col items-center transition-all duration-300 hover:scale-105 focus:outline-none cursor-pointer">
                          <div className={`flex h-14 w-14 items-center justify-center rounded-full border-2 transition-all duration-300 ${isActive ? 'border-[#FF7E21] bg-[#FF7E21] text-white shadow-lg shadow-orange-500/20 ring-4 ring-orange-100' : isCompleted ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm ring-4 ring-emerald-50' : matchedTask ? 'border-[#D4A373] bg-white text-slate-700 shadow-sm hover:border-[#FF7E21] hover:text-[#FF7E21]' : 'border-slate-200 bg-slate-100 text-slate-400'}`}>
                            {isCompleted ? <Check className="h-5 w-5 stroke-[2.5]" /> : !matchedTask ? <Lock className="h-4 w-4" /> : <span className="text-sm font-extrabold">{index + 1}</span>}
                          </div>
                          <div className={`mt-2 bg-[#FFFDF9]/95 px-3 py-1 rounded-xl shadow-[0_2px_6px_rgba(15,23,42,0.03)] border relative z-10 w-28 sm:w-36 text-center transition-colors duration-350 ${isActive ? 'border-[#FF7E21] bg-orange-50/10' : 'border-amber-200 hover:border-[#FF7E21]'}`}>
                            <h3 className="text-[10px] font-bold tracking-tight text-slate-800 truncate leading-snug" title={title}>{title}</h3>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              <div className="relative flex flex-col items-center w-full mt-6">
                <div className="relative z-10 flex flex-col items-center group">
                  <div className="absolute -inset-2 bg-gradient-to-r from-amber-400 to-[#FF7E21] rounded-full blur opacity-20 group-hover:opacity-40 transition duration-300 pointer-events-none" />
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-500 bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg transition-transform duration-300 hover:rotate-6">
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 10h20M2 14h20 M4 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
                      <path d="M10 6v4M14 6v4 M12 14v4" />
                    </svg>
                  </div>
                  <div className="mt-2.5 bg-[#FFFDF9] px-4 py-1.5 rounded-xl border border-amber-300/80 w-32 sm:w-40 text-center shadow-md">
                    <h3 className="text-[10px] font-extrabold tracking-wider text-amber-850 uppercase">Kho báu lộ trình</h3>
                    <span className="text-[8px] font-semibold text-slate-400 block mt-0.5">Hoàn thành</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3 pt-6 border-t border-amber-100 pb-16 md:pb-6">
            <button type="button" onClick={handleBackToDetail} className="inline-flex items-center gap-1.5 sm:gap-2 rounded-xl border border-slate-200 bg-white px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer">
              <ArrowLeft size={15} /> <span className="hidden sm:inline">Quay lại</span> Workspace
            </button>
            <button type="button" onClick={handleGenerate} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 transition hover:bg-slate-200 cursor-pointer border border-slate-200 shadow-sm">
              Làm mới lộ trình
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: LOCKED DETAIL PANEL */}
        {selectedStep && !isMobile && (
          <div className="hidden md:block w-full lg:w-[45%] shrink-0 h-full overflow-hidden border-l border-slate-100 bg-white transition-all duration-500 ease-in-out">
            {renderStepDetail(false)}
          </div>
        )}
      </div>

      {/* UPGRADE MODAL */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }} onClick={() => setShowUpgradeModal(false)}>
          <div className="relative w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="h-2 w-full bg-gradient-to-r from-orange-400 via-orange-500 to-amber-400" />
            <div className="px-7 pt-7 pb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 border border-orange-100"><Lock className="h-6 w-6 text-orange-500" /></div>
              <h2 className="text-xl font-extrabold text-slate-900 mb-2">Cột mốc bị khoá</h2>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">Gói <span className="font-bold text-slate-700">Miễn phí</span> chỉ mở 2 cột mốc đầu tiên. Nâng cấp lên <span className="font-bold text-orange-600">Pro</span> để mở khoá toàn bộ lộ trình học tập.</p>
              <div className="flex flex-col gap-3">
                <button onClick={() => { setShowUpgradeModal(false); navigate("/pricing"); }} className="w-full py-3 rounded-2xl text-sm font-bold text-white transition cursor-pointer" style={{ background: "linear-gradient(135deg,#EA580C,#FF6B00)" }}>Nâng cấp ngay →</button>
                <button onClick={() => setShowUpgradeModal(false)} className="w-full py-2.5 rounded-2xl text-sm font-semibold text-slate-500 hover:text-slate-700 transition cursor-pointer">Để sau</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Step Detail Sheet Modal */}
      {selectedStep && isMobile && (
        <>
          <div 
            className="fixed inset-0 z-[140] bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setSelectedStep(null)}
          />
          <div 
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[150] shadow-2xl transition-transform max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300"
          >
            <div className="sticky top-0 bg-[#FFFDF9] z-20 border-b border-slate-100 p-4 flex justify-between items-center">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">Chi tiết cột mốc</span>
              <button
                type="button"
                onClick={() => setSelectedStep(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-5 sm:p-6 bg-white">
              {renderStepDetail(true)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
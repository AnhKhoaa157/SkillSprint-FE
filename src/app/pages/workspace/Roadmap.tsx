import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import roadmapService, { RoadmapResponse, RoadmapResource, RoadmapStep } from "../../../api/roadmapService";
import calendarService, { type CalendarTaskResponse } from "../../../api/calendarService";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  CircleHelp,
  CalendarDays,
  Clock3,
  ExternalLink,
  FileText,
  Layers3,
  LoaderCircle,
  PlayCircle,
  Sparkles,
  X,
  CheckCircle2,
  Lock,
  Check,
  BookOpen,
  FileCheck,
  ArrowUpRight,
  ChevronRight,
} from "lucide-react";

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
  if (!taskDate) {
    return "";
  }

  const parsed = new Date(taskDate);
  if (Number.isNaN(parsed.getTime())) {
    return taskDate;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

function getProgressPercent(roadmapData: RoadmapResponse | null): number {
  if (!roadmapData) return 0;
  const status = (toText(roadmapData.status) || "").toUpperCase();
  if (status === "DONE") return 100;
  if (status === "GENERATING") return 60;
  const steps = roadmapData.steps || [];
  if (steps.length === 0) return 15;
  return Math.min(95, 20 + steps.length * 16);
}

function getTotalResources(roadmapData: RoadmapResponse | null): number {
  if (!roadmapData) return 0;
  const stepResources = (roadmapData.steps || []).reduce((count, step) => count + (step.resources?.length || 0), 0);
  return stepResources + (roadmapData.resources?.length || 0);
}

function formatRoadmapId(rawId: unknown): string {
  const id = toText(rawId);
  if (!id) {
    return "RM-000000";
  }

  const suffix = id.replace(/[^a-zA-Z0-9]/g, "").slice(-6).padStart(6, "0");
  return `RM-${suffix}`;
}

function buildSmoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) {
    return "";
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] ?? points[index];
    const current = points[index];
    const next = points[index + 1];
    const afterNext = points[index + 2] ?? next;

    const controlOneX = current.x + (next.x - previous.x) / 6;
    const controlOneY = current.y + (next.y - previous.y) / 6;
    const controlTwoX = next.x - (afterNext.x - current.x) / 6;
    const controlTwoY = next.y - (afterNext.y - current.y) / 6;

    path += ` C ${controlOneX} ${controlOneY}, ${controlTwoX} ${controlTwoY}, ${next.x} ${next.y}`;
  }

  return path;
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
            <path d="M58 57 C66 60, 66 65, 58 68" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M25 70 L40 45" stroke="currentColor" strokeWidth="1" />
            <polygon points="58,25 50,28 58,31" />
          </svg>
        </div>
      );
    case 2: // Kraken / Sea Monster
      return (
        <div className={positionClass}>
          <svg className="w-16 h-20 text-[#D4A373]" viewBox="0 0 100 120" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M20 100 C30 95, 40 105, 50 100 C60 95, 70 105, 80 100" />
            <path d="M25 105 C35 100, 45 110, 55 105 C65 100, 75 110, 85 105" opacity="0.5" />
            <path d="M40 100 C35 70, 20 60, 30 30 C35 15, 55 10, 60 25 C65 40, 50 55, 48 80 C47 90, 48 95, 50 100" fill="currentColor" opacity="0.25" />
            <path d="M40 100 C35 70, 20 60, 30 30 C35 15, 55 10, 60 25 C65 40, 50 55, 48 80 C47 90, 48 95, 50 100" />
            <circle cx="28" cy="45" r="2.5" fill="currentColor" />
            <circle cx="25" cy="52" r="3" fill="currentColor" />
            <circle cx="26" cy="60" r="3.5" fill="currentColor" />
            <circle cx="31" cy="68" r="4" fill="currentColor" />
            <circle cx="37" cy="76" r="4" fill="currentColor" />
            <path d="M35 95 C33 90, 31 92, 30 94" />
            <path d="M55 96 C57 92, 59 94, 60 96" />
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
            <polygon points="50,85 53,53 50,50 47,53" fill="currentColor" opacity="0.5" />
            <polygon points="85,50 53,53 50,50 53,47" fill="currentColor" opacity="0.5" />
            <polygon points="15,50 47,53 50,50 47,47" fill="currentColor" opacity="0.5" />
          </svg>
        </div>
      );
    case 4: // Waves & birds
      return (
        <div className={positionClass}>
          <svg className="w-14 h-14 text-[#D4A373]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M50 50 A10 10 0 0 0 60 40 A20 20 0 0 0 40 30 A30 30 0 0 0 70 60 A40 40 0 0 0 20 40" strokeDasharray="3,3" />
            <path d="M50 50 A5 5 0 0 1 55 45 A15 15 0 0 1 42 35 A25 25 0 0 1 65 58 A35 35 0 0 1 25 45" />
            <path d="M20 15 Q25 10, 30 15 Q35 10, 40 15" strokeWidth="1" />
            <path d="M65 20 Q70 15, 75 20 Q80 15, 85 20" strokeWidth="1" />
          </svg>
        </div>
      );
    case 5: // Desert Island
      return (
        <div className={positionClass}>
          <svg className="w-16 h-16 text-[#D4A373]" viewBox="0 0 100 100" fill="currentColor">
            <path d="M10 85 C30 80, 70 80, 90 85" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M20 82 C30 70, 70 70, 80 82 Z" />
            <path d="M45 75 Q40 55, 35 40 L39 39 Q44 55, 49 75 Z" />
            <path d="M54 75 Q58 60, 62 48 L66 49 Q62 60, 58 75 Z" opacity="0.8" />
            <path d="M35 40 Q20 38, 18 45 C23 45, 30 43, 35 40 Z" opacity="0.9" />
            <path d="M35 40 Q25 28, 22 25 C28 28, 32 34, 35 40 Z" opacity="0.9" />
            <path d="M35 40 Q45 28, 48 26 C45 32, 40 36, 35 40 Z" opacity="0.9" />
            <path d="M35 40 Q50 42, 52 48 C46 46, 40 43, 35 40 Z" opacity="0.9" />
            <path d="M62 48 Q52 40, 50 44 C54 45, 58 46, 62 48 Z" opacity="0.75" />
            <path d="M62 48 Q60 32, 62 30 C64 35, 64 42, 62 48 Z" opacity="0.75" />
            <path d="M62 48 Q72 38, 75 40 C70 43, 66 46, 62 48 Z" opacity="0.75" />
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
  const [loading, setLoading] = useState(!navigationRoadmap);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStep, setSelectedStep] = useState<RoadmapStep | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [detailTab, setDetailTab] = useState<"overview" | "resources">("overview");

  useEffect(() => {
    setDetailTab("overview");
  }, [selectedStep]);

  const steps = roadmapData?.steps || [];
  const resources = roadmapData?.resources || [];
  const totalResources = useMemo(() => getTotalResources(roadmapData), [roadmapData]);
  const progressPercent = useMemo(() => getProgressPercent(roadmapData), [roadmapData]);
  const roadmapTitle = toText(roadmapData?.title) || "Roadmap học tập";
  const roadmapDescription = toText(roadmapData?.description) || "Lộ trình học tập theo workspace đã xác nhận.";

  useEffect(() => {
    let mounted = true;

    const loadRoadmapAndTasks = async () => {
      if (!workspaceId) {
        if (mounted) {
          setRoadmapData(null);
          setTasks([]);
          setError("Không tìm thấy workspace");
          setLoading(false);
        }
        return;
      }

      if (!roadmapData) setLoading(true);
      setError(null);

      try {
        const [roadmapResult, taskResult] = await Promise.allSettled([
          roadmapService.getRoadmap(workspaceId),
          calendarService.getCalendarTasks(workspaceId),
        ]);

        if (!mounted) return;

        if (roadmapResult.status === "fulfilled") {
          setRoadmapData(roadmapResult.value);
        } else {
          setRoadmapData(null);
          setError(roadmapResult.reason?.message || "Không thể tải lộ trình");
        }

        if (taskResult.status === "fulfilled") {
          setTasks(taskResult.value || []);
        } else {
          setTasks([]);
        }
        // No auto-select — roadmap starts perfectly centered
      } catch (err: any) {
        if (!mounted) return;
        setRoadmapData(null);
        setTasks([]);
        setError(err?.message || "Không thể tải lộ trình");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadRoadmapAndTasks();
    return () => { mounted = false; };
  }, [workspaceId]);

  const handleGenerate = async () => {
    if (!workspaceId) return;
    setGenerating(true);
    setError(null);

    try {
      const data = await roadmapService.generateRoadmap(workspaceId);
      setRoadmapData(data);
      // No auto-select on generate either, keep centered
    } catch (err: any) {
      setError(err?.message || "Không thể khởi tạo lộ trình");
    } finally {
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
    if (!selectedStep) {
      console.warn("handleStartLearning called but no step selected");
      return;
    }

    const matchedTask = tasks.find((task) => task.roadmapStepId === getStepKey(selectedStep));

    if (matchedTask?.taskId) {
      navigate(`/app/learning/course?taskId=${matchedTask.taskId}`);
    } else {
      console.warn("Missing taskId on selected step:", selectedStep);
      // Fallback: try to navigate with step info anyway
      console.warn("Matched task:", matchedTask);
    }
  };

  /* ==================================================================
     RIGHT PANEL: Step detail with close button
     ================================================================== */
  const renderStepDetail = () => {
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

    // Button is always enabled when there's a matched task; date gating is handled inside CoursePlayer
    const canStart = Boolean(matchedTask);

    // Placeholder for step completion percentage
    const stepCompletionPercent = Math.min(100, 20 + idx * 15);

    return (
      <div className="h-full flex flex-col bg-white border-l border-slate-100 shadow-[0_-8px_24px_rgba(15,23,42,0.03)] z-20 relative">
        {/* Detail Panel Header */}
        <div className="px-6 pt-5 bg-white shrink-0">
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
            <button
              type="button"
              onClick={() => setSelectedStep(null)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:border-slate-350 hover:bg-slate-50 transition shadow-sm"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-4 mt-5 border-b border-slate-100 text-xs">
            <button
              type="button"
              onClick={() => setDetailTab("overview")}
              className={`pb-2.5 px-1 transition-all font-bold border-b-2 ${
                detailTab === "overview"
                  ? "border-[#FF7E21] text-[#FF7E21]"
                  : "border-transparent text-slate-500 hover:text-slate-850"
              }`}
            >
              Tổng quan
            </button>
            <button
              type="button"
              onClick={() => setDetailTab("resources")}
              className={`pb-2.5 px-1 transition-all font-bold border-b-2 flex items-center gap-1.5 ${
                detailTab === "resources"
                  ? "border-[#FF7E21] text-[#FF7E21]"
                  : "border-transparent text-slate-500 hover:text-slate-850"
              }`}
            >
              <span>Tài nguyên học</span>
              <span className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                detailTab === "resources" ? "bg-orange-50 text-[#FF7E21]" : "bg-slate-100 text-slate-600"
              }`}>
                {stepResources.length}
              </span>
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white">
          {detailTab === "overview" ? (
            <div className="space-y-6">
              {/* Journey details grid */}
              <div className="border-b border-slate-100 pb-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Duration */}
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

                  {/* Complexity */}
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

                {/* Personal Study Schedule */}
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
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-100">
                      Đang mở
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[9px] font-bold text-slate-400 border border-slate-200/30">
                      Chờ lên lịch
                    </span>
                  )}
                </div>
              </div>

              {/* Module Progress */}
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

              {/* Summary / Description - Redesigned to highlight the objectives */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#FF7E21] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF7E21]" />
                  Mục tiêu bài học
                </h4>
                <div className="border-l-4 border-[#FF7E21] bg-orange-50/20 p-4 rounded-r-xl shadow-sm border-r border-t border-b border-orange-100/30">
                  <p className="text-xs text-slate-700 leading-relaxed font-semibold whitespace-pre-line">
                    {stepSummary}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileCheck className="h-4.5 w-4.5 text-[#FF7E21]" />
                Tài nguyên học tập chính thức
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
                        onClick={(e) => {
                          if (!hasUrl) {
                            e.preventDefault();
                          }
                        }}
                        className={`group flex items-start gap-3.5 rounded-xl border border-slate-200/80 bg-white p-4 transition-all duration-200 ${
                          hasUrl 
                            ? 'hover:border-orange-200 hover:shadow-[0_4px_16px_rgba(255,126,33,0.04)] cursor-pointer' 
                            : 'cursor-default'
                        }`}
                      >
                        <div className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-650 border border-slate-100 shadow-inner group-hover:bg-orange-50 group-hover:text-[#FF7E21] group-hover:border-orange-100/50 transition-colors">
                          <ResourceIcon className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-500 border border-slate-200/30">
                              {meta.label}
                            </span>
                            {hasUrl && (
                              <span className="text-[8px] font-bold text-[#FF7E21] bg-orange-50 border border-orange-100/50 px-1.5 py-0.5 rounded">
                                Lớp học trực tuyến
                              </span>
                            )}
                          </div>
                          <h5 className="text-xs font-bold text-slate-900 mt-1.5 leading-snug group-hover:text-[#FF7E21] transition-colors">
                            {toText(resource.title) || "Tài nguyên học tập"}
                          </h5>
                          {/* Display resource description underneath resource title if present */}
                          {toText(resource.description) && (
                            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed break-words">
                              {toText(resource.description)}
                            </p>
                          )}
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

        {/* Floating Action Footer */}
        <div className="border-t border-slate-100 p-4 bg-white shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.015)]">
          <button
            disabled={!canStart || isStarting}
            onClick={handleStartLearning}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 flex justify-center items-center gap-1.5 ${
              canStart && !isStarting
                ? "bg-[#FF7E21] text-white hover:bg-[#E05E00] shadow-sm hover:shadow shadow-orange-100 cursor-pointer"
                : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/50"
            }`}
          >
            {isStarting ? (
              <>
                <LoaderCircle className="h-4.5 w-4.5 animate-spin" />
                Đang khởi tạo...
              </>
            ) : canStart ? (
              <>
                <span>Bắt đầu học ngay</span>
                <ChevronRight className="h-4 w-4" />
              </>
            ) : (
              <>
                <span>Chưa đến ngày học</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  /* ---- Skeleton loading ---- */
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-2rem)] rounded-[2rem] bg-[radial-gradient(circle_at_top_left,_rgba(255,107,0,0.10),_transparent_30%),linear-gradient(180deg,_#F8FAFC_0%,_#F1F5F9_100%)] px-6 py-8 text-slate-900 lg:px-10">
        <div className="h-[calc(100vh-120px)] overflow-hidden flex">
          <div className="w-full lg:w-[65%] h-full overflow-y-auto pr-4 custom-scrollbar">
            <div className="mb-6 rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur lg:p-7">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#FFF7ED] px-3 py-1 text-xs font-semibold text-[#FF6B00] border border-[#FFEDD5]">
                    <Sparkles className="h-4 w-4" />
                    AI Roadmap
                  </div>
                  <div className="mt-4 h-10 w-72 animate-pulse rounded-2xl bg-slate-100" />
                  <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded-full bg-slate-100" />
                </div>
                <div className="grid min-w-[260px] gap-3 sm:grid-cols-3">
                  <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
                  <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
                  <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
                </div>
              </div>
              <div className="mt-5 h-2.5 animate-pulse rounded-full bg-slate-100" />
            </div>
            {/* Skeleton gamified nodes */}
            <div className="relative py-6">
              <div className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 bg-gradient-to-b from-[#FFEDD5] via-slate-200 to-transparent rounded-full" />
              {[1, 2, 3].map((i) => (
                <div key={i} className={`relative flex items-center mb-14 ${i % 2 === 1 ? "justify-start pl-4 md:pl-20" : "justify-end pr-4 md:pr-20"}`}>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 animate-pulse rounded-full bg-slate-200" />
                    <div className="h-12 w-40 animate-pulse rounded-2xl bg-white border border-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Skeleton for right panel if it were open */}
          {selectedStep && (
            <div className="w-full lg:w-[35%] shrink-0 h-full border-l border-slate-100 bg-white p-6 animate-pulse">
              <div className="h-6 w-3/4 rounded-xl bg-slate-100 mb-4" />
              <div className="h-3 w-full rounded bg-slate-100 mb-2" />
              <div className="h-3 w-5/6 rounded bg-slate-100 mb-4" />
              <div className="space-y-3">
                <div className="h-16 w-full rounded-xl bg-slate-100" />
                <div className="h-16 w-full rounded-xl bg-slate-100" />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ---- Error state ---- */
  if (error && !roadmapData) {
    return (
      <div className="min-h-[calc(100vh-2rem)] rounded-[2rem] bg-[radial-gradient(circle_at_top_left,_rgba(255,107,0,0.10),_transparent_30%),linear-gradient(180deg,_#F8FAFC_0%,_#F1F5F9_100%)] px-6 py-8 text-slate-900 lg:px-10">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
          <div className="w-full rounded-[2rem] border border-rose-200 bg-white p-8 text-center shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <BookOpenCheck className="h-8 w-8" />
            </div>
            <h1 className="mt-5 text-2xl font-bold text-slate-900">Không thể tải lộ trình</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">{error}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button type="button" onClick={handleBackToDetail} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                <ArrowLeft size={16} /> Quay lại
              </button>
              <button type="button" onClick={handleGenerate} disabled={generating} className="inline-flex items-center gap-2 rounded-xl bg-[#FF6B00] px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-[#E05E00] disabled:opacity-50">
                {generating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles size={16} />}
                {generating ? "Đang khởi tạo..." : "Thử tạo lại roadmap"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---- Pending / Generating state ---- */
  if (!roadmapData || roadmapData.status === "PENDING" || roadmapData.status === "GENERATING") {
    return (
      <div className="min-h-[calc(100vh-2rem)] rounded-[2rem] bg-[radial-gradient(circle_at_top_left,_rgba(255,107,0,0.10),_transparent_30%),linear-gradient(180deg,_#F8FAFC_0%,_#F1F5F9_100%)] px-6 py-8 text-slate-900 lg:px-10">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
          <div className="w-full rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-[#FFF7ED] text-[#FF6B00] border border-[#FFEDD5]">
              <Layers3 className="h-9 w-9" />
            </div>
            <h1 className="mt-5 text-2xl font-bold text-slate-900">No roadmap generated</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Workspace này chưa có roadmap được tạo hoặc roadmap đang chờ khởi tạo từ cấu trúc học tập đã xác nhận.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button type="button" onClick={handleBackToDetail} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                <ArrowLeft size={16} /> Quay lại
              </button>
              <button type="button" onClick={handleGenerate} disabled={generating} className="inline-flex items-center gap-2 rounded-xl bg-[#FF6B00] px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-[#E05E00] disabled:opacity-50">
                {generating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles size={16} />}
                {generating ? "Đang khởi tạo lộ trình..." : "Tạo roadmap"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ====================================================================
     MAIN RENDER: Gamified Curved Path with Independent Scrolling
     ==================================================================== */
  return (
    <div
      className="min-h-[calc(100vh-2rem)] rounded-[2rem] px-6 py-8 text-slate-900 lg:px-10 border border-[#EEDCC5]/70 shadow-[0_16px_40px_rgba(212,163,115,0.06)] relative overflow-hidden"
      style={{
        backgroundColor: "#FDFBF7",
        backgroundImage: `
          radial-gradient(#E8D8C8 1px, transparent 1px),
          linear-gradient(rgba(212, 163, 115, 0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(212, 163, 115, 0.04) 1px, transparent 1px)
        `,
        backgroundSize: "20px 20px, 40px 40px, 40px 40px",
        backgroundPosition: "center",
      }}
    >
      {/* Antique Map Borders */}
      <div className="absolute inset-1.5 border border-[#EEDCC5]/40 pointer-events-none rounded-[1.8rem] z-0" />
      <div className="absolute inset-3 border border-dashed border-[#EEDCC5]/30 pointer-events-none rounded-[1.6rem] z-0" />

      {/* Latitude/Longitude coordinate markings along borders */}
      {/* Left Side */}
      <div className="absolute left-2 top-[15%] -translate-y-1/2 font-mono text-[9px] font-bold text-[#D4A373]/60 rotate-90 origin-left pointer-events-none select-none z-0">12° 24' N</div>
      <div className="absolute left-2 top-[35%] -translate-y-1/2 font-mono text-[9px] font-bold text-[#D4A373]/60 rotate-90 origin-left pointer-events-none select-none z-0">12° 25' N</div>
      <div className="absolute left-2 top-[55%] -translate-y-1/2 font-mono text-[9px] font-bold text-[#D4A373]/60 rotate-90 origin-left pointer-events-none select-none z-0">12° 26' N</div>
      <div className="absolute left-2 top-[75%] -translate-y-1/2 font-mono text-[9px] font-bold text-[#D4A373]/60 rotate-90 origin-left pointer-events-none select-none z-0">12° 27' N</div>
      <div className="absolute left-2 top-[95%] -translate-y-1/2 font-mono text-[9px] font-bold text-[#D4A373]/60 rotate-90 origin-left pointer-events-none select-none z-0">12° 28' N</div>

      {/* Top Side */}
      <div className="absolute top-2 left-[15%] -translate-x-1/2 font-mono text-[9px] font-bold text-[#D4A373]/60 pointer-events-none select-none z-0">45° 12' W</div>
      <div className="absolute top-2 left-[35%] -translate-x-1/2 font-mono text-[9px] font-bold text-[#D4A373]/60 pointer-events-none select-none z-0">45° 13' W</div>
      <div className="absolute top-2 left-[55%] -translate-x-1/2 font-mono text-[9px] font-bold text-[#D4A373]/60 pointer-events-none select-none z-0">45° 14' W</div>
      <div className="absolute top-2 left-[75%] -translate-x-1/2 font-mono text-[9px] font-bold text-[#D4A373]/60 pointer-events-none select-none z-0">45° 15' W</div>
      <div className="absolute top-2 left-[95%] -translate-x-1/2 font-mono text-[9px] font-bold text-[#D4A373]/60 pointer-events-none select-none z-0">45° 16' W</div>

      {/* Right Side */}
      <div className="absolute right-2 top-[15%] -translate-y-1/2 font-mono text-[9px] font-bold text-[#D4A373]/60 -rotate-90 origin-right pointer-events-none select-none z-0">34° 08' E</div>
      <div className="absolute right-2 top-[35%] -translate-y-1/2 font-mono text-[9px] font-bold text-[#D4A373]/60 -rotate-90 origin-right pointer-events-none select-none z-0">34° 09' E</div>
      <div className="absolute right-2 top-[55%] -translate-y-1/2 font-mono text-[9px] font-bold text-[#D4A373]/60 -rotate-90 origin-right pointer-events-none select-none z-0">34° 10' E</div>
      <div className="absolute right-2 top-[75%] -translate-y-1/2 font-mono text-[9px] font-bold text-[#D4A373]/60 -rotate-90 origin-right pointer-events-none select-none z-0">34° 11' E</div>
      <div className="absolute right-2 top-[95%] -translate-y-1/2 font-mono text-[9px] font-bold text-[#D4A373]/60 -rotate-90 origin-right pointer-events-none select-none z-0">34° 12' E</div>

      {/* Bottom Side */}
      <div className="absolute bottom-2 left-[15%] -translate-x-1/2 font-mono text-[9px] font-bold text-[#D4A373]/60 pointer-events-none select-none z-0">108° 42' W</div>
      <div className="absolute bottom-2 left-[35%] -translate-x-1/2 font-mono text-[9px] font-bold text-[#D4A373]/60 pointer-events-none select-none z-0">108° 43' W</div>
      <div className="absolute bottom-2 left-[55%] -translate-x-1/2 font-mono text-[9px] font-bold text-[#D4A373]/60 pointer-events-none select-none z-0">108° 44' W</div>
      <div className="absolute bottom-2 left-[75%] -translate-x-1/2 font-mono text-[9px] font-bold text-[#D4A373]/60 pointer-events-none select-none z-0">108° 45' W</div>
      <div className="absolute bottom-2 left-[95%] -translate-x-1/2 font-mono text-[9px] font-bold text-[#D4A373]/60 pointer-events-none select-none z-0">108° 46' W</div>

      {/* Starting Compass Rose Landmark on the map */}
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

      {/* Muted Mountains Landmark */}
      <div className="absolute top-[40%] right-[6%] opacity-15 pointer-events-none select-none">
        <svg className="w-20 h-16 text-[#D4A373]" viewBox="0 0 100 80" fill="currentColor">
          <polygon points="30,80 50,40 70,80" />
          <polygon points="10,80 35,30 60,80" />
          <polygon points="50,80 70,50 90,80" />
        </svg>
      </div>

      {/* Wavy Island Landmark */}
      <div className="absolute top-[70%] left-[6%] opacity-15 pointer-events-none select-none">
        <svg className="w-24 h-16 text-[#D4A373]" viewBox="0 0 120 80" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M10 50 Q30 30, 50 45 T90 40 T110 50" strokeDasharray="2,2" />
          <path d="M20 55 Q40 45, 60 55 T100 50" />
          <path d="M45 42 L48 30 L55 35 Z" fill="currentColor" opacity="0.4" />
        </svg>
      </div>

      <div className={`h-[calc(100vh-120px)] flex items-start overflow-hidden px-4 transition-all duration-700 ease-in-out ${selectedStep ? 'justify-start gap-0 lg:gap-8' : 'justify-center'}`}>
        {/* ==================== LEFT COLUMN: ROADMAP PATH ==================== */}
        <div
          className={`h-full overflow-y-auto custom-scrollbar px-2 transition-all duration-700 ease-in-out flex-shrink-0 relative z-10 ${
            selectedStep ? "w-full lg:w-[55%]" : "w-full max-w-3xl"
          }`}
        >
          {/* Hero Header: Redesigned as a Premium Map Legend Card */}
          <section className="mb-6 rounded-2xl border border-amber-200 bg-[#FFFDF9]/95 p-5 shadow-[0_12px_32px_rgba(212,163,115,0.12)] backdrop-blur relative overflow-hidden">
            {/* Corner Decorative seal pattern */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-orange-100/40 to-transparent pointer-events-none rounded-bl-full border-l border-b border-orange-100/20" />
            
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between relative z-10">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-[#FF7E21] border border-orange-200/50 uppercase tracking-wider shadow-sm shadow-orange-500/5">
                  <Sparkles className="h-3.5 w-3.5 text-[#FF7E21]" />
                  Bản đồ hành trình AI
                </div>
                <h1 className="mt-3.5 text-xl font-extrabold tracking-tight text-slate-800 sm:text-2xl leading-snug">{roadmapTitle}</h1>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                  {roadmapDescription} Mã bản đồ: <span className="font-extrabold text-orange-850 bg-orange-50 px-2 py-0.5 rounded border border-orange-100/50">{formatRoadmapId(roadmapData?.id || workspaceId)}</span>.
                </p>
              </div>
              <div className="grid gap-2 grid-cols-3 shrink-0">
                <div className="rounded-xl border border-amber-200/60 bg-[#FDFBF7] px-3 py-2 text-center min-w-[85px] shadow-sm">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Trạng thái</div>
                  <div className="mt-1 text-xs font-extrabold text-slate-700">{(roadmapData.status || "ACTIVE").toUpperCase()}</div>
                </div>
                <div className="rounded-xl border border-amber-200/60 bg-[#FDFBF7] px-3 py-2 text-center min-w-[85px] shadow-sm">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Cột mốc</div>
                  <div className="mt-1 text-xs font-extrabold text-slate-700">{steps.length}</div>
                </div>
                <div className="rounded-xl border border-amber-200/60 bg-[#FDFBF7] px-3 py-2 text-center min-w-[85px] shadow-sm">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Tài nguyên</div>
                  <div className="mt-1 text-xs font-extrabold text-slate-700">{totalResources}</div>
                </div>
              </div>
            </div>
            
            {/* Progress line */}
            <div className="mt-5 pt-4 border-t border-amber-100/50">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                <span>Tiến trình hoàn thành</span>
                <span className="text-[#FF7E21]">{progressPercent}%</span>
              </div>
              <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-100 border border-slate-200/40 shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-[#FF7E21] transition-all duration-500 shadow-[0_0_8px_rgba(255,107,0,0.4)]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </section>

          {/* Treasure Trail Curved Roadmap Path */}
          <div className="relative py-12 flex flex-col items-center gap-14 select-none">
            {steps.map((step, index) => {
              const isLast = index === steps.length - 1;
              const isActive = selectedStep?.id === step.id;
              const stepId = getStepKey(step) || `step-${index}`;
              const title = toText(step.title) || `Cột mốc ${index + 1}`;
              const matchedTask = tasks.find((task) => task.roadmapStepId === stepId);
              const isCompleted = matchedTask?.status?.toUpperCase() === "COMPLETED" || matchedTask?.status?.toUpperCase() === "DONE";

              const X_curr = xOffsets[index % 10];
              const X_next = xOffsets[(index + 1) % 10];

              return (
                <div key={stepId} className="relative w-full h-28 flex items-center justify-center">
                  {/* Decorative Map Illustrations */}
                  {renderMapDecoration(index, X_curr)}

                  {/* Connector SVG path */}
                  <div className="absolute top-1/2 left-0 w-full h-[calc(100%+3.5rem)] z-0 pointer-events-none">
                    <svg
                      className="w-full h-full text-[#D4A373]/50"
                      preserveAspectRatio="none"
                      viewBox="0 0 100 100"
                    >
                      <path
                        d={
                          isLast
                            ? `M ${X_curr} 0 C ${X_curr} 50, 50 50, 50 100`
                            : `M ${X_curr} 0 C ${X_curr} 50, ${X_next} 50, ${X_next} 100`
                        }
                        stroke="currentColor"
                        strokeWidth="3.5"
                        strokeDasharray="6,6"
                        strokeLinecap="round"
                        fill="none"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                  </div>

                  {/* Curvy Trail Node Button centered at X_curr */}
                  <div
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-10 top-1/2 flex flex-col items-center"
                    style={{ left: `${X_curr}%` }}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedStep(step)}
                      className="flex flex-col items-center transition-all duration-300 hover:scale-105 focus:outline-none"
                    >
                      {/* Circle Node bubble */}
                      <div className={`flex h-14 w-14 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                        isActive
                          ? 'border-[#FF7E21] bg-[#FF7E21] text-white shadow-lg shadow-orange-500/20 ring-4 ring-orange-100'
                          : isCompleted
                          ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm ring-4 ring-emerald-50'
                          : matchedTask
                          ? 'border-[#D4A373] bg-white text-slate-700 shadow-sm hover:border-[#FF7E21] hover:text-[#FF7E21]'
                          : 'border-slate-200 bg-slate-100 text-slate-400'
                      }`}>
                        {isCompleted ? (
                          <Check className="h-5 w-5 stroke-[2.5]" />
                        ) : !matchedTask ? (
                          <Lock className="h-4 w-4" />
                        ) : (
                          <span className="text-sm font-extrabold">{index + 1}</span>
                        )}
                      </div>

                      {/* Small Label underneath circle */}
                      <div className={`mt-2 bg-[#FFFDF9]/95 px-3 py-1 rounded-xl shadow-[0_2px_6px_rgba(15,23,42,0.03)] border relative z-10 w-28 sm:w-36 text-center transition-colors duration-350 ${
                        isActive ? 'border-[#FF7E21] bg-orange-50/10' : 'border-amber-200 hover:border-[#FF7E21]'
                      }`}>
                        <h3 className="text-[10px] font-bold tracking-tight text-slate-800 truncate leading-snug" title={title}>
                          {title}
                        </h3>
                      </div>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Final Wavy Map Trail Hoàn thành node with Glowing Gold Treasure Chest */}
            <div className="relative flex flex-col items-center w-full mt-6">
              <div className="relative z-10 flex flex-col items-center group">
                {/* Glow background */}
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

          {/* Shared resources */}
          {resources.length > 0 && (
            <section className="mt-6 rounded-[2rem] border border-amber-200/60 bg-[#FFFDF9]/95 p-5 shadow-[0_18px_50px_rgba(212,163,115,0.04)]">
              <div className="mb-3.5 flex items-center gap-2 text-sm font-bold text-slate-800">
                <ExternalLink className="h-4.5 w-4.5 text-[#FF7E21]" />
                Nguồn tài nguyên học tập chung
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {resources.map((resource, index) => {
                  const meta = getResourceMeta(resource);
                  const ResourceIcon = meta.icon;

                  return (
                    <a
                      key={`shared-${index}-${toText(resource.title) || "resource"}`}
                      href={toText(resource.url) || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="group rounded-xl border border-amber-200 bg-[#FDFBF7] p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-350 hover:bg-white hover:shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50/50 text-[#FF7E21] border border-orange-100/50 shadow-sm mt-0.5">
                          <ResourceIcon className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">{meta.label}</div>
                          <h5 className="text-sm font-bold text-slate-900 mt-1 truncate leading-snug group-hover:text-[#FF7E21] transition-colors">
                            {toText(resource.title) || "Tài nguyên học tập"}
                          </h5>
                          {toText(resource.description) && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-1 leading-normal">
                              {toText(resource.description)}
                            </p>
                          )}
                          <div className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-semibold text-white transition hover:bg-[#FF7E21]">
                            {meta.action}
                            <ArrowRight className="h-3 w-3" />
                          </div>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            </section>
          )}

          {/* Footer */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleBackToDetail}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft size={16} />
              Quay lại
            </button>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 shadow-sm">
              <LoaderCircle className="h-4 w-4 text-[#FF7E21]" />
              {roadmapData.updatedAt ? `Cập nhật: ${new Date(roadmapData.updatedAt).toLocaleString("vi-VN")}` : "Đã sẵn sàng"}
            </div>
          </div>
        </div>

        {/* ==================== RIGHT COLUMN: LOCKED DETAIL PANEL ==================== */}
        {selectedStep && (
          <div className="w-full lg:w-[45%] shrink-0 h-full overflow-y-auto custom-scrollbar border-l border-slate-100 bg-white transition-all duration-500 ease-in-out">
            {renderStepDetail()}
          </div>
        )}
      </div>
    </div>
  );
}
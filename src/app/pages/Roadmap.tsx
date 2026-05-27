import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import roadmapService, { RoadmapResponse, RoadmapResource, RoadmapStep } from "../../api/roadmapService";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  CircleHelp,
  Clock3,
  ExternalLink,
  FileText,
  Layers3,
  LoaderCircle,
  PlayCircle,
  Sparkles,
  X,
  CheckCircle2,
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
      label: "Video",
      action: "Học ngay",
      tone: "bg-sky-50 text-sky-700 border-sky-200",
    };
  }

  if (type.includes("quiz") || type.includes("test") || type.includes("exercise") || type.includes("practice")) {
    return {
      icon: CircleHelp,
      label: "Quiz",
      action: "Làm bài",
      tone: "bg-amber-50 text-amber-700 border-amber-200",
    };
  }

  return {
    icon: FileText,
    label: "Tài liệu",
    action: "Xem tài liệu",
    tone: "bg-slate-50 text-slate-700 border-slate-200",
  };
}

function getStepTone(step: RoadmapStep, index: number, totalSteps: number): StepTone {
  const difficulty = toText(step.difficulty) || toText(step.complexity) || (index === 0 ? "easy" : index === totalSteps - 1 ? "hard" : "medium");
  const normalized = difficulty.toLowerCase();

  if (normalized.includes("hard") || normalized.includes("advanced") || normalized.includes("high")) {
    return {
      label: "Hard",
      bgClass: "from-red-500 to-rose-500",
      borderClass: "border-red-400",
      dotClass: "border-red-200 text-red-600",
    };
  }

  if (normalized.includes("medium") || normalized.includes("intermediate")) {
    return {
      label: "Medium",
      bgClass: "from-orange-500 to-amber-500",
      borderClass: "border-orange-400",
      dotClass: "border-orange-200 text-orange-600",
    };
  }

  return {
    label: "Easy",
    bgClass: "from-emerald-500 to-teal-500",
    borderClass: "border-emerald-400",
    dotClass: "border-emerald-200 text-emerald-600",
  };
}

function getStepDurationMinutes(step: RoadmapStep): number | null {
  const value = toNumber(step.durationMinutes) ?? toNumber(step.duration) ?? toNumber(step.minutes);
  return typeof value === "number" ? value : null;
}

function getStepSummary(step: RoadmapStep): string {
  return toText(step.description) || toText(step.summary) || "Nội dung đang được chuẩn hoá từ cấu trúc đã xác nhận.";
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

export default function Roadmap() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const navigationRoadmap = (location.state as { roadmap?: RoadmapResponse } | null)?.roadmap ?? null;
  const [roadmapData, setRoadmapData] = useState<RoadmapResponse | null>(navigationRoadmap);
  const [loading, setLoading] = useState(!navigationRoadmap);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStep, setSelectedStep] = useState<RoadmapStep | null>(null);

  const steps = roadmapData?.steps || [];
  const resources = roadmapData?.resources || [];
  const totalResources = useMemo(() => getTotalResources(roadmapData), [roadmapData]);
  const progressPercent = useMemo(() => getProgressPercent(roadmapData), [roadmapData]);
  const roadmapTitle = toText(roadmapData?.title) || "Roadmap học tập";
  const roadmapDescription = toText(roadmapData?.description) || "Lộ trình học tập theo workspace đã xác nhận.";

  useEffect(() => {
    let mounted = true;

    const loadRoadmap = async () => {
      if (!workspaceId) {
        if (mounted) {
          setRoadmapData(null);
          setError("Không tìm thấy workspace");
          setLoading(false);
        }
        return;
      }

      if (!roadmapData) setLoading(true);
      setError(null);

      try {
        const data = await roadmapService.getRoadmap(workspaceId);
        if (!mounted) return;
        setRoadmapData(data);
        // No auto-select — roadmap starts perfectly centered
      } catch (err: any) {
        if (!mounted) return;
        setRoadmapData(null);
        setError(err?.message || "Không thể tải lộ trình");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadRoadmap();
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

    // Placeholder for step completion percentage
    const stepCompletionPercent = Math.min(100, 20 + idx * 15);

    return (
      <div className="h-full flex flex-col p-6">
        {/* Panel header with close button */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
              <Layers3 className="h-6 w-6" /> {/* Placeholder icon */}
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900 break-words">
                {toText(step.title) || `Learning Module ${idx + 1}`}
              </h2>
              <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                <Clock3 className="h-4 w-4 text-orange-500 shrink-0" />
                <span>{durationMinutes ? `${durationMinutes} phút` : "Tự điều chỉnh"}</span>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] ${tone.dotClass}`}>
                  <Layers3 className="h-3 w-3" />
                  {tone.label}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedStep(null)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress bar for the selected step */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            <span>Tiến độ module</span>
            <span>{stepCompletionPercent}%</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-orange-500 to-red-500 transition-all duration-500"
              style={{ width: `${stepCompletionPercent}%` }}
            />
          </div>
        </div>

        {/* Scrollable body: description + resources */}
        <div className="flex-1 overflow-y-auto custom-scrollbar text-xs text-slate-600 leading-relaxed space-y-4">
          <p className="text-sm text-slate-700 leading-[1.7]">
            {stepSummary}
          </p>

          {/* Topics (placeholder for now, assuming topics are part of step.resources or a separate field) */}
          {/* For now, I'll just list resources as topics */}
          {stepResources.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <FileText className="h-4 w-4 text-orange-500" />
                Các chủ đề & Tài nguyên
              </div>
              <div className="grid gap-3">
                {stepResources.map((resource, resourceIndex) => {
                  const meta = getResourceMeta(resource);
                  const ResourceIcon = meta.icon;

                  return (
                    <a
                      key={`panel-${step.id}-${resourceIndex}-${toText(resource.title) || "res"}`}
                      href={toText(resource.url) || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className={`group flex items-center gap-3 rounded-xl border px-4 py-3 transition hover:shadow-sm ${meta.tone}`}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-sm">
                        <ResourceIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em] text-slate-500">
                            {meta.label}
                          </span>
                          <span className="truncate text-sm font-semibold text-slate-900">
                            {toText(resource.title) || "Tài nguyên"}
                          </span>
                        </div>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition group-hover:bg-slate-900 group-hover:text-white">
                        {meta.action}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {stepResources.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center">
              <FileText className="mx-auto h-6 w-6 text-slate-300" />
              <p className="mt-1 text-xs text-slate-400">Chưa có tài liệu cho module này.</p>
            </div>
          )}
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
                  <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
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
              <div className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 bg-gradient-to-b from-orange-200 via-slate-200 to-transparent rounded-full" />
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
              <button type="button" onClick={handleGenerate} disabled={generating} className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-orange-700 disabled:opacity-50">
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
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-orange-50 text-orange-500">
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
              <button type="button" onClick={handleGenerate} disabled={generating} className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-orange-700 disabled:opacity-50">
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
    <div className="min-h-[calc(100vh-2rem)] rounded-[2rem] bg-[radial-gradient(circle_at_top_left,_rgba(255,107,0,0.10),_transparent_30%),linear-gradient(180deg,_#F8FAFC_0%,_#F1F5F9_100%)] px-6 py-8 text-slate-900 lg:px-10">
      <div className="h-[calc(100vh-120px)] overflow-hidden flex transition-all duration-500 ease-in-out">
        {/* ==================== LEFT COLUMN: ROADMAP PATH ==================== */}
        <div
          className={`h-full overflow-y-auto custom-scrollbar pr-4 transition-all duration-500 ease-in-out ${
            selectedStep ? "w-full lg:w-[65%]" : "w-full max-w-4xl mx-auto"
          }`}
        >
          {/* Hero Header */}
          <section className="mb-6 rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur lg:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                  <Sparkles className="h-4 w-4" />
                  AI Roadmap
                </div>
                <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{roadmapTitle}</h1>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {roadmapDescription} <span className="font-semibold text-slate-700">{formatRoadmapId(roadmapData?.id || workspaceId)}</span>.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Trạng thái</div>
                  <div className="mt-0.5 text-sm font-semibold text-slate-800">{(roadmapData.status || "DONE").toUpperCase()}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Bước học</div>
                  <div className="mt-0.5 text-sm font-semibold text-slate-800">{steps.length}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Tài nguyên</div>
                  <div className="mt-0.5 text-sm font-semibold text-slate-800">{totalResources}</div>
                </div>
              </div>
            </div>
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                <span>Tiến độ</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-orange-500 to-red-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </section>

          {/* Gamified curved roadmap */}
          <div className="relative py-6">
            {/* SVG for curved path and nodes */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 2000" preserveAspectRatio="xMidYMin slice">
              {/* Placeholder for curved path - will draw a simple line for now */}
              {steps.map((step, index) => {
                if (index === 0) return null;
                const prevStep = steps[index - 1];
                // These coordinates are highly simplified and will need dynamic calculation
                // For now, just drawing a vertical line between conceptual points
                const startX = 500; // Center of the SVG
                const startY = (index - 1) * 150 + 100; // Approximate Y for previous step
                const endX = 500; // Center of the SVG
                const endY = index * 150 + 100; // Approximate Y for current step

                return (
                  <path
                    key={`path-${index}`}
                    d={`M ${startX} ${startY} L ${endX} ${endY}`}
                    stroke="#FFB74D"
                    strokeWidth="4"
                    fill="none"
                    className="opacity-50"
                  />
                );
              })}
            </svg>

            <div className="relative z-10">
              {steps.map((step, index) => {
                const tone = getStepTone(step, index, steps.length);
                const isActive = selectedStep?.id === step.id;
                const stepId = toText(step.id) || `step-${index}`;
                const isLeft = index % 2 === 0; // For alternating text alignment

                // Placeholder for step completion
                const stepProgress = Math.min(100, 10 + index * 20);
                const circumference = 2 * Math.PI * 20; // For a 40px diameter circle (radius 20)
                const strokeDashoffset = circumference - (stepProgress / 100) * circumference;

                return (
                  <div
                    key={stepId}
                    className={`relative flex items-center mb-20 ${
                      isLeft ? "justify-start md:justify-end md:pr-[calc(50%-100px)]" : "justify-start md:pl-[calc(50%-100px)]"
                    }`}
                  >
                    {/* Phase Header - simple grouping */}
                    {index % 3 === 0 && (
                      <div className={`absolute -top-10 w-full text-center ${isLeft ? "md:text-right pr-40" : "md:text-left pl-40"}`}>
                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                          GIAI ĐOẠN {Math.floor(index / 3) + 1}
                        </span>
                      </div>
                    )}

                    {/* Node and text container */}
                    <div
                      onClick={() => setSelectedStep(step)}
                      className={`flex flex-col items-center gap-2 cursor-pointer transition-all duration-200 hover:scale-110 group ${
                        isLeft ? "text-right" : "text-left"
                      }`}
                    >
                      {/* Floating XP Badge */}
                      <span className="absolute -top-8 px-2 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-bold shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        +100 XP
                      </span>

                      {/* Circular Node with Progress Ring */}
                      <div className="relative w-12 h-12 flex items-center justify-center">
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 44 44">
                          <circle
                            className="text-slate-200"
                            strokeWidth="4"
                            stroke="currentColor"
                            fill="transparent"
                            r="20"
                            cx="22"
                            cy="22"
                          />
                          <circle
                            className={`${isActive ? "text-orange-500" : "text-emerald-500"} transition-colors duration-200`}
                            strokeWidth="4"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="20"
                            cx="22"
                            cy="22"
                            transform="rotate(-90 22 22)"
                          />
                        </svg>
                        <span className={`absolute text-sm font-bold ${isActive ? "text-orange-700" : "text-slate-700"}`}>
                          {index + 1}
                        </span>
                      </div>

                      {/* Node Title */}
                      <h4 className={`text-sm font-bold text-slate-800 group-hover:text-orange-600 transition-colors duration-200 max-w-[150px] ${isLeft ? "pr-2" : "pl-2"}`}>
                        {toText(step.title) || `Module ${index + 1}`}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        <span>{getStepDurationMinutes(step) ? `${getStepDurationMinutes(step)} phút` : "Tự điều chỉnh"}</span>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0 text-[9px] font-bold uppercase tracking-[0.15em] ${tone.dotClass}`}>
                          <Layers3 className="h-2.5 w-2.5" />
                          {tone.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Finish node */}
              <div className="relative flex justify-center mt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  Hoàn thành
                </div>
              </div>
            </div>
          </div>

          {/* Shared resources */}
          {resources.length > 0 && (
            <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <ExternalLink className="h-4 w-4 text-orange-500" />
                Nguồn học liệu chung
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {resources.map((resource, index) => {
                  const meta = getResourceMeta(resource);
                  const ResourceIcon = meta.icon;

                  return (
                    <a
                      key={`shared-${index}-${toText(resource.title) || "resource"}`}
                      href={toText(resource.url) || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="group rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 transition hover:-translate-y-0.5 hover:border-orange-200 hover:bg-white hover:shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                          <ResourceIcon className="h-4 w-4 text-orange-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-slate-900 truncate">{toText(resource.title) || "Tài nguyên"}</div>
                          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{meta.label}</div>
                          <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-orange-500 px-2.5 py-1 text-[10px] font-semibold text-white transition group-hover:bg-orange-600">
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
              <LoaderCircle className="h-4 w-4 text-orange-500" />
              {roadmapData.updatedAt ? `Cập nhật: ${new Date(roadmapData.updatedAt).toLocaleString("vi-VN")}` : "Đã sẵn sàng"}
            </div>
          </div>
        </div>

        {/* ==================== RIGHT COLUMN: LOCKED DETAIL PANEL ==================== */}
        {selectedStep && (
          <div className="w-full lg:w-[35%] shrink-0 h-full overflow-y-auto custom-scrollbar border-l border-slate-100 bg-white transition-all duration-500 ease-in-out">
            {renderStepDetail()}
          </div>
        )}
      </div>
    </div>
  );
}
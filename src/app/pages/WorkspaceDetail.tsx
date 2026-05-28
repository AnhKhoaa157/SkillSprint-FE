import OnboardingModal from "../components/OnboardingModal.tsx";
import useOnboardingProfile from "../hooks/useOnboardingProfile";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import LearningStructureDisplay from "../components/LearningStructureDisplay.tsx";
import WorkspaceProgress from "../components/WorkspaceProgress";
import { ArrowLeft, ArrowRight, BookOpenCheck, FileUp, Sparkles, ClipboardList, Layers3, Radar, CheckCircle2, Clock3, FileText, BrainCircuit, UploadCloud, MoveDown, ShieldCheck, Zap, LoaderCircle, Copy, SlidersHorizontal, Check } from "lucide-react";
import { getStoredAuthSession } from "../../api/authService";
import materialService, { type UploadedMaterialResponse as MaterialUploadedMaterialResponse } from "../../api/materialService.ts";
import roadmapService from "../../api/roadmapService";

const API_BASE = ((import.meta as any).env?.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "http://localhost:8080";

const F = "'Inter','Plus Jakarta Sans',sans-serif";
const CARD = "#FFFFFF";
const BDR = "#E5E7EB";
const T1 = "#111827";

type UploadFile = {
  id: string;
  name: string;
  progress: number;
  status: "idle"|"processing"|"done";
  jobStatus?: "PENDING" | "PROCESSING" | "FAILED" | "DONE" | string;
  materialId?: string;
};

const PROCESSING_JOB_ACTIVE_STATES = new Set([
  "PENDING",
  "RUNNING",
  "REVIEW_REQUIRED",
  "EXTRACTING",
  "CLEANING",
  "CHUNKING",
  "ANALYZING",
]);

const PROCESSING_JOB_TERMINAL_STATES = new Set([
  "COMPLETED",
  "FAILED",
]);

type LearningStructureTopic = {
  title: string;
  summaryContent: string;
  keyConcepts: string[];
};

type LearningStructureChapter = {
  title: string;
  summary: string;
  keyConcepts: string[];
  topics: LearningStructureTopic[];
};

type LearningStructureResponse = {
  structureVersionId?: string;
  status?: 'DRAFT' | 'CONFIRMED' | string;
  chapters?: LearningStructureChapter[];
  tasks?: unknown[];
  [key: string]: unknown;
};

type ApiResponse<T> = {
  data?: T;
  [key: string]: unknown;
};

type StepStatus = 'completed' | 'active' | 'pending';

type AnalysisTimeline = {
  startedAt?: string;
  completedAt?: string;
  generatedAt?: string;
  updatedAt?: string;
  createdAt?: string;
  finishedAt?: string;
  [key: string]: unknown;
};

type WorkspaceDetailTab = "files" | "roadmap" | "progress" | "settings";

function toWorkspaceCode(rawId?: string) {
  if (!rawId) return "WS-CHUA-CO";

  const num = Number(rawId);
  if (Number.isFinite(num)) {
    return `WS-${Math.abs(Math.floor(num)).toString(36).toUpperCase().slice(-6).padStart(6, "0")}`;
  }

  const compact = rawId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return `WS-${compact.slice(-6).padStart(6, "0")}`;
}

function buildAuthHeaders(token: string | null, includeJsonContentType = true) {
  const headers: Record<string, string> = {};

  if (includeJsonContentType) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractBackendErrorMessage(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }

  if (!isRecord(value)) {
    return null;
  }

  const directMessage = value.message ?? value.error ?? value.detail ?? value.title;
  if (typeof directMessage === 'string' && directMessage.trim()) {
    return directMessage.trim();
  }

  const nestedSources = [value.data, value.response, value.payload, value.errorResponse];
  for (const source of nestedSources) {
    const message = extractBackendErrorMessage(source);
    if (message) {
      return message;
    }
  }

  return null;
}

function formatDuration(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms) || ms < 0) {
    return '0s';
  }

  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes <= 0) {
    return `${seconds}s`;
  }

  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

function getStructureTimeline(value: unknown): number | null {
  if (!isRecord(value)) {
    return null;
  }

  const candidate = isRecord(value.data)
    ? value.data
    : isRecord(value.learningStructure)
      ? value.learningStructure
      : value;

  if (!isRecord(candidate)) {
    return null;
  }

  const nestedStructure = isRecord(candidate.learningStructure) ? candidate.learningStructure : null;
  const source = (nestedStructure ?? candidate) as AnalysisTimeline;

  const startRaw = source.startedAt ?? source.generatedAt ?? source.createdAt;
  const endRaw = source.completedAt ?? source.finishedAt ?? source.updatedAt;

  if (!startRaw || !endRaw) {
    return null;
  }

  const start = new Date(startRaw).getTime();
  const end = new Date(endRaw).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return null;
  }

  return end - start;
}

function isProcessingState(status: string | null | undefined): boolean {
  if (!status) {
    return false;
  }

  return PROCESSING_JOB_ACTIVE_STATES.has(String(status).toUpperCase());
}

function isTerminalProcessingState(status: string | null | undefined, progressPercent: number | null): boolean {
  const normalized = String(status || "").toUpperCase();

  return PROCESSING_JOB_TERMINAL_STATES.has(normalized) || (typeof progressPercent === "number" && progressPercent >= 100);
}

function normalizeMaterialUploadFile(material: MaterialUploadedMaterialResponse, fallbackIndex: number): UploadFile {
  const jobStatus = material.processingJob?.status ?? material.processingStatus ?? material.uploadStatus ?? null;
  const progressPercent = material.processingJob?.progressPercent ?? 0;

  return {
    id: String(material.materialId || fallbackIndex),
    name: material.fileName || material.originalFileName || "untitled",
    progress: Number.isFinite(progressPercent) ? Number(progressPercent) : 0,
    status: isProcessingState(jobStatus)
      ? "processing"
      : String(jobStatus || "").toUpperCase() === "COMPLETED"
        ? "done"
        : "idle",
    jobStatus: jobStatus || undefined,
    materialId: String(material.materialId || fallbackIndex),
  };
}

export default function WorkspaceDetail(){
  const { id } = useParams();
  const navigate = useNavigate();
  const authSession = getStoredAuthSession();
  const token = authSession?.accessToken ?? null;
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const onboarding = useOnboardingProfile(id);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [results, setResults] = useState<ApiResponse<LearningStructureResponse> | LearningStructureResponse | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const processingIntervals = useRef<Record<string, number>>({});
  const structurePollingRef = useRef<number | null>(null);
  const structurePollingAttemptsRef = useRef(0);
  const analysisStartedAtRef = useRef<number | null>(null);

  const structureData = (results?.data ? results.data : results) as LearningStructureResponse | null;
  const visibleChapters = Array.isArray(structureData?.chapters) ? structureData.chapters : [];
  const rawStatus = structureData?.status || "DRAFT";
  const normalizedStatus = String(rawStatus).toUpperCase();
  const canCreateRoadmap = Boolean(visibleChapters.length && normalizedStatus === 'CONFIRMED');
  const hasRoadmapAlready = Boolean(
    (structureData as any)?.hasRoadmap ||
    (structureData as any)?.roadmapId ||
    (structureData as any)?.currentRoadmap ||
    (structureData as any)?.roadmap ||
    (results as any)?.data?.hasRoadmap ||
    (results as any)?.data?.roadmapId ||
    (results as any)?.roadmapId
  );

  const docsCount = files.length;
  const doneDocsCount = files.filter(f => f.status === "done").length;
  const processingDocsCount = files.filter(f => f.status === "processing").length;
  const pendingJobsCount = files.filter(f => f.jobStatus === 'PENDING').length;
  const processingJobsCount = files.filter(f => f.jobStatus === 'PROCESSING').length;
  const completedJobsCount = files.filter(f => f.jobStatus === 'COMPLETED' || f.jobStatus === 'DONE').length;
  const failedJobsCount = files.filter(f => f.jobStatus === 'FAILED').length;
  const processingProgressValues = files
    .filter(f => f.jobStatus === 'PROCESSING' && Number.isFinite(f.progress))
    .map(f => f.progress);
  const processingProgress = processingProgressValues.length
    ? Math.round(processingProgressValues.reduce((sum, value) => sum + value, 0) / processingProgressValues.length)
    : null;
  const readyState = results ? "Đã phân tích xong" : files.length ? "Đang xử lý" : "Chờ tải lên";
  const [workspaceName, setWorkspaceName] = useState<string>("Không gian làm việc");
  const workspaceCode = toWorkspaceCode(id);
  const workspaceId = id ?? '';
  const uploadRequests = useRef<Record<string, XMLHttpRequest>>({});

  function stopStructurePolling() {
    if (structurePollingRef.current) {
      clearInterval(structurePollingRef.current);
      structurePollingRef.current = null;
    }
    structurePollingAttemptsRef.current = 0;
    setIsGeneratingStructure(false);
  }

  function getStepStatus(step: 1 | 2 | 3): StepStatus {
    const hasActiveJobs = pendingJobsCount > 0 || processingJobsCount > 0;
    const hasTerminalJobs = completedJobsCount > 0 || failedJobsCount > 0;

    if (step === 1) {
      if (files.some(file => file.status === 'processing' && !file.jobStatus)) {
        return 'active';
      }
      return files.length > 0 ? 'completed' : 'pending';
    }

    if (step === 2) {
      if (hasActiveJobs) {
        return 'active';
      }
      if (hasTerminalJobs) {
        return 'completed';
      }
      return 'pending';
    }

    if (visibleChapters.length) {
      return 'completed';
    }
    if (!structureGenerationRequested) {
      return 'pending';
    }
    if (isGeneratingStructure || structurePollingRef.current) {
      return 'active';
    }
    return hasTerminalJobs ? 'active' : 'pending';
  }

  async function pollLearningStructureOnce() {
    structurePollingAttemptsRef.current += 1;
    const found = await fetchLearningStructure(); // This now returns LearningStructure | null
    if (found) {
      setIsGeneratingStructure(false);
      toast.success('Phân tích hoàn tất — lộ trình đã sẵn sàng', { id: 'structure-generation' });
      stopStructurePolling();
      return true;
    }

    if (structurePollingAttemptsRef.current >= 10) {
      stopStructurePolling();
    }

    return false;
  }

  function startStructurePolling() {
    if (structurePollingRef.current) {
      return;
    }

    structurePollingAttemptsRef.current = 0;
    void pollLearningStructureOnce();
    structurePollingRef.current = window.setInterval(() => {
      void pollLearningStructureOnce();
    }, 1500);
  }

  useEffect(()=>{
    setFiles([]);
    stopStructurePolling();
    setStructureGenerationRequested(false);
    setGenerateLoading(false);
    setIsGeneratingStructure(false);

    (async ()=>{
      if(!id) return;
      // Fetch existing learning structure immediately on mount
      const fetchedStructure = await fetchLearningStructure();
      if (fetchedStructure) {
        setStructureGenerationRequested(true);
        setResults(fetchedStructure);
      }

      // fetch onboarding profile; open modal if none
      try{
        const p = await onboarding.fetchOnboardingProfile();
        if (!p) setIsConfigOpen(true);
      }catch(err:any){
        console.error('Failed to load onboarding profile', err);
        toast.error('Không thể tải cài đặt lộ trình (server lỗi)');
      }
    })();
    try {
      const raw = localStorage.getItem("skillSprint.workspaces");
      if (raw) {
        const list = JSON.parse(raw) as Array<{ id: string; name: string }>;
        const current = list.find(item => item.id === id);
        if (current?.name) setWorkspaceName(current.name);
      }
    } catch (e) {}
    void reloadWorkspaceMaterials();
    return () => {
      try{
        Object.values(processingIntervals.current).forEach(iv => clearInterval(iv));
      }catch(e){}
      processingIntervals.current = {};
      stopStructurePolling();
    };
  },[id]);

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if(!list) return;
    addFiles(list);
  };

  function startProcessingPolling(materialId: string){
    if (!materialId) return;
    if (processingIntervals.current[materialId]) return;
    const iv = window.setInterval(async ()=>{
      try{
        if (!id) return;
        const job = await materialService.getMaterialProcessingJob(id, materialId);
        const progress = job.progressPercent ?? null;
        const status = job.status ?? null;

        if (typeof progress === 'number' || typeof status === 'string'){
          setFiles(prev => prev.map(x => (x.materialId===materialId || x.id===materialId) ? {
            ...x,
            progress: typeof progress === 'number' ? progress : x.progress,
            status: String(status || '').toUpperCase() === 'COMPLETED' ? 'done' : isProcessingState(status) || (typeof progress === 'number' && progress < 100) ? 'processing' : x.status,
            jobStatus: status || x.jobStatus,
          } : x));
        }

        if (isTerminalProcessingState(status, progress)) {
          clearInterval(processingIntervals.current[materialId]);
          delete processingIntervals.current[materialId];

          if (String(status || '').toUpperCase() === 'COMPLETED' || (typeof progress === 'number' && progress >= 100)) {
            void reloadWorkspaceMaterials();
            if (structureGenerationRequested) {
              startStructurePolling();
            }
          } else {
            stopStructurePolling();
          }
        }
      }catch(e){ console.error('Polling error', e); }
    }, 3000);
    processingIntervals.current[materialId] = iv;
  }

  async function cancelFile(file: UploadFile){
    if (file.materialId) {
      const intervalId = processingIntervals.current[file.materialId];
      if (intervalId) {
        clearInterval(intervalId);
        delete processingIntervals.current[file.materialId];
      }
    }

    const request = uploadRequests.current[file.id];
    if (request && file.status === 'processing' && file.progress < 100) {
      request.abort();
      delete uploadRequests.current[file.id];
      setFiles(prev => prev.filter(item => item.id !== file.id));
      toast.info('Đã hủy upload file');
      return;
    }

    if (file.materialId && id) {
      try {
        const headers = buildAuthHeaders(token, false); // buildAuthHeaders already adds Authorization if token exists

        const resp = await fetch(`${API_BASE}/api/workspaces/${id}/materials/${file.materialId}`, {
          method: 'DELETE',
          headers,
        });

        if (!resp.ok) {
          throw new Error(`Delete failed: ${resp.status}`);
        }

        setFiles(prev => prev.filter(item => item.materialId !== file.materialId));
        toast.success('Đã xóa file khỏi backend');
        return;
      } catch (error) {
        console.error('Delete material error', error);
        toast.error('Không thể xóa file trên backend');
        return;
      }
    }

    setFiles(prev => prev.filter(item => item.id !== file.id));
    toast.info('Đã ẩn file khỏi danh sách');
  }

  async function fetchLearningStructure(): Promise<ApiResponse<LearningStructureResponse> | LearningStructureResponse | null>{
    if (!id) return null;
    try{
      const headers = buildAuthHeaders(token);
      const resp = await fetch(`${API_BASE}/api/workspaces/${id}/learning-structure`, { method: 'GET', headers });
      if (resp.status === 404) {
        setResults(null);
        return null;
      }

      if (!resp.ok) {
        throw new Error(`Learning structure fetch failed: ${resp.status}`);
      }

      const res = await resp.json().catch(()=>null) as unknown;
      console.log("DEBUG_RAW_DETAIL_PAYLOAD:", res);
      setResults(res as ApiResponse<LearningStructureResponse>);
      return res as ApiResponse<LearningStructureResponse>;
    }catch(err:any){
      if (String(err?.message || '').includes('404')) {
        setResults(null);
        return null;
      }

      console.error('Failed to fetch learning structure (non-404 error)', err);
      return null;
    }
  }

  const [generateLoading, setGenerateLoading] = useState(false);
  const [isGeneratingStructure, setIsGeneratingStructure] = useState(false);
  const [structureGenerationRequested, setStructureGenerationRequested] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [roadmapGenerating, setRoadmapGenerating] = useState(false);
  const [roadmapError, setRoadmapError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<WorkspaceDetailTab>("files");
  const analysisDurationMs = getStructureTimeline(results);
  const liveAnalysisDurationMs = analysisStartedAtRef.current ? Date.now() - analysisStartedAtRef.current : null;
  const analysisDurationLabel = analysisDurationMs !== null ? formatDuration(analysisDurationMs) : (isGeneratingStructure || generateLoading ? formatDuration(liveAnalysisDurationMs) : '0s');
  const generating = isGeneratingStructure || generateLoading;
  const workspaceTabs: Array<{ id: WorkspaceDetailTab; label: string; description: string }> = [
    { id: "files", label: "Tài liệu", description: "Tải lên và xử lý nội dung" },
    { id: "roadmap", label: "Roadmap", description: "Xem lộ trình học tập" },
    { id: "progress", label: "Tiến độ", description: "Dashboard tiến độ" },
    { id: "settings", label: "Cài đặt", description: "Cấu hình workspace" },
  ];

  async function reloadWorkspaceMaterials() {
    if (!id) return;

    setMaterialsLoading(true);

    try {
      const materials: MaterialUploadedMaterialResponse[] = await materialService.getWorkspaceMaterials(id);
      const mapped = materials.map((material: MaterialUploadedMaterialResponse, index: number) => normalizeMaterialUploadFile(material, index));

      setFiles(mapped);
      mapped
        .filter((item: UploadFile) => item.status === "processing")
        .forEach((item: UploadFile) => startProcessingPolling(item.materialId ?? item.id));
    } catch (err) {
      console.error("Failed to load materials", err);
    } finally {
      setMaterialsLoading(false);
    }
  }

  async function handleGenerate(){
    if (!id) return;
    try{
      // Record the analysis start time when generation begins
      analysisStartedAtRef.current = Date.now();
      
      // Show spinner immediately when user starts generation
      setStructureGenerationRequested(true);
      setIsGeneratingStructure(true);
      setGenerateLoading(true);
      toast.loading('Bắt đầu phân tích AI...', { id: 'structure-generation' });
      const headers = buildAuthHeaders(token);
      const resp = await fetch(`${API_BASE}/api/workspaces/${id}/learning-structure/generate`, { method: 'POST', headers });
      if (!resp.ok) throw new Error('Generate failed');
      // Keep loading visible for at least ~10s to give the backend time to start processing
      await new Promise(resolve => setTimeout(resolve, 10000));
      stopStructurePolling();
      startStructurePolling();
    }catch(err:any){
      console.error('Generate error', err);
      toast.error('Không thể bắt đầu phân tích', { id: 'structure-generation' });
      setIsGeneratingStructure(false);
      setStructureGenerationRequested(false);
    }
    finally{ setGenerateLoading(false); }
  }

  async function handleConfirm(){
    if (!id || !results) return; // Ensure results are present before confirming
    try{
      setConfirming(true);
      const headers = buildAuthHeaders(token);
      const resp = await fetch(`${API_BASE}/api/workspaces/${id}/learning-structure/confirm`, { method: 'POST', headers, body: JSON.stringify({}) });
      if (!resp.ok) throw new Error('Confirm failed');
      const confPayload = await resp.json().catch(()=>null) as ApiResponse<LearningStructureResponse> | LearningStructureResponse | null;
      toast.success('Lộ trình đã được xác nhận');
      if (confPayload) {
        setResults(confPayload);
      }
      setStructureGenerationRequested(true);
    }catch(err:any){ console.error('Confirm error', err); toast.error('Không thể xác nhận lộ trình'); }
    finally { setConfirming(false); }
  }

  async function handleGenerateRoadmap(){
    if (!id) return;

    try {
      setRoadmapGenerating(true);
      setRoadmapError(null);
      const generatedRoadmap = await roadmapService.generateRoadmap(id);
      if (generatedRoadmap) {
        setResults((prev) => {
          const previous = isRecord(prev) ? prev : {};
          const wrapped = isRecord((prev as any)?.data) ? (prev as any).data : null;

          return {
            ...(isRecord(prev) ? prev : {}),
            ...(wrapped || {}),
            data: {
              ...((isRecord(prev) ? prev : {}) as Record<string, unknown>),
              ...(wrapped || {}),
              hasRoadmap: true,
              roadmapId: generatedRoadmap.id || (generatedRoadmap as any).roadmapId || generatedRoadmap.workspaceId,
              roadmap: generatedRoadmap,
            },
            hasRoadmap: true,
            roadmapId: generatedRoadmap.id || (generatedRoadmap as any).roadmapId || generatedRoadmap.workspaceId,
            roadmap: generatedRoadmap,
          } as any;
        });
      }

      navigate(`/app/workspaces/${id}/roadmap`, { state: { roadmap: generatedRoadmap } });
    } catch (error: any) {
      console.error('Roadmap generation error', error);
      const backendError = extractBackendErrorMessage(error) || error?.message || 'Lỗi hệ thống ngầm (500) khi khởi tạo lộ trình.';
      const friendlyMessage = `Yêu cầu thất bại: ${backendError}`;
      setRoadmapError(friendlyMessage);
    } finally {
      setRoadmapGenerating(false);
    }
  }

  const addFiles = (list: FileList | null) => {
    if (!list || !id) return;
    const filesArr = Array.from(list);
    filesArr.forEach(file => {
      const localId = String(Date.now()) + Math.random().toString(36).slice(2,8);
      setFiles(p => [...p, { id: localId, name: file.name, progress: 0, status: 'processing' }]);
      (async ()=>{
        try{
          const contentType = file.type || 'application/octet-stream';

          // Step 1: Get upload URL from backend (Rule 1: Authorization header required)
          const uploadResponse = await materialService.createMaterialUploadUrl(id, { fileName: file.name, contentType });
          const uploadUrl = uploadResponse.uploadUrl;
          const fileUrl = uploadResponse.fileUrl;
          const objectKey = uploadResponse.objectKey || fileUrl;
          if (!uploadUrl) throw new Error('No uploadUrl returned');

          // Step 2: Upload file to Amazon S3 (Rule 2: NO Authorization header, raw file body, Content-Type from file.type)
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            uploadRequests.current[localId] = xhr;
            xhr.open('PUT', uploadUrl, true);
            // Rule 2: Content-Type must be file.type, NO Authorization header
            xhr.setRequestHeader('Content-Type', contentType);
            xhr.upload.onprogress = (ev) => {
              if (ev.lengthComputable) {
                const pct = Math.round((ev.loaded/ev.total)*100);
                setFiles(prev => prev.map(x => x.id===localId ? { ...x, progress: pct } : x));
              }
            };
            xhr.onload = () => {
              delete uploadRequests.current[localId];
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
              } else {
                reject(new Error('Upload failed'));
              }
            };
            xhr.onerror = () => {
              delete uploadRequests.current[localId];
              reject(new Error('Upload network error'));
            };
            xhr.onabort = () => {
              delete uploadRequests.current[localId];
              reject(new DOMException('Upload aborted', 'AbortError'));
            };
            // Rule 2: Body must be raw binary data (File object)
            xhr.send(file);
          });

          // Step 3: Confirm upload with the backend (Rule 1: Authorization header required)
          const uploaded = await materialService.confirmMaterialUpload(id, { objectKey: objectKey, fileName: file.name, contentType });
          const returnedMaterialId = uploaded?.materialId || null;
          const returnedProgress = uploaded?.processingJob?.progressPercent ?? 0;
          const returnedJobStatus = uploaded?.processingJob?.status ?? uploaded?.processingStatus ?? null;

          setFiles(prev => prev.map(x => x.id===localId ? { ...x, materialId: String(returnedMaterialId || objectKey || localId), progress: Number.isFinite(returnedProgress) ? Number(returnedProgress) : 0, status: String(returnedJobStatus || '').toUpperCase() === 'COMPLETED' ? 'done' : 'processing', jobStatus: returnedJobStatus || 'PENDING' } : x));
          // if backend returned materialId (UUID), use it for polling; otherwise try best-effort
          startProcessingPolling(String(returnedMaterialId || objectKey || localId));
          toast.success('Tải lên thành công — bắt đầu phân tích');
        }catch(err:any){
          console.error('Upload error', err);
          setFiles(prev => prev.map(x => x.id===localId ? { ...x, status: 'idle' } : x));
          toast.error('Không thể tải lên file');
        }
      })();
    });
  };

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragActive(false);
    addFiles(e.dataTransfer.files);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-inter text-slate-900">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-6 mb-6">
          <div>
            <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full bg-white shadow-sm text-gray-800 mb-2">
              <BookOpenCheck className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-semibold">AI Workspace</span>
            </div>
            <h1 className="text-2xl font-extrabold">{workspaceName}</h1>
            <div className="mt-2 flex items-center gap-3 text-sm text-slate-500">
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full shadow-sm ${processingDocsCount>0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                <span className={`w-2 h-2 rounded-full ${processingDocsCount>0 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <strong className="text-xs">AI {processingDocsCount>0 ? 'Processing' : 'Online'}</strong>
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white shadow-sm text-slate-600">
                <span className="text-xs">{workspaceCode}</span>
                <button className="p-1 rounded hover:bg-slate-100"><Copy className="w-4 h-4" /></button>
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white shadow-sm text-slate-600">
                <Clock3 className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-semibold">{analysisDurationLabel}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsConfigOpen(true)} 
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cấu hình lộ trình
            </button>

            {visibleChapters.length > 0 ? (
              normalizedStatus === 'CONFIRMED' ? (
                hasRoadmapAlready ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/app/workspaces/${id}/roadmap`)}
                    className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-orange-600 animate-fade-in"
                  >
                    Xem Lộ trình
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    disabled={roadmapGenerating}
                    onClick={handleGenerateRoadmap}
                    className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-orange-600 disabled:opacity-50 animate-fade-in"
                  >
                    {roadmapGenerating ? 'Đang khởi tạo lộ trình...' : '🎯 Tạo lộ trình AI'}
                    <ArrowRight size={16} />
                  </button>
                )
              ) : (
                <button
                  disabled={confirming}
                  onClick={handleConfirm}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Check size={16} />
                  {confirming ? "Đang lưu cấu trúc..." : "Chấp nhận lộ trình"}
                </button>
              )
              ) : activeTab === "roadmap" ? (
                <button
                  disabled={generating}
                  onClick={handleGenerate}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-orange-700 disabled:opacity-50"
                >
                  <Sparkles size={14} />
                  {generating ? "Đang xử lý AI..." : "Bắt đầu Phân tích AI"}
                </button>
              ) : null}

            <button 
              type="button"
              onClick={() => navigate('/app/workspaces')}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1"
            >
              ← Quay lại
            </button>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="grid gap-2 md:grid-cols-4">
            {workspaceTabs.map(tab => {
              const selected = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-xl px-4 py-3 text-left transition ${selected ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" : "bg-slate-50 text-slate-700 hover:bg-slate-100"}`}
                >
                  <div className="text-sm font-bold">{tab.label}</div>
                  <div className={`mt-0.5 text-[11px] ${selected ? "text-orange-50" : "text-slate-400"}`}>{tab.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        {roadmapError ? (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
            {roadmapError}
          </div>
        ) : null}

        {/* Main content area */}
        <div className={`grid grid-cols-12 gap-6 mb-6 ${activeTab === "files" ? "" : "hidden"}`}>
          {/* Left column: Materials & Knowledge Base */}
          <div className="col-span-12 lg:col-span-7">
            <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
              <h2 className="text-lg font-semibold mb-4">Materials & Knowledge Base</h2>

              <label
                onDragEnter={()=>setDragActive(true)}
                onDragOver={(e)=>{ e.preventDefault(); setDragActive(true); }}
                onDragLeave={()=>setDragActive(false)}
                onDrop={onDrop}
                className={`group relative flex items-center justify-between gap-4 p-6 rounded-xl border-2 border-dashed ${dragActive ? 'border-orange-300 bg-orange-50/40' : 'border-slate-200 bg-slate-50'} cursor-pointer`}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-white shadow-sm">
                    <FileText className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Kéo & thả tài liệu vào đây</div>
                    <div className="text-xs text-slate-400">PDF, DOCX, TXT — tối đa 50MB</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input ref={fileRef} type="file" multiple className="hidden" onChange={onFiles} />
                  <button onClick={()=>fileRef.current?.click()} className="px-4 py-2 rounded-lg bg-orange-500 text-white border border-orange-500 hover:bg-orange-600 hover:shadow">Chọn file</button>
                </div>
              </label>

              <div className="mt-6 overflow-hidden rounded-lg border border-slate-100">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left p-3">File name</th>
                      <th className="text-left p-3">Size</th>
                      <th className="text-left p-3">Uploaded</th>
                      <th className="text-left p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {files.length === 0 ? (
                      <tr><td colSpan={4} className="p-6 text-center text-slate-400">Chưa tải lên tài liệu nào.</td></tr>
                    ) : files.map(f => (
                      <tr key={f.id} className="hover:bg-slate-50 transition cursor-pointer">
                        <td className="p-3 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center"><FileText className="w-4 h-4 text-orange-500" /></div>
                          <div>
                            <div className="font-medium">{f.name}</div>
                            <div className="text-xs text-slate-400">Click để xem trước</div>
                          </div>
                        </td>
                        <td className="p-3 text-slate-600">
                          {f.jobStatus === 'PENDING' ? (
                            <span className="inline-flex items-center gap-2 text-slate-500">
                              <LoaderCircle className="h-4 w-4 animate-spin text-orange-500" />
                              <span>Đang chờ xử lý...</span>
                            </span>
                          ) : f.jobStatus === 'PROCESSING' ? (
                            `${f.progress}%`
                          ) : f.progress>0 ? `${f.progress}%` : '—'}
                        </td>
                        <td className="p-3 text-slate-600">{new Date().toLocaleDateString()}</td>
                        <td className="p-3">
                          {f.jobStatus === 'PENDING' ? (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <LoaderCircle className="h-4 w-4 animate-spin text-orange-500" />
                              <span>Đang chờ xử lý...</span>
                            </div>
                          ) : f.jobStatus === 'PROCESSING' ? (
                            <div>
                              {Number.isFinite(f.progress) ? (
                                <>
                                  <div className="flex items-center justify-between text-xs text-slate-600 mb-2">Processing <span>{f.progress}%</span></div>
                                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div style={{width:`${f.progress}%`}} className="h-2 bg-orange-500" />
                                  </div>
                                </>
                              ) : (
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                  <LoaderCircle className="h-4 w-4 animate-spin text-orange-500" />
                                  <span>Đang xử lý</span>
                                </div>
                              )}
                            </div>
                          ) : f.jobStatus === 'FAILED' ? (
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-xs">Failed</div>
                          ) : f.status === 'done' ? (
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs">
                              <CheckCircle2 className="w-4 h-4" /> Processed
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-xs">Failed</div>
                          )}
                          {f.status !== 'done' && (
                            <div className="mt-2">
                              <button
                                type="button"
                                onClick={() => cancelFile(f)}
                                className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md border border-slate-200 text-xs text-slate-600 hover:bg-slate-50"
                              >
                                Hủy file
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right column: AI Engine Pipeline */}
          <div className="col-span-12 lg:col-span-5">
            <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
              <h3 className="text-md font-semibold mb-4">AI Engine Pipeline</h3>
              <ol className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className={`h-9 w-9 rounded-lg grid place-items-center ${getStepStatus(1) === 'completed' ? 'bg-emerald-50 text-emerald-700' : getStepStatus(1) === 'active' ? 'bg-orange-50 text-orange-700' : 'bg-slate-100 text-slate-300'}`}>
                    {getStepStatus(1) === 'completed' ? <CheckCircle2 className="w-5 h-5"/> : getStepStatus(1) === 'active' ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5 opacity-40" />}
                  </span>
                  <div>
                    <div className="font-semibold">1. Upload Material</div>
                    <div className="text-xs text-slate-400">Files are added to workspace</div>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span className={`h-9 w-9 rounded-lg grid place-items-center ${getStepStatus(2) === 'completed' ? 'bg-emerald-50 text-emerald-700' : getStepStatus(2) === 'active' ? 'bg-orange-50 text-orange-700' : 'bg-slate-100 text-slate-300'}`}>
                    {getStepStatus(2) === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : getStepStatus(2) === 'active' ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <LoaderCircle className="w-5 h-5 opacity-40" />}
                  </span>
                  <div className="flex-1">
                    <div className="font-semibold">2. Parse & Extract</div>
                    <div className="text-xs text-slate-400">Extracting text, metadata and embeddings</div>
                    <div className="mt-2 bg-slate-100 rounded-full h-2 overflow-hidden">
                      {getStepStatus(2) === 'active' ? (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <LoaderCircle className="h-4 w-4 animate-spin text-orange-500" />
                          <span>{pendingJobsCount > 0 ? 'Đang chờ xử lý...' : 'Đang xử lý...'}</span>
                        </div>
                      ) : getStepStatus(2) === 'completed' ? (
                        <div className="h-2 bg-emerald-500" style={{width: '100%'}} />
                      ) : processingJobsCount > 0 && processingProgress !== null ? (
                        <div className="h-2 bg-orange-500" style={{width: `${processingProgress}%`}} />
                      ) : processingJobsCount > 0 ? (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <LoaderCircle className="h-4 w-4 animate-spin text-orange-500" />
                          <span>Đang xử lý</span>
                        </div>
                      ) : (
                        <div className="h-2 bg-slate-200" style={{width: `${getStepStatus(2) === 'pending' ? 0 : processingProgress ?? 0}%`}} />
                      )}
                    </div>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span className={`h-9 w-9 rounded-lg grid place-items-center ${getStepStatus(3) === 'completed' ? 'bg-emerald-50 text-emerald-700' : getStepStatus(3) === 'active' ? 'bg-orange-50 text-orange-700' : 'bg-slate-100 text-slate-300'}`}>
                    {getStepStatus(3) === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : getStepStatus(3) === 'active' ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <Layers3 className="w-5 h-5 opacity-40" />}
                  </span>
                  <div>
                    <div className="font-semibold">3. Structure Generation</div>
                    <div className="text-xs text-slate-400">
                      {getStepStatus(3) === 'completed'
                        ? 'Learning structure is ready'
                        : getStepStatus(3) === 'active'
                          ? 'Generating structure from extracted content'
                          : 'Waiting for Parse & Extract to finish'}
                    </div>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* AI Results Preview - New Section */}
        <div className={`mt-6 ${activeTab === "roadmap" ? "" : "hidden"}`}>
          <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-3 border-b border-orange-200 pb-2">
              <h3 className="text-md font-semibold">AI Results Preview</h3>
              <div className="text-xs text-slate-400">Updated: just now</div>
            </div>
            {!results ? (
              (isGeneratingStructure || generateLoading) ? (
                <div className="text-center py-8">
                  <div className="mx-auto mb-4 w-36 h-36 bg-slate-50 rounded-lg grid place-items-center">
                    <LoaderCircle className="animate-spin w-12 h-12 text-orange-500" />
                  </div>
                  <div className="text-sm font-semibold mb-1">Đang sinh lộ trình</div>
                  <div className="text-xs text-slate-400 mb-4">Hệ thống đang phân tích tài liệu và sinh lộ trình. Vui lòng chờ...</div>
                  <button onClick={()=>setIsConfigOpen(true)} className="px-4 py-2 rounded-lg bg-white border border-orange-500 text-orange-500 hover:bg-orange-50">Cài đặt lộ trình</button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="mx-auto mb-4 w-36 h-36 bg-slate-50 rounded-lg grid place-items-center">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#FF9800" strokeWidth="1.5"><path d="M12 2v6"/><path d="M5 6h14"/><path d="M6 13h12"/><path d="M8 20h8"/></svg>
                  </div>
                  <div className="text-sm font-semibold mb-1">Chưa có cấu trúc</div>
                  <div className="text-xs text-slate-400 mb-4">Tải lên tài liệu và chờ xử lý để sinh lộ trình học.</div>
                  <button onClick={()=>setIsConfigOpen(true)} className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600">Cài đặt lộ trình</button>
                </div>
              )
            ) : (
              <div>
                <div className="flex gap-2 mb-4">
                  <button className="px-3 py-1 rounded-md bg-orange-500 text-white text-sm font-medium">Chương có cấu trúc</button>
                </div>
                {normalizedStatus === 'CONFIRMED' ? (
                  <>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-4">
                      <CheckCircle2 className="w-4 h-4" />
                      Cấu trúc đã xác nhận
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/app/workspaces/${id}/roadmap`)}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-orange-600 transition"
                    >
                      ✨ Xem lộ trình học tập chi tiết
                    </button>
                    <LearningStructureDisplay chapters={visibleChapters} />
                  </>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-semibold mb-4">
                    <ShieldCheck className="w-4 h-4" />
                    Cấu trúc đang chờ xác nhận
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className={`${activeTab === "progress" ? "mt-6" : "hidden"}`}>
          {activeTab === "progress" && <WorkspaceProgress workspaceId={workspaceId} className="mt-0" />}
        </div>

        <OnboardingModal
          open={isConfigOpen}
          onClose={()=>setIsConfigOpen(false)}
          workspaceId={id ?? ''}
          initialValues={onboarding.profile}
        />
      </div>
    </div>
  );
}

function generateSampleLearningPlan(){
  return {
    chapters: [
      { title: "Nhập môn và nền tảng", topics: ["Tổng quan", "Cài đặt", "Khái niệm cơ bản"] },
      { title: "Thuật toán cốt lõi", topics: ["Sắp xếp", "Tìm kiếm", "Đệ quy"] },
      { title: "Chủ đề nâng cao", topics: ["Đồ thị", "Quy hoạch động"] },
    ],
    roadmap: ["Tuần 1: Nền tảng", "Tuần 2: Thuật toán cốt lõi", "Tuần 3: Chủ đề nâng cao"],
    tasks: ["Đọc chương 1", "Hoàn thành bài luyện: sắp xếp", "Xây dựng dự án nhỏ"],
  };
}
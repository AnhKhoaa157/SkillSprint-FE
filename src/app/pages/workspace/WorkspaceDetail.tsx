import EditWorkspaceConfigModal from "../../components/modals/EditWorkspaceConfigModal";
import OnboardingModal from "../../components/modals/OnboardingModal";
import useOnboardingProfile from "../../hooks/useOnboardingProfile";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
// SyllabusInput removed — chức năng gộp vào Tài liệu
import LearningStructureDisplay from "../../components/workspace/LearningStructureDisplay";
import WorkspaceProgress from "../../components/workspace/WorkspaceProgress";
import { ArrowLeft, ArrowRight, BookOpenCheck, Bot, FileUp, Sparkles, ClipboardList, Layers3, Radar, CheckCircle2, Clock3, FileText, BrainCircuit, UploadCloud, MoveDown, ShieldCheck, X, Zap, LoaderCircle, Copy, SlidersHorizontal, Check, Calendar, Compass } from "lucide-react";
import { getStoredAuthSession } from "../../../api/authService";
import AiTutorChat from "./AiTutorChat";
import materialService, { type UploadedMaterialResponse as MaterialUploadedMaterialResponse } from "../../../api/materialService.ts";
import roadmapService from "../../../api/roadmapService";
import workspaceService from "../../../api/workspaceService";

const API_BASE = ((import.meta as any).env?.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "http://localhost:8080";

const F = "'Inter','Plus Jakarta Sans',sans-serif";
const CARD = "#FFFFFF";
const BDR = "#E5E7EB";
const T1 = "#111827";

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

type UploadFile = {
  id: string;
  name: string;
  progress: number;
  status: "idle" | "processing" | "done";
  jobStatus?: "PENDING" | "PROCESSING" | "FAILED" | "DONE" | string;
  materialId?: string;
};

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

type WorkspaceDetailTab = "files" | "roadmap" | "progress" | "config";

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

  const session = getStoredAuthSession();
  if (session?.sessionId) {
    headers["X-Session-Id"] = session.sessionId;
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
  const location = useLocation();
  const shouldOpenOnboarding = !!(location.state as { openOnboarding?: boolean } | null)?.openOnboarding;
  const authSession = getStoredAuthSession();
  const token = authSession?.accessToken ?? null;
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
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

      // fetch onboarding profile; open onboarding modal if none
      try{
        const p = await onboarding.fetchOnboardingProfile();
        if (!p || shouldOpenOnboarding) setIsOnboardingOpen(true);
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
    if (id) {
      workspaceService.getWorkspace(id)
        .then(data => {
          if (data && data.name) {
            setWorkspaceName(data.name);
          }
        })
        .catch(err => console.error("Failed to fetch workspace detail", err));
    }
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
  const [workspaceTutorOpen, setWorkspaceTutorOpen] = useState(false);
  const currentWorkspace = {
    workspaceId,
    name: workspaceName,
    onboardingConfig: onboarding.profile,
  };
  const analysisDurationMs = getStructureTimeline(results);
  const liveAnalysisDurationMs = analysisStartedAtRef.current ? Date.now() - analysisStartedAtRef.current : null;
  const analysisDurationLabel = analysisDurationMs !== null ? formatDuration(analysisDurationMs) : (isGeneratingStructure || generateLoading ? formatDuration(liveAnalysisDurationMs) : '0s');
  const generating = isGeneratingStructure || generateLoading;
  const workspaceTabs: Array<{ id: WorkspaceDetailTab; label: string; icon: typeof FileText }> = [
    { id: "files",    label: "Tài liệu",     icon: FileText },
    { id: "roadmap",  label: "Roadmap",      icon: Layers3 },
    { id: "progress", label: "Tiến độ",      icon: Radar },
    { id: "config",   label: "Cấu hình",     icon: SlidersHorizontal },
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
    await triggerStructureGeneration(false);
  }

  async function handleRegenerateStructure(){
    await triggerStructureGeneration(true);
  }

  async function triggerStructureGeneration(isRegenerate: boolean) {
    if (!id) return;

    try {
      analysisStartedAtRef.current = Date.now();

      setStructureGenerationRequested(true);
      setIsGeneratingStructure(true);
      setGenerateLoading(true);
      toast.loading(isRegenerate ? 'Đang tạo lại cấu trúc AI...' : 'Bắt đầu phân tích AI...', { id: 'structure-generation' });

      const headers = buildAuthHeaders(token);
      const resp = await fetch(`${API_BASE}/api/workspaces/${id}/learning-structure/generate`, { method: 'POST', headers });
      if (!resp.ok) throw new Error('Generate failed');

      await new Promise(resolve => setTimeout(resolve, 10000));
      stopStructurePolling();
      startStructurePolling();
      await fetchLearningStructure();
    } catch (err:any) {
      console.error('Generate error', err);
      toast.error(isRegenerate ? 'Không thể tạo lại cấu trúc' : 'Không thể bắt đầu phân tích', { id: 'structure-generation' });
      setIsGeneratingStructure(false);
      setStructureGenerationRequested(false);
    } finally {
      setGenerateLoading(false);
    }
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
    <div className="relative min-h-screen bg-[#F9FAFB] p-6 font-inter text-slate-900 overflow-hidden sm:p-8">
      {/* Decorative background glow circles */}
      <div className="absolute left-[-10%] top-[-10%] -z-10 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#FF6B00]/5 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute right-[-10%] bottom-[-10%] -z-10 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-[#F59E0B]/5 to-transparent blur-[150px] pointer-events-none" />

      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF6B00] mb-2">
              <BookOpenCheck className="w-3.5 h-3.5" />
              <span>AI Learning Workspace</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 truncate">{workspaceName}</h1>
          </div>
          <button
            type="button"
            onClick={() => navigate('/app/workspaces')}
            className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Trở về
          </button>
        </div>

        {/* Tab Navigation — compact pill style */}
        <div className="mb-8 flex items-center gap-1.5 rounded-2xl border border-slate-200/70 bg-white p-1.5 shadow-sm overflow-x-auto">
          {workspaceTabs.map(tab => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold whitespace-nowrap transition duration-200 ${selected ? "bg-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/20" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}
              >
                <tab.icon className="h-4 w-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {roadmapError ? (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
            {roadmapError}
          </div>
        ) : null}

        {/* FILES TAB — Modern card-based layout */}
        <div className={`${activeTab === "files" ? "grid grid-cols-12 gap-6 mb-6" : "hidden"}`}>
          {/* Left column: Materials */}
          <div className="col-span-12 lg:col-span-7 space-y-5">
            {/* Upload zone */}
            <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 border border-orange-100">
                  <UploadCloud className="h-4 w-4 text-[#FF6B00]" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">Tải lên tài liệu</div>
                  <div className="text-xs text-slate-400">PDF, DOCX, TXT — tối đa 50MB mỗi file</div>
                </div>
              </div>
              <div className="p-6">
                <label
                  onDragEnter={() => setDragActive(true)}
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={onDrop}
                  className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-10 cursor-pointer transition-all duration-200 ${dragActive ? 'border-[#FF6B00]/50 bg-[#FFF7ED]/50' : 'border-slate-200 hover:border-[#FF6B00]/30 hover:bg-slate-50/80'}`}
                >
                  <input ref={fileRef} type="file" multiple className="hidden" onChange={onFiles} />
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-200 ${dragActive ? 'bg-[#FF6B00] text-white shadow-lg shadow-[#FF6B00]/20' : 'bg-slate-100 text-slate-400'}`}>
                    <MoveDown className="h-6 w-6" />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold text-slate-700">Kéo &amp; thả tài liệu vào đây</div>
                    <div className="text-xs text-slate-400 mt-1">hoặc nhấn để chọn file từ máy tính</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="mt-1 inline-flex items-center gap-2 rounded-xl bg-[#FF6B00] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#FF6B00]/20 hover:bg-[#E05E00] transition-all duration-200"
                  >
                    <FileUp className="h-4 w-4" />
                    Chọn file
                  </button>
                </label>
              </div>
            </div>

            {/* File list */}
            <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 border border-slate-100">
                    <FileText className="h-4 w-4 text-slate-500" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">Tài liệu đã tải lên</div>
                    <div className="text-xs text-slate-400">{files.length} tài liệu · {doneDocsCount} đã xử lý xong</div>
                  </div>
                </div>
                {materialsLoading && <LoaderCircle className="h-4 w-4 animate-spin text-[#FF6B00]" />}
              </div>

              {files.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                    <FileText className="h-7 w-7" />
                  </div>
                  <div className="text-sm font-semibold text-slate-500">Chưa có tài liệu nào</div>
                  <div className="text-xs text-slate-400 mt-1">Tải lên file để bắt đầu phân tích AI</div>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {files.map(f => (
                    <div key={f.id} className="group flex items-center gap-4 px-6 py-4 hover:bg-slate-50/60 transition-colors duration-150">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 border border-orange-100/50">
                        <FileText className="h-4 w-4 text-[#FF6B00]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-800 truncate">{f.name}</div>
                        {(f.jobStatus === 'PROCESSING' || f.status === 'processing') && Number.isFinite(f.progress) && f.progress > 0 && f.progress < 100 && (
                          <div className="mt-1.5">
                            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                              <span>Đang xử lý</span>
                              <span className="font-semibold text-[#FF6B00]">{f.progress}%</span>
                            </div>
                            <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
                              <div className="h-full rounded-full bg-gradient-to-r from-[#FF6B00] to-amber-400 transition-all duration-300" style={{ width: `${f.progress}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="shrink-0">
                        {f.jobStatus === 'PENDING' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                            <LoaderCircle className="h-3 w-3 animate-spin" />Đang chờ
                          </span>
                        ) : f.jobStatus === 'PROCESSING' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF7ED] border border-[#FFEDD5] px-2.5 py-1 text-[11px] font-semibold text-[#FF6B00]">
                            <LoaderCircle className="h-3 w-3 animate-spin" />Xử lý
                          </span>
                        ) : f.jobStatus === 'FAILED' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-100 px-2.5 py-1 text-[11px] font-semibold text-rose-600">Thất bại</span>
                        ) : f.status === 'done' || String(f.jobStatus || '').toUpperCase() === 'COMPLETED' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />Hoàn thành
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">Đang tải</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => cancelFile(f)}
                        className="shrink-0 opacity-0 group-hover:opacity-100 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 transition-all duration-150"
                        title="Xóa file"
                      >
                        <Zap className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column: AI Pipeline */}
          <div className="col-span-12 lg:col-span-5 space-y-5">
            <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 border border-orange-100">
                  <BrainCircuit className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">AI Engine Pipeline</div>
                  <div className="text-xs text-slate-400">Quy trình phân tích tài liệu</div>
                </div>
              </div>
              <div className="p-6">
                <ol className="space-y-0">
                  {[
                    { step: 1 as const, title: 'Tải lên tài liệu', desc: getStepStatus(1) === 'active' ? 'Đang tải file lên hệ thống...' : getStepStatus(1) === 'completed' ? `${files.length} tài liệu đã được thêm` : 'Tải file để bắt đầu', Icon: UploadCloud },
                    { step: 2 as const, title: 'Phân tích & Trích xuất', desc: getStepStatus(2) === 'active' ? (pendingJobsCount > 0 ? 'Đang chờ phân tích...' : 'Trích xuất văn bản và embeddings...') : getStepStatus(2) === 'completed' ? 'Đã trích xuất thành công' : 'Chờ bước tải lên hoàn thành', Icon: Layers3 },
                    { step: 3 as const, title: 'Sinh cấu trúc học tập', desc: getStepStatus(3) === 'active' ? 'AI đang sinh cấu trúc...' : getStepStatus(3) === 'completed' ? 'Cấu trúc đã sẵn sàng' : 'Chờ phân tích hoàn thành', Icon: Sparkles },
                  ].map(({ step, title, desc, Icon }, idx) => {
                    const status = getStepStatus(step);
                    return (
                      <li key={step} className="relative flex gap-4">
                        {idx < 2 && <div className="absolute left-[18px] top-[36px] w-px h-[calc(100%-4px)] bg-slate-100" />}
                        <div className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 ${status === 'completed' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : status === 'active' ? 'bg-[#FFF7ED] border-[#FFEDD5] text-[#FF6B00]' : 'bg-slate-50 border-slate-200 text-slate-300'}`}>
                          {status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> : status === 'active' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4 opacity-50" />}
                        </div>
                        <div className="pb-6 min-w-0">
                          <div className={`text-sm font-bold ${status === 'completed' ? 'text-emerald-700' : status === 'active' ? 'text-slate-800' : 'text-slate-400'}`}>{title}</div>
                          <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">{desc}</div>
                          {step === 2 && status === 'active' && processingProgress !== null && (
                            <div className="mt-2">
                              <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full rounded-full bg-gradient-to-r from-[#FF6B00] to-amber-400 transition-all duration-500" style={{ width: `${processingProgress}%` }} />
                              </div>
                              <div className="mt-1 text-[11px] text-slate-400 text-right">{processingProgress}%</div>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>

                {files.length > 0 && !results && (
                  <div className="mt-2 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={generating || pendingJobsCount > 0 || processingJobsCount > 0}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF6B00] px-4 py-3 text-sm font-bold text-white shadow-md shadow-[#FF6B00]/15 hover:bg-[#E05E00] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                    >
                      {generating ? (<><LoaderCircle className="h-4 w-4 animate-spin" />Đang phân tích AI...</>) : (<><Sparkles className="h-4 w-4" />Phân tích AI ngay</>)}
                    </button>
                  </div>
                )}

                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[{ label: 'Tổng file', value: docsCount, color: 'text-slate-700' }, { label: 'Hoàn thành', value: doneDocsCount, color: 'text-emerald-600' }, { label: 'Xử lý', value: processingDocsCount, color: 'text-[#FF6B00]' }].map(({ label, value, color }) => (
                    <div key={label} className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 text-center">
                      <div className={`text-base font-black ${color}`}>{value}</div>
                      <div className="text-[11px] font-medium text-slate-400 mt-0.5">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI learning configuration summary */}
            <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 border border-orange-100">
                  <SlidersHorizontal className="h-4 w-4 text-[#FF6B00]" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">Cấu hình lộ trình học</div>
                  <div className="text-xs text-slate-400">Mục tiêu & kế hoạch học tập của bạn</div>
                </div>
              </div>
              <div className="p-5 space-y-4">
                {onboarding.profile ? (
                  <>
                    <div className="rounded-xl bg-slate-50/60 border border-slate-100 p-3.5">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mục tiêu học tập</div>
                      <div className="text-xs font-semibold text-slate-700 leading-relaxed italic">
                        "{onboarding.profile.targetGoal}"
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5 pt-1">
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Clock3 className="h-3.5 w-3.5 text-slate-400" /> Cam kết học
                        </div>
                        <div className="text-xs font-bold text-slate-700">
                          {onboarding.profile.studyHoursPerWeek ? `${onboarding.profile.studyHoursPerWeek} giờ / tuần` : 'Chưa thiết lập'}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" /> Hạn hoàn thành
                        </div>
                        <div className="text-xs font-bold text-slate-700">
                          {onboarding.profile.targetDeadline ? new Date(onboarding.profile.targetDeadline).toLocaleDateString('vi-VN') : 'Chưa thiết lập'}
                        </div>
                      </div>

                      <div className="space-y-1.5 col-span-2 pt-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Compass className="h-3.5 w-3.5 text-slate-400" /> Tự tin & Lịch học
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {/* Confidence badge */}
                          {onboarding.profile.confidence === 'HIGH' && (
                            <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-100">
                              Tự tin cao
                            </span>
                          )}
                          {onboarding.profile.confidence === 'MEDIUM' && (
                            <span className="inline-flex items-center rounded-lg bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-100">
                              Tự tin vừa
                            </span>
                          )}
                          {onboarding.profile.confidence === 'LOW' && (
                            <span className="inline-flex items-center rounded-lg bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600 border border-amber-100">
                              Tự tin thấp
                            </span>
                          )}

                          {/* Language badge */}
                          {onboarding.profile.preferredLanguage && (
                            <span className="inline-flex items-center rounded-lg bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-100">
                              Mức: {onboarding.profile.preferredLanguage === 'vi' ? 'Tiếng Việt' : onboarding.profile.preferredLanguage === 'en' ? 'Tiếng Anh' : onboarding.profile.preferredLanguage}
                            </span>
                          )}

                          {/* Days badges mapping */}
                          {onboarding.profile.preferredDays && onboarding.profile.preferredDays.length > 0 && (
                            <span className="inline-flex items-center rounded-lg bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-100">
                              Lịch học: {onboarding.profile.preferredDays.length} ngày/tuần
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setActiveTab("config")}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition duration-150"
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        Chỉnh sửa cấu hình học
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-xs text-slate-400">Chưa thiết lập cấu hình lộ trình học</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab("config")}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#FF6B00]/10 px-4 py-2.5 text-xs font-bold text-[#FF6B00] hover:bg-[#FF6B00]/20 transition duration-150"
                    >
                      Cấu hình ngay
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CONFIG TAB — inline config form replaces modal */}
        <div className={`${activeTab === "config" ? "" : "hidden"}`}>
          {activeTab === "config" && (
            <EditWorkspaceConfigModal
              isOpen={true}
              onClose={() => setActiveTab("files")}
              workspaceId={id ?? ''}
              workspaceName={workspaceName}
              initialConfig={onboarding.profile}
              onSaved={() => void onboarding.fetchOnboardingProfile()}
              inline
            />
          )}
        </div>

        {/* ROADMAP TAB */}
        <div className={`mt-6 ${activeTab === "roadmap" ? "" : "hidden"}`}>
          <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 border border-orange-100">
                  <Layers3 className="h-4 w-4 text-[#FF6B00]" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">Cấu trúc học tập AI</div>
                  <div className="text-xs text-slate-400">Lộ trình được sinh tự động từ nội dung tài liệu</div>
                </div>
              </div>
              {results && (
                normalizedStatus === 'CONFIRMED' ? (
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />Đã xác nhận
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#FFF7ED] border border-[#FFEDD5] px-3 py-1 text-xs font-semibold text-[#FF6B00]">
                    <ShieldCheck className="w-3.5 h-3.5" />Chờ xác nhận
                  </div>
                )
              )}
            </div>
            <div className="p-6">
              {!results ? (
                (isGeneratingStructure || generateLoading) ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-50 border border-orange-100 text-[#FF6B00]"><LoaderCircle className="h-9 w-9 animate-spin" /></div>
                    <div>
                      <div className="text-base font-bold text-slate-800">Đang sinh lộ trình...</div>
                      <div className="text-sm text-slate-400 mt-1">Hệ thống đang phân tích và tổng hợp nội dung. Vui lòng chờ.</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-50 border border-slate-200 text-slate-300"><Layers3 className="h-9 w-9" /></div>
                    <div>
                      <div className="text-base font-bold text-slate-700">Chưa có cấu trúc học tập</div>
                      <div className="text-sm text-slate-400 mt-1 max-w-sm">Tải lên tài liệu và chờ xử lý xong để sinh lộ trình học bằng AI.</div>
                    </div>
                    <button type="button" onClick={handleRegenerateStructure} disabled={generating || confirming} className="inline-flex items-center gap-2 rounded-xl bg-[#FF6B00] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#FF6B00]/20 hover:bg-[#E05E00] disabled:cursor-not-allowed disabled:opacity-50 transition">
                      <Sparkles className="h-4 w-4" />{generating ? "Đang phân tích..." : "Phân tích AI"}
                    </button>
                  </div>
                )
              ) : (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center gap-3">
                    {normalizedStatus === 'CONFIRMED' ? (
                      <button type="button" onClick={() => navigate(`/app/workspaces/${id}/roadmap`)} className="inline-flex items-center gap-2 rounded-xl bg-[#FF6B00] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#FF6B00]/20 hover:bg-[#E05E00] transition">
                        <Sparkles className="h-4 w-4" />Xem lộ trình học tập chi tiết
                      </button>
                    ) : (
                      <>
                        <button type="button" onClick={handleRegenerateStructure} disabled={generating || confirming} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 transition">
                          {generating ? '⏳ Đang tạo lại...' : '🔄 Tạo lại cấu trúc'}
                        </button>
                        <button type="button" onClick={handleConfirm} disabled={confirming || generating} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-500/15 hover:bg-emerald-700 disabled:opacity-50 transition">
                          <Check size={16} />{confirming ? 'Đang lưu...' : 'Chấp nhận lộ trình'}
                        </button>
                      </>
                    )}
                  </div>
                  <LearningStructureDisplay chapters={visibleChapters} />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={`${activeTab === "progress" ? "" : "hidden"}`}>
          {activeTab === "progress" && <WorkspaceProgress workspaceId={workspaceId} className="mt-0" />}
        </div>

      </div>

      {/* ==================== WORKSPACE AI TUTOR FLOATING BUTTON ==================== */}
      {workspaceId && (
        <>
          <button
            type="button"
            onClick={() => setWorkspaceTutorOpen(true)}
            title="Hỏi AI Tutor về Workspace"
            className="fixed bottom-6 right-6 z-40 flex h-13 w-13 items-center justify-center rounded-full bg-[#FF6B00] text-white shadow-xl hover:bg-[#E05E00] hover:scale-110 active:scale-95 transition-all duration-200 border-2 border-orange-400/30"
          >
            <Bot className="h-6 w-6" />
          </button>

          {workspaceTutorOpen && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-end sm:p-6">
              <div
                className="absolute inset-0 bg-black/25 backdrop-blur-sm"
                onClick={() => setWorkspaceTutorOpen(false)}
              />
              <div className="relative w-full sm:w-[420px] h-[78vh] sm:h-[580px] rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden border border-slate-200/60">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0 bg-white">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 border border-orange-100 shadow-sm">
                      <Bot className="h-4.5 w-4.5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-800 leading-snug">AI Tutor</p>
                      <p className="text-[9px] text-slate-400 font-medium truncate max-w-[240px]">
                        Workspace · {workspaceName}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWorkspaceTutorOpen(false)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition shadow-sm"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1 min-h-0 p-4">
                  <AiTutorChat
                    mode="workspace"
                    contextId={workspaceId}
                    contextTitle={workspaceName}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
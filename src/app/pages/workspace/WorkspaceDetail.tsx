import EditWorkspaceConfigModal from "../../components/modals/EditWorkspaceConfigModal";
import OnboardingModal from "../../components/modals/OnboardingModal";
import useOnboardingProfile from "../../hooks/useOnboardingProfile";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import LearningStructureDisplay from "../../components/workspace/LearningStructureDisplay";
import WorkspaceProgress from "../../components/workspace/WorkspaceProgress";
import { ArrowLeft, BookOpenCheck, Bot, FileUp, Sparkles, Layers3, Radar, CheckCircle2, Clock3, FileText, BrainCircuit, UploadCloud, MoveDown, ShieldCheck, X, Zap, LoaderCircle, SlidersHorizontal, Check, Calendar, RefreshCw, type LucideIcon } from "lucide-react";
import EmptyState from "../../components/ui/EmptyState";
import { getStoredAuthSession } from "../../../api/authService";
import AiTutorChat from "./AiTutorChat";
import materialService, { type UploadedMaterialResponse as MaterialUploadedMaterialResponse } from "../../../api/materialService.ts";
import workspaceService from "../../../api/workspaceService";
import { API_BASE } from "../../../api/config";

const PROCESSING_JOB_ACTIVE_STATES = new Set(["PENDING", "RUNNING", "REVIEW_REQUIRED", "EXTRACTING", "CLEANING", "CHUNKING", "ANALYZING"]);
const PROCESSING_JOB_TERMINAL_STATES = new Set(["COMPLETED", "FAILED"]);

type UploadFile = {
  id: string;
  name: string;
  progress: number;
  status: "idle" | "processing" | "done";
  jobStatus?: string;
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
  status?: string;
  chapters?: LearningStructureChapter[];
  [key: string]: unknown;
};

type ApiResponse<T> = { data?: T; [key: string]: unknown; };
type StepStatus = 'completed' | 'active' | 'pending';
type WorkspaceDetailTab = "files" | "roadmap" | "progress" | "config";

function buildAuthHeaders(token: string | null, includeJsonContentType = true) {
  const headers: Record<string, string> = includeJsonContentType ? { "Content-Type": "application/json" } : {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const session = getStoredAuthSession();
  if (session?.sessionId) headers["X-Session-Id"] = session.sessionId;
  return headers;
}

function isProcessingState(status: string | null | undefined): boolean {
  return !!status && PROCESSING_JOB_ACTIVE_STATES.has(String(status).toUpperCase());
}

function isTerminalProcessingState(status: string | null | undefined, progressPercent: number | null): boolean {
  return PROCESSING_JOB_TERMINAL_STATES.has(String(status || "").toUpperCase()) || (typeof progressPercent === "number" && progressPercent >= 100);
}

function normalizeMaterialUploadFile(material: MaterialUploadedMaterialResponse, fallbackIndex: number): UploadFile {
  const jobStatus = material.processingJob?.status ?? material.processingStatus ?? material.uploadStatus ?? null;
  const progressPercent = material.processingJob?.progressPercent ?? 0;
  return {
    id: String(material.materialId || fallbackIndex),
    name: material.fileName || material.originalFileName || "untitled",
    progress: Number.isFinite(progressPercent) ? Number(progressPercent) : 0,
    status: isProcessingState(jobStatus) ? "processing" : String(jobStatus || "").toUpperCase() === "COMPLETED" ? "done" : "idle",
    jobStatus: jobStatus || undefined,
    materialId: String(material.materialId || fallbackIndex),
  };
}

export default function WorkspaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const shouldOpenOnboarding = !!(location.state as { openOnboarding?: boolean } | null)?.openOnboarding;
  
  const authSession = getStoredAuthSession();
  const token = authSession?.accessToken ?? null;
  const [activeTab, setActiveTab] = useState<WorkspaceDetailTab>("files");
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

  const structureData = (results?.data ? results.data : results) as LearningStructureResponse | null;
  const visibleChapters = Array.isArray(structureData?.chapters) ? structureData.chapters : [];
  const rawStatus = structureData?.status || "DRAFT";
  const normalizedStatus = String(rawStatus).toUpperCase();

  const doneDocsCount = files.filter(f => f.status === "done").length;
  const pendingJobsCount = files.filter(f => f.jobStatus === 'PENDING').length;
  const processingJobsCount = files.filter(f => f.jobStatus === 'PROCESSING').length;
  const completedJobsCount = files.filter(f => f.jobStatus === 'COMPLETED' || f.jobStatus === 'DONE').length;
  const failedJobsCount = files.filter(f => f.jobStatus === 'FAILED').length;
  const [workspaceName, setWorkspaceName] = useState<string>("Không gian làm việc");
  const workspaceId = id ?? '';
  const uploadRequests = useRef<Record<string, XMLHttpRequest>>({});

  function stopStructurePolling() {
    if (structurePollingRef.current) { clearInterval(structurePollingRef.current); structurePollingRef.current = null; }
    structurePollingAttemptsRef.current = 0;
    setIsGeneratingStructure(false);
  }

  function getStepStatus(step: 1 | 2 | 3): StepStatus {
    const hasActiveJobs = pendingJobsCount > 0 || processingJobsCount > 0;
    const hasTerminalJobs = completedJobsCount > 0 || failedJobsCount > 0;
    if (step === 1) return files.some(file => file.status === 'processing' && !file.jobStatus) ? 'active' : files.length > 0 ? 'completed' : 'pending';
    if (step === 2) return hasActiveJobs ? 'active' : hasTerminalJobs ? 'completed' : 'pending';
    return visibleChapters.length ? 'completed' : !structureGenerationRequested ? 'pending' : (isGeneratingStructure || structurePollingRef.current) ? 'active' : hasTerminalJobs ? 'active' : 'pending';
  }

  async function pollLearningStructureOnce() {
    structurePollingAttemptsRef.current += 1;
    const found = await fetchLearningStructure();
    if (found) {
      setIsGeneratingStructure(false);
      toast.success('Phân tích hoàn tất — lộ trình đã sẵn sàng', { id: 'structure-generation' });
      stopStructurePolling();
      return true;
    }
    if (structurePollingAttemptsRef.current >= 10) stopStructurePolling();
    return false;
  }

  function startStructurePolling() {
    if (structurePollingRef.current) return;
    structurePollingAttemptsRef.current = 0;
    void pollLearningStructureOnce();
    structurePollingRef.current = window.setInterval(() => { void pollLearningStructureOnce(); }, 1500);
  }

  useEffect(() => {
    setFiles([]);
    stopStructurePolling();
    setStructureGenerationRequested(false);
    setGenerateLoading(false);
    setIsGeneratingStructure(false);

    if (shouldOpenOnboarding) {
      setIsOnboardingOpen(true);
    }

    (async () => {
      if (!id) return;
      const fetchedStructure = await fetchLearningStructure();
      if (fetchedStructure) {
        setStructureGenerationRequested(true);
        setResults(fetchedStructure);
      }

      try {
        const p = await onboarding.fetchOnboardingProfile();
        if (!p && !shouldOpenOnboarding) {
          setIsOnboardingOpen(true);
        }
      } catch {
        if (!shouldOpenOnboarding) toast.error('Không thể tải cài đặt lộ trình (server lỗi)');
      }
    })();

    try {
      const raw = localStorage.getItem("skillSprint.workspaces");
      if (raw) {
        const list = JSON.parse(raw) as Array<{ id: string; name: string }>;
        const current = list.find(item => item.id === id);
        if (current?.name) setWorkspaceName(current.name);
      }
    } catch { /* ignore malformed local cache */ }

    if (id) {
      workspaceService.getWorkspace(id)
        .then(data => { if (data && data.name) setWorkspaceName(data.name); })
        .catch(() => toast.error("Không thể tải thông tin workspace"));
    }
    void reloadWorkspaceMaterials();

    return () => {
      Object.values(processingIntervals.current).forEach(iv => clearInterval(iv));
      processingIntervals.current = {};
      stopStructurePolling();
    };
  }, [id]);

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list) return;
    addFiles(list);
  };

  function startProcessingPolling(materialId: string) {
    if (!materialId || processingIntervals.current[materialId]) return;
    const iv = window.setInterval(async () => {
      try {
        if (!id) return;
        const job = await materialService.getMaterialProcessingJob(id, materialId);
        const progress = job.progressPercent ?? null;
        const status = job.status ?? null;

        if (typeof progress === 'number' || typeof status === 'string') {
          setFiles(prev => prev.map(x => (x.materialId === materialId || x.id === materialId) ? {
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
            if (structureGenerationRequested) startStructurePolling();
          } else {
            stopStructurePolling();
          }
        }
      } catch (e) { console.error('Polling error', e); }
    }, 3000);
    processingIntervals.current[materialId] = iv;
  }

  async function cancelFile(file: UploadFile) {
    if (file.materialId) {
      const intervalId = processingIntervals.current[file.materialId];
      if (intervalId) { clearInterval(intervalId); delete processingIntervals.current[file.materialId]; }
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
        const headers = buildAuthHeaders(token, false);
        const resp = await fetch(`${API_BASE}/api/workspaces/${id}/materials/${file.materialId}`, { method: 'DELETE', headers });
        if (!resp.ok) throw new Error(`Delete failed: ${resp.status}`);
        setFiles(prev => prev.filter(item => item.materialId !== file.materialId));
        toast.success('Đã xóa file khỏi backend');
        return;
      } catch {
        toast.error('Không thể xóa file trên backend');
        return;
      }
    }
    setFiles(prev => prev.filter(item => item.id !== file.id));
    toast.info('Đã ẩn file khỏi danh sách');
  }

  async function fetchLearningStructure(): Promise<ApiResponse<LearningStructureResponse> | LearningStructureResponse | null> {
    if (!id) return null;
    try {
      const headers = buildAuthHeaders(token);
      const resp = await fetch(`${API_BASE}/api/workspaces/${id}/learning-structure`, { method: 'GET', headers });
      if (resp.status === 404) { setResults(null); return null; }
      if (!resp.ok) throw new Error(`Learning structure fetch failed: ${resp.status}`);
      const res = (await resp.json().catch(() => null)) as ApiResponse<LearningStructureResponse> | LearningStructureResponse | null;
      setResults(res);
      return res;
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('404')) setResults(null);
      return null;
    }
  }

  const [generateLoading, setGenerateLoading] = useState(false);
  const [isGeneratingStructure, setIsGeneratingStructure] = useState(false);
  const [structureGenerationRequested, setStructureGenerationRequested] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [workspaceTutorOpen, setWorkspaceTutorOpen] = useState(false);

  const generating = isGeneratingStructure || generateLoading;

  const workspaceTabs: Array<{ id: WorkspaceDetailTab; label: string; icon: LucideIcon }> = [
    { id: "files", label: "Tài liệu", icon: FileText },
    { id: "roadmap", label: "Roadmap", icon: Layers3 },
    { id: "progress", label: "Tiến độ", icon: Radar },
    { id: "config", label: "Cấu hình", icon: SlidersHorizontal },
  ];

  async function reloadWorkspaceMaterials() {
    if (!id) return;
    setMaterialsLoading(true);
    try {
      const materials = await materialService.getWorkspaceMaterials(id);
      const mapped = materials.map((m, idx) => normalizeMaterialUploadFile(m, idx));
      setFiles(mapped);
      mapped.filter((item) => item.status === "processing").forEach((item) => startProcessingPolling(item.materialId ?? item.id));
    } catch {
      toast.error("Không thể tải danh sách tài liệu");
    } finally {
      setMaterialsLoading(false);
    }
  }

  async function handleGenerate() { await triggerStructureGeneration(false); }
  async function handleRegenerateStructure() { await triggerStructureGeneration(true); }

  async function triggerStructureGeneration(isRegenerate: boolean) {
    if (!id) return;
    try {
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
    } catch {
      toast.error(isRegenerate ? 'Không thể tạo lại cấu trúc' : 'Không thể bắt đầu phân tích', { id: 'structure-generation' });
      setIsGeneratingStructure(false);
      setStructureGenerationRequested(false);
    } finally {
      setGenerateLoading(false);
    }
  }

  async function handleConfirm() {
    if (!id || !results) return;
    try {
      setConfirming(true);
      const headers = buildAuthHeaders(token);
      const resp = await fetch(`${API_BASE}/api/workspaces/${id}/learning-structure/confirm`, { method: 'POST', headers, body: JSON.stringify({}) });
      if (!resp.ok) throw new Error('Confirm failed');
      const confPayload = await resp.json().catch(() => null);
      toast.success('Lộ trình đã được xác nhận');
      if (confPayload) setResults(confPayload);
      setStructureGenerationRequested(true);
    } catch { toast.error('Không thể xác nhận lộ trình'); }
    finally { setConfirming(false); }
  }

  const addFiles = (list: FileList | null) => {
    if (!list || !id) return;
    const filesArr = Array.from(list);
    filesArr.forEach(file => {
      const localId = String(Date.now()) + Math.random().toString(36).slice(2, 8);
      setFiles(p => [...p, { id: localId, name: file.name, progress: 0, status: 'processing' }]);
      (async () => {
        try {
          const contentType = file.type || 'application/octet-stream';
          const uploadResponse = await materialService.createMaterialUploadUrl(id, { fileName: file.name, contentType });
          const uploadUrl = uploadResponse.uploadUrl;
          const fileUrl = uploadResponse.fileUrl;
          const objectKey = uploadResponse.objectKey || fileUrl;
          if (!uploadUrl) throw new Error('No uploadUrl returned');

          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            uploadRequests.current[localId] = xhr;
            xhr.open('PUT', uploadUrl, true);
            xhr.setRequestHeader('Content-Type', contentType);
            xhr.upload.onprogress = (ev) => {
              if (ev.lengthComputable) {
                const pct = Math.round((ev.loaded / ev.total) * 100);
                setFiles(prev => prev.map(x => x.id === localId ? { ...x, progress: pct } : x));
              }
            };
            xhr.onload = () => {
              delete uploadRequests.current[localId];
              if (xhr.status >= 200 && xhr.status < 300) resolve(); else reject(new Error('Upload failed'));
            };
            xhr.onerror = () => { delete uploadRequests.current[localId]; reject(new Error('Upload network error')); };
            xhr.onabort = () => { delete uploadRequests.current[localId]; reject(new DOMException('Upload aborted', 'AbortError')); };
            xhr.send(file);
          });

          const uploaded = await materialService.confirmMaterialUpload(id, { objectKey, fileName: file.name, contentType });
          const returnedMaterialId = uploaded?.materialId || null;
          const returnedProgress = uploaded?.processingJob?.progressPercent ?? 0;
          const returnedJobStatus = uploaded?.processingJob?.status ?? uploaded?.processingStatus ?? null;

          setFiles(prev => prev.map(x => x.id === localId ? { ...x, materialId: String(returnedMaterialId || objectKey || localId), progress: Number.isFinite(returnedProgress) ? Number(returnedProgress) : 0, status: String(returnedJobStatus || '').toUpperCase() === 'COMPLETED' ? 'done' : 'processing', jobStatus: returnedJobStatus || 'PENDING' } : x));
          startProcessingPolling(String(returnedMaterialId || objectKey || localId));
          toast.success('Tải lên thành công — bắt đầu phân tích');
        } catch (err: unknown) {
          setFiles(prev => prev.map(x => x.id === localId ? { ...x, status: 'idle' } : x));
          if (!(err instanceof DOMException && err.name === 'AbortError')) {
            toast.error('Không thể tải lên file');
          }
        }
      })();
    });
  };

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); setDragActive(false); addFiles(e.dataTransfer.files); };

  return (
    <div className="relative min-h-screen bg-[#F9FAFB] p-4 sm:p-6 lg:p-8 font-inter text-slate-900 overflow-hidden">
      <div className="absolute left-[-10%] top-[-10%] -z-10 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#FF6B00]/5 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute right-[-10%] bottom-[-10%] -z-10 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-[#F59E0B]/5 to-transparent blur-[150px] pointer-events-none" />

      <div className="max-w-[1400px] mx-auto pb-24 lg:pb-0">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF6B00] mb-2">
              <BookOpenCheck className="w-3.5 h-3.5" />
              <span>AI Learning Workspace</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 truncate">{workspaceName}</h1>
          </div>
          <button type="button" onClick={() => navigate('/app/workspaces')} className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition shadow-sm">
            <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Trở về</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="w-full overflow-x-auto whitespace-nowrap flex flex-row gap-2 pb-2 custom-scrollbar touch-pan-x select-none mb-6 sm:mb-8 rounded-2xl border border-slate-200/70 bg-white p-1.5 shadow-sm">
          {workspaceTabs.map(tab => {
            const selected = activeTab === tab.id;
            return (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 text-sm shrink-0 flex items-center gap-2 rounded-xl font-bold whitespace-nowrap transition duration-200 ${selected ? "bg-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/20" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}>
                <tab.icon className="h-4 w-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* FILES TAB */}
        <div className={`${activeTab === "files" ? "flex flex-col lg:flex-row gap-6 mb-6" : "hidden"}`}>
          {/* Main Drag-Drop & Files List Area */}
          <div className="w-full lg:flex-1 space-y-5">
            <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 border border-orange-100"><UploadCloud className="h-4 w-4 text-[#FF6B00]" /></div>
                <div>
                  <div className="text-sm font-bold text-slate-800">Tải lên tài liệu</div>
                  <div className="text-xs text-slate-400">PDF, DOCX, TXT — tối đa 50MB</div>
                </div>
              </div>
              <div className="p-4 sm:p-6 lg:p-8">
                <label onDragEnter={() => setDragActive(true)} onDragOver={(e) => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={onDrop} className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-8 sm:py-10 cursor-pointer transition-all duration-200 ${dragActive ? 'border-[#FF6B00]/50 bg-[#FFF7ED]/50' : 'border-slate-200 hover:border-[#FF6B00]/30 hover:bg-slate-50/80'}`}>
                  <input ref={fileRef} type="file" multiple className="hidden" onChange={onFiles} />
                  <div className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl ${dragActive ? 'bg-[#FF6B00] text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}><MoveDown className="h-5 w-5 sm:h-6 sm:w-6" /></div>
                  <div className="text-center px-4">
                    <div className="text-xs sm:text-sm font-semibold text-slate-700">Kéo &amp; thả tài liệu vào đây</div>
                    <div className="text-[11px] sm:text-xs text-slate-400 mt-1">hoặc nhấn để chọn file từ máy tính</div>
                  </div>
                  <button type="button" onClick={() => fileRef.current?.click()} className="mt-1 inline-flex items-center gap-2 rounded-xl bg-[#FF6B00] px-4 sm:px-5 py-2 sm:py-2.5 min-h-[44px] text-xs font-bold text-white shadow-md shadow-[#FF6B00]/20 hover:bg-[#E05E00] transition">
                    <FileUp className="h-4 w-4" /> Chọn file
                  </button>
                </label>
              </div>
            </div>

            {/* File List wrapper */}
            <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 border border-slate-100"><FileText className="h-4 w-4 text-slate-500" /></div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">Tài liệu đã tải lên</div>
                    <div className="text-xs text-slate-400">{files.length} tài liệu · {doneDocsCount} hoàn thành</div>
                  </div>
                </div>
                {materialsLoading && <LoaderCircle className="h-4 w-4 animate-spin text-[#FF6B00]" />}
              </div>

              {materialsLoading && files.length === 0 ? (
                <div className="divide-y divide-slate-50" aria-busy="true">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-4 px-6 py-4">
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-200/80 animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 w-2/3 rounded bg-slate-200/80 animate-pulse" />
                        <div className="h-2.5 w-1/3 rounded bg-slate-100 animate-pulse" />
                      </div>
                      <div className="h-6 w-20 rounded-full bg-slate-100 animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : files.length === 0 ? (
                <EmptyState
                  variant="plain"
                  icon={FileText}
                  title="Chưa có tài liệu nào — hãy tải lên tài liệu đầu tiên!"
                  description="Thêm PDF, DOCX hoặc TXT để AI bắt đầu phân tích và xây dựng lộ trình học cho bạn."
                  actionLabel="Chọn file ngay"
                  actionIcon={FileUp}
                  onAction={() => fileRef.current?.click()}
                />
              ) : (
                <div className="divide-y divide-slate-50">
                  {files.map(f => (
                    <div key={f.id} className="group flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 hover:bg-slate-50/60 transition">
                      <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 border border-orange-100/50"><FileText className="h-4 w-4 text-[#FF6B00]" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-slate-800 truncate">{f.name}</div>
                        {(f.jobStatus === 'PROCESSING' || f.status === 'processing') && Number.isFinite(f.progress) && f.progress > 0 && f.progress < 100 && (
                          <div className="mt-1.5">
                            <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
                              <div className="h-full rounded-full bg-gradient-to-r from-[#FF6B00] to-amber-400 transition" style={{ width: `${f.progress}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="shrink-0">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-semibold ${f.jobStatus === 'COMPLETED' || f.status === 'done' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-[#FF6B00]'}`}>
                          {f.jobStatus === 'COMPLETED' || f.status === 'done' ? 'Hoàn thành' : 'Đang xử lý'}
                        </span>
                      </div>
                      <button type="button" onClick={() => cancelFile(f)} className="shrink-0 opacity-0 group-hover:opacity-100 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition"><Zap className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AI Side Panels Column (Pipeline & Configuration) */}
          <div className="w-full lg:w-[380px] flex flex-col gap-5 flex-shrink-0">
            <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 border border-orange-100"><BrainCircuit className="h-4 w-4 text-orange-500" /></div>
                <div>
                  <div className="text-sm font-bold text-slate-800">AI Engine Pipeline</div>
                  <div className="text-xs text-slate-400">Quy trình phân tích tài liệu</div>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <ol className="space-y-0">
                  {[
                    { step: 1 as const, title: 'Tải lên tài liệu', desc: getStepStatus(1) === 'active' ? 'Đang tải file...' : `${files.length} tài liệu đã thêm`, Icon: UploadCloud },
                    { step: 2 as const, title: 'Phân tích & Trích xuất', desc: getStepStatus(2) === 'active' ? 'Trích xuất văn bản AI...' : 'Đã trích xuất xong', Icon: Layers3 },
                    { step: 3 as const, title: 'Sinh cấu trúc học tập', desc: getStepStatus(3) === 'active' ? 'AI đang sinh lộ trình...' : 'Lộ trình sẵn sàng', Icon: Sparkles },
                  ].map(({ step, title, desc, Icon }, idx) => {
                    const status = getStepStatus(step);
                    return (
                      <li key={step} className="relative flex gap-4">
                        {idx < 2 && <div className="absolute left-[18px] top-[36px] w-px h-[calc(100%-4px)] bg-slate-100" />}
                        <div className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all ${status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : status === 'active' ? 'bg-[#FFF7ED] text-[#FF6B00] border-[#FFEDD5]' : 'bg-slate-50 text-slate-300'}`}>
                          {status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> : status === 'active' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4 opacity-50" />}
                        </div>
                        <div className="pb-6">
                          <div className="text-sm font-bold text-slate-800">{title}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{desc}</div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
                {files.length > 0 && !results && (
                  <button type="button" onClick={handleGenerate} disabled={generateLoading} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF6B00] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#E05E00] disabled:opacity-60 disabled:cursor-not-allowed">
                    {generateLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {generateLoading ? "Đang phân tích..." : "Phân tích AI ngay"}
                  </button>
                )}
              </div>
            </div>

            {/* AI learning configuration summary */}
            <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 border border-orange-100"><SlidersHorizontal className="h-4 w-4 text-[#FF6B00]" /></div>
                <div>
                  <div className="text-sm font-bold text-slate-800">Cấu hình lộ trình học</div>
                </div>
              </div>
              <div className="p-4 sm:p-5 space-y-4">
                {onboarding.profile ? (
                  <>
                    <div className="rounded-xl bg-slate-50/60 p-3.5 border border-slate-100">
                      <div className="text-xs font-semibold text-slate-700 leading-relaxed italic">"{onboarding.profile.targetGoal}"</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3.5 pt-1">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" /> Cam kết học</div>
                        <div className="text-xs font-bold text-slate-700 mt-1">{onboarding.profile.studyHoursPerWeek} giờ/tuần</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Hạn hoàn thành</div>
                        <div className="text-xs font-bold text-slate-700 mt-1">{onboarding.profile.targetDeadline ? new Date(onboarding.profile.targetDeadline).toLocaleDateString('vi-VN') : 'Chưa thiết lập'}</div>
                      </div>
                    </div>
                    <button type="button" onClick={() => setActiveTab("config")} className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition">Chỉnh sửa cấu hình</button>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-xs text-slate-400">Chưa thiết lập cấu hình lộ trình học</p>
                    <button type="button" onClick={() => setIsOnboardingOpen(true)} className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#FF6B00]/10 px-4 py-2.5 text-xs font-bold text-[#FF6B00]">Thiết lập ngay</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CONFIG TAB */}
        <div className={`${activeTab === "config" ? "" : "hidden"}`}>
          {activeTab === "config" && (
            <EditWorkspaceConfigModal isOpen={true} onClose={() => setActiveTab("files")} workspaceId={workspaceId} workspaceName={workspaceName} initialConfig={onboarding.profile} onSaved={() => void onboarding.fetchOnboardingProfile()} inline />
          )}
        </div>

        {/* ROADMAP TAB */}
        <div className={`${activeTab === "roadmap" ? "" : "hidden"}`}>
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
                        <button type="button" onClick={handleRegenerateStructure} disabled={generating || confirming} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed transition">
                          {generating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                          {generating ? 'Đang tạo lại...' : 'Tạo lại cấu trúc'}
                        </button>
                        <button type="button" onClick={handleConfirm} disabled={confirming || generating} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-500/15 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition">
                          {confirming ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check size={16} />}
                          {confirming ? 'Đang lưu...' : 'Chấp nhận lộ trình'}
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

        {/* PROGRESS TAB */}
        <div className={`${activeTab === "progress" ? "" : "hidden"}`}>
          {activeTab === "progress" && <WorkspaceProgress workspaceId={workspaceId} />}
        </div>
      </div>

      {/* ==================== WORKSPACE AI TUTOR FLOATING BUTTON ==================== */}
      {/* 🔥 FIX: Đẩy tọa độ bottom lên cao (bottom-24) trên mobile để không bị đè bởi thanh Bottom Nav */}
      <button type="button" onClick={() => setWorkspaceTutorOpen(true)} className="fixed bottom-24 right-6 md:bottom-6 md:right-6 z-40 flex h-13 w-13 items-center justify-center rounded-full bg-[#FF6B00] text-white shadow-xl hover:bg-[#E05E00] transition-all"><Bot className="h-6 w-6" /></button>

      {/* AI Tutor Side Overlay Drawer */}
      {workspaceTutorOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-end sm:p-6">
          <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={() => setWorkspaceTutorOpen(false)} />
          <div className="relative w-full sm:w-[420px] h-[82vh] sm:h-[580px] rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden border border-slate-200/60">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
              <span className="text-sm font-extrabold text-slate-800">AI Tutor</span>
              <button type="button" onClick={() => setWorkspaceTutorOpen(false)} className="text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 p-4 overflow-hidden"><AiTutorChat mode="workspace" contextId={workspaceId} contextTitle={workspaceName} /></div>
          </div>
        </div>
      )}

      {/* Onboarding Profile Modal Trigger */}
      <OnboardingModal
        open={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        workspaceId={workspaceId}
        initialValues={onboarding.profile}
        mode={shouldOpenOnboarding ? "onboarding" : "edit"}
      />
    </div>
  );
}
import OnboardingModal from "../components/OnboardingModal.tsx";
import useOnboardingProfile from "../hooks/useOnboardingProfile";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import LearningStructureDisplay from "../components/LearningStructureDisplay.tsx";
import { ArrowLeft, BookOpenCheck, FileUp, Sparkles, ClipboardList, Layers3, Radar, CheckCircle2, Clock3, FileText, BrainCircuit, UploadCloud, MoveDown, ShieldCheck, Zap, LoaderCircle, Copy, SlidersHorizontal } from "lucide-react";
import { getStoredAuthSession } from "../../api/authService";

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

type StepStatus = 'completed' | 'active' | 'pending';

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

export default function WorkspaceDetail(){
  const { id } = useParams();
  const navigate = useNavigate();
  const authSession = getStoredAuthSession();
  const token = authSession?.accessToken ?? null;
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const onboarding = useOnboardingProfile(id);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [results, setResults] = useState<any | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const processingIntervals = useRef<Record<string, number>>({});
  const structurePollingRef = useRef<number | null>(null);
  const structurePollingAttemptsRef = useRef(0);

  const docsCount = files.length;
  const doneDocsCount = files.filter(f => f.status === "done").length;
  const processingDocsCount = files.filter(f => f.status === "processing").length;
  const chaptersCount = results?.chapters?.length ?? 0;
  const tasksCount = results?.tasks?.length ?? 0;
  const avgProgress = files.length ? Math.round(files.reduce((s,f)=>s+f.progress,0)/files.length) : 0;
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

    if (results?.chapters?.length) {
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
    const found = await fetchLearningStructure();
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
    // clear results when entering different workspace
    setResults(null);
    setFiles([]);
    stopStructurePolling();
    setStructureGenerationRequested(false);
    setGenerateLoading(false);
    setIsGeneratingStructure(false);
    // fetch onboarding profile; open modal if none
    (async ()=>{
      if(!id) return;
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
    // load existing materials from backend
    (async ()=>{
      if (!id) return;
      setMaterialsLoading(true);
      try{
        const headers = buildAuthHeaders(token);
        const resp = await fetch(`${API_BASE}/api/workspaces/${id}/materials`, { method: 'GET', headers });
        if (resp.ok) {
          const payload = await resp.json().catch(()=>null) as any;
          const list = Array.isArray(payload?.data || payload) ? (payload.data || payload) : [];
          const mapped: UploadFile[] = list.map((m: any) => {
            const jobStatus = m.processingJob?.status ?? m.processingStatus ?? m.status ?? null;
            const progressPercent = m.processingJob?.progressPercent ?? m.progressPercent ?? 0;
            return {
              id: String(m.materialId || m.id || Math.random()),
              name: m.fileName || m.name || 'untitled',
              progress: Number.isFinite(progressPercent) ? Number(progressPercent) : 0,
              status: jobStatus === 'DONE' || jobStatus === 'COMPLETED' ? 'done' : (jobStatus === 'PROCESSING' || jobStatus === 'PENDING' ? 'processing' : 'idle'),
              jobStatus: jobStatus,
              materialId: String(m.materialId || m.id),
            };
          });
          setFiles(mapped);
          mapped.filter(x=>x.status==='processing').forEach(f=>startProcessingPolling(f.materialId ?? f.id));
        }
      }catch(err:any){ console.error('Failed to load materials', err); }
      finally{ setMaterialsLoading(false); }
    })();
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
        const headers = buildAuthHeaders(token);
        const resp = await fetch(`${API_BASE}/api/workspaces/${id}/materials/${materialId}/processing-job`, { method: 'GET', headers });
        if (!resp.ok) return;
        const payload = await resp.json().catch(()=>null) as any;
        console.log("Job Data:", payload?.data ?? payload);
        const progress = payload?.data?.progressPercent ?? payload?.progressPercent ?? null;
            const status = payload?.data?.status ?? payload?.status ?? null;
            const errorCode = payload?.data?.errorCode ?? payload?.errorCode ?? null; // Check for errorCode
            if (typeof progress === 'number' || typeof status === 'string'){
              setFiles(prev => prev.map(x => (x.materialId===materialId || x.id===materialId) ? {
                ...x,
                progress: typeof progress === 'number' ? progress : x.progress,
                status: (status === 'DONE' || status === 'COMPLETED') ? 'done' : (status === 'FAILED' ? 'idle' : 'processing'),
                jobStatus: status,
              } : x));
            }
            // Stop polling once backend reports a terminal state.
            if (status === 'DONE' || status === 'COMPLETED' || status === 'FAILED' || (typeof progress === 'number' && progress>=100)){
              clearInterval(processingIntervals.current[materialId]);
              delete processingIntervals.current[materialId];
              if (status === 'DONE' || status === 'COMPLETED' || (typeof progress === 'number' && progress>=100)) {
                if (structureGenerationRequested) {
                  startStructurePolling();
                }
              } else {
                stopStructurePolling();
              }
            }
            if (status === 'FAILED' && errorCode) {
              console.error(`Job ${materialId} failed with error code: ${errorCode}`);
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

  async function fetchLearningStructure(): Promise<boolean>{
    if (!id) return false;
    try{
      const headers = buildAuthHeaders(token);
      const resp = await fetch(`${API_BASE}/api/workspaces/${id}/learning-structure`, { method: 'GET', headers });
      if (resp.status === 404) {
        setResults(null);
        return false;
      }

      if (!resp.ok) {
        throw new Error(`Learning structure fetch failed: ${resp.status}`);
      }

      const payload = await resp.json().catch(()=>null) as any;
      const data = payload?.data || payload || null;
      setResults(data);
      return true;
    }catch(err:any){
      if (String(err?.message || '').includes('404')) {
        setResults(null);
        return false;
      }

      console.error('Failed to fetch learning structure (non-404 error)', err);
      return false;
    }
  }

  const [generateLoading, setGenerateLoading] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false); // New state for confirmation status
  const [isGeneratingStructure, setIsGeneratingStructure] = useState(false);
  const [structureGenerationRequested, setStructureGenerationRequested] = useState(false);

  async function handleGenerate(){
    if (!id) return;
    try{
      // Show spinner immediately when user starts generation
      setStructureGenerationRequested(true);
      setIsGeneratingStructure(true);
      setGenerateLoading(true);
      setIsConfirmed(false); // Reset confirmation status on new generation
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
      const headers = buildAuthHeaders(token);
      const resp = await fetch(`${API_BASE}/api/workspaces/${id}/learning-structure/confirm`, { method: 'POST', headers, body: JSON.stringify({}) });
      if (!resp.ok) throw new Error('Confirm failed');
      toast.success('Lộ trình đã được xác nhận');
      setIsConfirmed(true); // Disable button after successful confirmation
    }catch(err:any){ console.error('Confirm error', err); toast.error('Không thể xác nhận lộ trình'); }
  }

  const addFiles = (list: FileList | null) => {
    if (!list || !id) return;
    const filesArr = Array.from(list);
    filesArr.forEach(file => {
      const localId = String(Date.now()) + Math.random().toString(36).slice(2,8);
      setFiles(p => [...p, { id: localId, name: file.name, progress: 0, status: 'processing' }]);
      (async ()=>{
        try{
          const backendHeaders = buildAuthHeaders(token);
          const contentType = file.type || 'application/octet-stream';

          // Step 1: Get upload URL from backend (Rule 1: Authorization header required)
          const urlResp = await fetch(`${API_BASE}/api/workspaces/${id}/materials/upload-url`, { method: 'POST', headers: backendHeaders, body: JSON.stringify({ fileName: file.name, contentType }) });
          if (!urlResp.ok) throw new Error('Upload URL request failed');
          const urlPayload = await urlResp.json().catch(()=>null) as any;
          const uploadUrl = urlPayload?.data?.uploadUrl || urlPayload?.uploadUrl;
          const fileUrl = urlPayload?.data?.fileUrl || urlPayload?.fileUrl;
          const objectKey = urlPayload?.data?.objectKey || urlPayload?.objectKey || fileUrl;
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
          const confirmBody = { objectKey: objectKey, fileName: file.name, contentType };
          const confResp = await fetch(`${API_BASE}/api/workspaces/${id}/materials/confirm`, { method: 'POST', headers: backendHeaders, body: JSON.stringify(confirmBody) });
          if (!confResp.ok) {
            const errText = await confResp.text().catch(()=>null);
            throw new Error('Confirm upload failed: ' + (errText || confResp.statusText));
          }
          const confPayload = await confResp.json().catch(()=>null) as any;
          const uploaded = confPayload?.data || confPayload || null;
          const returnedMaterialId = uploaded?.materialId || uploaded?.id || uploaded?.material_id || null;
          const returnedProgress = uploaded?.processingJob?.progressPercent ?? uploaded?.progressPercent ?? null;
          const returnedJobStatus = uploaded?.processingJob?.status ?? uploaded?.processingStatus ?? uploaded?.status ?? null;

          setFiles(prev => prev.map(x => x.id===localId ? { ...x, materialId: String(returnedMaterialId || objectKey || localId), progress: Number.isFinite(returnedProgress) ? Number(returnedProgress) : 0, status: returnedJobStatus === 'DONE' ? 'done' : 'processing', jobStatus: returnedJobStatus || 'PENDING' } : x));
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
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerate}
              disabled={doneDocsCount < 1 || generateLoading}
              className={`inline-flex items-center gap-3 px-4 py-2 rounded-lg text-white font-semibold transition ${doneDocsCount<1 || generateLoading ? 'bg-slate-300 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'}`}
            >
              <Zap className="w-4 h-4" />
              {generateLoading ? 'Đang phân tích...' : 'Bắt đầu Phân tích AI'}
            </button>
            <button
              type="button"
              onClick={() => setIsConfigOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Cấu hình lộ trình
            </button>
            <button onClick={()=>navigate('/app/workspaces')} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:shadow">
              <ArrowLeft className="w-4 h-4" /> Quay lại
            </button>
          </div>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-100">
            <div className="text-xs text-slate-400">Source Materials</div>
            <div className="mt-2 flex items-center justify-between">
              <div className="text-lg font-bold">{docsCount}</div>
              <div className="text-xs text-slate-400">Total</div>
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-100">
            <div className="text-xs text-slate-400">Generated Chapters</div>
            <div className="mt-2 flex items-center justify-between">
              <div className="text-lg font-bold">{chaptersCount}</div>
              <div className="text-xs text-slate-400">Mapped</div>
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-100">
            <div className="text-xs text-slate-400">AI Tasks Created</div>
            <div className="mt-2 flex items-center justify-between">
              <div className="text-lg font-bold">{tasksCount}</div>
              <div className="text-xs text-slate-400">Actionable</div>
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-100">
            <div className="text-xs text-slate-400">Workspace Progress</div>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg width="48" height="48" viewBox="0 0 48 48" className="-mr-1">
                  <circle cx="24" cy="24" r="18" stroke="#E6E9EE" strokeWidth="6" fill="none" />
                  <circle
                    cx="24"
                    cy="24"
                    r="18"
                    stroke="#FF9800"
                    strokeWidth="6"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={Math.PI * 2 * 18}
                    strokeDashoffset={(1 - (avgProgress/100)) * (Math.PI * 2 * 18)}
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '24px 24px' }}
                  />
                </svg>
                <div>
                  <div className="text-lg font-bold">{avgProgress}%</div>
                  <div className="text-xs text-slate-400">Overall</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="grid grid-cols-12 gap-6 mb-6">
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
        <div className="mt-6">
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
                  <div className="ml-auto">
                    <button
                      onClick={handleConfirm}
                      disabled={isConfirmed || !results?.chapters?.length} // Disable if confirmed or no chapters
                      className={`px-3 py-1 rounded-md text-sm ${isConfirmed || !results?.chapters?.length ? 'bg-slate-300 text-slate-600 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
                    >
                      Xác nhận lộ trình
                    </button>
                  </div>
                </div>
                {results?.chapters && results.chapters.length > 0 ? (
                  <LearningStructureDisplay chapters={results.chapters} />
                ) : (
                  <div className="rounded-md border border-slate-100 p-3 text-sm text-slate-600">Không có chương nào được tạo.</div>
                )}
              </div>
            )}
          </div>
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

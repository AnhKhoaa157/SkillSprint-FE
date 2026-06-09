import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import workspaceService from "../../../api/workspaceService";
import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  Check,
  LayoutGrid,
  PencilLine,
  Plus,
  Sparkles,
  Trash2,
  X,
  LoaderCircle,
  Search,
  ArrowUpDown,
} from "lucide-react";
import WorkspaceCard from "../../components/workspace/WorkspaceCard";

type WorkspaceLearningStructure = {
  status?: "DRAFT" | "CONFIRMED" | string;
  tasks?: unknown[] | null;
  [key: string]: unknown;
};

type WorkspaceApiItem = {
  workspaceId?: unknown;
  id?: unknown;
  name?: unknown;
  title?: unknown;
  workspaceName?: unknown;
  description?: unknown;
  summary?: unknown;
  createdAt?: unknown;
  created_at?: unknown;
  createdDate?: unknown;
  updatedAt?: unknown;
  updated_at?: unknown;
  documentsCount?: unknown;
  documentCount?: unknown;
  materialsCount?: unknown;
  tasksCount?: unknown;
  documents?: unknown[] | null;
  materials?: unknown[] | null;
  uploadedMaterials?: unknown[] | null;
  learningStructure?: WorkspaceLearningStructure | null;
  [key: string]: unknown;
};

type WorkspaceItem = {
  id: string;
  name: string;
  createdAt?: string;
  description?: string | null;
  totalDocuments: number;
  totalTasks: number;
  progress: number;
  raw: WorkspaceApiItem;
};

type NotificationVariant = "create" | "update" | "delete" | "error" | "success";

type NotificationItem = {
  id: string;
  variant: NotificationVariant;
  message: string;
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

function firstDefinedNumber(values: unknown[]): number {
  for (const value of values) {
    const parsed = toNumber(value);
    if (typeof parsed === "number") {
      return parsed;
    }
  }

  return 0;
}

function extractWorkspaceItems(payload: unknown): WorkspaceApiItem[] {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord) as WorkspaceApiItem[];
  }

  if (!isRecord(payload)) {
    return [];
  }

  const candidates = [payload.data, payload.content, payload.items, payload.workspaces, payload.payload, payload.result];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter(isRecord) as WorkspaceApiItem[];
    }

    if (isRecord(candidate)) {
      const nested = extractWorkspaceItems(candidate);
      if (nested.length > 0) {
        return nested;
      }
    }
  }

  return [];
}

function getWorkspaceDocumentCount(workspace: WorkspaceApiItem) {
  return firstDefinedNumber([
    workspace.documentsCount,
    workspace.documentCount,
    workspace.materialsCount,
    Array.isArray(workspace.documents) ? workspace.documents.length : undefined,
    Array.isArray(workspace.materials) ? workspace.materials.length : undefined,
    Array.isArray(workspace.uploadedMaterials) ? workspace.uploadedMaterials.length : undefined,
  ]);
}

function getWorkspaceTasksCount(workspace: WorkspaceApiItem) {
  const learningStructure = isRecord(workspace.learningStructure) ? workspace.learningStructure : null;

  return firstDefinedNumber([
    workspace.tasksCount,
    Array.isArray(learningStructure?.tasks) ? learningStructure.tasks.length : undefined,
    Array.isArray(learningStructure?.chapters) ? learningStructure.chapters.length : undefined,
  ]);
}

function getWorkspaceProgress(workspace: WorkspaceApiItem) {
  return workspace.learningStructure?.status === "CONFIRMED" ? 100 : 0;
}

function normalizeWorkspaceItem(workspace: WorkspaceApiItem, index: number): WorkspaceItem {
  const id =
    toText(workspace.workspaceId) ??
    toText(workspace.id) ??
    toText(workspace["workspace_id"]) ??
    `workspace-${index}`;

  const name =
    toText(workspace.name) ??
    toText(workspace.title) ??
    toText(workspace.workspaceName) ??
    "Không có tên";

  const description = toText(workspace.description) ?? toText(workspace.summary) ?? null;

  const createdAt =
    toText(workspace.createdAt) ??
    toText(workspace.created_at) ??
    toText(workspace.createdDate) ??
    toText(workspace.updatedAt) ??
    toText(workspace.updated_at);

  return {
    id,
    name,
    description,
    createdAt,
    totalDocuments: getWorkspaceDocumentCount(workspace),
    totalTasks: getWorkspaceTasksCount(workspace),
    progress: getWorkspaceProgress(workspace),
    raw: workspace,
  };
}

export default function Workspaces() {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [nameError, setNameError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [editTarget, setEditTarget] = useState<WorkspaceItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkspaceItem | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "alphabetical" | "documents">("newest");

  useEffect(() => {
    let active = true;

    const fetchWorkspacesList = async () => {
      setLoading(true);

      try {
        const res = (await workspaceService.getMyWorkspaces()) as unknown;
        console.log("DEBUG_RAW_WORKSPACES_PAYLOAD:", res);
        const mapped = extractWorkspaceItems(res).map((workspace, index) => normalizeWorkspaceItem(workspace, index));

        if (active) {
          setWorkspaces(mapped);
        }
      } catch (error) {
        console.error(error);
        if (active) {
          setWorkspaces([]);
          addNotification("error", error instanceof Error ? error.message : "Không thể tải workspaces");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void fetchWorkspacesList();

    return () => {
      active = false;
    };
  }, [reloadToken]);

  const filteredAndSortedWorkspaces = useMemo(() => {
    let result = [...workspaces];

    // Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (w) =>
          w.name.toLowerCase().includes(query) ||
          (w.description && w.description.toLowerCase().includes(query))
      );
    }

    // Sort
    if (sortBy === "newest") {
      result.sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      });
    } else if (sortBy === "alphabetical") {
      result.sort((a, b) => a.name.localeCompare(b.name, "vi"));
    } else if (sortBy === "documents") {
      result.sort((a, b) => b.totalDocuments - a.totalDocuments);
    }

    return result;
  }, [workspaces, searchQuery, sortBy]);

  function addNotification(variant: NotificationVariant, message: string) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setNotifications((current) => [{ id, variant, message }, ...current].slice(0, 4));

    window.setTimeout(() => {
      setNotifications((current) => current.filter((item) => item.id !== id));
    }, 3500);
  }

  const openCreateModal = () => {
    setNameError(null);
    setWorkspaceName("");
    setShowCreateModal(true);
  };

  const openEditModal = (workspace: WorkspaceItem) => {
    setNameError(null);
    setWorkspaceName(workspace.name);
    setEditTarget(workspace);
  };

  const submitCreateWorkspace = async () => {
    const trimmedName = workspaceName.trim();

    if (!trimmedName) {
      setNameError("Vui lòng nhập tên workspace");
      return;
    }

    if (workspaces.some((workspace) => workspace.name.trim().toLowerCase() === trimmedName.toLowerCase())) {
      setNameError("Tên workspace đã tồn tại");
      addNotification("error", "Tên workspace đã tồn tại");
      return;
    }

    setActionBusy(true);

    try {
      const created = await workspaceService.createWorkspace({ name: trimmedName });
      const normalized = normalizeWorkspaceItem(created as unknown as WorkspaceApiItem, 0);
      setWorkspaces((current) => [normalized, ...current]);
      setWorkspaceName("");
      setShowCreateModal(false);
      addNotification("create", "Tạo workspace thành công");
      window.dispatchEvent(new CustomEvent("workspace_created", { detail: { workspaceId: created.workspaceId } }));
      navigate(`/app/workspaces/${normalized.id}`, { state: { openOnboarding: true } });
    } catch (error) {
      console.error(error);
      addNotification("error", error instanceof Error ? error.message : "Tạo workspace thất bại");
    } finally {
      setActionBusy(false);
    }
  };

  const submitRenameWorkspace = async () => {
    if (!editTarget) return;

    const trimmedName = workspaceName.trim();

    if (!trimmedName) {
      setNameError("Vui lòng nhập tên workspace");
      return;
    }

    if (workspaces.some((workspace) => workspace.id !== editTarget.id && workspace.name.trim().toLowerCase() === trimmedName.toLowerCase())) {
      setNameError("Tên workspace đã tồn tại");
      addNotification("error", "Tên workspace đã tồn tại");
      return;
    }

    setActionBusy(true);

    try {
      const updated = await workspaceService.updateWorkspace(editTarget.id, { name: trimmedName });
      setWorkspaces((current) =>
        current.map((workspace) =>
          workspace.id === editTarget.id
            ? {
                ...workspace,
                name: updated.name ?? trimmedName,
                description: updated.description ?? workspace.description,
                createdAt: updated.createdAt ?? workspace.createdAt,
              }
            : workspace,
        ),
      );
      setWorkspaceName("");
      setEditTarget(null);
      addNotification("update", "Cập nhật workspace thành công");
      window.dispatchEvent(new CustomEvent("workspace_updated", { detail: { workspaceId: editTarget.id } }));
    } catch (error) {
      console.error(error);
      addNotification("error", error instanceof Error ? error.message : "Cập nhật workspace thất bại");
    } finally {
      setActionBusy(false);
    }
  };

  const submitDeleteWorkspace = async () => {
    if (!deleteTarget) return;

    setActionBusy(true);

    try {
      await workspaceService.deleteWorkspace(deleteTarget.id);
      setWorkspaces((current) => current.filter((workspace) => workspace.id !== deleteTarget.id));
      setDeleteTarget(null);
      addNotification("delete", "Xóa workspace thành công");
      window.dispatchEvent(new CustomEvent("workspace_deleted", { detail: { workspaceId: deleteTarget.id } }));
      navigate("/app/workspaces");
    } catch (error) {
      console.error(error);
      addNotification("error", error instanceof Error ? error.message : "Xóa workspace thất bại");
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#FAF9F6] px-4 py-8 text-slate-900 sm:px-6 lg:px-8 overflow-hidden bg-[radial-gradient(#e3ded5_1px,transparent_1px)] [background-size:24px_24px]">
      {/* Background soft lighting blobs */}
      <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-orange-200/10 blur-[120px] pointer-events-none" />
      <div className="absolute right-10 top-1/3 h-80 w-80 rounded-full bg-amber-200/10 blur-[100px] pointer-events-none" />

      <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
        {/* Modern Premium Header Card */}
        <div className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl border border-amber-200/40 bg-gradient-to-br from-white via-[#FCFAF5] to-[#F8F5EE] p-6 shadow-[0_4px_24px_-4px_rgba(255,126,33,0.04),0_1px_4px_rgba(0,0,0,0.02)] sm:flex-row sm:items-center sm:p-8">
          <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#FF7E21]/5 blur-[80px] pointer-events-none" />
          
          <div className="relative space-y-2.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#FF7E21]/10 to-[#FFD29D]/10 border border-[#FF7E21]/20 px-3.5 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-[#FF7E21]">
              <BookOpenCheck className="h-3.5 w-3.5" />
              Workspace hub
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800">Không gian học tập</h2>
            <p className="max-w-xl text-xs sm:text-sm leading-relaxed text-slate-500/90 font-medium">
              Quản lý tài liệu, lộ trình học và trạng thái AI của từng không gian học tập trong một nguồn dữ liệu đồng bộ.
            </p>
          </div>

          <div className="relative flex flex-wrap items-center gap-6">
            {/* Inline Stats Overview with glowing widgets */}
            <div className="flex items-center gap-4 border-r border-slate-200/60 pr-6 mr-2 hidden md:flex">
              <div className="flex items-center gap-3 bg-white/70 border border-slate-200/40 rounded-xl px-4 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-[#FF7E21] border border-orange-100">
                  <LayoutGrid className="h-4.5 w-4.5" />
                </div>
                <div>
                  <span className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 leading-none">Workspaces</span>
                  <p className="text-base font-black text-slate-700 mt-1 leading-none">{workspaces.length}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-white/70 border border-slate-200/40 rounded-xl px-4 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-500 border border-blue-100">
                  <BookOpenCheck className="h-4.5 w-4.5" />
                </div>
                <div>
                  <span className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 leading-none">Tài liệu</span>
                  <p className="text-base font-black text-slate-700 mt-1 leading-none">{workspaces.reduce((sum, w) => sum + w.totalDocuments, 0)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/70 border border-slate-200/40 rounded-xl px-4 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-500 border border-violet-100">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <div>
                  <span className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 leading-none">Công việc</span>
                  <p className="text-base font-black text-[#FF7E21] mt-1 leading-none">{workspaces.reduce((sum, w) => sum + w.totalTasks, 0)}</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF8C37] to-[#FF6B00] px-5 py-3 text-xs font-bold text-white shadow-md shadow-orange-500/10 hover:shadow-lg hover:shadow-orange-500/20 active:scale-[0.98] transition-all duration-300"
            >
              <Plus className="h-4 w-4" />
              Tạo workspace
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm p-12 text-sm font-semibold text-slate-500 shadow-sm">
            <LoaderCircle className="h-5 w-5 animate-spin text-[#FF7E21] mr-2.5" />
            Đang tải danh sách các không gian học tập của bạn...
          </div>
        ) : workspaces.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-16 text-center shadow-sm backdrop-blur-sm">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#FFF7ED] text-[#FF7E21] border border-[#FFEDD5] shadow-lg shadow-[#FF7E21]/5">
              <LayoutGrid className="h-9 w-9" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">Chưa có workspace nào</h3>
            <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-slate-500">
              Hãy tạo không gian học tập đầu tiên của bạn để bắt đầu tải tài liệu học tập lên S3 và thiết lập lộ trình học tập thông minh AI.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800"
            >
              <Sparkles className="h-4 w-4 text-amber-400" />
              Tạo workspace ngay
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Search and filter bar */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/50 shadow-[0_2px_8px_-3px_rgba(15,23,42,0.03)]">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm không gian học tập..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-9 py-2.5 text-xs outline-none transition focus:border-[#FF7E21]/60 focus:ring-4 focus:ring-[#FF7E21]/5 placeholder:text-slate-400 font-semibold text-slate-700 shadow-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                  Sắp xếp:
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-600 outline-none transition focus:border-[#FF7E21]/60 focus:ring-4 focus:ring-[#FF7E21]/5 cursor-pointer shadow-sm"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="alphabetical">Tên (A - Z)</option>
                  <option value="documents">Nhiều tài liệu nhất</option>
                </select>
              </div>
            </div>

            {filteredAndSortedWorkspaces.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 p-16 text-center shadow-sm">
                <p className="text-sm font-semibold text-slate-500">Không tìm thấy không gian học tập nào phù hợp với "{searchQuery}"</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredAndSortedWorkspaces.map((workspace) => (
                  <WorkspaceCard
                    key={workspace.id}
                    workspaceId={workspace.id}
                    title={workspace.name}
                    description={workspace.description}
                    createdAt={workspace.createdAt}
                    totalDocuments={workspace.totalDocuments}
                    totalTasks={workspace.totalTasks}
                    progress={workspace.progress}
                    onOpen={() => navigate(`/app/workspaces/${workspace.id}`)}
                    onEdit={() => openEditModal(workspace)}
                    onDelete={() => setDeleteTarget(workspace)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-md">
          <div className="w-full max-w-3xl overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_30px_120px_rgba(15,23,42,0.25)]">
            <div className="flex items-start justify-between border-b border-slate-200 bg-gradient-to-r from-[#FFF7ED] to-white p-5">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Tạo workspace</h3>
                <p className="mt-1 text-sm text-slate-500">Tạo nhanh từ popup hoặc chuyển sang trang tạo đầy đủ.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:text-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4 border-b border-slate-200 p-5 lg:border-b-0 lg:border-r">
                <div className="flex items-center gap-3 rounded-2xl border border-[#FFEDD5] bg-[#FFF7ED]/60 p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF7E21] to-amber-500 text-white">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Tạo nhanh trong popup</div>
                    <div className="text-sm text-slate-500">Không rời trang hiện tại, phù hợp khi cần thêm workspace ngay.</div>
                  </div>
                </div>

                <label className="block text-sm font-bold text-slate-900">
                  Tên workspace
                  <input
                    autoFocus
                    value={workspaceName}
                    onChange={(event) => {
                      setWorkspaceName(event.target.value);
                      setNameError(null);
                    }}
                    placeholder="Ví dụ: React Interview Prep"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-0 transition placeholder:text-slate-400 focus:border-[#FF7E21]/50 focus:ring-4 focus:ring-[#FFF4EB]"
                  />
                </label>

                {nameError && <p className="text-sm font-medium text-rose-600">{nameError}</p>}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void submitCreateWorkspace()}
                    disabled={actionBusy}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-emerald-500/10 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98] transition-all duration-300 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {actionBusy ? "Đang tạo..." : "Tạo workspace"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Hủy
                  </button>
                </div>
              </div>

              <div className="space-y-4 bg-slate-50 p-5">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
                    <LayoutGrid className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-slate-900">Trang tạo đầy đủ</div>
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">Đang phát triển</span>
                    </div>
                    <div className="text-sm text-slate-500">Dành cho trường hợp cần thêm mô tả hoặc cấu trúc chi tiết hơn.</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-slate-900">Đi tới form đầy đủ</span>
                    <BookOpenCheck className="h-5 w-5 text-slate-400" />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Nếu bạn muốn chuẩn hóa mô tả mục tiêu học ngay từ đầu, hãy chuyển sang trang tạo workspace chuyên dụng.
                  </p>
                </div>

                <button
                  type="button"
                  disabled
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-bold text-slate-400 cursor-not-allowed opacity-70"
                >
                  Tính năng đang phát triển
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editTarget && (
        <div className="fixed inset-0 z-[320] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-md">
          <div className="w-full max-w-xl overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_30px_120px_rgba(15,23,42,0.25)]">
            <div className="flex items-start justify-between border-b border-slate-200 p-5">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Đổi tên workspace</h3>
                <p className="mt-1 text-sm text-slate-500">Cập nhật tên để quản lý workspace rõ ràng hơn.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:text-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <label className="block text-sm font-bold text-slate-900">
                Tên workspace
                <input
                  value={workspaceName}
                  onChange={(event) => {
                    setWorkspaceName(event.target.value);
                    setNameError(null);
                  }}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-[#FF7E21]/50 focus:ring-4 focus:ring-[#FFF4EB]"
                />
              </label>

              {nameError && <p className="text-sm font-medium text-rose-600">{nameError}</p>}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void submitRenameWorkspace()}
                  disabled={actionBusy}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-emerald-500/10 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98] transition-all duration-300 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <Check className="h-4 w-4" />
                  {actionBusy ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[330] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-md">
          <div className="w-full max-w-xl overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_30px_120px_rgba(15,23,42,0.25)]">
            <div className="flex items-center gap-3 border-b border-slate-200 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Xóa workspace</h3>
                <p className="mt-1 text-sm text-slate-500">Hành động này sẽ xóa workspace khỏi danh sách hiện tại.</p>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <p className="text-sm font-bold text-slate-900">Bạn có chắc muốn xóa “{deleteTarget.name}” không?</p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void submitDeleteWorkspace()}
                  disabled={actionBusy}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <Trash2 className="h-4 w-4" />
                  {actionBusy ? "Đang xóa..." : "Xóa workspace"}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="fixed right-4 top-20 z-[600] flex max-h-[calc(100vh-6rem)] flex-col gap-3 overflow-hidden">
        {notifications.map((notification) => {
          let classes = "border-emerald-200 bg-emerald-50 text-emerald-800";
          let icon = <Check className="h-4 w-4" />;

          if (notification.variant === "update") {
            classes = "border-amber-200 bg-amber-50 text-amber-800";
            icon = <PencilLine className="h-4 w-4" />;
          } else if (notification.variant === "delete") {
            classes = "border-rose-200 bg-rose-50 text-rose-800";
            icon = <Trash2 className="h-4 w-4" />;
          } else if (notification.variant === "error") {
            classes = "border-rose-200 bg-rose-50 text-rose-800";
            icon = <AlertTriangle className="h-4 w-4" />;
          } else if (notification.variant === "create") {
            classes = "border-emerald-200 bg-emerald-50 text-emerald-800";
            icon = <Sparkles className="h-4 w-4" />;
          }

          return (
            <div
              key={notification.id}
              className={`min-w-[280px] max-w-[380px] rounded-2xl border px-4 py-3 shadow-[0_10px_30px_rgba(2,6,23,0.12)] ${classes}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/70">{icon}</div>
                <div className="text-sm font-bold leading-5">{notification.message}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
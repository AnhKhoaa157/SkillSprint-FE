import { useEffect, useState } from "react";
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
      navigate("/app/workspaces");
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
      navigate("/app/workspaces");
    } catch (error) {
      console.error(error);
      addNotification("error", error instanceof Error ? error.message : "Xóa workspace thất bại");
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
        <div className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200/70 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:flex-row sm:items-center sm:p-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
              <BookOpenCheck className="h-3.5 w-3.5" />
              Workspace hub
            </div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Workspaces</h2>
            <p className="max-w-2xl text-sm leading-6 text-slate-500">Quản lý tài liệu, lộ trình học và trạng thái AI của từng workspace trong một nguồn dữ liệu đồng bộ.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setReloadToken((value) => value + 1)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Tải lại
            </button>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:brightness-105"
            >
              <Plus className="h-4 w-4" />
              Tạo workspace
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm font-medium text-slate-500 shadow-sm">Đang tải workspaces...</div>
        ) : workspaces.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
              <LayoutGrid className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Chưa có workspace nào</h3>
            <p className="mt-2 text-sm text-slate-500">Tạo workspace đầu tiên để bắt đầu đồng bộ tài liệu và sinh roadmap học tập.</p>
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Sparkles className="h-4 w-4" />
              Tạo workspace ngay
            </button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {workspaces.map((workspace) => (
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

      {showCreateModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-md">
          <div className="w-full max-w-3xl overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_30px_120px_rgba(15,23,42,0.25)]">
            <div className="flex items-start justify-between border-b border-slate-200 bg-gradient-to-r from-orange-50 to-white p-5">
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
                <div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 text-white">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Tạo nhanh trong popup</div>
                    <div className="text-sm text-slate-500">Không rời trang hiện tại, phù hợp khi cần thêm workspace ngay.</div>
                  </div>
                </div>

                <label className="block text-sm font-semibold text-slate-900">
                  Tên workspace
                  <input
                    autoFocus
                    value={workspaceName}
                    onChange={(event) => {
                      setWorkspaceName(event.target.value);
                      setNameError(null);
                    }}
                    placeholder="Ví dụ: React Interview Prep"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-0 transition placeholder:text-slate-400 focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                  />
                </label>

                {nameError && <p className="text-sm font-medium text-rose-600">{nameError}</p>}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void submitCreateWorkspace()}
                    disabled={actionBusy}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {actionBusy ? "Đang tạo..." : "Tạo workspace"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Hủy
                  </button>
                </div>
              </div>

              <div className="space-y-4 bg-slate-50 p-5">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                    <LayoutGrid className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Trang tạo đầy đủ</div>
                    <div className="text-sm text-slate-500">Dành cho trường hợp cần thêm mô tả hoặc cấu trúc chi tiết hơn.</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-900">Đi tới form đầy đủ</span>
                    <BookOpenCheck className="h-5 w-5 text-orange-500" />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Nếu bạn muốn chuẩn hóa mô tả mục tiêu học ngay từ đầu, hãy chuyển sang trang tạo workspace chuyên dụng.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    navigate("/app/workspaces/new");
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Đi tới trang tạo workspace
                  <ArrowRight className="h-4 w-4" />
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
              <label className="block text-sm font-semibold text-slate-900">
                Tên workspace
                <input
                  value={workspaceName}
                  onChange={(event) => {
                    setWorkspaceName(event.target.value);
                    setNameError(null);
                  }}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                />
              </label>

              {nameError && <p className="text-sm font-medium text-rose-600">{nameError}</p>}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void submitRenameWorkspace()}
                  disabled={actionBusy}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <Check className="h-4 w-4" />
                  {actionBusy ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
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
              <p className="text-sm font-semibold text-slate-900">Bạn có chắc muốn xóa “{deleteTarget.name}” không?</p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void submitDeleteWorkspace()}
                  disabled={actionBusy}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <Trash2 className="h-4 w-4" />
                  {actionBusy ? "Đang xóa..." : "Xóa workspace"}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
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
                <div className="text-sm font-semibold leading-5">{notification.message}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
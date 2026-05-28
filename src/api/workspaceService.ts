import { createId, MOCK_STORAGE_KEYS, nowIso, readStorage, writeStorage } from "./mockDb";

type ApiResponse<T> = {
  success: boolean;
  code: number;
  message: string;
  data: T | null;
};

export type CreateWorkspaceRequest = {
  name: string;
  description?: string | null;
};

export type UpdateWorkspaceRequest = {
  name?: string | null;
  description?: string | null;
  status?: "ACTIVE" | "DELETED" | "ARCHIVED" | string | null;
};

export type WorkspaceResponse = {
  workspaceId: string;
  name: string;
  description?: string | null;
  status: string;
  createdAt: string;
  updatedAt?: string | null;
};

const KEY = MOCK_STORAGE_KEYS.workspaces;

function readState(): WorkspaceResponse[] {
  return readStorage<WorkspaceResponse[]>(KEY, []);
}

function writeState(state: WorkspaceResponse[]): void {
  writeStorage(KEY, state);
}

function seedWorkspaces(): WorkspaceResponse[] {
  return [
    {
      workspaceId: "WKS-001",
      name: "Frontend Sprint",
      description: "Lộ trình React, TypeScript và UI foundations.",
      status: "ACTIVE",
      createdAt: "2026-03-15T08:00:00.000Z",
      updatedAt: "2026-05-10T10:00:00.000Z",
    },
    {
      workspaceId: "WKS-002",
      name: "Interview Prep",
      description: "Phỏng vấn thử, luyện câu hỏi và checklist CV.",
      status: "ACTIVE",
      createdAt: "2026-04-02T08:00:00.000Z",
      updatedAt: "2026-05-12T14:30:00.000Z",
    },
  ];
}

function ensureSeeded(): WorkspaceResponse[] {
  const current = readState();
  if (current.length > 0) {
    return current;
  }

  const seeded = seedWorkspaces();
  writeState(seeded);
  return seeded;
}

function response<T>(data: T | null, code = 200, message = "OK", success = true): ApiResponse<T> {
  return { success, code, message, data };
}

export async function fetchMyWorkspacesResponse(): Promise<ApiResponse<WorkspaceResponse[]>> {
  return response(ensureSeeded());
}

export async function fetchWorkspaceResponse(workspaceId: string): Promise<ApiResponse<WorkspaceResponse>> {
  const workspace = ensureSeeded().find((item) => item.workspaceId === workspaceId);
  if (!workspace) {
    return response(null, 404, "Workspace not found", false);
  }

  return response(workspace);
}

export async function createWorkspaceResponse(req: CreateWorkspaceRequest): Promise<ApiResponse<WorkspaceResponse>> {
  const current = ensureSeeded();
  const next: WorkspaceResponse = {
    workspaceId: createId("WKS"),
    name: req.name.trim(),
    description: req.description ?? null,
    status: "ACTIVE",
    createdAt: nowIso(),
    updatedAt: null,
  };

  writeState([next, ...current]);
  return response(next, 200, "Created");
}

export async function updateWorkspaceResponse(workspaceId: string, req: UpdateWorkspaceRequest): Promise<ApiResponse<WorkspaceResponse>> {
  const current = ensureSeeded();
  const index = current.findIndex((item) => item.workspaceId === workspaceId);
  if (index < 0) {
    return response(null, 404, "Workspace not found", false);
  }

  const next: WorkspaceResponse = {
    ...current[index],
    name: req.name?.trim() || current[index].name,
    description: req.description ?? current[index].description ?? null,
    status: req.status ?? current[index].status,
    updatedAt: nowIso(),
  };

  current[index] = next;
  writeState(current);
  return response(next, 200, "Updated");
}

export async function deleteWorkspaceResponse(workspaceId: string): Promise<ApiResponse<null>> {
  const current = ensureSeeded();
  const next = current.filter((item) => item.workspaceId !== workspaceId);

  if (next.length === current.length) {
    return response(null, 404, "Workspace not found", false);
  }

  writeState(next);
  return response(null, 200, "Deleted");
}

export async function createWorkspace(req: CreateWorkspaceRequest): Promise<WorkspaceResponse> {
  const res = await createWorkspaceResponse(req);
  if (!res.data) {
    throw new Error(res.message || "Create workspace failed");
  }

  return res.data;
}

export async function getMyWorkspaces(): Promise<WorkspaceResponse[]> {
  const res = await fetchMyWorkspacesResponse();
  return res.data ?? [];
}

export async function getWorkspace(workspaceId: string): Promise<WorkspaceResponse> {
  const res = await fetchWorkspaceResponse(workspaceId);
  if (!res.data) {
    throw new Error(res.message || "Workspace not found");
  }

  return res.data;
}

export async function updateWorkspace(workspaceId: string, req: UpdateWorkspaceRequest): Promise<WorkspaceResponse> {
  const res = await updateWorkspaceResponse(workspaceId, req);
  if (!res.data) {
    throw new Error(res.message || "Update workspace failed");
  }

  return res.data;
}

export async function deleteWorkspace(workspaceId: string): Promise<void> {
  const res = await deleteWorkspaceResponse(workspaceId);
  if (!res.success) {
    throw new Error(res.message || "Delete workspace failed");
  }
}

export default {
  createWorkspace,
  getMyWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
};
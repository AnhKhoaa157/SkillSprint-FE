import { requestJson, type ApiResponse } from "./apiClient";

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

export async function createWorkspace(req: CreateWorkspaceRequest): Promise<WorkspaceResponse> {
  const res = await requestJson<WorkspaceResponse>("/api/workspaces", {
    method: "POST",
    body: JSON.stringify(req),
  });

  if (!res.data) throw new Error(res.message || "Create workspace failed");
  return res.data;
}

export async function getMyWorkspaces(): Promise<WorkspaceResponse[]> {
  const res = await requestJson<WorkspaceResponse[]>("/api/workspaces", { method: "GET" });
  if (!res.data) throw new Error(res.message || "Fetch workspaces failed");
  return res.data;
}

export async function getWorkspace(workspaceId: string): Promise<WorkspaceResponse> {
  const res = await requestJson<WorkspaceResponse>(`/api/workspaces/${workspaceId}`, { method: "GET" });
  if (!res.data) throw new Error(res.message || "Fetch workspace failed");
  return res.data;
}

export async function updateWorkspace(workspaceId: string, req: UpdateWorkspaceRequest): Promise<WorkspaceResponse> {
  const res = await requestJson<WorkspaceResponse>(`/api/workspaces/${workspaceId}`, {
    method: "PATCH",
    body: JSON.stringify(req),
  });
  if (!res.data) throw new Error(res.message || "Update workspace failed");
  return res.data;
}

export async function deleteWorkspace(workspaceId: string): Promise<void> {
  const res = await requestJson<null>(`/api/workspaces/${workspaceId}`, { method: "DELETE" });
  if (!res.success) throw new Error(res.message || "Delete workspace failed");
}

export default {
  createWorkspace,
  getMyWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
};
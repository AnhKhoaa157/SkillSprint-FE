const API_BASE = ((import.meta as any).env?.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "http://localhost:8080";

type ApiResponse<T> = {
  success: boolean;
  code: number;
  message: string;
  data: T | null;
};

import { getStoredAuthSession } from "./authService";

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

async function requestJson<T>(path: string, opts: RequestInit = {}): Promise<ApiResponse<T>> {
  const session = getStoredAuthSession();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string> || {}),
  };

  if (session?.accessToken) {
    headers["Authorization"] = `Bearer ${session.accessToken}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers,
  });

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok) {
    const message = payload?.message || `Server error: ${response.status}`;
    throw new Error(message);
  }

  if (!payload) {
    throw new Error("Invalid response from server");
  }

  return payload;
}

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

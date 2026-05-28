import { getStoredAuthSession } from "./authService";

const API_BASE = ((import.meta as any).env?.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "http://localhost:8080";

type ApiResponse<T> = {
  success: boolean;
  code: number;
  message: string;
  data: T | null;
};

export type CreateMaterialUploadUrlRequest = {
  fileName: string;
  contentType: string;
};

export type ConfirmMaterialUploadRequest = {
  objectKey: string;
  fileName: string;
  contentType: string;
};

export type MaterialUploadUrlResponse = {
  uploadUrl: string;
  fileUrl: string;
  objectKey: string;
  expiresAt: string | null;
};

export type ProcessingJobStatus = "PENDING" | "RUNNING" | "REVIEW_REQUIRED" | "COMPLETED" | "FAILED" | string;

export type ProcessingStep =
  | "EXTRACTING"
  | "CLEANING"
  | "CHUNKING"
  | "AI_CONTENT_ANALYSIS"
  | "SAVING_RESULT"
  | "WAITING_FOR_USER_REVIEW"
  | string;

export type MaterialProcessingJobResponse = {
  jobId: string;
  status: ProcessingJobStatus;
  currentStep: ProcessingStep | null;
  progressPercent: number;
  errorCode: string | null;
  errorMessage: string | null;
  retryable: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FileType = "PDF" | "DOCX" | "PPTX" | "TXT" | "ZIP" | string;

export type UploadStatus = "UPLOADED" | "FAILED" | string;

export type MaterialProcessingStatus =
  | "PENDING"
  | "EXTRACTING"
  | "EXTRACTED"
  | "CLEANING"
  | "CHUNKING"
  | "ANALYZING"
  | "REVIEW_REQUIRED"
  | "COMPLETED"
  | "FAILED"
  | string;

export type UploadedMaterialResponse = {
  materialId: string;
  workspaceId: string;
  originalFileName: string;
  fileName: string;
  fileType: FileType;
  fileSizeBytes: number | null;
  fileUrl: string;
  uploadStatus: UploadStatus;
  processingStatus: MaterialProcessingStatus;
  processingJob: MaterialProcessingJobResponse | null;
  uploadedAt: string;
  updatedAt: string;
};

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

export async function createMaterialUploadUrl(workspaceId: string, request: CreateMaterialUploadUrlRequest): Promise<MaterialUploadUrlResponse> {
  const res = await requestJson<MaterialUploadUrlResponse>(`/api/workspaces/${workspaceId}/materials/upload-url`, {
    method: "POST",
    body: JSON.stringify(request),
  });

  if (!res.data) {
    throw new Error(res.message || "Failed to create material upload url");
  }

  return res.data;
}

export async function confirmMaterialUpload(workspaceId: string, request: ConfirmMaterialUploadRequest): Promise<UploadedMaterialResponse> {
  const res = await requestJson<UploadedMaterialResponse>(`/api/workspaces/${workspaceId}/materials/confirm`, {
    method: "POST",
    body: JSON.stringify(request),
  });

  if (!res.data) {
    throw new Error(res.message || "Failed to confirm material upload");
  }

  return res.data;
}

export async function getWorkspaceMaterials(workspaceId: string): Promise<UploadedMaterialResponse[]> {
  const res = await requestJson<UploadedMaterialResponse[]>(`/api/workspaces/${workspaceId}/materials`, {
    method: "GET",
    headers: buildAuthHeaders(getStoredAuthSession()?.accessToken ?? null),
  });

  return res.data || [];
}

export async function getMaterials(workspaceId: string): Promise<UploadedMaterialResponse[]> {
  return getWorkspaceMaterials(workspaceId);
}

export async function getMaterialProcessingJob(workspaceId: string, materialId: string): Promise<MaterialProcessingJobResponse> {
  const res = await requestJson<MaterialProcessingJobResponse>(`/api/workspaces/${workspaceId}/materials/${materialId}/processing-job`, {
    method: "GET",
    headers: buildAuthHeaders(getStoredAuthSession()?.accessToken ?? null),
  });

  if (!res.data) {
    throw new Error(res.message || "Failed to load material processing job");
  }

  return res.data;
}

export default {
  createMaterialUploadUrl,
  confirmMaterialUpload,
  getWorkspaceMaterials,
  getMaterials,
  getMaterialProcessingJob,
};

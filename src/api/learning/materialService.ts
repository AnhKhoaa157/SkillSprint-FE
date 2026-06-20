import { requestJson } from "../core/apiClient";

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
  viewUrl: string | null;
  viewUrlExpiresAt: string | null;
  uploadStatus: UploadStatus;
  processingStatus: MaterialProcessingStatus;
  processingJob: MaterialProcessingJobResponse | null;
  uploadedAt: string;
  updatedAt: string;
};

/**
 * Creates a pre-signed upload URL for a new material file.
 * The backend returns an S3 upload URL, a public file URL, and object key.
 */
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

/**
 * Confirms a material upload after the file has been uploaded to S3.
 */
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

/**
 * Fetches all uploaded materials for a given workspace.
 */
export async function getWorkspaceMaterials(workspaceId: string): Promise<UploadedMaterialResponse[]> {
  const res = await requestJson<UploadedMaterialResponse[]>(`/api/workspaces/${workspaceId}/materials`, {
    method: "GET",
  });

  return res.data || [];
}

/**
 * Alias for getWorkspaceMaterials (backward compatibility).
 */
export async function getMaterials(workspaceId: string): Promise<UploadedMaterialResponse[]> {
  return getWorkspaceMaterials(workspaceId);
}

/**
 * Fetches the current processing job for a specific material.
 */
export async function getMaterialProcessingJob(workspaceId: string, materialId: string): Promise<MaterialProcessingJobResponse> {
  const res = await requestJson<MaterialProcessingJobResponse>(`/api/workspaces/${workspaceId}/materials/${materialId}/processing-job`, {
    method: "GET",
  });

  if (!res.data) {
    throw new Error(res.message || "Failed to load material processing job");
  }

  return res.data;
}

/**
 * Permanently deletes an uploaded material and its associated processing data.
 * DELETE /api/workspaces/{workspaceId}/materials/{materialId}
 */
export async function deleteMaterial(workspaceId: string, materialId: string): Promise<void> {
  const res = await requestJson<null>(`/api/workspaces/${workspaceId}/materials/${materialId}`, {
    method: "DELETE",
  });

  if (!res.success) {
    throw new Error(res.message || "Failed to delete material");
  }
}

/**
 * Fetches the details of a specific material (including fileUrl).
 */
export async function getMaterialDetail(workspaceId: string, materialId: string): Promise<UploadedMaterialResponse> {
  const res = await requestJson<UploadedMaterialResponse>(`/api/workspaces/${workspaceId}/materials/${materialId}`, {
    method: "GET",
  });

  if (!res.data) {
    throw new Error(res.message || "Failed to load material detail");
  }

  return res.data;
}

export default {
  createMaterialUploadUrl,
  confirmMaterialUpload,
  getWorkspaceMaterials,
  getMaterials,
  getMaterialProcessingJob,
  deleteMaterial,
  getMaterialDetail,
};
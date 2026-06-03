import { requestJson, type ApiResponse } from "./apiClient";

export type MeResponse = {
  userId: string;
  email: string;
  emailVerified: boolean;
  fullName: string;
  avatarUrl: string;
  timeZone: string;
  status: string;
  roles: string[];
};

export type UpdateMeRequest = {
  fullName: string;
};

export async function getMe(): Promise<MeResponse> {
  const res = await requestJson<MeResponse>("/api/me", { method: "GET" });
  if (!res.data) throw new Error(res.message || "Fetch profile failed");
  return res.data;
}

export async function updateMe(req: UpdateMeRequest): Promise<MeResponse> {
  const res = await requestJson<MeResponse>("/api/me", {
    method: "PATCH",
    body: JSON.stringify(req),
  });
  if (!res.data) throw new Error(res.message || "Update profile failed");
  return res.data;
}

// ─── Avatar upload (2-step: pre-signed URL → PUT to S3 → confirm) ─────────────

export type AvatarUploadUrlResponse = {
  uploadUrl: string;   // S3 pre-signed PUT URL — send binary directly to this
  fileUrl: string;     // Final public CDN URL for the avatar
  objectKey: string;   // S3 object key — required for the confirm call
  expiresAt: string | null;
};

/**
 * Step 1 — obtain a pre-signed S3 URL.
 * POST /api/me/avatar/upload-url  Body: { fileName, contentType }
 */
export async function getAvatarUploadUrl(
  fileName: string,
  contentType: string,
): Promise<AvatarUploadUrlResponse> {
  const res = await requestJson<AvatarUploadUrlResponse>("/api/me/avatar/upload-url", {
    method: "POST",
    body: JSON.stringify({ fileName, contentType }),
  });
  if (!res.data) throw new Error(res.message || "Failed to get avatar upload URL");
  return res.data;
}

/**
 * Step 2 — confirm the S3 upload and persist the new avatar URL.
 * PUT the raw binary to `uploadUrl` (no auth headers — it is a pre-signed S3 URL).
 * Then call this to tell the backend the upload is complete.
 * POST /api/me/avatar/confirm  Body: { objectKey }
 * Returns the updated MeResponse so the caller can refresh profile state.
 */
export async function confirmAvatarUpload(objectKey: string): Promise<MeResponse> {
  const res = await requestJson<MeResponse>("/api/me/avatar/confirm", {
    method: "POST",
    body: JSON.stringify({ objectKey }),
  });
  if (!res.data) throw new Error(res.message || "Failed to confirm avatar upload");
  return res.data;
}

export default { getMe, updateMe, getAvatarUploadUrl, confirmAvatarUpload };
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

export default { getMe, updateMe };
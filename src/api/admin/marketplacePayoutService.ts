import { requestJson } from "../core/apiClient";
import type { CreatorPayout, CreatorPayoutStatus } from "../marketplace/marketplaceTypes";

const BASE = "/api/admin/marketplace/payouts";

function requireData<T>(response: { data: T | null; message?: string }): T {
  if (response.data === null) throw new Error(response.message || "Không nhận được dữ liệu từ máy chủ.");
  return response.data;
}

export function getAdminMarketplacePayouts(status?: CreatorPayoutStatus): Promise<CreatorPayout[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return requestJson<CreatorPayout[]>(`${BASE}${query}`).then(requireData);
}

export function approveMarketplacePayout(payoutId: string): Promise<CreatorPayout> {
  return requestJson<CreatorPayout>(`${BASE}/${encodeURIComponent(payoutId)}/approve`, { method: "PATCH" }).then(requireData);
}

export function startMarketplacePayoutProcessing(payoutId: string): Promise<CreatorPayout> {
  return requestJson<CreatorPayout>(`${BASE}/${encodeURIComponent(payoutId)}/processing`, { method: "PATCH" }).then(requireData);
}

export function completeMarketplacePayout(payoutId: string, externalTransferReference: string, notes?: string): Promise<CreatorPayout> {
  return requestJson<CreatorPayout>(`${BASE}/${encodeURIComponent(payoutId)}/complete`, {
    method: "PATCH",
    body: JSON.stringify({ externalTransferReference, ...(notes?.trim() ? { notes: notes.trim() } : {}) }),
  }).then(requireData);
}

export function rejectMarketplacePayout(payoutId: string, reason: string, failed = false): Promise<CreatorPayout> {
  return requestJson<CreatorPayout>(`${BASE}/${encodeURIComponent(payoutId)}/${failed ? "fail" : "reject"}`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  }).then(requireData);
}

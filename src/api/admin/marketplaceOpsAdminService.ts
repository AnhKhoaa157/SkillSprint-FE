import { requestJson } from "../core/apiClient";
import type {
  AdminMarketplaceDispute,
  AdminMarketplaceDisputeListParams,
  AdminMarketplaceDisputePage,
  DecideMarketplaceDisputeRequest,
  MarketplaceVersionMetrics,
} from "./marketplaceOpsAdminTypes";

const BASE = "/api/admin/marketplace";

export interface MarketplaceAuditTimelineEvent {
  logId: string;
  actionType: string;
  title: string | null;
  description: string | null;
  actorUserId: string | null;
  actorName: string | null;
  occurredAt: string;
}

function requireData<T>(response: { data: T | null; message?: string }): T {
  if (response.data === null) throw new Error(response.message || "Không nhận được dữ liệu từ máy chủ.");
  return response.data;
}

export async function getAdminDisputes(
  params: AdminMarketplaceDisputeListParams = {},
): Promise<AdminMarketplaceDisputePage> {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 0));
  query.set("size", String(params.size ?? 20));
  if (params.status) query.set("status", params.status);
  return requireData(await requestJson<AdminMarketplaceDisputePage>(`${BASE}/disputes?${query.toString()}`));
}

export async function getAdminDispute(disputeId: string): Promise<AdminMarketplaceDispute> {
  return requireData(await requestJson<AdminMarketplaceDispute>(`${BASE}/disputes/${encodeURIComponent(disputeId)}`));
}

export async function getAdminDisputeTimeline(disputeId: string): Promise<MarketplaceAuditTimelineEvent[]> {
  return requireData(await requestJson<MarketplaceAuditTimelineEvent[]>(`${BASE}/disputes/${encodeURIComponent(disputeId)}/timeline`));
}

export async function decideAdminDispute(
  disputeId: string,
  body: DecideMarketplaceDisputeRequest,
): Promise<AdminMarketplaceDispute> {
  return requireData(
    await requestJson<AdminMarketplaceDispute>(`${BASE}/disputes/${encodeURIComponent(disputeId)}/decision`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  );
}

export async function completeAdminDisputeRefund(disputeId: string): Promise<AdminMarketplaceDispute> {
  return requireData(
    await requestJson<AdminMarketplaceDispute>(`${BASE}/disputes/${encodeURIComponent(disputeId)}/refund`, {
      method: "POST",
    }),
  );
}

export async function getAdminVersionMetrics(versionId: string): Promise<MarketplaceVersionMetrics> {
  return requireData(
    await requestJson<MarketplaceVersionMetrics>(`${BASE}/versions/${encodeURIComponent(versionId)}/metrics`),
  );
}

export const marketplaceOpsAdminService = {
  getAdminDisputes,
  getAdminDispute,
  decideAdminDispute,
  completeAdminDisputeRefund,
  getAdminVersionMetrics,
};

export default marketplaceOpsAdminService;

import { requestJson } from "../core/apiClient";
import type {
  AdminMarketplaceReport,
  AdminMarketplaceReportListParams,
  AdminMarketplaceReportPage,
  UpdateMarketplaceReportStatusRequest,
} from "./marketplaceReportAdminTypes";

const BASE = "/api/admin/marketplace/reports";

function requireData<T>(response: { data: T | null; message?: string }): T {
  if (response.data === null) throw new Error(response.message || "Không nhận được dữ liệu từ máy chủ.");
  return response.data;
}

export async function getAdminMarketplaceReports(
  params: AdminMarketplaceReportListParams = {},
): Promise<AdminMarketplaceReportPage> {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 0));
  query.set("size", String(params.size ?? 10));
  if (params.status) query.set("status", params.status);
  if (params.targetType) query.set("targetType", params.targetType);
  if (params.category) query.set("category", params.category);
  return requireData(await requestJson<AdminMarketplaceReportPage>(`${BASE}?${query.toString()}`));
}

export async function getAdminMarketplaceReport(reportId: string): Promise<AdminMarketplaceReport> {
  return requireData(await requestJson<AdminMarketplaceReport>(`${BASE}/${encodeURIComponent(reportId)}`));
}

export async function updateAdminMarketplaceReportStatus(
  reportId: string,
  body: UpdateMarketplaceReportStatusRequest,
): Promise<AdminMarketplaceReport> {
  return requireData(
    await requestJson<AdminMarketplaceReport>(`${BASE}/${encodeURIComponent(reportId)}/status`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  );
}

export const marketplaceReportAdminService = {
  getAdminMarketplaceReports,
  getAdminMarketplaceReport,
  updateAdminMarketplaceReportStatus,
};

export default marketplaceReportAdminService;

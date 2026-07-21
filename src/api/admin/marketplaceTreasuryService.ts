import { requestJson } from "../core/apiClient";

export type PlatformTreasuryAsset = "VND" | "COIN";
export type PlatformTreasuryDirection = "CREDIT" | "DEBIT";
export type PlatformTreasuryEntryType =
  | "COIN_TOP_UP_RECEIVED"
  | "SUBSCRIPTION_PAYMENT_RECEIVED"
  | "MARKETPLACE_COMMISSION_EARNED"
  | "MARKETPLACE_COMMISSION_REVERSED"
  | "CREATOR_PAYOUT_COMPLETED";

export interface PlatformTreasurySummary {
  vndInflow: number;
  vndOutflow: number;
  vndNetPosition: number;
  commissionCoinEarned: number;
  commissionCoinReversed: number;
  commissionCoinNetPosition: number;
}

export interface PlatformTreasuryEntry {
  entryId: string;
  asset: PlatformTreasuryAsset;
  direction: PlatformTreasuryDirection;
  entryType: PlatformTreasuryEntryType;
  referenceType: string;
  referenceId: string;
  amount: number;
  actorUserId: string | null;
  actorName: string | null;
  counterpartyUserId: string | null;
  counterpartyName: string | null;
  externalReference: string | null;
  note: string | null;
  metadata: Record<string, unknown> | null;
  occurredAt: string;
}

export interface TreasuryPage {
  items: PlatformTreasuryEntry[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface TreasuryEntriesQuery {
  asset?: PlatformTreasuryAsset;
  entryType?: PlatformTreasuryEntryType;
  page?: number;
  size?: number;
}

function requireData<T>(response: { data: T | null; message?: string }): T {
  if (response.data === null) throw new Error(response.message || "Không nhận được dữ liệu từ máy chủ.");
  return response.data;
}

export function getPlatformTreasurySummary(): Promise<PlatformTreasurySummary> {
  return requestJson<PlatformTreasurySummary>("/api/admin/marketplace/treasury/summary").then(requireData);
}

export function getPlatformTreasuryEntries(query: TreasuryEntriesQuery = {}): Promise<TreasuryPage> {
  const params = new URLSearchParams();
  if (query.asset) params.set("asset", query.asset);
  if (query.entryType) params.set("entryType", query.entryType);
  params.set("page", String(query.page ?? 0));
  params.set("size", String(query.size ?? 20));
  return requestJson<TreasuryPage>(`/api/admin/marketplace/treasury/entries?${params.toString()}`).then(requireData);
}

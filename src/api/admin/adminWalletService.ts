import { requestJson } from "../core/apiClient";

export type AdminWalletTransaction = {
  transactionId: string;
  direction: "CREDIT" | "DEBIT";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceType: string;
  adjustedByUserId: string | null;
  adjustedByName: string | null;
  adjustmentReason: string | null;
  createdAt: string;
};

export type AdminWallet = {
  userId: string;
  balance: number;
  recentTransactions: AdminWalletTransaction[];
};

export type AdjustWalletRequest = {
  amount: number;
  reason: string;
};

export async function getAdminWallet(userId: string): Promise<AdminWallet> {
  const response = await requestJson<AdminWallet>(`/api/admin/wallet/${encodeURIComponent(userId)}`);
  if (!response.data) throw new Error(response.message || "Không thể tải ví Coin.");
  return response.data;
}

export async function adjustAdminWallet(userId: string, request: AdjustWalletRequest): Promise<{ userId: string; balance: number }> {
  const response = await requestJson<{ userId: string; balance: number }>(
    `/api/admin/wallet/${encodeURIComponent(userId)}/adjust`,
    { method: "POST", body: JSON.stringify({ amount: request.amount, reason: request.reason }) },
  );
  if (!response.data) throw new Error(response.message || "Không thể điều chỉnh ví Coin.");
  return response.data;
}

import { extractApiData, skillSprintApiClient, type ApiResponse } from "./skillSprintApiClient";
import type {
  CreateSepayPaymentRequest,
  SepayPaymentCreateResponse,
  SepayPaymentDetailResponse,
  SepayTransactionHistoryResponse,
} from "./skillSprintModels";

/**
 * POST /api/payments/sepay/create
 * Creates a new Sepay payment order.
 */
export async function createSepayPayment(
  payload: CreateSepayPaymentRequest
): Promise<SepayPaymentCreateResponse> {
  const response = await skillSprintApiClient.post<
    ApiResponse<SepayPaymentCreateResponse>
  >("/api/payments/sepay/create", payload);
  return extractApiData(response);
}

/**
 * GET /api/payments/{paymentId}
 * Fetches the current status of a payment (used for polling).
 */
export async function getPaymentDetail(
  paymentId: string
): Promise<SepayPaymentDetailResponse> {
  const response = await skillSprintApiClient.get<
    ApiResponse<SepayPaymentDetailResponse>
  >(`/api/payments/${paymentId}`);
  return extractApiData(response);
}

/**
 * GET /api/payments/me
 * Fetches the authenticated user's payment transaction history.
 */
export async function getMyPaymentHistory(
  page = 0,
  size = 20
): Promise<SepayTransactionHistoryResponse> {
  const response = await skillSprintApiClient.get<
    ApiResponse<SepayTransactionHistoryResponse>
  >("/api/payments/me", {
    params: { page, size },
  });
  return extractApiData(response);
}
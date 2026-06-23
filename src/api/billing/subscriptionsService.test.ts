import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCurrentSubscription, getQuotaStatus } from "./subscriptionsService";
import { extractApiData, skillSprintApiClient } from "../core/skillSprintApiClient";

vi.mock("../core/skillSprintApiClient", () => ({
  skillSprintApiClient: {
    get: vi.fn(),
  },
  extractApiData: vi.fn(),
}));

describe("subscriptionsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCurrentSubscription", () => {
    it("should fetch current subscription", async () => {
      const mockSub = { planName: "PREMIUM", status: "ACTIVE" };
      vi.mocked(skillSprintApiClient.get).mockResolvedValueOnce({ data: { success: true, code: "SUCCESS", message: "OK", data: mockSub } });
      vi.mocked(extractApiData).mockReturnValueOnce(mockSub);

      const result = await getCurrentSubscription();

      expect(skillSprintApiClient.get).toHaveBeenCalledWith("/api/subscriptions/me");
      expect(extractApiData).toHaveBeenCalled();
      expect(result).toEqual(mockSub);
    });
  });

  describe("getQuotaStatus", () => {
    it("should fetch quota status", async () => {
      const mockQuota = { maxWorkspaces: 5, usedWorkspaces: 2 };
      vi.mocked(skillSprintApiClient.get).mockResolvedValueOnce({ data: { success: true, code: "SUCCESS", message: "OK", data: mockQuota } });
      vi.mocked(extractApiData).mockReturnValueOnce(mockQuota);

      const result = await getQuotaStatus();

      expect(skillSprintApiClient.get).toHaveBeenCalledWith("/api/subscriptions/me/quota");
      expect(extractApiData).toHaveBeenCalled();
      expect(result).toEqual(mockQuota);
    });
  });
});

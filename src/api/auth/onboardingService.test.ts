import { describe, it, expect, beforeEach, vi } from "vitest";
import { fetchOnboardingProfile, upsertOnboardingProfile } from "./onboardingService";
import { requestJson } from "../core/apiClient";

vi.mock("../core/apiClient", () => ({
  requestJson: vi.fn(),
}));

describe("onboardingService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchOnboardingProfile", () => {
    it("should fetch onboarding profile successfully", async () => {
      const mockResponse = {
        success: true,
        code: 200,
        message: "ok",
        data: {
          profileId: "profile-1",
          workspaceId: "workspace-1",
          targetGoal: "Learn React",
          confidence: "HIGH",
          preferredDays: ["MONDAY"],
          preferredTimeSlots: ["MORNING"],
          createdAt: "2023-01-01T00:00:00Z",
        },
      };

      vi.mocked(requestJson).mockResolvedValueOnce(mockResponse);

      const result = await fetchOnboardingProfile("workspace-1");

      expect(requestJson).toHaveBeenCalledWith("/api/workspaces/workspace-1/onboarding", { method: "GET" });
      expect(result).toEqual(mockResponse);
    });

    it("should return a 404 response structure if api returns 404 error", async () => {
      const error404: any = new Error("Not found");
      error404.status = 404;

      vi.mocked(requestJson).mockRejectedValueOnce(error404);

      const result = await fetchOnboardingProfile("workspace-1");

      expect(requestJson).toHaveBeenCalledWith("/api/workspaces/workspace-1/onboarding", { method: "GET" });
      expect(result).toEqual({ success: false, code: 404, message: "Not found", data: null });
    });

    it("should propagate other errors", async () => {
      const error500 = new Error("Internal Error");
      vi.mocked(requestJson).mockRejectedValueOnce(error500);

      await expect(fetchOnboardingProfile("workspace-1")).rejects.toThrow("Internal Error");
    });
  });

  describe("upsertOnboardingProfile", () => {
    it("should format payload and upsert successfully", async () => {
      const mockResponse = {
        success: true,
        code: 200,
        message: "ok",
        data: {
          profileId: "profile-1",
          workspaceId: "workspace-1",
          targetGoal: "Learn React",
          confidence: "HIGH",
          preferredDays: ["MONDAY"],
          preferredTimeSlots: ["MORNING"],
          createdAt: "2023-01-01T00:00:00Z",
        },
      };

      vi.mocked(requestJson).mockResolvedValueOnce(mockResponse);

      const requestPayload = {
        targetGoal: "Learn React",
        confidence: "HIGH" as const,
        preferredDays: ["monday "],
        preferredTimeSlots: [" morning"],
      };

      const result = await upsertOnboardingProfile("workspace-1", requestPayload);

      expect(requestJson).toHaveBeenCalledWith("/api/workspaces/workspace-1/onboarding", {
        method: "PUT",
        body: JSON.stringify({
          targetGoal: "Learn React",
          studyHoursPerWeek: null,
          targetDeadline: null,
          confidence: "HIGH",
          preferredLanguage: null,
          preferredDays: ["MONDAY"],
          preferredTimeSlots: ["morning"],
        }),
      });
      expect(result).toEqual(mockResponse.data);
    });

    it("keeps fewer-than-three selected days and slots in the payload", async () => {
      // Regression: 1-2 selected days/slots must not be dropped or treated as empty.
      const mockResponse = {
        success: true,
        code: 200,
        message: "ok",
        data: { profileId: "profile-1", workspaceId: "workspace-1" },
      };
      vi.mocked(requestJson).mockResolvedValue(mockResponse as any);

      await upsertOnboardingProfile("workspace-1", {
        targetGoal: "Learn React",
        confidence: "HIGH",
        preferredDays: ["THURSDAY"],
        preferredTimeSlots: ["20:00-22:00"],
      });

      let body = JSON.parse(vi.mocked(requestJson).mock.calls[0][1]!.body as string);
      expect(body.preferredDays).toEqual(["THURSDAY"]);
      expect(body.preferredTimeSlots).toEqual(["20:00-22:00"]);

      await upsertOnboardingProfile("workspace-1", {
        targetGoal: "Learn React",
        confidence: "HIGH",
        preferredDays: ["THURSDAY", "FRIDAY"],
        preferredTimeSlots: ["20:00-22:00"],
      });

      body = JSON.parse(vi.mocked(requestJson).mock.calls[1][1]!.body as string);
      expect(body.preferredDays).toEqual(["THURSDAY", "FRIDAY"]);
      expect(body.preferredTimeSlots).toEqual(["20:00-22:00"]);
    });
  });
});

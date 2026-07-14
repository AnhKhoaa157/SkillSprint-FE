import { beforeEach, describe, expect, it, vi } from "vitest";
import marketplaceService from "./marketplaceService";
import { skillSprintApiClient } from "../core/skillSprintApiClient";

vi.mock("../core/skillSprintApiClient", () => ({
  skillSprintApiClient: { get: vi.fn(), post: vi.fn() },
}));

describe("marketplaceService creator snapshot endpoints", () => {
  beforeEach(() => vi.clearAllMocks());

  it("gets the stored Creator Validation snapshot", async () => {
    const snapshot = { itemId: "pack-1", sourceWorkspaceId: "workspace-1", title: "Pack", chapterCount: 1, quizCount: 1, questionCount: 1, chapters: [] };
    vi.mocked(skillSprintApiClient.get).mockResolvedValueOnce({ data: { code: 1000, message: "Success", data: snapshot } } as any);

    await expect(marketplaceService.getCreatorValidationSnapshot("pack-1")).resolves.toEqual(snapshot);
    expect(skillSprintApiClient.get).toHaveBeenCalledWith("/api/marketplace/items/pack-1/creator-validation");
  });

  it("refreshes a draft snapshot", async () => {
    const item = { itemId: "pack-1", creatorValidationScore: null };
    vi.mocked(skillSprintApiClient.post).mockResolvedValueOnce({ data: { code: 1000, message: "Success", data: item } } as any);

    await expect(marketplaceService.refreshCreatorSnapshot("pack-1")).resolves.toEqual(item);
    expect(skillSprintApiClient.post).toHaveBeenCalledWith("/api/marketplace/items/pack-1/refresh-snapshot");
  });
});

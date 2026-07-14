import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestJson } from "../core/apiClient";
import { getMarketplaceItems } from "./marketplaceAdminService";

vi.mock("../core/apiClient", () => ({ requestJson: vi.fn() }));

describe("marketplaceAdminService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses the pending-review queue by default", async () => {
    vi.mocked(requestJson).mockResolvedValueOnce({ code: 1000, message: "Success", data: [] } as any);

    await getMarketplaceItems();

    expect(requestJson).toHaveBeenCalledWith("/api/admin/marketplace/items?status=PENDING_REVIEW");
  });

  it("requests a specific Marketplace item status", async () => {
    vi.mocked(requestJson).mockResolvedValueOnce({ code: 1000, message: "Success", data: [] } as any);

    await getMarketplaceItems("PUBLISHED");

    expect(requestJson).toHaveBeenCalledWith("/api/admin/marketplace/items?status=PUBLISHED");
  });
});

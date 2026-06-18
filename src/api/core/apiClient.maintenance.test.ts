import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Control role resolution + session lookup the interceptor relies on.
vi.mock("../auth/authService", () => ({
  __esModule: true,
  getStoredAuthSession: vi.fn(),
  isValidAuthSession: () => false,
  isAdminRole: (role: unknown) => role === "ADMIN",
}));

import { requestJson } from "./apiClient";
import { setCachedMaintenance } from "../system/maintenanceState";
import { getStoredAuthSession } from "../auth/authService";

const mockedSession = vi.mocked(getStoredAuthSession);

const ACTIVE = { isActive: true, message: "", startAt: null, endAt: null };

function okFetch() {
  return vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ success: true, code: 200, message: "ok", data: {} }),
  })) as unknown as typeof fetch;
}

beforeEach(() => {
  setCachedMaintenance(null);
  mockedSession.mockReturnValue(null);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("apiClient interceptor — maintenance lockdown", () => {
  it("blocks a non-admin request with a 503 while maintenance is active (no network call)", async () => {
    setCachedMaintenance(ACTIVE);
    const fetchSpy = okFetch();
    vi.stubGlobal("fetch", fetchSpy);

    await expect(requestJson("/api/workspaces")).rejects.toMatchObject({
      status: 503,
      code: "MAINTENANCE_ACTIVE",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("lets an admin request through while maintenance is active", async () => {
    setCachedMaintenance(ACTIVE);
    mockedSession.mockReturnValue({ role: "ADMIN" } as never);
    vi.stubGlobal("fetch", okFetch());

    const res = await requestJson("/api/admin/system/maintenance");
    expect(res.success).toBe(true);
  });

  it("never blocks the public status endpoint (poll must keep working)", async () => {
    setCachedMaintenance(ACTIVE);
    vi.stubGlobal("fetch", okFetch());

    const res = await requestJson("/api/system/status");
    expect(res.success).toBe(true);
  });

  it("does not block anyone when maintenance is inactive", async () => {
    vi.stubGlobal("fetch", okFetch());

    const res = await requestJson("/api/workspaces");
    expect(res.success).toBe(true);
  });
});

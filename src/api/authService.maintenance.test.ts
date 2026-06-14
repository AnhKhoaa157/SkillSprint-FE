import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { login, completeNewPassword, MaintenanceError, enforceMaintenanceLogout } from "./authService";
import { setCachedMaintenance } from "./maintenanceState";

// A structurally valid access token (future `exp`) so isValidAuthSession() accepts the session.
function makeJwt(): string {
  const enc = (o: unknown) => btoa(JSON.stringify(o)).replace(/=+$/, "");
  return `${enc({ alg: "none", typ: "JWT" })}.${enc({ exp: Math.floor(Date.now() / 1000) + 3600 })}.sig`;
}

const JWT = makeJwt();

function authEnvelope(role: string) {
  return {
    success: true,
    code: 200,
    message: "ok",
    data: {
      accessToken: JWT,
      idToken: JWT,
      refreshToken: "refresh",
      expiresIn: 3600,
      tokenType: "Bearer",
      sessionId: "sess-1",
      role,
    },
  };
}

function statusEnvelope(maintenance: boolean) {
  return {
    success: true,
    code: 200,
    message: "ok",
    data: { maintenance, message: "đang bảo trì", startAt: null, endAt: null },
  };
}

// Route fetch by URL: the login POST returns a session, the status GET returns maintenance state.
function installFetch(maintenance: boolean, role: string) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const u = String(url);
      if (u.includes("/api/system/status")) {
        return { ok: true, status: 200, json: async () => statusEnvelope(maintenance) } as unknown as Response;
      }
      if (u.includes("/api/auth/login") || u.includes("/api/auth/complete-new-password")) {
        return { ok: true, status: 200, json: async () => authEnvelope(role) } as unknown as Response;
      }
      throw new Error(`Unexpected fetch: ${u}`);
    }),
  );
}

beforeEach(() => {
  setCachedMaintenance(null);
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("login() — maintenance boundary", () => {
  it("rejects a non-admin login while maintenance is active", async () => {
    installFetch(true, "LEARNER");
    await expect(login("learner@x.com", "pw")).rejects.toBeInstanceOf(MaintenanceError);
  });

  it("lets an admin log in while maintenance is active", async () => {
    installFetch(true, "ADMIN");
    const result = await login("admin@x.com", "pw");
    expect(result.status).toBe("authenticated");
  });

  it("lets a non-admin log in when maintenance is inactive", async () => {
    installFetch(false, "LEARNER");
    const result = await login("learner@x.com", "pw");
    expect(result.status).toBe("authenticated");
  });
});

describe("completeNewPassword() — maintenance boundary", () => {
  it("rejects a non-admin completing the challenge while maintenance is active", async () => {
    installFetch(true, "LEARNER");
    await expect(completeNewPassword("learner@x.com", "newpw", "challenge")).rejects.toBeInstanceOf(
      MaintenanceError,
    );
  });
});

describe("enforceMaintenanceLogout()", () => {
  it("is a no-op when maintenance is inactive", () => {
    expect(enforceMaintenanceLogout(false)).toBe(false);
  });

  it("is a no-op when there is no stored session", () => {
    expect(enforceMaintenanceLogout(true)).toBe(false);
  });
});

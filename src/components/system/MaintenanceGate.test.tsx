import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MaintenanceGate } from "./MaintenanceGate";
import { getSystemStatus } from "../../api/systemMaintenanceService";

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Public status endpoint — tests drive this to flip maintenance on/off.
vi.mock("../../api/systemMaintenanceService", () => ({
  __esModule: true,
  getSystemStatus: vi.fn(),
}));

// Swap the full-screen lockdown for a cheap sentinel so we assert *that* it renders,
// not how it looks (covered by its own concerns).
vi.mock("./MaintenanceScreen", () => ({
  __esModule: true,
  MaintenanceScreen: () => <div data-testid="maintenance-screen">LOCKED</div>,
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ACTIVE = {
  isActive: true,
  message: "Đang bảo trì",
  startAt: null,
  endAt: null,
};

const INACTIVE = { ...ACTIVE, isActive: false };

function setPath(pathname: string) {
  window.history.pushState({}, "", pathname);
}

function renderGate() {
  return render(
    <MaintenanceGate>
      <div data-testid="app">APP</div>
    </MaintenanceGate>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  setPath("/login");
});

// ─── Specs ────────────────────────────────────────────────────────────────────

describe("MaintenanceGate — top-level lockdown", () => {
  it("never reveals the app while the first status check is in flight", async () => {
    // A status fetch that never resolves keeps the gate in its LOADING state.
    setPath("/app");
    vi.mocked(getSystemStatus).mockReturnValue(new Promise(() => {}));

    renderGate();

    // The blocker is shown and the dashboard is NOT mounted (the core exploit is closed).
    expect(screen.getByTestId("maintenance-loading")).toBeInTheDocument();
    expect(screen.queryByTestId("app")).not.toBeInTheDocument();
    expect(screen.queryByTestId("maintenance-screen")).not.toBeInTheDocument();
  });

  it("renders the app when maintenance is inactive", async () => {
    vi.mocked(getSystemStatus).mockResolvedValue(INACTIVE);

    renderGate();

    await waitFor(() => expect(screen.getByTestId("app")).toBeInTheDocument());
    expect(screen.queryByTestId("maintenance-screen")).not.toBeInTheDocument();
  });

  it("replaces a normal route with the lockdown screen when active", async () => {
    setPath("/app");
    vi.mocked(getSystemStatus).mockResolvedValue(ACTIVE);

    renderGate();

    await waitFor(() => expect(screen.getByTestId("maintenance-screen")).toBeInTheDocument());
    expect(screen.queryByTestId("app")).not.toBeInTheDocument();
  });

  it("delegates /login to children while active so <Auth> owns the lockdown", async () => {
    setPath("/login");
    vi.mocked(getSystemStatus).mockResolvedValue(ACTIVE);

    renderGate();

    // The gate must NOT pre-empt /login with its own screen — <Auth> renders its full-screen gate.
    await waitFor(() => expect(screen.getByTestId("app")).toBeInTheDocument());
    expect(screen.queryByTestId("maintenance-screen")).not.toBeInTheDocument();
  });

  it("delegates the OAuth callback to children while active (admin Google bypass)", async () => {
    setPath("/auth/callback");
    vi.mocked(getSystemStatus).mockResolvedValue(ACTIVE);

    renderGate();

    await waitFor(() => expect(screen.getByTestId("app")).toBeInTheDocument());
    expect(screen.queryByTestId("maintenance-screen")).not.toBeInTheDocument();
  });

  it("keeps the admin login portal reachable while active (self-lockout guard)", async () => {
    setPath("/admin-login");
    vi.mocked(getSystemStatus).mockResolvedValue(ACTIVE);

    renderGate();

    await waitFor(() => expect(screen.getByTestId("app")).toBeInTheDocument());
    expect(screen.queryByTestId("maintenance-screen")).not.toBeInTheDocument();
  });

  it("keeps the admin dashboard reachable while active so maintenance can be lifted", async () => {
    setPath("/admin/users");
    vi.mocked(getSystemStatus).mockResolvedValue(ACTIVE);

    renderGate();

    await waitFor(() => expect(screen.getByTestId("app")).toBeInTheDocument());
    expect(screen.queryByTestId("maintenance-screen")).not.toBeInTheDocument();
  });

  it("fails open: an unreachable status endpoint never traps users", async () => {
    setPath("/login");
    vi.mocked(getSystemStatus).mockRejectedValue(new Error("network down"));

    renderGate();

    await waitFor(() => expect(screen.getByTestId("app")).toBeInTheDocument());
    expect(screen.queryByTestId("maintenance-screen")).not.toBeInTheDocument();
  });
});

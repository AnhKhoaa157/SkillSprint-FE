import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WorkspacesNew from "./WorkspacesNew";
import workspaceService from "../../../api/utilities/workspaceService";

const navigate = vi.fn();

vi.mock("react-router", () => ({
  useNavigate: () => navigate,
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("../../../api/utilities/workspaceService", () => ({
  default: {
    createWorkspace: vi.fn(),
  },
}));

describe("WorkspacesNew", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a workspace with its optional description", async () => {
    const user = userEvent.setup();
    vi.mocked(workspaceService.createWorkspace).mockResolvedValue({
      workspaceId: "workspace-1",
      name: "React Interview Prep",
      description: "Ôn React và TypeScript cho phỏng vấn frontend.",
      status: "ACTIVE",
      createdAt: "2026-07-22T00:00:00Z",
    });

    render(<WorkspacesNew />);

    await user.type(screen.getByPlaceholderText("Ví dụ: React Interview Prep"), "React Interview Prep");
    await user.type(
      screen.getByPlaceholderText("Ví dụ: Ôn React để phỏng vấn frontend trong 6 tuần, tập trung vào hooks, TypeScript và thực hành dự án nhỏ."),
      "Ôn React và TypeScript cho phỏng vấn frontend.",
    );
    await user.click(screen.getByRole("button", { name: "Tạo workspace" }));

    await waitFor(() => {
      expect(workspaceService.createWorkspace).toHaveBeenCalledWith({
        name: "React Interview Prep",
        description: "Ôn React và TypeScript cho phỏng vấn frontend.",
      });
    });
    expect(navigate).toHaveBeenCalledWith("/app/workspaces/workspace-1", { state: { openOnboarding: true } });
  });
});

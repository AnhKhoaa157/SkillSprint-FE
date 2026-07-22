import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, beforeEach, expect, it } from "vitest";
import Workspaces from "./Workspaces";
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
    deleteWorkspace: vi.fn(),
    getMyWorkspaces: vi.fn(),
    updateWorkspace: vi.fn(),
  },
}));

vi.mock("../../components/workspace/WorkspaceCard", () => ({
  default: ({ title }: { title: string }) => <div>{title}</div>,
}));

describe("Workspaces", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(workspaceService.getMyWorkspaces).mockResolvedValue([]);
  });

  it("sends the optional description when creating a workspace", async () => {
    const user = userEvent.setup();
    vi.mocked(workspaceService.createWorkspace).mockResolvedValue({
      workspaceId: "workspace-1",
      name: "React Interview Prep",
      description: "Ôn React và TypeScript cho phỏng vấn frontend.",
      status: "ACTIVE",
      createdAt: "2026-07-22T00:00:00Z",
    });

    render(<Workspaces />);

    await user.click(await screen.findByRole("button", { name: "Tạo workspace" }));
    await user.type(screen.getByPlaceholderText("Ví dụ: React Interview Prep"), "React Interview Prep");
    await user.type(
      screen.getByPlaceholderText("Ví dụ: Luyện phát triển giao diện React, từng câu hỏi phỏng vấn và kỹ năng TypeScript."),
      "Ôn React và TypeScript cho phỏng vấn frontend.",
    );

    const createButtons = screen.getAllByRole("button", { name: "Tạo workspace" });
    await user.click(createButtons[createButtons.length - 1]);

    await waitFor(() => {
      expect(workspaceService.createWorkspace).toHaveBeenCalledWith({
        name: "React Interview Prep",
        description: "Ôn React và TypeScript cho phỏng vấn frontend.",
      });
    });
  });
});

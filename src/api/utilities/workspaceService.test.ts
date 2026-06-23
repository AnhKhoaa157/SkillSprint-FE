import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createWorkspace,
  getMyWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
} from "./workspaceService";
import { requestJson } from "../core/apiClient";

vi.mock("../core/apiClient", () => ({
  requestJson: vi.fn(),
}));

describe("workspaceService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createWorkspace", () => {
    it("should create a workspace", async () => {
      const mockResponse = { data: { workspaceId: "ws1", name: "Test WS" } };
      vi.mocked(requestJson).mockResolvedValueOnce(mockResponse as any);

      const request = { name: "Test WS" };
      const result = await createWorkspace(request);

      expect(requestJson).toHaveBeenCalledWith("/api/workspaces", {
        method: "POST",
        body: JSON.stringify(request),
      });
      expect(result).toEqual(mockResponse.data);
    });

    it("should throw error if creation fails", async () => {
      vi.mocked(requestJson).mockResolvedValueOnce({} as any);

      await expect(createWorkspace({ name: "Test" })).rejects.toThrow("Create workspace failed");
    });
  });

  describe("getMyWorkspaces", () => {
    it("should fetch all workspaces", async () => {
      const mockWorkspaces = [{ workspaceId: "ws1", name: "Test WS" }];
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockWorkspaces } as any);

      const result = await getMyWorkspaces();

      expect(requestJson).toHaveBeenCalledWith("/api/workspaces", { method: "GET" });
      expect(result).toEqual(mockWorkspaces);
    });

    it("should throw error if fetch fails", async () => {
      vi.mocked(requestJson).mockResolvedValueOnce({} as any);
      await expect(getMyWorkspaces()).rejects.toThrow("Fetch workspaces failed");
    });
  });

  describe("getWorkspace", () => {
    it("should fetch a single workspace", async () => {
      const mockWorkspace = { workspaceId: "ws1", name: "Test WS" };
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockWorkspace } as any);

      const result = await getWorkspace("ws1");

      expect(requestJson).toHaveBeenCalledWith("/api/workspaces/ws1", { method: "GET" });
      expect(result).toEqual(mockWorkspace);
    });

    it("should throw error if fetch fails", async () => {
      vi.mocked(requestJson).mockResolvedValueOnce({} as any);
      await expect(getWorkspace("ws1")).rejects.toThrow("Fetch workspace failed");
    });
  });

  describe("updateWorkspace", () => {
    it("should update a workspace", async () => {
      const mockWorkspace = { workspaceId: "ws1", name: "Updated" };
      vi.mocked(requestJson).mockResolvedValueOnce({ data: mockWorkspace } as any);

      const request = { name: "Updated" };
      const result = await updateWorkspace("ws1", request);

      expect(requestJson).toHaveBeenCalledWith("/api/workspaces/ws1", {
        method: "PATCH",
        body: JSON.stringify(request),
      });
      expect(result).toEqual(mockWorkspace);
    });

    it("should throw error if update fails", async () => {
      vi.mocked(requestJson).mockResolvedValueOnce({} as any);
      await expect(updateWorkspace("ws1", { name: "Test" })).rejects.toThrow("Update workspace failed");
    });
  });

  describe("deleteWorkspace", () => {
    it("should delete a workspace", async () => {
      vi.mocked(requestJson).mockResolvedValueOnce({ success: true } as any);

      await deleteWorkspace("ws1");

      expect(requestJson).toHaveBeenCalledWith("/api/workspaces/ws1", { method: "DELETE" });
    });

    it("should throw error if delete fails", async () => {
      vi.mocked(requestJson).mockResolvedValueOnce({ success: false } as any);
      await expect(deleteWorkspace("ws1")).rejects.toThrow("Delete workspace failed");
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createMaterialUploadUrl,
  confirmMaterialUpload,
  getWorkspaceMaterials,
  getMaterials,
  getMaterialProcessingJob,
  deleteMaterial,
  getMaterialDetail,
} from "./materialService";
import { requestJson } from "../core/apiClient";

vi.mock("../core/apiClient", () => ({
  requestJson: vi.fn(),
}));

describe("materialService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockWorkspaceId = "workspace-1";
  const mockMaterialId = "material-1";

  describe("createMaterialUploadUrl", () => {
    it("should fetch upload URL", async () => {
      const mockResponse = { data: { uploadUrl: "http://example.com/upload", objectKey: "key", expiresAt: "2023-01-01" }, success: true, code: 200, message: "ok" };
      vi.mocked(requestJson).mockResolvedValueOnce(mockResponse);

      const requestPayload = { fileName: "test.pdf", contentType: "application/pdf" };
      const result = await createMaterialUploadUrl(mockWorkspaceId, requestPayload);

      expect(requestJson).toHaveBeenCalledWith(`/api/workspaces/${mockWorkspaceId}/materials/upload-url`, {
        method: "POST",
        body: JSON.stringify(requestPayload),
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("confirmMaterialUpload", () => {
    it("should confirm material upload", async () => {
      const mockResponse = { data: { materialId: mockMaterialId, filename: "test.pdf" }, success: true, code: 200, message: "ok" };
      vi.mocked(requestJson).mockResolvedValueOnce(mockResponse);

      const requestPayload = { objectKey: "key", fileName: "test.pdf", contentType: "application/pdf" };
      const result = await confirmMaterialUpload(mockWorkspaceId, requestPayload);

      expect(requestJson).toHaveBeenCalledWith(`/api/workspaces/${mockWorkspaceId}/materials/confirm`, {
        method: "POST",
        body: JSON.stringify(requestPayload),
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("getWorkspaceMaterials and getMaterials", () => {
    it("getWorkspaceMaterials should fetch materials", async () => {
      const mockResponse = { data: [{ materialId: mockMaterialId }], success: true, code: 200, message: "ok" };
      vi.mocked(requestJson).mockResolvedValueOnce(mockResponse);

      const result = await getWorkspaceMaterials(mockWorkspaceId);

      expect(requestJson).toHaveBeenCalledWith(`/api/workspaces/${mockWorkspaceId}/materials`, { method: "GET" });
      expect(result).toEqual(mockResponse.data);
    });

    it("getMaterials should fetch materials", async () => {
      const mockResponse = { data: [{ materialId: mockMaterialId }], success: true, code: 200, message: "ok" };
      vi.mocked(requestJson).mockResolvedValueOnce(mockResponse);

      const result = await getMaterials(mockWorkspaceId);

      expect(requestJson).toHaveBeenCalledWith(`/api/workspaces/${mockWorkspaceId}/materials`, { method: "GET" });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("getMaterialProcessingJob", () => {
    it("should fetch processing job status", async () => {
      const mockResponse = { data: { jobId: "job-1", status: "PROCESSING" }, success: true, code: 200, message: "ok" };
      vi.mocked(requestJson).mockResolvedValueOnce(mockResponse);

      const result = await getMaterialProcessingJob(mockWorkspaceId, mockMaterialId);

      expect(requestJson).toHaveBeenCalledWith(`/api/workspaces/${mockWorkspaceId}/materials/${mockMaterialId}/processing-job`, { method: "GET" });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("deleteMaterial", () => {
    it("should delete material", async () => {
      vi.mocked(requestJson).mockResolvedValueOnce({ success: true, code: 200, message: "ok", data: null });

      await deleteMaterial(mockWorkspaceId, mockMaterialId);

      expect(requestJson).toHaveBeenCalledWith(`/api/workspaces/${mockWorkspaceId}/materials/${mockMaterialId}`, { method: "DELETE" });
    });
  });

  describe("getMaterialDetail", () => {
    it("should fetch material details", async () => {
      const mockResponse = { data: { materialId: mockMaterialId, filename: "test.pdf" }, success: true, code: 200, message: "ok" };
      vi.mocked(requestJson).mockResolvedValueOnce(mockResponse);

      const result = await getMaterialDetail(mockWorkspaceId, mockMaterialId);

      expect(requestJson).toHaveBeenCalledWith(`/api/workspaces/${mockWorkspaceId}/materials/${mockMaterialId}`, { method: "GET" });
      expect(result).toEqual(mockResponse.data);
    });

    it("should propagate errors", async () => {
      vi.mocked(requestJson).mockRejectedValueOnce(new Error("Network Error"));

      await expect(getMaterialDetail(mockWorkspaceId, mockMaterialId)).rejects.toThrow("Network Error");
    });
  });
});

import { requestJson } from "./apiClient";

export type LearningStructureResponse = {
  structureId?: string;
  workspaceId?: string;
  title?: string;
  summary?: string;
  status?: string;
  versionNo?: number;
  generatedBy?: string;
  createdAt?: string;
  chapters?: Array<{
    chapterId?: string;
    title?: string;
    summary?: string;
    whatToLearn?: string[];
    keyConcepts?: string[];
    learningOutcomes?: string[];
    recommendedFocus?: string[];
    difficulty?: string;
    estimatedMinutes?: number;
    sequenceNo?: number;
    sourceChunkIds?: string[];
    topics?: Array<{
      topicId?: string;
      title?: string;
      summaryContent?: string;
      whatToLearn?: string[];
      keyConcepts?: string[];
      learningOutcomes?: string[];
      recommendedFocus?: string[];
      difficulty?: string;
      estimatedMinutes?: number;
      sequenceNo?: number;
      sourceChunkIds?: string[];
    }>;
  }>;
  [key: string]: unknown;
};

/**
 * POST /api/workspaces/{workspaceId}/learning-structure/generate
 * Sinh cấu trúc học tập (Phân tích AI) — không gửi body/query rác tránh chặn CORS.
 */
export async function generateLearningStructure(workspaceId: string): Promise<LearningStructureResponse> {
  const res = await requestJson<LearningStructureResponse>(
    `/api/workspaces/${workspaceId}/learning-structure/generate`,
    { method: "POST" },
  );

  // Safely unwrap the unified backend response: res?.data holds the payload, fallback to res itself.
  const cleanData = res?.data || res;

  // If cleanData is valid (e.g., contains the chapters array), return it immediately.
  if (cleanData && typeof cleanData === "object" && (Array.isArray((cleanData as any).chapters) || (cleanData as any).structureId)) {
    return cleanData as LearningStructureResponse;
  }

  // If we got here, the payload was empty/missing — reject with a clear error.
  throw new Error((res as any)?.message || "Operation failed");
}

export default {
  generateLearningStructure,
};
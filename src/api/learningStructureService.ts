import { skillSprintApiClient, extractApiData, type ApiResponse } from "./skillSprintApiClient";

// ─── Status Enum ──────────────────────────────────────────────────────────────

export type LearningStructureStatus = "REVIEW_REQUIRED" | "CONFIRMED";

// ─── Response Types ───────────────────────────────────────────────────────────

export type TopicResponse = {
  topicId: string;
  title: string;
  summaryContent?: string;
  whatToLearn?: string[];
  keyConcepts?: string[];
  learningOutcomes?: string[];
  recommendedFocus?: string[];
  difficulty?: string;
  estimatedMinutes?: number;
  sequenceNo?: number;
  sourceChunkIds?: string[];
};

export type ChapterResponse = {
  chapterId: string;
  title: string;
  summary?: string;
  whatToLearn?: string[];
  keyConcepts?: string[];
  learningOutcomes?: string[];
  recommendedFocus?: string[];
  difficulty?: string;
  estimatedMinutes?: number;
  sequenceNo?: number;
  sourceChunkIds?: string[];
  topics?: TopicResponse[];
};

export type LearningStructureResponse = {
  structureId?: string;
  workspaceId?: string;
  title?: string;
  summary?: string;
  status?: LearningStructureStatus | string;
  versionNo?: number;
  generatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  chapters?: ChapterResponse[];
  // Allow backend to attach extra fields (e.g., roadmapId after generation)
  [key: string]: unknown;
};

// ─── Request Types ────────────────────────────────────────────────────────────

export type UpdateChapterRequest = {
  title?: string;
  summary?: string;
  sequenceNo?: number;
};

export type UpdateTopicRequest = {
  title?: string;
  summaryContent?: string;
  sequenceNo?: number;
};

export type AddTopicRequest = {
  title: string;
  summaryContent?: string;
};

// ─── URL helper ───────────────────────────────────────────────────────────────

const base = (workspaceId: string) =>
  `/api/workspaces/${workspaceId}/learning-structure`;

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * POST /api/workspaces/{workspaceId}/learning-structure/generate
 * Triggers AI analysis of uploaded materials and returns the generated structure.
 */
async function generateLearningStructure(
  workspaceId: string,
): Promise<LearningStructureResponse> {
  const res = await skillSprintApiClient.post<ApiResponse<LearningStructureResponse>>(
    `${base(workspaceId)}/generate`,
  );
  return extractApiData(res);
}

/**
 * GET /api/workspaces/{workspaceId}/learning-structure
 * Fetches the latest learning structure for a workspace. Returns null on 404.
 */
async function getLearningStructure(
  workspaceId: string,
): Promise<LearningStructureResponse | null> {
  try {
    const res = await skillSprintApiClient.get<ApiResponse<LearningStructureResponse>>(
      base(workspaceId),
    );
    return extractApiData(res);
  } catch (err: unknown) {
    // Treat 404 (no structure yet) as null rather than an error
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 404) return null;
    throw err;
  }
}

/**
 * POST /api/workspaces/{workspaceId}/learning-structure/confirm
 * Locks the structure as CONFIRMED, enabling roadmap generation.
 */
async function confirmLearningStructure(
  workspaceId: string,
): Promise<LearningStructureResponse> {
  const res = await skillSprintApiClient.post<ApiResponse<LearningStructureResponse>>(
    `${base(workspaceId)}/confirm`,
    {},
  );
  return extractApiData(res);
}

/**
 * PATCH /api/workspaces/{workspaceId}/learning-structure/chapters/{chapterId}
 * Updates chapter title, summary, or sequence order.
 */
async function updateChapter(
  workspaceId: string,
  chapterId: string,
  body: UpdateChapterRequest,
): Promise<ChapterResponse> {
  const res = await skillSprintApiClient.patch<ApiResponse<ChapterResponse>>(
    `${base(workspaceId)}/chapters/${chapterId}`,
    body,
  );
  return extractApiData(res);
}

/**
 * PATCH /api/workspaces/{workspaceId}/learning-structure/chapters/{chapterId}/topics/{topicId}
 * Updates topic title, summary, or sequence order within a chapter.
 */
async function updateTopic(
  workspaceId: string,
  chapterId: string,
  topicId: string,
  body: UpdateTopicRequest,
): Promise<TopicResponse> {
  const res = await skillSprintApiClient.patch<ApiResponse<TopicResponse>>(
    `${base(workspaceId)}/chapters/${chapterId}/topics/${topicId}`,
    body,
  );
  return extractApiData(res);
}

/**
 * POST /api/workspaces/{workspaceId}/learning-structure/chapters/{chapterId}/topics
 * Appends a new topic to an existing chapter.
 */
async function addTopic(
  workspaceId: string,
  chapterId: string,
  body: AddTopicRequest,
): Promise<TopicResponse> {
  const res = await skillSprintApiClient.post<ApiResponse<TopicResponse>>(
    `${base(workspaceId)}/chapters/${chapterId}/topics`,
    body,
  );
  return extractApiData(res);
}

/**
 * DELETE /api/workspaces/{workspaceId}/learning-structure/chapters/{chapterId}/topics/{topicId}
 * Permanently removes a topic from a chapter.
 */
async function deleteTopic(
  workspaceId: string,
  chapterId: string,
  topicId: string,
): Promise<void> {
  await skillSprintApiClient.delete(
    `${base(workspaceId)}/chapters/${chapterId}/topics/${topicId}`,
  );
}

// ─── Exports ──────────────────────────────────────────────────────────────────

const learningStructureService = {
  generateLearningStructure,
  getLearningStructure,
  confirmLearningStructure,
  updateChapter,
  updateTopic,
  addTopic,
  deleteTopic,
};

export default learningStructureService;

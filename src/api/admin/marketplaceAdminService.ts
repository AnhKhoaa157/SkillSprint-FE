import { requestJson } from "../core/apiClient";
import type { AdminMarketplaceChapter, AdminMarketplaceDetail, AdminMarketplaceDetailPayload, AdminMarketplaceListItem, AdminMarketplaceQuestion, AdminMarketplaceStatus, RawAdminMarketplaceQuestion, UpdateAdminMarketplaceStatusRequest } from "./marketplaceAdminTypes";

const BASE = "/api/admin/marketplace/items";

function requireData<T>(response: { data: T | null; message?: string }): T {
  if (response.data === null) throw new Error(response.message || "Không nhận được dữ liệu từ máy chủ.");
  return response.data;
}

export async function getMarketplaceItems(status: AdminMarketplaceStatus = "PENDING_REVIEW"): Promise<AdminMarketplaceListItem[]> {
  return requireData(await requestJson<AdminMarketplaceListItem[]>(`${BASE}?status=${encodeURIComponent(status)}`));
}

/** Kept for callers that only need the default moderation queue. */
export const getPendingMarketplaceItems = () => getMarketplaceItems("PENDING_REVIEW");

export async function getMarketplaceReviewDetail(itemId: string): Promise<AdminMarketplaceDetail> {
  return normalizeDetail(requireData(await requestJson<AdminMarketplaceDetailPayload>(`${BASE}/${encodeURIComponent(itemId)}`)));
}

export async function updateMarketplaceReviewStatus(itemId: string, request: UpdateAdminMarketplaceStatusRequest): Promise<AdminMarketplaceListItem> {
  return requireData(await requestJson<AdminMarketplaceListItem>(`${BASE}/${encodeURIComponent(itemId)}/status`, {
    method: "PATCH",
    body: JSON.stringify(request),
  }));
}

function normalizeDetail(payload: AdminMarketplaceDetailPayload): AdminMarketplaceDetail {
  const correctOptionByQuestion = new Map(payload.correctAnswers?.map(answer => [answer.questionId, answer.correctOptionId]));
  const rawChapters = payload.content?.chapters ?? payload.chapters ?? payload.snapshot ?? [];
  const chapters: AdminMarketplaceChapter[] = rawChapters.map((chapter, chapterIndex) => {
    const chapterId = chapter.chapterId ?? `${payload.versionId ?? payload.itemId}-chapter-${chapterIndex + 1}`;
    const rawQuizzes = chapter.quizzes?.length ? chapter.quizzes : chapter.quiz ? [chapter.quiz] : [];
    const normalizeQuestion = (question: RawAdminMarketplaceQuestion, questionIndex: number): AdminMarketplaceQuestion => {
      const questionId = question.questionId ?? `${chapterId}-question-${questionIndex + 1}`;
      return {
        questionId,
        question: question.text ?? question.question ?? "Câu hỏi chưa có nội dung",
        type: question.type ?? null,
        explanation: question.explanation ?? question.evidence?.explanation ?? null,
        evidence: question.evidence ? {
          sourceStepId: question.evidence.sourceStepId ?? null,
          sourceChunkIds: question.evidence.sourceChunkIds ?? [],
          explanation: question.evidence.explanation ?? null,
        } : null,
        options: (question.options ?? []).map((option, optionIndex) => {
          const optionId = option.optionId ?? `${questionId}-option-${optionIndex + 1}`;
          return {
            optionId,
            label: option.label ?? null,
            text: option.text ?? "Lựa chọn chưa có nội dung",
            correct: option.correct ?? correctOptionByQuestion.get(questionId) === optionId,
          };
        }),
      };
    };

    return {
      chapterId,
      sequenceNo: chapter.sequenceNo ?? chapterIndex + 1,
      title: chapter.title ?? `Chương ${chapterIndex + 1}`,
      summary: chapter.summary ?? null,
      questions: chapter.questions?.map(normalizeQuestion),
      quizzes: rawQuizzes.map((quiz, quizIndex) => ({
        quizId: quiz.quizId ?? `${chapterId}-quiz-${quizIndex + 1}`,
        title: quiz.title ?? `Quiz chương ${chapterIndex + 1}`,
        questions: (quiz.questions ?? []).map(normalizeQuestion),
      })),
    };
  });

  return { ...payload, qualityJobHistory: payload.qualityJobHistory ?? [], chapters };
}

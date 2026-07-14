import { requestJson } from "../core/apiClient";
import type { AdminMarketplaceChapter, AdminMarketplaceDetail, AdminMarketplaceDetailPayload, AdminMarketplaceListItem, UpdateAdminMarketplaceStatusRequest } from "./marketplaceAdminTypes";

const BASE = "/api/admin/marketplace/items";

function requireData<T>(response: { data: T | null; message?: string }): T {
  if (response.data === null) throw new Error(response.message || "Không nhận được dữ liệu từ máy chủ.");
  return response.data;
}

export async function getPendingMarketplaceItems(): Promise<AdminMarketplaceListItem[]> {
  return requireData(await requestJson<AdminMarketplaceListItem[]>(BASE));
}

export async function getMarketplaceReviewDetail(itemId: string): Promise<AdminMarketplaceDetail> {
  return normalizeDetail(requireData(await requestJson<AdminMarketplaceDetailPayload>(`${BASE}/${encodeURIComponent(itemId)}`)));
}

export async function updateMarketplaceReviewStatus(itemId: string, request: UpdateAdminMarketplaceStatusRequest): Promise<AdminMarketplaceDetail> {
  return normalizeDetail(requireData(await requestJson<AdminMarketplaceDetailPayload>(`${BASE}/${encodeURIComponent(itemId)}/status`, {
    method: "PATCH",
    body: JSON.stringify(request),
  })));
}

function normalizeDetail(payload: AdminMarketplaceDetailPayload): AdminMarketplaceDetail {
  const correctOptionByQuestion = new Map(payload.correctAnswers?.map(answer => [answer.questionId, answer.correctOptionId]));
  const applyCorrectAnswers = (chapters: AdminMarketplaceChapter[]) => chapters.map(chapter => ({
    ...chapter,
    questions: chapter.questions?.map(question => ({
      ...question,
      options: question.options.map(option => ({ ...option, correct: option.correct ?? correctOptionByQuestion.get(question.questionId) === option.optionId })),
    })),
    quizzes: chapter.quizzes?.map(quiz => ({
      ...quiz,
      questions: quiz.questions.map(question => ({
        ...question,
        options: question.options.map(option => ({ ...option, correct: option.correct ?? correctOptionByQuestion.get(question.questionId) === option.optionId })),
      })),
    })),
  }));

  return { ...payload, chapters: applyCorrectAnswers(payload.chapters ?? payload.snapshot ?? []) };
}

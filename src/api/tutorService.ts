import { requestJson } from "./apiClient";

export interface TutorAskRequest {
  question: string;
}

export interface TutorContextResponse {
  scope: "WORKSPACE" | "ROADMAP_STEP";
  workspaceId: string;
  workspaceName: string;
  matchedStepId: string | null;
  matchedStepTitle: string | null;
}

export interface TutorAskResponse {
  answer: string;
  suggestedQuestions: string[];
  confidence: "HIGH" | "MEDIUM" | "LOW";
  context: TutorContextResponse;
}

const tutorService = {
  askWorkspace: (workspaceId: string, req: TutorAskRequest) =>
    requestJson<TutorAskResponse>(`/api/workspaces/${workspaceId}/tutor/ask`, {
      method: "POST",
      body: JSON.stringify(req),
    }),

  askStep: (stepId: string, req: TutorAskRequest) =>
    requestJson<TutorAskResponse>(`/api/roadmap-steps/${stepId}/tutor/ask`, {
      method: "POST",
      body: JSON.stringify(req),
    }),
};

export default tutorService;

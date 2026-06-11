import { Navigate, useLocation, useNavigate, useParams } from "react-router";
import QuizContainer from "../../components/tools/QuizContainer";
import { useSubscription } from "../../../hooks/useSubscription";
import type { QuizAttemptResponse } from "../../../api/quizService";

export default function QuizPage() {
  const { quizId: _quizId } = useParams<{ quizId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const stepId = (location.state as { stepId?: string } | null)?.stepId;
  const { planId } = useSubscription();

  // stepId must be passed in navigation state from CoursePlayer. Without it
  // we cannot load the quiz, so fall back gracefully.
  if (!stepId) {
    return <Navigate to="/app/workspaces" replace />;
  }

  function handleComplete(_result: QuizAttemptResponse) {
    navigate(-1);
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Sửa lại prop truyền vào: đổi từ isPremium thành currentPlan và truyền trực tiếp planId */}
        <QuizContainer
          stepId={stepId}
          currentPlan={planId}
          onComplete={() => {}}
          onCompleteSession={handleComplete}
        />
      </div>
    </div>
  );
}
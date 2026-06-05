import { useEffect, useRef, useState } from "react";
import { Bot, ChevronRight, Send, Sparkles } from "lucide-react";
import tutorService, { type TutorContextResponse } from "../../../api/tutorService";

interface TutorMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  confidence?: "HIGH" | "MEDIUM" | "LOW";
  suggestedQuestions?: string[];
  context?: TutorContextResponse;
}

export interface AiTutorChatProps {
  /** "workspace" → dispatches to askWorkspace(contextId); "step" → dispatches to askStep(contextId) */
  mode: "workspace" | "step";
  /** The ID of the entity being targeted: workspaceId when mode="workspace", stepId when mode="step" */
  contextId: string;
  contextTitle: string;
}

const MAX_CHARS = 1000;

const confidenceMeta = {
  HIGH: {
    label: "Chắc chắn",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  MEDIUM: {
    label: "Tương đối",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-400",
  },
  LOW: {
    label: "Không chắc",
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-600",
    dot: "bg-rose-400",
  },
};

export default function AiTutorChat({ mode, contextId, contextTitle }: AiTutorChatProps) {
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendQuestion = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || loading) return;
    setError(null);

    const userMsg: TutorMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res =
        mode === "step"
          ? await tutorService.askStep(contextId, { question: trimmed })
          : await tutorService.askWorkspace(contextId, { question: trimmed });

      if (!res.data) throw new Error("Không nhận được phản hồi từ AI.");

      const aiMsg: TutorMessage = {
        id: crypto.randomUUID(),
        role: "ai",
        content: res.data.answer,
        confidence: res.data.confidence,
        suggestedQuestions: res.data.suggestedQuestions,
        context: res.data.context,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setError(err?.message || "Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendQuestion(input);
    }
  };

  const charsLeft = MAX_CHARS - input.length;

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#fcfaf7]/30 text-slate-800 border border-slate-100 rounded-xl overflow-hidden">
      {/* Context badge */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2.5 shrink-0 border-b border-slate-100/80">
        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-violet-50 border border-violet-100 shrink-0">
          <Sparkles className="h-3 w-3 text-violet-500" />
        </div>
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Phạm vi:</span>
        <span className="text-[9px] font-semibold text-slate-600 truncate">{contextTitle}</span>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 min-h-0 px-4 py-3 bg-[#fdfbf9]/60">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center px-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 border border-violet-100 mb-3 shadow-sm">
              <Bot className="h-6 w-6 text-violet-500" />
            </div>
            <p className="text-xs font-bold text-slate-700">Hỏi AI Tutor</p>
            <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed max-w-[200px]">
              {mode === "step"
                ? "Đặt câu hỏi về cột mốc này. AI trả lời dựa trên tài liệu tương ứng."
                : "Đặt câu hỏi về workspace. AI phân tích lộ trình và tài liệu học tập của bạn."}
            </p>
          </div>
        )}

        {messages.map((msg) =>
          msg.role === "user" ? (
            <div key={msg.id} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-tr-none bg-[#f37021] px-3.5 py-2.5 shadow-sm shadow-orange-600/10">
                <p className="text-xs font-medium text-white leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>
            </div>
          ) : (
            <div key={msg.id} className="flex flex-col gap-2">
              {/* AI answer bubble */}
              <div className="max-w-[92%] rounded-2xl rounded-tl-none bg-white border border-slate-200/80 px-3.5 py-3 shadow-xs">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="flex h-[18px] w-[18px] items-center justify-center rounded bg-violet-50 border border-violet-100 shrink-0">
                    <Bot className="h-2.5 w-2.5 text-violet-500" />
                  </div>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">
                    AI Tutor
                  </span>
                  {msg.confidence && (() => {
                    const m = confidenceMeta[msg.confidence];
                    return (
                      <span
                        className={`ml-auto inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[8px] font-bold ${m.bg} ${m.border} ${m.text}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
                        {m.label}
                      </span>
                    );
                  })()}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
                {/* Show matched step badge only in workspace mode */}
                {mode === "workspace" && msg.context?.matchedStepTitle && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100/80">
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 border border-violet-100/60 px-2 py-0.5 text-[8px] font-bold text-violet-600">
                      🎯 Chủ đề: {msg.context.matchedStepTitle}
                    </span>
                  </div>
                )}
              </div>

              {/* Suggested questions */}
              {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                <div className="space-y-1.5 max-w-[92%]">
                  <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400 px-1">
                    Câu hỏi gợi ý
                  </p>
                  {msg.suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => void sendQuestion(q)}
                      className="flex w-full items-start gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-[10px] font-medium text-slate-600 hover:text-violet-600 hover:bg-violet-50 hover:border-violet-300 transition-all group shadow-xs"
                    >
                      <ChevronRight className="h-3 w-3 text-slate-400 group-hover:text-violet-500 shrink-0 mt-0.5" />
                      <span className="flex-1 leading-snug">{q}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2.5 rounded-2xl rounded-bl-sm bg-white border border-slate-200 shadow-xs px-4 py-3">
              <div className="flex items-center gap-1">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
              <span className="text-[10px] text-slate-500">AI đang suy nghĩ...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[10px] text-rose-700">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="px-4 pb-3 pt-2.5 shrink-0 border-t border-slate-100">
        <div className="relative rounded-xl border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:border-violet-400 transition-all">
          <textarea
            ref={textareaRef}
            rows={2}
            maxLength={MAX_CHARS}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder={
              mode === "step" ? "Hỏi về cột mốc này..." : "Hỏi về workspace của bạn..."
            }
            className="w-full resize-none bg-transparent px-3 pt-2.5 pb-8 text-xs text-slate-800 placeholder-slate-400 outline-none disabled:opacity-60 leading-relaxed"
          />
          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
            <span
              className={`text-[8px] font-bold ${
                charsLeft < 100 ? "text-rose-500" : "text-slate-400"
              }`}
            >
              {input.length}/{MAX_CHARS}
            </span>
            <button
              type="button"
              disabled={!input.trim() || loading}
              onClick={() => void sendQuestion(input)}
              className="flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 px-2.5 py-1.5 text-[9px] font-bold text-white shadow-sm shadow-violet-600/20 disabled:cursor-not-allowed disabled:opacity-40 transition-all"
            >
              <Send className="h-2.5 w-2.5" />
              Gửi
            </button>
          </div>
        </div>
        <p className="mt-1 text-[8px] text-slate-400 text-center">
          Enter để gửi · Shift+Enter để xuống dòng
        </p>
      </div>
    </div>
  );
}

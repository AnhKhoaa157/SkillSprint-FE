import React, { useState } from "react";
import {
  ChevronDown,
  Pencil,
  Trash2,
  Plus,
  Check,
  X,
  Loader2,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import learningStructureService, {
  type ChapterResponse,
  type TopicResponse,
} from "../../../api/learningStructureService";

// ─── Props ────────────────────────────────────────────────────────────────────

interface LearningStructureDisplayProps {
  chapters: ChapterResponse[];
  workspaceId: string;
  /** "REVIEW_REQUIRED" | "CONFIRMED" — controls edit visibility and confirm button */
  structureStatus?: string;
  /** Called after any mutation so the parent can refetch the structure */
  onStructureUpdate?: () => void;
  /** Triggers the confirm flow owned by the parent (WorkspaceDetail) */
  onConfirmStructure?: () => void;
  isConfirming?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function topicKey(chapterId: string, topicId: string) {
  return `${chapterId}::${topicId}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

const LearningStructureDisplay: React.FC<LearningStructureDisplayProps> = ({
  chapters,
  workspaceId,
  structureStatus = "",
  onStructureUpdate,
  onConfirmStructure,
  isConfirming = false,
}) => {
  // ── Accordion ──────────────────────────────────────────────────────────────
  const [openChapterIdx, setOpenChapterIdx] = useState<number | null>(0);

  // ── Chapter edit ───────────────────────────────────────────────────────────
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [chapterEditValue, setChapterEditValue] = useState("");
  const [savingChapterId, setSavingChapterId] = useState<string | null>(null);

  // ── Topic edit ─────────────────────────────────────────────────────────────
  const [editingTopicKey, setEditingTopicKey] = useState<string | null>(null);
  const [topicEditValue, setTopicEditValue] = useState("");
  const [savingTopicKey, setSavingTopicKey] = useState<string | null>(null);

  // ── Topic delete ───────────────────────────────────────────────────────────
  const [deletingTopicKey, setDeletingTopicKey] = useState<string | null>(null);

  // ── Add topic ──────────────────────────────────────────────────────────────
  const [addingTopicChapterId, setAddingTopicChapterId] = useState<string | null>(null);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [submittingTopic, setSubmittingTopic] = useState(false);

  const normalizedStatus = String(structureStatus).toUpperCase();
  const isConfirmed = normalizedStatus === "CONFIRMED";
  const isReviewRequired = normalizedStatus === "REVIEW_REQUIRED";
  const editable = !isConfirmed;

  // ── Chapter handlers ───────────────────────────────────────────────────────

  function startEditChapter(chapter: ChapterResponse) {
    setEditingChapterId(chapter.chapterId);
    setChapterEditValue(chapter.title ?? "");
  }

  function cancelEditChapter() {
    setEditingChapterId(null);
    setChapterEditValue("");
  }

  async function saveChapter(chapterId: string) {
    const trimmed = chapterEditValue.trim();
    if (!trimmed) return;
    setSavingChapterId(chapterId);
    try {
      await learningStructureService.updateChapter(workspaceId, chapterId, {
        title: trimmed,
      });
      toast.success("Tên chương đã được cập nhật");
      cancelEditChapter();
      onStructureUpdate?.();
    } catch {
      toast.error("Không thể cập nhật chương. Vui lòng thử lại.");
    } finally {
      setSavingChapterId(null);
    }
  }

  // ── Topic handlers ─────────────────────────────────────────────────────────

  function startEditTopic(chapterId: string, topic: TopicResponse) {
    setEditingTopicKey(topicKey(chapterId, topic.topicId));
    setTopicEditValue(topic.title ?? "");
  }

  function cancelEditTopic() {
    setEditingTopicKey(null);
    setTopicEditValue("");
  }

  async function saveTopic(chapterId: string, topicId: string) {
    const trimmed = topicEditValue.trim();
    if (!trimmed) return;
    const key = topicKey(chapterId, topicId);
    setSavingTopicKey(key);
    try {
      await learningStructureService.updateTopic(workspaceId, chapterId, topicId, {
        title: trimmed,
      });
      toast.success("Tên mục đã được cập nhật");
      cancelEditTopic();
      onStructureUpdate?.();
    } catch {
      toast.error("Không thể cập nhật mục. Vui lòng thử lại.");
    } finally {
      setSavingTopicKey(null);
    }
  }

  async function handleDeleteTopic(
    chapterId: string,
    topicId: string,
    topicTitle: string,
  ) {
    if (!window.confirm(`Bạn có chắc muốn xóa mục "${topicTitle}"?`)) return;
    const key = topicKey(chapterId, topicId);
    setDeletingTopicKey(key);
    try {
      await learningStructureService.deleteTopic(workspaceId, chapterId, topicId);
      toast.success("Đã xóa mục thành công");
      onStructureUpdate?.();
    } catch {
      toast.error("Không thể xóa mục. Vui lòng thử lại.");
    } finally {
      setDeletingTopicKey(null);
    }
  }

  // ── Add-topic handlers ─────────────────────────────────────────────────────

  function startAddTopic(chapterId: string) {
    setAddingTopicChapterId(chapterId);
    setNewTopicTitle("");
  }

  function cancelAddTopic() {
    setAddingTopicChapterId(null);
    setNewTopicTitle("");
  }

  async function submitAddTopic(chapterId: string) {
    const trimmed = newTopicTitle.trim();
    if (!trimmed) return;
    setSubmittingTopic(true);
    try {
      await learningStructureService.addTopic(workspaceId, chapterId, {
        title: trimmed,
      });
      toast.success("Đã thêm mục mới");
      cancelAddTopic();
      onStructureUpdate?.();
    } catch {
      toast.error("Không thể thêm mục. Vui lòng thử lại.");
    } finally {
      setSubmittingTopic(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">

      {/* ── Status Badge ── */}
      {structureStatus && (
        <div className="flex items-center gap-2">
          {isConfirmed ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Đã xác nhận
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              Chờ xem xét — bạn có thể chỉnh sửa trước khi xác nhận
            </span>
          )}
        </div>
      )}

      {/* ── Chapter List ── */}
      {chapters.map((chapter, chapterIdx) => {
        const cId = chapter.chapterId;
        const isOpen = openChapterIdx === chapterIdx;
        const isEditingThisChapter = editingChapterId === cId;
        const isSavingThisChapter = savingChapterId === cId;

        return (
          <div
            key={cId ?? chapterIdx}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-colors hover:border-orange-200"
          >
            {/* ── Chapter Header ── */}
            <div className="flex items-center gap-2 px-4 py-3">
              {isEditingThisChapter ? (
                /* Inline edit mode */
                <div className="flex flex-1 items-center gap-2">
                  <input
                    autoFocus
                    value={chapterEditValue}
                    onChange={(e) => setChapterEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void saveChapter(cId);
                      if (e.key === "Escape") cancelEditChapter();
                    }}
                    className="flex-1 rounded-lg border border-orange-300 bg-orange-50 px-3 py-1.5 text-sm font-semibold text-gray-800 outline-none ring-2 ring-orange-200 focus:ring-orange-400"
                  />
                  <button
                    onClick={() => void saveChapter(cId)}
                    disabled={isSavingThisChapter || !chapterEditValue.trim()}
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white transition hover:bg-emerald-600 disabled:opacity-50"
                    title="Lưu"
                  >
                    {isSavingThisChapter ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    onClick={cancelEditChapter}
                    disabled={isSavingThisChapter}
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
                    title="Hủy"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                /* Display mode */
                <>
                  <button
                    className="flex flex-1 items-center gap-2 text-left"
                    onClick={() => setOpenChapterIdx(isOpen ? null : chapterIdx)}
                  >
                    <span className="text-base font-semibold text-orange-700">
                      Chương {chapterIdx + 1}: {chapter.title}
                    </span>
                  </button>

                  {/* Pencil — only while editable and chapter has an ID */}
                  {editable && cId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditChapter(chapter);
                      }}
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-orange-50 hover:text-orange-600"
                      title="Chỉnh sửa tên chương"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => setOpenChapterIdx(isOpen ? null : chapterIdx)}
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-50"
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </>
              )}
            </div>

            {/* ── Chapter Body ── */}
            {isOpen && !isEditingThisChapter && (
              <div className="border-t border-slate-100 px-4 pb-4 pt-3">
                {chapter.summary && (
                  <p className="mb-3 text-sm text-slate-600">{chapter.summary}</p>
                )}

                {Array.isArray(chapter.keyConcepts) &&
                  chapter.keyConcepts.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {chapter.keyConcepts.map((kc, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-700 ring-1 ring-orange-100"
                        >
                          {kc}
                        </span>
                      ))}
                    </div>
                  )}

                {/* ── Topic List ── */}
                {Array.isArray(chapter.topics) && chapter.topics.length > 0 && (
                  <div className="ml-1 mt-1 space-y-2">
                    {chapter.topics.map((topic, topicIdx) => {
                      const tId = topic.topicId;
                      const tKey = topicKey(cId ?? "", tId);
                      const isEditingThisTopic = editingTopicKey === tKey;
                      const isSavingThisTopic = savingTopicKey === tKey;
                      const isDeletingThisTopic = deletingTopicKey === tKey;

                      return (
                        <div
                          key={tId ?? topicIdx}
                          className="flex items-start gap-2 rounded-lg border-l-2 border-orange-200 bg-slate-50/60 px-3 py-2"
                        >
                          {isEditingThisTopic ? (
                            /* Inline topic edit */
                            <div className="flex flex-1 items-center gap-2">
                              <input
                                autoFocus
                                value={topicEditValue}
                                onChange={(e) => setTopicEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    void saveTopic(cId ?? "", tId);
                                  if (e.key === "Escape") cancelEditTopic();
                                }}
                                className="flex-1 rounded-md border border-orange-300 bg-white px-2 py-1 text-sm text-gray-800 outline-none ring-1 ring-orange-200 focus:ring-orange-400"
                              />
                              <button
                                onClick={() => void saveTopic(cId ?? "", tId)}
                                disabled={
                                  isSavingThisTopic || !topicEditValue.trim()
                                }
                                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-emerald-500 text-white transition hover:bg-emerald-600 disabled:opacity-50"
                                title="Lưu"
                              >
                                {isSavingThisTopic ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )}
                              </button>
                              <button
                                onClick={cancelEditTopic}
                                disabled={isSavingThisTopic}
                                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
                                title="Hủy"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            /* Topic display row */
                            <>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800">
                                  {chapterIdx + 1}.{topicIdx + 1}&nbsp;{topic.title}
                                </p>
                                {topic.summaryContent && (
                                  <p className="mt-0.5 text-xs text-slate-500">
                                    {topic.summaryContent}
                                  </p>
                                )}
                                {Array.isArray(topic.keyConcepts) &&
                                  topic.keyConcepts.length > 0 && (
                                    <div className="mt-1.5 flex flex-wrap gap-1">
                                      {topic.keyConcepts.map((kc, i) => (
                                        <span
                                          key={i}
                                          className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600"
                                        >
                                          {kc}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                              </div>

                              {/* Topic action buttons — only when editable and IDs are present */}
                              {editable && cId && tId && (
                                <div className="flex flex-shrink-0 items-center gap-1">
                                  <button
                                    onClick={() => startEditTopic(cId, topic)}
                                    className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-orange-50 hover:text-orange-600"
                                    title="Chỉnh sửa mục"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      void handleDeleteTopic(
                                        cId,
                                        tId,
                                        topic.title ?? "mục này",
                                      )
                                    }
                                    disabled={isDeletingThisTopic}
                                    className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                                    title="Xóa mục"
                                  >
                                    {isDeletingThisTopic ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-3 w-3" />
                                    )}
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── Add Topic Row ── */}
                {editable && cId && (
                  <div className="ml-1 mt-3">
                    {addingTopicChapterId === cId ? (
                      <div className="flex items-center gap-2 rounded-lg border border-dashed border-orange-300 bg-orange-50/40 px-3 py-2">
                        <input
                          autoFocus
                          placeholder="Tên mục mới..."
                          value={newTopicTitle}
                          onChange={(e) => setNewTopicTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") void submitAddTopic(cId);
                            if (e.key === "Escape") cancelAddTopic();
                          }}
                          className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-slate-400"
                        />
                        <button
                          onClick={() => void submitAddTopic(cId)}
                          disabled={submittingTopic || !newTopicTitle.trim()}
                          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-orange-500 text-white transition hover:bg-orange-600 disabled:opacity-50"
                          title="Thêm"
                        >
                          {submittingTopic ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                        </button>
                        <button
                          onClick={cancelAddTopic}
                          disabled={submittingTopic}
                          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
                          title="Hủy"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startAddTopic(cId)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Thêm mục
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* ── Bottom Confirm Button ── */}
      {isReviewRequired && onConfirmStructure && (
        <div className="mt-2 flex justify-end border-t border-slate-100 pt-4">
          <button
            onClick={onConfirmStructure}
            disabled={isConfirming}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isConfirming ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang lưu cấu trúc...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Xác nhận cấu trúc học tập
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default LearningStructureDisplay;

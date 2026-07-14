import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { AlertTriangle, ArrowLeft, CheckCircle2, ChevronLeft, CircleAlert, Clock3, LoaderCircle, PackagePlus, Send, Trophy } from "lucide-react";
import { toast } from "sonner";
import { marketplaceService, type CreatorMarketplaceItem, type CreatorValidationResult, type MarketplaceQuestion } from "../../../api/marketplace";
import workspaceService, { type WorkspaceResponse } from "../../../api/utilities/workspaceService";
import roadmapService from "../../../api/learning/roadmapService";
import quizService from "../../../api/learning/quizService";
import { useAuth } from "../../contexts/AuthContext";
import { isAdminRole } from "../../../api/auth/authService";
import { useSubscription } from "../../../hooks/useSubscription";

type ValidationDraft = { workspaceId: string; questions: MarketplaceQuestion[] };
const draftKey = (itemId: string) => `skillsprint.creator-pack.validation.${itemId}`;
const workspaceKey = (itemId: string) => `skillsprint.creator-pack.workspace.${itemId}`;
const scoreOf = (item: CreatorMarketplaceItem) => item.creatorValidationScore ?? item.validationScore ?? 0;
const errorText = (error: unknown) => error instanceof Error ? error.message : "Đã có lỗi xảy ra. Vui lòng thử lại.";
const date = (value?: string | null) => value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";

function CreatorShell({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const { rawPlanType } = useSubscription();
  const [autofillReady, setAutofillReady] = useState(false);
  const [exitConfirmationOpen, setExitConfirmationOpen] = useState(false);
  const navigate = useNavigate();
  const isAdminTestPlan = rawPlanType?.toUpperCase() === "ADMIN_DEFAULT" || rawPlanType?.toUpperCase() === "ADMIN";
  useEffect(() => {
    const ready = () => setAutofillReady(true);
    const clear = () => setAutofillReady(false);
    const requestExit = () => setExitConfirmationOpen(true);
    window.addEventListener("skillsprint:creator-validation-autofill-ready", ready);
    window.addEventListener("skillsprint:creator-validation-autofill-clear", clear);
    window.addEventListener("skillsprint:creator-validation-exit-confirm", requestExit);
    return () => {
      window.removeEventListener("skillsprint:creator-validation-autofill-ready", ready);
      window.removeEventListener("skillsprint:creator-validation-autofill-clear", clear);
      window.removeEventListener("skillsprint:creator-validation-exit-confirm", requestExit);
    };
  }, []);
  return <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-10"><div className="mx-auto max-w-6xl">{children}</div>{(isAdminRole(session?.role) || isAdminTestPlan) && <button type="button" disabled={!autofillReady} title={autofillReady ? "Điền toàn bộ đáp án đúng" : "Backend chưa trả đáp án đúng cho tài khoản test"} onClick={() => window.dispatchEvent(new Event("skillsprint:creator-validation-autofill"))} className="fixed bottom-5 right-5 z-40 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-xl hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45">Điền đáp án đúng (test)</button>}{exitConfirmationOpen && <Confirm title="Thoát Full Pack Validation?" text="Câu trả lời hiện tại sẽ chưa được nộp. Bạn vẫn có thể quay lại làm tiếp sau." onClose={() => setExitConfirmationOpen(false)} onConfirm={() => navigate("/creator/marketplace")} />}</main>;
}

function Skeleton() { return <div className="grid gap-4 md:grid-cols-2">{[1, 2, 3, 4].map(key => <div key={key} className="h-52 animate-pulse rounded-3xl bg-slate-200" />)}</div>; }
function Empty({ children }: { children: React.ReactNode }) { return <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-sm text-slate-500">{children}</div>; }
function Button({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) { return <button {...props} className={`inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF6B00] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#e85f00] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}>{children}</button>; }
function Confirm({ title, text, onClose, onConfirm, busy }: { title: string; text: string; onClose: () => void; onConfirm: () => void; busy?: boolean }) { return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><h2 className="text-lg font-black">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p><div className="mt-6 flex justify-end gap-3"><button onClick={onClose} disabled={busy} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold">Hủy</button><Button onClick={onConfirm} disabled={busy}>{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Xác nhận"}</Button></div></div></div>; }

function statusMeta(status: string) {
  if (status === "PUBLISHED") return { label: "Đã xuất bản", className: "bg-emerald-50 text-emerald-700" };
  if (status === "PENDING_REVIEW") return { label: "Đang chờ Admin duyệt", className: "bg-amber-50 text-amber-800" };
  if (status === "REJECTED") return { label: "Bị từ chối", className: "bg-rose-50 text-rose-700" };
  if (status === "SUSPENDED") return { label: "Đã tạm ngưng", className: "bg-slate-200 text-slate-700" };
  return { label: "Bản nháp", className: "bg-orange-50 text-[#FF6B00]" };
}

export function CreatorQuizPackDashboard() {
  const [items, setItems] = useState<CreatorMarketplaceItem[]>([]); const [loading, setLoading] = useState(true); const [failed, setFailed] = useState(false); const [reviewItem, setReviewItem] = useState<CreatorMarketplaceItem | null>(null); const [sending, setSending] = useState(false);
  const load = useCallback(async () => { setLoading(true); setFailed(false); try { setItems(await marketplaceService.getMine()); } catch { setFailed(true); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const submitReview = async () => { if (!reviewItem) return; setSending(true); try { await marketplaceService.submitForReview(reviewItem.itemId); toast.success("Đã gửi Quiz Pack chờ duyệt."); setReviewItem(null); await load(); } catch (error) { toast.error(errorText(error)); } finally { setSending(false); } };
  return <CreatorShell><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#FF6B00]">Creator studio</p><h1 className="mt-1 text-3xl font-black">Quiz Pack của tôi</h1><p className="mt-2 text-sm text-slate-500">Đóng gói roadmap và các quiz active từ workspace của bạn.</p></div><Link to="/creator/marketplace/create"><Button><PackagePlus className="h-4 w-4" />Tạo Quiz Pack</Button></Link></div><section className="mt-8">{loading ? <Skeleton /> : failed ? <Empty><p className="font-bold text-slate-800">Không thể tải Quiz Pack.</p><button onClick={load} className="mt-4 font-bold text-[#FF6B00]">Thử lại</button></Empty> : items.length === 0 ? <Empty><PackagePlus className="mx-auto h-8 w-8 text-[#FF6B00]" /><p className="mt-4 font-bold text-slate-900">Chưa có Quiz Pack</p><p className="mt-1">Tạo Pack đầu tiên từ workspace có roadmap và quiz active.</p></Empty> : <div className="grid gap-4 lg:grid-cols-2">{items.map(item => { const score = scoreOf(item); const meta = statusMeta(item.status); return <article key={item.itemId} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-start justify-between gap-3"><div><span className={`rounded-full px-3 py-1 text-xs font-bold ${meta.className}`}>{meta.label}</span><h2 className="mt-4 text-xl font-black">{item.title}</h2><p className="mt-1 text-sm text-slate-500">{item.subject}</p></div><span className="font-black text-[#FF6B00]">{item.priceCoins} Coin</span></div><div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-3 text-center text-sm"><div><b>{item.chapterCount}</b><p className="mt-1 text-xs text-slate-500">chương</p></div><div><b>{item.quizCount}</b><p className="mt-1 text-xs text-slate-500">quiz</p></div><div><b>{item.questionCount}</b><p className="mt-1 text-xs text-slate-500">câu hỏi</p></div></div><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-slate-500">Validation</dt><dd className="font-bold">{score || "Chưa làm"}</dd></div><div><dt className="text-slate-500">Ngày tạo</dt><dd className="font-semibold">{date(item.createdAt)}</dd></div><div className="col-span-2"><dt className="text-slate-500">Ngày xuất bản</dt><dd>{date(item.publishedAt)}</dd></div></dl>{item.status === "REJECTED" && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"><AlertTriangle className="mr-2 inline h-4 w-4" />{item.reviewNote || "Admin chưa để lại ghi chú."}</div>}{item.status === "SUSPENDED" && <div className="mt-4 rounded-xl border border-slate-300 bg-slate-100 p-3 text-sm text-slate-700">{item.reviewNote || "Quiz Pack hiện đang bị tạm ngưng."}</div>}{item.status === "DRAFT" && <div className="mt-5 flex flex-wrap gap-2"><Link to={`/creator/marketplace/${item.itemId}/validation`}><button className="rounded-xl border border-orange-200 px-3 py-2 text-sm font-bold text-[#FF6B00]">Làm Validation</button></Link><Button disabled={score < 90} onClick={() => setReviewItem(item)}>Gửi duyệt</Button></div>}{item.status === "PENDING_REVIEW" && <p className="mt-5 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-900">Đang chờ Admin duyệt</p>}</article>; })}</div>}</section>{reviewItem && <Confirm title="Gửi Admin duyệt" text="Sau khi gửi duyệt, Quiz Pack sẽ ở trạng thái chờ Admin kiểm tra." busy={sending} onClose={() => setReviewItem(null)} onConfirm={submitReview} />}</CreatorShell>;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) { return <label className="block text-sm font-bold text-slate-700"><span>{label}</span>{children}{error && <span className="mt-1 block text-xs font-medium text-rose-600">{error}</span>}</label>; }

export function CreatorQuizPackCreate() {
  const navigate = useNavigate(); const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([]); const [loading, setLoading] = useState(true); const [form, setForm] = useState({ workspaceId: "", title: "", description: "", subject: "", priceCoins: "" }); const [errors, setErrors] = useState<Record<string, string>>({}); const [saving, setSaving] = useState(false);
  useEffect(() => { workspaceService.getMyWorkspaces().then(setWorkspaces).catch(error => toast.error(errorText(error))).finally(() => setLoading(false)); }, []);
  const create = async (event: React.FormEvent) => { event.preventDefault(); const nextErrors: Record<string, string> = {}; const price = Number(form.priceCoins); if (!form.workspaceId) nextErrors.workspaceId = "Hãy chọn workspace."; if (!form.title.trim()) nextErrors.title = "Tiêu đề là bắt buộc."; else if (form.title.length > 500) nextErrors.title = "Tối đa 500 ký tự."; if (form.description.length > 5000) nextErrors.description = "Tối đa 5000 ký tự."; if (!form.subject.trim()) nextErrors.subject = "Môn học là bắt buộc."; else if (form.subject.length > 100) nextErrors.subject = "Tối đa 100 ký tự."; if (!Number.isInteger(price) || price < 0) nextErrors.priceCoins = "Nhập số nguyên lớn hơn hoặc bằng 0."; setErrors(nextErrors); if (Object.keys(nextErrors).length) return; setSaving(true); try { const item = await marketplaceService.createItem({ ...form, title: form.title.trim(), subject: form.subject.trim(), description: form.description.trim() || null, priceCoins: price }); const draft = await buildDraft(form.workspaceId); persistDraft(item.itemId, draft); toast.success(`Đã tạo DRAFT: ${item.chapterCount} chương, ${item.quizCount} quiz, ${item.questionCount} câu hỏi.`); navigate(`/creator/marketplace/${item.itemId}/validation`, { state: { draft } }); } catch (error) { toast.error(errorText(error)); } finally { setSaving(false); } };
  const input = "mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal outline-none focus:border-[#FF6B00]";
  return <CreatorShell><Link to="/creator/marketplace" className="inline-flex items-center gap-1 text-sm font-bold text-[#FF6B00]"><ArrowLeft className="h-4 w-4" />Quiz Pack của tôi</Link><h1 className="mt-5 text-3xl font-black">Tạo Quiz Pack</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">SkillSprint sẽ tự đóng gói toàn bộ roadmap và các quiz đang active trong workspace. Bạn không cần, và không thể, chọn từng chương hoặc quiz.</p><form onSubmit={create} className="mt-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="grid gap-5 md:grid-cols-2"><Field label="Workspace" error={errors.workspaceId}><select value={form.workspaceId} onChange={e => setForm(current => ({ ...current, workspaceId: e.target.value }))} disabled={loading} className={input} required><option value="">{loading ? "Đang tải workspace..." : "Chọn workspace"}</option>{workspaces.map(workspace => <option key={workspace.workspaceId} value={workspace.workspaceId}>{workspace.name}</option>)}</select></Field><Field label="Môn học" error={errors.subject}><input value={form.subject} maxLength={100} onChange={e => setForm(current => ({ ...current, subject: e.target.value }))} className={input} required /></Field><Field label="Tiêu đề" error={errors.title}><input value={form.title} maxLength={500} onChange={e => setForm(current => ({ ...current, title: e.target.value }))} className={input} required /></Field><Field label="Giá Coin" error={errors.priceCoins}><input type="number" min="0" step="1" value={form.priceCoins} onChange={e => setForm(current => ({ ...current, priceCoins: e.target.value }))} className={input} required /></Field><div className="md:col-span-2"><Field label="Mô tả (không bắt buộc)" error={errors.description}><textarea value={form.description} maxLength={5000} onChange={e => setForm(current => ({ ...current, description: e.target.value }))} className="mt-2 min-h-32 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal outline-none focus:border-[#FF6B00]" /></Field></div></div><div className="mt-6 flex justify-end"><Button type="submit" disabled={saving}>{saving && <LoaderCircle className="h-4 w-4 animate-spin" />}Tạo Quiz Pack</Button></div></form></CreatorShell>;
}

async function buildDraft(workspaceId: string): Promise<ValidationDraft> { const roadmap = await roadmapService.getMyRoadmap(workspaceId); if (!roadmap?.steps.length) throw new Error("Không tìm thấy roadmap để tải dữ liệu Validation."); const quizzes = await Promise.all(roadmap.steps.map(step => quizService.getCurrent(step.stepId))); const questions = quizzes.flatMap(quiz => quiz?.questions.map(question => ({ questionId: question.questionId, question: question.question, options: question.options.map(option => ({ optionId: option.optionId, text: option.text, correct: option.correct ?? null })) })) ?? []); if (!questions.length) throw new Error("Không tìm thấy quiz active trong roadmap."); return { workspaceId, questions }; }
function persistDraft(itemId: string, draft: ValidationDraft) { try { sessionStorage.setItem(draftKey(itemId), JSON.stringify(draft)); } catch { /* best-effort session persistence */ } try { localStorage.setItem(workspaceKey(itemId), draft.workspaceId); } catch { /* best-effort workspace recovery */ } }
function restoreDraft(itemId: string): ValidationDraft | null { try { const raw = sessionStorage.getItem(draftKey(itemId)); if (raw) return JSON.parse(raw) as ValidationDraft; const workspaceId = localStorage.getItem(workspaceKey(itemId)); return workspaceId ? { workspaceId, questions: [] } : null; } catch { return null; } }

export function CreatorQuizPackValidation() {
  const { itemId = "" } = useParams(); const location = useLocation(); const navigate = useNavigate(); const [draft, setDraft] = useState<ValidationDraft | null>(() => (location.state as { draft?: ValidationDraft } | null)?.draft ?? restoreDraft(itemId)); const [loading, setLoading] = useState(!draft); const [loadFailed, setLoadFailed] = useState(false); const [answers, setAnswers] = useState<Record<string, string>>({}); const [index, setIndex] = useState(0); const [startedAt, setStartedAt] = useState(Date.now()); const [elapsed, setElapsed] = useState(0); const [confirm, setConfirm] = useState(false); const [submitting, setSubmitting] = useState(false); const [result, setResult] = useState<CreatorValidationResult | null>(null); const [reviewConfirm, setReviewConfirm] = useState(false); const [reviewing, setReviewing] = useState(false);
  const { rawPlanType } = useSubscription();
  const isAdminTestPlan = rawPlanType?.toUpperCase() === "ADMIN_DEFAULT" || rawPlanType?.toUpperCase() === "ADMIN";
  useEffect(() => { if (draft) { persistDraft(itemId, draft); setLoading(false); return; } const workspaceId = (location.state as { workspaceId?: string } | null)?.workspaceId; if (!workspaceId) { setLoadFailed(true); setLoading(false); return; } buildDraft(workspaceId).then(next => { setDraft(next); persistDraft(itemId, next); }).catch(() => setLoadFailed(true)).finally(() => setLoading(false)); }, [draft, itemId, location.state]);
  useEffect(() => {
    if (!draft || draft.questions.length > 0) return;
    setLoading(true);
    setLoadFailed(false);
    void buildDraft(draft.workspaceId).then(next => {
      setDraft(next);
      persistDraft(itemId, next);
    }).catch(() => setLoadFailed(true)).finally(() => setLoading(false));
  }, [draft?.workspaceId, draft?.questions.length, itemId]);
  useEffect(() => {
    if (!draft || !isAdminTestPlan) return;
    void buildDraft(draft.workspaceId).then(refreshed => {
      const hasAllCorrectFlags = refreshed.questions.length > 0 && refreshed.questions.every(question => question.options.some(option => option.correct === true));
      if (hasAllCorrectFlags) {
        setDraft(refreshed);
        persistDraft(itemId, refreshed);
      }
    }).catch(() => { /* the existing draft remains usable for normal validation */ });
  }, [draft?.workspaceId, isAdminTestPlan, itemId]);
  useEffect(() => { if (result) return; const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000); return () => clearInterval(timer); }, [result, startedAt]);
  useEffect(() => {
    const confirmExit = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest('a[href="/creator/marketplace"]');
      if (!link) return;
      event.preventDefault();
      event.stopPropagation();
      window.dispatchEvent(new Event("skillsprint:creator-validation-exit-confirm"));
    };
    document.addEventListener("click", confirmExit, true);
    return () => document.removeEventListener("click", confirmExit, true);
  }, [navigate]);
  const questions = draft?.questions ?? []; const current = questions[index]; const complete = questions.length > 0 && questions.every(question => answers[question.questionId]);
  useEffect(() => {
    const isReady = questions.length > 0 && questions.every(question => question.options.some(option => option.correct === true));
    window.dispatchEvent(new Event(isReady ? "skillsprint:creator-validation-autofill-ready" : "skillsprint:creator-validation-autofill-clear"));
    return () => { window.dispatchEvent(new Event("skillsprint:creator-validation-autofill-clear")); };
  }, [questions]);
  useEffect(() => {
    const autofill = () => {
      const filled = Object.fromEntries(questions.map(question => [question.questionId, question.options.find(option => option.correct === true)?.optionId]));
      if (Object.values(filled).every(Boolean)) {
        setAnswers(filled as Record<string, string>);
        setIndex(Math.max(0, questions.length - 1));
        toast.message("Đã điền toàn bộ đáp án đúng cho tài khoản test Admin.");
      }
    };
    window.addEventListener("skillsprint:creator-validation-autofill", autofill);
    return () => window.removeEventListener("skillsprint:creator-validation-autofill", autofill);
  }, [questions]);
  const submit = async () => { if (!complete) return; setSubmitting(true); try { const next = await marketplaceService.validateCreator(itemId, { answers: questions.map(question => ({ questionId: question.questionId, selectedOptionId: answers[question.questionId] })), durationSeconds: elapsed }); setResult(next); setConfirm(false); } catch (error) { toast.error(errorText(error)); } finally { setSubmitting(false); } };
  const retry = () => { setAnswers({}); setIndex(0); setElapsed(0); setStartedAt(Date.now()); setResult(null); };
  const sendReview = async () => { setReviewing(true); try { await marketplaceService.submitForReview(itemId); toast.success("Đã gửi Quiz Pack chờ duyệt."); navigate("/creator/marketplace"); } catch (error) { toast.error(errorText(error)); } finally { setReviewing(false); } };
  if (loading) return <CreatorShell><Skeleton /></CreatorShell>; if (loadFailed || !draft) return <CreatorShell><div className="rounded-3xl border border-amber-200 bg-amber-50 p-7"><CircleAlert className="h-7 w-7 text-amber-700" /><h1 className="mt-3 text-xl font-black">Không thể tải dữ liệu Validation</h1><p className="mt-2 text-sm leading-6 text-amber-950">Vui lòng quay lại Workspace để mở lại nội dung Quiz Pack.</p><Link to="/creator/marketplace" className="mt-5 inline-flex font-bold text-[#FF6B00]">Quay lại Quiz Pack của tôi</Link></div></CreatorShell>;
  if (result) { const passed = result.score >= 90; return <CreatorShell><div className={`mx-auto max-w-xl rounded-3xl border p-7 text-center ${passed ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}><CheckCircle2 className={`mx-auto h-10 w-10 ${passed ? "text-emerald-600" : "text-rose-600"}`} /><h1 className="mt-4 text-2xl font-black">{passed ? "Validation đạt yêu cầu" : "Validation chưa đạt"}</h1><p className="mt-2 text-sm text-slate-600">Hoàn thành {date(result.completedAt)}</p><div className="mt-6 grid grid-cols-2 gap-3 text-left sm:grid-cols-4">{[["Điểm", result.score], ["Đúng", `${result.correctCount}/${result.questionCount}`], ["Câu hỏi", result.questionCount], ["Thời gian", `${result.durationSeconds}s`]].map(([label, value]) => <div key={String(label)} className="rounded-xl bg-white p-3"><p className="text-xs text-slate-500">{label}</p><p className="font-black">{value}</p></div>)}</div><div className="mt-6 flex flex-wrap justify-center gap-3">{passed ? <Button onClick={() => setReviewConfirm(true)}><Send className="h-4 w-4" />Gửi Admin duyệt</Button> : <Button onClick={retry}>Làm lại Validation</Button>}</div></div>{reviewConfirm && <Confirm title="Gửi Admin duyệt" text="Sau khi gửi duyệt, Quiz Pack sẽ ở trạng thái chờ Admin kiểm tra." busy={reviewing} onClose={() => setReviewConfirm(false)} onConfirm={sendReview} />}</CreatorShell>; }
  return <CreatorShell><Link to="/creator/marketplace" className="inline-flex items-center gap-1 text-sm font-bold text-[#FF6B00]"><ChevronLeft className="h-4 w-4" />Quiz Pack của tôi</Link><div className="mt-5 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl font-black">Full Pack Validation</h1><p className="mt-1 text-sm text-slate-500">Tiến độ {Object.keys(answers).length}/{questions.length} câu trả lời</p></div><span className="inline-flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-2 text-sm font-black text-[#FF6B00]"><Clock3 className="h-4 w-4" />{String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}</span></div><div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]"><section className="rounded-3xl border border-slate-200 bg-white p-6"><p className="text-sm font-bold text-[#FF6B00]">Câu {index + 1}/{questions.length}</p><h2 className="mt-3 text-xl font-black leading-8">{current.question}</h2><div className="mt-6 grid gap-3">{current.options.map(option => <label key={option.optionId} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm font-medium ${answers[current.questionId] === option.optionId ? "border-[#FF6B00] bg-orange-50" : "border-slate-200 hover:border-orange-200"}`}><input type="radio" name={current.questionId} checked={answers[current.questionId] === option.optionId} onChange={() => setAnswers(currentAnswers => ({ ...currentAnswers, [current.questionId]: option.optionId }))} className="accent-[#FF6B00]" />{option.text}</label>)}</div><div className="mt-7 flex justify-between"><button onClick={() => setIndex(value => Math.max(0, value - 1))} disabled={index === 0} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold disabled:opacity-40">Câu trước</button>{index < questions.length - 1 ? <button onClick={() => setIndex(value => Math.min(questions.length - 1, value + 1))} className="rounded-xl border border-orange-200 px-4 py-2 text-sm font-bold text-[#FF6B00]">Câu tiếp</button> : <Button onClick={() => setConfirm(true)} disabled={!complete}><Trophy className="h-4 w-4" />Nộp Validation</Button>}</div></section><aside className="rounded-3xl border border-slate-200 bg-white p-5"><h2 className="font-black">Câu hỏi</h2><div className="mt-4 grid grid-cols-5 gap-2">{questions.map((question, questionIndex) => <button key={question.questionId} onClick={() => setIndex(questionIndex)} className={`h-9 rounded-lg text-xs font-bold ${index === questionIndex ? "bg-[#FF6B00] text-white" : answers[question.questionId] ? "bg-orange-50 text-[#FF6B00]" : "bg-slate-100 text-slate-600"}`}>{questionIndex + 1}</button>)}</div><button onClick={() => setConfirm(true)} disabled={!complete} className="mt-6 w-full rounded-xl bg-[#FF6B00] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40">Nộp Validation</button></aside></div>{confirm && <Confirm title="Nộp Full Pack Validation" text="Bạn đã trả lời tất cả câu hỏi. Xác nhận gửi bài Validation?" busy={submitting} onClose={() => setConfirm(false)} onConfirm={submit} />}</CreatorShell>;
}

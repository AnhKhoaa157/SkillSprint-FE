import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { AlertTriangle, ArrowLeft, BookOpen, CheckCircle2, ChevronLeft, CircleAlert, ClipboardCheck, Clock3, Coins, FileQuestion, LoaderCircle, PackagePlus, RefreshCw, Send, Trophy } from "lucide-react";
import { toast } from "sonner";
import { marketplaceService, type CreatorMarketplaceItem, type CreatorValidationPackResponse, type CreatorValidationResult } from "../../../api/marketplace";
import workspaceService, { type WorkspaceResponse } from "../../../api/utilities/workspaceService";

type ValidationQuestion = {
  questionId: string;
  text: string;
  options: Array<{ optionId: string; text: string }>;
};

const scoreOf = (item: CreatorMarketplaceItem) => item.creatorValidationScore ?? item.validationScore ?? 0;
const errorText = (error: unknown) => error instanceof Error ? error.message : "Đã có lỗi xảy ra. Vui lòng thử lại.";
const date = (value?: string | null) => value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";

function CreatorShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [exitConfirmationOpen, setExitConfirmationOpen] = useState(false);

  useEffect(() => {
    const requestExit = () => setExitConfirmationOpen(true);
    window.addEventListener("skillsprint:creator-validation-exit-confirm", requestExit);
    return () => window.removeEventListener("skillsprint:creator-validation-exit-confirm", requestExit);
  }, []);

  return <main className="min-h-0 bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-10">
    <div className="mx-auto max-w-6xl">{children}</div>
    {exitConfirmationOpen && <Confirm title="Thoát Full Pack Validation?" text="Câu trả lời hiện tại sẽ chưa được nộp. Bạn vẫn có thể quay lại làm tiếp sau." onClose={() => setExitConfirmationOpen(false)} onConfirm={() => navigate("/app/creator/marketplace")} />}
  </main>;
}

function Skeleton() { return <div className="grid gap-4 md:grid-cols-2">{[1, 2, 3, 4].map(key => <div key={key} className="h-52 animate-pulse rounded-3xl bg-slate-200" />)}</div>; }
function Empty({ children }: { children: React.ReactNode }) { return <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-sm text-slate-500">{children}</div>; }
function Button({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) { return <button {...props} className={`inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF6B00] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#e85f00] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}>{children}</button>; }
function Confirm({ title, text, onClose, onConfirm, busy }: { title: string; text: string; onClose: () => void; onConfirm: () => void; busy?: boolean }) { return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><h2 className="text-lg font-black">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p><div className="mt-6 flex justify-end gap-3"><button onClick={onClose} disabled={busy} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold">Hủy</button><Button onClick={onConfirm} disabled={busy}>{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Xác nhận"}</Button></div></div></div>; }

function statusMeta(status: string) {
  if (status === "PUBLISHED") return { label: "Đã xuất bản", className: "bg-emerald-50 text-emerald-700" };
  if (status === "PENDING_REVIEW") return { label: "Đang chờ Admin duyệt", className: "bg-amber-50 text-amber-800" };
  if (status === "SUSPENDED") return { label: "Đã tạm ngừng", className: "bg-slate-200 text-slate-700" };
  return { label: "Bản nháp", className: "bg-orange-50 text-[#FF6B00]" };
}

function CreatorPackCard({ item, onSendReview, onRefreshSnapshot }: { item: CreatorMarketplaceItem; onSendReview: (item: CreatorMarketplaceItem) => void; onRefreshSnapshot: (item: CreatorMarketplaceItem) => void }) {
  const score = scoreOf(item);
  const status = statusMeta(item.status);
  const needsRevision = item.status === "DRAFT" && Boolean(item.reviewNote);

  return <article className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6">
    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#FF6B00] via-orange-400 to-amber-300" />
    <div className="flex items-start justify-between gap-4"><div className="min-w-0"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${status.className}`}>{needsRevision ? "Bản nháp — cần chỉnh sửa" : status.label}</span><p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{item.subject}</p><h2 className="mt-1 line-clamp-2 text-xl font-black leading-7 text-slate-900">{item.title}</h2></div><span className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-orange-50 px-3 py-2 text-sm font-black text-[#FF6B00]"><Coins className="h-4 w-4" />{item.priceCoins}</span></div>
    <p className="mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{item.description || "Chưa có mô tả cho Quiz Pack này."}</p>
    <div className="mt-5 grid grid-cols-3 divide-x divide-slate-200 rounded-2xl border border-slate-100 bg-slate-50 px-2 py-3 text-center"><div><p className="text-lg font-black text-slate-900">{item.chapterCount}</p><p className="text-xs text-slate-500">chương</p></div><div><p className="text-lg font-black text-slate-900">{item.quizCount}</p><p className="text-xs text-slate-500">quiz</p></div><div><p className="text-lg font-black text-slate-900">{item.questionCount}</p><p className="text-xs text-slate-500">câu hỏi</p></div></div>
    <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm"><div><p className="text-xs font-medium text-slate-500">Validation</p><p className="mt-1 inline-flex items-center gap-1 font-black text-slate-800"><ClipboardCheck className="h-4 w-4 text-[#FF6B00]" />{score ? `${score}/100` : "Cần thực hiện lại"}</p></div><p className="text-right text-xs leading-5 text-slate-500">Tạo lúc<br /><span className="font-semibold text-slate-700">{date(item.createdAt)}</span></p></div>
    {needsRevision && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-950"><AlertTriangle className="mr-2 inline h-4 w-4" /><b>Admin yêu cầu chỉnh sửa:</b> {item.reviewNote}</div>}
    {item.status === "SUSPENDED" && item.reviewNote && <div className="mt-4 rounded-2xl bg-slate-100 p-3 text-sm text-slate-700">{item.reviewNote}</div>}
    {item.status === "DRAFT" && <div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={() => onRefreshSnapshot(item)} className="inline-flex items-center gap-2 rounded-xl border border-orange-200 px-4 py-2.5 text-sm font-bold text-[#FF6B00] hover:bg-orange-50"><RefreshCw className="h-4 w-4" />Làm mới snapshot</button>{!needsRevision && <Link to={`/app/creator/marketplace/${item.itemId}/validation`} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"><ClipboardCheck className="h-4 w-4" />Làm Validation</Link>}<Button disabled={score < 90} onClick={() => onSendReview(item)}><Send className="h-4 w-4" />Gửi duyệt</Button></div>}
    {item.status === "PENDING_REVIEW" && <p className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">Admin đang kiểm tra Quiz Pack này.</p>}
    {item.status === "PUBLISHED" && <div className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-emerald-700"><BookOpen className="h-4 w-4" />Đang hiển thị trên Marketplace</div>}
  </article>;
}

export function CreatorQuizPackDashboard() {
  const navigate = useNavigate();
  const [items, setItems] = useState<CreatorMarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reviewItem, setReviewItem] = useState<CreatorMarketplaceItem | null>(null);
  const [refreshItem, setRefreshItem] = useState<CreatorMarketplaceItem | null>(null);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => { setLoading(true); setFailed(false); try { setItems(await marketplaceService.getMine()); } catch { setFailed(true); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const submitReview = async () => { if (!reviewItem) return; setSending(true); try { await marketplaceService.submitForReview(reviewItem.itemId); toast.success("Đã gửi Quiz Pack chờ duyệt."); setReviewItem(null); await load(); } catch (error) { toast.error(errorText(error)); } finally { setSending(false); } };
  const refreshSnapshot = async () => { if (!refreshItem) return; setRefreshing(true); try { const item = await marketplaceService.refreshCreatorSnapshot(refreshItem.itemId); toast.success("Đã làm mới snapshot. Hãy thực hiện Validation lại."); setRefreshItem(null); navigate(`/app/creator/marketplace/${item.itemId}/validation`); } catch (error) { toast.error(errorText(error)); } finally { setRefreshing(false); } };

  return <CreatorShell><section className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm"><div className="grid gap-6 bg-gradient-to-r from-orange-50 via-white to-amber-50 px-6 py-7 sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#FF6B00]">Creator studio</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Đóng gói Quiz từ workspace</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Mỗi Quiz Pack tự gom roadmap và các quiz đang active của một workspace. Hoàn tất Validation trước khi gửi Admin duyệt.</p></div><Link to="/app/creator/marketplace/create"><Button className="w-full sm:w-auto"><PackagePlus className="h-4 w-4" />Tạo Quiz Pack</Button></Link></div><div className="grid border-t border-orange-100 sm:grid-cols-3"><div className="flex items-center gap-3 px-6 py-4"><PackagePlus className="h-5 w-5 text-[#FF6B00]" /><p className="text-sm text-slate-600"><b className="text-slate-900">Chọn workspace</b><br />Một workspace cho mỗi pack</p></div><div className="flex items-center gap-3 border-t border-orange-100 px-6 py-4 sm:border-l sm:border-t-0"><FileQuestion className="h-5 w-5 text-[#FF6B00]" /><p className="text-sm text-slate-600"><b className="text-slate-900">Hệ thống đóng gói</b><br />Roadmap và quiz active</p></div><div className="flex items-center gap-3 border-t border-orange-100 px-6 py-4 sm:border-l sm:border-t-0"><ClipboardCheck className="h-5 w-5 text-[#FF6B00]" /><p className="text-sm text-slate-600"><b className="text-slate-900">Validation từ 90 điểm</b><br />Mới có thể gửi duyệt</p></div></div></section><section className="mt-8"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Thư viện Creator</p><h2 className="mt-1 text-2xl font-black">Quiz Pack của bạn</h2></div>{!loading && !failed && <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-600">{items.length} pack</span>}</div><div className="mt-5">{loading ? <Skeleton /> : failed ? <Empty><p className="font-bold text-slate-800">Không thể tải Quiz Pack.</p><button onClick={load} className="mt-4 font-bold text-[#FF6B00]">Thử lại</button></Empty> : items.length === 0 ? <Empty><PackagePlus className="mx-auto h-8 w-8 text-[#FF6B00]" /><p className="mt-4 font-bold text-slate-900">Chưa có Quiz Pack</p><p className="mt-1">Bắt đầu với một workspace đã có roadmap và quiz active.</p><Link to="/app/creator/marketplace/create" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#FF6B00] px-4 py-2.5 text-sm font-bold text-white"><PackagePlus className="h-4 w-4" />Tạo Quiz Pack</Link></Empty> : <div className="grid gap-5 xl:grid-cols-2">{items.map(item => <CreatorPackCard key={item.itemId} item={item} onSendReview={setReviewItem} onRefreshSnapshot={setRefreshItem} />)}</div>}</div></section>{reviewItem && <Confirm title="Gửi Admin duyệt" text="Sau khi gửi duyệt, Quiz Pack sẽ ở trạng thái chờ Admin kiểm tra." busy={sending} onClose={() => setReviewItem(null)} onConfirm={submitReview} />}{refreshItem && <Confirm title="Làm mới snapshot?" text="Nội dung Quiz Pack sẽ được đóng gói lại từ Workspace hiện tại. Bạn cần thực hiện Validation lại trước khi gửi duyệt." busy={refreshing} onClose={() => setRefreshItem(null)} onConfirm={refreshSnapshot} />}</CreatorShell>;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) { return <label className="block text-sm font-bold text-slate-700"><span>{label}</span>{children}{error && <span className="mt-1 block text-xs font-medium text-rose-600">{error}</span>}</label>; }

export function CreatorQuizPackCreate() {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ workspaceId: "", title: "", description: "", subject: "", priceCoins: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { workspaceService.getMyWorkspaces().then(setWorkspaces).catch(error => toast.error(errorText(error))).finally(() => setLoading(false)); }, []);
  const create = async (event: React.FormEvent) => { event.preventDefault(); const nextErrors: Record<string, string> = {}; const price = Number(form.priceCoins); if (!form.workspaceId) nextErrors.workspaceId = "Hãy chọn workspace."; if (!form.title.trim()) nextErrors.title = "Tiêu đề là bắt buộc."; else if (form.title.length > 500) nextErrors.title = "Tối đa 500 ký tự."; if (form.description.length > 5000) nextErrors.description = "Tối đa 5000 ký tự."; if (!form.subject.trim()) nextErrors.subject = "Môn học là bắt buộc."; else if (form.subject.length > 100) nextErrors.subject = "Tối đa 100 ký tự."; if (!Number.isInteger(price) || price < 0) nextErrors.priceCoins = "Nhập số nguyên lớn hơn hoặc bằng 0."; setErrors(nextErrors); if (Object.keys(nextErrors).length) return; setSaving(true); try { const item = await marketplaceService.createItem({ ...form, title: form.title.trim(), subject: form.subject.trim(), description: form.description.trim() || null, priceCoins: price }); toast.success(`Đã tạo DRAFT: ${item.chapterCount} chương, ${item.quizCount} quiz, ${item.questionCount} câu hỏi.`); navigate(`/app/creator/marketplace/${item.itemId}/validation`); } catch (error) { toast.error(errorText(error)); } finally { setSaving(false); } };
  const input = "mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal outline-none focus:border-[#FF6B00]";
  return <CreatorShell><Link to="/app/creator/marketplace" className="inline-flex items-center gap-1 text-sm font-bold text-[#FF6B00]"><ArrowLeft className="h-4 w-4" />Quiz Pack của tôi</Link><h1 className="mt-5 text-3xl font-black">Tạo Quiz Pack</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">SkillSprint sẽ tự đóng gói toàn bộ roadmap và các quiz đang active trong workspace. Bạn không cần, và không thể, chọn từng chương hoặc quiz.</p><form onSubmit={create} className="mt-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="grid gap-5 md:grid-cols-2"><Field label="Workspace" error={errors.workspaceId}><select value={form.workspaceId} onChange={event => setForm(current => ({ ...current, workspaceId: event.target.value }))} disabled={loading} className={input} required><option value="">{loading ? "Đang tải workspace..." : "Chọn workspace"}</option>{workspaces.map(workspace => <option key={workspace.workspaceId} value={workspace.workspaceId}>{workspace.name}</option>)}</select></Field><Field label="Môn học" error={errors.subject}><input value={form.subject} maxLength={100} onChange={event => setForm(current => ({ ...current, subject: event.target.value }))} className={input} required /></Field><Field label="Tiêu đề" error={errors.title}><input value={form.title} maxLength={500} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} className={input} required /></Field><Field label="Giá Coin" error={errors.priceCoins}><input type="number" min="0" step="1" value={form.priceCoins} onChange={event => setForm(current => ({ ...current, priceCoins: event.target.value }))} className={input} required /></Field><div className="md:col-span-2"><Field label="Mô tả (không bắt buộc)" error={errors.description}><textarea value={form.description} maxLength={5000} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} className="mt-2 min-h-32 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal outline-none focus:border-[#FF6B00]" /></Field></div></div><div className="mt-6 flex justify-end"><Button type="submit" disabled={saving}>{saving && <LoaderCircle className="h-4 w-4 animate-spin" />}Tạo Quiz Pack</Button></div></form></CreatorShell>;
}

function flattenSnapshot(snapshot: CreatorValidationPackResponse): ValidationQuestion[] {
  return snapshot.chapters.flatMap(chapter => chapter.questions.map(question => ({ questionId: question.questionId, text: question.text, options: question.options.map(option => ({ optionId: option.optionId, text: option.text })) })));
}

export function CreatorQuizPackValidation() {
  const { itemId = "" } = useParams();
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState<CreatorValidationPackResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CreatorValidationResult | null>(null);
  const [reviewConfirm, setReviewConfirm] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const loadSnapshot = useCallback(async () => { setLoading(true); setLoadFailed(false); try { setSnapshot(await marketplaceService.getCreatorValidationSnapshot(itemId)); } catch { setLoadFailed(true); } finally { setLoading(false); } }, [itemId]);
  useEffect(() => { void loadSnapshot(); }, [loadSnapshot]);
  const questions = useMemo(() => snapshot ? flattenSnapshot(snapshot) : [], [snapshot]);
  const current = questions[index];
  const complete = questions.length > 0 && questions.every(question => answers[question.questionId]);
  useEffect(() => { if (result) return; const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000); return () => clearInterval(timer); }, [result, startedAt]);
  useEffect(() => { const confirmExit = (event: MouseEvent) => { const target = event.target; if (!(target instanceof Element)) return; const link = target.closest('a[href="/app/creator/marketplace"]'); if (!link) return; event.preventDefault(); event.stopPropagation(); window.dispatchEvent(new Event("skillsprint:creator-validation-exit-confirm")); }; document.addEventListener("click", confirmExit, true); return () => document.removeEventListener("click", confirmExit, true); }, []);
  const submit = async () => { if (!complete) return; setSubmitting(true); try { const next = await marketplaceService.validateCreator(itemId, { answers: questions.map(question => ({ questionId: question.questionId, selectedOptionId: answers[question.questionId] })), durationSeconds: elapsed }); setResult(next); setConfirm(false); } catch (error) { toast.error(errorText(error)); } finally { setSubmitting(false); } };
  const retry = () => { setAnswers({}); setIndex(0); setElapsed(0); setStartedAt(Date.now()); setResult(null); };
  const sendReview = async () => { setReviewing(true); try { await marketplaceService.submitForReview(itemId); toast.success("Đã gửi Quiz Pack chờ duyệt."); navigate("/app/creator/marketplace"); } catch (error) { toast.error(errorText(error)); } finally { setReviewing(false); } };
  if (loading) return <CreatorShell><Skeleton /></CreatorShell>;
  if (loadFailed || !snapshot) return <CreatorShell><div className="rounded-3xl border border-amber-200 bg-amber-50 p-7"><CircleAlert className="h-7 w-7 text-amber-700" /><h1 className="mt-3 text-xl font-black">Không thể tải snapshot Validation</h1><p className="mt-2 text-sm leading-6 text-amber-950">Validation chỉ khả dụng với Quiz Pack bản nháp của bạn.</p><div className="mt-5 flex flex-wrap gap-4"><button onClick={loadSnapshot} className="font-bold text-[#FF6B00]">Thử lại</button><Link to="/app/creator/marketplace" className="font-bold text-[#FF6B00]">Quay lại Quiz Pack của tôi</Link></div></div></CreatorShell>;
  if (result) { const passed = result.score >= 90; return <CreatorShell><div className={`mx-auto max-w-xl rounded-3xl border p-7 text-center ${passed ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}><CheckCircle2 className={`mx-auto h-10 w-10 ${passed ? "text-emerald-600" : "text-rose-600"}`} /><h1 className="mt-4 text-2xl font-black">{passed ? "Validation đạt yêu cầu" : "Validation chưa đạt"}</h1><p className="mt-2 text-sm text-slate-600">Hoàn thành {date(result.completedAt)}</p><div className="mt-6 grid grid-cols-2 gap-3 text-left sm:grid-cols-4">{[["Điểm", result.score], ["Đúng", `${result.correctCount}/${result.questionCount}`], ["Câu hỏi", result.questionCount], ["Thời gian", `${result.durationSeconds}s`]].map(([label, value]) => <div key={String(label)} className="rounded-xl bg-white p-3"><p className="text-xs text-slate-500">{label}</p><p className="font-black">{value}</p></div>)}</div><div className="mt-6 flex flex-wrap justify-center gap-3">{passed ? <Button onClick={() => setReviewConfirm(true)}><Send className="h-4 w-4" />Gửi Admin duyệt</Button> : <Button onClick={retry}>Làm lại Validation</Button>}</div></div>{reviewConfirm && <Confirm title="Gửi Admin duyệt" text="Sau khi gửi duyệt, Quiz Pack sẽ ở trạng thái chờ Admin kiểm tra." busy={reviewing} onClose={() => setReviewConfirm(false)} onConfirm={sendReview} />}</CreatorShell>; }
  return <CreatorShell><Link to="/app/creator/marketplace" className="inline-flex items-center gap-1 text-sm font-bold text-[#FF6B00]"><ChevronLeft className="h-4 w-4" />Quiz Pack của tôi</Link><div className="mt-5 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl font-black">Full Pack Validation</h1><p className="mt-1 text-sm text-slate-500">Tiến độ {Object.keys(answers).length}/{questions.length} câu trả lời</p></div><span className="inline-flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-2 text-sm font-black text-[#FF6B00]"><Clock3 className="h-4 w-4" />{String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}</span></div><div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]"><section className="rounded-3xl border border-slate-200 bg-white p-6"><p className="text-sm font-bold text-[#FF6B00]">Câu {index + 1}/{questions.length}</p><h2 className="mt-3 text-xl font-black leading-8">{current?.text}</h2><div className="mt-6 grid gap-3">{current?.options.map(option => <label key={option.optionId} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm font-medium ${answers[current.questionId] === option.optionId ? "border-[#FF6B00] bg-orange-50" : "border-slate-200 hover:border-orange-200"}`}><input type="radio" name={current.questionId} checked={answers[current.questionId] === option.optionId} onChange={() => setAnswers(currentAnswers => ({ ...currentAnswers, [current.questionId]: option.optionId }))} className="accent-[#FF6B00]" />{option.text}</label>)}</div><div className="mt-7 flex justify-between"><button onClick={() => setIndex(value => Math.max(0, value - 1))} disabled={index === 0} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold disabled:opacity-40">Câu trước</button>{index < questions.length - 1 ? <button onClick={() => setIndex(value => Math.min(questions.length - 1, value + 1))} className="rounded-xl border border-orange-200 px-4 py-2 text-sm font-bold text-[#FF6B00]">Câu tiếp</button> : <Button onClick={() => setConfirm(true)} disabled={!complete}><Trophy className="h-4 w-4" />Nộp Validation</Button>}</div></section><aside className="rounded-3xl border border-slate-200 bg-white p-5"><h2 className="font-black">Câu hỏi</h2><div className="mt-4 grid grid-cols-5 gap-2">{questions.map((question, questionIndex) => <button key={question.questionId} onClick={() => setIndex(questionIndex)} className={`h-9 rounded-lg text-xs font-bold ${index === questionIndex ? "bg-[#FF6B00] text-white" : answers[question.questionId] ? "bg-orange-50 text-[#FF6B00]" : "bg-slate-100 text-slate-600"}`}>{questionIndex + 1}</button>)}</div><button onClick={() => setConfirm(true)} disabled={!complete} className="mt-6 w-full rounded-xl bg-[#FF6B00] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40">Nộp Validation</button></aside></div>{confirm && <Confirm title="Nộp Full Pack Validation" text="Bạn đã trả lời tất cả câu hỏi. Xác nhận gửi bài Validation?" busy={submitting} onClose={() => setConfirm(false)} onConfirm={submit} />}</CreatorShell>;
}

import { useCallback, useEffect, useMemo, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, BookOpen, CheckCircle2, Clock3, Coins, LoaderCircle, Search, Send, ShoppingBag, Sparkles, Star, Trophy, WalletCards, X } from "lucide-react";
import { toast } from "sonner";
import { marketplaceService } from "../../../api/marketplace";
import type { ChallengeResult, ChallengeSession, CreatorMarketplaceItem, MarketplaceItemDetail, MarketplaceQuestion, MarketplaceReview, MarketplaceWallet, PurchasedMarketplacePack, PurchasedPackDetail } from "../../../api/marketplace";
import workspaceService, { type WorkspaceResponse } from "../../../api/utilities/workspaceService";

const fmt = new Intl.NumberFormat("vi-VN");
const date = (v?: string | null) => v ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(v)) : "—";
const message = (e: unknown) => e instanceof Error ? e.message : "Đã có lỗi xảy ra. Vui lòng thử lại.";

function Shell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const stayInDashboard = (event: ReactMouseEvent<HTMLDivElement>) => {
    const target = event.target as Element;
    const link = target.closest<HTMLAnchorElement>('a[href^="/marketplace"], a[href^="/my-packs"], a[href="/wallet"]');
    const href = link?.getAttribute("href");
    if (!href || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey) return;
    event.preventDefault();
    navigate(`/app${href}`);
  };

  return <div onClickCapture={stayInDashboard} className="skill-marketplace min-h-screen bg-slate-50 text-slate-900">
    <style>{`
      .skill-marketplace .bg-violet-50 { background-color: #fff7ed !important; }
      .skill-marketplace .bg-violet-600 { background-color: #ff6b00 !important; }
      .skill-marketplace .text-violet-600,
      .skill-marketplace .text-violet-700 { color: #ff6b00 !important; }
      .skill-marketplace .border-violet-200,
      .skill-marketplace .border-violet-300 { border-color: #fed7aa !important; }
      .skill-marketplace .bg-gradient-to-br { background: linear-gradient(135deg, #ff6b00 0%, #ff9a3c 100%) !important; }
      .skill-marketplace .bg-slate-950 { background-color: #ff6b00 !important; }
      .skill-marketplace form input[type="text"],
      .skill-marketplace form input:not([type]),
      .skill-marketplace form input[type="number"],
      .skill-marketplace form textarea,
      .skill-marketplace form select { background-color: #ffffff !important; color: #0f172a !important; }
      .skill-marketplace form button.bg-slate-950 { background-color: #0f172a !important; }
      .skill-marketplace .bg-slate-950:hover,
      .skill-marketplace .bg-violet-600:hover { background-color: #e85f00 !important; }
      .skill-marketplace input:focus,
      .skill-marketplace textarea:focus { border-color: #ff6b00 !important; outline-color: #ff6b00 !important; }
    `}</style>
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/marketplace" className="flex items-center gap-2 font-black"><span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 text-white"><Sparkles className="h-4 w-4" /></span>SkillSprint <span className="text-violet-600">Market</span></Link>
        <nav className="flex items-center gap-1 text-sm font-bold text-slate-600"><Link to="/marketplace" className="rounded-lg px-3 py-2 hover:bg-violet-50">Khám phá</Link><Link to="/my-packs" className="rounded-lg px-3 py-2 hover:bg-violet-50">Gói của tôi</Link><Link to="/wallet" className="rounded-lg p-2 hover:bg-violet-50" aria-label="Ví Coin"><WalletCards className="h-5 w-5" /></Link></nav>
      </div>
    </header>
    <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6">{children}</main>
  </div>;
}

function Coin({ value }: { value: number }) { return <span className="inline-flex items-center gap-1 font-bold text-amber-700"><Coins className="h-4 w-4" />{fmt.format(value)} Coin</span>; }
function Stars({ value }: { value: number }) { return <span className="inline-flex text-amber-400">{[1,2,3,4,5].map(n => <Star key={n} className={`h-4 w-4 ${n <= Math.round(value) ? "fill-current" : "text-slate-200"}`} />)}</span>; }
function Loading() { return <div className="grid gap-5 md:grid-cols-3">{[1,2,3].map(n => <div key={n} className="h-64 animate-pulse rounded-3xl bg-slate-200" />)}</div>; }
function ErrorBox({ retry }: { retry: () => void }) { return <div className="rounded-3xl border border-rose-200 bg-rose-50 p-10 text-center"><p className="font-bold text-rose-900">Không thể tải dữ liệu.</p><button onClick={retry} className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white">Thử lại</button></div>; }
function Empty({ title, text, action }: { title: string; text: string; action?: ReactNode }) { return <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><ShoppingBag className="mx-auto h-8 w-8 text-violet-600" /><h2 className="mt-4 text-lg font-black">{title}</h2><p className="mt-2 text-sm text-slate-500">{text}</p>{action && <div className="mt-5">{action}</div>}</div>; }
function Confirm({ open, title, text, button, busy, disabled, close, submit }: { open: boolean; title: string; text: string; button: string; busy?: boolean; disabled?: boolean; close: () => void; submit: () => void }) { if (!open) return null; return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><div className="flex justify-between gap-4"><div><h2 className="text-lg font-black">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></div><button onClick={close} aria-label="Đóng"><X className="h-5 w-5 text-slate-400" /></button></div><div className="mt-6 flex justify-end gap-3"><button onClick={close} disabled={busy} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold">Hủy</button><button onClick={submit} disabled={busy || disabled || text.includes("Ví Coin hiện được nạp bởi quản trị viên trong bản demo.")} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : button}</button></div></div></div>; }

function Card({ item }: { item: PurchasedMarketplacePack }) { return <Link to={`/marketplace/items/${item.itemId}`} className="flex min-h-64 flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-violet-300 hover:shadow-lg"><div className="flex justify-between gap-3"><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">{item.subject}</span><span className="flex items-center gap-1 text-sm"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{item.averageRating.toFixed(1)}</span></div><h2 className="mt-5 text-xl font-black">{item.title}</h2><p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">{item.description}</p><p className="mt-4 text-xs text-slate-500">{item.creatorName} · {item.chapterCount} chương · {item.quizCount} quiz · {item.questionCount} câu hỏi</p><div className="mt-auto flex items-center justify-between pt-5"><Coin value={item.priceCoins} /><span className="text-sm font-bold text-violet-700">Xem gói</span></div></Link>; }

export function MarketplaceCatalog() {
  const [items, setItems] = useState<PurchasedMarketplacePack[]>([]); const [input, setInput] = useState(""); const [subject, setSubject] = useState(""); const [loading, setLoading] = useState(true); const [failed, setFailed] = useState(false);
  const load = useCallback(async () => { setLoading(true); setFailed(false); try { setItems(await marketplaceService.listItems(subject || undefined)); } catch { setFailed(true); } finally { setLoading(false); } }, [subject]);
  useEffect(() => { void load(); }, [load]);
  return <Shell><section className="rounded-3xl bg-gradient-to-br from-violet-700 to-blue-600 p-7 text-white sm:p-10"><p className="text-sm font-bold text-violet-100">SKILLSPRINT MARKETPLACE</p><h1 className="mt-2 max-w-2xl text-3xl font-black sm:text-4xl">Tìm bộ học liệu phù hợp với mục tiêu của bạn.</h1><form onSubmit={e => { e.preventDefault(); setSubject(input.trim()); }} className="mt-6 flex max-w-xl gap-2"><div className="relative flex-1"><Search className="absolute left-4 top-4 h-4 w-4 text-slate-400" /><input value={input} onChange={e => setInput(e.target.value)} placeholder="Lọc theo môn học" className="h-12 w-full rounded-xl pl-11 pr-3 text-sm text-slate-900 outline-none" /></div><button className="rounded-xl bg-slate-950 px-5 text-sm font-bold">Tìm</button></form></section><section className="mt-8"><div className="mb-5 flex justify-between gap-4"><div><h2 className="text-xl font-black">Gói học liệu</h2><p className="mt-1 text-sm text-slate-500">{subject ? `Môn học: ${subject}` : "Chọn một gói để xem trước nội dung."}</p></div>{subject && <button onClick={() => { setSubject(""); setInput(""); }} className="text-sm font-bold text-violet-700">Xóa lọc</button>}</div>{loading ? <Loading /> : failed ? <ErrorBox retry={load} /> : items.length === 0 ? <Empty title="Chưa có gói phù hợp" text="Hãy thử một môn học khác." /> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{items.map(item => <Card key={item.itemId} item={item} />)}</div>}</section></Shell>;
}

export function MarketplaceCatalogDashboard() {
  return <div className="[&>div>header]:hidden"><MarketplaceCatalog /></div>;
}

export function MarketplaceItemPageDashboard() {
  return <div className="[&>div>header]:hidden"><MarketplaceItemPage /></div>;
}

export function MyPacksPageDashboard() {
  return <div className="[&>div>header]:hidden"><MyPacksPage /></div>;
}

export function MyPackLearningPageDashboard() {
  return <div className="[&>div>header]:hidden"><MyPackLearningPage /></div>;
}

export function WalletPageDashboard() {
  return <div className="[&>div>header]:hidden"><WalletPage /></div>;
}

export function CreatorMarketplaceDashboard() {
  return <div className="[&>div>header]:hidden"><CreatorMarketplaceValidatedPage /></div>;
}

function Questions({ questions, answers, select }: { questions: MarketplaceQuestion[]; answers?: Record<string, string>; select?: (id: string, option: string) => void }) { return <div className="mt-4 space-y-4">{questions.map((q, i) => <fieldset key={q.questionId} className="rounded-xl border border-slate-200 bg-white p-4"><legend className="font-semibold">{i + 1}. {q.question}</legend><div className="mt-3 grid gap-2">{q.options.map(option => <label key={option.optionId} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm ${answers?.[q.questionId] === option.optionId ? "border-violet-500 bg-violet-50" : "border-slate-200"}`}><input type="radio" name={q.questionId} disabled={!select} checked={answers?.[q.questionId] === option.optionId} onChange={() => select?.(q.questionId, option.optionId)} /><span>{option.text}</span></label>)}</div></fieldset>)}</div>; }
function Content({ chapters, questions, preview = false }: { chapters: MarketplaceItemDetail["chapters"]; questions: MarketplaceQuestion[]; preview?: boolean }) { return <section className="mt-7"><h2 className="text-xl font-black">{preview ? "Xem trước nội dung" : "Nội dung gói học"}</h2><div className="mt-3 space-y-3">{chapters.map((chapter, i) => <article key={chapter.chapterId} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-bold uppercase tracking-wider text-violet-600">Chương {i + 1}</p><h3 className="mt-1 font-bold">{chapter.title}</h3>{chapter.summary && <p className="mt-2 text-sm leading-6 text-slate-600">{chapter.summary}</p>}</article>)}</div>{questions.length > 0 && <div className="mt-4 rounded-2xl bg-violet-50 p-5"><h3 className="font-black">{preview ? "Câu hỏi xem trước" : "Câu hỏi"}</h3><Questions questions={questions} /></div>}</section>; }

export function MarketplaceItemPage() {
  const { itemId = "" } = useParams(); const go = useNavigate(); const [item, setItem] = useState<MarketplaceItemDetail | null>(null); const [board, setBoard] = useState<any[]>([]); const [reviews, setReviews] = useState<MarketplaceReview[]>([]); const [loading, setLoading] = useState(true); const [failed, setFailed] = useState(false); const [wallet, setWallet] = useState<MarketplaceWallet | null>(null); const [buyOpen, setBuyOpen] = useState(false); const [buying, setBuying] = useState(false); const [rating, setRating] = useState(0); const [comment, setComment] = useState(""); const [reviewOpen, setReviewOpen] = useState(false); const [reviewing, setReviewing] = useState(false);
  const load = useCallback(async () => { setLoading(true); setFailed(false); try { const [a,b,c] = await Promise.all([marketplaceService.getItem(itemId), marketplaceService.getLeaderboard(itemId), marketplaceService.getReviews(itemId)]); setItem(a); setBoard(b); setReviews(c); const mine = c.find(r => r.mine); if (mine) { setRating(mine.rating); setComment(mine.comment || ""); } } catch { setFailed(true); } finally { setLoading(false); } }, [itemId]);
  useEffect(() => { void load(); }, [load]);
  const openBuy = async () => { try { setWallet(await marketplaceService.getWallet()); setBuyOpen(true); } catch (e) { toast.error(message(e)); } };
  const buy = async () => { if (!item) return; setBuying(true); try { await marketplaceService.purchase(item.itemId); toast.success("Đã mua gói học liệu."); go(`/my-packs/${item.itemId}`); } catch (e) { toast.error(message(e)); } finally { setBuying(false); } };
  const saveReview = async () => { if (!item) return; setReviewing(true); try { await marketplaceService.review(item.itemId, { rating, comment: comment.trim() || undefined }); toast.success("Đã lưu đánh giá."); setReviewOpen(false); await load(); } catch (e) { toast.error(message(e)); } finally { setReviewing(false); } };
  if (loading) return <Shell><Loading /></Shell>; if (failed || !item) return <Shell><ErrorBox retry={load} /></Shell>;
  const shortage = Math.max(0, item.priceCoins - (wallet?.balanceCoins ?? 0));
  return <Shell><Link to="/marketplace" className="inline-flex items-center gap-1 text-sm font-bold text-violet-700"><ArrowLeft className="h-4 w-4" />Marketplace</Link><div className="mt-5 grid gap-7 lg:grid-cols-[minmax(0,1fr)_340px]"><div><section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8"><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">{item.subject}</span><h1 className="mt-4 text-3xl font-black">{item.title}</h1><p className="mt-2 text-sm text-slate-500">Bởi {item.creatorName}</p><p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-600">{item.description}</p><div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-600"><span>{item.chapterCount} chương</span><span>{item.quizCount} quiz</span><span>{item.questionCount} câu hỏi</span><span className="flex gap-1"><Stars value={item.averageRating} />{item.averageRating.toFixed(1)} ({item.reviewCount})</span></div></section><Content chapters={item.chapters} questions={item.previewQuestions} preview /><section className="mt-7"><h2 className="text-xl font-black">Top 10</h2><div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">{board.length ? board.slice(0,10).map((entry, i) => <div key={`${entry.learnerName}-${i}`} className="flex gap-3 border-b border-slate-100 p-4 last:border-0"><b className="text-violet-700">#{entry.rank ?? i + 1}</b><span className="flex-1 font-semibold">{entry.learnerName}</span><b>{entry.score} điểm</b></div>) : <p className="p-5 text-sm text-slate-500">Chưa có kết quả thử thách.</p>}</div></section><section className="mt-7"><h2 className="text-xl font-black">Đánh giá</h2><div className="mt-3 space-y-3">{reviews.length ? reviews.map((r, i) => <article key={r.reviewId || i} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex justify-between"><b>{r.reviewerName}</b><Stars value={r.rating} /></div>{r.comment && <p className="mt-3 text-sm text-slate-600">{r.comment}</p>}<p className="mt-3 text-xs text-slate-400">{date(r.createdAt)}</p></article>) : <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">Chưa có đánh giá.</p>}</div></section></div><aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 lg:sticky lg:top-24"><p className="text-sm text-slate-500">Giá gói học liệu</p><p className="mt-2 text-2xl"><Coin value={item.priceCoins} /></p><button onClick={openBuy} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-black text-white"><Coins className="h-4 w-4" />Mua bằng Coin</button><div className="mt-6 border-t pt-5"><h2 className="font-black">Đánh giá của bạn</h2><div className="mt-3 flex">{[1,2,3,4,5].map(n => <button key={n} onClick={() => setRating(n)} aria-label={`${n} sao`}><Star className={`h-6 w-6 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} /></button>)}</div><textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Nhận xét (không bắt buộc)" className="mt-3 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm" /><button onClick={() => rating ? setReviewOpen(true) : toast.message("Chọn số sao trước khi gửi đánh giá.")} className="mt-3 rounded-xl border border-violet-200 px-4 py-2 text-sm font-bold text-violet-700">{reviews.some(r => r.mine) ? "Cập nhật đánh giá" : "Gửi đánh giá"}</button></div></aside></div><Confirm open={buyOpen} title="Xác nhận mua gói" text={wallet ? `Số dư: ${fmt.format(wallet.balanceCoins)} Coin.${shortage ? ` Còn thiếu ${fmt.format(shortage)} Coin. Ví Coin hiện được nạp bởi quản trị viên trong bản demo.` : " Coin sẽ được trừ khi xác nhận."}` : "Đang kiểm tra ví."} button="Xác nhận mua" busy={buying} close={() => setBuyOpen(false)} submit={buy} /><Confirm open={reviewOpen} title="Gửi đánh giá" text="Bạn xác nhận lưu đánh giá này?" button="Lưu đánh giá" busy={reviewing} close={() => setReviewOpen(false)} submit={saveReview} /></Shell>;
}

export function MyPacksPage() {
  const [packs, setPacks] = useState<PurchasedMarketplacePack[]>([]); const [loading, setLoading] = useState(true); const [failed, setFailed] = useState(false);
  const load = useCallback(async () => { setLoading(true); setFailed(false); try { setPacks(await marketplaceService.getMyPacks()); } catch { setFailed(true); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  return <Shell><h1 className="text-3xl font-black">Gói học của tôi</h1><p className="mt-2 text-slate-500">Tiếp tục những gói học liệu bạn đã sở hữu.</p><div className="mt-7">{loading ? <Loading /> : failed ? <ErrorBox retry={load} /> : packs.length === 0 ? <Empty title="Bạn chưa mua gói nào" text="Khám phá Marketplace để tìm học liệu phù hợp." action={<Link to="/marketplace" className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white">Khám phá Marketplace</Link>} /> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{packs.map(pack => <article key={pack.itemId} className="rounded-3xl border border-slate-200 bg-white p-6"><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">{pack.subject}</span><h2 className="mt-4 text-xl font-black">{pack.title}</h2><p className="mt-2 line-clamp-2 text-sm text-slate-500">{pack.description}</p><Link to={`/my-packs/${pack.itemId}`} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white"><BookOpen className="h-4 w-4" />Học ngay</Link></article>)}</div>}</div></Shell>;
}

function Timer({ expiresAt, expire }: { expiresAt: string; expire: () => void }) { const [ms, setMs] = useState(() => Math.max(0, new Date(expiresAt).getTime() - Date.now())); useEffect(() => { const id = window.setInterval(() => { const next = Math.max(0, new Date(expiresAt).getTime() - Date.now()); setMs(next); if (!next) { clearInterval(id); expire(); } }, 1000); return () => clearInterval(id); }, [expiresAt, expire]); return <span className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-black text-amber-800"><Clock3 className="h-4 w-4" />{String(Math.floor(ms / 60000)).padStart(2,"0")}:{String(Math.floor(ms / 1000) % 60).padStart(2,"0")}</span>; }

export function MyPackLearningPage() {
  const { itemId = "" } = useParams(); const [pack, setPack] = useState<PurchasedPackDetail | null>(null); const [loading, setLoading] = useState(true); const [failed, setFailed] = useState(false); const [session, setSession] = useState<ChallengeSession | null>(null); const [answers, setAnswers] = useState<Record<string,string>>({}); const [expired, setExpired] = useState(false); const [confirm, setConfirm] = useState(false); const [submitting, setSubmitting] = useState(false); const [result, setResult] = useState<ChallengeResult | null>(null);
  const load = useCallback(async () => { setLoading(true); setFailed(false); try { setPack(await marketplaceService.getMyPack(itemId)); } catch { setFailed(true); } finally { setLoading(false); } }, [itemId]); useEffect(() => { void load(); }, [load]);
  const start = async () => { try { const next = await marketplaceService.startChallenge(itemId); setSession(next); setAnswers({}); setResult(null); setExpired(false); toast.success("Đã bắt đầu Full Pack Challenge."); } catch (e) { toast.error(message(e)); } };
  const submit = async () => { if (!session) return; setSubmitting(true); try { const next = await marketplaceService.submitChallenge(itemId, { sessionId: session.sessionId, answers: session.questions.map(q => ({ questionId: q.questionId, selectedOptionId: answers[q.questionId] })) }); setResult(next); setSession(null); setConfirm(false); toast.success("Đã nộp bài."); } catch (e) { toast.error(message(e)); } finally { setSubmitting(false); } };
  if (loading) return <Shell><Loading /></Shell>; if (failed || !pack) return <Shell><ErrorBox retry={load} /></Shell>;
  const done = session?.questions.every(q => answers[q.questionId]) || false;
  return <Shell><Link to="/my-packs" className="inline-flex items-center gap-1 text-sm font-bold text-violet-700"><ArrowLeft className="h-4 w-4" />Gói của tôi</Link><h1 className="mt-4 text-3xl font-black">{pack.title}</h1><p className="mt-2 text-slate-500">{pack.description}</p><Content chapters={pack.chapters} questions={pack.questions} /><section className="mt-7 rounded-3xl border border-violet-200 bg-violet-50 p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-xl font-black">Full Pack Challenge</h2><p className="mt-1 text-sm text-slate-600">Trả lời tất cả câu hỏi trước khi nộp. Thời gian được máy chủ quản lý.</p></div>{!session && <button onClick={start} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white"><Trophy className="h-4 w-4" />Bắt đầu Full Pack Challenge</button>}</div>{expired && <p className="mt-5 rounded-xl bg-amber-100 p-4 text-sm font-bold text-amber-900">Phiên đã hết hạn. Hãy bắt đầu một phiên mới.</p>}{session && !expired && <div className="mt-6"><div className="flex flex-wrap justify-between gap-3"><p className="text-sm text-slate-600">Bắt đầu: {date(session.startedAt)}</p><Timer expiresAt={session.expiresAt} expire={() => setExpired(true)} /></div><Questions questions={session.questions} answers={answers} select={(id, option) => setAnswers(a => ({ ...a, [id]: option }))} /><button onClick={() => setConfirm(true)} disabled={!done} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"><Send className="h-4 w-4" />Nộp bài ({Object.keys(answers).length}/{session.questions.length})</button>{!done && <p className="mt-2 text-xs text-slate-500">Bạn cần trả lời mọi câu hỏi trước khi nộp.</p>}</div>}{result && <div className="mt-6 rounded-2xl bg-white p-5"><div className="flex gap-3"><CheckCircle2 className="h-6 w-6 text-emerald-600" /><div><h3 className="font-black">Kết quả thử thách</h3><p className="text-sm text-slate-500">Hoàn thành {date(result.completedAt)}</p></div></div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Điểm",result.score],["Đúng",`${result.correctCount}/${result.questionCount}`],["Câu hỏi",result.questionCount],["Thời gian",`${result.durationSeconds}s`]].map(([k,v]) => <div key={String(k)} className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{k}</p><p className="font-black text-violet-700">{v}</p></div>)}</div></div>}</section><Confirm open={confirm} title="Xác nhận nộp bài" text="Bạn đã trả lời đủ tất cả câu hỏi. Bạn muốn gửi bài thử thách?" button="Nộp bài" busy={submitting} close={() => setConfirm(false)} submit={submit} /></Shell>;
}

export function WalletPage() {
  const [wallet, setWallet] = useState<MarketplaceWallet | null>(null); const [transactions, setTransactions] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [failed, setFailed] = useState(false);
  const load = useCallback(async () => { setLoading(true); setFailed(false); try { const [a,b] = await Promise.all([marketplaceService.getWallet(), marketplaceService.getTransactions()]); setWallet(a); setTransactions(b); } catch { setFailed(true); } finally { setLoading(false); } }, []); useEffect(() => { void load(); }, [load]);
  return <Shell><h1 className="text-3xl font-black">Ví Coin</h1><p className="mt-2 text-slate-500">Theo dõi số dư và các giao dịch Coin của bạn.</p>{loading ? <div className="mt-7"><Loading /></div> : failed ? <div className="mt-7"><ErrorBox retry={load} /></div> : <><section className="mt-7 rounded-3xl bg-gradient-to-br from-violet-700 to-blue-600 p-7 text-white"><p className="text-sm font-bold text-violet-100">SỐ DƯ HIỆN CÓ</p><p className="mt-2 text-4xl font-black">{fmt.format(wallet?.balanceCoins || 0)} Coin</p></section><p className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">Nạp Coin qua SePay và rút tiền cho Creator chưa có trong phiên bản này.</p><section className="mt-7"><h2 className="text-xl font-black">Giao dịch</h2><div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="p-4">Loại</th><th className="p-4">Số Coin</th><th className="p-4">Số dư sau</th><th className="p-4">Tham chiếu</th><th className="p-4">Thời gian</th></tr></thead><tbody>{transactions.length ? transactions.map(t => <tr key={t.transactionId} className="border-t border-slate-100"><td className="p-4 font-bold">{t.direction}</td><td className="p-4">{t.amount}</td><td className="p-4">{t.balanceAfter}</td><td className="p-4">{t.referenceType}</td><td className="p-4">{date(t.createdAt)}</td></tr>) : <tr><td colSpan={5} className="p-8 text-center text-slate-500">Chưa có giao dịch.</td></tr>}</tbody></table></div></section></>}</Shell>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block text-sm font-bold text-slate-700"><span>{label}</span><div className="mt-2 [&_input]:h-11 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-slate-200 [&_input]:px-3 [&_textarea]:min-h-24 [&_textarea]:w-full [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-slate-200 [&_textarea]:p-3">{children}</div></label>; }
export function CreatorMarketplacePage() {
  const [items,setItems] = useState<CreatorMarketplaceItem[]>([]); const [loading,setLoading] = useState(true); const [failed,setFailed] = useState(false); const [form,setForm] = useState({ workspaceId:"",title:"",description:"",subject:"",priceCoins:"" }); const [creating,setCreating] = useState(false);
  const load = useCallback(async () => { setLoading(true); setFailed(false); try { setItems(await marketplaceService.getMine()); } catch { setFailed(true); } finally { setLoading(false); } }, []); useEffect(() => { void load(); }, [load]);
  const create = async (e: React.FormEvent) => { e.preventDefault(); const priceCoins = Number(form.priceCoins); if (!form.workspaceId || !form.title || !form.description || !form.subject || !Number.isFinite(priceCoins) || priceCoins < 0) return toast.error("Hãy điền đủ thông tin hợp lệ."); setCreating(true); try { await marketplaceService.createItem({ ...form, priceCoins }); toast.success("Đã tạo Pack."); setForm({workspaceId:"",title:"",description:"",subject:"",priceCoins:""}); await load(); } catch (err) { toast.error(message(err)); } finally { setCreating(false); } };
  return <Shell><h1 className="text-3xl font-black">Creator Marketplace</h1><p className="mt-2 text-slate-500">Tạo và theo dõi các gói học liệu của bạn.</p><section className="mt-7 rounded-3xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-black">Tạo Pack</h2><form onSubmit={create} className="mt-5 grid gap-4 md:grid-cols-2"><Field label="Workspace ID"><input value={form.workspaceId} onChange={e => setForm(f => ({...f,workspaceId:e.target.value}))} required /></Field><Field label="Môn học"><input value={form.subject} onChange={e => setForm(f => ({...f,subject:e.target.value}))} required /></Field><Field label="Tiêu đề"><input value={form.title} onChange={e => setForm(f => ({...f,title:e.target.value}))} required /></Field><Field label="Giá Coin"><input type="number" min="0" value={form.priceCoins} onChange={e => setForm(f => ({...f,priceCoins:e.target.value}))} required /></Field><div className="md:col-span-2"><Field label="Mô tả"><textarea value={form.description} onChange={e => setForm(f => ({...f,description:e.target.value}))} required /></Field></div><button disabled={creating} className="w-fit rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{creating ? "Đang tạo..." : "Tạo Pack"}</button></form></section><section className="mt-8"><h2 className="text-xl font-black">Pack của bạn</h2>{loading ? <div className="mt-4"><Loading /></div> : failed ? <div className="mt-4"><ErrorBox retry={load} /></div> : items.length === 0 ? <div className="mt-4"><Empty title="Chưa có Pack" text="Tạo Pack đầu tiên từ một workspace của bạn." /></div> : <div className="mt-4 grid gap-4 lg:grid-cols-2">{items.map(item => <article key={item.itemId} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex justify-between gap-3"><div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{item.status}</span><h3 className="mt-3 text-lg font-black">{item.title}</h3></div><Coin value={item.priceCoins} /></div><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-slate-500">Điểm xác thực</dt><dd className="font-bold">{item.validationScore ?? "—"}</dd></div><div><dt className="text-slate-500">Ngày tạo</dt><dd className="font-bold">{date(item.createdAt)}</dd></div><div className="col-span-2"><dt className="text-slate-500">Ghi chú duyệt</dt><dd>{item.reviewNote || "—"}</dd></div></dl><button onClick={async () => { try { await marketplaceService.validateCreator(item.itemId, { answers: [], durationSeconds: 0 }); toast.success("Đã gửi xác thực Creator."); await load(); } catch (e) { toast.error(message(e)); } }} className="mt-5 rounded-xl border border-violet-200 px-3 py-2 text-sm font-bold text-violet-700">Xác thực Creator</button><button disabled={(item.validationScore || 0) < 90} onClick={async () => { try { await marketplaceService.submitForReview(item.itemId); toast.success("Đã gửi Pack để duyệt."); await load(); } catch (e) { toast.error(message(e)); } }} className="ml-2 rounded-xl bg-violet-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-40">Gửi duyệt</button></article>)}</div>}</section></Shell>;
}

export function CreatorMarketplaceValidatedPage() {
  const [items, setItems] = useState<CreatorMarketplaceItem[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([]);
  const [form, setForm] = useState({ workspaceId: "", title: "", description: "", subject: "", priceCoins: "" });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [active, setActive] = useState<CreatorMarketplaceItem | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [openedAt, setOpenedAt] = useState(0);
  const [validating, setValidating] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [creatorItems, ownedWorkspaces] = await Promise.all([
        marketplaceService.getMine(),
        workspaceService.getMyWorkspaces(),
      ]);
      setItems(creatorItems);
      setWorkspaces(ownedWorkspaces);
    }
    catch (error) { toast.error(message(error)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    const priceCoins = Number(form.priceCoins);
    if (!form.workspaceId || !form.title || !form.description || !form.subject || !Number.isFinite(priceCoins) || priceCoins < 0) return toast.error("Hãy điền đủ thông tin hợp lệ.");
    setCreating(true);
    try {
      await marketplaceService.createItem({ ...form, priceCoins });
      setForm({ workspaceId: "", title: "", description: "", subject: "", priceCoins: "" });
      toast.success("Đã tạo Pack.");
      await load();
    } catch (error) { toast.error(message(error)); }
    finally { setCreating(false); }
  };
  const openValidation = (item: CreatorMarketplaceItem) => {
    setActive(item);
    setAnswers({});
    setOpenedAt(Date.now());
  };
  const submitValidation = async () => {
    if (!active) return;
    const questions = active.validationQuestions ?? [];
    if (!questions.length || !questions.every(question => answers[question.questionId])) return;
    setValidating(true);
    try {
      await marketplaceService.validateCreator(active.itemId, {
        answers: questions.map(question => ({ questionId: question.questionId, selectedOptionId: answers[question.questionId] })),
        durationSeconds: Math.max(0, Math.floor((Date.now() - openedAt) / 1000)),
      });
      toast.success("Đã gửi bài xác thực Creator.");
      setActive(null);
      await load();
    } catch (error) { toast.error(message(error)); }
    finally { setValidating(false); }
  };
  const questions = active?.validationQuestions ?? [];
  const validationComplete = questions.length > 0 && questions.every(question => answers[question.questionId]);
  return <Shell>
    <h1 className="text-3xl font-black">Creator Marketplace</h1>
    <p className="mt-2 text-slate-500">Tạo và theo dõi các gói học liệu của bạn.</p>
    <section className="mt-7 rounded-3xl border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-black">Tạo Pack</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">Chọn workspace có roadmap/quiz cần đóng gói. Backend quyết định nội dung quiz hợp lệ được đưa vào Pack.</p>
      <form onSubmit={create} className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Workspace"><select value={form.workspaceId} onChange={e => setForm(f => ({ ...f, workspaceId: e.target.value }))} required disabled={loading} className="h-11 w-full rounded-xl border border-slate-200 px-3"><option value="">{loading ? "Đang tải workspace..." : "Chọn workspace"}</option>{workspaces.map(workspace => <option key={workspace.workspaceId} value={workspace.workspaceId}>{workspace.name}</option>)}</select></Field>
        <Field label="Môn học"><input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required /></Field>
        <Field label="Tiêu đề"><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></Field>
        <Field label="Giá Coin"><input type="number" min="0" value={form.priceCoins} onChange={e => setForm(f => ({ ...f, priceCoins: e.target.value }))} required /></Field>
        <div className="md:col-span-2"><Field label="Mô tả"><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required /></Field></div>
        <button disabled={creating} className="w-fit rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{creating ? "Đang tạo..." : "Tạo Pack"}</button>
      </form>
    </section>
    <section className="mt-8">
      <h2 className="text-xl font-black">Pack của bạn</h2>
      {loading ? <div className="mt-4"><Loading /></div> : items.length === 0 ? <div className="mt-4"><Empty title="Chưa có Pack" text="Tạo Pack đầu tiên từ một workspace của bạn." /></div> : <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {items.map(item => <article key={item.itemId} className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex justify-between gap-3"><div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{item.status}</span><h3 className="mt-3 text-lg font-black">{item.title}</h3></div><Coin value={item.priceCoins} /></div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-slate-500">Điểm xác thực</dt><dd className="font-bold">{item.validationScore ?? "—"}</dd></div><div><dt className="text-slate-500">Ngày tạo</dt><dd className="font-bold">{date(item.createdAt)}</dd></div><div className="col-span-2"><dt className="text-slate-500">Ghi chú duyệt</dt><dd>{item.reviewNote || "—"}</dd></div></dl>
          <div className="mt-5 flex gap-2"><button onClick={() => openValidation(item)} className="rounded-xl border border-violet-200 px-3 py-2 text-sm font-bold text-violet-700">Xác thực Creator</button><button disabled={(item.validationScore ?? 0) < 90} onClick={async () => { try { await marketplaceService.submitForReview(item.itemId); toast.success("Đã gửi Pack để duyệt."); await load(); } catch (error) { toast.error(message(error)); } }} className="rounded-xl bg-violet-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-40">Gửi duyệt</button></div>
        </article>)}
      </div>}
    </section>
    {active && <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 p-4"><div className="mx-auto my-8 max-w-2xl rounded-3xl bg-white p-6"><div className="flex justify-between"><div><h2 className="text-xl font-black">Xác thực Creator</h2><p className="mt-1 text-sm text-slate-500">Trả lời tất cả câu hỏi trước khi gửi.</p></div><button onClick={() => setActive(null)} aria-label="Đóng"><X className="h-5 w-5 text-slate-400" /></button></div>{questions.length ? <Questions questions={questions} answers={answers} select={(questionId, optionId) => setAnswers(current => ({ ...current, [questionId]: optionId }))} /> : <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Không có câu hỏi xác thực được trả về cho Pack này.</p>}<div className="mt-6 flex justify-end gap-3"><button onClick={() => setActive(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold">Hủy</button><button onClick={submitValidation} disabled={!validationComplete || validating} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{validating ? "Đang gửi..." : "Gửi xác thực"}</button></div></div></div>}
  </Shell>;
}

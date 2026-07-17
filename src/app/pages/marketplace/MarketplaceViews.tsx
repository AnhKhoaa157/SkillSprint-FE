import { useCallback, useEffect, useMemo, useState, type FormEvent as ReactFormEvent, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ChevronDown, Clock3, Coins, Copy, FileQuestion, LoaderCircle, RefreshCw, Search, Send, ShoppingBag, Sparkles, Star, Trophy, WalletCards, X } from "lucide-react";
import { toast } from "sonner";
import { motion, useReducedMotion } from "motion/react";
import { marketplaceService } from "../../../api/marketplace";
import type { ChallengeResult, ChallengeSession, CoinTopUpPackage, CoinTopUpPayment, CreatorMarketplaceItem, MarketplaceItemDetail, MarketplaceQuestion, MarketplaceReview, MarketplaceTransaction, MarketplaceWallet, PurchasedMarketplacePack, PurchasedPackDetail } from "../../../api/marketplace";
import workspaceService, { type WorkspaceResponse } from "../../../api/utilities/workspaceService";
import MarketplaceLeaderboardCard from "../../components/marketplace/MarketplaceLeaderboardCard";
import { refreshMarketplaceLeaderboard } from "../../../api/marketplace/useMarketplaceLeaderboard";

const fmt = new Intl.NumberFormat("vi-VN");
const date = (v?: string | null) => v ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(v)) : "—";
const message = (e: unknown) => e instanceof Error ? e.message : "Đã có lỗi xảy ra. Vui lòng thử lại.";

function Shell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { itemId } = useParams<{ itemId: string }>();
  const showLearningLeaderboard = Boolean(itemId && location.pathname.includes("/my-packs/"));
  const stayInDashboard = (event: ReactMouseEvent<HTMLDivElement>) => {
    const target = event.target as Element;
    const link = target.closest<HTMLAnchorElement>('a[href^="/marketplace"], a[href^="/my-packs"], a[href="/wallet"]');
    const href = link?.getAttribute("href");
    if (!href || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey) return;
    event.preventDefault();
    navigate(`/app${href}`);
  };

  return <div onClickCapture={stayInDashboard} className="skill-marketplace relative isolate min-h-0 overflow-hidden bg-[#F8FAFC] text-slate-900">
    <style>{`
      .skill-marketplace .bg-violet-50 { background-color: #fff7ed !important; }
      .skill-marketplace .bg-violet-600 { background-color: #ff6b00 !important; }
      .skill-marketplace .text-violet-600,
      .skill-marketplace .text-violet-700 { color: #ff6b00 !important; }
      .skill-marketplace .border-violet-200,
      .skill-marketplace .border-violet-300 { border-color: #fed7aa !important; }
      .skill-marketplace .bg-gradient-to-br { background: linear-gradient(135deg, #ff6b00 0%, #ff9a3c 100%) !important; }
      .skill-marketplace .bg-slate-950 { background-color: #0f172a !important; }
      .skill-marketplace form input[type="text"],
      .skill-marketplace form input:not([type]),
      .skill-marketplace form input[type="number"],
      .skill-marketplace form textarea,
      .skill-marketplace form select { background-color: #fcfcfb !important; color: #0f172a !important; }
      .skill-marketplace form button.bg-slate-950 { background-color: #0f172a !important; }
      .skill-marketplace .bg-slate-950:hover { background-color: #020617 !important; }
      .skill-marketplace .bg-violet-600:hover { background-color: #e85f00 !important; }
      .skill-marketplace input:focus,
      .skill-marketplace textarea:focus { background-color: #ffffff !important; border-color: #ff6b00 !important; outline-color: #ff6b00 !important; }
    `}</style>
    <div className="pointer-events-none absolute inset-0 -z-30 bg-[linear-gradient(145deg,#F8FAFC_0%,#FFFDF9_48%,#FFF7ED_100%)]" />
    <div className="pointer-events-none absolute inset-0 -z-20 opacity-30 [background-image:radial-gradient(rgba(255,107,0,0.16)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent_72%)]" />
    <div className="pointer-events-none absolute -right-48 top-24 -z-10 h-[30rem] w-[30rem] rounded-full bg-orange-200/25 blur-3xl" />
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/marketplace" className="flex items-center gap-2 font-black"><span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 text-white"><Sparkles className="h-4 w-4" /></span>SkillSprint <span className="text-violet-600">Market</span></Link>
        <nav className="flex items-center gap-1 text-sm font-bold text-slate-600"><Link to="/marketplace" className="rounded-lg px-3 py-2 hover:bg-violet-50">Khám phá</Link><Link to="/my-packs" className="rounded-lg px-3 py-2 hover:bg-violet-50">Gói của tôi</Link><Link to="/wallet" className="rounded-lg p-2 hover:bg-violet-50" aria-label="Ví Coin"><WalletCards className="h-5 w-5" /></Link></nav>
      </div>
    </header>
    <main className="relative mx-auto max-w-7xl px-4 py-7 sm:px-6">{children}{showLearningLeaderboard && <div className="mt-7"><MarketplaceLeaderboardCard itemId={itemId || ""} compact /></div>}</main>
  </div>;
}

function Coin({ value }: { value: number }) { return <span className="inline-flex items-center gap-1 font-bold text-amber-700"><Coins className="h-4 w-4" />{fmt.format(value)} Coin</span>; }
function Stars({ value }: { value: number }) { return <span className="inline-flex text-amber-400">{[1,2,3,4,5].map(n => <Star key={n} className={`h-4 w-4 ${n <= Math.round(value) ? "fill-current" : "text-slate-200"}`} />)}</span>; }
function Loading() { return <div className="grid gap-5 md:grid-cols-3">{[1,2,3].map(n => <div key={n} className="h-64 animate-pulse rounded-3xl bg-slate-200" />)}</div>; }
function ErrorBox({ retry }: { retry: () => void }) { return <div className="rounded-3xl border border-rose-200 bg-rose-50 p-10 text-center"><p className="font-bold text-rose-900">Không thể tải dữ liệu.</p><button onClick={retry} className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white">Thử lại</button></div>; }
function Empty({ title, text, action }: { title: string; text: string; action?: ReactNode }) { return <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><ShoppingBag className="mx-auto h-8 w-8 text-violet-600" /><h2 className="mt-4 text-lg font-black">{title}</h2><p className="mt-2 text-sm text-slate-500">{text}</p>{action && <div className="mt-5">{action}</div>}</div>; }
function Confirm({ open, title, text, button, busy, disabled, close, submit }: { open: boolean; title: string; text: string; button: string; busy?: boolean; disabled?: boolean; close: () => void; submit: () => void }) { if (!open) return null; return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><div className="flex justify-between gap-4"><div><h2 className="text-lg font-black">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></div><button onClick={close} aria-label="Đóng"><X className="h-5 w-5 text-slate-400" /></button></div><div className="mt-6 flex justify-end gap-3"><button onClick={close} disabled={busy} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold">Hủy</button><button onClick={submit} disabled={busy || disabled || text.includes("Ví Coin hiện được nạp bởi quản trị viên trong bản demo.")} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : button}</button></div></div></div>; }

function Card({ item }: { item: PurchasedMarketplacePack }) { return <Link to={`/marketplace/items/${item.itemId}`} className="flex min-h-64 flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-violet-300 hover:shadow-lg"><div className="flex justify-between gap-3"><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">{item.subject}</span><span className="flex items-center gap-1 text-sm"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{item.averageRating.toFixed(1)}</span></div><h2 className="mt-5 text-xl font-black">{item.title}</h2><p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">{item.description}</p><p className="mt-4 text-xs text-slate-500">{item.creatorName} · {item.chapterCount} chương · {item.quizCount} quiz · {item.questionCount} câu hỏi</p><div className="mt-auto flex items-center justify-between pt-5"><Coin value={item.priceCoins} /><span className="text-sm font-bold text-violet-700">Xem gói</span></div></Link>; }

function MarketplaceCatalogLegacy() {
  const [items, setItems] = useState<PurchasedMarketplacePack[]>([]); const [input, setInput] = useState(""); const [subject, setSubject] = useState(""); const [loading, setLoading] = useState(true); const [failed, setFailed] = useState(false);
  const load = useCallback(async () => { setLoading(true); setFailed(false); try { setItems(await marketplaceService.listItems(subject || undefined)); } catch { setFailed(true); } finally { setLoading(false); } }, [subject]);
  useEffect(() => { void load(); }, [load]);
  return <Shell><section className="rounded-3xl bg-gradient-to-br from-violet-700 to-blue-600 p-7 text-white sm:p-10"><p className="text-sm font-bold text-violet-100">SKILLSPRINT MARKETPLACE</p><h1 className="mt-2 max-w-2xl text-3xl font-black sm:text-4xl">Tìm bộ học liệu phù hợp với mục tiêu của bạn.</h1><form onSubmit={e => { e.preventDefault(); setSubject(input.trim()); }} className="mt-6 flex max-w-xl gap-2"><div className="relative flex-1"><Search className="absolute left-4 top-4 h-4 w-4 text-slate-400" /><input value={input} onChange={e => setInput(e.target.value)} placeholder="Lọc theo môn học" className="h-12 w-full rounded-xl pl-11 pr-3 text-sm text-slate-900 outline-none" /></div><button className="rounded-xl bg-slate-950 px-5 text-sm font-bold">Tìm</button></form></section><section className="mt-8"><div className="mb-5 flex justify-between gap-4"><div><h2 className="text-xl font-black">Gói học liệu</h2><p className="mt-1 text-sm text-slate-500">{subject ? `Môn học: ${subject}` : "Chọn một gói để xem trước nội dung."}</p></div>{subject && <button onClick={() => { setSubject(""); setInput(""); }} className="text-sm font-bold text-violet-700">Xóa lọc</button>}</div>{loading ? <Loading /> : failed ? <ErrorBox retry={load} /> : items.length === 0 ? <Empty title="Chưa có gói phù hợp" text="Hãy thử một môn học khác." /> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{items.map(item => <Card key={item.itemId} item={item} />)}</div>}</section></Shell>;
}

function MarketplacePackCard({ item }: { item: PurchasedMarketplacePack }) {
  return <Link to={`/marketplace/items/${item.itemId}`} className="group relative flex min-h-[21rem] flex-col overflow-hidden rounded-[1.75rem] border border-[#EFE7DE] bg-[#FFFEFC] p-5 shadow-[0_16px_45px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1.5 hover:border-orange-200 hover:shadow-[0_24px_55px_rgba(194,65,12,0.12)]">
    <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#FF6B00] via-[#FF9A3C] to-amber-300 opacity-70 transition group-hover:opacity-100" />
    <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-orange-100/60 blur-3xl transition duration-500 group-hover:scale-125" />
    <div className="relative flex items-start justify-between gap-3"><span className="rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-[#FF6B00]">{item.subject}</span><span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-100 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{item.averageRating.toFixed(1)} <span className="font-medium text-slate-400">({item.reviewCount})</span></span></div>
    <h2 className="relative mt-5 line-clamp-2 text-xl font-black leading-7 tracking-[-0.02em] text-slate-950 transition group-hover:text-[#C2410C]">{item.title}</h2>
    <p className="relative mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{item.description}</p>
    <div className="relative mt-5 flex items-center gap-2.5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-950 text-xs font-black uppercase text-white">{item.creatorName?.charAt(0) || "S"}</span><span className="min-w-0"><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Creator</span><span className="block truncate text-xs font-bold text-slate-700">{item.creatorName}</span></span></div>
    <div className="relative mt-4 grid grid-cols-3 divide-x divide-orange-100 rounded-2xl border border-orange-100 bg-orange-50/55 py-3 text-center text-[11px] font-semibold text-slate-500"><span><b className="block text-base font-black text-slate-950">{item.chapterCount}</b>chương</span><span><b className="block text-base font-black text-slate-950">{item.quizCount}</b>quiz</span><span><b className="block text-base font-black text-slate-950">{item.questionCount}</b>câu hỏi</span></div>
    <div className="relative mt-auto flex items-center justify-between pt-5"><span className="rounded-full bg-amber-50 px-3 py-2 text-sm"><Coin value={item.priceCoins} /></span><span className="grid h-10 w-10 place-items-center rounded-full bg-slate-950 text-white transition duration-300 group-hover:translate-x-1 group-hover:bg-[#FF6B00]"><ArrowRight className="h-4 w-4" /></span></div>
  </Link>;
}

function FeaturedMarketplacePackCard({ item }: { item: PurchasedMarketplacePack }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={reduceMotion ? undefined : { y: -5 }}
      transition={{ type: "spring", stiffness: 250, damping: 24 }}
      className="rounded-[2rem]"
    >
      <Link to={`/marketplace/items/${item.itemId}`} className="group relative grid overflow-hidden rounded-[2rem] border border-[#FFE1C7] bg-[#FFFEFC] shadow-[0_22px_60px_rgba(255,107,0,0.08)] transition duration-300 hover:border-[#FFC993] hover:shadow-[0_30px_72px_rgba(255,107,0,0.13)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 md:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
        <div className="pointer-events-none absolute inset-x-10 top-0 z-10 h-px bg-gradient-to-r from-transparent via-[#FF8A32]/70 to-transparent" />
        <div className="relative flex min-h-[22rem] flex-col overflow-hidden p-7 sm:p-9">
          <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-[#FFE8D4]/75 blur-3xl transition duration-700 group-hover:scale-110" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-44 w-44 rounded-full bg-[#FFF4D9]/75 blur-3xl" />

          <div className="relative flex flex-wrap items-center gap-2">
            <span className="rounded-xl bg-gradient-to-r from-[#FF7A18] to-[#F45D22] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_8px_18px_rgba(255,107,0,0.22)]">Nổi bật</span>
            <span className="rounded-xl border border-[#FFE0C2] bg-white/90 px-3 py-1.5 text-xs font-bold text-[#DC5A00] shadow-[0_5px_14px_rgba(255,107,0,0.06)]">{item.subject}</span>
          </div>

          <h2 className="relative mt-7 max-w-2xl text-2xl font-black leading-tight tracking-[-0.03em] text-slate-950 transition-colors duration-300 group-hover:text-[#E85F00] sm:text-3xl">{item.title}</h2>
          <p className="relative mt-3 max-w-2xl line-clamp-3 text-sm leading-7 text-slate-600">{item.description}</p>

          <div className="relative mt-auto flex flex-wrap items-center justify-between gap-4 pt-7">
            <span className="flex min-w-0 items-center gap-2.5 text-xs font-semibold text-slate-500">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#FFF4E9] to-[#FFE4CA] font-black uppercase text-[#F06414] ring-1 ring-[#FFD7B4] shadow-[0_7px_18px_rgba(255,107,0,0.09)]">{item.creatorName?.charAt(0) || "S"}</span>
              <span className="min-w-0"><span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Creator</span><span className="block truncate font-bold text-slate-700">{item.creatorName}</span></span>
            </span>
            <span className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF7817] to-[#F45A1C] px-4 py-2.5 text-xs font-bold text-white shadow-[0_9px_22px_rgba(255,107,0,0.2)] transition duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[0_13px_28px_rgba(255,107,0,0.28)] group-active:translate-y-0">Khám phá pack <ArrowRight className="h-4 w-4 transition duration-300 group-hover:translate-x-1" /></span>
          </div>
        </div>

        <div className="relative flex flex-col justify-between overflow-hidden border-t border-[#FFE1C7] bg-[radial-gradient(circle_at_90%_0%,#FFE2C5_0%,transparent_38%),linear-gradient(145deg,#FFF9F3_0%,#FFF2E7_100%)] p-6 md:border-l md:border-t-0 sm:p-7">
          <motion.div animate={reduceMotion ? undefined : { x: [0, -10, 0], y: [0, 8, 0], scale: [1, 1.08, 1] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border-[42px] border-[#FFB978]/25" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 rounded-full bg-white/75 blur-3xl" />
          <div className="pointer-events-none absolute right-9 top-10 h-1.5 w-1.5 rounded-full bg-[#FF8A32]/50 shadow-[18px_12px_0_rgba(255,138,50,0.25),36px_-4px_0_rgba(255,138,50,0.18)]" />

          <div className="relative">
            <div className="flex items-center justify-between">
              <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#E35D00]">Tổng quan nội dung</p><p className="mt-1 text-xs font-medium text-slate-500">Thông tin trong Quiz Pack</p></div>
              <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#FFDBBA] bg-white/90 text-[#FF6B00] shadow-[0_7px_18px_rgba(255,107,0,0.09)] transition duration-300 group-hover:-rotate-3 group-hover:scale-105"><BookOpen className="h-4.5 w-4.5" /></span>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2">
              {[{ value: item.chapterCount, label: "chương" }, { value: item.quizCount, label: "quiz" }, { value: item.questionCount, label: "câu hỏi" }].map((stat, index) => (
                <motion.div key={stat.label} initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={reduceMotion ? undefined : { y: -3, scale: 1.02 }} transition={{ delay: 0.08 * index }} className="rounded-2xl border border-[#FFE0C5] bg-white/90 px-2 py-4 text-center shadow-[0_8px_20px_rgba(255,107,0,0.05)]">
                  <b className="block text-xl font-black tabular-nums text-slate-950">{stat.value}</b>
                  <span className="mt-1 block text-[10px] font-semibold text-slate-500">{stat.label}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="relative mt-7 flex items-center justify-between gap-3 border-t border-orange-100 pt-5">
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-700"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{item.averageRating.toFixed(1)} <span className="font-medium text-slate-400">({item.reviewCount})</span></span>
            <span className="rounded-xl border border-[#FFD8B5] bg-white px-3 py-2 text-sm shadow-[0_6px_16px_rgba(255,107,0,0.07)] [&_span]:text-[#E85F00]"><Coin value={item.priceCoins} /></span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

function MarketplaceCatalogSimple() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSubject = searchParams.get("subject") || "";
  const [items, setItems] = useState<PurchasedMarketplacePack[]>([]);
  const [input, setInput] = useState(initialSubject);
  const [subject, setSubject] = useState(initialSubject);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const load = useCallback(async () => { setLoading(true); setFailed(false); try { setItems(await marketplaceService.listItems(subject || undefined)); } catch { setFailed(true); } finally { setLoading(false); } }, [subject]);
  useEffect(() => { void load(); }, [load]);
  const submitSearch = (event: ReactFormEvent) => { event.preventDefault(); const next = input.trim(); setSubject(next); setSearchParams(next ? { subject: next } : {}); };
  const clearSearch = () => { setInput(""); setSubject(""); setSearchParams({}); };

  return <Shell>
    <section className="rounded-2xl bg-gradient-to-br from-violet-700 to-blue-600 px-6 py-6 text-white sm:px-8 sm:py-7"><div className="max-w-3xl"><p className="text-xs font-bold tracking-[0.12em] text-violet-100">SKILLSPRINT MARKETPLACE</p><h1 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">Tìm bộ học liệu phù hợp với mục tiêu của bạn.</h1><p className="mt-2 text-sm text-white/80">Khám phá các Quiz Pack do Creator chia sẻ từ workspace thực tế.</p><form onSubmit={submitSearch} className="mt-5 flex max-w-2xl flex-col gap-2 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" /><input value={input} onChange={event => setInput(event.target.value)} placeholder="Tìm theo môn học" className="h-11 w-full rounded-xl bg-white pl-11 pr-3 text-sm text-slate-900 outline-none" /></div><button className="h-11 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white">Tìm</button></form></div></section>
    <section className="mt-7"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-black">Gói học liệu</h2><p className="mt-1 text-sm text-slate-500">{subject ? `Kết quả theo môn học: ${subject}` : "Chọn một gói để xem trước nội dung."}</p></div>{subject && <button type="button" onClick={clearSearch} className="rounded-lg border border-orange-200 px-3 py-2 text-sm font-bold text-[#FF6B00]">Xóa lọc</button>}</div>{loading ? <Loading /> : failed ? <ErrorBox retry={load} /> : items.length === 0 ? <Empty title="Chưa có gói phù hợp" text="Hãy thử một môn học khác." /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map(item => <MarketplacePackCard key={item.itemId} item={item} />)}</div>}</section>
  </Shell>;
}

export function MarketplaceCatalog() {
  const reduceMotion = useReducedMotion();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSubject = searchParams.get("subject") || "";
  const [items, setItems] = useState<PurchasedMarketplacePack[]>([]);
  const [input, setInput] = useState(initialSubject);
  const [subject, setSubject] = useState(initialSubject);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const load = useCallback(async () => { setLoading(true); setFailed(false); try { setItems(await marketplaceService.listItems(subject || undefined)); } catch { setFailed(true); } finally { setLoading(false); } }, [subject]);
  useEffect(() => { void load(); }, [load]);
  const submitSearch = (event: ReactFormEvent) => { event.preventDefault(); const next = input.trim(); setSubject(next); setSearchParams(next ? { subject: next } : {}); };
  const clearSearch = () => { setInput(""); setSubject(""); setSearchParams({}); };
  const questionTotal = items.reduce((total, item) => total + item.questionCount, 0);

  return <Shell>
    <section className="group relative isolate overflow-hidden rounded-[2rem] border border-orange-100 bg-[#FFFEFC]/95 shadow-[0_24px_70px_rgba(15,23,42,0.09)] backdrop-blur-sm">
      <div className="pointer-events-none absolute -right-32 -top-40 -z-10 h-[28rem] w-[28rem] rounded-full bg-orange-200/55 blur-3xl transition duration-700 group-hover:scale-110" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 -z-10 h-52 w-52 rounded-full bg-amber-100/70 blur-3xl" />
      <div className="grid gap-8 px-6 py-8 sm:px-9 sm:py-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.65fr)] lg:items-end lg:gap-12 lg:px-12 lg:py-12">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50/80 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.17em] text-[#FF6B00]"><Sparkles className="h-3.5 w-3.5" />SkillSprint Marketplace</div>
          <h1 className="mt-5 max-w-3xl text-3xl font-black leading-[1.1] tracking-[-0.035em] text-slate-950 sm:text-4xl lg:text-5xl">Học đúng trọng tâm.<br /><span className="text-[#FF6B00]">Tiến bộ nhanh hơn.</span></h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">Quiz Pack thực tế từ Creator, có nội dung xem trước trước khi mua.</p>
          <form onSubmit={submitSearch} className="mt-6 flex max-w-2xl flex-col gap-2 rounded-2xl border border-[#F1E4D8] bg-white/90 p-2 shadow-[0_14px_36px_rgba(15,23,42,0.08)] backdrop-blur sm:flex-row">
            <div className="relative flex-1"><Search className="absolute left-4 top-3.5 h-4 w-4 text-[#FF6B00]" /><input value={input} onChange={event => setInput(event.target.value)} placeholder="Tìm theo môn học" className="h-11 w-full rounded-xl bg-[#FCFCFB] pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-orange-100" /></div>
            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#FF6B00] px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(255,107,0,0.16)] transition hover:-translate-y-0.5 hover:bg-[#E85F00] hover:shadow-[0_10px_24px_rgba(255,107,0,0.2)] active:translate-y-0">Tìm pack<ArrowRight className="h-4 w-4" /></button>
          </form>
        </div>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 18, rotate: 1.2 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
          className="relative mx-auto w-full max-w-sm lg:mx-0"
        >
          <motion.div
            animate={reduceMotion ? undefined : { x: [0, -10, 0], y: [0, 8, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-100/70 blur-3xl"
          />
          <motion.div
            whileHover={reduceMotion ? undefined : { y: -6, rotate: -0.35 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="group/library relative overflow-hidden rounded-[1.65rem] border border-orange-100 bg-[#FFFEFC]/95 p-5 text-slate-950 shadow-[0_20px_48px_rgba(71,50,35,0.09)] backdrop-blur sm:p-6"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-orange-100" />
            <motion.div animate={reduceMotion ? undefined : { scaleX: [0.7, 1, 0.7], opacity: [0.65, 1, 0.65] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }} className="pointer-events-none absolute left-0 top-0 h-1 w-28 origin-left rounded-r-full bg-[#E45F2A]" />
            <motion.div
              animate={reduceMotion ? undefined : { opacity: [0.18, 0.38, 0.18], scale: [0.9, 1.12, 0.9] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-orange-100 blur-3xl"
            />
            <div className="relative flex items-center justify-between gap-4">
              <motion.span
                animate={reduceMotion ? undefined : { y: [0, -3, 0], rotate: [0, -2, 0] }}
                transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
                className="grid h-11 w-11 place-items-center rounded-2xl border border-orange-100 bg-[#FFF1E8] text-[#D9541E] shadow-[0_7px_16px_rgba(217,84,30,0.1)]"
              ><ShoppingBag className="h-5 w-5" /></motion.span>
              <span className="inline-flex items-center gap-2 rounded-lg border border-orange-100 bg-[#FFF9F5] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#C84E20]"><motion.span animate={reduceMotion ? undefined : { opacity: [0.45, 1, 0.45], scale: [0.8, 1.15, 0.8] }} transition={{ duration: 2, repeat: Infinity }} className="h-1.5 w-1.5 rounded-full bg-[#E45F2A]" />Live library</span>
            </div>
            <p className="relative mt-6 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Kho học liệu</p>
            <p className="relative mt-1 text-2xl font-black tracking-[-0.03em] text-slate-900">Học theo cách của bạn</p>
            <p className="relative mt-2 text-[11px] font-medium leading-5 text-slate-500">Theo dõi nội dung hiện có trong Marketplace.</p>
            <div className="relative mt-5 grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-[0_8px_20px_rgba(71,50,35,0.04)] transition duration-300 group-hover/library:-translate-y-0.5 group-hover/library:border-orange-100"><div className="flex items-center justify-between gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-slate-500"><ShoppingBag className="h-3.5 w-3.5" /></span><motion.p key={`packs-${loading}-${items.length}`} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="text-2xl font-black tabular-nums text-slate-950">{loading ? "–" : items.length}</motion.p></div><p className="mt-3 text-[10px] font-bold text-slate-500">Quiz Pack</p></div>
              <div className="rounded-2xl border border-orange-100 bg-[#FFF6F0] p-3.5 shadow-[0_8px_20px_rgba(217,84,30,0.05)] transition duration-300 group-hover/library:-translate-y-0.5 group-hover/library:border-orange-200"><div className="flex items-center justify-between gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-white text-[#D9541E] shadow-sm"><FileQuestion className="h-3.5 w-3.5" /></span><motion.p key={`questions-${loading}-${questionTotal}`} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.06 }} className="text-2xl font-black tabular-nums text-[#D9541E]">{loading ? "–" : questionTotal}</motion.p></div><p className="mt-3 text-[10px] font-bold text-slate-500">Câu hỏi</p></div>
            </div>
            <div className="relative mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-[11px] font-semibold text-slate-500"><motion.span animate={reduceMotion ? undefined : { scale: [1, 1.1, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}><CheckCircle2 className="h-4 w-4 shrink-0 text-[#E45F2A]" /></motion.span>Xem trước · Đánh giá · Xếp hạng</div>
          </motion.div>
        </motion.div>
      </div>
    </section>

    <section className="mt-10 sm:mt-12">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#FF6B00]">Khám phá</p><h2 className="mt-2 text-2xl font-black tracking-[-0.025em] text-slate-950 sm:text-3xl">Gói học liệu đang có</h2><p className="mt-2 text-sm text-slate-500">{subject ? `Kết quả cho “${subject}”` : "Chọn một pack để xem nội dung và thử thách."}</p></div><div className="flex flex-wrap items-center gap-2">{!loading && !failed && <span className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 shadow-sm">{items.length} kết quả</span>}<button type="button" onClick={() => void load()} disabled={loading} className="inline-flex h-9 items-center gap-2 rounded-xl border border-orange-200 bg-white px-3.5 text-xs font-bold text-[#D9541E] shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-50 hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />Làm mới</button>{subject && <button type="button" onClick={clearSearch} className="rounded-xl border border-orange-200 bg-white px-3.5 py-2 text-xs font-bold text-[#FF6B00] shadow-sm transition hover:bg-orange-50">Xóa lọc</button>}</div></div>
      {loading ? <Loading /> : failed ? <ErrorBox retry={load} /> : items.length === 0 ? <div className="relative overflow-hidden rounded-[2rem] border border-dashed border-orange-200 bg-white/80 px-6 py-14 text-center shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur sm:py-16"><div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-orange-50 to-transparent" /><div className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-orange-100 bg-orange-50 text-[#FF6B00] shadow-sm"><ShoppingBag className="h-7 w-7" /></div><h3 className="relative mt-5 text-xl font-black text-slate-950">{subject ? "Chưa tìm thấy Quiz Pack" : "Marketplace đang được cập nhật"}</h3><p className="relative mt-2 text-sm text-slate-500">{subject ? "Thử một môn học hoặc từ khóa khác." : "Các Quiz Pack mới sẽ sớm xuất hiện tại đây."}</p>{subject && <button type="button" onClick={clearSearch} className="relative mt-6 inline-flex items-center gap-2 rounded-xl bg-[#FF6B00] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(255,107,0,0.22)] transition hover:-translate-y-0.5 hover:bg-[#E85F00]">Xem tất cả pack<ArrowRight className="h-4 w-4" /></button>}</div> : items.length === 1 ? <FeaturedMarketplacePackCard item={items[0]} /> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{items.map(item => <MarketplacePackCard key={item.itemId} item={item} />)}</div>}
    </section>
  </Shell>;
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

function Questions({ questions, answers, select }: { questions: MarketplaceQuestion[]; answers?: Record<string, string>; select?: (id: string, option: string) => void }) {
  return <div className="mt-4 space-y-4">{questions.map((q, i) => <fieldset key={q.questionId} className="rounded-xl border border-slate-200 bg-white p-4">
    <legend className="sr-only">Câu {i + 1}: {q.question}</legend>
    <p className="font-semibold leading-6">{i + 1}. {q.question}</p>
    <div className="mt-4 grid gap-2">{q.options.map(option => <label key={option.optionId} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm ${answers?.[q.questionId] === option.optionId ? "border-violet-500 bg-violet-50" : "border-slate-200"}`}><input type="radio" name={q.questionId} disabled={!select} checked={answers?.[q.questionId] === option.optionId} onChange={() => select?.(q.questionId, option.optionId)} /><span>{option.text}</span></label>)}</div>
  </fieldset>)}</div>;
}
function Content({ chapters, questions, preview = false }: { chapters: MarketplaceItemDetail["chapters"]; questions: MarketplaceQuestion[]; preview?: boolean }) { return <section className="mt-7"><h2 className="text-xl font-black">{preview ? "Xem trước nội dung" : "Nội dung gói học"}</h2><div className="mt-3 space-y-3">{chapters.map((chapter, i) => <article key={chapter.chapterId} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-bold uppercase tracking-wider text-violet-600">Chương {i + 1}</p><h3 className="mt-1 font-bold">{chapter.title}</h3>{chapter.summary && <p className="mt-2 text-sm leading-6 text-slate-600">{chapter.summary}</p>}</article>)}</div>{questions.length > 0 && <div className="mt-4 rounded-2xl bg-violet-50 p-5"><h3 className="font-black">{preview ? "Câu hỏi xem trước" : "Câu hỏi"}</h3><Questions questions={questions} /></div>}</section>; }

function ContentModern({ chapters, questions, preview = false }: { chapters: MarketplaceItemDetail["chapters"]; questions: MarketplaceQuestion[]; preview?: boolean }) {
  return <section className="mt-7"><div><h2 className="text-xl font-black">{preview ? "Xem trước nội dung" : "Nội dung gói học"}</h2><p className="mt-1 text-sm text-slate-500">{chapters.length} chương trong Quiz Pack</p></div>
    <div className="mt-3 space-y-3">{chapters.map((chapter, index) => <details key={chapter.chapterId} className="group rounded-2xl border border-slate-200 bg-white" open={index === 0}><summary className="flex cursor-pointer list-none items-center gap-3 p-4 sm:p-5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-orange-50 text-xs font-black text-[#FF6B00]">{index + 1}</span><span className="min-w-0 flex-1"><span className="block text-xs font-bold uppercase tracking-wide text-slate-400">Chương {index + 1}</span><span className="mt-1 block font-bold text-slate-900">{chapter.title}</span></span><ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition group-open:rotate-180" /></summary>{chapter.summary && <p className="border-t border-slate-100 px-5 py-4 text-sm leading-6 text-slate-600">{chapter.summary}</p>}</details>)}</div>
    {questions.length > 0 && <div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50/70 p-5"><div className="flex items-center gap-2"><FileQuestion className="h-5 w-5 text-[#FF6B00]" /><h3 className="font-black">{preview ? "Câu hỏi xem trước" : "Câu hỏi"}</h3></div><p className="mt-1 text-sm text-slate-600">Chỉ hiển thị nội dung xem trước; đáp án đúng không được công khai.</p><Questions questions={questions} /></div>}
  </section>;
}

function MarketplaceItemHeader({ item }: { item: MarketplaceItemDetail }) {
  return <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-orange-100 bg-gradient-to-r from-orange-50 via-white to-amber-50 px-6 py-6 sm:px-8 sm:py-7">
      <div className="flex flex-wrap items-center justify-between gap-3"><span className="rounded-full bg-orange-100 px-3 py-1.5 text-xs font-bold text-[#FF6B00]">{item.subject}</span><span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{item.averageRating.toFixed(1)} <span className="font-medium text-slate-400">({item.reviewCount} đánh giá)</span></span></div>
      <h1 className="mt-5 max-w-3xl text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">{item.title}</h1>
      <p className="mt-3 text-sm font-semibold text-slate-600">Tạo bởi <span className="text-slate-900">{item.creatorName}</span></p>
      <p className="mt-5 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-slate-600">{item.description}</p>
    </div>
    <div className="grid grid-cols-3 divide-x divide-slate-100 bg-white text-center"><div className="px-3 py-4"><p className="text-lg font-black text-slate-900">{item.chapterCount}</p><p className="mt-0.5 text-xs text-slate-500">chương</p></div><div className="px-3 py-4"><p className="text-lg font-black text-slate-900">{item.quizCount}</p><p className="mt-0.5 text-xs text-slate-500">quiz</p></div><div className="px-3 py-4"><p className="text-lg font-black text-slate-900">{item.questionCount}</p><p className="mt-0.5 text-xs text-slate-500">câu hỏi</p></div></div>
  </section>;
}

function MarketplaceItemPageLegacy() {
  const { itemId = "" } = useParams(); const go = useNavigate(); const [item, setItem] = useState<MarketplaceItemDetail | null>(null); const [board, setBoard] = useState<any[]>([]); const [reviews, setReviews] = useState<MarketplaceReview[]>([]); const [loading, setLoading] = useState(true); const [failed, setFailed] = useState(false); const [wallet, setWallet] = useState<MarketplaceWallet | null>(null); const [buyOpen, setBuyOpen] = useState(false); const [buying, setBuying] = useState(false); const [rating, setRating] = useState(0); const [comment, setComment] = useState(""); const [reviewOpen, setReviewOpen] = useState(false); const [reviewing, setReviewing] = useState(false);
  const load = useCallback(async () => { setLoading(true); setFailed(false); try { const [a,b,c] = await Promise.all([marketplaceService.getItem(itemId), marketplaceService.getLeaderboard(itemId), marketplaceService.getReviews(itemId)]); setItem(a); setBoard(b); setReviews(c); const mine = c.find(r => r.mine); if (mine) { setRating(mine.rating); setComment(mine.comment || ""); } } catch { setFailed(true); } finally { setLoading(false); } }, [itemId]);
  useEffect(() => { void load(); }, [load]);
  const openBuy = async () => { try { setWallet(await marketplaceService.getWallet()); setBuyOpen(true); } catch (e) { toast.error(message(e)); } };
  const buy = async () => { if (!item) return; setBuying(true); try { await marketplaceService.purchase(item.itemId); toast.success("Đã mua gói học liệu."); go(`/my-packs/${item.itemId}`); } catch (e) { toast.error(message(e)); } finally { setBuying(false); } };
  const saveReview = async () => { if (!item) return; setReviewing(true); try { await marketplaceService.review(item.itemId, { rating, comment: comment.trim() || undefined }); toast.success("Đã lưu đánh giá."); setReviewOpen(false); await load(); } catch (e) { toast.error(message(e)); } finally { setReviewing(false); } };
  if (loading) return <Shell><Loading /></Shell>; if (failed || !item) return <Shell><ErrorBox retry={load} /></Shell>;
  const shortage = Math.max(0, item.priceCoins - coinBalance(wallet));
  return <Shell><Link to="/marketplace" className="inline-flex items-center gap-1 text-sm font-bold text-violet-700"><ArrowLeft className="h-4 w-4" />Marketplace</Link><div className="mt-5 grid gap-7 lg:grid-cols-[minmax(0,1fr)_340px]"><div><section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8"><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">{item.subject}</span><h1 className="mt-4 text-3xl font-black">{item.title}</h1><p className="mt-2 text-sm text-slate-500">Bởi {item.creatorName}</p><p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-600">{item.description}</p><div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-600"><span>{item.chapterCount} chương</span><span>{item.quizCount} quiz</span><span>{item.questionCount} câu hỏi</span><span className="flex gap-1"><Stars value={item.averageRating} />{item.averageRating.toFixed(1)} ({item.reviewCount})</span></div></section><Content chapters={item.chapters} questions={item.previewQuestions} preview /><section className="mt-7"><h2 className="text-xl font-black">Top 10</h2><div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">{board.length ? board.slice(0,10).map((entry, i) => <div key={`${entry.learnerName}-${i}`} className="flex gap-3 border-b border-slate-100 p-4 last:border-0"><b className="text-violet-700">#{entry.rank ?? i + 1}</b><span className="flex-1 font-semibold">{entry.learnerName}</span><b>{entry.score} điểm</b></div>) : <p className="p-5 text-sm text-slate-500">Chưa có kết quả thử thách.</p>}</div></section><section className="mt-7"><h2 className="text-xl font-black">Đánh giá</h2><div className="mt-3 space-y-3">{reviews.length ? reviews.map((r, i) => <article key={r.reviewId || i} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex justify-between"><b>{r.reviewerName}</b><Stars value={r.rating} /></div>{r.comment && <p className="mt-3 text-sm text-slate-600">{r.comment}</p>}<p className="mt-3 text-xs text-slate-400">{date(r.createdAt)}</p></article>) : <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">Chưa có đánh giá.</p>}</div></section></div><aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 lg:sticky lg:top-24"><p className="text-sm text-slate-500">Giá gói học liệu</p><p className="mt-2 text-2xl"><Coin value={item.priceCoins} /></p><button onClick={openBuy} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-black text-white"><Coins className="h-4 w-4" />Mua bằng Coin</button><div className="mt-6 border-t pt-5"><h2 className="font-black">Đánh giá của bạn</h2><div className="mt-3 flex">{[1,2,3,4,5].map(n => <button key={n} onClick={() => setRating(n)} aria-label={`${n} sao`}><Star className={`h-6 w-6 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} /></button>)}</div><textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Nhận xét (không bắt buộc)" className="mt-3 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm" /><button onClick={() => rating ? setReviewOpen(true) : toast.message("Chọn số sao trước khi gửi đánh giá.")} className="mt-3 rounded-xl border border-violet-200 px-4 py-2 text-sm font-bold text-violet-700">{reviews.some(r => r.mine) ? "Cập nhật đánh giá" : "Gửi đánh giá"}</button></div></aside></div><Confirm open={buyOpen} title="Xác nhận mua gói" text={wallet ? `Số dư: ${fmt.format(coinBalance(wallet))} Coin.${shortage ? ` Còn thiếu ${fmt.format(shortage)} Coin. Nạp Coin qua SePay trong Ví Coin trước khi xác nhận.` : " Coin sẽ được trừ khi xác nhận."}` : "Đang kiểm tra ví."} button="Xác nhận mua" busy={buying} close={() => setBuyOpen(false)} submit={buy} /><Confirm open={reviewOpen} title="Gửi đánh giá" text="Bạn xác nhận lưu đánh giá này?" button="Lưu đánh giá" busy={reviewing} close={() => setReviewOpen(false)} submit={saveReview} /></Shell>;
}

export function MarketplaceItemPage() {
  const { itemId = "" } = useParams();
  const go = useNavigate();
  const [item, setItem] = useState<MarketplaceItemDetail | null>(null);
  const [reviews, setReviews] = useState<MarketplaceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [wallet, setWallet] = useState<MarketplaceWallet | null>(null);
  const [buyOpen, setBuyOpen] = useState(false);
  const [buying, setBuying] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const [nextItem, nextReviews] = await Promise.all([marketplaceService.getItem(itemId), marketplaceService.getReviews(itemId)]);
      setItem(nextItem);
      setReviews(nextReviews);
      const mine = nextReviews.find(review => review.mine);
      if (mine) { setRating(mine.rating); setComment(mine.comment || ""); }
    } catch { setFailed(true); } finally { setLoading(false); }
  }, [itemId]);

  useEffect(() => { void load(); }, [load]);
  const openBuy = async () => { try { setWallet(await marketplaceService.getWallet()); setBuyOpen(true); } catch (error) { toast.error(message(error)); } };
  const buy = async () => {
    if (!item) return;
    setBuying(true);
    try {
      if (item.versionId) await marketplaceService.purchaseVersion(item.versionId, crypto.randomUUID());
      else await marketplaceService.purchase(item.itemId);
      toast.success("Đã mua gói học liệu.");
      go(`/app/my-packs/${item.itemId}`);
    }
    catch (error) { toast.error(message(error)); } finally { setBuying(false); }
  };
  const saveReview = async () => {
    if (!item) return;
    setReviewing(true);
    try { await marketplaceService.review(item.itemId, { rating, comment: comment.trim() || undefined }); toast.success("Đã lưu đánh giá."); setReviewOpen(false); await load(); }
    catch (error) { toast.error(message(error)); } finally { setReviewing(false); }
  };

  if (loading) return <Shell><Loading /></Shell>;
  if (failed || !item) return <Shell><ErrorBox retry={load} /></Shell>;
  const shortage = Math.max(0, item.priceCoins - coinBalance(wallet));

  return <Shell>
    <Link to="/marketplace" className="inline-flex items-center gap-1 text-sm font-bold text-violet-700"><ArrowLeft className="h-4 w-4" />Marketplace</Link>
    <div className="mt-5 grid gap-7 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div>
        <MarketplaceItemHeader item={item} />
        <ContentModern chapters={item.chapters} questions={item.previewQuestions} preview />
        <div className="mt-7"><MarketplaceLeaderboardCard itemId={itemId} /></div>
        <section className="mt-7"><h2 className="text-xl font-black">Đánh giá</h2><div className="mt-3 space-y-3">{reviews.length ? reviews.map((review, index) => <article key={review.reviewId || index} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex justify-between"><b>{review.reviewerName}</b><Stars value={review.rating} /></div>{review.comment && <p className="mt-3 text-sm text-slate-600">{review.comment}</p>}<p className="mt-3 text-xs text-slate-400">{date(review.createdAt)}</p></article>) : <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">Chưa có đánh giá.</p>}</div></section>
      </div>
      <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 lg:sticky lg:top-24"><p className="text-sm text-slate-500">Giá gói học liệu</p><p className="mt-2 text-2xl"><Coin value={item.priceCoins} /></p><button onClick={openBuy} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-black text-white"><Coins className="h-4 w-4" />Mua bằng Coin</button><div className="mt-6 border-t pt-5"><h2 className="font-black">Đánh giá của bạn</h2><div className="mt-3 flex">{[1, 2, 3, 4, 5].map(number => <button key={number} onClick={() => setRating(number)} aria-label={`${number} sao`}><Star className={`h-6 w-6 ${number <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} /></button>)}</div><textarea value={comment} onChange={event => setComment(event.target.value)} placeholder="Nhận xét (không bắt buộc)" className="mt-3 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm" /><button onClick={() => rating ? setReviewOpen(true) : toast.message("Chọn số sao trước khi gửi đánh giá.")} className="mt-3 rounded-xl border border-violet-200 px-4 py-2 text-sm font-bold text-violet-700">{reviews.some(review => review.mine) ? "Cập nhật đánh giá" : "Gửi đánh giá"}</button></div></aside>
    </div>
    <Confirm open={buyOpen} title="Xác nhận mua gói" text={wallet ? `Số dư: ${fmt.format(coinBalance(wallet))} Coin.${shortage ? ` Còn thiếu ${fmt.format(shortage)} Coin. Nạp Coin qua SePay trong Ví Coin trước khi xác nhận.` : " Coin sẽ được trừ khi xác nhận."}` : "Đang kiểm tra ví."} button="Xác nhận mua" busy={buying} close={() => setBuyOpen(false)} submit={buy} />
    <Confirm open={reviewOpen} title="Gửi đánh giá" text="Bạn xác nhận lưu đánh giá này?" button="Lưu đánh giá" busy={reviewing} close={() => setReviewOpen(false)} submit={saveReview} />
  </Shell>;
}

export function MyPacksPage() {
  const [packs, setPacks] = useState<PurchasedMarketplacePack[]>([]); const [loading, setLoading] = useState(true); const [failed, setFailed] = useState(false);
  const load = useCallback(async () => { setLoading(true); setFailed(false); try { setPacks(await marketplaceService.getMyPacks()); } catch { setFailed(true); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  return <Shell><h1 className="text-3xl font-black">Gói học của tôi</h1><p className="mt-2 text-slate-500">Tiếp tục những gói học liệu bạn đã sở hữu.</p><div className="mt-7">{loading ? <Loading /> : failed ? <ErrorBox retry={load} /> : packs.length === 0 ? <Empty title="Bạn chưa mua gói nào" text="Khám phá Marketplace để tìm học liệu phù hợp." action={<Link to="/marketplace" className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white">Khám phá Marketplace</Link>} /> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{packs.map(pack => <article key={pack.itemId} className="rounded-3xl border border-slate-200 bg-white p-6"><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">{pack.subject}</span><h2 className="mt-4 text-xl font-black">{pack.title}</h2><p className="mt-2 line-clamp-2 text-sm text-slate-500">{pack.description}</p><Link to={`/my-packs/${pack.itemId}`} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white"><BookOpen className="h-4 w-4" />Học ngay</Link></article>)}</div>}</div></Shell>;
}

function Timer({ expiresAt, expire }: { expiresAt: string; expire: () => void }) { const [ms, setMs] = useState(() => Math.max(0, new Date(expiresAt).getTime() - Date.now())); useEffect(() => { const id = window.setInterval(() => { const next = Math.max(0, new Date(expiresAt).getTime() - Date.now()); setMs(next); if (!next) { clearInterval(id); expire(); } }, 1000); return () => clearInterval(id); }, [expiresAt, expire]); return <span className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-black text-amber-800"><Clock3 className="h-4 w-4" />{String(Math.floor(ms / 60000)).padStart(2,"0")}:{String(Math.floor(ms / 1000) % 60).padStart(2,"0")}</span>; }

type ActiveChallengeSession = ChallengeSession & { questions: MarketplaceQuestion[] };

export function MyPackLearningPage() {
  const { itemId = "" } = useParams(); const [pack, setPack] = useState<PurchasedPackDetail | null>(null); const [loading, setLoading] = useState(true); const [failed, setFailed] = useState(false); const [session, setSession] = useState<ActiveChallengeSession | null>(null); const [answers, setAnswers] = useState<Record<string,string>>({}); const [expired, setExpired] = useState(false); const [confirm, setConfirm] = useState(false); const [submitting, setSubmitting] = useState(false); const [result, setResult] = useState<ChallengeResult | null>(null);
  useEffect(() => { if (result) refreshMarketplaceLeaderboard(itemId); }, [itemId, result]);
  const load = useCallback(async () => { setLoading(true); setFailed(false); try { setPack(await marketplaceService.getMyPack(itemId)); } catch { setFailed(true); } finally { setLoading(false); } }, [itemId]); useEffect(() => { void load(); }, [load]);
  const start = async () => { if (!pack?.questions.length) { toast.error("Pack này chưa có câu hỏi để bắt đầu thử thách."); return; } try { const next = await marketplaceService.startChallenge(itemId); setSession({ ...next, questions: pack.questions }); setAnswers({}); setResult(null); setExpired(false); toast.success("Đã bắt đầu Full Pack Challenge."); } catch (e) { toast.error(message(e)); } };
  const submit = async () => { if (!session) return; setSubmitting(true); try { const next = await marketplaceService.submitChallenge(itemId, { sessionId: session.sessionId, answers: session.questions.map(q => ({ questionId: q.questionId, selectedOptionId: answers[q.questionId] })) }); setResult(next); setSession(null); setConfirm(false); toast.success("Đã nộp bài."); } catch (e) { toast.error(message(e)); } finally { setSubmitting(false); } };
  if (loading) return <Shell><Loading /></Shell>; if (failed || !pack) return <Shell><ErrorBox retry={load} /></Shell>;
  const done = session?.questions.every(q => answers[q.questionId]) || false;
  return <Shell><Link to="/my-packs" className="inline-flex items-center gap-1 text-sm font-bold text-violet-700"><ArrowLeft className="h-4 w-4" />Gói của tôi</Link><h1 className="mt-4 text-3xl font-black">{pack.title}</h1><p className="mt-2 text-slate-500">{pack.description}</p><Content chapters={pack.chapters} questions={pack.questions} /><section className="mt-7 rounded-3xl border border-violet-200 bg-violet-50 p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-xl font-black">Full Pack Challenge</h2><p className="mt-1 text-sm text-slate-600">Trả lời tất cả câu hỏi trước khi nộp. Thời gian được máy chủ quản lý.</p></div>{!session && <button onClick={start} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white"><Trophy className="h-4 w-4" />Bắt đầu Full Pack Challenge</button>}</div>{expired && <p className="mt-5 rounded-xl bg-amber-100 p-4 text-sm font-bold text-amber-900">Phiên đã hết hạn. Hãy bắt đầu một phiên mới.</p>}{session && !expired && <div className="mt-6"><div className="flex flex-wrap justify-between gap-3"><p className="text-sm text-slate-600">Bắt đầu: {date(session.startedAt)}</p><Timer expiresAt={session.expiresAt} expire={() => setExpired(true)} /></div><Questions questions={session.questions} answers={answers} select={(id, option) => setAnswers(a => ({ ...a, [id]: option }))} /><button onClick={() => setConfirm(true)} disabled={!done} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"><Send className="h-4 w-4" />Nộp bài ({Object.keys(answers).length}/{session.questions.length})</button>{!done && <p className="mt-2 text-xs text-slate-500">Bạn cần trả lời mọi câu hỏi trước khi nộp.</p>}</div>}{result && <div className="mt-6 rounded-2xl bg-white p-5"><div className="flex gap-3"><CheckCircle2 className="h-6 w-6 text-emerald-600" /><div><h3 className="font-black">Kết quả thử thách</h3><p className="text-sm text-slate-500">Hoàn thành {date(result.completedAt)}</p></div></div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Điểm",result.score],["Đúng",`${result.correctCount}/${result.questionCount}`],["Câu hỏi",result.questionCount],["Thời gian",`${result.durationSeconds}s`]].map(([k,v]) => <div key={String(k)} className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{k}</p><p className="font-black text-violet-700">{v}</p></div>)}</div></div>}</section><Confirm open={confirm} title="Xác nhận nộp bài" text="Bạn đã trả lời đủ tất cả câu hỏi. Bạn muốn gửi bài thử thách?" button="Nộp bài" busy={submitting} close={() => setConfirm(false)} submit={submit} /></Shell>;
}

const coinBalance = (wallet: MarketplaceWallet | null) => wallet?.balance ?? wallet?.balanceCoins ?? 0;
const isTopUpTransaction = (transaction: MarketplaceTransaction, paymentId: string) => transaction.referenceType === "COIN_TOP_UP" && transaction.referenceId === paymentId;
const transactionLabel = (transaction: MarketplaceTransaction) => transaction.referenceType === "COIN_TOP_UP" ? "Nạp Coin" : transaction.direction === "CREDIT" ? "Cộng Coin" : "Trừ Coin";

function CopyValue({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Không thể sao chép. Hãy sao chép thủ công.");
    }
  };

  return <button type="button" onClick={() => void copy()} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50"><Copy className="h-3.5 w-3.5" />{copied ? "Đã sao chép" : `Sao chép ${label}`}</button>;
}

function TopUpCountdown({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, new Date(expiresAt).getTime() - Date.now()));
  useEffect(() => {
    const intervalId = window.setInterval(() => setRemaining(Math.max(0, new Date(expiresAt).getTime() - Date.now())), 1000);
    return () => window.clearInterval(intervalId);
  }, [expiresAt]);
  return <b>{String(Math.floor(remaining / 60000)).padStart(2, "0")}:{String(Math.floor(remaining / 1000) % 60).padStart(2, "0")}</b>;
}

function CoinTopUpDialog({ payment, state, cancelling, close, cancel }: { payment: CoinTopUpPayment; state: "pending" | "success" | "expired"; cancelling: boolean; close: () => void; cancel: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="coin-top-up-title">
    <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-white p-5 shadow-2xl sm:rounded-[2rem] sm:p-7">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-[#FF6B00]">Nạp Coin qua SePay</p><h2 id="coin-top-up-title" className="mt-2 text-2xl font-black text-slate-950">{state === "success" ? "Nạp Coin thành công" : state === "expired" ? "Giao dịch đã hết hạn" : "Chuyển khoản để nạp Coin"}</h2></div><button type="button" onClick={close} aria-label="Đóng" className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"><X className="h-4 w-4" /></button></div>
      {state === "success" ? <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950"><CheckCircle2 className="h-7 w-7 text-emerald-600" /><p className="mt-3 font-black">{fmt.format(payment.coinAmount)} Coin đã được cộng vào ví.</p><p className="mt-1 text-sm">Số dư và lịch sử giao dịch đã được làm mới.</p></div> : state === "expired" ? <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950"><p className="font-black">Mã thanh toán này không còn hiệu lực.</p><p className="mt-1 text-sm">Hãy đóng cửa sổ và tạo một giao dịch nạp Coin mới nếu vẫn cần nạp.</p></div> : <><div className="mt-6 grid gap-4 rounded-2xl border border-orange-100 bg-orange-50/70 p-4 sm:grid-cols-[150px_1fr]"><div className="grid min-h-36 place-items-center overflow-hidden rounded-xl bg-white p-2"><img src={payment.qrUrl} alt="Mã QR thanh toán SePay" className="h-32 w-32 object-contain" /></div><div><p className="text-sm font-bold text-slate-600">Nội dung thanh toán</p><p className="mt-1 break-all text-lg font-black text-slate-950">{payment.paymentCode}</p><div className="mt-2"><CopyValue value={payment.paymentCode} label="mã" /></div><p className="mt-4 text-sm text-slate-600">Cần chuyển đúng</p><p className="mt-1 text-2xl font-black text-[#FF6B00]">{fmt.format(payment.amount)} ₫</p><p className="mt-1 text-sm font-semibold text-slate-700">Nhận {fmt.format(payment.coinAmount)} Coin</p></div></div>
      <dl className="mt-4 grid gap-3 rounded-2xl border border-slate-200 p-4 text-sm"><div><dt className="text-slate-500">Ngân hàng</dt><dd className="mt-1 font-black text-slate-950">{payment.bank.bankCode}</dd></div><div><dt className="text-slate-500">Số tài khoản</dt><dd className="mt-1 flex flex-wrap items-center gap-2 font-black text-slate-950"><span>{payment.bank.accountNumber}</span><CopyValue value={payment.bank.accountNumber} label="STK" /></dd></div><div><dt className="text-slate-500">Chủ tài khoản</dt><dd className="mt-1 font-black text-slate-950">{payment.bank.accountName}</dd></div></dl>
      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950"><LoaderCircle className="mt-0.5 h-4 w-4 shrink-0 animate-spin" /><p>Đang chờ SePay xác nhận. Ví sẽ tự động cập nhật sau khi thanh toán thành công. Mã hết hạn sau <TopUpCountdown expiresAt={payment.expiredAt} />.</p></div><button type="button" onClick={cancel} disabled={cancelling} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 text-sm font-black text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50">{cancelling ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}{cancelling ? "Đang hủy giao dịch..." : "Hủy giao dịch này"}</button></>}</div>
  </div>;
}

export function WalletPage() {
  const [wallet, setWallet] = useState<MarketplaceWallet | null>(null);
  const [transactions, setTransactions] = useState<MarketplaceTransaction[]>([]);
  const [packages, setPackages] = useState<CoinTopUpPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packagesError, setPackagesError] = useState(false);
  const [creatingTopUp, setCreatingTopUp] = useState<string | null>(null);
  const [cancellingTopUp, setCancellingTopUp] = useState(false);
  const [payment, setPayment] = useState<CoinTopUpPayment | null>(null);
  const [paymentState, setPaymentState] = useState<"pending" | "success" | "expired">("pending");
  const [dialogOpen, setDialogOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  const loadWallet = useCallback(async () => {
    const [nextWallet, nextTransactions] = await Promise.all([marketplaceService.getWallet(), marketplaceService.getTransactions()]);
    setWallet(nextWallet);
    setTransactions(nextTransactions);
    return { nextWallet, nextTransactions };
  }, []);
  const loadPackages = useCallback(async () => {
    setPackagesLoading(true);
    setPackagesError(false);
    try { setPackages(await marketplaceService.getTopUpPackages()); }
    catch { setPackagesError(true); }
    finally { setPackagesLoading(false); }
  }, []);
  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try { await loadWallet(); }
    catch { setFailed(true); }
    finally { setLoading(false); }
  }, [loadWallet]);

  useEffect(() => { void load(); void loadPackages(); }, [load, loadPackages]);
  useEffect(() => {
    if (!payment || paymentState !== "pending") return;
    let active = true;
    const refreshPayment = async () => {
      if (new Date(payment.expiredAt).getTime() <= Date.now()) {
        if (active) setPaymentState("expired");
        return;
      }
      try {
        const { nextTransactions } = await loadWallet();
        if (active && nextTransactions.some(transaction => isTopUpTransaction(transaction, payment.paymentId))) {
          setPaymentState("success");
          setDialogOpen(true);
          toast.success(`Đã nạp ${fmt.format(payment.coinAmount)} Coin vào ví.`);
        }
      } catch {
        // Keep the pending payment visible; the next interval can recover from a transient request failure.
      }
    };
    const intervalId = window.setInterval(() => void refreshPayment(), 5000);
    const expiryId = window.setTimeout(() => { if (active) setPaymentState("expired"); }, Math.max(0, new Date(payment.expiredAt).getTime() - Date.now()));
    return () => { active = false; window.clearInterval(intervalId); window.clearTimeout(expiryId); };
  }, [loadWallet, payment, paymentState]);

  const createTopUp = async (packageKey: string) => {
    setCreatingTopUp(packageKey);
    try {
      const nextPayment = await marketplaceService.createSepayTopUp(packageKey);
      setPayment(nextPayment);
      setPaymentState("pending");
      setDialogOpen(true);
    } catch (error) {
      toast.error(message(error));
    } finally {
      setCreatingTopUp(null);
    }
  };

  const cancelTopUp = async () => {
    if (!payment) return;
    setCancellingTopUp(true);
    try {
      await marketplaceService.cancelSepayTopUp(payment.paymentId);
      setPayment(null);
      setPaymentState("pending");
      setDialogOpen(false);
      toast.success("Đã hủy giao dịch nạp Coin. Bạn có thể chọn gói khác ngay.");
    } catch (error) {
      toast.error(message(error));
    } finally {
      setCancellingTopUp(false);
    }
  };

  return <Shell>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#FF6B00]">SkillSprint Wallet</p><h1 className="mt-2 text-3xl font-black tracking-[-0.035em] text-slate-950 sm:text-4xl">Ví Coin</h1><p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">Nạp Coin qua SePay và quản lý lịch sử giao dịch ở một nơi.</p></div><button type="button" onClick={() => void load()} disabled={loading} className="inline-flex h-11 w-fit items-center gap-2 rounded-xl border border-orange-200 bg-white px-4 text-sm font-bold text-[#FF6B00] shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-50 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Làm mới số dư</button></div>
    {loading ? <div className="mt-7"><Loading /></div> : failed ? <div className="mt-7"><ErrorBox retry={load} /></div> : <>
      <motion.section initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 180, damping: 24 }} className="relative mt-7 overflow-hidden rounded-[2rem] border border-[#FFB77A] bg-[radial-gradient(circle_at_84%_16%,rgba(255,230,201,0.42),transparent_22%),radial-gradient(circle_at_38%_120%,rgba(255,206,145,0.22),transparent_35%),linear-gradient(112deg,#FF6B00_0%,#FF7C16_46%,#FF9A3C_100%)] p-6 text-white shadow-[0_24px_60px_rgba(255,107,0,0.22)] sm:p-8"><div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,0.11)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.11)_1px,transparent_1px)] [background-size:34px_34px] [mask-image:linear-gradient(90deg,transparent,black_48%,transparent)]" /><motion.div aria-hidden="true" className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[28px] border-white/15" animate={reduceMotion ? undefined : { rotate: 360, scale: [1, 1.08, 1] }} transition={{ rotate: { duration: 24, repeat: Infinity, ease: "linear" }, scale: { duration: 5, repeat: Infinity, ease: "easeInOut" } }} /><motion.div aria-hidden="true" className="absolute right-[24%] top-8 hidden h-16 w-16 rounded-2xl border border-white/20 bg-white/10 p-4 text-white shadow-[0_14px_30px_rgba(132,47,10,0.18)] lg:grid lg:place-items-center" animate={reduceMotion ? undefined : { y: [0, -12, 0], rotate: [-4, 4, -4] }} transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}><Coins className="h-6 w-6" /></motion.div><div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.15em] text-white/75">Số dư khả dụng</p><motion.p initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, type: "spring", stiffness: 220, damping: 20 }} className="mt-2 text-4xl font-black tracking-[-0.05em] tabular-nums sm:text-5xl">{fmt.format(coinBalance(wallet))}<span className="ml-2 text-xl font-bold text-white/80 sm:text-2xl">Coin</span></motion.p><p className="mt-3 max-w-xl text-sm font-medium leading-6 text-white/85">1 Coin = 1 ₫ · Chọn gói bên dưới để tạo mã thanh toán SePay.</p></div><motion.div whileHover={reduceMotion ? undefined : { y: -3, scale: 1.02 }} className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/[0.1] px-4 py-3 backdrop-blur-sm"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 text-white"><WalletCards className="h-5 w-5" /></span><span><b className="block text-sm">Thanh toán bảo mật</b><span className="text-xs text-white/75">Xác nhận tự động qua SePay</span></span></motion.div></div></motion.section>
      {payment && paymentState === "pending" && !dialogOpen && <button type="button" onClick={() => setDialogOpen(true)} className="mt-5 flex w-full items-center justify-between gap-4 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-left text-sky-950 shadow-sm transition hover:bg-sky-100"><span><b>Đang chờ xác nhận nạp {fmt.format(payment.coinAmount)} Coin</b><span className="mt-1 block text-sm">Mở lại thông tin chuyển khoản và mã thanh toán.</span></span><ArrowRight className="h-5 w-5 shrink-0" /></button>}
      <section className="mt-9"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.15em] text-[#FF6B00]">Chọn mệnh giá</p><h2 className="mt-2 text-2xl font-black tracking-[-0.025em] text-slate-950">Nạp Coin</h2><p className="mt-1 text-sm text-slate-500">Chọn gói phù hợp với nhu cầu của bạn.</p></div><button type="button" onClick={() => void loadPackages()} disabled={packagesLoading} className="inline-flex items-center gap-2 text-sm font-bold text-[#FF6B00] transition hover:text-[#E85F00] disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${packagesLoading ? "animate-spin" : ""}`} />Tải lại gói</button></div>{packagesLoading ? <div className="mt-5"><Loading /></div> : packagesError ? <div className="mt-5"><ErrorBox retry={loadPackages} /></div> : packages.length === 0 ? <div className="mt-5 rounded-3xl border border-dashed border-orange-200 bg-white p-8 text-sm text-slate-500">Hiện chưa có gói Coin khả dụng.</div> : <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{packages.map((item, index) => <motion.article key={item.packageKey} initial={reduceMotion ? false : { opacity: 0, y: 22, scale: 0.98 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, amount: 0.3 }} transition={{ delay: index * 0.07, type: "spring", stiffness: 210, damping: 22 }} whileHover={reduceMotion ? undefined : { y: -8, scale: 1.012 }} whileTap={reduceMotion ? undefined : { scale: 0.985 }} className="group relative min-h-[17rem] overflow-hidden rounded-[1.75rem] border border-[#EFE7DE] bg-[#FFFEFC] p-5 shadow-[0_16px_45px_rgba(15,23,42,0.06)] transition hover:border-orange-200 hover:shadow-[0_24px_55px_rgba(194,65,12,0.12)]"><motion.div aria-hidden="true" className="pointer-events-none absolute -right-10 top-7 h-24 w-52 -rotate-[32deg] bg-gradient-to-r from-transparent via-orange-200/60 to-transparent blur-lg" animate={reduceMotion ? undefined : { x: ["-16%", "22%", "-16%"], opacity: [0.18, 0.8, 0.18] }} transition={{ duration: 6.8, repeat: Infinity, ease: "easeInOut", delay: index * 0.35 }} /><div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#FF6B00] via-[#FF9A3C] to-amber-300 opacity-0 transition duration-500 group-hover:opacity-100" /><div className="relative flex items-start justify-between gap-3"><motion.span whileHover={reduceMotion ? undefined : { rotate: [0, -8, 8, 0], scale: 1.08 }} transition={{ duration: 0.45 }} className="grid h-12 w-12 place-items-center rounded-2xl border border-orange-100 bg-orange-50 text-[#FF6B00] shadow-[0_10px_20px_rgba(255,107,0,0.1)]"><Coins className="h-6 w-6" /></motion.span><span className="rounded-full border border-orange-100 bg-white/80 px-2.5 py-1 text-[11px] font-black tracking-wide text-[#FF6B00] backdrop-blur-sm">{item.currency}</span></div><div className="relative mt-7"><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#FF6B00]">Coin credit</p><p className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950 tabular-nums">{fmt.format(item.coinAmount)} Coin</p><p className="mt-1 text-base font-bold text-slate-500 tabular-nums">{fmt.format(item.vndAmount)} ₫</p></div><div className="relative mt-5 h-px bg-gradient-to-r from-orange-100 via-orange-200/80 to-transparent" /><button type="button" onClick={() => void createTopUp(item.packageKey)} disabled={Boolean(creatingTopUp) || paymentState === "pending" && payment !== null} className="relative mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(105deg,#FF6B00_0%,#FF7C16_48%,#FF9A3C_100%)] px-4 text-sm font-black text-white shadow-[0_12px_22px_rgba(255,107,0,0.24)] transition hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50">{creatingTopUp === item.packageKey ? <LoaderCircle className="h-4 w-4 animate-spin" /> : paymentState === "pending" && payment ? "Đang có giao dịch chờ" : <><Coins className="h-4 w-4" />Nạp Coin <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>}</button></motion.article>)}</div>}</section>
      <section className="mt-10"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">Wallet activity</p><h2 className="mt-2 text-2xl font-black tracking-[-0.025em] text-slate-950">Giao dịch</h2></div><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">{transactions.length} giao dịch</span></div><div className="mt-4 overflow-x-auto rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]"><table className="w-full min-w-[640px] text-left text-sm"><thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-500"><tr><th className="p-4">Loại</th><th className="p-4">Số Coin</th><th className="p-4">Số dư sau</th><th className="p-4">Tham chiếu</th><th className="p-4">Thời gian</th></tr></thead><tbody>{transactions.length ? transactions.map(transaction => <tr key={transaction.transactionId} className="border-t border-slate-100 transition hover:bg-orange-50/40"><td className="p-4 font-bold text-slate-800">{transactionLabel(transaction)}</td><td className={`p-4 font-black ${transaction.direction === "CREDIT" ? "text-emerald-700" : "text-rose-700"}`}>{transaction.direction === "CREDIT" ? "+" : "−"}{fmt.format(transaction.amount)}</td><td className="p-4 font-semibold text-slate-700">{fmt.format(transaction.balanceAfter)}</td><td className="p-4 text-slate-600">{transaction.referenceId || transaction.referenceType}</td><td className="p-4 text-slate-500">{date(transaction.createdAt)}</td></tr>) : <tr><td colSpan={5} className="p-10 text-center text-slate-500">Chưa có giao dịch.</td></tr>}</tbody></table></div></section>
    </>}{dialogOpen && payment && <CoinTopUpDialog payment={payment} state={paymentState} cancelling={cancellingTopUp} close={() => setDialogOpen(false)} cancel={() => void cancelTopUp()} />}</Shell>;
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

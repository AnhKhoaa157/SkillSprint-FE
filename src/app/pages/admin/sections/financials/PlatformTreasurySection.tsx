import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Building2, Coins, RefreshCw, WalletCards } from "lucide-react";
import { toast } from "sonner";
import {
  getPlatformTreasuryEntries,
  getPlatformTreasurySummary,
  type PlatformTreasuryAsset,
  type PlatformTreasuryEntry,
  type PlatformTreasuryEntryType,
  type PlatformTreasurySummary,
} from "../../../../../api/admin";

const vnd = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const coin = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });

const ENTRY_LABELS: Record<PlatformTreasuryEntryType, string> = {
  COIN_TOP_UP_RECEIVED: "Nạp Coin thành công",
  SUBSCRIPTION_PAYMENT_RECEIVED: "Thanh toán gói dịch vụ",
  MARKETPLACE_COMMISSION_EARNED: "Hoa hồng Marketplace",
  MARKETPLACE_COMMISSION_REVERSED: "Hoàn hoa hồng Marketplace",
  CREATOR_PAYOUT_COMPLETED: "Chi trả Creator",
};

function formatOccurredAt(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function PlatformTreasurySection() {
  const [summary, setSummary] = useState<PlatformTreasurySummary | null>(null);
  const [entries, setEntries] = useState<PlatformTreasuryEntry[]>([]);
  const [asset, setAsset] = useState<PlatformTreasuryAsset | "ALL">("ALL");
  const [type, setType] = useState<PlatformTreasuryEntryType | "ALL">("ALL");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [nextSummary, page] = await Promise.all([
        getPlatformTreasurySummary(),
        getPlatformTreasuryEntries({ asset: asset === "ALL" ? undefined : asset, entryType: type === "ALL" ? undefined : type }),
      ]);
      setSummary(nextSummary);
      setEntries(page.items);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải sổ quỹ hệ thống.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [asset, type]); // Filters form the visible ledger query.

  const cards = summary ? [
    { label: "VND đã thu", value: vnd.format(summary.vndInflow), tone: "text-blue-700", icon: ArrowDownLeft, note: "Nạp Coin và thanh toán gói" },
    { label: "VND đã chi", value: vnd.format(summary.vndOutflow), tone: "text-rose-700", icon: ArrowUpRight, note: "Creator payout đã hoàn tất" },
    { label: "Vị thế VND nội bộ", value: vnd.format(summary.vndNetPosition), tone: "text-slate-950", icon: Building2, note: "Không phải số dư ngân hàng" },
    { label: "Hoa hồng Marketplace", value: `${coin.format(summary.commissionCoinNetPosition)} Coin`, tone: "text-emerald-700", icon: Coins, note: `Đã hoàn: ${coin.format(summary.commissionCoinReversed)} Coin` },
  ] : [];

  return <section id="platform-treasury-ledger" className="mt-6 scroll-mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#FF6B00]"><WalletCards className="h-3.5 w-3.5" />System treasury</span>
        <h2 className="mt-3 text-xl font-black tracking-[-0.025em] text-slate-950">Quỹ hệ thống</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Sổ đối soát nội bộ. VND vận hành và Coin commission luôn được theo dõi tách biệt.</p>
      </div>
      <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-orange-200 px-4 text-sm font-bold text-[#FF6B00] hover:bg-orange-50 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Làm mới</button>
    </div>

    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {loading && !summary ? Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-100" />) : cards.map(card => { const Icon = card.icon; return <article key={card.label} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wide text-slate-400">{card.label}</span><span className="rounded-xl bg-white p-2 shadow-sm"><Icon className={`h-4 w-4 ${card.tone}`} /></span></div><p className={`mt-5 text-xl font-black tracking-[-0.035em] ${card.tone}`}>{card.value}</p><p className="mt-1 text-xs text-slate-500">{card.note}</p></article>; })}
    </div>

    <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-black text-slate-900">Sổ giao dịch quỹ</h3><p className="mt-1 text-xs text-slate-500">Mỗi nghiệp vụ tài chính tạo một entry bất biến, có người xử lý nếu là thao tác thủ công.</p></div><div className="flex flex-wrap gap-2"><select value={asset} onChange={event => setAsset(event.target.value as PlatformTreasuryAsset | "ALL")} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"><option value="ALL">Tất cả tài sản</option><option value="VND">VND</option><option value="COIN">Coin</option></select><select value={type} onChange={event => setType(event.target.value as PlatformTreasuryEntryType | "ALL")} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"><option value="ALL">Tất cả nghiệp vụ</option>{Object.entries(ENTRY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div></div>
    <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-100"><table className="min-w-full divide-y divide-slate-100 text-left"><thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wide text-slate-400"><tr><th className="px-4 py-3">Thời điểm</th><th className="px-4 py-3">Nghiệp vụ</th><th className="px-4 py-3">Đối tác / xử lý</th><th className="px-4 py-3 text-right">Giá trị</th></tr></thead><tbody className="divide-y divide-slate-100 bg-white">{loading ? <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-400">Đang tải sổ quỹ…</td></tr> : entries.length === 0 ? <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-400">Chưa có giao dịch phù hợp.</td></tr> : entries.map(entry => <tr key={entry.entryId} className="hover:bg-orange-50/30"><td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{formatOccurredAt(entry.occurredAt)}</td><td className="px-4 py-3"><p className="text-sm font-bold text-slate-800">{ENTRY_LABELS[entry.entryType]}</p><p className="mt-0.5 text-xs text-slate-400">{entry.asset} · {entry.referenceType}</p></td><td className="px-4 py-3 text-sm text-slate-600"><p>{entry.counterpartyName ?? "Hệ thống"}</p>{entry.actorName && entry.actorName !== "SYSTEM" && <p className="mt-0.5 text-xs text-slate-400">Xử lý: {entry.actorName}</p>}</td><td className={`whitespace-nowrap px-4 py-3 text-right text-sm font-black ${entry.direction === "CREDIT" ? "text-emerald-700" : "text-rose-700"}`}>{entry.direction === "CREDIT" ? "+" : "−"}{entry.asset === "VND" ? vnd.format(entry.amount) : `${coin.format(entry.amount)} Coin`}</td></tr>)}</tbody></table></div>
  </section>;
}

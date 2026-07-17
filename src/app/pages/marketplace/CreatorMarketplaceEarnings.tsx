import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { BadgeCheck, BanknoteArrowDown, CheckCircle2, CircleAlert, ExternalLink, ImageUp, Landmark, LoaderCircle, RefreshCw, Upload, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { marketplaceService, type CreatorEarnings, type CreatorPayout, type CreatorPayoutDestination, type CreatorPayoutStatus } from "../../../api/marketplace";

const money = new Intl.NumberFormat("vi-VN");

const PAYOUT_STATUS: Record<CreatorPayoutStatus, { label: string; className: string }> = {
  REQUESTED: { label: "Đã gửi yêu cầu", className: "bg-amber-50 text-amber-800 ring-amber-200" },
  APPROVED: { label: "Đã duyệt", className: "bg-sky-50 text-sky-800 ring-sky-200" },
  PROCESSING: { label: "Đang chuyển khoản", className: "bg-violet-50 text-violet-800 ring-violet-200" },
  COMPLETED: { label: "Đã hoàn tất", className: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  REJECTED: { label: "Đã từ chối", className: "bg-rose-50 text-rose-800 ring-rose-200" },
  FAILED: { label: "Chuyển khoản lỗi", className: "bg-rose-50 text-rose-800 ring-rose-200" },
};

function date(value: string | null) {
  return value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Đã có lỗi xảy ra. Vui lòng thử lại.";
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: "orange" | "amber" | "slate" | "green" }) {
  const colors = {
    orange: "border-orange-100 bg-orange-50/75 text-[#D94E00]",
    amber: "border-amber-100 bg-amber-50/75 text-amber-800",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    green: "border-emerald-100 bg-emerald-50/75 text-emerald-700",
  } as const;
  return <div className={`rounded-2xl border p-4 ${colors[tone]}`}><p className="text-[11px] font-bold uppercase tracking-[0.12em] opacity-70">{label}</p><p className="mt-2 text-2xl font-black tabular-nums">{money.format(value)} <span className="text-sm">Coin</span></p></div>;
}

export default function CreatorMarketplaceEarnings() {
  const [earnings, setEarnings] = useState<CreatorEarnings | null>(null);
  const [destination, setDestination] = useState<CreatorPayoutDestination | null>(null);
  const [payouts, setPayouts] = useState<CreatorPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [savingDestination, setSavingDestination] = useState(false);
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [bankName, setBankName] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [amount, setAmount] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const [nextEarnings, nextDestination, nextPayouts] = await Promise.all([
        marketplaceService.getCreatorEarnings(),
        marketplaceService.getCreatorPayoutDestination(),
        marketplaceService.getCreatorPayouts(),
      ]);
      setEarnings(nextEarnings);
      setDestination(nextDestination);
      setPayouts(nextPayouts);
      setBankName(nextDestination?.bankName ?? "");
      setBankCode(nextDestination?.bankCode ?? "");
      setAccountHolder(nextDestination?.accountHolder ?? "");
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const onQrChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQrFile(event.target.files?.[0] ?? null);
  };

  const saveDestination = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!bankName.trim() || !accountHolder.trim()) {
      toast.error("Hãy nhập tên ngân hàng và tên chủ tài khoản.");
      return;
    }
    if (!qrFile) {
      toast.error("Hãy tải ảnh QR nhận tiền trước khi lưu. Ảnh QR mới được xác nhận lại mỗi lần cập nhật.");
      return;
    }

    setSavingDestination(true);
    try {
      const qrObjectKey = await marketplaceService.uploadCreatorPayoutQr(qrFile);
      const nextDestination = await marketplaceService.saveCreatorPayoutDestination({
        bankName: bankName.trim(),
        ...(bankCode.trim() ? { bankCode: bankCode.trim() } : {}),
        accountHolder: accountHolder.trim(),
        qrObjectKey,
      });
      setDestination(nextDestination);
      setQrFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success("Đã lưu thông tin nhận tiền.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSavingDestination(false);
    }
  };

  const requestPayout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      toast.error("Số Coin rút phải là số nguyên lớn hơn 0.");
      return;
    }
    if (!earnings || parsedAmount > earnings.availableAmount) {
      toast.error("Số Coin rút vượt quá số dư có thể rút.");
      return;
    }
    if (!destination) {
      toast.error("Hãy lưu thông tin nhận tiền trước khi tạo yêu cầu rút.");
      return;
    }

    setRequestingPayout(true);
    try {
      await marketplaceService.createCreatorPayout(parsedAmount);
      setAmount("");
      toast.success("Đã gửi yêu cầu rút tiền. Admin sẽ kiểm tra và chuyển khoản.");
      await load();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setRequestingPayout(false);
    }
  };

  if (loading) return <div className="min-h-full p-5 sm:p-8"><div className="mx-auto h-72 max-w-6xl animate-pulse rounded-3xl bg-slate-200" /></div>;
  if (failed || !earnings) return <div className="min-h-full p-5 sm:p-8"><div className="mx-auto max-w-xl rounded-3xl border border-rose-100 bg-white p-8 text-center shadow-sm"><CircleAlert className="mx-auto h-9 w-9 text-rose-500" /><h1 className="mt-4 text-xl font-black text-slate-900">Không thể tải thu nhập Creator</h1><button type="button" onClick={load} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#FF6B00] px-4 py-2.5 text-sm font-bold text-white"><RefreshCw className="h-4 w-4" />Thử lại</button></div></div>;

  return <main className="min-h-full bg-[#F8FAFC] p-4 text-slate-900 sm:p-7 lg:p-9">
    <div className="mx-auto max-w-6xl">
      <section className="relative overflow-hidden rounded-[2rem] border border-orange-100 bg-white p-6 shadow-[0_18px_60px_rgba(255,107,0,0.08)] sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-orange-100/70 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div><span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#FF6B00]"><WalletCards className="h-3.5 w-3.5" />Creator finance</span><h1 className="mt-4 text-3xl font-black tracking-[-0.035em] text-slate-950 sm:text-4xl">Thu nhập & rút tiền</h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">Theo dõi doanh thu Quiz Pack, lưu QR nhận tiền và gửi yêu cầu rút để Admin xử lý.</p></div>
          <button type="button" onClick={load} className="inline-flex h-10 w-fit items-center gap-2 rounded-xl border border-orange-200 bg-white px-4 text-sm font-bold text-[#FF6B00] transition hover:bg-orange-50"><RefreshCw className="h-4 w-4" />Làm mới</button>
        </div>
        <div className="relative mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Có thể rút" value={earnings.availableAmount} tone="orange" /><StatCard label="Đang chờ" value={earnings.pendingAmount} tone="amber" /><StatCard label="Đang giữ để rút" value={earnings.reservedAmount} tone="slate" /><StatCard label="Đã nhận" value={earnings.paidAmount} tone="green" /></div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-[#FF6B00]"><Landmark className="h-5 w-5" /></span><div><h2 className="font-black text-slate-950">Thông tin nhận tiền</h2><p className="mt-1 text-sm leading-5 text-slate-500">QR được dùng để Admin đối chiếu trước khi chuyển khoản thủ công.</p></div></div>
          <form className="mt-6 space-y-4" onSubmit={saveDestination}>
            <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold text-slate-700">Ngân hàng<input value={bankName} onChange={event => setBankName(event.target.value)} maxLength={120} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100" placeholder="VD: MB Bank" /></label><label className="text-sm font-bold text-slate-700">Mã ngân hàng <span className="font-normal text-slate-400">(không bắt buộc)</span><input value={bankCode} onChange={event => setBankCode(event.target.value)} maxLength={20} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100" placeholder="VD: MBB" /></label></div>
            <label className="block text-sm font-bold text-slate-700">Tên chủ tài khoản<input value={accountHolder} onChange={event => setAccountHolder(event.target.value)} maxLength={150} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100" placeholder="Nhập đúng tên nhận tiền" /></label>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onQrChange} />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-orange-200 bg-orange-50/45 p-4 text-left transition hover:bg-orange-50"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#FF6B00] shadow-sm"><ImageUp className="h-5 w-5" /></span><span className="min-w-0 flex-1"><b className="block text-sm text-slate-800">{qrFile ? qrFile.name : destination ? "Thay ảnh QR nhận tiền" : "Tải ảnh QR nhận tiền"}</b><span className="mt-1 block text-xs text-slate-500">JPEG, PNG hoặc WebP · tối đa 5 MB</span></span><Upload className="h-4 w-4 shrink-0 text-[#FF6B00]" /></button>
            {destination?.qrViewUrl && !qrFile && <a className="inline-flex items-center gap-1.5 text-sm font-bold text-[#FF6B00] hover:underline" href={destination.qrViewUrl} target="_blank" rel="noreferrer">Xem ảnh QR hiện tại <ExternalLink className="h-3.5 w-3.5" /></a>}
            <button type="submit" disabled={savingDestination} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-[#FF6B00] disabled:cursor-not-allowed disabled:opacity-50">{savingDestination ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}Lưu thông tin nhận tiền</button>
          </form>
        </section>
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><BanknoteArrowDown className="h-5 w-5" /></span><div><h2 className="font-black text-slate-950">Tạo yêu cầu rút</h2><p className="mt-1 text-sm leading-5 text-slate-500">Coin sẽ được giữ lại cho đến khi yêu cầu được xử lý.</p></div></div><form className="mt-6" onSubmit={requestPayout}><label className="text-sm font-bold text-slate-700">Số Coin muốn rút<input type="number" min="1" step="1" value={amount} onChange={event => setAmount(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 text-lg font-black tabular-nums outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100" placeholder="0" /></label><p className="mt-2 text-xs text-slate-500">Khả dụng: <b className="text-slate-800">{money.format(earnings.availableAmount)} Coin</b></p><button type="submit" disabled={requestingPayout || !destination || earnings.availableAmount <= 0} className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B00] px-5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(255,107,0,0.2)] transition hover:bg-[#E85F00] disabled:cursor-not-allowed disabled:opacity-45">{requestingPayout ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <BanknoteArrowDown className="h-4 w-4" />}Gửi yêu cầu rút tiền</button>{!destination && <p className="mt-3 text-xs leading-5 text-amber-700">Bạn cần lưu QR nhận tiền trước khi có thể rút Coin.</p>}</form></section>
      </div>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between gap-4"><div><h2 className="font-black text-slate-950">Lịch sử yêu cầu rút</h2><p className="mt-1 text-sm text-slate-500">Trạng thái được Admin cập nhật sau khi kiểm tra và chuyển khoản.</p></div><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">{payouts.length} yêu cầu</span></div><div className="mt-5 space-y-3">{payouts.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-10 text-center text-sm text-slate-500">Chưa có yêu cầu rút tiền nào.</div> : payouts.map(payout => { const status = PAYOUT_STATUS[payout.status]; return <article key={payout.payoutId} className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="font-black text-slate-900">{money.format(payout.requestedAmount)} Coin</p><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${status.className}`}>{status.label}</span></div><p className="mt-2 text-xs text-slate-500">{payout.bankName} · {payout.accountNumberMasked ?? "Tài khoản đã lưu"} · {date(payout.createdAt)}</p>{payout.rejectionReason && <p className="mt-2 text-xs font-semibold text-rose-700">Lý do: {payout.rejectionReason}</p>}</div>{payout.externalTransferReference && <span className="text-xs font-semibold text-slate-500">Mã giao dịch: {payout.externalTransferReference}</span>}</article>; })}</div></section>
    </div>
  </main>;
}

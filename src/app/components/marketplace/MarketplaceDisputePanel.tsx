import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, LifeBuoy, Loader2 } from "lucide-react";
import marketplaceService from "../../../api/marketplace/marketplaceService";
import type {
  MarketplaceDispute,
  MarketplaceDisputeEligibility,
  MarketplaceDisputeReason,
  MarketplaceDisputeStatus,
} from "../../../api/marketplace/marketplaceTypes";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

const REASON_LABELS: Record<MarketplaceDisputeReason, string> = {
  NOT_AS_DESCRIBED: "Không đúng mô tả",
  POOR_QUALITY: "Chất lượng kém",
  TECHNICAL_ISSUE: "Lỗi kỹ thuật",
  ACCIDENTAL_PURCHASE: "Mua nhầm",
  OTHER: "Khác",
};

const STATUS_LABELS: Record<MarketplaceDisputeStatus, string> = {
  OPEN: "Đã gửi",
  UNDER_REVIEW: "Đang xem xét",
  APPROVED: "Đã duyệt hoàn tiền",
  REJECTED: "Bị từ chối",
  REFUNDED: "Đã hoàn tiền",
};

const STATUS_STYLE: Record<MarketplaceDisputeStatus, string> = {
  OPEN: "border-amber-200 bg-amber-50 text-amber-800",
  UNDER_REVIEW: "border-sky-200 bg-sky-50 text-sky-800",
  APPROVED: "border-indigo-200 bg-indigo-50 text-indigo-800",
  REJECTED: "border-rose-200 bg-rose-50 text-rose-700",
  REFUNDED: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const INELIGIBILITY_MESSAGES: Record<string, string> = {
  NOT_OWNER: "Bạn chưa sở hữu giao dịch mua cho phiên bản này.",
  ALREADY_REFUNDED: "Giao dịch này đã được hoàn tiền.",
  SALE_NOT_COMPLETED: "Giao dịch này chưa hoàn tất nên không thể yêu cầu hoàn tiền.",
  DISPUTE_ACTIVE: "Bạn đã có một yêu cầu hoàn tiền đang được xử lý cho giao dịch này.",
};

const date = (value?: string | null) =>
  value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";
const errorText = (error: unknown) => (error instanceof Error ? error.message : "Đã có lỗi xảy ra. Vui lòng thử lại.");

function StatusBadge({ status }: { status: MarketplaceDisputeStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLE[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function DisputeTimeline({ dispute }: { dispute: MarketplaceDispute }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-900">{REASON_LABELS[dispute.reason]}</p>
          <p className="mt-0.5 text-xs text-slate-500">Gửi lúc {date(dispute.createdAt)}</p>
        </div>
        <StatusBadge status={dispute.status} />
      </div>
      {dispute.description && (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700">{dispute.description}</p>
      )}
      <ol className="space-y-3">
        <TimelineStep icon={<Clock3 className="h-4 w-4" />} title="Đã tiếp nhận" done detail={date(dispute.createdAt)} />
        <TimelineStep
          icon={<CheckCircle2 className="h-4 w-4" />}
          title={dispute.status === "REJECTED" ? "Đã từ chối" : "Đã xem xét"}
          done={dispute.status !== "OPEN" && dispute.status !== "UNDER_REVIEW"}
          detail={dispute.decidedAt ? date(dispute.decidedAt) : "Đang chờ đội ngũ vận hành"}
          note={dispute.decisionNote}
        />
        {dispute.status !== "REJECTED" && (
          <TimelineStep
            icon={<CheckCircle2 className="h-4 w-4" />}
            title="Hoàn tiền"
            done={dispute.status === "REFUNDED"}
            detail={
              dispute.status === "REFUNDED"
                ? `Đã hoàn ${dispute.refundCoinAmount ?? 0} Coin · ${date(dispute.refundedAt)}`
                : "Sẽ hoàn Coin vào ví sau khi được duyệt"
            }
          />
        )}
      </ol>
      {dispute.status === "REFUNDED" && (
        <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold leading-5 text-emerald-800">
          Coin đã được hoàn vào ví. Quyền truy cập phiên bản Pack này đã kết thúc theo chính sách hoàn tiền.
        </p>
      )}
    </div>
  );
}

function TimelineStep({
  icon,
  title,
  detail,
  done,
  note,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  done: boolean;
  note?: string | null;
}) {
  return (
    <li className="flex gap-3">
      <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ${done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
        {icon}
      </span>
      <div>
        <p className={`text-sm font-bold ${done ? "text-slate-900" : "text-slate-500"}`}>{title}</p>
        <p className="text-xs text-slate-500">{detail}</p>
        {note && <p className="mt-1 rounded-lg bg-slate-50 px-2 py-1 text-xs leading-5 text-slate-600">Ghi chú: {note}</p>}
      </div>
    </li>
  );
}

export function MarketplaceDisputePanel({
  open,
  onOpenChange,
  versionId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versionId: string;
}) {
  const [eligibility, setEligibility] = useState<MarketplaceDisputeEligibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reason, setReason] = useState<MarketplaceDisputeReason | "">("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      setEligibility(await marketplaceService.getVersionDisputeEligibility(versionId));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [versionId]);

  useEffect(() => {
    if (!open) {
      setReason("");
      setDescription("");
      setError(null);
      return;
    }
    void load();
  }, [open, load]);

  const submit = async () => {
    if (!reason || !eligibility?.saleId) return;
    setSubmitting(true);
    setError(null);
    try {
      await marketplaceService.createDispute({
        saleId: eligibility.saleId,
        reason,
        description: description.trim() || undefined,
      });
      // Never optimistic: refresh authoritative server state after the decision.
      await load();
    } catch (submitError) {
      setError(errorText(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  const existing = eligibility?.existingDispute ?? null;
  const showForm = eligibility?.eligible && !existing;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-xl overflow-y-auto rounded-[1.75rem] border-white p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <DialogHeader className="border-b border-orange-100 bg-[linear-gradient(120deg,#FFF8F1_0%,#FFFFFF_72%)] px-5 py-5 pr-14 sm:px-6">
          <DialogTitle className="flex items-center gap-2 text-slate-950">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-100 text-[#FF6B00]">
              <LifeBuoy className="h-4 w-4" aria-hidden="true" />
            </span>
            Trợ giúp giao dịch
          </DialogTitle>
          <DialogDescription className="max-w-lg leading-6">
            Yêu cầu hoàn tiền cho giao dịch mua Quiz Pack của bạn. Đội ngũ vận hành sẽ xem xét trước
            khi hoàn Coin.
          </DialogDescription>
        </DialogHeader>

        <div className="p-5 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500" role="status" aria-live="polite">
            <Loader2 className="h-5 w-5 animate-spin" /> Đang tải…
          </div>
        ) : failed ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-center">
            <AlertTriangle className="mx-auto h-6 w-6 text-rose-600" />
            <p className="mt-2 text-sm font-bold text-rose-900">Không thể tải thông tin</p>
            <button onClick={() => void load()} className="mt-3 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white">
              Thử lại
            </button>
          </div>
        ) : existing ? (
          <DisputeTimeline dispute={existing} />
        ) : showForm ? (
          <div className="space-y-4">
            <fieldset>
              <legend className="text-sm font-bold text-slate-700">
                Lý do <span className="text-rose-600">*</span>
              </legend>
              <RadioGroup
                className="mt-2 grid gap-1.5"
                value={reason}
                onValueChange={value => setReason(value as MarketplaceDisputeReason)}
                aria-label="Lý do yêu cầu hoàn tiền"
              >
                {(Object.keys(REASON_LABELS) as MarketplaceDisputeReason[]).map(value => (
                  <label
                    key={value}
                    className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-orange-200 hover:bg-orange-50/40 focus-within:ring-4 focus-within:ring-orange-100 has-[:checked]:border-[#FF6B00] has-[:checked]:bg-orange-50"
                  >
                    <RadioGroupItem value={value} />
                    {REASON_LABELS[value]}
                  </label>
                ))}
              </RadioGroup>
            </fieldset>

            <label className="block text-sm font-bold text-slate-700">
              Mô tả chi tiết
              <textarea
                value={description}
                maxLength={2000}
                onChange={event => setDescription(event.target.value)}
                placeholder="Cho chúng tôi biết vấn đề của bạn (không bắt buộc)"
                className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-normal leading-6 outline-none transition focus:border-[#FF6B00] focus:ring-4 focus:ring-orange-100"
              />
            </label>

            {error && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold leading-5 text-rose-800" role="alert">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-1">
              <DialogClose className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                Hủy
              </DialogClose>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={!reason || submitting}
                className="inline-flex min-h-11 min-w-36 items-center justify-center gap-2 rounded-xl bg-[#FF6B00] px-4 text-sm font-bold text-white shadow-[0_8px_18px_rgba(255,107,0,0.2)] transition hover:-translate-y-0.5 hover:bg-[#e85f00] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Gửi yêu cầu"}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center">
            <AlertTriangle className="mx-auto h-6 w-6 text-slate-400" />
            <p className="mt-2 text-sm font-semibold text-slate-600">
              {INELIGIBILITY_MESSAGES[eligibility?.ineligibilityReason ?? ""] ??
                "Giao dịch này hiện không đủ điều kiện yêu cầu hoàn tiền."}
            </p>
          </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Owned-pack entry button that opens the dispute panel for a version. */
export function MarketplaceDisputeButton({ versionId, className }: { versionId: string; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-transparent px-3 text-xs font-bold text-slate-500 transition hover:border-orange-100 hover:bg-orange-50 hover:text-[#FF6B00] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100"
        }
      >
        <LifeBuoy className="h-3.5 w-3.5" aria-hidden="true" />
        Trợ giúp giao dịch
      </button>
      <MarketplaceDisputePanel open={open} onOpenChange={setOpen} versionId={versionId} />
    </>
  );
}

export default MarketplaceDisputePanel;

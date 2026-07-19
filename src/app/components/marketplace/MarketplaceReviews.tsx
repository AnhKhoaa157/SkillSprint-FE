import { useEffect, useState, type FormEvent } from "react";
import { AlertTriangle, LoaderCircle, LockKeyhole, RefreshCw, Star } from "lucide-react";
import type { MarketplaceReview, MarketplaceReviewContext } from "../../../api/marketplace";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" });

function formatDate(value?: string | null) {
  if (!value) return "—";
  return dateFormatter.format(new Date(value));
}

function ReviewStars({ value }: { value: number }) {
  return <span className="inline-flex" aria-label={`${value} trên 5 sao`}>
    {[1, 2, 3, 4, 5].map(star => <Star
      key={star}
      aria-hidden="true"
      className={`h-4 w-4 ${star <= value ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
    />)}
  </span>;
}

export function MarketplaceReviewList({ reviews }: { reviews: MarketplaceReview[] }) {
  if (reviews.length === 0) {
    return <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
      Phiên bản này chưa có đánh giá.
    </p>;
  }

  return <div className="space-y-3">
    {reviews.map(review => <article key={review.reviewId} className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <b className="text-slate-900">{review.reviewerName}</b>
        <ReviewStars value={review.rating} />
      </div>
      {review.comment && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{review.comment}</p>}
      <p className="mt-3 text-xs text-slate-400">Cập nhật {formatDate(review.updatedAt ?? review.createdAt)}</p>
    </article>)}
  </div>;
}

const ineligibleCopy = {
  ACCESS_REQUIRED: "Bạn cần sở hữu phiên bản này để gửi đánh giá.",
  QUIZ_COMPLETION_REQUIRED: "Hoàn thành ít nhất một Practice hoặc Ranked Quiz của phiên bản này để mở đánh giá.",
} as const;

interface MarketplaceReviewEditorProps {
  context: MarketplaceReviewContext | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
  onRetry: () => void;
  onSave: (request: { rating: number; comment?: string }) => Promise<void>;
}

export function MarketplaceReviewEditor({ context, loading, error, saving, onRetry, onSave }: MarketplaceReviewEditorProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    setRating(context?.currentUserReview?.rating ?? 0);
    setComment(context?.currentUserReview?.comment ?? "");
  }, [context?.versionId, context?.currentUserReview?.reviewId, context?.currentUserReview?.updatedAt]);

  if (loading) {
    return <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
      <p className="inline-flex items-center gap-2 text-sm font-bold text-slate-500">
        <LoaderCircle className="h-4 w-4 animate-spin" />Đang tải quyền đánh giá...
      </p>
    </section>;
  }

  if (error) {
    return <section className="rounded-[1.75rem] border border-rose-200 bg-rose-50 p-6">
      <AlertTriangle className="h-5 w-5 text-rose-600" />
      <p className="mt-2 text-sm font-bold text-rose-900">Không thể tải trạng thái đánh giá.</p>
      <p className="mt-1 text-sm text-rose-800">{error}</p>
      <button type="button" onClick={onRetry} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-black text-rose-700">
        <RefreshCw className="h-4 w-4" />Thử lại
      </button>
    </section>;
  }

  if (!context) return null;

  if (!context.eligible) {
    return <section className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-slate-500"><LockKeyhole className="h-5 w-5" /></span>
      <h2 className="mt-4 text-lg font-black text-slate-900">Đánh giá phiên bản {context.versionNo}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {context.ineligibilityReason ? ineligibleCopy[context.ineligibilityReason] : "Bạn chưa đủ điều kiện đánh giá phiên bản này."}
      </p>
    </section>;
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (rating < 1 || rating > 5) return;
    await onSave({ rating, comment: comment.trim() || undefined });
  };

  return <section className="overflow-hidden rounded-[1.75rem] border border-orange-100 bg-white shadow-[0_14px_36px_rgba(194,65,12,0.07)]" aria-labelledby="buyer-review-title">
    <div className="border-b border-orange-100 bg-orange-50/70 px-5 py-5 sm:px-6">
      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#FF6B00]">Buyer review</p>
      <h2 id="buyer-review-title" className="mt-1 text-xl font-black text-slate-950">Đánh giá phiên bản {context.versionNo}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">Đánh giá chỉ áp dụng cho đúng phiên bản bạn đã học.</p>
    </div>
    <form onSubmit={event => void submit(event)} className="p-5 sm:p-6">
      <fieldset disabled={saving}>
        <legend className="text-sm font-black text-slate-800">Mức độ hài lòng</legend>
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Mức đánh giá từ 1 đến 5 sao">
          {[1, 2, 3, 4, 5].map(value => <label key={value} className={`grid h-11 w-11 cursor-pointer place-items-center rounded-xl border transition focus-within:ring-4 focus-within:ring-orange-100 ${value <= rating ? "border-amber-300 bg-amber-50 text-amber-500" : "border-slate-200 bg-white text-slate-300 hover:border-orange-200"}`}>
            <input type="radio" name="marketplace-rating" value={value} checked={rating === value} onChange={() => setRating(value)} className="sr-only" aria-label={`${value} sao`} />
            <Star aria-hidden="true" className={`h-5 w-5 ${value <= rating ? "fill-current" : ""}`} />
          </label>)}
        </div>
      </fieldset>
      <label className="mt-5 block text-sm font-black text-slate-800">
        Nhận xét <span className="font-medium text-slate-400">(không bắt buộc)</span>
        <textarea value={comment} maxLength={2000} disabled={saving} onChange={event => setComment(event.target.value)} className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal leading-6 outline-none focus:border-[#FF6B00] focus:ring-4 focus:ring-orange-100 disabled:bg-slate-50" placeholder="Chia sẻ trải nghiệm học với phiên bản này" />
        <span className="mt-1 block text-right text-xs font-medium text-slate-400">{comment.length}/2000</span>
      </label>
      <button type="submit" disabled={saving || rating === 0} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B00] px-5 text-sm font-black text-white shadow-[0_10px_22px_rgba(255,107,0,0.2)] disabled:cursor-not-allowed disabled:opacity-50">
        {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
        {context.currentUserReview ? "Cập nhật đánh giá" : "Gửi đánh giá"}
      </button>
      <p className="sr-only" aria-live="polite">{saving ? "Đang lưu đánh giá" : ""}</p>
    </form>
  </section>;
}

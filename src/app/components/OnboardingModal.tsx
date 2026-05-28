import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronLeft, ChevronRight, Clock3, Loader2, Plus, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { fetchOnboardingProfile, upsertOnboardingProfile, type OnboardingProfileResponse } from "../../api/onboardingService";

const dayOptions = [
  { label: "T2", value: "MONDAY" },
  { label: "T3", value: "TUESDAY" },
  { label: "T4", value: "WEDNESDAY" },
  { label: "T5", value: "THURSDAY" },
  { label: "T6", value: "FRIDAY" },
  { label: "T7", value: "SATURDAY" },
  { label: "CN", value: "SUNDAY" },
] as const;

const confidenceOptions = [
  { value: "LOW", title: "🥲 Bắt đầu từ số 0", description: "Cần lộ trình thật rõ ràng" },
  { value: "MEDIUM", title: "🤔 Đã biết chút ít", description: "Muốn học có nhịp độ vừa phải" },
  { value: "HIGH", title: "😎 Rất tự tin", description: "Đã có nền tảng và muốn đi nhanh" },
] as const;

const schema = z.object({
  targetGoal: z.string().min(1, "Mục tiêu không được để trống").max(2000, "Tối đa 2000 ký tự"),
  studyHoursPerWeek: z.number().min(1, "Tối thiểu 1 giờ/tuần").max(40, "Tối đa 40 giờ/tuần"),
  targetDeadline: z.string().min(1, "Vui lòng chọn ngày hoàn thành"),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
});

type FormValues = z.infer<typeof schema>;

type OnboardingPayload = {
  targetGoal: string;
  studyHoursPerWeek: number;
  targetDeadline: string | null;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  preferredDays: string[];
  preferredTimeSlots: string[];
};

type ConfidenceCardProps = {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
};

function ConfidenceCard({ active, title, description, onClick }: ConfidenceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "group w-full rounded-2xl border p-4 text-left transition-all duration-200 " +
        (active
          ? "border-orange-500 bg-orange-50 shadow-[0_12px_30px_rgba(249,115,22,0.14)]"
          : "border-slate-200 bg-white hover:border-orange-200 hover:bg-orange-50/50")
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-slate-900">{title}</div>
          <div className="mt-1 text-xs leading-5 text-slate-500">{description}</div>
        </div>
        <div
          className={
            "flex h-6 w-6 items-center justify-center rounded-full border transition-all " +
            (active ? "border-orange-500 bg-orange-500 text-white" : "border-slate-200 text-transparent")
          }
        >
          <Check className="h-3.5 w-3.5" />
        </div>
      </div>
    </button>
  );
}

type ChipProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

function DayChip({ label, active, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 " +
        (active
          ? "bg-orange-500 text-white shadow-md shadow-orange-500/25"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200")
      }
    >
      {label}
    </button>
  );
}

type TimeSlotTagProps = {
  label: string;
  onRemove: () => void;
};

function TimeSlotTag({ label, onRemove }: TimeSlotTagProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">
      <Clock3 className="h-4 w-4 text-orange-500" />
      <span>{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        aria-label={`Remove ${label}`}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function OnboardingModal({
  open,
  onClose,
  workspaceId,
  initialValues,
}: {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  initialValues?: OnboardingProfileResponse | null;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    trigger,
    setValue,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      targetGoal: "",
      studyHoursPerWeek: 8,
      targetDeadline: "",
      confidence: "MEDIUM",
    },
  });

  const [step, setStep] = React.useState(0);
  const [selectedDays, setSelectedDays] = React.useState<string[]>([]);
  const [timeSlots, setTimeSlots] = React.useState<string[]>([]);
  const [slotStart, setSlotStart] = React.useState("");
  const [slotEnd, setSlotEnd] = React.useState("");
  const [loadingProfile, setLoadingProfile] = React.useState(false);

  const targetGoalValue = watch("targetGoal") || "";
  const targetDeadlineValue = watch("targetDeadline") ?? null;
  const currentConfidence = watch("confidence");

  React.useEffect(() => {
    if (!open) return;

    let alive = true;

    const applyProfile = (profile?: OnboardingProfileResponse | null) => {
      reset({
        targetGoal: profile?.targetGoal ?? "",
        studyHoursPerWeek: profile?.studyHoursPerWeek ?? 8,
        targetDeadline: profile?.targetDeadline ?? "",
        confidence: (profile?.confidence as FormValues["confidence"]) ?? "MEDIUM",
      });
      setSelectedDays(profile?.preferredDays ?? []);
      setTimeSlots(profile?.preferredTimeSlots ?? []);
      setSlotStart("");
      setSlotEnd("");
      setStep(0);
    };

    if (initialValues) {
      applyProfile(initialValues);
    }

    const loadProfile = async () => {
      setLoadingProfile(true);
      try {
        if (initialValues) {
          return;
        }

        const response = await fetchOnboardingProfile(workspaceId);
        const profile = response.data;

        if (!alive) return;

        applyProfile(profile);
      } catch (error: any) {
        if (!alive) return;
        toast.error(error?.message || "Không thể tải dữ liệu onboarding");
        applyProfile(initialValues ?? null);
      } finally {
        if (alive) setLoadingProfile(false);
      }
    };

    loadProfile();

    return () => {
      alive = false;
    };
  }, [open, reset, workspaceId, initialValues]);

  if (!open) return null;

  const progress = ((step + 1) / 2) * 100;

  const toggleDay = (day: string) => {
    setSelectedDays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day],
    );
  };

  const addTimeSlot = () => {
    const start = slotStart.trim();
    const end = slotEnd.trim();

    if (!start || !end) {
      toast.error("Vui lòng chọn cả thời gian bắt đầu và kết thúc");
      return;
    }

    if (start >= end) {
      toast.error("Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc");
      return;
    }

    const slot = `${start}-${end}`;
    if (timeSlots.includes(slot)) {
      toast.info("Khung giờ này đã được thêm");
      return;
    }

    setTimeSlots((current) => [...current, slot]);
    setSlotStart("");
    setSlotEnd("");
  };

  const submit = handleSubmit(async (values) => {
    if (selectedDays.length < 1) {
      toast.error("Vui lòng chọn ít nhất 1 ngày trong tuần");
      return;
    }

    if (timeSlots.length < 1) {
      toast.error("Vui lòng thêm ít nhất 1 khung giờ học");
      return;
    }

    const payload: OnboardingPayload = {
      targetGoal: values.targetGoal.trim(),
      studyHoursPerWeek: values.studyHoursPerWeek,
      targetDeadline: values.targetDeadline.trim(),
      confidence: values.confidence,
      preferredDays: selectedDays,
      preferredTimeSlots: timeSlots,
    };

    try {
      await upsertOnboardingProfile(workspaceId, payload);
      toast.success("Lưu lộ trình thành công");
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Lỗi khi lưu lộ trình");
    }
  });

  const goNext = async () => {
    const valid = await trigger(["targetGoal", "studyHoursPerWeek", "targetDeadline", "confidence"]);
    if (valid) setStep(1);
  };

  const goBack = () => setStep(0);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <aside className="relative ml-auto flex h-full w-full max-w-2xl flex-col overflow-hidden border-l border-slate-200 bg-white/95 shadow-2xl shadow-black/10 backdrop-blur">
        <div className="border-b border-slate-200/80 bg-white/90 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-orange-500">
                <Sparkles className="h-4 w-4" />
                Onboarding Profile
              </div>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Thiết lập lộ trình học</h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Hoàn thiện vài thông tin cơ bản để SkillSprint đề xuất nhịp học, lịch học và khung giờ phù hợp.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <span>{step === 0 ? "Mục tiêu & Thông tin chung" : "Lịch học"}</span>
              <span>{step + 1}/2</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {loadingProfile ? (
            <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                Đang tải dữ liệu onboarding...
              </div>
            </div>
          ) : (
            <form
              id="onboarding-form"
              onSubmit={submit}
              className="space-y-6 pb-32"
            >
              {step === 0 && (
                <section className="space-y-6">
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <label className="text-sm font-semibold text-slate-800">Mục tiêu học tập</label>
                      <span className="text-xs font-medium text-slate-400">{targetGoalValue.length}/2000</span>
                    </div>
                    <div className="relative">
                      <textarea
                        {...register("targetGoal")}
                        rows={6}
                        maxLength={2000}
                        placeholder="Ví dụ: Hoàn thành khóa học ReactJS..."
                        className="min-h-[160px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 pr-16 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                      />
                      <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                        {targetGoalValue.length}/2000
                      </div>
                    </div>
                    {errors.targetGoal && <p className="mt-2 text-sm text-red-600">{errors.targetGoal.message}</p>}
                  </div>

                  <div className="grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-800">Số giờ học mỗi tuần</label>
                      <div className="relative">
                        <input
                          type="number"
                          min={1}
                          max={40}
                          {...register("studyHoursPerWeek", { valueAsNumber: true })}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-20 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                        />
                        <span className="absolute inset-y-0 right-4 flex items-center text-sm font-semibold text-slate-400">
                          giờ/tuần
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">Gợi ý: bắt đầu từ 8-12 giờ/tuần nếu bạn mới thiết lập lộ trình.</p>
                      {errors.studyHoursPerWeek && (
                        <p className="mt-2 text-sm text-red-600">{errors.studyHoursPerWeek.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-800">Mục tiêu hoàn thành (Tùy chọn)</label>
                      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                        <input
                          type="date"
                          value={targetDeadlineValue ?? ""}
                          onChange={(event) => setValue("targetDeadline", event.target.value, { shouldDirty: true })}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                        />
                        <button
                          type="button"
                          onClick={() => setValue("targetDeadline", "", { shouldDirty: true })}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          Xóa ngày
                        </button>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">Không bắt buộc. Bạn có thể để trống hoặc xóa ngày đã chọn bất cứ lúc nào.</p>
                    </div>
                  </div>

                  <div>
                    <label className="mb-3 block text-sm font-semibold text-slate-800">Mức tự tin</label>
                    <div className="grid gap-3 md:grid-cols-3">
                      {confidenceOptions.map((option) => (
                        <ConfidenceCard
                          key={option.value}
                          active={currentConfidence === option.value}
                          title={option.title}
                          description={option.description}
                          onClick={() => setValue("confidence", option.value, { shouldValidate: true, shouldDirty: true })}
                        />
                      ))}
                    </div>
                    {errors.confidence && <p className="mt-2 text-sm text-red-600">{errors.confidence.message}</p>}
                  </div>
                </section>
              )}

              {step === 1 && (
                <section className="space-y-6">
                  <div>
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <label className="text-sm font-semibold text-slate-800">Ngày học ưu tiên</label>
                      <span className="text-xs font-medium text-slate-400">Chọn nhiều ngày nếu cần</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {dayOptions.map((day) => (
                        <DayChip
                          key={day.value}
                          label={day.label}
                          active={selectedDays.includes(day.value)}
                          onClick={() => toggleDay(day.value)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr_auto] md:items-end">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-800">Giờ bắt đầu</label>
                      <input
                        type="time"
                        value={slotStart}
                        onChange={(event) => setSlotStart(event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                      />
                    </div>

                    <div className="hidden justify-center text-slate-400 md:flex">→</div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-800">Giờ kết thúc</label>
                      <input
                        type="time"
                        value={slotEnd}
                        onChange={(event) => setSlotEnd(event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={addTimeSlot}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
                    >
                      <Plus className="h-4 w-4" />
                      [+ Thêm]
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {timeSlots.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                        Chưa có khung giờ nào. Thêm một khoảng để hệ thống ưu tiên.
                      </div>
                    ) : (
                      timeSlots.map((slot) => (
                        <TimeSlotTag
                          key={slot}
                          label={`⏱️ ${slot.replace("-", " - ")}`}
                          onRemove={() => setTimeSlots((current) => current.filter((item) => item !== slot))}
                        />
                      ))
                    )}
                  </div>

                  <div className="rounded-2xl border border-orange-100 bg-orange-50/80 p-4 text-sm text-orange-900">
                    Các ngày và khung giờ ở bước này sẽ được lưu thành mảng để backend dễ xử lý và hiển thị lại.
                  </div>
                </section>
              )}
            </form>
          )}
        </div>

        <div className="sticky bottom-0 border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 0 || loadingProfile}
              className={
                "inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition " +
                (step === 0 || loadingProfile
                  ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50")
              }
            >
              <ChevronLeft className="h-4 w-4" />
              Quay lại
            </button>

            {step === 0 ? (
              <button
                type="button"
                onClick={() => {
                  void goNext();
                }}
                disabled={loadingProfile}
                className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Tiếp theo
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                form="onboarding-form"
                disabled={isSubmitting || loadingProfile}
                className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting || loadingProfile ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Hoàn thành
              </button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

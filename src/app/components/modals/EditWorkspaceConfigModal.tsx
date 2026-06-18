import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Check, Clock3, Compass, Plus, Sparkles, Target, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import onboardingService, {
  type OnboardingProfileResponse,
  type UpsertOnboardingProfileRequest,
} from "../../../api/auth/onboardingService";

const dayOptions = [
  { label: "T2", value: "MONDAY" },
  { label: "T3", value: "TUESDAY" },
  { label: "T4", value: "WEDNESDAY" },
  { label: "T5", value: "THURSDAY" },
  { label: "T6", value: "FRIDAY" },
  { label: "T7", value: "SATURDAY" },
  { label: "CN", value: "SUNDAY" },
] as const;

type DayValue = (typeof dayOptions)[number]["value"];

type DayChipProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

function DayChip({ label, active, onClick }: DayChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 cursor-pointer border ${
        active
          ? "bg-[#FF6B00] border-[#FF6B00] text-white shadow-sm shadow-orange-600/20"
          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
      }`}
    >
      {label}
    </button>
  );
}

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

type EditWorkspaceConfigModalProps = {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  workspaceName?: string;
  initialConfig?: OnboardingProfileResponse | null;
  onSaved?: (profile: OnboardingProfileResponse) => void;
  inline?: boolean;
};

type TimeSlotBadgeProps = {
  label: string;
  onRemove: () => void;
};

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{children}</span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

function TimeSlotBadge({ label, onRemove }: TimeSlotBadgeProps) {
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

function ConfidenceCard({ active, title, description, onClick }: { active: boolean; title: string; description: string; onClick: () => void; }) {
  const [emoji, ...titleWords] = title.split(" ");
  const titleText = titleWords.join(" ");
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all duration-150 " +
        (active
          ? "border-[#FF6B00] bg-orange-50/60 ring-1 ring-[#FF6B00]/15 shadow-sm"
          : "border-slate-200 bg-slate-50/40 hover:border-orange-200 hover:bg-orange-50/20")
      }
    >
      <span className="text-xl leading-none">{emoji}</span>
      <span className={`text-[10px] font-extrabold leading-tight ${active ? "text-orange-700" : "text-slate-700"}`}>
        {titleText}
      </span>
      <span className={`text-[9px] leading-snug ${active ? "text-orange-500" : "text-slate-400"}`}>
        {description}
      </span>
    </button>
  );
}

const TIME_SLOTS_OPTIONS = [
  { label: "Sáng sớm (6:00 - 8:00)", value: "06:00-08:00" },
  { label: "Sáng (8:00 - 10:00)", value: "08:00-10:00" },
  { label: "Trước trưa (10:00 - 12:00)", value: "10:00-12:00" },
  { label: "Chiều (12:00 - 14:00)", value: "12:00-14:00" },
  { label: "Chiều (14:00 - 16:00)", value: "14:00-16:00" },
  { label: "Chiều tối (16:00 - 18:00)", value: "16:00-18:00" },
  { label: "Tối (18:00 - 20:00)", value: "18:00-20:00" },
  { label: "Tối muộn (20:00 - 22:00)", value: "20:00-22:00" },
];

function normalizeDateInput(value: string | null | undefined) {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().split("T")[0];
}

function normalizeDayId(value: string): DayValue | null {
  const upper = value.trim().toUpperCase();
  const found = dayOptions.find(option => option.value === upper);
  return found?.value ?? null;
}

function isValidTimeSlot(slot: string): boolean {
  const parts = slot.split('-');
  if (parts.length !== 2) return false;
  const [start, end] = parts;
  return /^\d{2}:\d{2}$/.test(start) && /^\d{2}:\d{2}$/.test(end);
}

export default function EditWorkspaceConfigModal({
  isOpen,
  onClose,
  workspaceId,
  workspaceName,
  initialConfig,
  onSaved,
  inline = false,
}: EditWorkspaceConfigModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
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

  const [selectedDays, setSelectedDays] = useState<DayValue[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [slotStart, setSlotStart] = useState("");
  const [slotEnd, setSlotEnd] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);

  const targetGoalValue = watch("targetGoal") || "";
  const targetDeadlineValue = watch("targetDeadline") ?? "";
  const currentConfidence = watch("confidence");

  useEffect(() => {
    if (!isOpen) return;

    const profile = initialConfig ?? null;
    reset({
      targetGoal: profile?.targetGoal ?? "",
      studyHoursPerWeek: profile?.studyHoursPerWeek ?? 8,
      targetDeadline: normalizeDateInput(profile?.targetDeadline ?? null),
      confidence: (profile?.confidence as FormValues["confidence"]) ?? "MEDIUM",
    });
    setSelectedDays((profile?.preferredDays ?? []).map(normalizeDayId).filter((day): day is DayValue => day !== null));
    setTimeSlots((profile?.preferredTimeSlots ?? []).filter(isValidTimeSlot));
    setSlotStart("");
    setSlotEnd("");
    setLoadingProfile(false);
  }, [initialConfig, isOpen, reset]);

  const onboardingTimeSlots = useMemo(
    () => (initialConfig?.preferredTimeSlots ?? []).filter(isValidTimeSlot),
    [initialConfig],
  );

  if (!isOpen) return null;

  const toggleDay = (day: DayValue) => {
    setSelectedDays(current => current.includes(day) ? current.filter(item => item !== day) : [...current, day]);
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

    setTimeSlots(current => [...current, slot]);
    setSlotStart("");
    setSlotEnd("");
  };

  const removeTimeSlot = (slot: string) => {
    setTimeSlots(current => current.filter(item => item !== slot));
  };

  const onSubmit = handleSubmit(async (values) => {
    if (selectedDays.length < 1) {
      toast.error("Vui lòng chọn ít nhất 1 ngày trong tuần");
      return;
    }

    if (timeSlots.length < 1) {
      toast.error("Vui lòng thêm ít nhất 1 khung giờ học");
      return;
    }

    try {
      setLoadingProfile(true);
      const payload: UpsertOnboardingProfileRequest = {
        targetGoal: values.targetGoal.trim(),
        studyHoursPerWeek: values.studyHoursPerWeek,
        targetDeadline: values.targetDeadline.trim() || null,
        confidence: values.confidence,
        preferredDays: selectedDays.map(day => day.toUpperCase()),
        preferredTimeSlots: timeSlots,
      };

      const updatedProfile = await onboardingService.upsertOnboardingProfile(workspaceId, payload);

      toast.success("Lưu thay đổi thành công");
      onSaved?.(updatedProfile);
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Lỗi khi lưu thay đổi");
    } finally {
      setLoadingProfile(false);
    }
  });

  // Xác định ID form động dựa trên chế độ hiển thị để không lệch thuộc tính submit
  const formId = inline ? "edit-workspace-config-form-inline" : "edit-workspace-config-form";

  /* ── Inline render (Config tab) ── */
  if (inline) {
    return (
      <div className="rounded-2xl border border-slate-200/60 bg-[#F8FAFC] shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 bg-white flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 border border-orange-100 text-[#FF6B00] shrink-0">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#FF6B00]">Cấu hình lộ trình</p>
            <h2 className="text-sm font-extrabold text-slate-800 leading-tight">
              {workspaceName || "Cấu hình học tập AI"}
            </h2>
          </div>
        </div>

        {/* Unified form body */}
        <form id={formId} onSubmit={onSubmit} className="p-5 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Card 1: Mục tiêu học tập */}
            <div className="flex flex-col rounded-2xl border border-slate-200/50 bg-white p-5 shadow-sm hover:border-orange-200/40 hover:shadow-md/5 transition-all duration-200">
              <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                    <Target className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Mục tiêu học tập</h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400">{targetGoalValue.length}/2000</span>
              </div>
              
              <div className="flex-1 flex flex-col justify-between space-y-3">
                <textarea
                  {...register("targetGoal")}
                  rows={4}
                  maxLength={2000}
                  placeholder="Ví dụ: Nắm vững ReactJS và Hooks để tự xây dựng ứng dụng web hiện đại..."
                  className="w-full flex-1 rounded-xl border border-slate-200 bg-slate-50/30 px-3.5 py-3 text-sm leading-relaxed text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#FF6B00] focus:bg-white focus:ring-4 focus:ring-orange-500/5 resize-none transition"
                />
                {errors.targetGoal && (
                  <p className="text-[11px] text-red-500">{errors.targetGoal.message}</p>
                )}
              </div>
            </div>

            {/* Card 2: Cam kết & Thời hạn */}
            <div className="rounded-2xl border border-slate-200/50 bg-white p-5 shadow-sm hover:border-orange-200/40 hover:shadow-md/5 transition-all duration-200 flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                  <Clock3 className="h-4 w-4" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Cam kết & Thời hạn</h3>
              </div>

              <div className="space-y-4 flex-1 flex flex-col justify-center">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Giờ học mỗi tuần
                  </label>
                  <div className="relative">
                    <input
                      type="number" min={1} max={40}
                      {...register("studyHoursPerWeek", { valueAsNumber: true })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/30 px-3.5 py-2.5 pr-20 text-sm font-bold text-slate-800 outline-none focus:border-[#FF6B00] focus:bg-white focus:ring-4 focus:ring-orange-500/5 transition"
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-wide pointer-events-none">
                      giờ / tuần
                    </span>
                  </div>
                  {errors.studyHoursPerWeek && (
                    <p className="text-[11px] text-red-500">{errors.studyHoursPerWeek.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Hạn hoàn thành
                  </label>
                  <input
                    type="date"
                    value={targetDeadlineValue}
                    onChange={(e) => setValue("targetDeadline", e.target.value, { shouldDirty: true })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/30 px-3.5 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-[#FF6B00] focus:bg-white focus:ring-4 focus:ring-orange-500/5 transition"
                  />
                  {errors.targetDeadline && (
                    <p className="text-[11px] text-red-500">{errors.targetDeadline.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Card 3: Mức độ tự tin */}
            <div className="rounded-2xl border border-slate-200/50 bg-white p-5 shadow-sm hover:border-orange-200/40 hover:shadow-md/5 transition-all duration-200">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                  <Compass className="h-4 w-4" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Mức độ tự tin ban đầu</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
              {errors.confidence && (
                <p className="text-[11px] text-red-500 mt-2">{errors.confidence.message}</p>
              )}
            </div>

            {/* Card 4: Lịch học ưu tiên */}
            <div className="rounded-2xl border border-slate-200/50 bg-white p-5 shadow-sm hover:border-orange-200/40 hover:shadow-md/5 transition-all duration-200 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                  <Calendar className="h-4 w-4" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Lịch học ưu tiên</h3>
              </div>

              {/* Day chips */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Các ngày trong tuần</span>
                <div className="flex flex-wrap gap-1.5">
                  {dayOptions.map((day) => {
                    const isActive = selectedDays.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDay(day.value)}
                        className={`h-8 w-8 rounded-lg border text-[10px] font-extrabold transition-all duration-150 flex items-center justify-center ${
                          isActive
                            ? "bg-[#FF6B00] border-[#FF6B00] text-white shadow-sm shadow-[#FF6B00]/20 scale-105"
                            : "bg-slate-50 border-slate-200 text-slate-500 hover:border-orange-200 hover:bg-orange-50/20"
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time slots */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Khung giờ rảnh trong ngày</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {TIME_SLOTS_OPTIONS.map((slot, index) => {
                    const isSelected = timeSlots.includes(slot.value);
                    const [st, et] = slot.value.split("-");
                    const fmt = (t: string) => t.replace(/^0/, "").replace(":00", "");
                    const range = `${fmt(st)}–${fmt(et)}`;
                    const period = slot.label.split(" (")[0];
                    return (
                      <button
                        key={`time-preset-${index}`}
                        type="button"
                        onClick={() =>
                          setTimeSlots((curr) =>
                            curr.includes(slot.value)
                              ? curr.filter((s) => s !== slot.value)
                              : [...curr, slot.value],
                          )
                        }
                        className={`flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all duration-150 gap-0.5 ${
                          isSelected
                            ? "border-[#FF6B00] bg-orange-50/50 shadow-sm"
                            : "border-slate-200 bg-slate-50/30 hover:border-orange-200 hover:bg-orange-50/10"
                        }`}
                      >
                        <span className={`text-[9px] font-semibold leading-none truncate w-full text-center ${isSelected ? "text-[#FF6B00]" : "text-slate-400"}`}>
                          {period}
                        </span>
                        <span className={`text-[10px] font-extrabold leading-tight ${isSelected ? "text-[#FF6B00]" : "text-slate-600"}`}>
                          {range}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="px-5 py-4 border border-slate-200/50 bg-white rounded-2xl flex items-center justify-end gap-2.5 shadow-sm">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              form={formId}
              disabled={isSubmitting || loadingProfile}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF6B00] px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-orange-500/20 hover:bg-[#E05E00] disabled:opacity-70 transition"
            >
              {isSubmitting || loadingProfile ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              {isSubmitting || loadingProfile ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  /* ── Modal overlay render ── */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl shadow-black/20">
        <div className="border-b border-slate-200/80 bg-white/95 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-orange-500">
                <Sparkles className="h-4 w-4" />
                Quick Edit
              </div>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                {workspaceName ? `Cấu hình lộ trình - ${workspaceName}` : "Cấu hình lộ trình"}
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Cập nhật nhanh mục tiêu, nhịp học, hạn chót và lịch rảnh cho workspace hiện tại.
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
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <form id={formId} onSubmit={onSubmit} className="space-y-6 pb-28">
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
                  <p className="mt-2 text-xs text-slate-500">Gợi ý: bắt đầu từ 8-12 giờ/tuần nếu bạn muốn giữ nhịp học đều.</p>
                  {errors.studyHoursPerWeek && <p className="mt-2 text-sm text-red-600">{errors.studyHoursPerWeek.message}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">Mục tiêu hoàn thành</label>
                  <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                    <input
                      type="date"
                      value={targetDeadlineValue}
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
                  <p className="mt-2 text-xs text-slate-500">Bạn có thể để trống hoặc cập nhật lại bất cứ lúc nào.</p>
                  {errors.targetDeadline && <p className="mt-2 text-sm text-red-600">{errors.targetDeadline.message}</p>}
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

              <div>
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

                <div className="mt-4 flex flex-wrap gap-2">
                  {timeSlots.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                      Chưa có khung giờ nào. Thêm một khoảng để hệ thống ưu tiên.
                    </div>
                  ) : (
                    timeSlots.map((slot, index) => (
                      <TimeSlotBadge
                        key={`time-badge-${index}`}
                        label={`⏱️ ${slot.replace('-', ' - ')}`}
                        onRemove={() => removeTimeSlot(slot)}
                      />
                    ))
                  )}
                </div>

                {onboardingTimeSlots.length > 0 && (
                  <div className="mt-5 rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-lg">
                        🕒
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-orange-900">Khung giờ mặc định (Từ Onboarding)</div>
                        <p className="mt-1 text-xs leading-5 text-orange-800/80">
                          Các khung giờ này đã được lấy từ onboarding và được chọn sẵn để bạn chỉnh nhanh.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {onboardingTimeSlots.map((slot, index) => (
                            <span
                              key={`onboarding-slot-${index}`}
                              className="inline-flex items-center rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-semibold text-orange-700"
                            >
                              {slot.replace('-', ' - ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Hoặc chọn lại khung giờ khác bên dưới:
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  {TIME_SLOTS_OPTIONS.map((slot, index) => {
                    const isSelected = timeSlots.includes(slot.value);
                    return (
                      <button
                        key={`time-preset-${index}`}
                        type="button"
                        onClick={() => {
                          setTimeSlots(current =>
                            current.includes(slot.value)
                              ? current.filter(item => item !== slot.value)
                              : [...current, slot.value],
                          );
                        }}
                        className={
                          "flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-all duration-150 " +
                          (isSelected
                            ? "border-orange-500 bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 shadow-sm"
                            : "border-slate-200 bg-white text-slate-700 hover:border-orange-200 hover:bg-orange-50/40")
                        }
                      >
                        {isSelected && <Check size={16} className="text-orange-500" />}
                        <span>{slot.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          </form>
        </div>

        <div className="border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              form={formId}
              disabled={isSubmitting || loadingProfile}
              className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting || loadingProfile ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {isSubmitting || loadingProfile ? "⏳ Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

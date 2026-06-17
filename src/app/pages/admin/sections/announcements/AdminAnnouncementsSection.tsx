import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Megaphone, Plus, RefreshCw, Pencil, Trash2, X, LoaderCircle, Info, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  getAdminAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  type AnnouncementType,
  type SystemAnnouncementResponse,
  type CreateAnnouncementPayload,
} from "../../../../../api/systemAnnouncementService";

/* ── datetime-local <-> ISO helpers ── */
function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

const TYPE_META: Record<AnnouncementType, { label: string; cls: string; Icon: typeof Info }> = {
  INFO:    { label: "Thông tin", cls: "bg-indigo-50 text-indigo-700 border-indigo-200", Icon: Info },
  WARNING: { label: "Cảnh báo",  cls: "bg-amber-50 text-amber-700 border-amber-200",   Icon: AlertTriangle },
};

type FormState = {
  title: string;
  content: string;
  type: AnnouncementType;
  startAt: string;
  endAt: string;
};

const EMPTY_FORM: FormState = { title: "", content: "", type: "INFO", startAt: "", endAt: "" };

export function AdminAnnouncementsSection() {
  const [items, setItems] = useState<SystemAnnouncementResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SystemAnnouncementResponse | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<SystemAnnouncementResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const list = await getAdminAnnouncements();
      setItems(list);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể tải danh sách thông báo");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(item: SystemAnnouncementResponse) {
    setEditing(item);
    setForm({
      title: item.title,
      content: item.content,
      type: item.type,
      startAt: isoToLocalInput(item.startAt),
      endAt: isoToLocalInput(item.endAt),
    });
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const title = form.title.trim();
    const content = form.content.trim();
    if (!title || !content) {
      toast.error("Vui lòng nhập tiêu đề và nội dung.");
      return;
    }
    if (form.startAt && form.endAt && new Date(form.endAt) <= new Date(form.startAt)) {
      toast.error("Thời gian kết thúc phải sau thời gian bắt đầu.");
      return;
    }

    const payload: CreateAnnouncementPayload = {
      title,
      content,
      type: form.type,
      startAt: localInputToIso(form.startAt),
      endAt: localInputToIso(form.endAt),
    };

    setSaving(true);
    try {
      if (editing) {
        const updated = await updateAnnouncement(editing.announcementId, payload);
        setItems(prev => prev.map(it => (it.announcementId === updated.announcementId ? updated : it)));
        toast.success("Đã cập nhật thông báo");
      } else {
        const created = await createAnnouncement(payload);
        setItems(prev => [created, ...prev]);
        toast.success("Đã tạo thông báo mới");
      }
      setModalOpen(false);
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể lưu thông báo");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAnnouncement(deleteTarget.announcementId);
      setItems(prev => prev.filter(it => it.announcementId !== deleteTarget.announcementId));
      toast.success("Đã xóa thông báo");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể xóa thông báo");
    } finally {
      setDeleting(false);
    }
  }

  const fieldCls = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#FF6B00]";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
      {/* Header card */}
      <div className="rounded-2xl p-5 bg-gradient-to-br from-white to-slate-50 border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <Megaphone size={20} className="text-[#FF6B00]" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-slate-900 leading-none">Thông báo hệ thống</h1>
              <p className="text-xs text-slate-500 mt-1">Quản lý thông báo công khai · {items.length} thông báo</p>
            </div>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={() => void load()}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer text-xs font-semibold text-slate-700 disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Làm mới
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#FF6B00] hover:bg-[#e05e00] transition-colors text-white cursor-pointer text-xs font-bold shadow-sm"
            >
              <Plus size={16} />
              Thêm thông báo
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1.6fr_88px] gap-3 px-5 py-2.5 bg-slate-50 border-b border-slate-100">
          {["Tiêu đề", "Loại", "Trạng thái", "Thời gian hiệu lực", ""].map(col => (
            <span key={col} className="text-[0.68rem] font-semibold uppercase tracking-wider text-slate-400">{col}</span>
          ))}
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">Đang tải danh sách thông báo...</div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">
            Chưa có thông báo nào.&nbsp;
            <button onClick={openCreate} className="font-bold text-[#FF6B00] hover:underline">Tạo thông báo đầu tiên</button>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {items.map(item => {
              const meta = TYPE_META[item.type] ?? TYPE_META.INFO;
              const MetaIcon = meta.Icon;
              return (
                <div key={item.announcementId} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1.6fr_88px] gap-2 md:gap-3 px-5 py-3.5 md:items-center hover:bg-slate-50/60 transition">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{item.title}</p>
                    <p className="text-xs text-slate-400 truncate">{item.content}</p>
                  </div>
                  <div>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold w-fit ${meta.cls}`}>
                      <MetaIcon size={11} /> {meta.label}
                    </span>
                  </div>
                  <div>
                    {item.isActive ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200 w-fit">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Đang hiển thị
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500 border border-slate-200 w-fit">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Tạm ẩn
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 leading-relaxed">
                    <span className="text-slate-400">Từ:</span> {formatDateTime(item.startAt)}<br />
                    <span className="text-slate-400">Đến:</span> {formatDateTime(item.endAt)}
                  </div>
                  <div className="flex items-center gap-1.5 md:justify-end">
                    <button
                      onClick={() => openEdit(item)}
                      title="Chỉnh sửa"
                      aria-label="Chỉnh sửa thông báo"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-[#FF6B00] transition"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(item)}
                      title="Xóa"
                      aria-label="Xóa thông báo"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(3px)" }} onClick={closeModal}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-base font-extrabold text-slate-900">{editing ? "Chỉnh sửa thông báo" : "Thêm thông báo mới"}</h3>
              <button type="button" onClick={closeModal} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">Tiêu đề</label>
                <input
                  value={form.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Ví dụ: Bảo trì hệ thống định kỳ"
                  className={fieldCls}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">Nội dung</label>
                <textarea
                  value={form.content}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm(f => ({ ...f, content: e.target.value }))}
                  rows={3}
                  placeholder="Nội dung thông báo hiển thị cho người dùng..."
                  className={`${fieldCls} resize-none`}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">Loại</label>
                <select
                  value={form.type}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm(f => ({ ...f, type: e.target.value as AnnouncementType }))}
                  className={`${fieldCls} cursor-pointer font-semibold`}
                >
                  <option value="INFO">Thông tin (INFO)</option>
                  <option value="WARNING">Cảnh báo (WARNING)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">Bắt đầu (tùy chọn)</label>
                  <input
                    type="datetime-local"
                    value={form.startAt}
                    max={form.endAt || undefined}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, startAt: e.target.value }))}
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">Kết thúc (tùy chọn)</label>
                  <input
                    type="datetime-local"
                    value={form.endAt}
                    min={form.startAt || undefined}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, endAt: e.target.value }))}
                    className={fieldCls}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#FF6B00] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#e05e00] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? <LoaderCircle size={16} className="animate-spin" /> : null}
                  {saving ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Tạo thông báo"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Hủy
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(3px)" }} onClick={() => !deleting && setDeleteTarget(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <Trash2 size={19} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Xóa thông báo?</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                  Thông báo <strong className="text-slate-700">"{deleteTarget.title}"</strong> sẽ bị xóa vĩnh viễn và không còn hiển thị cho người dùng.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 pb-5">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-700 disabled:opacity-60"
              >
                {deleting ? <LoaderCircle size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {deleting ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

export default AdminAnnouncementsSection;

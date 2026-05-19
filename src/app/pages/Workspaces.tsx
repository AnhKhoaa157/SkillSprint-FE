import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import workspaceService from "../../api/workspaceService";
import { Plus, BookOpenCheck, Sparkles, LayoutGrid, ArrowRight, X, PencilLine, Trash2, Check, AlertTriangle } from "lucide-react";

const F = "'Inter','Plus Jakarta Sans',sans-serif";
const CARD = "#FFFFFF";
const BDR = "#E5E7EB";
const T1 = "#111827";

type WorkspaceItem = {
  id: string;
  name: string;
  createdAt?: string;
  description?: string | null;
};

export default function Workspaces() {
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<{ id: string; variant: "create" | "update" | "delete" | "error" | "success"; message: string }[]>([]);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await workspaceService.getMyWorkspaces();
        if (!mounted) return;
        setWorkspaces(res.map(w => ({ id: w.workspaceId, name: w.name, createdAt: w.createdAt, description: w.description })));
        } catch (err: any) {
        console.error(err);
        addNotification("error", err?.message || "Không thể tải workspaces");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  function addNotification(variant: "create" | "update" | "delete" | "error" | "success", message: string) {
    const id = String(Date.now()) + Math.random().toString(36).slice(2, 7);
    setNotifications((s) => [{ id, variant, message }, ...s]);
    setTimeout(() => {
      setNotifications((s) => s.filter(n => n.id !== id));
    }, 3500);
  }
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [editTarget, setEditTarget] = useState<WorkspaceItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkspaceItem | null>(null);
  const navigate = useNavigate();

  const create = (opts?: { fromModal?: boolean }) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    // check duplicate name (case-insensitive)
    if (workspaces.some(w => w.name.trim().toLowerCase() === trimmed.toLowerCase())) {
      setNameError("Tên workspace đã tồn tại");
      addNotification("error", "Tên workspace đã tồn tại");
      return;
    }
    (async () => {
      try {
        const created = await workspaceService.createWorkspace({ name: name.trim() });
        setWorkspaces(p => [{ id: created.workspaceId, name: created.name, createdAt: created.createdAt, description: created.description }, ...p]);
        setName("");
        if (opts?.fromModal) setShowModal(false);
        navigate(`/app/workspaces`);
        addNotification("create", "Tạo workspace thành công");
      } catch (err: any) {
        console.error(err);
        addNotification("error", err?.message || 'Tạo workspace thất bại');
      }
    })();
  };

  const saveRename = () => {
    if (!editTarget) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    if (workspaces.some(w => w.id !== editTarget.id && w.name.trim().toLowerCase() === trimmed.toLowerCase())) {
      setNameError("Tên workspace đã tồn tại");
      addNotification("error", "Tên workspace đã tồn tại");
      return;
    }
    (async () => {
      try {
        const updated = await workspaceService.updateWorkspace(editTarget.id, { name: name.trim() });
        setWorkspaces(prev => prev.map(item => item.id === editTarget.id ? { ...item, name: updated.name } : item));
        setName("");
        setEditTarget(null);
        addNotification("update", "Cập nhật workspace thành công");
      } catch (err: any) {
        console.error(err);
        addNotification("error", err?.message || 'Cập nhật workspace thất bại');
      }
    })();
  };

  const deleteWorkspace = () => {
    if (!deleteTarget) return;
    (async () => {
      try {
        await workspaceService.deleteWorkspace(deleteTarget.id);
        setWorkspaces(prev => prev.filter(item => item.id !== deleteTarget.id));
        setDeleteTarget(null);
        navigate("/app/workspaces");
        addNotification("delete", "Xóa workspace thành công");
      } catch (err: any) {
        console.error(err);
        addNotification("error", err?.message || 'Xóa workspace thất bại');
      }
    })();
  };

  return (
    <div style={{ fontFamily: F }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: T1 }}>Workspaces</h2>
          <p style={{ margin: 0, color: "#6B7280", fontSize: "0.86rem" }}>Tạo container cho mục tiêu học tập của bạn.</p>
        </div>
        <div>
          <button onClick={() => setShowModal(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 10, background: "#FFEDD5", border: `1px solid ${BDR}`, cursor: "pointer" }}>
            <Plus size={14} /> Tạo workspace
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {loading ? (
          <div>Đang tải workspaces...</div>
        ) : (
          workspaces.map(ws => (
          <div key={ws.id} onClick={() => navigate(`/app/workspaces/${ws.id}`)}
            style={{ background: CARD, padding: 14, borderRadius: 10, border: `1px solid ${BDR}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "linear-gradient(135deg,#FF6B00,#FF9A3D)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
                <BookOpenCheck size={20} />
              </div>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: "0.98rem", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ws.name}</h3>
                <p style={{ margin: "6px 0 0", color: "#6B7280", fontSize: "0.82rem" }}>Tải tài liệu vào workspace này để hệ thống sinh roadmap và task.</p>
                <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, color: "#64748B", padding: "4px 8px", borderRadius: 999, background: "#F8FAFC", border: `1px solid ${BDR}` }}>Workspace container</span>
                  {ws.createdAt && (
                    <span style={{ fontSize: 11, color: "#64748B", padding: "4px 8px", borderRadius: 999, background: "#F8FAFC", border: `1px solid ${BDR}` }}>
                      {new Date(ws.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 12 }}>
              <button
                onClick={(e) => { e.stopPropagation(); setEditTarget(ws); setName(ws.name); }}
                style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${BDR}`, background: CARD, color: "#475569", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                title="Đổi tên workspace"
              >
                <PencilLine size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteTarget(ws); }}
                style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                title="Xóa workspace"
              >
                <Trash2 size={14} />
              </button>
              <div style={{ color: "#9CA3AF", fontSize: "0.82rem", marginLeft: 4 }}>Open →</div>
            </div>
          </div>
          ))
        )}
      </div>
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.52)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 18 }}>
          <div style={{ width: 720, maxWidth: "100%", background: CARD, borderRadius: 18, overflow: "hidden", boxShadow: "0 24px 80px rgba(15,23,42,0.22)", border: `1px solid ${BDR}` }}>
            <div style={{ padding: 18, borderBottom: `1px solid ${BDR}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(135deg,#FFF7ED,#FFFFFF)" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.02rem", fontWeight: 800, color: T1 }}>Tạo workspace</h3>
                <p style={{ margin: "4px 0 0", color: "#6B7280", fontSize: "0.86rem" }}>Chọn cách tạo nhanh trong popup hoặc mở trang tạo đầy đủ.</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${BDR}`, background: CARD, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 0 }}>
              <div style={{ padding: 18, borderRight: `1px solid ${BDR}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg,#FF6B00,#FF9A3D)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <strong style={{ display: "block", color: T1 }}>Tạo nhanh trong popup</strong>
                    <span style={{ color: "#6B7280", fontSize: "0.85rem" }}>Không rời trang hiện tại, phù hợp tạo workspace tức thì.</span>
                  </div>
                </div>

                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: T1, marginBottom: 6 }}>Tên workspace</label>
                <input autoFocus value={name} onChange={e => { setName(e.target.value); setNameError(null); }} placeholder="Ví dụ: React Interview Prep"
                  style={{ width: "100%", padding: 12, borderRadius: 10, border: `1px solid ${BDR}`, outline: "none" }} />
                {nameError && <div style={{ marginTop: 8, color: "#DC2626", fontSize: 13 }}>{nameError}</div>}

                <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
                  <button onClick={() => create({ fromModal: true })}
                    style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 14px", borderRadius: 10, background: "#10B981", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700 }}>
                    Tạo workspace
                    <ArrowRight size={16} />
                  </button>
                  <button onClick={() => setShowModal(false)} style={{ padding: "11px 14px", borderRadius: 10, border: `1px solid ${BDR}`, background: CARD, cursor: "pointer", fontWeight: 700 }}>Hủy</button>
                </div>
              </div>

              <div style={{ padding: 18, background: "#FAFAFB" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: "#E0F2FE", color: "#0369A1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <LayoutGrid size={20} />
                  </div>
                  <div>
                    <strong style={{ display: "block", color: T1 }}>Trang tạo đầy đủ</strong>
                    <span style={{ color: "#6B7280", fontSize: "0.85rem" }}>Có mô tả và bố cục rõ ràng hơn cho workspace mới.</span>
                  </div>
                </div>

                <div style={{ border: `1px solid ${BDR}`, borderRadius: 14, background: CARD, padding: 14, marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, color: T1 }}>Từ popup sang trang</span>
                    <BookOpenCheck size={18} color="#FF6B00" />
                  </div>
                  <p style={{ margin: 0, color: "#6B7280", fontSize: "0.86rem", lineHeight: 1.55 }}>
                    Nếu bạn muốn thêm mô tả mục tiêu học, cấu trúc thông tin rõ ràng hơn, hãy đi sang trang tạo workspace.
                  </p>
                </div>

                <button onClick={() => { setShowModal(false); navigate('/app/workspaces/new'); }}
                  style={{ width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 14px", borderRadius: 10, border: `1px solid ${BDR}`, background: CARD, cursor: "pointer", fontWeight: 700 }}>
                  Đi tới trang tạo workspace
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.52)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 320, padding: 18 }}>
          <div style={{ width: 520, maxWidth: "100%", background: CARD, borderRadius: 18, overflow: "hidden", boxShadow: "0 24px 80px rgba(15,23,42,0.22)", border: `1px solid ${BDR}` }}>
            <div style={{ padding: 18, borderBottom: `1px solid ${BDR}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: T1 }}>Đổi tên workspace</h3>
                <p style={{ margin: "4px 0 0", color: "#6B7280", fontSize: "0.86rem" }}>Cập nhật tên để quản lý workspace rõ ràng hơn.</p>
              </div>
              <button onClick={() => setEditTarget(null)} style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${BDR}`, background: CARD, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: 18 }}>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: T1, marginBottom: 6 }}>Tên workspace</label>
              <input value={name} onChange={e => { setName(e.target.value); setNameError(null); }} style={{ width: "100%", padding: 12, borderRadius: 10, border: `1px solid ${BDR}` }} />
              {nameError && <div style={{ marginTop: 8, color: "#DC2626", fontSize: 13 }}>{nameError}</div>}
              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button onClick={saveRename} style={{ flex: 1, padding: "11px 14px", borderRadius: 10, background: "#10B981", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Check size={16} /> Lưu thay đổi
                </button>
                <button onClick={() => setEditTarget(null)} style={{ padding: "11px 14px", borderRadius: 10, border: `1px solid ${BDR}`, background: CARD, cursor: "pointer", fontWeight: 700 }}>Hủy</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.52)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 330, padding: 18 }}>
          <div style={{ width: 520, maxWidth: "100%", background: CARD, borderRadius: 18, overflow: "hidden", boxShadow: "0 24px 80px rgba(15,23,42,0.22)", border: `1px solid ${BDR}` }}>
            <div style={{ padding: 18, borderBottom: `1px solid ${BDR}`, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "#FEF2F2", color: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: T1 }}>Xóa workspace</h3>
                <p style={{ margin: "4px 0 0", color: "#6B7280", fontSize: "0.86rem" }}>Hành động này sẽ xóa workspace khỏi danh sách local.</p>
              </div>
            </div>
            <div style={{ padding: 18 }}>
              <p style={{ marginTop: 0, color: T1, fontWeight: 700 }}>Bạn có chắc muốn xóa “{deleteTarget.name}” không?</p>
              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button onClick={deleteWorkspace} style={{ flex: 1, padding: "11px 14px", borderRadius: 10, background: "#DC2626", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Trash2 size={16} /> Xóa workspace
                </button>
                <button onClick={() => setDeleteTarget(null)} style={{ padding: "11px 14px", borderRadius: 10, border: `1px solid ${BDR}`, background: CARD, cursor: "pointer", fontWeight: 700 }}>Hủy</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Notifications */}
      <div style={{ position: "fixed", right: 18, top: 80, zIndex: 600, display: "flex", flexDirection: "column", gap: 10 }}>
        {notifications.map(n => {
          let bg = "#ECFDF5";
          let border = "#BBF7D0";
          let color = "#065F46";
          let icon = <Check size={16} />;
          if (n.variant === "update") {
            bg = "#FFFBEB"; border = "#FEEBC8"; color = "#92400E"; icon = <PencilLine size={16} />;
          } else if (n.variant === "delete") {
            bg = "#FEF2F2"; border = "#FECACA"; color = "#991B1B"; icon = <Trash2 size={16} />;
          } else if (n.variant === "error") {
            bg = "#FEF2F2"; border = "#FECACA"; color = "#991B1B"; icon = <AlertTriangle size={16} />;
          } else if (n.variant === "create") {
            bg = "#ECFDF5"; border = "#BBF7D0"; color = "#065F46"; icon = <Sparkles size={16} />;
          }

          return (
            <div key={n.id} style={{ minWidth: 280, maxWidth: 380, padding: 12, borderRadius: 12, boxShadow: "0 10px 30px rgba(2,6,23,0.12)", background: bg, border: `1px solid ${border}`, color, display: "flex", gap: 12, alignItems: "center", fontWeight: 700 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", justifyContent: "center", color }}>{icon}</div>
              <div style={{ fontSize: 14 }}>{n.message}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

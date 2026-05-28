import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Calendar, Clock3, FolderKanban, Save, Trash2, UploadCloud } from "lucide-react";
import {
  deleteWorkspace,
  getWorkspace,
  updateWorkspace,
  type WorkspaceResponse,
} from "../../api/workspaceService";

const F = "'Inter','Plus Jakarta Sans',sans-serif";
const BG = "#F9FAFB";
const CARD = "#FFFFFF";
const T1 = "#111827";
const T2 = "#6B7280";
const T3 = "#9CA3AF";
const OG = "#F37021";
const BDR = "#E5E7EB";
const SH = "0 1px 3px rgba(15,23,42,0.05), 0 10px 28px rgba(15,23,42,0.06)";

function formatDate(value: string): string {
  const date = new Date(value);
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function WorkspaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<WorkspaceResponse | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;

    void getWorkspace(id)
      .then((data) => {
        setWorkspace(data);
        setName(data.name);
        setDescription(data.description || "");
        setStatus(data.status);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const dirty = useMemo(() => {
    if (!workspace) return false;
    return name !== workspace.name || description !== (workspace.description || "") || status !== workspace.status;
  }, [description, name, status, workspace]);

  const handleSave = () => {
    if (!id) return;
    setSaving(true);
    void updateWorkspace(id, {
      name,
      description: description.trim() || null,
      status,
    })
      .then((updated) => {
        setWorkspace(updated);
        setName(updated.name);
        setDescription(updated.description || "");
        setStatus(updated.status);
      })
      .finally(() => setSaving(false));
  };

  const handleDelete = () => {
    if (!id) return;
    setSaving(true);
    void deleteWorkspace(id)
      .then(() => navigate("/app/workspaces"))
      .finally(() => setSaving(false));
  };

  return (
    <div style={{ fontFamily: F, background: BG, minHeight: "100%", padding: "20px" }}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: "920px" }}>
        <Link to="/app/workspaces" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: T2, textDecoration: "none", fontWeight: 700, marginBottom: "14px" }}>
          <ArrowLeft size={14} /> Quay lại danh sách
        </Link>

        <div style={{ background: CARD, borderRadius: "18px", border: `1px solid ${BDR}`, boxShadow: SH, padding: "20px" }}>
          {loading ? (
            <div style={{ color: T2 }}>Đang tải workspace...</div>
          ) : workspace ? (
            <>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "18px" }}>
                <div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "8px", padding: "4px 10px", borderRadius: "999px", background: "#ECFDF5", color: "#047857", fontSize: "0.68rem", fontWeight: 800 }}>
                    <FolderKanban size={11} /> {workspace.status}
                  </div>
                  <h1 style={{ fontSize: "1.5rem", fontWeight: 900, color: T1, letterSpacing: "-0.03em" }}>Chi tiết workspace</h1>
                  <p style={{ fontSize: "0.84rem", color: T2, marginTop: "4px" }}>{workspace.workspaceId}</p>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                  <button
                    onClick={() => navigate("/app/syllabus")}
                    style={{
                      display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", borderRadius: "8px",
                      border: `1px solid ${BDR}`, background: "#fff", color: T1,
                      fontWeight: 700, fontSize: "0.78rem", cursor: "pointer",
                    }}
                  >
                    <UploadCloud size={14} color={OG} /> Nhập syllabus
                  </button>
                  <Link to="/app/roadmap" style={{ textDecoration: "none", color: OG, fontWeight: 800, fontSize: "0.84rem", marginLeft: "4px" }}>Mở roadmap</Link>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "14px" }}>
                <div style={{ display: "grid", gap: "14px" }}>
                  <label style={{ display: "grid", gap: "6px" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 800, color: T1 }}>Tên workspace</span>
                    <input value={name} onChange={(e) => setName(e.target.value)} style={{ padding: "12px 14px", borderRadius: "12px", border: `1px solid ${BDR}`, outline: "none", fontFamily: F }} />
                  </label>
                  <label style={{ display: "grid", gap: "6px" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 800, color: T1 }}>Mô tả</span>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} style={{ padding: "12px 14px", borderRadius: "12px", border: `1px solid ${BDR}`, outline: "none", fontFamily: F, resize: "vertical" }} />
                  </label>
                </div>

                <div style={{ display: "grid", gap: "12px", alignContent: "start" }}>
                  <label style={{ display: "grid", gap: "6px" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 800, color: T1 }}>Trạng thái</span>
                    <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: "12px 14px", borderRadius: "12px", border: `1px solid ${BDR}`, outline: "none", fontFamily: F, background: "#fff" }}>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                      <option value="DELETED">DELETED</option>
                    </select>
                  </label>

                  <div style={{ padding: "12px 14px", borderRadius: "14px", background: "#F8FAFC", border: `1px solid ${BDR}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: T2, fontSize: "0.76rem", marginBottom: "6px" }}><Calendar size={12} /> Tạo lúc</div>
                    <div style={{ fontWeight: 800, color: T1 }}>{workspace.createdAt}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: T2, fontSize: "0.76rem", marginTop: "10px", marginBottom: "6px" }}><Clock3 size={12} /> Cập nhật</div>
                    <div style={{ fontWeight: 800, color: T1 }}>{workspace.updatedAt || workspace.createdAt}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginTop: "18px", flexWrap: "wrap" }}>
                <button onClick={handleDelete} disabled={saving} style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "11px 14px", borderRadius: "10px", border: "1px solid #FECACA", background: "#FEF2F2", color: "#B91C1C", fontWeight: 800, cursor: saving ? "not-allowed" : "pointer" }}>
                  <Trash2 size={14} /> Xóa workspace
                </button>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button onClick={() => navigate("/app/workspaces")} style={{ padding: "11px 14px", borderRadius: "10px", border: `1px solid ${BDR}`, background: "#fff", color: T1, fontWeight: 700, cursor: "pointer" }}>Hủy</button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={!dirty || saving}
                    style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "11px 16px", borderRadius: "10px", border: "none", background: `linear-gradient(135deg, ${OG}, #FF8C3A)`, color: "#fff", fontWeight: 800, cursor: !dirty || saving ? "not-allowed" : "pointer", opacity: !dirty || saving ? 0.7 : 1 }}
                  >
                    <Save size={14} /> {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </motion.button>
                </div>
              </div>
            </>
          ) : (
            <div>
              <p style={{ fontWeight: 800, color: T1, marginBottom: "6px" }}>Không tìm thấy workspace</p>
              <p style={{ color: T2, fontSize: "0.84rem", marginBottom: "14px" }}>Workspace này đã bị xóa hoặc không còn tồn tại trong mock storage.</p>
              <Link to="/app/workspaces" style={{ color: OG, fontWeight: 800, textDecoration: "none" }}>Quay lại danh sách</Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
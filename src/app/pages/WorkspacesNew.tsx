import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, FolderPlus, Sparkles } from "lucide-react";
import { createWorkspace } from "../../api/workspaceService";

const F = "'Inter','Plus Jakarta Sans',sans-serif";
const BG = "#F9FAFB";
const CARD = "#FFFFFF";
const T1 = "#111827";
const T2 = "#6B7280";
const T3 = "#9CA3AF";
const OG = "#F37021";
const BDR = "#E5E7EB";
const SH = "0 1px 3px rgba(15,23,42,0.05), 0 10px 28px rgba(15,23,42,0.06)";

export default function WorkspacesNew() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!name.trim()) return;
    setSubmitting(true);
    void createWorkspace({ name, description: description.trim() || null })
      .then((workspace) => navigate(`/app/workspaces/${workspace.workspaceId}`))
      .finally(() => setSubmitting(false));
  };

  return (
    <div style={{ fontFamily: F, background: BG, minHeight: "100%", padding: "20px" }}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: "760px" }}>
        <button
          onClick={() => navigate(-1)}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "transparent", border: "none", cursor: "pointer", color: T2, fontWeight: 700, marginBottom: "14px" }}
        >
          <ArrowLeft size={14} /> Quay lại
        </button>

        <div style={{ background: CARD, borderRadius: "18px", border: `1px solid ${BDR}`, boxShadow: SH, padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#FFF3EB", border: "1px solid #FBD5BE", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FolderPlus size={18} color={OG} />
            </div>
            <div>
              <p style={{ fontSize: "0.66rem", fontWeight: 700, color: T3, letterSpacing: "0.08em", textTransform: "uppercase" }}>Tạo workspace</p>
              <h1 style={{ fontSize: "1.4rem", fontWeight: 900, color: T1, letterSpacing: "-0.03em" }}>Tạo không gian học tập mới</h1>
            </div>
          </div>

          <p style={{ color: T2, fontSize: "0.84rem", lineHeight: 1.7, marginBottom: "18px" }}>
            Form này mô phỏng đúng flow tạo workspace core của ver-2, nhưng dữ liệu được lưu cục bộ trong prototype.
          </p>

          <div style={{ display: "grid", gap: "14px" }}>
            <label style={{ display: "grid", gap: "6px" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 800, color: T1 }}>Tên workspace</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Backend Sprint, Interview Prep"
                style={{ padding: "12px 14px", borderRadius: "12px", border: `1px solid ${BDR}`, outline: "none", fontFamily: F, fontSize: "0.92rem" }}
              />
            </label>

            <label style={{ display: "grid", gap: "6px" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 800, color: T1 }}>Mô tả</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả mục tiêu, nhóm kỹ năng hoặc lộ trình của workspace..."
                rows={5}
                style={{ padding: "12px 14px", borderRadius: "12px", border: `1px solid ${BDR}`, outline: "none", fontFamily: F, fontSize: "0.92rem", resize: "vertical" }}
              />
            </label>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button
                onClick={() => navigate("/app/workspaces")}
                style={{ padding: "11px 14px", borderRadius: "10px", border: `1px solid ${BDR}`, background: "#fff", color: T1, fontWeight: 700, cursor: "pointer" }}
              >
                Hủy
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={submitting || !name.trim()}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "7px", padding: "11px 16px", borderRadius: "10px",
                  border: "none", background: `linear-gradient(135deg, ${OG}, #FF8C3A)`, color: "#fff",
                  fontWeight: 800, cursor: submitting || !name.trim() ? "not-allowed" : "pointer", opacity: submitting || !name.trim() ? 0.75 : 1,
                }}
              >
                {submitting ? <Sparkles size={14} /> : <FolderPlus size={14} />} {submitting ? "Đang tạo..." : "Tạo workspace"}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
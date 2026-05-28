import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, Calendar, Clock3, FolderKanban, Plus, Search, Sparkles, UploadCloud } from "lucide-react";
import { getMyWorkspaces, type WorkspaceResponse } from "../../api/workspaceService";

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

export default function Workspaces() {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getMyWorkspaces()
      .then(setWorkspaces)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return workspaces;
    }

    return workspaces.filter((workspace) =>
      [workspace.name, workspace.description, workspace.status].some((value) => value?.toLowerCase().includes(term))
    );
  }, [query, workspaces]);

  return (
    <div style={{ fontFamily: F, background: BG, minHeight: "100%", padding: "20px" }}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <div>
            <p style={{ fontSize: "0.66rem", fontWeight: 700, color: T3, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "4px" }}>Workspace</p>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 900, color: T1, letterSpacing: "-0.03em" }}>Không gian học tập</h1>
            <p style={{ fontSize: "0.84rem", color: T2, marginTop: "4px" }}>Danh sách workspace mock mô phỏng luồng core của ver-2.</p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/app/workspaces/new")}
            style={{
              display: "flex", alignItems: "center", gap: "7px", padding: "10px 14px", borderRadius: "10px",
              border: "none", background: `linear-gradient(135deg, ${OG}, #FF8C3A)`, color: "#fff",
              fontWeight: 800, fontSize: "0.82rem", cursor: "pointer", boxShadow: "0 6px 18px rgba(255,107,0,0.28)",
            }}
          >
            <Plus size={14} /> Tạo workspace
          </motion.button>
        </div>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "14px", marginBottom: "14px" }}>
        <div style={{ background: CARD, borderRadius: "16px", border: `1px solid ${BDR}`, boxShadow: SH, padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", border: `1px solid ${BDR}`, borderRadius: "12px", padding: "10px 12px", marginBottom: "14px" }}>
            <Search size={14} color={T3} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm workspace..."
              style={{ border: "none", outline: "none", flex: 1, fontFamily: F, fontSize: "0.9rem", color: T1, background: "transparent" }}
            />
          </div>

          {loading ? (
            <div style={{ color: T2, fontSize: "0.85rem" }}>Đang tải workspace...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", borderRadius: "14px", background: "#FFF7ED", border: "1px dashed #FBD5BE" }}>
              <Sparkles size={18} color={OG} style={{ marginBottom: "8px" }} />
              <p style={{ fontWeight: 800, color: T1, marginBottom: "4px" }}>Chưa có workspace phù hợp</p>
              <p style={{ fontSize: "0.84rem", color: T2 }}>Hãy tạo mới workspace để bắt đầu mô phỏng luồng học tập.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {filtered.map((workspace) => (
                <motion.div key={workspace.workspaceId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <Link to={`/app/workspaces/${workspace.workspaceId}`} style={{ textDecoration: "none" }}>
                    <div style={{ border: `1px solid ${BDR}`, borderRadius: "14px", padding: "16px", background: "#fff" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
                        <div>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "8px", padding: "4px 10px", borderRadius: "999px", background: "#ECFDF5", color: "#047857", fontSize: "0.68rem", fontWeight: 800 }}>
                            <FolderKanban size={11} /> {workspace.status}
                          </div>
                          <h2 style={{ fontSize: "1.02rem", fontWeight: 800, color: T1, marginBottom: "4px" }}>{workspace.name}</h2>
                          <p style={{ fontSize: "0.84rem", color: T2, lineHeight: 1.6 }}>{workspace.description || "Không có mô tả"}</p>
                        </div>
                        <ArrowRight size={16} color={OG} style={{ flexShrink: 0, marginTop: "4px" }} />
                      </div>

                      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginTop: "12px", color: T3, fontSize: "0.74rem" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}><Calendar size={12} /> Tạo: {formatDate(workspace.createdAt)}</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}><Clock3 size={12} /> Cập nhật: {formatDate(workspace.updatedAt || workspace.createdAt)}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
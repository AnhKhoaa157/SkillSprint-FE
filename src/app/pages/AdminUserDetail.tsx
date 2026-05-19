import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import adminUserService, { AdminUserDetail } from "../../api/adminUserService";

const ROLE_OPTIONS = [
  { label: "Admin", value: "ADMIN" },
  { label: "Learner", value: "LEARNER" },
];

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusInput, setStatusInput] = useState("");
  const [roleInput, setRoleInput] = useState("LEARNER");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    adminUserService.getAdminUser(id)
      .then((data) => {
        setUser(data);
        setStatusInput(data.status || "");
        setRoleInput(data.role ? String(data.role).toUpperCase() : "LEARNER");
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  async function saveStatus() {
    if (!id) return;
    try {
      setLoading(true);
      const updated = await adminUserService.updateUserStatus(id, { status: statusInput });
      setUser(updated);
      alert("Cập nhật trạng thái thành công");
    } catch (e: any) {
      alert(e.message || "Lỗi");
    } finally { setLoading(false); }
  }

  async function saveRoles() {
    if (!id) return;
    try {
      setLoading(true);
      const updated = await adminUserService.updateUserRole(id, { role: roleInput });
      setUser(updated);
      alert("Cập nhật vai trò thành công");
    } catch (e: any) {
      alert(e.message || "Lỗi");
    } finally { setLoading(false); }
  }

  if (!id) return <div style={{ padding: 20 }}>ID người dùng không hợp lệ</div>;

  return (
    <div style={{ padding: 20 }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 12 }}>Quay lại</button>
      <h2>Chi tiết người dùng</h2>
      {loading && <div>Đang tải...</div>}
      {!loading && user && (
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, maxWidth: 800 }}>
          <div style={{ marginBottom: 8 }}><strong>Email:</strong> {user.email}</div>
          <div style={{ marginBottom: 8 }}><strong>Họ & tên:</strong> {user.fullName || '—'}</div>
          <div style={{ marginBottom: 8 }}><strong>Vai trò:</strong> {user.role || '—'}</div>
          <div style={{ marginBottom: 8 }}><strong>Trạng thái:</strong> {user.status || '—'}</div>

          <hr style={{ margin: '12px 0' }} />

          <div style={{ marginBottom: 8 }}>
            <label>Trạng thái mới</label><br />
            <input value={statusInput} onChange={(e) => setStatusInput(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #E5E7EB', width: '100%' }} />
            <div style={{ marginTop: 8 }}>
              <button onClick={saveStatus} style={{ padding: '8px 12px', borderRadius: 6, background: '#06b6d4', color: '#fff', border: 'none' }}>Lưu trạng thái</button>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label>Vai trò</label><br />
            <select value={roleInput} onChange={(e) => setRoleInput(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #E5E7EB', width: '100%', background: '#fff' }}>
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <div style={{ marginTop: 8 }}>
              <button onClick={saveRoles} style={{ padding: '8px 12px', borderRadius: 6, background: '#FF6B00', color: '#fff', border: 'none' }}>Lưu vai trò</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

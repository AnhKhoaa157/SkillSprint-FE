import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import adminUserService, { AdminUserSummary } from "../../../api/adminUserService";

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminUserService.getAdminUsers(search || undefined, page, size)
      .then((data) => {
        if (cancelled) return;
        setUsers(data.content || []);
        setTotal(data.totalElements || (data.content?.length ?? 0));
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoading(false));

    return () => { cancelled = true; };
  }, [search, page, size]);

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2>Quản trị người dùng</h2>
        <div>
          <input placeholder="Tìm email hoặc tên" value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #E5E7EB' }} />
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 12 }}>
        {loading ? (
          <div>Đang tải...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#6B7280' }}>
                <th style={{ padding: '10px 8px' }}>Email</th>
                <th style={{ padding: '10px 8px' }}>Họ tên</th>
                <th style={{ padding: '10px 8px' }}>Vai trò</th>
                <th style={{ padding: '10px 8px' }}>Trạng thái</th>
                <th style={{ padding: '10px 8px' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '10px 8px' }}>{u.email}</td>
                  <td style={{ padding: '10px 8px' }}>{u.fullName || '—'}</td>
                  <td style={{ padding: '10px 8px' }}>{u.role || '—'}</td>
                  <td style={{ padding: '10px 8px' }}>{u.status || '—'}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <button onClick={() => navigate(`/admin/users/${encodeURIComponent(u.id)}`)} style={{ padding: '6px 10px', borderRadius: 6, background: '#FF6B00', color: '#fff', border: 'none' }}>Chi tiết</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>Hiển thị {users.length} / {total}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>Prev</button>
          <button onClick={() => setPage((p) => p + 1)} disabled={users.length < size}>Next</button>
        </div>
      </div>
    </div>
  );
}

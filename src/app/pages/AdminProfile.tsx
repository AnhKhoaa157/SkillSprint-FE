import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { clearAuthTokens } from "../../api/authService";
import meService, { type MeResponse } from "../../api/meService";
import { Copy } from "lucide-react";

const F    = "'Inter','Plus Jakarta Sans',sans-serif";
const T1   = "#111827";
const T3   = "#9CA3AF";
const BDR  = "#E5E7EB";
const CARD = "#FFFFFF";
const OG   = "#FF6B00";

export default function AdminProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const me = await meService.getMe();
        if (!mounted) return;
        setProfile(me);
        setFullName(me.fullName || "");
      } catch (err: any) {
        if (err?.status === 401) {
          toast.error("Phiên đăng nhập hết hạn");
          clearAuthTokens();
          navigate("/admin-login");
          return;
        }
        toast.error(err?.message || "Không thể tải profile admin");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [navigate]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const updated = await meService.updateMe({ fullName });
      setProfile(updated);
      toast.success("Cập nhật thông tin thành công");
      // notify other parts of the app
      window.dispatchEvent(new CustomEvent("skillSprint:profile-updated", { detail: updated }));
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi lưu profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyId = async () => {
    if (!profile) return;
    try {
      await navigator.clipboard.writeText(profile.userId);
      toast.success("Đã copy User ID");
    } catch {
      toast.error("Không copy được User ID");
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontFamily: F, padding: 20 }}>
      <div style={{ background: CARD, borderRadius: 12, padding: 18, border: `1px solid ${BDR}`, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <h3 style={{ margin: 0, marginBottom: 8, color: T1 }}>Admin Profile</h3>
        <p style={{ marginTop: 0, color: T3 }}>Thông tin tài khoản quản trị</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 12, marginTop: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: T1 }}>Email</label>
            <div style={{ padding: 10, border: `1px solid ${BDR}`, borderRadius: 8, marginTop: 6 }}>{profile?.email}</div>

            <label style={{ fontSize: 12, fontWeight: 600, color: T1, marginTop: 12, display: 'block' }}>Full name</label>
            <input value={fullName} onChange={e=>setFullName(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${BDR}`, marginTop: 6 }} />

            <div style={{ marginTop: 12 }}>
              <button onClick={handleSave} disabled={saving} style={{ background: OG, color: '#fff', border: 'none', padding: '10px 14px', borderRadius: 8 }}>
                {saving ? 'Saving...' : 'Lưu thông tin'}
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: T1 }}>User ID</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
              <div style={{ padding: 10, border: `1px solid ${BDR}`, borderRadius: 8, flex: 1 }}>{profile?.userId}</div>
              <button title="Copy ID" onClick={handleCopyId} style={{ background: '#F3F4F6', border: '1px solid #E5E7EB', padding: 8, borderRadius: 8 }}><Copy size={16} /></button>
            </div>

            <label style={{ fontSize: 12, fontWeight: 600, color: T1, marginTop: 12, display: 'block' }}>Role</label>
            <div style={{ padding: 10, border: `1px solid ${BDR}`, borderRadius: 8, marginTop: 6 }}>{profile?.roles?.join(", ") || '-'}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

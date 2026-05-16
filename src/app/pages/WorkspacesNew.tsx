import { useState } from "react";
import { useNavigate } from "react-router";

const STORAGE_KEY = "skillSprint.workspaces";
const F = "'Inter','Plus Jakarta Sans',sans-serif";

export default function WorkspacesNew(){
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const navigate = useNavigate();

  const create = () => {
    if(!name.trim()) return;
    const id = String(Date.now());
    const ws = { id, name: name.trim(), description: desc.trim(), createdAt: new Date().toISOString() };
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify([ws, ...arr]));
    }catch(e){}
    navigate('/app/workspaces');
  };

  return (
    <div style={{ fontFamily:F }}>
      <div style={{ maxWidth:760 }}>
        <h2 style={{ margin:0, fontSize:"1.05rem", fontWeight:800 }}>Tạo workspace mới</h2>
        <p style={{ color:"#6B7280" }}>Chọn tên và mô tả cho workspace. Sau khi tạo, bạn sẽ trở về trang Workspaces.</p>

        <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:10 }}>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Tên Workspace" style={{ padding:10, borderRadius:8, border:"1px solid #E5E7EB" }} />
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Mô tả (tùy chọn)" rows={4} style={{ padding:10, borderRadius:8, border:"1px solid #E5E7EB" }} />
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={create} style={{ padding:"8px 12px", borderRadius:8, background:"#10B981", color:"#fff", border:"none" }}>Tạo workspace</button>
            <button onClick={()=>navigate('/app/workspaces')} style={{ padding:"8px 12px", borderRadius:8, border:"1px solid #E5E7EB", background:"#fff" }}>Hủy</button>
          </div>
        </div>
      </div>
    </div>
  );
}

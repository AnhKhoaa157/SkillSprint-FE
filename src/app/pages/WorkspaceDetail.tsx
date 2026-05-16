import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, BookOpenCheck, FileUp, Sparkles, ClipboardList, Layers3, Radar, CheckCircle2, Clock3, FileText, BrainCircuit, UploadCloud, MoveDown, ShieldCheck, Zap, LoaderCircle } from "lucide-react";

const F = "'Inter','Plus Jakarta Sans',sans-serif";
const CARD = "#FFFFFF";
const BDR = "#E5E7EB";
const T1 = "#111827";

type UploadFile = { id: string; name: string; progress: number; status: "idle"|"processing"|"done" };

function toWorkspaceCode(rawId?: string) {
  if (!rawId) return "WS-CHUA-CO";

  const num = Number(rawId);
  if (Number.isFinite(num)) {
    return `WS-${Math.abs(Math.floor(num)).toString(36).toUpperCase().slice(-6).padStart(6, "0")}`;
  }

  const compact = rawId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return `WS-${compact.slice(-6).padStart(6, "0")}`;
}

export default function WorkspaceDetail(){
  const { id } = useParams();
  const navigate = useNavigate();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [results, setResults] = useState<any | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const docsCount = files.length;
  const doneDocsCount = files.filter(f => f.status === "done").length;
  const processingDocsCount = files.filter(f => f.status === "processing").length;
  const chaptersCount = results?.chapters?.length ?? 0;
  const tasksCount = results?.tasks?.length ?? 0;
  const avgProgress = files.length ? Math.round(files.reduce((s,f)=>s+f.progress,0)/files.length) : 0;
  const readyState = results ? "Đã phân tích xong" : files.length ? "Đang xử lý" : "Chờ tải lên";
  const [workspaceName, setWorkspaceName] = useState<string>("Không gian làm việc");
  const workspaceCode = toWorkspaceCode(id);

  useEffect(()=>{
    // clear results when entering different workspace
    setResults(null);
    setFiles([]);
    try {
      const raw = localStorage.getItem("skillSprint.workspaces");
      if (raw) {
        const list = JSON.parse(raw) as Array<{ id: string; name: string }>;
        const current = list.find(item => item.id === id);
        if (current?.name) setWorkspaceName(current.name);
      }
    } catch (e) {}
  },[id]);

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if(!list) return;
    const arr = Array.from(list).map(f => ({ id: String(Date.now()) + Math.random().toString(36).slice(2,8), name: f.name, progress: 0, status: "processing" as const }));
    setFiles(p => [...p, ...arr]);

    // simulate processing
    arr.forEach(uf => {
      const interval = setInterval(()=>{
        setFiles(prev => prev.map(x => x.id===uf.id ? { ...x, progress: Math.min(100, x.progress + Math.floor(Math.random()*18)+8) } : x));
      }, 400);
      // finish after a short while
      setTimeout(()=>{
        clearInterval(interval);
        setFiles(prev => prev.map(x => x.id===uf.id ? { ...x, progress: 100, status: "done" } : x));
        // when all done, generate results
        setTimeout(()=>{
          setResults(generateSampleLearningPlan());
        }, 700);
      }, 1200 + Math.random()*1600);
    });
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list).map(f => ({ id: String(Date.now()) + Math.random().toString(36).slice(2,8), name: f.name, progress: 0, status: "processing" as const }));
    setFiles(p => [...p, ...arr]);

    arr.forEach(uf => {
      const interval = setInterval(()=>{
        setFiles(prev => prev.map(x => x.id===uf.id ? { ...x, progress: Math.min(100, x.progress + Math.floor(Math.random()*18)+8) } : x));
      }, 400);
      setTimeout(()=>{
        clearInterval(interval);
        setFiles(prev => prev.map(x => x.id===uf.id ? { ...x, progress: 100, status: "done" } : x));
        setTimeout(()=>{
          setResults(generateSampleLearningPlan());
        }, 700);
      }, 1200 + Math.random()*1600);
    });
  };

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragActive(false);
    addFiles(e.dataTransfer.files);
  };

  return (
    <div style={{ fontFamily:F }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"5px 10px", borderRadius:999, border:"1px solid #FED7AA", background:"#FFF7ED", color:"#C2410C", fontSize:12, fontWeight:800, marginBottom:8 }}>
              <BookOpenCheck size={14} /> Không gian tài liệu AI
            </div>
            <h2 style={{ margin:0, fontSize:"1.12rem", fontWeight:900, color:T1, letterSpacing:"-0.02em" }}>{workspaceName}</h2>
            <p style={{ margin:"4px 0 0", color:"#6B7280", fontSize:"0.86rem" }}>Mã không gian: {workspaceCode} · Kho lưu trữ tài liệu và kết quả AI theo không gian làm việc</p>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", justifyContent:"flex-end" }}>
          <button
            style={{
              display:"inline-flex",
              alignItems:"center",
              gap:8,
              padding:"12px 18px",
              borderRadius:12,
              border:"none",
              background:"linear-gradient(135deg,#FF6B00,#FF8C3A)",
              color:"#FFFFFF",
              fontWeight:900,
              fontSize:"0.86rem",
              cursor:"pointer",
              boxShadow:"0 8px 20px rgba(255,107,0,0.34)",
              letterSpacing:"0.01em",
            }}
          >
            <Zap size={16} /> Bắt đầu Phân tích AI
          </button>
          <button onClick={() => navigate('/app/workspaces')} style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"10px 13px", borderRadius:10, border:`1px solid ${BDR}`, background:CARD, cursor:"pointer", fontWeight:700, color:"#334155" }}>
            Quay lại Không gian làm việc <ArrowLeft size={15} />
          </button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, minmax(0, 1fr))", gap:12, marginBottom:16 }}>
        {[
          { label: "Tài liệu nguồn", value: docsCount, icon: FileText, bg: "#FFF7ED", color: "#C2410C" },
          { label: "Chương", value: chaptersCount, icon: Layers3, bg: "#EFF6FF", color: "#1D4ED8" },
          { label: "Nhiệm vụ AI", value: tasksCount, icon: ClipboardList, bg: "#F5F3FF", color: "#6D28D9" },
          { label: "Tiến độ", value: `${avgProgress}%`, icon: Radar, bg: "#ECFDF5", color: "#047857" },
        ].map((item) => (
          <div key={item.label} style={{ background: CARD, padding: 14, borderRadius: 14, border: `1px solid ${BDR}`, boxShadow: "0 1px 4px rgba(15,23,42,0.05), 0 8px 20px rgba(15,23,42,0.04)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
              <span style={{ color: "#6B7280", fontSize: 12, fontWeight: 800 }}>{item.label}</span>
              <div style={{ width: 44, height: 44, borderRadius: 999, background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", color: item.color, border:"1px solid rgba(148,163,184,0.14)" }}>
                <item.icon size={22} />
              </div>
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, color: T1, lineHeight: 1, letterSpacing: "-0.03em" }}>{item.value}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: "#6B7280", fontWeight: 700 }}>{item.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"380px minmax(0, 1fr) 380px", gap:16, alignItems: "start" }}>
        <section style={{ background:CARD, padding:16, borderRadius:16, border:`1px solid ${BDR}`, boxShadow:"0 1px 4px rgba(15,23,42,0.05), 0 8px 20px rgba(15,23,42,0.04)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:"#FFF7ED", color:"#C2410C", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <FileUp size={18} />
            </div>
            <div>
              <h3 style={{ margin:0, fontSize:"1rem", fontWeight:800, color:T1 }}>Nguồn tài liệu trong không gian làm việc</h3>
              <p style={{ margin:"2px 0 0", color:"#6B7280", fontSize:"0.84rem" }}>Mỗi tài liệu tải lên sẽ được lưu theo không gian này và dùng cho AI phân tích.</p>
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:10 }}>
            <div style={{ border:`1px solid ${BDR}`, borderRadius:12, padding:"10px 12px", background:"#FAFAFB" }}>
              <div style={{ fontSize:12, color:"#6B7280", fontWeight:700, marginBottom:4 }}>Đã phân tích xong</div>
              <div style={{ fontWeight:900, color:T1, fontSize:"1.05rem" }}>{doneDocsCount} tệp</div>
            </div>
            <div style={{ border:`1px solid ${BDR}`, borderRadius:12, padding:"10px 12px", background:"#FAFAFB" }}>
              <div style={{ fontSize:12, color:"#6B7280", fontWeight:700, marginBottom:4 }}>Đang xử lý</div>
              <div style={{ fontWeight:900, color:T1, fontSize:"1.05rem" }}>{processingDocsCount} tệp</div>
            </div>
          </div>

          <label
            onDragEnter={() => setDragActive(true)}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            style={{ display:"block", marginTop:12, minHeight:270, border:`2px dashed ${dragActive ? "#F97316" : "#94A3B8"}`, borderRadius:14, padding:20, background: dragActive ? "#FFF7ED" : "#FAFAFB", cursor:"pointer", transition:"all 0.15s ease", backgroundImage:"linear-gradient(to right, rgba(148,163,184,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.07) 1px, transparent 1px)", backgroundSize:"18px 18px" }}
          >
            <div style={{ display:"flex", gap:12, alignItems:"center", justifyContent:"center", flexDirection:"column", height:"100%", textAlign:"center" }}>
              <div style={{ width:84, height:84, borderRadius:20, background: dragActive ? "#FDBA74" : "#E2E8F0", color: dragActive ? "#9A3412" : "#475569", display:"flex", alignItems:"center", justifyContent:"center", border:"1px solid rgba(148,163,184,0.25)" }}>
                {dragActive ? <MoveDown size={34} /> : <FileText size={34} />}
              </div>
              <div style={{ maxWidth:280 }}>
                <strong style={{ display:"block", color:T1, fontSize:"0.95rem" }}>{dragActive ? "Thả tài liệu vào đây" : "Kéo thả tài liệu vào đây hoặc Chọn file"}</strong>
                <span style={{ color:"#6B7280", fontSize:"0.84rem", marginTop:6, display:"block", lineHeight:1.5 }}>{dragActive ? "Thả file để hệ thống tự đọc và xử lý." : "Hỗ trợ PDF, DOCX, TXT... tối đa 50MB"}</span>
              </div>
            </div>
            <input type="file" multiple onChange={onFiles} style={{ display:"none" }} />
          </label>

          <div style={{ marginTop:14 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: T1 }}>Tài liệu đang xử lý</span>
              <span style={{ fontSize: 12, color: "#6B7280" }}>{files.length ? `${files.length} file` : "Chưa có file"}</span>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {files.length === 0 ? (
                <div style={{ padding:16, borderRadius:12, background:"#FAFAFB", border:`1px solid ${BDR}`, textAlign:"center", color:"#6B7280", fontSize:"0.86rem" }}>
                  Chưa tải lên tài liệu nào.
                </div>
              ) : files.map(f => (
                <div key={f.id} style={{ padding:12, borderRadius:12, border:`1px solid ${BDR}`, background:"#FAFAFB" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", gap:12, marginBottom:8, alignItems:"center" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
                      <div style={{ width:30, height:30, borderRadius:10, background: f.status === "done" ? "#ECFDF5" : "#EFF6FF", color: f.status === "done" ? "#047857" : "#1D4ED8", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        {f.status === "done" ? <CheckCircle2 size={16} /> : <BrainCircuit size={16} />}
                      </div>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontWeight:800, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", color:T1 }}>{f.name}</div>
                        <div style={{ color:"#6B7280", fontSize:12 }}>{f.status === "done" ? "Đã xử lý" : "Đang đọc và phân tích"}</div>
                      </div>
                    </div>
                    <div style={{ color:"#6B7280", fontSize:12, fontWeight:700 }}>{f.progress}%</div>
                  </div>
                  <div style={{ height:8, background:"#E5E7EB", borderRadius:999, overflow:"hidden" }}>
                    <div style={{ width:`${f.progress}%`, height:"100%", background:"linear-gradient(90deg,#F97316,#10B981)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ background:CARD, padding:16, borderRadius:16, border:`1px solid ${BDR}`, boxShadow:"0 1px 4px rgba(15,23,42,0.05), 0 8px 20px rgba(15,23,42,0.04)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:"#F5F3FF", color:"#6D28D9", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Sparkles size={18} />
            </div>
            <div>
              <h3 style={{ margin:0, fontSize:"1rem", fontWeight:800, color:T1 }}>Kho kết quả AI phân tích</h3>
              <p style={{ margin:"2px 0 0", color:"#6B7280", fontSize:"0.84rem" }}>Toàn bộ chương, lộ trình và nhiệm vụ được lưu theo không gian để tái sử dụng.</p>
            </div>
          </div>

          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:10 }}>
            <span style={{ padding:"5px 9px", borderRadius:999, background:"#EFF6FF", border:"1px solid #BFDBFE", color:"#1D4ED8", fontSize:12, fontWeight:800 }}>Chương có cấu trúc</span>
            <span style={{ padding:"5px 9px", borderRadius:999, background:"#FFF7ED", border:"1px solid #FED7AA", color:"#C2410C", fontSize:12, fontWeight:800 }}>Dòng thời gian lộ trình</span>
            <span style={{ padding:"5px 9px", borderRadius:999, background:"#ECFDF5", border:"1px solid #BBF7D0", color:"#047857", fontSize:12, fontWeight:800 }}>Nhiệm vụ hành động</span>
          </div>

          {!results ? (
            <div style={{ padding:18, borderRadius:14, border:`1px dashed ${BDR}`, background:"#FAFAFB" }}>
              <p style={{ margin:0, color:"#475569", fontWeight:700 }}>Chưa có nội dung phân tích.</p>
              <p style={{ margin:"6px 0 0", color:"#6B7280", fontSize:"0.86rem", lineHeight:1.6 }}>
                Tải lên tài liệu để hệ thống tự đọc, phân tích, sinh chương/chủ đề, lộ trình và nhiệm vụ.
              </p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ border:`1px solid ${BDR}`, borderRadius:14, padding:14, background:"#FAFAFB" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                  <Layers3 size={16} color="#1D4ED8" />
                  <h4 style={{ margin:0, fontSize:"0.92rem", fontWeight:800, color:T1 }}>Chương / Chủ đề</h4>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {results.chapters.map((c:any, i:number)=>(
                    <div key={i} style={{ background:CARD, border:`1px solid ${BDR}`, borderRadius:12, padding:12 }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, marginBottom:6 }}>
                        <div style={{ fontWeight:800, color:T1 }}>{c.title}</div>
                        <ShieldCheck size={15} color="#047857" />
                      </div>
                      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                        {c.topics.map((topic:string, idx:number)=> (
                          <span key={idx} style={{ padding:"5px 8px", borderRadius:999, background:"#EFF6FF", color:"#1D4ED8", fontSize:12, fontWeight:700, border:"1px solid #BFDBFE" }}>{topic}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ border:`1px solid ${BDR}`, borderRadius:14, padding:14, background:"#FAFAFB" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                  <Clock3 size={16} color="#C2410C" />
                  <h4 style={{ margin:0, fontSize:"0.92rem", fontWeight:800, color:T1 }}>Lộ trình học</h4>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {results.roadmap.map((r:any,i:number)=>(
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:10, borderRadius:12, background:CARD, border:`1px solid ${BDR}` }}>
                      <div style={{ width:26, height:26, borderRadius:999, background:"#FFF7ED", color:"#C2410C", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:12, fontWeight:800 }}>{i+1}</div>
                      <div style={{ color:T1, fontWeight:700 }}>{r}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ border:`1px solid ${BDR}`, borderRadius:14, padding:14, background:"#FAFAFB" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                  <ClipboardList size={16} color="#047857" />
                  <h4 style={{ margin:0, fontSize:"0.92rem", fontWeight:800, color:T1 }}>Nhiệm vụ sinh tự động</h4>
                </div>
                <ul style={{ margin:0, paddingLeft:18, display:"flex", flexDirection:"column", gap:8 }}>
                  {results.tasks.map((t:any,i:number)=>(<li key={i} style={{ color:T1, lineHeight:1.5 }}>{t}</li>))}
                </ul>
              </div>
            </div>
          )}
        </section>

        <section style={{ background:CARD, padding:16, borderRadius:16, border:`1px solid ${BDR}`, boxShadow:"0 1px 4px rgba(15,23,42,0.05), 0 8px 20px rgba(15,23,42,0.04)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:"#ECFDF5", color:"#047857", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h3 style={{ margin:0, fontSize:"1rem", fontWeight:800, color:T1 }}>Tiến trình Xử lý AI</h3>
              <p style={{ margin:"2px 0 0", color:"#6B7280", fontSize:"0.84rem" }}>Theo dõi tiến trình tài liệu đi vào kho không gian làm việc và được AI xử lý.</p>
            </div>
          </div>

          <div style={{ border:`1px solid ${BDR}`, borderRadius:12, background:"#FAFAFB", padding:"10px 12px", marginBottom:10 }}>
            <div style={{ fontWeight:800, color:T1, fontSize:"0.84rem", marginBottom:4 }}>Trạng thái lưu trữ hiện tại</div>
            <div style={{ color:"#6B7280", fontSize:"0.78rem", lineHeight:1.55 }}>
              Không gian này đang chứa {docsCount} tài liệu nguồn và {chaptersCount} chương đã được AI tạo.
            </div>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ display:"flex", gap:12, padding:12, borderRadius:14, border:"1px solid #BBF7D0", background:"#F0FDF4" }}>
              <div style={{ width:34, height:34, borderRadius:12, background:"#DCFCE7", color:"#047857", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <FileUp size={16} />
              </div>
              <div style={{ minWidth:0, flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, marginBottom:4 }}>
                  <span style={{ fontWeight:800, color:T1 }}>1. Upload tài liệu</span>
                  <span style={{ fontSize:11, fontWeight:800, color:"#047857", background:"#DCFCE7", border:"1px solid #86EFAC", borderRadius:999, padding:"2px 8px" }}>Hoàn tất</span>
                </div>
                <div style={{ color:"#6B7280", fontSize:"0.86rem", lineHeight:1.55 }}>Người dùng thêm file vào workspace.</div>
              </div>
            </div>

            <div style={{ display:"flex", gap:12, padding:12, borderRadius:14, border:"1px solid #BFDBFE", background:"#EFF6FF" }}>
              <div style={{ width:34, height:34, borderRadius:12, background:"#DBEAFE", color:"#1D4ED8", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <LoaderCircle size={16} />
              </div>
              <div style={{ minWidth:0, flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, marginBottom:4 }}>
                  <span style={{ fontWeight:800, color:T1 }}>2. Giải nén / Đọc tài liệu</span>
                  <span style={{ fontSize:11, fontWeight:800, color:"#1D4ED8", background:"#DBEAFE", border:"1px solid #93C5FD", borderRadius:999, padding:"2px 8px" }}>Đang xử lý 35%</span>
                </div>
                <div style={{ color:"#6B7280", fontSize:"0.86rem", lineHeight:1.55 }}>Hệ thống phân tách và trích nội dung.</div>
              </div>
            </div>

            <div style={{ display:"flex", gap:12, padding:12, borderRadius:14, border:`1px solid ${BDR}`, background:"#F8FAFC" }}>
              <div style={{ width:34, height:34, borderRadius:12, background:"#E5E7EB", color:"#64748B", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Sparkles size={16} />
              </div>
              <div style={{ minWidth:0, flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, marginBottom:4 }}>
                  <span style={{ fontWeight:800, color:T1 }}>3. Sinh structure</span>
                  <span style={{ fontSize:11, fontWeight:800, color:"#64748B", background:"#F1F5F9", border:"1px solid #CBD5E1", borderRadius:999, padding:"2px 8px" }}>Đang chờ</span>
                </div>
                <div style={{ color:"#6B7280", fontSize:"0.86rem", lineHeight:1.55 }}>Tạo chương, lộ trình và nhiệm vụ.</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function generateSampleLearningPlan(){
  return {
    chapters: [
      { title: "Nhập môn và nền tảng", topics: ["Tổng quan", "Cài đặt", "Khái niệm cơ bản"] },
      { title: "Thuật toán cốt lõi", topics: ["Sắp xếp", "Tìm kiếm", "Đệ quy"] },
      { title: "Chủ đề nâng cao", topics: ["Đồ thị", "Quy hoạch động"] },
    ],
    roadmap: ["Tuần 1: Nền tảng", "Tuần 2: Thuật toán cốt lõi", "Tuần 3: Chủ đề nâng cao"],
    tasks: ["Đọc chương 1", "Hoàn thành bài luyện: sắp xếp", "Xây dựng dự án nhỏ"],
  };
}

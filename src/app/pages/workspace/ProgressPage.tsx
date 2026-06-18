import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, BarChart3, LoaderCircle, Map, Plus } from "lucide-react";
import workspaceService, { type WorkspaceResponse } from "../../../api/workspaceService";
import WorkspaceProgress from "../../components/workspace/WorkspaceProgress";
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";

const CARD = "#FFFFFF";
const BG = "#F9FAFB";
const OG = "#FF6B00";

export default function ProgressPage() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    workspaceService.getMyWorkspaces()
      .then((res) => {
        if (!mounted) return;
        setWorkspaces(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch workspaces", err);
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (loading) return;
    
    // Redirect logic
    if (!workspaceId && workspaces.length > 0) {
      // Find the first active or recent workspace
      const activeOrRecent = workspaces.find(w => w.status === "ACTIVE") || workspaces[0];
      navigate(`/app/workspaces/${activeOrRecent.workspaceId}/progress`, { replace: true });
    }
  }, [workspaceId, workspaces, loading, navigate]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center h-full">
        <LoaderCircle className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center h-full p-6 text-center" style={{ background: BG }}>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-w-sm w-full">
          <div className="mx-auto w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mb-4">
            <BarChart3 className="text-orange-500" size={24} />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Chưa có môn học nào</h2>
          <p className="text-sm text-slate-500 mb-6">
            Bạn cần tạo ít nhất một môn học (workspace) để có thể theo dõi tiến độ học tập.
          </p>
          <Button 
            className="w-full bg-[#FF6B00] hover:bg-[#EA580C] text-white rounded-xl h-11 shadow-md shadow-orange-500/20"
            onClick={() => navigate("/app/workspaces/new")}
          >
            <Plus size={18} className="mr-2" />
            Tạo môn học mới
          </Button>
        </div>
      </div>
    );
  }

  if (!workspaceId) {
    // Should be redirected by useEffect, but render nothing or a loader in the meantime
    return (
      <div className="flex flex-1 items-center justify-center h-full">
        <LoaderCircle className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  // Render the progress dashboard
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: BG }}>
      {/* Header Banner */}
      <div className="relative mx-6 mt-6 mb-2 flex flex-col justify-between gap-6 overflow-hidden rounded-[2rem] border border-amber-200/40 bg-gradient-to-br from-white via-[#FCFAF5] to-[#F8F5EE] p-6 shadow-[0_4px_24px_-4px_rgba(255,126,33,0.04),0_1px_4px_rgba(0,0,0,0.02)] sm:flex-row sm:items-center sm:p-8 flex-shrink-0">
        <div className="absolute -left-20 -top-20 h-48 w-48 rounded-full bg-[#FF7E21]/5 blur-[80px]" />
        
        <div className="relative space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#FF7E21]/10 to-[#FFD29D]/10 border border-[#FF7E21]/20 px-3.5 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-[#FF7E21]">
            <BarChart3 className="h-3.5 w-3.5" />
            Tiến độ học tập
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800">Báo cáo & Phân tích</h2>
          <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-500/90 font-medium">
            Theo dõi tiến độ, đánh giá hiệu suất và nắm bắt kết quả học tập chi tiết của từng môn học.
          </p>
        </div>

        <div className="relative flex flex-wrap items-center gap-3">
          <Select
            value={workspaceId}
            onValueChange={value => navigate(`/app/workspaces/${value}/progress`)}
          >
            <SelectTrigger className="rounded-2xl border-slate-200 bg-white px-4 h-[46px] text-sm font-bold text-slate-700 outline-none transition hover:bg-slate-50 focus:border-[#FF7E21]/60 focus:ring-4 focus:ring-[#FF7E21]/15 min-w-[240px] max-w-sm shadow-sm cursor-pointer data-[state=open]:border-[#FF7E21]/60 data-[state=open]:ring-4 data-[state=open]:ring-[#FF7E21]/15">
              <SelectValue placeholder="Chọn workspace..." />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border border-slate-100 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.08)] py-1.5 px-1 min-w-[240px]">
              {workspaces.length === 0 ? (
                <div className="py-3 text-center text-sm font-medium text-slate-400 italic">Chưa có workspace</div>
              ) : (
                workspaces.map(workspace => (
                  <SelectItem 
                    key={workspace.workspaceId} 
                    value={workspace.workspaceId}
                    className="rounded-xl py-2.5 px-3 text-sm font-bold text-slate-700 focus:bg-orange-50 focus:text-[#FF7E21] cursor-pointer transition-colors"
                  >
                    {workspace.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 custom-scrollbar">
        <WorkspaceProgress workspaceId={workspaceId} />
      </div>
    </div>
  );
}

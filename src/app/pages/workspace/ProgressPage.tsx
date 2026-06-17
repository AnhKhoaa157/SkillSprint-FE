import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, BarChart3, LoaderCircle, Map, Plus } from "lucide-react";
import workspaceService, { type WorkspaceResponse } from "../../../api/workspaceService";
import WorkspaceProgress from "../../components/workspace/WorkspaceProgress";
import { Button } from "../../components/ui/button";

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
      {/* Header (optional, similar to Roadmap.tsx) */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shadow-sm z-10 relative">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate("/app/workspaces")}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 size={20} className="text-[#FF6B00]" />
              Tiến độ học tập
            </h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 custom-scrollbar">
        <WorkspaceProgress workspaceId={workspaceId} />
      </div>
    </div>
  );
}

import SkillTree2DFallback from "./SkillTree2DFallback";

type ForceMode = "auto" | "2d" | "3d";

type NodeStatus = "completed" | "active" | "locked";

type SkillTreeNode = {
  id: string;
  cx: number;
  cy: number;
  status: NodeStatus;
};

type Safe3DViewerProps = {
  nodes: SkillTreeNode[];
  selectedId: string | null;
  width: number;
  height: number;
  className?: string;
  forceMode?: ForceMode;
};

export default function Safe3DViewer({
  nodes,
  selectedId,
  width,
  height,
  className,
  forceMode = "auto",
}: Safe3DViewerProps) {
  return <SkillTree2DFallback className={className} reason={forceMode === "2d" ? "forced-2d" : "3d-disabled"} />;
}

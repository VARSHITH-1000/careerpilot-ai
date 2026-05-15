import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import ForceGraph2D from "react-force-graph-2d";

interface KnowledgeGraphProps {
  data: {
    nodes: { id: string; group?: number }[];
    links: { source: string; target: string; value?: number }[];
  };
  width?: number;
  height?: number;
}

export default function KnowledgeGraph({ data, width = 600, height = 400 }: KnowledgeGraphProps) {
  const fgRef = useRef<any>(null);

  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force("charge").strength(-400);
      fgRef.current.d3Force("link").distance(100);
    }
  }, [data]);

  if (!data || !data.nodes || data.nodes.length === 0) {
    return <div className="text-slate-500 text-sm p-4 text-center">No graph data available to visualize.</div>;
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="rounded-xl overflow-hidden border border-white/10 bg-black/50">
      <ForceGraph2D
        ref={fgRef}
        width={width}
        height={height}
        graphData={data}
        nodeLabel="id"
        nodeColor={(node: any) => {
          const colors = ["#6366f1", "#ec4899", "#14b8a6", "#f59e0b", "#8b5cf6"];
          return colors[(node.group || 0) % colors.length];
        }}
        linkColor={() => "rgba(255,255,255,0.2)"}
        backgroundColor="rgba(0,0,0,0)"
        nodeRelSize={6}
        linkWidth={(link: any) => (link.value ? link.value * 0.5 : 1)}
      />
    </motion.div>
  );
}

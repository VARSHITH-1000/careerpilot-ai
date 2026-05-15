import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { apiJson } from "~/lib/api.client";
import { ExternalLink, Percent, Info } from "lucide-react";

interface Paper {
  id: string;
  title: string;
  abstract: string;
  year: number | string;
  authors: string[];
  url: string;
  citationCount: number;
  semantic_similarity_score?: number;
  relevance_explanation?: string;
}

export function PaperDiscovery({ docId }: { docId?: string }) {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!docId) return;

    const fetchPapers = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await apiJson<{ papers: Paper[] }>(`/api/rag/documents/discover?doc_id=${encodeURIComponent(docId)}&limit=5`);
        setPapers(res.papers || []);
      } catch (err: any) {
        setError(err.message || "Failed to discover papers.");
      } finally {
        setLoading(false);
      }
    };

    fetchPapers();
  }, [docId]);

  if (!docId) {
    return (
      <div className="flex flex-col gap-4 mt-6">
        <h3 className="text-lg font-semibold text-white">Discover Related Research</h3>
        <p className="text-slate-400 text-sm">Select a document from your Knowledge Base to discover contextually related papers via semantic search.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 mt-6">
      <h3 className="text-lg font-semibold text-white">Intelligent Discoveries</h3>
      
      {loading && (
        <div className="flex items-center gap-3 text-indigo-400 text-sm py-4">
          <span className="animate-spin text-xl">⚙️</span>
          <span>Searching academic databases and running semantic matching...</span>
        </div>
      )}
      
      {error && <div className="text-red-400 text-sm p-4 rounded-xl bg-red-500/10 border border-red-500/30">{error}</div>}
      
      <div className="flex flex-col gap-4">
        {papers.map((paper) => (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={paper.id} className="p-5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors relative overflow-hidden">
            {paper.semantic_similarity_score !== undefined && (
              <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1">
                <Percent className="w-3 h-3" /> {paper.semantic_similarity_score} Match
              </div>
            )}
            
            <div className="pr-16">
              <a href={paper.url || "#"} target="_blank" rel="noreferrer" className="text-base font-medium text-white hover:text-indigo-300 flex items-center gap-2">
                {paper.title}
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </a>
            </div>
            
            <div className="text-xs text-slate-400 mt-2 flex items-center gap-3">
              <span>📅 {paper.year}</span>
              <span>•</span>
              <span>Ц Citations: {paper.citationCount}</span>
            </div>
            
            <p className="text-xs text-slate-500 mt-1 line-clamp-1">{paper.authors.join(", ")}</p>
            
            {paper.relevance_explanation && (
              <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex gap-3 items-start">
                <Info className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                <p className="text-xs text-indigo-200 leading-relaxed font-medium">
                  {paper.relevance_explanation}
                </p>
              </div>
            )}
            
            <p className="text-sm text-slate-300 mt-4 line-clamp-3 leading-relaxed">{paper.abstract}</p>
          </motion.div>
        ))}
        {!loading && papers.length === 0 && !error && (
          <div className="text-slate-500 text-sm p-4 text-center">No related papers found for this document's context.</div>
        )}
      </div>
    </div>
  );
}

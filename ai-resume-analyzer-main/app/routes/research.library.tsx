import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch, apiJson } from "~/lib/api.client";
import FileUploader from "~/components/FileUploader";
import { ResearchDashboard } from "~/modules/research/components/ResearchDashboard";
import { PaperDiscovery } from "~/modules/research/components/PaperDiscovery";
import { cn } from "~/lib/utils";
import { FileText, Lightbulb, Target, Zap, AlertTriangle, ArrowRight } from "lucide-react";
import { useResearchStore } from "~/store/research.store";

export default function ResearchLibrary() {
  const [documents, setDocuments] = useState<any[]>([]);
  const { activeDocId, setActiveDocId } = useResearchStore();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const loadDocuments = async () => {
    try {
      const res = await apiJson<{ documents: any[] }>("/api/rag/documents/");
      setDocuments(res.documents || []);
    } catch (e: any) {
      setError("Failed to load documents: " + e.message);
    }
  };

  useEffect(() => {
    loadDocuments();
    // Poll for status updates if there are processing documents
    const interval = setInterval(() => {
      setDocuments(prev => {
        if (prev.some(d => d.status === "processing")) {
          loadDocuments();
        }
        return prev;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUpload = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await apiFetch("/api/rag/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Upload failed");
      }

      await loadDocuments();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const selectedDoc = documents.find(d => d.id === activeDocId);

  return (
    <div className="flex flex-col gap-6">
      {/* Research Analytics Dashboard */}
      <ResearchDashboard analyticsData={selectedDoc?.analytics} />

      <div className="next-glass border border-white/10 p-6 sm:p-8">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-white mb-4">
          Upload Research Document
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          Upload PDFs (research papers, job descriptions, notes) to add to your AI knowledge base. Processing may take a few moments.
        </p>

        <div className="max-w-md">
          {uploading ? (
            <div className="flex items-center gap-3 text-indigo-400">
              <span className="animate-spin text-xl">⚙️</span>
              <span className="text-sm">Initiating background processing...</span>
            </div>
          ) : (
            <FileUploader onFileSelect={handleUpload} />
          )}
        </div>
        
        {error && (
          <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        )}
      </div>

      <div className="next-glass border border-white/10 p-6 sm:p-8">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-white mb-6">
          Your Knowledge Base
        </h2>
        
        {documents.length === 0 ? (
          <p className="text-sm text-slate-500">No documents uploaded yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            {documents.map((doc) => (
              <motion.div
                key={doc.id}
                onClick={() => setActiveDocId(doc.id)}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "flex flex-col gap-2 rounded-2xl border p-4 cursor-pointer transition-all",
                  activeDocId === doc.id 
                    ? "bg-indigo-500/20 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.1)]" 
                    : "bg-white/5 border-white/5 hover:bg-white/10"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
                      <FileText className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-200" title={doc.filename}>
                        {doc.filename}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className={cn(
                    "rounded-md px-2 py-0.5 text-[10px] font-medium",
                    doc.status === "processing" ? "bg-amber-500/20 text-amber-300 animate-pulse" :
                    doc.status === "completed" || doc.status === "processed" ? "bg-emerald-500/20 text-emerald-300" :
                    "bg-red-500/20 text-red-300"
                  )}>
                    {doc.status}
                  </span>
                  {activeDocId === doc.id && (
                    <span className="text-[10px] text-indigo-400 font-medium">Selected</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Deep Insights Panel */}
        <AnimatePresence mode="wait">
          {selectedDoc && (
            <motion.div
              key={selectedDoc.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="border-t border-white/10 pt-8 mt-4">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-indigo-400" />
                  Deep Research Insights
                </h3>
                
                {selectedDoc.status === "processing" ? (
                  <div className="flex items-center justify-center py-12 text-indigo-400">
                    <span className="animate-spin text-2xl mr-3">⚙️</span>
                    <span>Extracting intelligence and generating analytics...</span>
                  </div>
                ) : !selectedDoc.insights || Object.keys(selectedDoc.insights).length === 0 ? (
                  <div className="text-slate-500 text-sm text-center py-8">No insights available for this document.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InsightCard title="Core Contributions" icon={<Target className="w-4 h-4" />} content={selectedDoc.insights.core_contributions} />
                    <InsightCard title="Methodology" icon={<FileText className="w-4 h-4" />} content={selectedDoc.insights.methodology} />
                    <InsightCard title="Key Findings" icon={<Lightbulb className="w-4 h-4" />} content={selectedDoc.insights.findings} />
                    <InsightCard title="Limitations & Future Scope" icon={<AlertTriangle className="w-4 h-4" />} content={selectedDoc.insights.limitations + "\n\n" + selectedDoc.insights.future_scope} />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Paper Discovery Section */}
      <div className="next-glass border border-white/10 p-6 sm:p-8">
        <PaperDiscovery docId={activeDocId || undefined} />
      </div>
    </div>
  );
}

function InsightCard({ title, icon, content }: { title: string, icon: React.ReactNode, content: string }) {
  if (!content || content === "undefined\n\nundefined") return null;
  return (
    <div className="bg-black/20 border border-white/5 rounded-xl p-5">
      <h4 className="text-sm font-semibold text-indigo-300 flex items-center gap-2 mb-3">
        {icon}
        {title}
      </h4>
      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
        {content}
      </p>
    </div>
  );
}

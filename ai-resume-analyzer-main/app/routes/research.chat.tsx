import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { apiFetch, apiJson } from "~/lib/api.client";
import { cn } from "~/lib/utils";
import { useResearchStore } from "~/store/research.store";
import { Lock, FileText, MessageSquare, ChevronRight } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
  citations?: { filename: string; doc_id: string }[];
};

export default function ResearchChat() {
  const { activeDocId, setActiveDocId } = useResearchStore();
  const [documents, setDocuments] = useState<any[]>([]);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("general");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load all available processed documents
  useEffect(() => {
    setDocumentsError(null);
    apiJson<{ documents: any[] }>("/api/rag/documents/")
      .then((res) =>
        setDocuments(
          (res.documents || []).filter(
            (d: any) => d.status === "completed" || d.status === "processed"
          )
        )
      )
      .catch((e) => {
        setDocuments([]);
        setDocumentsError(e instanceof Error ? e.message : "Failed to load papers");
      });
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Reset / seed messages when the active document or document list changes
  useEffect(() => {
    if (activeDocId) {
      const doc = documents.find((d) => d.id === activeDocId);
      setMessages([
        {
          role: "assistant",
          content: `I am now locked to **${doc?.filename || "your selected paper"}**. Ask me anything about it — methodology, findings, key concepts, or prepare for interview questions!`,
        },
      ]);
    } else {
      setMessages([]);
    }
  }, [activeDocId, documents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !activeDocId) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await apiFetch("/api/rag/chat/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMsg, mode, doc_id: activeDocId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to get answer");

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          citations: data.citations,
        },
      ]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, I encountered an error: ${e.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const selectedDoc = documents.find((d) => d.id === activeDocId);

  return (
    <div className="flex h-[calc(100vh-180px)] min-h-[600px] gap-4 overflow-hidden">
      {/* Left sidebar: Document selector */}
      <div className="w-64 shrink-0 flex flex-col overflow-hidden">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden flex flex-col h-full">
          <div className="px-4 py-3 border-b border-white/10 bg-white/5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              Research Papers
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Select a paper to chat about
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {documentsError ? (
              <p className="text-xs text-amber-200/90 text-center py-6 px-2">{documentsError}</p>
            ) : documents.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6 px-2">
                No processed papers found. Upload papers in the Library first.
              </p>
            ) : (
              documents.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setActiveDocId(doc.id)}
                  className={cn(
                    "w-full flex items-start gap-2.5 rounded-xl p-3 text-left transition-all",
                    activeDocId === doc.id
                      ? "bg-indigo-500/20 border border-indigo-500/40"
                      : "hover:bg-white/5 border border-transparent"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg text-sm",
                      activeDocId === doc.id
                        ? "bg-indigo-500/30 text-indigo-300"
                        : "bg-white/10 text-slate-400"
                    )}
                  >
                    📄
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-xs font-medium truncate",
                        activeDocId === doc.id
                          ? "text-indigo-200"
                          : "text-slate-300"
                      )}
                    >
                      {doc.filename}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {activeDocId === doc.id && (
                    <ChevronRight className="w-4 h-4 shrink-0 text-indigo-400 self-center" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right: Chat panel */}
      <div className="flex-1 flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300 relative">
              🤖
              {activeDocId && (
                <Lock className="w-3 h-3 absolute bottom-1 right-1 text-emerald-400" />
              )}
            </span>
            <div className="min-w-0">
              <h2 className="font-semibold text-white text-sm">
                Isolated AI Assistant
              </h2>
              {selectedDoc ? (
                <p className="text-xs text-emerald-400 font-medium truncate max-w-[200px]">
                  Locked to: {selectedDoc.filename}
                </p>
              ) : (
                <p className="text-xs text-slate-400">
                  Select a paper from the left panel
                </p>
              )}
            </div>
          </div>

          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            disabled={!activeDocId}
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
          >
            <option value="general">General Q&A</option>
            <option value="explainer">Research Explainer</option>
            <option value="interview">Interview Prep</option>
            <option value="methodology">Methodology Analysis</option>
          </select>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 scroll-smooth">
          {!activeDocId ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <MessageSquare className="w-12 h-12 text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Select a Research Paper
              </h3>
              <p className="text-slate-400 text-sm max-w-sm">
                Choose a processed paper from the left sidebar to start an
                isolated, context-bound AI conversation.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex max-w-[85%] flex-col gap-2",
                    msg.role === "user"
                      ? "self-end items-end"
                      : "self-start items-start"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-2xl px-5 py-3.5 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-indigo-500 text-white rounded-tr-sm"
                        : "bg-white/10 text-slate-200 border border-white/5 rounded-tl-sm"
                    )}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 flex flex-col gap-1.5 border-t border-white/10 pt-3">
                        <p className="text-xs font-semibold text-slate-400">
                          Sources:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {msg.citations.map((c, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[11px] text-slate-300 border border-white/10"
                            >
                              📄 {c.filename}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="self-start rounded-2xl rounded-tl-sm border border-white/5 bg-white/10 px-5 py-4"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="size-1.5 animate-bounce rounded-full bg-slate-400" />
                    <span
                      className="size-1.5 animate-bounce rounded-full bg-slate-400"
                      style={{ animationDelay: "0.2s" }}
                    />
                    <span
                      className="size-1.5 animate-bounce rounded-full bg-slate-400"
                      style={{ animationDelay: "0.4s" }}
                    />
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-white/10 bg-white/5 p-4 shrink-0">
          <form
            onSubmit={handleSubmit}
            className="mx-auto flex max-w-4xl items-center gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                activeDocId
                  ? "Ask a question about this document..."
                  : "Select a paper first..."
              }
              disabled={loading || !activeDocId}
              className="flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim() || !activeDocId}
              className="flex shrink-0 items-center justify-center rounded-xl bg-indigo-500 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-600 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

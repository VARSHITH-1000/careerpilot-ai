import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiJson } from "~/lib/api.client";
import {
  Globe, Search, ArrowRight, Zap, AlertTriangle, TrendingUp,
  History, Target, BookOpen, ExternalLink, Users, Quote,
  Info
} from "lucide-react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from "recharts";

const GAP_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#22c55e",
};

export default function ResearchExplore() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [intelligence, setIntelligence] = useState<any>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || loading) return;

    setLoading(true);
    setError("");
    // We keep old intelligence if it's a partial result to avoid flickering, 
    // but usually, we want a fresh start
    setIntelligence(null);

    try {
      const res = await apiJson<any>(
        `/api/rag/explore/topic?query=${encodeURIComponent(searchQuery)}`
      );
      if (res.error) {
        setError(res.error);
      } else {
        setIntelligence(res);
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate research intelligence.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    performSearch(query);
  };

  // Debounced search for repeated user actions (like typing if we wanted auto-search, 
  // but here we'll debounce the button click if they spam it)
  const debouncedSearch = () => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 500);
  };

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Search Hero */}
      <div className="next-glass border border-white/10 p-6 sm:p-8 text-center">
        <Globe className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-white mb-2">
          Internet-Scale Research Discovery
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto mb-8">
          Scan the latest academic papers, identify research gaps, and get a
          visual intelligence report on any topic.
        </p>

        <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Transformer models in medical image segmentation"
            className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-14 pr-36 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
            disabled={loading}
          />
          <Search className="w-6 h-6 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2 top-2 bottom-2 bg-indigo-500 hover:bg-indigo-600 text-white px-6 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              "Scanning..."
            ) : (
              <>
                <span>Explore</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-6 max-w-3xl mx-auto p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-left flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* Loading */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <span className="animate-spin text-4xl mb-6">⚙️</span>
            <p className="text-lg font-medium text-white mb-2">
              Scanning the Global Research Landscape...
            </p>
            <p className="text-sm text-slate-400 text-center max-w-md">
              Fetching papers from Semantic Scholar and running AI analysis.
              This may take 15–30 seconds.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {!loading && intelligence && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-6"
          >
            {/* Partial Result Banner */}
            {intelligence.partial && (
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex gap-3 items-center text-amber-200 text-sm">
                <Info className="w-5 h-5 text-amber-400 shrink-0" />
                <p>{intelligence.note || "Showing partial results due to API rate limits."}</p>
              </div>
            )}

            {/* Paper Cards */}
            {intelligence.papers?.length > 0 && (
              <div className="next-glass border border-white/10 p-6 sm:p-8">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                  Discovered Papers ({intelligence.papers.length})
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {intelligence.papers.map((paper: any, i: number) => (
                    <motion.div
                      key={paper.id || i}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-slate-100 leading-tight line-clamp-3 flex-1">
                          {paper.title}
                        </h4>
                        {paper.url && (
                          <a
                            href={paper.url}
                            target="_blank"
                            rel="noreferrer"
                            className="shrink-0 text-indigo-400 hover:text-indigo-300"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                        {paper.abstract}
                      </p>
                      <div className="mt-auto flex items-center justify-between pt-2 border-t border-white/5">
                        <span className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Users className="w-3 h-3" />
                          {paper.authors?.slice(0, 2).join(", ") || "Unknown"}
                          {paper.authors?.length > 2 ? " et al." : ""}
                        </span>
                        <div className="flex items-center gap-2">
                          {paper.year && (
                            <span className="text-[11px] text-indigo-400">
                              {paper.year}
                            </span>
                          )}
                          {paper.citationCount > 0 && (
                            <span className="flex items-center gap-1 text-[11px] text-amber-400">
                              <Quote className="w-3 h-3" />
                              {paper.citationCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Methodology & Research Gaps — side-by-side */}
            {!intelligence.partial && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Methodology Radar */}
                {intelligence.methodology_chain?.length > 0 && (
                  <div className="next-glass border border-white/10 p-6 sm:p-8">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-indigo-400" />
                      Methodology Coverage
                    </h3>
                    <div style={{ width: "100%", height: 260 }}>
                      <ResponsiveContainer>
                        <RadarChart
                          data={intelligence.methodology_chain.map(
                            (m: any) => ({
                              subject:
                                m.paper_title?.length > 18
                                  ? m.paper_title.slice(0, 18) + "…"
                                  : m.paper_title,
                              value: m.effectiveness || 50,
                            })
                          )}
                        >
                          <PolarGrid stroke="#ffffff15" />
                          <PolarAngleAxis
                            dataKey="subject"
                            stroke="#94a3b8"
                            fontSize={11}
                          />
                          <PolarRadiusAxis
                            domain={[0, 100]}
                            stroke="#ffffff10"
                          />
                          <Radar
                            dataKey="value"
                            stroke="#6366f1"
                            fill="#6366f1"
                            fillOpacity={0.35}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#1e293b",
                              border: "1px solid #334155",
                              borderRadius: "8px",
                            }}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Method details cards */}
                    <div className="mt-4 flex flex-col gap-3">
                      {intelligence.methodology_chain
                        .slice(0, 3)
                        .map((m: any, i: number) => (
                          <div
                            key={i}
                            className="bg-white/5 border border-white/5 rounded-xl p-4"
                          >
                            <p className="text-sm font-semibold text-indigo-300 mb-1">
                              {m.paper_title}
                            </p>
                            <p className="text-xs text-slate-400 mb-2">
                              Method: {m.methodology}
                            </p>
                            {m.problems && (
                              <div className="bg-rose-500/10 border border-rose-500/20 p-2 rounded text-[10px] text-rose-200">
                                <span className="font-bold text-rose-400">Limitations: </span>
                                {m.problems}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Research Gaps */}
                {intelligence.research_gaps?.length > 0 && (
                  <div className="next-glass border border-white/10 p-6 sm:p-8">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Target className="w-5 h-5 text-rose-400" />
                      Research Gaps & Opportunities
                    </h3>
                    <div className="flex flex-col gap-4">
                      {intelligence.research_gaps.map((gap: any, i: number) => (
                        <div
                          key={i}
                          className="bg-white/5 border border-white/10 p-4 rounded-xl"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-white text-sm">
                              {gap.area}
                            </h4>
                            {gap.severity && (
                              <span
                                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: `${GAP_COLORS[gap.severity] || "#6366f1"}25`,
                                  color:
                                    GAP_COLORS[gap.severity] || "#6366f1",
                                }}
                              >
                                {gap.severity.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-400 leading-relaxed">
                            {gap.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Trend Timeline */}
            {!intelligence.partial && intelligence.trend_evolution?.length > 0 && (
              <div className="next-glass border border-white/10 p-6 sm:p-8">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  Research Trend Evolution
                </h3>
                <div className="relative border-l-2 border-indigo-500/30 ml-4 pl-8 flex flex-col gap-8">
                  {intelligence.trend_evolution.map(
                    (trend: any, i: number) => (
                      <div key={i} className="relative">
                        <div className="absolute -left-[37px] top-1 flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500 ring-4 ring-slate-900 text-[9px] font-bold text-white">
                          {i + 1}
                        </div>
                        <span className="inline-block text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full mb-2">
                          {trend.period}
                        </span>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          {trend.focus}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Foundational & Latest Papers */}
            {!intelligence.partial && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {intelligence.foundational_papers?.length > 0 && (
                  <div className="next-glass border border-white/10 p-6 sm:p-8">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <History className="w-5 h-5 text-slate-400" />
                      Foundational Papers
                    </h3>
                    <div className="flex flex-col gap-3">
                      {intelligence.foundational_papers.map(
                        (p: any, i: number) => (
                          <div
                            key={i}
                            className="bg-white/5 border border-white/10 p-4 rounded-xl"
                          >
                            <a
                              href={p.url || "#"}
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium text-indigo-300 hover:underline text-sm block mb-1"
                            >
                              {p.title} {p.year && `(${p.year})`}
                            </a>
                            <p className="text-xs text-slate-400">{p.reason}</p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {intelligence.latest_advancements?.length > 0 && (
                  <div className="next-glass border border-white/10 p-6 sm:p-8">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Target className="w-5 h-5 text-fuchsia-400" />
                      Latest Advancements
                    </h3>
                    <div className="flex flex-col gap-3">
                      {intelligence.latest_advancements.map(
                        (p: any, i: number) => (
                          <div
                            key={i}
                            className="bg-white/5 border border-white/10 p-4 rounded-xl"
                          >
                            <a
                              href={p.url || "#"}
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium text-fuchsia-300 hover:underline text-sm block mb-1"
                            >
                              {p.title} {p.year && `(${p.year})`}
                            </a>
                            <p className="text-xs text-slate-400">
                              {p.innovation}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

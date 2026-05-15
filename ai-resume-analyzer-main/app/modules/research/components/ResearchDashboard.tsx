import { motion } from "framer-motion";
import {
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { BookOpen, Brain, Network, Zap } from "lucide-react";

interface DashboardProps {
  analyticsData?: any;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export function ResearchDashboard({ analyticsData }: DashboardProps) {
  if (!analyticsData) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-slate-400">
        Select a research paper from your Knowledge Base to view its isolated analytics and visualizations.
      </div>
    );
  }

  const { keywords, methodology_distribution, concept_clusters } = analyticsData;

  // Adapt the keywords to RadarChart expected format
  const topics = keywords?.map((k: any) => ({
    subject: k.text,
    A: k.value,
    fullMark: 100
  })) || [];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Concept Clusters</p>
              <h3 className="text-2xl font-bold text-white mt-1">{concept_clusters?.length || 0}</h3>

            <div className="flex flex-wrap gap-2 mt-4">
               {concept_clusters && concept_clusters.map((cluster: string, idx: number) => (
                 <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 * idx }} key={idx} className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-xs font-medium text-purple-300">
                   {cluster}
                 </motion.span>
               ))}
            </div>

            </div>
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Network className="w-5 h-5 text-purple-400" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Extracted Keywords</p>
              <h3 className="text-2xl font-bold text-white mt-1">{keywords?.length || 0}</h3>
            </div>
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Zap className="w-5 h-5 text-green-400" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Methodologies</p>
              <h3 className="text-2xl font-bold text-white mt-1">{methodology_distribution?.length || 0}</h3>
            </div>
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Brain className="w-5 h-5 text-orange-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topic Radar */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-lg font-medium text-white mb-6">Document Keyword Density</h3>
          {topics && topics.length > 0 ? (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={topics}>
                  <PolarGrid stroke="#ffffff20" />
                  <PolarAngleAxis dataKey="subject" stroke="#9ca3af" fontSize={12} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#ffffff20" />
                  <Radar name="Density" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-500 text-sm">Not enough data to display topic radar.</div>
)}
        </motion.div>

        {/* Methodology Distribution */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.5 }} className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-lg font-medium text-white mb-6">Methodology Breakdown</h3>
          {methodology_distribution && methodology_distribution.length > 0 ? (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={methodology_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {methodology_distribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
             <div className="h-[300px] flex items-center justify-center text-slate-500 text-sm">Not enough data to display methodology distribution.</div>
)}
        </motion.div>
      </div>

      {/* Heatmap Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }} className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm mt-6">
        <h3 className="text-lg font-medium text-white mb-6">Methodology Heatmap</h3>
        {methodology_distribution && methodology_distribution.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {methodology_distribution.map((entry: any, index: number) => {
               // Assign opacity based on percentage value (0-100)
               const intensity = Math.min(100, Math.max(20, entry.value || 0));
               const bgClass = `rgba(59, 130, 246, ${intensity / 100})`;
               return (
                 <motion.div whileHover={{ scale: 1.05 }} key={index} className="p-4 rounded-xl border border-blue-500/20 flex flex-col items-center justify-center text-center h-24" style={{ backgroundColor: bgClass }}>
                   <span className="text-xl font-bold text-white">{entry.value}%</span>
                   <span className="text-xs text-blue-100 mt-1">{entry.name}</span>
                 </motion.div>
               );
            })}
          </div>
        ) : (
          <div className="h-24 flex items-center justify-center text-slate-500 text-sm">Not enough data to display heatmap.</div>
        )}
      </motion.div>
    </div>
  );
}

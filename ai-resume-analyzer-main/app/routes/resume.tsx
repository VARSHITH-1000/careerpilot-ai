import { Link, useLocation, useNavigate, useParams } from "react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import IntelligenceDashboard from "~/components/IntelligenceDashboard";
import { normalizeFeedback } from "~/lib/feedback";
import { AppShell } from "~/modules/layout/AppShell";
import { ExternalLink } from "lucide-react";
import { useAuth } from "~/contexts/AuthContext";
import { apiJson } from "~/lib/api.client";

export const meta = () => [
  { title: "NEXT AI — Resume intelligence" },
  { name: "description", content: "Hybrid ATS scoring, recruiter insights, and improvement roadmap." },
];

type DetailResponse = {
  resume: {
    id: string;
    companyName?: string;
    jobTitle?: string;
    jobDescription?: string;
    targetRole?: TargetRole;
    feedback: Feedback;
  };
  pdfUrl: string;
  imageUrl: string;
};

const Resume = () => {
  const { user, loading } = useAuth();
  const { id } = useParams();
  const location = useLocation();
  const [imageUrl, setImageUrl] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate(`/auth?next=/resume/${id}`);
  }, [loading, user, navigate, id]);

  useEffect(() => {
    const load = async () => {
      if (!id || !user) return;
      setDetailLoading(true);
      setLoadError(null);
      try {
        const data = await apiJson<DetailResponse>(`/api/resumes/${id}`);
        setResumeUrl(data.pdfUrl);
        setImageUrl(data.imageUrl);
        setFeedback(normalizeFeedback(data.resume.feedback, data.resume.targetRole));
      } catch (e) {
        setResumeUrl("");
        setImageUrl("");
        setFeedback(null);
        setLoadError(e instanceof Error ? e.message : "Could not load this resume.");
      } finally {
        setDetailLoading(false);
      }
    };
    void load();
  }, [id, user]);

  useEffect(() => {
    if (!feedback || !location.hash) return;
    const elId = location.hash.slice(1);
    requestAnimationFrame(() => {
      document.getElementById(elId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [feedback, location.hash]);

  return (
    <AppShell
      title="Resume intelligence"
      subtitle="Hybrid scoring, heatmaps, recruiter insights, and interview readiness — scroll or use the sidebar to jump between panels."
      wide
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link to="/dashboard" className="back-button">
          <span aria-hidden>←</span>
          <span>Back to dashboard</span>
        </Link>
        {resumeUrl ? (
          <a
            href={resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="next-btn-ghost !inline-flex items-center gap-2 !rounded-xl !px-3 !py-2 text-xs"
          >
            <ExternalLink className="size-3.5" />
            Open PDF
          </a>
        ) : null}
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <section className="flex w-full flex-col items-center lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:w-[min(44%,480px)] lg:shrink-0">
          {imageUrl && resumeUrl ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="gradient-border w-full max-w-md"
            >
              <div className="gradient-border-inner">
                <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <img
                    src={imageUrl}
                    className="max-h-[70vh] w-full object-contain object-top"
                    alt="Resume preview"
                  />
                </a>
              </div>
            </motion.div>
          ) : (
            <div className="flex w-full max-w-md flex-col gap-3 p-4">
              <div className="skeleton aspect-[3/4] w-full rounded-2xl" />
              <div className="skeleton h-3 w-2/3 rounded" />
              <div className="skeleton h-3 w-1/2 rounded" />
            </div>
          )}
        </section>

        <section className="min-w-0 flex-1">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Intelligence report
          </h2>
          {loadError ? (
            <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-6 text-sm text-amber-100">
              <p className="font-medium text-amber-50">Could not load this report</p>
              <p className="mt-2 text-amber-100/90">{loadError}</p>
              <Link to="/dashboard" className="mt-4 inline-block text-xs font-semibold text-cyan-300 underline">
                Return to dashboard
              </Link>
            </div>
          ) : feedback ? (
            <div className="mt-6 flex flex-col gap-6">
              <IntelligenceDashboard feedback={feedback} />
            </div>
          ) : detailLoading ? (
            <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-200 py-16 dark:border-white/15">
              <div className="relative size-14">
                <span className="absolute inset-0 rounded-full border-2 border-indigo-500/25" />
                <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-cyan-400" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading analysis workspace…</p>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-slate-400">
              No analysis data is available for this resume.
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
};

export default Resume;

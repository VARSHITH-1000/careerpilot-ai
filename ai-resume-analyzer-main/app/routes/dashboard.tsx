import type { Route } from "./+types/dashboard";
import { AppShell } from "~/modules/layout/AppShell";
import { OnboardingBanner } from "~/modules/onboarding/OnboardingBanner";
import ResumeCard from "~/components/ResumeCard";
import { Link, useNavigate } from "react-router";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "~/contexts/AuthContext";
import { apiJson } from "~/lib/api.client";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "NEXT AI — Dashboard" },
    { name: "description", content: "Intelligent career copilot — resume intelligence dashboard." },
  ];
}

type ListResponse = { resumes: Resume[] };

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadResumes = useCallback(async () => {
    if (!user) return;
    setLoadingResumes(true);
    setLoadError(null);
    try {
      const data = await apiJson<ListResponse>("/api/resumes");
      setResumes(data.resumes ?? []);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load resumes");
      setResumes([]);
    } finally {
      setLoadingResumes(false);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) navigate("/auth?next=/dashboard");
  }, [loading, user, navigate]);

  useEffect(() => {
    if (user) void loadResumes();
  }, [user, loadResumes]);

  return (
    <AppShell
      title="Dashboard"
      subtitle="Hybrid ATS intelligence, recruiter insights, and improvement roadmaps."
      wide
    >
      <OnboardingBanner />

      {loadError ? (
        <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {loadError}
        </p>
      ) : null}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-white">
            Your analyses
          </h2>
          <p className="mt-1 max-w-xl text-sm text-slate-400">
            Every upload is scored with deterministic parsers fused with contextual AI — open any card to explore the
            full intelligence workspace.
          </p>
        </div>
        <Link to="/upload" className="next-btn-primary w-full shrink-0 sm:w-auto">
          Start new analysis
        </Link>
      </div>

      {loadingResumes ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="next-glass h-72 animate-pulse rounded-2xl border border-white/5 bg-white/5" />
          ))}
        </div>
      ) : resumes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="next-glass flex flex-col items-center justify-center gap-6 border-dashed border-white/20 px-8 py-16 text-center"
        >
          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-indigo-200">
            Empty workspace
          </div>
          <div>
            <p className="text-lg font-semibold text-white">No resumes yet</p>
            <p className="mt-2 max-w-md text-sm text-slate-400">
              Upload your first PDF to unlock hybrid scoring, skill coverage, recruiter concerns, and interview
              readiness signals.
            </p>
          </div>
          <Link to="/upload" className="next-btn-primary">
            Upload resume
          </Link>
        </motion.div>
      ) : (
        <div className="resumes-section">
          {resumes.map((resume) => (
            <ResumeCard key={resume.id} resume={resume} />
          ))}
        </div>
      )}
    </AppShell>
  );
}

import type { Route } from "./+types/landing";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/contexts/AuthContext";
import ScoreRadarChart from "~/components/analytics/ScoreRadarChart";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
};

const features = [
  {
    title: "AI Resume Intelligence",
    body: "Structured breakdowns with weaknesses, missing keywords, and recruiter concerns — not vague scores.",
  },
  {
    title: "Hybrid ATS scoring",
    body: "60% deterministic parsers on your PDF text fused with 40% contextual LLM judgment for stable, explainable results.",
  },
  {
    title: "Skill gap analysis",
    body: "Role-aware skill buckets surface coverage gaps across languages, frameworks, data, cloud, and AI/ML.",
  },
  {
    title: "AI interview preparation",
    body: "Technical, DSA, communication, and AI/ML readiness lenses with actionable improvement guidance.",
  },
  {
    title: "Recruiter analytics",
    body: "Strengths, hiring risks, ATS optimization notes, and a phased roadmap you can execute immediately.",
  },
  {
    title: "Career roadmap generation",
    body: "Phased improvement plans with concrete bullets — from ATS fixes to narrative upgrades and interview prep.",
  },
  {
    title: "Resume heatmaps",
    body: "Section strength signals plus JD keyword density so you know exactly where to rewrite next.",
  },
];

const steps = [
  "Upload resume",
  "AI + deterministic analysis",
  "ATS intelligence",
  "Skill gap detection",
  "Interview readiness",
  "Career roadmap",
];

const testimonials = [
  {
    quote:
      "Feels closer to an internal hiring intelligence tool than a keyword checker. The hybrid breakdown finally matches what I see as a hiring manager.",
    name: "Jordan Lee",
    role: "Engineering Manager, Series B",
  },
  {
    quote:
      "The roadmap phases are shockingly practical. We used it to tighten bullets before a Big Tech loop and the signal-to-noise improved overnight.",
    name: "Priya Nandakumar",
    role: "Senior ML Engineer",
  },
  {
    quote:
      "Premium UX, fast iteration, and the radar view makes tradeoffs obvious. This is what modern AI career products should feel like.",
    name: "Alex Ortiz",
    role: "Staff Frontend Engineer",
  },
];

export function meta({}: Route.MetaArgs) {
  return [
    { title: "NEXT AI — Intelligent Career Copilot" },
    {
      name: "description",
      content:
        "Hybrid resume intelligence: deterministic ATS metrics fused with contextual AI. Skill gaps, recruiter insights, and interview readiness in one workspace.",
    },
  ];
}

export default function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate("/dashboard");
  }, [loading, user, navigate]);

  const previewValues = [78, 72, 68, 81, 74, 70, 76];
  const previewLabels = ["ATS", "Technical", "Projects", "Structure", "Keywords", "Leadership", "Experience"];

  return (
    <div className="dark relative min-h-screen overflow-x-hidden text-slate-100">
      <div className="pointer-events-none fixed inset-0 next-hero-grid opacity-70" />
      <div className="pointer-events-none fixed -left-40 top-0 h-[520px] w-[520px] rounded-full bg-indigo-600/25 blur-3xl" />
      <div className="pointer-events-none fixed -right-32 top-32 h-[420px] w-[420px] rounded-full bg-cyan-500/20 blur-3xl" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-6 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 text-sm font-bold text-white shadow-lg shadow-indigo-500/40">
            N
          </span>
          <span className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">NEXT AI</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/auth?next=/dashboard" className="next-btn-ghost hidden sm:inline-flex">
            Sign in
          </Link>
          <Link to="/auth?next=/dashboard" className="next-btn-primary !px-4 !py-2 text-sm">
            Launch app
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <section className="grid gap-12 pb-16 pt-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:pt-10">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">
              Intelligent career copilot
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              The resume OS for{" "}
              <span className="next-gradient-text">serious candidates</span>.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
              NEXT AI fuses measurable ATS heuristics with contextual reasoning — so you get consistent scoring,
              recruiter-grade narratives, and a roadmap that actually ships.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link to="/auth?next=/dashboard" className="next-btn-primary px-8 py-3 text-base">
                Get started free
              </Link>
              <Link to="/auth?next=/upload" className="next-btn-ghost justify-center px-8 py-3 text-base">
                Analyze a resume
              </Link>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Built for engineers, researchers, and operators who want clarity — not another generic ATS percentage.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="next-glass relative overflow-hidden border-indigo-500/25 p-1"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/15 via-transparent to-cyan-500/10" />
            <div className="relative rounded-[20px] bg-slate-950/40 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Live preview</p>
                  <p className="mt-1 text-sm font-medium text-white">Hybrid category radar</p>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                  60/40 blend
                </span>
              </div>
              <div className="mt-4">
                <ScoreRadarChart labels={previewLabels} values={previewValues} />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] text-slate-400">
                <div className="rounded-xl border border-white/10 bg-white/5 px-2 py-2">
                  <p className="text-lg font-semibold text-white">78</p>
                  <p>ATS</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-2 py-2">
                  <p className="text-lg font-semibold text-white">72</p>
                  <p>Skills</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-2 py-2">
                  <p className="text-lg font-semibold text-white">88</p>
                  <p>Confidence</p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-white sm:text-4xl">
              Everything you need to win the shortlist
            </h2>
            <p className="mt-3 text-slate-400">
              A cohesive intelligence layer across ATS mechanics, narrative quality, and interview positioning.
            </p>
          </motion.div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.article
                key={f.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.05 }}
                className="next-glass group p-5 transition hover:border-indigo-400/40 hover:shadow-[0_0_40px_-12px_rgba(99,102,241,0.45)]"
              >
                <h3 className="text-base font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.body}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="py-16">
          <div className="next-glass grid gap-10 border-cyan-500/20 p-6 lg:grid-cols-2 lg:p-10">
            <motion.div {...fadeUp}>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-white sm:text-3xl">
                Analytics preview
              </h2>
              <p className="mt-3 text-sm text-slate-400">
                Radar blends, JD keyword heatmaps, skill bucket coverage, and recruiter dashboards ship inside the
                product — not as screenshots.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-300">
                <li className="flex gap-2">
                  <span className="text-cyan-400">▹</span> Deterministic + LLM fusion with explicit reasoning traces
                </li>
                <li className="flex gap-2">
                  <span className="text-cyan-400">▹</span> Roadmap phases grounded in measurable gaps
                </li>
                <li className="flex gap-2">
                  <span className="text-cyan-400">▹</span> Role-aware weighting for ML, frontend, backend, and data
                </li>
              </ul>
            </motion.div>
            <motion.div {...fadeUp} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <ScoreRadarChart labels={previewLabels} values={[65, 82, 70, 58, 74, 66, 71]} />
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                  initial={{ width: "0%" }}
                  whileInView={{ width: "82%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </div>
              <p className="mt-2 text-center text-xs text-slate-500">ATS optimization trajectory (illustrative)</p>
            </motion.div>
          </div>
        </section>

        <section className="py-16">
          <motion.h2 {...fadeUp} className="text-center font-[family-name:var(--font-display)] text-3xl font-semibold text-white">
            How it works
          </motion.h2>
          <motion.div
            {...fadeUp}
            className="mx-auto mt-10 flex max-w-4xl flex-col gap-4 sm:flex-row sm:flex-wrap sm:justify-center"
          >
            {steps.map((label, idx) => (
              <div key={label} className="flex items-center gap-2 text-sm text-slate-300">
                <span className="flex size-8 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-200">
                  {idx + 1}
                </span>
                <span>{label}</span>
                {idx < steps.length - 1 ? <span className="hidden text-slate-600 sm:inline">→</span> : null}
              </div>
            ))}
          </motion.div>
        </section>

        <section className="py-16">
          <motion.h2 {...fadeUp} className="text-center font-[family-name:var(--font-display)] text-3xl font-semibold text-white">
            Teams ship faster with NEXT AI
          </motion.h2>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.blockquote
                key={t.name}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                className="next-glass flex h-full flex-col justify-between p-5"
              >
                <p className="text-sm leading-relaxed text-slate-300">“{t.quote}”</p>
                <footer className="mt-4 border-t border-white/10 pt-4 text-xs text-slate-500">
                  <p className="font-semibold text-slate-200">{t.name}</p>
                  <p>{t.role}</p>
                </footer>
              </motion.blockquote>
            ))}
          </div>
        </section>

        <section className="py-20">
          <motion.div
            {...fadeUp}
            className="next-glass relative overflow-hidden border-indigo-400/30 px-6 py-12 text-center sm:px-12"
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-indigo-600/20 via-transparent to-cyan-500/15" />
            <div className="relative">
              <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-white sm:text-4xl">
                Ready for your next offer?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
                Sign in, upload a PDF, and get a production-grade intelligence report in minutes — tuned to your target
                role and job description.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link to="/auth?next=/dashboard" className="next-btn-primary px-10 py-3 text-base">
                  Open NEXT AI
                </Link>
                <Link to="/auth?next=/upload" className="next-btn-ghost px-8 py-3 text-base">
                  Try analysis
                </Link>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 py-10 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} NEXT AI — Intelligent Career Copilot</p>
      </footer>
    </div>
  );
}

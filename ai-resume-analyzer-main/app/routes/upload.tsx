import { type FormEvent, useEffect, useState } from "react";
import { AppShell } from "~/modules/layout/AppShell";
import FileUploader from "~/components/FileUploader";
import { useNavigate } from "react-router";
import { convertPdfToImage } from "~/lib/pdf2img";
import { useAuth } from "~/contexts/AuthContext";
import { apiFetch } from "~/lib/api.client";
import { motion, AnimatePresence } from "framer-motion";
import { extractResumeTextForScoring } from "~/controllers/resume-analysis";

const TARGET_ROLES: TargetRole[] = [
  "Software Engineer",
  "ML Engineer",
  "Data Scientist",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
];

export const meta = () => [
  { title: "NEXT AI — New analysis" },
  { name: "description", content: "Upload a resume for hybrid ATS intelligence." },
];

// ── Progressive loading stages ────────────────────────────────────────────────
type Stage = "parsing" | "preview" | "uploading" | "analyzing" | "saving" | "done" | "error";

const STAGE_META: Record<Stage, { label: string; detail: string; progress: number; icon: string }> = {
  parsing:   { label: "Extracting resume content",  detail: "Reading text layers from your PDF…",          progress: 10, icon: "📄" },
  preview:   { label: "Generating preview",          detail: "Rendering the first page of your document…",  progress: 25, icon: "🖼️" },
  uploading: { label: "Securing your documents",    detail: "Encrypting and storing files privately…",      progress: 45, icon: "🔒" },
  analyzing: { label: "Running ATS analysis",       detail: "Deterministic scoring + career AI insights…",  progress: 70, icon: "⚡" },
  saving:    { label: "Saving results",              detail: "Finalizing and storing your report…",          progress: 92, icon: "💾" },
  done:      { label: "Analysis complete!",          detail: "Redirecting to your report…",                 progress: 100, icon: "✅" },
  error:     { label: "Something went wrong",        detail: "",                                             progress: 0,  icon: "⚠️" },
};

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full max-w-xs">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          style={{ backgroundSize: "200% 100%" }}
        />
      </div>
      <p className="mt-1.5 text-right text-xs text-slate-500">{progress}%</p>
    </div>
  );
}

function LoadingState({ stage, error }: { stage: Stage; error?: string }) {
  const meta = STAGE_META[stage];
  const STAGES: Stage[] = ["parsing", "preview", "uploading", "analyzing", "saving", "done"];
  const currentIdx = STAGES.indexOf(stage);

  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      {/* Spinner */}
      {stage !== "done" && stage !== "error" && (
        <div className="relative size-16">
          <span className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-xl">{meta.icon}</span>
        </div>
      )}
      {stage === "done" && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex size-16 items-center justify-center rounded-full bg-emerald-500/20 text-3xl"
        >
          ✅
        </motion.div>
      )}
      {stage === "error" && (
        <div className="flex size-16 items-center justify-center rounded-full bg-red-500/20 text-3xl">⚠️</div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={stage}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col items-center gap-1"
        >
          <p className="text-sm font-semibold text-white">{meta.label}</p>
          <p className="max-w-xs text-xs text-slate-500">{stage === "error" ? error : meta.detail}</p>
        </motion.div>
      </AnimatePresence>

      {stage !== "error" && <ProgressBar progress={meta.progress} />}

      {/* Step dots */}
      {stage !== "error" && (
        <div className="flex gap-2">
          {STAGES.map((s, i) => (
            <motion.div
              key={s}
              className={`size-1.5 rounded-full transition-colors duration-300 ${
                i < currentIdx
                  ? "bg-emerald-400"
                  : i === currentIdx
                    ? "bg-cyan-400"
                    : "bg-white/15"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const Upload = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth?next=/upload");
  }, [loading, user, navigate]);

  const [stage, setStage] = useState<Stage | null>(null);
  const [error, setError] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [statusText, setStatusText] = useState(""); // for non-processing error messages

  const isProcessing = stage !== null && stage !== "error";

  const handleFileSelect = (f: File | null) => setFile(f);

  const handleAnalyze = async ({
    companyName,
    jobTitle,
    jobDescription,
    targetRole,
    file,
  }: {
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    targetRole: TargetRole;
    file: File;
  }) => {
    setError("");
    setStatusText("");

    // Hoisted so clearLabel() is accessible from the outer catch
    let labelTimer: ReturnType<typeof setTimeout> | null = null;
    const clearLabel = () => { if (labelTimer) { clearTimeout(labelTimer); labelTimer = null; } };

    try {
      // Stage 1 — Extract text
      setStage("parsing");
      const resumeText = await extractResumeTextForScoring(file);

      // Stage 2 — Generate preview image
      setStage("preview");
      const imageFile = await convertPdfToImage(file);
      if (!imageFile.file) {
        setStage("error");
        setError("Failed to convert PDF to preview image.");
        return;
      }

      // Stage 3 — Upload (show immediately, request goes in background)
      setStage("uploading");
      const form = new FormData();
      form.set("company-name", companyName);
      form.set("job-title", jobTitle);
      form.set("job-description", jobDescription);
      form.set("target-role", targetRole);
      form.set("resumeText", resumeText);
      form.set("resume", file);
      form.set("image", imageFile.file);

      // Stage 4 — Analyze (switch label once request is in flight)
      // Create the AbortController BEFORE starting the fetch so the signal is wired in
      const TIMEOUT_MS = 5 * 60 * 1000; // 5-minute hard client-side timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const uploadPromise = apiFetch("/api/resumes", {
        method: "POST",
        body: form,
        signal: controller.signal,
      });

      // After a short delay switch to "analyzing" label for UX
      labelTimer = setTimeout(() => setStage("analyzing"), 1200);

      let res: Response;
      try {
        res = await uploadPromise;
      } catch (fetchError) {
        clearLabel();
        clearTimeout(timeoutId);
        if ((fetchError as any)?.name === "AbortError") {
          setStage("error");
          setError("Analysis timed out. Please try again — large PDFs may take up to 2 minutes.");
          return;
        }
        throw fetchError;
      }
      clearLabel();
      clearTimeout(timeoutId);
      setStage("analyzing");

      if (!res.ok) {
        let msg = res.statusText;
        try {
          const j = (await res.json()) as { error?: string };
          if (j?.error) msg = j.error;
        } catch { /* ignore */ }
        setStage("error");
        setError(msg);
        return;
      }

      const data = (await res.json()) as { id?: string; error?: string };
      if (!data.id) {
        setStage("error");
        setError(data.error ?? "Invalid server response.");
        return;
      }

      // Stage 5 — Saving
      setStage("saving");
      await new Promise((r) => setTimeout(r, 600)); // brief visual beat

      setStage("done");
      await new Promise((r) => setTimeout(r, 800));
      navigate(`/resume/${data.id}`);
    } catch (err) {
      clearLabel();
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setStage("error");
      setError(message);
      console.error("Resume analysis error:", err);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget.closest("form");
    if (!form) return;
    const formData = new FormData(form);
    const companyName = formData.get("company-name") as string;
    const jobTitle = formData.get("job-title") as string;
    const jobDescription = formData.get("job-description") as string;
    const targetRole = (formData.get("target-role") as TargetRole) || "Software Engineer";
    if (!file) return;
    void handleAnalyze({ companyName, jobTitle, jobDescription, targetRole, file });
  };

  return (
    <AppShell
      title="Resume intelligence"
      subtitle="Hybrid deterministic parsers + contextual AI — tuned to your target role and job description."
    >
      <div className="mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="next-glass border border-white/10 p-6 sm:p-8"
        >
          {stage ? (
            <LoadingState stage={stage} error={error} />
          ) : (
            <>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-white">
                Upload &amp; analyze
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                PDF only. Add a rich job description for stronger keyword and overlap scoring.
              </p>

              <form id="upload-form" onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
                <div className="form-div group">
                  <label className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase transition-colors group-focus-within:text-indigo-400" htmlFor="company-name">Company</label>
                  <input className="w-full rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-white placeholder-slate-500 backdrop-blur-md transition-all duration-300 focus:border-indigo-500/50 focus:bg-slate-900/80 focus:ring-4 focus:ring-indigo-500/10 hover:bg-slate-900/60 hover:border-white/20" type="text" name="company-name" placeholder="Acme Inc." id="company-name" />
                </div>
                <div className="form-div group">
                  <label className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase transition-colors group-focus-within:text-indigo-400" htmlFor="job-title">Job title</label>
                  <input className="w-full rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-white placeholder-slate-500 backdrop-blur-md transition-all duration-300 focus:border-indigo-500/50 focus:bg-slate-900/80 focus:ring-4 focus:ring-indigo-500/10 hover:bg-slate-900/60 hover:border-white/20" type="text" name="job-title" placeholder="Senior Software Engineer" id="job-title" />
                </div>
                <div className="form-div group">
                  <label className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase transition-colors group-focus-within:text-indigo-400" htmlFor="job-description">Job description</label>
                  <textarea
                    className="w-full rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-white placeholder-slate-500 backdrop-blur-md transition-all duration-300 focus:border-indigo-500/50 focus:bg-slate-900/80 focus:ring-4 focus:ring-indigo-500/10 hover:bg-slate-900/60 hover:border-white/20 resize-y"
                    rows={6}
                    name="job-description"
                    placeholder="Paste the full job description — we use it for ATS keyword overlap and role alignment."
                    id="job-description"
                  />
                </div>
                <div className="form-div group">
                  <label className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase transition-colors group-focus-within:text-indigo-400" htmlFor="target-role">Target role</label>
                  <select className="w-full rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-white backdrop-blur-md transition-all duration-300 focus:border-indigo-500/50 focus:bg-slate-900/80 focus:ring-4 focus:ring-indigo-500/10 hover:bg-slate-900/60 hover:border-white/20" name="target-role" id="target-role">
                    {TARGET_ROLES.map((role) => (
                      <option className="bg-slate-900 text-white" value={role} key={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <div className="form-div">
                  <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Resume (PDF)</p>
                  <FileUploader onFileSelect={handleFileSelect} />
                </div>

                {statusText && !stage && (
                  <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                    {statusText}
                  </p>
                )}

                <button className="next-btn-primary w-full justify-center py-3 text-base" type="submit">
                  Run hybrid analysis
                </button>
              </form>
            </>
          )}

          {/* Retry button after error */}
          {stage === "error" && (
            <div className="mt-6 flex justify-center">
              <button
                className="next-btn-primary px-6 py-2 text-sm"
                onClick={() => { setStage(null); setError(""); }}
              >
                Try again
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AppShell>
  );
};

export default Upload;

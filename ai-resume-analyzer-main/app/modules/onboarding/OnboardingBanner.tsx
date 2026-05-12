import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const KEY = "nextai-onboarding-dismissed";

export function OnboardingBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      setOpen(localStorage.getItem(KEY) !== "1");
    } catch {
      setOpen(true);
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="next-glass mb-6 flex flex-col gap-3 border-indigo-500/30 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-sm font-semibold text-white">Welcome to NEXT AI</p>
            <p className="mt-1 text-sm text-slate-400">
              Upload a PDF, add a target role and job description — you will get hybrid ATS scoring, recruiter insights,
              and a structured improvement roadmap.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button type="button" className="next-btn-ghost text-xs" onClick={dismiss}>
              Dismiss
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

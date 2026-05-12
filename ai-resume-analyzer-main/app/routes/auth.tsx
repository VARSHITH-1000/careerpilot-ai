import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { motion } from "framer-motion";
import { useAuth } from "~/contexts/AuthContext";

export const meta = () => [
  { title: "NEXT AI — Sign in" },
  { name: "description", content: "Sign in to NEXT AI career copilot" },
];

const Auth = () => {
  const { user, loading, signInEmail, signUpEmail } = useAuth();
  const [searchParams] = useSearchParams();
  const rawNext = searchParams.get("next");
  let next = "/dashboard";
  if (rawNext) {
    try {
      const decoded = decodeURIComponent(rawNext);
      if (decoded.startsWith("/") && !decoded.startsWith("//")) next = decoded;
    } catch {
      next = "/dashboard";
    }
  }
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate(next, { replace: true });
  }, [loading, user, navigate, next]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        await signInEmail(email, password);
      } else {
        await signUpEmail(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dark relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-600/30 via-slate-950 to-slate-950" />
      <div className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full bg-cyan-500/15 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="next-glass border-indigo-500/25 p-8 sm:p-10">
          <div className="mb-8 flex items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2">
              <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 text-sm font-bold text-white shadow-lg shadow-indigo-500/35">
                N
              </span>
              <span className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">NEXT AI</span>
            </Link>
            <Link to="/" className="text-xs font-medium text-slate-500 transition hover:text-slate-300">
              Home
            </Link>
          </div>

          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-white">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {mode === "signin"
              ? "Sign in with email and password to access your resume intelligence workspace."
              : "Create an account to store analyses securely in your workspace."}
          </p>

          <form className="mt-8 flex flex-col gap-4" onSubmit={onSubmit}>
            <div className="form-div group">
              <label className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase transition-colors group-focus-within:text-indigo-400" htmlFor="email">
                Email
              </label>
              <input
                className="w-full rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-white placeholder-slate-500 backdrop-blur-md transition-all duration-300 focus:border-indigo-500/50 focus:bg-slate-900/80 focus:ring-4 focus:ring-indigo-500/10 hover:bg-slate-900/60 hover:border-white/20"
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-div group">
              <label className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase transition-colors group-focus-within:text-indigo-400" htmlFor="password">
                Password
              </label>
              <input
                className="w-full rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-white placeholder-slate-500 backdrop-blur-md transition-all duration-300 focus:border-indigo-500/50 focus:bg-slate-900/80 focus:ring-4 focus:ring-indigo-500/10 hover:bg-slate-900/60 hover:border-white/20"
                id="password"
                name="password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error ? (
              <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>
            ) : null}
            <button type="submit" className="auth-button" disabled={busy || loading}>
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {mode === "signin" ? (
              <>
                No account?{" "}
                <button type="button" className="text-indigo-300 underline" onClick={() => setMode("signup")}>
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button type="button" className="text-indigo-300 underline" onClick={() => setMode("signin")}>
                  Sign in
                </button>
              </>
            )}
          </p>

          <p className="mt-6 text-center text-[11px] leading-relaxed text-slate-500">
            Authentication is powered by Firebase. API keys and database credentials stay on the server.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;

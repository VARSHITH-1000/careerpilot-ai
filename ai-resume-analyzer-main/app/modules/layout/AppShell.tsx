import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { motion } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { cn } from "~/lib/utils";
import { useTheme } from "~/hooks/useTheme";

const COLLAPSE_KEY = "nextai-sidebar-collapsed";

type AppShellProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Wider main column for analytics-heavy pages */
  wide?: boolean;
};

export function AppShell({ title, subtitle, children, wide }: AppShellProps) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const persistCollapse = (v: boolean) => {
    setCollapsed(v);
    try {
      localStorage.setItem(COLLAPSE_KEY, v ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-transparent dark:text-slate-100">
      <div className="hidden lg:flex">
        <Sidebar collapsed={collapsed} onToggleCollapse={() => persistCollapse(!collapsed)} />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-50 h-full w-[min(88vw,280px)] shadow-2xl">
            <Sidebar
              collapsed={false}
              onToggleCollapse={() => setMobileOpen(false)}
              onLinkNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/55">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="inline-flex rounded-xl border border-slate-200 bg-white p-2 lg:hidden dark:border-white/10 dark:bg-white/5"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
              >
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              </button>
              <div className="min-w-0">
                <h1 className="truncate font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-slate-900 sm:text-xl dark:text-white">
                  {title}
                </h1>
                {subtitle ? (
                  <p className="truncate text-xs text-slate-500 sm:text-sm dark:text-slate-400">{subtitle}</p>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="next-btn-ghost !rounded-xl !px-3 !py-2 text-xs"
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? "Light" : "Dark"}
              </button>
              <Link to="/upload" className="next-btn-primary !rounded-xl !px-4 !py-2 text-sm">
                New analysis
              </Link>
            </div>
          </div>
        </header>

        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className={cn("mx-auto w-full flex-1 px-4 py-6 sm:px-6", wide ? "max-w-[1600px]" : "max-w-6xl")}
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}

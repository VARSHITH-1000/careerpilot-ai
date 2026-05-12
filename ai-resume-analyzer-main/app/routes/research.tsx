import { Outlet, NavLink } from "react-router";
import { AppShell } from "~/modules/layout/AppShell";
import { useAuth } from "~/contexts/AuthContext";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { BookOpen, MessageSquare, Globe } from "lucide-react";

export default function ResearchLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth?next=/research");
  }, [loading, user, navigate]);

  if (loading || !user) return null;

  return (
    <AppShell title="Research Copilot" subtitle="AI-powered document intelligence and semantic search." wide>
      <div className="flex flex-col gap-6">
        <div className="flex w-full items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-1.5 backdrop-blur-md">
          <NavLink
            to="/research/library"
            className={({ isActive }) =>
              `flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`
            }
          >
            <BookOpen className="h-4 w-4" />
            Workspace Library
          </NavLink>
          
          <NavLink
            to="/research/chat"
            className={({ isActive }) =>
              `flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`
            }
          >
            <MessageSquare className="h-4 w-4" />
            Isolated Chat
          </NavLink>
          
          <NavLink
            to="/research/explore"
            className={({ isActive }) =>
              `flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`
            }
          >
            <Globe className="h-4 w-4" />
            Global Explore
          </NavLink>
        </div>

        <Outlet />
      </div>
    </AppShell>
  );
}

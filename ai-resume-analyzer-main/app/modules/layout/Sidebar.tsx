import { Link, useLocation } from "react-router";
import { cn } from "~/lib/utils";
import {
  BarChart3,
  Brain,
  Briefcase,
  LayoutDashboard,
  LineChart,
  MessageSquareQuote,
  Route,
  Settings,
  MessageCircle,
  Library,
  Target,
  Upload,
  Users,
} from "lucide-react";

type Icon = React.ComponentType<{ className?: string }>;

function NavLink({
  to,
  label,
  icon: Icon,
  active,
  collapsed,
  onLinkNavigate,
}: {
  to: string;
  label: string;
  icon: Icon;
  active: boolean;
  collapsed: boolean;
  onLinkNavigate?: () => void;
}) {
  return (
    <Link
      to={to}
      title={collapsed ? label : undefined}
      onClick={() => onLinkNavigate?.()}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        active
          ? "bg-gradient-to-r from-indigo-500/25 to-cyan-500/10 text-white shadow-inner shadow-indigo-500/15"
          : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors",
          active
            ? "border-indigo-400/40 bg-indigo-500/15 text-indigo-200"
            : "border-transparent bg-white/5 text-slate-400 group-hover:border-white/10 group-hover:text-slate-200"
        )}
      >
        <Icon className="size-4" />
      </span>
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

function DisabledRow({
  label,
  icon: Icon,
  collapsed,
}: {
  label: string;
  icon: Icon;
  collapsed: boolean;
}) {
  return (
    <span
      title={collapsed ? "Open a resume from the dashboard first" : undefined}
      className={cn(
        "flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium opacity-40",
        "text-slate-500"
      )}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-transparent bg-white/[0.03]">
        <Icon className="size-4" />
      </span>
      {!collapsed && <span className="truncate">{label}</span>}
    </span>
  );
}

type SidebarProps = {
  collapsed: boolean;
  onToggleCollapse: () => void;
  /** Close mobile drawer after navigation */
  onLinkNavigate?: () => void;
};

export function Sidebar({ collapsed, onToggleCollapse, onLinkNavigate }: SidebarProps) {
  const location = useLocation();
  const resumeId = location.pathname.match(/^\/resume\/([^/]+)/)?.[1];

  const workspace: { to: string; label: string; icon: Icon; end?: boolean }[] = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/upload", label: "New analysis", icon: Upload },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  const intelligence: { id: string; label: string; icon: Icon }[] = [
    { id: "next-section-overview", label: "Resume intelligence", icon: Brain },
    { id: "next-section-hybrid", label: "ATS analysis", icon: Target },
    { id: "next-section-role", label: "Skill gap analysis", icon: LineChart },
    { id: "next-section-interview", label: "AI interview prep", icon: MessageSquareQuote },
    { id: "next-section-roadmap", label: "Career roadmap", icon: Route },
    { id: "next-section-recruiter", label: "Recruiter insights", icon: Users },
    { id: "next-section-radar", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <aside
      className={cn(
        "relative z-30 flex h-full flex-col border-r transition-[width] duration-300 ease-out",
        "border-white/10 bg-slate-950/40 backdrop-blur-2xl",
        collapsed ? "w-[76px]" : "w-[260px]"
      )}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-4">
        <Link to="/dashboard" className="flex min-w-0 items-center gap-2 px-1" onClick={() => onLinkNavigate?.()}>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 text-sm font-bold text-white shadow-lg shadow-indigo-500/30">
            N
          </div>
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <p className="truncate font-[family-name:var(--font-display)] text-sm font-semibold tracking-tight text-white">
                NEXT AI
              </p>
              <p className="truncate text-[11px] text-slate-400">Career Copilot</p>
            </div>
          )}
        </Link>
        <button
          type="button"
          onClick={onToggleCollapse}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            {collapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            )}
          </svg>
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-2 pb-4">
        <div>
          {!collapsed && (
            <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Workspace</p>
          )}
          <div className="flex flex-col gap-0.5">
            {workspace.map((item) => {
              const active = item.end
                ? location.pathname === item.to
                : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  label={item.label}
                  icon={item.icon}
                  active={active}
                  collapsed={collapsed}
                  onLinkNavigate={onLinkNavigate}
                />
              );
            })}
          </div>
        </div>

        <div>
          {!collapsed && (
            <p className="mb-1.5 px-2 mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Research Copilot</p>
          )}
          <div className="flex flex-col gap-0.5">
            <NavLink
              to="/research"
              label="Document Library"
              icon={Library}
              active={location.pathname === "/research" || location.pathname === "/research/library"}
              collapsed={collapsed}
              onLinkNavigate={onLinkNavigate}
            />
            <NavLink
              to="/research/chat"
              label="AI Assistant"
              icon={MessageCircle}
              active={location.pathname === "/research/chat"}
              collapsed={collapsed}
              onLinkNavigate={onLinkNavigate}
            />
          </div>
        </div>

        <div>
          {!collapsed && (
            <p className="mb-1.5 px-2 mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Intelligence
            </p>
          )}
          <div className="flex flex-col gap-0.5">
            {intelligence.map((item) => {
              if (!resumeId) {
                return <DisabledRow key={item.id} label={item.label} icon={item.icon} collapsed={collapsed} />;
              }
              const to = `/resume/${resumeId}#${item.id}`;
              const active = location.pathname + location.hash === to;
              return (
                <NavLink
                  key={item.id}
                  to={to}
                  label={item.label}
                  icon={item.icon}
                  active={active}
                  collapsed={collapsed}
                  onLinkNavigate={onLinkNavigate}
                />
              );
            })}
          </div>
        </div>

        {!collapsed && (
          <div className="rounded-xl border border-dashed border-indigo-500/25 bg-indigo-500/5 p-3 text-[11px] leading-relaxed text-slate-400">
            <p className="flex items-center gap-1 font-semibold text-indigo-200">
              <Briefcase className="size-3.5 shrink-0" />
              Section nav
            </p>
            <p className="mt-1">Jumps to panels inside an open resume analysis.</p>
          </div>
        )}
      </nav>

      <div className="border-t border-white/10 p-3">
        <Link
          to="/"
          title="Marketing"
          onClick={() => onLinkNavigate?.()}
          className={cn(
            "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-white/5 hover:text-slate-300",
            collapsed && "justify-center px-0"
          )}
        >
          <span className="text-lg">↩</span>
          {!collapsed && "Marketing site"}
        </Link>
      </div>
    </aside>
  );
}

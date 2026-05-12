import type { Route } from "./+types/settings";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import { AppShell } from "~/modules/layout/AppShell";
import { useAuth } from "~/contexts/AuthContext";
import { useTheme } from "~/hooks/useTheme";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "NEXT AI — Settings" },
    { name: "description", content: "Appearance and account preferences." },
  ];
}

export default function SettingsRoute() {
  const { user, loading, signOutUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth?next=/settings");
  }, [user, loading, navigate]);

  return (
    <AppShell title="Settings" subtitle="Appearance and session">
      <div className="grid max-w-2xl gap-6">
        <section className="next-glass border border-white/10 p-6 dark:border-white/10">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-slate-900 dark:text-white">
            Appearance
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Theme preference is stored in this browser (localStorage).
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(
              [
                { id: "dark" as const, label: "Dark" },
                { id: "light" as const, label: "Light" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTheme(opt.id)}
                className={
                  theme === opt.id
                    ? "next-btn-primary !rounded-xl !px-4 !py-2 text-sm"
                    : "next-btn-ghost !rounded-xl !px-4 !py-2 text-sm"
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        <section className="next-glass border border-white/10 p-6 dark:border-white/10">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-slate-900 dark:text-white">
            Account
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            You are signed in with Firebase. Sign out clears the client session; your analyses remain in the database.
          </p>
          <p className="mt-3 text-sm font-medium text-slate-800 dark:text-slate-200">{user?.email ?? "—"}</p>
          <button type="button" className="next-btn-ghost mt-4 !rounded-xl text-sm" onClick={() => void signOutUser()}>
            Sign out
          </button>
        </section>
      </div>
    </AppShell>
  );
}

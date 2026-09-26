"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Target, FolderKanban, Boxes, ArrowRight, Loader2 } from "lucide-react";
import AppShell from "../components/AppShell";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/apiClient";

// No separate "Dashboards" tile - dashboards live under Teams now (each
// team's main dashboard and tier boards, plus an Unassigned Dashboards
// section on that page for anything not linked to a team).
const MODULES = [
  { key: "teams", label: "Teams", href: "/teams", icon: Boxes, blurb: "Create a team, then build its main dashboard and tier boards" },
  { key: "hoshin", label: "Strategy Deployment", href: "/hoshin", icon: Target, blurb: "Cascade long-term objectives into this year's priorities" },
  { key: "projects", label: "Projects", href: "/projects", icon: FolderKanban, blurb: "A3 problem-solving and CapEx requests" },
];

export default function HomePage() {
  const { user } = useAuth();
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    Promise.all([
      apiFetch("/api/teams").then((d) => d.teams.length),
      apiFetch("/api/hoshin").then((d) => d.plans.length),
      apiFetch("/api/projects").then((d) => d.projects.length),
    ])
      .then(([teams, hoshin, projects]) => setCounts({ teams, hoshin, projects }))
      .catch(() => setCounts({ teams: 0, hoshin: 0, projects: 0 }));
  }, []);

  const total = counts ? counts.teams + counts.hoshin + counts.projects : null;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl font-black mb-1">Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}</h1>
        <p className="text-sm opacity-50 mb-8">Vecta's building blocks - a team drives its own dashboards and tier boards.</p>

        {total === 0 && (
          <div className="card p-5 mb-6" style={{ background: "color-mix(in srgb, var(--color-accent) 6%, var(--color-surface))" }}>
            <p className="text-sm font-semibold mb-1">Get started</p>
            <p className="text-xs opacity-60 leading-relaxed">
              Start by creating a Team - its page is where you build its main dashboard and generate its T1/T2/T3
              tier boards. Set up a plan in Planning to drive what those boards track, and spin up A3 or CapEx
              projects alongside it.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {MODULES.map(({ key, label, href, icon: Icon, blurb }) => (
            <Link key={key} href={href} className="card p-5 hover:shadow-md transition group">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "color-mix(in srgb, var(--color-primary) 10%, transparent)" }}>
                <Icon className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
              </div>
              <p className="text-sm font-bold mb-1">{label}</p>
              <p className="text-xs opacity-50 mb-3 leading-relaxed">{blurb}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="opacity-40">
                  {counts ? counts[key] : <Loader2 className="h-3 w-3 animate-spin inline" />} {counts?.[key] === 1 ? "item" : "items"}
                </span>
                <span className="flex items-center gap-0.5 font-medium opacity-0 group-hover:opacity-100 transition" style={{ color: "var(--color-accent)" }}>
                  Open <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

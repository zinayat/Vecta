"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Target, FolderKanban, ArrowRight, Loader2 } from "lucide-react";
import AppShell from "../components/AppShell";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/apiClient";

const MODULES = [
  { key: "dashboards", label: "Dashboards", href: "/dashboards", icon: LayoutDashboard, blurb: "Compose boards from KPI, note, and project widgets" },
  { key: "hoshin", label: "Planning", href: "/hoshin", icon: Target, blurb: "Cascade long-term objectives into this year's priorities" },
  { key: "projects", label: "Projects", href: "/projects", icon: FolderKanban, blurb: "A3 problem-solving and CapEx requests" },
];

export default function HomePage() {
  const { user } = useAuth();
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    Promise.all([
      apiFetch("/api/dashboards").then((d) => d.dashboards.length),
      apiFetch("/api/hoshin").then((d) => d.plans.length),
      apiFetch("/api/projects").then((d) => d.projects.length),
    ])
      .then(([dashboards, hoshin, projects]) => setCounts({ dashboards, hoshin, projects }))
      .catch(() => setCounts({ dashboards: 0, hoshin: 0, projects: 0 }));
  }, []);

  const total = counts ? counts.dashboards + counts.hoshin + counts.projects : null;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl font-black mb-1">Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}</h1>
        <p className="text-sm opacity-50 mb-8">Vecta's three building blocks - use them together or on their own.</p>

        {total === 0 && (
          <div className="card p-5 mb-6" style={{ background: "color-mix(in srgb, var(--color-accent) 6%, var(--color-surface))" }}>
            <p className="text-sm font-semibold mb-1">Get started</p>
            <p className="text-xs opacity-60 leading-relaxed">
              Start with a plan in Planning to set this year's objectives and priorities, spin up A3 or CapEx projects
              against them, then build a dashboard that pulls it all into one view.
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

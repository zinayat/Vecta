"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Boxes, Plus, Loader2, X, ArrowRight, LayoutDashboard } from "lucide-react";
import AppShell from "../../components/AppShell";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../lib/apiClient";

const TIER_COLORS = { T1: "bg-blue-100 text-blue-700", T2: "bg-violet-100 text-violet-700", T3: "bg-amber-100 text-amber-700" };
const TIER_ORDER = ["T1", "T2", "T3"];

export default function TeamsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const canEdit = user?.role === "Admin" || user?.role === "Manager";
  const [teams, setTeams] = useState([]);
  const [dashboards, setDashboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([apiFetch("/api/teams"), apiFetch("/api/dashboards")])
      .then(([t, d]) => { setTeams(t.teams); setDashboards(d.dashboards); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function createTeam(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Give the team a name before creating it");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const data = await apiFetch("/api/teams", { method: "POST", body: { name: name.trim(), purpose: purpose.trim() } });
      router.push(`/teams/${data.team._id}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  // No separate /dashboards page anymore - every dashboard is reachable
  // either under the team that drives it (main dashboard + tier boards)
  // or, for ones that predate teamId, in Unassigned Dashboards below.
  const unassigned = dashboards.filter((d) => !d.teamId);

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto pb-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--color-primary) 10%, transparent)" }}>
              <Boxes className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
            </div>
            <div>
              <h1 className="text-lg font-bold">Teams</h1>
              <p className="text-xs opacity-50">Each team's purpose, outcomes, main dashboard, and tier boards</p>
            </div>
          </div>
          {canEdit && (
            <button onClick={() => setCreating(true)} className="btn-primary flex-shrink-0">
              <Plus className="h-4 w-4" /> New Team
            </button>
          )}
        </div>

        {creating && (
          <form onSubmit={createTeam} className="card p-4 mb-4 space-y-3">
            <div>
              <label className="text-xs font-medium opacity-60 mb-1 block">Team name</label>
              <input required autoFocus className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Line 3 Operations" />
            </div>
            <div>
              <label className="text-xs font-medium opacity-60 mb-1 block">Purpose (why this team exists)</label>
              <textarea className="input resize-none" rows={2} value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="What this team is responsible for" />
            </div>
            <div className="flex items-center gap-2">
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
              </button>
              <button type="button" onClick={() => setCreating(false)} className="p-2 opacity-40 hover:opacity-80"><X className="h-4 w-4" /></button>
            </div>
          </form>
        )}

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin opacity-40" /></div>
        ) : teams.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-sm opacity-50">
              {canEdit ? "No teams yet." : "No teams yet - ask an Admin or Manager to set one up."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {teams.map((t) => {
              const mainDash = dashboards.find((d) => d._id === t.mainDashboardId);
              const tierDashes = dashboards
                .filter((d) => t.dashboardIds.includes(d._id))
                .sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier));
              return (
                <div key={t._id} className="card p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <Link href={`/teams/${t._id}`} className="text-sm font-bold hover:opacity-70 transition block truncate">{t.name}</Link>
                      <p className="text-xs opacity-40 line-clamp-1">{t.purpose || "No purpose set yet"}</p>
                      <p className="text-[11px] opacity-30 mt-0.5">{t.outcomes.length} outcome{t.outcomes.length === 1 ? "" : "s"}</p>
                    </div>
                    <Link href={`/teams/${t._id}`} className="inline-flex items-center gap-1 text-xs opacity-40 hover:opacity-80 transition flex-shrink-0">
                      Manage <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {mainDash ? (
                      <Link
                        href={`/dashboards/${mainDash._id}`}
                        className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium hover:shadow-sm transition"
                        style={{ borderColor: "var(--color-border)" }}
                      >
                        <LayoutDashboard className="h-3.5 w-3.5 opacity-50 flex-shrink-0" />
                        <span className="truncate">{mainDash.name}</span>
                      </Link>
                    ) : (
                      <span className="text-[11px] opacity-30 italic">No main dashboard yet</span>
                    )}
                    {tierDashes.length > 0 ? (
                      tierDashes.map((d) => (
                        <Link
                          key={d._id}
                          href={`/dashboards/${d._id}`}
                          className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium hover:shadow-sm transition"
                          style={{ borderColor: "var(--color-border)" }}
                        >
                          <span className={`flex-shrink-0 rounded-full px-1.5 py-0 text-[9px] font-bold ${TIER_COLORS[d.tier] || "bg-gray-100 text-gray-600"}`}>{d.tier}</span>
                          <span className="truncate">{d.name}</span>
                        </Link>
                      ))
                    ) : (
                      <span className="text-[11px] opacity-30 italic">No tier boards yet</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && unassigned.length > 0 && (
          <div className="mt-8">
            <p className="text-xs font-bold uppercase tracking-wide opacity-50 mb-2">Unassigned Dashboards</p>
            <p className="text-[11px] opacity-35 mb-2">Created before they were linked to a team</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {unassigned.map((d) => (
                <Link key={d._id} href={`/dashboards/${d._id}`} className="card p-4 hover:shadow-md transition">
                  {d.tier && (
                    <span className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-bold mb-1.5 ${TIER_COLORS[d.tier]}`}>{d.tier}</span>
                  )}
                  <p className="text-sm font-bold mb-1">{d.name}</p>
                  <p className="text-xs opacity-40">{d.widgets.length} widget{d.widgets.length === 1 ? "" : "s"}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

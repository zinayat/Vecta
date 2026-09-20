"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import AppShell from "../../../components/AppShell";
import TeamOutcomes from "../../../components/teams/TeamOutcomes";
import LinkedDashboards from "../../../components/teams/LinkedDashboards";
import { useAuth } from "../../../context/AuthContext";
import { apiFetch } from "../../../lib/apiClient";

export default function TeamDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const canEdit = user?.role === "Admin" || user?.role === "Manager";
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [purposeDraft, setPurposeDraft] = useState("");

  useEffect(() => {
    apiFetch(`/api/teams/${id}`)
      .then((data) => { setTeam(data.team); setNameDraft(data.team.name); setPurposeDraft(data.team.purpose || ""); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function persist(fields) {
    try {
      const data = await apiFetch(`/api/teams/${id}`, { method: "PUT", body: fields });
      setTeam(data.team);
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove() {
    if (!confirm(`Delete "${team.name}"? This can't be undone.`)) return;
    try {
      await apiFetch(`/api/teams/${id}`, { method: "DELETE" });
      router.push("/teams");
    } catch (err) {
      setError(err.message);
    }
  }

  function addOutcome(outcome) {
    persist({ outcomes: [...team.outcomes, outcome] });
  }
  function removeOutcome(outcomeId) {
    persist({ outcomes: team.outcomes.filter((o) => o._id !== outcomeId) });
  }

  if (loading) return <AppShell><div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin opacity-40" /></div></AppShell>;
  if (!team) return <AppShell><p className="text-sm opacity-50">{error || "Team not found"}</p></AppShell>;

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto pb-10">
        <Link href="/teams" className="inline-flex items-center gap-1.5 text-xs opacity-40 hover:opacity-70 transition mb-3">
          <ArrowLeft className="h-3.5 w-3.5" /> All teams
        </Link>

        <div className="card p-4 mb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            {canEdit ? (
              <input
                className="text-lg font-bold bg-transparent outline-none flex-1 min-w-0"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={() => { if (nameDraft.trim() && nameDraft.trim() !== team.name) persist({ name: nameDraft.trim() }); }}
              />
            ) : (
              <h1 className="text-lg font-bold">{team.name}</h1>
            )}
            {canEdit && (
              <button onClick={remove} className="p-1.5 opacity-30 hover:opacity-80 hover:text-red-500 transition flex-shrink-0"><Trash2 className="h-4 w-4" /></button>
            )}
          </div>

          <label className="text-xs font-medium opacity-60 mb-1 block">Purpose - why this team exists</label>
          {canEdit ? (
            <textarea
              className="input resize-none"
              rows={2}
              value={purposeDraft}
              onChange={(e) => setPurposeDraft(e.target.value)}
              onBlur={() => { if (purposeDraft.trim() !== (team.purpose || "")) persist({ purpose: purposeDraft.trim() }); }}
            />
          ) : (
            <p className="text-sm opacity-70">{team.purpose || "No purpose set yet"}</p>
          )}
        </div>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <div className="mb-2">
          <p className="text-xs font-bold uppercase tracking-wide opacity-50 mb-2">Outcomes</p>
          <p className="text-[11px] opacity-35 mb-2">Annual and quarterly objectives, optionally linked to a multi-year Planning objective</p>
        </div>
        <div className="mb-6">
          <TeamOutcomes outcomes={team.outcomes} onAdd={addOutcome} onRemove={removeOutcome} readOnly={!canEdit} />
        </div>

        <div className="mb-2">
          <p className="text-xs font-bold uppercase tracking-wide opacity-50 mb-2">Linked Tier Boards</p>
          <p className="text-[11px] opacity-35 mb-2">This team's T1/T2/T3 meeting dashboards</p>
        </div>
        <div className="card p-4">
          <LinkedDashboards dashboardIds={team.dashboardIds} onChange={(next) => persist({ dashboardIds: next })} readOnly={!canEdit} />
        </div>
      </div>
    </AppShell>
  );
}

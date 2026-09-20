"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import AppShell from "../../../components/AppShell";
import TeamOutcomes from "../../../components/teams/TeamOutcomes";
import LinkedDashboards from "../../../components/teams/LinkedDashboards";
import { useAuth } from "../../../context/AuthContext";
import { apiFetch } from "../../../lib/apiClient";
import { generateTierDashboards } from "../../../lib/oneClickDashboards";

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
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [creatingMain, setCreatingMain] = useState(false);
  const [mainDashboard, setMainDashboard] = useState(null);

  useEffect(() => {
    apiFetch(`/api/teams/${id}`)
      .then((data) => { setTeam(data.team); setNameDraft(data.team.name); setPurposeDraft(data.team.purpose || ""); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    apiFetch("/api/hoshin").then((data) => setPlans(data.plans)).catch(() => setPlans([]));
  }, [id]);

  useEffect(() => {
    if (!team?.mainDashboardId) { setMainDashboard(null); return; }
    apiFetch(`/api/dashboards/${team.mainDashboardId}`).then((data) => setMainDashboard(data.dashboard)).catch(() => setMainDashboard(null));
  }, [team?.mainDashboardId]);

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

  // Teams drive dashboard/tier-board creation - both flows create real
  // Dashboard documents tagged with this team's id (rather than only
  // linking pre-existing ones), so the relationship is set up from here
  // in one step instead of creating a dashboard elsewhere and finding it
  // again in a picker.
  async function createMainDashboard() {
    setCreatingMain(true);
    setError("");
    try {
      const data = await apiFetch("/api/dashboards", { method: "POST", body: { name: `${team.name} Dashboard`, teamId: team._id } });
      await persist({ mainDashboardId: data.dashboard._id });
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingMain(false);
    }
  }

  async function generateTeamTierBoards() {
    const plan = plans.find((p) => p._id === selectedPlanId);
    if (!plan) return;
    setGenerating(true);
    setError("");
    try {
      const payloads = generateTierDashboards(plan).map((p) => ({ ...p, teamId: team._id }));
      const createdIds = [];
      for (const payload of payloads) {
        const data = await apiFetch("/api/dashboards", { method: "POST", body: payload });
        createdIds.push(data.dashboard._id);
      }
      await persist({ dashboardIds: [...team.dashboardIds, ...createdIds] });
      setSelectedPlanId("");
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
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
          <p className="text-xs font-bold uppercase tracking-wide opacity-50 mb-2">Main Dashboard</p>
          <p className="text-[11px] opacity-35 mb-2">This team's general-purpose home view</p>
        </div>
        <div className="card p-4 mb-6">
          {team.mainDashboardId ? (
            mainDashboard ? (
              <Link href={`/dashboards/${team.mainDashboardId}`} className="flex items-center justify-between text-sm font-semibold hover:opacity-70 transition">
                {mainDashboard.name}
                <ArrowRight className="h-4 w-4 opacity-40 flex-shrink-0" />
              </Link>
            ) : (
              <Loader2 className="h-4 w-4 animate-spin opacity-40" />
            )
          ) : canEdit ? (
            <button onClick={createMainDashboard} disabled={creatingMain} className="btn-primary">
              {creatingMain ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create Main Dashboard
            </button>
          ) : (
            <p className="text-xs opacity-35 italic">No main dashboard yet</p>
          )}
        </div>

        <div className="mb-2">
          <p className="text-xs font-bold uppercase tracking-wide opacity-50 mb-2">Outcomes</p>
          <p className="text-[11px] opacity-35 mb-2">Annual and quarterly objectives, optionally linked to a multi-year Planning objective</p>
        </div>
        <div className="mb-6">
          <TeamOutcomes outcomes={team.outcomes} onAdd={addOutcome} onRemove={removeOutcome} readOnly={!canEdit} />
        </div>

        <div className="mb-2">
          <p className="text-xs font-bold uppercase tracking-wide opacity-50 mb-2">Tier Boards</p>
          <p className="text-[11px] opacity-35 mb-2">This team's T1/T2/T3 meeting dashboards</p>
        </div>
        <div className="card p-4 space-y-3">
          {canEdit && (
            <div className="flex items-center gap-2">
              <select className="input flex-1" value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)}>
                <option value="">Generate from a plan...</option>
                {plans.map((p) => <option key={p._id} value={p._id}>{p.name} (FY{p.fiscalYear})</option>)}
              </select>
              <button onClick={generateTeamTierBoards} disabled={!selectedPlanId || generating} className="btn-primary flex-shrink-0">
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate
              </button>
            </div>
          )}
          <LinkedDashboards dashboardIds={team.dashboardIds} onChange={(next) => persist({ dashboardIds: next })} readOnly={!canEdit} />
        </div>
      </div>
    </AppShell>
  );
}

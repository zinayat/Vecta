"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Boxes, Plus, Loader2, X } from "lucide-react";
import AppShell from "../../components/AppShell";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../lib/apiClient";

export default function TeamsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const canEdit = user?.role === "Admin" || user?.role === "Manager";
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch("/api/teams")
      .then((data) => setTeams(data.teams))
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

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--color-primary) 10%, transparent)" }}>
              <Boxes className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
            </div>
            <div>
              <h1 className="text-lg font-bold">Teams</h1>
              <p className="text-xs opacity-50">Cross-functional teams, their purpose, outcomes, and tier boards</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {teams.map((t) => (
              <button key={t._id} onClick={() => router.push(`/teams/${t._id}`)} className="card p-4 text-left hover:shadow-md transition">
                <p className="text-sm font-bold mb-1">{t.name}</p>
                <p className="text-xs opacity-40 line-clamp-2">{t.purpose || "No purpose set yet"}</p>
                <p className="text-[11px] opacity-30 mt-2">{t.outcomes.length} outcome{t.outcomes.length === 1 ? "" : "s"} · {t.dashboardIds.length} tier board{t.dashboardIds.length === 1 ? "" : "s"}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

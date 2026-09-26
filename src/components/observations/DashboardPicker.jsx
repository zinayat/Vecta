"use client";

import { useEffect, useState } from "react";
import { LayoutGrid } from "lucide-react";
import { apiFetch } from "../../lib/apiClient";

const TIER_LABELS = { T1: "Tier 1", T2: "Tier 2", T3: "Tier 3" };

// Lets an observation be shown on any number of dashboards across any
// number of teams at once - a plain multi-select checkbox list, grouped
// by team so picking "this team's T1 board and that team's T2 board" is
// a couple of clicks instead of hunting through one flat list of names.
export default function DashboardPicker({ selectedIds, onChange }) {
  const [dashboards, setDashboards] = useState(null);
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([apiFetch("/api/dashboards"), apiFetch("/api/teams")])
      .then(([d, t]) => { setDashboards(d.dashboards); setTeams(t.teams); })
      .catch((err) => setError(err.message));
  }, []);

  const selected = selectedIds || [];
  function toggle(id) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  }

  if (error) return <p className="text-[11px] text-red-500">{error}</p>;
  if (dashboards === null) return <p className="text-[11px] opacity-40">Loading boards...</p>;
  if (dashboards.length === 0) return <p className="text-[11px] opacity-40 italic">No dashboards exist yet to show this on.</p>;

  const teamName = (teamId) => teams.find((t) => t._id === teamId)?.name || "Unassigned dashboards";
  const groups = {};
  for (const d of dashboards) {
    const key = d.teamId || "unassigned";
    (groups[key] = groups[key] || []).push(d);
  }

  return (
    <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
      {Object.entries(groups).map(([key, list]) => (
        <div key={key}>
          <p className="text-[10px] font-semibold uppercase tracking-wide opacity-40 mb-1">
            {key === "unassigned" ? "Unassigned dashboards" : teamName(key)}
          </p>
          <div className="space-y-1">
            {list.map((d) => (
              <label key={d._id} className="flex items-center gap-1.5 text-xs cursor-pointer">
                <input type="checkbox" checked={selected.includes(d._id)} onChange={() => toggle(d._id)} />
                <LayoutGrid className="h-3 w-3 opacity-30 flex-shrink-0" />
                <span className="truncate">{d.name}</span>
                {d.tier && <span className="text-[9px] font-semibold opacity-40 flex-shrink-0">{TIER_LABELS[d.tier]}</span>}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

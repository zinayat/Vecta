"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { apiFetch } from "../../lib/apiClient";

const TIER_COLORS = { T1: "bg-blue-100 text-blue-700", T2: "bg-violet-100 text-violet-700", T3: "bg-amber-100 text-amber-700" };

export default function LinkedDashboards({ dashboardIds, onChange, readOnly }) {
  const [dashboards, setDashboards] = useState(null);

  useEffect(() => {
    apiFetch("/api/dashboards").then((data) => setDashboards(data.dashboards)).catch(() => setDashboards([]));
  }, []);

  function toggle(id) {
    const next = dashboardIds.includes(id) ? dashboardIds.filter((x) => x !== id) : [...dashboardIds, id];
    onChange(next);
  }

  if (dashboards === null) return <Loader2 className="h-4 w-4 animate-spin opacity-40" />;

  if (readOnly) {
    const linked = dashboards.filter((d) => dashboardIds.includes(d._id));
    if (linked.length === 0) return <p className="text-xs opacity-35 italic">No tier boards linked</p>;
    return (
      <div className="space-y-1.5">
        {linked.map((d) => (
          <Link key={d._id} href={`/dashboards/${d._id}`} className="flex items-center gap-2 text-xs hover:opacity-70 transition">
            {d.tier && <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${TIER_COLORS[d.tier]}`}>{d.tier}</span>}
            <span className="truncate">{d.name}</span>
          </Link>
        ))}
      </div>
    );
  }

  if (dashboards.length === 0) return <p className="text-xs opacity-35 italic">No dashboards yet</p>;

  return (
    <div className="max-h-48 overflow-y-auto space-y-1">
      {dashboards.map((d) => (
        <label key={d._id} className="flex items-center gap-2 text-xs py-0.5">
          <input type="checkbox" checked={dashboardIds.includes(d._id)} onChange={() => toggle(d._id)} />
          {d.tier && <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${TIER_COLORS[d.tier]}`}>{d.tier}</span>}
          <span className="truncate">{d.name}</span>
        </label>
      ))}
    </div>
  );
}

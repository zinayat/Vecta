"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, Plus, Loader2, Boxes, PackageSearch } from "lucide-react";
import AppShell from "../../components/AppShell";
import { apiFetch } from "../../lib/apiClient";

export default function PlanningHubPage() {
  const router = useRouter();
  const [demandPlans, setDemandPlans] = useState([]);
  const [productionPlans, setProductionPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    Promise.all([apiFetch("/api/demand-plans"), apiFetch("/api/production-plans")])
      .then(([d, p]) => {
        setDemandPlans(d.plans);
        setProductionPlans(p.plans);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function createDemandPlan() {
    setCreating(true);
    try {
      const { plan } = await apiFetch("/api/demand-plans", { method: "POST", body: { lines: [] } });
      router.push(`/planning/demand/${plan._id}`);
    } catch (err) {
      setError(err.message);
      setCreating(false);
    }
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto pb-10">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--color-primary) 10%, transparent)" }}>
              <CalendarClock className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
            </div>
            <div>
              <h1 className="text-lg font-bold">Planning</h1>
              <p className="text-xs opacity-50">Estimate demand, then roll it into a production plan by week and by day</p>
            </div>
          </div>
          <button onClick={createDemandPlan} disabled={creating} className="btn-primary text-xs">
            {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} New demand plan
          </button>
        </div>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin opacity-40" /></div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-xs font-bold uppercase tracking-wide opacity-50 mb-2">Demand plans</h2>
              {demandPlans.length === 0 ? (
                <p className="text-xs opacity-40 italic">No demand plans yet - estimate demand by product type to get started.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {demandPlans.map((p) => (
                    <Link key={p._id} href={`/planning/demand/${p._id}`} className="card p-4 hover:opacity-90 transition min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <PackageSearch className="h-3.5 w-3.5 opacity-40 flex-shrink-0" />
                        <p className="text-sm font-semibold break-words min-w-0">{p.name}</p>
                        {p.revisionNumber > 1 && (
                          <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold flex-shrink-0 bg-amber-100 text-amber-700">
                            Revision {p.revisionNumber}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] opacity-40">
                        {p.lines.length} product line{p.lines.length === 1 ? "" : "s"} · {new Date(p.createdAt).toLocaleDateString()}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xs font-bold uppercase tracking-wide opacity-50 mb-2">Production plans</h2>
              {productionPlans.length === 0 ? (
                <p className="text-xs opacity-40 italic">No production plans yet - open a demand plan and create one from it.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {productionPlans.map((p) => (
                    <Link key={p._id} href={`/planning/production/${p._id}`} className="card p-4 hover:opacity-90 transition min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <Boxes className="h-3.5 w-3.5 opacity-40 flex-shrink-0" />
                        <p className="text-sm font-semibold break-words min-w-0">{p.name}</p>
                      </div>
                      <p className="text-[11px] opacity-40">
                        {p.lines.length} product line{p.lines.length === 1 ? "" : "s"} · {new Date(p.createdAt).toLocaleDateString()}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

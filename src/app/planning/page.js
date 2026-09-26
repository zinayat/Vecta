"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, Plus, Loader2, X, Package, Wrench } from "lucide-react";
import AppShell from "../../components/AppShell";
import { apiFetch } from "../../lib/apiClient";
import { PHASES } from "../../lib/planningMeta";

const ROUTE_META = {
  MTS: { label: "Make-to-Stock", icon: Package },
  MTO: { label: "Make-to-Order", icon: Wrench },
};

export default function PlanningHubPage() {
  const router = useRouter();
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [route, setRoute] = useState("MTS");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch("/api/planning-cycles")
      .then((d) => setCycles(d.planningCycles))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function createCycle(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Give this planning cycle a name first");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const { planningCycle } = await apiFetch("/api/planning-cycles", { method: "POST", body: { name: name.trim(), route } });
      router.push(`/planning/${planningCycle._id}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  function phasesDone(cycle) {
    return PHASES.filter((p) => cycle[p]?.status === "done").length;
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
              <p className="text-xs opacity-50">Demand, S&amp;OP, scheduling, capacity, and materials - tracked against a Make-to-Stock or Make-to-Order route</p>
            </div>
          </div>
          <button onClick={() => setCreating(true)} className="btn-primary flex-shrink-0">
            <Plus className="h-4 w-4" /> New Planning Cycle
          </button>
        </div>

        {error && !creating && <p className="text-xs text-red-500 mb-3">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin opacity-40" /></div>
        ) : cycles.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-sm opacity-50">No planning cycles yet. Start one and pick whether it runs Make-to-Stock or Make-to-Order.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cycles.map((c) => {
              const RouteIcon = ROUTE_META[c.route].icon;
              const done = phasesDone(c);
              return (
                <Link key={c._id} href={`/planning/${c._id}`} className="card p-4 hover:opacity-90 transition">
                  <div className="flex items-center gap-1.5 mb-1">
                    <p className="text-sm font-semibold break-words min-w-0 flex-1">{c.name}</p>
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold flex-shrink-0" style={{ background: "var(--color-bg)" }}>
                      <RouteIcon className="h-2.5 w-2.5" /> {ROUTE_META[c.route].label}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-40">{done}/{PHASES.length} phases done</p>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
          <div className="card w-full max-w-sm p-5 max-h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold">New planning cycle</p>
              <button onClick={() => setCreating(false)} className="opacity-40 hover:opacity-80"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={createCycle} className="space-y-3">
              <div>
                <label className="text-[11px] font-medium opacity-60 mb-1 block">Name</label>
                <input className="input" placeholder="e.g. Q1 2027 Planning" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
              </div>
              <div>
                <label className="text-[11px] font-medium opacity-60 mb-1 block">Route</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(ROUTE_META).map(([key, meta]) => {
                    const Icon = meta.icon;
                    const active = route === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setRoute(key)}
                        className="rounded-xl border px-3 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                        style={{ borderColor: active ? "var(--color-accent)" : "var(--color-border)", background: active ? "color-mix(in srgb, var(--color-accent) 10%, transparent)" : "transparent" }}
                      >
                        <Icon className="h-3.5 w-3.5" /> {meta.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] opacity-40 mt-1">You can change this later - most companies blend both by product line.</p>
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
                {submitting ? "Creating..." : "Create"}
              </button>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}

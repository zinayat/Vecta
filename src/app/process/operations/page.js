"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarCheck, Plus, Loader2, ArrowLeft } from "lucide-react";
import AppShell from "../../../components/AppShell";
import { apiFetch } from "../../../lib/apiClient";

export default function OperationsPlanListPage() {
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch("/api/operations-plans")
      .then((data) => setPlans(data.plans))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function createPlan() {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      const { plan } = await apiFetch("/api/operations-plans", { method: "POST", body: { name: name.trim() } });
      router.push(`/process/operations/${plan._id}`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto pb-10">
        <Link href="/process" className="inline-flex items-center gap-1.5 text-xs opacity-40 hover:opacity-70 transition mb-3">
          <ArrowLeft className="h-3.5 w-3.5" /> Process
        </Link>

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "color-mix(in srgb, #16a34a 12%, transparent)" }}>
              <CalendarCheck className="h-5 w-5" style={{ color: "#16a34a" }} />
            </div>
            <div>
              <h1 className="text-lg font-bold">Operations Plan</h1>
              <p className="text-xs opacity-50">Assign designed processes to teams and people, and schedule how they run</p>
            </div>
          </div>
          {!creating && (
            <button onClick={() => setCreating(true)} className="btn-primary text-xs">
              <Plus className="h-3.5 w-3.5" /> New operations plan
            </button>
          )}
        </div>

        {creating && (
          <div className="card p-4 mb-4 space-y-2">
            <input className="input" placeholder="Plan name (e.g. Q1 Operations Plan)" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            <div className="flex items-center gap-2">
              <button onClick={createPlan} disabled={saving || !name.trim()} className="btn-primary text-xs flex-1 justify-center">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Create plan"}
              </button>
              <button onClick={() => { setCreating(false); setName(""); }} className="text-xs opacity-50 hover:opacity-90 px-3">Cancel</button>
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin opacity-40" /></div>
        ) : plans.length === 0 ? (
          <p className="text-xs opacity-40 italic">No operations plans yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {plans.map((p) => (
              <Link key={p._id} href={`/process/operations/${p._id}`} className="card p-4 hover:opacity-90 transition min-w-0">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <CalendarCheck className="h-3.5 w-3.5 opacity-40 flex-shrink-0" />
                  <p className="text-sm font-semibold break-words min-w-0">{p.name}</p>
                </div>
                <p className="text-[11px] opacity-40">
                  {(p.assignments || []).length} assignment{(p.assignments || []).length === 1 ? "" : "s"} · {new Date(p.updatedAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

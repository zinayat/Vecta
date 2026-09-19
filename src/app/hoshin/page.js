"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Target, Plus, Loader2, X } from "lucide-react";
import AppShell from "../../components/AppShell";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../lib/apiClient";

const CURRENT_YEAR = new Date().getFullYear();

export default function HoshinListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const canEdit = user?.role === "Admin" || user?.role === "Manager";
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [fiscalYear, setFiscalYear] = useState(String(CURRENT_YEAR));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch("/api/hoshin")
      .then((data) => setPlans(data.plans))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function createPlan(e) {
    e.preventDefault();
    if (!name.trim() || !fiscalYear) return;
    setSubmitting(true);
    try {
      const data = await apiFetch("/api/hoshin", { method: "POST", body: { name: name.trim(), fiscalYear } });
      router.push(`/hoshin/${data.plan._id}`);
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
              <Target className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
            </div>
            <div>
              <h1 className="text-lg font-bold">Hoshin Policy Deployment</h1>
              <p className="text-xs opacity-50">Long-term objectives, annual goals, improvement priorities, and the metrics that track them</p>
            </div>
          </div>
          {canEdit && (
            <button onClick={() => setCreating(true)} className="btn-primary flex-shrink-0">
              <Plus className="h-4 w-4" /> New Plan
            </button>
          )}
        </div>

        {creating && canEdit && (
          <form onSubmit={createPlan} className="card p-4 mb-4 flex items-center gap-2">
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Plan name (e.g. Acme FY26 Strategy)" className="input flex-1" />
            <input value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} placeholder="Fiscal year" className="input w-28" />
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
            </button>
            <button type="button" onClick={() => setCreating(false)} className="p-2 opacity-40 hover:opacity-80"><X className="h-4 w-4" /></button>
          </form>
        )}

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin opacity-40" /></div>
        ) : plans.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-sm opacity-50">
              {canEdit ? "No Hoshin plans yet." : "No Hoshin plans yet - ask an Admin or Manager to set one up."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {plans.map((p) => (
              <button key={p._id} onClick={() => router.push(`/hoshin/${p._id}`)} className="card p-4 text-left hover:shadow-md transition">
                <p className="text-sm font-bold mb-1">{p.name}</p>
                <p className="text-xs opacity-40">FY{p.fiscalYear} · {p.annualObjectives.length} annual objective{p.annualObjectives.length === 1 ? "" : "s"}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

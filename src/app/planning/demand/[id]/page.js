"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PackageSearch, Loader2, RefreshCw, ArrowRight, ArrowLeft } from "lucide-react";
import AppShell from "../../../../components/AppShell";
import { apiFetch } from "../../../../lib/apiClient";
import ListInput from "../../../../components/planning/ListInput";

const LINE_COLUMNS = [
  { key: "productType", label: "Product type" },
  { key: "estimatedDemand", label: "Estimated demand", numeric: true },
  { key: "unit", label: "Unit (e.g. units, kg, boxes)" },
  { key: "estimatedDeliveryDate", label: "Estimated delivery date", inputType: "date" },
];

const SAVE_DEBOUNCE_MS = 600;

export default function DemandPlanDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revising, setRevising] = useState(false);
  const [creatingProduction, setCreatingProduction] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    apiFetch(`/api/demand-plans/${id}`)
      .then((data) => setPlan(data.plan))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    return () => clearTimeout(saveTimer.current);
  }, [id]);

  // Optimistic local update happens immediately so typing feels instant;
  // the actual PUT is debounced so a fast typist doesn't fire one request
  // per keystroke (the bug caught the first time this app built a
  // free-text-editing planning screen).
  function updateLines(lines) {
    setPlan((prev) => ({ ...prev, lines }));
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      apiFetch(`/api/demand-plans/${id}`, { method: "PUT", body: { lines } }).catch((err) => setError(err.message));
    }, SAVE_DEBOUNCE_MS);
  }

  async function revise() {
    setRevising(true);
    try {
      const { plan: revision } = await apiFetch(`/api/demand-plans/${id}/revise`, { method: "POST" });
      router.push(`/planning/demand/${revision._id}`);
    } catch (err) {
      setError(err.message);
      setRevising(false);
    }
  }

  async function createProductionPlan() {
    setCreatingProduction(true);
    try {
      const { plan: productionPlan } = await apiFetch("/api/production-plans", { method: "POST", body: { demandPlanId: id } });
      router.push(`/planning/production/${productionPlan._id}`);
    } catch (err) {
      setError(err.message);
      setCreatingProduction(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin opacity-40" /></div>
      </AppShell>
    );
  }
  if (!plan) {
    return (
      <AppShell>
        <p className="text-xs text-red-500">{error || "Demand plan not found"}</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto pb-10">
        <Link href="/planning" className="inline-flex items-center gap-1 text-xs opacity-50 hover:opacity-80 mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Planning
        </Link>

        <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <PackageSearch className="h-5 w-5 opacity-40 flex-shrink-0" />
            <h1 className="text-lg font-bold break-words min-w-0">{plan.name}</h1>
            {plan.revisionNumber > 1 && (
              <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold flex-shrink-0 bg-amber-100 text-amber-700">
                Revision {plan.revisionNumber}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={revise} disabled={revising} className="rounded-xl border px-3 py-2 text-xs font-semibold transition hover:opacity-80" style={{ borderColor: "var(--color-border)" }}>
              {revising ? <Loader2 className="h-3.5 w-3.5 animate-spin inline" /> : <RefreshCw className="h-3.5 w-3.5 inline mr-1" />} Revise
            </button>
            <button onClick={createProductionPlan} disabled={creatingProduction} className="btn-primary text-xs">
              {creatingProduction ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />} Create production plan
            </button>
          </div>
        </div>
        {plan.previousVersionId && (
          <Link href={`/planning/demand/${plan.previousVersionId}`} className="text-[11px] opacity-40 hover:opacity-70 underline">
            View the revision this replaced
          </Link>
        )}

        {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

        <div className="card p-4 mt-4">
          <p className="text-xs font-semibold opacity-70 mb-2">Estimated demand by product</p>
          <ListInput columns={LINE_COLUMNS} rows={plan.lines} onChange={updateLines} addLabel="a product" />
        </div>
      </div>
    </AppShell>
  );
}

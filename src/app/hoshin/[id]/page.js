"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, LayoutGrid } from "lucide-react";
import AppShell from "../../../components/AppShell";
import EditableList from "../../../components/hoshin/EditableList";
import CorrelationGrid from "../../../components/hoshin/CorrelationGrid";
import { useAuth } from "../../../context/AuthContext";
import { apiFetch } from "../../../lib/apiClient";

export default function HoshinDetailPage({ params }) {
  const { id } = use(params);
  const { user } = useAuth();
  const canEdit = user?.role === "Admin" || user?.role === "Manager";
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch(`/api/hoshin/${id}`)
      .then((data) => setPlan(data.plan))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function persist(fields) {
    try {
      const data = await apiFetch(`/api/hoshin/${id}`, { method: "PUT", body: fields });
      setPlan(data.plan);
    } catch (err) {
      setError(err.message);
    }
  }

  function addItem(listKey, text, extra = {}) {
    persist({ [listKey]: [...plan[listKey], { text, ...extra }] });
  }

  function removeItem(listKey, itemId) {
    persist({ [listKey]: plan[listKey].filter((i) => i._id !== itemId) });
    if (listKey === "annualObjectives" || listKey === "improvementPriorities") {
      persist({ correlations: plan.correlations.filter((c) => c.rowId !== itemId && c.colId !== itemId) });
    }
  }

  function updateItemText(listKey, itemId, text) {
    persist({ [listKey]: plan[listKey].map((i) => (i._id === itemId ? { ...i, text } : i)) });
  }

  function toggleCorrelation(rowId, colId, strength) {
    const rest = plan.correlations.filter((c) => !(c.rowId === rowId && c.colId === colId));
    const next = strength ? [...rest, { rowId, colId, strength }] : rest;
    persist({ correlations: next });
  }

  if (loading) return <AppShell><div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin opacity-40" /></div></AppShell>;
  if (!plan) return <AppShell><p className="text-sm opacity-50">{error || "Plan not found"}</p></AppShell>;

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto pb-10">
        <div className="flex items-center justify-between mb-3">
          <Link href="/hoshin" className="inline-flex items-center gap-1.5 text-xs opacity-40 hover:opacity-70 transition">
            <ArrowLeft className="h-3.5 w-3.5" /> All plans
          </Link>
          <Link href={`/hoshin/${id}/xmatrix`} className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--color-accent)" }}>
            <LayoutGrid className="h-3.5 w-3.5" /> View X-Matrix
          </Link>
        </div>

        <h1 className="text-lg font-bold mb-0.5">{plan.name}</h1>
        <p className="text-xs opacity-40 mb-6">
          Fiscal Year {plan.fiscalYear}
          {!canEdit && <span className="italic"> · View only - ask an Admin or Manager to make changes</span>}
        </p>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <EditableList
            label="Long-Term Objectives"
            hint="3-5 year breakthrough objectives"
            items={plan.longTermObjectives}
            onAdd={(text) => addItem("longTermObjectives", text)}
            onRemove={(id_) => removeItem("longTermObjectives", id_)}
            onUpdateText={(id_, text) => updateItemText("longTermObjectives", id_, text)}
            readOnly={!canEdit}
          />
          <EditableList
            label="Annual Objectives"
            hint="What this year needs to achieve"
            items={plan.annualObjectives}
            onAdd={(text) => addItem("annualObjectives", text)}
            onRemove={(id_) => removeItem("annualObjectives", id_)}
            onUpdateText={(id_, text) => updateItemText("annualObjectives", id_, text)}
            readOnly={!canEdit}
          />
          <EditableList
            label="Improvement Priorities"
            hint="The tactics/initiatives that will move the objectives"
            items={plan.improvementPriorities}
            onAdd={(text) => addItem("improvementPriorities", text)}
            onRemove={(id_) => removeItem("improvementPriorities", id_)}
            onUpdateText={(id_, text) => updateItemText("improvementPriorities", id_, text)}
            readOnly={!canEdit}
          />
          <EditableList
            label="Metrics"
            hint="How progress will be tracked"
            items={plan.metrics}
            onAdd={(text) => addItem("metrics", text)}
            onRemove={(id_) => removeItem("metrics", id_)}
            onUpdateText={(id_, text) => updateItemText("metrics", id_, text)}
            readOnly={!canEdit}
          />
        </div>

        <CorrelationGrid
          rows={plan.annualObjectives}
          cols={plan.improvementPriorities}
          correlations={plan.correlations}
          onToggle={toggleCorrelation}
          readOnly={!canEdit}
          hint="Which improvement priorities move which annual objectives. ● primary · ○ secondary"
          emptyMessage="Add at least one Annual Objective and one Improvement Priority to link them together."
        />
      </div>
    </AppShell>
  );
}

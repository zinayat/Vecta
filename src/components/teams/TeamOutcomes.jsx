"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, X, Target } from "lucide-react";
import { apiFetch } from "../../lib/apiClient";
import { flattenHoshinTree } from "../../lib/hoshinTree";

const CADENCE_COLORS = { Annual: "bg-blue-100 text-blue-700", Quarterly: "bg-violet-100 text-violet-700" };

function AddOutcomeForm({ onAdd }) {
  const [text, setText] = useState("");
  const [cadence, setCadence] = useState("Annual");
  const [plans, setPlans] = useState([]);
  const [planId, setPlanId] = useState("");
  const [boId, setBoId] = useState("");

  useEffect(() => {
    apiFetch("/api/hoshin").then((data) => setPlans(data.plans)).catch(() => setPlans([]));
  }, []);

  const selectedPlan = plans.find((p) => p._id === planId);
  const breakthroughOptions = selectedPlan ? flattenHoshinTree(selectedPlan).breakthroughObjectives : [];

  function submit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    const bo = breakthroughOptions.find((b) => b._id === boId);
    const hoshinLink = selectedPlan && bo
      ? { planId: selectedPlan._id, planName: selectedPlan.name, breakthroughObjectiveId: bo._id, breakthroughObjectiveText: bo.text }
      : null;
    onAdd({ text: text.trim(), cadence, hoshinLink });
    setText(""); setPlanId(""); setBoId("");
  }

  return (
    <form onSubmit={submit} className="card p-3 space-y-2">
      <div className="flex items-center gap-2">
        <input className="input text-xs py-1.5 flex-1" placeholder="Outcome / objective text" value={text} onChange={(e) => setText(e.target.value)} />
        <select className="input text-xs py-1.5 w-28" value={cadence} onChange={(e) => setCadence(e.target.value)}>
          <option value="Annual">Annual</option>
          <option value="Quarterly">Quarterly</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <select className="input text-xs py-1.5 flex-1" value={planId} onChange={(e) => { setPlanId(e.target.value); setBoId(""); }}>
          <option value="">Not linked to a multi-year objective</option>
          {plans.map((p) => <option key={p._id} value={p._id}>{p.name} (FY{p.fiscalYear})</option>)}
        </select>
        {breakthroughOptions.length > 0 && (
          <select className="input text-xs py-1.5 flex-1" value={boId} onChange={(e) => setBoId(e.target.value)}>
            <option value="">Which breakthrough objective</option>
            {breakthroughOptions.map((bo) => <option key={bo._id} value={bo._id}>{bo.text}</option>)}
          </select>
        )}
        <button type="submit" className="p-1.5 rounded-lg opacity-50 hover:opacity-90 transition flex-shrink-0"><Plus className="h-4 w-4" /></button>
      </div>
    </form>
  );
}

export default function TeamOutcomes({ outcomes, onAdd, onRemove, readOnly }) {
  return (
    <div className="space-y-2">
      {outcomes.length === 0 && <p className="text-xs opacity-35 italic">No outcomes yet</p>}
      {outcomes.map((o) => (
        <div key={o._id} className="card p-3 flex items-start justify-between gap-2 group">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${CADENCE_COLORS[o.cadence]}`}>{o.cadence}</span>
            </div>
            <p className="text-sm">{o.text}</p>
            {o.hoshinLink && (
              <Link href={`/hoshin/${o.hoshinLink.planId}`} className="inline-flex items-center gap-1 text-[10px] opacity-40 hover:opacity-80 transition mt-1">
                <Target className="h-2.5 w-2.5" /> {o.hoshinLink.planName} · {o.hoshinLink.breakthroughObjectiveText}
              </Link>
            )}
          </div>
          {!readOnly && (
            <button onClick={() => onRemove(o._id)} className="p-1 opacity-0 group-hover:opacity-50 hover:!opacity-90 hover:text-red-500 transition flex-shrink-0">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ))}
      {!readOnly && <AddOutcomeForm onAdd={onAdd} />}
    </div>
  );
}

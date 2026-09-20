"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { apiFetch } from "../../lib/apiClient";
import { flattenHoshinTree } from "../../lib/hoshinTree";

export function HoshinSummaryWidgetDisplay({ config }) {
  const { hoshinPlanId } = config || {};
  const [plan, setPlan] = useState(undefined);

  useEffect(() => {
    async function load() {
      try {
        if (hoshinPlanId) {
          const data = await apiFetch(`/api/hoshin/${hoshinPlanId}`);
          setPlan(data.plan);
        } else {
          const data = await apiFetch("/api/hoshin");
          setPlan(data.plans[0] || null);
        }
      } catch {
        setPlan(null);
      }
    }
    load();
  }, [hoshinPlanId]);

  if (plan === undefined) return <Loader2 className="h-4 w-4 animate-spin opacity-40" />;
  if (!plan) return <p className="text-xs opacity-40">No Hoshin plan yet</p>;

  const flat = flattenHoshinTree(plan);
  const kpiCount = flat.strategies.filter((s) => s.target).length;

  return (
    <Link href={`/hoshin/${plan._id}`} className="block hover:opacity-70 transition">
      <p className="text-sm font-bold mb-2">{plan.name} <span className="font-normal opacity-40">· FY{plan.fiscalYear}</span></p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div><span className="font-semibold">{flat.breakthroughObjectives.length}</span> <span className="opacity-50">breakthrough</span></div>
        <div><span className="font-semibold">{flat.annualObjectives.length}</span> <span className="opacity-50">annual</span></div>
        <div><span className="font-semibold">{flat.strategies.length}</span> <span className="opacity-50">strategies</span></div>
        <div><span className="font-semibold">{kpiCount}</span> <span className="opacity-50">targets/KPIs</span></div>
      </div>
    </Link>
  );
}

export function HoshinSummaryWidgetForm({ config, onChange }) {
  const [plans, setPlans] = useState([]);
  useEffect(() => {
    apiFetch("/api/hoshin").then((data) => setPlans(data.plans)).catch(() => setPlans([]));
  }, []);

  return (
    <select className="input" value={config?.hoshinPlanId || ""} onChange={(e) => onChange({ hoshinPlanId: e.target.value })}>
      <option value="">Most recently updated plan</option>
      {plans.map((p) => (
        <option key={p._id} value={p._id}>{p.name} (FY{p.fiscalYear})</option>
      ))}
    </select>
  );
}

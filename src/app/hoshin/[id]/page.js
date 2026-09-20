"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, LayoutGrid } from "lucide-react";
import AppShell from "../../../components/AppShell";
import HoshinCascadeTable from "../../../components/hoshin/HoshinCascadeTable";
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

  async function persistBreakthroughObjectives(next) {
    try {
      const data = await apiFetch(`/api/hoshin/${id}`, { method: "PUT", body: { breakthroughObjectives: next } });
      setPlan(data.plan);
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <AppShell><div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin opacity-40" /></div></AppShell>;
  if (!plan) return <AppShell><p className="text-sm opacity-50">{error || "Plan not found"}</p></AppShell>;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto pb-10">
        <div className="flex items-center justify-between mb-3">
          <Link href="/hoshin" className="inline-flex items-center gap-1.5 text-xs opacity-40 hover:opacity-70 transition">
            <ArrowLeft className="h-3.5 w-3.5" /> All plans
          </Link>
          <Link href={`/hoshin/${id}/xmatrix`} className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--color-accent)" }}>
            <LayoutGrid className="h-3.5 w-3.5" /> View X-Matrix
          </Link>
        </div>

        <h1 className="text-lg font-bold mb-0.5">{plan.name}</h1>
        <p className="text-xs opacity-40 mb-2">
          Fiscal Year {plan.fiscalYear}
          {!canEdit && <span className="italic"> · View only - ask an Admin or Manager to make changes</span>}
        </p>
        <p className="text-xs opacity-40 mb-5">
          Breakthrough Objective <span className="opacity-30">→</span> Annual Objective <span className="opacity-30">→</span> Strategy / Project, Target / KPI, Owner
        </p>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <HoshinCascadeTable
          breakthroughObjectives={plan.breakthroughObjectives || []}
          onChange={persistBreakthroughObjectives}
          readOnly={!canEdit}
        />
      </div>
    </AppShell>
  );
}

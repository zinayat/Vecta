"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import AppShell from "../../../components/AppShell";
import { apiFetch } from "../../../lib/apiClient";
import { generateTierDashboards } from "../../../lib/oneClickDashboards";

export default function OneClickDashboardPage() {
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [hoshinPlanId, setHoshinPlanId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [created, setCreated] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/hoshin")
      .then((data) => {
        setPlans(data.plans);
        if (data.plans.length === 1) setHoshinPlanId(data.plans[0]._id);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingPlans(false));
  }, []);

  async function generate() {
    const plan = plans.find((p) => p._id === hoshinPlanId);
    if (!plan) return;
    setGenerating(true);
    setError("");
    try {
      const payloads = generateTierDashboards(plan);
      const results = [];
      for (const payload of payloads) {
        const data = await apiFetch("/api/dashboards", { method: "POST", body: payload });
        results.push(data.dashboard);
      }
      setCreated(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <AppShell>
      <div className="max-w-xl mx-auto">
        <Link href="/dashboards" className="inline-flex items-center gap-1.5 text-xs opacity-40 hover:opacity-70 transition mb-3">
          <ArrowLeft className="h-3.5 w-3.5" /> All dashboards
        </Link>

        <div className="flex items-center gap-2.5 mb-6">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--color-accent) 12%, transparent)" }}>
            <Sparkles className="h-5 w-5" style={{ color: "var(--color-accent)" }} />
          </div>
          <div>
            <h1 className="text-lg font-bold">One-Click Tier Boards</h1>
            <p className="text-xs opacity-50">Generate T1/T2/T3 meeting dashboards from a Hoshin plan</p>
          </div>
        </div>

        {!created ? (
          <div className="card p-5">
            <p className="text-xs opacity-60 leading-relaxed mb-4">
              This builds three dashboards in one step: <strong>T1 Daily Meeting</strong>, <strong>T2 Weekly Meeting</strong>,
              and <strong>T3 Monthly Meeting</strong>. Each gets Safety/Quality/Throughput/People/Cost tiles - matched to
              your plan's metrics by keyword where possible - plus a meeting timer and a notes tile. T2 adds an escalation
              note; T3 adds a Hoshin summary and your active projects.
            </p>

            <label className="text-xs font-medium opacity-60 mb-1.5 block">Base it on which Hoshin plan?</label>
            {loadingPlans ? (
              <Loader2 className="h-4 w-4 animate-spin opacity-40" />
            ) : plans.length === 0 ? (
              <p className="text-xs opacity-50">
                No Hoshin plans yet - <Link href="/hoshin" className="font-semibold" style={{ color: "var(--color-accent)" }}>create one first</Link>.
              </p>
            ) : (
              <select className="input mb-4" value={hoshinPlanId} onChange={(e) => setHoshinPlanId(e.target.value)}>
                <option value="">Choose a plan...</option>
                {plans.map((p) => <option key={p._id} value={p._id}>{p.name} (FY{p.fiscalYear})</option>)}
              </select>
            )}

            {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

            <button onClick={generate} disabled={!hoshinPlanId || generating} className="btn-primary w-full">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {generating ? "Generating..." : "Generate Tier Boards"}
            </button>
          </div>
        ) : (
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
              <p className="text-sm font-bold">3 dashboards created</p>
            </div>
            <div className="space-y-2 mb-4">
              {created.map((d) => (
                <Link key={d._id} href={`/dashboards/${d._id}`} className="flex items-center justify-between rounded-xl border p-3 hover:shadow-sm transition" style={{ borderColor: "var(--color-border)" }}>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">{d.tier}</p>
                    <p className="text-sm font-semibold">{d.name}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 opacity-40" />
                </Link>
              ))}
            </div>
            <p className="text-xs opacity-50 mb-3">
              Each is ready to use. Category tiles without a matched Hoshin metric are still there - just switch to
              Edit mode on any dashboard to fill in values, link a metric, or change how a tile displays.
            </p>
            <Link href="/dashboards" className="btn-primary w-full justify-center">Done</Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}

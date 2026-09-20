"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, FileText, DollarSign } from "lucide-react";
import AppShell from "../../../components/AppShell";
import { apiFetch } from "../../../lib/apiClient";
import { flattenHoshinTree } from "../../../lib/hoshinTree";

export default function NewProjectPage() {
  return (
    <Suspense fallback={<AppShell><div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin opacity-40" /></div></AppShell>}>
      <NewProjectForm />
    </Suspense>
  );
}

function NewProjectForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [type, setType] = useState("A3");
  const [name, setName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [plans, setPlans] = useState([]);
  const [hoshinPlanId, setHoshinPlanId] = useState(searchParams.get("hoshinPlanId") || "");
  const [hoshinPriorityId, setHoshinPriorityId] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch("/api/hoshin").then((data) => setPlans(data.plans)).catch(() => setPlans([]));
  }, []);

  const selectedPlan = plans.find((p) => p._id === hoshinPlanId);
  const selectedPlanStrategies = selectedPlan ? flattenHoshinTree(selectedPlan).strategies : [];

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const data = await apiFetch("/api/projects", {
        method: "POST",
        body: {
          name: name.trim(),
          type,
          ownerName: ownerName.trim(),
          hoshinPlanId: hoshinPlanId || null,
          hoshinPriorityId: hoshinPriorityId || null,
        },
      });
      router.push(`/projects/${data.project._id}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="max-w-lg mx-auto">
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-xs opacity-40 hover:opacity-70 transition mb-3">
          <ArrowLeft className="h-3.5 w-3.5" /> All projects
        </Link>

        <h1 className="text-lg font-bold mb-5">New Project</h1>

        <form onSubmit={handleSubmit} className="card p-5 space-y-4">
          <div>
            <label className="text-xs font-medium opacity-60 mb-1.5 block">Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("A3")}
                className={`flex items-center justify-center gap-1.5 rounded-xl border p-3 text-sm font-medium transition ${type === "A3" ? "border-transparent text-white" : "opacity-60"}`}
                style={type === "A3" ? { background: "var(--color-primary)" } : { borderColor: "var(--color-border)" }}
              >
                <FileText className="h-4 w-4" /> A3
              </button>
              <button
                type="button"
                onClick={() => setType("CapEx")}
                className={`flex items-center justify-center gap-1.5 rounded-xl border p-3 text-sm font-medium transition ${type === "CapEx" ? "border-transparent text-white" : "opacity-60"}`}
                style={type === "CapEx" ? { background: "var(--color-primary)" } : { borderColor: "var(--color-border)" }}
              >
                <DollarSign className="h-4 w-4" /> CapEx
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium opacity-60 mb-1 block">Project name</label>
            <input required className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={type === "A3" ? "Reduce Line 3 changeover time" : "New CNC machine"} />
          </div>

          <div>
            <label className="text-xs font-medium opacity-60 mb-1 block">Owner</label>
            <input className="input" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Who's driving this" />
          </div>

          <div>
            <label className="text-xs font-medium opacity-60 mb-1 block">Link to a plan (optional)</label>
            <select className="input" value={hoshinPlanId} onChange={(e) => { setHoshinPlanId(e.target.value); setHoshinPriorityId(""); }}>
              <option value="">Not linked</option>
              {plans.map((p) => <option key={p._id} value={p._id}>{p.name} (FY{p.fiscalYear})</option>)}
            </select>
          </div>

          {selectedPlanStrategies.length > 0 && (
            <div>
              <label className="text-xs font-medium opacity-60 mb-1 block">Which strategy / project</label>
              <select className="input" value={hoshinPriorityId} onChange={(e) => setHoshinPriorityId(e.target.value)}>
                <option value="">Not specified</option>
                {selectedPlanStrategies.map((s) => <option key={s._id} value={s._id}>{s.text}</option>)}
              </select>
            </div>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : `Create ${type} project`}
          </button>
        </form>
      </div>
    </AppShell>
  );
}

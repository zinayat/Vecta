"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PenTool, Plus, Loader2, ArrowLeft, GitBranch } from "lucide-react";
import AppShell from "../../../components/AppShell";
import { apiFetch } from "../../../lib/apiClient";

export default function ProcessDesignListPage() {
  const router = useRouter();
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [product, setProduct] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch("/api/processes")
      .then((data) => setProcesses(data.processes))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function createProcess() {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      const { process } = await apiFetch("/api/processes", { method: "POST", body: { name: name.trim(), product: product.trim() } });
      router.push(`/process/design/${process._id}`);
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
            <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "color-mix(in srgb, #2563eb 12%, transparent)" }}>
              <PenTool className="h-5 w-5" style={{ color: "#2563eb" }} />
            </div>
            <div>
              <h1 className="text-lg font-bold">Design</h1>
              <p className="text-xs opacity-50">Products, people, teams, steps, equipment and capacity</p>
            </div>
          </div>
          {!creating && (
            <button onClick={() => setCreating(true)} className="btn-primary text-xs">
              <Plus className="h-3.5 w-3.5" /> New process
            </button>
          )}
        </div>

        {creating && (
          <div className="card p-4 mb-4 space-y-2">
            <input className="input" placeholder="Process name (e.g. Widget Assembly)" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            <input className="input" placeholder="Product this process makes (optional)" value={product} onChange={(e) => setProduct(e.target.value)} />
            <div className="flex items-center gap-2">
              <button onClick={createProcess} disabled={saving || !name.trim()} className="btn-primary text-xs flex-1 justify-center">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Create process"}
              </button>
              <button onClick={() => { setCreating(false); setName(""); setProduct(""); }} className="text-xs opacity-50 hover:opacity-90 px-3">Cancel</button>
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin opacity-40" /></div>
        ) : processes.length === 0 ? (
          <p className="text-xs opacity-40 italic">No processes designed yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {processes.map((p) => (
              <Link key={p._id} href={`/process/design/${p._id}`} className="card p-4 hover:opacity-90 transition min-w-0">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <GitBranch className="h-3.5 w-3.5 opacity-40 flex-shrink-0" />
                  <p className="text-sm font-semibold break-words min-w-0">{p.name}</p>
                </div>
                {p.product && <p className="text-[11px] opacity-50 mb-1 truncate">Makes: {p.product}</p>}
                <p className="text-[11px] opacity-40">
                  {(p.steps || []).length} step{(p.steps || []).length === 1 ? "" : "s"} · {new Date(p.updatedAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

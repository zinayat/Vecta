"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Rocket, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ companyName: "", name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signup(form);
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err.message || "Couldn't create your workspace");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--color-bg)" }}>
      <div className="w-full max-w-sm card p-6">
        <div className="mb-6 text-center">
          <p className="text-xl font-black tracking-tight" style={{ color: "var(--color-primary)" }}>Vecta</p>
          <p className="text-xs opacity-50 mt-1">Set up a new workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium opacity-60 mb-1 block">Company / workspace name</label>
            <input required value={form.companyName} onChange={set("companyName")} className="input" placeholder="Acme Manufacturing" />
          </div>
          <div>
            <label className="text-xs font-medium opacity-60 mb-1 block">Your name</label>
            <input required value={form.name} onChange={set("name")} className="input" placeholder="Jordan Lee" />
          </div>
          <div>
            <label className="text-xs font-medium opacity-60 mb-1 block">Email</label>
            <input type="email" required value={form.email} onChange={set("email")} className="input" placeholder="you@company.com" />
          </div>
          <div>
            <label className="text-xs font-medium opacity-60 mb-1 block">Password</label>
            <input type="password" required minLength={8} value={form.password} onChange={set("password")} className="input" placeholder="At least 8 characters" />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full mt-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
            Create workspace
          </button>
        </form>

        <p className="text-xs text-center opacity-50 mt-5">
          Already have a workspace? <Link href="/login" className="font-semibold" style={{ color: "var(--color-accent)" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Users, Plus, Loader2, X, Trash2 } from "lucide-react";
import AppShell from "../../components/AppShell";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../lib/apiClient";

const ROLE_COLORS = {
  Admin: "bg-red-100 text-red-700",
  Manager: "bg-blue-100 text-blue-700",
  Member: "bg-gray-100 text-gray-600",
};

export default function TeamPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviting, setInviting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "Member" });
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    apiFetch("/api/users")
      .then((data) => setUsers(data.users))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function setField(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function invite(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await apiFetch("/api/users/invite", { method: "POST", body: form });
      setForm({ name: "", email: "", password: "", role: "Member" });
      setInviting(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function changeRole(id, role) {
    try {
      await apiFetch(`/api/users/${id}/role`, { method: "PUT", body: { role } });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    if (!confirm("Remove this teammate? They'll lose access immediately.")) return;
    try {
      await apiFetch(`/api/users/${id}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  const isAdmin = me?.role === "Admin";

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--color-primary) 10%, transparent)" }}>
              <Users className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
            </div>
            <div>
              <h1 className="text-lg font-bold">Team</h1>
              <p className="text-xs opacity-50">Everyone with access to this workspace</p>
            </div>
          </div>
          {isAdmin && (
            <button onClick={() => setInviting(true)} className="btn-primary flex-shrink-0">
              <Plus className="h-4 w-4" /> Invite
            </button>
          )}
        </div>

        {inviting && (
          <form onSubmit={invite} className="card p-4 mb-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input required className="input" placeholder="Name" value={form.name} onChange={setField("name")} />
              <select className="input" value={form.role} onChange={setField("role")}>
                <option value="Member">Member</option>
                <option value="Manager">Manager</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <input required type="email" className="input" placeholder="Email" value={form.email} onChange={setField("email")} />
            <input required type="text" minLength={8} className="input" placeholder="Initial password (share with them directly)" value={form.password} onChange={setField("password")} />
            <div className="flex items-center gap-2">
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add teammate"}
              </button>
              <button type="button" onClick={() => setInviting(false)} className="p-2 opacity-40 hover:opacity-80"><X className="h-4 w-4" /></button>
            </div>
          </form>
        )}

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin opacity-40" /></div>
        ) : (
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u._id} className="card p-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{u.name}{u._id === me?.id ? " (you)" : ""}</p>
                  <p className="text-xs opacity-40 truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isAdmin ? (
                    <select
                      className={`rounded-full px-2 py-1 text-xs font-medium border-0 ${ROLE_COLORS[u.role] || "bg-gray-100"}`}
                      value={u.role}
                      onChange={(e) => changeRole(u._id, e.target.value)}
                    >
                      <option value="Member">Member</option>
                      <option value="Manager">Manager</option>
                      <option value="Admin">Admin</option>
                    </select>
                  ) : (
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ROLE_COLORS[u.role] || "bg-gray-100"}`}>{u.role}</span>
                  )}
                  {isAdmin && u._id !== me?.id && (
                    <button onClick={() => remove(u._id)} className="p-1.5 opacity-30 hover:opacity-80 hover:text-red-500 transition">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

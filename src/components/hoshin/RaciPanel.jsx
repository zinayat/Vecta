"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

const TYPES = ["Responsible", "Accountable", "Consulted", "Informed"];
const BADGE = {
  Responsible: "bg-blue-100 text-blue-700",
  Accountable: "bg-red-100 text-red-700",
  Consulted: "bg-amber-100 text-amber-700",
  Informed: "bg-gray-100 text-gray-600",
};

export default function RaciPanel({ entries, onAdd, onRemove, readOnly }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("Responsible");

  function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim(), type);
    setName("");
  }

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide opacity-50 mb-0.5">RACI</p>
      <p className="text-[11px] opacity-35 mb-2">Who's Responsible, Accountable, Consulted, Informed</p>

      <div className="space-y-1 mb-2">
        {entries.length === 0 && <p className="text-xs opacity-35 italic">Nobody added yet</p>}
        {entries.map((e) => (
          <div key={e._id} className="flex items-center justify-between gap-2 group">
            <span className="text-xs truncate">{e.name}</span>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${BADGE[e.type]}`}>{e.type[0]}</span>
              {!readOnly && (
                <button onClick={() => onRemove(e._id)} className="p-0.5 opacity-0 group-hover:opacity-50 hover:!opacity-90 hover:text-red-500 transition">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {!readOnly && (
        <form onSubmit={submit} className="space-y-1.5">
          <input className="input text-xs py-1" placeholder="Name" value={name} onChange={(ev) => setName(ev.target.value)} />
          <div className="flex items-center gap-1.5">
            <select className="input text-xs py-1 flex-1" value={type} onChange={(ev) => setType(ev.target.value)}>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <button type="submit" className="p-1.5 rounded-lg opacity-50 hover:opacity-90 transition flex-shrink-0">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

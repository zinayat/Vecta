"use client";

import { useState } from "react";
import { X, Check } from "lucide-react";
import KpiBuilder from "./KpiBuilder";

export default function KpiBuilderModal({ initialValue, onSave, onClose, title }) {
  const [value, setValue] = useState(initialValue || {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
      <div className="card w-full max-w-sm p-5 max-h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold">{title || "Define this KPI"}</p>
          <button onClick={onClose} className="opacity-40 hover:opacity-80"><X className="h-4 w-4" /></button>
        </div>

        <KpiBuilder value={value} onChange={setValue} />

        <div className="flex items-center gap-2 mt-4">
          <button onClick={() => onSave(value)} className="btn-primary flex-1 justify-center">
            <Check className="h-4 w-4" /> Save
          </button>
          <button onClick={onClose} className="px-3 py-2 text-xs font-semibold opacity-50 hover:opacity-80 transition">Cancel</button>
        </div>
      </div>
    </div>
  );
}

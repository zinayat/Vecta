"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { WIDGET_TYPES } from "./WidgetCard";

export default function AddWidgetModal({ onAdd, onClose, allWidgets }) {
  const [type, setType] = useState("kpi");
  const [title, setTitle] = useState("");
  const [config, setConfig] = useState({});

  const { Form } = WIDGET_TYPES[type];

  function add() {
    onAdd({ type, title, config });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="card w-full max-w-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold">Add a widget</p>
          <button onClick={onClose} className="opacity-40 hover:opacity-80"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-3">
          <select
            className="input"
            value={type}
            onChange={(e) => { setType(e.target.value); setConfig({}); }}
          >
            {Object.entries(WIDGET_TYPES).map(([key, meta]) => (
              <option key={key} value={key}>{meta.label}</option>
            ))}
          </select>

          <input className="input" placeholder="Widget title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />

          <Form config={config} onChange={setConfig} siblingWidgets={allWidgets} />

          <button onClick={add} className="btn-primary w-full mt-2">Add widget</button>
        </div>
      </div>
    </div>
  );
}

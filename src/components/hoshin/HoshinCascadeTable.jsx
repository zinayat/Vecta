"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

function InlineText({ value, onSave, placeholder, readOnly, className }) {
  if (readOnly) return <p className={className}>{value}</p>;
  return (
    <input
      className={`input ${className || ""}`}
      defaultValue={value}
      placeholder={placeholder}
      onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== value) onSave(v); }}
    />
  );
}

function AddForm({ placeholder, onAdd, small }) {
  const [draft, setDraft] = useState("");
  function submit(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    onAdd(draft.trim());
    setDraft("");
  }
  return (
    <form onSubmit={submit} className={`flex items-center gap-2 ${small ? "mt-2" : "mt-3"}`}>
      <input className="input text-xs py-1.5" placeholder={placeholder} value={draft} onChange={(e) => setDraft(e.target.value)} />
      <button type="submit" className="p-1.5 rounded-lg opacity-50 hover:opacity-90 transition flex-shrink-0"><Plus className="h-4 w-4" /></button>
    </form>
  );
}

function StrategyTable({ strategies, onAdd, onUpdate, onRemove, readOnly }) {
  return (
    <div className="mt-2">
      {strategies.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-separate" style={{ borderSpacing: "0 4px" }}>
            <thead>
              <tr className="text-left opacity-40">
                <th className="font-medium pb-1">Strategy / Project</th>
                <th className="font-medium pb-1 w-32">Target / KPI</th>
                <th className="font-medium pb-1 w-32">Owner</th>
                {!readOnly && <th className="w-6" />}
              </tr>
            </thead>
            <tbody>
              {strategies.map((s) => (
                <tr key={s._id} className="group">
                  <td className="pr-2 py-0.5">
                    <InlineText value={s.text} onSave={(v) => onUpdate(s._id, { text: v })} readOnly={readOnly} className="py-1" />
                  </td>
                  <td className="pr-2 py-0.5">
                    <InlineText value={s.target} placeholder="Target" onSave={(v) => onUpdate(s._id, { target: v })} readOnly={readOnly} className="py-1" />
                  </td>
                  <td className="pr-2 py-0.5">
                    <InlineText value={s.ownerName} placeholder="Owner" onSave={(v) => onUpdate(s._id, { ownerName: v })} readOnly={readOnly} className="py-1" />
                  </td>
                  {!readOnly && (
                    <td className="py-0.5">
                      <button onClick={() => onRemove(s._id)} className="p-1 opacity-0 group-hover:opacity-50 hover:!opacity-90 hover:text-red-500 transition">
                        <X className="h-3 w-3" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {strategies.length === 0 && <p className="text-xs opacity-35 italic">No strategies/projects yet</p>}
      {!readOnly && <AddForm placeholder="Add a strategy or project..." onAdd={onAdd} small />}
    </div>
  );
}

export default function HoshinCascadeTable({ breakthroughObjectives, onChange, readOnly }) {
  function persist(next) {
    onChange(next);
  }

  function addBO(text) {
    persist([...breakthroughObjectives, { text, annualObjectives: [] }]);
  }
  function removeBO(boId) {
    persist(breakthroughObjectives.filter((bo) => bo._id !== boId));
  }
  function updateBOText(boId, text) {
    persist(breakthroughObjectives.map((bo) => (bo._id === boId ? { ...bo, text } : bo)));
  }

  function addAO(boId, text) {
    persist(breakthroughObjectives.map((bo) => (bo._id !== boId ? bo : { ...bo, annualObjectives: [...bo.annualObjectives, { text, strategies: [] }] })));
  }
  function removeAO(boId, aoId) {
    persist(breakthroughObjectives.map((bo) => (bo._id !== boId ? bo : { ...bo, annualObjectives: bo.annualObjectives.filter((ao) => ao._id !== aoId) })));
  }
  function updateAOText(boId, aoId, text) {
    persist(breakthroughObjectives.map((bo) => (bo._id !== boId ? bo : { ...bo, annualObjectives: bo.annualObjectives.map((ao) => (ao._id === aoId ? { ...ao, text } : ao)) })));
  }

  function addStrategy(boId, aoId, text) {
    persist(breakthroughObjectives.map((bo) => (bo._id !== boId ? bo : {
      ...bo,
      annualObjectives: bo.annualObjectives.map((ao) => (ao._id !== aoId ? ao : { ...ao, strategies: [...ao.strategies, { text, target: "", ownerName: "" }] })),
    })));
  }
  function removeStrategy(boId, aoId, stratId) {
    persist(breakthroughObjectives.map((bo) => (bo._id !== boId ? bo : {
      ...bo,
      annualObjectives: bo.annualObjectives.map((ao) => (ao._id !== aoId ? ao : { ...ao, strategies: ao.strategies.filter((s) => s._id !== stratId) })),
    })));
  }
  function updateStrategy(boId, aoId, stratId, fields) {
    persist(breakthroughObjectives.map((bo) => (bo._id !== boId ? bo : {
      ...bo,
      annualObjectives: bo.annualObjectives.map((ao) => (ao._id !== aoId ? ao : {
        ...ao,
        strategies: ao.strategies.map((s) => (s._id === stratId ? { ...s, ...fields } : s)),
      })),
    })));
  }

  return (
    <div className="space-y-3">
      {breakthroughObjectives.length === 0 && (
        <div className="card p-6 text-center">
          <p className="text-sm opacity-50">No breakthrough objectives yet. Start with a 3-5 year goal.</p>
        </div>
      )}

      {breakthroughObjectives.map((bo) => (
        <div key={bo._id} className="card p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-35 mb-1">Breakthrough Objective · 3-5 Years</p>
              <InlineText value={bo.text} onSave={(v) => updateBOText(bo._id, v)} readOnly={readOnly} className="text-sm font-bold" />
            </div>
            {!readOnly && (
              <button onClick={() => removeBO(bo._id)} className="p-1 opacity-30 hover:opacity-80 hover:text-red-500 transition flex-shrink-0">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="pl-4 mt-3 space-y-3" style={{ borderLeft: "2px solid var(--color-border)" }}>
            {bo.annualObjectives.map((ao) => (
              <div key={ao._id} className="pl-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-35 mb-1">Annual Objective · This Year</p>
                    <InlineText value={ao.text} onSave={(v) => updateAOText(bo._id, ao._id, v)} readOnly={readOnly} className="text-sm font-semibold" />
                  </div>
                  {!readOnly && (
                    <button onClick={() => removeAO(bo._id, ao._id)} className="p-1 opacity-30 hover:opacity-80 hover:text-red-500 transition flex-shrink-0">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <StrategyTable
                  strategies={ao.strategies}
                  onAdd={(text) => addStrategy(bo._id, ao._id, text)}
                  onUpdate={(stratId, fields) => updateStrategy(bo._id, ao._id, stratId, fields)}
                  onRemove={(stratId) => removeStrategy(bo._id, ao._id, stratId)}
                  readOnly={readOnly}
                />
              </div>
            ))}

            {!readOnly && <AddForm placeholder="Add an annual objective..." onAdd={(text) => addAO(bo._id, text)} />}
          </div>
        </div>
      ))}

      {!readOnly && (
        <div className="card p-4">
          <AddForm placeholder="Add a breakthrough objective (3-5 year goal)..." onAdd={addBO} />
        </div>
      )}
    </div>
  );
}

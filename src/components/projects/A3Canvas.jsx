"use client";

const FIELDS = [
  { key: "background", label: "Background", hint: "Why does this matter? What's the business case?" },
  { key: "currentCondition", label: "Current Condition", hint: "What's happening today - facts and data" },
  { key: "goal", label: "Goal / Target Condition", hint: "What does success look like, specifically" },
  { key: "rootCause", label: "Root Cause Analysis", hint: "Why is the gap there - 5 Whys, fishbone, etc." },
  { key: "countermeasures", label: "Countermeasures", hint: "What will close the gap" },
  { key: "implementationPlan", label: "Implementation Plan", hint: "Who does what, by when" },
  { key: "followUp", label: "Follow-Up / Results", hint: "Did it work - what's the evidence" },
];

export default function A3Canvas({ a3, onChange }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {FIELDS.map(({ key, label, hint }) => (
        <div key={key} className="card p-4">
          <p className="text-xs font-bold uppercase tracking-wide opacity-50 mb-0.5">{label}</p>
          <p className="text-[11px] opacity-35 mb-2">{hint}</p>
          <textarea
            className="input resize-none"
            rows={4}
            defaultValue={a3?.[key] || ""}
            onBlur={(e) => { if (e.target.value !== (a3?.[key] || "")) onChange({ ...a3, [key]: e.target.value }); }}
          />
        </div>
      ))}
    </div>
  );
}

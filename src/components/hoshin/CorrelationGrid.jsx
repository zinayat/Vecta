"use client";

// The classic Hoshin "catchball" linkage: which improvement priorities
// (tactics) actually move which annual objectives, and how strongly.
// Click a cell to cycle none -> secondary -> primary -> none.
const CYCLE = [null, "secondary", "primary"];
const SYMBOL = { primary: "●", secondary: "○" };

export default function CorrelationGrid({ annualObjectives, improvementPriorities, correlations, onToggle }) {
  function strengthAt(rowId, colId) {
    return correlations.find((c) => c.rowId === rowId && c.colId === colId)?.strength || null;
  }

  if (annualObjectives.length === 0 || improvementPriorities.length === 0) {
    return (
      <div className="card p-4">
        <p className="text-xs font-bold uppercase tracking-wide opacity-50 mb-1">Linkage</p>
        <p className="text-xs opacity-40">Add at least one Annual Objective and one Improvement Priority to link them together.</p>
      </div>
    );
  }

  return (
    <div className="card p-4 overflow-x-auto">
      <p className="text-xs font-bold uppercase tracking-wide opacity-50 mb-1">Linkage</p>
      <p className="text-[11px] opacity-35 mb-3">Which improvement priorities move which annual objectives. ● primary · ○ secondary</p>

      <table className="text-xs border-separate" style={{ borderSpacing: "2px" }}>
        <thead>
          <tr>
            <th className="w-40" />
            {improvementPriorities.map((p) => (
              <th key={p._id} className="p-1 font-medium opacity-60 max-w-[6rem] align-bottom" title={p.text}>
                <div className="truncate" style={{ writingMode: "vertical-rl" }}>{p.text}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {annualObjectives.map((row) => (
            <tr key={row._id}>
              <td className="p-1 font-medium opacity-70 max-w-[10rem] truncate" title={row.text}>{row.text}</td>
              {improvementPriorities.map((col) => {
                const strength = strengthAt(row._id, col._id);
                return (
                  <td key={col._id}>
                    <button
                      onClick={() => onToggle(row._id, col._id, CYCLE[(CYCLE.indexOf(strength) + 1) % CYCLE.length])}
                      className="h-8 w-8 rounded-lg flex items-center justify-center transition"
                      style={{
                        background: strength ? "color-mix(in srgb, var(--color-accent) 15%, transparent)" : "var(--color-bg)",
                        color: "var(--color-accent)",
                      }}
                    >
                      {strength ? SYMBOL[strength] : ""}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

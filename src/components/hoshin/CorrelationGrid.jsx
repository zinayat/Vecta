"use client";

// The classic Hoshin "catchball" linkage: which improvement priorities
// (tactics) actually move which annual objectives, and how strongly.
// Click a cell to cycle none -> secondary -> primary -> none.
const CYCLE = [null, "secondary", "primary"];
const SYMBOL = { primary: "●", secondary: "○" };

export default function CorrelationGrid({
  rows,
  cols,
  correlations,
  onToggle,
  readOnly,
  title = "Linkage",
  hint = "Which columns move which rows. ● primary · ○ secondary",
  emptyMessage = "Add at least one item to each side to link them together.",
  bare = false,
}) {
  function strengthAt(rowId, colId) {
    return correlations.find((c) => c.rowId === rowId && c.colId === colId)?.strength || null;
  }

  if (rows.length === 0 || cols.length === 0) {
    return (
      <div className={bare ? "" : "card p-4"}>
        <p className="text-xs font-bold uppercase tracking-wide opacity-50 mb-1">{title}</p>
        <p className="text-xs opacity-40">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${bare ? "" : "card p-4"}`}>
      <p className="text-xs font-bold uppercase tracking-wide opacity-50 mb-1">{title}</p>
      <p className="text-[11px] opacity-35 mb-3">{hint}</p>

      <table className="text-xs border-separate" style={{ borderSpacing: "2px" }}>
        <thead>
          <tr>
            <th className="w-40" />
            {cols.map((p) => (
              <th key={p._id} className="p-1 font-medium opacity-60 max-w-[6rem] align-bottom" title={p.text}>
                <div className="truncate" style={{ writingMode: "vertical-rl" }}>{p.text}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id}>
              <td className="p-1 font-medium opacity-70 max-w-[10rem] truncate" title={row.text}>{row.text}</td>
              {cols.map((col) => {
                const strength = strengthAt(row._id, col._id);
                const cellStyle = {
                  background: strength ? "color-mix(in srgb, var(--color-accent) 15%, transparent)" : "var(--color-bg)",
                  color: "var(--color-accent)",
                };
                return (
                  <td key={col._id}>
                    {readOnly ? (
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={cellStyle}>
                        {strength ? SYMBOL[strength] : ""}
                      </div>
                    ) : (
                      <button
                        onClick={() => onToggle(row._id, col._id, CYCLE[(CYCLE.indexOf(strength) + 1) % CYCLE.length])}
                        className="h-8 w-8 rounded-lg flex items-center justify-center transition"
                        style={cellStyle}
                      >
                        {strength ? SYMBOL[strength] : ""}
                      </button>
                    )}
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

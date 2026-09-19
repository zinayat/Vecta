"use client";

const APPROVAL_COLORS = {
  Pending: "bg-amber-100 text-amber-700",
  Approved: "bg-emerald-100 text-emerald-700",
  Rejected: "bg-red-100 text-red-600",
};

export default function CapExForm({ capex, onChange }) {
  const c = capex || {};

  function field(key) {
    return {
      defaultValue: c[key] ?? "",
      onBlur: (e) => {
        const raw = e.target.value;
        if (String(c[key] ?? "") === raw) return;
        onChange({ ...c, [key]: raw === "" ? null : raw });
      },
    };
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="text-xs font-bold uppercase tracking-wide opacity-50 mb-2">Budget Requested</p>
          <input className="input" type="number" placeholder="0" {...field("budgetRequested")} />
        </div>
        <div className="card p-4">
          <p className="text-xs font-bold uppercase tracking-wide opacity-50 mb-2">Budget Approved</p>
          <input className="input" type="number" placeholder="0" {...field("budgetApproved")} />
        </div>
        <div className="card p-4">
          <p className="text-xs font-bold uppercase tracking-wide opacity-50 mb-2">Expected ROI</p>
          <input className="input" placeholder="e.g. 18 months, 22% IRR" {...field("expectedROI")} />
        </div>
        <div className="card p-4">
          <p className="text-xs font-bold uppercase tracking-wide opacity-50 mb-2">Payback Period (months)</p>
          <input className="input" type="number" placeholder="0" {...field("paybackPeriodMonths")} />
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold uppercase tracking-wide opacity-50">Approval Status</p>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${APPROVAL_COLORS[c.approvalStatus] || APPROVAL_COLORS.Pending}`}>
            {c.approvalStatus || "Pending"}
          </span>
        </div>
        <select
          className="input"
          value={c.approvalStatus || "Pending"}
          onChange={(e) => onChange({ ...c, approvalStatus: e.target.value })}
        >
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      <div className="card p-4">
        <p className="text-xs font-bold uppercase tracking-wide opacity-50 mb-2">Justification</p>
        <textarea className="input resize-none" rows={4} placeholder="Why this spend, why now" {...field("justification")} />
      </div>
    </div>
  );
}

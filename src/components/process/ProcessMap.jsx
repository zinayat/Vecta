"use client";

import { ArrowRight, Package, Box, Wrench, Users, Boxes } from "lucide-react";
import { capacityStatus, CAPACITY_STATUS_COLORS } from "./CapacityFields";
import { TIME_FACTOR_ABBR } from "../../lib/processConstants";

function formatCapacity(cap) {
  const parts = [String(cap.value)];
  if (cap.unit) parts.push(cap.unit);
  const perAbbr = cap.timeFactor ? TIME_FACTOR_ABBR[cap.timeFactor] : null;
  return perAbbr ? `${parts.join(" ")}/${perAbbr}` : parts.join(" ");
}

function CapacityBadge({ engineered, observed, small }) {
  const status = capacityStatus(engineered, observed);
  const color = CAPACITY_STATUS_COLORS[status];
  const hasEng = engineered?.value !== null && engineered?.value !== undefined;
  const hasObs = observed?.value !== null && observed?.value !== undefined;
  if (!hasEng && !hasObs) return null;
  const label = [
    hasEng ? `Eng ${formatCapacity(engineered)}` : null,
    hasObs ? `Obs ${formatCapacity(observed)}` : null,
  ].filter(Boolean).join(" · ");
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border ${small ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"} font-medium`}
      style={{ borderColor: color, color }}
      title={
        status === "belowTarget"
          ? "Running below engineered capacity"
          : status === "onTarget"
          ? "Meeting or exceeding engineered capacity"
          : "Capacity not fully recorded yet"
      }
    >
      <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
      {label}
    </span>
  );
}

// A single-visual summary of a whole process: what feeds it, the steps
// (with their equipment nested and capacity color-coded) it flows
// through, what it makes, and - when passed in - who runs it. Built from
// flex cards + arrow connectors rather than one hand-computed SVG canvas,
// since the number of steps/equipment and the length of their names is
// unbounded - a fixed-geometry drawing would either clip or need constant
// re-measuring, where a flow of cards just wraps and scrolls naturally.
export default function ProcessMap({ process, teams, people, assignments }) {
  const teamNames = (process.teamIds || []).map((id) => teams.find((t) => t._id === id)?.name).filter(Boolean);
  const peopleNames = (process.peopleIds || []).map((id) => people.find((p) => p._id === id)?.name).filter(Boolean);
  const assignedTeamNames = [...new Set((assignments || []).flatMap((a) => a.teamIds || []).map((id) => teams.find((t) => t._id === id)?.name).filter(Boolean))];
  const assignedPeopleNames = [...new Set(
    (assignments || []).flatMap((a) => (a.stepAssignments || []).flatMap((sa) => sa.userIds || []))
      .map((id) => people.find((p) => p._id === id)?.name)
      .filter(Boolean)
  )];

  // Who's staffed to run a given step, across every operations plan
  // assignment for this process - collected here rather than passed down
  // pre-computed, since it's cheap and keeps the per-step lookup local to
  // where it's rendered.
  function stepAssignedNames(stepId) {
    const ids = new Set();
    for (const a of assignments || []) {
      for (const sa of a.stepAssignments || []) {
        if (sa.stepId === stepId) (sa.userIds || []).forEach((uid) => ids.add(uid));
      }
    }
    return [...ids].map((uid) => people.find((p) => p._id === uid)?.name).filter(Boolean);
  }

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide opacity-40">Process</p>
            <p className="text-lg font-black">{process.name}</p>
            {process.product && (
              <p className="text-xs opacity-60 mt-0.5 flex items-center gap-1"><Package className="h-3 w-3" /> Makes: {process.product}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 text-[11px]">
            {(teamNames.length > 0 || assignedTeamNames.length > 0) && (
              <p className="opacity-60 flex items-center gap-1"><Boxes className="h-3 w-3" /> {[...new Set([...teamNames, ...assignedTeamNames])].join(", ")}</p>
            )}
            {(peopleNames.length > 0 || assignedPeopleNames.length > 0) && (
              <p className="opacity-60 flex items-center gap-1"><Users className="h-3 w-3" /> {[...new Set([...peopleNames, ...assignedPeopleNames])].join(", ")}</p>
            )}
            {assignments && assignments.length > 0 && (
              <p className="opacity-40">{assignments.length} operations plan assignment{assignments.length === 1 ? "" : "s"}</p>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex items-stretch gap-2 min-w-max">
          {process.inputs && process.inputs.length > 0 && (
            <>
              <div className="w-44 flex-shrink-0 rounded-xl border-2 border-dashed p-3" style={{ borderColor: "var(--color-border)" }}>
                <p className="text-[10px] font-bold uppercase tracking-wide opacity-40 mb-1.5">Inputs</p>
                <div className="space-y-1">
                  {process.inputs.map((inp) => (
                    <p key={inp._id} className="text-xs truncate" title={inp.notes || ""}>
                      {inp.name}{inp.quantity ? ` · ${inp.quantity}` : ""}
                    </p>
                  ))}
                </div>
              </div>
              <div className="flex items-center flex-shrink-0"><ArrowRight className="h-4 w-4 opacity-30" /></div>
            </>
          )}

          {(process.steps || []).length === 0 ? (
            <div className="w-56 flex-shrink-0 rounded-xl border p-4 flex items-center justify-center" style={{ borderColor: "var(--color-border)" }}>
              <p className="text-xs opacity-40 italic text-center">No steps designed yet</p>
            </div>
          ) : (
            process.steps.map((step, i) => (
              <div key={step._id} className="contents">
                <div className="w-56 flex-shrink-0 card p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide opacity-40 mb-0.5">Step {i + 1}</p>
                  <p className="text-sm font-semibold mb-1.5 break-words">{step.name}</p>
                  <div className="mb-2">
                    <CapacityBadge engineered={step.engineeredCapacity} observed={step.observedCapacity} />
                  </div>
                  {stepAssignedNames(step._id).length > 0 && (
                    <p className="text-[10px] opacity-50 flex items-center gap-1 mb-2 truncate" title={stepAssignedNames(step._id).join(", ")}>
                      <Users className="h-2.5 w-2.5 flex-shrink-0" /> {stepAssignedNames(step._id).join(", ")}
                    </p>
                  )}
                  {step.equipment && step.equipment.length > 0 && (
                    <div className="space-y-1 pt-2 border-t" style={{ borderColor: "var(--color-border)" }}>
                      {step.equipment.map((eq) => (
                        <div key={eq._id} className="flex items-center justify-between gap-1.5">
                          <span className="text-[11px] flex items-center gap-1 truncate min-w-0"><Wrench className="h-3 w-3 opacity-40 flex-shrink-0" /> <span className="truncate">{eq.name}</span></span>
                          <CapacityBadge engineered={eq.engineeredCapacity} observed={eq.observedCapacity} small />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center flex-shrink-0"><ArrowRight className="h-4 w-4 opacity-30" /></div>
              </div>
            ))
          )}

          <div className="w-44 flex-shrink-0 rounded-xl p-3 flex flex-col items-center justify-center text-center" style={{ background: "color-mix(in srgb, var(--color-primary) 10%, transparent)" }}>
            <Box className="h-5 w-5 mb-1" style={{ color: "var(--color-primary)" }} />
            <p className="text-[10px] font-bold uppercase tracking-wide opacity-50">Output</p>
            <p className="text-xs font-semibold break-words">{process.product || "Finished product"}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 text-[10px] opacity-50">
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ background: CAPACITY_STATUS_COLORS.onTarget }} /> At/above engineered capacity</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ background: CAPACITY_STATUS_COLORS.belowTarget }} /> Below engineered capacity</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ background: CAPACITY_STATUS_COLORS.unknown }} /> Not recorded</span>
      </div>
    </div>
  );
}

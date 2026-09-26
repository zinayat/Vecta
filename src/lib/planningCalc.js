// Rule-based (not AI) math behind each planning phase - plain arithmetic
// specific to whichever route (MTS/MTO) the cycle is on, same honest
// "keyword matching and formulas, not a model call" approach as the rest
// of Vecta's "assisted" features (KPI Builder, A3 progress, etc). Each
// function returns null when there isn't enough entered data to compute
// anything yet, rather than a misleading zero.
function num(v) {
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function demandPlanningResult(route, inputs) {
  if (route === "MTS") {
    const values = (inputs?.salesHistory || []).map((h) => num(h.value)).filter((v) => v !== null);
    if (values.length === 0) return null;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return { label: "Forecasted demand (average of entries)", value: avg };
  }
  const deals = inputs?.pipelineDeals || [];
  const weighted = deals.reduce((sum, d) => {
    const v = num(d.value), p = num(d.probability);
    return v === null || p === null ? sum : sum + v * (p / 100);
  }, 0);
  const anyUsable = deals.some((d) => num(d.value) !== null && num(d.probability) !== null);
  return anyUsable ? { label: "Weighted pipeline forecast", value: weighted } : null;
}

function sopResult(route, inputs) {
  if (route === "MTS") {
    const inv = num(inputs?.currentInventory), safety = num(inputs?.safetyStock), demand = num(inputs?.forecastedDemand);
    if (inv === null || safety === null || demand === null) return null;
    const balance = inv - safety - demand;
    return { label: balance >= 0 ? "Surplus" : "Deficit (stockout risk)", value: balance, warn: balance < 0 };
  }
  const backlog = num(inputs?.backlogOrders), capacity = num(inputs?.capacityPerWeek);
  if (backlog === null || capacity === null || capacity <= 0) return null;
  return { label: "Weeks to clear backlog", value: backlog / capacity };
}

function masterSchedulingResult(route, inputs) {
  if (route === "MTS") {
    const inv = num(inputs?.currentInventory), rop = num(inputs?.reorderPoint);
    if (inv === null || rop === null) return null;
    const needsReorder = inv <= rop;
    return { label: needsReorder ? "Reorder now" : "OK - above reorder point", value: inv - rop, warn: needsReorder };
  }
  const contracts = inputs?.signedContracts || [];
  const usable = contracts.filter((c) => c.customer || num(c.value) !== null);
  if (usable.length === 0) return null;
  const total = usable.reduce((sum, c) => { const v = num(c.value); return v === null ? sum : sum + v; }, 0);
  return { label: `${usable.length} triggered order${usable.length === 1 ? "" : "s"}`, value: total };
}

function capacityPlanningResult(route, inputs) {
  if (route === "MTS") {
    const avail = num(inputs?.availableCapacity), planned = num(inputs?.plannedProduction);
    if (avail === null || planned === null || avail <= 0) return null;
    const pct = (planned / avail) * 100;
    return { label: "Utilization", value: pct, isPercent: true, warn: pct > 100 };
  }
  const base = num(inputs?.baseCapacity), buffer = num(inputs?.bufferPercent);
  if (base === null || buffer === null) return null;
  return { label: "Effective capacity after buffer", value: base * (1 - buffer / 100) };
}

function materialPlanningResult(route, inputs) {
  if (route === "MTS") {
    const demand = num(inputs?.forecastedDemandUnits), qty = num(inputs?.qtyPerUnit);
    if (demand === null || qty === null) return null;
    return { label: "Bulk material needed", value: demand * qty };
  }
  const jobs = (inputs?.wonJobs || []).filter((j) => j.job || j.componentDescription);
  return jobs.length > 0 ? { label: `${jobs.length} job${jobs.length === 1 ? "" : "s"} with components to order`, value: null } : null;
}

export const PHASE_RESULT_FNS = {
  demandPlanning: demandPlanningResult,
  sop: sopResult,
  masterScheduling: masterSchedulingResult,
  capacityPlanning: capacityPlanningResult,
  materialPlanning: materialPlanningResult,
};

export function computePhaseResult(phaseKey, route, inputs) {
  const fn = PHASE_RESULT_FNS[phaseKey];
  return fn ? fn(route, inputs || {}) : null;
}

export function formatResultValue(result) {
  if (!result || result.value === null || result.value === undefined) return null;
  const rounded = Math.round(result.value * 100) / 100;
  return result.isPercent ? `${rounded}%` : `${rounded}`;
}

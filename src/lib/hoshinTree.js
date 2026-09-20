// Flattens the nested Breakthrough Objective -> Annual Objective -> Strategy
// tree into flat lists, each item keeping its real Mongo _id plus a
// reference back to its parent(s) - used anywhere that needs a flat view
// of the cascade (the X-Matrix quadrants, the correlation grid's row list).
export function flattenHoshinTree(plan) {
  const breakthroughObjectives = [];
  const annualObjectives = [];
  const strategies = [];

  for (const bo of plan?.breakthroughObjectives || []) {
    breakthroughObjectives.push({ _id: bo._id, text: bo.text });
    for (const ao of bo.annualObjectives || []) {
      annualObjectives.push({ _id: ao._id, text: ao.text, boId: bo._id, boText: bo.text });
      for (const s of ao.strategies || []) {
        strategies.push({
          _id: s._id,
          text: s.text,
          target: s.target || "",
          unit: s.unit || "",
          measurementType: s.measurementType || "Count",
          direction: s.direction || "higherIsBetter",
          whatSuccessLooksLike: s.whatSuccessLooksLike || "",
          ownerName: s.ownerName || "",
          aoId: ao._id,
          aoText: ao.text,
          boId: bo._id,
          boText: bo.text,
        });
      }
    }
  }

  return { breakthroughObjectives, annualObjectives, strategies };
}

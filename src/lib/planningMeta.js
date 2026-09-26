// Shared content for the Planning module - phase order/labels, the
// MTS/MTO description for each (same wording as the old comparison
// table, now attached to a real working phase instead of a static row),
// and which input fields each phase+route combination actually collects.
// One source of truth so the phase cards, the calculation functions, and
// any future display all agree on what each phase is.
export const PHASES = ["demandPlanning", "sop", "masterScheduling", "capacityPlanning", "materialPlanning"];

export const PHASE_LABELS = {
  demandPlanning: "1. Demand Planning",
  sop: "2. S&OP",
  masterScheduling: "3. Master Scheduling (MPS)",
  capacityPlanning: "4. Capacity Planning",
  materialPlanning: "5. Material Planning (MRP)",
};

export const PHASE_DESCRIPTIONS = {
  demandPlanning: {
    MTS: "Driven by statistical forecasting and historical sales trends. You build to a forecast before the customer orders.",
    MTO: "Driven by sales pipelines, quotes, and market trends. You forecast macro-capacity, not exact items.",
  },
  sop: {
    MTS: "Focuses on balancing inventory levels so you don't stock out or overproduce.",
    MTO: "Focuses on balancing backlog (order queue), lead times, and engineering resource capacity.",
  },
  masterScheduling: {
    MTS: "Orders trigger when inventory drops below a safety threshold (Reorder points).",
    MTO: "Orders trigger the moment a customer signs a contract.",
  },
  capacityPlanning: {
    MTS: "Uses predictable, fixed routing times. Easy to schedule in blocks.",
    MTO: "Highly variable routing times. Requires buffer capacity for emergency customer orders.",
  },
  materialPlanning: {
    MTS: "Raw materials and components are bought in bulk based on the forecast.",
    MTO: "Raw materials might be stocked, but unique components are only ordered when the job is won.",
  },
};

// Drives the generic phase-input editor: "numbers" renders one number
// field per entry; "list" renders an add/remove row list (ListInput).
// Switching a cycle's route changes which keys are read here, so
// existing `inputs` entered under the old route are simply left unread
// (not deleted) rather than migrated - re-enter under the new route.
export const PHASE_FIELD_CONFIG = {
  demandPlanning: {
    MTS: { type: "list", key: "salesHistory", addLabel: "a period's sales", resultHint: "Forecast = average of entries",
      columns: [{ key: "date", label: "Period (e.g. Jan 2027)" }, { key: "value", label: "Units sold", numeric: true }] },
    MTO: { type: "list", key: "pipelineDeals", addLabel: "a deal", resultHint: "Forecast = sum(value × probability)",
      columns: [{ key: "name", label: "Deal name" }, { key: "value", label: "Value", numeric: true }, { key: "probability", label: "Probability %", numeric: true }] },
  },
  sop: {
    MTS: { type: "numbers", fields: [
      { key: "currentInventory", label: "Current inventory" },
      { key: "safetyStock", label: "Safety stock target" },
      { key: "forecastedDemand", label: "Forecasted demand (period)" },
    ] },
    MTO: { type: "numbers", fields: [
      { key: "backlogOrders", label: "Backlog (orders in queue)" },
      { key: "capacityPerWeek", label: "Capacity (orders/week)" },
    ] },
  },
  masterScheduling: {
    MTS: { type: "numbers", fields: [
      { key: "currentInventory", label: "Current inventory" },
      { key: "reorderPoint", label: "Reorder point" },
    ] },
    MTO: { type: "list", key: "signedContracts", addLabel: "a signed contract", resultHint: "Each signed contract is its own trigger",
      columns: [{ key: "customer", label: "Customer" }, { key: "date", label: "Date", inputType: "date" }, { key: "value", label: "Value", numeric: true }] },
  },
  capacityPlanning: {
    MTS: { type: "numbers", fields: [
      { key: "availableCapacity", label: "Available capacity" },
      { key: "plannedProduction", label: "Planned production" },
    ] },
    MTO: { type: "numbers", fields: [
      { key: "baseCapacity", label: "Base capacity" },
      { key: "bufferPercent", label: "Buffer reserved (%)" },
    ] },
  },
  materialPlanning: {
    MTS: { type: "numbers", fields: [
      { key: "forecastedDemandUnits", label: "Forecasted demand (units)" },
      { key: "qtyPerUnit", label: "Material qty per unit" },
    ] },
    MTO: { type: "list", key: "wonJobs", addLabel: "a won job", resultHint: "Each won job lists its own unique components",
      columns: [{ key: "job", label: "Job / order #" }, { key: "componentDescription", label: "Unique components needed" }] },
  },
};

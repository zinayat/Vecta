"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "../../lib/apiClient";

// Live value for source: "linked" - reads another KPI tile's stored value,
// or a Project's success measure value. One level only (doesn't recursively
// resolve if the target is itself linked/consolidated) - keeps this simple
// and avoids any chance of a reference cycle.
export function useLinkedValue(linkedRef) {
  const [value, setValue] = useState(undefined);

  useEffect(() => {
    if (!linkedRef) { setValue(null); return; }
    let cancelled = false;

    async function load() {
      try {
        if (linkedRef.kind === "kpiWidget") {
          const data = await apiFetch(`/api/dashboards/${linkedRef.dashboardId}`);
          const w = data.dashboard.widgets.find((w) => w._id === linkedRef.widgetId);
          if (!cancelled) setValue(w?.config?.value ?? null);
        } else if (linkedRef.kind === "projectSuccessMeasure") {
          const data = await apiFetch(`/api/projects/${linkedRef.projectId}`);
          if (!cancelled) setValue(data.project?.successMeasure?.value ?? null);
        } else {
          if (!cancelled) setValue(null);
        }
      } catch {
        if (!cancelled) setValue(null);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [linkedRef?.kind, linkedRef?.dashboardId, linkedRef?.widgetId, linkedRef?.projectId]);

  return value;
}

// Live value for source: "api" - fetches on mount/config change via the
// server-side proxy, and exposes a manual refetch for the Settings tab's
// "Fetch now" button.
export function useApiValue(apiConfig) {
  const [state, setState] = useState({ value: undefined, error: "", loading: false });

  const fetchNow = useCallback(async () => {
    if (!apiConfig?.url) { setState({ value: null, error: "", loading: false }); return null; }
    setState((s) => ({ ...s, loading: true, error: "" }));
    try {
      const data = await apiFetch("/api/kpi-fetch", { method: "POST", body: { url: apiConfig.url, jsonPath: apiConfig.jsonPath } });
      setState({ value: data.value, error: "", loading: false });
      return data.value;
    } catch (err) {
      setState({ value: null, error: err.message, loading: false });
      return null;
    }
  }, [apiConfig?.url, apiConfig?.jsonPath]);

  useEffect(() => {
    fetchNow();
  }, [fetchNow]);

  return { ...state, refetch: fetchNow };
}

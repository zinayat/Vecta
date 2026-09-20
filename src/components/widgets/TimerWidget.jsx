"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

// Purely client-side - a meeting timer doesn't need to survive a page
// refresh or sync across viewers, so nothing here is persisted beyond the
// configured duration/label.
export function TimerWidgetDisplay({ config }) {
  const durationSeconds = Math.max(1, Number(config?.durationMinutes) || 15) * 60;
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    setSecondsLeft(durationSeconds);
    setRunning(false);
  }, [durationSeconds]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const overtime = secondsLeft === 0;

  return (
    <div>
      <p className="text-xs opacity-50 mb-1">{config?.label || "Meeting Timer"}</p>
      <p className={`text-3xl font-black tabular-nums ${overtime ? "text-red-500" : ""}`}>
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </p>
      <div className="flex items-center gap-1.5 mt-2">
        <button
          onClick={() => setRunning((r) => !r)}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium opacity-70 hover:opacity-100 transition"
          style={{ background: "var(--color-bg)" }}
        >
          {running ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          {running ? "Pause" : "Start"}
        </button>
        <button
          onClick={() => { setSecondsLeft(durationSeconds); setRunning(false); }}
          className="p-1.5 rounded-lg opacity-50 hover:opacity-90 transition"
          style={{ background: "var(--color-bg)" }}
        >
          <RotateCcw className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export function TimerWidgetForm({ config, onChange }) {
  const c = config || {};
  return (
    <div className="space-y-2">
      <input className="input" placeholder="Label (e.g. Daily Huddle)" value={c.label || ""} onChange={(e) => onChange({ ...c, label: e.target.value })} />
      <input className="input" type="number" min={1} placeholder="Duration (minutes)" value={c.durationMinutes || ""} onChange={(e) => onChange({ ...c, durationMinutes: e.target.value })} />
    </div>
  );
}

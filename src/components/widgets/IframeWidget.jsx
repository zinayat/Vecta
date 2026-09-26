"use client";

import { Link2 } from "lucide-react";

// Only plain http(s) is allowed as an embed target - a javascript:/data:
// URL in an <iframe src> is the one real injection risk here, and there's
// no legitimate embed use case for either. Anyone signed in can add a
// widget to a shared dashboard (same as every other widget type), so this
// is a basic guard against a careless or malicious URL, not just a UX nicety.
export function isSafeEmbedUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

const DEFAULT_HEIGHT = 400;

export function IframeWidgetDisplay({ config }) {
  const { url, height, title } = config || {};

  if (!isSafeEmbedUrl(url)) {
    return (
      <div className="flex flex-col items-center justify-center gap-1.5 py-10 opacity-35">
        <Link2 className="h-5 w-5" />
        <p className="text-xs">Enter a URL in Settings to embed a page here</p>
      </div>
    );
  }

  return (
    <>
      <iframe
        src={url}
        title={title || "Embedded content"}
        className="w-full rounded-lg block"
        style={{ height: `${Number(height) || DEFAULT_HEIGHT}px`, border: "1px solid var(--color-border)" }}
        loading="lazy"
        referrerPolicy="no-referrer"
        // Permissive enough for most real embeds (sheets, video, BI
        // dashboards, forms) to actually work, while still withholding
        // allow-top-navigation - the embedded page can act like a normal
        // page within its own frame, but it can never navigate the whole
        // Vecta tab away to somewhere else.
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
      />
      <p className="text-[10px] opacity-30 mt-1 truncate">{url}</p>
    </>
  );
}

export function IframeWidgetForm({ config, onChange }) {
  const c = config || {};
  const urlInvalid = Boolean(c.url) && !isSafeEmbedUrl(c.url);

  return (
    <div className="space-y-2">
      <input
        className={`input ${urlInvalid ? "border-red-400" : ""}`}
        placeholder="https://example.com/embeddable-page"
        value={c.url || ""}
        onChange={(e) => onChange({ ...c, url: e.target.value })}
      />
      {urlInvalid && <p className="text-[11px] text-red-500">Enter a full http:// or https:// URL</p>}

      <input
        className="input"
        type="number"
        min={100}
        max={2000}
        placeholder={`Height in pixels (default ${DEFAULT_HEIGHT})`}
        value={c.height || ""}
        onChange={(e) => onChange({ ...c, height: e.target.value })}
      />

      <p className="text-[10px] opacity-35">
        Not every site allows being embedded (some block it outright via X-Frame-Options/CSP) - if the tile shows blank
        after saving a real URL, that site can't be shown this way. Works well for things meant to be embedded, like a
        published Google Sheet, a BI report, or a video.
      </p>
    </div>
  );
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/auth";
import { getByPath } from "../../../lib/kpiBuilder";

const FETCH_TIMEOUT_MS = 8000;
const MAX_RESPONSE_BYTES = 1_000_000; // 1MB - plenty for a metrics endpoint, not for arbitrary downloads

// Server-side proxy for the "API Connected" KPI data source - the browser
// can't fetch most external APIs directly (CORS, and we don't want to hand
// third-party credentials/URLs to client JS anyway). Requires a signed-in
// user so this can't be used as an open proxy by anyone who finds the URL.
//
// Caveat, stated plainly rather than implied otherwise: this fetches
// whatever URL a user configures, server-side, with no allowlisting beyond
// requiring http(s) and blocking obviously-internal hosts. Only point it at
// URLs you trust - this is not hardened against a malicious teammate probing
// your own network from the server.
const BLOCKED_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0", "::1"];

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let url, jsonPath;
  try {
    ({ url, jsonPath } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!url) return NextResponse.json({ error: "url is required" }, { status: 400 });

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "That doesn't look like a valid URL" }, { status: 400 });
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return NextResponse.json({ error: "Only http/https URLs are supported" }, { status: 400 });
  }
  if (BLOCKED_HOSTS.includes(parsed.hostname) || parsed.hostname.startsWith("169.254.") || parsed.hostname.endsWith(".internal")) {
    return NextResponse.json({ error: "That host isn't allowed" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(parsed.toString(), { method: "GET", signal: controller.signal, headers: { Accept: "application/json" } });
    clearTimeout(timeout);

    if (!res.ok) return NextResponse.json({ error: `Request failed with status ${res.status}` }, { status: 502 });

    const text = await res.text();
    if (text.length > MAX_RESPONSE_BYTES) return NextResponse.json({ error: "Response too large" }, { status: 502 });

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "Response wasn't valid JSON" }, { status: 502 });
    }

    const value = jsonPath ? getByPath(data, jsonPath) : data;
    if (value === undefined) return NextResponse.json({ error: `Nothing found at path "${jsonPath}"` }, { status: 422 });
    if (typeof value === "object") return NextResponse.json({ error: "That path points to an object, not a single value - narrow the path" }, { status: 422 });

    return NextResponse.json({ value, fetchedAt: new Date().toISOString() });
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") return NextResponse.json({ error: "Request timed out" }, { status: 504 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

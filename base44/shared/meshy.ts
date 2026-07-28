// Shared Meshy AI helpers used by meshy_connect, meshy_start_generation, and
// meshy_check_job. Base URL + auth + 43s timeout live here so every function
// talks to Meshy identically.

const MESHY_BASE = "https://api.meshy.ai/openapi/v1";

// Resolves the Meshy API key: app-level secret first (demo mode), then the
// authenticated user's own key from their UserProfile (RLS-scoped read).
export async function getMeshyKey(base44) {
  const appKey = Deno.env.get("MESHY_API_KEY");
  if (appKey) return { key: appKey, isAppKey: true };
  const profiles = await base44.entities.UserProfile.filter({});
  const key = (profiles || []).map((p) => p.meshy_api_key).find(Boolean);
  return { key: key || null, isAppKey: false };
}

// Fetch against the Meshy API with bearer auth and a 43-second timeout.
// Returns { status, ok, data } — data parsed as JSON (or {} on parse failure).
export async function meshyFetch(key, path, options = {}) {
  const res = await fetch(MESHY_BASE + path, {
    ...options,
    headers: {
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    signal: AbortSignal.timeout(43000),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}
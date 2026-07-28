// Shared Meshy AI helpers used by meshy_connect, meshy_start_generation, and
// meshy_check_job. Base URL + auth + timeout live here so every function talks
// to Meshy identically.

const MESHY_BASE = "https://api.meshy.ai/openapi/v1";

// Resolves the Meshy API key with the app's fallback chain:
//   1. The user's own key (UserProfile.meshy_api_key) — always wins.
//   2. The app-level key (SessionConfig where key = "meshy_api_key") — read with
//      the service role so judges/users never need read access to the secret.
// Returns { key, isAppKey }.
export async function getMeshyKey(base44) {
  const profiles = await base44.entities.UserProfile.filter({});
  const userKey = (profiles || []).map((p) => (p.meshy_api_key || "").trim()).find(Boolean);
  if (userKey) return { key: userKey, isAppKey: false };

  const configs = await base44.asServiceRole.entities.SessionConfig
    .filter({ key: "meshy_api_key" })
    .catch(() => []);
  const appKey = (configs || []).map((c) => (c.value || "").trim()).find(Boolean);
  if (appKey) return { key: appKey, isAppKey: true };

  return { key: null, isAppKey: false };
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
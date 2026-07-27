// Shared helpers for reaching the authenticated user's live Unity bridge.
// Mirrors the endpoint logic in functions/unity_bridge_relay so the chat can
// call the editor directly (read the scene, run C#) without duplicating it.

const normalizeUrl = (url: string) => String(url || "").trim().replace(/\/+$/, "");

const authHeaders = () => {
  const key = Deno.env.get("UNITY_BRIDGE_API_KEY");
  if (!key) return {} as Record<string, string>;
  return { Authorization: `Bearer ${key}`, "X-API-Key": key };
};

async function fetchWithTimeout(url: string, opts: RequestInit, timeoutMs: number) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    clearTimeout(timer);
    const body = await res.text().catch(() => "");
    return { ok: res.ok, status: res.status, body };
  } catch (e: any) {
    clearTimeout(timer);
    return { ok: false, timeout: e?.name === "AbortError", error: e?.message || "network error" };
  }
}

const EXECUTE_TIMEOUT_MS = 100000;

// Loads the authenticated user's most recent bridge session (RLS-scoped by the
// caller's client). Returns null when nothing is configured.
export async function getBridge(base44: any) {
  const list = await base44.entities.BridgeSession.filter({}, "-created_date", 1);
  return list && list[0] ? list[0] : null;
}

// Runs a bridge command (raw C# string or the built-in command words the Forge
// Bridge CodeRunner understands, e.g. "scene.hierarchy"). Returns the parsed
// bridge response { success, result, error }.
export async function runOnBridge(tunnelUrl: string, code: string) {
  const base = normalizeUrl(tunnelUrl);
  if (!base) return { success: false, error: "No bridge URL configured." };
  const opts: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ code }),
  };
  // The Forge Bridge package uses /execute; some bridges use /exec.
  let r = await fetchWithTimeout(base + "/execute", opts, EXECUTE_TIMEOUT_MS);
  if (!r.timeout && r.status === 404) {
    r = await fetchWithTimeout(base + "/exec", opts, EXECUTE_TIMEOUT_MS);
  }
  if (r.timeout) return { success: false, error: "Bridge did not respond in time." };
  if (!r.ok) {
    return {
      success: false,
      error: `Bridge responded ${r.status || "unreachable"}` + (r.body ? `: ${r.body.slice(0, 300)}` : ""),
    };
  }
  try {
    const parsed = JSON.parse(r.body);
    if (typeof parsed.success !== "boolean") parsed.success = !parsed.error;
    return parsed;
  } catch {
    return { success: true, result: r.body };
  }
}
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

// The bridge marks a command "success" as long as it RAN — but the CodeRunner
// reports real problems inside the result text ("RUNTIME ERROR: ...",
// "Unknown tool '...'"). Treat those as failures so we never post a false
// success narration.
export function resultLooksFailed(result: unknown): boolean {
  const s = String(result ?? "");
  return /RUNTIME ERROR|Unknown tool|Unknown command|^ERROR:/im.test(s);
}

// Runs a list of already-serialized action envelopes. Tries ONE `batch` call
// first (fast path, single main-thread pass). Older CodeRunner versions don't
// know `batch` — they answer "Unknown tool 'batch'" with success=true — so we
// detect that and fall back to running each action sequentially. Any step whose
// result text contains an error marks the whole run failed.
export async function runActionsOnBridge(tunnelUrl: string, codes: string[]) {
  if (codes.length === 0) return { success: true, result: "" };

  if (codes.length > 1) {
    const batchCode = JSON.stringify({ tool: "batch", steps: codes });
    const out = await runOnBridge(tunnelUrl, batchCode);
    const text = String(out?.result ?? "");
    const oldBridge = /Unknown (tool|command) 'batch'/i.test(text);
    if (!oldBridge) {
      if (!out?.success) return { success: false, error: out?.error || "The editor could not run this step." };
      if (resultLooksFailed(text)) return { success: false, error: text.slice(0, 500) };
      return { success: true, result: text };
    }
    // fall through to sequential for old bridges
  }

  const lines: string[] = [];
  for (const code of codes) {
    const out = await runOnBridge(tunnelUrl, code);
    if (!out?.success) return { success: false, error: out?.error || "The editor could not run this step." };
    const text = String(out?.result ?? "ok");
    if (resultLooksFailed(text)) return { success: false, error: text.slice(0, 500) };
    lines.push(text);
  }
  return { success: true, result: lines.join("\n") };
}
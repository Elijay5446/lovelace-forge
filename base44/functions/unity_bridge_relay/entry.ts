import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const normalizeUrl = (url) => String(url || "").trim().replace(/\/+$/, "");
const nowIso = () => new Date().toISOString();

// Auth headers for the user's bridge server. Sends the key in both common
// styles (Bearer + X-API-Key) — servers ignore headers they don't check.
const authHeaders = () => {
  const key = Deno.env.get("UNITY_BRIDGE_API_KEY");
  if (!key) return {};
  return { Authorization: `Bearer ${key}`, "X-API-Key": key };
};

async function fetchWithTimeout(url, opts, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    clearTimeout(timer);
    const body = await res.text().catch(() => "");
    return { ok: res.ok, status: res.status, body };
  } catch (e) {
    clearTimeout(timer);
    return { ok: false, timeout: e?.name === "AbortError", error: e?.message || "network error" };
  }
}

// Probe the tunnel with an 8s hard cap — tries /health (which carries the Unity
// version + project name) then /ping. Returns any details it can parse so the
// caller can persist them for the status panel.
async function pingTunnel(tunnelUrl) {
  const base = normalizeUrl(tunnelUrl);
  if (!base) return { ok: false, error: "no url" };
  for (const path of ["/health", "/ping"]) {
    const r = await fetchWithTimeout(base + path, { method: "GET", headers: authHeaders() }, 8000);
    if (r.timeout) return { ok: false, timeout: true };
    if (r.ok && r.status >= 200 && r.status < 300) {
      let details = {};
      try {
        const parsed = JSON.parse(r.body || "{}");
        details = {
          unity_version: parsed.unity || parsed.unity_version || parsed.unityVersion || "",
          project_name: parsed.project || parsed.project_name || parsed.projectName || "",
        };
      } catch { /* /ping may not return JSON */ }
      return { ok: true, path, details };
    }
  }
  return { ok: false };
}

// Hard cap for /execute forwarding. Kept under Base44's ~45s function ceiling
// so the relay always returns cleanly instead of being killed mid-flight.
const EXECUTE_TIMEOUT_MS = 43000;

// GET /list_tools from the bridge with a short cap — returns the tool schema
// array the Unity side advertises. Returns [] if the bridge doesn't expose it.
async function listToolsFromTunnel(tunnelUrl) {
  const base = normalizeUrl(tunnelUrl);
  const r = await fetchWithTimeout(base + "/list_tools", { method: "GET", headers: authHeaders() }, 8000);
  if (!r.ok) return { success: false, error: r.timeout ? "Bridge timed out fetching tools." : "Bridge did not return tools." };
  try {
    const parsed = JSON.parse(r.body);
    const tools = Array.isArray(parsed) ? parsed : parsed?.tools;
    return { success: true, tools: Array.isArray(tools) ? tools : [] };
  } catch {
    return { success: false, error: "Bridge returned invalid tool JSON." };
  }
}

// POST C# to the bridge /execute with a 43s hard cap — never hangs longer.
async function executeOnTunnel(tunnelUrl, code) {
  const base = normalizeUrl(tunnelUrl);
  const opts = {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ code }),
  };
  // The user's bridge exposes POST /exec; the Forge Bridge package uses /execute.
  let r = await fetchWithTimeout(base + "/exec", opts, EXECUTE_TIMEOUT_MS);
  if (!r.timeout && r.status === 404) {
    r = await fetchWithTimeout(base + "/execute", opts, EXECUTE_TIMEOUT_MS);
  }
  if (r.timeout) {
    return {
      success: false,
      error:
        "Bridge did not respond within 43s — the operation may still be running in Unity. Try again or check that the bridge is running.",
    };
  }
  if (!r.ok) {
    return {
      success: false,
      error: `Bridge responded ${r.status || "unreachable"}` + (r.body ? `: ${r.body.slice(0, 300)}` : ""),
    };
  }
  let parsed;
  try {
    parsed = JSON.parse(r.body);
  } catch {
    parsed = { success: true, result: r.body };
  }
  if (typeof parsed.success !== "boolean") parsed.success = !parsed.error;
  return parsed;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    // Always operates ONLY on the authenticated user's own BridgeSession (RLS-scoped).
    const getBridge = async () => {
      const list = await base44.entities.BridgeSession.filter({}, "-created_date", 1);
      return list && list[0] ? list[0] : null;
    };
    const upsertBridge = async (patch) => {
      const existing = await getBridge();
      if (existing) return base44.entities.BridgeSession.update(existing.id, patch);
      return base44.entities.BridgeSession.create({ status: "disconnected", ...patch });
    };

    if (action === "diagnose") {
      const base = normalizeUrl(body.tunnel_url);
      const key = Deno.env.get("UNITY_BRIDGE_API_KEY") || "";
      const styles = {
        bearer: { Authorization: `Bearer ${key}` },
        raw_auth: { Authorization: key },
        x_api_key: { "X-API-Key": key },
        x_auth_token: { "X-Auth-Token": key },
        api_key_header: { "api-key": key },
        query: null,
      };
      const results = {};
      for (const [name, headers] of Object.entries(styles)) {
        const url = headers ? base + "/health" : base + "/health?api_key=" + encodeURIComponent(key);
        const r = await fetchWithTimeout(url, { method: "GET", headers: headers || {} }, 8000);
        results[name] = { status: r.status ?? null, body: (r.body || r.error || "").slice(0, 120) };
      }
      return Response.json({ success: true, key_set: !!key, key_length: key.length, results });
    }

    if (action === "register") {
      const tunnelUrl = body.tunnel_url;
      if (!tunnelUrl || typeof tunnelUrl !== "string") {
        return Response.json({ success: false, error: "tunnel_url is required" });
      }
      let bridge = await upsertBridge({
        tunnel_url: tunnelUrl,
        status: "connecting",
        last_seen_at: nowIso(),
      });
      const ping = await pingTunnel(tunnelUrl);
      const status = ping.ok ? "connected" : "unreachable";
      bridge = await base44.entities.BridgeSession.update(bridge.id, {
        status,
        last_seen_at: nowIso(),
        ...(ping.details?.unity_version ? { unity_version: ping.details.unity_version } : {}),
        ...(ping.details?.project_name ? { project_name: ping.details.project_name } : {}),
      });
      return Response.json({ success: true, bridge });
    }

    if (action === "status") {
      const bridge = await getBridge();
      if (!bridge || !bridge.tunnel_url) {
        return Response.json({ success: true, status: "not_configured" });
      }
      const ping = await pingTunnel(bridge.tunnel_url);
      const status = ping.ok ? "connected" : "unreachable";
      const updated = await base44.entities.BridgeSession.update(bridge.id, {
        status,
        last_seen_at: nowIso(),
        ...(ping.details?.unity_version ? { unity_version: ping.details.unity_version } : {}),
        ...(ping.details?.project_name ? { project_name: ping.details.project_name } : {}),
      });
      return Response.json({ success: true, bridge: updated });
    }

    if (action === "list_tools") {
      const bridge = await getBridge();
      if (!bridge || !bridge.tunnel_url) {
        return Response.json({ success: false, error: "No bridge configured. Connect Unity first.", tools: [] });
      }
      const res = await listToolsFromTunnel(bridge.tunnel_url);
      return Response.json(res.success ? { success: true, tools: res.tools } : { success: false, error: res.error, tools: [] });
    }

    if (action === "execute") {
      // Two shapes: raw C# ({ code }) or a named tool call ({ tool, args }).
      // For a named tool we forward the name + args to the bridge, which maps it
      // to the C# that implements that tool. We send both "code" (a JSON call
      // envelope) so bridges that key off tool name can dispatch it.
      let code = body.code;
      if ((typeof code !== "string" || !code.trim()) && body.tool) {
        code = JSON.stringify({ tool: String(body.tool), args: body.args || {} });
      }
      if (typeof code !== "string" || !code.trim()) {
        return Response.json({ success: false, error: "code or tool is required" });
      }
      const bridge = await getBridge();
      if (!bridge || !bridge.tunnel_url) {
        return Response.json({ success: false, error: "No bridge configured. Connect Unity first." });
      }
      if (bridge.status !== "connected") {
        const ping = await pingTunnel(bridge.tunnel_url);
        if (!ping.ok) {
          return Response.json({
            success: false,
            error: "Bridge is not connected. Start the tunnel and reconnect.",
          });
        }
      }
      const start = Date.now();
      const result = await executeOnTunnel(bridge.tunnel_url, code);
      const durationMs = Date.now() - start;
      try {
        await base44.entities.BridgeCommandLog.create({
          action: "execute",
          code_preview: code.slice(0, 500),
          success: !!result.success,
          duration_ms: durationMs,
          result_preview: String(result.result || result.stdout || result.error || "").slice(0, 1000),
        });
      } catch (logErr) {
        console.error("log failed", logErr?.message);
      }
      return Response.json({ ...result, duration_ms: durationMs });
    }

    if (action === "disconnect") {
      const bridge = await getBridge();
      if (bridge) {
        await base44.entities.BridgeSession.update(bridge.id, {
          status: "disconnected",
          tunnel_url: "",
          last_seen_at: nowIso(),
        });
      }
      return Response.json({ success: true });
    }

    return Response.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return Response.json({ success: false, error: error?.message || "Internal server error" }, { status: 500 });
  }
});
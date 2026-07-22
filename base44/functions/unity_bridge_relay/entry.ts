import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const normalizeUrl = (url) => String(url || "").trim().replace(/\/+$/, "");
const nowIso = () => new Date().toISOString();

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

// Probe the tunnel with an 8s hard cap — tries /ping then /health.
async function pingTunnel(tunnelUrl) {
  const base = normalizeUrl(tunnelUrl);
  if (!base) return { ok: false, error: "no url" };
  for (const path of ["/ping", "/health"]) {
    const r = await fetchWithTimeout(base + path, { method: "GET" }, 8000);
    if (r.timeout) return { ok: false, timeout: true };
    if (r.ok && r.status >= 200 && r.status < 300) return { ok: true, path };
  }
  return { ok: false };
}

// POST C# to the bridge /execute with a 45s hard cap — never hangs longer.
async function executeOnTunnel(tunnelUrl, code) {
  const base = normalizeUrl(tunnelUrl);
  const r = await fetchWithTimeout(
    base + "/execute",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    },
    45000
  );
  if (r.timeout) {
    return {
      success: false,
      error:
        "Bridge did not respond within 45s — the operation may still be running in Unity. Try again or check that the bridge is running.",
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
      });
      return Response.json({ success: true, bridge: updated });
    }

    if (action === "execute") {
      const code = body.code;
      if (typeof code !== "string" || !code.trim()) {
        return Response.json({ success: false, error: "code is required" });
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
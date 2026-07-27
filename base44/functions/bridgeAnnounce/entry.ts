import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Public endpoint called by the local tunnel launcher script (no user session).
// The script watches cloudflared's output and POSTs the freshly-issued
// trycloudflare URL here along with the user's pair token, so the stored bridge
// URL is never stale after a tunnel restart. The pair token IS the credential —
// it is only ever shown to the account that owns the bridge session.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const tunnelUrl = typeof body?.tunnel_url === "string" ? body.tunnel_url.trim() : "";

    if (!token || !tunnelUrl) {
      return Response.json({ success: false, error: "token and tunnel_url are required" }, { status: 400 });
    }
    if (!/^https:\/\/[a-z0-9.-]+$/i.test(tunnelUrl.replace(/\/+$/, ""))) {
      return Response.json({ success: false, error: "tunnel_url must be an https host" }, { status: 400 });
    }

    const matches = await base44.asServiceRole.entities.BridgeSession.filter({ pair_token: token }, "-created_date", 1);
    const session = matches && matches[0] ? matches[0] : null;
    if (!session) {
      return Response.json({ success: false, error: "Unknown pair token" }, { status: 404 });
    }

    await base44.asServiceRole.entities.BridgeSession.update(session.id, {
      tunnel_url: tunnelUrl.replace(/\/+$/, ""),
      status: "connected",
      last_seen_at: new Date().toISOString(),
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ success: false, error: error?.message || "Internal server error" }, { status: 500 });
  }
});
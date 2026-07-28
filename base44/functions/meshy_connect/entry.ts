import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { meshyFetch } from '../../shared/meshy.ts';

// Validates a Meshy API key with a cheap list call, or reports that an
// app-level MESHY_API_KEY secret is configured (demo mode).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const apiKey = typeof body?.api_key === "string" ? body.api_key.trim() : "";

    if (!apiKey) {
      const appKey = Deno.env.get("MESHY_API_KEY");
      if (appKey) {
        return Response.json({ connected: true, is_app_key: true, message: "Using app-level Meshy key" });
      }
      return Response.json({ connected: false, needs_key: true });
    }

    const res = await meshyFetch(apiKey, "/image-to-3d?page_num=1&page_size=1");
    if (res.status === 200) {
      return Response.json({ connected: true, message: "Meshy API connected successfully" });
    }
    if (res.status === 401) {
      return Response.json({ connected: false, error: "Invalid API key" });
    }
    if (res.status === 402) {
      return Response.json({ connected: false, error: "Valid key but insufficient credits" });
    }
    return Response.json({
      connected: false,
      error: res.data?.message || ("Meshy returned status " + res.status),
    });
  } catch (error) {
    return Response.json({ connected: false, error: error.message }, { status: 500 });
  }
});
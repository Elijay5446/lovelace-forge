import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getMeshyKey, meshyFetch } from '../../shared/meshy.ts';

// With an api_key in the body: validates it against Meshy.
// Without one: reports which key the fallback chain resolves to
// (user key overrides the app-level SessionConfig key).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const apiKey = typeof body?.api_key === "string" ? body.api_key.trim() : "";

    if (!apiKey) {
      const { key, isAppKey } = await getMeshyKey(base44);
      if (!key) {
        return Response.json({ connected: false, error: "Please connect your Meshy API key" });
      }
      return Response.json({
        connected: true,
        is_app_key: isAppKey,
        message: isAppKey ? "Using app-level Meshy API key" : "Using your Meshy API key",
      });
    }

    const res = await meshyFetch(apiKey, "/image-to-3d?page_num=1&page_size=1");
    if (res.status === 200) {
      return Response.json({ connected: true, is_app_key: false, message: "Meshy API connected successfully" });
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
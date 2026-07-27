import { base44 } from "@/api/base44Client";

// Writes to the Unity editor are queued onto its main thread and can take far
// longer than a single backend call is allowed to wait — but READS come back
// instantly. So when a build batch "times out", it usually still lands. This
// polls the live scene hierarchy until the expected object shows up.
export async function waitForObject(name, timeoutMs = 180000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    await new Promise((r) => setTimeout(r, 4000));
    try {
      const res = await base44.functions.invoke("unity_bridge_relay", {
        action: "execute",
        code: "scene.hierarchy",
      });
      const data = res?.data || res;
      if (String(data?.result || "").includes(name)) return true;
    } catch {
      // Transient — keep polling.
    }
  }
  return false;
}
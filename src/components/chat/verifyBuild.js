import { base44 } from "@/api/base44Client";

// Writes to the Unity editor are queued onto its main thread and can take far
// longer than a single backend call is allowed to wait — but READS come back
// instantly. So when a build batch "times out", it usually still lands. This
// polls the live scene hierarchy until the expected object shows up.
function exec(code) {
  return base44.functions
    .invoke("unity_bridge_relay", { action: "execute", code })
    .then((res) => String((res?.data || res)?.result || ""))
    .catch(() => "");
}

// A freshly written C# file can only be attached AFTER Unity finishes compiling
// it (which also reloads the domain and drops anything still queued). So we keep
// asking the editor to attach until the type resolves.
export async function attachScript(target, script, timeoutMs = 240000) {
  const code = JSON.stringify({
    tool: "script.attach",
    args: JSON.stringify({ target, script }),
  });
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const result = await exec(code);
    if (/Attached|already has/i.test(result)) return true;
    await new Promise((r) => setTimeout(r, 2500));
  }
  return false;
}

export async function waitForObject(name, timeoutMs = 180000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    await new Promise((r) => setTimeout(r, 2000));
    if ((await exec("scene.hierarchy")).includes(name)) return true;
  }
  return false;
}
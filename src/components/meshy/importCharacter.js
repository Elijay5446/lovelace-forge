import { base44 } from "@/api/base44Client";

// Drives the bridge's character.import / character.status pair.
// Long main-thread work in Unity can outlast the relay's 43s cap, so a relay
// timeout is never treated as a failure — we simply poll again. Only an
// explicit RUNTIME ERROR from Unity, or running out of time, stops us.
const POLL_MS = 3000;
const TOTAL_TIMEOUT_MS = 12 * 60 * 1000;

async function exec(tool, args) {
  let data;
  try {
    const res = await base44.functions.invoke("unity_bridge_relay", {
      action: "execute",
      code: JSON.stringify({ tool, args: JSON.stringify(args || {}) }),
    });
    data = res?.data || res;
  } catch (e) {
    data = e?.response?.data || { error: e?.message || "" };
  }
  return String(data?.result || data?.error || "");
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function importCharacter({ jobId, name, fbx, walk, run }, onPhase = () => {}) {
  if (!fbx) throw new Error("This character has no rigged FBX yet — rigging didn't finish.");

  // Meshy's texture PNGs are signed and expire, so always fetch them fresh
  // instead of reusing whatever was stored when the job finished.
  onPhase("Fetching texture maps from Meshy…");
  let tex = "";
  let nrm = "";
  try {
    const res = await base44.functions.invoke("meshy_texture_urls", { job_id: jobId });
    const d = res?.data || res;
    tex = d?.base_color || "";
    nrm = d?.normal || "";
  } catch {
    // Non-fatal: the model still imports, just untextured.
  }

  onPhase("Asking Unity to download the model and textures…");
  const start = await exec("character.import", { name, fbx, walk, run, tex, nrm });

  if (/Unknown (tool|command)/i.test(start)) {
    throw new Error(
      "Your Forge Bridge is too old to import characters. Open the Connect page, download the bridge again (v1.13+), replace the LovelaceForgeBridge folder in your project, and retry."
    );
  }
  if (/RUNTIME ERROR/i.test(start)) throw new Error(start.replace(/^RUNTIME ERROR:\s*/i, ""));
  if (!/STARTED|already running/i.test(start) && start) onPhase(start);

  const began = Date.now();
  while (Date.now() - began < TOTAL_TIMEOUT_MS) {
    await sleep(POLL_MS);
    // Always ask about THIS character, so a leftover result from an earlier job
    // can never be mistaken for this one finishing.
    const status = await exec("character.status", { name });
    if (/RUNTIME ERROR/i.test(status)) throw new Error(status.replace(/^RUNTIME ERROR:\s*/i, ""));
    if (/^DONE/i.test(status)) return true;
    if (/^IDLE/i.test(status)) {
      throw new Error(
        `Unity lost track of this import — it usually means the editor recompiled scripts mid-import. Press "Send to Unity" again; it will pick up where it left off.`
      );
    }
    if (/DOWNLOADING|IMPORTING/i.test(status)) onPhase(status);
    // Anything else (a relay timeout while Unity is busy) — just keep polling.
  }
  throw new Error(
    "Unity is still working after 12 minutes. Check the Unity Console for [Lovelace Forge] messages — the import may still finish."
  );
}
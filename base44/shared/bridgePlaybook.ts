// Unity + Blender Bridge Playbook v2 — production knowledge (Sep 2026) that
// Lovelace uses to coach users on setup, ports, failure signatures and safe
// operating rules. Shared by chat_completion and synthesize_consult so both
// voices give the same answers. Contains NO secrets: bearer tokens are per user
// and never leave the relay.
export const BRIDGE_PLAYBOOK = `

=== UNITY + BLENDER BRIDGE PLAYBOOK v2 (learned in production, Sep 2026) ===
Use this whenever a user asks about connecting Unity or Blender, ports, tunnels, "filename too long", black renders, or a hung bridge. Quote the failure signatures verbatim.

ARCHITECTURE — three local services, keep the ports separate:
- Unity MCP server: 127.0.0.1:8080 (started by the Unity MCP package inside the editor).
- The bridge (Flask relay): 0.0.0.0:9876 — THIS is the service the cloudflare tunnel exposes. Routes: GET /health, POST /mcp {"tool","params"} -> Unity MCP, POST /blender {"code": "..."} -> runs bpy Python in Blender and RETURNS CAPTURED STDOUT. (The classic Forge Bridge C# package also listens on 9876 and exposes POST /execute; the relay speaks both.)
- Blender MCP addon: 127.0.0.1:9877. TRAP: the addon DEFAULTS to 9876 and collides with the bridge (symptom: the tunnel hostname still resolves but /health times out because nothing is listening locally). Move Blender, not the bridge — in Blender's Python console run: bpy.ops.blendermcp.stop_server(); bpy.context.scene.blendermcp_port = 9877; bpy.ops.blendermcp.start_server(). "WinError 10038" on stop is a benign shutdown artifact.
- Blender round trip is ~0.2s versus a ~28-56s Unity compile cycle: prefer Blender for geometry measurement, mesh/UV work, renders, and even filesystem queries on the user's disk (Blender has full os access).
- Detect a real Unity project by BOTH Assets/ and ProjectSettings/ existing. The bridge /health "unity_project" field is an environment default and can be a decoy — never treat it as proof of which project is open. Prove liveness with one read-only MCP call against a real asset path.

TUNNEL / URL LIFECYCLE:
- trycloudflare URLs are temporary and change on every restart. The launcher script must POST the fresh URL to the app's registration endpoint on start (unity_bridge_relay register / bridgeAnnounce). Read the registered URL first; never ask the user to paste one unless registration is empty.
- Validate https only; allowed host suffixes: .trycloudflare.com, .cfargotunnel.com, .ngrok-free.app, .ngrok.io, .ts.net.
- After a restart the bridge boots slowly: a null {"success":false} ping ≈ still booting; retry once after ~8s.

FAIL-FAST OPERATING RULES (non-negotiable — a hung chat is worse than a partial answer):
- Total wait per bridge call ≤ 45s (poll 9 × 5s). On timeout stop and report "the op may have finished in the editor; verify next turn".
- ONE slow op per turn: entering/exiting play mode, AssetDatabase.Refresh/ImportAsset, scene open, prefab save, anything that recompiles. Fire-and-check: trigger, return, verify on the next turn.
- Max 2 retries per call. Two consecutive dead calls = tunnel down → stop and ask the user to relaunch. Never retry-storm.

FAILURE SIGNATURES (teach these verbatim):
- Message contains "mono.exe: The filename or extension is too long" → the MCP execute_code path compiles via CodeDom and passes every referenced assembly on ONE command line; large projects exceed Windows' 32KB limit. It fails identically for a 12-character script, so NEVER tell the user to shrink their code. Use the manage_script workaround below.
- null data with NO message → Unity main thread busy (shader compile, import, domain reload, play mode). Wait; do not restart anything.
- data.reason = "no_unity_session" → Flask and tunnel are healthy, no editor attached. Open the Unity project / start the MCP server.
- HTTP 530 or Cloudflare 1033 → tunnel not registered. DNS "name not known" → the trycloudflare hostname expired. Both need a launcher restart and a new URL.
- /health OK but blender_connected=false and /blender returns 502 → Blender is down or its addon server stopped; do Unity work anyway.

BROKEN-COMPILER WORKAROUND (works when execute_code is dead; the other MCP tools never shell out to mono):
1. manage_script action=create {name, path:"Assets/<App>/Scripts", contents} writes a .cs editor script (no update action exists — delete then create).
2. Let Unity compile (~18-56s). Check read_console action=get types=["error"] for "error CS" before firing.
3. execute_menu_item {menu_path:"<Menu>/<Item>"} with NO action arg fires a [MenuItem] in that script.
4. read_console action=get count=N collects output. The console truncates each entry to ONE line, so emit one Debug.Log per row with a grep-able prefix like "XX| ...". Clear the console before firing.
Editor scripts have full power: File.Copy from the user's Downloads, System.Net.WebClient downloads from a public URL (the way to ship files into a project when Blender is down), PrefabUtility.LoadPrefabContents edits, TextureImporter/ModelImporter settings, RenderTexture captures for thumbnails.

UNITY PREFAB TRAP: inside LoadPrefabContents use UnityEngine.Object.Instantiate(src), never PrefabUtility.InstantiatePrefab — linked instances silently vanish on SaveAsPrefabAsset. Guard before saving: childCount>0 and the expected renderer exists.

BLENDER 5.1 TRAPS (renders come back black):
- scene.node_tree was removed → use scene.compositing_node_group; it is a node GROUP (NodeGroupInput/Output). CompositorNodeComposite and CompositorNodeRLayers are undefined types.
- Glare settings are INPUT SOCKETS not properties: node.inputs["Type"].default_value with title-case enums ('Bloom', 'Streaks').
- A badly wired compositor renders 100% black and scene.use_nodes=False does NOT bypass it — set scene.compositing_node_group = None.
- Always measure a render numerically (load the PNG, mean of img.pixels) before showing it; never trust file size or eyeballing.

SAFETY / HYGIENE RULES:
- Backup before any destructive edit: <asset>.bak_<operation>_<date>; the name records the state BEFORE that operation. Confirm the fix with the user, then delete the backup — no backup graveyards.
- Verify every edit by re-reading from DISK, not in-memory objects.
- Never paste tokens or secrets into chat; bearer tokens are per user and stay in the relay.
- Persist state (registered URL, engine flags, last-seen) in the database, never in files that a sandbox restore could revert.
`;
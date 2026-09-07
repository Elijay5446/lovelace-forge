// Shared copy for the Connect page's Bridge Playbook section. Mirrors the
// README shipped in the bridge zip and the knowledge block Lovelace uses in chat.
// No secrets live here — every user keeps their own bearer token in the relay.

export const PORTS = [
  {
    service: "Unity MCP server",
    addr: "127.0.0.1:8080",
    role: "Started by the Unity MCP package inside the editor. Local only.",
  },
  {
    service: "Bridge (Flask relay)",
    addr: "0.0.0.0:9876",
    role: "The ONLY service the Cloudflare tunnel exposes. GET /health · POST /mcp · POST /blender · POST /execute (classic Forge Bridge).",
  },
  {
    service: "Blender MCP addon",
    addr: "127.0.0.1:9877",
    role: "Defaults to 9876 and collides with the bridge — move Blender to 9877, never the bridge.",
  },
];

export const FAILURE_SIGNATURES = [
  {
    sign: "“mono.exe: The filename or extension is too long”",
    meaning:
      "execute_code compiles via CodeDom and passes every referenced assembly on ONE command line; large projects exceed Windows' 32KB limit. Fails identically for a 12-character script.",
    fix: "Do NOT shrink your code. Use the manage_script → execute_menu_item → read_console workaround.",
  },
  {
    sign: "null data, NO message",
    meaning: "Unity main thread is busy (shader compile, import, domain reload, play mode).",
    fix: "Wait. Do not restart anything.",
  },
  {
    sign: "data.reason = “no_unity_session”",
    meaning: "Flask and the tunnel are healthy; no editor is attached.",
    fix: "Open the Unity project / start the MCP server.",
  },
  {
    sign: "HTTP 530 or Cloudflare error 1033",
    meaning: "Tunnel not registered.",
    fix: "Restart the launcher and register the new URL.",
  },
  {
    sign: "DNS “name not known”",
    meaning: "The trycloudflare hostname expired.",
    fix: "Restart the launcher and register the new URL.",
  },
  {
    sign: "/health OK, blender_connected=false, /blender → 502",
    meaning: "Blender is down or its addon server stopped.",
    fix: "Carry on with Unity work; restart Blender's addon when convenient.",
  },
  {
    sign: "/health times out but the hostname resolves",
    meaning: "Nothing is listening on 9876 locally — usually the Blender addon grabbed the port.",
    fix: "Move Blender to 9877 (see Blender section) and restart the bridge.",
  },
];

export const BLENDER_PORT_FIX =
  "bpy.ops.blendermcp.stop_server()\nbpy.context.scene.blendermcp_port = 9877\nbpy.ops.blendermcp.start_server()";
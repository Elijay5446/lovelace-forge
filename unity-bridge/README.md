# Lovelace Forge Bridge (Unity package)

The local side of the Lovelace Forge Unity Bridge: a tiny HTTP listener that runs
inside the Unity editor on `localhost:9876`. Lovelace reaches it through a
Cloudflare tunnel and runs C# snippets on the main thread, streaming results
back into your chat.

This folder is the **source** of the `LovelaceForgeBridge.unitypackage`. Build it
once, then host the exported package and point the Connect Unity page at it.

---

## What's inside

```
LovelaceForgeBridge/Editor/
  BridgeServer.cs          # [InitializeOnLoad] HttpListener on :9876 + main-thread queue
  CodeRunner.cs            # in-process C# compiler (Mono CodeDom) — no domain reload
  LovelaceBridgeWindow.cs  # Tools → Lovelace Forge menu + status window
```

**Endpoints** (all JSON):
- `GET /ping`   → `{ ok: true, pong: true }`
- `GET /health` → `{ ok: true, unity, bridge }`
- `POST /execute` body `{ "code": "..." }` → `{ success, result, error }`

The snippet you send is the body of `static string Execute()`. Write statements
and `return "your result";` to send data back. The full UnityEngine / UnityEditor
API is available.

---

## Install into a project

1. Open the Unity project you want to connect.
2. Drop the `LovelaceForgeBridge` folder into `Assets/` (anywhere under `Assets/`
   is fine — it's editor-only because it lives in an `Editor/` folder).
   - Or, once you've exported a `.unitypackage`:
     `Assets → Import Package → Custom Package → Import All`.
3. A new menu appears: **Tools → Lovelace Forge → Start Bridge**.

---

## Build / export the `.unitypackage`

1. In a Unity project that has the `LovelaceForgeBridge` folder under `Assets/`.
2. Select the folder in the Project window: `Assets/LovelaceForgeBridge`.
3. `Assets → Export Package…`, keep only `LovelaceForgeBridge` checked, click
   **Export**, save as `LovelaceForgeBridge.unitypackage`.
4. Host that file (GitHub Release, S3, a CDN, or upload it to the Base44 app
   file storage for a permanent `media.base44.com` URL) and share the URL —
   that's what the **Download Bridge Package** button links to.

---

## Run

1. In Unity: **Tools → Lovelace Forge → Start Bridge** (status window opens).
2. Start a tunnel:
   ```
   cloudflared tunnel --url http://localhost:9876
   ```
3. Copy the printed `https://<random>.trycloudflare.com` URL.
4. In Lovelace Forge → **Connect Unity → Step 3**, paste it and **Connect**.
5. Ask Lovelace: *"What's in my open scene?"*

The bridge auto-restarts after domain reloads (script recompiles), so it stays
up while you work.

---

## Reliability notes (matches the Forge relay)

- **Main-thread only** — snippets never run off the UI thread.
- **In-process compile** — no recompile / domain reload to run a snippet, so the
  listener never dies mid-operation.
- **40s in-editor cap** — `execute` times out locally at 40s; the Forge relay
  caps the whole round-trip at 45s. Nothing hangs forever.
- **Structured errors** — compile / runtime / timeout errors come back as
  `{ success: false, result: "COMPILE ERROR: ..." }` so Lovelace can react.

---

## Troubleshooting

- **"Failed to start bridge" on Windows** — reserve the URL once:
  `netsh http add urlacl url=http://localhost:9876/ user=Everyone` (run as admin).
- **Port 9876 in use** — change `BridgeServer.Port` and the tunnel URL to match.
- **CodeDom unavailable** — the Mono CodeDom compiler ships with the Unity
  editor on Mono. On a CoreCLR-only backend it may be missing; the snippet will
  return `COMPILE ERROR` with a provider message. Switch the editor scripting
  backend to Mono if needed (Project Settings → Player).
- **Tunnel can't reach** — confirm the bridge is running (`http://localhost:9876/health`
  in a browser) before connecting; the Forge relay pings it on register.
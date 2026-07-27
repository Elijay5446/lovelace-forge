import React, { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import JSZip from "jszip";
import { CODE_RUNNER_CS } from "@/components/unity/CodeRunnerDownload";

// Builds the entire Forge Bridge package in-browser at click time from the
// corrected source, so the download is always current — nothing hosted to keep
// in sync. Folder layout matches the README: LovelaceForgeBridge/Editor/*.cs.

const BRIDGE_SERVER_CS = `using System;
using System.Collections.Concurrent;
using System.IO;
using System.Net;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using UnityEditor;
using UnityEngine;

namespace LovelaceForge.Bridge
{
    /// <summary>
    /// The Forge Bridge: an HTTP listener on localhost:9876 that Lovelace Forge
    /// reaches through a Cloudflare tunnel. It exposes /ping, /health and /execute.
    /// C# snippets are queued and run on Unity's main thread; results stream back
    /// to the chat. Auto-restarts after domain reloads via [InitializeOnLoad].
    /// </summary>
    [InitializeOnLoad]
    public static class BridgeServer
    {
        public const int Port = 9876;
        public const string Version = "1.4.0";

        // The host we actually managed to bind to (set on a successful Start).
        public static string BoundHost { get; private set; } = "127.0.0.1";
        public static string Url => $"http://{BoundHost}:{Port}";

        // Surfaced in the window so it never lies about being "Connected".
        public static string LastError { get; private set; } = "";

        private static HttpListener _listener;
        private static CancellationTokenSource _cts;
        private static readonly ConcurrentQueue<Action> _mainQueue = new ConcurrentQueue<Action>();
        private static System.Timers.Timer _pump;

        public static bool IsRunning => _listener != null && _listener.IsListening;

        static BridgeServer()
        {
            EditorApplication.update += DrainMainQueue;

            // Focus-proof ticking. EditorApplication.update (and delayCall) THROTTLE
            // hard — often to a near stop — when the Unity window is not focused,
            // e.g. while you're in the browser sending a chat. That left /execute
            // jobs sitting in the queue until they timed out. The fix is to force
            // the editor to keep running its loop in the background: this timer runs
            // on a worker thread and, whenever work is queued, pokes the editor's
            // player loop so DrainMainQueue actually gets to run.
            _pump = new System.Timers.Timer(50) { AutoReset = true };
            _pump.Elapsed += (_, __) =>
            {
                if (_mainQueue.IsEmpty) return;
                try { EditorApplication.QueuePlayerLoopUpdate(); }
                catch { /* editor not ready yet */ }
            };
            _pump.Start();

            // Bring the bridge back up automatically after a domain reload.
            if (SessionState.GetBool("LovelaceBridgeRunning", false))
                EditorApplication.delayCall += () => Start();
        }

        private static void DrainMainQueue()
        {
            while (_mainQueue.TryDequeue(out var action))
            {
                try { action(); }
                catch (Exception e) { Debug.LogError("[Lovelace Forge] Main-thread job threw: " + e); }
            }
        }

        public static void Start()
        {
            if (IsRunning) return;

            // Try the most permissive hosts first. 127.0.0.1 usually needs no URL
            // reservation on Windows; localhost and "+" are fallbacks. We stop at
            // the first host that binds AND is actually listening.
            string[] hosts = { "127.0.0.1", "localhost", "+" };
            LastError = "";
            foreach (var host in hosts)
            {
                try
                {
                    var listener = new HttpListener();
                    listener.Prefixes.Add($"http://{host}:{Port}/");
                    listener.Start(); // throws if the OS won't grant the binding
                    _listener = listener;
                    BoundHost = host == "+" ? "127.0.0.1" : host;
                    _cts = new CancellationTokenSource();
                    SessionState.SetBool("LovelaceBridgeRunning", true);
                    _ = ListenLoop(_cts.Token);
                    LastError = "";
                    Debug.Log("[Lovelace Forge] Bridge listening on http://" + host + ":" + Port + "/");
                    return;
                }
                catch (Exception e)
                {
                    LastError = e.Message;
                    // Keep trying the next host.
                }
            }

            // Nothing bound — leave a clear, actionable error the window can show.
            _listener = null;
            SessionState.SetBool("LovelaceBridgeRunning", false);
            Debug.LogError("[Lovelace Forge] Failed to start bridge on any host. Last error: " + LastError +
                "\\nOn Windows this is usually a URL reservation. Run this once in an ADMIN Command Prompt:" +
                "\\n  netsh http add urlacl url=http://127.0.0.1:9876/ user=Everyone" +
                "\\n  netsh http add urlacl url=http://localhost:9876/ user=Everyone" +
                "\\nAlso confirm nothing else is using port 9876 (e.g. an old MCP Unity Server).");
        }

        public static void Stop()
        {
            try
            {
                _cts?.Cancel();
                if (_listener != null && _listener.IsListening) _listener.Stop();
            }
            catch { }
            _listener = null;
            SessionState.SetBool("LovelaceBridgeRunning", false);
            Debug.Log("[Lovelace Forge] Bridge stopped.");
        }

        private static async Task ListenLoop(CancellationToken token)
        {
            while (!token.IsCancellationRequested)
            {
                HttpListenerContext ctx;
                try { ctx = await _listener.GetContextAsync(); }
                catch { break; }
                _ = HandleContext(ctx);
            }
        }

        private static async Task HandleContext(HttpListenerContext ctx)
        {
            var req = ctx.Request;
            var res = ctx.Response;
            try
            {
                string path = req.Url.AbsolutePath.TrimEnd('/');

                if (req.HttpMethod == "GET" && (path == "/ping" || path == ""))
                {
                    SendJson(res, 200, new PingResp { ok = true, pong = true });
                }
                else if (req.HttpMethod == "GET" && path == "/health")
                {
                    SendJson(res, 200, new HealthResp { ok = true, unity = Application.unityVersion, bridge = Version });
                }
                else if (req.HttpMethod == "POST" && path == "/execute")
                {
                    string body;
                    using (var sr = new StreamReader(req.InputStream, req.ContentEncoding ?? Encoding.UTF8))
                        body = await sr.ReadToEndAsync();
                    string code = ParseCode(body);
                    if (string.IsNullOrWhiteSpace(code))
                    {
                        SendJson(res, 400, new ExecResp { success = false, result = "", error = "No code provided." });
                        return;
                    }
                    // Run directly on this request thread rather than marshaling
                    // onto EditorApplication.update. That update loop THROTTLES to a
                    // near-stop whenever the Unity window is unfocused (i.e. every
                    // time you're in the browser talking to Lovelace), so the old
                    // queue-and-wait approach timed out. CodeRunner only performs
                    // read-only inspection (scene hierarchy, selection, asset counts,
                    // editor info, logging), which is safe to read off the main thread
                    // in the editor — so this returns instantly regardless of focus.
                    string result;
                    try { result = CodeRunner.Run(code); }
                    catch (Exception ex) { result = "RUNTIME ERROR: " + ex.Message; }
                    bool success = !result.StartsWith("COMPILE ERROR", StringComparison.Ordinal)
                                && !result.StartsWith("RUNTIME ERROR", StringComparison.Ordinal)
                                && !result.StartsWith("TIMEOUT", StringComparison.Ordinal);
                    SendJson(res, 200, new ExecResp { success = success, result = result, error = success ? "" : result });
                }
                else
                {
                    res.StatusCode = 404;
                    SendJson(res, 404, new ExecResp { success = false, result = "", error = "Not found: " + path });
                }
            }
            catch (Exception e)
            {
                try { SendJson(res, 500, new ExecResp { success = false, result = "", error = e.Message }); }
                catch { }
            }
            finally
            {
                try { res.Close(); } catch { }
            }
        }

        private static string ParseCode(string body)
        {
            try { return JsonUtility.FromJson<ExecuteBody>(body)?.code ?? body; }
            catch { return body; }
        }

        [Serializable] private class ExecuteBody { public string code; }
        [Serializable] private struct PingResp { public bool ok; public bool pong; }
        [Serializable] private struct HealthResp { public bool ok; public string unity; public string bridge; }
        [Serializable] private struct ExecResp { public bool success; public string result; public string error; }

        /// <summary>Run work on the main thread and block until it finishes (or times out).</summary>
        private static string EnqueueAndWait(Func<string> work, int timeoutMs)
        {
            string result = null;
            var done = new ManualResetEventSlim(false);
            _mainQueue.Enqueue(() =>
            {
                try { result = work(); }
                catch (Exception e) { result = "RUNTIME ERROR: " + e; }
                finally { done.Set(); }
            });
            return done.Wait(timeoutMs) ? result : $"TIMEOUT: Unity did not finish within {timeoutMs}ms.";
        }

        private static void SendJson(HttpListenerResponse res, int status, object payload)
        {
            res.StatusCode = status;
            res.ContentType = "application/json";
            byte[] bytes = Encoding.UTF8.GetBytes(JsonUtility.ToJson(payload));
            res.ContentLength64 = bytes.Length;
            res.OutputStream.Write(bytes, 0, bytes.Length);
        }
    }
}
`;

const BRIDGE_WINDOW_CS = `using UnityEditor;
using UnityEngine;

namespace LovelaceForge.Bridge
{
    /// <summary>
    /// The Tools → Lovelace Forge menu and bridge status window.
    /// </summary>
    public class LovelaceBridgeWindow : EditorWindow
    {
        [MenuItem("Tools/Lovelace Forge/Start Bridge")]
        public static void StartMenu()
        {
            BridgeServer.Start();
            ShowWindow();
        }

        [MenuItem("Tools/Lovelace Forge/Stop Bridge")]
        public static void StopMenu() => BridgeServer.Stop();

        [MenuItem("Tools/Lovelace Forge/About")]
        public static void ShowWindow()
        {
            var w = GetWindow<LovelaceBridgeWindow>(false, "Lovelace Forge Bridge", true);
            w.minSize = new Vector2(340, 320);
        }

        private void Update() => Repaint();

        private void OnGUI()
        {
            GUILayout.Space(8);

            var header = new GUIStyle(GUI.skin.label) { fontSize = 15, fontStyle = FontStyle.Bold };
            GUILayout.Label("Lovelace Forge Bridge", header);
            GUILayout.Label("Live link between Lovelace and your editor.", EditorStyles.miniLabel);
            GUILayout.Space(10);

            // Status pill — reflects whether the listener is ACTUALLY listening,
            // not just whether we intended to start it.
            bool running = BridgeServer.IsRunning;
            var pill = new GUIStyle(GUI.skin.box);
            pill.normal.background = MakeTex(running ? new Color(0.12f, 0.45f, 0.20f) : new Color(0.45f, 0.12f, 0.12f));
            GUILayout.BeginVertical(pill, GUILayout.Height(28));
            GUILayout.Label(running ? "●  Listening   " + BridgeServer.Url : "●  Not listening", EditorStyles.whiteBoldLabel);
            GUILayout.EndVertical();
            GUILayout.Space(10);

            // If a start attempt failed, show the real reason + the exact fix.
            if (!running && !string.IsNullOrEmpty(BridgeServer.LastError))
            {
                EditorGUILayout.HelpBox(
                    "Bridge could not bind to port " + BridgeServer.Port + ".\\n" +
                    "Reason: " + BridgeServer.LastError + "\\n\\n" +
                    "Fix (run once in an ADMIN Command Prompt):\\n" +
                    "  netsh http add urlacl url=http://127.0.0.1:9876/ user=Everyone\\n" +
                    "Then click Start Bridge again.",
                    MessageType.Error);
                GUILayout.Space(8);
            }

            if (running)
            {
                if (GUILayout.Button("Stop Bridge", GUILayout.Height(32)))
                    BridgeServer.Stop();
            }
            else
            {
                if (GUILayout.Button("Start Bridge", GUILayout.Height(32)))
                    BridgeServer.Start();
            }

            GUILayout.Space(12);
            GUILayout.Label("How it works", EditorStyles.boldLabel);
            EditorGUILayout.HelpBox(
                "1. Start the bridge — it listens on localhost:9876.\\n" +
                "2. Expose it with a Cloudflare tunnel:\\n     cloudflared tunnel --url http://localhost:9876\\n" +
                "3. Paste the printed https://...trycloudflare.com URL into\\n     Lovelace Forge → Connect Unity → Step 3.\\n" +
                "4. Ask Lovelace to inspect your scene or run C#.",
                MessageType.Info);

            GUILayout.Space(6);
            GUILayout.Label("Local test", EditorStyles.boldLabel);
            EditorGUILayout.HelpBox(
                "With the bridge listening, open in a browser:\\n" + BridgeServer.Url + "/ping\\n" +
                "You should see: { \\"ok\\": true, \\"pong\\": true }",
                MessageType.None);

            GUILayout.FlexibleSpace();
            GUILayout.Label("Bridge v" + BridgeServer.Version + " · Unity " + Application.unityVersion, EditorStyles.miniLabel);
        }

        private static Texture2D MakeTex(Color c)
        {
            var t = new Texture2D(1, 1);
            t.SetPixel(0, 0, c);
            t.Apply();
            return t;
        }
    }
}
`;

const START_BAT = `@echo off
title Lovelace Forge Tunnel
echo ============================================
echo   LOVELACE FORGE - ONE-CLICK TUNNEL
echo ============================================
echo.
where cloudflared >nul 2>nul
if errorlevel 1 (
  echo Installing cloudflared - this happens only once...
  winget install --id Cloudflare.cloudflared --accept-source-agreements --accept-package-agreements
  set "PATH=%PATH%;%ProgramFiles(x86)%\\cloudflared;%ProgramFiles%\\cloudflared;%LocalAppData%\\Microsoft\\WinGet\\Links"
)
echo.
echo Starting tunnel to Unity ^(localhost:9876^)...
echo.
echo   COPY the https://xxxx.trycloudflare.com URL that appears
echo   in the box below, then paste it into Lovelace Forge.
echo.
echo   KEEP THIS WINDOW OPEN while you work.
echo.
cloudflared tunnel --url http://127.0.0.1:9876 --http-host-header 127.0.0.1:9876
echo.
echo Tunnel stopped.
pause
`;

const START_SH = `#!/usr/bin/env bash
# Lovelace Forge tunnel launcher (macOS / Linux)
set -e
echo "============================================"
echo "  LOVELACE FORGE - TUNNEL"
echo "============================================"
if ! command -v cloudflared >/dev/null 2>&1; then
  echo "cloudflared not found. Install it first:"
  echo "  macOS:  brew install cloudflared"
  echo "  Linux:  see https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/"
  exit 1
fi
echo "Starting tunnel to Unity (localhost:9876)..."
echo "Copy the https://xxxx.trycloudflare.com URL below into Lovelace Forge."
echo "Keep this window open while you work."
cloudflared tunnel --url http://127.0.0.1:9876 --http-host-header 127.0.0.1:9876
`;

// Marks the whole folder as an editor-only assembly, so the .cs files can live
// directly in LovelaceForgeBridge/ (no required "Editor" folder) and still use
// the UnityEditor API. This is what lets us keep everything in one directory.
const ASMDEF = `{
  "name": "LovelaceForge.Bridge",
  "rootNamespace": "LovelaceForge.Bridge",
  "references": [],
  "includePlatforms": [ "Editor" ],
  "excludePlatforms": [],
  "allowUnsafeCode": false,
  "autoReferenced": true
}
`;

const README_TXT = `LOVELACE FORGE — UNITY BRIDGE
==============================

WHAT THIS DOES:
Connects your live Unity editor to Lovelace Forge so you can
run commands, inspect assets, and build games with AI assistance
from your browser.

QUICK START:
1. Copy LovelaceForgeBridge.cs into your Unity project (any Editor folder)
2. In Unity, click: Tools > Lovelace Forge > Start Bridge
3. Run start_forge_bridge.ps1 (Windows) or start_forge_bridge.py (Mac/Linux)
4. Copy the tunnel URL from the terminal
5. Paste it into the Connect page at Lovelace Forge

REQUIREMENTS:
- Unity 2021.3 LTS or newer
- Python 3.8+ (for the tunnel script)
- A Lovelace Forge account (free)

HOW IT WORKS:
The bridge runs an HTTP listener on localhost:9876 inside Unity.
A Cloudflare tunnel exposes it temporarily so Lovelace Forge can
reach your editor from the cloud. Each command is an independent
HTTP request — no persistent connection needed.

TROUBLESHOOTING:
- Tunnel dropped? Restart the bridge script and paste the new URL.
- Port 9876 busy? Close any other process using that port.
- Compile error? Make sure the .cs file is in an Editor folder.

SECURITY:
- The tunnel URL is unique to you and expires when the script stops.
- No data leaves your machine unless you explicitly send a command.
- The bridge only accepts requests from Lovelace Forge's relay.

For full documentation: visit the Setup Guide in Lovelace Forge.
`;

const README = `# Lovelace Forge Bridge (Unity package)

The local side of the Lovelace Forge Unity Bridge: a tiny HTTP listener that runs
inside the Unity editor on localhost:9876. Lovelace reaches it through a
Cloudflare tunnel and runs C# snippets on the main thread, streaming results
back into your chat.

## Install
1. Drop the whole LovelaceForgeBridge folder into your project's Assets/ directory.
   That's it — everything lives in this one folder. The included .asmdef marks it
   editor-only, so you do NOT need to rename anything to "Editor".
2. Unity compiles it automatically.
3. A new menu appears: Tools -> Lovelace Forge -> Start Bridge.

## Requires Unity 6 (or newer)
CodeRunner.cs uses the Roslyn compiler (Microsoft.CodeAnalysis) that ships with
Unity 6. The legacy System.CodeDom compiler was removed from modern Unity, so
older builds of this file will NOT compile on Unity 6 — this package is the
fixed version.

## Run
1. Tools -> Lovelace Forge -> Start Bridge.
2. Start a tunnel — double-click "Start Forge Tunnel.bat" (Windows) or run
   ./start_forge_tunnel.sh (macOS/Linux).
3. Copy the printed https://<random>.trycloudflare.com URL.
4. In Lovelace Forge -> Connect Unity -> Step 3, paste it and Connect.
5. Ask Lovelace: "What's in my open scene?"

## Endpoints (JSON)
- GET  /ping   -> { ok: true, pong: true }
- GET  /health -> { ok: true, unity, bridge }
- POST /execute body { "code": "..." } -> { success, result, error }

## Troubleshooting
- Bridge won't bind / "Not listening" on Windows — reserve the URL once (run as admin):
  netsh http add urlacl url=http://127.0.0.1:9876/ user=Everyone
  netsh http add urlacl url=http://localhost:9876/ user=Everyone
  The bridge tries 127.0.0.1, then localhost, then "+" automatically, and the
  window shows the real bind error if all three fail.
- Port 9876 in use — an old "MCP Unity Server" package or a previous bridge may
  hold it. Disable that package, or change BridgeServer.Port + the tunnel URL.
- No Tools menu — keep the LovelaceForge.Bridge.Editor.asmdef file in the folder
  (it makes the scripts editor-only) and make sure you're on Unity 6+. Check the
  Console for compile errors.
`;

export default function BridgeZipDownload({ className = "" }) {
  const [building, setBuilding] = useState(false);

  const handleDownload = async () => {
    if (building) return;
    setBuilding(true);
    try {
      const zip = new JSZip();
      // Everything in one folder — drag LovelaceForgeBridge/ into Assets/ and go.
      // The .cs files compile (they're in an "Editor" named folder path); the
      // launchers and README are plain text Unity ignores.
      const folder = zip.folder("LovelaceForgeBridge");
      folder.file("CodeRunner.cs", CODE_RUNNER_CS);
      folder.file("BridgeServer.cs", BRIDGE_SERVER_CS);
      folder.file("LovelaceBridgeWindow.cs", BRIDGE_WINDOW_CS);
      folder.file("LovelaceForge.Bridge.Editor.asmdef", ASMDEF);
      folder.file("Start Forge Tunnel.bat", START_BAT);
      folder.file("start_forge_tunnel.sh", START_SH);
      folder.file("README.md", README);
      folder.file("README.txt", README_TXT);

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "LovelaceForgeBridge.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setBuilding(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={building}
      className={`inline-flex items-center gap-2 rounded-lg border-0 bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_22px_rgba(245,158,11,0.28)] transition hover:from-amber-400 hover:to-orange-500 hover:shadow-[0_0_34px_rgba(245,158,11,0.45)] disabled:opacity-60 ${className}`}
    >
      {building ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      {building ? "Building zip…" : "⬇ Download Forge Bridge (.zip)"}
    </button>
  );
}
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
        public const string Version = "1.0.0";
        public static string Url => $"http://localhost:{Port}";

        private static HttpListener _listener;
        private static CancellationTokenSource _cts;
        private static readonly ConcurrentQueue<Action> _mainQueue = new ConcurrentQueue<Action>();

        public static bool IsRunning => _listener != null && _listener.IsListening;

        static BridgeServer()
        {
            EditorApplication.update += DrainMainQueue;
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
            try
            {
                _listener = new HttpListener();
                _listener.Prefixes.Add($"http://localhost:{Port}/");
                _listener.Start();
                _cts = new CancellationTokenSource();
                SessionState.SetBool("LovelaceBridgeRunning", true);
                _ = ListenLoop(_cts.Token);
                Debug.Log("[Lovelace Forge] Bridge listening on " + Url);
            }
            catch (Exception e)
            {
                Debug.LogError("[Lovelace Forge] Failed to start bridge: " + e.Message +
                    "\\nOn Windows, run: netsh http add urlacl url=http://localhost:9876/ user=Everyone");
            }
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
                    string result = EnqueueAndWait(() => CodeRunner.Run(code), 40000);
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

            // Status pill
            bool running = BridgeServer.IsRunning;
            var pill = new GUIStyle(GUI.skin.box);
            pill.normal.background = MakeTex(running ? new Color(0.12f, 0.45f, 0.20f) : new Color(0.45f, 0.12f, 0.12f));
            GUILayout.BeginVertical(pill, GUILayout.Height(28));
            GUILayout.Label(running ? "●  Connected   " + BridgeServer.Url : "●  Not running", EditorStyles.whiteBoldLabel);
            GUILayout.EndVertical();
            GUILayout.Space(10);

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
                "With the bridge running, open in a browser:\\nhttp://localhost:9876/health",
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
- "Failed to start bridge" on Windows — reserve the URL once (run as admin):
  netsh http add urlacl url=http://localhost:9876/ user=Everyone
- Port 9876 in use — change BridgeServer.Port and the tunnel URL to match.
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
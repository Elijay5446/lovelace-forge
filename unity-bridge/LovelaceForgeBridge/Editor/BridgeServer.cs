using System;
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
                    "\nOn Windows, run: netsh http add urlacl url=http://localhost:9876/ user=Everyone");
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
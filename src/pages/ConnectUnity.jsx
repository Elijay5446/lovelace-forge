import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import {
  Cable,
  ArrowLeft,
  Loader2,
  Plug,
  PlugZap,
  Power,
  ShieldCheck,
  Activity,
  Download,
  Box,
  Globe,
  Server,
  MessagesSquare,
  Check,
} from "lucide-react";
import CopyBlock from "@/components/unity/CopyBlock";
import GlobalNav from "@/components/GlobalNav";
import SageHelp from "@/components/unity/SageHelp";
import ForgeGuideOverlay from "@/components/unity/ForgeGuideOverlay";
import EasySetup from "@/components/unity/EasySetup";
import BridgeTroubleshooting from "@/components/unity/BridgeTroubleshooting";
import CodeRunnerDownload from "@/components/unity/CodeRunnerDownload";
import BridgeZipDownload from "@/components/unity/BridgeZipDownload";

const isGroqKeyError = (msg) => /groq api key|GROQ_API_KEY/i.test(msg || "");

const STATUS_BADGE = {
  connected: { dot: "bg-emerald-400", text: "Connected", glow: "shadow-emerald-500/30" },
  connecting: { dot: "bg-amber-400 animate-pulse", text: "Connecting", glow: "shadow-amber-500/30" },
  unreachable: { dot: "bg-red-400", text: "Not connected", glow: "shadow-red-500/20" },
  disconnected: { dot: "bg-stone-500", text: "Not connected", glow: "" },
  error: { dot: "bg-red-400", text: "Not connected", glow: "shadow-red-500/20" },
  not_configured: { dot: "bg-stone-500", text: "Not connected", glow: "" },
};

const ARCH = [
  { icon: Box, label: "Unity Editor" },
  { icon: Server, label: "Local Bridge :9876" },
  { icon: Globe, label: "Cloudflare Tunnel" },
  { icon: Cable, label: "Lovelace Forge" },
  { icon: MessagesSquare, label: "Your Chat" },
];

const QUICK_CMDS = [
  "winget install --id Cloudflare.cloudflared",
  "cloudflared tunnel --url http://127.0.0.1:9876 --http-host-header 127.0.0.1:9876",
];

const PERMANENT_STEPS = [
  "cloudflared tunnel login",
  "cloudflared tunnel create lovelace-forge",
  'cloudflared tunnel route dns lovelace-forge forge.yourdomain.com',
  "cloudflared tunnel run lovelace-forge",
];

const RELIABILITY = [
  { icon: Activity, title: "Fail-fast", body: "Never hangs — waits are capped at ~45s so a stuck editor can't freeze your turn." },
  { icon: PlugZap, title: "One slow op per turn", body: "Play-mode, reimport, and recompile run one at a time, never in parallel." },
  { icon: Power, title: "Tunnel-death detection", body: "When the tunnel dies, Lovelace asks for a fresh URL instead of spinning forever." },
  { icon: ShieldCheck, title: "Big C# sent safely", body: "Large snippets are base64-escaped so nothing gets mangled in transit." },
];

export default function ConnectUnity() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null); // bridge status key
  const [tunnelUrl, setTunnelUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState({ kind: "", text: "" });
  const [tab, setTab] = useState("quick");
  const [lastSeen, setLastSeen] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [guideOpen, setGuideOpen] = useState(false);
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(i);
  }, []);

  const refreshStatus = useCallback(async () => {
    setChecking(true);
    try {
      const res = await base44.functions.invoke("unity_bridge_relay", { action: "status" });
      const data = res?.data || res;
      if (data?.bridge) {
        setStatus(data.bridge.status);
        if (data.bridge.tunnel_url) setTunnelUrl(data.bridge.tunnel_url);
        if (data.bridge.status === "connected") setLastSeen(Date.now());
      } else {
        const s = data?.status || "not_configured";
        setStatus(s);
        if (s === "connected") setLastSeen(Date.now());
      }
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || "Could not reach the bridge relay.";
      setStatus("error");
      setMessage({ kind: "error", text: isGroqKeyError(msg) ? friendlyKey() : msg });
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const handleConnect = async () => {
    if (!tunnelUrl.trim() || busy) return;
    setBusy(true);
    setMessage({ kind: "", text: "" });
    try {
      const res = await base44.functions.invoke("unity_bridge_relay", {
        action: "register",
        tunnel_url: tunnelUrl.trim(),
      });
      const data = res?.data || res;
      if (!data?.success) throw new Error(data?.error || "Connection failed.");
      const s = data.bridge?.status;
      setStatus(s);
      if (s === "connected") {
        setLastSeen(Date.now());
        setGuideOpen(true);
      }
      if (s === "connected") {
        setMessage({
          kind: "success",
          text: "🟢 Lovelace can now see your Unity editor. Try asking her: “What's in my open scene?”",
        });
      } else {
        setMessage({
          kind: "error",
          text: "🔴 Couldn't reach that URL — is the bridge running and the tunnel started?",
        });
      }
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || "Connection failed.";
      setStatus("unreachable");
      setMessage({ kind: "error", text: isGroqKeyError(msg) ? friendlyKey() : msg });
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    setBusy(true);
    try {
      await base44.functions.invoke("unity_bridge_relay", { action: "disconnect" });
      setStatus("disconnected");
      setTunnelUrl("");
      setMessage({ kind: "", text: "" });
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const badge = (status && STATUS_BADGE[status]) || STATUS_BADGE.not_configured;
  const connected = status === "connected";

  return (
    <div className="min-h-screen w-full bg-black text-stone-200">
      <GlobalNav />
      <header className="sticky top-12 z-20 border-b border-white/5 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3.5 md:px-8">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate("/app")}
              className="text-stone-400 transition hover:text-stone-200"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <Cable className="h-4 w-4 text-amber-400" />
            <span className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-stone-300">
              Connect Unity
            </span>
          </div>

          <div
            className={`flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium shadow-sm ${badge.glow}`}
          >
            <span className={`h-2 w-2 rounded-full ${badge.dot}`} />
            {checking ? "Checking…" : badge.text}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 md:px-8 md:py-12">
        {/* HERO */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="forge-atmosphere relative rounded-xl border border-white/5 p-6 md:p-8"
        >
          <h1 className="font-display text-3xl font-bold tracking-tight text-stone-100 md:text-4xl">
            Connect your live Unity editor
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-stone-400">
            She can inspect your open scene, read and modify assets, run C# in the
            editor, and stream results right back into your chat — an AI
            pair-programmer with hands inside Unity.
          </p>

          {/* Architecture diagram */}
          <div className="mt-7 overflow-x-auto">
            <div className="flex min-w-max items-center gap-1.5">
              {ARCH.map((node, i) => (
                <React.Fragment key={node.label}>
                  <div className="flex flex-col items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-3 text-center">
                    <node.icon className="h-4 w-4 text-amber-400/80" />
                    <span className="text-[10px] font-medium text-stone-400">{node.label}</span>
                  </div>
                  {i < ARCH.length - 1 && <span className="text-stone-700">⇄</span>}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={refreshStatus}
              disabled={checking}
              className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/5 px-3.5 py-2 text-sm font-medium text-amber-100 transition hover:border-amber-400/70 hover:bg-amber-500/10 disabled:opacity-50"
            >
              {checking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Activity className="h-4 w-4" />
              )}
              Test Connection
            </button>
            <span className="text-xs text-stone-600">
              {connected
                ? "Lovelace can see your editor right now."
                : "Not connected to a live editor yet."}
            </span>
          </div>

          {connected && (
            <div className="mt-3 flex items-center gap-2 text-xs text-emerald-300/80">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>
              <span className="font-medium">Live · bridge connected</span>
              {lastSeen && (
                <span className="text-stone-500">
                  · last seen {relativeTime(now - lastSeen)}
                </span>
              )}
            </div>
          )}

          {connected && (
            <button
              onClick={() => setGuideOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3.5 py-2 text-sm font-medium text-amber-100 transition hover:border-amber-400/70 hover:bg-amber-500/10"
            >
              <MessagesSquare className="h-4 w-4" /> How to prompt for game-building →
            </button>
          )}
        </motion.section>

        <div className="mt-12 space-y-10">
          {/* STEP 1 */}
          <Step number={1} title="Install the Forge Bridge in Unity">
            <p className="text-sm leading-relaxed text-stone-400">
              The bridge adds a{" "}
              <span className="font-medium text-stone-200">
                Tools ▸ Lovelace Forge ▸ Start Bridge
              </span>{" "}
              menu that runs a tiny HTTP listener on{" "}
              <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[12px] text-amber-300">
                localhost:9876
              </code>{" "}
              accepting C# snippets on the main thread.
            </p>
            <ol className="mt-4 space-y-2.5 text-sm text-stone-400">
              <li className="flex gap-2.5">
                <Num n={1} />
                <span>Download the Forge Bridge zip (button below) and unzip it.</span>
              </li>
              <li className="flex gap-2.5">
                <Num n={2} />
                <span>
                  Copy{" "}
                  <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[12px] text-amber-300">
                    LovelaceForgeBridge.cs
                  </code>{" "}
                  into your Unity project under{" "}
                  <span className="text-stone-200">Assets/Editor/</span> (create the Editor
                  folder if it doesn't exist). Unity compiles it automatically.
                </span>
              </li>
              <li className="flex gap-2.5">
                <Num n={3} />
                <span>
                  A new menu appears:{" "}
                  <span className="text-stone-200">Tools ▸ Lovelace Forge ▸ Start Bridge</span>.
                  Click it. The Unity Console shows a bridge message — filter the Console
                  with <span className="text-stone-200">"Lovelace"</span> if it's noisy.
                  Seeing{" "}
                  <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[12px] text-emerald-300">
                    Already running on port 9876
                  </code>{" "}
                  is perfect too — it means the bridge is already up.
                </span>
              </li>
              <li className="flex gap-2.5">
                <Num n={4} />
                <span>
                  <span className="text-stone-200">Sanity check:</span> open{" "}
                  <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[12px] text-amber-300">
                    http://127.0.0.1:9876/ping
                  </code>{" "}
                  in your browser. A JSON reply with{" "}
                  <span className="font-mono text-[12px] text-emerald-300">ok: true</span> means
                  the bridge is alive. (Use 127.0.0.1 — "localhost" may show "Invalid
                  Hostname", which is normal.)
                </span>
              </li>
            </ol>
            <p className="mt-3 text-xs leading-relaxed text-stone-500">
              The zip also includes{" "}
              <code className="rounded bg-white/5 px-1 py-0.5 font-mono text-[11px] text-stone-300">
                start_forge_bridge.ps1
              </code>{" "}
              for Windows and{" "}
              <code className="rounded bg-white/5 px-1 py-0.5 font-mono text-[11px] text-stone-300">
                start_forge_bridge.py
              </code>{" "}
              for macOS/Linux — the tunnel launchers used in Step 2 — plus a README.
            </p>
            <div className="mt-5">
              <BridgeZipDownload />
            </div>
            <CodeRunnerDownload />
          </Step>

          {/* STEP 2 */}
          <Step number={2} title="Start the tunnel">
            <p className="text-sm leading-relaxed text-stone-400">
              The bridge listens on <span className="font-mono text-amber-300">localhost:9876</span>.
              A Cloudflare tunnel gives Lovelace a public HTTPS URL to reach it.
            </p>

            <div className="mt-4">
              <EasySetup />
            </div>

            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-stone-600">
              Or do it manually
            </p>
            <div className="mt-2 flex gap-1 rounded-lg border border-white/10 bg-white/[0.02] p-1">
              <TabBtn active={tab === "quick"} onClick={() => setTab("quick")}>
                Quick
              </TabBtn>
              <TabBtn active={tab === "permanent"} onClick={() => setTab("permanent")}>
                Permanent <span className="ml-1 text-[10px] text-amber-400">recommended</span>
              </TabBtn>
            </div>

            {tab === "quick" ? (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-stone-500">
                  Fastest path — the URL changes each restart.
                </p>
                <CopyBlock code={QUICK_CMDS[0]} />
                <CopyBlock code={QUICK_CMDS[1]} />
                <p className="text-xs text-stone-500">
                  Copy the printed{" "}
                  <span className="font-mono text-amber-300">
                    https://&lt;random&gt;.trycloudflare.com
                  </span>{" "}
                  URL — that's your tunnel URL.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-stone-500">
                  URL never changes — ~10 min one-time setup. Needs a free Cloudflare
                  account + a domain. Can auto-start on boot via{" "}
                  <span className="font-mono text-stone-300">cloudflared service install</span>.
                </p>
                <div className="space-y-2.5">
                  {PERMANENT_STEPS.map((cmd, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <Num n={i + 1} />
                      <div className="flex-1">
                        <CopyBlock code={cmd} />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-stone-500">
                  This maps a stable hostname to{" "}
                  <span className="font-mono text-amber-300">http://localhost:9876</span> —
                  use that hostname as your tunnel URL, every time.
                </p>
              </div>
            )}
          </Step>

          {/* STEP 3 */}
          <Step number={3} title="Connect">
            <p className="text-sm leading-relaxed text-stone-400">
              Paste your tunnel URL and connect. Lovelace will ping your editor to confirm.
            </p>
            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
              <input
                value={tunnelUrl}
                onChange={(e) => setTunnelUrl(e.target.value)}
                placeholder="https://forge.trycloudflare.com"
                disabled={busy}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-stone-100 placeholder:text-stone-600 focus:border-amber-500/50 focus:outline-none"
              />
              <button
                onClick={handleConnect}
                disabled={busy || !tunnelUrl.trim()}
                className="flex items-center justify-center gap-1.5 rounded-lg border-0 bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2.5 text-sm font-medium text-white transition hover:from-amber-500 hover:to-orange-500 disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plug className="h-4 w-4" />}
                Connect
              </button>
              <button
                onClick={handleDisconnect}
                disabled={busy}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-stone-400 transition hover:border-white/20 hover:text-stone-200 disabled:opacity-50"
              >
                <Power className="h-4 w-4" /> Disconnect
              </button>
            </div>

            {message.text && (
              <div
                className={`mt-3 rounded-lg border px-3.5 py-3 text-sm ${
                  message.kind === "success"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                    : "border-red-500/30 bg-red-500/10 text-red-200"
                }`}
              >
                {message.text}
              </div>
            )}
          </Step>
        </div>

        <BridgeTroubleshooting />

        {/* Reliability */}
        <section className="mt-12">
          <h2 className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
            How Lovelace behaves
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {RELIABILITY.map((r) => (
              <div
                key={r.title}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
              >
                <div className="flex items-center gap-2">
                  <r.icon className="h-4 w-4 text-amber-400/80" />
                  <h3 className="text-sm font-semibold text-stone-200">{r.title}</h3>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-stone-500">{r.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Privacy */}
        <section className="mt-6">
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-5">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <h3 className="text-sm font-semibold text-stone-100">Privacy & isolation</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-stone-400">
                Your tunnel URL is stored privately on your own account (row-level
                security). Lovelace's relay only ever forwards to{" "}
                <span className="font-medium text-stone-200">your</span> Unity editor.
                No other user can reach your machine. Ever.
              </p>
            </div>
          </div>
        </section>
      </main>

      <ForgeGuideOverlay open={guideOpen} onClose={() => setGuideOpen(false)} />
      <SageHelp />
    </div>
  );
}

function friendlyKey() {
  return "Lovelace needs her Groq API key configured to think — ask your admin to set GROQ_API_KEY.";
}

function relativeTime(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.round(m / 60)}h ago`;
}

function Step({ number, title, children }) {
  return (
    <section>
      <div className="flex items-center gap-2.5">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-amber-500 to-orange-700 text-xs font-bold text-white">
          {number}
        </span>
        <h2 className="font-display text-lg font-semibold text-stone-100">{title}</h2>
      </div>
      <div className="mt-3 pl-8">{children}</div>
    </section>
  );
}

function Num({ n }) {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[10px] font-semibold text-stone-400">
      {n}
    </span>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
        active
          ? "bg-white/10 text-stone-100"
          : "text-stone-500 hover:text-stone-300"
      }`}
    >
      {children}
    </button>
  );
}
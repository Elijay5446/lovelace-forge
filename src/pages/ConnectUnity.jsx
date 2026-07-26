import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import {
  Cable,
  ArrowLeft,
  Loader2,
  Plug,
  Power,
  ShieldCheck,
  Box,
  Globe,
  Server,
  MessagesSquare,
} from "lucide-react";
import CopyBlock from "@/components/unity/CopyBlock";
import GlobalNav from "@/components/GlobalNav";
import SageHelp from "@/components/unity/SageHelp";
import ForgeGuideOverlay from "@/components/unity/ForgeGuideOverlay";
import EasySetup from "@/components/unity/EasySetup";
import BridgeTroubleshooting from "@/components/unity/BridgeTroubleshooting";
import LiveStatus from "@/components/unity/LiveStatus";
import CommandConsole from "@/components/unity/CommandConsole";
import BridgeZipDownload from "@/components/unity/BridgeZipDownload";
import BridgeStatusPanel from "@/components/unity/BridgeStatusPanel";
import FirstRunModal from "@/components/unity/FirstRunModal";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";

const isGroqKeyError = (msg) => /groq api key|GROQ_API_KEY/i.test(msg || "");

// HTTP request-response relay architecture (the proven Kizuna approach):
// Unity C# HttpListener on :9876  →  Cloudflare tunnel  →  Base44 relay
// function  →  this app. No WebSocket / MCP session — every call is one HTTP
// round-trip, which is all a serverless backend can hold.
const ARCH = [
  { icon: Box, label: "Unity Editor :9876" },
  { icon: Server, label: "Bridge (HttpListener)" },
  { icon: Globe, label: "Cloudflare Tunnel" },
  { icon: Cable, label: "Base44 Relay" },
  { icon: MessagesSquare, label: "Your Chat" },
];

export default function ConnectUnity() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [tunnelUrl, setTunnelUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ kind: "", text: "" });
  const [guideOpen, setGuideOpen] = useState(false);
  const [firstRunOpen, setFirstRunOpen] = useState(false);
  const [statusRefresh, setStatusRefresh] = useState(0);
  const downloadSectionRef = useRef(null);

  // Load any already-registered tunnel URL once so the input reflects reality.
  const loadExisting = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("unity_bridge_relay", { action: "status" });
      const data = res?.data || res;
      if (data?.bridge?.tunnel_url) setTunnelUrl(data.bridge.tunnel_url);
    } catch {
      /* handled by LiveStatus */
    }
  }, []);

  useEffect(() => {
    loadExisting();
  }, [loadExisting]);

  // First-run onboarding: show once, then remember on the user's profile.
  useEffect(() => {
    (async () => {
      try {
        const profiles = await base44.entities.UserProfile.filter({}, "-created_date", 1);
        const profile = profiles?.[0];
        if (profile?.onboarded) return;
        setFirstRunOpen(true);
        if (profile) await base44.entities.UserProfile.update(profile.id, { onboarded: true });
        else await base44.entities.UserProfile.create({ onboarded: true });
      } catch {
        /* non-blocking */
      }
    })();
  }, []);

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
      setStatusRefresh((n) => n + 1);
      if (s === "connected") {
        setGuideOpen(true);
        setMessage({
          kind: "success",
          text: "🟢 Connected. Lovelace can see your Unity editor — scroll down to the command console, or ask her “What's in my open scene?”",
        });
      } else {
        setMessage({
          kind: "error",
          text: "🔴 Couldn't reach that URL — is the bridge running in Unity and the tunnel window still open?",
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

  const connected = status === "connected";

  return (
    <div className="min-h-screen w-full bg-black text-stone-200">
      <GlobalNav />
      <header className="sticky top-12 z-20 border-b border-white/5 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3.5 md:px-8">
          <div className="flex items-center gap-2.5">
            <button onClick={() => navigate("/app")} className="text-stone-400 transition hover:text-stone-200">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <Cable className="h-4 w-4 text-amber-400" />
            <span className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-stone-300">
              Connect Unity
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              to="/unity-setup"
              className="hidden items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-stone-300 transition hover:border-amber-500/40 hover:text-amber-100 sm:inline-flex"
            >
              <BookOpen className="h-3.5 w-3.5" /> Setup Guide
            </Link>
            <LiveStatus onStatusChange={setStatus} />
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
            Three steps and Lovelace can inspect your open scene, run C#, and call
            Unity tools — results stream straight back into your chat. Everything
            below is copy-paste; you don't need to understand the plumbing.
          </p>

          <div className="mt-7 overflow-x-auto">
            <div className="flex min-w-max items-center gap-1.5">
              {ARCH.map((node, i) => (
                <React.Fragment key={node.label}>
                  <div className="flex flex-col items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-3 text-center">
                    <node.icon className="h-4 w-4 text-amber-400/80" />
                    <span className="text-[10px] font-medium text-stone-400">{node.label}</span>
                  </div>
                  {i < ARCH.length - 1 && <span className="text-stone-700">→</span>}
                </React.Fragment>
              ))}
            </div>
          </div>

          {connected && (
            <button
              onClick={() => setGuideOpen(true)}
              className="mt-6 inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3.5 py-2 text-sm font-medium text-amber-100 transition hover:border-amber-400/70 hover:bg-amber-500/10"
            >
              <MessagesSquare className="h-4 w-4" /> How to prompt for game-building →
            </button>
          )}
        </motion.section>

        {/* Prominent download + guide */}
        <section ref={downloadSectionRef} className="mt-8 rounded-xl border border-amber-500/25 bg-amber-500/[0.04] p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-stone-100">
                Get the bridge package
              </h2>
              <p className="mt-1 text-sm text-stone-400">
                One ZIP with the Unity script, launchers, and a README. New to this?
                Follow the step-by-step guide.
              </p>
            </div>
            <Link
              to="/unity-setup"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-medium text-stone-200 transition hover:border-amber-500/40 hover:text-amber-100"
            >
              <BookOpen className="h-4 w-4" /> How to configure Unity
            </Link>
          </div>
          <div className="mt-4">
            <BridgeZipDownload />
          </div>
          <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.02] p-4 text-sm leading-relaxed text-stone-400">
            <p><span className="font-semibold text-stone-200">Step 1:</span> Download and install the bridge package in your Unity editor (see Setup Guide)</p>
            <p className="mt-1"><span className="font-semibold text-stone-200">Step 2:</span> Start the bridge script on your machine</p>
            <p className="mt-1"><span className="font-semibold text-stone-200">Step 3:</span> Paste your tunnel URL below to connect</p>
          </div>
        </section>

        <div className="mt-12 space-y-10">
          {/* STEP 1 */}
          <Step number={1} title="Turn on the bridge inside Unity">
            <p className="text-sm leading-relaxed text-stone-400">
              You already installed the Unity bridge package. Now start it so it
              listens for Lovelace on your machine.
            </p>
            <ol className="mt-4 space-y-2.5 text-sm text-stone-400">
              <li className="flex gap-2.5">
                <Num n={1} />
                <span>
                  In Unity's top menu, open the bridge window and click{" "}
                  <span className="text-stone-200">Start</span>. It begins listening on{" "}
                  <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[12px] text-amber-300">
                    localhost:9876
                  </code>
                  .
                </span>
              </li>
              <li className="flex gap-2.5">
                <Num n={2} />
                <span>
                  <span className="text-stone-200">Quick check:</span> open{" "}
                  <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[12px] text-amber-300">
                    http://127.0.0.1:9876/ping
                  </code>{" "}
                  in your browser. Seeing{" "}
                  <span className="font-mono text-[12px] text-emerald-300">{'{ "status": "ok" }'}</span>{" "}
                  means the bridge is alive. (Use 127.0.0.1 — “localhost” sometimes shows a
                  hostname warning, which is normal.)
                </span>
              </li>
            </ol>
          </Step>

          {/* STEP 2 */}
          <Step number={2} title="Start the tunnel (one double-click)">
            <p className="text-sm leading-relaxed text-stone-400">
              A Cloudflare tunnel gives Lovelace a safe public web address to reach
              the bridge on your computer. The launcher below installs everything
              and starts it for you.
            </p>
            <div className="mt-4">
              <EasySetup />
            </div>
            <p className="mt-4 text-xs leading-relaxed text-stone-500">
              Prefer to run it by hand? In a terminal:
            </p>
            <div className="mt-2">
              <CopyBlock code="cloudflared tunnel --url http://127.0.0.1:9876 --http-host-header 127.0.0.1:9876" />
            </div>
            <p className="mt-2 text-xs text-stone-500">
              Either way, copy the{" "}
              <span className="font-mono text-amber-300">https://&lt;random&gt;.trycloudflare.com</span>{" "}
              address it prints. <span className="text-stone-300">Keep that window open</span>{" "}
              the whole time you work.
            </p>
          </Step>

          {/* STEP 3 */}
          <Step number={3} title="Connect Lovelace">
            <p className="text-sm leading-relaxed text-stone-400">
              Paste the tunnel address and hit Connect. The status dot up top turns
              green when Lovelace can reach your editor — and it re-checks itself
              every 10 seconds, so you'll always know if the link drops.
            </p>
            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
              <input
                value={tunnelUrl}
                onChange={(e) => setTunnelUrl(e.target.value)}
                placeholder="https://something.trycloudflare.com"
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

            <div className="mt-4">
              <BridgeStatusPanel refreshKey={statusRefresh} />
            </div>
          </Step>

          {/* STEP 4 — the console */}
          <Step number={4} title="Run Unity tools">
            <p className="mb-4 text-sm leading-relaxed text-stone-400">
              Once connected, browse the tools your bridge offers and run one by
              name, or send raw C#. Each run is a single request to your editor.
            </p>
            <CommandConsole connected={connected} />
          </Step>
        </div>

        <BridgeTroubleshooting />

        {/* Privacy */}
        <section className="mt-12">
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-5">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <h3 className="text-sm font-semibold text-stone-100">Privacy & isolation</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-stone-400">
                Your tunnel URL is stored privately on your own account (row-level
                security). The relay only ever forwards to{" "}
                <span className="font-medium text-stone-200">your</span> Unity editor.
                No other user can reach your machine. Ever.
              </p>
            </div>
          </div>
        </section>
      </main>

      <FirstRunModal
        open={firstRunOpen}
        onClose={() => setFirstRunOpen(false)}
        onDownload={() =>
          downloadSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      />
      <ForgeGuideOverlay open={guideOpen} onClose={() => setGuideOpen(false)} />
      <SageHelp />
    </div>
  );
}

function friendlyKey() {
  return "Lovelace needs her Groq API key configured to think — ask your admin to set GROQ_API_KEY.";
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
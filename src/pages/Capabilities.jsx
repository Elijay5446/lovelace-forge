import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Brain,
  Network,
  Sparkles,
  ListChecks,
  Code2,
  Cable,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import GlobalNav from "@/components/GlobalNav";

const CAPS = [
  {
    icon: Brain,
    name: "The Brain — Live Chat",
    fn: "chat_completion",
    short:
      "Your everyday conversation with Lovelace. Loads your recent context, speaks as a senior Unity/UFE2 technical director, and streams answers in real time.",
    long:
      "Authenticates you, loads your last 20 messages for context, wraps them in the Lovelace Forge persona, and calls Groq's Llama 3.3 70B — then saves both your message and her reply so the thread stays intact.",
    cta: "Open Chat",
    to: "/app",
    tag: null,
  },
  {
    icon: Network,
    name: "Consult the Council",
    fn: "start_consult",
    short:
      "Fan one hard question out to three AI models at once — each answers live, labeled by provider — so you get a room full of experts on tap.",
    long:
      "Reads every enabled model provider (Llama 3.3 70B, Llama 3.1 8B, GPT-OSS 20B), creates a consult session, and fires all three to Groq in parallel. Each answer lands live, labeled by provider, while you poll.",
    cta: "Ask the Council",
    to: "/app",
    tag: null,
  },
  {
    icon: Sparkles,
    name: "Synthesize the Council",
    fn: "synthesize_consult",
    short:
      "Lovelace reads every council answer, resolves disagreements, and merges them into one authoritative best answer.",
    long:
      "Once the council finishes, Lovelace bundles every completed answer with your original question and asks Llama 3.3 to integrate them — noting agreement, resolving disagreement — into one authoritative best answer saved to your chat.",
    cta: null,
    to: null,
    tag: "Part of the Council flow",
  },
  {
    icon: ListChecks,
    name: "Build Planner",
    fn: "generate_game_dev_plan",
    short:
      "Turn any goal into an ordered Unity/UFE2 build plan — each step tagged Automatable or Manual with an effort estimate.",
    long:
      "Send a goal and Groq returns a strict JSON array of ordered steps (title, description, Automatable/Manual, effort). The function parses it and bulk-creates GameDevTask rows ready for your Build Plan tab.",
    cta: "Plan a Build",
    to: "/app/projects",
    tag: null,
  },
  {
    icon: Code2,
    name: "Code Writer",
    fn: "generate_code",
    short:
      "Describe what you need and get production-ready Unity C#, saved to your project with one-click copy.",
    long:
      "Describe what you need; Groq returns one fenced, commented Unity C# block. The function splits it into explanation + code and stores it as a CodeArtifact tied to your project, ready to copy.",
    cta: "Generate Code",
    to: "/app/projects",
    tag: null,
  },
  {
    icon: Cable,
    name: "Unity Live Bridge",
    fn: "unity_bridge_relay",
    short:
      "Connect your live Unity editor to Lovelace over a secure tunnel — inspect scenes, read/modify assets, run C#.",
    long:
      "Registers and pings your Cloudflare tunnel (8s cap), then forwards C# to your editor's /execute with a hard 45s cap so a stuck operation never hangs the turn — all logged per command.",
    cta: "Connect Unity",
    to: "/app/unity",
    tag: null,
  },
];

function CapCard({ cap, index }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const Icon = cap.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.06, 0.4) }}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02] p-5 pl-6 transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-[0_0_28px_rgba(245,158,11,0.12)]"
    >
      <span className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-amber-500/70 to-orange-700/30 opacity-60 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-amber-500/5 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-700/20 ring-1 ring-amber-500/10">
          <Icon className="h-5 w-5 text-amber-400/90" />
        </div>
        {cap.tag && (
          <span className="rounded-full border border-amber-500/20 bg-amber-500/5 px-2 py-0.5 text-[10px] font-medium text-amber-300/80">
            {cap.tag}
          </span>
        )}
      </div>

      <h3 className="mt-3 font-display text-base font-semibold text-stone-100 transition group-hover:text-amber-400">
        {cap.name}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-stone-400">{cap.short}</p>

      <button
        onClick={() => setOpen((o) => !o)}
        className="mt-3 inline-flex w-fit items-center gap-1 text-xs font-medium text-amber-400/80 transition hover:text-amber-300"
      >
        {open ? "Hide detail" : "How it works"}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`grid transition-all duration-300 ${open ? "mt-2 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <p className="rounded-lg border border-white/5 bg-black/30 p-3 text-xs leading-relaxed text-stone-500">
            {cap.long}
          </p>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between pt-4">
        <code className="font-mono text-[10px] text-stone-600">{cap.fn}()</code>
        {cap.cta ? (
          <button
            onClick={() => navigate(cap.to)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-1.5 text-xs font-medium text-amber-100 transition hover:border-amber-400/70 hover:bg-amber-500/10"
          >
            {cap.cta} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            onClick={() => navigate("/app")}
            className="text-xs text-stone-500 transition hover:text-amber-300"
          >
            See it in chat →
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function Capabilities() {
  return (
    <div className="min-h-screen w-full bg-black text-stone-200">
      <GlobalNav />
      <main className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
        <header className="mb-9">
          <span className="mb-3 inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.28em] text-amber-500/80">
            <span className="h-px w-7 bg-amber-500/50" />
            Six Real Backend Capabilities
          </span>
          <h1 className="font-display text-4xl font-bold tracking-tight text-stone-100 md:text-5xl">
            Capabilities
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone-400">
            Forge is powered by six real backend functions — the brain, the
            council, the planner, the writer, and the bridge.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAPS.map((cap, i) => (
            <CapCard key={cap.fn} cap={cap} index={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
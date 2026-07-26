import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, Network, Code2, Cable, Link2, Check, BookOpen } from "lucide-react";

const BRIDGE_FEATURES = [
  "Execute custom C# code in your Unity editor from the browser",
  "Inspect and modify any Unity asset programmatically",
  "Take screenshots of your editor view remotely",
  "Named tool system: create_game_object, run_script, inspect_asset, list_scene_objects",
  "Works with any Unity 2021.3+ project",
  "Secure Cloudflare tunnel — your editor never exposes a public port",
];

const CAPS = [
  {
    icon: Cable,
    title: "Hands inside Unity",
    desc: "Connect your live editor over a secure tunnel — she inspects scenes, edits assets, and runs C# on the spot.",
  },
  {
    icon: Brain,
    title: "PhD-level engineering",
    desc: "A senior Unity technical director in chat form — architecture, gameplay systems, shaders, performance, debugging.",
  },
  {
    icon: Network,
    title: "Consults a council",
    desc: "Hard question? Three AI models answer in parallel and Lovelace synthesizes one authoritative best answer.",
  },
  {
    icon: Code2,
    title: "Writes production code",
    desc: "Describe what you need and get clean, commented Unity C# — drafted with full awareness of your actual project.",
  },
];

export default function CapabilitiesSection() {
  return (
    <section className="relative mx-auto w-full max-w-4xl px-6 py-20 md:py-24">
      <div className="mb-10 text-center">
        <span className="mb-4 inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.28em] text-amber-500/80">
          <span className="h-px w-7 bg-amber-500/40" /> What She Does
          <span className="h-px w-7 bg-amber-500/40" />
        </span>
        <h2 className="forge-title font-display text-3xl font-bold tracking-[0.04em] text-[#FFF6E0] md:text-4xl">
          One AI. Your whole studio.
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CAPS.map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5 transition hover:border-amber-500/30"
          >
            <c.icon className="h-5 w-5 text-amber-400/90" strokeWidth={1.5} />
            <h3 className="mt-3 font-display text-base font-semibold text-stone-100">
              {c.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-stone-400">{c.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Unity Live Bridge — the crown jewel */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6 }}
        className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-6 md:p-8"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-700 shadow-[0_0_18px_rgba(245,158,11,0.35)]">
            <Link2 className="h-4 w-4 text-white" />
          </span>
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
            Unity Live Bridge
          </span>
        </div>
        <h3 className="mt-4 font-display text-2xl font-semibold text-stone-100">
          Live Unity Editor Bridge
        </h3>
        <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-stone-400">
          Connect your Unity editor directly to Lovelace Forge. Run C# scripts, inspect
          assets, manage game objects, and build your game with AI — all in real time,
          right inside your editor. No plugins required.
        </p>
        <ul className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {BRIDGE_FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-stone-300">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <Link
          to="/unity-setup"
          className="mt-6 inline-flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/5 px-4 py-2.5 text-sm font-semibold text-amber-100 transition hover:border-amber-400/70 hover:bg-amber-500/10"
        >
          <BookOpen className="h-4 w-4" /> View Setup Guide
        </Link>
      </motion.div>
    </section>
  );
}
import React from "react";
import { motion } from "framer-motion";
import {
  MessagesSquare,
  Code2,
  ListChecks,
  Network,
  Combine,
  Cable,
  Zap,
  ShieldCheck,
  GitMerge,
} from "lucide-react";

const FUNCTIONS = [
  { icon: MessagesSquare, name: "chat_completion", desc: "Genre-aware AI chat with persisted conversation history" },
  { icon: Code2, name: "generate_code", desc: "Production Unity C# generated on demand" },
  { icon: ListChecks, name: "generate_game_dev_plan", desc: "Turns plain English into ordered build tasks" },
  { icon: Network, name: "start_consult", desc: "Fans one question out to a council of models — in parallel" },
  { icon: Combine, name: "synthesize_consult", desc: "Merges the council's answers into one verdict" },
  { icon: Cable, name: "unity_bridge_relay", desc: "Securely relays live C# into your Unity editor" },
];

const PILLARS = [
  {
    icon: GitMerge,
    title: "Parallel orchestration",
    body: "The council queries multiple AI providers concurrently, streams statuses to the UI, then synthesizes — all server-side.",
  },
  {
    icon: Zap,
    title: "Fail-fast relay",
    body: "The Unity bridge caps waits, serializes slow operations, and detects dead tunnels instead of hanging.",
  },
  {
    icon: ShieldCheck,
    title: "Row-level security",
    body: "Every conversation, session, and tunnel URL is isolated per user — no one can ever reach your editor.",
  },
];

export default function UnderTheHood() {
  return (
    <section className="relative mx-auto w-full max-w-5xl px-6 py-24 md:px-10">
      <div className="text-center">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.28em] text-amber-500/80"
        >
          <span className="h-px w-7 bg-amber-500/40" />
          Under the Hood
          <span className="h-px w-7 bg-amber-500/40" />
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="forge-title font-display mt-5 text-3xl font-bold tracking-wide text-[#FFF6E0] md:text-4xl"
        >
          Powered entirely by the Base44 backend
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-stone-400"
        >
          Six backend functions do the heavy lifting — AI orchestration, code
          generation, planning, and a live editor bridge — with every record
          locked down by row-level security.
        </motion.p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FUNCTIONS.map((f, i) => (
          <motion.div
            key={f.name}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
            className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-left transition hover:border-amber-500/25 hover:bg-amber-500/[0.04]"
          >
            <div className="flex items-center gap-2.5">
              <f.icon className="h-4 w-4 shrink-0 text-amber-400/80" strokeWidth={1.5} />
              <code className="font-mono text-[13px] font-semibold text-amber-200">{f.name}</code>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-stone-500">{f.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-3">
        {PILLARS.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
            className="rounded-xl border border-amber-500/15 bg-amber-500/[0.03] p-5 text-left"
          >
            <div className="flex items-center gap-2">
              <p.icon className="h-4 w-4 text-amber-400" strokeWidth={1.5} />
              <h3 className="font-display text-sm font-semibold tracking-wide text-stone-100">
                {p.title}
              </h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-stone-500">{p.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
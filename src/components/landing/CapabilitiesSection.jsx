import React from "react";
import { motion } from "framer-motion";
import { Brain, Network, Code2, Cable } from "lucide-react";

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
    </section>
  );
}
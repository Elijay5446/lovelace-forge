import React from "react";
import { motion } from "framer-motion";
import { Terminal, ArrowDown, CheckCircle2 } from "lucide-react";

const PROMPT = "Add a health bar above each enemy and make bosses drop loot on defeat.";

const RESULTS = [
  "EnemyHealthBar.cs created and attached to 6 enemies",
  "LootDropper.cs wired to the boss prefab",
  "Scene saved — press Play to test",
];

export default function TextToGame() {
  return (
    <section className="forge-atmosphere-soft relative border-y border-white/5 px-6 py-20 md:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <span className="mb-4 inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.28em] text-amber-500/80">
            <span className="h-px w-7 bg-amber-500/40" /> Plain Text In · Working Game Out
            <span className="h-px w-7 bg-amber-500/40" />
          </span>
          <h2 className="forge-title font-display text-4xl font-bold tracking-[0.04em] text-[#FFF6E0] md:text-5xl">
            You describe it. She builds it.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-stone-400 md:text-base">
            No plugins to learn. No API to wire. Type what you want in plain
            English and Lovelace executes it live inside your Unity editor —
            writing scripts, editing scenes, and shipping the change while you watch.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mx-auto mt-10 max-w-xl text-left"
        >
          {/* The prompt */}
          <div className="rounded-2xl rounded-br-sm border border-white/10 bg-white/[0.04] px-5 py-4">
            <p className="text-sm leading-relaxed text-stone-100 md:text-[15px]">
              “{PROMPT}”
            </p>
          </div>

          <div className="my-4 flex justify-center">
            <ArrowDown className="h-5 w-5 text-amber-500/70" />
          </div>

          {/* The result */}
          <div className="council-glow rounded-2xl border border-amber-500/30 bg-amber-500/[0.05] p-5">
            <div className="mb-3 flex items-center gap-2 text-amber-300">
              <Terminal className="h-4 w-4" />
              <span className="font-display text-xs font-semibold uppercase tracking-[0.18em]">
                Executed live in your Unity editor
              </span>
            </div>
            <div className="space-y-2">
              {RESULTS.map((r, i) => (
                <motion.p
                  key={r}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.15 }}
                  className="flex items-start gap-2 text-[13px] leading-relaxed text-stone-300"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  {r}
                </motion.p>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
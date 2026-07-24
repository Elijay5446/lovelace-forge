import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Brain } from "lucide-react";

const QUESTION = "How should I structure a hit-cancel combo system in Unity?";

const CARDS = [
  {
    name: "Llama 3.3 70B",
    dot: "bg-amber-400",
    ring: "border-amber-500/25",
    tint: "from-amber-500/10",
    lines: [
      "Use a MoveList with per-frame",
      "cancel windows; trigger checks",
      "fire on hitstop.",
    ],
  },
  {
    name: "Llama 3.1 8B",
    dot: "bg-sky-400",
    ring: "border-sky-500/25",
    tint: "from-sky-500/10",
    lines: [
      "Chain via an enum state",
      "machine; gate cancels by the",
      "input buffer + startup frames.",
    ],
  },
  {
    name: "GPT-OSS 20B",
    dot: "bg-violet-400",
    ring: "border-violet-500/25",
    tint: "from-violet-500/10",
    lines: [
      "Decouple into a CancelRule",
      "asset; data-drive windows,",
      "don't hardcode them.",
    ],
  },
];

const SYNTH_LINES = [
  "Drive cancels from a data-defined CancelGraph:",
  "each Move exposes cancel windows + valid targets;",
  "the input buffer selects the next move at hitstop.",
  "Designer-tunable, not hardcoded.",
];
const SYNTH_CAPTION = "Synthesized from 3 models.";

const CYCLE = 9600;
const T_TYPE = 2300;
const T_PRESS = 3000;
const T_FAN = 3200;
const T_DONE0 = 6000;
const T_DONE_GAP = 400;
const T_SYNTH = 7700;
const T_FADE = 8900;

const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function CouncilTeaser() {
  const reduced = prefersReduced();
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    if (reduced) return;
    let raf;
    const tick = () => {
      const e = (Date.now() - startRef.current) % CYCLE;
      setElapsed(e);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  if (reduced) return <StaticCouncil />;

  const typedCount = Math.min(
    QUESTION.length,
    Math.floor((elapsed / T_TYPE) * QUESTION.length)
  );
  const typed = QUESTION.slice(0, typedCount);
  const showButton = elapsed > 2100;
  const pressed = elapsed > T_PRESS && elapsed < T_PRESS + 700;
  const converging = elapsed > T_SYNTH;
  const fadeOut = elapsed > T_FADE;

  const cardShown = (i) => elapsed > T_FAN + i * 150;
  const cardDone = (i) => elapsed > T_DONE0 + i * T_DONE_GAP;

  return (
    <section className="relative mx-auto w-full max-w-3xl px-6 py-20 md:py-28">
      {/* Header */}
      <div className="mb-12 text-center">
        <span className="mb-4 inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.28em] text-amber-500/80">
          <span className="h-px w-7 bg-amber-500/40" /> The Signature Feature
          <span className="h-px w-7 bg-amber-500/40" />
        </span>
        <h2 className="forge-title font-display text-4xl font-bold tracking-[0.04em] text-[#FFF6E0] md:text-5xl">
          Consult the Council
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm text-stone-400">
          Ask once. Three AI minds answer. Lovelace synthesizes the truth.
        </p>
      </div>

      {/* Stage */}
      <div className="relative">
        {/* Question bubble + button */}
        <div className="mx-auto mb-7 max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl rounded-br-sm border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-stone-200"
          >
            <span className="whitespace-pre-wrap leading-relaxed">{typed}</span>
            <motion.span
              className="ml-0.5 inline-block h-3.5 w-1.5 bg-amber-300 align-middle"
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          </motion.div>

          <div className="mt-4 flex justify-center">
            <AnimatePresence>
              {showButton && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    animate={
                      pressed
                        ? { scale: 0.96 }
                        : {
                            boxShadow: [
                              "0 0 18px rgba(245,158,11,0.30)",
                              "0 0 34px rgba(245,158,11,0.55)",
                              "0 0 18px rgba(245,158,11,0.30)",
                            ],
                          }
                    }
                    transition={
                      pressed ? { duration: 0.2 } : { duration: 1.6, repeat: Infinity }
                    }
                    className={`flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold ${
                      pressed
                        ? "border-amber-300/70 bg-amber-500/20 text-amber-100"
                        : "border-amber-400/50 bg-amber-500/10 text-amber-100"
                    }`}
                  >
                    <Sparkles className="h-4 w-4" /> Consult the Council
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Three model cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {CARDS.map((c, i) => {
            const shown = cardShown(i) && !fadeOut;
            const done = cardDone(i);
            return (
              <AnimatePresence key={c.name}>
                {shown && (
                  <motion.div
                    initial={{ opacity: 0, y: 24, scale: 0.96 }}
                    animate={
                      converging
                        ? { opacity: 0.25, y: 14, scale: 0.92 }
                        : { opacity: 1, y: 0, scale: 1 }
                    }
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className={`relative overflow-hidden rounded-xl border ${c.ring} bg-gradient-to-b ${c.tint} to-[#0a0a0b] p-4`}
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                      <span className="font-mono text-[11px] tracking-wide text-stone-300">
                        {c.name}
                      </span>
                    </div>

                    {done ? (
                      <div className="space-y-1.5">
                        {c.lines.map((l, li) => (
                          <motion.p
                            key={li}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: li * 0.08 }}
                            className="text-[11.5px] leading-relaxed text-stone-400"
                          >
                            {l}
                          </motion.p>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {[0, 1, 2].map((s) => (
                          <div
                            key={s}
                            className="relative h-2.5 overflow-hidden rounded bg-white/5"
                          >
                            <motion.div
                              className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-amber-300/20 to-transparent"
                              animate={{ x: ["-120%", "240%"] }}
                              transition={{
                                duration: 1.1,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: s * 0.15,
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            );
          })}
        </div>

        {/* Synthesis */}
        <AnimatePresence>
          {converging && !fadeOut && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="council-glow mt-6 rounded-xl border border-amber-500/40 bg-amber-500/[0.06] p-5"
            >
              <div className="mb-2.5 flex items-center gap-2 text-amber-300">
                <Brain className="h-4 w-4" />
                <span className="font-display text-xs font-semibold uppercase tracking-[0.18em]">
                  ✦ Lovelace's Synthesis
                </span>
              </div>
              <div className="space-y-1">
                {SYNTH_LINES.map((l, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 + i * 0.12 }}
                    className="text-[12.5px] leading-relaxed text-stone-200"
                  >
                    {l}
                  </motion.p>
                ))}
              </div>
              <div className="mt-3 border-t border-amber-500/15 pt-2 text-[11px] text-amber-400/70">
                {SYNTH_CAPTION}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function StaticCouncil() {
  return (
    <section className="relative mx-auto w-full max-w-3xl px-6 py-20 md:py-28">
      <div className="mb-12 text-center">
        <span className="mb-4 inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.28em] text-amber-500/80">
          <span className="h-px w-7 bg-amber-500/40" /> The Signature Feature
          <span className="h-px w-7 bg-amber-500/40" />
        </span>
        <h2 className="forge-title font-display text-4xl font-bold tracking-[0.04em] text-[#FFF6E0] md:text-5xl">
          Consult the Council
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm text-stone-400">
          Ask once. Three AI minds answer. Lovelace synthesizes the truth.
        </p>
      </div>

      <div className="mx-auto mb-7 max-w-xl">
        <div className="rounded-2xl rounded-br-sm border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-stone-200">
          {QUESTION}
        </div>
        <div className="mt-4 flex justify-center">
          <div className="flex items-center gap-2 rounded-full border border-amber-300/70 bg-amber-500/20 px-5 py-2.5 text-sm font-semibold text-amber-100">
            <Sparkles className="h-4 w-4" /> Consult the Council
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {CARDS.map((c) => (
          <div
            key={c.name}
            className={`relative overflow-hidden rounded-xl border ${c.ring} bg-gradient-to-b ${c.tint} to-[#0a0a0b] p-4`}
          >
            <div className="mb-3 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${c.dot}`} />
              <span className="font-mono text-[11px] tracking-wide text-stone-300">{c.name}</span>
            </div>
            <div className="space-y-1.5">
              {c.lines.map((l, li) => (
                <p key={li} className="text-[11.5px] leading-relaxed text-stone-400">
                  {l}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="council-glow mt-6 rounded-xl border border-amber-500/40 bg-amber-500/[0.06] p-5">
        <div className="mb-2.5 flex items-center gap-2 text-amber-300">
          <Brain className="h-4 w-4" />
          <span className="font-display text-xs font-semibold uppercase tracking-[0.18em]">
            ✦ Lovelace's Synthesis
          </span>
        </div>
        <div className="space-y-1">
          {SYNTH_LINES.map((l, i) => (
            <p key={i} className="text-[12.5px] leading-relaxed text-stone-200">
              {l}
            </p>
          ))}
        </div>
        <div className="mt-3 border-t border-amber-500/15 pt-2 text-[11px] text-amber-400/70">
          {SYNTH_CAPTION}
        </div>
      </div>
    </section>
  );
}
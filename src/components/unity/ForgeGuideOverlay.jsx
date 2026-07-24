import React from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Hammer, X, ArrowRight, Sparkles, Wand2, Terminal, ListChecks } from "lucide-react";

const TIPS = [
  {
    icon: ListChecks,
    title: "Start with a goal",
    body: "“Break down how to build an inventory system for my game.” Lovelace turns it into ordered steps.",
  },
  {
    icon: Wand2,
    title: "Ask her to make code",
    body: "“Generate a C# controller for a double-jump.” She writes clean, commented Unity C# ready to use.",
  },
  {
    icon: Terminal,
    title: "Use the live bridge",
    body: "“What's in my open scene?” or “Run this snippet in Unity: …” — she sees and edits your editor.",
  },
];

const PROMPTS = [
  "What's in my open Unity scene right now?",
  "Generate a C# script that spawns enemies in waves",
  "Review my scene setup and suggest improvements",
  "Break down how to build a save/load system",
];

export default function ForgeGuideOverlay({ open, onClose }) {
  const navigate = useNavigate();

  const pick = (prompt) => {
    onClose?.();
    navigate(`/app?q=${encodeURIComponent(prompt)}`);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="council-glow relative w-full max-w-lg overflow-hidden rounded-2xl border border-amber-500/30 bg-[#0a0a0b] p-6 shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-stone-500 transition hover:text-stone-200"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-700 shadow-[0_0_22px_rgba(245,158,11,0.35)]">
                <Hammer className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-emerald-300/80">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" /> Bridge connected
                </p>
                <h2 className="forge-title font-display text-xl font-bold tracking-wide text-[#FFF6E0]">
                  Lovelace is live in your editor
                </h2>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-stone-400">
              She can see your scene, run C# inside Unity, and write game code
              alongside you. Here's exactly how to prompt her for game-building steps:
            </p>

            <div className="mt-5 space-y-3">
              {TIPS.map((t) => (
                <div key={t.title} className="flex gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                  <t.icon className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/80" />
                  <div>
                    <p className="text-sm font-medium text-stone-200">{t.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-stone-500">{t.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-5 mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-500/80">
              <Sparkles className="h-3.5 w-3.5" /> Try one now
            </p>
            <div className="flex flex-col gap-2">
              {PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => pick(p)}
                  className="group flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-left text-sm text-stone-300 transition hover:border-amber-500/40 hover:bg-amber-500/[0.06] hover:text-amber-100"
                >
                  <span className="leading-snug">{p}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-stone-600 transition group-hover:translate-x-0.5 group-hover:text-amber-400" />
                </button>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
              <button
                onClick={onClose}
                className="text-sm text-stone-500 transition hover:text-stone-300"
              >
                Stay here
              </button>
              <button
                onClick={() => pick("")}
                className="flex items-center gap-1.5 rounded-lg border-0 bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-amber-500 hover:to-orange-500"
              >
                Open the Chat <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
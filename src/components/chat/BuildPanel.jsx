import React, { useState } from "react";
import { Box, ChevronRight, Check, ArrowUpRight, Play } from "lucide-react";
import { BUILD_STEPS } from "@/components/chat/buildSequence";

// The multi-step build outline, retained IN the chat so the user can scroll
// through it and push the next set of instructions to Unity as they go. Docks as
// a collapsible rail beside the message thread. It remembers which steps have
// been pushed this session and highlights the next one to fire.
export default function BuildPanel({ onSend, disabled }) {
  const [open, setOpen] = useState(true);
  const [pushed, setPushed] = useState([]); // step numbers already sent

  const nextStep = BUILD_STEPS.find((s) => !pushed.includes(s.n));

  const push = (step) => {
    if (disabled) return;
    onSend?.(step.prompt);
    setPushed((prev) => (prev.includes(step.n) ? prev : [...prev, step.n]));
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="absolute right-3 top-3 z-10 inline-flex items-center gap-2 rounded-full border border-blue-500/40 bg-blue-500/10 px-3.5 py-2 text-xs font-medium text-blue-100 shadow-lg transition hover:bg-blue-500/15 md:right-4 md:top-4"
      >
        <Box className="h-3.5 w-3.5 text-blue-400" />
        Build outline
      </button>
    );
  }

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-l border-white/5 bg-[#0a0a0b] lg:flex">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-stone-200">
          <Box className="h-4 w-4 text-blue-400" />
          Base44 logo build
        </span>
        <button
          onClick={() => setOpen(false)}
          className="text-stone-500 transition hover:text-stone-300"
          aria-label="Collapse build outline"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <p className="px-4 pt-3 text-[11px] leading-relaxed text-stone-500">
        Push each step to Unity in order. Scroll down and fire the next set when
        the previous one lands in your scene.
      </p>

      <ol className="flex-1 space-y-1.5 overflow-y-auto px-3 py-3">
        {BUILD_STEPS.map((s) => {
          const done = pushed.includes(s.n);
          const isNext = nextStep?.n === s.n;
          return (
            <li key={s.n}>
              <button
                onClick={() => push(s)}
                disabled={disabled}
                className={`group flex w-full items-start gap-3 rounded-lg px-2.5 py-2 text-left transition disabled:opacity-50 ${
                  isNext
                    ? "bg-blue-500/10 ring-1 ring-blue-500/40"
                    : "hover:bg-blue-500/10"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                    done
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-blue-500/15 text-blue-300"
                  }`}
                >
                  {done ? <Check className="h-3 w-3" /> : s.n}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-stone-200 group-hover:text-blue-100">
                    {s.label}
                    {isNext && (
                      <ArrowUpRight className="h-3.5 w-3.5 text-blue-400" />
                    )}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-stone-500">
                    {s.prompt}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <p className="flex items-center gap-1.5 border-t border-white/5 px-4 py-2.5 text-[11px] text-stone-600">
        <Play className="h-3 w-3 text-blue-400/70" />
        Unity must be connected (Connect Unity).
      </p>
    </aside>
  );
}
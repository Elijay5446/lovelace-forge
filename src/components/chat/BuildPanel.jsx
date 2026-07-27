import React, { useState } from "react";
import { Box, ChevronRight, Check, ArrowUpRight, Play, Loader2, Square, Sparkles, AlertTriangle } from "lucide-react";
import { BUILD_STEPS } from "@/components/chat/buildSequence";

// The multi-step build outline, retained IN the chat so the user can watch and
// control the whole Base44 logo build. The hero action is one click — "Build &
// Animate" — which auto-runs every step: each appears in the chat as Lovelace
// narrates it AND executes live in Unity, in order. Users can also push any
// single step manually. Docks as a collapsible rail beside the message thread.
export default function BuildPanel({ onSend, onRunAll, onStop, autoRun, disabled }) {
  const [open, setOpen] = useState(true);
  const [pushed, setPushed] = useState([]); // manually pushed step numbers

  const running = autoRun?.active;
  const current = autoRun?.current || 0;
  const failedAt = autoRun?.failedAt || null;

  const push = (step) => {
    if (disabled || running) return;
    onSend?.(step.prompt);
    setPushed((prev) => (prev.includes(step.n) ? prev : [...prev, step.n]));
  };

  // A step is "done" if it was manually pushed, or the auto-run has moved past it.
  const isDone = (n) => pushed.includes(n) || (current > n && !(failedAt === n));
  const isActive = (n) => running && current === n;
  const nextManual = BUILD_STEPS.find((s) => !pushed.includes(s.n));

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
    <aside className="hidden w-80 shrink-0 flex-col border-l border-white/5 bg-[#0a0a0b] lg:flex">
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

      {/* HERO: one click runs the entire demo end to end. */}
      <div className="border-b border-white/5 px-4 py-4">
        {running ? (
          <button
            onClick={onStop}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100 transition hover:bg-red-500/20"
          >
            <Square className="h-4 w-4" /> Stop the build
          </button>
        ) : (
          <button
            onClick={onRunAll}
            disabled={disabled}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_28px_rgba(37,99,235,0.4)] transition hover:from-blue-500 hover:to-cyan-400 hover:shadow-[0_0_40px_rgba(37,99,235,0.6)] disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" /> Build &amp; Animate the Base44 Logo
          </button>
        )}
        <p className="mt-2 text-center text-[11px] leading-relaxed text-stone-500">
          {running
            ? `Building step ${current} of ${BUILD_STEPS.length} — watch it assemble in Unity.`
            : "One click builds the whole scene live — each step narrated in chat and executed in Unity."}
        </p>
        {failedAt && !running && (
          <p className="mt-2 flex items-start gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/5 px-2.5 py-2 text-[11px] leading-snug text-amber-200">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Stopped at step {failedAt}. Check Unity is connected, then press Build again to retry.
          </p>
        )}
      </div>

      <p className="px-4 pt-3 text-[11px] leading-relaxed text-stone-500">
        Or push steps one at a time to Unity — scroll and fire the next when the
        previous lands.
      </p>

      <ol className="flex-1 space-y-1.5 overflow-y-auto px-3 py-3">
        {BUILD_STEPS.map((s) => {
          const done = isDone(s.n);
          const active = isActive(s.n);
          const failed = failedAt === s.n;
          const isNext = !running && nextManual?.n === s.n;
          return (
            <li key={s.n}>
              <button
                onClick={() => push(s)}
                disabled={disabled || running}
                className={`group flex w-full items-start gap-3 rounded-lg px-2.5 py-2 text-left transition disabled:cursor-default ${
                  active
                    ? "bg-blue-500/15 ring-1 ring-blue-400/60"
                    : isNext
                    ? "bg-blue-500/10 ring-1 ring-blue-500/40"
                    : "hover:bg-blue-500/10"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                    failed
                      ? "bg-red-500/20 text-red-300"
                      : done
                      ? "bg-emerald-500/20 text-emerald-300"
                      : active
                      ? "bg-blue-500/30 text-blue-100"
                      : "bg-blue-500/15 text-blue-300"
                  }`}
                >
                  {active ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : failed ? (
                    <AlertTriangle className="h-3 w-3" />
                  ) : done ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    s.n
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-stone-200">
                    {s.label}
                    {isNext && <ArrowUpRight className="h-3.5 w-3.5 text-blue-400" />}
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
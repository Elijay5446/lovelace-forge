import React from "react";
import { Brain, MessageSquare, Code2, ListChecks } from "lucide-react";

const EXAMPLES = [
  { icon: MessageSquare, text: "How do I add a new character to UFE2?" },
  { icon: Code2, text: "Generate a C# script that spawns a projectile" },
  { icon: ListChecks, text: "Give me a build plan for a 2-round match timer" },
];

export default function EmptyState({ onPrefill }) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-10">
      <div className="w-full max-w-xl text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-700 shadow-[0_0_30px_rgba(245,158,11,0.25)]">
          <Brain className="h-7 w-7 text-white" />
        </div>
        <h1 className="forge-title font-display text-3xl font-bold tracking-[0.04em] text-[#FFF6E0]">
          Welcome to the Forge
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-stone-400">
          I'm Lovelace — your AI companion for Unity &amp; UFE2 fighting games.
          Ask me anything about rigging, hitboxes, movesets, or AI config. Or,
          for a tough call,{" "}
          <span className="text-amber-300">consult the council</span> and I'll
          synthesize the best answer.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-2.5">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.text}
              onClick={() => onPrefill?.(ex.text)}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-stone-300 transition hover:border-amber-500/40 hover:bg-amber-500/[0.06] hover:text-amber-100"
            >
              <ex.icon className="h-3.5 w-3.5 shrink-0 text-amber-400/70" />
              {ex.text}
            </button>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-stone-600">
          Tap a prompt to drop it into the composer.
        </p>
      </div>
    </div>
  );
}
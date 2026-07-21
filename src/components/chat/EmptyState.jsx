import React from "react";
import { Brain, Boxes, Zap, Cpu } from "lucide-react";

const EXAMPLES = [
  { icon: Boxes, text: "How do I set up hitboxes for a UFE2 character?" },
  { icon: Zap, text: "Walk me through the Meshy → Mixamo → Unity rigging pipeline." },
  { icon: Cpu, text: "Write a C# helper to log UFE2 move states." },
];

export default function EmptyState({ onSend }) {
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
        <div className="mt-7 grid gap-2.5">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.text}
              onClick={() => onSend(ex.text)}
              className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 text-left text-sm text-stone-300 transition hover:border-amber-500/30 hover:bg-amber-500/[0.04]"
            >
              <ex.icon className="h-4 w-4 shrink-0 text-amber-400/70" />
              {ex.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
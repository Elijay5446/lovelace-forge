import React from "react";
import { Brain } from "lucide-react";

export default function MessageBubble({ message }) {
  const { role, content } = message;

  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-white/[0.08] px-4 py-2.5 text-sm text-stone-200">
          <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
        </div>
      </div>
    );
  }

  if (role === "consult_synthesis") {
    return (
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/[0.06] px-4 py-3.5 shadow-[0_0_24px_rgba(245,158,11,0.12)]">
        <div className="mb-2 flex items-center gap-2 text-amber-300">
          <Brain className="h-4 w-4" />
          <span className="font-display text-xs font-semibold uppercase tracking-[0.18em]">
            Council Synthesis
          </span>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-100">
          {content}
        </p>
      </div>
    );
  }

  // assistant (default)
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%]">
        <span className="mb-1 ml-1 inline-block text-[11px] font-medium tracking-wide text-amber-400/80">
          Lovelace
        </span>
        <div className="rounded-2xl rounded-bl-sm border border-amber-500/15 bg-amber-500/[0.04] px-4 py-2.5 text-sm text-stone-100">
          <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
        </div>
      </div>
    </div>
  );
}
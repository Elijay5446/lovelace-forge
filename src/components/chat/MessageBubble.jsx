import React from "react";
import { Brain } from "lucide-react";
import MessageContent from "./MessageContent";

function parseProviders(message) {
  const src = message?.model_source || "";
  if (src.startsWith("lovelace-synthesis") && src.includes("||")) {
    return src
      .split("||")[1]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

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
    const providers = parseProviders(message);
    return (
      <div className="council-glow rounded-xl border border-amber-500/40 bg-amber-500/[0.06] px-4 py-3.5">
        <div className="mb-2 flex items-center gap-2 text-amber-300">
          <Brain className="h-4 w-4" />
          <span className="font-display text-xs font-semibold uppercase tracking-[0.18em]">
            Council Synthesis
          </span>
        </div>
        <MessageContent content={content} />
        <div className="mt-2.5 border-t border-amber-500/15 pt-2 text-[11px] text-amber-400/70">
          {providers.length > 0 ? (
            <>
              Synthesized from {providers.length} model{providers.length === 1 ? "" : "s"} ·{" "}
              <span className="text-amber-300/90">{providers.join(" · ")}</span>
            </>
          ) : (
            <>Synthesized by the Lovelace council</>
          )}
        </div>
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
          <MessageContent content={content} />
        </div>
      </div>
    </div>
  );
}
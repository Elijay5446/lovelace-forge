import React from "react";

export default function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div>
        <span className="mb-1 ml-1 inline-block text-[11px] font-medium tracking-wide text-amber-400/80">
          Lovelace
        </span>
        <div className="inline-flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-amber-500/15 bg-amber-500/[0.04] px-4 py-3.5">
          <Dot delay="0s" />
          <Dot delay="0.18s" />
          <Dot delay="0.36s" />
        </div>
      </div>
    </div>
  );
}

const Dot = ({ delay = "0s" }) => (
  <span
    className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-400/70"
    style={{ animationDelay: delay, animationDuration: "1s" }}
  />
);
import React, { useState } from "react";
import { Box, ChevronDown, Play } from "lucide-react";
import { BUILD_STEPS as STEPS } from "@/components/chat/buildSequence";

// The empty-state teaser for the curated 1→10 Base44 logo build. Once a
// conversation starts, the same outline lives on in the chat via BuildPanel, so
// it authors from the shared buildSequence and never disappears mid-session.

export default function LogoSequence({ onPrefill }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto mt-6 w-full max-w-md text-left">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-blue-500/40 bg-blue-500/5 px-5 py-2.5 text-sm font-medium text-blue-100 transition hover:border-blue-400/70 hover:bg-blue-500/10 hover:shadow-[0_0_22px_rgba(37,99,235,0.2)]"
      >
        <Box className="h-4 w-4 text-blue-400" />
        Build & animate the Base44 logo
        <ChevronDown
          className={`h-4 w-4 text-blue-400/70 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="mt-3 rounded-xl border border-white/10 bg-[#0a0a0b] p-3">
          <p className="px-1 pb-2 text-[11px] leading-relaxed text-stone-500">
            Fire these in order — each is one message to Lovelace. Steps 1–9 build
            the logo live in your scene; step 10 writes a spin script, attaches it,
            then you press <span className="text-stone-300">Play</span>.
          </p>
          <ol className="space-y-1.5">
            {STEPS.map((s) => (
              <li key={s.n}>
                <button
                  onClick={() => onPrefill?.(s.prompt)}
                  className="group flex w-full items-start gap-3 rounded-lg px-2.5 py-2 text-left transition hover:bg-blue-500/10"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-[11px] font-semibold text-blue-300">
                    {s.n}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-stone-200 group-hover:text-blue-100">
                      {s.label}
                    </span>
                    <span className="block truncate text-[11px] text-stone-500">
                      {s.prompt}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <p className="mt-2 flex items-center gap-1.5 px-1 text-[11px] text-stone-600">
            <Play className="h-3 w-3 text-blue-400/70" />
            Make sure Unity is connected first (Connect Unity page).
          </p>
        </div>
      )}
    </div>
  );
}
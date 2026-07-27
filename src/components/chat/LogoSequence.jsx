import React, { useState } from "react";
import { Box, ChevronDown, Play } from "lucide-react";

// A curated 1→10 chat sequence that renders and then animates a Base44 logo in
// the user's live Unity scene, using only what the v1.6.0 bridge can actually
// do (create/scale/position/color primitives, lights, camera framing, and
// create+attach a spin script). Each step is one chat message — the user fires
// them in order, clicking to drop the text into the composer.
const STEPS = [
  {
    n: 1,
    label: "Set the stage",
    prompt:
      "Create a plane named 'Floor' at 0,0,0, scale it to 4,1,4, and color it very dark gray (#111114).",
  },
  {
    n: 2,
    label: "First logo block",
    prompt:
      "Create a cube named 'Logo_A' at -1.1,1.4,0, scale it to 0.9,0.9,0.9, and color it Base44 blue (#2563EB).",
  },
  {
    n: 3,
    label: "Second logo block",
    prompt:
      "Create a cube named 'Logo_B' at 0,1.4,0, scale it to 0.9,0.9,0.9, and color it Base44 blue (#2563EB).",
  },
  {
    n: 4,
    label: "Third logo block",
    prompt:
      "Create a cube named 'Logo_C' at 1.1,1.4,0, scale it to 0.9,0.9,0.9, and color it Base44 blue (#2563EB).",
  },
  {
    n: 5,
    label: "Accent block",
    prompt:
      "Create a cube named 'Logo_Accent' at 0,2.5,0, scale it to 0.9,0.9,0.9, and color it bright cyan (#22D3EE).",
  },
  {
    n: 6,
    label: "Group the logo",
    prompt:
      "Create an empty GameObject named 'Base44Logo' at 0,1.4,0, then parent Logo_A, Logo_B, Logo_C, and Logo_Accent under it.",
  },
  {
    n: 7,
    label: "Key spotlight",
    prompt:
      "Create a spot light named 'KeyLight' at 0,5,-4, color warm white (#FFF3E0), intensity 6, and rotate it to euler 55,0,0 so it points at the logo.",
  },
  {
    n: 8,
    label: "Rim glow",
    prompt:
      "Create a point light named 'RimLight' at 0,2,4, color Base44 blue (#2563EB), intensity 4.",
  },
  {
    n: 9,
    label: "Frame the shot",
    prompt: "Frame the Scene view camera on Base44Logo.",
  },
  {
    n: 10,
    label: "Animate it spinning",
    prompt:
      "Write a C# MonoBehaviour named 'LogoSpin' that rotates its transform 40 degrees per second around the Y axis in Update, then wait for Unity to finish compiling and attach LogoSpin to Base44Logo. Tell me when to press Play.",
  },
];

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
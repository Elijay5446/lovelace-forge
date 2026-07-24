import React from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const TOP_REQUESTS = [
  "What's in my open Unity scene right now?",
  "Generate a C# player controller with double-jump",
  "Break down how to build a save/load system",
  "Design an enemy AI with patrol, chase, and attack states",
  "Write a script that spawns enemies in waves",
  "Review my scene setup and suggest improvements",
  "Optimize my game — where do I start with profiling?",
  "Build an inventory system with drag-and-drop UI",
];

export default function EmptyState({ onPrefill }) {
  return (
    <div className="forge-atmosphere relative flex flex-1 items-center justify-center px-6 py-10">
      <div className="w-full max-w-xl text-center">
        <h1 className="forge-title font-display text-3xl font-bold tracking-[0.04em] text-[#FFF6E0]">
          Welcome to the Forge
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-stone-400">
          I'm Lovelace — your AI companion for Unity game development. Ask me
          anything, from gameplay systems and C# to shaders, physics, and
          performance. Or, for a tough call,{" "}
          <span className="text-amber-300">consult the council</span> and I'll
          synthesize the best answer.
        </p>

        <div className="mt-7 flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/5 px-5 py-2.5 text-sm font-medium text-amber-100 transition hover:border-amber-400/70 hover:bg-amber-500/10 hover:shadow-[0_0_22px_rgba(245,158,11,0.18)]">
                <Sparkles className="h-4 w-4 text-amber-400" />
                Popular requests
                <ChevronDown className="h-4 w-4 text-amber-400/70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="center"
              className="w-[min(92vw,380px)] border-white/10 bg-[#0a0a0b] text-stone-300"
            >
              <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                Top game-dev requests
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/5" />
              {TOP_REQUESTS.map((req) => (
                <DropdownMenuItem
                  key={req}
                  onClick={() => onPrefill?.(req)}
                  className="cursor-pointer py-2.5 text-sm focus:bg-amber-500/10 focus:text-amber-100"
                >
                  {req}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="mt-4 text-[11px] text-stone-600">
          Pick a request to drop it into the composer.
        </p>
      </div>
    </div>
  );
}
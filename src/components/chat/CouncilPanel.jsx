import React from "react";
import { X, Brain, Sparkles, Loader2 } from "lucide-react";
import CouncilCard from "./CouncilCard";

export default function CouncilPanel({ consult, onSynthesize, onClose }) {
  const responses = consult.responses || [];
  const allDone =
    consult.done ||
    (responses.length > 0 &&
      responses.every((r) => r.status === "completed" || r.status === "failed"));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-amber-500/25 bg-[#0c0c0e] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-3.5">
          <div className="flex items-center gap-2 text-amber-300">
            <Brain className="h-4 w-4" />
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.16em]">
              Consult the Council
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-stone-500 transition hover:text-stone-200"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-4">
          {consult.error ? (
            <p className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-3 text-sm text-red-300">
              {consult.error}
            </p>
          ) : (
            <div className="space-y-3">
              {responses.map((r) => (
                <CouncilCard key={r.id} response={r} />
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-white/5 px-5 py-3.5">
          {allDone && !consult.error ? (
            <button
              onClick={onSynthesize}
              disabled={consult.synthesizing}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2.5 text-sm font-medium text-white transition hover:from-amber-500 hover:to-orange-500 disabled:opacity-60"
            >
              {consult.synthesizing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Synthesizing…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Synthesize Best Answer
                </>
              )}
            </button>
          ) : !consult.error ? (
            <p className="text-center text-xs text-stone-500">
              The council is deliberating… answers appear as each model finishes.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
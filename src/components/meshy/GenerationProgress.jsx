import React, { useEffect, useState } from "react";
import { Check, Loader2, XCircle } from "lucide-react";
import { Image } from "@/components/ui/image";

const STEPS = [
  { key: "uploading", label: "Uploading Image" },
  { key: "3d_generating", label: "Generating 3D Model" },
  { key: "rigging", label: "Auto-Rigging" },
  { key: "complete", label: "Complete" },
];

// Maps job status → index of the step currently in progress.
const stageIndex = (status) => {
  switch (status) {
    case "uploading": return 0;
    case "3d_generating": return 1;
    case "3d_complete":
    case "rigging": return 2;
    case "complete": return 3;
    default: return 1;
  }
};

// Section 3: live stepper while Meshy generates + rigs the character.
export default function GenerationProgress({ job, progress, startedAt, onCancel }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const failed = job?.status === "failed";
  const current = stageIndex(job?.status);
  const elapsed = Math.max(0, Math.floor((now - (startedAt || now)) / 1000));
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-stone-100">
          Forging “{job?.character_name}”
        </h3>
        <span className="text-xs tabular-nums text-stone-500">
          {mins}:{String(secs).padStart(2, "0")} elapsed
        </span>
      </div>

      <ol className="mt-4 space-y-3">
        {STEPS.map((s, i) => {
          const done = job?.status === "complete" ? true : i < current;
          const active = !failed && i === current && job?.status !== "complete";
          return (
            <li key={s.key} className="flex items-center gap-3">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  done
                    ? "bg-emerald-500/20 text-emerald-400"
                    : active
                    ? "bg-amber-500/20 text-amber-400"
                    : failed && i === current
                    ? "bg-red-500/20 text-red-400"
                    : "bg-white/5 text-stone-600"
                }`}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5" />
                ) : active ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : failed && i === current ? (
                  <XCircle className="h-3.5 w-3.5" />
                ) : (
                  <span className="text-[10px]">{i + 1}</span>
                )}
              </span>
              <div className="flex-1">
                <p className={`text-sm ${done || active ? "text-stone-200" : "text-stone-500"}`}>
                  {s.label}
                </p>
                {active && typeof progress === "number" && progress > 0 && (
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                )}
              </div>
              {active && typeof progress === "number" && progress > 0 && (
                <span className="text-xs tabular-nums text-amber-400">{Math.min(100, progress)}%</span>
              )}
            </li>
          );
        })}
      </ol>

      {job?.thumbnail_url && (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-white/10 bg-black/30 p-3">
          <Image src={job.thumbnail_url} alt="3D model preview" className="h-20 w-20 rounded-lg" />
          <p className="text-xs text-stone-400">3D model preview from Meshy</p>
        </div>
      )}

      {failed && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {job?.error_message || "Generation failed. Please try again with a different image."}
        </p>
      )}

      {job?.status !== "complete" && (
        <button
          onClick={onCancel}
          className="mt-4 rounded-lg border border-white/10 px-4 py-2 text-xs text-stone-400 transition hover:border-red-500/40 hover:text-red-300"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
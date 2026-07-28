import React from "react";
import { Link } from "react-router-dom";
import { Footprints, Gauge, PersonStanding } from "lucide-react";
import { Image } from "@/components/ui/image";

// Section 5: side-by-side original image vs 3D result, plus character details.
export default function ResultSummary({ job }) {
  return (
    <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.04] p-5">
      <h3 className="font-display text-lg font-semibold text-stone-100">
        “{job.character_name}” is alive in Unity
      </h3>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <figure>
          <div className="overflow-hidden rounded-lg border border-white/10 bg-black/40">
            {job.image_url ? (
              <Image src={job.image_url} alt="Original 2D character" className="aspect-square w-full" fittingType="fit" />
            ) : (
              <div className="flex aspect-square items-center justify-center text-xs text-stone-600">No image</div>
            )}
          </div>
          <figcaption className="mt-1.5 text-center text-xs text-stone-500">Original 2D image</figcaption>
        </figure>
        <figure>
          <div className="overflow-hidden rounded-lg border border-white/10 bg-black/40">
            {job.unity_screenshot_url || job.thumbnail_url ? (
              <Image
                src={job.unity_screenshot_url || job.thumbnail_url}
                alt="3D character result"
                className="aspect-square w-full"
                fittingType="fit"
              />
            ) : (
              <div className="flex aspect-square items-center justify-center text-xs text-stone-600">No preview</div>
            )}
          </div>
          <figcaption className="mt-1.5 text-center text-xs text-stone-500">
            {job.unity_screenshot_url ? "In Unity" : "3D model preview"}
          </figcaption>
        </figure>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 p-2.5 text-xs text-stone-300">
          <PersonStanding className="h-4 w-4 shrink-0 text-amber-400" /> Humanoid rig · 2K PBR textures
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 p-2.5 text-xs text-stone-300">
          <Footprints className="h-4 w-4 shrink-0 text-amber-400" /> Walking + Running animations
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 p-2.5 text-xs text-stone-300">
          <Gauge className="h-4 w-4 shrink-0 text-amber-400" />
          {typeof job.consumed_credits === "number" ? `${job.consumed_credits} Meshy credits used` : "Credits: —"}
        </div>
      </div>

      <Link
        to="/app"
        className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-sm text-stone-300 transition hover:border-amber-500/40 hover:text-amber-200"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
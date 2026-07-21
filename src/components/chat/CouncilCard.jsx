import React from "react";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function CouncilCard({ response }) {
  const { provider, model_id, status, content } = response;
  const pending = status === "pending" || status === "streaming";

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3.5">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-stone-200">
          {provider || model_id}
        </span>
        {status === "completed" && <CheckCircle2 className="h-4 w-4 text-emerald-400/80" />}
        {status === "failed" && <AlertCircle className="h-4 w-4 text-red-400/80" />}
        {pending && <Loader2 className="h-4 w-4 animate-spin text-amber-400/70" />}
      </div>

      {status === "completed" ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-300">
          {content}
        </p>
      ) : status === "failed" ? (
        <p className="text-sm text-red-300/80">
          {content || "This council member could not respond."}
        </p>
      ) : (
        <p className="text-sm text-stone-600">Thinking…</p>
      )}
    </div>
  );
}
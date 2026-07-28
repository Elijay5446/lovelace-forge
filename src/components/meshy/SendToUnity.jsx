import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { importCharacter } from "@/components/meshy/importCharacter";
import { AlertTriangle, Check, Download, Loader2, RotateCcw, Send } from "lucide-react";

// Section 4: ship the rigged character into the user's live Unity editor.
// The bridge exposes a first-class `character.import` command (bridge v1.10+):
// it downloads the FBX on a background thread and finishes the AssetDatabase
// import on Unity's main thread — no generated C#, no recompile, no domain
// reload, and real errors come straight back to this screen.
export default function SendToUnity({ job, onSent, onReset }) {
  const [bridgeOk, setBridgeOk] = useState(null); // null = checking
  const [sending, setSending] = useState(false);
  const [phase, setPhase] = useState("");
  const [sent, setSent] = useState(!!job.sent_to_unity);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const sessions = await base44.entities.BridgeSession.filter({});
        setBridgeOk((sessions || []).some((s) => s.status === "connected"));
      } catch {
        setBridgeOk(false);
      }
    })();
  }, []);

  const handleSend = async () => {
    if (sending) return;
    setSending(true);
    setError("");
    try {
      await importCharacter(
        {
          jobId: job.id,
          name: job.character_name,
          fbx: job.rigged_fbx_url,
          walk: job.walking_fbx_url,
          run: job.running_fbx_url,
        },
        setPhase
      );
      await base44.entities.MeshyJob.update(job.id, { sent_to_unity: true });
      setSent(true);
      onSent?.();
    } catch (e) {
      setError(e?.message || "Send failed.");
    } finally {
      setSending(false);
      setPhase("");
    }
  };

  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
      <h3 className="font-display text-base font-semibold text-stone-100">Send to Unity</h3>

      {bridgeOk === null ? (
        <div className="mt-3 flex items-center gap-2 text-sm text-stone-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking Unity bridge…
        </div>
      ) : !bridgeOk ? (
        <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/[0.06] p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <p className="text-sm text-stone-300">
            Your Unity bridge isn't connected.{" "}
            <Link to="/app/unity" className="font-semibold text-amber-300 underline-offset-2 hover:underline">
              Open the Connect page
            </Link>{" "}
            to link your editor, then come back.
          </p>
        </div>
      ) : sent ? (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.08] p-3 text-sm text-emerald-300">
          <Check className="h-4 w-4" /> “{job.character_name}” is in your Unity scene — rigged, textured, and facing the camera.
        </div>
      ) : (
        <div className="mt-3">
          <button
            onClick={handleSend}
            disabled={sending}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:from-amber-500 hover:to-orange-500 disabled:opacity-60"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sending ? "Sending to Unity…" : "Send to Unity"}
          </button>
          {phase && <p className="mt-2.5 text-xs text-stone-400">{phase}</p>}
          <p className="mt-2 text-[11px] text-stone-600">
            Requires Forge Bridge v1.12 or newer — re-download it from the Connect page if the import
            says the command is unknown.
          </p>
        </div>
      )}

      {error && <p className="mt-3 whitespace-pre-wrap text-sm text-red-400">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-white/5 pt-4">
        {job.rigged_fbx_url && (
          <a
            href={job.rigged_fbx_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-xs text-stone-300 transition hover:border-amber-500/40 hover:text-amber-200"
          >
            <Download className="h-3.5 w-3.5" /> Download FBX
          </a>
        )}
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-xs text-stone-300 transition hover:border-amber-500/40 hover:text-amber-200"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Create Another Character
        </button>
      </div>
    </div>
  );
}
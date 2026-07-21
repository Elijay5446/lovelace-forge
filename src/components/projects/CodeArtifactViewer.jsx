import React, { useState } from "react";
import { Copy, Check, Trash2, X, Loader2, FileCode2 } from "lucide-react";

export default function CodeArtifactViewer({ artifact, onClose, onDelete }) {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(artifact.content || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete?.();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0b] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <FileCode2 className="h-4 w-4 shrink-0 text-amber-400" />
            <h3 className="truncate font-display text-sm font-semibold text-stone-200">
              {artifact.name}
            </h3>
            <span className="shrink-0 rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-stone-400">
              {artifact.language}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs text-stone-500 transition hover:bg-red-500/10 hover:text-red-400"
            >
              {deleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/5 px-2.5 py-1.5 text-xs font-medium text-amber-200 transition hover:bg-amber-500/10"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copy
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-stone-500 transition hover:bg-white/5 hover:text-stone-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Explanation */}
        {artifact.description && (
          <p className="border-b border-white/5 px-5 py-3 text-sm leading-relaxed text-stone-400">
            {artifact.description}
          </p>
        )}

        {/* Code */}
        <pre className="flex-1 overflow-auto bg-black/40 p-5 font-mono text-[13px] leading-relaxed text-stone-200">
          <code>{artifact.content || "// No code generated."}</code>
        </pre>
      </div>
    </div>
  );
}
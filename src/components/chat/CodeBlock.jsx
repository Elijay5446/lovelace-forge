import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="my-2 overflow-hidden rounded-lg border border-white/10 bg-black/50">
      <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wide text-stone-500">
          {lang || "code"}
        </span>
        <button
          onClick={copy}
          className="flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-amber-200 transition hover:bg-amber-500/10"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" /> Copied!
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" /> Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-[12.5px] leading-relaxed text-stone-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}
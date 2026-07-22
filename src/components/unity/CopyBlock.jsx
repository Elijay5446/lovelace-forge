import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyBlock({ code }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-lg border border-white/10 bg-black/40">
      <button
        onClick={copy}
        className="absolute right-2 top-2 flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-medium text-stone-400 opacity-0 transition hover:text-amber-300 group-hover:opacity-100"
      >
        {copied ? (
          <>
            <Check className="h-3 w-3" /> Copied
          </>
        ) : (
          <>
            <Copy className="h-3 w-3" /> Copy
          </>
        )}
      </button>
      <pre className="overflow-x-auto p-4 pr-16 font-mono text-[12.5px] leading-relaxed text-stone-300">
        <code>{code}</code>
      </pre>
    </div>
  );
}
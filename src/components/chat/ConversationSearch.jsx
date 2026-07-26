import React from "react";
import { Search, X } from "lucide-react";

export default function ConversationSearch({ value, onChange }) {
  return (
    <div className="px-3 pb-2">
      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2 transition focus-within:border-amber-500/40">
        <Search className="h-3.5 w-3.5 shrink-0 text-stone-500" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search chats…"
          className="w-full bg-transparent text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            aria-label="Clear search"
            className="shrink-0 text-stone-500 transition hover:text-stone-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
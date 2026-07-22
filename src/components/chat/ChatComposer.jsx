import React from "react";
import { Send, Brain } from "lucide-react";

export default function ChatComposer({ value, onChange, onSend, onConsult, disabled, inputRef }) {
  const submit = () => {
    const t = (value || "").trim();
    if (!t || disabled) return;
    onSend(t);
    onChange("");
  };

  const consult = () => {
    const t = (value || "").trim();
    if (!t || disabled) return;
    onConsult(t);
    onChange("");
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="border-t border-white/5 bg-[#0a0a0b] px-4 py-3 md:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2 transition focus-within:border-amber-500/40">
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKey}
            disabled={disabled}
            rows={1}
            placeholder="Ask Lovelace about Unity, UFE2, rigging, movesets…"
            className="max-h-40 min-h-[2.5rem] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none"
          />
          <button
            onClick={consult}
            disabled={disabled || !(value || "").trim()}
            title="Consult the Council"
            className="flex h-9 items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 text-xs font-medium text-amber-100 transition hover:bg-amber-500/20 disabled:opacity-40"
          >
            <Brain className="h-3.5 w-3.5" /> Council
          </button>
          <button
            onClick={submit}
            disabled={disabled || !(value || "").trim()}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-3 text-xs font-medium text-white transition hover:from-amber-500 hover:to-orange-500 disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" /> Send
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-stone-600">
          Enter to send · Shift+Enter for newline
        </p>
      </div>
    </div>
  );
}
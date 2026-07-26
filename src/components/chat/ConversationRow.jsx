import React, { useState, useRef, useEffect } from "react";
import { MoreVertical, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";

export default function ConversationRow({ convo, active, onSelect, onRename, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [draft, setDraft] = useState(convo.title || "");
  const [busy, setBusy] = useState(false);
  const menuRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  useEffect(() => {
    if (editing) setTimeout(() => inputRef.current?.select(), 0);
  }, [editing]);

  const startRename = () => {
    setDraft(convo.title || "");
    setEditing(true);
    setMenuOpen(false);
  };

  const commitRename = async () => {
    const next = draft.trim();
    if (!next || next === convo.title) {
      setEditing(false);
      return;
    }
    setBusy(true);
    try {
      await onRename(convo.id, next);
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await onDelete(convo.id);
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };

  if (editing) {
    return (
      <div className="mb-1 flex items-center gap-1.5 rounded-lg bg-white/5 px-2 py-2">
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") setEditing(false);
          }}
          className="w-full rounded bg-black/40 px-2 py-1 text-sm text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
        />
        <button onClick={commitRename} disabled={busy} aria-label="Save" className="shrink-0 text-emerald-400 hover:text-emerald-300">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        </button>
        <button onClick={() => setEditing(false)} aria-label="Cancel" className="shrink-0 text-stone-500 hover:text-stone-300">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (confirming) {
    return (
      <div className="mb-1 rounded-lg border border-red-500/30 bg-red-500/[0.06] px-3 py-2.5">
        <p className="text-xs text-stone-300">Delete this chat?</p>
        <div className="mt-2 flex gap-2">
          <button
            onClick={confirmDelete}
            disabled={busy}
            className="flex items-center gap-1 rounded bg-red-600 px-2 py-1 text-xs font-medium text-white transition hover:bg-red-500 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />} Delete
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="rounded bg-white/10 px-2 py-1 text-xs text-stone-300 transition hover:bg-white/15"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group relative mb-1 flex items-center rounded-lg transition ${
        active ? "bg-white/10" : "hover:bg-white/5"
      }`}
    >
      <button onClick={() => onSelect(convo.id)} className="min-w-0 flex-1 px-3 py-2.5 text-left">
        <p className="truncate text-sm font-medium text-stone-200">
          {convo.title || "New conversation"}
        </p>
        <p className="mt-0.5 truncate text-xs text-stone-500">
          {convo.last_message_preview || "—"}
        </p>
      </button>

      <div className="relative pr-1" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Conversation options"
          className={`rounded p-1.5 text-stone-500 transition hover:bg-white/10 hover:text-stone-200 ${
            menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          <MoreVertical className="h-4 w-4" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-8 z-20 w-36 overflow-hidden rounded-lg border border-white/10 bg-[#141416] py-1 shadow-xl">
            <button
              onClick={startRename}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-stone-300 transition hover:bg-white/5"
            >
              <Pencil className="h-3.5 w-3.5" /> Rename
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                setConfirming(true);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 transition hover:bg-red-500/10"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
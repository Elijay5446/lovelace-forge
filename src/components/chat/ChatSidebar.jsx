import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Plus, Loader2, LogOut, Cable, MessageSquare } from "lucide-react";
import { ConversationListSkeleton } from "@/components/Skeletons";

export default function ChatSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  loading,
  user,
  onLogout,
  mobileNav,
  className = "",
}) {
  const { pathname } = useLocation();
  return (
    <aside
      className={`flex w-72 shrink-0 flex-col border-r border-white/5 bg-[#0a0a0b] ${className}`}
    >
      <div className="p-3">
        <button
          onClick={onNew}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2.5 text-sm font-medium text-amber-100 transition hover:border-amber-400/70 hover:bg-amber-500/10"
        >
          <Plus className="h-4 w-4" /> New Conversation
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {loading ? (
          <ConversationListSkeleton />
        ) : conversations.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-stone-600">
            No conversations yet.
          </p>
        ) : (
          conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`mb-1 w-full rounded-lg px-3 py-2.5 text-left transition ${
                activeId === c.id ? "bg-white/10" : "hover:bg-white/5"
              }`}
            >
              <p className="truncate text-sm font-medium text-stone-200">
                {c.title || "New conversation"}
              </p>
              <p className="mt-0.5 truncate text-xs text-stone-500">
                {c.last_message_preview || "—"}
              </p>
            </button>
          ))
        )}
      </div>

      <nav className="space-y-1 border-t border-white/5 p-3">
        <span className="mb-1 block px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-600">
          Workspace
        </span>
        <Link
          to="/app"
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
            pathname === "/app"
              ? "bg-white/10 text-stone-100"
              : "text-stone-400 hover:bg-white/5 hover:text-stone-200"
          }`}
        >
          <MessageSquare className="h-4 w-4" /> Chat
        </Link>
        <Link
          to="/app/unity"
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
            pathname.startsWith("/app/unity")
              ? "bg-white/10 text-stone-100"
              : "text-stone-400 hover:bg-white/5 hover:text-stone-200"
          }`}
        >
          <Cable className="h-4 w-4" /> Connect Unity
        </Link>
      </nav>

      <div className="flex items-center justify-between border-t border-white/5 p-3">
        <span className="truncate text-xs text-stone-500">{user?.email}</span>
        <button
          onClick={onLogout}
          className="text-stone-500 transition hover:text-stone-200"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}

const NavComing = ({ icon: Icon, label }) => (
  <div className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-stone-600">
    <span className="flex items-center gap-2.5">
      <Icon className="h-4 w-4" />
      {label}
    </span>
    <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-stone-500">
      soon
    </span>
  </div>
);
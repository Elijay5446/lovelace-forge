import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, Hammer } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const NAV = [
  { to: "/app", label: "Chat", emoji: "💬", match: (p) => p === "/app" },
  { to: "/app/projects", label: "Projects", emoji: "🗂️", match: (p) => p.startsWith("/app/projects") },
  { to: "/app/unity", label: "Connect Unity", emoji: "🌉", match: (p) => p.startsWith("/app/unity") },
  { to: "/app/capabilities", label: "Capabilities", emoji: "⚡", match: (p) => p.startsWith("/app/capabilities") },
];

export default function GlobalNav() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  // Close on navigation and on Escape.
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-white/5 bg-black/80 px-3 backdrop-blur md:px-5">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-300 transition hover:bg-white/10 hover:text-amber-200"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/app" className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-amber-500 to-orange-700">
              <Hammer className="h-3 w-3 text-white" />
            </span>
            <span className="forge-title font-display text-sm font-semibold tracking-[0.08em] text-[#FFF6E0]">
              Lovelace Forge
            </span>
          </Link>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", ease: "easeOut", duration: 0.28 }}
              className="fixed left-0 top-0 z-50 flex h-full w-72 max-w-[82vw] flex-col border-r border-white/10 bg-[#0a0a0b]"
            >
              <div className="flex h-12 items-center justify-between border-b border-white/5 px-4">
                <span className="font-display text-sm font-semibold tracking-[0.08em] text-stone-300">
                  Menu
                </span>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close navigation"
                  className="text-stone-500 transition hover:text-stone-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto p-3">
                <span className="mb-2 block px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-600">
                  Workspace
                </span>
                {NAV.map((item) => {
                  const active = item.match(pathname);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                        active
                          ? "bg-amber-500/10 text-amber-100 ring-1 ring-amber-500/30"
                          : "text-stone-300 hover:bg-white/5"
                      }`}
                    >
                      <span className="text-base leading-none">{item.emoji}</span>
                      <span className="font-medium">{item.label}</span>
                      {active && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-400" />
                      )}
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-white/5 p-3">
                <div className="mb-2 truncate px-2 text-xs text-stone-500">
                  {user?.email || "—"}
                </div>
                <button
                  onClick={() => logout()}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-stone-300 transition hover:bg-red-500/10 hover:text-red-300"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
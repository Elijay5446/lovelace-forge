import React from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, BookOpen, Sparkles } from "lucide-react";

// Shown once to a first-time visitor on the Connect page. Dismissal is tracked
// by the parent (persisted on the user profile), so this component is purely
// presentational.
export default function FirstRunModal({ open, onClose, onDownload }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,460px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-amber-500/25 bg-[#0a0a0b] shadow-2xl"
          >
            <div className="forge-atmosphere-soft relative border-b border-white/5 px-6 py-5">
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute right-4 top-4 text-stone-500 transition hover:text-stone-200"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-700 shadow-[0_0_18px_rgba(245,158,11,0.4)]">
                  <Sparkles className="h-4 w-4 text-white" />
                </span>
                <h2 className="font-display text-lg font-semibold text-stone-100">
                  Welcome to Lovelace Forge!
                </h2>
              </div>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm leading-relaxed text-stone-300">To connect your Unity editor:</p>
              <ol className="mt-3 space-y-2 text-sm text-stone-400">
                <li className="flex gap-2.5">
                  <Num n={1} /> Download the bridge package
                </li>
                <li className="flex gap-2.5">
                  <Num n={2} /> Follow the Setup Guide (5 minutes)
                </li>
                <li className="flex gap-2.5">
                  <Num n={3} /> Paste your tunnel URL here
                </li>
              </ol>
              <p className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs leading-relaxed text-stone-500">
                Don't have Unity yet? You can still explore the Council, chat with Lovelace,
                and browse projects — the bridge is optional but unlocks the full experience.
              </p>

              <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
                <button
                  onClick={() => {
                    onDownload?.();
                    onClose?.();
                  }}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-amber-500 hover:to-orange-500"
                >
                  <Download className="h-4 w-4" /> Download Bridge Package
                </button>
                <Link
                  to="/unity-setup"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-stone-200 transition hover:border-white/20"
                >
                  <BookOpen className="h-4 w-4" /> View Setup Guide
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Num({ n }) {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[10px] font-semibold text-stone-400">
      {n}
    </span>
  );
}
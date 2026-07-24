import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Brain, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const QUICK = [
  "I've never used Unity — where do I start?",
  "What's a tunnel, and do I really need one?",
  "The bridge won't start — help",
  "How do I know it's connected?",
];

export default function SageHelp() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]); // { role: "user"|"sage", text }
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  const ask = async (text) => {
    const t = (text || input).trim();
    if (!t || loading) return;
    const next = [...messages, { role: "user", text: t }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const history = next
        .map((m) => `${m.role === "user" ? "User" : "Sage"}: ${m.text}`)
        .join("\n");
      const res = await base44.functions.invoke("sageHelp", { history });
      const answer = res?.data?.answer || "I'm not sure how to help with that — try the three steps on the page, or rephrase.";
      setMessages((prev) => [...prev, { role: "sage", text: answer }]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "sage", text: "I couldn't reach my brain just now — please try once more." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating launcher */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="sage-fab"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(true)}
            aria-label="Need help connecting to Unity?"
            className="group fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_26px_rgba(245,158,11,0.35)] transition hover:shadow-[0_0_40px_rgba(245,158,11,0.55)]"
          >
            <span className="relative flex h-4 w-4 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/40" />
              <Sparkles className="relative h-4 w-4" />
            </span>
            <span className="hidden sm:inline">Need Help Connecting?</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="sage-panel"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-5 right-5 z-50 flex h-[min(70vh,520px)] w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-amber-500/25 bg-[#0a0a0b] shadow-2xl"
          >
            {/* Header */}
            <div className="relative flex items-center justify-between overflow-hidden border-b border-white/5 bg-gradient-to-r from-amber-500/10 to-transparent px-4 py-3">
              <div className="pointer-events-none absolute inset-0 opacity-[0.12] bg-cover bg-center" style={{ backgroundImage: "url(\"https://media.base44.com/images/public/69f8a0352756110b9a8a3e08/314e5e8f6_generated-image.jpg\")" }} />
              <div className="relative z-10 flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-700 shadow-[0_0_18px_rgba(245,158,11,0.4)]">
                  <Brain className="h-4 w-4 text-white" />
                </span>
                <div>
                  <p className="font-display text-sm font-semibold text-stone-100">The Forge Sage</p>
                  <p className="text-[11px] text-amber-400/70">Your Unity connection guide</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="relative z-10 text-stone-500 transition hover:text-stone-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <p className="text-sm leading-relaxed text-stone-300">
                    Hey, I'm the Forge Sage 👋 Stuck connecting Unity? Ask me anything —
                    I'll walk you through it step by step.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK.map((q) => (
                      <button
                        key={q}
                        onClick={() => ask(q)}
                        disabled={loading}
                        className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-left text-[12px] text-stone-300 transition hover:border-amber-500/40 hover:bg-amber-500/[0.06] hover:text-amber-100 disabled:opacity-50"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) =>
                m.role === "user" ? (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-white/[0.08] px-3 py-2 text-sm text-stone-200">
                      <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex justify-start">
                    <div className="max-w-[88%] rounded-2xl rounded-bl-sm border border-amber-500/15 bg-amber-500/[0.05] px-3 py-2 text-sm text-stone-100">
                      <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                    </div>
                  </div>
                )
              )}

              {loading && (
                <div className="flex items-center gap-1.5 text-amber-400/70">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span className="text-xs">The Sage is thinking…</span>
                </div>
              )}
            </div>

            {/* Composer */}
            <div className="border-t border-white/5 p-3">
              <div className="flex items-end gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-1.5 transition focus-within:border-amber-500/40">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      ask();
                    }
                  }}
                  rows={1}
                  placeholder="Ask the Sage…"
                  className="max-h-28 min-h-[2.25rem] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none"
                />
                <button
                  onClick={() => ask()}
                  disabled={loading || !input.trim()}
                  aria-label="Send"
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 text-white transition hover:from-amber-500 hover:to-orange-500 disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1.5 text-center text-[10px] text-stone-600">
                The Sage only helps with connecting Unity to Lovelace Forge.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
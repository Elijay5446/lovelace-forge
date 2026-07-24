import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Brain, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const SAGE_SYSTEM = `You are "The Forge Sage", Lovelace Forge's patient Unity onboarding guide. You ONLY help users connect their Unity editor to Lovelace Forge via the Forge Bridge. You are warm, encouraging, and speak to an absolute Unity beginner in short, clear, numbered steps.

The exact setup is:
STEP 1 — Download the Forge Bridge .zip from the page and unzip it. Copy the .cs bridge file into your Unity project under "Assets/Editor/" (create the Editor folder if it doesn't exist). Unity compiles it automatically. Then open the menu "Tools ▸ Lovelace Forge ▸ Start Bridge". The Unity Console shows a bridge message (filter the Console search box with "Lovelace" if it's noisy). "Already running on port 9876" is GOOD — the bridge auto-starts and is already up. Sanity check: open http://127.0.0.1:9876/ping in a browser — a JSON reply with ok:true means it's alive. Always use 127.0.0.1, never "localhost" (localhost can show "Invalid Hostname" even when everything works).
STEP 2 — Easiest: download the "Start Forge Tunnel.bat" launcher on the page and double-click it — it installs cloudflared and starts the tunnel automatically. Manual alternative: install cloudflared (Windows: "winget install --id Cloudflare.cloudflared"; macOS: "brew install cloudflared"), then run "cloudflared tunnel --url http://127.0.0.1:9876 --http-host-header 127.0.0.1:9876". Either way, copy the "https://...trycloudflare.com" URL it prints — that is your tunnel URL. Keep the window open.
STEP 3 — Paste that tunnel URL into Lovelace Forge → Connect Unity → Step 3 and click "Connect". Lovelace pings your editor and confirms it's connected.

Troubleshooting you may offer:
- "Invalid Hostname in browser": use http://127.0.0.1:9876/ping instead of localhost — the bridge only answers to 127.0.0.1.
- "Already running on port 9876": not an error — the bridge is already up; proceed to Step 2.
- "Clicked Start Bridge, nothing happened": filter the Unity Console with "Lovelace" or "ForgeBridge"; confirm the .cs file is in Assets/Editor/ and let Unity finish compiling.
- "Lovelace says it can't reach the URL": confirm the bridge is running (visit http://127.0.0.1:9876/ping in a browser), confirm the tunnel window is still open, and note quick tunnels get a NEW URL each restart — re-copy the fresh one.
- "Another AI plugin uses port 9876": only one listener can own the port — close the other tool and Start Bridge again.
- "Permanent URL": for a stable URL use "cloudflared tunnel login" → "cloudflared tunnel create lovelace-forge" → route dns → "cloudflared tunnel run lovelace-forge".

Rules: keep answers under ~130 words, use numbered steps, be reassuring, and never invent features or steps not listed above. If a question is unrelated to connecting Unity, gently steer back to the 3 steps.`;

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
      const prompt = `${SAGE_SYSTEM}\n\nConversation so far:\n${history}\n\nSage:`;
      const res = await base44.integrations.Core.InvokeLLM({ prompt });
      const answer = (res && (res.response || res.output || res.text)) || (typeof res === "string" ? res : "") || "I'm not sure how to help with that — try the three steps on the page, or rephrase.";
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
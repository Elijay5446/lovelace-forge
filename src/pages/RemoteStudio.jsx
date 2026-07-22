import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MonitorSmartphone,
  ArrowLeft,
  Lightbulb,
  Cable,
  Monitor,
  ArrowRight,
  Power,
  ShieldCheck,
} from "lucide-react";
import CopyBlock from "@/components/unity/CopyBlock";
import GlobalNav from "@/components/GlobalNav";

export default function RemoteStudio() {
  return (
    <div className="min-h-screen w-full bg-black text-stone-200">
      <GlobalNav />

      <header className="sticky top-12 z-20 border-b border-white/5 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-2.5 px-4 py-3.5 md:px-8">
          <Link
            to="/app"
            className="text-stone-400 transition hover:text-stone-200"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <MonitorSmartphone className="h-4 w-4 text-amber-400" />
          <span className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-stone-300">
            Remote Studio
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 md:px-8 md:py-12">
        {/* HERO */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="forge-atmosphere relative rounded-xl border border-white/5 p-6 md:p-8"
        >
          <span className="mb-3 inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.28em] text-amber-500/80">
            <span className="h-px w-7 bg-amber-500/50" />
            Build From Anywhere
          </span>
          <h1 className="font-display text-3xl font-bold tracking-tight text-stone-100 md:text-4xl">
            Remote Studio
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-stone-400">
            Your development machine, in your pocket. Pair Chrome Remote Desktop
            with the Forge Bridge and keep building from the DMV line.
          </p>
        </motion.section>

        {/* TWO TOOLS */}
        <section className="mt-12">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-amber-500 to-orange-700 text-xs font-bold text-white">
              ✦
            </span>
            <h2 className="font-display text-lg font-semibold text-stone-100">
              Two tools, one superpower
            </h2>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-5">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl leading-none">🌉</span>
                <div className="flex items-center gap-1.5">
                  <Cable className="h-3.5 w-3.5 text-amber-400/80" />
                  <h3 className="font-display text-sm font-semibold text-stone-100">
                    The Forge Bridge
                  </h3>
                </div>
              </div>
              <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-amber-400/70">
                the hands
              </p>
              <p className="mt-3 text-sm leading-relaxed text-stone-400">
                Lovelace reaches <span className="text-stone-200">into</span> your
                Unity editor — runs C#, inspects scenes, edits assets — from
                anywhere, no screen required. This does the heavy lifting.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl leading-none">🖥️</span>
                <div className="flex items-center gap-1.5">
                  <Monitor className="h-3.5 w-3.5 text-stone-300" />
                  <h3 className="font-display text-sm font-semibold text-stone-100">
                    Chrome Remote Desktop
                  </h3>
                </div>
              </div>
              <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-stone-500">
                the eyes
              </p>
              <p className="mt-3 text-sm leading-relaxed text-stone-400">
                See and control your actual desktop from your phone or laptop.
                Watch Lovelace work live, hit Play, and eyeball results — from
                anywhere.
              </p>
            </div>
          </div>

          <p className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-center text-sm font-medium text-amber-200">
            Lovelace executes through the Bridge. You supervise through Remote
            Desktop. Your studio goes wherever you do.
          </p>
        </section>

        {/* MAIN SETUP */}
        <div className="mt-12 space-y-10">
          {/* SECTION 1 */}
          <section>
            <SectionHeader n={1} title="One-time setup on your development PC" time="~5 min" />
            <div className="mt-4 space-y-4 pl-8">
              <Step n={1}>
                Open Google Chrome on your Unity PC and go to{" "}
                <a
                  href="https://remotedesktop.google.com/access"
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[12.5px] text-amber-300 underline decoration-amber-500/40 underline-offset-2 hover:decoration-amber-400"
                >
                  remotedesktop.google.com/access
                </a>
                :
              </Step>
              <div className="-mt-2 pl-8">
                <CopyBlock code="https://remotedesktop.google.com/access" />
              </div>

              <Step n={2}>
                Under <span className="text-stone-200">"Set up Remote Access"</span>,
                click the download icon to install the{" "}
                <span className="text-stone-200">"Chrome Remote Desktop"</span>{" "}
                extension + the host installer. Approve the install when prompted.
              </Step>

              <Step n={3}>
                Click <span className="text-stone-200">"Turn on"</span>. Give the
                machine a name (e.g. <span className="font-mono text-amber-300">"Kizuna Rig"</span>).
              </Step>

              <Step n={4}>
                Set a <span className="text-stone-200">6+ digit PIN</span>. This PIN
                unlocks remote access — make it strong, you'll type it from your
                phone.
              </Step>

              <Step n={5}>
                <span className="flex items-center gap-1.5 font-medium text-stone-200">
                  <Power className="h-3.5 w-3.5 text-amber-400/80" />
                  Important power settings:
                </span>
                <span className="mt-1 block">
                  set the PC to{" "}
                  <span className="text-stone-200">NEVER sleep while plugged in</span>{" "}
                  (Windows:{" "}
                  <span className="font-mono text-[12px] text-stone-300">
                    Settings &gt; System &gt; Power &gt; Screen and sleep &gt; "When
                    plugged in, put my device to sleep" = Never
                  </span>
                  ). A sleeping PC can't be reached.
                </span>
              </Step>

              <Step n={6}>
                Keep Chrome running (it can be minimized) and keep Unity open with
                your project loaded.
              </Step>
            </div>
          </section>

          {/* SECTION 2 */}
          <section>
            <SectionHeader n={2} title="Install the phone app" time="~1 min" />
            <div className="mt-4 space-y-4 pl-8">
              <Step n={1}>
                On your phone, install{" "}
                <span className="text-stone-200">"Chrome Remote Desktop"</span> (iOS
                App Store / Google Play).
              </Step>
              <Step n={2}>
                Sign in with the{" "}
                <span className="text-stone-200">SAME</span> Google account you used
                on the PC.
              </Step>
              <Step n={3}>
                Your PC (<span className="font-mono text-amber-300">"Kizuna Rig"</span>)
                appears in the list. Tap it, enter your PIN — you're now looking at
                your full desktop.
              </Step>
            </div>
          </section>

          {/* SECTION 3 */}
          <section>
            <SectionHeader n={3} title="Your mobile build loop" time="from the DMV line" />
            <div className="mt-4 space-y-4 pl-8">
              <Step n={1}>
                In the Forge app on your phone, open Chat or a Project and tell
                Lovelace what to build (<span className="font-mono text-[12px] text-stone-300">"add a hitbox to Biruda's roundhouse"</span>,{" "}
                <span className="font-mono text-[12px] text-stone-300">"generate a projectile script"</span>).
                She executes through the Bridge — no remote desktop needed for this
                part.
              </Step>
              <Step n={2}>
                Switch to the Chrome Remote Desktop app to{" "}
                <span className="text-stone-200">WATCH</span> it land in Unity live,
                and to do the few click-only steps — most importantly hit the ▶ Play
                button to test.
              </Step>
              <Step n={3}>
                Switch back to Forge to iterate. This{" "}
                <span className="text-amber-300">Forge-to-supervise</span> loop is
                your whole studio, in your pocket.
              </Step>
            </div>
          </section>
        </div>

        {/* PRO TIPS */}
        <section className="mt-12">
          <div className="flex items-center gap-2.5">
            <Lightbulb className="h-4 w-4 text-amber-400" />
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-stone-300">
              Pro Tips
            </h2>
          </div>
          <ul className="mt-4 space-y-3">
            {TIPS.map((t) => (
              <li
                key={t.title}
                className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-[11px] text-amber-400">
                  {t.icon}
                </span>
                <p className="text-sm leading-relaxed text-stone-400">
                  <span className="font-medium text-stone-200">{t.title}: </span>
                  {t.body}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* CLOSING CALLOUT */}
        <section className="mt-6">
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-5">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <p className="text-sm leading-relaxed text-amber-100">
              The Bridge gives Lovelace hands inside Unity. Remote Desktop gives you
              eyes on the screen. Between them, there's no such thing as being away
              from your studio.
            </p>
          </div>
        </section>

        {/* LINK TO CONNECT UNITY */}
        <div className="mt-10">
          <Link
            to="/app/unity"
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/5 px-4 py-2.5 text-sm font-medium text-amber-100 transition hover:border-amber-400/70 hover:bg-amber-500/10 hover:shadow-[0_0_22px_rgba(245,158,11,0.18)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Set up the Forge Bridge first
          </Link>
        </div>
      </main>
    </div>
  );
}

const TIPS = [
  {
    icon: "🖱️",
    title: "Trackpad mode",
    body: "in the CRD phone app, use trackpad mode for precise clicks in Unity's tight UI; pinch to zoom.",
  },
  {
    icon: "🌉",
    title: "Keep the tunnel running",
    body: "keep the Forge Bridge tunnel running on the PC (see Connect Unity) so Lovelace stays connected while you're mobile.",
  },
  {
    icon: "🔋",
    title: "Battery",
    body: "remote desktop is data + battery heavy; on cellular, keep sessions short and lean on the Bridge (text) for the heavy work, CRD only to watch/click.",
  },
  {
    icon: "🔒",
    title: "Security",
    body: "CRD traffic is encrypted end-to-end by Google and gated by your PIN. Never share your PIN. For extra safety, turn off remote access when you're done for the day.",
  },
  {
    icon: "↔️",
    title: "Alternative",
    body: "the same loop works with any remote-desktop tool (Parsec for low latency, RustDesk for self-hosted). Chrome Remote Desktop is just the free, zero-config default.",
  },
];

function SectionHeader({ n, title, time }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-amber-500 to-orange-700 text-xs font-bold text-white">
        {n}
      </span>
      <h2 className="font-display text-lg font-semibold text-stone-100">{title}</h2>
      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-stone-500">
        {time}
      </span>
    </div>
  );
}

function Step({ n, children }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[10px] font-semibold text-stone-400">
        {n}
      </span>
      <p className="text-sm leading-relaxed text-stone-400">{children}</p>
    </div>
  );
}
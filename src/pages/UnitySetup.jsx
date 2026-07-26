import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Cable,
  Download,
  Wrench,
  Rocket,
  LifeBuoy,
} from "lucide-react";
import GlobalNav from "@/components/GlobalNav";

// Plain, universal step-by-step guide for connecting any Unity editor to
// Lovelace Forge. Copy is intentionally verbatim from the product spec so it
// stays the single source of truth users can be pointed at from anywhere.
function Section({ icon: Icon, title, children }) {
  return (
    <section className="rounded-xl border border-white/5 bg-white/[0.02] p-6 md:p-7">
      <div className="flex items-center gap-2.5">
        <Icon className="h-4 w-4 text-amber-400" />
        <h2 className="font-display text-lg font-semibold text-stone-100">{title}</h2>
      </div>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-stone-400">{children}</div>
    </section>
  );
}

function NumStep({ n, children }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[10px] font-semibold text-stone-400">
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}

const Code = ({ children }) => (
  <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[12px] text-amber-300">{children}</code>
);

export default function UnitySetup() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen w-full bg-black text-stone-200">
      <GlobalNav />
      <header className="sticky top-12 z-20 border-b border-white/5 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3.5 md:px-8">
          <div className="flex items-center gap-2.5">
            <button onClick={() => navigate(-1)} className="text-stone-400 transition hover:text-stone-200">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <BookOpen className="h-4 w-4 text-amber-400" />
            <span className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-stone-300">
              Unity Setup Guide
            </span>
          </div>
          <Link
            to="/app/unity"
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-1.5 text-xs font-medium text-amber-100 transition hover:border-amber-400/70 hover:bg-amber-500/10"
          >
            <Cable className="h-3.5 w-3.5" /> Connect page
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 md:px-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="forge-atmosphere rounded-xl border border-white/5 p-6 md:p-8"
        >
          <h1 className="font-display text-3xl font-bold tracking-tight text-stone-100 md:text-4xl">
            Unity Bridge Setup Guide
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-stone-400">
            Lovelace Forge connects directly to your live Unity editor, letting you run
            commands, inspect assets, and build games with AI assistance — all from your
            browser. No plugins, no packages, no Unity Asset Store downloads. Just a
            lightweight bridge script.
          </p>
        </motion.div>

        <div className="mt-8 space-y-6">
          <Section icon={CheckCircle2} title="Prerequisites">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Unity 2021.3 LTS or newer installed on your machine</li>
              <li>A Unity project open in the Unity Editor (any project works)</li>
              <li>Python 3.8+ installed (for the bridge tunnel script), OR PowerShell on Windows</li>
              <li>An active Lovelace Forge account (sign up free)</li>
            </ul>
          </Section>

          <Section icon={Download} title="Step 1: Download the Bridge Package">
            <ol className="space-y-2.5">
              <NumStep n={1}>Go to the Connect page in Lovelace Forge</NumStep>
              <NumStep n={2}>
                Click <span className="text-stone-200">“Download Bridge Package”</span> — you'll get a ZIP file
                containing:
                <ul className="mt-1.5 list-disc space-y-1 pl-5 text-stone-500">
                  <li><Code>LovelaceForgeBridge.cs</Code> (the Unity editor script)</li>
                  <li><Code>start_forge_bridge.ps1</Code> (Windows launcher)</li>
                  <li><Code>start_forge_bridge.py</Code> (Mac/Linux launcher)</li>
                  <li><Code>README.txt</Code> (quick reference)</li>
                </ul>
              </NumStep>
              <NumStep n={3}>
                Unzip the package to any folder on your computer (e.g., your Desktop or Downloads)
              </NumStep>
            </ol>
          </Section>

          <Section icon={Wrench} title="Step 2: Install the Bridge Script in Unity">
            <ol className="space-y-2.5">
              <NumStep n={1}>Open your Unity project</NumStep>
              <NumStep n={2}>
                In the Project window, create a folder called <span className="text-stone-200">“LovelaceForge”</span>{" "}
                (right-click → Create → Folder) if it doesn't exist
              </NumStep>
              <NumStep n={3}>
                Drag and drop <Code>LovelaceForgeBridge.cs</Code> into that folder
              </NumStep>
              <NumStep n={4}>
                Wait for Unity to compile (you'll see a spinner in the bottom-right corner)
              </NumStep>
              <NumStep n={5}>
                You should now see a new menu item:{" "}
                <span className="text-stone-200">Tools → Lovelace Forge → Start Bridge</span>
              </NumStep>
            </ol>
          </Section>

          <Section icon={Rocket} title="Step 3: Start the Bridge">
            <p className="font-medium text-stone-200">On Windows:</p>
            <ol className="space-y-2.5">
              <NumStep n={1}>Double-click <Code>start_forge_bridge.ps1</Code></NumStep>
              <NumStep n={2}>A terminal window opens showing the tunnel URL</NumStep>
              <NumStep n={3}>
                Copy the URL (it looks like <Code>https://something-words.trycloudflare.com</Code>)
              </NumStep>
            </ol>
            <p className="mt-4 font-medium text-stone-200">On Mac/Linux:</p>
            <ol className="space-y-2.5">
              <NumStep n={1}>Open Terminal</NumStep>
              <NumStep n={2}>Navigate to the folder where you unzipped the package</NumStep>
              <NumStep n={3}>Run: <Code>python3 start_forge_bridge.py</Code></NumStep>
              <NumStep n={4}>Copy the tunnel URL from the terminal output</NumStep>
            </ol>
          </Section>

          <Section icon={Cable} title="Step 4: Connect in Lovelace Forge">
            <ol className="space-y-2.5">
              <NumStep n={1}>Go to the Connect page in Lovelace Forge</NumStep>
              <NumStep n={2}>Paste the tunnel URL into the “Tunnel URL” field</NumStep>
              <NumStep n={3}>Click “Connect”</NumStep>
              <NumStep n={4}>
                You should see a green <span className="text-emerald-300">“Connected”</span> indicator — your Unity
                editor is now live!
              </NumStep>
            </ol>
          </Section>

          <Section icon={Rocket} title="Step 5: Start Building">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Open the Command Console</li>
              <li>
                Type a command like <span className="text-stone-200">“Create a cube at position 0,0,0”</span> or{" "}
                <span className="text-stone-200">“List all game objects in the scene”</span>
              </li>
              <li>
                Lovelace Forge sends the command to your Unity editor and shows the result in real time
              </li>
            </ul>
          </Section>

          <Section icon={LifeBuoy} title="Troubleshooting">
            <div className="space-y-4">
              <div>
                <p className="font-medium text-stone-200">Connection failed?</p>
                <ul className="mt-1.5 list-disc space-y-1 pl-5">
                  <li>Make sure the bridge script is running (the terminal window should be open)</li>
                  <li>Make sure Unity is open with the <Code>LovelaceForgeBridge.cs</Code> script compiled</li>
                  <li>Try restarting the bridge script — the tunnel URL changes each time</li>
                  <li>Make sure nothing else is running on port 9876</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-stone-200">“Bridge not responding”?</p>
                <ul className="mt-1.5 list-disc space-y-1 pl-5">
                  <li>The bridge tunnel may have dropped. Restart <Code>start_forge_bridge.ps1</Code> (or .py) and paste the new URL</li>
                  <li>Cloudflare tunnels are temporary and can drop after inactivity — just restart</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-stone-200">Compile errors in Unity?</p>
                <ul className="mt-1.5 list-disc space-y-1 pl-5">
                  <li>Make sure you're using Unity 2021.3 LTS or newer</li>
                  <li>Check the Unity Console for any red error messages</li>
                  <li>The bridge script requires the UnityEditor namespace — it only works in the Editor, not in builds</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-stone-200">Commands are slow?</p>
                <ul className="mt-1.5 list-disc space-y-1 pl-5">
                  <li>Each command has a 40-second timeout. Complex operations (reimports, scene loads) may take longer</li>
                  <li>If a command times out, it may have still completed in Unity — check your editor</li>
                </ul>
              </div>
            </div>
          </Section>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/app/unity"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:from-amber-500 hover:to-orange-500"
          >
            <Cable className="h-4 w-4" /> Go to Connect page
          </Link>
        </div>
      </main>
    </div>
  );
}
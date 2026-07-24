import React from "react";
import { Wrench } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const ISSUES = [
  {
    q: "Browser says “Bad Request – Invalid Hostname”",
    a: "The bridge is alive — it's just picky about the address. Use http://127.0.0.1:9876/ping instead of localhost. If 127.0.0.1 gives you a JSON reply, everything is working.",
  },
  {
    q: "Console says “Already running on port 9876”",
    a: "That's good news, not an error! The bridge auto-starts and survives script reloads, so clicking Start Bridge when it's already up just prints this. You're ready for Step 2.",
  },
  {
    q: "I clicked Start Bridge and nothing happened",
    a: "Open the Console tab (next to Project, bottom of Unity) and type “Lovelace” or “ForgeBridge” in its search box to filter the noise. If the bridge started — now or earlier — you'll see its message. Still nothing? Confirm the script is in Assets/Editor/ and wait a few seconds for Unity to compile.",
  },
  {
    q: "Lovelace can't reach my tunnel URL",
    a: "1) Verify the bridge locally: open http://127.0.0.1:9876/ping in a browser — you should get JSON. 2) Make sure the tunnel window is still open (closing it kills the URL). 3) Quick tunnels get a NEW URL every restart — re-copy the fresh one and reconnect.",
  },
  {
    q: "Another Unity AI plugin uses the same port",
    a: "Only one listener can own port 9876. If a different tool grabbed it first, close that tool (or disable its server) and click Tools ▸ Lovelace Forge ▸ Start Bridge again.",
  },
];

export default function BridgeTroubleshooting() {
  return (
    <section className="mt-12">
      <div className="flex items-center gap-2">
        <Wrench className="h-4 w-4 text-amber-400/80" />
        <h2 className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
          If something looks off
        </h2>
      </div>
      <Accordion type="single" collapsible className="mt-3">
        {ISSUES.map((it) => (
          <AccordionItem
            key={it.q}
            value={it.q}
            className="border-white/5"
          >
            <AccordionTrigger className="text-left text-sm text-stone-200 hover:text-amber-100 hover:no-underline">
              {it.q}
            </AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-stone-400">
              {it.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
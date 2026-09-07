import React from "react";
import { Network, AlertOctagon, Boxes } from "lucide-react";
import CopyBlock from "@/components/unity/CopyBlock";
import { PORTS, FAILURE_SIGNATURES, BLENDER_PORT_FIX } from "@/components/unity/bridgePlaybookData";

// Bridge Playbook v2: Blender section, the three-service port table and the
// failure-signature table. Pure documentation — no state, no secrets.
export default function BridgePlaybook() {
  return (
    <section className="mt-12 space-y-8">
      <Block icon={Boxes} title="Blender (optional second engine)">
        <p className="text-sm leading-relaxed text-stone-400">
          The bridge can also drive Blender. Install the Blender MCP addon, then move it off the
          bridge's port — the addon <span className="text-stone-200">defaults to 9876</span> and
          collides with the bridge (the tunnel hostname still resolves, but{" "}
          <code className="rounded bg-white/5 px-1 font-mono text-[12px] text-amber-300">/health</code>{" "}
          times out because nothing is listening locally). In Blender's Python console:
        </p>
        <div className="mt-3">
          <CopyBlock code={BLENDER_PORT_FIX} />
        </div>
        <p className="mt-2 text-xs text-stone-500">
          “WinError 10038” on stop is a benign shutdown artifact. Once connected, Lovelace sends
          Python to <code className="font-mono text-amber-300">POST /blender</code> and gets captured
          stdout back in ~0.2s — ideal for mesh/UV work, measurements and renders, versus a
          28–56s Unity compile cycle.
        </p>
      </Block>

      <Block icon={Network} title="Ports — keep the three services separate">
        <Table
          head={["Service", "Address", "Role"]}
          rows={PORTS.map((p) => [p.service, <Mono key={p.addr}>{p.addr}</Mono>, p.role])}
        />
      </Block>

      <Block icon={AlertOctagon} title="Failure signatures">
        <Table
          head={["You see", "It means", "Do this"]}
          rows={FAILURE_SIGNATURES.map((f) => [<Mono key={f.sign}>{f.sign}</Mono>, f.meaning, f.fix])}
        />
      </Block>
    </section>
  );
}

function Block({ icon: Icon, title, children }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-amber-400/80" />
        <h2 className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">{title}</h2>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Mono({ children }) {
  return <span className="font-mono text-[12px] text-amber-300">{children}</span>;
}

function Table({ head, rows }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/[0.02]">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/5 text-[11px] uppercase tracking-wider text-stone-500">
            {head.map((h) => (
              <th key={h} className="px-3 py-2 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-white/5 align-top last:border-0">
              {r.map((c, j) => (
                <td key={j} className={`px-3 py-2.5 ${j === 0 ? "text-stone-200" : "text-stone-400"}`}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
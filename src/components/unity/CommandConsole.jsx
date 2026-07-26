import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Terminal, Wrench, Play, RefreshCw } from "lucide-react";

// Lets the user browse the Unity tools the bridge advertises (/list_tools) and
// run one by name, or run raw C#. Every call goes through the relay's HTTP
// request-response actions — no persistent session.
export default function CommandConsole({ connected }) {
  const [tools, setTools] = useState([]);
  const [loadingTools, setLoadingTools] = useState(false);
  const [selected, setSelected] = useState(null);
  const [args, setArgs] = useState("{}");
  const [rawCode, setRawCode] = useState("");
  const [mode, setMode] = useState("tool"); // "tool" | "raw"
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState(null);

  const loadTools = async () => {
    setLoadingTools(true);
    try {
      const res = await base44.functions.invoke("unity_bridge_relay", { action: "list_tools" });
      const data = res?.data || res;
      setTools(Array.isArray(data?.tools) ? data.tools : []);
    } catch {
      setTools([]);
    } finally {
      setLoadingTools(false);
    }
  };

  useEffect(() => {
    if (connected) loadTools();
  }, [connected]);

  const run = async () => {
    setRunning(true);
    setOutput(null);
    try {
      // Both a named tool call and raw C# ultimately go through "execute":
      // for a tool we send its name + parsed args; the bridge maps the name to
      // the C# that implements it. For raw mode we send the C# directly.
      const payload =
        mode === "tool"
          ? { action: "execute", tool: selected?.name, args: safeParse(args) }
          : { action: "execute", code: rawCode };
      const res = await base44.functions.invoke("unity_bridge_relay", payload);
      setOutput(res?.data || res);
    } catch (e) {
      setOutput({ success: false, error: e?.message || "Call failed." });
    } finally {
      setRunning(false);
    }
  };

  if (!connected) {
    return (
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 text-sm text-stone-500">
        Connect Unity above to browse and run tools.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-stone-100">Command console</h3>
        </div>
        <div className="flex gap-1 rounded-lg border border-white/10 bg-white/[0.02] p-1">
          <button
            onClick={() => setMode("tool")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              mode === "tool" ? "bg-white/10 text-stone-100" : "text-stone-500 hover:text-stone-300"
            }`}
          >
            Tools
          </button>
          <button
            onClick={() => setMode("raw")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              mode === "raw" ? "bg-white/10 text-stone-100" : "text-stone-500 hover:text-stone-300"
            }`}
          >
            Raw C#
          </button>
        </div>
      </div>

      {mode === "tool" ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-400">
              {loadingTools ? "Loading tools…" : `${tools.length} tool${tools.length === 1 ? "" : "s"} available`}
            </span>
            <button
              onClick={loadTools}
              disabled={loadingTools}
              className="flex items-center gap-1 text-xs text-stone-500 transition hover:text-stone-300 disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${loadingTools ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {tools.map((t) => (
              <button
                key={t.name}
                onClick={() => {
                  setSelected(t);
                  setArgs(JSON.stringify(exampleArgs(t), null, 2));
                }}
                className={`rounded-lg border p-3 text-left transition ${
                  selected?.name === t.name
                    ? "border-amber-500/50 bg-amber-500/10"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Wrench className="h-3.5 w-3.5 text-amber-400/80" />
                  <span className="font-mono text-xs font-semibold text-stone-100">{t.name}</span>
                </div>
                {t.description && (
                  <p className="mt-1 text-[11px] leading-relaxed text-stone-500">{t.description}</p>
                )}
              </button>
            ))}
          </div>

          {selected && (
            <div>
              <label className="text-xs font-medium text-stone-400">
                Arguments for <span className="font-mono text-amber-300">{selected.name}</span> (JSON)
              </label>
              <textarea
                value={args}
                onChange={(e) => setArgs(e.target.value)}
                rows={5}
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-stone-100 focus:border-amber-500/50 focus:outline-none"
              />
            </div>
          )}
        </div>
      ) : (
        <div>
          <label className="text-xs font-medium text-stone-400">C# snippet (body of Execute())</label>
          <textarea
            value={rawCode}
            onChange={(e) => setRawCode(e.target.value)}
            rows={7}
            placeholder={'return "Hello from Unity " + Application.unityVersion;'}
            className="mt-1.5 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-stone-100 placeholder:text-stone-600 focus:border-amber-500/50 focus:outline-none"
          />
        </div>
      )}

      <button
        onClick={run}
        disabled={running || (mode === "tool" ? !selected : !rawCode.trim())}
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg border-0 bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2.5 text-sm font-medium text-white transition hover:from-amber-500 hover:to-orange-500 disabled:opacity-50"
      >
        {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
        {mode === "tool" ? "Run tool" : "Run C#"}
      </button>

      {output && (
        <pre
          className={`mt-4 max-h-64 overflow-auto rounded-lg border p-3 font-mono text-xs leading-relaxed ${
            output.success === false
              ? "border-red-500/30 bg-red-500/[0.06] text-red-200"
              : "border-emerald-500/25 bg-emerald-500/[0.05] text-emerald-100"
          }`}
        >
          {JSON.stringify(output, null, 2)}
        </pre>
      )}
    </div>
  );
}

function safeParse(str) {
  try {
    return JSON.parse(str || "{}");
  } catch {
    return {};
  }
}

// Build a friendly example args object from a tool's declared input schema.
function exampleArgs(tool) {
  const props = tool?.input?.properties || tool?.inputSchema?.properties || {};
  const out = {};
  for (const [key, def] of Object.entries(props)) {
    if (def?.example !== undefined) out[key] = def.example;
    else if (def?.type === "string") out[key] = "";
    else if (def?.type === "number") out[key] = 0;
    else if (def?.type === "array") out[key] = [];
    else if (def?.type === "boolean") out[key] = false;
    else out[key] = null;
  }
  return out;
}
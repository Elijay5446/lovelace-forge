import React, { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Cpu, FolderOpen, Wrench } from "lucide-react";

// Compact panel below the connect button: live connection dot plus the details
// the bridge reports — Unity version, project name (from /health) and the
// number of tools it advertises (from /list_tools). Refreshes when `refreshKey`
// changes (e.g. after a connect) and every 10s.
export default function BridgeStatusPanel({ refreshKey }) {
  const [status, setStatus] = useState("not_configured");
  const [unityVersion, setUnityVersion] = useState("");
  const [projectName, setProjectName] = useState("");
  const [toolCount, setToolCount] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("unity_bridge_relay", { action: "status" });
      const data = res?.data || res;
      const bridge = data?.bridge;
      const s = bridge?.status || data?.status || "not_configured";
      setStatus(s);
      setUnityVersion(bridge?.unity_version || "");
      setProjectName(bridge?.project_name || "");

      if (s === "connected") {
        const t = await base44.functions.invoke("unity_bridge_relay", { action: "list_tools" });
        const td = t?.data || t;
        setToolCount(Array.isArray(td?.tools) ? td.tools.length : 0);
      } else {
        setToolCount(null);
      }
    } catch {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, [load, refreshKey]);

  const connected = status === "connected";

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
      <div className="flex items-center gap-2.5">
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-stone-400" />
        ) : (
          <span className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-emerald-400" : "bg-red-400"}`} />
        )}
        <span className="text-sm font-semibold text-stone-100">
          {connected ? "Connected" : "Disconnected"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Detail icon={Cpu} label="Unity version" value={connected ? unityVersion || "—" : "—"} />
        <Detail icon={FolderOpen} label="Project" value={connected ? projectName || "—" : "—"} />
        <Detail
          icon={Wrench}
          label="Available tools"
          value={connected ? (toolCount === null ? "…" : String(toolCount)) : "—"}
        />
      </div>
    </div>
  );
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-stone-500">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <p className="mt-1 truncate font-mono text-sm text-stone-100">{value}</p>
    </div>
  );
}
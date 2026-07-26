import React, { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Activity } from "lucide-react";

// Polls the relay's "status" action every 10s (which pings the tunnel) and
// shows a live green/red indicator. This replaces the old manual "Test
// Connection" model with an always-current heartbeat.
export default function LiveStatus({ onStatusChange }) {
  const [status, setStatus] = useState(null);
  const [checking, setChecking] = useState(true);
  const [lastSeen, setLastSeen] = useState(null);

  const poll = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("unity_bridge_relay", { action: "status" });
      const data = res?.data || res;
      const s = data?.bridge?.status || data?.status || "not_configured";
      setStatus(s);
      if (s === "connected") setLastSeen(Date.now());
      onStatusChange?.(s);
    } catch {
      setStatus("error");
      onStatusChange?.("error");
    } finally {
      setChecking(false);
    }
  }, [onStatusChange]);

  useEffect(() => {
    poll();
    const id = setInterval(poll, 10000);
    return () => clearInterval(id);
  }, [poll]);

  const connected = status === "connected";
  const dot = connected
    ? "bg-emerald-400"
    : status === "connecting"
    ? "bg-amber-400 animate-pulse"
    : "bg-red-400";

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium">
        {checking ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-stone-400" />
        ) : (
          <span className={`h-2 w-2 rounded-full ${dot}`} />
        )}
        {checking ? "Checking…" : connected ? "Connected · live" : "Not connected"}
      </div>
      <button
        onClick={poll}
        disabled={checking}
        className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-1.5 text-xs font-medium text-amber-100 transition hover:border-amber-400/70 hover:bg-amber-500/10 disabled:opacity-50"
      >
        <Activity className="h-3.5 w-3.5" /> Check now
      </button>
      {connected && lastSeen && (
        <span className="text-xs text-stone-600">auto-checks every 10s</span>
      )}
    </div>
  );
}
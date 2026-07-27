import React, { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";

// Compact Unity connection LED for the chat header. Polls the bridge every 10s:
// green when connected, red when the connection drops, amber while checking.
export default function UnityStatusLed() {
  const [status, setStatus] = useState("checking");

  const poll = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("unity_bridge_relay", { action: "status" });
      const data = res?.data || res;
      setStatus(data?.bridge?.status || data?.status || "disconnected");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    poll();
    const id = setInterval(poll, 10000);
    return () => clearInterval(id);
  }, [poll]);

  const connected = status === "connected";
  const checking = status === "checking";
  const dot = connected
    ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
    : checking
    ? "bg-amber-400 animate-pulse"
    : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]";

  return (
    <Link
      to="/app/unity"
      title={connected ? "Unity connected" : "Unity not connected — click to reconnect"}
      className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-stone-400 transition hover:border-white/20 hover:text-stone-200"
    >
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      <span className="hidden sm:inline">
        {checking ? "Unity…" : connected ? "Unity connected" : "Unity offline"}
      </span>
    </Link>
  );
}
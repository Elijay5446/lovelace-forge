import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Check, Eye, EyeOff, ExternalLink, KeyRound, Loader2 } from "lucide-react";

// Section 1: Meshy API connection. Checks (in order) an app-level key, then the
// user's saved key, then offers the connect form. Reports status to the parent.
export default function MeshyConnectCard({ onStatus }) {
  const [checking, setChecking] = useState(true);
  const [connected, setConnected] = useState(false);
  const [isAppKey, setIsAppKey] = useState(false);
  const [profile, setProfile] = useState(null);
  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const report = (c, appKey) => {
    setConnected(c);
    setIsAppKey(appKey);
    onStatus?.(c);
  };

  useEffect(() => {
    (async () => {
      try {
        const [res, profiles] = await Promise.all([
          base44.functions.invoke("meshy_connect", {}),
          base44.entities.UserProfile.filter({}),
        ]);
        const data = res?.data || res;
        setProfile((profiles || [])[0] || null);
        // The backend resolves the fallback chain (user key overrides app key).
        report(!!data?.connected, !!data?.is_app_key);
      } catch {
        report(false, false);
      } finally {
        setChecking(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = async () => {
    if (!keyInput.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await base44.functions.invoke("meshy_connect", { api_key: keyInput.trim() });
      const data = res?.data || res;
      if (data?.connected) {
        let p = profile;
        if (p) await base44.entities.UserProfile.update(p.id, { meshy_api_key: keyInput.trim() });
        else p = await base44.entities.UserProfile.create({ meshy_api_key: keyInput.trim() });
        setProfile({ ...p, meshy_api_key: keyInput.trim() });
        setKeyInput("");
        report(true, false);
      } else {
        setError(data?.error || "Could not validate the API key.");
      }
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Connection failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (profile) {
        await base44.entities.UserProfile.update(profile.id, { meshy_api_key: "" });
        setProfile({ ...profile, meshy_api_key: "" });
      }
      // Their key is gone — the app-level key may still cover them.
      const res = await base44.functions.invoke("meshy_connect", {});
      const data = res?.data || res;
      report(!!data?.connected, !!data?.is_app_key);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
      {checking ? (
        <div className="flex items-center gap-2 text-sm text-stone-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking Meshy connection…
        </div>
      ) : connected ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15">
              <Check className="h-4 w-4 text-emerald-400" />
            </span>
            <div>
              <p className="text-sm font-semibold text-stone-100">Meshy API: Connected ✓</p>
              <span className="mt-0.5 inline-block rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
                {isAppKey ? "Using app API key" : "Using your API key"}
              </span>
            </div>
          </div>
          {!isAppKey && (
            <button
              onClick={handleDisconnect}
              disabled={busy}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-stone-400 transition hover:border-red-500/40 hover:text-red-300 disabled:opacity-50"
            >
              Disconnect
            </button>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15">
              <KeyRound className="h-4 w-4 text-amber-400" />
            </span>
            <h3 className="font-display text-base font-semibold text-stone-100">Connect Meshy API</h3>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-stone-400">
            Meshy AI generates 3D characters from your images. Get your API key at meshy.ai
          </p>
          <div className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <input
                type={showKey ? "text" : "password"}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="Meshy API Key"
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 pr-10 text-sm text-stone-200 placeholder:text-stone-600 focus:border-amber-500/50 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                aria-label={showKey ? "Hide key" : "Show key"}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <button
              onClick={handleConnect}
              disabled={busy || !keyInput.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-amber-500 hover:to-orange-500 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Connect
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
          <a
            href="https://meshy.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-amber-400/80 hover:text-amber-300"
          >
            Get a Meshy API key <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}
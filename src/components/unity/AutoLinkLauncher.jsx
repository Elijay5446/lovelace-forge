import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Download, Loader2, Link2 } from "lucide-react";

// Issues (once) a private pair token for this account and hands the user a
// personalized tunnel launcher. The script starts cloudflared, watches its
// output for the freshly-minted trycloudflare URL, and announces it straight
// back to Lovelace — so the stored URL is never stale after a tunnel restart.
export default function AutoLinkLauncher() {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const rows = await base44.entities.BridgeSession.filter({}, "-created_date", 1);
        const session = rows?.[0];
        if (session?.pair_token) {
          setToken(session.pair_token);
        } else {
          const fresh = crypto.randomUUID().replace(/-/g, "");
          if (session) await base44.entities.BridgeSession.update(session.id, { pair_token: fresh });
          else await base44.entities.BridgeSession.create({ pair_token: fresh, status: "disconnected" });
          setToken(fresh);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const endpoint = `${window.location.origin}/functions/bridgeAnnounce`;

  const download = (name, content) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const ps1 = `# Lovelace Forge — auto-linking tunnel launcher (Windows)
# Starts the tunnel AND tells Lovelace its new address automatically.
$Token = "${token}"
$Endpoint = "${endpoint}"
$Sent = $false
Write-Host "Starting tunnel to Unity (127.0.0.1:9876). Keep this window open." -ForegroundColor Yellow
cloudflared tunnel --url http://127.0.0.1:9876 --http-host-header 127.0.0.1:9876 2>&1 | ForEach-Object {
  Write-Host $_
  if (-not $Sent -and "$_" -match "https://[a-z0-9-]+\\.trycloudflare\\.com") {
    $Url = $Matches[0]
    $Sent = $true
    try {
      Invoke-RestMethod -Uri $Endpoint -Method Post -ContentType "application/json" \`
        -Body (@{ token = $Token; tunnel_url = $Url } | ConvertTo-Json)
      Write-Host "Linked to Lovelace: $Url" -ForegroundColor Green
    } catch {
      Write-Host "Could not reach Lovelace. Paste this URL manually: $Url" -ForegroundColor Red
    }
  }
}
`;

  const sh = `#!/usr/bin/env bash
# Lovelace Forge — auto-linking tunnel launcher (macOS / Linux)
# Starts the tunnel AND tells Lovelace its new address automatically.
TOKEN="${token}"
ENDPOINT="${endpoint}"
echo "Starting tunnel to Unity (127.0.0.1:9876). Keep this window open."
SENT=""
cloudflared tunnel --url http://127.0.0.1:9876 --http-host-header 127.0.0.1:9876 2>&1 | while IFS= read -r line; do
  echo "$line"
  if [ -z "$SENT" ]; then
    URL=$(echo "$line" | grep -oE 'https://[a-z0-9-]+\\.trycloudflare\\.com' | head -n 1)
    if [ -n "$URL" ]; then
      SENT=1
      curl -s -X POST "$ENDPOINT" -H 'Content-Type: application/json' \\
        -d "{\\"token\\":\\"$TOKEN\\",\\"tunnel_url\\":\\"$URL\\"}" >/dev/null \\
        && echo "Linked to Lovelace: $URL" \\
        || echo "Could not reach Lovelace. Paste this URL manually: $URL"
    fi
  fi
done
`;

  return (
    <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/[0.05] p-4">
      <div className="flex items-center gap-2">
        <Link2 className="h-4 w-4 text-emerald-300" />
        <p className="text-sm font-semibold text-stone-100">Auto-linking launcher (no more pasting URLs)</p>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-stone-400">
        This launcher starts the tunnel and announces its new address to Lovelace
        by itself — so when Cloudflare hands out a fresh URL, your connection just
        keeps working. It carries a private key tied to your account; don't share it.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => download("start_forge_tunnel_autolink.ps1", ps1)}
          disabled={loading || !token}
          className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition hover:border-emerald-400/70 hover:bg-emerald-500/15 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Windows (.ps1)
        </button>
        <button
          onClick={() => download("start_forge_tunnel_autolink.sh", sh)}
          disabled={loading || !token}
          className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition hover:border-emerald-400/70 hover:bg-emerald-500/15 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          macOS / Linux (.sh)
        </button>
      </div>
      <p className="mt-2.5 text-[11px] text-stone-500">
        Windows: right-click the file ▸ Run with PowerShell. macOS/Linux: <span className="font-mono text-amber-300">chmod +x</span> it, then run it.
      </p>
    </div>
  );
}
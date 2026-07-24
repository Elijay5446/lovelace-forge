import React from "react";
import { MousePointerClick, Download } from "lucide-react";

const BAT_SCRIPT = `@echo off
title Lovelace Forge Tunnel
echo ============================================
echo   LOVELACE FORGE - ONE-CLICK TUNNEL
echo ============================================
echo.
where cloudflared >nul 2>nul
if errorlevel 1 (
  echo Installing cloudflared - this happens only once...
  winget install --id Cloudflare.cloudflared --accept-source-agreements --accept-package-agreements
  set "PATH=%PATH%;%ProgramFiles(x86)%\\cloudflared;%ProgramFiles%\\cloudflared;%LocalAppData%\\Microsoft\\WinGet\\Links"
)
echo.
echo Starting tunnel to Unity ^(localhost:9876^)...
echo.
echo   COPY the https://xxxx.trycloudflare.com URL that appears
echo   in the box below, then paste it into Lovelace Forge.
echo.
echo   KEEP THIS WINDOW OPEN while you work.
echo.
cloudflared tunnel --url http://127.0.0.1:9876 --http-host-header 127.0.0.1:9876
echo.
echo Tunnel stopped.
pause
`;

export default function EasySetup() {
  const handleDownload = () => {
    const blob = new Blob([BAT_SCRIPT], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Start Forge Tunnel.bat";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.05] p-5">
      <div className="flex items-center gap-2">
        <MousePointerClick className="h-4 w-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-stone-100">
          Easiest way — one double-click
        </h3>
        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
          Windows
        </span>
      </div>
      <ol className="mt-3 space-y-1.5 text-sm text-stone-400">
        <li>
          <span className="text-stone-200">1.</span> Download the launcher below.
        </li>
        <li>
          <span className="text-stone-200">2.</span> Double-click{" "}
          <span className="font-mono text-[12px] text-amber-300">Start Forge Tunnel.bat</span>{" "}
          — it installs everything needed and starts the tunnel.
        </li>
        <li>
          <span className="text-stone-200">3.</span> Copy the{" "}
          <span className="font-mono text-[12px] text-amber-300">trycloudflare.com</span> URL
          it shows, paste it in Step 3, hit Connect. Keep the window open.
        </li>
      </ol>
      <button
        onClick={handleDownload}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_18px_rgba(245,158,11,0.25)] transition hover:from-amber-400 hover:to-orange-500"
      >
        <Download className="h-4 w-4" /> Download Tunnel Launcher (.bat)
      </button>
      <p className="mt-2.5 text-xs text-stone-500">
        If Windows shows a "protected your PC" warning, click{" "}
        <span className="text-stone-300">More info → Run anyway</span> — the file just runs
        the two commands shown below.
      </p>
    </div>
  );
}
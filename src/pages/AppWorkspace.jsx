import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, Hammer } from "lucide-react";

export default function AppWorkspace() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const existing = await base44.entities.UserProfile.list();
        let prof = existing && existing[0];
        if (!prof) {
          const name = user?.email ? user.email.split("@")[0] : "Developer";
          prof = await base44.entities.UserProfile.create({
            display_name: name,
            onboarded: false,
          });
        }
        if (!cancelled) setProfile(prof);
      } catch (e) {
        console.error("Profile init failed", e);
        if (!cancelled) setError("Could not initialize your profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-stone-200 selection:bg-amber-500/30">
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/5 px-6 py-4 md:px-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-700">
            <Hammer className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-sm font-bold tracking-wide text-stone-100">
            LOVELACE FORGE
          </span>
        </div>
        <Button
          variant="ghost"
          onClick={() => logout()}
          className="text-stone-400 hover:text-stone-100 hover:bg-white/5"
        >
          <LogOut className="mr-1.5 h-4 w-4" />
          Sign out
        </Button>
      </header>

      {/* Shell */}
      <main className="relative z-10 flex min-h-[calc(100vh-65px)] items-center justify-center px-6">
        <div className="w-full max-w-xl text-center">
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-stone-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Preparing your forge…
            </div>
          ) : (
            <>
              <h1 className="forge-title font-display text-3xl font-bold tracking-[0.04em] text-[#FFF6E0] sm:text-4xl">
                Welcome{profile?.display_name ? `, ${profile.display_name}` : ""}
              </h1>
              <p className="mt-3 text-sm text-stone-400">
                Signed in as {user?.email}
              </p>

              {error ? (
                <p className="mt-4 text-sm text-red-400">{error}</p>
              ) : (
                <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-stone-500">
                  Your workspace is ready. The chat interface with Lovelace is
                  coming next — for now, your account and profile are set up and
                  your data is private to you.
                </p>
              )}

              <div className="mx-auto mt-8 inline-flex items-center gap-2 rounded-md border border-amber-500/20 bg-amber-500/5 px-4 py-2 text-xs text-amber-300/80">
                <Hammer className="h-3.5 w-3.5" />
                Chat workspace incoming
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
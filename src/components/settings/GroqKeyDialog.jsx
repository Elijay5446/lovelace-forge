import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyRound, Loader2, Check, ExternalLink } from "lucide-react";

// Lets each user store their OWN Groq API key so their chat and council calls
// draw on their personal Groq quota instead of a shared app limit. The key is
// saved on the user's own UserProfile record (RLS-scoped to them, so it stays
// private). When left blank, the app falls back to the shared key automatically.
export default function GroqKeyDialog({ open, onOpenChange }) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileId, setProfileId] = useState(null);

  useEffect(() => {
    if (!open) return;
    setSaved(false);
    setLoading(true);
    (async () => {
      try {
        const rows = await base44.entities.UserProfile.filter({}, "-created_date", 1);
        const p = rows && rows[0];
        setProfileId(p?.id || null);
        setValue(p?.groq_api_key || "");
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [open]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const key = value.trim();
      if (profileId) {
        await base44.entities.UserProfile.update(profileId, { groq_api_key: key });
      } else {
        const created = await base44.entities.UserProfile.create({ groq_api_key: key });
        setProfileId(created.id);
      }
      setSaved(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[#0d0d0f] text-stone-200 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-stone-100">
            <KeyRound className="h-4 w-4 text-amber-400" /> Your Groq API Key
          </DialogTitle>
          <DialogDescription className="text-stone-400">
            Add your own key so your chats and council calls run on your personal
            Groq quota. Leave it blank to use the shared key.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <label className="block text-xs font-medium text-stone-400">Groq API key</label>
          <Input
            type="password"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setSaved(false);
            }}
            placeholder={loading ? "Loading…" : "gsk_..."}
            disabled={loading}
            className="border-white/10 bg-black/40 font-mono text-sm text-stone-100 placeholder:text-stone-600"
          />

          <a
            href="https://console.groq.com/keys"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200"
          >
            Get a free key at console.groq.com/keys
            <ExternalLink className="h-3 w-3" />
          </a>

          <ol className="mt-2 list-decimal space-y-1 pl-4 text-[11px] leading-relaxed text-stone-500">
            <li>Sign in at console.groq.com and open API Keys.</li>
            <li>Create a key and copy it (starts with <span className="font-mono text-stone-400">gsk_</span>).</li>
            <li>Paste it above and save — it stays private to your account.</li>
          </ol>
        </div>

        <div className="mt-2 flex items-center justify-end gap-2">
          {saved && (
            <span className="mr-auto inline-flex items-center gap-1.5 text-xs text-emerald-400">
              <Check className="h-3.5 w-3.5" /> Saved
            </span>
          )}
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-stone-400 hover:text-stone-200"
          >
            Close
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || loading}
            className="bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-400 hover:to-orange-500"
          >
            {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
            Save key
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
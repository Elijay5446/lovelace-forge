import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Hammer, Loader2, X } from "lucide-react";

const ENGINES = ["Unity 6", "Unity 2021.6"];
const FRAMEWORKS = ["UFE2", "Custom"];

const EMPTY = {
  name: "",
  description: "",
  platform: "",
  engine: "Unity 6",
  framework: "UFE2",
};

const fieldCls =
  "bg-white/5 border-white/10 text-stone-100 placeholder:text-stone-600 focus:border-amber-500/50";

export default function ProjectForm({ onDone }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) {
      setError("A project name is required.");
      return;
    }
    setSaving(true);
    try {
      await base44.entities.Project.create({
        name: form.name.trim(),
        description: form.description.trim(),
        platform: form.platform.trim() || undefined,
        engine: form.engine,
        framework: form.framework,
      });
      setForm(EMPTY);
      onDone?.();
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 pb-1">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-700">
          <Hammer className="h-4 w-4 text-white" />
        </div>
        <div>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-stone-200">
            Forge a Project
          </h2>
          <p className="text-xs text-stone-500">Start a new build in the forge</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pf-name">Name *</Label>
        <Input
          id="pf-name"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Riftbreaker: Ironclad"
          className={fieldCls}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pf-desc">Description</Label>
        <Textarea
          id="pf-desc"
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="A 2.5D UFE2 fighting game with parry mechanics..."
          rows={3}
          className={`${fieldCls} resize-none`}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pf-platform">Target Platform</Label>
        <Input
          id="pf-platform"
          value={form.platform}
          onChange={(e) => update("platform", e.target.value)}
          placeholder="PC/Steam"
          className={fieldCls}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="pf-engine">Engine</Label>
          <select
            id="pf-engine"
            value={form.engine}
            onChange={(e) => update("engine", e.target.value)}
            className={`${fieldCls} h-9 w-full rounded-md px-3 text-sm`}
          >
            {ENGINES.map((v) => (
              <option key={v} value={v} className="bg-stone-900">
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pf-framework">Framework</Label>
          <select
            id="pf-framework"
            value={form.framework}
            onChange={(e) => update("framework", e.target.value)}
            className={`${fieldCls} h-9 w-full rounded-md px-3 text-sm`}
          >
            {FRAMEWORKS.map((v) => (
              <option key={v} value={v} className="bg-stone-900">
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-sm text-red-400">
          <X className="h-3.5 w-3.5" />
          {error}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <Button
          type="submit"
          disabled={saving}
          className="flex-1 border-0 bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-500 hover:to-orange-500"
        >
          {saving ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Forging...
            </>
          ) : (
            <>
              <Hammer className="mr-1.5 h-4 w-4" /> Forge it
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onDone}
          className="text-stone-400 hover:bg-white/5 hover:text-stone-200"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
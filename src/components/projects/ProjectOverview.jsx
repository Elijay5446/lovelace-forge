import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Check, X, Loader2 } from "lucide-react";

const ENGINES = ["Unity 6", "Unity 2021.6"];
const FRAMEWORKS = ["UFE2", "Custom"];

const fieldCls =
  "bg-white/5 border-white/10 text-stone-100 placeholder:text-stone-600 focus:border-amber-500/50";

export default function ProjectOverview({ project, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: project.name,
    description: project.description || "",
    platform: project.platform || "",
    engine: project.engine,
    framework: project.framework,
  });
  const [saving, setSaving] = useState(false);

  const update = (f, v) => setForm((p) => ({ ...p, [f]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const updated = await base44.entities.Project.update(project.id, {
        name: form.name.trim() || project.name,
        description: form.description.trim(),
        platform: form.platform.trim(),
        engine: form.engine,
        framework: form.framework,
      });
      setEditing(false);
      onUpdated?.(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setForm({
      name: project.name,
      description: project.description || "",
      platform: project.platform || "",
      engine: project.engine,
      framework: project.framework,
    });
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
        <div className="flex items-start justify-between">
          <h2 className="font-display text-2xl font-bold text-stone-100">
            {project.name}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditing(true)}
            className="text-stone-400 hover:bg-white/5 hover:text-amber-400"
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
          </Button>
        </div>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-400">
          {project.description || "No description yet."}
        </p>
        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          {project.platform && (
            <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 font-medium text-stone-300">
              {project.platform}
            </span>
          )}
          <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 font-medium text-stone-300">
            {project.engine}
          </span>
          <span className="rounded-md border border-amber-500/20 bg-amber-500/5 px-2.5 py-1 font-medium text-amber-300">
            {project.framework}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-amber-500/20 bg-white/[0.02] p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-amber-300">
          Editing Project
        </h2>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={save}
            disabled={saving}
            className="border-0 bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-500 hover:to-orange-500"
          >
            {saving ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="mr-1.5 h-3.5 w-3.5" />
            )}
            Save
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={cancel}
            className="text-stone-400 hover:bg-white/5"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Name</Label>
        <Input
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          className={fieldCls}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          rows={4}
          className={`${fieldCls} resize-none`}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Platform</Label>
          <Input
            value={form.platform}
            onChange={(e) => update("platform", e.target.value)}
            placeholder="PC/Steam"
            className={fieldCls}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Engine</Label>
          <select
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
          <Label>Framework</Label>
          <select
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
    </div>
  );
}
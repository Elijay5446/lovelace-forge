import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Hammer, Loader2, X } from "lucide-react";

const CATEGORIES = [
  { value: "web", label: "Web" },
  { value: "mobile", label: "Mobile" },
  { value: "ai", label: "AI" },
  { value: "game", label: "Game" },
  { value: "tool", label: "Tool" },
  { value: "hardware", label: "Hardware" },
  { value: "other", label: "Other" },
];

const EMPTY = {
  title: "",
  description: "",
  author: "",
  tech_stack: "",
  category: "web",
  image_url: "",
  github_url: "",
  demo_url: "",
  featured: false,
};

export default function ProjectForm({ onDone }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.title.trim() || !form.description.trim() || !form.author.trim()) {
      setError("Title, description, and author are required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        author: form.author.trim(),
        category: form.category,
        tech_stack: form.tech_stack
          ? form.tech_stack.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
        image_url: form.image_url.trim() || undefined,
        github_url: form.github_url.trim() || undefined,
        demo_url: form.demo_url.trim() || undefined,
        featured: form.featured,
      };
      await base44.entities.Project.create(payload);
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
      <div className="flex items-center gap-2 pb-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-700 flex items-center justify-center">
          <Hammer className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-lg leading-none">Forge a Project</h2>
          <p className="text-xs text-stone-500 mt-1">Share your creation with the community</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="My awesome project"
          className="bg-white/5 border-white/10 text-stone-100 placeholder:text-stone-600 focus:border-amber-500/50"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="author">Author *</Label>
        <Input
          id="author"
          value={form.author}
          onChange={(e) => update("author", e.target.value)}
          placeholder="Your name"
          className="bg-white/5 border-white/10 text-stone-100 placeholder:text-stone-600 focus:border-amber-500/50"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="What does it do? What problem does it solve?"
          rows={3}
          className="bg-white/5 border-white/10 text-stone-100 placeholder:text-stone-600 focus:border-amber-500/50 resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tech_stack">Tech Stack</Label>
        <Input
          id="tech_stack"
          value={form.tech_stack}
          onChange={(e) => update("tech_stack", e.target.value)}
          placeholder="React, Node, Postgres (comma-separated)"
          className="bg-white/5 border-white/10 text-stone-100 placeholder:text-stone-600 focus:border-amber-500/50"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Category</Label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => update("category", cat.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                form.category === cat.value
                  ? "bg-amber-600 text-white"
                  : "bg-white/5 text-stone-400 hover:bg-white/10"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="image_url">Image URL</Label>
          <Input
            id="image_url"
            value={form.image_url}
            onChange={(e) => update("image_url", e.target.value)}
            placeholder="https://..."
            className="bg-white/5 border-white/10 text-stone-100 placeholder:text-stone-600 focus:border-amber-500/50"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="github_url">GitHub</Label>
            <Input
              id="github_url"
              value={form.github_url}
              onChange={(e) => update("github_url", e.target.value)}
              placeholder="https://github.com/..."
              className="bg-white/5 border-white/10 text-stone-100 placeholder:text-stone-600 focus:border-amber-500/50"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="demo_url">Demo</Label>
            <Input
              id="demo_url"
              value={form.demo_url}
              onChange={(e) => update("demo_url", e.target.value)}
              placeholder="https://..."
              className="bg-white/5 border-white/10 text-stone-100 placeholder:text-stone-600 focus:border-amber-500/50"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg bg-white/5 border border-white/5 px-4 py-3">
        <div>
          <Label htmlFor="featured" className="cursor-pointer">Featured</Label>
          <p className="text-xs text-stone-500 mt-0.5">Highlight this on the showcase</p>
        </div>
        <Switch
          id="featured"
          checked={form.featured}
          onCheckedChange={(v) => update("featured", v)}
        />
      </div>

      {error && (
        <p className="text-sm text-red-400 flex items-center gap-1.5">
          <X className="w-3.5 h-3.5" />
          {error}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <Button
          type="submit"
          disabled={saving}
          className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white border-0"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              Forging...
            </>
          ) : (
            <>
              <Hammer className="w-4 h-4 mr-1.5" />
              Forge it
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onDone}
          className="text-stone-400 hover:text-stone-200 hover:bg-white/5"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
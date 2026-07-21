import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Code2, Sparkles, AlertTriangle, FileCode2 } from "lucide-react";
import CodeArtifactViewer from "./CodeArtifactViewer";

const isGroqKeyError = (msg) => /groq api key|GROQ_API_KEY/i.test(msg || "");

export default function CodeTab({
  artifacts,
  loading,
  generating,
  onGenerate,
  onDelete,
}) {
  const [language, setLanguage] = useState("C#");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  const handleGenerate = async () => {
    if (!description.trim() || generating) return;
    setError("");
    try {
      const res = await onGenerate(language.trim() || "C#", description.trim());
      setDescription("");
      if (res?.artifact_id) {
        // Open the freshly generated artifact.
        const fresh =
          res && res.artifact_id
            ? {
                id: res.artifact_id,
                name: res.title,
                language: res.language,
                content: res.code,
                description: res.explanation || description,
                created_date: new Date().toISOString(),
              }
            : null;
        if (fresh) setSelected(fresh);
      }
    } catch (err) {
      setError(err?.message || "Could not generate code.");
    }
  };

  const sorted = [...artifacts].sort(
    (a, b) => new Date(b.created_date) - new Date(a.created_date)
  );

  return (
    <div className="space-y-6">
      {/* Generate */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-stone-200">
            Generate Code
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[140px_1fr]">
          <Input
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder="C#"
            disabled={generating}
            className="border-white/10 bg-white/5 text-stone-100 placeholder:text-stone-600 focus:border-amber-500/50"
          />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the code you need — e.g. a HitBox script that applies knockback scaled by damage..."
            rows={3}
            disabled={generating}
            className="resize-none border-white/10 bg-white/5 text-stone-100 placeholder:text-stone-600 focus:border-amber-500/50"
          />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-stone-600">
            Returns clean, commented Unity code in a single block.
          </p>
          <Button
            onClick={handleGenerate}
            disabled={generating || !description.trim()}
            className="border-0 bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-500 hover:to-orange-500"
          >
            {generating ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Forging code...
              </>
            ) : (
              <>
                <Code2 className="mr-1.5 h-4 w-4" /> Generate Code
              </>
            )}
          </Button>
        </div>
        {error && (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-red-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            {isGroqKeyError(error)
              ? "Lovelace needs her Groq API key configured to think — ask your admin to set GROQ_API_KEY."
              : error}
          </p>
        )}
      </div>

      {/* Artifact list */}
      {loading ? (
        <div className="flex justify-center py-10 text-stone-600">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.01] py-12 text-center">
          <Code2 className="mx-auto mb-3 h-6 w-6 text-stone-700" />
          <p className="text-sm text-stone-500">
            Ask Lovelace to generate your first script.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelected(a)}
              className="flex w-full items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3.5 text-left transition hover:border-amber-500/30 hover:bg-white/[0.04]"
            >
              <FileCode2 className="h-4 w-4 shrink-0 text-amber-400/70" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-stone-200">{a.name}</p>
                <p className="mt-0.5 truncate text-xs text-stone-500">
                  {a.description || "No description."}
                </p>
              </div>
              <span className="shrink-0 rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-stone-400">
                {a.language}
              </span>
              <span className="shrink-0 text-[11px] text-stone-600">
                {a.created_date
                  ? new Date(a.created_date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })
                  : ""}
              </span>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <CodeArtifactViewer
          artifact={selected}
          onClose={() => setSelected(null)}
          onDelete={() => {
            onDelete?.(selected);
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}
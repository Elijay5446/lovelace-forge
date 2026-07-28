import React, { useRef, useState } from "react";
import { ImagePlus, Sparkles, X } from "lucide-react";

const MAX_BYTES = 10 * 1024 * 1024;
const OK_TYPES = ["image/png", "image/jpeg"];

// Section 2: image upload + character name → Generate.
export default function CharacterUpload({ disabled, busy, onGenerate }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [name, setName] = useState("");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const takeFile = (f) => {
    setError("");
    if (!f) return;
    if (!OK_TYPES.includes(f.type)) return setError("Please use a PNG or JPEG image.");
    if (f.size > MAX_BYTES) return setError("Image must be under 10MB.");
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    // Auto-fill the character name from the filename so Generate is never
    // silently blocked by an empty name.
    if (!name.trim()) {
      const base = f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
      if (base) setName(base.replace(/\b\w/g, (c) => c.toUpperCase()));
    }
  };

  const clearFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview("");
  };

  const handleGenerateClick = () => {
    if (disabled) return setError("Connect your Meshy API key above first.");
    if (!file) return setError("Please add a character image first.");
    if (!name.trim()) return setError("Please enter a character name first.");
    setError("");
    onGenerate(file, name.trim());
  };

  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
      <h3 className="font-display text-lg font-semibold text-stone-100">Create a 3D Character</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-stone-400">
        Upload an image of your character. Lovelace Forge will generate a rigged 3D model with
        Meshy AI, then send it to your Unity editor.
      </p>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); takeFile(e.dataTransfer.files?.[0]); }}
        className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
          dragging ? "border-amber-400/70 bg-amber-500/[0.06]" : "border-white/15 hover:border-amber-500/40"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".png,.jpg,.jpeg,image/png,image/jpeg"
          className="hidden"
          onChange={(e) => takeFile(e.target.files?.[0])}
        />
        {preview ? (
          <div className="relative">
            <img src={preview} alt="Character preview" className="max-h-48 rounded-lg object-contain" />
            <button
              onClick={(e) => { e.stopPropagation(); clearFile(); }}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/80 text-stone-300 ring-1 ring-white/20 hover:text-red-300"
              aria-label="Remove image"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <>
            <ImagePlus className="h-8 w-8 text-stone-500" strokeWidth={1.5} />
            <p className="mt-3 text-sm text-stone-300">Drag & drop your character image here</p>
            <p className="mt-1 text-xs text-stone-500">PNG or JPEG, max 10MB — or click to browse</p>
          </>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g., Cyber Knight"
        aria-label="Character Name"
        className="mt-4 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-stone-200 placeholder:text-stone-600 focus:border-amber-500/50 focus:outline-none"
      />

      <button
        onClick={handleGenerateClick}
        disabled={busy}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_22px_rgba(245,158,11,0.25)] transition hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 disabled:shadow-none"
      >
        <Sparkles className="h-4 w-4" /> Generate 3D Character
      </button>

      <p className="mt-3 text-center text-xs leading-relaxed text-stone-500">
        For best results: use a full-body character image with a clean background. T-pose or
        A-pose works best.
      </p>
      {disabled && (
        <p className="mt-1.5 text-center text-xs text-amber-400/80">
          Connect your Meshy API key above to enable generation.
        </p>
      )}
    </div>
  );
}
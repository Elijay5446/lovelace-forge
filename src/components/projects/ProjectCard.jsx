import React from "react";
import { motion } from "framer-motion";
import { Code2, ListChecks, Flame, Trash2 } from "lucide-react";

export default function ProjectCard({
  project,
  index,
  artifactCount,
  taskCount,
  onSelect,
  onDelete,
}) {
  const created = project.created_date
    ? new Date(project.created_date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.4) }}
      onClick={() => onSelect?.(project)}
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02] p-5 pl-6 transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/40 hover:bg-white/[0.03] hover:shadow-[0_0_28px_rgba(245,158,11,0.12)]"
    >
      {/* Left amber accent */}
      <span className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-amber-500/70 to-orange-700/30 opacity-60 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-amber-500/5 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-700/20 ring-1 ring-amber-500/10">
          <Flame className="h-4 w-4 text-amber-400/80" />
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(project);
          }}
          className="text-stone-700 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
          title="Delete project"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <h3 className="mt-3 font-display text-base font-semibold text-stone-100 transition group-hover:text-amber-400">
        {project.name}
      </h3>
      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-stone-500">
        {project.description || "No description yet."}
      </p>

      {/* Labeled chips */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px]">
          <span className="text-stone-600">Engine</span>
          <span className="font-medium text-stone-300">{project.engine}</span>
        </span>
        <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/5 px-2 py-0.5 text-[10px]">
          <span className="text-amber-700/80">Framework</span>
          <span className="font-medium text-amber-300/90">{project.framework}</span>
        </span>
        {project.platform && (
          <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px]">
            <span className="text-stone-600">Platform</span>
            <span className="font-medium text-stone-300">{project.platform}</span>
          </span>
        )}
      </div>

      {/* Stat pills + date */}
      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
        <span className="text-xs text-stone-600">{created}</span>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-medium text-stone-300 ring-1 ring-white/10">
            <ListChecks className="h-3 w-3 text-amber-400/70" /> {taskCount}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-medium text-stone-300 ring-1 ring-white/10">
            <Code2 className="h-3 w-3 text-amber-400/70" /> {artifactCount}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
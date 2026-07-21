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
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/30 hover:shadow-2xl hover:shadow-orange-900/10"
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-amber-500/5 blur-2xl transition-opacity group-hover:opacity-100" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-700/20 ring-1 ring-amber-500/10">
          <Flame className="h-4 w-4 text-amber-400/70" />
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
      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-stone-500">
        {project.description || "No description yet."}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px]">
        {project.platform && (
          <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 font-medium text-stone-400">
            {project.platform}
          </span>
        )}
        <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 font-medium text-stone-400">
          {project.engine}
        </span>
        <span className="rounded border border-amber-500/20 bg-amber-500/5 px-2 py-0.5 font-medium text-amber-300/80">
          {project.framework}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
        <span className="text-xs text-stone-600">{created}</span>
        <div className="flex items-center gap-3 text-xs text-stone-400">
          <span className="flex items-center gap-1">
            <Code2 className="h-3.5 w-3.5 text-stone-500" />
            {artifactCount}
          </span>
          <span className="flex items-center gap-1">
            <ListChecks className="h-3.5 w-3.5 text-stone-500" />
            {taskCount}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
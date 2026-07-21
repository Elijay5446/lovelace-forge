import React from "react";
import { motion } from "framer-motion";
import { Github, ExternalLink, Flame, Trash2 } from "lucide-react";
import { Image } from "@/components/ui/image";
import { base44 } from "@/api/base44Client";

const CATEGORY_STYLES = {
  web: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  mobile: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  ai: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  game: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  tool: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  hardware: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  other: "bg-stone-500/10 text-stone-400 border-stone-500/20",
};

export default function ProjectCard({ project, index }) {
  const handleDelete = async () => {
    try {
      await base44.entities.Project.delete(project.id);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.4) }}
      className="group relative rounded-xl overflow-hidden bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-900/10 hover:-translate-y-1"
    >
      {/* Image / Gradient Header */}
      <div className="relative h-40 overflow-hidden">
        {project.image_url ? (
          <Image
            src={project.image_url}
            alt={project.title}
            className="w-full h-full"
            fittingType="fill"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-stone-800 via-stone-900 to-[#0a0a0b] flex items-center justify-center">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-700/20 border border-amber-500/10 flex items-center justify-center">
              <Flame className="w-6 h-6 text-amber-500/50" />
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#131316] via-transparent to-transparent" />
        <div className="absolute top-3 left-3">
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${
              CATEGORY_STYLES[project.category] || CATEGORY_STYLES.other
            }`}
          >
            {project.category}
          </span>
        </div>
        {project.featured && (
          <div className="absolute top-3 right-3">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Flame className="w-2.5 h-2.5" fill="currentColor" />
              Featured
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5">
        <h3 className="font-heading font-semibold text-base text-stone-100 mb-1 group-hover:text-amber-400 transition-colors">
          {project.title}
        </h3>
        <p className="text-stone-500 text-xs mb-3">by {project.author}</p>
        <p className="text-stone-400 text-sm leading-relaxed line-clamp-2 mb-4">
          {project.description}
        </p>

        {/* Tech Stack */}
        {project.tech_stack?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {project.tech_stack.slice(0, 4).map((tech, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-stone-400 border border-white/5"
              >
                {tech}
              </span>
            ))}
            {project.tech_stack.length > 4 && (
              <span className="px-2 py-0.5 rounded text-[10px] font-medium text-stone-500">
                +{project.tech_stack.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            {project.github_url && (
              <a
                href={project.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone-500 hover:text-stone-200 transition-colors"
              >
                <Github className="w-4 h-4" />
              </a>
            )}
            {project.demo_url && (
              <a
                href={project.demo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone-500 hover:text-amber-400 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
          <button
            onClick={handleDelete}
            className="text-stone-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
            title="Delete project"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
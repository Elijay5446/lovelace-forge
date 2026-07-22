import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Hammer, Plus, X } from "lucide-react";
import ProjectCard from "@/components/projects/ProjectCard";
import ProjectForm from "@/components/projects/ProjectForm";
import GlobalNav from "@/components/GlobalNav";
import { ProjectGridSkeleton } from "@/components/Skeletons";

export default function ProjectsDashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, artifacts, tasks] = await Promise.all([
        base44.entities.Project.list("-created_date", 200),
        base44.entities.CodeArtifact.list("-created_date", 500),
        base44.entities.GameDevTask.list("-created_date", 500),
      ]);
      setProjects(list || []);
      const c = {};
      (artifacts || []).forEach((a) => {
        if (a.project_id) c[a.project_id] = { ...(c[a.project_id] || { a: 0, t: 0 }), a: (c[a.project_id]?.a || 0) + 1 };
      });
      (tasks || []).forEach((t) => {
        if (t.project_id) c[t.project_id] = { ...(c[t.project_id] || { a: 0, t: 0 }), t: (c[t.project_id]?.t || 0) + 1 };
      });
      setCounts(c);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (project) => {
    if (!confirm(`Delete "${project.name}"? This removes the project (its tasks and code remain).`)) return;
    try {
      await base44.entities.Project.delete(project.id);
      setProjects((p) => p.filter((x) => x.id !== project.id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black text-stone-200">
      <GlobalNav />
      <main className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
        {/* Hero header */}
        <header className="mb-9 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="mb-3 inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.28em] text-amber-500/80">
              <span className="h-px w-7 bg-amber-500/50" />
              Your Studio
            </span>
            <h1 className="font-display text-4xl font-bold tracking-tight text-stone-100 md:text-5xl">
              Projects
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone-400">
              Every build, plan, and line of code Lovelace forges with you.
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/5 px-4 py-2.5 text-sm font-medium text-amber-100 transition hover:border-amber-400/70 hover:bg-amber-500/10 hover:shadow-[0_0_22px_rgba(245,158,11,0.18)]"
          >
            <Plus className="h-4 w-4" /> New Project
          </button>
        </header>

        {loading ? (
          <ProjectGridSkeleton />
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-700/15 ring-1 ring-amber-500/15">
              <Hammer className="h-6 w-6 text-amber-400/70" />
            </div>
            <h2 className="font-display text-lg font-semibold text-stone-200">
              No projects yet
            </h2>
            <p className="mt-1.5 text-sm text-stone-500">
              Create your first project to start forging.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-5 flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/5 px-4 py-2 text-sm font-medium text-amber-100 transition hover:border-amber-400/70 hover:bg-amber-500/10"
            >
              <Plus className="h-4 w-4" /> New Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p, i) => (
              <ProjectCard
                key={p.id}
                project={p}
                index={i}
                artifactCount={counts[p.id]?.a || 0}
                taskCount={counts[p.id]?.t || 0}
                onSelect={(proj) => navigate(`/app/projects/${proj.id}`)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {/* New project modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0b] p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-stone-600">
                New
              </span>
              <button
                onClick={() => setShowForm(false)}
                className="text-stone-500 transition hover:text-stone-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ProjectForm
              onDone={() => {
                setShowForm(false);
                load();
              }}
            />
          </motion.div>
        </div>
      )}
    </div>
  );
}
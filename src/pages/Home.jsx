import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Hammer, Github, ExternalLink, Flame, Sparkles, Filter } from "lucide-react";
import ProjectCard from "@/components/projects/ProjectCard";
import ProjectForm from "@/components/projects/ProjectForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "web", label: "Web" },
  { value: "mobile", label: "Mobile" },
  { value: "ai", label: "AI" },
  { value: "game", label: "Game" },
  { value: "tool", label: "Tool" },
  { value: "hardware", label: "Hardware" },
  { value: "other", label: "Other" },
];

export default function Home() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.Project.list("-created_date", 100);
        setProjects(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();

    const unsubscribe = base44.entities.Project.subscribe((event) => {
      if (event.type === "create") {
        setProjects((prev) => [event.data, ...prev]);
      } else if (event.type === "update") {
        setProjects((prev) =>
          prev.map((p) => (p.id === event.data.id ? event.data : p))
        );
      } else if (event.type === "delete") {
        setProjects((prev) => prev.filter((p) => p.id !== event.data.id));
      }
    });

    return unsubscribe;
  }, []);

  const filtered = useMemo(() => {
    if (activeCategory === "all") return projects;
    return projects.filter((p) => p.category === activeCategory);
  }, [projects, activeCategory]);

  const featured = useMemo(
    () => projects.filter((p) => p.featured).slice(0, 1)[0],
    [projects]
  );

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-stone-100">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0b]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-700 flex items-center justify-center shadow-lg shadow-orange-900/40">
                <Hammer className="w-5 h-5 text-white" strokeWidth={2.2} />
              </div>
              <Flame className="w-3.5 h-3.5 text-amber-400 absolute -top-1 -right-1" fill="currentColor" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-base tracking-tight leading-none">Lovelace Forge</h1>
              <p className="text-[10px] text-stone-500 leading-none mt-0.5 tracking-wide uppercase">Craft · Share · Inspire</p>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white border-0 shadow-lg shadow-orange-900/30">
                <Sparkles className="w-4 h-4 mr-1.5" />
                Forge a Project
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#131316] border-white/10 text-stone-100 max-w-lg">
              <ProjectForm
                onDone={() => setDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(180,83,9,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(transparent_98%,rgba(255,255,255,0.03)_98%),linear-gradient(90deg,transparent_98%,rgba(255,255,255,0.03)_98%)] bg-[size:40px_40px]" />
        <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-28 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium mb-6">
              <Flame className="w-3 h-3" fill="currentColor" />
              In honor of Ada Lovelace — the first programmer
            </span>
            <h2 className="font-heading font-bold text-4xl md:text-6xl tracking-tight leading-[1.05] mb-5">
              Forge your ideas into
              <br />
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                living code
              </span>
            </h2>
            <p className="text-stone-400 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
              A showcase for developers to share their crafted projects — where raw ideas are hammered into polished, shareable creations.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <div className="sticky top-16 z-40 border-b border-white/5 bg-[#0a0a0b]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-2 overflow-x-auto">
          <Filter className="w-4 h-4 text-stone-500 shrink-0" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                activeCategory === cat.value
                  ? "bg-amber-600 text-white shadow-md shadow-orange-900/30"
                  : "bg-white/5 text-stone-400 hover:bg-white/10 hover:text-stone-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-72 rounded-xl bg-white/[0.03] border border-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <Hammer className="w-7 h-7 text-stone-600" />
            </div>
            <h3 className="font-heading font-semibold text-lg text-stone-300 mb-1">No projects yet</h3>
            <p className="text-stone-500 text-sm mb-6">Be the first to forge something here.</p>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white border-0">
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  Forge a Project
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#131316] border-white/10 text-stone-100 max-w-lg">
                <ProjectForm onDone={() => setDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filtered.map((project, i) => (
              <ProjectCard key={project.id} project={project} index={i} />
            ))}
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-10">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-stone-500 text-xs">
            Lovelace Forge · Crafted for builders, by builders
          </p>
          <div className="flex items-center gap-4 text-stone-500">
            <a href="#" className="hover:text-amber-400 transition-colors">
              <Github className="w-4 h-4" />
            </a>
            <a href="#" className="hover:text-amber-400 transition-colors">
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
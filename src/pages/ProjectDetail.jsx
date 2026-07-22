import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, ArrowLeft, LayoutDashboard, ListChecks, Code2 } from "lucide-react";
import ProjectOverview from "@/components/projects/ProjectOverview";
import BuildPlanTab from "@/components/projects/BuildPlanTab";
import CodeTab from "@/components/projects/CodeTab";
import GlobalNav from "@/components/GlobalNav";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "plan", label: "Build Plan", icon: ListChecks },
  { id: "code", label: "Code", icon: Code2 },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);

  const loadProject = useCallback(async () => {
    try {
      const p = await base44.entities.Project.get(id);
      setProject(p);
    } catch (e) {
      console.error(e);
      setProject(null);
    }
  }, [id]);

  const loadTasks = useCallback(async () => {
    try {
      const list = await base44.entities.GameDevTask.filter(
        { project_id: id },
        "order_index",
        300
      );
      setTasks(list || []);
    } catch (e) {
      console.error(e);
    }
  }, [id]);

  const loadArtifacts = useCallback(async () => {
    try {
      const list = await base44.entities.CodeArtifact.filter(
        { project_id: id },
        "-created_date",
        300
      );
      setArtifacts(list || []);
    } catch (e) {
      console.error(e);
    }
  }, [id]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadProject(), loadTasks(), loadArtifacts()]);
      setLoading(false);
    })();
  }, [loadProject, loadTasks, loadArtifacts]);

  const handleGeneratePlan = async (goal) => {
    setGeneratingPlan(true);
    try {
      const res = await base44.functions.invoke("generate_game_dev_plan", {
        project_id: id,
        goal,
      });
      const data = res?.data || res;
      if (data?.error) throw new Error(data.error);
      await loadTasks();
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleTaskStatus = async (task, status) => {
    // Optimistic update for snappy UX.
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status } : t)));
    try {
      await base44.entities.GameDevTask.update(task.id, { status });
    } catch (e) {
      console.error(e);
      await loadTasks();
    }
  };

  const handleGenerateCode = async (language, description) => {
    setGeneratingCode(true);
    try {
      const res = await base44.functions.invoke("generate_code", {
        project_id: id,
        language,
        description,
      });
      const data = res?.data || res;
      if (data?.error) throw new Error(data.error);
      await loadArtifacts();
      return data;
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleDeleteArtifact = async (artifact) => {
    try {
      await base44.entities.CodeArtifact.delete(artifact.id);
      setArtifacts((prev) => prev.filter((a) => a.id !== artifact.id));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-stone-600">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-black text-stone-300">
        <p className="text-sm text-stone-500">Project not found.</p>
        <button
          onClick={() => navigate("/app/projects")}
          className="mt-3 text-sm text-amber-400 hover:text-amber-300"
        >
          Back to projects
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-black text-stone-200">
      <GlobalNav />
      {/* Header */}
      <header className="sticky top-12 z-20 border-b border-white/5 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 md:px-8">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              onClick={() => navigate("/app/projects")}
              className="text-stone-400 transition hover:text-stone-200"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="truncate font-display text-sm font-semibold text-stone-200">
              {project.name}
            </span>
          </div>
          <span className="hidden text-xs text-stone-600 sm:block">
            {project.engine} · {project.framework}
          </span>
        </div>

        {/* Tabs */}
        <div className="mx-auto flex max-w-5xl gap-1 px-4 md:px-8">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition ${
                  active ? "text-amber-300" : "text-stone-500 hover:text-stone-300"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
                {active && (
                  <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">
        {tab === "overview" && (
          <ProjectOverview project={project} onUpdated={setProject} />
        )}
        {tab === "plan" && (
          <BuildPlanTab
            tasks={tasks}
            loading={false}
            generating={generatingPlan}
            onGenerate={handleGeneratePlan}
            onStatusChange={handleTaskStatus}
          />
        )}
        {tab === "code" && (
          <CodeTab
            artifacts={artifacts}
            loading={false}
            generating={generatingCode}
            onGenerate={handleGenerateCode}
            onDelete={handleDeleteArtifact}
          />
        )}
      </main>
    </div>
  );
}
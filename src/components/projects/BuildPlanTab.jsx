import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Sparkles,
  Circle,
  CircleDot,
  CircleCheck,
  AlertTriangle,
} from "lucide-react";

const isGroqKeyError = (msg) => /groq api key|GROQ_API_KEY/i.test(msg || "");

const STATUS_META = {
  todo: { icon: Circle, label: "To Do", color: "text-stone-500" },
  in_progress: { icon: CircleDot, label: "In Progress", color: "text-sky-400" },
  done: { icon: CircleCheck, label: "Done", color: "text-emerald-400" },
};

export default function BuildPlanTab({
  tasks,
  loading,
  generating,
  onGenerate,
  onStatusChange,
}) {
  const [goal, setGoal] = useState("");
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!goal.trim() || generating) return;
    setError("");
    try {
      await onGenerate(goal.trim());
      setGoal("");
    } catch (err) {
      setError(err?.message || "Could not generate the plan.");
    }
  };

  const doneCount = tasks.filter((t) => t.status === "done").length;
  const progress =
    tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  const sorted = [...tasks].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

  return (
    <div className="space-y-6">
      {/* Generate */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-stone-200">
            Generate Build Plan
          </h3>
        </div>
        <Textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="What do you want to build? e.g. A new playable character with light/heavy attacks, a special move, and block stun..."
          rows={3}
          disabled={generating}
          className="resize-none border-white/10 bg-white/5 text-stone-100 placeholder:text-stone-600 focus:border-amber-500/50"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-stone-600">
            Lovelace breaks your goal into an ordered, actionable UFE2 plan.
          </p>
          <Button
            onClick={handleGenerate}
            disabled={generating || !goal.trim()}
            className="border-0 bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-500 hover:to-orange-500"
          >
            {generating ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Forging plan...
              </>
            ) : (
              <>
                <Sparkles className="mr-1.5 h-4 w-4" /> Generate Plan
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

      {/* Progress */}
      {tasks.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-stone-300">
              {doneCount} / {tasks.length} done
            </span>
            <span className="text-stone-500">{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Task list */}
      {loading ? (
        <div className="flex justify-center py-10 text-stone-600">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.01] py-12 text-center">
          <Sparkles className="mx-auto mb-3 h-6 w-6 text-stone-700" />
          <p className="text-sm text-stone-500">Generate a build plan to get started.</p>
        </div>
      ) : (
        <ol className="space-y-2.5">
          {sorted.map((task, i) => (
            <TaskRow
              key={task.id}
              index={i}
              task={task}
              onStatusChange={onStatusChange}
            />
          ))}
        </ol>
      )}
    </div>
  );
}

function TaskRow({ index, task, onStatusChange }) {
  const meta = STATUS_META[task.status] || STATUS_META.todo;
  const StatusIcon = meta.icon;
  const [busy, setBusy] = useState(false);

  const cycle = async () => {
    const next =
      task.status === "todo"
        ? "in_progress"
        : task.status === "in_progress"
        ? "done"
        : "todo";
    setBusy(true);
    try {
      await onStatusChange(task, next);
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3.5 transition hover:border-white/10">
      <button
        onClick={cycle}
        disabled={busy}
        className="mt-0.5 shrink-0"
        title={`Status: ${meta.label} — click to advance`}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin text-stone-500" />
        ) : (
          <StatusIcon className={`h-4 w-4 ${meta.color}`} />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-stone-600">
            {String(index + 1).padStart(2, "0")}
          </span>
          <h4
            className={`text-sm font-medium ${
              task.status === "done" ? "text-stone-500 line-through" : "text-stone-200"
            }`}
          >
            {task.title}
          </h4>
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              task.task_type === "Automatable"
                ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30"
                : "bg-white/5 text-stone-400 ring-1 ring-white/10"
            }`}
          >
            {task.task_type || "Manual"}
          </span>
          {task.effort_estimate && (
            <span className="text-[10px] text-stone-500">~{task.effort_estimate}</span>
          )}
        </div>
        {task.description && (
          <p className="mt-1 text-xs leading-relaxed text-stone-500">{task.description}</p>
        )}
      </div>
    </li>
  );
}
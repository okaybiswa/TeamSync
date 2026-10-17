
"use client";

import { useCallback, useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
};

const columns = [
  {
    status: "TODO",
    label: "To Do",
    subtitle: "Ready when you are",
    icon: "○",
    color: "bg-slate-400",
    badge: "bg-slate-100 text-slate-600",
  },
  {
    status: "IN_PROGRESS",
    label: "In Progress",
    subtitle: "Currently being worked on",
    icon: "◷",
    color: "bg-indigo-500",
    badge: "bg-indigo-50 text-indigo-700",
  },
  {
    status: "DONE",
    label: "Done",
    subtitle: "Successfully completed",
    icon: "✓",
    color: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700",
  },
] as const;

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [workspaceName, setWorkspaceName] = useState("Your workspace");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const loadTasks = useCallback(async (id: string) => {
    if (!id) return;

    try {
      const response = await fetch(`${API}/tasks/workspace/${id}`);

      if (!response.ok) {
        throw new Error("Could not load tasks.");
      }

      const data = await response.json();
      setTasks(data.tasks || []);
      setError("");
    } catch {
      setError("Could not load tasks. Check that your backend is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("teamsync_user");

    if (!stored) {
      window.location.href = "/";
      return;
    }

    async function loadWorkspace() {
      try {
        const user = JSON.parse(stored!);
        const response = await fetch(
          `${API}/workspaces/user/${user.id}`
        );

        if (!response.ok) {
          throw new Error("Could not load workspace.");
        }

        const data = await response.json();
        const firstWorkspace = data.workspaces?.[0];

        if (!firstWorkspace) {
          setError("No workspace found. Create a workspace first.");
          setLoading(false);
          return;
        }

        setWorkspaceId(firstWorkspace.id);
        setWorkspaceName(firstWorkspace.name);
      } catch {
        setError("Could not load your workspace. Please try again.");
        setLoading(false);
      }
    }

    loadWorkspace();
  }, []);

  useEffect(() => {
    if (workspaceId) {
      loadTasks(workspaceId);
    }
  }, [workspaceId, loadTasks]);

  async function createTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!title.trim() || !workspaceId || creating) return;

    setCreating(true);
    setError("");

    try {
      const response = await fetch(`${API}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          workspaceId,
          status: "TODO",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not create task.");
      }

      const newTask = data.task || data;
      setTasks((current) => [
        newTask,
        ...current.filter((task) => task.id !== newTask.id),
      ]);
      setTitle("");
      setDescription("");
      setShowForm(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create task."
      );
    } finally {
      setCreating(false);
    }
  }

  async function moveTask(task: Task, status: Task["status"]) {
    if (task.status === status || movingTaskId) return;

    setMovingTaskId(task.id);
    setError("");

    try {
      const response = await fetch(`${API}/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not update task.");
      }

      setTasks((current) =>
        current.map((item) =>
          item.id === task.id
            ? { ...item, status: data.task?.status || status }
            : item
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update task."
      );
    } finally {
      setMovingTaskId(null);
    }
  }

  const completedCount = tasks.filter(
    (task) => task.status === "DONE"
  ).length;

  const progress =
    tasks.length > 0
      ? Math.round((completedCount / tasks.length) * 100)
      : 0;

  return (
    <main className="min-h-screen bg-[#f5f6fa] text-slate-900">
      {/* Top navigation */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#111832] text-white shadow-lg shadow-slate-900/5">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <a
              href="/dashboard"
              aria-label="Back to chat"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg transition hover:bg-white/10"
            >
              ←
            </a>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-xl font-bold shadow-lg shadow-indigo-950/30">
              T
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-wide">
                TeamSync
              </p>
              <p className="truncate text-xs text-slate-400">
                {workspaceName}
              </p>
            </div>
          </div>

          <a
            href="/dashboard"
            className="hidden items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10 sm:flex"
          >
            <span>▤</span>
            Back to Chat
          </a>

          <a
            href="/dashboard"
            aria-label="Back to chat"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 text-lg sm:hidden"
          >
            ▤
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-4 py-7 sm:px-6 sm:py-10 lg:px-10">
        {/* Page heading */}
        <section className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              Project management
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Task board<span className="text-indigo-600">.</span>
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
              Plan your work, keep your team aligned, and turn progress
              into results.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowForm((value) => !value);
              setError("");
            }}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 active:scale-[0.98] md:self-auto"
          >
            <span className="text-lg leading-none">+</span>
            {showForm ? "Close form" : "New task"}
          </button>
        </section>

        {/* Summary cards */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.02]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">
                Total tasks
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-lg text-indigo-600">
                ▤
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight">
              {tasks.length}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Across your entire board
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.02]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">
                In progress
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-lg text-amber-600">
                ◷
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight">
              {tasks.filter((task) => task.status === "IN_PROGRESS").length}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Tasks being worked on
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.02]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">
                Completed
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-lg text-emerald-600">
                ✓
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight">
              {completedCount}
              <span className="ml-2 text-sm font-medium text-slate-400">
                / {tasks.length}
              </span>
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {progress}% completion
            </p>
          </div>
        </section>

        {/* New task form */}
        {showForm && (
          <section className="mb-8 overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-indigo-50/50 px-5 py-4 sm:px-6">
              <h2 className="font-bold text-slate-900">Create a task</h2>
              <p className="mt-1 text-sm text-slate-500">
                Add a task to your workspace board.
              </p>
            </div>

            <form
              onSubmit={createTask}
              className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[1fr_1fr_auto] lg:items-end"
            >
              <div>
                <label
                  htmlFor="task-title"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Task title
                </label>
                <input
                  id="task-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Design the dashboard"
                  required
                  maxLength={200}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>

              <div>
                <label
                  htmlFor="task-description"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Description <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <input
                  id="task-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What needs to be done?"
                  maxLength={1000}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>

              <button
                type="submit"
                disabled={!workspaceId || !title.trim() || creating}
                className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create task →"}
              </button>
            </form>
          </section>
        )}

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            <span className="font-bold">!</span>
            <p className="min-w-0 flex-1">{error}</p>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
              className="font-bold text-rose-500 hover:text-rose-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Board title */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Your workflow
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Move tasks between columns as work progresses.
            </p>
          </div>

          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500">
            {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
          </span>
        </div>

        {/* Kanban columns */}
        <div className="grid items-start gap-5 md:grid-cols-3">
          {columns.map((column) => {
            const columnTasks = tasks.filter(
              (task) => task.status === column.status
            );

            return (
              <section
                key={column.status}
                className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-[#edf0f7]/70 p-3 sm:p-4"
              >
                <div className="mb-4 flex items-center justify-between gap-3 px-1 pt-1">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-lg font-bold shadow-sm ${column.badge.split(" ")[1]}`}
                    >
                      {column.icon}
                    </span>

                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-800">
                        {column.label}
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {column.subtitle}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`flex h-7 min-w-7 shrink-0 items-center justify-center rounded-lg px-2 text-xs font-bold ${column.badge}`}
                  >
                    {columnTasks.length}
                  </span>
                </div>

                <div className="mb-3 h-1 overflow-hidden rounded-full bg-white">
                  <div
                    className={`h-full rounded-full ${column.color}`}
                    style={{
                      width:
                        columnTasks.length > 0
                          ? `${Math.min(100, columnTasks.length * 25)}%`
                          : "0%",
                    }}
                  />
                </div>

                <div className="space-y-3">
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2].map((item) => (
                        <div
                          key={item}
                          className="animate-pulse rounded-xl border border-slate-200/70 bg-white p-4"
                        >
                          <div className="h-3 w-3/4 rounded bg-slate-200" />
                          <div className="mt-3 h-2 w-full rounded bg-slate-100" />
                          <div className="mt-2 h-2 w-2/3 rounded bg-slate-100" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {columnTasks.map((task) => (
                        <article
                          key={task.id}
                          className="group rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-900/[0.02] transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md hover:shadow-slate-900/[0.05]"
                        >
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${column.badge}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${column.color}`}
                              />
                              {column.label}
                            </span>

                            <span
                              className="text-xs text-slate-300 transition group-hover:text-slate-500"
                              title="Team task"
                            >
                              ◆
                            </span>
                          </div>

                          <h4 className="break-words text-sm font-bold leading-6 text-slate-800">
                            {task.title}
                          </h4>

                          {task.description && (
                            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-500">
                              {task.description}
                            </p>
                          )}

                          <div className="mt-4 border-t border-slate-100 pt-3">
                            <label
                              htmlFor={`status-${task.id}`}
                              className="mb-2 block text-xs font-medium text-slate-500"
                            >
                              Update status
                            </label>

                            <select
                              id={`status-${task.id}`}
                              value={task.status}
                              disabled={movingTaskId === task.id}
                              onChange={(e) =>
                                moveTask(
                                  task,
                                  e.target.value as Task["status"]
                                )
                              }
                              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 disabled:opacity-60"
                            >
                              {columns.map((option) => (
                                <option
                                  key={option.status}
                                  value={option.status}
                                >
                                  {option.label}
                                </option>
                              ))}
                            </select>

                            {movingTaskId === task.id && (
                              <p className="mt-2 text-xs text-indigo-600">
                                Updating status...
                              </p>
                            )}
                          </div>
                        </article>
                      ))}

                      {columnTasks.length === 0 && (
                        <div className="flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300/80 bg-white/60 px-4 py-6 text-center">
                          <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg text-slate-400 shadow-sm">
                            {column.icon}
                          </span>
                          <p className="text-sm font-semibold text-slate-600">
                            Nothing here yet
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-400">
                            Tasks in this stage will appear here.
                          </p>

                          {column.status === "TODO" && (
                            <button
                              type="button"
                              onClick={() => setShowForm(true)}
                              className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                            >
                              + Add your first task
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        {/* Footer */}
        <footer className="mt-10 flex flex-col justify-between gap-2 border-t border-slate-200 pt-5 text-xs text-slate-400 sm:flex-row sm:items-center">
          <p>TeamSync · Better teamwork, one task at a time.</p>
          <p>Your workspace · Task board</p>
        </footer>
      </div>
    </main>
  );
}

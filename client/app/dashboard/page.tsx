
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Workspace = {
  id: string;
  name: string;
  description: string | null;
  role: string;
};

type Channel = {
  id: string;
  name: string;
  description: string | null;
};

type Message = {
  id: string;
  content: string;
  userId: string;
  userName: string;
  channelId: string;
  createdAt: string;
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "U";
}

function formatMessageTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Dashboard() {
  const [user, setUser] = useState({ id: "", name: "Team Member" });
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
const [workspaceName, setWorkspaceName] = useState("");
const [workspaceDescription, setWorkspaceDescription] = useState("");
const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(true);

  useEffect(() => {
    const stored = localStorage.getItem("teamsync_user");

    if (!stored) {
      window.location.href = "/";
      return;
    }

    try {
      const parsed = JSON.parse(stored);

      if (!parsed.id) throw new Error("Invalid session");

      setUser({
        id: parsed.id,
        name: parsed.name || "Team Member",
      });

      fetch(`${API}/workspaces/user/${parsed.id}`)
        .then(async (res) => {
          if (!res.ok) throw new Error("Could not load workspaces");
          return res.json();
        })
        .then((data) => {
          const list: Workspace[] = data.workspaces || [];
          setWorkspaces(list);

          if (list.length) {
            setWorkspace(list[0]);
          }
        })
        .catch(() => setError("Could not load workspaces."))
        .finally(() => setLoading(false));
    } catch {
      localStorage.removeItem("teamsync_user");
      window.location.href = "/";
    }
  }, []);

  useEffect(() => {
    if (!workspace) return;

    let cancelled = false;

    setChannel(null);
    setChannels([]);
    setMessages([]);
    setError("");

    fetch(`${API}/channels/workspace/${workspace.id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not load channels");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;

        const list: Channel[] = data.channels || [];
        setChannels(list);

        if (list.length) {
          setChannel(list[0]);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load channels.");
      });

    return () => {
      cancelled = true;
    };
  }, [workspace]);

  const loadMessages = useCallback(async () => {
    if (!channel) return;

    try {
      const res = await fetch(`${API}/messages/channel/${channel.id}`);

      if (!res.ok) throw new Error("Could not load messages");

      const data = await res.json();
      const nextMessages: Message[] = data.messages || [];

      setMessages(nextMessages);
      setError("");
    } catch {
      setError("Could not load messages. Please try again.");
    }
  }, [channel]);

  useEffect(() => {
    if (!channel) {
      setMessages([]);
      setMessagesLoading(false);
      return;
    }

    let active = true;

    setMessages([]);
    setMessagesLoading(true);
    shouldScrollRef.current = true;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`${API}/messages/channel/${channel.id}`);

        if (!res.ok) throw new Error("Could not load messages");

        const data = await res.json();

        if (!active) return;

        setMessages(data.messages || []);
        setError("");
      } catch {
        if (active) setError("Could not load messages. Please try again.");
      } finally {
        if (active) setMessagesLoading(false);
      }
    };

    fetchMessages();

    const timer = setInterval(() => {
      if (active) loadMessages();
    }, 3000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [channel, loadMessages]);

  useEffect(() => {
    if (shouldScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      shouldScrollRef.current = false;
    }
  }, [messages]);
  
async function createWorkspace(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();

  const name = workspaceName.trim();
  const description = workspaceDescription.trim();

  if (!name || !user.id || creatingWorkspace) return;

  setCreatingWorkspace(true);
  setError("");

  try {
    const res = await fetch(`${API}/workspaces`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description: description || null,
        userId: user.id,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Could not create workspace.");
    }

    const created: Workspace = {
      ...data.workspace,
      role: "owner",
    };

    setWorkspaces((current) => [...current, created]);
    setWorkspace(created);
    setWorkspaceName("");
    setWorkspaceDescription("");
    setShowCreateWorkspace(false);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Could not create workspace. Please try again."
    );
  } finally {
    setCreatingWorkspace(false);
  }
}

  async function sendMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const content = draft.trim();

    if (!content || !channel || !user.id || sending) return;

    setSending(true);
    setError("");

    try {
      const res = await fetch(`${API}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          userId: user.id,
          channelId: channel.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Could not send message.");
      }

      setDraft("");
      shouldScrollRef.current = true;
      await loadMessages();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not connect to the server."
      );
    } finally {
      setSending(false);
    }
  }

  function logout() {
    localStorage.removeItem("teamsync_user");
    window.location.href = "/";
  }

  return (
    <main className="flex h-screen min-h-[560px] overflow-hidden bg-[#f5f7fc] text-slate-900">
      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/50 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#111832] text-slate-300 transition-all duration-200 md:static md:z-auto ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${sidebarCollapsed ? "md:w-[76px]" : "md:w-72"}`}
      >
        <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-lg font-bold text-white">
              T
            </div>

            {!sidebarCollapsed && (
              <div>
                <p className="font-bold tracking-tight text-white">TeamSync</p>
                <p className="text-[11px] text-slate-400">Team workspace</p>
              </div>
            )}
          </div>

          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setMobileSidebarOpen(false)}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 md:hidden"
          >
            ✕
          </button>

          <button
            type="button"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setSidebarCollapsed((value) => !value)}
            className="hidden rounded-lg p-2 text-slate-400 hover:bg-white/10 md:block"
          >
            {sidebarCollapsed ? "→" : "←"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            {sidebarCollapsed ? "•••" : "Workspace"}
          </p>
          
<button
  type="button"
  onClick={() => {
    setShowCreateWorkspace(true);
    setError("");
    setMobileSidebarOpen(false);
  }}
  className="mb-3 flex w-full items-center gap-3 rounded-xl border border-dashed border-indigo-400/40 px-3 py-2.5 text-left text-sm font-semibold text-indigo-200 transition hover:bg-white/10"
  title="Create workspace"
>
  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-lg">
    +
  </span>
  {!sidebarCollapsed && <span>Create workspace</span>}
</button>


          {workspaces.map((item) => (
            <button
              key={item.id}
              type="button"
              title={item.name}
              onClick={() => {
                setWorkspace(item);
                setMobileSidebarOpen(false);
              }}
              className={`mb-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                workspace?.id === item.id
                  ? "bg-indigo-500/20 text-white ring-1 ring-indigo-400/20"
                  : "hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sm font-bold text-indigo-200">
                {getInitials(item.name)}
              </span>

              {!sidebarCollapsed && (
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {item.name}
                  </span>
                  <span className="mt-0.5 block text-xs capitalize text-slate-400">
                    {item.role}
                  </span>
                </span>
              )}
            </button>
          ))}

          {!loading && workspaces.length === 0 && (
            <p className="px-3 py-2 text-xs leading-5 text-slate-400">
              {sidebarCollapsed
                ? "No workspace"
                : "No workspaces found for this account."}
            </p>
          )}

          <div className="mb-5 mt-7 border-t border-white/10 pt-6">
            {!sidebarCollapsed && (
              <div className="mb-3 flex items-center justify-between px-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Channels
                </p>
                <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-slate-400">
                  {channels.length}
                </span>
              </div>
            )}

            {channels.map((item) => (
              <button
                key={item.id}
                type="button"
                title={`# ${item.name}`}
                onClick={() => {
                  setChannel(item);
                  setMobileSidebarOpen(false);
                }}
                className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                  channel?.id === item.id
                    ? "bg-white/10 font-semibold text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                }`}
              >
                <span className="w-5 shrink-0 text-center text-lg text-indigo-300">
                  #
                </span>
                {!sidebarCollapsed && (
                  <span className="truncate">{item.name}</span>
                )}
              </button>
            ))}

            {!loading && workspace && channels.length === 0 && (
              <p className="px-3 py-2 text-xs leading-5 text-slate-500">
                {sidebarCollapsed ? "—" : "No channels in this workspace yet."}
              </p>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-white/10 p-3">
          <a
            href="/tasks"
            title="Tasks board"
            className="mb-2 flex items-center gap-3 rounded-xl bg-indigo-500 px-3 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
              ✓
            </span>
            {!sidebarCollapsed && <span>Tasks board</span>}
          </a>

          <div className="flex items-center gap-3 rounded-xl px-2 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-white">
              {getInitials(user.name)}
            </div>

            {!sidebarCollapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {user.name}
                  </p>
                  <p className="text-xs text-slate-400">Team member</p>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  title="Log out"
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                >
                  ↗
                </button>
              </>
            )}
          </div>

          {sidebarCollapsed && (
            <button
              type="button"
              onClick={logout}
              title="Log out"
              className="w-full rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              ↗
            </button>
          )}
        </div>
      </aside>

      {/* Chat panel */}
      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-slate-200/80 bg-white px-4 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setMobileSidebarOpen(true)}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 md:hidden"
            >
              ☰
            </button>

            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-slate-400">
                {workspace?.name || "Your workspace"}
              </p>
              <h1 className="truncate text-lg font-bold tracking-tight sm:text-xl">
                {channel ? (
                  <>
                    <span className="mr-1 text-indigo-500">#</span>
                    {channel.name}
                  </>
                ) : (
                  "Team conversations"
                )}
              </h1>
            </div>
          </div>

          <div className="ml-3 flex shrink-0 items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Workspace
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
              {getInitials(user.name)}
            </div>
          </div>
        </header>

        {workspace?.description && (
          <div className="border-b border-slate-200/70 bg-white px-5 py-3 text-sm text-slate-500 sm:px-7">
            {workspace.description}
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-7">
            
{showCreateWorkspace && (
  <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="mb-5 flex items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold">Create a workspace</h2>
        <p className="mt-1 text-sm text-slate-500">
          Give your team a shared place to collaborate.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setShowCreateWorkspace(false)}
        className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100"
        aria-label="Close form"
      >
        ✕
      </button>
    </div>

    <form onSubmit={createWorkspace} className="space-y-4">
      <div>
        <label
          htmlFor="workspaceName"
          className="mb-2 block text-sm font-semibold"
        >
          Workspace name
        </label>
        <input
          id="workspaceName"
          value={workspaceName}
          onChange={(e) => setWorkspaceName(e.target.value)}
          placeholder="e.g. College Project Team"
          maxLength={100}
          required
          autoFocus
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
        />
      </div>

      <div>
        <label
          htmlFor="workspaceDescription"
          className="mb-2 block text-sm font-semibold"
        >
          Description (optional)
        </label>
        <textarea
          id="workspaceDescription"
          value={workspaceDescription}
          onChange={(e) => setWorkspaceDescription(e.target.value)}
          placeholder="What will your team work on?"
          maxLength={500}
          rows={3}
          className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
        />
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => setShowCreateWorkspace(false)}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={creatingWorkspace || !workspaceName.trim()}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {creatingWorkspace ? "Creating..." : "Create workspace"}
        </button>
      </div>
    </form>
  </div>
)}

            {loading && (
              <div className="space-y-4">
                <div className="h-20 animate-pulse rounded-2xl bg-white" />
                <div className="h-20 animate-pulse rounded-2xl bg-white" />
              </div>
            )}

            {!loading && !error && !workspace && (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl text-indigo-600">
                  ◫
                </span>
                <h2 className="text-lg font-bold">Welcome to TeamSync</h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  Your account does not have a workspace yet. Create one to
                  start collaborating with your team.
                </p>
              </div>
            )}

            {!loading && workspace && channels.length === 0 && (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl text-indigo-600">
                  #
                </span>
                <h2 className="text-lg font-bold">No channels yet</h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  This workspace has no channels to display. Create a channel
                  using your existing channel creation workflow.
                </p>
              </div>
            )}

            {channel && messagesLoading && messages.length === 0 && (
              <div className="space-y-4">
                <div className="h-20 animate-pulse rounded-2xl bg-white" />
                <div className="h-16 animate-pulse rounded-2xl bg-white" />
              </div>
            )}

            {channel && !messagesLoading && messages.length === 0 && (
              <div className="flex min-h-64 flex-col items-center justify-center text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-3xl text-indigo-600">
                  #
                </div>
                <h2 className="text-xl font-bold">Welcome to #{channel.name}</h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  This is the beginning of the conversation. Send a message
                  to get your team started.
                </p>
              </div>
            )}

            {messages.map((message, index) => {
              const previous = messages[index - 1];
              const showAuthor =
                !previous || previous.userId !== message.userId;

              const ownMessage = message.userId === user.id;

              return (
                <article
                  key={message.id}
                  className={`group flex gap-3 ${showAuthor ? "mt-6" : "mt-2"}`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      ownMessage
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {getInitials(message.userName)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="text-sm font-bold text-slate-900">
                        {message.userName}
                        {ownMessage && (
                          <span className="ml-2 rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600">
                            YOU
                          </span>
                        )}
                      </span>
                      <time className="text-[11px] text-slate-400">
                        {formatMessageTime(message.createdAt)}
                      </time>
                    </div>

                    <div className="inline-block max-w-full rounded-r-2xl rounded-bl-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200/70">
                      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                        {message.content}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}

            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div className="mx-4 mb-3 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-7">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError("")}
                aria-label="Dismiss error"
                className="shrink-0 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          <div className="shrink-0 border-t border-slate-200/80 bg-white p-4 sm:px-7 sm:py-5">
            <form
              onSubmit={sendMessage}
              className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2 transition focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-500/10"
            >
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder={
                  channel ? `Message #${channel.name}...` : "Select a channel to chat"
                }
                disabled={!channel || sending}
                rows={1}
                className="max-h-32 min-h-11 min-w-0 flex-1 resize-y bg-transparent px-3 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
              />

              <button
                type="submit"
                disabled={!channel || !draft.trim() || sending}
                className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span>{sending ? "Sending..." : "Send"}</span>
                {!sending && <span aria-hidden="true">↑</span>}
              </button>
            </form>

            <p className="mt-2 hidden text-[11px] text-slate-400 sm:block">
              Press Enter to send · Shift + Enter for a new line
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

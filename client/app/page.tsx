"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function Home() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API}${isRegister ? "/users" : "/login"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isRegister ? { name: name.trim(), email: email.trim(), password } :
            { email: email.trim(), password }
          ),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error || data.message || (isRegister
          ? "Unable to create account. Please try again."
          : "Invalid email or password."));
        return;
      }

      // Registration may create an account without signing the user in.
      // Only store a user object when the backend actually returns one.
      if (data.user) {
        localStorage.setItem("teamsync_user", JSON.stringify(data.user));
        router.push("/dashboard");
      } else if (isRegister) {
        setIsRegister(false);
        setPassword("");
        setError("Account created. Please sign in with your new account.");
      } else {
        setError("Signed in, but the server did not return a user profile.");
      }
    } catch (err) {
      console.error(err);
      setError("Could not connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f5f7fc] px-4 py-10 text-slate-900">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-blue-200/40 blur-3xl" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white bg-white shadow-2xl shadow-slate-200/70 md:min-h-[620px] md:grid-cols-2">
        <section className="relative hidden flex-col justify-between overflow-hidden bg-[#111832] p-10 text-white md:flex lg:p-12">
          <div className="absolute -right-20 top-28 h-64 w-64 rounded-full border border-white/10" />
          <div className="absolute -right-8 top-40 h-40 w-40 rounded-full border border-white/10" />
          <div className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-indigo-500/20 blur-2xl" />

          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500 text-xl font-bold shadow-lg shadow-indigo-950/40">T</div>
            <span className="text-xl font-bold tracking-tight">TeamSync</span>
          </div>

          <div className="relative my-12">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-indigo-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Your team&apos;s space to do great work
            </div>
            <h1 className="max-w-md text-4xl font-bold leading-tight tracking-tight lg:text-5xl">
              Great work happens <span className="text-indigo-300">together.</span>
            </h1>
            <p className="mt-6 max-w-sm text-base leading-7 text-slate-300">
              Bring conversations, teamwork, and project tasks together in one place. Stay organized and keep moving forward.
            </p>
            <div className="mt-9 space-y-4">
              {[
                "Conversations organized by channel",
                "Tasks that keep your team moving",
                "One workspace for collaboration",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/15 text-sm text-emerald-300">✓</span>
                  <span className="text-sm text-slate-200">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="relative text-xs text-slate-400">One team. One workspace. Better collaboration.</p>
        </section>

        <section className="flex flex-col justify-center px-6 py-10 sm:px-10 md:px-10 lg:px-14">
          <div className="mb-9 md:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-bold text-white">T</div>
              <span className="text-xl font-bold tracking-tight">TeamSync</span>
            </div>
          </div>

          <div className="mb-8">
            <p className="mb-3 text-sm font-semibold text-indigo-600">
              {isRegister ? "GET STARTED" : "WELCOME BACK"}
            </p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {isRegister ? "Create your account" : "Sign in to TeamSync"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {isRegister ? "Join your team and start collaborating." : "Pick up where your team left off."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-semibold text-slate-700">Full name</label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  minLength={2}
                  maxLength={100}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isRegister ? "Create a password" : "Enter your password"}
                  minLength={isRegister ? 8 : undefined}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 pr-20 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute inset-y-0 right-3 text-xs font-semibold text-slate-500 transition hover:text-indigo-600"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {isRegister && <p className="mt-2 text-xs text-slate-500">Use at least 8 characters.</p>}
            </div>

            {error && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? (isRegister ? "Creating account..." : "Signing in...")
                : (isRegister ? "Create account" : "Sign in to your workspace")}
              {!loading && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            {isRegister ? "Already have an account?" : "New to TeamSync?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsRegister((current) => !current);
                setError("");
                setPassword("");
              }}
              className="font-semibold text-indigo-600 hover:text-indigo-700"
            >
              {isRegister ? "Sign in" : "Create an account"}
            </button>
          </p>

          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">TEAM COLLABORATION</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-700">Everything your team needs, together.</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {isRegister ? "Create an account to get started with TeamSync." : "Sign in to access your workspace, conversations, and tasks."}
            </p>
          </div>

          <p className="mt-8 text-center text-xs text-slate-400">© {new Date().getFullYear()} TeamSync</p>
        </section>
      </div>
    </main>
  );
}

import React, { useEffect, useState } from "react"; // keep if not on new JSX runtime
import { api, setToken } from "../api";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";

/**
 * Login — Professional Redesign (React + Tailwind)
 * - Two-panel layout with brand/benefits panel and focused form panel
 * - Tailwind-only (no CSS variables)
 * - a11y: labels, aria-live for errors, keyboard-friendly
 * - UX: remembered username, show/hide password, disabled states, SPA navigation
 */
export default function Login() {
  const nav = useNavigate();
  const auth = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("remember_username");
    if (saved) {
      setUsername(saved);
      setRemember(true);
    }
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post("/auth/login/", { username, password });
      const token = res.data.access;
      localStorage.setItem("token", token);
      if (remember) localStorage.setItem("remember_username", username);
      else localStorage.removeItem("remember_username");
      setToken(token);
      await auth.refresh();
      nav("/");
    } catch (err) {
      setError(err?.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-6xl place-items-center px-4 py-10">
      <Card className="w-full overflow-hidden p-0 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Brand / Left Panel */}
          <div className="relative hidden md:flex min-h-[520px] flex-col justify-between bg-gradient-to-br from-indigo-600 to-violet-600 p-8 text-white">
            {/* subtle decorative glow */}
            <div className="pointer-events-none absolute -left-20 top-12 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -right-24 bottom-20 h-64 w-64 rounded-full bg-fuchsia-300/20 blur-3xl" />

            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 backdrop-blur">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold tracking-tight">RuhCart</div>
                  <div className="text-sm text-white/80">Welcome back — sign in to continue</div>
                </div>
              </div>

              <p className="mt-6 max-w-md text-white/80">
                Manage orders, track shipments, and access exclusive deals tailored for you.
              </p>

              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "Secure authentication",
                  "Faster checkout",
                  "Personalized recommendations",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                    <span className="text-white/90">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative z-10 text-xs text-white/70">
              By continuing, you agree to our
              <Link to="/terms" className="mx-1 underline hover:text-white">Terms</Link>
              and
              <Link to="/privacy" className="ml-1 underline hover:text-white">Privacy Policy</Link>.
            </div>
          </div>

          {/* Form / Right Panel */}
          <div className="p-6 sm:p-8">
            {/* Mobile brand header */}
            <div className="mb-6 md:hidden">
              <div className="text-xl font-extrabold tracking-tight text-slate-900">RuhCart</div>
              <div className="text-sm text-slate-500">Sign in to your account</div>
            </div>

            {error && (
              <div role="alert" aria-live="assertive" className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              {/* Username */}
              <div>
                <label htmlFor="username" className="mb-1.5 block text-sm text-slate-600">Username</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </span>
                  <input
                    id="username"
                    className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-200"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="your username"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm text-slate-600">Password</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </span>
                  <input
                    id="password"
                    className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-10 py-2.5 text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-200"
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute inset-y-0 right-2 grid place-items-center rounded-md px-2 text-slate-500 hover:bg-slate-100"
                    aria-label={show ? "Hide password" : "Show password"}
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-indigo-600"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  Remember me
                </label>
                <Link to="/forgot" className="text-sm text-indigo-600 hover:underline">Forgot password?</Link>
              </div>

              {/* Submit */}
              <Button className="w-full" variant="primary" disabled={loading} type="submit">
                {loading ? "Logging in…" : (
                  <span className="inline-flex items-center gap-2">
                    Login <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
              <div className="h-px flex-1 bg-slate-200" />
              <span>or</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Social (optional: wire up when available) */}
            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="outline" color="sky" className="w-full">
                <span className="inline-flex items-center gap-2"><img alt="google" src="https://www.svgrepo.com/show/475656/google-color.svg" className="h-4 w-4"/> Continue with Google</span>
              </Button>
              <Button variant="outline" color="slate" className="w-full">
                <span className="inline-flex items-center gap-2"><img alt="github" src="https://www.svgrepo.com/show/512317/github-142.svg" className="h-4 w-4"/> Continue with GitHub</span>
              </Button>
            </div>

            {/* Secondary link */}
            <p className="mt-6 text-center text-sm text-slate-600">
              New to RuhCart? <Link to="/register/customer" className="text-indigo-600 hover:underline">Create an account</Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

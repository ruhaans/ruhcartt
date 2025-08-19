import React, { useMemo, useState, useEffect } from "react"; // keep if not on new JSX runtime
import { useNavigate, Link } from "react-router-dom";
import { apiPublic } from "../apiPublic";
import { api, setToken } from "../api"; // for auto-login
import { useAuth } from "../auth"; // to refresh user after setting token
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, Info } from "lucide-react";

export default function RegisterCustomer() {
  const nav = useNavigate();
  const auth = useAuth();

  const [form, setForm] = useState({ username: "", email: "", password: "", password2: "" });
  const [errors, setErrors] = useState({}); // field-wise errors from server
  const [error, setError] = useState(null); // non-field error
  const [msg, setMsg] = useState(null); // success message
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  // Dynamically load zxcvbn (tiny perf win and optional)
  const zxcvbn = useZxcvbnTS();
  const strength = useMemo(() => measureStrength(form.password, zxcvbn, [form.username, form.email]), [form.password, form.username, form.email, zxcvbn]);
  const minScore = 3; // 0..4 from zxcvbn; require 3 (Good) to enable submit

  const change = (k) => (e) => {
    setForm({ ...form, [k]: e.target.value });
    setErrors((prev) => ({ ...prev, [k]: null })); // clear field error on change
  };

  async function submit(e) {
    e.preventDefault();
    setError(null); setMsg(null); setErrors({});

    if (form.password !== form.password2) {
      setErrors({ password2: "Passwords do not match" });
      return;
    }

    if (strength.score < minScore) {
      setErrors((prev) => ({ ...prev, password: "Please choose a stronger password (Good or Strong)." }));
      return;
    }

    setLoading(true);
    try {
      // 1) Create account
      await apiPublic.post("/auth/register/customer/", form);

      // 2) Auto-login
      const loginRes = await api.post("/auth/login/", { username: form.username, password: form.password });
      const token = loginRes.data?.access;
      if (!token) throw new Error("No token received");
      localStorage.setItem("token", token);
      setToken(token);
      await auth.refresh();

      // 3) Success message (optional) then go home
      setMsg("Welcome to RuhCart! You're now signed in.");
      nav("/");
    } catch (err) {
      const resp = err?.response?.data;
      if (resp && typeof resp === "object") {
        const mapped = {};
        for (const [k, v] of Object.entries(resp)) mapped[k] = Array.isArray(v) ? String(v[0]) : String(v);
        if (mapped.non_field_errors || mapped.detail) {
          setError(mapped.non_field_errors || mapped.detail);
          delete mapped.non_field_errors; delete mapped.detail;
        }
        setErrors(mapped);
      } else {
        setError(err?.message || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-6xl place-items-center px-4 py-10">
      <Card className="w-full overflow-hidden p-0 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Brand / Left Panel */}
          <div className="relative hidden md:flex min-h-[660px] flex-col justify-between bg-gradient-to-br from-indigo-600 to-violet-600 p-8 text-white">
            <div className="pointer-events-none absolute -left-20 top-12 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -right-24 bottom-20 h-64 w-64 rounded-full bg-fuchsia-300/20 blur-3xl" />

            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 backdrop-blur">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold tracking-tight">RuhCart</div>
                  <div className="text-sm text-white/80">Create your customer account</div>
                </div>
              </div>

              <p className="mt-6 max-w-md text-white/85">
                Join RuhCart to shop faster, track your orders, and unlock exclusive member offers.
              </p>

              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "Exclusive member-only deals",
                  "Order tracking & quick returns",
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
              Already a member?
              <Link to="/login" className="ml-1 underline hover:text-white">Log in</Link>
            </div>
          </div>

          {/* Form / Right Panel */}
          <div className="p-6 sm:p-8">
            {/* Mobile heading */}
            <div className="mb-6 md:hidden">
              <div className="text-xl font-extrabold tracking-tight text-slate-900">Customer Signup</div>
              <div className="text-sm text-slate-500">Create your RuhCart account</div>
            </div>

            {/* Success / Error banners */}
            {msg && (
              <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status" aria-live="polite">{msg}</div>
            )}
            {error && (
              <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert" aria-live="assertive">{error}</div>
            )}

            <form onSubmit={submit} className="space-y-4">
              {/* Username */}
              <Field
                id="username"
                label="Username"
                type="text"
                icon={User}
                value={form.username}
                onChange={change("username")}
                error={errors.username}
                autoComplete="username"
                placeholder="your username"
              />

              {/* Email */}
              <Field
                id="email"
                label="Email"
                type="email"
                icon={Mail}
                value={form.email}
                onChange={change("email")}
                error={errors.email}
                autoComplete="email"
                placeholder="you@example.com"
              />

              {/* Password */}
              <PasswordField
                id="password"
                label="Password"
                value={form.password}
                onChange={change("password")}
                show={showPw}
                setShow={setShowPw}
                error={errors.password}
                autoComplete="new-password"
                placeholder="••••••••"
              />

              {/* Strength meter + tips */}
              <StrengthMeter strength={strength} minScore={minScore} />
              {strength.suggestions.length > 0 && (
                <div className="flex items-start gap-2 text-xs text-slate-600">
                  <Info className="mt-0.5 h-3.5 w-3.5 text-slate-400" />
                  <ul className="list-disc pl-4 space-y-1">
                    {strength.suggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Confirm Password */}
              <PasswordField
                id="password2"
                label="Confirm Password"
                value={form.password2}
                onChange={change("password2")}
                show={showPw2}
                setShow={setShowPw2}
                error={errors.password2}
                autoComplete="new-password"
                placeholder="••••••••"
              />

              <Button className="mt-2 w-full" variant="primary" disabled={loading} type="submit">
                {loading ? "Creating…" : (
                  <span className="inline-flex items-center gap-2">Create account <ArrowRight className="h-4 w-4" /></span>
                )}
              </Button>

              <p className="text-center text-sm text-slate-600">
                Already have an account? <Link to="/login" className="text-indigo-600 hover:underline">Log in</Link>
              </p>
            </form>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ---------------- Reusable fields ---------------- */
function Field({ id, label, icon: Icon, error, className, ...props }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm text-slate-600">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center"><Icon className="h-4 w-4 text-slate-400" /></span>
        <input
          id={id}
          className={cn(
            "w-full rounded-lg border bg-white pl-10 pr-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-200",
            error ? "border-rose-400" : "border-slate-300"
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}

function PasswordField({ id, label, show, setShow, error, className, ...props }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm text-slate-600">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center"><Lock className="h-4 w-4 text-slate-400" /></span>
        <input
          id={id}
          type={show ? "text" : "password"}
          className={cn(
            "w-full rounded-lg border bg-white pl-10 pr-10 py-2.5 text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-200",
            error ? "border-rose-400" : "border-slate-300"
          )}
          {...props}
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
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}

function StrengthMeter({ strength, minScore = 3 }) {
  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong"];
  const colors = ["bg-rose-500", "bg-amber-500", "bg-sky-500", "bg-emerald-600", "bg-emerald-700"];
  const score = Math.max(0, Math.min(4, strength.score));
  return (
    <div className="mt-1.5">
      <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
        <span>Password strength</span>
        <span className={cn("font-medium", score >= minScore ? "text-emerald-700" : "text-slate-600")}>{labels[score]}</span>
      </div>
      <div className="grid grid-cols-5 gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={cn("h-1.5 rounded-full", i <= score ? colors[score] : "bg-slate-200")} />
        ))}
      </div>
      {score < minScore && (
        <p className="mt-1.5 text-xs text-slate-600">Use at least 8 characters with a mix of upper/lowercase, numbers, and symbols.</p>
      )}
    </div>
  );
}

// Load zxcvbn lazily; fall back to heuristic if unavailable
// Load @zxcvbn-ts/* lazily (robust with Vite)
function useZxcvbnTS() {
  const [fn, setFn] = useState(null);
  useEffect(() => {
    let mounted = true;
    Promise.all([
      import("@zxcvbn-ts/core"),
      import("@zxcvbn-ts/language-common"),
      import("@zxcvbn-ts/language-en"),
    ])
      .then(([core, common, en]) => {
        if (!mounted) return;
        const { zxcvbn, zxcvbnOptions } = core;
        zxcvbnOptions.setOptions({
          translations: en.translations,
          graphs: common.adjacencyGraphs,
          dictionary: { ...common.dictionary, ...en.dictionary },
        });
        setFn(() => zxcvbn);
      })
      .catch(() => setFn(null));
    return () => {
      mounted = false;
    };
  }, []);
  return fn; // function(password, userInputs)
}

function measureStrength(pw, zxcvbn, userInputs = []) {
  try {
    if (zxcvbn) {
      const res = zxcvbn(pw || "", userInputs.filter(Boolean));
      return {
        score: res.score, // 0..4
        suggestions: [
          ...(res.feedback?.warning ? [res.feedback.warning] : []),
          ...(res.feedback?.suggestions || []),
        ],
      };
    }
  } catch (e) {
    // fall through to heuristic
  }
  // Fallback heuristic (rough)
  const len = pw?.length || 0;
  let score = 0;
  if (len >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (len >= 12) score++;
  return { score: Math.min(score, 4), suggestions: [] };
}

// Utility: classnames minimal clone (if you don't already have cn)
function cn(...a) {
  return a.filter(Boolean).join(" ");
}

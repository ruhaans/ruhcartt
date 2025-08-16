import { useState } from "react";
import { apiPublic } from "../apiPublic";
import { useNavigate } from "react-router-dom";

export default function RegisterCustomer() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const change = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMsg(null);
    if (form.password !== form.password2) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await apiPublic.post("/auth/register/seller/", form);
      setMsg("Account created. You can login now.");
      // optional: redirect to login after a moment
      setTimeout(() => nav("/login"), 800);
    } catch (err: any) {
      setError(
        typeof err?.response?.data === "object"
          ? JSON.stringify(err.response.data)
          : "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ padding: 24, maxWidth: 420 }}>
      <h1>Customer Signup</h1>
      {msg && <p style={{ color: "green" }}>{msg}</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <label>
        Username
        <input
          value={form.username}
          onChange={change("username")}
          placeholder="your username"
          style={{ display: "block", width: "100%", margin: "6px 0 12px" }}
          required
        />
      </label>

      <label>
        Email
        <input
          type="email"
          value={form.email}
          onChange={change("email")}
          placeholder="you@example.com"
          style={{ display: "block", width: "100%", margin: "6px 0 12px" }}
          required
        />
      </label>

      <label>
        Password
        <input
          type="password"
          value={form.password}
          onChange={change("password")}
          placeholder="••••••••"
          style={{ display: "block", width: "100%", margin: "6px 0 12px" }}
          required
        />
      </label>

      <label>
        Confirm Password
        <input
          type="password"
          value={form.password2}
          onChange={change("password2")}
          placeholder="••••••••"
          style={{ display: "block", width: "100%", margin: "6px 0 16px" }}
          required
        />
      </label>

      <button disabled={loading} type="submit">
        {loading ? "Creating..." : "Create account"}
      </button>
    </form>
  );
}

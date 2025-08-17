import React, { useState } from "react"; // remove React import if using the new JSX runtime
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
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const change = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setMsg(null);
    if (form.password !== form.password2) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      // If your API really expects /seller/, keep it; otherwise this is the likely intended endpoint:
      const { data } = await apiPublic.post("/auth/register/customer/", form);
      setMsg("Account created. You can login now.");
      setTimeout(() => nav("/login"), 800);
    } catch (err) {
      const resp = err?.response?.data;
      if (resp && typeof resp === "object") {
        // Pretty-print field errors if present
        const firstField = Object.keys(resp)[0];
        const firstMsg = Array.isArray(resp[firstField]) ? resp[firstField][0] : resp[firstField];
        setError(String(firstMsg ?? "Registration failed"));
      } else {
        setError("Registration failed");
      }
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
          autoComplete="username"
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
          autoComplete="email"
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
          autoComplete="new-password"
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
          autoComplete="new-password"
          required
        />
      </label>

      <button disabled={loading} type="submit">
        {loading ? "Creating..." : "Create account"}
      </button>
    </form>
  );
}

import React, { useState } from "react"; // remove this if you're on the new JSX runtime
import { api } from "../api"; // switch to apiPublic if your register endpoint is public
import { useNavigate } from "react-router-dom";

export default function RegisterSeller() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
    shop_name: "",
  });
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const change = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setMsg(null);
    if (form.password !== form.password2) return setError("Passwords do not match");
    if (!form.shop_name.trim()) return setError("Shop name is required");
    setLoading(true);
    try {
      await api.post("/auth/register/seller/", form); // use apiPublic if needed
      setMsg("Seller account created. You can login now.");
      setTimeout(() => nav("/login"), 800);
    } catch (err) {
      const resp = err?.response?.data;
      if (resp && typeof resp === "object") {
        const firstKey = Object.keys(resp)[0];
        const firstMsg = Array.isArray(resp[firstKey]) ? resp[firstKey][0] : resp[firstKey];
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
      <h1>Seller Signup</h1>
      {msg && <p style={{ color: "green" }}>{msg}</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <label>
        Username
        <input
          value={form.username}
          onChange={change("username")}
          required
          placeholder="your seller username"
          style={{ display: "block", width: "100%", margin: "6px 0 12px" }}
          autoComplete="username"
        />
      </label>

      <label>
        Email
        <input
          type="email"
          value={form.email}
          onChange={change("email")}
          required
          placeholder="seller@example.com"
          style={{ display: "block", width: "100%", margin: "6px 0 12px" }}
          autoComplete="email"
        />
      </label>

      <label>
        Shop name
        <input
          value={form.shop_name}
          onChange={change("shop_name")}
          required
          placeholder="My Awesome Shop"
          style={{ display: "block", width: "100%", margin: "6px 0 12px" }}
          autoComplete="organization"
        />
      </label>

      <label>
        Password
        <input
          type="password"
          value={form.password}
          onChange={change("password")}
          required
          placeholder="••••••••"
          style={{ display: "block", width: "100%", margin: "6px 0 12px" }}
          autoComplete="new-password"
        />
      </label>

      <label>
        Confirm Password
        <input
          type="password"
          value={form.password2}
          onChange={change("password2")}
          required
          placeholder="••••••••"
          style={{ display: "block", width: "100%", margin: "6px 0 16px" }}
          autoComplete="new-password"
        />
      </label>

      <button disabled={loading} type="submit">
        {loading ? "Creating..." : "Create seller account"}
      </button>
    </form>
  );
}

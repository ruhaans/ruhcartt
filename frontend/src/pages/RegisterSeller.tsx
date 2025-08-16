import { useState } from "react";
import { api } from "../api";
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
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const change = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setMsg(null);
    if (form.password !== form.password2) return setError("Passwords do not match");
    if (!form.shop_name.trim()) return setError("Shop name is required");
    setLoading(true);
    try {
      await api.post("/auth/register/seller/", form);
      setMsg("Seller account created. You can login now.");
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
      <h1>Seller Signup</h1>
      {msg && <p style={{ color: "green" }}>{msg}</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <label>
        Username
        <input value={form.username} onChange={change("username")} required
               placeholder="your seller username"
               style={{ display:"block", width:"100%", margin:"6px 0 12px" }}/>
      </label>

      <label>
        Email
        <input type="email" value={form.email} onChange={change("email")} required
               placeholder="seller@example.com"
               style={{ display:"block", width:"100%", margin:"6px 0 12px" }}/>
      </label>

      <label>
        Shop name
        <input value={form.shop_name} onChange={change("shop_name")} required
               placeholder="My Awesome Shop"
               style={{ display:"block", width:"100%", margin:"6px 0 12px" }}/>
      </label>

      <label>
        Password
        <input type="password" value={form.password} onChange={change("password")} required
               placeholder="••••••••"
               style={{ display:"block", width:"100%", margin:"6px 0 12px" }}/>
      </label>

      <label>
        Confirm Password
        <input type="password" value={form.password2} onChange={change("password2")} required
               placeholder="••••••••"
               style={{ display:"block", width:"100%", margin:"6px 0 16px" }}/>
      </label>

      <button disabled={loading} type="submit">
        {loading ? "Creating..." : "Create seller account"}
      </button>
    </form>
  );
}

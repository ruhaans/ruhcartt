import { useState } from "react";
import { api, setToken } from "../api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function Login() {
  const nav = useNavigate();
  const auth = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post("/auth/login/", { username, password });
      const token = res.data.access;
      localStorage.setItem("token", token);
      setToken(token);
      await auth.refresh();
      nav("/");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ display: "grid", placeItems: "center", minHeight: "calc(100vh - 64px)" }}>
      <form onSubmit={submit} className="card" style={{ width: 420, maxWidth: "100%" }}>
        <h1 style={{ marginTop: 0 }}>Login</h1>

        {error && <p className="text-danger">{error}</p>}

        <label className="label">Username</label>
        <input
          className="input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="your username"
          autoComplete="username"
          required
        />

        <label className="label mt-3">Password</label>
        <input
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />

        <button className="btn btn-primary mt-4" disabled={loading} type="submit">
          {loading ? "Logging in…" : "Login"}
        </button>
      </form>
    </div>
  );
}

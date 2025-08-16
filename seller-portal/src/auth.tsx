import React, { createContext, useContext, useEffect, useState } from "react";
import { api, setToken } from "./api";

type User = { id:number; username:string; email:string; role:string } | null;

type Ctx = {
  user: User;
  loading: boolean;
  login: (u:string, p:string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthCtx = createContext<Ctx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const res = await api.get("/auth/me/");
      setUser(res.data);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("seller_token");
    if (saved) setToken(saved);
    (async () => {
      if (saved) await refresh();
      setLoading(false);
    })();
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api.post("/auth/login/", { username, password });
    const token = res.data.access;
    localStorage.setItem("seller_token", token);
    setToken(token);
    await refresh();
  };

  const logout = () => {
    localStorage.removeItem("seller_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

// Route guard: only allow SELLER role
export function RequireSeller({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="container"><div className="card">Loading…</div></div>;
  if (!user) return <div className="container"><div className="card">Please log in as a seller.</div></div>;
  if (user.role !== "SELLER") return <div className="container"><div className="card">This portal is for SELLER accounts only.</div></div>;
  return children;
}

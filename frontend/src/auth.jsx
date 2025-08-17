import React, { createContext, useContext, useEffect, useState } from "react";
import { api, setToken } from "./api";

const Ctx = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const res = await api.get("/auth/me/");
      setUser(res.data);
    } catch {
      setUser(null); // silent fail if not logged in
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("token");
    if (saved) setToken(saved);
    (async () => {
      if (saved) await refresh();
      setLoading(false);
    })();
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function SellerLogin(){
  const nav = useNavigate();
  const { login, refresh } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setLoading(true);
    try{
      await login(username, password);
      const me = await refresh(); // ensures user is loaded
      // We’ll navigate regardless; guard will show message if not SELLER.
      nav("/products");
    }catch(e:any){
      setErr(e?.response?.data?.detail || "Login failed");
    }finally{
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ display:"grid", placeItems:"center", minHeight:"calc(100vh - 64px)" }}>
      <form onSubmit={submit} className="card" style={{ width:420, maxWidth:"100%" }}>
        <h1 style={{ marginTop:0 }}>Seller Login</h1>
        {err && <p className="text-danger">{err}</p>}

        <label className="label">Username</label>
        <input className="input" value={username} onChange={(e)=>setUsername(e.target.value)} required />

        <label className="label mt-3">Password</label>
        <input className="input" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />

        <button className="btn btn-primary mt-4" disabled={loading} type="submit">
          {loading ? "Logging in…" : "Login"}
        </button>
      </form>
    </div>
  );
}

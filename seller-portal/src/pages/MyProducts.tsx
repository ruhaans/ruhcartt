import { useEffect, useState } from "react";
import { api } from "../api";
import { Link, useNavigate } from "react-router-dom";

type Prod = {
  id:number; slug:string; name:string; price:number; stock:number;
  image_url?:string; is_active:boolean; category?:{ id:number; name:string; slug:string };
};

export default function MyProducts(){
  const nav = useNavigate();
  const [items, setItems] = useState<Prod[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string|null>(null);

  const load = async () => {
    setLoading(true); setErr(null);
    try{
      const res = await api.get<Prod[]>("/seller/products/");
      setItems(res.data);
    }catch(e:any){
      if (e?.response?.status === 401) { nav("/login"); return; }
      setErr("Failed to load products");
    }finally{
      setLoading(false);
    }
  };

  useEffect(()=>{ load(); },[]);

  return (
    <div className="container">
      <div className="card" style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <div>
          <h1 style={{margin:0}}>My Products</h1>
          <div className="text-muted">Manage only the products you own.</div>
        </div>
        <Link className="btn btn-primary" to="/products/new">Add Product</Link>
      </div>

      {loading && <div className="card">Loading…</div>}
      {err && <div className="card text-danger">{err}</div>}

      {!loading && !err && items.length === 0 && (
        <div className="card">No products yet. Click <b>Add Product</b> to create one.</div>
      )}

      <div className="row" style={{gap:16}}>
        {items.map(p => (
          <div key={p.id} className="card" style={{width:320}}>
            <div style={{aspectRatio:"4/3", background:"#0d0f14", borderRadius:8, overflow:"hidden", marginBottom:12}}>
              {p.image_url ? <img src={p.image_url} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/> : null}
            </div>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:8}}>
              <div style={{fontWeight:700}}>{p.name}</div>
              <span className="text-muted" style={{fontSize:".9rem"}}>{p.category?.name ?? "—"}</span>
            </div>
            <div style={{marginTop:6, display:"flex", justifyContent:"space-between"}}>
              <div>₹{p.price}</div>
              <div className="text-muted">Stock: {p.stock}</div>
            </div>
            <div className="text-muted" style={{marginTop:6}}>
              Status: {p.is_active ? "Active" : "Inactive"}
            </div>
            <div style={{marginTop:12, display:"flex", gap:8, justifyContent:"flex-end"}}>
              <Link className="btn btn-ghost" to={`/products/${p.slug}/edit`}>Edit</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

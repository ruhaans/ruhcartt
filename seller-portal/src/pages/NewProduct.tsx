import { useEffect, useState } from "react";
import { api } from "../api";
import { useNavigate, Link } from "react-router-dom";

type Category = { id:number; name:string };

export default function NewProduct(){
  const nav = useNavigate();

  const [cats, setCats] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [err, setErr] = useState<string|null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    image_url: "",
    is_active: true,
    category_id: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<Category[]>("/categories/");
        setCats(res.data);
      } catch {
        setErr("Failed to load categories");
      } finally {
        setLoadingCats(false);
      }
    })();
  }, []);

  const change = (k: keyof typeof form) => (e: any) => {
    const v = k === "is_active" ? !!e.target.checked : e.target.value;
    setForm({ ...form, [k]: v });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!form.name.trim()) return setErr("Name is required");
    if (!form.category_id) return setErr("Category is required");
    const price = Number(form.price);
    const stock = Number(form.stock);
    if (Number.isNaN(price) || price <= 0) return setErr("Price must be > 0");
    if (!Number.isInteger(stock) || stock < 0) return setErr("Stock must be a non-negative integer");

    setSubmitting(true);
    try {
      await api.post("/seller/products/", {
        name: form.name,
        description: form.description,
        price,
        stock,
        image_url: form.image_url,
        is_active: form.is_active,
        category_id: Number(form.category_id),
      });
      // Write serializer doesn't return slug; just go back to list.
      nav("/products");
    } catch (e: any) {
      setErr(
        e?.response?.data
          ? typeof e.response.data === "string" ? e.response.data : JSON.stringify(e.response.data)
          : "Failed to create product"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ marginBottom: 16, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <h1 style={{ margin: 0 }}>Add Product</h1>
          <div className="text-muted">Create a new product for your shop.</div>
        </div>
        <Link className="btn btn-ghost" to="/products">Back to My Products</Link>
      </div>

      <form className="card" onSubmit={submit} style={{ maxWidth: 720 }}>
        {err && <p className="text-danger">{err}</p>}

        <label className="label">Name</label>
        <input className="input" value={form.name} onChange={change("name")} required />

        <label className="label mt-3">Category</label>
        <select className="input" value={form.category_id} onChange={change("category_id")} required disabled={loadingCats}>
          <option value="">{loadingCats ? "Loading…" : "Select a category"}</option>
          {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <label className="label mt-3">Price (₹)</label>
        <input className="input" type="number" min="0.01" step="0.01" value={form.price} onChange={change("price")} required />

        <label className="label mt-3">Stock</label>
        <input className="input" type="number" min="0" step="1" value={form.stock} onChange={change("stock")} required />

        <label className="label mt-3">Image URL</label>
        <input className="input" type="url" value={form.image_url} onChange={change("image_url")} placeholder="https://…" />

        <label className="label mt-3">Description</label>
        <textarea className="input" rows={5} value={form.description} onChange={change("description")} />

        <div className="mt-3" style={{ display:"flex", gap:12, alignItems:"center" }}>
          <input id="active" type="checkbox" checked={form.is_active} onChange={change("is_active")} />
          <label htmlFor="active" className="text-muted">Active</label>
        </div>

        <div className="mt-4" style={{ display:"flex", gap:12 }}>
          <button className="btn btn-primary" disabled={submitting} type="submit">
            {submitting ? "Creating…" : "Create product"}
          </button>
          <Link className="btn btn-ghost" to="/products">Cancel</Link>
        </div>
      </form>
    </div>
  );
}

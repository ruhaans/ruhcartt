import { useEffect, useState } from "react";
import { api } from "../api";
import { Link, useNavigate, useParams } from "react-router-dom";

type Category = { id:number; name:string; slug:string };
type Prod = {
  id:number; slug:string; name:string; description:string;
  price:number | string; stock:number; image_url?:string;
  is_active:boolean; category?: Category;
};

export default function EditProduct(){
  const { slug } = useParams();
  const nav = useNavigate();

  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string|null>(null);
  const [saving, setSaving] = useState(false);

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
        // load categories
        const [pcats, pprod] = await Promise.all([
          api.get<Category[]>("/categories/"),
          api.get<Prod>(`/seller/products/${slug}/`)
        ]);
        setCats(pcats.data);
        const p = pprod.data;

        setForm({
          name: p.name ?? "",
          description: p.description ?? "",
          price: String(p.price ?? ""),
          stock: String(p.stock ?? ""),
          image_url: p.image_url ?? "",
          is_active: p.is_active ?? true,
          category_id: p.category?.id ? String(p.category.id) : "",
        });
      } catch (e:any) {
        setErr(e?.response?.status === 404 ? "Product not found" : "Failed to load product");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

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

    setSaving(true);
    try {
      await api.patch(`/seller/products/${slug}/`, {
        name: form.name,
        description: form.description,
        price,
        stock,
        image_url: form.image_url,
        is_active: form.is_active,
        category_id: Number(form.category_id),
      });
      nav("/products"); // back to list
    } catch (e:any) {
      setErr(
        e?.response?.data
          ? (typeof e.response.data === "string" ? e.response.data : JSON.stringify(e.response.data))
          : "Failed to save changes"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container"><div className="card">Loading…</div></div>;
  if (err && !form.name) return <div className="container"><div className="card text-danger">{err}</div></div>;

  return (
    <div className="container">
      <div className="card" style={{ marginBottom: 16, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <h1 style={{ margin: 0 }}>Edit Product</h1>
          <div className="text-muted">Update details and save.</div>
        </div>
        <Link className="btn btn-ghost" to="/products">Back to My Products</Link>
      </div>

      <form className="card" onSubmit={submit} style={{ maxWidth: 720 }}>
        {err && <p className="text-danger">{err}</p>}

        <label className="label">Name</label>
        <input className="input" value={form.name} onChange={change("name")} required />

        <label className="label mt-3">Category</label>
        <select className="input" value={form.category_id} onChange={change("category_id")} required>
          <option value="">Select a category</option>
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
          <button className="btn btn-primary" disabled={saving} type="submit">
            {saving ? "Saving…" : "Save changes"}
          </button>
          <Link className="btn btn-ghost" to="/products">Cancel</Link>
        </div>
      </form>
    </div>
  );
}

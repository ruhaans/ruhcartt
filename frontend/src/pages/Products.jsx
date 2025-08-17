import React, { useEffect, useState } from "react"; // remove React import if using the new JSX runtime
import { Link } from "react-router-dom";
import { api } from "../api";

export default function Products() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");

  const load = async (query = "") => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/products/", {
        params: query ? { q: query } : {},
      });
      setItems(res.data || []);
    } catch (e) {
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    load(q.trim());
  };

  return (
    <div className="container">
      <div className="card" style={{ marginBottom: 16 }}>
        <h1 style={{ marginTop: 0 }}>Products</h1>

        <form onSubmit={onSearch} className="row" style={{ alignItems: "center" }}>
          <input
            className="input"
            style={{ flex: 1, minWidth: 240 }}
            placeholder="Search products…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="btn btn-primary" type="submit">Search</button>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => {
              setQ("");
              load("");
            }}
          >
            Reset
          </button>
        </form>
      </div>

      {loading && <div className="card">Loading…</div>}
      {error && <div className="card text-danger">{error}</div>}
      {!loading && !error && items.length === 0 && (
        <div className="card text-muted">No products found.</div>
      )}

      <div className="row" style={{ gap: 16 }}>
        {items.map((p) => (
          <Link
            key={p.id}
            to={`/products/${p.slug}`}
            className="card"
            style={{ width: 280, textDecoration: "none" }}
          >
            <div
              style={{
                aspectRatio: "4 / 3",
                background: "#0d0f14",
                borderRadius: 8,
                overflow: "hidden",
                marginBottom: 12,
              }}
            >
              {p.image_url ? (
                <img
                  src={p.image_url}
                  alt={p.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div className="center" style={{ height: "100%", color: "var(--muted)" }}>
                  No image
                </div>
              )}
            </div>
            <div style={{ color: "var(--text)", fontWeight: 600 }}>{p.name}</div>
            <div className="text-muted" style={{ fontSize: ".9rem" }}>
              {p.category?.name ?? "Uncategorized"}
            </div>
            <div style={{ marginTop: 8, fontWeight: 700 }}>₹{p.price}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react"; // remove React import if using the new JSX runtime
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../api";

export default function ProductDetail() {
  const { slug } = useParams();
  const nav = useNavigate();

  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let on = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await api.get(`/products/${slug}/`);
        if (on) {
          setProduct(res.data);
          setQty(1);
        }
      } catch {
        if (on) setErr("Product not found");
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => {
      on = false;
    };
  }, [slug]);

  const addToCart = async () => {
    if (!product) return;
    setAdding(true);
    try {
      await api.post("/cart/add/", { product_id: product.id, quantity: qty });
      nav("/cart");
    } catch (e) {
      if (e?.response?.status === 401) {
        alert("Please login first");
        nav("/login");
      } else if (e?.response?.data?.detail) {
        alert(e.response.data.detail);
      } else {
        alert("Failed to add to cart");
      }
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="container">
      {loading && <div className="card">Loading…</div>}
      {err && <div className="card text-danger">{err}</div>}

      {!loading && !err && product && (
        <div
          className="card"
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: 24,
          }}
        >
          {/* Left: image + category */}
          <div>
            <div
              style={{
                aspectRatio: "4 / 3",
                background: "#0d0f14",
                borderRadius: 8,
                overflow: "hidden",
                marginBottom: 12,
              }}
            >
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div className="center" style={{ height: "100%", color: "var(--muted)" }}>
                  No image
                </div>
              )}
            </div>
            <div className="text-muted">
              Category: {product.category?.name ?? "—"}
            </div>
          </div>

          {/* Right: details */}
          <div>
            <h1 style={{ marginTop: 0 }}>{product.name}</h1>
            <div style={{ fontSize: 22, fontWeight: 800 }}>
              ₹{product.price}
            </div>
            <div className="text-muted" style={{ margin: "6px 0 16px" }}>
              {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
            </div>

            <p style={{ whiteSpace: "pre-wrap" }}>
              {product.description || "No description."}
            </p>

            <div style={{ display: "flex", gap: 12, marginTop: 16, alignItems: "center" }}>
              {/* qty control */}
              <div className="row" style={{ gap: 8, alignItems: "center" }}>
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >
                  −
                </button>
                <input
                  className="input"
                  style={{ width: 70, textAlign: "center" }}
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setQty(Number.isFinite(n) ? Math.max(1, n) : 1);
                  }}
                />
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                >
                  +
                </button>
              </div>

              <button
                className="btn btn-primary"
                type="button"
                disabled={product.stock <= 0 || adding}
                onClick={addToCart}
              >
                {adding ? "Adding…" : "Add to Cart"}
              </button>

              <Link className="btn btn-ghost" to="/products">
                Back to Products
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from "react"; // remove React import if using the new JSX runtime
import { api } from "../api";
import { Link, useNavigate } from "react-router-dom";

export default function CartPage() {
  const nav = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await api.get("/cart/");
      setCart(res.data);
    } catch (e) {
      if (e?.response?.status === 401) {
        nav("/login");
        return;
      }
      setErr("Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateQty = async (product_id, quantity) => {
    // guard & coerce
    quantity = Number.isFinite(Number(quantity)) ? Number(quantity) : 1;
    if (quantity < 1) quantity = 1;

    try {
      const res = await api.patch("/cart/update_item/", {
        product_id,
        quantity,
      });
      setCart(res.data);
    } catch (e) {
      alert(e?.response?.data?.detail || "Failed to update");
    }
  };

  const removeItem = async (product_id) => {
    try {
      const res = await api.delete(`/cart/remove/`, { params: { product_id } });
      setCart(res.data);
    } catch {
      alert("Failed to remove");
    }
  };

  const clear = async () => {
    try {
      const res = await api.delete("/cart/clear/");
      setCart(res.data);
    } catch {
      alert("Failed to clear cart");
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ marginBottom: 16 }}>
        <h1 style={{ marginTop: 0 }}>Your Cart</h1>
        <div className="text-muted">Review items and update quantities.</div>
      </div>

      {loading && <div className="card">Loading…</div>}
      {err && <div className="card text-danger">{err}</div>}

      {!loading && !err && cart && (
        <>
          {cart.items.length === 0 ? (
            <div className="card">
              <p className="text-muted">Your cart is empty.</p>
              <Link className="btn btn-primary mt-3" to="/products">
                Browse products
              </Link>
            </div>
          ) : (
            <div className="card">
              {cart.items.map((it) => (
                <div
                  key={it.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "72px 1fr auto",
                    gap: 12,
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: "1px solid #1c1f26",
                  }}
                >
                  <div
                    style={{
                      width: 72,
                      height: 54,
                      background: "#0d0f14",
                      borderRadius: 8,
                      overflow: "hidden",
                    }}
                  >
                    {it.product.image_url ? (
                      <img
                        src={it.product.image_url}
                        alt={it.product.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : null}
                  </div>

                  <div>
                    <Link
                      to={`/products/${it.product.slug}`}
                      style={{ textDecoration: "none", color: "var(--text)" }}
                    >
                      <strong>{it.product.name}</strong>
                    </Link>
                    <div className="text-muted">
                      ₹{Number(it.product.price).toFixed(2)} each
                    </div>
                  </div>

                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <button
                      className="btn btn-ghost"
                      type="button"
                      onClick={() => updateQty(it.product.id, it.quantity - 1)}
                    >
                      −
                    </button>

                    <input
                      className="input"
                      style={{ width: 70, textAlign: "center" }}
                      type="number"
                      min={1}
                      value={it.quantity}
                      onChange={(e) => updateQty(it.product.id, e.target.value)}
                    />

                    <button
                      className="btn btn-ghost"
                      type="button"
                      onClick={() => updateQty(it.product.id, it.quantity + 1)}
                    >
                      +
                    </button>

                    <button
                      className="btn btn-ghost"
                      type="button"
                      onClick={() => removeItem(it.product.id)}
                    >
                      Remove
                    </button>

                    <div
                      style={{
                        width: 120,
                        textAlign: "right",
                        fontWeight: 700,
                      }}
                    >
                      ₹{Number(it.subtotal).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 16,
                }}
              >
                <button className="btn btn-ghost" type="button" onClick={clear}>
                  Clear cart
                </button>
                <div style={{ fontSize: 20, fontWeight: 800 }}>
                  Total: ₹{Number(cart.total).toFixed(2)}
                </div>
              </div>

              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 12,
                }}
              >
                <Link className="btn btn-ghost" to="/products">
                  Continue shopping
                </Link>
                <Link className="btn btn-primary" to="/checkout">
                  Checkout
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

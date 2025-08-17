import React, { useEffect, useState } from "react"; // remove React import if using the new JSX runtime
import { api } from "../api";
import { Link, useNavigate } from "react-router-dom";
import { loadRazorpay } from "../payments/razorpay";

export default function Checkout() {
  const nav = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [ship, setShip] = useState("");
  const [placing, setPlacing] = useState(false);
  const [order, setOrder] = useState(null);

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

  // ---- Razorpay flow ----
  const payNow = async () => {
    setPlacing(true);
    setErr(null);
    try {
      // 1) Ask backend to create a Razorpay Order (amount from your cart)
      const { data: orderInit } = await api.post("/pay/razorpay/create_order/");
      // orderInit: { order_id, amount, currency, key, prefill, description }

      // 2) Load Razorpay script
      const ok = await loadRazorpay();
      if (!ok) {
        setErr("Failed to load Razorpay.");
        setPlacing(false);
        return;
      }

      // 3) Open Razorpay Checkout
      const options = {
        key: orderInit.key,
        amount: orderInit.amount,         // paise
        currency: orderInit.currency,     // "INR"
        name: "RuhCart",
        description: orderInit.description || "Checkout",
        order_id: orderInit.order_id,
        prefill: orderInit.prefill,
        theme: { color: "#3b82f6" },
        handler: async (resp) => {
          // 4) Verify signature + create internal Order
          try {
            const { data } = await api.post("/pay/razorpay/verify/", {
              ...resp,
              shipping_address: ship,
            });
            setOrder(data);     // show confirmation view
            setCart(null);      // cart is cleared server-side, reflect in UI
          } catch (e) {
            setErr(e?.response?.data?.detail || "Payment verification failed");
          } finally {
            setPlacing(false);
          }
        },
        modal: {
          ondismiss: () => setPlacing(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      setErr(e?.response?.data?.detail || "Failed to initiate payment");
      setPlacing(false);
    }
  };

  // ---- Confirmation view ----
  if (order) {
    return (
      <div className="container">
        <div className="card">
          <h1 style={{ marginTop: 0 }}>Order Confirmed</h1>
          {order.created_at && (
            <p className="text-muted">{new Date(order.created_at).toLocaleString()}</p>
          )}
          <p className="text-muted">
            Order ID: <b>#{order.id}</b>
          </p>
          <div style={{ marginTop: 12 }}>
            {order.items.map((it) => (
              <div
                key={it.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto",
                  gap: 12,
                  padding: "8px 0",
                  borderBottom: "1px solid #1c1f26",
                }}
              >
                <div>{it.product_name}</div>
                <div className="text-muted">x{it.quantity}</div>
                <div style={{ fontWeight: 700 }}>₹{Number(it.subtotal).toFixed(2)}</div>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
              <span>Shipping</span>
              <span className="text-muted">{order.shipping_address || "—"}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 8,
                fontSize: 18,
                fontWeight: 800,
              }}
            >
              <span>Total</span>
              <span>₹{Number(order.total).toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
              <Link className="btn btn-ghost" to="/products">
                Continue Shopping
              </Link>
              <Link className="btn btn-primary" to="/products">
                Done
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- Standard view ----
  return (
    <div className="container">
      <div className="card" style={{ marginBottom: 16 }}>
        <h1 style={{ marginTop: 0 }}>Checkout</h1>
        <p className="text-muted">Confirm your address and pay securely with Razorpay.</p>
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
            <div className="row" style={{ gap: 16 }}>
              {/* Address */}
              <div className="card" style={{ flex: "1 1 420px" }}>
                <h2 style={{ marginTop: 0 }}>Shipping Address</h2>
                <textarea
                  className="input"
                  rows={5}
                  placeholder="House/Flat, Street, City, Pincode, State"
                  value={ship}
                  onChange={(e) => setShip(e.target.value)}
                  style={{ resize: "vertical" }}
                />
                <button
                  className="btn btn-primary mt-4"
                  type="button"
                  onClick={payNow}
                  disabled={placing || cart.items.length === 0}
                >
                  {placing ? "Processing…" : "Pay with Razorpay"}
                </button>
              </div>

              {/* Summary */}
              <div className="card" style={{ flex: "1 1 420px" }}>
                <h2 style={{ marginTop: 0 }}>Order Summary</h2>
                {cart.items.map((it) => (
                  <div
                    key={it.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto auto",
                      gap: 12,
                      padding: "8px 0",
                      borderBottom: "1px solid #1c1f26",
                    }}
                  >
                    <div>
                      <Link
                        to={`/products/${it.product.slug}`}
                        style={{ textDecoration: "none", color: "var(--text)" }}
                      >
                        {it.product.name}
                      </Link>
                    </div>
                    <div className="text-muted">x{it.quantity}</div>
                    <div style={{ fontWeight: 700 }}>₹{Number(it.subtotal).toFixed(2)}</div>
                  </div>
                ))}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 16,
                    fontSize: 18,
                    fontWeight: 800,
                  }}
                >
                  <span>Total</span>
                  <span>₹{Number(cart.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

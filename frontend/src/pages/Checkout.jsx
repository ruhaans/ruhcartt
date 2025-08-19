// src/pages/Checkout.jsx
import React from "react"; // keep if not on new JSX runtime
import { api } from "../api";
import { Link, useNavigate } from "react-router-dom";
import { loadRazorpay } from "../payments/razorpay";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function Checkout() {
  const nav = useNavigate();

  const [cart, setCart] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState(null);

  const [ship, setShip] = React.useState("");
  const [placing, setPlacing] = React.useState(false);
  const [order, setOrder] = React.useState(null);

  const load = React.useCallback(async () => {
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
      setErr("Failed to load cart. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [nav]);

  React.useEffect(() => {
    load();
  }, [load]);

  // ---- Razorpay flow ----
  const payNow = async () => {
    if (!ship.trim()) {
      setErr("Please enter your shipping address before paying.");
      return;
    }
    if (!cart || !cart.items?.length) {
      setErr("Your cart is empty.");
      return;
    }

    setPlacing(true);
    setErr(null);

    try {
      // 1) Create Razorpay Order on backend
      const { data: orderInit } = await api.post("/pay/razorpay/create_order/");
      // orderInit should contain: { order_id, amount, currency, key, prefill, description }

      // 2) Ensure Razorpay script is available
      const ok = await loadRazorpay();
      if (!ok || !window.Razorpay) {
        setErr("Failed to load Razorpay.");
        setPlacing(false);
        return;
      }

      // 3) Open Razorpay Checkout
      const options = {
        key: orderInit.key,
        amount: orderInit.amount,       // paise
        currency: orderInit.currency,   // "INR"
        name: "RuhCart",
        description: orderInit.description || "Checkout",
        order_id: orderInit.order_id,
        prefill: orderInit.prefill,
        theme: { color: "#2563eb" },
        handler: async (resp) => {
          // 4) Verify + create internal Order
          try {
            const { data } = await api.post("/pay/razorpay/verify/", {
              ...resp,
              shipping_address: ship,
            });
            setOrder(data);  // show confirmation
            setCart(null);   // assume server cleared cart
          } catch (e) {
            setErr(e?.response?.data?.detail || "Payment verification failed.");
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
      setErr(e?.response?.data?.detail || "Failed to initiate payment.");
      setPlacing(false);
    }
  };

  /* ---------- Confirmation View ---------- */
  if (order) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-6">
        <Card className="p-6">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            Order Confirmed
          </h1>
          {order.created_at && (
            <p className="text-sm text-neutral-500">
              {new Date(order.created_at).toLocaleString()}
            </p>
          )}

          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
            Order ID:{" "}
            <b className="text-neutral-900 dark:text-neutral-50">#{order.id}</b>
          </p>

          <div className="mt-4 divide-y divide-neutral-200 dark:divide-neutral-800">
            {order.items.map((it) => (
              <div
                key={it.id}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-3 py-2"
              >
                <div className="text-neutral-900 dark:text-neutral-100">{it.product_name}</div>
                <div className="text-sm text-neutral-500">x{it.quantity}</div>
                <div className="text-right font-bold">
                  {inr.format(Number(it.subtotal))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-start justify-between">
            <span className="text-neutral-900 dark:text-neutral-100">Shipping</span>
            <span className="max-w-[70%] text-right text-sm text-neutral-600 dark:text-neutral-300">
              {order.shipping_address || "—"}
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between text-xl font-extrabold">
            <span>Total</span>
            <span>{inr.format(Number(order.total))}</span>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button as={Link} to="/products">Continue Shopping</Button>
            <Button as={Link} to="/products" variant="primary">Done</Button>
          </div>
        </Card>
      </div>
    );
  }

  /* ---------- Standard View ---------- */
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6">
      <Card className="mb-4 p-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Checkout</h1>
        <p className="text-sm text-neutral-500">
          Confirm your address and pay securely with Razorpay.
        </p>
      </Card>

      {loading && <CheckoutSkeleton />}

      {err && (
        <Alert role="alert" tone="error" className="mb-4" aria-live="assertive">
          {err}
        </Alert>
      )}

      {!loading && !err && cart && (
        <>
          {cart.items.length === 0 ? (
            <Card className="p-6">
              <p className="text-neutral-600 dark:text-neutral-300">Your cart is empty.</p>
              <Button as={Link} to="/products" variant="primary" className="mt-3">
                Browse products
              </Button>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-[1fr_420px]">
              {/* Address */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                  Shipping Address
                </h2>
                <label
                  htmlFor="ship"
                  className="mt-3 block text-sm text-neutral-600 dark:text-neutral-300"
                >
                  Address
                </label>
                <textarea
                  id="ship"
                  rows={5}
                  placeholder="House/Flat, Street, City, Pincode, State"
                  value={ship}
                  onChange={(e) => setShip(e.target.value)}
                  className="mt-1 w-full resize-y rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-neutral-900 outline-none
                             focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30
                             dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                />
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-neutral-500">
                    {cart.items.reduce((a, b) => a + b.quantity, 0)} item
                    {cart.items.length > 1 ? "s" : ""}
                  </div>
                  <Button
                    className="ml-auto"
                    variant="primary"
                    type="button"
                    onClick={payNow}
                    disabled={placing || cart.items.length === 0}
                    isLoading={placing}
                  >
                    {placing ? "Processing…" : "Pay with Razorpay"}
                  </Button>
                </div>
              </Card>

              {/* Summary (sticky on desktop) */}
              <aside className="md:sticky md:top-24 h-fit">
                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                    Order Summary
                  </h2>

                  <ul className="mt-3 divide-y divide-neutral-200 dark:divide-neutral-800">
                    {cart.items.map((it) => (
                      <li
                        key={it.id}
                        className="grid grid-cols-[56px_1fr_auto_auto] items-center gap-2 py-3"
                      >
                        <Link
                          to={`/products/${it.product.slug}`}
                          className="block h-14 w-14 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 dark:border-neutral-800"
                          aria-label={`View ${it.product.name}`}
                        >
                          {it.product.image_url ? (
                            <img
                              src={it.product.image_url}
                              alt=""
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : null}
                        </Link>
                        <div className="min-w-0">
                          <Link
                            to={`/products/${it.product.slug}`}
                            className="line-clamp-2 text-[15px] font-medium text-neutral-900 hover:underline dark:text-neutral-100"
                          >
                            {it.product.name}
                          </Link>
                          <span className="mt-0.5 block text-xs text-neutral-500">
                            {inr.format(Number(it.product.price))} each
                          </span>
                        </div>
                        <div className="text-sm text-neutral-500">x{it.quantity}</div>
                        <div className="text-right font-semibold text-neutral-900 dark:text-neutral-50">
                          {inr.format(Number(it.subtotal))}
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 space-y-2 text-sm">
                    <Row label="Items" value={cart.items.reduce((a, b) => a + b.quantity, 0)} />
                    <Row label="Subtotal" value={inr.format(Number(cart.total))} />
                    {/* Add shipping/tax if API provides */}
                  </div>

                  <div className="mt-4 flex items-center justify-between text-lg font-extrabold">
                    <span>Total</span>
                    <span>{inr.format(Number(cart.total))}</span>
                  </div>

                  <div className="mt-6">
                    <Button
                      as={Link}
                      to="/products"
                      variant="ghost"
                      className="w-full"
                    >
                      Continue shopping
                    </Button>
                  </div>
                </Card>
              </aside>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ---------- Small UI helpers ---------- */

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-neutral-500">{label}</span>
      <span className="text-neutral-900 dark:text-neutral-50">{value}</span>
    </div>
  );
}

function Alert({ tone = "info", className = "", children, ...rest }) {
  const styles =
    tone === "error"
      ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
      : "border-neutral-200 bg-neutral-50 text-neutral-800 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100";
  return (
    <div
      className={`rounded-md border px-3 py-2 text-sm ${styles} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-[1fr_420px]">
      <Card className="p-6">
        <div className="h-6 w-40 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="mt-3 h-32 w-full rounded-xl bg-neutral-200 dark:bg-neutral-800" />
        <div className="mt-4 h-10 w-40 rounded-xl bg-neutral-200 dark:bg-neutral-800" />
      </Card>
      <Card className="p-6">
        <div className="h-6 w-40 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="mt-3 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="grid grid-cols-[56px_1fr_auto] items-center gap-2">
              <div className="h-14 w-14 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
              <div className="h-4 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
              <div className="h-4 w-16 rounded bg-neutral-200 dark:bg-neutral-800" />
            </div>
          ))}
        </div>
        <div className="mt-6 h-10 w-full rounded-xl bg-neutral-200 dark:bg-neutral-800" />
      </Card>
    </div>
  );
}

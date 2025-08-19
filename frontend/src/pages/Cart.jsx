// src/pages/CartPage.jsx
import React from "react";
import { api } from "../api";
import { Link, useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const FREE_SHIPPING_AT = 999; // adjust for your business rules

export default function CartPage() {
  const nav = useNavigate();
  const [cart, setCart] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState(null);
  const [pendingIds, setPendingIds] = React.useState(() => new Set());
  const [clearing, setClearing] = React.useState(false);

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

  const withPending = async (pid, fn) => {
    setPendingIds((s) => new Set(s).add(pid));
    try {
      await fn();
    } finally {
      setPendingIds((s) => {
        const next = new Set(s);
        next.delete(pid);
        return next;
      });
    }
  };

  const updateQty = async (product_id, quantity) => {
    quantity = Number.isFinite(Number(quantity)) ? Number(quantity) : 1;
    if (quantity < 1) quantity = 1;

    await withPending(product_id, async () => {
      try {
        const res = await api.patch("/cart/update_item/", { product_id, quantity });
        setCart(res.data);
      } catch (e) {
        alert(e?.response?.data?.detail || "Failed to update quantity");
      }
    });
  };

  const removeItem = async (product_id) => {
    await withPending(product_id, async () => {
      try {
        const res = await api.delete(`/cart/remove/`, { params: { product_id } });
        setCart(res.data);
      } catch {
        alert("Failed to remove item");
      }
    });
  };

  const clear = async () => {
    setClearing(true);
    try {
      const res = await api.delete("/cart/clear/");
      setCart(res.data);
    } catch {
      alert("Failed to clear cart");
    } finally {
      setClearing(false);
    }
  };

  const itemsCount = cart?.items?.reduce((a, b) => a + b.quantity, 0) ?? 0;
  const subtotal = Number(cart?.total ?? 0);
  const freeShipProgress = Math.min(1, subtotal / FREE_SHIPPING_AT);
  const remainingForFreeShip = Math.max(0, FREE_SHIPPING_AT - subtotal);

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6">
      {/* Header */}
      <Card className="mb-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Your Cart</h1>
            <div className="text-sm text-neutral-500">{itemsCount} item{itemsCount !== 1 ? "s" : ""}</div>
          </div>
          {itemsCount > 0 && (
            <Button variant="ghost" onClick={clear} disabled={clearing}>
              {clearing ? "Clearing…" : "Clear cart"}
            </Button>
          )}
        </div>
      </Card>

      {/* States */}
      {loading && <CartSkeleton />}

      {err && (
        <Card className="border-red-200 bg-red-50 p-6 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
          <div className="flex items-start gap-3">
            <svg aria-hidden="true" className="mt-0.5 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11 7h2v6h-2V7zm0 8h2v2h-2v-2z" />
              <path d="M1 21h22L12 2 1 21z" />
            </svg>
            <div>
              <p className="font-semibold">Something went wrong</p>
              <p className="text-sm opacity-90">{err}</p>
              <div className="mt-3">
                <Button variant="outline" onClick={load}>Try again</Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {!loading && !err && cart && (
        <>
          {cart.items.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-neutral-100 text-neutral-500 dark:bg-neutral-800">
                <CartIcon />
              </div>
              <p className="text-neutral-700 dark:text-neutral-200">Your cart is empty.</p>
              <Button as={Link} to="/products" variant="primary" className="mt-4">
                Browse products
              </Button>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-[1fr_360px]">
              {/* Items list */}
              <Card className="p-0">
                <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {cart.items.map((it) => (
                    <li
                      key={it.id}
                      className="grid grid-cols-[88px_1fr_auto] items-center gap-3 px-4 py-4 sm:grid-cols-[112px_1fr_auto]"
                    >
                      {/* Thumb */}
                      <Link
                        to={`/products/${it.product.slug}`}
                        className="block h-20 w-28 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 dark:border-neutral-800 sm:h-24 sm:w-28"
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

                      {/* Title + price each */}
                      <div className="min-w-0">
                        <Link
                          to={`/products/${it.product.slug}`}
                          className="line-clamp-2 text-[15px] font-semibold text-neutral-900 hover:underline dark:text-neutral-50"
                        >
                          {it.product.name}
                        </Link>
                        <div className="mt-1 text-sm text-neutral-500">
                          {inr.format(Number(it.product.price))} each
                        </div>
                        {/* Optional meta line */}
                        {it.product.sku && (
                          <div className="mt-0.5 text-xs text-neutral-400">SKU: {it.product.sku}</div>
                        )}
                      </div>

                      {/* Controls + line total */}
                      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                        <QuantityStepper
                          value={it.quantity}
                          onDecr={() => updateQty(it.product.id, it.quantity - 1)}
                          onIncr={() => updateQty(it.product.id, it.quantity + 1)}
                          onDirect={(val) => updateQty(it.product.id, val)}
                          disabled={pendingIds.has(it.product.id)}
                        />

                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeItem(it.product.id)}
                          disabled={pendingIds.has(it.product.id)}
                        >
                          Remove
                        </Button>

                        <div className="w-[120px] text-right font-bold text-neutral-900 dark:text-neutral-50">
                          {inr.format(Number(it.subtotal))}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Footer actions */}
                <div className="flex flex-col gap-3 border-t border-neutral-200 px-4 py-4 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between">
                  <Button type="button" variant="ghost" onClick={clear} disabled={clearing}>
                    {clearing ? "Clearing…" : "Clear cart"}
                  </Button>
                  <div className="text-lg font-extrabold text-neutral-900 dark:text-neutral-50">
                    Subtotal: {inr.format(subtotal)}
                  </div>
                </div>
              </Card>

              {/* Summary / Checkout */}
              <aside className="order-[-1] md:order-none">
                <Card className="h-fit p-6">
                  <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                    Order Summary
                  </h2>

                  {/* Free shipping progress */}
                  <div className="mt-3">
                    {subtotal >= FREE_SHIPPING_AT ? (
                      <p className="text-sm text-emerald-600" aria-live="polite">
                        🎉 You’ve unlocked free shipping!
                      </p>
                    ) : (
                      <>
                        <p className="text-sm text-neutral-600 dark:text-neutral-300" aria-live="polite">
                          Add {inr.format(remainingForFreeShip)} more for free shipping.
                        </p>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                          <div
                            className="h-full bg-indigo-600 transition-[width]"
                            style={{ width: `${Math.max(8, freeShipProgress * 100)}%` }}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <Row label="Items" value={itemsCount} />
                    <Row label="Subtotal" value={inr.format(subtotal)} />
                    {/* Add shipping, taxes here if your API provides them */}
                  </div>

                  <div className="mt-6 flex flex-col gap-2">
                    <Button as={Link} to="/checkout" variant="primary" className="w-full">
                      Checkout
                    </Button>
                    <Button as={Link} to="/products" variant="ghost" className="w-full">
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

/* ---------- Subcomponents ---------- */

function QuantityStepper({ value, onDecr, onIncr, onDirect, disabled }) {
  return (
    <div className="flex items-center gap-2" role="group" aria-label="Quantity">
      <Button
        type="button"
        variant="outline"
        aria-label="Decrease quantity"
        onClick={onDecr}
        iconOnly
        size="md"
        disabled={disabled || value <= 1}
      >
        −
      </Button>
      <input
        type="number"
        min={1}
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          onDirect(Number.isFinite(n) ? Math.max(1, n) : 1);
        }}
        className="h-10 w-20 rounded-xl border border-neutral-300 bg-white text-center text-neutral-900 outline-none
                   focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        disabled={disabled}
        aria-live="polite"
      />
      <Button
        type="button"
        variant="outline"
        aria-label="Increase quantity"
        onClick={onIncr}
        iconOnly
        size="md"
        disabled={disabled}
      >
        +
      </Button>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-neutral-500">{label}</span>
      <span className="text-neutral-900 dark:text-neutral-50">{value}</span>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-[1fr_360px]">
      <Card className="p-0">
        <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="grid grid-cols-[88px_1fr_auto] items-center gap-3 px-4 py-4 sm:grid-cols-[112px_1fr_auto]">
              <div className="h-20 w-28 rounded-xl bg-neutral-200 sm:h-24 sm:w-28" />
              <div className="space-y-2">
                <div className="h-4 w-2/3 rounded bg-neutral-200" />
                <div className="h-3 w-1/3 rounded bg-neutral-200" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-10 w-20 rounded-xl bg-neutral-200" />
                <div className="h-10 w-10 rounded-xl bg-neutral-200" />
                <div className="h-10 w-10 rounded-xl bg-neutral-200" />
                <div className="h-5 w-24 rounded bg-neutral-200" />
              </div>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between gap-3 border-t border-neutral-200 px-4 py-4 dark:border-neutral-800">
          <div className="h-5 w-24 rounded bg-neutral-200" />
          <div className="h-6 w-40 rounded bg-neutral-200" />
        </div>
      </Card>
      <Card className="h-fit p-6">
        <div className="h-6 w-40 rounded bg-neutral-200" />
        <div className="mt-4 space-y-2">
          <div className="h-4 w-full rounded bg-neutral-200" />
          <div className="h-4 w-full rounded bg-neutral-200" />
          <div className="h-4 w-1/2 rounded bg-neutral-200" />
        </div>
        <div className="mt-6 space-y-2">
          <div className="h-10 w-full rounded-xl bg-neutral-200" />
          <div className="h-10 w-full rounded-xl bg-neutral-200" />
        </div>
      </Card>
    </div>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 6h15l-1.5 9h-12z" />
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M6 6 5 2H2" />
    </svg>
  );
}

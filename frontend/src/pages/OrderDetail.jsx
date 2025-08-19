// src/pages/OrderDetail.jsx
import React from "react"; // keep if not on new JSX runtime
import { api } from "../api";
import { Link, useNavigate, useParams } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { Printer, ArrowLeft, ShoppingBag } from "lucide-react";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const STATUS_META = {
  processing: { label: "Processing", classes: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800" },
  shipped:    { label: "Shipped",    classes: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-800" },
  delivered:  { label: "Delivered",  classes: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800" },
  cancelled:  { label: "Cancelled",  classes: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800" },
};

export default function OrderDetail() {
  const { id } = useParams();
  const nav = useNavigate();

  const [order, setOrder] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState(null);

  React.useEffect(() => {
    (async () => {
      if (!id) {
        nav("/orders");
        return;
      }
      setLoading(true);
      setErr(null);
      try {
        const res = await api.get(`/orders/${id}/`);
        setOrder(res.data);
      } catch (e) {
        if (e?.response?.status === 401) {
          nav("/login");
          return;
        }
        setErr("Order not found");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, nav]);

  if (loading) return <OrderSkeleton />;

  if (err) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-6">
        <Card className="p-6 border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
          {err}
        </Card>
      </div>
    );
  }

  if (!order) return null;

  const statusKey = (order.status || "processing").toString().toLowerCase();
  const meta = STATUS_META[statusKey] || STATUS_META.processing;
  const created = order.created_at ? new Date(order.created_at) : null;

  // derived totals (fallbacks if backend does not include them per-line)
  const items = Array.isArray(order.items) ? order.items : [];
  const computedSubtotal = items.reduce((sum, it) => {
    const line = Number.isFinite(it.subtotal)
      ? Number(it.subtotal)
      : (Number(it.price) || 0) * (Number(it.quantity) || 0);
    return sum + line;
  }, 0);
  const subtotal = Number.isFinite(Number(order.subtotal))
    ? Number(order.subtotal)
    : computedSubtotal;
  const shipping = Number(order.shipping_fee) || 0;
  const tax = Number(order.tax) || 0;
  const total = Number(order.total ?? subtotal + shipping + tax);

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6 print:px-0 print:py-0">
      <Card className="p-4 md:p-6 print:border-0 print:p-0 print:shadow-none">
        {/* Print header */}
        <div className="hidden print:block border-b border-neutral-200 pb-4">
          <div className="flex items-baseline justify-between">
            <h1 className="text-2xl font-extrabold text-neutral-900">RuhCart</h1>
            <span className="text-sm text-neutral-600">
              {created ? created.toLocaleString() : ""}
            </span>
          </div>
          <div className="mt-1 text-neutral-700">Invoice for Order #{order.id}</div>
        </div>

        {/* Header (screen) */}
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                Order #{order.id}
              </h1>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${meta.classes}`}
              >
                <span className="inline-block h-2 w-2 rounded-full bg-current" />
                {meta.label}
              </span>
            </div>
            <div className="text-sm text-neutral-500">
              {created ? created.toLocaleString() : ""}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button as={Link} to="/orders" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Orders
            </Button>
            <Button
              className="gap-2"
              type="button"
              onClick={() => window.print()}
              aria-label="Print invoice"
            >
              <Printer className="h-4 w-4" />
              Print Invoice
            </Button>
            <Button as={Link} to="/products" variant="primary" className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              Shop more
            </Button>
          </div>
        </div>

        {/* Grid: Summary left, Totals right (stacks on mobile) */}
        <div className="mt-5 grid gap-6 md:grid-cols-[1.2fr_0.8fr] print:grid-cols-1">
          {/* Items & shipping */}
          <section>
            {/* Items */}
            <h2 className="sr-only">Items</h2>
            <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {items.map((it) => {
                const line = Number.isFinite(it.subtotal)
                  ? Number(it.subtotal)
                  : (Number(it.price) || 0) * (Number(it.quantity) || 0);

                const img =
                  it.product_image_url ||
                  it.image_url ||
                  it.product?.image_url ||
                  null;

                return (
                  <li
                    key={it.id}
                    className="grid grid-cols-[64px_1fr_auto_auto] items-center gap-3 py-3"
                  >
                    {/* Thumb (optional) */}
                    <div className="h-16 w-16 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 dark:border-neutral-800 print:border-0 print:bg-transparent">
                      {img ? (
                        <img
                          src={img}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : null}
                    </div>

                    {/* Name + per-item */}
                    <div className="min-w-0">
                      <div className="truncate text-[15px] font-medium text-neutral-900 dark:text-neutral-100">
                        {it.product_name || it.product?.name || "Item"}
                      </div>
                      <div className="mt-0.5 text-xs text-neutral-500">
                        {inr.format(Number(it.price || 0))} each
                      </div>
                    </div>

                    <div className="text-sm text-neutral-500">x{it.quantity}</div>

                    <div className="text-right font-semibold text-neutral-900 dark:text-neutral-50">
                      {inr.format(line)}
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Shipping address */}
            <div className="mt-6 rounded-xl border border-neutral-200 p-4 text-sm text-neutral-700 dark:border-neutral-800 dark:text-neutral-300 print:border-0 print:p-0">
              <h3 className="mb-2 font-semibold text-neutral-900 dark:text-neutral-100">
                Shipping Address
              </h3>
              <p className="whitespace-pre-wrap">
                {order.shipping_address || "—"}
              </p>
            </div>
          </section>

          {/* Totals */}
          <aside className="h-fit md:sticky md:top-24">
            <h2 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              Summary
            </h2>
            <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800 print:border-0 print:p-0">
              <Row label="Subtotal" value={inr.format(subtotal)} />
              <Row label="Shipping" value={inr.format(shipping)} />
              {tax > 0 && <Row label="Tax" value={inr.format(tax)} />}
              <div className="mt-3 border-t border-neutral-200 pt-3 text-lg font-extrabold dark:border-neutral-800">
                <Row label="Total" value={inr.format(total)} />
              </div>
            </div>

            {/* Actions for screen only */}
            <div className="mt-4 flex justify-end gap-2 print:hidden">
              <Button as={Link} to="/orders">Back</Button>
              <Button as={Link} to="/products" variant="primary">
                Continue Shopping
              </Button>
            </div>
          </aside>
        </div>
      </Card>
    </div>
  );
}

/* ---------------- Small UI helpers ---------------- */

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-neutral-600 dark:text-neutral-300">{label}</span>
      <span className="text-neutral-900 dark:text-neutral-50">{value}</span>
    </div>
  );
}

function OrderSkeleton() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6">
      <Card className="p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="h-6 w-40 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-9 w-32 rounded-xl bg-neutral-200 dark:bg-neutral-800" />
        </div>
        <div className="mt-5 grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[64px_1fr_auto] items-center gap-3">
                <div className="h-16 w-16 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-4 w-2/3 rounded bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-4 w-16 rounded bg-neutral-200 dark:bg-neutral-800" />
              </div>
            ))}
            <div className="mt-4 h-24 w-full rounded-xl bg-neutral-200 dark:bg-neutral-800" />
          </div>
          <div className="space-y-2">
            <div className="h-5 w-24 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-24 w-full rounded-xl bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-10 w-40 rounded-xl bg-neutral-200 dark:bg-neutral-800" />
          </div>
        </div>
      </Card>
    </div>
  );
}

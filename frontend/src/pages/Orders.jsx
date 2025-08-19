// src/pages/Orders.jsx
import React from "react"; // keep if not on new JSX runtime
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

const STATUS_META = {
  processing: { label: "Processing", classes: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800" },
  shipped:    { label: "Shipped",    classes: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-800" },
  delivered:  { label: "Delivered",  classes: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800" },
  cancelled:  { label: "Cancelled",  classes: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800" },
};

export default function Orders() {
  const nav = useNavigate();

  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState(null);

  const [q, setQ] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all"); // all | processing | shipped | delivered | cancelled

  const load = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await api.get("/orders/");
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      if (e?.response?.status === 401) {
        nav("/login");
        return;
      }
      setErr("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [nav]);

  React.useEffect(() => {
    load();
  }, [load]);

  // client-side filtering
  const filtered = React.useMemo(() => {
    const query = q.trim().toLowerCase();
    return orders.filter((o) => {
      const status = (o.status || "processing").toString().toLowerCase();
      const statusOk = statusFilter === "all" ? true : status === statusFilter;
      if (!query) return statusOk;
      const idHit = (`${o.id}`).includes(query);
      const itemsHit = (o.items || []).some((it) =>
        (it.product_name || "").toLowerCase().includes(query)
      );
      return statusOk && (idHit || itemsHit);
    });
  }, [orders, q, statusFilter]);

  const countsByStatus = React.useMemo(() => {
    const base = { all: orders.length, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
    for (const o of orders) {
      const s = (o.status || "processing").toString().toLowerCase();
      if (base[s] !== undefined) base[s] += 1;
    }
    return base;
  }, [orders]);

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6">
      {/* Header / controls */}
      <Card className="mb-4 p-4 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Your Orders</h1>
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
              {loading ? "…" : `${orders.length} total`}
            </span>
          </div>

          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
            {/* Search */}
            <div className="flex w-full items-stretch overflow-hidden rounded-xl border border-neutral-300 bg-white focus-within:ring-2 focus-within:ring-indigo-500 dark:border-neutral-700 dark:bg-neutral-900 md:min-w-[320px]">
              <label htmlFor="orders-q" className="sr-only">Search orders</label>
              <input
                id="orders-q"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by order # or product"
                className="flex-1 px-3 py-2.5 bg-transparent placeholder:text-neutral-400 outline-none"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  aria-label="Clear search"
                  className="px-3 text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-2 md:ml-2">
              <label htmlFor="orders-status" className="sr-only">Filter by status</label>
              <select
                id="orders-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              >
                <option value="all">All ({countsByStatus.all})</option>
                <option value="processing">Processing ({countsByStatus.processing})</option>
                <option value="shipped">Shipped ({countsByStatus.shipped})</option>
                <option value="delivered">Delivered ({countsByStatus.delivered})</option>
                <option value="cancelled">Cancelled ({countsByStatus.cancelled})</option>
              </select>

              <Button variant="ghost" onClick={load} className="h-10">
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* States */}
      {loading && <OrdersSkeleton />}

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

      {/* Empty */}
      {!loading && !err && filtered.length === 0 && (
        <Card className="p-8 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-neutral-100 text-neutral-500 dark:bg-neutral-800">
            <PackageIcon />
          </div>
          <p className="text-neutral-700 dark:text-neutral-200">No orders found.</p>
          <p className="mt-1 text-sm text-neutral-500">
            Try changing the status filter or search query.
          </p>
          <Button as={Link} to="/products" variant="primary" className="mt-4">
            Shop now
          </Button>
        </Card>
      )}

      {/* List */}
      {!loading && !err && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Components ---------------- */

function OrderCard({ order }) {
  const statusKey = (order.status || "processing").toString().toLowerCase();
  const meta = STATUS_META[statusKey] || STATUS_META.processing;
  const created = order.created_at ? new Date(order.created_at) : null;

  return (
    <Card className="p-4 md:p-5">
      {/* Top row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-50">
              Order #{order.id}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${meta.classes}`}>
              <Dot /> {meta.label}
            </span>
          </div>
          {created && (
            <div className="mt-0.5 text-sm text-neutral-500">
              {created.toLocaleString()}
            </div>
          )}
        </div>

        <div className="text-lg font-extrabold text-neutral-900 dark:text-neutral-50">
          {inr.format(Number(order.total))}
        </div>
      </div>

      {/* Items preview */}
      <div className="mt-3 border-t border-neutral-200 pt-3 dark:border-neutral-800">
        {(order.items || []).slice(0, 3).map((it) => (
          <div key={it.id} className="text-sm text-neutral-600 dark:text-neutral-300">
            {it.product_name} × {it.quantity}
          </div>
        ))}
        {order.items && order.items.length > 3 && (
          <div className="text-sm text-neutral-400">
            +{order.items.length - 3} more…
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-3 flex justify-end">
        <Button as={Link} to={`/orders/${order.id}`} variant="ghost">
          View details
        </Button>
      </div>
    </Card>
  );
}

function OrdersSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="p-4 md:p-5">
          <div className="flex items-center justify-between">
            <div className="h-5 w-36 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-6 w-24 rounded bg-neutral-200 dark:bg-neutral-800" />
          </div>
          <div className="mt-3 space-y-2 border-t border-neutral-200 pt-3 dark:border-neutral-800">
            <div className="h-4 w-2/3 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-4 w-1/2 rounded bg-neutral-200 dark:bg-neutral-800" />
          </div>
          <div className="mt-3 flex justify-end">
            <div className="h-9 w-28 rounded-xl bg-neutral-200 dark:bg-neutral-800" />
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ---------------- Icons ---------------- */

function Dot() {
  return <span className="inline-block h-2 w-2 rounded-full bg-current" aria-hidden="true" />;
}
function PackageIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 7l9 5 9-5" />
      <path d="M3 7l9-5 9 5v10l-9 5-9-5z" />
      <path d="M12 12v10" />
    </svg>
  );
}

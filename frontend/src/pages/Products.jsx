// src/pages/Products.jsx
import React from "react";
import { api } from "../api";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ProductCard, { ProductCardSkeleton } from "../components/ProductCard";

const SKELETON_COUNT = 8;

export default function Products() {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [q, setQ] = React.useState("");
  const [sort, setSort] = React.useState("relevance"); // "price-asc" | "price-desc" | "newest"
  const [isSearching, setIsSearching] = React.useState(false);

  const controllerRef = React.useRef(null);

  const load = React.useCallback(
    async (query = "", sortKey = sort) => {
      setError(null);
      setIsSearching(Boolean(items.length)); // show subtle searching state if we already have items
      setLoading(!items.length);             // full skeleton if nothing loaded yet

      // cancel previous request, if any
      try {
        controllerRef.current?.abort();
      } catch {}
      controllerRef.current = new AbortController();

      try {
        const res = await api.get("/products/", {
          params: {
            ...(query ? { q: query } : {}),
            ...(sortKey && sortKey !== "relevance" ? { sort: sortKey } : {}),
          },
          signal: controllerRef.current.signal,
        });
        const data = Array.isArray(res.data) ? res.data : [];
        setItems(data);
      } catch (e) {
        if (e.name !== "CanceledError" && e.name !== "AbortError") {
          setError("Failed to load products. Please try again.");
        }
      } finally {
        setLoading(false);
        setIsSearching(false);
      }
    },
    [items.length, sort]
  );

  React.useEffect(() => {
    load("", sort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSubmit(e) {
    e.preventDefault();
    load(q.trim(), sort);
  }

  function onReset() {
    setQ("");
    load("", sort);
  }

  function onSortChange(e) {
    const val = e.target.value;
    setSort(val);
    load(q.trim(), val);
  }

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6 lg:px-6">
      {/* Sub-header: sticky on larger screens for quick filters */}
      <div className="sticky top-[64px] z-10 mb-4 bg-gradient-to-b from-white to-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:from-neutral-950 dark:to-neutral-950/80 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl shadow-sm">
        <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          {/* Title + count */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
              Products
            </h1>
            <span
              className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
              aria-live="polite"
            >
              {loading ? "…" : `${items.length} found`}
            </span>
            {isSearching && (
              <span className="text-xs text-neutral-400" aria-live="polite">
                updating…
              </span>
            )}
          </div>

          {/* Search + sort */}
          <form
            onSubmit={onSubmit}
            className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center"
            role="search"
            aria-label="Search products"
          >
            <div className="flex w-full items-stretch overflow-hidden rounded-xl border border-neutral-300 bg-white focus-within:ring-2 focus-within:ring-indigo-500 dark:border-neutral-700 dark:bg-neutral-900 md:min-w-[340px]">
              <label htmlFor="products-q" className="sr-only">
                Search products
              </label>
              <input
                id="products-q"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search for products, brands and more"
                className="flex-1 px-3 py-2.5 bg-transparent placeholder:text-neutral-400 outline-none"
              />
              {q && (
                <button
                  type="button"
                  onClick={onReset}
                  className="px-3 text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                  aria-label="Clear search"
                  title="Clear"
                >
                  ✕
                </button>
              )}
              <Button variant="secondary" className="rounded-none rounded-r-xl">
                Search
              </Button>
            </div>

            <div className="flex items-center gap-2 md:ml-2">
              <label htmlFor="sort" className="sr-only">
                Sort by
              </label>
              <select
                id="sort"
                value={sort}
                onChange={onSortChange}
                className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              >
                <option value="relevance">Relevance</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </form>
        </div>
      </div>

      {/* States */}
      {loading && (
        <section aria-live="polite">
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </section>
      )}

      {error && (
        <Card className="mb-4 border-red-200 bg-red-50 p-6 text-red-800 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-200">
          <div className="flex items-start gap-3">
            <svg
              aria-hidden="true"
              className="mt-0.5 h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M11 7h2v6h-2V7zm0 8h2v2h-2v-2z" />
              <path d="M1 21h22L12 2 1 21z" />
            </svg>
            <div>
              <p className="font-semibold">Something went wrong</p>
              <p className="text-sm opacity-90">{error}</p>
              <div className="mt-3">
                <Button variant="outline" onClick={() => load(q.trim(), sort)}>
                  Try again
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {!loading && !error && items.length === 0 && (
        <EmptyState onReset={onReset} />
      )}

      {/* Grid */}
      {!loading && !error && items.length > 0 && (
        <section aria-live="polite">
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {items.map((p) => (
              <ProductCard
                key={p.id ?? p.slug}
                product={p}
                onAddToCart={(prod) => {
                  // TODO: wire to cart store
                  console.log("add to cart", prod);
                }}
                onToggleWish={(prod) => {
                  // TODO: wire to wishlist store
                  console.log("toggle wish", prod);
                }}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* --------- Nice empty state --------- */
function EmptyState({ onReset }) {
  return (
    <Card className="p-8 text-center">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-neutral-100 text-neutral-500 dark:bg-neutral-800">
        <Magnifier />
      </div>
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        No products found
      </h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">
        Try a different keyword, broaden your search, or reset to see all items.
      </p>
      <div className="mt-4 flex items-center justify-center gap-2">
        <Button variant="ghost" onClick={onReset}>
          Reset search
        </Button>
      </div>
    </Card>
  );
}

function Magnifier() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" />
    </svg>
  );
}

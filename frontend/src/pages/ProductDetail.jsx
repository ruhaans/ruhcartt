// src/pages/ProductDetail.jsx
import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const FALLBACK_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        font-size="20" fill="#9ca3af" font-family="system-ui, -apple-system, Segoe UI, Roboto, Arial">
        No image
      </text>
    </svg>`
  );

export default function ProductDetail() {
  const { slug } = useParams();
  const nav = useNavigate();

  const [product, setProduct] = React.useState(null);
  const [qty, setQty] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState(null);
  const [adding, setAdding] = React.useState(false);

  const [imgSrc, setImgSrc] = React.useState(FALLBACK_SVG);
  const [activeIdx, setActiveIdx] = React.useState(0);

  React.useEffect(() => {
    let on = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await api.get(`/products/${slug}/`);
        if (!on) return;
        const data = res.data || {};
        setProduct(data);
        setQty(1);
        // set initial image
        const imgs = Array.isArray(data.images) && data.images.length
          ? data.images
          : [data.image_url || data.image].filter(Boolean);
        setActiveIdx(0);
        setImgSrc(imgs?.[0] || FALLBACK_SVG);
      } catch {
        if (on) setErr("Product not found");
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
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

  // ✅ SAFE: no hooks after this point

  if (loading) return <DetailSkeleton />;

  if (err) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-6">
        <Card className="border-red-200 bg-red-50 p-6 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
          <div className="flex items-start gap-3">
            <svg aria-hidden="true" className="mt-0.5 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11 7h2v6h-2V7zm0 8h2v2h-2v-2z" />
              <path d="M1 21h22L12 2 1 21z" />
            </svg>
            <div>
              <p className="font-semibold">Oops</p>
              <p className="text-sm opacity-90">{err}</p>
              <div className="mt-3">
                <Button as={Link} to="/products" variant="outline">Back to Products</Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!product) return null;

  // derived fields (not hooks → fine here)
  const name = product.name ?? "Untitled";
  const categoryName = product.category?.name ?? "Uncategorized";
  const priceNum = typeof product.price === "number" ? product.price : parseFloat(product.price ?? "0");
  const mrpNum = product.mrp != null ? (typeof product.mrp === "number" ? product.mrp : parseFloat(product.mrp)) : undefined;
  const discountPct = mrpNum && mrpNum > priceNum ? Math.round(((mrpNum - priceNum) / mrpNum) * 100) : null;
  const inStock = product.stock > 0 || product.in_stock === true;
  const rating = Number(product.rating ?? 0);
  const reviewsCount = Number(product.reviews_count ?? 0);

  // ✅ plain variable, not a hook
  const images =
    (Array.isArray(product.images) && product.images.length
      ? product.images
      : [product.image_url || product.image].filter(Boolean)) || [FALLBACK_SVG];

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-3 text-sm text-neutral-500">
        <ol className="flex items-center gap-2">
          <li><Link to="/products" className="hover:underline">Products</Link></li>
          <li className="opacity-50">/</li>
          <li>
            <Link to={`/c/${(product.category?.slug || categoryName).toString().toLowerCase()}`} className="hover:underline">
              {categoryName}
            </Link>
          </li>
          <li className="opacity-50">/</li>
          <li className="text-neutral-700 dark:text-neutral-300 truncate max-w-[50vw]" title={name}>{name}</li>
        </ol>
      </nav>

      <Card className="p-4 md:p-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left: media */}
          <div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 dark:border-neutral-800">
              {discountPct ? (
                <span className="absolute left-3 top-3 rounded-md bg-rose-600 px-2 py-1 text-xs font-bold text-white shadow">
                  {discountPct}% OFF
                </span>
              ) : null}
              {product.is_new && (
                <span className="absolute right-3 top-3 rounded-md bg-emerald-600 px-2 py-1 text-xs font-bold text-white shadow">
                  New
                </span>
              )}
              <img
                src={imgSrc}
                alt={name}
                onError={() => setImgSrc(FALLBACK_SVG)}
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03]"
              />
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {images.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setActiveIdx(i); setImgSrc(src || FALLBACK_SVG); }}
                    className={`h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg border ${i === activeIdx ? "border-indigo-500" : "border-neutral-200 dark:border-neutral-800"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500`}
                    aria-label={`Show image ${i + 1}`}
                  >
                    <img src={src || FALLBACK_SVG} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Category */}
            <div className="mt-3 text-sm text-neutral-500">
              Category:{" "}
              <Link
                to={`/c/${(product.category?.slug || categoryName).toString().toLowerCase()}`}
                className="hover:underline"
              >
                {categoryName}
              </Link>
            </div>
          </div>

          {/* Right: details */}
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">{name}</h1>

            {/* Rating */}
            {rating > 0 && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <Stars rating={rating} />
                <span className="text-neutral-700 dark:text-neutral-300">{rating.toFixed(1)}</span>
                {reviewsCount > 0 && (
                  <span className="text-neutral-400">({reviewsCount})</span>
                )}
              </div>
            )}

            {/* Price */}
            <div className="mt-3 flex items-end gap-3">
              <div className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-50">
                {inr.format(priceNum)}
              </div>
              {mrpNum && mrpNum > priceNum && (
                <>
                  <div className="text-lg text-neutral-400 line-through">{inr.format(mrpNum)}</div>
                  <div className="rounded-md bg-rose-600/10 px-2 py-0.5 text-sm font-semibold text-rose-700 dark:text-rose-400">
                    Save {inr.format(mrpNum - priceNum)}
                  </div>
                </>
              )}
            </div>

            {/* Stock */}
            <div className={`mt-1 text-sm ${inStock ? "text-emerald-600" : "text-rose-600"}`} aria-live="polite">
              {inStock ? `${product.stock ?? ""} in stock` : "Out of stock"}
            </div>

            {/* Description */}
            <p className="mt-4 whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">
              {product.description || "No description."}
            </p>

            {/* Actions */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2" role="group" aria-label="Quantity">
                <Button type="button" variant="outline" aria-label="Decrease quantity" onClick={() => setQty((n) => Math.max(1, n - 1))} iconOnly size="md">−</Button>
                <input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={qty}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setQty(Number.isFinite(n) ? Math.max(1, n) : 1);
                  }}
                  className="h-10 w-20 rounded-xl border border-neutral-300 bg-white text-center text-neutral-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                />
                <Button type="button" variant="outline" aria-label="Increase quantity" onClick={() => setQty((n) => n + 1)} iconOnly size="md">+</Button>
              </div>

              <Button variant="primary" type="button" disabled={!inStock || adding} onClick={addToCart} isLoading={adding}>
                {adding ? "Adding…" : "Add to Cart"}
              </Button>

              <Button as={Link} to="/products" variant="ghost">
                Back to Products
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ---------------- Skeleton ---------------- */
function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6">
      <Card className="p-4 md:p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <div className="mb-3 aspect-[4/3] rounded-2xl bg-neutral-200" />
            <div className="mt-3 flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 w-20 rounded-lg bg-neutral-200" />
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-7 w-2/3 rounded bg-neutral-200" />
            <div className="h-5 w-1/3 rounded bg-neutral-200" />
            <div className="mt-2 h-6 w-1/2 rounded bg-neutral-200" />
            <div className="h-24 w-full rounded bg-neutral-200" />
            <div className="mt-4 flex items-center gap-3">
              <div className="h-10 w-28 rounded-xl bg-neutral-200" />
              <div className="h-10 w-32 rounded-xl bg-neutral-200" />
              <div className="h-10 w-40 rounded-xl bg-neutral-200" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ---------------- Stars ---------------- */
function Stars({ rating = 0 }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    <div className="flex items-center text-amber-500">
      {Array.from({ length: full }).map((_, i) => <Star key={`f${i}`} type="full" />)}
      {half ? <Star type="half" /> : null}
      {Array.from({ length: empty }).map((_, i) => <Star key={`e${i}`} type="empty" />)}
    </div>
  );
}
function Star({ type = "full" }) {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      {type === "empty" ? (
        <path fill="none" stroke="currentColor" strokeWidth="1.5" d="M12 17.3l-5.6 3.1 1.5-6.3-4.9-4.1 6.4-.5L12 3l2.6 6.5 6.4.5-4.9 4.1 1.5 6.3z" />
      ) : type === "half" ? (
        <>
          <defs>
            <linearGradient id="halfStar">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path d="M12 17.3l-5.6 3.1 1.5-6.3-4.9-4.1 6.4-.5L12 3l2.6 6.5 6.4.5-4.9 4.1 1.5 6.3z" fill="url(#halfStar)" stroke="currentColor" strokeWidth="1.2" />
        </>
      ) : (
        <path d="M12 17.3l-5.6 3.1 1.5-6.3-4.9-4.1 6.4-.5L12 3l2.6 6.5 6.4.5-4.9 4.1 1.5 6.3z" />
      )}
    </svg>
  );
}

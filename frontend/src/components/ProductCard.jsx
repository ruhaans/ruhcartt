// src/components/ProductCard.jsx
import { Link } from "react-router-dom";
import Button from "./ui/Button";
import Card from "./ui/Card";
import * as React from "react";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const FALLBACK_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="20" fill="#9ca3af" font-family="system-ui, -apple-system, Segoe UI, Roboto, Arial">No image</text>
    </svg>`
  );

export default function ProductCard({ product, onAddToCart, onToggleWish }) {
  const img = product.image_url || product.image || "";
  const name = product.name ?? "Untitled";
  const categoryName = product.category?.name ?? "Uncategorized";
  const slug = product.slug ?? product.id ?? "";

  const priceNum =
    typeof product.price === "number"
      ? product.price
      : parseFloat(product.price ?? "0");

  const mrpNum =
    typeof product.mrp === "number"
      ? product.mrp
      : product.mrp
      ? parseFloat(product.mrp)
      : undefined;

  const discountPct =
    mrpNum && mrpNum > priceNum
      ? Math.round(((mrpNum - priceNum) / mrpNum) * 100)
      : null;

  const rating = Number(product.rating ?? 0); // e.g., 0–5
  const reviewsCount = Number(product.reviews_count ?? 0);
  const inStock = product.in_stock ?? product.stock > 0 ?? true;
  const isWishlisted = Boolean(product.is_wishlisted);

  // local <img> error handling -> swap to fallback
  const [src, setSrc] = React.useState(img || FALLBACK_SVG);

  return (
    <article className="group">
      <Card className="overflow-hidden transition hover:shadow-md focus-within:shadow-md">
        {/* Media */}
        <Link
          to={`/products/${slug}`}
          className="block"
          aria-label={`View ${name}`}
        >
          <div className="relative mb-3 aspect-[4/3] w-full overflow-hidden bg-neutral-100">
            {/* badges */}
            {discountPct ? (
              <span className="absolute left-2 top-2 rounded-md bg-rose-600 px-2 py-1 text-xs font-bold text-white shadow">
                {discountPct}% OFF
              </span>
            ) : null}
            {product.is_new && (
              <span className="absolute right-2 top-2 rounded-md bg-emerald-600 px-2 py-1 text-xs font-bold text-white shadow">
                New
              </span>
            )}

            {/* image */}
            <img
              src={src}
              alt={img ? name : "Placeholder product image"}
              loading="lazy"
              onError={() => setSrc(FALLBACK_SVG)}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />

            {/* quick wish on media (optional) */}
            <button
              type="button"
              aria-pressed={isWishlisted}
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              onClick={(e) => {
                e.preventDefault(); // don’t navigate
                onToggleWish?.(product);
              }}
              className="absolute bottom-2 right-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow backdrop-blur hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <HeartIcon filled={isWishlisted} />
            </button>
          </div>
        </Link>

        {/* Content */}
        <div className="px-4 pb-4">
          {/* name + category */}
          <Link
            to={`/products/${slug}`}
            className="line-clamp-2 text-[15px] font-semibold text-neutral-900 no-underline hover:underline"
          >
            {name}
          </Link>
          <div className="mt-0.5 text-sm text-neutral-500">{categoryName}</div>

          {/* rating */}
          {rating > 0 ? (
            <div className="mt-2 flex items-center gap-1.5 text-sm">
              <Stars rating={rating} />
              <span className="text-neutral-600">{rating.toFixed(1)}</span>
              {reviewsCount > 0 && (
                <span className="text-neutral-400">({reviewsCount})</span>
              )}
            </div>
          ) : null}

          {/* price row */}
          <div className="mt-3 flex items-end justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-neutral-900">
                {inr.format(priceNum)}
              </span>
              {mrpNum && mrpNum > priceNum && (
                <span className="text-sm text-neutral-400 line-through">
                  {inr.format(mrpNum)}
                </span>
              )}
            </div>

            {/* CTA kept OUTSIDE the link to avoid nested interactive */}
            <Button
              variant={inStock ? "primary" : "outline"}
              size="sm"
              disabled={!inStock}
              aria-label={inStock ? "Add to cart" : "Out of stock"}
              onClick={() => inStock && onAddToCart?.(product)}
            >
              {inStock ? "Add to Cart" : "Out of Stock"}
            </Button>
          </div>
        </div>
      </Card>
    </article>
  );
}

/* ---------- tiny atoms ---------- */

function Stars({ rating = 0 }) {
  // Show 5 stars; fill proportionally (half stars rounded down for simplicity)
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    <div className="flex items-center">
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f${i}`} type="full" />
      ))}
      {half ? <Star type="half" /> : null}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e${i}`} type="empty" />
      ))}
    </div>
  );
}

function Star({ type = "full" }) {
  // Simple star; for "half" we overlay a clip
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill={type === "empty" ? "none" : "currentColor"}
      stroke="currentColor"
    >
      <defs>
        <linearGradient id="half">
          <stop offset="50%" stopColor="currentColor" />
          <stop offset="50%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <path
        d="M12 17.3l-5.6 3.1 1.5-6.3-4.9-4.1 6.4-.5L12 3l2.6 6.5 6.4.5-4.9 4.1 1.5 6.3z"
        strokeWidth="1.2"
        fill={
          type === "full" ? "currentColor" : type === "half" ? "url(#half)" : "none"
        }
      />
    </svg>
  );
}

function HeartIcon({ filled }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 22l7.8-8.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}

/* ---------- Optional skeleton for loading states ---------- */

export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden animate-pulse">
      <div className="mb-3 aspect-[4/3] bg-neutral-200" />
      <div className="px-4 pb-4">
        <div className="h-4 w-3/4 rounded bg-neutral-200" />
        <div className="mt-2 h-3 w-1/3 rounded bg-neutral-200" />
        <div className="mt-4 flex items-center justify-between">
          <div className="h-5 w-24 rounded bg-neutral-200" />
          <div className="h-9 w-24 rounded-xl bg-neutral-200" />
        </div>
      </div>
    </Card>
  );
}

// src/components/Navbar.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

/**
 * RuhCart Navbar (React + Tailwind)
 * - A11y: skip link, proper labels, no incorrect ARIA menu roles
 * - Scoped ESC close, focus management + focus trap in mobile drawer
 * - Body scroll lock when drawer is open
 * - Hover menus only on hover-capable devices; always works with click/keyboard
 */
export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [catOpen, setCatOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState("All");
  const [canHover, setCanHover] = React.useState(false);

  // Detect hover-capable devices
  React.useEffect(() => {
    const mql = window.matchMedia("(hover: hover)");
    const update = () => setCanHover(mql.matches);
    update();
    mql.addEventListener?.("change", update);
    return () => mql.removeEventListener?.("change", update);
  }, []);

  const categories = React.useMemo(
    () => [
      {
        name: "Electronics",
        items: [
          { label: "Mobiles & Tablets", to: "/c/electronics/mobiles" },
          { label: "Laptops & Accessories", to: "/c/electronics/laptops" },
          { label: "Audio & Wearables", to: "/c/electronics/audio" },
          { label: "Gaming", to: "/c/electronics/gaming" },
        ],
      },
      {
        name: "Fashion",
        items: [
          { label: "Men", to: "/c/fashion/men" },
          { label: "Women", to: "/c/fashion/women" },
          { label: "Kids", to: "/c/fashion/kids" },
          { label: "Footwear", to: "/c/fashion/footwear" },
        ],
      },
      {
        name: "Home & Kitchen",
        items: [
          { label: "Appliances", to: "/c/home/appliances" },
          { label: "Cookware", to: "/c/home/cookware" },
          { label: "Furniture", to: "/c/home/furniture" },
          { label: "Decor", to: "/c/home/decor" },
        ],
      },
      {
        name: "Beauty & Personal Care",
        items: [
          { label: "Makeup", to: "/c/beauty/makeup" },
          { label: "Skin Care", to: "/c/beauty/skin" },
          { label: "Hair Care", to: "/c/beauty/hair" },
          { label: "Fragrances", to: "/c/beauty/fragrance" },
        ],
      },
    ],
    []
  );

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams({ query, cat: category });
    navigate(`/products?${params.toString()}`);
    setMobileOpen(false);
  }

  // Attach ESC only when something open
  React.useEffect(() => {
    if (!mobileOpen && !catOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setCatOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, catOpen]);

  // Body scroll lock + drawer focus management + simple focus trap
  const closeBtnRef = React.useRef(null);
  const lastFocusedRef = React.useRef(null);

  React.useEffect(() => {
    if (mobileOpen) {
      lastFocusedRef.current = document.activeElement;
      document.body.classList.add("overflow-hidden");
      // move focus in
      setTimeout(() => closeBtnRef.current?.focus(), 0);
    } else {
      document.body.classList.remove("overflow-hidden");
      // restore focus
      if (lastFocusedRef.current && lastFocusedRef.current.focus) {
        lastFocusedRef.current.focus();
      }
    }
    return () => document.body.classList.remove("overflow-hidden");
  }, [mobileOpen]);

  const trapRef = React.useRef(null);
  React.useEffect(() => {
    if (!mobileOpen) return;
    const trap = (e) => {
      if (e.key !== "Tab") return;
      const root = trapRef.current;
      if (!root) return;
      const focusables = root.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      const list = Array.from(focusables).filter(
        (el) => el.offsetParent !== null || el.getClientRects().length > 0
      );
      if (list.length === 0) return;

      const first = list[0];
      const last = list[list.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", trap, true);
    return () => document.removeEventListener("keydown", trap, true);
  }, [mobileOpen]);

  const btn =
    "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";
  const btnGhost =
    `${btn} border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900`;
  const btnPrimary =
    `${btn} border-transparent bg-indigo-600 text-white hover:bg-indigo-600/90`;

  // Demo counts (wire to state/store when ready)
  const wishlistCount = 0;
  const cartCount = 0;

  return (
    <header className="sticky top-0 z-50">
      {/* Skip to content */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-black shadow"
      >
        Skip to content
      </a>

      {/* Top utility bar */}
      <div className="bg-neutral-900 text-neutral-50 text-[13px]">
        <div className="mx-auto max-w-screen-2xl px-4">
          <div className="flex items-center justify-between py-2">
            <p className="opacity-90 truncate">
              🚚 Free shipping over ₹999 • 7-day easy returns
            </p>
            {/* Hide utility controls on small screens */}
            <nav aria-label="Utility" className="hidden md:flex items-center gap-3">
              <Link
                to="/stores"
                className="inline-flex items-center gap-2 opacity-90 hover:opacity-100"
              >
                <MapPinIcon /> <span>Store Locator</span>
              </Link>
              <a
                href="tel:+919876543210"
                className="inline-flex items-center gap-2 opacity-90 hover:opacity-100"
              >
                <PhoneIcon /> <span>+91 98-7654-3210</span>
              </a>
              <select
                aria-label="Currency"
                className="rounded-md border border-white/25 bg-transparent px-2 py-1"
              >
                <option>INR ₹</option>
                <option>USD $</option>
              </select>
              <select
                aria-label="Language"
                className="rounded-md border border-white/25 bg-transparent px-2 py-1"
              >
                <option>English</option>
                <option>हिन्दी</option>
              </select>
            </nav>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="backdrop-blur-md bg-white/90 dark:bg-neutral-900/80 border-b border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100">
        <div className="mx-auto max-w-screen-2xl px-4">
          <div className="flex items-center gap-3 py-3">
            {/* Mobile menu */}
            <button
              aria-label="Open menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <MenuIcon />
            </button>

            {/* Brand */}
            <Link
              to="/"
              className="shrink-0 inline-flex items-center gap-2 text-[22px] font-extrabold tracking-tight"
            >
              <span className="inline-block rounded-lg bg-gradient-to-br from-fuchsia-500 to-indigo-600 px-2.5 py-0.5 text-white">
                R
              </span>
              <span>RuhCart</span>
            </Link>

            {/* Categories (desktop) */}
            <div
              className="relative hidden shrink-0 md:block"
              onMouseLeave={() => canHover && setCatOpen(false)}
            >
              <button
                className={`${btnGhost} h-10`}
                aria-expanded={catOpen}
                aria-controls="rc-cat-popover"
                onMouseEnter={() => canHover && setCatOpen(true)}
                onClick={() => setCatOpen((v) => !v)}
              >
                <span>Categories</span>
                <ChevronDownIcon
                  className={
                    catOpen ? "rotate-180 transition-transform" : "transition-transform"
                  }
                />
              </button>

              {catOpen && (
                <div
                  id="rc-cat-popover"
                  className="absolute left-0 top-12 w-[720px] max-w-[90vw] rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xl p-4 grid grid-cols-4 gap-4"
                >
                  {categories.map((col) => (
                    <nav key={col.name} aria-label={col.name}>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-600 dark:text-neutral-300">
                        {col.name}
                      </p>
                      <ul className="space-y-1">
                        {col.items.map((it) => (
                          <li key={it.label}>
                            <Link
                              className="block rounded-lg px-2 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                              to={it.to}
                              onClick={() => setCatOpen(false)}
                            >
                              {it.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </nav>
                  ))}
                </div>
              )}
            </div>

            {/* Search (desktop) */}
            <form
              onSubmit={handleSearch}
              role="search"
              aria-label="Site search"
              className="hidden md:flex flex-1 max-w-[760px]"
            >
              <div className="flex w-full items-stretch overflow-hidden rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus-within:ring-2 focus-within:ring-indigo-500">
                <label htmlFor="rc-cat" className="sr-only">
                  Category
                </label>
                <select
                  id="rc-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="px-3 text-sm bg-transparent outline-none"
                >
                  <option>All</option>
                  {categories.map((c) => (
                    <option key={c.name}>{c.name}</option>
                  ))}
                </select>

                <label htmlFor="rc-q" className="sr-only">
                  Search products
                </label>
                <input
                  id="rc-q"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for products, brands and more"
                  className="flex-1 px-3 py-2 bg-transparent placeholder:text-neutral-400 outline-none"
                />

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                >
                  <SearchIcon /> <span className="hidden lg:inline">Search</span>
                </button>
              </div>
            </form>

            {/* Right actions */}
            <nav aria-label="Account & actions" className="ml-auto flex items-center gap-2">
              <Link to="/products" className={`hidden md:inline-flex ${btnGhost}`}>
                Products
              </Link>

              <Link
                aria-label={`Wishlist, ${wishlistCount} items`}
                to="/wishlist"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
              >
                <HeartIcon />
                <span
                  aria-hidden="true"
                  className="absolute -right-1 -top-1 grid min-w-[20px] h-5 place-items-center rounded-full bg-fuchsia-500 px-1 text-[10px] font-bold text-white"
                >
                  {wishlistCount}
                </span>
              </Link>

              <Link
                aria-label={`Cart, ${cartCount} items`}
                to="/cart"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
              >
                <CartIcon />
                <span
                  aria-hidden="true"
                  className="absolute -right-1 -top-1 grid min-w-[20px] h-5 place-items-center rounded-full bg-fuchsia-500 px-1 text-[10px] font-bold text-white"
                >
                  {cartCount}
                </span>
              </Link>

              {loading ? (
                <span className="hidden md:inline text-sm text-neutral-500">…</span>
              ) : user ? (
                <div className="hidden md:flex items-center gap-2">
                  <span className="text-sm text-neutral-600 dark:text-neutral-300">
                    Hi, <b className="text-neutral-900 dark:text-white">{user.username}</b> ({user.role})
                  </span>
                  <Link to="/orders" className={btnGhost}>
                    Orders
                  </Link>
                  <button type="button" className={btnGhost} onClick={logout}>
                    Logout
                  </button>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link to="/login" className={btnGhost}>
                    <UserIcon /> Log in
                  </Link>
                  <Link to="/register/customer" className={btnPrimary}>
                    Sign up
                  </Link>
                  <Link to="/register/seller" className={btnGhost}>
                    Sell on RuhCart
                  </Link>
                </div>
              )}
            </nav>
          </div>

          {/* Secondary links (desktop) */}
          <div className="hidden md:flex items-center gap-5 pb-3 text-[15px] text-neutral-700 dark:text-neutral-300">
            <Link to="/deals" className="opacity-90 hover:opacity-100">
              Deals
            </Link>
            <Link to="/new" className="opacity-90 hover:opacity-100">
              New Arrivals
            </Link>
            <Link to="/bestsellers" className="opacity-90 hover:opacity-100">
              Best Sellers
            </Link>
            <Link to="/plus" className="opacity-90 hover:opacity-100">
              RuhCart Plus
            </Link>
            <Link to="/support" className="opacity-90 hover:opacity-100">
              Customer Support
            </Link>
            <Link to="/register/seller" className="opacity-90 hover:opacity-100">
              Sell on RuhCart
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile overlay (above header) */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobileNavTitle"
        ref={trapRef}
        className={`fixed inset-y-0 left-0 z-[70] w-[88%] max-w-sm transform bg-white dark:bg-neutral-900 shadow-2xl transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-4 py-3">
          <Link id="mobileNavTitle" to="/" className="text-lg font-extrabold">
            RuhCart
          </Link>
          <button
            ref={closeBtnRef}
            className={`${btnGhost} py-1.5`}
            onClick={() => setMobileOpen(false)}
          >
            Close
          </button>
        </div>

        {/* Mobile search */}
        <form
          onSubmit={handleSearch}
          className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 px-4 py-3"
        >
          <label htmlFor="m-cat" className="sr-only">
            Category
          </label>
          <select
            id="m-cat"
            aria-label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="flex-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2"
          >
            <option>All</option>
            {categories.map((c) => (
              <option key={c.name}>{c.name}</option>
            ))}
          </select>

          <label htmlFor="m-q" className="sr-only">
            Search products
          </label>
          <input
            id="m-q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products"
            className="flex-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2"
          />
          <button
            type="submit"
            className={`${btnGhost} bg-neutral-900 text-white dark:bg-white dark:text-neutral-900`}
          >
            <SearchIcon />
          </button>
        </form>

        <div className="space-y-4 overflow-auto px-4 py-4">
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">
              Shop by Category
            </h3>
            <div className="space-y-2">
              {categories.map((c) => (
                <details
                  key={c.name}
                  className="rounded-xl border border-neutral-200 dark:border-neutral-800"
                >
                  <summary className="flex cursor-pointer items-center justify-between px-3 py-2">
                    <span>{c.name}</span>
                    <ChevronDownIcon />
                  </summary>
                  <ul className="space-y-1 px-3 pb-3">
                    {c.items.map((it) => (
                      <li key={it.label}>
                        <Link
                          to={it.to}
                          onClick={() => setMobileOpen(false)}
                          className="block rounded-lg px-2 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        >
                          {it.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">
              Discover
            </h3>
            <ul className="grid gap-2">
              <li>
                <Link
                  to="/products"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-2 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Products
                </Link>
              </li>
              <li>
                <Link
                  to="/deals"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-2 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Deals
                </Link>
              </li>
              <li>
                <Link
                  to="/new"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-2 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link
                  to="/bestsellers"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-2 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Best Sellers
                </Link>
              </li>
              <li>
                <Link
                  to="/plus"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-2 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  RuhCart Plus
                </Link>
              </li>
              <li>
                <Link
                  to="/support"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-2 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Customer Support
                </Link>
              </li>
            </ul>
          </section>

          <section>
            {loading ? (
              <span className="text-sm text-neutral-500">…</span>
            ) : user ? (
              <div className="grid gap-2">
                <span className="text-sm text-neutral-600 dark:text-neutral-300">
                  Hi, <b className="text-neutral-900 dark:text-white">{user.username}</b> ({user.role})
                </span>
                <Link
                  to="/orders"
                  className={btnGhost}
                  onClick={() => setMobileOpen(false)}
                >
                  Orders
                </Link>
                <button
                  className={btnGhost}
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                  }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="grid gap-2">
                <Link
                  to="/login"
                  className={btnGhost}
                  onClick={() => setMobileOpen(false)}
                >
                  <UserIcon /> Log in
                </Link>
                <Link
                  to="/register/customer"
                  className={btnPrimary}
                  onClick={() => setMobileOpen(false)}
                >
                  Sign up
                </Link>
                <Link
                  to="/register/seller"
                  className={btnGhost}
                  onClick={() => setMobileOpen(false)}
                >
                  Sell on RuhCart
                </Link>
              </div>
            )}
          </section>
        </div>
      </aside>
    </header>
  );
}

/* ---------------- Icons (inline SVG, no libs) ---------------- */
function CartIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M6 6h15l-1.5 9h-12z" /><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M6 6 5 2H2" />
    </svg>
  );
}
function HeartIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 22l7.8-8.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}
function UserIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="8" r="4" /><path d="M4 22a8 8 0 0 1 16 0" />
    </svg>
  );
}
function SearchIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="11" cy="11" r="7" /><path d="M20 20l-3-3" />
    </svg>
  );
}
function MenuIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}
function ChevronDownIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
function MapPinIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M12 22s7-5.4 7-12a7 7 0 1 0-14 0c0 6.6 7 12 7 12z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function PhoneIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.88.31 1.73.57 2.56a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.52-1.09a2 2 0 0 1 2.11-.45c.83.26 1.68.45 2.56.57A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

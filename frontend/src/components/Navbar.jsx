import React from "react"; // remove this line if you're on the new JSX runtime
import { Link } from "react-router-dom";
import { useAuth } from "../auth";

export default function Navbar() {
  const { user, loading, logout } = useAuth();

  return (
    <nav className="nav">
      <div className="container" style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Link to="/" style={{ fontWeight: 800, letterSpacing: 0.3, textDecoration: "none" }}>
          RuhCart
        </Link>
        <Link className="btn btn-ghost" to="/products">Products</Link>
        <Link className="btn btn-ghost" to="/cart">Cart</Link>
        {user && <Link className="btn btn-ghost" to="/orders">Orders</Link>}

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          {loading ? (
            <span className="text-muted">…</span>
          ) : user ? (
            <>
              <span className="text-muted">
                Hi, <b style={{ color: "var(--text)" }}>{user.username}</b> ({user.role})
              </span>
              <button className="btn btn-ghost" type="button" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link className="btn btn-ghost" to="/login">Login</Link>
              <Link className="btn btn-primary" to="/register/customer">Customer Signup</Link>
              <Link className="btn btn-ghost" to="/register/seller">Seller Signup</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

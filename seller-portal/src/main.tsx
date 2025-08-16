import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, Link } from "react-router-dom";
import "./styles.css";
import { AuthProvider, useAuth, RequireSeller } from "./auth";
import SellerLogin from "./pages/Login";
import MyProducts from "./pages/MyProducts";
import NewProduct from "./pages/NewProduct";
import EditProduct from "./pages/EditProduct";

function NavBar(){
  const { user, logout, loading } = useAuth();
  return (
    <nav className="nav">
      <div className="container" style={{ display:"flex", alignItems:"center", gap:16 }}>
        <Link to="/" style={{ fontWeight:800, letterSpacing:.3, textDecoration:"none" }}>
          RuhCart • Seller
        </Link>
        <Link className="btn btn-ghost" to="/products">My Products</Link>
        <Link className="btn btn-ghost" to="/products/new">Add Product</Link>
        <div style={{ marginLeft:"auto", display:"flex", gap:12, alignItems:"center" }}>
          {loading ? (
            <span className="text-muted">…</span>
          ) : user ? (
            <>
              <span className="text-muted">Hi, <b>{user.username}</b> ({user.role})</span>
              <button className="btn btn-ghost" onClick={logout}>Logout</button>
            </>
          ) : (
            <Link className="btn btn-primary" to="/login">Seller Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (<>
    <NavBar />
    {children}
  </>);
}

function Home() {
  return (
    <div className="container">
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Welcome to the Seller Portal</h1>
        <p className="text-muted">Login to manage your products.</p>
      </div>
    </div>
  );
}

function MyProductsPlaceholder(){
  return <div className="container"><div className="card">My Products (next)</div></div>;
}
function NewProductPlaceholder(){
  return <div className="container"><div className="card">Create Product (next)</div></div>;
}
function EditProductPlaceholder(){
  return <div className="container"><div className="card">Edit Product (next)</div></div>;
}

const router = createBrowserRouter([
  { path: "/", element: <Layout><Home /></Layout> },
  { path: "/login", element: <Layout><SellerLogin /></Layout> },
  { path: "/products", element: <Layout><RequireSeller><MyProducts /></RequireSeller></Layout> },
  { path: "/products/new", element: <Layout><RequireSeller><NewProduct /></RequireSeller></Layout> },
  { path: "/products/:slug/edit", element: <Layout><RequireSeller><EditProduct /></RequireSeller></Layout> },
]);

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <RouterProvider router={router} />
  </AuthProvider>
);

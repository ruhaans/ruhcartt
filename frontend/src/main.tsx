import React from "react";
import "./styles.css";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { AuthProvider } from "./auth";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import RegisterCustomer from "./pages/RegisterCustomer";
import RegisterSeller from "./pages/RegisterSeller";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import CartPage from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";

function Home() {
  return (
    <div className="container">
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Welcome to RuhCart</h1>
        <p className="text-muted">Use the navbar to login or sign up.</p>
      </div>
    </div>
  );
}


function Layout() {
  return (
    <>
      <Navbar />  {/* Navbar is now inside Router context */}
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "login", element: <Login /> },
      { path: "register/customer", element: <RegisterCustomer /> },
      { path: "register/seller", element: <RegisterSeller /> },
      { path: "/products", element: <Products /> },
      { path: "/products/:slug", element: <ProductDetail /> },
      { path: "/cart", element: <CartPage /> },
      { path: "/checkout", element: <Checkout /> },
      { path: "/orders", element: <Orders /> },
      { path: "/orders/:id", element: <OrderDetail /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <RouterProvider router={router} />
  </AuthProvider>
);

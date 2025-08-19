import React from "react"; // keep if you're not on the new JSX runtime
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
import Card from "./components/ui/Card";
import './index.css';


function Home() {
  return (
    <div className="mx-auto max-w-[1200px] px-6 py-6">
      <Card className="p-6">
        <h1 className="text-2xl font-bold text-[var(--text)]">
          Welcome to RuhCart
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Use the navbar to login or sign up.
        </p>
      </Card>
    </div>
  );
}

function Layout() {
  return (
    <>
      <Navbar />
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
      { path: "products", element: <Products /> },          // relative child paths are fine
      { path: "products/:slug", element: <ProductDetail /> },
      { path: "cart", element: <CartPage /> },
      { path: "checkout", element: <Checkout /> },
      { path: "orders", element: <Orders /> },
      { path: "orders/:id", element: <OrderDetail /> },
    ],
  },
]);

const rootEl = document.getElementById("root");
createRoot(rootEl).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);

import "./App.css";
import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import VendorRoute from "./components/VendorRoute";

import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Payment from "./pages/Payment";
import PaymentSuccess from "./pages/PaymentSuccess";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import BecomeVendor from "./pages/BecomeVendor";
import VendorStore from "./pages/VendorStore";
import Admin from "./pages/Admin";
import Vendor from "./pages/Vendor";
import NotFound from "./pages/NotFound";
import Wishlist from "./pages/Wishlist";
import Notifications from "./pages/Notifications";
import Returns from "./pages/Returns";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  const location = useLocation();

  const isDashboard =
    location.pathname.startsWith("/admin") || location.pathname.startsWith("/vendor");

  return (
    <div className="app-shell">
      <ScrollToTop />

      <Navbar />

      <div className="app-content">
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route path="/login" element={<Login />} />

          <Route path="/register" element={<Register />} />

          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route path="/reset-password/:token" element={<ResetPassword />} />

          <Route path="/products" element={<Products />} />

          <Route path="/products/:id" element={<ProductDetails />} />

          <Route path="/store/:slug" element={<VendorStore />} />

          <Route path="/cart" element={<Cart />} />

          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />

          <Route
            path="/payment"
            element={
              <ProtectedRoute>
                <Payment />
              </ProtectedRoute>
            }
          />

          <Route
            path="/payment-success"
            element={
              <ProtectedRoute>
                <PaymentSuccess />
              </ProtectedRoute>
            }
          />

          <Route
            path="/wishlist"
            element={
              <ProtectedRoute>
                <Wishlist />
              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />

          <Route
            path="/returns"
            element={
              <ProtectedRoute>
                <Returns />
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/become-vendor"
            element={
              <ProtectedRoute>
                <BecomeVendor />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/*"
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            }
          />

          <Route
            path="/vendor/*"
            element={
              <VendorRoute>
                <Vendor />
              </VendorRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>

      {!isDashboard && <Footer />}
    </div>
  );
}

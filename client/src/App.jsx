import "./App.css";

import {
  lazy,
  Suspense,
  useEffect,
} from "react";

import {
  Routes,
  Route,
  useLocation,
} from "react-router";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import VendorRoute from "./components/VendorRoute";

/*
 * Keep the homepage eager because it is the
 * first page most visitors will see.
 */
import HomePage from "./pages/HomePage";

/*
 * Everything else is downloaded only when
 * the user actually visits that route.
 */
const Login = lazy(() =>
  import("./pages/Login")
);

const Register = lazy(() =>
  import("./pages/Register")
);

const Products = lazy(() =>
  import("./pages/Products")
);

const ProductDetails = lazy(() =>
  import("./pages/ProductDetails")
);

const Cart = lazy(() =>
  import("./pages/Cart")
);

const Checkout = lazy(() =>
  import("./pages/Checkout")
);

const Payment = lazy(() =>
  import("./pages/Payment")
);

const PaymentSuccess = lazy(() =>
  import("./pages/PaymentSuccess")
);

const Orders = lazy(() =>
  import("./pages/Orders")
);

const Profile = lazy(() =>
  import("./pages/Profile")
);

const ForgotPassword = lazy(() =>
  import("./pages/ForgotPassword")
);

const ResetPassword = lazy(() =>
  import("./pages/ResetPassword")
);

const BecomeVendor = lazy(() =>
  import("./pages/BecomeVendor")
);

const VendorStore = lazy(() =>
  import("./pages/VendorStore")
);

const Admin = lazy(() =>
  import("./pages/Admin")
);

const Vendor = lazy(() =>
  import("./pages/Vendor")
);

const NotFound = lazy(() =>
  import("./pages/NotFound")
);

const Wishlist = lazy(() =>
  import("./pages/Wishlist")
);

const Notifications = lazy(() =>
  import("./pages/Notifications")
);

const Returns = lazy(() =>
  import("./pages/Returns")
);

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function RouteLoader() {
  return (
    <div className="state-card page-state">
      Loading...
    </div>
  );
}

export default function App() {
  const location = useLocation();

  const isDashboard =
    location.pathname.startsWith(
      "/admin"
    ) ||
    location.pathname.startsWith(
      "/vendor"
    );

  return (
    <div className="app-shell">
      <ScrollToTop />

      <Navbar />

      <div className="app-content">
        <Suspense
          fallback={<RouteLoader />}
        >
          <Routes>
            <Route
              path="/"
              element={<HomePage />}
            />

            <Route
              path="/login"
              element={<Login />}
            />

            <Route
              path="/register"
              element={<Register />}
            />

            <Route
              path="/forgot-password"
              element={<ForgotPassword />}
            />

            <Route
              path="/reset-password/:token"
              element={<ResetPassword />}
            />

            <Route
              path="/products"
              element={<Products />}
            />

            <Route
              path="/products/:id"
              element={
                <ProductDetails />
              }
            />

            <Route
              path="/store/:slug"
              element={<VendorStore />}
            />

            <Route
              path="/cart"
              element={<Cart />}
            />

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

            <Route
              path="*"
              element={<NotFound />}
            />
          </Routes>
        </Suspense>
      </div>

      {!isDashboard && <Footer />}
    </div>
  );
}
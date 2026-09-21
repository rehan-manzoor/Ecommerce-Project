import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api
      .get("/categories")
      .then((r) => setCategories(r.data.data || []))
      .catch(() => {});
  }, []);

  const close = () => setOpen(false);

  const signOut = async () => {
    await logout();
    close();
    navigate("/");
  };

  const homeLink = user?.role === "admin" ? "/admin" : user?.role === "vendor" ? "/vendor" : "/";
  const brandLabel =
    user?.role === "admin"
      ? "MERN Admin"
      : user?.role === "vendor"
        ? "Seller Center"
        : "MERN Market";

  const goToCategory = (e) => {
    if (e.target.value) navigate(`/products?category=${e.target.value}`);
    e.target.value = "";
    close();
  };

  return (
    <header className={`site-header role-${user?.role || "guest"}`}>
      <nav className="navbar container">
        <Link className="brand" to={homeLink} onClick={close}>
          <span className="brand-mark">M</span>
          <span>{brandLabel}</span>
        </Link>

        <button
          className="menu-toggle"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
          aria-expanded={open}
        >
          ☰
        </button>

        <div className={`nav-links ${open ? "open" : ""}`}>
          {(!user || user.role === "customer") && (
            <>
              <NavLink to="/" onClick={close}>
                Home
              </NavLink>
              <NavLink to="/products" onClick={close}>
                Shop
              </NavLink>

              {categories.length > 0 && (
                <select
                  className="nav-category-select"
                  defaultValue=""
                  onChange={goToCategory}
                  aria-label="Browse by category"
                >
                  <option value="" disabled>
                    Categories
                  </option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              )}

              <NavLink to="/cart" onClick={close}>
                Cart
              </NavLink>

              {user && (
                <>
                  <NavLink to="/orders" onClick={close}>
                    My Orders
                  </NavLink>
                  <NavLink to="/wishlist" onClick={close}>
                    Wishlist
                  </NavLink>
                  <NavLink to="/returns" onClick={close}>
                    Returns
                  </NavLink>
                  <NavLink to="/become-vendor" onClick={close}>
                    Become Seller
                  </NavLink>
                  <NavLink to="/profile" onClick={close}>
                    My Account
                  </NavLink>
                </>
              )}
            </>
          )}

          {user?.role === "vendor" && (
            <>
              <NavLink to="/vendor" onClick={close}>
                Dashboard
              </NavLink>
              <NavLink to="/products" onClick={close}>
                View Marketplace
              </NavLink>
              <NavLink to="/profile" onClick={close}>
                My Account
              </NavLink>
            </>
          )}

          {user?.role === "admin" && (
            <>
              <NavLink to="/admin" onClick={close}>
                Control Center
              </NavLink>
              <NavLink to="/products" onClick={close}>
                View Marketplace
              </NavLink>
              <NavLink to="/profile" onClick={close}>
                Admin Account
              </NavLink>
            </>
          )}

          {user && (
            <NavLink to="/notifications" onClick={close}>
              Notifications
            </NavLink>
          )}
          {user ? (
            <button className="nav-button" onClick={signOut}>
              Logout
            </button>
          ) : (
            <>
              <NavLink to="/login" onClick={close}>
                Login
              </NavLink>
              <Link className="button small" to="/register" onClick={close}>
                Create account
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

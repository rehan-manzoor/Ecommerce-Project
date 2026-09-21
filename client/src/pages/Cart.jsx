import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { getGuestCart, setGuestCart, clearGuestCart } from "../utils/guestCart";
import { notify } from "../components/Toast";

export default function Cart() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    if (!user) {
      setCart({ items: getGuestCart() });
    } else {
      try {
        const r = await api.get("/cart");
        setCart(r.data.data || { items: [] });
      } catch {
        setCart({ items: [] });
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const updateQuantity = async (productId, quantity, variantId = null) => {
    try {
      if (!user) {
        const items = getGuestCart().map((item) =>
          item.product._id === productId && (item.variantId || null) === variantId
            ? { ...item, quantity }
            : item
        );
        setGuestCart(items);
        setCart({ items });
      } else {
        const r = await api.put("/cart/update", { productId, quantity, variantId });
        setCart(r.data.data);
      }
    } catch (error) {
      notify(error.response?.data?.message || "Could not update cart", "error");
    }
  };

  const remove = async (productId, variantId = null) => {
    if (!user) {
      const items = getGuestCart().filter(
        (item) => !(item.product._id === productId && (item.variantId || null) === variantId)
      );
      setGuestCart(items);
      setCart({ items });
    } else {
      const r = await api.delete(
        `/cart/remove/${productId}${variantId ? `?variantId=${variantId}` : ""}`
      );
      setCart(r.data.data);
    }
  };

  const clear = async () => {
    if (!user) {
      clearGuestCart();
      setCart({ items: [] });
    } else {
      const r = await api.delete("/cart/clear");
      setCart(r.data.data);
    }
  };

  const total = cart.items.reduce(
    (sum, item) =>
      sum +
      (item.variantId
        ? item.product.variants?.find((variant) => variant._id === item.variantId)?.price ||
          item.product.price
        : (item.product.salePrice ?? item.product.price)) *
        item.quantity,
    0
  );

  if (loading) return <CartSkeleton />;

  return (
    <main className="container page-shell">
      <div className="page-title">
        <span className="eyebrow">Your bag</span>
        <h1>Shopping cart</h1>
      </div>

      {!cart.items.length ? (
        <div className="state-card">
          <h2>Your cart is empty</h2>
          <p className="muted">Browse the marketplace and add something you like.</p>
          <Link className="button" to="/products">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <section className="cart-items panel">
            {cart.items.map((item) => (
              <article className="cart-item" key={`${item.product._id}-${item.variantId || ""}`}>
                <div className="cart-thumb">
                  {item.product.images?.[0] ? (
                    <img src={item.product.images[0]} alt={item.product.name} />
                  ) : (
                    "No image"
                  )}
                </div>

                <div className="cart-main">
                  <Link to={`/products/${item.product._id}`}>
                    <h3>{item.product.name}</h3>
                  </Link>
                  <p>
                    $
                    {(item.variantId
                      ? item.product.variants?.find((variant) => variant._id === item.variantId)
                          ?.price || item.product.price
                      : (item.product.salePrice ?? item.product.price)
                    ).toFixed(2)}{" "}
                    each
                  </p>
                  {item.variantId && (
                    <p>
                      {Object.values(
                        item.product.variants?.find((variant) => variant._id === item.variantId)
                          ?.attributes || {}
                      ).join(" / ")}
                    </p>
                  )}
                  <div className="quantity-row compact">
                    <button
                      disabled={item.quantity <= 1}
                      onClick={() =>
                        updateQuantity(item.product._id, item.quantity - 1, item.variantId)
                      }
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      disabled={
                        item.quantity >=
                        (item.variantId
                          ? item.product.variants?.find((variant) => variant._id === item.variantId)
                              ?.stock || 0
                          : item.product.stock)
                      }
                      onClick={() =>
                        updateQuantity(item.product._id, item.quantity + 1, item.variantId)
                      }
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="cart-end">
                  <strong>
                    $
                    {(
                      (item.variantId
                        ? item.product.variants?.find((variant) => variant._id === item.variantId)
                            ?.price || item.product.price
                        : (item.product.salePrice ?? item.product.price)) * item.quantity
                    ).toFixed(2)}
                  </strong>
                  <button
                    className="text-button danger"
                    onClick={() => remove(item.product._id, item.variantId)}
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </section>

          <aside className="summary-card panel">
            <h2>Order summary</h2>
            <div className="summary-row">
              <span>Subtotal</span>
              <strong>${total.toFixed(2)}</strong>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <strong>Free</strong>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <strong>${total.toFixed(2)}</strong>
            </div>

            <button
              className="button full"
              onClick={() =>
                user ? navigate("/checkout") : navigate("/login", { state: { from: "/checkout" } })
              }
            >
              {user ? "Proceed to checkout" : "Login to checkout"}
            </button>
            <button className="button ghost full" onClick={clear}>
              Clear cart
            </button>

            {!user && (
              <p className="muted small-text">
                Your guest cart will merge automatically after login.
              </p>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}

function CartSkeleton() {
  return (
    <main className="container page-shell">
      <div className="skeleton" style={{ height: 32, width: 220, marginBottom: 30 }} />
      <div className="cart-layout">
        <section className="cart-items panel">
          {Array.from({ length: 3 }).map((_, i) => (
            <div className="cart-item" key={i}>
              <div className="skeleton cart-thumb" />
              <div>
                <div className="skeleton" style={{ height: 16, width: "60%", marginBottom: 10 }} />
                <div className="skeleton" style={{ height: 14, width: "30%" }} />
              </div>
            </div>
          ))}
        </section>
        <aside className="summary-card panel">
          <div className="skeleton" style={{ height: 160 }} />
        </aside>
      </div>
    </main>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import api from "../api/axios";
import { notify } from "../components/Toast";

export default function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Pakistan",
  });
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [methods, setMethods] = useState([]);
  const [shippingMethodId, setShippingMethodId] = useState("");

  useEffect(() => {
    api
      .get("/cart")
      .then((r) => {
        const data = r.data.data || { items: [] };
        setCart(data);
        if (!data.items.length) navigate("/cart");
      })
      .catch(() => navigate("/login"))
      .finally(() => setLoading(false));
  }, [navigate]);

  useEffect(() => {
    api
      .get("/shipping")
      .then((response) => {
        setMethods(response.data.data);
        setShippingMethodId(response.data.data[0]?._id || "");
      })
      .catch(() => notify("Shipping unavailable", "error"));
  }, []);

  const subtotal = cart.items.reduce(
    (sum, item) =>
      sum +
      (item.variantId
        ? item.product.variants?.find((variant) => variant._id === item.variantId)?.price ||
          item.product.price
        : (item.product.salePrice ?? item.product.price)) *
        item.quantity,
    0
  );

  const applyCoupon = async () => {
    if (!couponCode.trim()) return setDiscount(0);
    setApplyingCoupon(true);
    try {
      const r = await api.post("/coupons/validate", { code: couponCode });
      setDiscount(r.data.data.discountAmount);
      setCouponCode(r.data.data.code);
      notify("Coupon applied");
    } catch (error) {
      setDiscount(0);
      notify(error.response?.data?.message || "Invalid coupon", "error");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    navigate("/payment", {
      state: {
        shippingAddress: form,
        couponCode: couponCode.trim().toUpperCase(),
        shippingMethodId,
        pricing: {
          subtotalAmount: subtotal,
          discountAmount: discount,
          shippingAmount: methods.find((method) => method._id === shippingMethodId)?.fee || 0,
          taxAmount: 0,
          totalAmount:
            subtotal -
            discount +
            (methods.find((method) => method._id === shippingMethodId)?.fee || 0),
        },
      },
    });
  };

  if (loading) return <div className="state-card page-state">Loading checkout...</div>;

  return (
    <main className="container page-shell">
      <div className="checkout-grid">
        <form className="panel checkout-form" onSubmit={submit}>
          <span className="eyebrow">Checkout</span>
          <h1>Shipping details</h1>

          <div className="form-grid">
            <label className="wide">
              Street address
              <input
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </label>
            <label>
              City
              <input
                required
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </label>
            <label>
              State / Province
              <input
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              />
            </label>
            <label>
              Postal code
              <input
                required
                value={form.postalCode}
                onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
              />
            </label>
            <label>
              Country
              <input
                required
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              />
            </label>
          </div>

          <label>
            Shipping method
            <select
              value={shippingMethodId}
              onChange={(event) => setShippingMethodId(event.target.value)}
            >
              {!methods.length && <option value="">Free local shipping</option>}
              {methods.map((method) => (
                <option key={method._id} value={method._id}>
                  {method.name} · ${method.fee.toFixed(2)} · {method.estimatedDays} days
                </option>
              ))}
            </select>
          </label>
          <button className="button full">Continue to secure payment</button>
        </form>

        <aside className="summary-card panel">
          <h2>Order summary</h2>

          {cart.items.map((item) => (
            <div className="summary-row" key={item.product._id}>
              <span>
                {item.product.name} × {item.quantity}
              </span>
              <strong>
                $
                {(
                  (item.variantId
                    ? item.product.variants?.find((variant) => variant._id === item.variantId)
                        ?.price || item.product.price
                    : (item.product.salePrice ?? item.product.price)) * item.quantity
                ).toFixed(2)}
              </strong>
            </div>
          ))}

          <div className="coupon-row">
            <input
              placeholder="Coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
            />
            <button type="button" onClick={applyCoupon} disabled={applyingCoupon}>
              {applyingCoupon ? "..." : "Apply"}
            </button>
          </div>

          <div className="summary-row">
            <span>Subtotal</span>
            <strong>${subtotal.toFixed(2)}</strong>
          </div>
          {discount > 0 && (
            <div className="summary-row discount">
              <span>Discount</span>
              <strong>−${discount.toFixed(2)}</strong>
            </div>
          )}
          <div className="summary-row">
            <span>Shipping</span>
            <strong>
              ${(methods.find((method) => method._id === shippingMethodId)?.fee || 0).toFixed(2)}
            </strong>
          </div>
          <div className="summary-row">
            <span>Tax</span>
            <strong>Calculated securely at payment</strong>
          </div>
          <div className="summary-total">
            <span>Estimated total</span>
            <strong>
              $
              {(
                subtotal -
                discount +
                (methods.find((method) => method._id === shippingMethodId)?.fee || 0)
              ).toFixed(2)}{" "}
              + tax
            </strong>
          </div>
        </aside>
      </div>
    </main>
  );
}

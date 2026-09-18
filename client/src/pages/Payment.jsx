import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import api from "../api/axios";
import { notify } from "../components/Toast";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function PaymentForm({ pricing }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/payment-success` },
    });

    if (error) {
      notify(error.message || "Payment failed", "error");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <PaymentElement />
      <button className="button full payment-submit" disabled={!stripe || loading}>
        {loading ? (
          <>
            <span className="spinner" /> Processing...
          </>
        ) : (
          `Pay $${pricing.totalAmount.toFixed(2)}`
        )}
      </button>
    </form>
  );
}

export default function Payment() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const shippingAddress = state?.shippingAddress;
  const couponCode = state?.couponCode || "";
  const shippingMethodId = state?.shippingMethodId || null;

  const [pricing, setPricing] = useState(state?.pricing || null);
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(false);

  if (!shippingAddress) {
    return (
      <div className="state-card page-state">
        <h2>Checkout information is missing</h2>
        <p className="muted">Please start again from your cart.</p>
        <button className="button" onClick={() => navigate("/cart")}>Back to cart</button>
      </div>
    );
  }

  const prepare = async () => {
    try {
      setLoading(true);
      const response = await api.post("/payments/create-intent", { couponCode, shippingMethodId });
      setClientSecret(response.data.data.clientSecret);
      setPricing(response.data.data.pricing);
      sessionStorage.setItem("checkoutPayload", JSON.stringify({ shippingAddress, couponCode, shippingMethodId }));
    } catch (error) {
      notify(error.response?.data?.message || "Could not prepare payment", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container page-shell">
      <div className="checkout-grid">
        <section className="panel payment-panel">
          <span className="eyebrow">Secure payment</span>
          <h1>Complete your order</h1>
          <p className="muted">Payments are securely processed by Stripe.</p>

          {!clientSecret ? (
            <button className="button full" disabled={loading} onClick={prepare}>
              {loading ? (
                <>
                  <span className="spinner" /> Preparing secure checkout...
                </>
              ) : (
                "Continue to payment"
              )}
            </button>
          ) : (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm pricing={pricing} />
            </Elements>
          )}
        </section>

        <aside className="summary-card panel">
          <h2>Deliver to</h2>
          <p>{shippingAddress.address}</p>
          <p>{shippingAddress.city}{shippingAddress.state ? `, ${shippingAddress.state}` : ""}</p>
          <p>{shippingAddress.postalCode}, {shippingAddress.country}</p>

          {pricing && (
            <>
              <hr />
              <div className="summary-row">
                <span>Subtotal</span>
                <strong>${pricing.subtotalAmount.toFixed(2)}</strong>
              </div>
              {pricing.discountAmount > 0 && (
                <div className="summary-row discount">
                  <span>Discount</span>
                  <strong>−${pricing.discountAmount.toFixed(2)}</strong>
                </div>
              )}
              <div className="summary-row"><span>Shipping</span><strong>${pricing.shippingAmount.toFixed(2)}</strong></div>
              <div className="summary-row"><span>Tax</span><strong>${pricing.taxAmount.toFixed(2)}</strong></div>
              <div className="summary-total">
                <span>Total</span>
                <strong>${pricing.totalAmount.toFixed(2)}</strong>
              </div>
            </>
          )}
        </aside>
      </div>
    </main>
  );
}

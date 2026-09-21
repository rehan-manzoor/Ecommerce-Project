import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";

import api from "../api/axios";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();

  const paymentIntentId = searchParams.get("payment_intent");

  const [state, setState] = useState({
    loading: true,
    message: "Payment received. Confirming your order...",
    order: null,
  });

  useEffect(() => {
    let cancelled = false;
    let timer = null;

    const checkPayment = async (attempt = 0) => {
      try {
        if (!paymentIntentId) {
          throw new Error("Payment confirmation information is missing");
        }

        const response = await api.get(`/payments/intent/${paymentIntentId}`);

        if (cancelled) return;

        const payment = response.data.data;

        if (payment.order) {
          sessionStorage.removeItem("checkoutPayload");

          setState({
            loading: false,
            message: "Payment successful. Your order is confirmed!",
            order: payment.order,
          });

          return;
        }

        if (payment.status === "failed") {
          setState({
            loading: false,
            message: "Payment could not be completed.",
            order: null,
          });

          return;
        }

        if (payment.status === "refunded") {
          setState({
            loading: false,
            message: "The payment was refunded because the order could not be finalized.",
            order: null,
          });

          return;
        }

        /*
         * Stripe webhook processing can finish a
         * moment after the browser redirects.
         * Poll briefly for the webhook-created order.
         */
        if (attempt < 12) {
          timer = setTimeout(() => checkPayment(attempt + 1), 1000);

          return;
        }

        setState({
          loading: false,
          message:
            "Payment was received, but order confirmation is taking longer than expected. Please check My Orders shortly.",
          order: null,
        });
      } catch (error) {
        if (cancelled) return;

        /*
         * Give the webhook a moment if the
         * payment record/order is still being processed.
         */
        if (attempt < 5 && error.response?.status !== 401) {
          timer = setTimeout(() => checkPayment(attempt + 1), 1000);

          return;
        }

        setState({
          loading: false,
          message: error.response?.data?.message || error.message || "Unable to confirm the order.",
          order: null,
        });
      }
    };

    checkPayment();

    return () => {
      cancelled = true;

      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [paymentIntentId]);

  return (
    <main className="container page-shell">
      <div className="success-card panel">
        <div className="success-icon">{state.loading ? "…" : state.order ? "✓" : "!"}</div>

        <h1>
          {state.loading
            ? "Confirming your order"
            : state.order
              ? "Order confirmed"
              : "Order needs attention"}
        </h1>

        <p>{state.message}</p>

        {state.order && (
          <p className="muted">Order #{String(state.order._id).slice(-8).toUpperCase()}</p>
        )}

        <div className="hero-actions">
          {state.order && (
            <Link className="button" to="/orders">
              View my orders
            </Link>
          )}

          {!state.loading && (
            <Link className="button ghost" to="/products">
              Continue shopping
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

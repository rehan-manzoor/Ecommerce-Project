import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import api from "../api/axios";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();

  const paymentIntentId = searchParams.get("payment_intent");

  const [state, setState] = useState({
    loading: true,
    message: "Verifying payment and creating your order...",
    order: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    const run = async () => {
      try {
        const saved = JSON.parse(
          sessionStorage.getItem("checkoutPayload") || "null"
        );

        if (!paymentIntentId || !saved?.shippingAddress) {
          throw new Error(
            "Payment confirmation information is missing"
          );
        }

        const response = await api.post(
          "/orders",
          {
            paymentIntentId,
            shippingAddress: saved.shippingAddress,
          },
          {
            signal: controller.signal,
          }
        );

        sessionStorage.removeItem("checkoutPayload");

        setState({
          loading: false,
          message: "Payment successful. Your order is confirmed!",
          order: response.data.data,
        });
      } catch (error) {
        // Ignore request cancelled by React StrictMode
        if (
          error.code === "ERR_CANCELED" ||
          error.name === "CanceledError"
        ) {
          return;
        }

        setState({
          loading: false,
          message:
            error.response?.data?.message ||
            error.message ||
            "Payment succeeded but the order could not be finalized.",
          order: null,
        });
      }
    };

    run();

    return () => {
      controller.abort();
    };
  }, [paymentIntentId]);

  return (
    <main className="container page-shell">
      <div className="success-card panel">
        <div className="success-icon">
          {state.loading ? "…" : state.order ? "✓" : "!"}
        </div>

        <h1>
          {state.loading
            ? "Finalizing your order"
            : state.order
            ? "Order confirmed"
            : "Order needs attention"}
        </h1>

        <p>{state.message}</p>

        {state.order && (
          <p className="muted">
            Order #{state.order._id.slice(-8).toUpperCase()}
          </p>
        )}

        <div className="hero-actions">
          {state.order && (
            <Link className="button" to="/orders">
              View my orders
            </Link>
          )}

          <Link className="button ghost" to="/products">
            Continue shopping
          </Link>
        </div>
      </div>
    </main>
  );
}
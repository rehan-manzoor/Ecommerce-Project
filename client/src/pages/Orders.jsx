import { useEffect, useState } from "react";
import { Link } from "react-router";
import api from "../api/axios";
import { notify } from "../components/Toast";
import { useDialog } from "../components/Dialog";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const openDialog = useDialog();

  useEffect(() => {
    api
      .get("/orders/my")
      .then((r) => setOrders(r.data.data || []))
      .finally(() => setLoading(false));
  }, []);

  const cancel = async (order, group) => {
  const result = await openDialog({
    title: "Cancel seller items",
    description: `Tell us why you want to cancel items from ${
      group.vendor?.storeName || "this seller"
    }.`,
    fields: [
      {
        name: "reason",
        label: "Cancellation reason",
        type: "textarea",
        required: true,
      },
    ],
    confirmLabel: "Cancel items",
    danger: true,
  });

  const reason = result?.reason?.trim();

  if (!reason) return;

  try {
    await api.post(
      `/orders/${order._id}/vendors/${
        group.vendor?._id || group.vendor
      }/cancel`,
      { reason }
    );

    const response = await api.get("/orders/my");
    setOrders(response.data.data || []);

    notify("Cancellation and refund initiated");
  } catch (error) {
    notify(
      error.response?.data?.message || "Cancellation failed",
      "error"
    );
  }
};
  const requestReturn = async (order, item) => {
  const result = await openDialog({
    title: `Return ${item.name}`,
    description:
      "Please tell us why you would like to return this product.",
    fields: [
      {
        name: "reason",
        label: "Return reason",
        type: "textarea",
        required: true,
      },
    ],
    confirmLabel: "Request return",
  });

  const reason = result?.reason?.trim();

  if (!reason) return;

  try {
    await api.post("/returns", {
      orderId: order._id,
      productId: item.product?._id || item.product,
      quantity: item.quantity,
      reason,
    });

    notify("Return requested");
  } catch (error) {
    notify(
      error.response?.data?.message || "Return request failed",
      "error"
    );
  }
};
  if (loading) return <OrdersSkeleton />;

  return (
    <main className="container page-shell">
      <div className="page-title">
        <span className="eyebrow">Purchases</span>
        <h1>My orders</h1>
      </div>

      {!orders.length ? (
        <div className="state-card">
          <h2>No orders yet</h2>
          <p className="muted">Once you place an order, it'll show up here.</p>
          <Link className="button" to="/products">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <article className="order-card panel" key={order._id}>
              <div className="order-head">
                <div>
                  <span className="muted small-text">ORDER</span>
                  <h3>#{order._id.slice(-8).toUpperCase()}</h3>
                </div>
                <span className={`status-badge ${order.status}`}>{order.status}</span>
              </div>

              <div className="order-meta">
                <span>{new Date(order.createdAt).toLocaleString()}</span>
                <strong>${order.totalAmount.toFixed(2)}</strong>
              </div>

              <div className="order-products">
                {order.items.map((item, index) => (
                  <div className="order-product" key={`${order._id}-${index}`}>
                    <div className="mini-thumb">
                      {(item.image || item.product?.images?.[0]) && (
                        <img src={item.image || item.product.images[0]} alt={item.name || item.product?.name} />
                      )}
                    </div>
                    <div>
                      <Link to={`/products/${item.product?._id || item.product}`}>
                        {item.name || item.product?.name || "Product"}
                      </Link>
                      <p className="muted">
                        Qty {item.quantity} × ${item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="summary-row"><span>Shipping</span><strong>${Number(order.shippingAmount || 0).toFixed(2)}</strong></div>
              <div className="summary-row"><span>Tax</span><strong>${Number(order.taxAmount || 0).toFixed(2)}</strong></div>
              {order.vendorOrders?.map((group) => <div className="panel" key={group._id}><h4>{group.vendor?.storeName || "Seller"} · {group.status}</h4>{group.history?.map((event, index) => <p className="muted small-text" key={index}>{event.status} · {new Date(event.changedAt).toLocaleString()}</p>)}{group.trackingNumber && <p>Tracking: {group.carrier} · {group.trackingNumber}</p>}{["pending","confirmed"].includes(group.status) && <button className="button danger small" onClick={() => cancel(order, group)}>Cancel seller items</button>}{group.status === "delivered" && group.items.map((item, index) => <button className="button ghost small" key={index} onClick={() => requestReturn(order, item)}>Return {item.name}</button>)}</div>)}
              {order.discountAmount > 0 && (
                <p className="discount">
                  Coupon {order.couponCode}: −${order.discountAmount.toFixed(2)}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

function OrdersSkeleton() {
  return (
    <main className="container page-shell">
      <div className="skeleton" style={{ height: 32, width: 200, marginBottom: 30 }} />
      <div className="orders-list">
        {Array.from({ length: 3 }).map((_, i) => (
          <div className="order-card panel" key={i}>
            <div className="skeleton" style={{ height: 20, width: "40%", marginBottom: 14 }} />
            <div className="skeleton" style={{ height: 60 }} />
          </div>
        ))}
      </div>
    </main>
  );
}

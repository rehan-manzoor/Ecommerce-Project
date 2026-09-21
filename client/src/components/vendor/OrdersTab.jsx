import api from "../../api/axios";
import { notify } from "../Toast";
import { useDialog } from "../Dialog";
import { VENDOR_ORDER_STATUSES } from "./shared.js";

export function OrdersTab({ orders, vendorId, onChanged }) {
  const openDialog = useDialog();

  const updateStatus = async (order, status) => {
    try {
      const payload = {
        status,
      };

      if (status === "shipped") {
        const result = await openDialog({
          title: "Shipping information",

          description: "Enter the carrier and tracking number for this order.",

          fields: [
            {
              name: "carrier",
              label: "Carrier name",
              required: true,
            },
            {
              name: "trackingNumber",
              label: "Tracking number",
              required: true,
            },
          ],

          confirmLabel: "Mark as shipped",
        });

        if (!result) return;

        payload.carrier = result.carrier?.trim();

        payload.trackingNumber = result.trackingNumber?.trim();

        if (!payload.carrier || !payload.trackingNumber) {
          return;
        }
      }

      await api.put(`/orders/vendor/${order._id}/status`, payload);

      notify("Order updated");

      await onChanged();
    } catch (error) {
      notify(error.response?.data?.message || "Update failed", "error");
    }
  };

  return (
    <>
      <div className="page-title">
        <h1>Orders containing my products</h1>
      </div>

      {!orders.length && (
        <div className="state-card">
          <h3>No orders yet</h3>
        </div>
      )}

      <div className="management-list">
        {orders.map((order) => {
          const myItems = order.items.filter(
            (item) => String(item.vendor?._id || item.vendor) === String(vendorId)
          );

          return (
            <div className="management-card panel" key={order._id}>
              <div>
                <h3>#{order._id.slice(-8).toUpperCase()}</h3>

                <p>
                  {order.user?.name} · ${order.totalAmount.toFixed(2)}
                </p>

                <p className="muted">
                  {myItems
                    .map((item) => `${item.name || item.product?.name} × ${item.quantity}`)
                    .join(", ")}
                </p>
              </div>

              {order.vendorOrders?.[0]?.trackingNumber && (
                <p>
                  Tracking: {order.vendorOrders[0].carrier} · {order.vendorOrders[0].trackingNumber}
                </p>
              )}

              <select
                value={order.status}
                onChange={(event) => updateStatus(order, event.target.value)}
              >
                {!VENDOR_ORDER_STATUSES.includes(order.status) && (
                  <option value={order.status}>{order.status}</option>
                )}

                {VENDOR_ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </>
  );
}

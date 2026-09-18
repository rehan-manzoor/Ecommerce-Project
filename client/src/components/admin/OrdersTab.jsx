import { EmptyState } from "./EmptyState.jsx";
import { ORDER_STATUSES, money, shortId } from "./shared.js";

export function OrdersTab({
  orders,
  onStatusChange,
}) {
  return (
    <>
      <div className="page-title">
        <h1>Vendor fulfillment</h1>
        <p>Manage each seller's items separately.</p>
      </div>

      {!orders.length && (
        <EmptyState title="No orders yet" />
      )}

      <div className="management-list">
        {orders.map((order) => (
          <article
            className="management-card panel"
            key={order._id}
          >
            <div>
              <h3>{shortId(order._id)}</h3>

              <p>
                {order.user?.name} · {money(order.totalAmount)}
              </p>

              {order.vendorOrders?.map((group) => (
                <div
                  className="summary-row"
                  key={group._id}
                >
                  <span>
                    {group.vendor?.storeName || "Vendor"} ·{" "}
                    {group.status} · {money(group.subtotal)}
                    {group.trackingNumber &&
                      ` · ${group.carrier}: ${group.trackingNumber}`}
                  </span>

                  <select
                    value={group.status}
                    onChange={(event) =>
                      onStatusChange(
                        order,
                        group,
                        event.target.value
                      )
                    }
                  >
                    <option value={group.status}>
                      {group.status}
                    </option>

                    {ORDER_STATUSES.filter(
                      (status) => status !== group.status
                    ).map((status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

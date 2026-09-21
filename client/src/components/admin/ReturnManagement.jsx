import { EmptyState } from "./EmptyState.jsx";
import { money } from "./shared.js";

export function ReturnManagement({ returns, onChange }) {
  const next = {
    requested: ["approved", "rejected"],
    approved: ["item_received"],
    item_received: ["refund_processing"],
    refund_processing: ["refunded"],
  };

  return (
    <>
      <div className="page-title">
        <h1>Returns and refunds</h1>
      </div>

      {!returns.length && <EmptyState title="No return requests" />}

      <div className="management-list">
        {returns.map((entry) => (
          <article className="management-card panel" key={entry._id}>
            <div>
              <h3>{entry.product?.name}</h3>
              <p>
                {entry.user?.name} · {entry.reason} · {money(entry.refundAmount)}
              </p>
            </div>

            <select value={entry.status} onChange={(event) => onChange(entry, event.target.value)}>
              <option value={entry.status}>{entry.status}</option>

              {(next[entry.status] || []).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </article>
        ))}
      </div>
    </>
  );
}

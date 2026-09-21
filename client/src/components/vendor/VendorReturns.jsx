import api from "../../api/axios";
import { notify } from "../Toast";

export function VendorReturns({ entries, onChanged }) {
  const update = async (entry, status) => {
    try {
      await api.put(`/returns/${entry._id}/status`, {
        status,
      });

      await onChanged();

      notify("Return updated");
    } catch (error) {
      notify(error.response?.data?.message || "Unable to update return", "error");
    }
  };

  return (
    <>
      <div className="page-title">
        <h1>Store returns</h1>
      </div>

      {!entries.length && <div className="state-card">No return requests.</div>}

      <div className="management-list">
        {entries.map((entry) => (
          <article className="management-card panel" key={entry._id}>
            <div>
              <h3>{entry.product?.name}</h3>

              <p>
                {entry.user?.name} · {entry.reason} · Qty {entry.quantity}
              </p>
            </div>

            <div>
              <span className={`status-badge ${entry.status}`}>{entry.status}</span>

              {entry.status === "requested" && (
                <>
                  <button className="button small" onClick={() => update(entry, "approved")}>
                    Approve
                  </button>

                  <button className="button danger small" onClick={() => update(entry, "rejected")}>
                    Reject
                  </button>
                </>
              )}

              {entry.status === "approved" && (
                <button className="button small" onClick={() => update(entry, "item_received")}>
                  Item received
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

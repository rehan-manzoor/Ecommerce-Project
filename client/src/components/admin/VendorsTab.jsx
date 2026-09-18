import { EmptyState } from "./EmptyState.jsx";
export function VendorsTab({
  vendors,
  onApprove,
  onReject,
  onSuspend,
}) {
  return (
    <>
      <div className="page-title">
        <h1>Vendor applications</h1>
        <p>Review and manage seller accounts.</p>
      </div>

      {!vendors.length && (
        <EmptyState title="No vendor applications yet" />
      )}

      <div className="management-list">
        {vendors.map((vendor) => (
          <div
            className="management-card panel"
            key={vendor._id}
          >
            <div>
              <h3>{vendor.storeName}</h3>
              <p>
                {vendor.user?.name} · {vendor.user?.email}
              </p>
              <p className="muted">{vendor.description}</p>
            </div>

            <div className="management-actions">
              <span
                className={`status-badge ${vendor.status}`}
              >
                {vendor.status}
              </span>

              {vendor.status !== "approved" && (
                <button
                  className="button small"
                  onClick={() => onApprove(vendor)}
                >
                  Approve
                </button>
              )}

              {vendor.status !== "rejected" && (
                <button
                  className="button danger small"
                  onClick={() => onReject(vendor)}
                >
                  Reject
                </button>
              )}

              {vendor.status === "approved" && (
                <button
                  className="button ghost small"
                  onClick={() => onSuspend(vendor)}
                >
                  Suspend
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

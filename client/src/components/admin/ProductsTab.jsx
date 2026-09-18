import { EmptyState } from "./EmptyState.jsx";
import { money } from "./shared.js";

export function ProductsTab({
  products,
  onApprove,
  onReject,
}) {
  return (
    <>
      <div className="page-title">
        <h1>Product moderation</h1>
        <p>
          Approve or reject listings submitted by vendors.
        </p>
      </div>

      {!products.length && (
        <EmptyState title="No products to review" />
      )}

      <div className="management-list">
        {products.map((product) => (
          <div
            className="management-card panel"
            key={product._id}
          >
            <div className="management-product">
              {product.images?.[0] && (
                <img
                  src={product.images[0]}
                  alt={product.name}
                />
              )}

              <div>
                <h3>{product.name}</h3>
                <p>
                  {product.vendor?.storeName} ·{" "}
                  {money(product.price)}
                </p>
                <p className="muted">
                  {product.category?.name}
                </p>
              </div>
            </div>

            <div className="management-actions">
              <span
                className={`status-badge ${product.approvalStatus}`}
              >
                {product.approvalStatus}
              </span>

              <button
                className="button small"
                onClick={() => onApprove(product)}
              >
                Approve
              </button>

              <button
                className="button danger small"
                onClick={() => onReject(product)}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
